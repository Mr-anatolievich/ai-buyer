"""
Kafka Consumer Service for AI-Buyer
Handles real-time processing of streaming data from Kafka topics
"""

import json
import asyncio
from typing import Dict, List, Any, Optional, Callable, Set
import logging
from datetime import datetime
import time
import threading
from dataclasses import dataclass
from kafka import KafkaConsumer
from kafka.errors import KafkaError
import signal
import sys

logger = logging.getLogger(__name__)

@dataclass
class ConsumerConfig:
    """Configuration for Kafka consumer"""
    group_id: str
    bootstrap_servers: List[str]
    topics: List[str]
    auto_offset_reset: str = 'latest'
    enable_auto_commit: bool = True
    auto_commit_interval_ms: int = 1000
    max_poll_records: int = 500
    session_timeout_ms: int = 30000
    heartbeat_interval_ms: int = 3000
    fetch_min_bytes: int = 1
    fetch_max_wait_ms: int = 500

class MessageProcessor:
    """Base class for message processors"""
    
    def __init__(self, processor_name: str):
        self.processor_name = processor_name
        self.messages_processed = 0
        self.messages_failed = 0
        self.processing_time_total = 0.0
    
    async def process_message(self, message: Dict[str, Any], topic: str, partition: int, offset: int) -> bool:
        """
        Process a single message
        
        Args:
            message: Decoded message payload
            topic: Kafka topic name
            partition: Message partition
            offset: Message offset
            
        Returns:
            Success status
        """
        raise NotImplementedError("Subclasses must implement process_message")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get processor metrics"""
        avg_processing_time = (
            self.processing_time_total / self.messages_processed
            if self.messages_processed > 0 else 0
        )
        
        return {
            'processor_name': self.processor_name,
            'messages_processed': self.messages_processed,
            'messages_failed': self.messages_failed,
            'success_rate': (
                self.messages_processed / (self.messages_processed + self.messages_failed)
                if (self.messages_processed + self.messages_failed) > 0 else 0
            ),
            'avg_processing_time_ms': avg_processing_time * 1000
        }

class CampaignMetricsProcessor(MessageProcessor):
    """Processor for Facebook campaign metrics"""
    
    def __init__(self, clickhouse_client=None):
        super().__init__("CampaignMetricsProcessor")
        self.clickhouse_client = clickhouse_client
        
    async def process_message(self, message: Dict[str, Any], topic: str, partition: int, offset: int) -> bool:
        """Process campaign metrics message"""
        start_time = time.time()
        
        try:
            # Extract message data
            user_id = message.get('user_id')
            campaign_id = message.get('campaign_id')
            metrics = message.get('metrics', {})
            timestamp = message.get('timestamp')
            
            logger.debug(f"Processing campaign metrics for user {user_id}, campaign {campaign_id}")
            
            # Validate required fields
            if not all([user_id, campaign_id, timestamp]):
                logger.warning(f"Missing required fields in campaign metrics message: {message}")
                return False
            
            # Process metrics data
            processed_metrics = await self._process_campaign_metrics(
                user_id=user_id,
                campaign_id=campaign_id,
                metrics=metrics,
                timestamp=timestamp,
                raw_message=message
            )
            
            # Store to ClickHouse if client is available
            if self.clickhouse_client and processed_metrics:
                await self._store_to_clickhouse(processed_metrics)
            
            # Update metrics
            self.messages_processed += 1
            processing_time = time.time() - start_time
            self.processing_time_total += processing_time
            
            logger.debug(f"Successfully processed campaign metrics in {processing_time:.3f}s")
            return True
            
        except Exception as e:
            logger.error(f"Failed to process campaign metrics message: {e}")
            self.messages_failed += 1
            return False
    
    async def _process_campaign_metrics(self, 
                                      user_id: str, 
                                      campaign_id: str, 
                                      metrics: Dict[str, Any],
                                      timestamp: str,
                                      raw_message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process and enrich campaign metrics"""
        try:
            # Parse timestamp
            parsed_timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            # Extract and validate metrics
            processed_metrics = {
                'user_id': user_id,
                'campaign_id': campaign_id,
                'ad_set_id': raw_message.get('ad_set_id', ''),
                'ad_id': raw_message.get('ad_id', ''),
                'timestamp': parsed_timestamp,
                
                # Performance metrics
                'impressions': int(metrics.get('impressions', 0)),
                'clicks': int(metrics.get('clicks', 0)),
                'spend': float(metrics.get('spend', 0.0)),
                'reach': int(metrics.get('reach', 0)),
                'frequency': float(metrics.get('frequency', 0.0)),
                
                # Calculated metrics
                'ctr': float(metrics.get('ctr', 0.0)),
                'cpc': float(metrics.get('cpc', 0.0)),
                'cpm': float(metrics.get('cpm', 0.0)),
                'cpp': float(metrics.get('cpp', 0.0)),
                
                # Conversion metrics
                'conversions': int(metrics.get('conversions', 0)),
                'conversion_rate': float(metrics.get('conversion_rate', 0.0)),
                'cost_per_conversion': float(metrics.get('cost_per_conversion', 0.0)),
                'roas': float(metrics.get('return_on_ad_spend', 0.0)),
                
                # Quality metrics
                'quality_score': float(metrics.get('quality_score', 0.0)),
                'relevance_score': float(metrics.get('relevance_score', 0.0)),
                
                # Additional metadata
                'device_platform': metrics.get('device_platform', 'unknown'),
                'placement': metrics.get('placement', 'unknown'),
                'age_range': metrics.get('age_range', 'unknown'),
                'gender': metrics.get('gender', 'unknown'),
                'location': metrics.get('location', 'unknown'),
                
                # Processing metadata
                'processed_at': datetime.now().isoformat(),
                'event_id': raw_message.get('event_id'),
                'kafka_partition': None,  # Will be set by caller
                'kafka_offset': None      # Will be set by caller
            }
            
            return processed_metrics
            
        except Exception as e:
            logger.error(f"Error processing campaign metrics: {e}")
            return None
    
    async def _store_to_clickhouse(self, metrics: Dict[str, Any]):
        """Store processed metrics to ClickHouse"""
        try:
            # This would be implemented with actual ClickHouse client
            # For now, just log the operation
            logger.info(f"Storing metrics to ClickHouse for campaign {metrics['campaign_id']}")
            
            # Example ClickHouse insert (pseudo-code):
            # await self.clickhouse_client.execute("""
            #     INSERT INTO campaign_metrics (
            #         user_id, campaign_id, timestamp, impressions, clicks, spend, ...
            #     ) VALUES (
            #         %(user_id)s, %(campaign_id)s, %(timestamp)s, %(impressions)s, ...
            #     )
            # """, metrics)
            
        except Exception as e:
            logger.error(f"Failed to store metrics to ClickHouse: {e}")
            raise

