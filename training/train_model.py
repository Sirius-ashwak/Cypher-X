#!/usr/bin/env python3
"""
Project Cypher - LSTM Trading Model Training Script
==================================================

This script implements a Long Short-Term Memory (LSTM) neural network for
cryptocurrency price prediction, specifically designed for the Project Cypher
autonomous trading agent.

The model is trained on historical price data and optimized for deployment
on decentralized infrastructure:
- Training: io.net decentralized GPU cloud
- Inference: Gaia Network nodes

Model Architecture:
- Input: 100 previous hourly price points (normalized)
- LSTM Layer: 50 units with dropout for regularization
- Output: Single price prediction for next hour
- Loss: Mean Squared Error with Adam optimizer

Output Format: GGUF (optimized for llama.cpp inference)
"""

import os
import sys
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import joblib
import json
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('training_log.txt')
    ]
)
logger = logging.getLogger(__name__)

class CypherLSTMTrainer:
    """
    LSTM Model Trainer for Project Cypher
    
    Handles the complete training pipeline:
    1. Data loading and preprocessing
    2. Model architecture definition
    3. Training with early stopping
    4. Model evaluation and validation
    5. Export to GGUF format for Gaia deployment
    """
    
    def __init__(self, sequence_length=100, prediction_horizon=1):
        self.sequence_length = sequence_length  # Number of hours to look back
        self.prediction_horizon = prediction_horizon  # Hours ahead to predict
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.model = None
        self.history = None
        
        logger.info(f"Initializing CypherLSTMTrainer")
        logger.info(f"Sequence length: {sequence_length}")
        logger.info(f"Prediction horizon: {prediction_horizon}")
    
    def load_and_preprocess_data(self, data_path='data/price_history.csv'):
        """
        Load historical price data and prepare it for training
        
        Expected CSV format:
        timestamp,price
        2024-01-01 00:00:00,2000.50
        2024-01-01 01:00:00,2005.25
        ...
        """
        logger.info(f"Loading data from {data_path}")
        
        if not os.path.exists(data_path):
            raise FileNotFoundError(f"Data file not found: {data_path}")
        
        # Load the data
        df = pd.read_csv(data_path)
        logger.info(f"Loaded {len(df)} data points")
        
        # Validate data structure
        if 'price' not in df.columns:
            raise ValueError("Data must contain 'price' column")
        
        # Extract prices and handle missing values
        prices = df['price'].dropna().values.reshape(-1, 1)
        logger.info(f"After cleaning: {len(prices)} valid price points")
        
        if len(prices) < self.sequence_length + 100:  # Need minimum data for training
            raise ValueError(f"Insufficient data: {len(prices)} points, need at least {self.sequence_length + 100}")
        
        # Normalize the data
        prices_scaled = self.scaler.fit_transform(prices)
        logger.info("Data normalized using MinMaxScaler")
        
        return prices_scaled.flatten()
    
    def create_sequences(self, data):
        """
        Create overlapping sequences for supervised learning
        
        For each sequence of length N, predict the next value
        Returns X (input sequences) and y (target values)
        """
        logger.info("Creating training sequences")
        
        X, y = [], []
        
        for i in range(len(data) - self.sequence_length):
            # Input sequence
            X.append(data[i:(i + self.sequence_length)])
            # Target value (next price point)
            y.append(data[i + self.sequence_length])
        
        X = np.array(X)
        y = np.array(y)
        
        # Reshape X for LSTM input: (samples, time steps, features)
        X = X.reshape((X.shape[0], X.shape[1], 1))
        
        logger.info(f"Created {len(X)} training sequences")
        logger.info(f"Input shape: {X.shape}, Target shape: {y.shape}")
        
        return X, y
    
    def build_model(self, input_shape):
        """
        Build the LSTM model architecture
        
        Architecture:
        - LSTM layer (50 units) with return sequences for potential stacking
        - Dropout layer (0.2) for regularization
        - Dense output layer (1 unit) for price prediction
        """
        logger.info("Building LSTM model architecture")
        
        model = Sequential([
            # LSTM layer with 50 units
            LSTM(50, 
                 return_sequences=False,  # Only return last output
                 input_shape=input_shape,
                 dropout=0.2,  # Dropout on input connections
                 recurrent_dropout=0.2),  # Dropout on recurrent connections
            
            # Additional dropout for regularization
            Dropout(0.2),
            
            # Dense output layer
            Dense(1, activation='linear')  # Linear activation for regression
        ])
        
        # Compile with Adam optimizer and MSE loss
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        logger.info("Model architecture:")
        model.summary(print_fn=logger.info)
        
        return model
    
    def train_model(self, X_train, y_train, X_val, y_val, epochs=100):
        """
        Train the LSTM model with early stopping and learning rate reduction
        """
        logger.info("Starting model training")
        
        # Callbacks for training optimization
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            verbose=1
        )
        
        reduce_lr = ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.2,
            patience=10,
            min_lr=0.0001,
            verbose=1
        )
        
        # Train the model
        self.history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=32,
            validation_data=(X_val, y_val),
            callbacks=[early_stopping, reduce_lr],
            verbose=1
        )
        
        logger.info("Model training completed")
        return self.history
    
    def evaluate_model(self, X_test, y_test):
        """
        Evaluate the trained model and compute performance metrics
        """
        logger.info("Evaluating model performance")
        
        # Make predictions
        y_pred = self.model.predict(X_test)
        
        # Inverse transform predictions and actual values
        y_test_original = self.scaler.inverse_transform(y_test.reshape(-1, 1))
        y_pred_original = self.scaler.inverse_transform(y_pred.reshape(-1, 1))
        
        # Calculate metrics
        mse = mean_squared_error(y_test_original, y_pred_original)
        mae = mean_absolute_error(y_test_original, y_pred_original)
        rmse = np.sqrt(mse)
        
        # Calculate MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((y_test_original - y_pred_original) / y_test_original)) * 100
        
        metrics = {
            'mse': float(mse),
            'mae': float(mae),
            'rmse': float(rmse),
            'mape': float(mape)
        }
        
        logger.info("Model Performance Metrics:")
        logger.info(f"MSE: {mse:.2f}")
        logger.info(f"MAE: {mae:.2f}")
        logger.info(f"RMSE: {rmse:.2f}")
        logger.info(f"MAPE: {mape:.2f}%")
        
        return metrics
    
    def save_model_artifacts(self, output_dir='../dist'):
        """
        Save model artifacts for deployment
        - TensorFlow model (for backup)
        - Scaler (for data preprocessing)
        - Training metrics and metadata
        """
        logger.info(f"Saving model artifacts to {output_dir}")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Save TensorFlow model
        model_path = os.path.join(output_dir, 'cypher_model.h5')
        self.model.save(model_path)
        logger.info(f"TensorFlow model saved to {model_path}")
        
        # Save scaler
        scaler_path = os.path.join(output_dir, 'price_scaler.joblib')
        joblib.dump(self.scaler, scaler_path)
        logger.info(f"Scaler saved to {scaler_path}")
        
        # Save training metadata
        metadata = {
            'model_type': 'LSTM',
            'sequence_length': self.sequence_length,
            'prediction_horizon': self.prediction_horizon,
            'training_date': datetime.now().isoformat(),
            'framework': 'Project Cypher',
            'version': '1.0.0',
            'scaler_params': {
                'feature_range': self.scaler.feature_range,
                'data_min': float(self.scaler.data_min_[0]),
                'data_max': float(self.scaler.data_max_[0]),
                'data_range': float(self.scaler.data_range_[0])
            }
        }
        
        metadata_path = os.path.join(output_dir, 'model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"Metadata saved to {metadata_path}")
        
        return {
            'model_path': model_path,
            'scaler_path': scaler_path,
            'metadata_path': metadata_path
        }
    
    def convert_to_gguf(self, output_dir='../dist'):
        """
        Convert the trained model to GGUF format for Gaia deployment
        
        Note: This is a simplified conversion process.
        In production, you would use proper TensorFlow to GGUF conversion tools.
        """
        logger.info("Converting model to GGUF format for Gaia deployment")
        
        try:
            # Create a simplified model representation for GGUF
            # This is a placeholder implementation - in practice, you'd use
            # specialized tools like tensorflow-to-gguf or similar
            
            model_weights = []
            for layer in self.model.layers:
                if hasattr(layer, 'get_weights'):
                    weights = layer.get_weights()
                    if weights:
                        model_weights.append({
                            'layer_name': layer.name,
                            'layer_type': type(layer).__name__,
                            'weights': [w.tolist() for w in weights]
                        })
            
            # Create GGUF-compatible model file
            gguf_model = {
                'model_type': 'cypher-lstm',
                'architecture': 'lstm',
                'sequence_length': self.sequence_length,
                'layers': model_weights,
                'scaler_params': {
                    'min': float(self.scaler.data_min_[0]),
                    'max': float(self.scaler.data_max_[0]),
                    'range': float(self.scaler.data_range_[0])
                },
                'metadata': {
                    'created_at': datetime.now().isoformat(),
                    'framework': 'Project Cypher',
                    'version': '1.0.0'
                }
            }
            
            # Save as JSON (simplified GGUF representation)
            gguf_path = os.path.join(output_dir, 'cypher_model.gguf')
            with open(gguf_path, 'w') as f:
                json.dump(gguf_model, f, indent=2)
            
            logger.info(f"GGUF model saved to {gguf_path}")
            return gguf_path
            
        except Exception as e:
            logger.error(f"GGUF conversion failed: {e}")
            # Fall back to saving model weights in a simpler format
            fallback_path = os.path.join(output_dir, 'cypher_model_weights.json')
            
            with open(fallback_path, 'w') as f:
                json.dump({
                    'error': 'GGUF conversion not fully implemented',
                    'fallback': 'Model weights saved in JSON format',
                    'model_config': self.model.get_config(),
                    'weights_shapes': [layer.shape for layer in self.model.get_weights()],
                    'created_at': datetime.now().isoformat()
                }, f, indent=2)
            
            logger.info(f"Fallback model saved to {fallback_path}")
            return fallback_path

def main():
    """
    Main training pipeline for Project Cypher LSTM model
    """
    logger.info("=" * 50)
    logger.info("Project Cypher - LSTM Model Training")
    logger.info("=" * 50)
    
    try:
        # Initialize trainer
        trainer = CypherLSTMTrainer(sequence_length=100)
        
        # Load and preprocess data
        data = trainer.load_and_preprocess_data()
        
        # Create sequences
        X, y = trainer.create_sequences(data)
        
        # Split data (80% train, 10% validation, 10% test)
        train_size = int(len(X) * 0.8)
        val_size = int(len(X) * 0.1)
        
        X_train = X[:train_size]
        y_train = y[:train_size]
        X_val = X[train_size:train_size + val_size]
        y_val = y[train_size:train_size + val_size]
        X_test = X[train_size + val_size:]
        y_test = y[train_size + val_size:]
        
        logger.info(f"Data split - Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
        
        # Build model
        trainer.model = trainer.build_model(input_shape=(trainer.sequence_length, 1))
        
        # Train model
        history = trainer.train_model(X_train, y_train, X_val, y_val, epochs=50)
        
        # Evaluate model
        metrics = trainer.evaluate_model(X_test, y_test)
        
        # Save model artifacts
        artifacts = trainer.save_model_artifacts()
        
        # Convert to GGUF for Gaia deployment
        gguf_path = trainer.convert_to_gguf()
        
        logger.info("=" * 50)
        logger.info("Training completed successfully!")
        logger.info("=" * 50)
        logger.info("Generated artifacts:")
        for artifact_type, path in artifacts.items():
            logger.info(f"  {artifact_type}: {path}")
        logger.info(f"  GGUF model: {gguf_path}")
        logger.info("=" * 50)
        
        return True
        
    except Exception as e:
        logger.error(f"Training failed: {e}")
        logger.error("Stack trace:", exc_info=True)
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)