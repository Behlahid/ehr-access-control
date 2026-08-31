"""
Federated Averaging (FedAvg) Engine

Mathematical Foundation for Viva Defense:
In FedAvg (McMahan et al., 2017), the server maintains a global model parameterized by weights W.
At communication round t:
1. Server broadcasts global weights W_t to participating client hospitals S_t.
2. Each client k in S_t trains locally for E epochs on its private data (X_k, y_k),
   producing local weights W_{t+1}^k.
3. Server aggregates client weights proportionally to each client's dataset size n_k:
   
   W_{t+1} = sum_{k in S_t} (n_k / N_t) * W_{t+1}^k
   where N_t = sum_{k in S_t} n_k

This ensures privacy: raw clinical records NEVER leave the hospital firewall.
Only gradient/weight deltas are transmitted and aggregated.
"""

import copy
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
from .model import HeartDiseaseNN

def train_local_client(model, X_client, y_client, epochs=5, lr=0.01, batch_size=16):
    """
    Simulates on-premise local model training inside a single hospital node.
    """
    model.train()
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    X_tensor = torch.tensor(X_client, dtype=torch.float32)
    y_tensor = torch.tensor(y_client, dtype=torch.float32).unsqueeze(1)

    dataset = torch.utils.data.TensorDataset(X_tensor, y_tensor)
    loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

    epoch_loss = 0.0
    for _ in range(epochs):
        running_loss = 0.0
        for batch_x, batch_y in loader:
            optimizer.zero_grad()
            preds = model(batch_x)
            loss = criterion(preds, batch_y)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * batch_x.size(0)
        epoch_loss = running_loss / len(dataset)

    # Compute local training accuracy
    model.eval()
    with torch.no_grad():
        train_preds = (model(X_tensor).numpy() >= 0.5).astype(int)
        train_acc = accuracy_score(y_client, train_preds)

    return model.get_weights(), epoch_loss, train_acc

def aggregate_fed_avg(client_weights_list, sample_sizes):
    """
    Performs weighted Federated Averaging across participating client nodes.
    W_global = sum_k (n_k / N) * W_k
    """
    total_samples = sum(sample_sizes)
    if total_samples == 0:
        raise ValueError("Cannot aggregate: total sample size is 0.")

    # Initialize empty aggregated state dict with same tensor structures
    aggregated_weights = {}
    first_client_weights = client_weights_list[0]

    for key in first_client_weights.keys():
        # Weighted sum: (n_k / N) * W_k
        weighted_layer = torch.zeros_like(first_client_weights[key], dtype=torch.float32)
        for weights, n_k in zip(client_weights_list, sample_sizes):
            weight_factor = n_k / total_samples
            weighted_layer += weights[key].float() * weight_factor
        aggregated_weights[key] = weighted_layer

    return aggregated_weights

def evaluate_model(model, X_test, y_test):
    """
    Evaluates global or centralized model on the held-out test set.
    """
    model.eval()
    criterion = nn.BCELoss()

    X_tensor = torch.tensor(X_test, dtype=torch.float32)
    y_tensor = torch.tensor(y_test, dtype=torch.float32).unsqueeze(1)

    with torch.no_grad():
        raw_probs = model(X_tensor)
        loss = criterion(raw_probs, y_tensor).item()
        probs = raw_probs.numpy().flatten()
        preds = (probs >= 0.5).astype(int)

    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds, zero_division=0)
    rec = recall_score(y_test, preds, zero_division=0)
    try:
        auc = roc_auc_score(y_test, probs)
    except:
        auc = 0.5

    return {
        "loss": loss,
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "auc": auc
    }