class MLPredictionProcessor(MessageProcessor):
    """Processor for ML model predictions"""
    
    def __init__(self, model_registry=None):
        super().__init__("MLPredictionProcessor")
        self.model_registry = model_registry
        
    async def process_message(self, message: Dict[str, Any], topic: str, partition: int, offset: int) -> bool:
        """Process ML prediction message"""
        start_time = time.time()
        
        try:
            user_id = message.get('user_id')
            model_name = message.get('model_name')
            prediction_result = message.get('prediction_result', {})
            
            logger.debug(f"Processing ML prediction for user {user_id}, model {model_name}")
            
            # Validate message
            if not all([user_id, model_name]):
                logger.warning(f"Missing required fields in ML prediction message: {message}")
                return False
            
            # Process prediction
            await self._process_prediction(
                user_id=user_id,
                model_name=model_name,
                prediction_data=message
            )
            
            # Update metrics
            self.messages_processed += 1
            processing_time = time.time() - start_time
            self.processing_time_total += processing_time
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to process ML prediction message: {e}")
            self.messages_failed += 1
            return False
    
    async def _process_prediction(self, user_id: str, model_name: str, prediction_data: Dict[str, Any]):
        """Process ML prediction results"""
        try:
            # Extract prediction details
            prediction_id = prediction_data.get('prediction_id')
            confidence_score = prediction_data.get('confidence_score', 0.0)
            prediction_result = prediction_data.get('prediction_result', {})
            
            # Log high-confidence predictions
            if confidence_score > 0.8:
                logger.info(f"High-confidence prediction {prediction_id} for {model_name}: {confidence_score}")
            
            # Store prediction result
            # This could trigger further actions like budget optimization
            logger.debug(f"Processed prediction {prediction_id} for model {model_name}")
            
        except Exception as e:
            logger.error(f"Error processing prediction: {e}")
            raise

