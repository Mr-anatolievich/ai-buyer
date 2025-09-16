"""
API endpoints для управління Facebook акаунтами через базу даних
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
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


@router.post("/accounts", response_model=FacebookAccountResponse)
async def create_account(
    account_data: FacebookAccountCreate,
    db: Session = Depends(get_db)
):
    """
    Створити новий Facebook акаунт
    """
    try:
        # Перевіряємо чи не існує вже акаунт з таким ім'ям
        existing = facebook_accounts.get_by_name(db, account_data.name)
        if existing:
            raise HTTPException(status_code=400, detail="Account with this name already exists")
        
        # Перевіряємо по Facebook ID
        if account_data.cookies:
            facebook_id = None
            for cookie in account_data.cookies:
                if cookie.name == 'c_user':
                    facebook_id = cookie.value
                    break
            
            if facebook_id:
                existing = facebook_accounts.get_by_facebook_id(db, facebook_id)
                if existing:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Account with Facebook ID {facebook_id} already exists"
                    )
        
        # Створюємо акаунт
        db_account = facebook_accounts.create(db, account_data)
        return db_account
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Facebook account: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/accounts/multitoken", response_model=FacebookAccountResponse)
async def create_account_from_multitoken(
    name: str,
    multitoken: str,
    group_name: str = "default",
    proxy_url: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Створити Facebook акаунт з мультитокена (від браузерного розширення)
    """
    try:
        # Декодуємо base64 multitoken
        try:
            decoded_data = base64.b64decode(multitoken).decode('utf-8')
            multitoken_data = MultitokenData(**json.loads(decoded_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid multitoken format: {e}")
        
        # Перевіряємо чи не існує акаунт
        existing = facebook_accounts.get_by_name(db, name)
        if existing:
            raise HTTPException(status_code=400, detail="Account with this name already exists")
        
        # Створюємо акаунт з multitoken
        db_account = facebook_accounts.create_from_multitoken(
            db, multitoken_data, name, group_name, proxy_url
        )
        return db_account
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating account from multitoken: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/accounts", response_model=FacebookAccountList)
async def get_accounts(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    status: Optional[str] = Query(None, description="Filter by status"),
    group_name: Optional[str] = Query(None, description="Filter by group"),
    search: Optional[str] = Query(None, description="Search term"),
    db: Session = Depends(get_db)
):
    """
    Отримати список Facebook акаунтів з пагінацією та фільтрацією
    """
    try:
        accounts = facebook_accounts.get_all(
            db, skip=skip, limit=limit, status=status, group_name=group_name, search=search
        )
        total = facebook_accounts.count(
            db, status=status, group_name=group_name, search=search
        )
        
        pages = math.ceil(total / limit) if total > 0 else 0
        page = (skip // limit) + 1 if limit > 0 else 1
        
        return FacebookAccountList(
            accounts=accounts,
            total=total,
            page=page,
            size=len(accounts),
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Error getting accounts: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/accounts/{account_id}", response_model=FacebookAccountResponse)
async def get_account(
    account_id: int,
    db: Session = Depends(get_db)
):
    """
    Отримати Facebook акаунт по ID
    """
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


@router.put("/accounts/{account_id}", response_model=FacebookAccountResponse)
async def update_account(
    account_id: int,
    account_data: FacebookAccountUpdate,
    db: Session = Depends(get_db)
):
    """
    Оновити Facebook акаунт
    """
    try:
        updated_account = facebook_accounts.update(db, account_id, account_data)
        if not updated_account:
            raise HTTPException(status_code=404, detail="Account not found")
        return updated_account
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating account {account_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/accounts/{account_id}")
async def delete_account(
    account_id: int,
    db: Session = Depends(get_db)
):
    """
    Видалити Facebook акаунт
    """
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


@router.get("/accounts/stats", response_model=FacebookAccountStats)
async def get_accounts_stats(db: Session = Depends(get_db)):
    """
    Отримати статистику по Facebook акаунтам
    """
    try:
        stats = facebook_accounts.get_stats(db)
        return FacebookAccountStats(**stats)
        
    except Exception as e:
        logger.error(f"Error getting account stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/groups")
async def get_groups(db: Session = Depends(get_db)):
    """
    Отримати список всіх груп акаунтів
    """
    try:
        groups = facebook_accounts.get_groups(db)
        return {"groups": groups}
        
    except Exception as e:
        logger.error(f"Error getting groups: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/accounts/{account_id}/history")
async def get_account_history(
    account_id: int,
    limit: int = Query(50, ge=1, le=200, description="Number of history records to return"),
    db: Session = Depends(get_db)
):
    """
    Отримати історію змін Facebook акаунта
    """
    try:
        # Перевіряємо чи існує акаунт
        account = facebook_accounts.get(db, account_id)
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        history = facebook_accounts.get_history(db, account_id, limit)
        return {"history": history}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting account history {account_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")