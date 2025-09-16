"""
Database models for AI-Buyer application
Defines SQLAlchemy models for ML pipeline data management
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class FacebookAccount(Base):
    """Facebook account model"""
    __tablename__ = "facebook_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    facebook_id = Column(String(255), unique=True, nullable=False)
    group_name = Column(String(255))
    status = Column(String(50), default="active")  # active, inactive, banned
    token_status = Column(String(50), default="active")  # active, expired, invalid
    access_token = Column(Text)
    user_agent = Column(Text)
    cookies_data = Column(Text)
    proxy_id = Column(Integer, ForeignKey("proxies.id"))
    balance = Column(String(255))
    daily_limit = Column(String(255))
    cookies_loaded = Column(Boolean, default=False)
    primary_cabinet = Column(String(255))
    primary_cabinet_id = Column(String(255))
    total_cabinets = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    proxy = relationship("Proxy", back_populates="facebook_accounts")
    ad_accounts = relationship("AdAccount", back_populates="facebook_account")
    facebook_pages = relationship("FacebookPage", back_populates="facebook_account")

class Proxy(Base):
    """Proxy model"""
    __tablename__ = "proxies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String(255))
    password = Column(String(255))
    type = Column(String(50), default="http")  # http, https, socks4, socks5
    status = Column(String(50), default="active")  # active, inactive
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    facebook_accounts = relationship("FacebookAccount", back_populates="proxy")

class AdAccount(Base):
    """Facebook Ad Account model"""
    __tablename__ = "ad_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    facebook_account_id = Column(Integer, ForeignKey("facebook_accounts.id"))
    account_id = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="active")
    currency = Column(String(10), default="USD")
    timezone = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    facebook_account = relationship("FacebookAccount", back_populates="ad_accounts")

class FacebookPage(Base):
    """Facebook Page model"""
    __tablename__ = "facebook_pages"
    
    id = Column(Integer, primary_key=True, index=True)
    facebook_account_id = Column(Integer, ForeignKey("facebook_accounts.id"))
    page_id = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="active")
    category = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    facebook_account = relationship("FacebookAccount", back_populates="facebook_pages")

class Campaign(Base):
    """ML training campaign model"""
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="active")
    budget = Column(Float)
    target_audience = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to performance metrics
    metrics = relationship("CampaignMetrics", back_populates="campaign")

class CampaignMetrics(Base):
    """Campaign performance metrics for ML analysis"""
    __tablename__ = "campaign_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    date = Column(DateTime, default=datetime.utcnow)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    ctr = Column(Float, default=0.0)  # Click-through rate
    cpc = Column(Float, default=0.0)  # Cost per click
    roas = Column(Float, default=0.0)  # Return on ad spend
    
    # ML prediction results
    predicted_performance = Column(Float)
    confidence_score = Column(Float)
    
    # Relationship back to campaign
    campaign = relationship("Campaign", back_populates="metrics")

class RuleEngineConfig(Base):
    """Configuration for automated optimization rules"""
    __tablename__ = "rule_engine_config"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    rule_type = Column(String(100), nullable=False)  # 'budget', 'targeting', 'creative'
    conditions = Column(Text)  # JSON string of conditions
    actions = Column(Text)    # JSON string of actions
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)