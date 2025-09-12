"""
Budget Optimization Model using Prophet and Optimization Algorithms
Advanced time series forecasting and budget allocation optimization for Facebook campaigns
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from scipy.optimize import minimize, differential_evolution
import mlflow
import mlflow.sklearn
import pickle
import os

# Prophet for time series forecasting
from prophet import Prophet

logger = logging.getLogger(__name__)

class BudgetOptimizer:
    """
    Budget optimization using Prophet forecasting and mathematical optimization
    Optimizes budget allocation across multiple Facebook campaigns
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.prophet_models = {}
        self.optimization_history = []
        self.is_trained = False
        
        # Optimization parameters
        self.min_budget_percentage = 0.05  # Minimum 5% of total budget per campaign
        self.max_budget_percentage = 0.50  # Maximum 50% of total budget per campaign
        self.forecast_horizon_days = 7
        
        # MLflow configuration
        self.experiment_name = f"budget_optimization_{user_id}"
        self._setup_mlflow()
    
    def _setup_mlflow(self):
        """Setup MLflow experiment for tracking"""
        try:
            mlflow.set_experiment(self.experiment_name)
            logger.info(f"MLflow experiment set: {self.experiment_name}")
        except Exception as e:
            logger.error(f"Failed to setup MLflow experiment: {e}")
    
    def prepare_time_series_data(self, historical_data: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """
        Prepare time series data for Prophet models
        
        Args:
            historical_data: DataFrame with campaign metrics over time
            
        Returns:
            Dictionary of prepared data per campaign
        """
        logger.info("Preparing time series data for Prophet models")
        
        campaign_data = {}
        
        # Group by campaign and prepare Prophet format
        for campaign_id in historical_data['campaign_id'].unique():
            campaign_df = historical_data[
                historical_data['campaign_id'] == campaign_id
            ].copy()
            
            # Sort by timestamp
            campaign_df = campaign_df.sort_values('timestamp')
            
            # Create daily aggregations if data is more granular
            if len(campaign_df) > 100:  # If more than 100 data points, aggregate daily
                campaign_df = campaign_df.groupby(
                    campaign_df['timestamp'].dt.date
                ).agg({
                    'conversions': 'sum',
                    'spend': 'sum',
                    'clicks': 'sum',
                    'impressions': 'sum'
                }).reset_index()
                campaign_df['timestamp'] = pd.to_datetime(campaign_df['timestamp'])
            
            # Prepare Prophet format: ds (date) and y (target variable)
            prophet_data = pd.DataFrame({
                'ds': campaign_df['timestamp'],
                'y': campaign_df['conversions'],  # Predict conversions
                'spend': campaign_df['spend'],
                'clicks': campaign_df['clicks'],
                'impressions': campaign_df['impressions']
            })
            
            # Remove outliers (conversions > 3 standard deviations)
            mean_conv = prophet_data['y'].mean()
            std_conv = prophet_data['y'].std()
            prophet_data = prophet_data[
                np.abs(prophet_data['y'] - mean_conv) <= 3 * std_conv
            ]
            
            # Ensure minimum data points
            if len(prophet_data) >= 10:
                campaign_data[campaign_id] = prophet_data
            else:
                logger.warning(f"Insufficient data for campaign {campaign_id}: {len(prophet_data)} points")
        
        return campaign_data
    
    def train_prophet_models(self, campaign_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """
        Train Prophet models for each campaign
        
        Args:
            campaign_data: Dictionary of prepared time series data per campaign
            
        Returns:
            Training results and model performance metrics
        """
        logger.info(f"Training Prophet models for {len(campaign_data)} campaigns")
        
        training_results = {
            "user_id": self.user_id,
            "campaigns_trained": 0,
            "failed_campaigns": [],
            "model_performance": {}
        }
        
        with mlflow.start_run():
            for campaign_id, data in campaign_data.items():
                try:
                    logger.info(f"Training Prophet model for campaign {campaign_id}")
                    
                    # Create Prophet model with custom configuration
                    model = Prophet(
                        daily_seasonality=True,
                        weekly_seasonality=True,
                        yearly_seasonality=False,  # Not enough data typically
                        changepoint_prior_scale=0.05,  # Detect trend changes
                        seasonality_prior_scale=10,    # Strong seasonality
                        holidays_prior_scale=10,       # Consider holidays
                        interval_width=0.8,            # 80% confidence intervals
                        uncertainty_samples=200
                    )
                    
                    # Add additional regressors if available
                    if 'spend' in data.columns:
                        model.add_regressor('spend')
                    if 'clicks' in data.columns:
                        model.add_regressor('clicks')
                    
                    # Train model
                    model.fit(data)
                    
                    # Validate model with cross-validation
                    if len(data) >= 30:  # Need enough data for CV
                        from prophet.diagnostics import cross_validation, performance_metrics
                        
                        cv_results = cross_validation(
                            model, 
                            initial='15 days', 
                            period='7 days', 
                            horizon='7 days'
                        )
                        performance = performance_metrics(cv_results)
                        
                        # Store performance metrics
                        training_results["model_performance"][campaign_id] = {
                            "mape": float(performance['mape'].mean()),
                            "rmse": float(performance['rmse'].mean()),
                            "mae": float(performance['mae'].mean()),
                            "training_points": len(data),
                            "cv_periods": len(cv_results)
                        }
                    else:
                        training_results["model_performance"][campaign_id] = {
                            "mape": None,
                            "rmse": None,
                            "mae": None,
                            "training_points": len(data),
                            "cv_periods": 0,
                            "note": "Insufficient data for cross-validation"
                        }
                    
                    # Store model
                    self.prophet_models[campaign_id] = model
                    training_results["campaigns_trained"] += 1
                    
                    logger.info(f"Successfully trained model for campaign {campaign_id}")
                    
                except Exception as e:
                    logger.error(f"Failed to train model for campaign {campaign_id}: {e}")
                    training_results["failed_campaigns"].append({
                        "campaign_id": campaign_id,
                        "error": str(e)
                    })
            
            # Log training results to MLflow
            mlflow.log_params({
                "user_id": self.user_id,
                "total_campaigns": len(campaign_data),
                "successfully_trained": training_results["campaigns_trained"],
                "failed_campaigns": len(training_results["failed_campaigns"]),
                "forecast_horizon_days": self.forecast_horizon_days
            })
            
            # Save models
            models_path = f"prophet_models_{self.user_id}"
            os.makedirs(models_path, exist_ok=True)
            
            for campaign_id, model in self.prophet_models.items():
                with open(f"{models_path}/{campaign_id}_prophet.pkl", 'wb') as f:
                    pickle.dump(model, f)
            
            mlflow.log_artifacts(models_path)
            
            self.is_trained = True
            training_results["trained_at"] = datetime.now().isoformat()
            
            return training_results
    
    def forecast_campaign_performance(self, campaign_id: str, 
                                    budget_allocation: float,
                                    external_factors: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Forecast campaign performance for given budget allocation
        
        Args:
            campaign_id: Campaign identifier
            budget_allocation: Allocated budget for the campaign
            external_factors: Additional factors (seasonality, competition, etc.)
            
        Returns:
            Forecasted performance metrics
        """
        if campaign_id not in self.prophet_models:
            return {
                "error": f"No trained model for campaign {campaign_id}",
                "forecasted_conversions": 0,
                "confidence_interval": [0, 0]
            }
        
        try:
            model = self.prophet_models[campaign_id]
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=self.forecast_horizon_days)
            
            # Add regressor values if available
            if 'spend' in future.columns:
                # Distribute budget evenly across forecast period
                daily_spend = budget_allocation / self.forecast_horizon_days
                future['spend'] = daily_spend
            
            # Add external factors
            if external_factors:
                for factor, value in external_factors.items():
                    if factor in future.columns:
                        future[factor] = value
            
            # Generate forecast
            forecast = model.predict(future)
            
            # Extract forecast for the future period only
            future_forecast = forecast.tail(self.forecast_horizon_days)
            
            forecasted_conversions = future_forecast['yhat'].sum()
            lower_bound = future_forecast['yhat_lower'].sum()
            upper_bound = future_forecast['yhat_upper'].sum()
            
            return {
                "campaign_id": campaign_id,
                "budget_allocation": budget_allocation,
                "forecasted_conversions": float(forecasted_conversions),
                "confidence_interval": [float(lower_bound), float(upper_bound)],
                "daily_forecast": future_forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records'),
                "forecast_period_days": self.forecast_horizon_days
            }
            
        except Exception as e:
            logger.error(f"Forecasting failed for campaign {campaign_id}: {e}")
            return {
                "error": str(e),
                "forecasted_conversions": 0,
                "confidence_interval": [0, 0]
            }
    
    def optimize_budget_allocation(self, 
                                 campaigns: List[Dict[str, Any]], 
                                 total_budget: float,
                                 optimization_goal: str = "conversions",
                                 constraints: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Optimize budget allocation across campaigns
        
        Args:
            campaigns: List of campaign information
            total_budget: Total budget to allocate
            optimization_goal: Goal to optimize (conversions, roas, clicks)
            constraints: Additional constraints for optimization
            
        Returns:
            Optimized budget allocation recommendations
        """
        logger.info(f"Optimizing budget allocation for {len(campaigns)} campaigns")
        
        if not self.is_trained:
            return {
                "error": "Models not trained yet",
                "recommendations": []
            }
        
        campaign_ids = [c['campaign_id'] for c in campaigns]
        
        # Filter campaigns that have trained models
        valid_campaigns = [
            c for c in campaigns 
            if c['campaign_id'] in self.prophet_models
        ]
        
        if not valid_campaigns:
            return {
                "error": "No valid trained models for provided campaigns",
                "recommendations": []
            }
        
        def objective_function(budget_allocations: np.ndarray) -> float:
            """Objective function to maximize (returns negative value for minimization)"""
            total_objective_value = 0
            
            for i, campaign in enumerate(valid_campaigns):
                campaign_id = campaign['campaign_id']
                budget = budget_allocations[i]
                
                # Get forecast for this budget allocation
                forecast = self.forecast_campaign_performance(campaign_id, budget)
                
                if optimization_goal == "conversions":
                    objective_value = forecast.get("forecasted_conversions", 0)
                elif optimization_goal == "roas":
                    conversions = forecast.get("forecasted_conversions", 0)
                    # Assume average conversion value (should be configurable)
                    avg_conversion_value = campaign.get("avg_conversion_value", 25.0)
                    revenue = conversions * avg_conversion_value
                    objective_value = revenue / budget if budget > 0 else 0
                elif optimization_goal == "efficiency":
                    # Cost per conversion
                    conversions = forecast.get("forecasted_conversions", 0)
                    objective_value = conversions / budget if budget > 0 else 0
                else:
                    objective_value = forecast.get("forecasted_conversions", 0)
                
                total_objective_value += objective_value
            
            return -total_objective_value  # Negative for minimization
        
        # Set up constraints
        def budget_constraint(budget_allocations):
            return total_budget - np.sum(budget_allocations)
        
        # Individual campaign budget bounds
        bounds = []
        for campaign in valid_campaigns:
            min_budget = total_budget * self.min_budget_percentage
            max_budget = total_budget * self.max_budget_percentage
            
            # Apply custom constraints if provided
            if constraints and campaign['campaign_id'] in constraints:
                campaign_constraints = constraints[campaign['campaign_id']]
                min_budget = max(min_budget, campaign_constraints.get('min_budget', min_budget))
                max_budget = min(max_budget, campaign_constraints.get('max_budget', max_budget))
            
            bounds.append((min_budget, max_budget))
        
        # Initial guess: equal distribution
        initial_allocation = np.array([total_budget / len(valid_campaigns)] * len(valid_campaigns))
        
        # Optimization constraints
        constraints_list = [
            {'type': 'eq', 'fun': budget_constraint}
        ]
        
        try:
            # Use differential evolution for global optimization
            result = differential_evolution(
                objective_function,
                bounds,
                maxiter=100,
                seed=42,
                atol=1e-6,
                popsize=15
            )
            
            if not result.success:
                # Fallback to SLSQP if differential evolution fails
                result = minimize(
                    objective_function,
                    initial_allocation,
                    method='SLSQP',
                    bounds=bounds,
                    constraints=constraints_list
                )
            
            optimized_allocations = result.x
            
            # Generate recommendations
            recommendations = []
            total_predicted_conversions = 0
            
            for i, campaign in enumerate(valid_campaigns):
                current_budget = campaign.get('current_budget', 0)
                recommended_budget = optimized_allocations[i]
                
                # Get detailed forecast for recommended budget
                forecast = self.forecast_campaign_performance(
                    campaign['campaign_id'], 
                    recommended_budget
                )
                
                change_percentage = (
                    (recommended_budget - current_budget) / current_budget * 100
                    if current_budget > 0 else 0
                )
                
                recommendations.append({
                    "campaign_id": campaign['campaign_id'],
                    "campaign_name": campaign.get('campaign_name', 'Unknown'),
                    "current_budget": current_budget,
                    "recommended_budget": round(recommended_budget, 2),
                    "change_percentage": round(change_percentage, 2),
                    "predicted_conversions": forecast.get("forecasted_conversions", 0),
                    "confidence_interval": forecast.get("confidence_interval", [0, 0]),
                    "daily_forecast": forecast.get("daily_forecast", [])
                })
                
                total_predicted_conversions += forecast.get("forecasted_conversions", 0)
            
            # Calculate expected improvement
            baseline_conversions = sum([
                self.forecast_campaign_performance(c['campaign_id'], c.get('current_budget', 0))
                .get("forecasted_conversions", 0)
                for c in valid_campaigns
            ])
            
            improvement_percentage = (
                (total_predicted_conversions - baseline_conversions) / baseline_conversions * 100
                if baseline_conversions > 0 else 0
            )
            
            optimization_result = {
                "user_id": self.user_id,
                "optimization_goal": optimization_goal,
                "total_budget": total_budget,
                "recommendations": recommendations,
                "expected_improvement": {
                    "total_predicted_conversions": round(total_predicted_conversions, 2),
                    "baseline_conversions": round(baseline_conversions, 2),
                    "improvement_percentage": round(improvement_percentage, 2)
                },
                "optimization_success": result.success,
                "optimization_iterations": getattr(result, 'nit', 0),
                "confidence_score": 0.8,  # Simplified confidence score
                "optimized_at": datetime.now().isoformat()
            }
            
            # Store optimization history
            self.optimization_history.append(optimization_result)
            
            return optimization_result
            
        except Exception as e:
            logger.error(f"Budget optimization failed: {e}")
            return {
                "error": str(e),
                "recommendations": [],
                "user_id": self.user_id
            }
    
    def load_models(self, model_run_id: Optional[str] = None):
        """Load trained Prophet models from MLflow"""
        try:
            if model_run_id is None:
                # Get latest run from experiment
                experiment = mlflow.get_experiment_by_name(self.experiment_name)
                if experiment is None:
                    raise Exception(f"No experiment found: {self.experiment_name}")
                
                runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id])
                if runs.empty:
                    raise Exception(f"No runs found in experiment: {self.experiment_name}")
                
                model_run_id = runs.iloc[0]['run_id']
            
            # Download model artifacts
            artifacts_uri = f"runs:/{model_run_id}/prophet_models_{self.user_id}"
            artifacts_path = mlflow.artifacts.download_artifacts(artifacts_uri)
            
            # Load individual Prophet models
            self.prophet_models = {}
            for filename in os.listdir(artifacts_path):
                if filename.endswith('_prophet.pkl'):
                    campaign_id = filename.replace('_prophet.pkl', '')
                    with open(os.path.join(artifacts_path, filename), 'rb') as f:
                        self.prophet_models[campaign_id] = pickle.load(f)
            
            self.is_trained = True
            logger.info(f"Loaded {len(self.prophet_models)} Prophet models for user {self.user_id}")
            
        except Exception as e:
            logger.error(f"Failed to load models for user {self.user_id}: {e}")
            raise
    
    def get_optimization_history(self) -> List[Dict[str, Any]]:
        """Get history of budget optimizations"""
        return self.optimization_history
    
    def analyze_campaign_trends(self, campaign_id: str, days_back: int = 30) -> Dict[str, Any]:
        """Analyze trends for a specific campaign"""
        if campaign_id not in self.prophet_models:
            return {"error": f"No model available for campaign {campaign_id}"}
        
        try:
            model = self.prophet_models[campaign_id]
            
            # Create historical and future periods for analysis
            past_periods = pd.date_range(
                start=datetime.now() - timedelta(days=days_back),
                end=datetime.now(),
                freq='D'
            )
            
            historical_df = pd.DataFrame({'ds': past_periods})
            historical_forecast = model.predict(historical_df)
            
            # Calculate trend metrics
            trend_data = historical_forecast[['ds', 'trend', 'yhat']].tail(days_back)
            
            # Calculate trend direction and strength
            trend_slope = np.polyfit(range(len(trend_data)), trend_data['trend'], 1)[0]
            trend_direction = "increasing" if trend_slope > 0 else "decreasing"
            trend_strength = abs(trend_slope)
            
            return {
                "campaign_id": campaign_id,
                "analysis_period_days": days_back,
                "trend_direction": trend_direction,
                "trend_strength": float(trend_strength),
                "average_daily_conversions": float(trend_data['yhat'].mean()),
                "trend_data": trend_data.to_dict('records'),
                "analyzed_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Trend analysis failed for campaign {campaign_id}: {e}")
            return {"error": str(e)}