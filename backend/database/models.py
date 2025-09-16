"""
Database models for AI-Buyer
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, JSON, Float
from sqlalchemy.sql import func
from . import Base
import json


class FacebookAccount(Base):
    """
    Модель для збереження Facebook акаунтів
    """
    __tablename__ = "facebook_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)  # Технічна назва
    facebook_id = Column(String(100), unique=True, index=True)  # ID з cookies (c_user)
    
    # Токени та автентифікація
    access_token = Column(Text, nullable=False)  # Facebook access token
    user_agent = Column(Text, nullable=False)  # User Agent
    cookies = Column(Text, nullable=False)  # JSON з cookies
    
    # Групи та організація
    group_name = Column(String(100), default="default")  # Група акаунта
    
    # Проксі
    proxy_url = Column(String(500), nullable=True)  # http://user:pass@ip:port
    
    # Статуси
    status = Column(String(20), default="active")  # active, inactive, banned, error
    token_status = Column(String(20), default="unknown")  # active, expired, invalid
    
    # Фінансові дані
    balance = Column(Float, nullable=True)  # Баланс в USD
    daily_limit = Column(Float, nullable=True)  # Денний ліміт в USD
    currency = Column(String(10), default="USD")  # Валюта
    
    # Facebook специфічні дані
    primary_cabinet = Column(String(255), nullable=True)  # Назва основного кабінету
    primary_cabinet_id = Column(String(100), nullable=True)  # ID основного кабінету
    total_cabinets = Column(Integer, default=0)  # Загальна кількість кабінетів
    
    # Налаштування
    cookies_loaded = Column(Boolean, default=True)  # Чи завантажені cookies
    auto_clean_comments = Column(Boolean, default=False)  # Авточистка коментарів
    
    # Нотифікації
    notify_billing = Column(Boolean, default=True)  # Нотифікації про біллінг
    notify_moderation = Column(Boolean, default=True)  # Нотифікації про модерацію
    notify_status = Column(Boolean, default=True)  # Нотифікації про статус
    
    # Метадані
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_checked = Column(DateTime(timezone=True), nullable=True)  # Остання перевірка статусу
    
    # Додаткові дані
    notes = Column(Text, nullable=True)  # Нотатки користувача
    
    def __repr__(self):
        return f"<FacebookAccount(id={self.id}, name='{self.name}', status='{self.status}')>"
    
    @property
    def cookies_dict(self):
        """
        Повертає cookies як словник
        """
        try:
            return json.loads(self.cookies) if self.cookies else []
        except (json.JSONDecodeError, TypeError):
            return []
    
    @cookies_dict.setter
    def cookies_dict(self, value):
        """
        Встановлює cookies з словника
        """
        self.cookies = json.dumps(value) if value else "[]"
    
    def get_cookie_value(self, cookie_name: str) -> str:
        """
        Отримує значення конкретного cookie
        """
        cookies = self.cookies_dict
        for cookie in cookies:
            if cookie.get('name') == cookie_name:
                return cookie.get('value', '')
        return ''
    
    def extract_facebook_id(self):
        """
        Витягує Facebook ID з cookies (c_user)
        """
        if not self.facebook_id:
            self.facebook_id = self.get_cookie_value('c_user')
        return self.facebook_id


class FacebookAccountHistory(Base):
    """
    Історія змін Facebook акаунтів
    """
    __tablename__ = "facebook_account_history"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True)  # Зв'язок з facebook_accounts.id
    
    # Що змінилося
    field_name = Column(String(100), nullable=False)  # Назва поля
    old_value = Column(Text, nullable=True)  # Старе значення
    new_value = Column(Text, nullable=True)  # Нове значення
    
    # Метадані
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    change_reason = Column(String(255), nullable=True)  # Причина зміни
    
    def __repr__(self):
        return f"<FacebookAccountHistory(account_id={self.account_id}, field='{self.field_name}')>"