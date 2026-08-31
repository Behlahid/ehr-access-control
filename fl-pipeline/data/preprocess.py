"""
Data Preprocessing & Non-IID Hospital Partitioning

1. Handles missing values via median/mode imputation.
2. Scales numeric features using StandardScaler.
3. Encodes categorical variables (one-hot encoding).
4. Splits 80% train / 20% global held-out test.
5. Partitions training set into N=4 Non-IID Hospital Clients based on clinical demographics.
"""

import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from .download_dataset import download_or_generate_dataset

def load_and_preprocess_data(test_size=0.2, random_state=42):
    """
    Loads, cleans, normalizes, and splits the Heart Disease dataset.
    Returns (X_train_df, X_test, y_train, y_test, feature_names, scaler)
    """
    df = download_or_generate_dataset()
    
    # 1. Handle missing values
    for col in df.columns:
        if df[col].isnull().any():
            if df[col].dtype in [np.float64, np.int64]:
                df[col] = df[col].fillna(df[col].median())
            else:
                df[col] = df[col].fillna(df[col].mode()[0])

    # 2. Binarize target: 0 = No Disease, 1..4 = Presence of Heart Disease
    df["target"] = (df["target"] > 0).astype(int)

    # 3. Categorical vs Continuous Features
    categorical_cols = ["sex", "cp", "fbs", "restecg", "exang", "slope", "ca", "thal"]
    numeric_cols = ["age", "trestbps", "chol", "thalach", "oldpeak"]

    # One-hot encode multi-category columns
    df_encoded = pd.get_dummies(df, columns=["cp", "restecg", "slope", "thal"], drop_first=True)

    X = df_encoded.drop(columns=["target"])
    y = df_encoded["target"].values

    # 4. Train / Test Split (80% Train, 20% Test)
    X_train_df, X_test_df, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    # 5. Fit Scaler strictly on Training Data
    scaler = StandardScaler()
    
    num_cols_present = [c for c in numeric_cols if c in X_train_df.columns]
    X_train_scaled = X_train_df.copy()
    X_test_scaled = X_test_df.copy()

    X_train_scaled[num_cols_present] = scaler.fit_transform(X_train_df[num_cols_present])
    X_test_scaled[num_cols_present] = scaler.transform(X_test_df[num_cols_present])

    X_train = X_train_scaled.values.astype(np.float32)
    X_test = X_test_scaled.values.astype(np.float32)
    y_train = y_train.astype(np.float32)
    y_test = y_test.astype(np.float32)

    return X_train, X_test, y_train, y_test, X_train_df, X_test_df, list(X.columns), scaler

def partition_non_iid_hospitals(X_train, y_train, X_train_df, n_clients=4):
    """
    Partitions the training set into 4 simulated hospital nodes in a Non-IID distribution.
    """
    indices = np.arange(len(y_train))
    ages = X_train_df["age"].values

    mask_h1 = (ages >= 60)
    mask_h2 = (ages >= 52) & (ages < 60)
    mask_h4 = (ages < 52)

    idx_h1 = indices[mask_h1]
    idx_h2 = indices[mask_h2]
    idx_h4 = indices[mask_h4]

    split_h1_half = len(idx_h1) // 3
    split_h2_half = len(idx_h2) // 3
    split_h4_half = len(idx_h4) // 3

    idx_h3 = np.concatenate([
        idx_h1[:split_h1_half],
        idx_h2[:split_h2_half],
        idx_h4[:split_h4_half]
    ])
    idx_h1_final = idx_h1[split_h1_half:]
    idx_h2_final = idx_h2[split_h2_half:]
    idx_h4_final = idx_h4[split_h4_half:]

    client_indices = [idx_h1_final, idx_h2_final, idx_h3, idx_h4_final]
    descriptions = [
        "Hospital 1 (Geriatric Center - Age >= 60)",
        "Hospital 2 (Tertiary General Hospital - Age 52-59)",
        "Hospital 3 (Cardiology Referral Specialist Unit)",
        "Hospital 4 (Community Clinic - Age < 52)"
    ]

    client_data = {}
    print("\n=======================================================")
    print("NON-IID HOSPITAL PARTITIONING SUMMARY")
    print("=======================================================")
    
    for i in range(n_clients):
        idx = client_indices[i]
        X_c = X_train[idx]
        y_c = y_train[idx]
        pos_rate = np.mean(y_c) * 100 if len(y_c) > 0 else 0
        
        client_data[f"Hospital_{i+1}"] = {
            "X": X_c,
            "y": y_c,
            "name": descriptions[i],
            "n_samples": len(y_c),
            "disease_prevalence": pos_rate
        }
        print(f"[{f'Hospital_{i+1}'}] {descriptions[i]}")
        print(f"    - Sample Size : {len(y_c)} patients ({len(y_c)/len(y_train)*100:.1f}% of train data)")
        print(f"    - Disease Rate: {pos_rate:.1f}% positive heart disease cases\n")

    print("=======================================================\n")
    return client_data
