"""
CRUD operations for Facebook accounts
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from .models import FacebookAccount, FacebookAccountHistory
from .schemas import FacebookAccountCreate, FacebookAccountUpdate, MultitokenData


class FacebookAccountCRUD:
    """CRUD operations for Facebook accounts"""
    
    @staticmethod
    def create(db: Session, account_data: FacebookAccountCreate) -> FacebookAccount:
        """Create a new Facebook account"""
        # Convert cookies to JSON string
        cookies_json = json.dumps([cookie.dict() for cookie in account_data.cookies])
        
        # Extract Facebook ID from cookies
        facebook_id = None
        for cookie in account_data.cookies:
            if cookie.name == 'c_user':
                facebook_id = cookie.value
                break
        
        db_account = FacebookAccount(
            name=account_data.name,
            facebook_id=facebook_id,
            access_token=account_data.access_token,
            user_agent=account_data.user_agent,
            cookies=cookies_json,
            group_name=account_data.group_name,
            proxy_url=account_data.proxy_url,
            notes=account_data.notes,
            auto_clean_comments=account_data.auto_clean_comments,
            notify_billing=account_data.notify_billing,
            notify_moderation=account_data.notify_moderation,
            notify_status=account_data.notify_status,
        )
        
        db.add(db_account)
        db.commit()
        db.refresh(db_account)
        return db_account
    
    @staticmethod
    def create_from_multitoken(
        db: Session, 
        multitoken: MultitokenData, 
        name: str,
        group_name: str = "default",
        proxy_url: Optional[str] = None
    ) -> FacebookAccount:
        """Create account from multitoken data"""
        account_data = multitoken.to_facebook_account_create(
            name=name,
            group_name=group_name,
            proxy_url=proxy_url
        )
        return FacebookAccountCRUD.create(db, account_data)
    
    @staticmethod
    def upsert_from_multitoken(
        db: Session, 
        multitoken: MultitokenData, 
        name: str,
        group_name: str = "default",
        proxy_url: Optional[str] = None
    ) -> FacebookAccount:
        """Create or update account from multitoken data"""
        # Знайти facebook_id з cookies
        facebook_id = None
        for cookie_data in multitoken.cookies:
            # cookie_data - це словник, тому звертаємось до ключів
            if isinstance(cookie_data, dict) and cookie_data.get('name') == 'c_user':
                facebook_id = cookie_data.get('value')
                break
            # Якщо це об'єкт FacebookCookie
            elif hasattr(cookie_data, 'name') and cookie_data.name == 'c_user':
                facebook_id = cookie_data.value
                break
        
        if not facebook_id:
            raise ValueError("Facebook ID (c_user cookie) not found in multitoken")
        
        # Перевірити чи існує акаунт з таким facebook_id
        existing_account = FacebookAccountCRUD.get_by_facebook_id(db, facebook_id)
        
        if existing_account:
            # Оновити існуючий акаунт
            account_data = multitoken.to_facebook_account_create(
                name=name,
                group_name=group_name,
                proxy_url=proxy_url
            )
            
            # Оновити дані
            cookies_json = json.dumps([
                cookie_data.dict() if hasattr(cookie_data, 'dict') else cookie_data 
                for cookie_data in multitoken.cookies
            ])
            
            update_data = {
                'name': name,
                'access_token': account_data.access_token,
                'user_agent': account_data.user_agent,
                'cookies': cookies_json,
                'group_name': group_name,
                'proxy_url': proxy_url,
                'updated_at': datetime.utcnow()
            }
            
            for field, value in update_data.items():
                setattr(existing_account, field, value)
            
            db.commit()
            db.refresh(existing_account)
            return existing_account
        else:
            # Створити новий акаунт
            account_data = multitoken.to_facebook_account_create(
                name=name,
                group_name=group_name,
                proxy_url=proxy_url
            )
            return FacebookAccountCRUD.create(db, account_data)
    
    @staticmethod
    def get(db: Session, account_id: int) -> Optional[FacebookAccount]:
        """Get account by ID"""
        return db.query(FacebookAccount).filter(FacebookAccount.id == account_id).first()
    
    @staticmethod
    def get_by_facebook_id(db: Session, facebook_id: str) -> Optional[FacebookAccount]:
        """Get account by Facebook ID"""
        return db.query(FacebookAccount).filter(FacebookAccount.facebook_id == facebook_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[FacebookAccount]:
        """Get account by name"""
        return db.query(FacebookAccount).filter(FacebookAccount.name == name).first()
    
    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        group_name: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[FacebookAccount]:
        """Get all accounts with optional filtering"""
        query = db.query(FacebookAccount)
        
        # Filter by status
        if status:
            query = query.filter(FacebookAccount.status == status)
        
        # Filter by group
        if group_name:
            query = query.filter(FacebookAccount.group_name == group_name)
        
        # Search filter
        if search:
            search_filter = or_(
                FacebookAccount.name.ilike(f"%{search}%"),
                FacebookAccount.facebook_id.ilike(f"%{search}%"),
                FacebookAccount.primary_cabinet.ilike(f"%{search}%"),
                FacebookAccount.notes.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        return query.order_by(desc(FacebookAccount.created_at)).offset(skip).limit(limit).all()
    
    @staticmethod
    def count(
        db: Session,
        status: Optional[str] = None,
        group_name: Optional[str] = None,
        search: Optional[str] = None
    ) -> int:
        """Count accounts with filtering"""
        query = db.query(FacebookAccount)
        
        if status:
            query = query.filter(FacebookAccount.status == status)
        if group_name:
            query = query.filter(FacebookAccount.group_name == group_name)
        if search:
            search_filter = or_(
                FacebookAccount.name.ilike(f"%{search}%"),
                FacebookAccount.facebook_id.ilike(f"%{search}%"),
                FacebookAccount.primary_cabinet.ilike(f"%{search}%"),
                FacebookAccount.notes.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        return query.count()
    
    @staticmethod
    def update(db: Session, account_id: int, account_data: FacebookAccountUpdate) -> Optional[FacebookAccount]:
        """Update account"""
        db_account = db.query(FacebookAccount).filter(FacebookAccount.id == account_id).first()
        if not db_account:
            return None
        
        # Update fields that are provided
        update_data = account_data.dict(exclude_unset=True)
        
        # Handle cookies separately
        if 'cookies' in update_data:
            cookies_json = json.dumps([cookie.dict() for cookie in update_data['cookies']])
            update_data['cookies'] = cookies_json
            
            # Update facebook_id if c_user cookie changed
            for cookie in account_data.cookies:
                if cookie.name == 'c_user':
                    update_data['facebook_id'] = cookie.value
                    break
        
        # Log changes to history
        for field, new_value in update_data.items():
            old_value = getattr(db_account, field)
            if old_value != new_value:
                FacebookAccountCRUD.log_change(
                    db, account_id, field, str(old_value), str(new_value), "manual_update"
                )
        
        # Apply updates
        for field, value in update_data.items():
            setattr(db_account, field, value)
        
        db_account.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_account)
        return db_account
    
    @staticmethod
    def delete(db: Session, account_id: int) -> bool:
        """Delete account"""
        db_account = db.query(FacebookAccount).filter(FacebookAccount.id == account_id).first()
        if not db_account:
            return False
        
        # Log deletion
        FacebookAccountCRUD.log_change(
            db, account_id, "status", db_account.status, "deleted", "manual_deletion"
        )
        
        db.delete(db_account)
        db.commit()
        return True
    
    @staticmethod
    def get_groups(db: Session) -> List[str]:
        """Get all unique group names"""
        groups = db.query(FacebookAccount.group_name).distinct().all()
        return [group[0] for group in groups if group[0]]
    
    @staticmethod
    def get_stats(db: Session) -> Dict[str, Any]:
        """Get account statistics"""
        total = db.query(FacebookAccount).count()
        active = db.query(FacebookAccount).filter(FacebookAccount.status == "active").count()
        inactive = db.query(FacebookAccount).filter(FacebookAccount.status == "inactive").count()
        banned = db.query(FacebookAccount).filter(FacebookAccount.status == "banned").count()
        error = db.query(FacebookAccount).filter(FacebookAccount.status == "error").count()
        
        # Total balance
        total_balance = db.query(db.func.sum(FacebookAccount.balance)).filter(
            FacebookAccount.balance.isnot(None)
        ).scalar() or 0
        
        # By group
        group_stats = {}
        groups = FacebookAccountCRUD.get_groups(db)
        for group in groups:
            count = db.query(FacebookAccount).filter(FacebookAccount.group_name == group).count()
            group_stats[group] = count
        
        return {
            "total_accounts": total,
            "active_accounts": active,
            "inactive_accounts": inactive,
            "banned_accounts": banned,
            "error_accounts": error,
            "total_balance": total_balance,
            "by_group": group_stats
        }
    
    @staticmethod
    def log_change(
        db: Session,
        account_id: int,
        field_name: str,
        old_value: str,
        new_value: str,
        reason: str = "unknown"
    ):
        """Log account change to history"""
        history_entry = FacebookAccountHistory(
            account_id=account_id,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            change_reason=reason
        )
        db.add(history_entry)
        # Don't commit here - let the calling function handle it
    
    @staticmethod
    def get_history(db: Session, account_id: int, limit: int = 50) -> List[FacebookAccountHistory]:
        """Get account change history"""
        return db.query(FacebookAccountHistory).filter(
            FacebookAccountHistory.account_id == account_id
        ).order_by(desc(FacebookAccountHistory.changed_at)).limit(limit).all()


# Create an instance for easy import
facebook_accounts = FacebookAccountCRUD()