"""
Feature Engineering Pipeline for Facebook Advertising Data
Advanced feature extraction and transformation for ML models
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from sklearn.preprocessing import StandardScaler, RobustScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import holidays

logger = logging.getLogger(__name__)

class FacebookAdFeatureEngineer:
    """
    Comprehensive feature engineering for Facebook advertising data
    Creates features optimized for CTR prediction and budget optimization
    """
    
    def __init__(self, country_code: str = 'US'):
        self.country_code = country_code
        self.encoders = {}
        self.scalers = {}
        self.holidays = holidays.country_holidays(country_code)
        self.feature_cache = {}
        
    def engineer_temporal_features(self, df: pd.DataFrame, timestamp_col: str = 'timestamp') -> pd.DataFrame:
        """
        Create temporal features from timestamp
        
        Args:
            df: Input dataframe
            timestamp_col: Name of timestamp column
            
        Returns:
            DataFrame with additional temporal features
        """
        logger.info("Engineering temporal features")
        
        df = df.copy()
        df[timestamp_col] = pd.to_datetime(df[timestamp_col])
        
        # Basic time features
        df['hour'] = df[timestamp_col].dt.hour
        df['day_of_week'] = df[timestamp_col].dt.dayofweek
        df['day_of_month'] = df[timestamp_col].dt.day
        df['month'] = df[timestamp_col].dt.month
        df['quarter'] = df[timestamp_col].dt.quarter
        df['week_of_year'] = df[timestamp_col].dt.isocalendar().week
        
        # Cyclical encoding for temporal features
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        # Business logic features
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        df['is_business_hours'] = ((df['hour'] >= 9) & (df['hour'] <= 17)).astype(int)
        df['is_evening'] = ((df['hour'] >= 18) & (df['hour'] <= 22)).astype(int)
        df['is_night'] = ((df['hour'] >= 23) | (df['hour'] <= 5)).astype(int)
        
        # Holiday features
        df['is_holiday'] = df[timestamp_col].dt.date.apply(
            lambda x: x in self.holidays
        ).astype(int)
        
        # Days before/after holiday
        df['days_to_holiday'] = df[timestamp_col].apply(self._days_to_next_holiday)
        df['days_from_holiday'] = df[timestamp_col].apply(self._days_from_last_holiday)
        
        # Season features
        df['season'] = df['month'].apply(self._get_season)
        
        # Campaign age features
        if 'campaign_start_date' in df.columns:
            df['campaign_age_days'] = (
                df[timestamp_col] - pd.to_datetime(df['campaign_start_date'])
            ).dt.days
            df['campaign_age_weeks'] = df['campaign_age_days'] / 7
            df['is_new_campaign'] = (df['campaign_age_days'] <= 7).astype(int)
        
        return df
    
    def engineer_performance_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create performance-based features
        
        Args:
            df: Input dataframe with basic metrics
            
        Returns:
            DataFrame with additional performance features
        """
        logger.info("Engineering performance features")
        
        df = df.copy()
        
        # Basic calculated metrics
        df['ctr'] = np.where(df['impressions'] > 0, df['clicks'] / df['impressions'], 0)
        df['cpc'] = np.where(df['clicks'] > 0, df['spend'] / df['clicks'], 0)
        df['cpm'] = np.where(df['impressions'] > 0, df['spend'] / df['impressions'] * 1000, 0)
        df['conversion_rate'] = np.where(df['clicks'] > 0, df['conversions'] / df['clicks'], 0)
        df['cost_per_conversion'] = np.where(df['conversions'] > 0, df['spend'] / df['conversions'], 0)
        
        # Advanced performance metrics
        df['engagement_rate'] = np.where(
            df['impressions'] > 0,
            (df.get('likes', 0) + df.get('shares', 0) + df.get('comments', 0)) / df['impressions'],
            0
        )
        
        # Efficiency ratios
        df['clicks_per_impression'] = df['ctr']
        df['spend_efficiency'] = np.where(df['spend'] > 0, df['conversions'] / df['spend'], 0)
        df['impression_efficiency'] = np.where(df['impressions'] > 0, df['conversions'] / df['impressions'], 0)
        
        # Frequency and reach features
        if 'frequency' in df.columns and 'reach' in df.columns:
            df['frequency_capped'] = np.minimum(df['frequency'], 10)  # Cap at 10 for outliers
            df['reach_percentage'] = df['reach'] / df.get('audience_size', df['reach'])
            df['impression_reach_ratio'] = np.where(df['reach'] > 0, df['impressions'] / df['reach'], 0)
        
        # Budget utilization features
        if 'budget' in df.columns:
            df['budget_utilization'] = np.where(df['budget'] > 0, df['spend'] / df['budget'], 0)
            df['remaining_budget'] = df['budget'] - df['spend']
            df['remaining_budget_percentage'] = np.where(
                df['budget'] > 0, df['remaining_budget'] / df['budget'], 0
            )
        
        return df
    
    def engineer_competitive_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create features related to competitive landscape
        
        Args:
            df: Input dataframe
            
        Returns:
            DataFrame with competitive features
        """
        logger.info("Engineering competitive features")
        
        df = df.copy()
        
        # Group by audience and time to create competitive metrics
        if 'audience_id' in df.columns:
            # Competition intensity by audience
            audience_stats = df.groupby(['audience_id', 'hour']).agg({
                'impressions': 'sum',
                'spend': 'sum',
                'campaign_id': 'nunique'
            }).rename(columns={'campaign_id': 'competing_campaigns'})
            
            df = df.merge(
                audience_stats,
                on=['audience_id', 'hour'],
                how='left',
                suffixes=('', '_audience_total')
            )
            
            df['audience_share_impressions'] = np.where(
                df['impressions_audience_total'] > 0,
                df['impressions'] / df['impressions_audience_total'],
                0
            )
            df['audience_share_spend'] = np.where(
                df['spend_audience_total'] > 0,
                df['spend'] / df['spend_audience_total'],
                0
            )
        
        # Market saturation features
        if 'placement' in df.columns:
            placement_stats = df.groupby(['placement', 'hour']).agg({
                'impressions': 'mean',
                'cpc': 'mean',
                'ctr': 'mean'
            }).add_suffix('_placement_avg')
            
            df = df.merge(
                placement_stats,
                on=['placement', 'hour'],
                how='left'
            )
            
            # Relative performance vs placement average
            df['ctr_vs_placement_avg'] = df['ctr'] / (df['ctr_placement_avg'] + 1e-6)
            df['cpc_vs_placement_avg'] = df['cpc'] / (df['cpc_placement_avg'] + 1e-6)
        
        return df
    
    def engineer_audience_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create audience-related features
        
        Args:
            df: Input dataframe
            
        Returns:
            DataFrame with audience features
        """
        logger.info("Engineering audience features")
        
        df = df.copy()
        
        # Age group features
        if 'age_min' in df.columns and 'age_max' in df.columns:
            df['age_range'] = df['age_max'] - df['age_min']
            df['age_midpoint'] = (df['age_min'] + df['age_max']) / 2
            df['is_young_audience'] = (df['age_midpoint'] <= 25).astype(int)
            df['is_mature_audience'] = (df['age_midpoint'] >= 45).astype(int)
        
        # Gender distribution features
        if 'gender_distribution' in df.columns:
            # Assuming gender_distribution is a JSON or dict with male/female percentages
            df['gender_balance'] = abs(0.5 - df.get('female_percentage', 0.5))
            df['is_gender_balanced'] = (df['gender_balance'] <= 0.1).astype(int)
        
        # Interest relevance features
        if 'interests' in df.columns:
            # Number of interests targeted
            df['num_interests'] = df['interests'].apply(
                lambda x: len(x.split(',')) if isinstance(x, str) else 0
            )
            df['has_specific_interests'] = (df['num_interests'] > 0).astype(int)
            df['interest_diversity'] = np.log1p(df['num_interests'])
        
        # Geographic features
        if 'country' in df.columns:
            # Major market indicators
            major_markets = ['US', 'GB', 'CA', 'AU', 'DE', 'FR']
            df['is_major_market'] = df['country'].isin(major_markets).astype(int)
            
        if 'city' in df.columns:
            # Urban vs rural approximation (simplified)
            major_cities = [
                'New York', 'Los Angeles', 'London', 'Toronto', 'Sydney',
                'Berlin', 'Paris', 'Tokyo', 'Seoul', 'Singapore'
            ]
            df['is_major_city'] = df['city'].isin(major_cities).astype(int)
        
        # Device and platform features
        if 'device_platform' in df.columns:
            df['is_mobile'] = df['device_platform'].str.contains('mobile|android|ios', case=False, na=False).astype(int)
            df['is_desktop'] = df['device_platform'].str.contains('desktop|windows|mac', case=False, na=False).astype(int)
        
        return df
    
    def engineer_creative_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create creative and ad format features
        
        Args:
            df: Input dataframe
            
        Returns:
            DataFrame with creative features
        """
        logger.info("Engineering creative features")
        
        df = df.copy()
        
        # Ad format features
        if 'ad_format' in df.columns:
            df['is_video'] = df['ad_format'].str.contains('video', case=False, na=False).astype(int)
            df['is_carousel'] = df['ad_format'].str.contains('carousel', case=False, na=False).astype(int)
            df['is_single_image'] = df['ad_format'].str.contains('single_image|image', case=False, na=False).astype(int)
            df['is_collection'] = df['ad_format'].str.contains('collection', case=False, na=False).astype(int)
        
        # Creative freshness
        if 'creative_created_date' in df.columns:
            df['creative_age_days'] = (
                pd.to_datetime(df['timestamp']) - pd.to_datetime(df['creative_created_date'])
            ).dt.days
            df['is_fresh_creative'] = (df['creative_age_days'] <= 7).astype(int)
            df['creative_fatigue_score'] = np.minimum(df['creative_age_days'] / 30, 1.0)
        
        # Text analysis features
        if 'ad_text' in df.columns:
            df['text_length'] = df['ad_text'].str.len().fillna(0)
            df['has_emoji'] = df['ad_text'].str.contains(r'[^\w\s]', na=False).astype(int)
            df['has_call_to_action'] = df['ad_text'].str.contains(
                r'buy|shop|learn|sign up|download|get|try', case=False, na=False
            ).astype(int)
            df['text_word_count'] = df['ad_text'].str.split().str.len().fillna(0)
            
            # Sentiment approximation (simplified)
            positive_words = ['great', 'amazing', 'best', 'love', 'perfect', 'excellent']
            negative_words = ['bad', 'worst', 'hate', 'terrible', 'awful']
            
            df['positive_sentiment_score'] = df['ad_text'].str.count(
                '|'.join(positive_words), case=False
            ).fillna(0)
            df['negative_sentiment_score'] = df['ad_text'].str.count(
                '|'.join(negative_words), case=False
            ).fillna(0)
            df['sentiment_balance'] = df['positive_sentiment_score'] - df['negative_sentiment_score']
        
        return df
    
    def engineer_lag_features(self, df: pd.DataFrame, 
                            group_by_cols: List[str] = ['campaign_id'],
                            lag_periods: List[int] = [1, 3, 7]) -> pd.DataFrame:
        """
        Create lag features for time series patterns
        
        Args:
            df: Input dataframe
            group_by_cols: Columns to group by for lag calculation
            lag_periods: List of lag periods to create
            
        Returns:
            DataFrame with lag features
        """
        logger.info("Engineering lag features")
        
        df = df.copy()
        df = df.sort_values(group_by_cols + ['timestamp'])
        
        # Metrics to create lags for
        lag_metrics = ['ctr', 'cpc', 'conversions', 'spend', 'impressions', 'clicks']
        
        for metric in lag_metrics:
            if metric in df.columns:
                for lag in lag_periods:
                    # Lag features
                    lag_col = f'{metric}_lag_{lag}'
                    df[lag_col] = df.groupby(group_by_cols)[metric].shift(lag)
                    
                    # Moving averages
                    ma_col = f'{metric}_ma_{lag}'
                    df[ma_col] = df.groupby(group_by_cols)[metric].rolling(
                        window=lag, min_periods=1
                    ).mean().reset_index(level=group_by_cols, drop=True)
                    
                    # Percentage change
                    if lag == 1:
                        pct_change_col = f'{metric}_pct_change'
                        df[pct_change_col] = df.groupby(group_by_cols)[metric].pct_change()
        
        # Trend features
        for metric in ['ctr', 'conversions']:
            if metric in df.columns:
                # 7-day trend
                trend_col = f'{metric}_trend_7d'
                df[trend_col] = df.groupby(group_by_cols)[metric].rolling(
                    window=7, min_periods=3
                ).apply(lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) >= 3 else 0).reset_index(level=group_by_cols, drop=True)
        
        return df
    
    def engineer_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create interaction features between important variables
        
        Args:
            df: Input dataframe
            
        Returns:
            DataFrame with interaction features
        """
        logger.info("Engineering interaction features")
        
        df = df.copy()
        
        # Time-based interactions
        if all(col in df.columns for col in ['hour', 'day_of_week']):
            df['hour_dayofweek_interaction'] = df['hour'] * df['day_of_week']
        
        # Performance interactions
        if all(col in df.columns for col in ['ctr', 'frequency']):
            df['ctr_frequency_interaction'] = df['ctr'] * df['frequency']
        
        if all(col in df.columns for col in ['bid_amount', 'cpc']):
            df['bid_cpc_ratio'] = np.where(df['cpc'] > 0, df['bid_amount'] / df['cpc'], 0)
        
        # Audience-creative interactions
        if all(col in df.columns for col in ['age_midpoint', 'is_video']):
            df['age_video_interaction'] = df['age_midpoint'] * df['is_video']
        
        if all(col in df.columns for col in ['is_mobile', 'creative_age_days']):
            df['mobile_creative_freshness'] = df['is_mobile'] * (1 / (1 + df['creative_age_days']))
        
        # Budget-performance interactions
        if all(col in df.columns for col in ['budget_utilization', 'ctr']):
            df['budget_performance_interaction'] = df['budget_utilization'] * df['ctr']
        
        return df
    
    def create_feature_pipeline(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Complete feature engineering pipeline
        
        Args:
            df: Raw input dataframe
            
        Returns:
            DataFrame with all engineered features
        """
        logger.info("Running complete feature engineering pipeline")
        
        # Apply all feature engineering steps
        df = self.engineer_temporal_features(df)
        df = self.engineer_performance_features(df)
        df = self.engineer_competitive_features(df)
        df = self.engineer_audience_features(df)
        df = self.engineer_creative_features(df)
        df = self.engineer_lag_features(df)
        df = self.engineer_interaction_features(df)
        
        # Handle missing values
        df = self._handle_missing_values(df)
        
        # Remove highly correlated features
        df = self._remove_correlated_features(df)
        
        logger.info(f"Feature engineering completed. Final shape: {df.shape}")
        return df
    
    def _days_to_next_holiday(self, date: datetime) -> int:
        """Calculate days to next holiday"""
        current_year_holidays = [h for h in self.holidays if h.year == date.year and h >= date.date()]
        next_year_holidays = [h for h in self.holidays if h.year == date.year + 1]
        
        all_future_holidays = current_year_holidays + next_year_holidays[:5]  # Include first 5 of next year
        
        if all_future_holidays:
            next_holiday = min(all_future_holidays)
            return (next_holiday - date.date()).days
        return 365  # Default if no holidays found
    
    def _days_from_last_holiday(self, date: datetime) -> int:
        """Calculate days from last holiday"""
        current_year_holidays = [h for h in self.holidays if h.year == date.year and h <= date.date()]
        last_year_holidays = [h for h in self.holidays if h.year == date.year - 1]
        
        all_past_holidays = last_year_holidays[-5:] + current_year_holidays  # Include last 5 of previous year
        
        if all_past_holidays:
            last_holiday = max(all_past_holidays)
            return (date.date() - last_holiday).days
        return 365  # Default if no holidays found
    
    def _get_season(self, month: int) -> str:
        """Get season from month"""
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        else:
            return 'fall'
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in engineered features"""
        # Fill numeric columns with median
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        for col in numeric_columns:
            if df[col].isnull().any():
                df[col].fillna(df[col].median(), inplace=True)
        
        # Fill categorical columns with mode
        categorical_columns = df.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            if df[col].isnull().any():
                df[col].fillna(df[col].mode().iloc[0] if not df[col].mode().empty else 'unknown', inplace=True)
        
        return df
    
    def _remove_correlated_features(self, df: pd.DataFrame, threshold: float = 0.95) -> pd.DataFrame:
        """Remove highly correlated features to reduce multicollinearity"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        # Calculate correlation matrix
        corr_matrix = numeric_df.corr().abs()
        
        # Find pairs of highly correlated features
        upper_triangle = corr_matrix.where(
            np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        )
        
        # Find features to drop
        to_drop = [column for column in upper_triangle.columns if any(upper_triangle[column] > threshold)]
        
        if to_drop:
            logger.info(f"Removing {len(to_drop)} highly correlated features: {to_drop}")
            df = df.drop(columns=to_drop)
        
        return df