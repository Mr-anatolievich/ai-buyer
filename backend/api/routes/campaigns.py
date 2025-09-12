"""
Campaigns API Routes for AI-Buyer
Handles Facebook campaign data integration and management
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Request/Response Models
class CampaignData(BaseModel):
    campaign_id: str = Field(..., description="Facebook Campaign ID")
    campaign_name: str = Field(..., description="Campaign Name")
    objective: str = Field(..., description="Campaign Objective")
    status: str = Field(..., description="Campaign Status")
    daily_budget: float = Field(..., gt=0, description="Daily Budget")
    lifetime_budget: Optional[float] = Field(None, description="Lifetime Budget")
    start_date: datetime = Field(..., description="Campaign Start Date")
    end_date: Optional[datetime] = Field(None, description="Campaign End Date")

class CampaignMetrics(BaseModel):
    campaign_id: str
    date: datetime
    impressions: int = Field(ge=0)
    clicks: int = Field(ge=0) 
    spend: float = Field(ge=0)
    conversions: int = Field(ge=0)
    ctr: float = Field(ge=0)
    cpc: float = Field(ge=0)
    cost_per_conversion: Optional[float] = None
    roas: Optional[float] = None

class CampaignListResponse(BaseModel):
    campaigns: List[CampaignData]
    total_count: int
    page: int
    page_size: int

class CampaignPerformanceResponse(BaseModel):
    campaign_id: str
    metrics: List[CampaignMetrics]
    summary: Dict[str, Any]
    recommendations: List[str]

# Mock Facebook API integration
class FacebookAPIClient:
    """Mock Facebook Marketing API client"""
    
    @staticmethod
    def get_campaigns(user_access_token: str, limit: int = 50) -> List[Dict]:
        """Mock function - в реальності використовувати facebook-business SDK"""
        # Mock data для демонстрації
        import random
        from datetime import datetime, timedelta
        
        campaigns = []
        for i in range(min(limit, 10)):
            campaigns.append({
                "id": f"fb_campaign_{i+1}",
                "name": f"Facebook Campaign {i+1}",
                "objective": random.choice(["CONVERSIONS", "TRAFFIC", "AWARENESS"]),
                "status": random.choice(["ACTIVE", "PAUSED", "ARCHIVED"]),
                "daily_budget": random.randint(50, 500),
                "lifetime_budget": random.randint(1000, 10000) if random.choice([True, False]) else None,
                "start_time": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
                "end_time": (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat() if random.choice([True, False]) else None,
                "effective_status": "ACTIVE",
                "created_time": (datetime.now() - timedelta(days=random.randint(1, 180))).isoformat()
            })
        
        return campaigns
    
    @staticmethod
    def get_campaign_insights(campaign_id: str, date_preset: str = "last_30d") -> List[Dict]:
        """Mock function для отримання метрик кампанії"""
        import random
        import pandas as pd
        
        # Generate mock insights data
        date_range = pd.date_range(
            start=datetime.now() - timedelta(days=30),
            end=datetime.now(),
            freq='D'
        )
        
        insights = []
        for date in date_range:
            impressions = random.randint(1000, 50000)
            clicks = random.randint(10, int(impressions * 0.05))  # CTR до 5%
            spend = random.uniform(20, 500)
            conversions = random.randint(0, int(clicks * 0.1))  # Конверсія до 10%
            
            insights.append({
                "date_start": date.date().isoformat(),
                "date_stop": date.date().isoformat(),
                "impressions": impressions,
                "clicks": clicks,
                "spend": round(spend, 2),
                "conversions": conversions,
                "ctr": round(clicks / impressions * 100, 4) if impressions > 0 else 0,
                "cpc": round(spend / clicks, 2) if clicks > 0 else 0,
                "cost_per_conversion": round(spend / conversions, 2) if conversions > 0 else None,
                "roas": round(conversions * 25 / spend, 2) if spend > 0 else None  # Припущення $25 за конверсію
            })
        
        return insights

# API Endpoints

@router.get("/", response_model=CampaignListResponse)
async def get_campaigns(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    user_access_token: str = Query(..., description="Facebook User Access Token")
):
    """
    Отримати список Facebook кампаній користувача
    """
    try:
        logger.info(f"Fetching campaigns - page: {page}, size: {page_size}")
        
        # Get campaigns from Facebook API
        fb_campaigns = FacebookAPIClient.get_campaigns(
            user_access_token=user_access_token,
            limit=page_size
        )
        
        # Convert to our format
        campaigns = []
        for fb_camp in fb_campaigns:
            # Filter by status if provided
            if status and fb_camp.get("effective_status") != status:
                continue
                
            campaign = CampaignData(
                campaign_id=fb_camp["id"],
                campaign_name=fb_camp["name"],
                objective=fb_camp["objective"],
                status=fb_camp["effective_status"],
                daily_budget=float(fb_camp.get("daily_budget", 0)),
                lifetime_budget=float(fb_camp["lifetime_budget"]) if fb_camp.get("lifetime_budget") else None,
                start_date=datetime.fromisoformat(fb_camp["start_time"].replace("Z", "+00:00")),
                end_date=datetime.fromisoformat(fb_camp["end_time"].replace("Z", "+00:00")) if fb_camp.get("end_time") else None
            )
            campaigns.append(campaign)
        
        return CampaignListResponse(
            campaigns=campaigns,
            total_count=len(campaigns),
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error(f"Error fetching campaigns: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch campaigns: {str(e)}")

@router.get("/{campaign_id}/performance", response_model=CampaignPerformanceResponse)
async def get_campaign_performance(
    campaign_id: str,
    date_preset: str = Query("last_30d", description="Date preset for insights"),
    user_access_token: str = Query(..., description="Facebook User Access Token")
):
    """
    Отримати метрики продуктивності кампанії
    """
    try:
        logger.info(f"Fetching performance for campaign {campaign_id}")
        
        # Get insights from Facebook API
        insights = FacebookAPIClient.get_campaign_insights(
            campaign_id=campaign_id,
            date_preset=date_preset
        )
        
        # Convert to our format
        metrics = []
        total_impressions = 0
        total_clicks = 0
        total_spend = 0
        total_conversions = 0
        
        for insight in insights:
            metric = CampaignMetrics(
                campaign_id=campaign_id,
                date=datetime.fromisoformat(insight["date_start"]),
                impressions=insight["impressions"],
                clicks=insight["clicks"],
                spend=insight["spend"],
                conversions=insight["conversions"],
                ctr=insight["ctr"],
                cpc=insight["cpc"],
                cost_per_conversion=insight.get("cost_per_conversion"),
                roas=insight.get("roas")
            )
            metrics.append(metric)
            
            # Accumulate totals
            total_impressions += insight["impressions"]
            total_clicks += insight["clicks"]
            total_spend += insight["spend"]
            total_conversions += insight["conversions"]
        
        # Calculate summary metrics
        avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        avg_cpc = (total_spend / total_clicks) if total_clicks > 0 else 0
        avg_cost_per_conversion = (total_spend / total_conversions) if total_conversions > 0 else 0
        
        summary = {
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "total_spend": round(total_spend, 2),
            "total_conversions": total_conversions,
            "average_ctr": round(avg_ctr, 4),
            "average_cpc": round(avg_cpc, 2),
            "average_cost_per_conversion": round(avg_cost_per_conversion, 2) if total_conversions > 0 else None,
            "period_days": len(metrics)
        }
        
        # Generate recommendations
        recommendations = []
        if avg_ctr < 1.0:
            recommendations.append("CTR нижче середнього - розгляньте оновлення креативів")
        if avg_cpc > 2.0:
            recommendations.append("Висока вартість кліку - оптимізуйте таргетинг аудиторії")
        if total_conversions == 0:
            recommendations.append("Відсутні конверсії - перевірте налаштування пікселя і воронку")
        if not recommendations:
            recommendations.append("Кампанія показує хороші результати!")
        
        return CampaignPerformanceResponse(
            campaign_id=campaign_id,
            metrics=metrics,
            summary=summary,
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"Error fetching performance for campaign {campaign_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch performance: {str(e)}")

@router.post("/{campaign_id}/sync")
async def sync_campaign_data(
    campaign_id: str,
    user_access_token: str = Query(..., description="Facebook User Access Token")
):
    """
    Синхронізувати дані кампанії з ClickHouse для ML аналізу
    """
    try:
        logger.info(f"Syncing campaign {campaign_id} data to ClickHouse")
        
        # Get fresh data from Facebook
        insights = FacebookAPIClient.get_campaign_insights(campaign_id)
        
        # TODO: Save to ClickHouse
        # В реальному проекті тут буде код для збереження в ClickHouse
        # from ..database.clickhouse_client import ClickHouseClient
        # clickhouse = ClickHouseClient()
        # clickhouse.insert_campaign_metrics(insights)
        
        return {
            "campaign_id": campaign_id,
            "sync_status": "success",
            "records_synced": len(insights),
            "synced_at": datetime.now().isoformat(),
            "message": "Campaign data synchronized successfully"
        }
        
    except Exception as e:
        logger.error(f"Error syncing campaign {campaign_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@router.get("/{campaign_id}/recommendations")
async def get_campaign_recommendations(campaign_id: str):
    """
    Отримати AI-рекомендації для оптимізації кампанії
    """
    try:
        # TODO: Integrate with ML models for real recommendations
        # В реальному проекті використовувати навчені ML моделі
        
        recommendations = [
            {
                "type": "budget",
                "priority": "high",
                "title": "Оптимізація бюджету",
                "description": "Рекомендуємо перерозподілити 15% бюджету на більш ефективні час і аудиторії",
                "expected_improvement": "12% збільшення конверсій",
                "action": "Збільшити ставки у вечірній час (18:00-22:00)"
            },
            {
                "type": "creative",
                "priority": "medium", 
                "title": "Оновлення креативів",
                "description": "Поточні креативи показують ознаки втоми аудиторії",
                "expected_improvement": "8% покращення CTR",
                "action": "Додати нові зображення або відео"
            },
            {
                "type": "audience",
                "priority": "low",
                "title": "Розширення аудиторії",
                "description": "Lookalike аудиторії можуть принести додаткові конверсії",
                "expected_improvement": "5% збільшення охоплення",
                "action": "Створити Lookalike 1-3% від конвертованих користувачів"
            }
        ]
        
        return {
            "campaign_id": campaign_id,
            "recommendations": recommendations,
            "total_recommendations": len(recommendations),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating recommendations for campaign {campaign_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")