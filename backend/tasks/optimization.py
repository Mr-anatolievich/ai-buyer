"""
Optimization Tasks for AI-Buyer Celery
Handles budget optimization and campaign performance optimization
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from celery import Task

from backend.tasks import celery_app, TaskConfig
from backend.ml.models.budget_optimizer import BudgetOptimizer

logger = logging.getLogger(__name__)

class OptimizationTask(Task, TaskConfig):
    """Base class for optimization tasks"""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure"""
        logger.error(f"Optimization task {task_id} failed: {exc}")

@celery_app.task(base=OptimizationTask, bind=True)
def optimize_user_budget(self, user_id: str, optimization_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Optimize budget allocation for a specific user
    
    Args:
        user_id: User identifier
        optimization_config: Optimization parameters
        
    Returns:
        Optimization results and recommendations
    """
    try:
        self.update_state(state='PROGRESS', meta={'status': 'Initializing budget optimization'})
        
        logger.info(f"Starting budget optimization for user {user_id}")
        start_time = time.time()
        
        # Initialize optimizer
        optimizer = BudgetOptimizer()
        
        # Update state
        self.update_state(state='PROGRESS', meta={'status': 'Loading user campaigns'})
        
        # Load user's active campaigns (this would query the database)
        campaigns = _load_user_campaigns(user_id)
        
        if not campaigns:
            return {
                'status': 'no_campaigns',
                'user_id': user_id,
                'message': 'No active campaigns found for optimization'
            }
        
        logger.info(f"Found {len(campaigns)} campaigns for user {user_id}")
        
        # Update state
        self.update_state(state='PROGRESS', meta={
            'status': 'Loading historical performance data',
            'campaigns_count': len(campaigns)
        })
        
        # Load historical performance data
        historical_data = _load_campaign_performance_data(user_id, campaigns)
        
        # Update state
        self.update_state(state='PROGRESS', meta={
            'status': 'Running optimization algorithm',
            'data_points': len(historical_data)
        })
        
        # Run optimization
        optimization_results = optimizer.optimize_budget_allocation(
            campaigns=campaigns,
            historical_data=historical_data,
            optimization_goal=optimization_config.get('goal', 'maximize_roas'),
            total_budget=optimization_config.get('total_budget'),
            constraints=optimization_config.get('constraints', {}),
            time_horizon_days=optimization_config.get('time_horizon_days', 30)
        )
        
        # Update state
        self.update_state(state='PROGRESS', meta={
            'status': 'Calculating expected impact',
            'recommendations_count': len(optimization_results.get('recommendations', []))
        })
        
        # Calculate expected impact
        impact_analysis = _calculate_optimization_impact(
            campaigns, 
            optimization_results['recommendations'],
            historical_data
        )
        
        # Prepare final results
        optimization_time = time.time() - start_time
        
        results = {
            'status': 'completed',
            'user_id': user_id,
            'optimization_id': f"opt_{user_id}_{int(time.time())}",
            'campaigns_optimized': len(campaigns),
            'recommendations': optimization_results['recommendations'],
            'expected_improvement': optimization_results.get('expected_improvement', {}),
            'risk_assessment': optimization_results.get('risk_assessment', 'Low'),
            'impact_analysis': impact_analysis,
            'optimization_time_seconds': optimization_time,
            'optimization_config': optimization_config,
            'created_at': datetime.now().isoformat()
        }
        
        # Store results for later reference
        _store_optimization_results(results)
        
        logger.info(f"Budget optimization completed for user {user_id} in {optimization_time:.2f} seconds")
        return results
        
    except Exception as e:
        logger.error(f"Budget optimization failed for user {user_id}: {e}")
        return {
            'status': 'failed',
            'user_id': user_id,
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

@celery_app.task(base=OptimizationTask, bind=True)
def optimize_all_user_budgets(self) -> Dict[str, Any]:
    """
    Periodic task to optimize budgets for all active users
    
    Returns:
        Optimization summary for all users
    """
    try:
        logger.info("Starting periodic budget optimization for all users")
        start_time = time.time()
        
        # Get list of active users
        active_users = _get_active_users_for_optimization()
        
        results = {}
        for user_id in active_users:
            try:
                # Check if user needs optimization
                if _should_optimize_user_budget(user_id):
                    # Get user's optimization preferences
                    optimization_config = _get_user_optimization_config(user_id)
                    
                    # Run optimization
                    result = optimize_user_budget.apply_async(
                        args=[user_id, optimization_config],
                        queue='optimization'
                    )
                    
                    results[user_id] = {'task_id': result.id, 'status': 'scheduled'}
                else:
                    results[user_id] = {'status': 'skipped', 'reason': 'recent_optimization'}
                    
            except Exception as e:
                logger.error(f"Failed to schedule optimization for user {user_id}: {e}")
                results[user_id] = {'status': 'failed', 'error': str(e)}
        
        total_time = time.time() - start_time
        
        summary = {
            'status': 'completed',
            'total_users': len(active_users),
            'scheduled_optimizations': len([r for r in results.values() if r.get('status') == 'scheduled']),
            'skipped_optimizations': len([r for r in results.values() if r.get('status') == 'skipped']),
            'failed_schedulings': len([r for r in results.values() if r.get('status') == 'failed']),
            'results': results,
            'total_time_seconds': total_time,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"Periodic budget optimization completed in {total_time:.2f} seconds")
        return summary
        
    except Exception as e:
        logger.error(f"Periodic budget optimization failed: {e}")
        return {
            'status': 'failed',
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

@celery_app.task(base=OptimizationTask, bind=True)
def optimize_bid_strategies(self, user_id: str, campaign_ids: List[str]) -> Dict[str, Any]:
    """
    Optimize bid strategies for specific campaigns
    
    Args:
        user_id: User identifier
        campaign_ids: List of campaign IDs to optimize
        
    Returns:
        Bid optimization results
    """
    try:
        self.update_state(state='PROGRESS', meta={'status': 'Initializing bid optimization'})
        
        logger.info(f"Starting bid optimization for user {user_id}, campaigns: {campaign_ids}")
        start_time = time.time()
        
        # Load campaign data
        campaigns_data = {}
        for campaign_id in campaign_ids:
            campaign_data = _load_campaign_data(user_id, campaign_id)
            if campaign_data:
                campaigns_data[campaign_id] = campaign_data
        
        if not campaigns_data:
            return {
                'status': 'no_data',
                'user_id': user_id,
                'message': 'No campaign data found for bid optimization'
            }
        
        self.update_state(state='PROGRESS', meta={
            'status': 'Analyzing bid performance',
            'campaigns_count': len(campaigns_data)
        })
        
        # Analyze current bid performance
        bid_analysis = {}
        for campaign_id, campaign_data in campaigns_data.items():
            analysis = _analyze_bid_performance(campaign_data)
            bid_analysis[campaign_id] = analysis
        
        self.update_state(state='PROGRESS', meta={
            'status': 'Generating bid recommendations'
        })
        
        # Generate bid recommendations
        bid_recommendations = {}
        for campaign_id, analysis in bid_analysis.items():
            recommendations = _generate_bid_recommendations(analysis)
            bid_recommendations[campaign_id] = recommendations
        
        optimization_time = time.time() - start_time
        
        results = {
            'status': 'completed',
            'user_id': user_id,
            'campaign_ids': campaign_ids,
            'bid_analysis': bid_analysis,
            'recommendations': bid_recommendations,
            'optimization_time_seconds': optimization_time,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"Bid optimization completed for user {user_id} in {optimization_time:.2f} seconds")
        return results
        
    except Exception as e:
        logger.error(f"Bid optimization failed for user {user_id}: {e}")
        return {
            'status': 'failed',
            'user_id': user_id,
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

@celery_app.task(base=OptimizationTask, bind=True)
def apply_optimization_recommendations(self, user_id: str, optimization_id: str, selected_recommendations: List[str]) -> Dict[str, Any]:
    """
    Apply selected optimization recommendations to campaigns
    
    Args:
        user_id: User identifier
        optimization_id: ID of the optimization session
        selected_recommendations: List of recommendation IDs to apply
        
    Returns:
        Application results
    """
    try:
        logger.info(f"Applying optimization recommendations for user {user_id}")
        start_time = time.time()
        
        # Load optimization results
        optimization_results = _load_optimization_results(optimization_id)
        if not optimization_results:
            raise ValueError(f"Optimization results not found: {optimization_id}")
        
        # Filter selected recommendations
        recommendations_to_apply = [
            rec for rec in optimization_results['recommendations']
            if rec['id'] in selected_recommendations
        ]
        
        self.update_state(state='PROGRESS', meta={
            'status': 'Applying recommendations',
            'recommendations_count': len(recommendations_to_apply)
        })
        
        # Apply recommendations
        application_results = []
        for recommendation in recommendations_to_apply:
            try:
                result = _apply_single_recommendation(user_id, recommendation)
                application_results.append(result)
                
                # Update state for each applied recommendation
                self.update_state(state='PROGRESS', meta={
                    'status': f'Applied recommendation for campaign {recommendation.get("campaign_id")}',
                    'applied_count': len(application_results)
                })
                
            except Exception as e:
                logger.error(f"Failed to apply recommendation {recommendation.get('id')}: {e}")
                application_results.append({
                    'recommendation_id': recommendation.get('id'),
                    'status': 'failed',
                    'error': str(e)
                })
        
        application_time = time.time() - start_time
        
        # Calculate success rate
        successful_applications = len([r for r in application_results if r.get('status') == 'success'])
        success_rate = successful_applications / len(application_results) if application_results else 0
        
        results = {
            'status': 'completed',
            'user_id': user_id,
            'optimization_id': optimization_id,
            'total_recommendations': len(recommendations_to_apply),
            'successful_applications': successful_applications,
            'success_rate': success_rate,
            'application_results': application_results,
            'application_time_seconds': application_time,
            'created_at': datetime.now().isoformat()
        }
        
        # Log the application for tracking
        _log_optimization_application(results)
        
        logger.info(f"Optimization recommendations applied for user {user_id} with {success_rate:.1%} success rate")
        return results
        
    except Exception as e:
        logger.error(f"Failed to apply optimization recommendations for user {user_id}: {e}")
        return {
            'status': 'failed',
            'user_id': user_id,
            'optimization_id': optimization_id,
            'error': str(e),
            'created_at': datetime.now().isoformat()
        }

# Helper functions

def _load_user_campaigns(user_id: str) -> List[Dict[str, Any]]:
    """Load active campaigns for a user"""
    # This would query ClickHouse or another database
    return [
        {'campaign_id': 'camp1', 'current_budget': 100, 'status': 'active'},
        {'campaign_id': 'camp2', 'current_budget': 200, 'status': 'active'},
    ]

def _load_campaign_performance_data(user_id: str, campaigns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Load historical performance data for campaigns"""
    # This would query ClickHouse for performance metrics
    return [
        {'campaign_id': 'camp1', 'date': '2024-01-01', 'spend': 50, 'revenue': 100},
        {'campaign_id': 'camp2', 'date': '2024-01-01', 'spend': 100, 'revenue': 180},
    ]

def _calculate_optimization_impact(campaigns: List[Dict[str, Any]], 
                                 recommendations: List[Dict[str, Any]], 
                                 historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate expected impact of optimization recommendations"""
    return {
        'expected_roi_improvement': 0.15,
        'expected_cost_reduction': 0.08,
        'confidence_level': 0.85
    }

def _store_optimization_results(results: Dict[str, Any]) -> None:
    """Store optimization results for later reference"""
    # This would store in ClickHouse or another database
    pass

def _get_active_users_for_optimization() -> List[str]:
    """Get list of users who need budget optimization"""
    return ['user1', 'user2', 'user3']  # Placeholder

def _should_optimize_user_budget(user_id: str) -> bool:
    """Check if user's budget should be optimized"""
    # Check last optimization time, campaign changes, etc.
    return True

def _get_user_optimization_config(user_id: str) -> Dict[str, Any]:
    """Get user's optimization preferences"""
    return {
        'goal': 'maximize_roas',
        'total_budget': 1000,
        'time_horizon_days': 30,
        'constraints': {'min_budget_per_campaign': 50}
    }

def _load_campaign_data(user_id: str, campaign_id: str) -> Optional[Dict[str, Any]]:
    """Load campaign data for bid optimization"""
    return {
        'campaign_id': campaign_id,
        'current_bid': 1.50,
        'avg_cpc': 1.25,
        'ctr': 0.025,
        'conversion_rate': 0.05
    }

def _analyze_bid_performance(campaign_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze bid performance for a campaign"""
    return {
        'current_efficiency': 0.75,
        'optimal_bid_range': {'min': 1.20, 'max': 1.80},
        'performance_trend': 'improving'
    }

def _generate_bid_recommendations(analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate bid recommendations based on analysis"""
    return [
        {
            'id': 'bid_rec_1',
            'action': 'increase_bid',
            'current_value': 1.50,
            'recommended_value': 1.65,
            'expected_impact': 'Increase CTR by 8%'
        }
    ]

def _load_optimization_results(optimization_id: str) -> Optional[Dict[str, Any]]:
    """Load stored optimization results"""
    # This would query the database
    return None

def _apply_single_recommendation(user_id: str, recommendation: Dict[str, Any]) -> Dict[str, Any]:
    """Apply a single optimization recommendation"""
    # This would update campaign settings via Facebook API
    return {
        'recommendation_id': recommendation.get('id'),
        'status': 'success',
        'applied_at': datetime.now().isoformat()
    }

def _log_optimization_application(results: Dict[str, Any]) -> None:
    """Log optimization application for tracking"""
    # This would log to ClickHouse or another system
    pass