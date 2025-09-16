"""
Pydantic schemas for Facebook accounts
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import json


class FacebookCookie(BaseModel):
    """Schema for individual Facebook cookie"""
    name: str
    value: str
    domain: str
    path: Optional[str] = "/"
    secure: Optional[bool] = True
    httpOnly: Optional[bool] = False
    sameSite: Optional[str] = "no_restriction"
    expirationDate: Optional[float] = None
    session: Optional[bool] = False
    storeId: Optional[str] = "0"
    hostOnly: Optional[bool] = False


class FacebookAccountCreate(BaseModel):
    """Schema for creating a new Facebook account"""
    name: str = Field(..., min_length=1, max_length=255, description="Technical name for the account")
    access_token: str = Field(..., min_length=10, description="Facebook access token")
    user_agent: str = Field(..., min_length=10, description="Browser user agent")
    cookies: List[FacebookCookie] = Field(..., description="Facebook cookies")
    
    # Optional fields
    group_name: str = Field(default="default", max_length=100)
    proxy_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    
    # Settings
    auto_clean_comments: bool = False
    notify_billing: bool = True
    notify_moderation: bool = True
    notify_status: bool = True
    
    @validator('cookies')
    def validate_cookies(cls, v):
        """Validate that required cookies are present"""
        if not v:
            raise ValueError("Cookies list cannot be empty")
        
        # Check for required cookies
        cookie_names = [cookie.name for cookie in v]
        required_cookies = ['c_user', 'xs']  # Основні cookies для Facebook
        
        missing_cookies = [name for name in required_cookies if name not in cookie_names]
        if missing_cookies:
            raise ValueError(f"Missing required cookies: {missing_cookies}")
        
        return v
    
    @validator('access_token')
    def validate_access_token(cls, v):
        """Basic validation for Facebook access token"""
        if not v.startswith(('EAA', 'EAAG')):
            raise ValueError("Access token should start with 'EAA' or 'EAAG'")
        return v


class FacebookAccountUpdate(BaseModel):
    """Schema for updating a Facebook account"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    access_token: Optional[str] = Field(None, min_length=10)
    user_agent: Optional[str] = Field(None, min_length=10)
    cookies: Optional[List[FacebookCookie]] = None
    group_name: Optional[str] = Field(None, max_length=100)
    proxy_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive|banned|error)$")
    auto_clean_comments: Optional[bool] = None
    notify_billing: Optional[bool] = None
    notify_moderation: Optional[bool] = None
    notify_status: Optional[bool] = None


class FacebookAccountResponse(BaseModel):
    """Schema for Facebook account response"""
    id: int
    name: str
    facebook_id: Optional[str]
    status: str
    token_status: str
    group_name: str
    proxy_url: Optional[str]
    balance: Optional[float]
    daily_limit: Optional[float]
    currency: str
    primary_cabinet: Optional[str]
    primary_cabinet_id: Optional[str]
    total_cabinets: int
    cookies_loaded: bool
    auto_clean_comments: bool
    notify_billing: bool
    notify_moderation: bool
    notify_status: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_checked: Optional[datetime]
    notes: Optional[str]
    
    class Config:
        from_attributes = True


class FacebookAccountList(BaseModel):
    """Schema for paginated list of Facebook accounts"""
    accounts: List[FacebookAccountResponse]
    total: int
    page: int
    size: int
    pages: int


class MultitokenData(BaseModel):
    """Schema for multitoken data from browser extension"""
    token: str = Field(..., description="Facebook access token")
    ua: str = Field(..., description="User agent string") 
    cookies: List[Dict[str, Any]] = Field(..., description="Browser cookies")
    
    def to_facebook_account_create(
        self, 
        name: str,
        group_name: str = "default",
        proxy_url: Optional[str] = None
    ) -> FacebookAccountCreate:
        """Convert multitoken data to FacebookAccountCreate"""
        # Convert cookies to proper format
        facebook_cookies = []
        for cookie in self.cookies:
            facebook_cookies.append(FacebookCookie(**cookie))
        
        return FacebookAccountCreate(
            name=name,
            access_token=self.token,
            user_agent=self.ua,
            cookies=facebook_cookies,
            group_name=group_name,
            proxy_url=proxy_url
        )


class FacebookAccountStats(BaseModel):
    """Schema for account statistics"""
    total_accounts: int
    active_accounts: int
    inactive_accounts: int
    banned_accounts: int
    error_accounts: int
    total_balance: Optional[float]
    by_group: Dict[str, int]