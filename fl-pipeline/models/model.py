"""
Disease Prediction Neural Network Model Architecture

Architecture:
- Input Layer: matching preprocessed feature dimension (typically 18-20 features)
- Dense Layer 1: 16 units, ReLU activation
- Dropout Layer 1: p = 0.25 (prevents co-adaptation and logit saturation)
- Dense Layer 2: 8 units, ReLU activation
- Dropout Layer 2: p = 0.20
- Output Layer: 1 unit, Sigmoid activation (Binary Cross-Entropy Loss)
"""

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

class HeartDiseaseNN(nn.Module):
    """PyTorch Neural Network with Regularization & Dropout for Tabular Clinical Data."""
    def __init__(self, input_dim, dropout_rate=0.25):
        super(HeartDiseaseNN, self).__init__()
        self.fc1 = nn.Linear(input_dim, 16)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(dropout_rate)
        
        self.fc2 = nn.Linear(16, 8)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(dropout_rate * 0.8)
        
        self.out = nn.Linear(8, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.relu1(self.fc1(x))
        x = self.dropout1(x)
        x = self.relu2(self.fc2(x))
        x = self.dropout2(x)
        x = self.sigmoid(self.out(x))
        return x

    def get_weights(self):
        """Returns deep copy of model state dictionary tensors."""
        return {k: v.clone() for k, v in self.state_dict().items()}

    def set_weights(self, weights_dict):
        """Sets model state dictionary from aggregated federated weights."""
        self.load_state_dict({k: v.clone() for k, v in weights_dict.items()})

def build_keras_model(input_dim, dropout_rate=0.25):
    """
    Equivalent Keras Sequential Model for TensorFlow / TFF Pipelines.
    """
    try:
        import tensorflow as tf
        from tensorflow.keras import layers, models, regularizers

        model = models.Sequential([
            layers.Input(shape=(input_dim,)),
            layers.Dense(16, activation="relu", kernel_regularizer=regularizers.l2(0.001)),
            layers.Dropout(dropout_rate),
            layers.Dense(8, activation="relu"),
            layers.Dropout(dropout_rate * 0.8),
            layers.Dense(1, activation="sigmoid")
        ])
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.005),
            loss="binary_crossentropy",
            metrics=["accuracy"]
        )
        return model
    except ImportError:
        return None
