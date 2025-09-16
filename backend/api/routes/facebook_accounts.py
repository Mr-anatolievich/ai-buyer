from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging
import base64
import json
import math

from ...database import get_db
from ...database.crud import facebook_accounts
from ...database.schemas import (
    FacebookAccountCreate, 
    FacebookAccountUpdate, 
    FacebookAccountResponse,
    FacebookAccountList,
    FacebookAccountStats,
    MultitokenData
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/facebook", tags=["Facebook Accounts"])


@router.post("/accounts/multitoken")
async def create_account_from_multitoken(
    name: str,
    multitoken: str,
    group_name: str = "default",
    proxy_url: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Створити або оновити Facebook акаунт з мультитокена"""
    try:
        # Декодуємо base64 multitoken
        try:
            decoded_data = base64.b64decode(multitoken).decode('utf-8')
            multitoken_data = MultitokenData(**json.loads(decoded_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid multitoken format: {e}")
        
        # Створюємо або оновлюємо акаунт з multitoken
        db_account = facebook_accounts.upsert_from_multitoken(
            db, multitoken_data, name, group_name, proxy_url
        )
        return db_account
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating/updating account from multitoken: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/accounts")
async def get_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Отримати список Facebook акаунтів"""
    try:
        accounts = facebook_accounts.get_all(db, skip=skip, limit=limit)
        total = facebook_accounts.count(db)
        
        return {
            "accounts": accounts,
            "total": total,
            "page": (skip // limit) + 1,
            "size": len(accounts)
        }
        
    except Exception as e:
        logger.error(f"Error getting accounts: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/accounts/{account_id}")
async def get_account(
    account_id: int,
    db: Session = Depends(get_db)
):
    """Отримати Facebook акаунт по ID"""
    try:
        account = facebook_accounts.get(db, account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        return account
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting account {account_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/accounts/{account_id}")
async def delete_account(
    account_id: int,
    db: Session = Depends(get_db)
):
    """Видалити Facebook акаунт"""
    try:
        success = facebook_accounts.delete(db, account_id)
        if not success:
            raise HTTPException(status_code=404, detail="Account not found")
        return {"message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting account {account_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")