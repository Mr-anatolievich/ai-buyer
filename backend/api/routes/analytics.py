"""
Analytics API Routes for AI-Buyer
Advanced analytics and insights from ClickHouse data
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
import logging
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)
router = APIRouter()

# Response Models
class MetricSummary(BaseModel):
    metric_name: str
    current_value: float
    previous_value: float
    change_percentage: float
    trend: str  # "up", "down", "stable"

class PerformanceMetrics(BaseModel):
    period_start: datetime
    period_end: datetime
    total_spend: float
    total_impressions: int
    total_clicks: int
    total_conversions: int
    average_ctr: float
    average_cpc: float
    average_roas: float
    cost_per_conversion: float

class CampaignComparison(BaseModel):
    campaign_id: str
    campaign_name: str
    metrics: PerformanceMetrics
    ranking: int
    performance_score: float

class AnalyticsResponse(BaseModel):
    summary: List[MetricSummary]
    performance_metrics: PerformanceMetrics
    top_campaigns: List[CampaignComparison]
    insights: List[str]
    generated_at: datetime

class TimeSeriesData(BaseModel):
    date: datetime
    impressions: int
    clicks: int
    spend: float
    conversions: int
    ctr: float
    cpc: float

class TimeSeriesResponse(BaseModel):
    campaign_id: Optional[str]
    period_start: datetime
    period_end: datetime
    granularity: str  # "hourly", "daily", "weekly"
    data_points: List[TimeSeriesData]
    trends: Dict[str, Any]

class AudienceInsights(BaseModel):
    age_group: str
    gender: str
    device_type: str
    performance_score: float
    spend_share: float
    conversion_rate: float
    recommendations: List[str]

class AudienceAnalyticsResponse(BaseModel):
    total_audience_segments: int
    top_performing_segments: List[AudienceInsights]
    underperforming_segments: List[AudienceInsights]
    optimization_opportunities: List[str]

# Mock ClickHouse client for demonstration
class ClickHouseAnalytics:
    """Mock ClickHouse analytics client"""
    
    @staticmethod
    def get_performance_summary(user_id: str, days: int = 30) -> Dict[str, Any]:
        """Mock function для отримання загальної статистики"""
        import random
        
        # Generate mock aggregate data
        total_spend = random.uniform(1000, 10000)
        total_impressions = random.randint(50000, 500000)
        total_clicks = random.randint(500, 25000)
        total_conversions = random.randint(50, 1000)
        
        return {
            "total_spend": total_spend,
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "average_ctr": (total_clicks / total_impressions * 100) if total_impressions > 0 else 0,
            "average_cpc": (total_spend / total_clicks) if total_clicks > 0 else 0,
            "average_roas": (total_conversions * 25 / total_spend) if total_spend > 0 else 0,
            "cost_per_conversion": (total_spend / total_conversions) if total_conversions > 0 else 0
        }
    
    @staticmethod
    def get_time_series(user_id: str, campaign_id: Optional[str], 
                       start_date: datetime, end_date: datetime, 
                       granularity: str = "daily") -> List[Dict]:
        """Mock time series data"""
        import random
        import pandas as pd
        
        freq_map = {"hourly": "H", "daily": "D", "weekly": "W"}
        freq = freq_map.get(granularity, "D")
        
        date_range = pd.date_range(start=start_date, end=end_date, freq=freq)
        
        data_points = []
        for date in date_range:
            impressions = random.randint(1000, 10000)
            clicks = random.randint(10, int(impressions * 0.05))
            spend = random.uniform(50, 500)
            conversions = random.randint(0, int(clicks * 0.1))
            
            data_points.append({
                "date": date,
                "impressions": impressions,
                "clicks": clicks,
                "spend": spend,
                "conversions": conversions,
                "ctr": (clicks / impressions * 100) if impressions > 0 else 0,
                "cpc": (spend / clicks) if clicks > 0 else 0
            })
        
        return data_points
    
    @staticmethod
    def get_campaign_rankings(user_id: str, metric: str = "roas", limit: int = 10) -> List[Dict]:
        """Mock campaign performance ranking"""
        import random
        
        campaigns = []
        for i in range(min(limit, 10)):
            spend = random.uniform(100, 2000)
            conversions = random.randint(5, 100)
            roas = conversions * 25 / spend if spend > 0 else 0
            
            campaigns.append({
                "campaign_id": f"fb_campaign_{i+1}",
                "campaign_name": f"Campaign {i+1}",
                "spend": spend,
                "conversions": conversions,
                "roas": roas,
                "performance_score": random.uniform(0.6, 1.0)
            })
        
        # Sort by the specified metric
        if metric == "roas":
            campaigns.sort(key=lambda x: x["roas"], reverse=True)
        elif metric == "conversions":
            campaigns.sort(key=lambda x: x["conversions"], reverse=True)
        
        # Add ranking
        for idx, camp in enumerate(campaigns):
            camp["ranking"] = idx + 1
        
        return campaigns

# API Endpoints

@router.get("/dashboard", response_model=AnalyticsResponse)
async def get_dashboard_analytics(
    user_id: str = Query(..., description="User ID"),
    period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    compare_previous: bool = Query(True, description="Compare with previous period")
):
    """
    Отримати дашборд аналітики з ключовими метриками
    """
    try:
        logger.info(f"Generating dashboard analytics for user {user_id}")
        
        # Get current period data
        current_data = ClickHouseAnalytics.get_performance_summary(user_id, period_days)
        
        # Get previous period for comparison
        previous_data = ClickHouseAnalytics.get_performance_summary(user_id, period_days) if compare_previous else None
        
        # Create metric summaries
        summary = []
        metrics_to_compare = ["total_spend", "total_clicks", "total_conversions", "average_ctr", "average_roas"]
        
        for metric in metrics_to_compare:
            current_val = current_data.get(metric, 0)
            previous_val = previous_data.get(metric, 0) if previous_data else current_val
            
            change_pct = ((current_val - previous_val) / previous_val * 100) if previous_val > 0 else 0
            
            if change_pct > 5:
                trend = "up"
            elif change_pct < -5:
                trend = "down" 
            else:
                trend = "stable"
            
            summary.append(MetricSummary(
                metric_name=metric.replace("_", " ").title(),
                current_value=current_val,
                previous_value=previous_val,
                change_percentage=round(change_pct, 2),
                trend=trend
            ))
        
        # Create performance metrics
        performance = PerformanceMetrics(
            period_start=datetime.now() - timedelta(days=period_days),
            period_end=datetime.now(),
            total_spend=current_data["total_spend"],
            total_impressions=current_data["total_impressions"],
            total_clicks=current_data["total_clicks"],
            total_conversions=current_data["total_conversions"],
            average_ctr=current_data["average_ctr"],
            average_cpc=current_data["average_cpc"],
            average_roas=current_data["average_roas"],
            cost_per_conversion=current_data["cost_per_conversion"]
        )
        
        # Get top performing campaigns
        top_campaigns_data = ClickHouseAnalytics.get_campaign_rankings(user_id, "roas", 5)
        top_campaigns = []
        
        for camp_data in top_campaigns_data:
            camp_performance = PerformanceMetrics(
                period_start=datetime.now() - timedelta(days=period_days),
                period_end=datetime.now(),
                total_spend=camp_data["spend"],
                total_impressions=0,  # Mock data doesn't have this
                total_clicks=0,
                total_conversions=camp_data["conversions"],
                average_ctr=0,
                average_cpc=0,
                average_roas=camp_data["roas"],
                cost_per_conversion=camp_data["spend"] / camp_data["conversions"] if camp_data["conversions"] > 0 else 0
            )
            
            top_campaigns.append(CampaignComparison(
                campaign_id=camp_data["campaign_id"],
                campaign_name=camp_data["campaign_name"],
                metrics=camp_performance,
                ranking=camp_data["ranking"],
                performance_score=camp_data["performance_score"]
            ))
        
        # Generate insights
        insights = []
        if current_data["average_ctr"] > 2.0:
            insights.append("Відмінний CTR! Ваші креативи резонують з аудиторією")
        if current_data["average_roas"] < 2.0:
            insights.append("ROAS нижче рекомендованого - розгляньте оптимізацію таргетингу")
        if current_data["cost_per_conversion"] > 50:
            insights.append("Висока вартість конверсії - можливо варто протестувати нові аудиторії")
        
        if not insights:
            insights.append("Кампанії показують стабільні результати")
        
        return AnalyticsResponse(
            summary=summary,
            performance_metrics=performance,
            top_campaigns=top_campaigns,
            insights=insights,
            generated_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Dashboard analytics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/time-series", response_model=TimeSeriesResponse)
async def get_time_series_data(
    user_id: str = Query(..., description="User ID"),
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    campaign_id: Optional[str] = Query(None, description="Specific campaign ID"),
    granularity: str = Query("daily", regex="^(hourly|daily|weekly)$")
):
    """
    Отримати часові ряди метрик для графіків
    """
    try:
        logger.info(f"Getting time series data for user {user_id}")
        
        # Get time series data
        raw_data = ClickHouseAnalytics.get_time_series(
            user_id, campaign_id, start_date, end_date, granularity
        )
        
        # Convert to response format
        data_points = [
            TimeSeriesData(
                date=point["date"],
                impressions=point["impressions"],
                clicks=point["clicks"],
                spend=point["spend"],
                conversions=point["conversions"],
                ctr=point["ctr"],
                cpc=point["cpc"]
            )
            for point in raw_data
        ]
        
        # Calculate trends
        if len(data_points) >= 2:
            # Simple linear trend calculation
            dates = [i for i in range(len(data_points))]
            
            trends = {}
            for metric in ["impressions", "clicks", "spend", "conversions"]:
                values = [getattr(dp, metric) for dp in data_points]
                if len(values) >= 2:
                    slope = np.polyfit(dates, values, 1)[0]
                    trends[metric] = {
                        "direction": "increasing" if slope > 0 else "decreasing",
                        "slope": float(slope)
                    }
        else:
            trends = {}
        
        return TimeSeriesResponse(
            campaign_id=campaign_id,
            period_start=start_date,
            period_end=end_date,
            granularity=granularity,
            data_points=data_points,
            trends=trends
        )
        
    except Exception as e:
        logger.error(f"Time series data failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audience-insights", response_model=AudienceAnalyticsResponse)
async def get_audience_insights(
    user_id: str = Query(..., description="User ID"),
    period_days: int = Query(30, ge=1, le=365)
):
    """
    Отримати інсайти по аудиторіям
    """
    try:
        logger.info(f"Generating audience insights for user {user_id}")
        
        # Mock audience data
        audience_segments = [
            {
                "age_group": "18-24",
                "gender": "female",
                "device_type": "mobile",
                "performance_score": 0.85,
                "spend_share": 0.25,
                "conversion_rate": 3.2
            },
            {
                "age_group": "25-34", 
                "gender": "male",
                "device_type": "desktop",
                "performance_score": 0.92,
                "spend_share": 0.35,
                "conversion_rate": 4.1
            },
            {
                "age_group": "35-44",
                "gender": "female",
                "device_type": "mobile",
                "performance_score": 0.78,
                "spend_share": 0.20,
                "conversion_rate": 2.8
            },
            {
                "age_group": "45-54",
                "gender": "male", 
                "device_type": "tablet",
                "performance_score": 0.45,
                "spend_share": 0.20,
                "conversion_rate": 1.2
            }
        ]
        
        # Sort by performance
        audience_segments.sort(key=lambda x: x["performance_score"], reverse=True)
        
        # Create insights
        top_performing = []
        underperforming = []
        
        for segment in audience_segments:
            recommendations = []
            if segment["performance_score"] > 0.8:
                recommendations.append("Збільшити бюджет для цього сегменту")
                recommendations.append("Створити схожу аудиторію")
            elif segment["performance_score"] < 0.6:
                recommendations.append("Переглянути креативи для цього сегменту")
                recommendations.append("Тестувати альтернативні стратегії")
            
            insight = AudienceInsights(
                age_group=segment["age_group"],
                gender=segment["gender"],
                device_type=segment["device_type"],
                performance_score=segment["performance_score"],
                spend_share=segment["spend_share"],
                conversion_rate=segment["conversion_rate"],
                recommendations=recommendations
            )
            
            if segment["performance_score"] > 0.7:
                top_performing.append(insight)
            elif segment["performance_score"] < 0.6:
                underperforming.append(insight)
        
        # Generate optimization opportunities
        opportunities = []
        if top_performing:
            opportunities.append("Збільшити бюджет на топ-аудиторії на 20-30%")
        if underperforming:
            opportunities.append("Оптимізувати або призупинити слабкі сегменти")
        if len([s for s in audience_segments if s["device_type"] == "mobile"]) > len([s for s in audience_segments if s["device_type"] == "desktop"]):
            opportunities.append("Створити mobile-first креативи")
        
        return AudienceAnalyticsResponse(
            total_audience_segments=len(audience_segments),
            top_performing_segments=top_performing,
            underperforming_segments=underperforming,
            optimization_opportunities=opportunities
        )
        
    except Exception as e:
        logger.error(f"Audience insights failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/anomaly-detection")
async def detect_anomalies(
    user_id: str = Query(..., description="User ID"),
    campaign_id: Optional[str] = Query(None, description="Specific campaign"),
    sensitivity: float = Query(0.8, ge=0.1, le=1.0, description="Sensitivity level")
):
    """
    Виявлення аномалій у рекламних кампаніях
    """
    try:
        logger.info(f"Running anomaly detection for user {user_id}")
        
        # Mock anomaly detection results
        import random
        
        anomalies = []
        
        # Generate some mock anomalies
        if random.choice([True, False]):
            anomalies.append({
                "campaign_id": campaign_id or "fb_campaign_1",
                "metric": "ctr",
                "anomaly_type": "drop",
                "severity": "high",
                "current_value": 0.8,
                "expected_value": 2.1,
                "deviation_percentage": -62,
                "detected_at": datetime.now().isoformat(),
                "description": "Значне падіння CTR - можлива втома креативу",
                "recommended_action": "Оновити креативи або змінити аудиторію"
            })
        
        if random.choice([True, False]):
            anomalies.append({
                "campaign_id": campaign_id or "fb_campaign_2", 
                "metric": "cpc",
                "anomaly_type": "spike",
                "severity": "medium",
                "current_value": 3.2,
                "expected_value": 1.8,
                "deviation_percentage": 78,
                "detected_at": datetime.now().isoformat(),
                "description": "Різке зростання вартості кліку",
                "recommended_action": "Перевірити конкуренцію і налаштування ставок"
            })
        
        return {
            "user_id": user_id,
            "campaign_id": campaign_id,
            "total_anomalies": len(anomalies),
            "anomalies": anomalies,
            "detection_sensitivity": sensitivity,
            "analyzed_at": datetime.now().isoformat(),
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))