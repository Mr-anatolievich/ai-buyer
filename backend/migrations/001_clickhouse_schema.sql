-- AI-Buyer ClickHouse Database Schema
-- Optimized for high-performance analytics on Facebook advertising data
-- Supports multi-tenant architecture with efficient partitioning

-- =============================================
-- Database Creation
-- =============================================

CREATE DATABASE IF NOT EXISTS aibuyer;

-- =============================================
-- Main Campaign Metrics Table
-- Real-time granular advertising metrics
-- =============================================

CREATE TABLE aibuyer.campaign_metrics
(
    -- Tenant and identification
    user_id String CODEC(ZSTD(1)),
    campaign_id String CODEC(ZSTD(1)),
    ad_set_id String CODEC(ZSTD(1)),
    ad_id String CODEC(ZSTD(1)),
    
    -- Temporal data
    timestamp DateTime64(3) CODEC(T64, ZSTD(1)),
    date_partition Date MATERIALIZED toDate(timestamp),
    hour UInt8 MATERIALIZED toHour(timestamp),
    day_of_week UInt8 MATERIALIZED toDayOfWeek(timestamp),
    
    -- Core metrics
    impressions UInt32 CODEC(T64, ZSTD(1)),
    clicks UInt32 CODEC(T64, ZSTD(1)),
    spend Decimal64(4) CODEC(ZSTD(1)),
    conversions UInt32 CODEC(T64, ZSTD(1)),
    
    -- Calculated metrics (materialized for performance)
    ctr Float32 MATERIALIZED if(impressions > 0, clicks / impressions, 0),
    cpc Decimal64(4) MATERIALIZED if(clicks > 0, spend / clicks, 0),
    cpm Decimal64(4) MATERIALIZED if(impressions > 0, spend / impressions * 1000, 0),
    conversion_rate Float32 MATERIALIZED if(clicks > 0, conversions / clicks, 0),
    cost_per_conversion Decimal64(4) MATERIALIZED if(conversions > 0, spend / conversions, 0),
    
    -- Audience and targeting
    placement String CODEC(ZSTD(1)),
    device_type LowCardinality(String),
    age_group LowCardinality(String),
    gender LowCardinality(String),
    geographic_location String CODEC(ZSTD(1)),
    interest_category String CODEC(ZSTD(1)),
    
    -- Campaign configuration
    campaign_objective LowCardinality(String),
    optimization_goal LowCardinality(String),
    bid_strategy LowCardinality(String),
    budget_type LowCardinality(String),
    
    -- Creative information
    creative_id String CODEC(ZSTD(1)),
    creative_format LowCardinality(String),
    creative_age_days UInt16 CODEC(T64, ZSTD(1)),
    
    -- Performance context
    frequency Float32 CODEC(ZSTD(1)),
    reach UInt32 CODEC(T64, ZSTD(1)),
    bid_amount Decimal64(4) CODEC(ZSTD(1)),
    budget_remaining Decimal64(4) CODEC(ZSTD(1)),
    
    -- Additional engagement metrics
    likes UInt32 DEFAULT 0 CODEC(T64, ZSTD(1)),
    shares UInt32 DEFAULT 0 CODEC(T64, ZSTD(1)),
    comments UInt32 DEFAULT 0 CODEC(T64, ZSTD(1)),
    video_views UInt32 DEFAULT 0 CODEC(T64, ZSTD(1)),
    
    -- ML feature engineering columns
    previous_ctr Float32 DEFAULT 0 CODEC(ZSTD(1)),
    previous_cpc Decimal64(4) DEFAULT 0 CODEC(ZSTD(1)),
    competition_index Float32 DEFAULT 0 CODEC(ZSTD(1)),
    seasonal_factor Float32 DEFAULT 1.0 CODEC(ZSTD(1)),
    
    -- Data quality and audit
    data_source LowCardinality(String) DEFAULT 'facebook_api',
    data_quality_score Float32 DEFAULT 1.0 CODEC(ZSTD(1)),
    inserted_at DateTime DEFAULT now() CODEC(T64, ZSTD(1)),
    updated_at DateTime DEFAULT now() CODEC(T64, ZSTD(1)),
    
    -- Indexes for fast querying
    INDEX idx_user_id (user_id) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_campaign (campaign_id) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_ad_set (ad_set_id) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_placement (placement) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_device (device_type) TYPE set(100) GRANULARITY 1,
    INDEX idx_creative_format (creative_format) TYPE set(50) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY (user_id, toYYYYMM(timestamp))
ORDER BY (user_id, campaign_id, timestamp)
TTL timestamp + INTERVAL 2 YEAR  -- Data retention policy
SETTINGS 
    index_granularity = 8192,
    max_compress_block_size = 1048576,
    min_compress_block_size = 65536;

-- =============================================
-- Hourly Aggregated Metrics (Materialized View)
-- Pre-computed hourly aggregations for faster analytics
-- =============================================

CREATE MATERIALIZED VIEW aibuyer.campaign_metrics_hourly
ENGINE = SummingMergeTree()
PARTITION BY (user_id, toYYYYMM(hour))
ORDER BY (user_id, campaign_id, hour)
TTL hour + INTERVAL 1 YEAR
AS SELECT
    user_id,
    campaign_id,
    ad_set_id,
    placement,
    device_type,
    age_group,
    gender,
    campaign_objective,
    toStartOfHour(timestamp) as hour,
    
    -- Summed metrics
    sum(impressions) as total_impressions,
    sum(clicks) as total_clicks,
    sum(spend) as total_spend,
    sum(conversions) as total_conversions,
    sum(likes) as total_likes,
    sum(shares) as total_shares,
    sum(comments) as total_comments,
    sum(video_views) as total_video_views,
    
    -- Calculated aggregated metrics
    if(sum(impressions) > 0, sum(clicks) / sum(impressions), 0) as avg_ctr,
    if(sum(clicks) > 0, sum(spend) / sum(clicks), 0) as avg_cpc,
    if(sum(impressions) > 0, sum(spend) / sum(impressions) * 1000, 0) as avg_cpm,
    if(sum(clicks) > 0, sum(conversions) / sum(clicks), 0) as avg_conversion_rate,
    if(sum(conversions) > 0, sum(spend) / sum(conversions), 0) as avg_cost_per_conversion,
    
    -- Statistical metrics
    count() as records_count,
    min(timestamp) as period_start,
    max(timestamp) as period_end,
    
    -- Engagement rate
    if(sum(impressions) > 0, (sum(likes) + sum(shares) + sum(comments)) / sum(impressions), 0) as engagement_rate
FROM aibuyer.campaign_metrics
GROUP BY 
    user_id, campaign_id, ad_set_id, placement, device_type, 
    age_group, gender, campaign_objective, hour;

-- =============================================
-- Daily Aggregated Metrics (Materialized View)
-- Daily rollups for trend analysis and reporting
-- =============================================

CREATE MATERIALIZED VIEW aibuyer.campaign_metrics_daily
ENGINE = SummingMergeTree()
PARTITION BY (user_id, toYYYYMM(date))
ORDER BY (user_id, campaign_id, date)
TTL date + INTERVAL 3 YEAR
AS SELECT
    user_id,
    campaign_id,
    ad_set_id,
    campaign_objective,
    toDate(timestamp) as date,
    
    -- Daily aggregations
    sum(impressions) as daily_impressions,
    sum(clicks) as daily_clicks,
    sum(spend) as daily_spend,
    sum(conversions) as daily_conversions,
    
    -- Performance metrics
    if(sum(impressions) > 0, sum(clicks) / sum(impressions), 0) as daily_ctr,
    if(sum(clicks) > 0, sum(spend) / sum(clicks), 0) as daily_cpc,
    if(sum(conversions) > 0, sum(spend) / sum(conversions), 0) as daily_cost_per_conversion,
    
    -- Device breakdown
    sumIf(impressions, device_type = 'mobile') as mobile_impressions,
    sumIf(impressions, device_type = 'desktop') as desktop_impressions,
    sumIf(clicks, device_type = 'mobile') as mobile_clicks,
    sumIf(clicks, device_type = 'desktop') as desktop_clicks,
    
    -- Time distribution
    sumIf(impressions, hour >= 9 AND hour <= 17) as business_hours_impressions,
    sumIf(impressions, hour >= 18 AND hour <= 23) as evening_impressions,
    sumIf(impressions, toDayOfWeek(timestamp) >= 6) as weekend_impressions,
    
    -- Quality metrics
    count(DISTINCT ad_id) as unique_ads,
    count(DISTINCT creative_id) as unique_creatives,
    avg(frequency) as avg_frequency,
    sum(reach) as total_reach
FROM aibuyer.campaign_metrics
GROUP BY user_id, campaign_id, ad_set_id, campaign_objective, date;

-- =============================================
-- User Campaign Summary (Materialized View)
-- High-level summary per user for dashboards
-- =============================================

CREATE MATERIALIZED VIEW aibuyer.user_campaign_summary
ENGINE = ReplacingMergeTree()
PARTITION BY user_id
ORDER BY (user_id, campaign_id)
AS SELECT
    user_id,
    campaign_id,
    campaign_objective,
    
    -- Overall performance
    sum(impressions) as total_impressions,
    sum(clicks) as total_clicks,
    sum(spend) as total_spend,
    sum(conversions) as total_conversions,
    
    -- Performance ratios
    if(sum(impressions) > 0, sum(clicks) / sum(impressions), 0) as overall_ctr,
    if(sum(clicks) > 0, sum(spend) / sum(clicks), 0) as overall_cpc,
    if(sum(conversions) > 0, sum(spend) / sum(conversions), 0) as overall_cost_per_conversion,
    
    -- Campaign metadata
    min(timestamp) as campaign_start,
    max(timestamp) as campaign_last_activity,
    dateDiff('day', min(timestamp), max(timestamp)) + 1 as campaign_duration_days,
    count(DISTINCT toDate(timestamp)) as active_days,
    
    -- Best performing metrics
    max(ctr) as best_ctr,
    min(cpc) as best_cpc,
    max(conversions) as best_daily_conversions,
    
    -- Creative diversity
    count(DISTINCT creative_id) as unique_creatives,
    count(DISTINCT ad_id) as unique_ads,
    count(DISTINCT placement) as unique_placements,
    
    -- Last updated
    max(inserted_at) as last_updated
FROM aibuyer.campaign_metrics
GROUP BY user_id, campaign_id, campaign_objective;

-- =============================================
-- ML Training Data View
-- Optimized view for machine learning model training
-- =============================================

CREATE VIEW aibuyer.ml_training_data AS
SELECT
    user_id,
    campaign_id,
    ad_set_id,
    ad_id,
    timestamp,
    
    -- Features for ML models
    ctr,
    cpc,
    conversion_rate,
    impressions,
    clicks,
    spend,
    conversions,
    
    -- Categorical features
    placement,
    device_type,
    age_group,
    gender,
    campaign_objective,
    optimization_goal,
    creative_format,
    
    -- Temporal features
    hour,
    day_of_week,
    toWeek(timestamp) as week_of_year,
    toMonth(timestamp) as month,
    if(day_of_week IN (6, 7), 1, 0) as is_weekend,
    if(hour >= 9 AND hour <= 17, 1, 0) as is_business_hours,
    
    -- Performance context
    frequency,
    reach,
    bid_amount,
    budget_remaining,
    creative_age_days,
    
    -- Competitive context
    competition_index,
    seasonal_factor,
    
    -- Historical context
    previous_ctr,
    previous_cpc,
    
    -- Derived features
    if(impressions > 0, clicks / impressions, 0) as calculated_ctr,
    if(clicks > 0, spend / clicks, 0) as calculated_cpc,
    if(impressions > 0, spend / impressions * 1000, 0) as calculated_cpm,
    
    -- Data quality
    data_quality_score
FROM aibuyer.campaign_metrics
WHERE 
    impressions > 0  -- Only records with actual impressions
    AND data_quality_score >= 0.8  -- High quality data only
    AND timestamp >= now() - INTERVAL 90 DAY;  -- Recent data for relevance

-- =============================================
-- Performance Analytics View
-- Real-time performance analytics
-- =============================================

CREATE VIEW aibuyer.performance_analytics AS
SELECT
    user_id,
    campaign_id,
    toDate(timestamp) as date,
    
    -- Daily performance
    sum(impressions) as impressions,
    sum(clicks) as clicks,
    sum(spend) as spend,
    sum(conversions) as conversions,
    
    -- Calculated metrics
    if(sum(impressions) > 0, sum(clicks) / sum(impressions), 0) as ctr,
    if(sum(clicks) > 0, sum(spend) / sum(clicks), 0) as cpc,
    if(sum(conversions) > 0, sum(spend) / sum(conversions), 0) as cost_per_conversion,
    
    -- Trend indicators (vs previous day)
    lag(sum(impressions), 1) OVER (PARTITION BY user_id, campaign_id ORDER BY toDate(timestamp)) as prev_impressions,
    lag(sum(clicks), 1) OVER (PARTITION BY user_id, campaign_id ORDER BY toDate(timestamp)) as prev_clicks,
    lag(sum(spend), 1) OVER (PARTITION BY user_id, campaign_id ORDER BY toDate(timestamp)) as prev_spend,
    
    -- Performance vs campaign average
    avg(if(impressions > 0, clicks / impressions, 0)) OVER (PARTITION BY user_id, campaign_id) as campaign_avg_ctr,
    avg(if(clicks > 0, spend / clicks, 0)) OVER (PARTITION BY user_id, campaign_id) as campaign_avg_cpc,
    
    -- Device performance breakdown
    sumIf(impressions, device_type = 'mobile') / sum(impressions) as mobile_share,
    sumIf(clicks, device_type = 'mobile') / sum(clicks) as mobile_click_share
FROM aibuyer.campaign_metrics
WHERE timestamp >= now() - INTERVAL 30 DAY
GROUP BY user_id, campaign_id, toDate(timestamp)
ORDER BY user_id, campaign_id, date;

-- =============================================
-- Anomaly Detection Table
-- Store ML-detected anomalies for monitoring
-- =============================================

CREATE TABLE aibuyer.anomalies
(
    user_id String CODEC(ZSTD(1)),
    campaign_id String CODEC(ZSTD(1)),
    detected_at DateTime DEFAULT now() CODEC(T64, ZSTD(1)),
    anomaly_type LowCardinality(String), -- 'ctr_spike', 'cpc_increase', 'conversion_drop', etc.
    
    -- Anomaly details
    metric_name String CODEC(ZSTD(1)),
    actual_value Float64 CODEC(ZSTD(1)),
    expected_value Float64 CODEC(ZSTD(1)),
    deviation_score Float64 CODEC(ZSTD(1)),
    confidence_level Float32 CODEC(ZSTD(1)),
    
    -- Context
    time_window String CODEC(ZSTD(1)), -- '1h', '1d', '7d'
    affected_period_start DateTime CODEC(T64, ZSTD(1)),
    affected_period_end DateTime CODEC(T64, ZSTD(1)),
    
    -- ML model information
    detection_model String CODEC(ZSTD(1)),
    model_version String CODEC(ZSTD(1)),
    
    -- Status
    status LowCardinality(String) DEFAULT 'detected', -- 'detected', 'investigating', 'resolved', 'false_positive'
    resolution_notes String DEFAULT '' CODEC(ZSTD(1)),
    resolved_at Nullable(DateTime) CODEC(T64, ZSTD(1)),
    
    INDEX idx_user_anomaly (user_id) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_campaign_anomaly (campaign_id) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_anomaly_type (anomaly_type) TYPE set(50) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY (user_id, toYYYYMM(detected_at))
ORDER BY (user_id, campaign_id, detected_at)
TTL detected_at + INTERVAL 6 MONTH;

-- =============================================
-- ML Model Predictions Table
-- Store model predictions for comparison with actual results
-- =============================================

CREATE TABLE aibuyer.ml_predictions
(
    user_id String CODEC(ZSTD(1)),
    campaign_id String CODEC(ZSTD(1)),
    prediction_id String CODEC(ZSTD(1)), -- UUID for tracking
    created_at DateTime DEFAULT now() CODEC(T64, ZSTD(1)),
    
    -- Prediction metadata
    model_name String CODEC(ZSTD(1)), -- 'ctr_predictor', 'budget_optimizer', etc.
    model_version String CODEC(ZSTD(1)),
    prediction_type LowCardinality(String), -- 'ctr', 'conversions', 'budget_allocation'
    
    -- Prediction period
    prediction_date Date CODEC(ZSTD(1)),
    prediction_horizon_days UInt8 CODEC(ZSTD(1)),
    
    -- Predicted values
    predicted_value Float64 CODEC(ZSTD(1)),
    confidence_lower Float64 CODEC(ZSTD(1)),
    confidence_upper Float64 CODEC(ZSTD(1)),
    confidence_level Float32 CODEC(ZSTD(1)),
    
    -- Actual values (filled in later for model evaluation)
    actual_value Nullable(Float64) CODEC(ZSTD(1)),
    prediction_error Nullable(Float64) CODEC(ZSTD(1)),
    absolute_error Nullable(Float64) CODEC(ZSTD(1)),
    
    -- Feature importance (top 5 features)
    feature_importance Map(String, Float32) CODEC(ZSTD(1)),
    
    -- Input features (for debugging)
    input_features Map(String, String) CODEC(ZSTD(1)),
    
    INDEX idx_user_pred (user_id) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_model (model_name) TYPE set(20) GRANULARITY 1,
    INDEX idx_pred_type (prediction_type) TYPE set(10) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY (user_id, toYYYYMM(created_at))
ORDER BY (user_id, model_name, created_at)
TTL created_at + INTERVAL 1 YEAR;

-- =============================================
-- Optimization History Table
-- Track budget optimization recommendations and results
-- =============================================

CREATE TABLE aibuyer.optimization_history
(
    user_id String CODEC(ZSTD(1)),
    optimization_id String CODEC(ZSTD(1)), -- UUID for tracking
    created_at DateTime DEFAULT now() CODEC(T64, ZSTD(1)),
    
    -- Optimization parameters
    total_budget Decimal64(4) CODEC(ZSTD(1)),
    optimization_goal LowCardinality(String), -- 'conversions', 'roas', 'efficiency'
    optimization_period_days UInt8 CODEC(ZSTD(1)),
    
    -- Recommendations
    campaign_recommendations Map(String, Decimal64(4)) CODEC(ZSTD(1)), -- campaign_id -> recommended_budget
    expected_improvement_percent Float32 CODEC(ZSTD(1)),
    confidence_score Float32 CODEC(ZSTD(1)),
    
    -- Implementation status
    status LowCardinality(String) DEFAULT 'pending', -- 'pending', 'implemented', 'partially_implemented', 'rejected'
    implemented_at Nullable(DateTime) CODEC(T64, ZSTD(1)),
    implementation_notes String DEFAULT '' CODEC(ZSTD(1)),
    
    -- Results (filled in after implementation period)
    actual_improvement_percent Nullable(Float32) CODEC(ZSTD(1)),
    actual_total_conversions Nullable(UInt32) CODEC(ZSTD(1)),
    actual_total_spend Nullable(Decimal64(4)) CODEC(ZSTD(1)),
    optimization_success Nullable(UInt8) CODEC(ZSTD(1)), -- 1 if successful, 0 if not
    
    -- Model information
    optimization_model String CODEC(ZSTD(1)),
    model_version String CODEC(ZSTD(1)),
    
    INDEX idx_user_opt (user_id) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_opt_status (status) TYPE set(10) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY (user_id, toYYYYMM(created_at))
ORDER BY (user_id, created_at)
TTL created_at + INTERVAL 2 YEAR;

-- =============================================
-- Indexes for Query Optimization
-- Additional indexes for common query patterns
-- =============================================

-- Index for time-range queries by user
ALTER TABLE aibuyer.campaign_metrics ADD INDEX idx_user_time (user_id, timestamp) TYPE minmax GRANULARITY 1;

-- Index for campaign performance queries
ALTER TABLE aibuyer.campaign_metrics ADD INDEX idx_campaign_perf (campaign_id, ctr, cpc) TYPE minmax GRANULARITY 1;

-- Index for device-specific queries
ALTER TABLE aibuyer.campaign_metrics ADD INDEX idx_device_time (device_type, timestamp) TYPE minmax GRANULARITY 1;

-- =============================================
-- Performance Optimization Settings
-- =============================================

-- Optimize table for better compression and query performance
OPTIMIZE TABLE aibuyer.campaign_metrics FINAL;
OPTIMIZE TABLE aibuyer.campaign_metrics_hourly FINAL;
OPTIMIZE TABLE aibuyer.campaign_metrics_daily FINAL;

-- =============================================
-- Sample Queries for Validation
-- =============================================

-- Test query: User's campaign performance for last 7 days
-- SELECT 
--     campaign_id,
--     sum(impressions) as total_impressions,
--     sum(clicks) as total_clicks,
--     sum(spend) as total_spend,
--     sum(conversions) as total_conversions,
--     avg(ctr) as avg_ctr,
--     avg(cpc) as avg_cpc
-- FROM aibuyer.campaign_metrics
-- WHERE user_id = 'user_123' 
--   AND timestamp >= now() - INTERVAL 7 DAY
-- GROUP BY campaign_id
-- ORDER BY total_spend DESC;

-- Test query: Hourly performance trends
-- SELECT 
--     hour,
--     sum(total_impressions) as impressions,
--     sum(total_clicks) as clicks,
--     avg(avg_ctr) as ctr
-- FROM aibuyer.campaign_metrics_hourly
-- WHERE user_id = 'user_123'
--   AND hour >= today() - INTERVAL 1 DAY
-- GROUP BY hour
-- ORDER BY hour;