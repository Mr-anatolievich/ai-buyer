#!/bin/bash

# AI-Buyer Local Development Startup Script
# Запуск платформи без Docker для локальної розробки

echo "🚀 AI-Buyer Local Development Start"
echo "=================================="

# Перевірка Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не встановлено"
    exit 1
fi

echo "✅ Python $(python3 --version) знайдено"

# Перевірка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не встановлено"
    exit 1
fi

echo "✅ Node.js $(node --version) знайдено"

# Створення .env.local якщо його немає
if [ ! -f .env.local ]; then
    echo "📝 Створення .env.local..."
    cp .env.development .env.local
fi

echo ""
echo "🎯 Запуск компонентів:"
echo ""

# Створення директорії для логів
mkdir -p logs

# 1. Frontend
echo "🌐 Запуск Frontend (React)..."
cd frontend
npm install > /dev/null 2>&1
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Очікування запуску frontend
sleep 5

# Перевірка чи frontend запустився
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Frontend: http://localhost:8080"
else
    echo "⚠️  Frontend: Запускається... (перевірте через хвилину)"
fi

# 2. Backend (Mock API для розробки)
echo "🔧 Запуск Mock Backend API..."

# Перевірка чи існує mock_server.py
if [ ! -f "mock_server.py" ]; then
    echo "❌ mock_server.py не знайдено! Створіть файл або використайте backend/simple_main.py"
    exit 1
fi
#!/usr/bin/env python3
"""
AI-Buyer Mock Backend Server
Простий сервер для локальної розробки без повної ML інфраструктури
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from datetime import datetime
import random

app = FastAPI(
    title="AI-Buyer Mock API",
    description="Mock backend для локальної розробки",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI-Buyer Mock API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/v1/campaigns")
async def get_campaigns():
    """Mock campaigns data"""
    return {
        "campaigns": [
            {
                "id": "campaign_1",
                "name": "Summer Sale 2024",
                "status": "active",
                "budget": 1000,
                "spend": 750,
                "impressions": 45000,
                "clicks": 890,
                "ctr": 0.0198
            },
            {
                "id": "campaign_2", 
                "name": "Back to School",
                "status": "paused",
                "budget": 500,
                "spend": 450,
                "impressions": 23000,
                "clicks": 420,
                "ctr": 0.0183
            }
        ]
    }

@app.post("/api/v1/ml/predict/ctr")
async def predict_ctr(data: dict):
    """Mock CTR prediction"""
    predicted_ctr = round(random.uniform(0.01, 0.05), 4)
    return {
        "ctr_prediction": predicted_ctr,
        "confidence": round(random.uniform(0.7, 0.95), 3),
        "model_version": "mock_v1.0"
    }

@app.post("/api/v1/ml/optimize/budget")
async def optimize_budget(data: dict):
    """Mock budget optimization"""
    campaigns = data.get("campaigns", [])
    recommendations = []
    
    for campaign in campaigns:
        new_budget = campaign["current_budget"] * random.uniform(0.8, 1.3)
        recommendations.append({
            "campaign_id": campaign["campaign_id"],
            "current_budget": campaign["current_budget"],
            "recommended_budget": round(new_budget, 2),
            "expected_improvement": round(random.uniform(5, 25), 1)
        })
    
    return {"recommendations": recommendations}

@app.get("/api/v1/analytics/dashboard")
async def get_dashboard():
    """Mock dashboard data"""
    return {
        "total_campaigns": 15,
        "active_campaigns": 8,
        "total_spend": 12500,
        "total_impressions": 890000,
        "avg_ctr": 0.0195,
        "roi": 3.2
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

# Запуск mock backend
echo "🔧 Запуск Mock Backend API..."

# Створення віртуального середовища якщо його немає
if [ ! -d "venv" ]; then
    echo "📦 Створення віртуального середовища..."
    python3 -m venv venv
fi

# Активація віртуального середовища та встановлення залежностей
source venv/bin/activate
pip install fastapi uvicorn > /dev/null 2>&1

# Запуск сервера
nohup python mock_server.py > logs/backend.log 2>&1 &
BACKEND_PID=$!

# Очікування запуску backend
sleep 3

# Перевірка чи backend запустився
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend API: http://localhost:8000"
    echo "✅ API Docs: http://localhost:8000/docs"
else
    echo "⚠️  Backend API: Запускається... (перевірте через хвилину)"
fi

echo ""
echo "=========================="
echo "🎉 AI-Buyer запущено локально!"
echo ""
echo "🌐 Доступні сервіси:"
echo "   Frontend:    http://localhost:8080"
echo "   Backend API: http://localhost:8000"
echo "   API Docs:    http://localhost:8000/docs"
echo ""
echo "📝 Логи:"
echo "   Frontend: logs/frontend.log"
echo "   Backend:  logs/backend.log"
echo ""
echo "🛑 Для зупинки: ./stop-local.sh"
echo "📖 Повна документація: README.md"

# Збереження PID для зупинки
mkdir -p logs
echo $FRONTEND_PID > logs/frontend.pid
echo $BACKEND_PID > logs/backend.pid

echo ""
echo "✨ Відкрийте http://localhost:8080 у браузері"