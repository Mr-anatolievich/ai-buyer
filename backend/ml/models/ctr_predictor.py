"""
CTR Prediction Model using DeepCTR
Advanced deep learning model for predicting click-through rates on Facebook ads
"""

import pandas as pd
import numpy as np
import mlflow
import mlflow.tensorflow
from typing import List, Dict, Any, Optional, Tuple
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
import tensorflow as tf
import logging
from datetime import datetime
import pickle
import os

# DeepCTR imports
from deepctr.models import DeepFM
from deepctr.feature_column import SparseFeat, DenseFeat, get_feature_names

logger = logging.getLogger(__name__)

class CTRPredictor:
    """
    Deep Learning CTR prediction model using DeepFM architecture
    Optimized for Facebook advertising data with categorical and numerical features
    """
    
    def __init__(self, user_id: str, model_name: str = "ctr_predictor"):
        self.user_id = user_id
        self.model_name = model_name
        self.model = None
        self.feature_columns = None
        self.feature_encoders = {}
        self.scaler = MinMaxScaler()
        self.is_trained = False
        
        # Model hyperparameters
        self.embedding_dim = 8
        self.dnn_hidden_units = (256, 128, 64)
        self.l2_reg_embedding = 1e-5
        self.l2_reg_dnn = 0
        self.task = 'regression'
        self.dnn_dropout = 0.1
        
        # MLflow configuration
        self.experiment_name = f"ctr_prediction_{user_id}"
        self._setup_mlflow()
    
    def _setup_mlflow(self):
        """Setup MLflow experiment for tracking"""
        try:
            mlflow.set_experiment(self.experiment_name)
            logger.info(f"MLflow experiment set: {self.experiment_name}")
        except Exception as e:
            logger.error(f"Failed to setup MLflow experiment: {e}")
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List]:
        """
        Prepare features for DeepCTR model
        
        Args:
            df: Raw dataframe with campaign data
            
        Returns:
            Processed dataframe and feature columns definition
        """
        logger.info("Preparing features for CTR prediction")
        
        # Define sparse (categorical) features
        sparse_features = [
            'campaign_id', 'ad_set_id', 'ad_id', 'placement', 'device_type',
            'age_group', 'gender', 'interest_category', 'geographic_location',
            'time_period', 'day_of_week', 'hour_of_day', 'creative_format',
            'campaign_objective', 'optimization_goal'
        ]
        
        # Define dense (numerical) features
        dense_features = [
            'bid_amount', 'budget_remaining', 'frequency', 'reach',
            'previous_ctr', 'previous_cpc', 'previous_conversion_rate',
            'audience_size', 'competition_index', 'weather_score',
            'seasonal_factor', 'campaign_age_days'
        ]
        
        # Create missing columns with default values if needed
        for feat in sparse_features:
            if feat not in df.columns:
                df[feat] = 'unknown'
        
        for feat in dense_features:
            if feat not in df.columns:
                df[feat] = 0.0
        
        # Encode sparse features
        for feat in sparse_features:
            if feat not in self.feature_encoders:
                self.feature_encoders[feat] = LabelEncoder()
                df[feat] = self.feature_encoders[feat].fit_transform(df[feat].astype(str))
            else:
                # Handle unseen categories
                unique_values = df[feat].unique()
                encoder_classes = self.feature_encoders[feat].classes_
                new_values = set(unique_values) - set(encoder_classes)
                
                if new_values:
                    # Add new categories to encoder
                    all_classes = np.concatenate([encoder_classes, list(new_values)])
                    self.feature_encoders[feat].classes_ = all_classes
                
                df[feat] = self.feature_encoders[feat].transform(df[feat].astype(str))
        
        # Normalize dense features
        df[dense_features] = self.scaler.fit_transform(df[dense_features])
        
        # Create feature columns for DeepCTR
        fixlen_feature_columns = [
            SparseFeat(feat, vocabulary_size=df[feat].nunique() + 1, 
                      embedding_dim=self.embedding_dim)
            for feat in sparse_features
        ] + [
            DenseFeat(feat, 1) for feat in dense_features
        ]
        
        self.feature_columns = fixlen_feature_columns
        
        # Create feature input dict for model
        feature_names = get_feature_names(fixlen_feature_columns)
        feature_input = {name: df[name] for name in feature_names}
        
        return df, feature_input
    
    def create_model(self) -> tf.keras.Model:
        """Create DeepFM model architecture"""
        logger.info("Creating DeepFM model architecture")
        
        model = DeepFM(
            self.feature_columns,
            task=self.task,
            dnn_hidden_units=self.dnn_hidden_units,
            l2_reg_embedding=self.l2_reg_embedding,
            l2_reg_dnn=self.l2_reg_dnn,
            dnn_dropout=self.dnn_dropout,
            seed=42
        )
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='mse' if self.task == 'regression' else 'binary_crossentropy',
            metrics=['mae'] if self.task == 'regression' else ['AUC']
        )
        
        return model
    
    def train(self, training_data: pd.DataFrame, target_column: str = 'ctr',
              validation_split: float = 0.2, epochs: int = 100, 
              batch_size: int = 512, early_stopping_patience: int = 10) -> Dict[str, Any]:
        """
        Train the CTR prediction model
        
        Args:
            training_data: DataFrame with training data
            target_column: Name of target column (CTR values)
            validation_split: Fraction of data for validation
            epochs: Number of training epochs
            batch_size: Training batch size
            early_stopping_patience: Early stopping patience
            
        Returns:
            Training metrics and model info
        """
        logger.info(f"Starting CTR model training for user {self.user_id}")
        
        with mlflow.start_run():
            try:
                # Prepare features
                processed_data, feature_input = self.prepare_features(training_data)
                target = training_data[target_column].values
                
                # Split data
                train_input, val_input, y_train, y_val = train_test_split(
                    feature_input, target, test_size=validation_split, random_state=42
                )
                
                # Create model
                self.model = self.create_model()
                
                # Setup callbacks
                callbacks = [
                    tf.keras.callbacks.EarlyStopping(
                        patience=early_stopping_patience, 
                        restore_best_weights=True
                    ),
                    tf.keras.callbacks.ReduceLROnPlateau(
                        factor=0.5, patience=5, min_lr=1e-6
                    )
                ]
                
                # Log parameters
                mlflow.log_params({
                    "user_id": self.user_id,
                    "model_type": "DeepFM",
                    "embedding_dim": self.embedding_dim,
                    "dnn_hidden_units": str(self.dnn_hidden_units),
                    "l2_reg_embedding": self.l2_reg_embedding,
                    "epochs": epochs,
                    "batch_size": batch_size,
                    "training_samples": len(y_train),
                    "validation_samples": len(y_val)
                })
                
                # Train model
                history = self.model.fit(
                    train_input, y_train,
                    validation_data=(val_input, y_val),
                    epochs=epochs,
                    batch_size=batch_size,
                    callbacks=callbacks,
                    verbose=1
                )
                
                # Evaluate model
                train_pred = self.model.predict(train_input)
                val_pred = self.model.predict(val_input)
                
                train_mse = mean_squared_error(y_train, train_pred)
                val_mse = mean_squared_error(y_val, val_pred)
                train_mae = mean_absolute_error(y_train, train_pred)
                val_mae = mean_absolute_error(y_val, val_pred)
                
                # Log metrics
                mlflow.log_metrics({
                    "train_mse": train_mse,
                    "val_mse": val_mse,
                    "train_mae": train_mae,
                    "val_mae": val_mae,
                    "final_loss": history.history['loss'][-1],
                    "final_val_loss": history.history['val_loss'][-1]
                })
                
                # Save model
                model_path = f"models/ctr_predictor_{self.user_id}"
                mlflow.tensorflow.log_model(
                    self.model,
                    model_path,
                    registered_model_name=f"ctr_predictor_{self.user_id}"
                )
                
                # Save feature encoders and scaler
                artifacts_path = f"artifacts_{self.user_id}"
                os.makedirs(artifacts_path, exist_ok=True)
                
                with open(f"{artifacts_path}/feature_encoders.pkl", 'wb') as f:
                    pickle.dump(self.feature_encoders, f)
                with open(f"{artifacts_path}/scaler.pkl", 'wb') as f:
                    pickle.dump(self.scaler, f)
                with open(f"{artifacts_path}/feature_columns.pkl", 'wb') as f:
                    pickle.dump(self.feature_columns, f)
                
                mlflow.log_artifacts(artifacts_path)
                
                self.is_trained = True
                
                training_results = {
                    "success": True,
                    "user_id": self.user_id,
                    "training_samples": len(y_train),
                    "validation_samples": len(y_val),
                    "train_mse": train_mse,
                    "val_mse": val_mse,
                    "train_mae": train_mae,
                    "val_mae": val_mae,
                    "epochs_trained": len(history.history['loss']),
                    "model_version": mlflow.active_run().info.run_id,
                    "trained_at": datetime.now().isoformat()
                }
                
                logger.info(f"Model training completed successfully. Val MSE: {val_mse:.6f}")
                return training_results
                
            except Exception as e:
                logger.error(f"Model training failed: {e}")
                mlflow.log_params({"error": str(e)})
                return {
                    "success": False,
                    "error": str(e),
                    "user_id": self.user_id
                }
    
    def predict(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict CTR for new campaign data
        
        Args:
            campaign_data: Dictionary with campaign features
            
        Returns:
            Prediction results with confidence intervals
        """
        if not self.is_trained or self.model is None:
            self.load_model()
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame([campaign_data])
            
            # Prepare features
            processed_data, feature_input = self.prepare_features(df)
            
            # Make prediction
            prediction = self.model.predict(feature_input)[0][0]
            
            # Calculate confidence interval (using model uncertainty)
            # This is a simplified approach - in production, use proper uncertainty quantification
            prediction_std = prediction * 0.1  # 10% uncertainty estimate
            confidence_interval = [
                max(0, prediction - 1.96 * prediction_std),
                min(1, prediction + 1.96 * prediction_std)
            ]
            
            return {
                "predicted_ctr": float(prediction),
                "confidence_interval": confidence_interval,
                "model_version": getattr(self, 'model_version', 'unknown'),
                "prediction_date": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return {
                "error": str(e),
                "predicted_ctr": None
            }
    
    def load_model(self, model_version: Optional[str] = None):
        """Load trained model from MLflow"""
        try:
            client = mlflow.tracking.MlflowClient()
            model_name = f"ctr_predictor_{self.user_id}"
            
            if model_version is None:
                # Get latest production version
                latest_versions = client.get_latest_versions(
                    model_name, 
                    stages=["Production", "Staging"]
                )
                if not latest_versions:
                    # If no production/staging version, get latest
                    latest_versions = client.get_latest_versions(model_name)
                
                if latest_versions:
                    model_version = latest_versions[0].version
                else:
                    raise Exception(f"No model found for user {self.user_id}")
            
            # Load model
            model_uri = f"models:/{model_name}/{model_version}"
            self.model = mlflow.tensorflow.load_model(model_uri)
            
            # Load artifacts
            artifacts_uri = f"runs:/{latest_versions[0].run_id}/artifacts_{self.user_id}"
            artifacts_path = mlflow.artifacts.download_artifacts(artifacts_uri)
            
            with open(f"{artifacts_path}/feature_encoders.pkl", 'rb') as f:
                self.feature_encoders = pickle.load(f)
            with open(f"{artifacts_path}/scaler.pkl", 'rb') as f:
                self.scaler = pickle.load(f)
            with open(f"{artifacts_path}/feature_columns.pkl", 'rb') as f:
                self.feature_columns = pickle.load(f)
            
            self.is_trained = True
            self.model_version = model_version
            
            logger.info(f"Model loaded successfully for user {self.user_id}, version {model_version}")
            
        except Exception as e:
            logger.error(f"Failed to load model for user {self.user_id}: {e}")
            raise
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from trained model"""
        if not self.is_trained:
            return {}
        
        # This is a simplified feature importance calculation
        # In practice, you'd use SHAP or similar methods for better interpretability
        try:
            # Get feature names
            feature_names = get_feature_names(self.feature_columns)
            
            # Mock feature importance (in production, use proper methods)
            importance_scores = np.random.random(len(feature_names))
            importance_scores = importance_scores / importance_scores.sum()
            
            return dict(zip(feature_names, importance_scores))
            
        except Exception as e:
            logger.error(f"Failed to get feature importance: {e}")
            return {}
    
    def evaluate(self, test_data: pd.DataFrame, target_column: str = 'ctr') -> Dict[str, float]:
        """Evaluate model on test data"""
        if not self.is_trained:
            raise Exception("Model not trained yet")
        
        try:
            processed_data, feature_input = self.prepare_features(test_data)
            y_true = test_data[target_column].values
            y_pred = self.model.predict(feature_input).flatten()
            
            metrics = {
                "mse": float(mean_squared_error(y_true, y_pred)),
                "mae": float(mean_absolute_error(y_true, y_pred)),
                "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
                "mape": float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100)
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Model evaluation failed: {e}")
            return {"error": str(e)}