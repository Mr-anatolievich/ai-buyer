"""
Database configuration and setup
"""
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

# Database URL - використовуємо SQLite для простоти
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_buyer.db")

# Створюємо engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(DATABASE_URL)

# Створюємо session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовий клас для моделей
Base = declarative_base()

# Metadata для міграцій
metadata = MetaData()

def get_db():
    """
    Dependency для отримання сесії бази даних
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Ініціалізація бази даних
    """
    # Імпортуємо всі моделі щоб вони були зареєстровані
    from . import models
    
    # Створюємо всі таблиці
    Base.metadata.create_all(bind=engine)