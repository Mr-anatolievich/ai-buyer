"""
Rules Engine API для AI-Buyer
Управління правилами автоматизації Facebook кампаній
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from enum import Enum
import logging
import asyncio
import json

logger = logging.getLogger(__name__)
router = APIRouter()

# Enums для типів правил
class MetricType(str, Enum):
    CTR = "ctr"
    CPC = "cpc" 
    CPM = "cpm"
    ROAS = "roas"
    CONVERSIONS = "conversions"
    SPEND = "spend"
    FREQUENCY = "frequency"

class OperatorType(str, Enum):
    GREATER_THAN = ">"
    LESS_THAN = "<"
    EQUALS = "=="
    GREATER_EQUAL = ">="
    LESS_EQUAL = "<="
    NOT_EQUAL = "!="

class ActionType(str, Enum):
    PAUSE_CAMPAIGN = "pause_campaign"
    INCREASE_BUDGET = "increase_budget"
    DECREASE_BUDGET = "decrease_budget"
    CHANGE_BID = "change_bid"
    ROTATE_CREATIVE = "rotate_creative"
    EXCLUDE_AUDIENCE = "exclude_audience"
    ALERT_ONLY = "alert_only"
    DUPLICATE_ADSET = "duplicate_adset"

# Request/Response Models
class RuleCondition(BaseModel):
    metric: MetricType = Field(..., description="Метрика для перевірки")
    operator: OperatorType = Field(..., description="Оператор порівняння")
    value: Union[float, int] = Field(..., description="Порогове значення")
    time_window: str = Field(default="24h", description="Часове вікно для аналізу")
    min_data_points: int = Field(default=50, description="Мінімум даних для спрацювання")

class RuleAction(BaseModel):
    type: ActionType = Field(..., description="Тип дії")
    priority: int = Field(default=1, description="Пріоритет виконання (1=highest)")
    params: Dict[str, Any] = Field(default={}, description="Параметри дії")
    max_executions_per_day: int = Field(default=5, description="Максимум виконань на день")

class MLEnhancement(BaseModel):
    enabled: bool = Field(default=False, description="Увімкнути ML підтримку")
    confidence_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    prediction_model: str = Field(default="lightgbm", description="Модель для прогнозування")
    fallback_to_rule: bool = Field(default=True, description="Fallback до правила якщо ML не впевнена")

class CreateRuleRequest(BaseModel):
    rule_name: str = Field(..., min_length=3, max_length=100)
    client_id: str = Field(..., description="ID клієнта")
    description: Optional[str] = Field(None, max_length=500)
    conditions: List[RuleCondition] = Field(..., min_items=1, max_items=10)
    actions: List[RuleAction] = Field(..., min_items=1, max_items=5)
    ml_enhancement: Optional[MLEnhancement] = Field(default=None)
    is_active: bool = Field(default=True)
    applies_to: Dict[str, Any] = Field(default={}, description="Фільтри кампаній")

    @validator('actions')
    def validate_actions_priority(cls, v):
        priorities = [action.priority for action in v]
        if len(priorities) != len(set(priorities)):
            raise ValueError("Action priorities must be unique")
        return v

class RuleResponse(BaseModel):
    rule_id: str
    rule_name: str
    client_id: str
    description: Optional[str]
    conditions: List[RuleCondition]
    actions: List[RuleAction]
    ml_enhancement: Optional[MLEnhancement]
    is_active: bool
    applies_to: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    performance_stats: Dict[str, Any]

class RuleExecutionLog(BaseModel):
    execution_id: str
    rule_id: str
    campaign_id: str
    triggered_at: datetime
    actions_executed: List[Dict[str, Any]]
    ml_prediction: Optional[Dict[str, Any]]
    before_metrics: Dict[str, float]
    after_metrics: Optional[Dict[str, float]]
    success: bool
    error_message: Optional[str]

# Rules Engine Core Class
class RulesEngine:
    """
    Core Rules Engine для обробки правил та автоматичних дій
    """
    
    def __init__(self):
        self.redis_client = None  # Ініціалізується в startup
        self.clickhouse_client = None
        self.facebook_client = None
        self.ml_predictor = None
    
    async def evaluate_rule(self, rule: RuleResponse, campaign_metrics: Dict[str, Any]) -> bool:
        """
        Оцінити чи спрацьовує правило для кампанії
        """
        try:
            # Перевірити всі умови правила
            for condition in rule.conditions:
                if not await self._evaluate_condition(condition, campaign_metrics):
                    return False  # Всі умови повинні бути виконані (AND логіка)
            
            # Перевірити ML enhancement якщо увімкнено
            if rule.ml_enhancement and rule.ml_enhancement.enabled:
                ml_prediction = await self._get_ml_prediction(rule, campaign_metrics)
                
                if ml_prediction["confidence"] < rule.ml_enhancement.confidence_threshold:
                    if not rule.ml_enhancement.fallback_to_rule:
                        return False  # ML не впевнена і fallback вимкнено
                
                # Додати ML інсайти в контекст
                campaign_metrics["_ml_prediction"] = ml_prediction
            
            logger.info(f"Rule {rule.rule_id} triggered for campaign {campaign_metrics.get('campaign_id')}")
            return True
            
        except Exception as e:
            logger.error(f"Rule evaluation error: {e}")
            return False
    
    async def _evaluate_condition(self, condition: RuleCondition, metrics: Dict[str, Any]) -> bool:
        """
        Оцінити окрему умову правила
        """
        metric_value = metrics.get(condition.metric.value)
        if metric_value is None:
            logger.warning(f"Metric {condition.metric.value} not found in data")
            return False
        
        # Перевірити чи достатньо даних
        data_points = metrics.get("data_points", 0)
        if data_points < condition.min_data_points:
            logger.info(f"Insufficient data points: {data_points} < {condition.min_data_points}")
            return False
        
        # Виконати порівняння
        if condition.operator == OperatorType.GREATER_THAN:
            return metric_value > condition.value
        elif condition.operator == OperatorType.LESS_THAN:
            return metric_value < condition.value
        elif condition.operator == OperatorType.EQUALS:
            return abs(metric_value - condition.value) < 0.001
        elif condition.operator == OperatorType.GREATER_EQUAL:
            return metric_value >= condition.value
        elif condition.operator == OperatorType.LESS_EQUAL:
            return metric_value <= condition.value
        elif condition.operator == OperatorType.NOT_EQUAL:
            return abs(metric_value - condition.value) >= 0.001
        
        return False
    
    async def _get_ml_prediction(self, rule: RuleResponse, campaign_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Отримати ML прогноз для правила
        """
        try:
            if not self.ml_predictor:
                return {"confidence": 0.0, "prediction": "no_model"}
            
            # Підготувати features
            features = self._prepare_ml_features(campaign_metrics, rule.actions)
            
            # Прогнозування результату виконання дій
            prediction = await self.ml_predictor.predict_action_outcome(features)
            
            return {
                "confidence": prediction.get("confidence", 0.0),
                "predicted_improvement": prediction.get("improvement", 0.0),
                "model_used": rule.ml_enhancement.prediction_model,
                "recommendation": prediction.get("recommendation", "execute")
            }
            
        except Exception as e:
            logger.error(f"ML prediction error: {e}")
            return {"confidence": 0.0, "error": str(e)}
    
    async def execute_rule_actions(self, rule: RuleResponse, campaign_metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Виконати дії правила
        """
        execution_results = []
        campaign_id = campaign_metrics.get("campaign_id")
        
        # Відсортувати дії по пріоритету
        sorted_actions = sorted(rule.actions, key=lambda x: x.priority)
        
        for action in sorted_actions:
            try:
                # Перевірити ліміт виконань
                daily_executions = await self._get_daily_executions_count(
                    rule.rule_id, action.type, campaign_id
                )
                
                if daily_executions >= action.max_executions_per_day:
                    logger.warning(f"Daily execution limit reached for action {action.type}")
                    continue
                
                # Виконати дію
                result = await self._execute_single_action(action, campaign_id, campaign_metrics)
                execution_results.append(result)
                
                # Логувати виконання
                await self._log_action_execution(rule.rule_id, action, campaign_id, result)
                
                # Затримка між діями для rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Action execution failed: {e}")
                execution_results.append({
                    "action_type": action.type.value,
                    "success": False,
                    "error": str(e)
                })
        
        return execution_results
    
    async def _execute_single_action(self, action: RuleAction, campaign_id: str, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Виконати окрему дію
        """
        if action.type == ActionType.PAUSE_CAMPAIGN:
            await self.facebook_client.pause_campaign(campaign_id)
            return {"action_type": "pause_campaign", "success": True, "details": "Campaign paused"}
        
        elif action.type == ActionType.INCREASE_BUDGET:
            increase_percent = action.params.get("increase_percent", 20)
            current_budget = metrics.get("budget", 0)
            new_budget = current_budget * (1 + increase_percent / 100)
            
            await self.facebook_client.update_budget(campaign_id, new_budget)
            return {
                "action_type": "increase_budget",
                "success": True,
                "details": f"Budget increased from ${current_budget} to ${new_budget}"
            }
        
        elif action.type == ActionType.DECREASE_BUDGET:
            decrease_percent = action.params.get("decrease_percent", 20)
            current_budget = metrics.get("budget", 0)
            new_budget = current_budget * (1 - decrease_percent / 100)
            
            await self.facebook_client.update_budget(campaign_id, new_budget)
            return {
                "action_type": "decrease_budget", 
                "success": True,
                "details": f"Budget decreased from ${current_budget} to ${new_budget}"
            }
        
        elif action.type == ActionType.CHANGE_BID:
            bid_adjustment = action.params.get("bid_adjustment_percent", 10)
            current_bid = metrics.get("bid_amount", 0)
            new_bid = current_bid * (1 + bid_adjustment / 100)
            
            await self.facebook_client.update_bid(campaign_id, new_bid)
            return {
                "action_type": "change_bid",
                "success": True, 
                "details": f"Bid changed from ${current_bid} to ${new_bid}"
            }
        
        elif action.type == ActionType.ROTATE_CREATIVE:
            creative_id = action.params.get("backup_creative_id")
            if creative_id:
                await self.facebook_client.update_creative(campaign_id, creative_id)
                return {
                    "action_type": "rotate_creative",
                    "success": True,
                    "details": f"Creative rotated to {creative_id}"
                }
        
        elif action.type == ActionType.ALERT_ONLY:
            alert_message = action.params.get("message", "Rule triggered")
            # Відправити алерт (email, Slack, тощо)
            await self._send_alert(metrics.get("client_id"), campaign_id, alert_message)
            return {
                "action_type": "alert_only",
                "success": True,
                "details": f"Alert sent: {alert_message}"
            }
        
        return {"action_type": action.type.value, "success": False, "error": "Action not implemented"}

# Ініціалізація Rules Engine
rules_engine = RulesEngine()

# API Endpoints

@router.post("/rules", response_model=RuleResponse)
async def create_rule(rule_request: CreateRuleRequest):
    """
    Створити нове правило автоматизації
    """
    try:
        logger.info(f"Creating rule for client {rule_request.client_id}")
        
        # Генерувати rule_id
        rule_id = f"rule_{rule_request.client_id}_{datetime.now().timestamp()}"
        
        # Створити правило в базі (ClickHouse)
        rule = RuleResponse(
            rule_id=rule_id,
            rule_name=rule_request.rule_name,
            client_id=rule_request.client_id,
            description=rule_request.description,
            conditions=rule_request.conditions,
            actions=rule_request.actions,
            ml_enhancement=rule_request.ml_enhancement,
            is_active=rule_request.is_active,
            applies_to=rule_request.applies_to,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            performance_stats={}
        )
        
        # TODO: Зберегти в ClickHouse
        # await save_rule_to_clickhouse(rule)
        
        # Кешувати в Redis для швидкого доступу
        # await cache_rule_in_redis(rule)
        
        return rule
        
    except Exception as e:
        logger.error(f"Rule creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rules", response_model=List[RuleResponse])
async def get_rules(client_id: str, active_only: bool = True):
    """
    Отримати правила клієнта
    """
    try:
        # TODO: Отримати з ClickHouse
        # rules = await get_rules_from_clickhouse(client_id, active_only)
        
        # Mock response
        return []
        
    except Exception as e:
        logger.error(f"Failed to get rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/rules/{rule_id}", response_model=RuleResponse)
async def update_rule(rule_id: str, rule_update: CreateRuleRequest):
    """
    Оновити існуюче правило
    """
    try:
        # TODO: Оновити в ClickHouse
        # updated_rule = await update_rule_in_clickhouse(rule_id, rule_update)
        
        # Оновити кеш
        # await update_rule_cache(updated_rule)
        
        return None
        
    except Exception as e:
        logger.error(f"Rule update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    """
    Видалити правило
    """
    try:
        # TODO: Видалити з ClickHouse та Redis
        # await delete_rule_from_storage(rule_id)
        
        return {"message": "Rule deleted successfully"}
        
    except Exception as e:
        logger.error(f"Rule deletion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rules/{rule_id}/test")
async def test_rule(rule_id: str, test_metrics: Dict[str, Any]):
    """
    Протестувати правило на тестових метриках
    """
    try:
        # Отримати правило
        # rule = await get_rule_by_id(rule_id)
        
        # Оцінити правило
        # triggered = await rules_engine.evaluate_rule(rule, test_metrics)
        
        return {
            "rule_id": rule_id,
            "triggered": False,  # Mock
            "test_metrics": test_metrics,
            "evaluation_details": {}
        }
        
    except Exception as e:
        logger.error(f"Rule testing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rules/{rule_id}/executions", response_model=List[RuleExecutionLog])
async def get_rule_executions(rule_id: str, limit: int = 100):
    """
    Отримати історію виконань правила
    """
    try:
        # TODO: Отримати з ClickHouse
        # executions = await get_executions_from_clickhouse(rule_id, limit)
        
        return []
        
    except Exception as e:
        logger.error(f"Failed to get executions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rules/analytics/{client_id}")
async def get_rules_analytics(client_id: str, days: int = 30):
    """
    Аналітика ефективності правил
    """
    try:
        # TODO: Розрахувати аналітику з ClickHouse
        
        return {
            "client_id": client_id,
            "period_days": days,
            "total_rules": 0,
            "active_rules": 0,
            "total_executions": 0,
            "successful_executions": 0,
            "top_performing_rules": [],
            "rules_performance": {},
            "cost_savings": 0.0,
            "performance_improvement": {}
        }
        
    except Exception as e:
        logger.error(f"Rules analytics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))