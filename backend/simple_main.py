"""
AI-Buyer FastAPI Backend - Simplified for Local Development
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime
from typing import List, Dict, Any
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI-Buyer API",
    description="ML-powered Facebook advertising optimization platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "AI-Buyer Backend",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

# Mock Dashboard Data
@app.get("/api/v1/dashboard")
async def get_dashboard():
    """Mock dashboard data"""
    return {
        "summary": {
            "total_campaigns": random.randint(5, 15),
            "active_campaigns": random.randint(3, 10),
            "total_spend": round(random.uniform(1000, 10000), 2),
            "total_conversions": random.randint(50, 500),
            "average_ctr": round(random.uniform(0.01, 0.05), 4),
            "average_roas": round(random.uniform(1.5, 4.0), 2)
        },
        "recent_campaigns": [
            {
                "id": f"campaign_{i}",
                "name": f"Campaign {i}",
                "status": random.choice(["active", "paused", "completed"]),
                "budget": random.randint(100, 2000),
                "spend": round(random.uniform(50, 1500), 2),
                "impressions": random.randint(1000, 50000),
                "clicks": random.randint(20, 2500),
                "conversions": random.randint(1, 100),
                "ctr": round(random.uniform(0.005, 0.05), 4)
            }
            for i in range(1, 6)
        ],
        "performance_chart": [
            {
                "date": f"2024-09-{day:02d}",
                "impressions": random.randint(1000, 10000),
                "clicks": random.randint(50, 500),
                "spend": round(random.uniform(50, 500), 2),
                "conversions": random.randint(2, 50)
            }
            for day in range(1, 13)
        ]
    }

# Mock Campaigns API
@app.get("/api/v1/campaigns")
async def get_campaigns():
    """Mock campaigns list"""
    campaigns = []
    for i in range(1, 8):
        campaigns.append({
            "id": f"fb_campaign_{i}",
            "name": f"Facebook Campaign {i}",
            "objective": random.choice(["CONVERSIONS", "TRAFFIC", "AWARENESS", "APP_INSTALLS"]),
            "status": random.choice(["ACTIVE", "PAUSED", "COMPLETED"]),
            "daily_budget": random.randint(50, 500),
            "lifetime_budget": random.randint(1000, 10000),
            "start_date": "2024-09-01",
            "impressions": random.randint(10000, 100000),
            "clicks": random.randint(100, 5000),
            "spend": round(random.uniform(100, 2000), 2),
            "conversions": random.randint(5, 200),
            "ctr": round(random.uniform(0.01, 0.05), 4),
            "cpc": round(random.uniform(0.5, 3.0), 2),
            "roas": round(random.uniform(1.2, 5.0), 2)
        })
    
    return {"campaigns": campaigns, "total": len(campaigns)}

# Mock CTR Prediction
@app.post("/api/v1/predictions/ctr")
async def predict_ctr(request: dict):
    """Mock CTR prediction"""
    predicted_ctr = random.uniform(0.005, 0.035)
    
    return {
        "predicted_ctr": round(predicted_ctr, 4),
        "confidence_interval": [
            round(predicted_ctr * 0.8, 4),
            round(predicted_ctr * 1.2, 4)
        ],
        "model_version": "deepfm_v1.0",
        "prediction_date": datetime.now().isoformat(),
        "recommendation": "Очікується середній CTR - рекомендуємо A/B тестування креативів",
        "factors": {
            "audience_quality": random.choice(["high", "medium", "low"]),
            "creative_freshness": random.choice(["new", "moderate", "tired"]),
            "competition_level": random.choice(["low", "medium", "high"])
        }
    }

# Mock Budget Optimization
@app.post("/api/v1/predictions/budget")
async def optimize_budget(request: dict):
    """Mock budget optimization"""
    campaigns = request.get("campaigns", [])
    total_budget = request.get("total_budget", 1000)
    
    recommendations = []
    for i, campaign in enumerate(campaigns):
        current_budget = campaign.get("budget", 100)
        optimized_budget = current_budget * random.uniform(0.8, 1.3)
        
        recommendations.append({
            "campaign_id": campaign.get("campaign_id", f"campaign_{i}"),
            "current_budget": current_budget,
            "recommended_budget": round(optimized_budget, 2),
            "expected_improvement": f"{random.randint(5, 25)}% більше конверсій",
            "confidence": round(random.uniform(0.7, 0.95), 2),
            "reasoning": "Збільшення бюджету на високоефективну аудиторію"
        })
    
    return {
        "recommendations": recommendations,
        "expected_improvement": {
            "conversions": round(random.uniform(0.1, 0.3), 2),
            "roas": round(random.uniform(0.05, 0.2), 2)
        },
        "confidence_score": round(random.uniform(0.75, 0.95), 2),
        "optimization_success": True
    }

# Mock Analytics
@app.get("/api/v1/analytics/performance")
async def get_performance_analytics():
    """Mock performance analytics"""
    return {
        "period": "last_30_days",
        "total_impressions": random.randint(100000, 1000000),
        "total_clicks": random.randint(2000, 50000),
        "total_spend": round(random.uniform(5000, 50000), 2),
        "total_conversions": random.randint(100, 2000),
        "average_ctr": round(random.uniform(0.015, 0.035), 4),
        "average_cpc": round(random.uniform(1.0, 4.0), 2),
        "average_roas": round(random.uniform(2.0, 6.0), 2),
        "top_performing_campaigns": [
            {
                "campaign_id": f"top_campaign_{i}",
                "name": f"Top Campaign {i}",
                "roas": round(random.uniform(3.0, 8.0), 2),
                "conversions": random.randint(50, 300)
            }
            for i in range(1, 4)
        ]
    }

# Mock Model Status
@app.get("/api/v1/models/status")
async def get_models_status():
    """Mock ML models status"""
    models = ["ctr_predictor", "budget_optimizer", "anomaly_detector"]
    status = {}
    
    for model in models:
        status[model] = {
            "trained": random.choice([True, False]),
            "accuracy": round(random.uniform(0.75, 0.95), 3),
            "last_trained": datetime.now().isoformat(),
            "version": "v1.0",
            "status": random.choice(["ready", "training", "error"])
        }
    
    return {
        "models": status,
        "overall_status": "ready" if all(s["trained"] for s in status.values()) else "training_needed",
        "last_update": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)