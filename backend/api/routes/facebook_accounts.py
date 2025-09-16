"""
API endpoints для управління Facebook акаунтами через cookies/мультитокени
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime
import uuid

from ..services.facebook_cookie_client import FacebookAccountManager, FacebookAccount
from ..database import get_db
from ..models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/facebook", tags=["Facebook Accounts"])

# Глобальний менеджер акаунтів
account_manager = FacebookAccountManager()

# Request/Response Models
class AddAccountRequest(BaseModel):
    name: str = Field(..., description="Назва акаунта")
    multiToken: str = Field(..., description="Мультитокен з браузерного розширення")
    proxy: Optional[str] = Field(None, description="Проксі (опціонально)")
    group: Optional[str] = Field(None, description="Група акаунта")
    notes: Optional[str] = Field(None, description="Нотатки")

class BulkAddAccountsRequest(BaseModel):
    accounts: List[AddAccountRequest] = Field(..., description="Список акаунтів для додавання")

class FacebookAccountResponse(BaseModel):
    id: str
    name: str
    status: str
    lastChecked: Optional[str]
    adAccountsCount: int
    totalSpend: float
    group: Optional[str]
    isActive: bool

class CampaignDataResponse(BaseModel):
    accountId: str
    campaigns: List[Dict[str, Any]]
    totalCampaigns: int
    totalSpend: float
    adAccounts: List[Dict[str, Any]]

class AccountStatusResponse(BaseModel):
    isValid: bool
    userId: Optional[str]
    userName: Optional[str]
    error: Optional[str]

@router.post("/accounts", response_model=FacebookAccountResponse)
async def add_facebook_account(request: AddAccountRequest, background_tasks: BackgroundTasks):
    """Додавання одного Facebook акаунта через мультитокен"""
    
    try:
        account_id = str(uuid.uuid4())
        
        # Додавання акаунта до менеджера
        success = account_manager.add_account_from_multitoken(
            account_id=account_id,
            name=request.name,
            multitoken=request.multiToken
        )
        
        if not success:
            raise HTTPException(
                status_code=400, 
                detail="Не вдалося додати акаунт. Перевірте мультитокен."
            )
        
        # Отримання акаунта для відповіді
        account = account_manager.accounts[account_id]
        client = account_manager.get_account_client(account_id)
        
        # Фонове завдання для збору початкових даних
        background_tasks.add_task(collect_initial_account_data, account_id)
        
        return FacebookAccountResponse(
            id=account_id,
            name=account.name,
            status="active" if account.is_active else "error",
            lastChecked=account.last_checked.isoformat() if account.last_checked else None,
            adAccountsCount=0,  # Буде оновлено фоновим завданням
            totalSpend=0.0,
            group=request.group,
            isActive=account.is_active
        )
        
    except Exception as e:
        logger.error(f"Error adding Facebook account: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accounts/bulk", response_model=List[FacebookAccountResponse])
async def add_facebook_accounts_bulk(request: BulkAddAccountsRequest, background_tasks: BackgroundTasks):
    """Масове додавання Facebook акаунтів"""
    
    try:
        added_accounts = []
        errors = []
        
        for account_request in request.accounts:
            try:
                account_id = str(uuid.uuid4())
                
                success = account_manager.add_account_from_multitoken(
                    account_id=account_id,
                    name=account_request.name,
                    multitoken=account_request.multiToken
                )
                
                if success:
                    account = account_manager.accounts[account_id]
                    
                    added_accounts.append(FacebookAccountResponse(
                        id=account_id,
                        name=account.name,
                        status="active" if account.is_active else "error",
                        lastChecked=account.last_checked.isoformat() if account.last_checked else None,
                        adAccountsCount=0,
                        totalSpend=0.0,
                        group=account_request.group,
                        isActive=account.is_active
                    ))
                    
                    # Фонове завдання для кожного акаунта
                    background_tasks.add_task(collect_initial_account_data, account_id)
                    
                else:
                    errors.append(f"Failed to add account: {account_request.name}")
                    
            except Exception as e:
                errors.append(f"Error adding account {account_request.name}: {str(e)}")
        
        if errors:
            logger.warning(f"Bulk import completed with errors: {errors}")
        
        return added_accounts
        
    except Exception as e:
        logger.error(f"Error in bulk account import: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/accounts", response_model=List[FacebookAccountResponse])
async def get_facebook_accounts():
    """Отримання списку всіх Facebook акаунтів"""
    
    try:
        accounts = []
        
        for account_id, account in account_manager.accounts.items():
            # Спроба отримати додаткові дані
            try:
                client = account_manager.get_account_client(account_id)
                ad_accounts = client.get_ad_accounts() if client else []
                
                # Підрахунок загальних витрат (спрощений варіант)
                total_spend = sum(float(acc.get('amount_spent', 0)) for acc in ad_accounts)
                
            except Exception:
                ad_accounts = []
                total_spend = 0.0
            
            accounts.append(FacebookAccountResponse(
                id=account_id,
                name=account.name,
                status="active" if account.is_active else "error",
                lastChecked=account.last_checked.isoformat() if account.last_checked else None,
                adAccountsCount=len(ad_accounts),
                totalSpend=total_spend,
                group=None,  # TODO: Implement groups
                isActive=account.is_active
            ))
        
        return accounts
        
    except Exception as e:
        logger.error(f"Error getting Facebook accounts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/accounts/{account_id}/status", response_model=AccountStatusResponse)
async def check_account_status(account_id: str):
    """Перевірка статусу конкретного акаунта"""
    
    try:
        client = account_manager.get_account_client(account_id)
        
        if not client:
            raise HTTPException(status_code=404, detail="Account not found")
        
        test_result = client.test_connection()
        
        return AccountStatusResponse(
            isValid=test_result['success'],
            userId=test_result.get('user_id'),
            userName=test_result.get('user_name'),
            error=test_result.get('error')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking account status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/accounts/{account_id}/campaigns", response_model=CampaignDataResponse)
async def get_account_campaigns(account_id: str):
    """Отримання кампаній конкретного акаунта"""
    
    try:
        client = account_manager.get_account_client(account_id)
        
        if not client:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Отримання рекламних кабінетів
        ad_accounts = client.get_ad_accounts()
        all_campaigns = []
        total_spend = 0.0
        
        for ad_account in ad_accounts:
            ad_account_id = ad_account['id']
            campaigns = client.get_campaigns(ad_account_id)
            
            for campaign in campaigns:
                # Отримання аналітики кампанії
                try:
                    insights = client.get_campaign_insights(campaign['id'])
                    campaign['insights'] = insights
                    
                    spend = float(insights.get('spend', 0))
                    total_spend += spend
                    
                except Exception as e:
                    logger.warning(f"Failed to get insights for campaign {campaign['id']}: {e}")
                    campaign['insights'] = {}
            
            all_campaigns.extend(campaigns)
        
        return CampaignDataResponse(
            accountId=account_id,
            campaigns=all_campaigns,
            totalCampaigns=len(all_campaigns),
            totalSpend=total_spend,
            adAccounts=ad_accounts
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting account campaigns: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/accounts/{account_id}")
async def delete_facebook_account(account_id: str):
    """Видалення Facebook акаунта"""
    
    try:
        if account_id not in account_manager.accounts:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Видалення з менеджера
        del account_manager.accounts[account_id]
        if account_id in account_manager.clients:
            del account_manager.clients[account_id]
        
        return {"message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting account: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accounts/{account_id}/campaigns/{campaign_id}/budget")
async def update_campaign_budget(account_id: str, campaign_id: str, daily_budget: float):
    """Оновлення бюджету кампанії"""
    
    try:
        client = account_manager.get_account_client(account_id)
        
        if not client:
            raise HTTPException(status_code=404, detail="Account not found")
        
        success = client.update_campaign_budget(campaign_id, daily_budget)
        
        if success:
            return {"message": f"Campaign budget updated to ${daily_budget}"}
        else:
            raise HTTPException(status_code=400, detail="Failed to update campaign budget")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating campaign budget: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accounts/{account_id}/campaigns/{campaign_id}/pause")
async def pause_campaign(account_id: str, campaign_id: str):
    """Зупинка кампанії"""
    
    try:
        client = account_manager.get_account_client(account_id)
        
        if not client:
            raise HTTPException(status_code=404, detail="Account not found")
        
        success = client.pause_campaign(campaign_id)
        
        if success:
            return {"message": "Campaign paused successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to pause campaign")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pausing campaign: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accounts/{account_id}/campaigns/{campaign_id}/resume")
async def resume_campaign(account_id: str, campaign_id: str):
    """Відновлення кампанії"""
    
    try:
        client = account_manager.get_account_client(account_id)
        
        if not client:
            raise HTTPException(status_code=404, detail="Account not found")
        
        success = client.resume_campaign(campaign_id)
        
        if success:
            return {"message": "Campaign resumed successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to resume campaign")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resuming campaign: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/accounts/health-check")
async def health_check_all_accounts():
    """Перевірка стану всіх акаунтів"""
    
    try:
        results = account_manager.health_check_all_accounts()
        
        summary = {
            'total_accounts': len(results),
            'active_accounts': sum(1 for status in results.values() if status),
            'inactive_accounts': sum(1 for status in results.values() if not status),
            'details': results
        }
        
        return summary
        
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Фонові завдання
async def collect_initial_account_data(account_id: str):
    """Фонове завдання для збору початкових даних акаунта"""
    
    try:
        client = account_manager.get_account_client(account_id)
        
        if client:
            # Отримання базових даних
            ad_accounts = client.get_ad_accounts()
            logger.info(f"Collected data for account {account_id}: {len(ad_accounts)} ad accounts")
            
            # Можна додати збереження в базу даних
            
    except Exception as e:
        logger.error(f"Error collecting initial data for account {account_id}: {e}")