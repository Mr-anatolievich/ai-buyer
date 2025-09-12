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