class AnomalyDetectionProcessor(MessageProcessor):
    """Processor for anomaly detection events"""
    
    def __init__(self, alert_service=None):
        super().__init__("AnomalyDetectionProcessor") 
        self.alert_service = alert_service
        
    async def process_message(self, message: Dict[str, Any], topic: str, partition: int, offset: int) -> bool:
        """Process anomaly detection message"""
        start_time = time.time()
        
        try:
            user_id = message.get('user_id')
            anomaly_type = message.get('anomaly_type')
            severity = message.get('severity', 'medium')
            
            logger.info(f"Processing anomaly detection: {anomaly_type} (severity: {severity}) for user {user_id}")
            
            # Process anomaly
            await self._process_anomaly(message)
            
            # Send alerts for high-severity anomalies
            if severity in ['high', 'critical'] and self.alert_service:
                await self._send_alert(message)
            
            # Update metrics
            self.messages_processed += 1
            processing_time = time.time() - start_time
            self.processing_time_total += processing_time
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to process anomaly detection message: {e}")
            self.messages_failed += 1
            return False
    
    async def _process_anomaly(self, anomaly_data: Dict[str, Any]):
        """Process anomaly detection event"""
        try:
            # Log anomaly details
            anomaly_type = anomaly_data.get('anomaly_type')
            campaign_id = anomaly_data.get('campaign_id')
            detection_details = anomaly_data.get('detection_details', {})
            
            logger.warning(f"Anomaly detected: {anomaly_type} in campaign {campaign_id}")
            logger.debug(f"Anomaly details: {detection_details}")
            
            # Store anomaly record
            # This could trigger automated responses
            
        except Exception as e:
            logger.error(f"Error processing anomaly: {e}")
            raise
    
    async def _send_alert(self, anomaly_data: Dict[str, Any]):
        """Send alert for high-severity anomalies"""
        try:
            # Send alert through configured service
            logger.info(f"Sending alert for anomaly: {anomaly_data.get('anomaly_type')}")
            
            # Example alert implementation
            # await self.alert_service.send_alert({
            #     'type': 'anomaly_detected',
            #     'data': anomaly_data
            # })
            
        except Exception as e:
            logger.error(f"Failed to send anomaly alert: {e}")

