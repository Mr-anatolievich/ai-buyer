"""
Kafka Rules Processor для AI-Buyer
Real-time обробка Facebook метрик і автоматичне виконання правил
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import aiokafka
import aioredis
import clickhouse_connect
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class CampaignMetrics:
    """Структура метрик кампанії"""
    campaign_id: str
    client_id: str
    timestamp: datetime
    impressions: int
    clicks: int
    spend: float
    conversions: int
    ctr: float
    cpc: float
    cpm: float
    frequency: float
    reach: int
    budget: float
    data_points: int

class FacebookAPIClient:
    """Facebook API клієнт для виконання дій"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.rate_limit_delay = 1.0  # Rate limiting
    
    async def pause_campaign(self, campaign_id: str) -> bool:
        """Призупинити кампанію"""
        try:
            # TODO: Реальний виклик Facebook API
            await asyncio.sleep(self.rate_limit_delay)
            logger.info(f"Campaign {campaign_id} paused")
            return True
        except Exception as e:
            logger.error(f"Failed to pause campaign {campaign_id}: {e}")
            return False
    
    async def update_budget(self, campaign_id: str, new_budget: float) -> bool:
        """Оновити бюджет кампанії"""
        try:
            # TODO: Реальний виклик Facebook API
            await asyncio.sleep(self.rate_limit_delay)
            logger.info(f"Campaign {campaign_id} budget updated to ${new_budget}")
            return True
        except Exception as e:
            logger.error(f"Failed to update budget for campaign {campaign_id}: {e}")
            return False
    
    async def update_bid(self, campaign_id: str, new_bid: float) -> bool:
        """Оновити ставку кампанії"""
        try:
            # TODO: Реальний виклик Facebook API
            await asyncio.sleep(self.rate_limit_delay)
            logger.info(f"Campaign {campaign_id} bid updated to ${new_bid}")
            return True
        except Exception as e:
            logger.error(f"Failed to update bid for campaign {campaign_id}: {e}")
            return False
    
    async def update_creative(self, campaign_id: str, creative_id: str) -> bool:
        """Змінити креатив кампанії"""
        try:
            # TODO: Реальний виклик Facebook API
            await asyncio.sleep(self.rate_limit_delay)
            logger.info(f"Campaign {campaign_id} creative updated to {creative_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to update creative for campaign {campaign_id}: {e}")
            return False

class RulesCache:
    """Redis кеш для швидкого доступу до правил"""
    
    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client
        self.cache_ttl = 3600  # 1 година
    
    async def get_client_rules(self, client_id: str) -> List[Dict[str, Any]]:
        """Отримати правила клієнта з кешу"""
        try:
            cache_key = f"rules:client:{client_id}"
            cached_rules = await self.redis.get(cache_key)
            
            if cached_rules:
                return json.loads(cached_rules)
            
            # Якщо в кеші немає, завантажити з ClickHouse
            rules = await self._load_rules_from_db(client_id)
            
            # Кешувати
            await self.redis.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(rules, default=str)
            )
            
            return rules
            
        except Exception as e:
            logger.error(f"Failed to get rules for client {client_id}: {e}")
            return []
    
    async def _load_rules_from_db(self, client_id: str) -> List[Dict[str, Any]]:
        """Завантажити правила з ClickHouse"""
        # TODO: Реальний запит до ClickHouse
        return []
    
    async def invalidate_client_cache(self, client_id: str):
        """Інвалідувати кеш правил клієнта"""
        cache_key = f"rules:client:{client_id}"
        await self.redis.delete(cache_key)

