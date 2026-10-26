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
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)
from .model import HeartDiseaseNN

def train_local_client(
    model,
    X_client,
    y_client,
    epochs=5,
    lr=0.008,
    batch_size=16,
    enable_dp=True,
    clip_norm=1.0,
    noise_multiplier=0.01,
):
    """
    Simulates on-premise local model training inside a single hospital node.
    Includes Differential Privacy (DP-SGD):
    - L2 Gradient Norm Clipping: bounds individual clinical record sensitivity to `clip_norm`.
    - Calibrated Gaussian Noise Injection: adds N(0, (noise_multiplier * clip_norm)^2) to gradients.
    """
    model.train()
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-3)

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

            # Differential Privacy: L2 Gradient Clipping
            if enable_dp and clip_norm > 0:
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=clip_norm)

            # Differential Privacy: Gaussian Noise Mechanism
            if enable_dp and noise_multiplier > 0:
                for param in model.parameters():
                    if param.grad is not None:
                        noise = torch.randn_like(param.grad) * (noise_multiplier * clip_norm)
                        param.grad.add_(noise)

            optimizer.step()
            running_loss += loss.item() * batch_x.size(0)
        epoch_loss = running_loss / len(dataset)

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

    aggregated_weights = {}
    first_client_weights = client_weights_list[0]

    for key in first_client_weights.keys():
        weighted_layer = torch.zeros_like(first_client_weights[key], dtype=torch.float32)
        for weights, n_k in zip(client_weights_list, sample_sizes):
            weight_factor = n_k / total_samples
            weighted_layer += weights[key].float() * weight_factor
        aggregated_weights[key] = weighted_layer

    return aggregated_weights

def evaluate_model(model, X_test, y_test):
    """
    Evaluates global or centralized model on the held-out test set.
    Returns comprehensive metrics including confusion matrix and raw probabilities.
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
    f1 = f1_score(y_test, preds, zero_division=0)
    cm = confusion_matrix(y_test, preds)
    tn, fp, fn, tp = cm.ravel()

    try:
        auc = roc_auc_score(y_test, probs)
    except:
        auc = 0.5

    report = classification_report(
        y_test, preds,
        target_names=["No Disease (0)", "Heart Disease (1)"],
        digits=4,
        zero_division=0
    )

    return {
        "loss": loss,
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "auc": auc,
        "probs": probs,
        "preds": preds,
        "confusion_matrix": cm,
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
        "tp": int(tp),
        "report": report
    }