class KafkaDataConsumer:
    """
    High-performance Kafka consumer for AI-Buyer data streams
    Supports multiple topics with dedicated processors
    """
    
    def __init__(self, config: ConsumerConfig):
        self.config = config
        self.consumer: Optional[KafkaConsumer] = None
        self.processors: Dict[str, MessageProcessor] = {}
        self.running = False
        self.consumer_thread: Optional[threading.Thread] = None
        
        # Metrics
        self.messages_consumed = 0
        self.messages_processed = 0
        self.messages_failed = 0
        self.start_time = time.time()
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        logger.info(f"KafkaDataConsumer initialized for topics: {config.topics}")
    
    def add_processor(self, topic_pattern: str, processor: MessageProcessor):
        """
        Add a message processor for specific topic pattern
        
        Args:
            topic_pattern: Topic name or pattern to match
            processor: MessageProcessor instance
        """
        self.processors[topic_pattern] = processor
        logger.info(f"Added processor {processor.processor_name} for topic pattern {topic_pattern}")
    
    def _create_consumer(self) -> KafkaConsumer:
        """Create and configure Kafka consumer"""
        try:
            consumer = KafkaConsumer(
                *self.config.topics,
                bootstrap_servers=self.config.bootstrap_servers,
                group_id=self.config.group_id,
                auto_offset_reset=self.config.auto_offset_reset,
                enable_auto_commit=self.config.enable_auto_commit,
                auto_commit_interval_ms=self.config.auto_commit_interval_ms,
                max_poll_records=self.config.max_poll_records,
                session_timeout_ms=self.config.session_timeout_ms,
                heartbeat_interval_ms=self.config.heartbeat_interval_ms,
                fetch_min_bytes=self.config.fetch_min_bytes,
                fetch_max_wait_ms=self.config.fetch_max_wait_ms,
                
                # Serializers
                value_deserializer=lambda m: json.loads(m.decode('utf-8')) if m else None,
                key_deserializer=lambda m: m.decode('utf-8') if m else None,
                
                # Consumer settings
                consumer_timeout_ms=1000,  # Timeout for polling
            )
            
            logger.info(f"Kafka consumer created for group {self.config.group_id}")
            return consumer
            
        except Exception as e:
            logger.error(f"Failed to create Kafka consumer: {e}")
            raise
    
    def start(self, async_processing: bool = True):
        """Start consuming messages"""
        try:
            self.consumer = self._create_consumer()
            self.running = True
            
            logger.info("Starting Kafka consumer...")
            
            if async_processing:
                # Run consumer in separate thread
                self.consumer_thread = threading.Thread(
                    target=self._consume_messages_async,
                    daemon=True
                )
                self.consumer_thread.start()
            else:
                # Run consumer in current thread (blocking)
                self._consume_messages_sync()
                
        except Exception as e:
            logger.error(f"Failed to start Kafka consumer: {e}")
            raise
    
    def _consume_messages_sync(self):
        """Synchronous message consumption"""
        try:
            for message in self.consumer:
                if not self.running:
                    break
                
                self._process_single_message(message)
                
        except Exception as e:
            logger.error(f"Error in synchronous message consumption: {e}")
        finally:
            self._cleanup()
    
    def _consume_messages_async(self):
        """Asynchronous message consumption with event loop"""
        try:
            # Create new event loop for this thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Run async consumption
            loop.run_until_complete(self._async_consume_loop())
            
        except Exception as e:
            logger.error(f"Error in asynchronous message consumption: {e}")
        finally:
            self._cleanup()
    
    async def _async_consume_loop(self):
        """Main async consumption loop"""
        try:
            while self.running:
                # Poll for messages with timeout
                message_batch = self.consumer.poll(timeout_ms=1000)
                
                if not message_batch:
                    continue
                
                # Process messages concurrently
                tasks = []
                for topic_partition, messages in message_batch.items():
                    for message in messages:
                        task = self._process_message_async(message)
                        tasks.append(task)
                
                if tasks:
                    # Wait for all messages in batch to be processed
                    await asyncio.gather(*tasks, return_exceptions=True)
                
                # Commit offsets
                if self.config.enable_auto_commit:
                    self.consumer.commit()
                    
        except Exception as e:
            logger.error(f"Error in async consume loop: {e}")
    
    def _process_single_message(self, message):
        """Process a single message synchronously"""
        try:
            self.messages_consumed += 1
            
            # Decode message
            topic = message.topic
            partition = message.partition
            offset = message.offset
            value = message.value
            
            if value is None:
                logger.debug(f"Received null message from {topic}:{partition}:{offset}")
                return
            
            logger.debug(f"Processing message from {topic}:{partition}:{offset}")
            
            # Find appropriate processor
            processor = self._find_processor(topic)
            if not processor:
                logger.warning(f"No processor found for topic {topic}")
                return
            
            # Process message
            # Note: This is sync processing of async method
            # In production, you might want to use asyncio.run() or similar
            success = True  # Placeholder for actual processing
            
            if success:
                self.messages_processed += 1
            else:
                self.messages_failed += 1
                
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            self.messages_failed += 1
    
    async def _process_message_async(self, message):
        """Process a single message asynchronously"""
        try:
            self.messages_consumed += 1
            
            # Decode message
            topic = message.topic
            partition = message.partition
            offset = message.offset
            value = message.value
            
            if value is None:
                logger.debug(f"Received null message from {topic}:{partition}:{offset}")
                return
            
            logger.debug(f"Processing message from {topic}:{partition}:{offset}")
            
            # Find appropriate processor
            processor = self._find_processor(topic)
            if not processor:
                logger.warning(f"No processor found for topic {topic}")
                return
            
            # Process message asynchronously
            success = await processor.process_message(value, topic, partition, offset)
            
            if success:
                self.messages_processed += 1
                logger.debug(f"Successfully processed message from {topic}:{partition}:{offset}")
            else:
                self.messages_failed += 1
                logger.warning(f"Failed to process message from {topic}:{partition}:{offset}")
                
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            self.messages_failed += 1
    
    def _find_processor(self, topic: str) -> Optional[MessageProcessor]:
        """Find appropriate processor for topic"""
        # Exact match first
        if topic in self.processors:
            return self.processors[topic]
        
        # Pattern matching
        for pattern, processor in self.processors.items():
            if pattern in topic or topic.startswith(pattern):
                return processor
        
        return None
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down consumer...")
        self.stop()
    
    def stop(self):
        """Stop consuming messages"""
        logger.info("Stopping Kafka consumer...")
        self.running = False
        
        if self.consumer_thread and self.consumer_thread.is_alive():
            logger.info("Waiting for consumer thread to finish...")
            self.consumer_thread.join(timeout=30)
        
        self._cleanup()
    
    def _cleanup(self):
        """Clean up resources"""
        try:
            if self.consumer:
                self.consumer.close()
                logger.info("Kafka consumer closed")
        except Exception as e:
            logger.error(f"Error closing consumer: {e}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get consumer metrics"""
        uptime = time.time() - self.start_time
        messages_per_second = self.messages_consumed / uptime if uptime > 0 else 0
        
        processor_metrics = {}
        for pattern, processor in self.processors.items():
            processor_metrics[pattern] = processor.get_metrics()
        
        return {
            'consumer_metrics': {
                'messages_consumed': self.messages_consumed,
                'messages_processed': self.messages_processed,
                'messages_failed': self.messages_failed,
                'success_rate': (
                    self.messages_processed / self.messages_consumed
                    if self.messages_consumed > 0 else 0
                ),
                'messages_per_second': messages_per_second,
                'uptime_seconds': uptime,
                'running': self.running
            },
            'processor_metrics': processor_metrics
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Check consumer health"""
        try:
            if not self.consumer:
                return {'status': 'unhealthy', 'reason': 'Consumer not initialized'}
            
            # Check if consumer is still connected
            partitions = self.consumer.assignment()
            
            return {
                'status': 'healthy' if self.running else 'stopped',
                'assigned_partitions': len(partitions),
                'consumer_group': self.config.group_id,
                'subscribed_topics': self.config.topics,
                'processor_count': len(self.processors),
                'metrics': self.get_metrics()
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'status': 'unhealthy',
                'reason': str(e),
                'metrics': self.get_metrics()
            }

# Factory function for creating configured consumer
def create_ai_buyer_consumer(bootstrap_servers: List[str] = None,
                           group_id: str = "ai-buyer-consumer-group") -> KafkaDataConsumer:
    """
    Create configured Kafka consumer for AI-Buyer application
    
    Args:
        bootstrap_servers: List of Kafka bootstrap servers
        group_id: Consumer group ID
        
    Returns:
        Configured KafkaDataConsumer instance
    """
    if bootstrap_servers is None:
        bootstrap_servers = ['localhost:9092']
    
    # Configure topics
    topics = [
        'facebook-campaign-events',
        'ml-predictions', 
        'user-actions',
        'anomaly-detection',
        'optimization-results'
    ]
    
    config = ConsumerConfig(
        group_id=group_id,
        bootstrap_servers=bootstrap_servers,
        topics=topics,
        auto_offset_reset='earliest',  # Start from beginning for new consumers
        max_poll_records=100,         # Smaller batches for faster processing
        session_timeout_ms=30000,
        heartbeat_interval_ms=3000
    )
    
    consumer = KafkaDataConsumer(config)
    
    # Add processors
    consumer.add_processor('facebook-campaign-events', CampaignMetricsProcessor())
    consumer.add_processor('ml-predictions', MLPredictionProcessor())
    consumer.add_processor('anomaly-detection', AnomalyDetectionProcessor())
    
    logger.info("AI-Buyer Kafka consumer created with all processors")
    return consumer