class MLPredictor:
    """ML компонент для прогнозування результатів дій"""
    
    def __init__(self):
        self.models = {}  # Кеш моделей
        self.model_cache_ttl = 3600
    
    async def predict_action_outcome(self, 
                                   campaign_metrics: CampaignMetrics,
                                   action_type: str,
                                   action_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Прогнозувати результат виконання дії
        """
        try:
            # Підготувати features
            features = self._prepare_features(campaign_metrics, action_type, action_params)
            
            # Отримати модель
            model = await self._get_model(action_type)
            
            if not model:
                return {"confidence": 0.0, "prediction": "no_model"}
            
            # Зробити прогноз
            prediction = model.predict([features])[0]
            confidence = self._calculate_confidence(features, prediction)
            
            return {
                "confidence": confidence,
                "predicted_improvement": float(prediction),
                "recommendation": "execute" if confidence > 0.7 else "skip",
                "model_version": model.version if hasattr(model, 'version') else "unknown"
            }
            
        except Exception as e:
            logger.error(f"ML prediction failed: {e}")
            return {"confidence": 0.0, "error": str(e)}
    
    def _prepare_features(self, metrics: CampaignMetrics, action_type: str, params: Dict) -> List[float]:
        """Підготувати features для ML моделі"""
        return [
            metrics.ctr,
            metrics.cpc,
            metrics.cpm,
            metrics.spend,
            metrics.conversions,
            metrics.frequency,
            float(hash(action_type) % 1000) / 1000,  # Encoded action type
            # Додаткові features...
        ]
    
    def _calculate_confidence(self, features: List[float], prediction: float) -> float:
        """Розрахувати впевненість моделі"""
        # Спрощений розрахунок впевненості
        return min(0.9, max(0.1, abs(prediction) / 10.0))
    
    async def _get_model(self, action_type: str):
        """Отримати ML модель для типу дії"""
        # TODO: Завантажити модель з MLflow
        return None

class KafkaRulesProcessor:
    """
    Головний клас для обробки Kafka stream і виконання правил
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.consumer = None
        self.producer = None
        self.redis_client = None
        self.clickhouse_client = None
        
        # Ініціалізація компонентів
        self.facebook_clients = {}  # client_id -> FacebookAPIClient
        self.rules_cache = None
        self.ml_predictor = MLPredictor()
        
        # Statistics
        self.processed_messages = 0
        self.rules_triggered = 0
        self.actions_executed = 0
        self.errors_count = 0
    
    async def initialize(self):
        """Ініціалізувати всі компоненти"""
        try:
            # Kafka consumer
            self.consumer = aiokafka.AIOKafkaConsumer(
                'facebook_metrics_stream',
                bootstrap_servers=self.config['kafka_servers'],
                group_id='rules_processor_group',
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='latest'
            )
            
            # Kafka producer для логів
            self.producer = aiokafka.AIOKafkaProducer(
                bootstrap_servers=self.config['kafka_servers'],
                value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8')
            )
            
            # Redis для кешування правил
            self.redis_client = await aioredis.from_url(
                self.config['redis_url'],
                decode_responses=True
            )
            
            # ClickHouse для логування
            self.clickhouse_client = clickhouse_connect.get_client(
                host=self.config['clickhouse_host'],
                port=self.config['clickhouse_port'],
                username=self.config['clickhouse_user'],
                password=self.config['clickhouse_password']
            )
            
            # Rules cache
            self.rules_cache = RulesCache(self.redis_client)
            
            # Запустити consumer і producer
            await self.consumer.start()
            await self.producer.start()
            
            logger.info("Kafka Rules Processor initialized successfully")
            
        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            raise
    
    async def start_processing(self):
        """Почати обробку stream"""
        logger.info("Starting Kafka Rules Processor...")
        
        try:
            async for message in self.consumer:
                await self._process_message(message.value)
                
        except Exception as e:
            logger.error(f"Processing error: {e}")
            raise
        finally:
            await self.shutdown()
    
    async def _process_message(self, message_data: Dict[str, Any]):
        """Обробити повідомлення з Kafka stream"""
        try:
            self.processed_messages += 1
            
            # Парсити metrics
            metrics = self._parse_campaign_metrics(message_data)
            if not metrics:
                return
            
            # Отримати правила для клієнта
            client_rules = await self.rules_cache.get_client_rules(metrics.client_id)
            
            if not client_rules:
                return
            
            # Оцінити кожне правило
            triggered_rules = []
            for rule_data in client_rules:
                if await self._evaluate_rule(rule_data, metrics):
                    triggered_rules.append(rule_data)
            
            # Виконати дії для спрацьованих правил
            if triggered_rules:
                self.rules_triggered += len(triggered_rules)
                await self._execute_triggered_rules(triggered_rules, metrics)
            
            # Логувати обробку
            await self._log_processing_result(metrics, triggered_rules)
            
        except Exception as e:
            self.errors_count += 1
            logger.error(f"Message processing failed: {e}")
    
    def _parse_campaign_metrics(self, data: Dict[str, Any]) -> Optional[CampaignMetrics]:
        """Парсити метрики кампанії з повідомлення"""
        try:
            return CampaignMetrics(
                campaign_id=data['campaign_id'],
                client_id=data['client_id'],
                timestamp=datetime.fromisoformat(data['timestamp']),
                impressions=data.get('impressions', 0),
                clicks=data.get('clicks', 0),
                spend=data.get('spend', 0.0),
                conversions=data.get('conversions', 0),
                ctr=data.get('ctr', 0.0),
                cpc=data.get('cpc', 0.0),
                cpm=data.get('cpm', 0.0),
                frequency=data.get('frequency', 0.0),
                reach=data.get('reach', 0),
                budget=data.get('budget', 0.0),
                data_points=data.get('data_points', 0)
            )
        except Exception as e:
            logger.error(f"Failed to parse metrics: {e}")
            return None
    
    async def _evaluate_rule(self, rule_data: Dict[str, Any], metrics: CampaignMetrics) -> bool:
        """Оцінити правило"""
        try:
            conditions = rule_data.get('conditions', [])
            
            # Перевірити всі умови (AND логіка)
            for condition in conditions:
                if not self._evaluate_condition(condition, metrics):
                    return False
            
            # Перевірити ML enhancement якщо є
            ml_config = rule_data.get('ml_enhancement')
            if ml_config and ml_config.get('enabled'):
                ml_prediction = await self.ml_predictor.predict_action_outcome(
                    metrics,
                    rule_data['actions'][0]['type'],  # Перша дія для прогнозу
                    rule_data['actions'][0].get('params', {})
                )
                
                confidence_threshold = ml_config.get('confidence_threshold', 0.7)
                if ml_prediction['confidence'] < confidence_threshold:
                    if not ml_config.get('fallback_to_rule', True):
                        return False
            
            return True
            
        except Exception as e:
            logger.error(f"Rule evaluation failed: {e}")
            return False
    
    def _evaluate_condition(self, condition: Dict[str, Any], metrics: CampaignMetrics) -> bool:
        """Оцінити окрему умову"""
        try:
            metric_name = condition['metric']
            operator = condition['operator']
            threshold_value = condition['value']
            min_data_points = condition.get('min_data_points', 50)
            
            # Перевірити достатність даних
            if metrics.data_points < min_data_points:
                return False
            
            # Отримати значення метрики
            metric_value = getattr(metrics, metric_name, None)
            if metric_value is None:
                return False
            
            # Виконати порівняння
            if operator == '>':
                return metric_value > threshold_value
            elif operator == '<':
                return metric_value < threshold_value
            elif operator == '>=':
                return metric_value >= threshold_value
            elif operator == '<=':
                return metric_value <= threshold_value
            elif operator == '==':
                return abs(metric_value - threshold_value) < 0.001
            elif operator == '!=':
                return abs(metric_value - threshold_value) >= 0.001
            
            return False
            
        except Exception as e:
            logger.error(f"Condition evaluation failed: {e}")
            return False
    
    async def _execute_triggered_rules(self, rules: List[Dict[str, Any]], metrics: CampaignMetrics):
        """Виконати дії спрацьованих правил"""
        try:
            # Отримати Facebook API клієнт для цього клієнта
            facebook_client = await self._get_facebook_client(metrics.client_id)
            
            if not facebook_client:
                logger.error(f"No Facebook client for client {metrics.client_id}")
                return
            
            for rule in rules:
                await self._execute_rule_actions(rule, metrics, facebook_client)
                
        except Exception as e:
            logger.error(f"Rules execution failed: {e}")
    
    async def _execute_rule_actions(self, 
                                  rule: Dict[str, Any], 
                                  metrics: CampaignMetrics,
                                  facebook_client: FacebookAPIClient):
        """Виконати дії одного правила"""
        try:
            actions = rule.get('actions', [])
            actions.sort(key=lambda x: x.get('priority', 1))
            
            for action in actions:
                action_type = action['type']
                params = action.get('params', {})
                
                # Перевірити денний ліміт виконань
                daily_limit = action.get('max_executions_per_day', 5)
                today_executions = await self._get_today_executions_count(
                    rule['rule_id'], action_type, metrics.campaign_id
                )
                
                if today_executions >= daily_limit:
                    logger.info(f"Daily limit reached for action {action_type}")
                    continue
                
                # Виконати дію
                success = await self._execute_action(
                    action_type, params, metrics, facebook_client
                )
                
                if success:
                    self.actions_executed += 1
                    
                    # Логувати виконання дії
                    await self._log_action_execution(
                        rule['rule_id'], action_type, metrics, success
                    )
                
                # Rate limiting
                await asyncio.sleep(1)
                
        except Exception as e:
            logger.error(f"Rule actions execution failed: {e}")
    
    async def _execute_action(self, 
                            action_type: str, 
                            params: Dict[str, Any],
                            metrics: CampaignMetrics,
                            facebook_client: FacebookAPIClient) -> bool:
        """Виконати конкретну дію"""
        try:
            if action_type == 'pause_campaign':
                return await facebook_client.pause_campaign(metrics.campaign_id)
            
            elif action_type == 'increase_budget':
                increase_percent = params.get('increase_percent', 20)
                new_budget = metrics.budget * (1 + increase_percent / 100)
                return await facebook_client.update_budget(metrics.campaign_id, new_budget)
            
            elif action_type == 'decrease_budget':
                decrease_percent = params.get('decrease_percent', 20)
                new_budget = metrics.budget * (1 - decrease_percent / 100)
                return await facebook_client.update_budget(metrics.campaign_id, new_budget)
            
            elif action_type == 'change_bid':
                bid_adjustment = params.get('bid_adjustment_percent', 10)
                # TODO: Отримати поточну ставку і оновити
                return True
            
            elif action_type == 'rotate_creative':
                creative_id = params.get('backup_creative_id')
                if creative_id:
                    return await facebook_client.update_creative(metrics.campaign_id, creative_id)
            
            elif action_type == 'alert_only':
                # Відправити алерт
                await self._send_alert(metrics.client_id, metrics.campaign_id, params.get('message', 'Rule triggered'))
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Action execution failed: {e}")
            return False
    
    async def _get_facebook_client(self, client_id: str) -> Optional[FacebookAPIClient]:
        """Отримати Facebook API клієнт для клієнта"""
        if client_id not in self.facebook_clients:
            # TODO: Завантажити access token з бази даних
            access_token = "fake_token"  # Placeholder
            self.facebook_clients[client_id] = FacebookAPIClient(access_token)
        
        return self.facebook_clients[client_id]
    
    async def _get_today_executions_count(self, rule_id: str, action_type: str, campaign_id: str) -> int:
        """Отримати кількість виконань дії сьогодні"""
        try:
            today = datetime.now().date()
            cache_key = f"executions:{today}:{rule_id}:{action_type}:{campaign_id}"
            
            count = await self.redis_client.get(cache_key)
            return int(count) if count else 0
            
        except Exception:
            return 0
    
    async def _log_action_execution(self, 
                                  rule_id: str, 
                                  action_type: str,
                                  metrics: CampaignMetrics,
                                  success: bool):
        """Логувати виконання дії"""
        try:
            # Оновити счетчик в Redis
            today = datetime.now().date()
            cache_key = f"executions:{today}:{rule_id}:{action_type}:{metrics.campaign_id}"
            await self.redis_client.incr(cache_key)
            await self.redis_client.expire(cache_key, 86400)  # TTL 24 години
            
            # Логувати в ClickHouse
            execution_log = {
                'execution_id': f"{rule_id}_{metrics.campaign_id}_{datetime.now().timestamp()}",
                'rule_id': rule_id,
                'campaign_id': metrics.campaign_id,
                'client_id': metrics.client_id,
                'action_type': action_type,
                'execution_time': datetime.now(),
                'success': success,
                'before_metrics': {
                    'ctr': metrics.ctr,
                    'cpc': metrics.cpc,
                    'spend': metrics.spend,
                    'conversions': metrics.conversions
                }
            }
            
            # Відправити в Kafka для логування
            await self.producer.send(
                'rule_executions_log',
                value=execution_log
            )
            
        except Exception as e:
            logger.error(f"Failed to log action execution: {e}")
    
    async def _log_processing_result(self, metrics: CampaignMetrics, triggered_rules: List[Dict[str, Any]]):
        """Логувати результат обробки"""
        try:
            log_data = {
                'campaign_id': metrics.campaign_id,
                'client_id': metrics.client_id,
                'processed_at': datetime.now(),
                'triggered_rules_count': len(triggered_rules),
                'triggered_rules': [r['rule_id'] for r in triggered_rules],
                'metrics_snapshot': {
                    'ctr': metrics.ctr,
                    'cpc': metrics.cpc,
                    'spend': metrics.spend,
                    'conversions': metrics.conversions
                }
            }
            
            await self.producer.send('processing_logs', value=log_data)
            
        except Exception as e:
            logger.error(f"Failed to log processing result: {e}")
    
    async def _send_alert(self, client_id: str, campaign_id: str, message: str):
        """Відправити алерт"""
        try:
            alert_data = {
                'client_id': client_id,
                'campaign_id': campaign_id,
                'message': message,
                'timestamp': datetime.now(),
                'type': 'rule_alert'
            }
            
            await self.producer.send('alerts_queue', value=alert_data)
            logger.info(f"Alert sent for client {client_id}: {message}")
            
        except Exception as e:
            logger.error(f"Failed to send alert: {e}")
    
    async def get_stats(self) -> Dict[str, Any]:
        """Отримати статистику роботи процесора"""
        return {
            'processed_messages': self.processed_messages,
            'rules_triggered': self.rules_triggered,
            'actions_executed': self.actions_executed,
            'errors_count': self.errors_count,
            'uptime': datetime.now()  # TODO: Правильний uptime
        }
    
    async def shutdown(self):
        """Завершити роботу процесора"""
        try:
            if self.consumer:
                await self.consumer.stop()
            if self.producer:
                await self.producer.stop()
            if self.redis_client:
                await self.redis_client.close()
            if self.clickhouse_client:
                self.clickhouse_client.close()
            
            logger.info("Kafka Rules Processor shut down successfully")
            
        except Exception as e:
            logger.error(f"Shutdown error: {e}")

# Main запуск процесора
async def main():
    """Головна функція для запуску процесора"""
    config = {
        'kafka_servers': 'localhost:9092',
        'redis_url': 'redis://localhost:6379/0',
        'clickhouse_host': 'localhost',
        'clickhouse_port': 8123,
        'clickhouse_user': 'default',
        'clickhouse_password': ''
    }
    
    processor = KafkaRulesProcessor(config)
    
    try:
        await processor.initialize()
        await processor.start_processing()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    except Exception as e:
        logger.error(f"Processor error: {e}")
    finally:
        await processor.shutdown()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())