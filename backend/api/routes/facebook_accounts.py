"""
Facebook Accounts API Routes
Handles CRUD operations for Facebook account management
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from pydantic import BaseModel
import sqlite3
import json
import requests
from datetime import datetime

router = APIRouter(prefix="/api/facebook", tags=["facebook_accounts"])

# Pydantic models for request/response
class FacebookAccountBase(BaseModel):
    name: str
    facebook_id: str
    group_name: Optional[str] = None
    status: str = "active"
    token_status: str = "active"
    access_token: Optional[str] = None
    user_agent: Optional[str] = None
    cookies_data: Optional[str] = None
    proxy_id: Optional[int] = None
    balance: Optional[str] = None
    daily_limit: Optional[str] = None
    cookies_loaded: bool = False
    primary_cabinet: Optional[str] = None
    primary_cabinet_id: Optional[str] = None
    total_cabinets: int = 0

class FacebookTokenRequest(BaseModel):
    access_token: str
    name: Optional[str] = None
    group_name: Optional[str] = None

class FacebookAccountCreate(FacebookAccountBase):
    pass

class FacebookAccountUpdate(BaseModel):
    name: Optional[str] = None
    group_name: Optional[str] = None
    status: Optional[str] = None
    token_status: Optional[str] = None
    access_token: Optional[str] = None
    user_agent: Optional[str] = None
    cookies_data: Optional[str] = None
    proxy_id: Optional[int] = None
    balance: Optional[str] = None
    daily_limit: Optional[str] = None
    cookies_loaded: Optional[bool] = None
    primary_cabinet: Optional[str] = None
    primary_cabinet_id: Optional[str] = None
    total_cabinets: Optional[int] = None

class FacebookAccountResponse(FacebookAccountBase):
    id: int
    created_at: str
    updated_at: str

class AdAccountResponse(BaseModel):
    id: int
    account_id: str
    name: str
    status: str
    currency: str
    timezone: Optional[str] = None

class FacebookPageResponse(BaseModel):
    id: int
    page_id: str
    name: str
    status: str
    category: Optional[str] = None

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('/Users/yaroslavsaienko/ai-buyer/ai_buyer.db')
    conn.row_factory = sqlite3.Row
    return conn

async def get_facebook_user_info(access_token: str):
    """Get user info from Facebook API"""
    try:
        # Get basic user info
        user_url = f"https://graph.facebook.com/me?access_token={access_token}&fields=id,name,email"
        user_response = requests.get(user_url)
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid access token or Facebook API error")
        
        user_data = user_response.json()
        
        if 'error' in user_data:
            raise HTTPException(status_code=400, detail=f"Facebook API error: {user_data['error']['message']}")
        
        # Get ad accounts
        ad_accounts_url = f"https://graph.facebook.com/me/adaccounts?access_token={access_token}&fields=id,name,account_status,currency,timezone_name,balance,daily_spend_limit"
        ad_accounts_response = requests.get(ad_accounts_url)
        
        ad_accounts_data = []
        if ad_accounts_response.status_code == 200:
            ad_accounts_json = ad_accounts_response.json()
            if 'data' in ad_accounts_json:
                ad_accounts_data = ad_accounts_json['data']
        
        # Get pages
        pages_url = f"https://graph.facebook.com/me/accounts?access_token={access_token}&fields=id,name,category,access_token"
        pages_response = requests.get(pages_url)
        
        pages_data = []
        if pages_response.status_code == 200:
            pages_json = pages_response.json()
            if 'data' in pages_json:
                pages_data = pages_json['data']
        
        return {
            'user': user_data,
            'ad_accounts': ad_accounts_data,
            'pages': pages_data
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to Facebook API: {str(e)}")

@router.post("/accounts/from-token", response_model=FacebookAccountResponse)
async def create_account_from_token(token_request: FacebookTokenRequest):
    """Create Facebook account from access token"""
    try:
        # Get data from Facebook API
        fb_data = await get_facebook_user_info(token_request.access_token)
        user_data = fb_data['user']
        ad_accounts = fb_data['ad_accounts']
        pages = fb_data['pages']
        
        # Prepare account data
        account_name = token_request.name or user_data.get('name', f"User_{user_data['id']}")
        facebook_id = user_data['id']
        
        # Find primary ad account (first active one)
        primary_cabinet = None
        primary_cabinet_id = None
        balance = None
        daily_limit = None
        total_cabinets = len(ad_accounts)
        
        if ad_accounts:
            # Find first active ad account
            active_accounts = [acc for acc in ad_accounts if acc.get('account_status') == 1]
            if active_accounts:
                primary_account = active_accounts[0]
                primary_cabinet = primary_account.get('name')
                primary_cabinet_id = primary_account.get('id')
                if 'balance' in primary_account:
                    balance = f"{primary_account['balance']} {primary_account.get('currency', 'USD')}"
                if 'daily_spend_limit' in primary_account:
                    daily_limit = f"{primary_account['daily_spend_limit']} {primary_account.get('currency', 'USD')}/день"
        
        # Create account in database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if account already exists
        cursor.execute("SELECT id FROM facebook_accounts WHERE facebook_id = ?", (facebook_id,))
        existing = cursor.fetchone()
        
        if existing:
            conn.close()
            raise HTTPException(status_code=400, detail="Facebook account already exists")
        
        # Insert new account
        now = datetime.utcnow().isoformat()
        cursor.execute("""
            INSERT INTO facebook_accounts (
                name, facebook_id, group_name, status, token_status, access_token,
                balance, daily_limit, cookies_loaded, primary_cabinet, 
                primary_cabinet_id, total_cabinets, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            account_name, facebook_id, token_request.group_name, 'active', 'active',
            token_request.access_token, balance, daily_limit, True, primary_cabinet,
            primary_cabinet_id, total_cabinets, now, now
        ))
        
        account_id = cursor.lastrowid
        
        # Add ad accounts to database
        for ad_account in ad_accounts:
            cursor.execute("""
                INSERT INTO ad_accounts (facebook_account_id, account_id, name, status, currency, timezone)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                account_id, ad_account['id'], ad_account.get('name', 'Unknown'),
                'active' if ad_account.get('account_status') == 1 else 'inactive',
                ad_account.get('currency', 'USD'), ad_account.get('timezone_name')
            ))
        
        # Add pages to database
        for page in pages:
            cursor.execute("""
                INSERT INTO facebook_pages (facebook_account_id, page_id, name, status, category)
                VALUES (?, ?, ?, ?, ?)
            """, (
                account_id, page['id'], page.get('name', 'Unknown'),
                'active', page.get('category', 'Unknown')
            ))
        
        conn.commit()
        conn.close()
        
        # Return created account
        return await get_facebook_account(account_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating account: {str(e)}")

@router.get("/accounts", response_model=List[FacebookAccountResponse])
async def get_facebook_accounts(
    group_name: Optional[str] = None,
    status: Optional[str] = None
):
    """Get all Facebook accounts with optional filtering"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM facebook_accounts WHERE 1=1"
        params = []
        
        if group_name and group_name != "all":
            if group_name == "no":
                query += " AND (group_name IS NULL OR group_name = '')"
            else:
                query += " AND group_name = ?"
                params.append(group_name)
        
        if status:
            query += " AND status = ?"
            params.append(status)
            
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        accounts = cursor.fetchall()
        conn.close()
        
        result = []
        for account in accounts:
            result.append({
                "id": account["id"],
                "name": account["name"],
                "facebook_id": account["facebook_id"],
                "group_name": account["group_name"],
                "status": account["status"],
                "token_status": account["token_status"],
                "access_token": account["access_token"],
                "user_agent": account["user_agent"],
                "cookies_data": account["cookies_data"],
                "proxy_id": account["proxy_id"],
                "balance": account["balance"],
                "daily_limit": account["daily_limit"],
                "cookies_loaded": bool(account["cookies_loaded"]),
                "primary_cabinet": account["primary_cabinet"],
                "primary_cabinet_id": account["primary_cabinet_id"],
                "total_cabinets": account["total_cabinets"] or 0,
                "created_at": account["created_at"],
                "updated_at": account["updated_at"]
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/accounts/{account_id}", response_model=FacebookAccountResponse)
async def get_facebook_account(account_id: int):
    """Get specific Facebook account by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM facebook_accounts WHERE id = ?", (account_id,))
        account = cursor.fetchone()
        conn.close()
        
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        return {
            "id": account["id"],
            "name": account["name"],
            "facebook_id": account["facebook_id"],
            "group_name": account["group_name"],
            "status": account["status"],
            "token_status": account["token_status"],
            "access_token": account["access_token"],
            "user_agent": account["user_agent"],
            "cookies_data": account["cookies_data"],
            "proxy_id": account["proxy_id"],
            "balance": account["balance"],
            "daily_limit": account["daily_limit"],
            "cookies_loaded": bool(account["cookies_loaded"]),
            "primary_cabinet": account["primary_cabinet"],
            "primary_cabinet_id": account["primary_cabinet_id"],
            "total_cabinets": account["total_cabinets"] or 0,
            "created_at": account["created_at"],
            "updated_at": account["updated_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/accounts", response_model=FacebookAccountResponse)
async def create_facebook_account(account: FacebookAccountCreate):
    """Create new Facebook account"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if Facebook ID already exists
        cursor.execute("SELECT id FROM facebook_accounts WHERE facebook_id = ?", (account.facebook_id,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Facebook ID already exists")
        
        # Insert new account
        now = datetime.utcnow().isoformat()
        cursor.execute("""
            INSERT INTO facebook_accounts (
                name, facebook_id, group_name, status, token_status, access_token,
                user_agent, cookies_data, proxy_id, balance, daily_limit,
                cookies_loaded, primary_cabinet, primary_cabinet_id, total_cabinets,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            account.name, account.facebook_id, account.group_name, account.status,
            account.token_status, account.access_token, account.user_agent,
            account.cookies_data, account.proxy_id, account.balance, account.daily_limit,
            account.cookies_loaded, account.primary_cabinet, account.primary_cabinet_id,
            account.total_cabinets, now, now
        ))
        
        account_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Return created account
        return await get_facebook_account(account_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/accounts/{account_id}", response_model=FacebookAccountResponse)
async def update_facebook_account(account_id: int, account_update: FacebookAccountUpdate):
    """Update Facebook account"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if account exists
        cursor.execute("SELECT id FROM facebook_accounts WHERE id = ?", (account_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Build update query
        update_fields = []
        params = []
        
        for field, value in account_update.dict(exclude_unset=True).items():
            update_fields.append(f"{field} = ?")
            params.append(value)
        
        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.utcnow().isoformat())
            params.append(account_id)
            
            query = f"UPDATE facebook_accounts SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            conn.commit()
        
        conn.close()
        
        # Return updated account
        return await get_facebook_account(account_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/accounts/{account_id}")
async def delete_facebook_account(account_id: int):
    """Delete Facebook account"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if account exists
        cursor.execute("SELECT id FROM facebook_accounts WHERE id = ?", (account_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Delete account
        cursor.execute("DELETE FROM facebook_accounts WHERE id = ?", (account_id,))
        conn.commit()
        conn.close()
        
        return {"message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/accounts/{account_id}/ad-accounts", response_model=List[AdAccountResponse])
async def get_ad_accounts_by_facebook_account(account_id: int):
    """Get ad accounts for specific Facebook account"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if Facebook account exists
        cursor.execute("SELECT id FROM facebook_accounts WHERE id = ?", (account_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Facebook account not found")
        
        # Get ad accounts
        cursor.execute("SELECT * FROM ad_accounts WHERE facebook_account_id = ?", (account_id,))
        ad_accounts = cursor.fetchall()
        conn.close()
        
        result = []
        for ad_account in ad_accounts:
            result.append({
                "id": ad_account["id"],
                "account_id": ad_account["account_id"],
                "name": ad_account["name"],
                "status": ad_account["status"],
                "currency": ad_account["currency"],
                "timezone": ad_account["timezone"]
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/accounts/{account_id}/pages", response_model=List[FacebookPageResponse])
async def get_facebook_pages_by_account(account_id: int):
    """Get Facebook pages for specific Facebook account"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if Facebook account exists
        cursor.execute("SELECT id FROM facebook_accounts WHERE id = ?", (account_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Facebook account not found")
        
        # Get Facebook pages
        cursor.execute("SELECT * FROM facebook_pages WHERE facebook_account_id = ?", (account_id,))
        facebook_pages = cursor.fetchall()
        conn.close()
        
        result = []
        for page in facebook_pages:
            result.append({
                "id": page["id"],
                "page_id": page["page_id"],
                "name": page["name"],
                "status": page["status"],
                "category": page["category"]
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/groups")
async def get_facebook_groups():
    """Get all unique group names"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT DISTINCT group_name FROM facebook_accounts WHERE group_name IS NOT NULL AND group_name != '' ORDER BY group_name")
        groups = cursor.fetchall()
        conn.close()
        
        return [{"value": group["group_name"], "label": group["group_name"]} for group in groups]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")