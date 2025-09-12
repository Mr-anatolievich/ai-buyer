"""
Streaming Service for AI-Buyer
Coordinates Kafka producers and consumers for real-time data processing
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import time
from dataclasses import dataclass, asdict

from .kafka_producer import FacebookDataStreamer, get_kafka_streamer
from .kafka_consumer import create_ai_buyer_consumer, KafkaDataConsumer

logger = logging.getLogger(__name__)

@dataclass
class StreamingConfig:
    """Configuration for streaming service"""
    kafka_bootstrap_servers: List[str]
    consumer_group_id: str = "ai-buyer-streaming"
    enable_consumer: bool = True
    enable_producer: bool = True
    health_check_interval: int = 30
    auto_restart_on_failure: bool = True
    max_restart_attempts: int = 3

class StreamingMetrics:
    """Metrics collection for streaming service"""
    
    def __init__(self):
        self.start_time = time.time()
        self.messages_streamed = 0
        self.messages_consumed = 0
        self.errors_count = 0
        self.restarts_count = 0
        self.last_activity = time.time()
    
    def record_stream(self):
        """Record a message streamed"""
        self.messages_streamed += 1
        self.last_activity = time.time()
    
    def record_consumption(self):
        """Record a message consumed"""
        self.messages_consumed += 1
        self.last_activity = time.time()
    
    def record_error(self):
        """Record an error"""
        self.errors_count += 1
    
    def record_restart(self):
        """Record a service restart"""
        self.restarts_count += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        uptime = time.time() - self.start_time
        time_since_activity = time.time() - self.last_activity
        
        return {
            'uptime_seconds': uptime,
            'messages_streamed': self.messages_streamed,
            'messages_consumed': self.messages_consumed,
            'errors_count': self.errors_count,
            'restarts_count': self.restarts_count,
            'time_since_last_activity': time_since_activity,
            'messages_per_second': (
                (self.messages_streamed + self.messages_consumed) / uptime
                if uptime > 0 else 0
            )
        }

class FacebookDataStreamingService:
    """
    Main streaming service for Facebook advertising data
    Coordinates real-time data flow between Facebook API, Kafka, and ML models
    """
    
    def __init__(self, config: StreamingConfig):
        self.config = config
        self.metrics = StreamingMetrics()
        
        # Service components
        self.producer: Optional[FacebookDataStreamer] = None
        self.consumer: Optional[KafkaDataConsumer] = None
        
        # Service state
        self.running = False
        self.health_check_task: Optional[asyncio.Task] = None
        self.restart_attempts = 0
        
        logger.info("FacebookDataStreamingService initialized")
    
    async def start(self) -> bool:
        """
        Start the streaming service
        
        Returns:
            Success status
        """
        try:
            logger.info("Starting Facebook data streaming service...")
            
            # Initialize producer
            if self.config.enable_producer:
                self.producer = get_kafka_streamer()
                if not self.producer:
                    logger.error("Failed to initialize Kafka producer")
                    return False
                logger.info("Kafka producer initialized")
            
            # Initialize consumer
            if self.config.enable_consumer:
                self.consumer = create_ai_buyer_consumer(
                    bootstrap_servers=self.config.kafka_bootstrap_servers,
                    group_id=self.config.consumer_group_id
                )
                
                # Start consumer in background
                self.consumer.start(async_processing=True)
                logger.info("Kafka consumer started")
            
            # Mark as running
            self.running = True
            
            # Start health check monitoring
            if self.config.health_check_interval > 0:
                self.health_check_task = asyncio.create_task(
                    self._health_check_loop()
                )
            
            logger.info("Facebook data streaming service started successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start streaming service: {e}")
            await self.stop()
            return False
    
    async def stop(self):
        """Stop the streaming service"""
        try:
            logger.info("Stopping Facebook data streaming service...")
            self.running = False
            
            # Stop health check
            if self.health_check_task:
                self.health_check_task.cancel()
                try:
                    await self.health_check_task
                except asyncio.CancelledError:
                    pass
            
            # Stop consumer
            if self.consumer:
                self.consumer.stop()
                logger.info("Kafka consumer stopped")
            
            # Close producer
            if self.producer:
                self.producer.close()
                logger.info("Kafka producer closed")
            
            logger.info("Facebook data streaming service stopped")
            
        except Exception as e:
            logger.error(f"Error stopping streaming service: {e}")
    
    async def stream_campaign_data(self, 
                                 user_id: str, 
                                 campaigns_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Stream campaign data to Kafka
        
        Args:
            user_id: User identifier
            campaigns_data: List of campaign data to stream
            
        Returns:
            Results with success/failure counts
        """
        if not self.running or not self.producer:
            logger.warning("Streaming service not running or producer not available")
            return {'success': 0, 'failed': len(campaigns_data)}
        
        try:
            logger.debug(f"Streaming {len(campaigns_data)} campaigns for user {user_id}")
            
            # Use batch sending for efficiency
            results = self.producer.batch_send_metrics(
                user_id=user_id,
                campaigns_data=campaigns_data,
                force_send=True
            )
            
            # Update metrics
            self.metrics.messages_streamed += results['success']
            if results['failed'] > 0:
                self.metrics.record_error()
            
            logger.debug(f"Streamed campaigns: {results['success']} success, {results['failed']} failed")
            return results
            
        except Exception as e:
            logger.error(f"Error streaming campaign data: {e}")
            self.metrics.record_error()
            return {'success': 0, 'failed': len(campaigns_data)}
    
    async def stream_ml_prediction(self,
                                 user_id: str,
                                 model_name: str,
                                 prediction_data: Dict[str, Any]) -> bool:
        """
        Stream ML prediction results to Kafka
        
        Args:
            user_id: User identifier
            model_name: Name of the ML model
            prediction_data: Prediction results and metadata
            
        Returns:
            Success status
        """
        if not self.running or not self.producer:
            logger.warning("Streaming service not running or producer not available")
            return False
        
        try:
            success = self.producer.stream_ml_prediction(
                user_id=user_id,
                model_name=model_name,
                prediction_data=prediction_data
            )
            
            if success:
                self.metrics.record_stream()
            else:
                self.metrics.record_error()
            
            return success
            
        except Exception as e:
            logger.error(f"Error streaming ML prediction: {e}")
            self.metrics.record_error()
            return False
    
    async def stream_user_action(self,
                               user_id: str,
                               action_type: str,
                               action_data: Dict[str, Any],
                               session_id: str) -> bool:
        """
        Stream user action to Kafka
        
        Args:
            user_id: User identifier
            action_type: Type of action performed
            action_data: Action details
            session_id: User session identifier
            
        Returns:
            Success status
        """
        if not self.running or not self.producer:
            logger.warning("Streaming service not running or producer not available")
            return False
        
        try:
            success = self.producer.stream_user_action(
                user_id=user_id,
                action_type=action_type,
                action_data=action_data,
                session_id=session_id
            )
            
            if success:
                self.metrics.record_stream()
            else:
                self.metrics.record_error()
            
            return success
            
        except Exception as e:
            logger.error(f"Error streaming user action: {e}")
            self.metrics.record_error()
            return False
    
    async def stream_anomaly_detection(self,
                                     user_id: str,
                                     anomaly_data: Dict[str, Any]) -> bool:
        """
        Stream anomaly detection results to Kafka
        
        Args:
            user_id: User identifier
            anomaly_data: Anomaly detection results
            
        Returns:
            Success status
        """
        if not self.running or not self.producer:
            logger.warning("Streaming service not running or producer not available")
            return False
        
        try:
            success = self.producer.stream_anomaly_detection(
                user_id=user_id,
                anomaly_data=anomaly_data
            )
            
            if success:
                self.metrics.record_stream()
            else:
                self.metrics.record_error()
            
            return success
            
        except Exception as e:
            logger.error(f"Error streaming anomaly detection: {e}")
            self.metrics.record_error()
            return False
    
    async def stream_optimization_result(self,
                                       user_id: str,
                                       optimization_data: Dict[str, Any]) -> bool:
        """
        Stream budget optimization results to Kafka
        
        Args:
            user_id: User identifier
            optimization_data: Optimization results
            
        Returns:
            Success status
        """
        if not self.running or not self.producer:
            logger.warning("Streaming service not running or producer not available")
            return False
        
        try:
            success = self.producer.stream_optimization_result(
                user_id=user_id,
                optimization_data=optimization_data
            )
            
            if success:
                self.metrics.record_stream()
            else:
                self.metrics.record_error()
            
            return success
            
        except Exception as e:
            logger.error(f"Error streaming optimization result: {e}")
            self.metrics.record_error()
            return False
    
    async def _health_check_loop(self):
        """Periodic health check and auto-restart logic"""
        while self.running:
            try:
                await asyncio.sleep(self.config.health_check_interval)
                
                if not self.running:
                    break
                
                # Check health
                health_status = await self.health_check()
                
                if health_status['status'] != 'healthy':
                    logger.warning(f"Health check failed: {health_status}")
                    
                    # Auto-restart if enabled
                    if (self.config.auto_restart_on_failure and 
                        self.restart_attempts < self.config.max_restart_attempts):
                        
                        logger.info(f"Attempting auto-restart (attempt {self.restart_attempts + 1})")
                        await self._restart_service()
                
                # Log periodic metrics
                metrics = self.metrics.get_metrics()
                logger.info(f"Streaming metrics: {metrics}")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in health check loop: {e}")
    
    async def _restart_service(self):
        """Restart the streaming service"""
        try:
            self.restart_attempts += 1
            self.metrics.record_restart()
            
            logger.info("Restarting streaming service...")
            
            # Stop current instances
            if self.consumer:
                self.consumer.stop()
            if self.producer:
                self.producer.close()
            
            # Wait a bit before restart
            await asyncio.sleep(5)
            
            # Restart
            success = await self.start()
            
            if success:
                self.restart_attempts = 0  # Reset on successful restart
                logger.info("Service restarted successfully")
            else:
                logger.error("Failed to restart service")
            
        except Exception as e:
            logger.error(f"Error during service restart: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Comprehensive health check
        
        Returns:
            Health status and details
        """
        try:
            health_data = {
                'timestamp': datetime.now().isoformat(),
                'service_running': self.running,
                'restart_attempts': self.restart_attempts,
                'metrics': self.metrics.get_metrics()
            }
            
            # Check producer health
            if self.producer:
                producer_health = self.producer.health_check()
                health_data['producer'] = producer_health
            else:
                health_data['producer'] = {'status': 'disabled'}
            
            # Check consumer health
            if self.consumer:
                consumer_health = self.consumer.health_check()
                health_data['consumer'] = consumer_health
            else:
                health_data['consumer'] = {'status': 'disabled'}
            
            # Determine overall status
            overall_status = 'healthy'
            
            if not self.running:
                overall_status = 'stopped'
            elif (self.producer and health_data['producer']['status'] != 'healthy') or \
                 (self.consumer and health_data['consumer']['status'] != 'healthy'):
                overall_status = 'degraded'
            
            health_data['status'] = overall_status
            
            return health_data
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get service metrics"""
        return {
            'service_metrics': self.metrics.get_metrics(),
            'producer_metrics': (
                self.producer.get_metrics() if self.producer else None
            ),
            'consumer_metrics': (
                self.consumer.get_metrics() if self.consumer else None
            )
        }

# Singleton streaming service instance
_streaming_service: Optional[FacebookDataStreamingService] = None

def get_streaming_service() -> Optional[FacebookDataStreamingService]:
    """Get singleton streaming service instance"""
    return _streaming_service

def initialize_streaming_service(config: StreamingConfig) -> FacebookDataStreamingService:
    """
    Initialize streaming service with configuration
    
    Args:
        config: Streaming service configuration
        
    Returns:
        Configured streaming service instance
    """
    global _streaming_service
    _streaming_service = FacebookDataStreamingService(config)
    return _streaming_service

async def start_streaming_service(kafka_servers: List[str] = None) -> bool:
    """
    Start the global streaming service
    
    Args:
        kafka_servers: List of Kafka bootstrap servers
        
    Returns:
        Success status
    """
    if kafka_servers is None:
        kafka_servers = ['localhost:9092']
    
    config = StreamingConfig(
        kafka_bootstrap_servers=kafka_servers,
        consumer_group_id="ai-buyer-production",
        enable_consumer=True,
        enable_producer=True,
        health_check_interval=30,
        auto_restart_on_failure=True
    )
    
    service = initialize_streaming_service(config)
    return await service.start()

async def stop_streaming_service():
    """Stop the global streaming service"""
    global _streaming_service
    if _streaming_service:
        await _streaming_service.stop()
        _streaming_service = None