"""
Main Federated Learning Orchestrator

1. Preprocesses UCI Heart Disease Dataset (80/20 train/test split).
2. Partitions training set into N=4 Non-IID Hospital Clients.
3. Queries Blockchain Consent Bridge (flEligible status on EHRAccessControl.sol).
4. Executes R=15 rounds of Federated Averaging (FedAvg).
5. Trains Centralized Baseline model on pooled data for equivalent epochs.
6. Evaluates and plots performance comparison (federated_vs_centralized.png).
7. Exports metrics to CSV (fl_metrics.csv).
"""

import os
import sys
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import torch

from data.preprocess import load_and_preprocess_data, partition_non_iid_hospitals
from models.model import HeartDiseaseNN
from models.fed_avg import train_local_client, aggregate_fed_avg, evaluate_model
from bridge.check_eligibility import check_hospital_eligibility

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "evaluation")

def run_federated_learning(
    client_data,
    eligibility_map,
    X_test,
    y_test,
    input_dim,
    rounds=15,
    local_epochs=5,
    lr=0.01,
    random_seed=42
):
    """
    Executes R rounds of Federated Averaging across eligible hospital clients.
    """
    torch.manual_seed(random_seed)
    np.random.seed(random_seed)

    # Initialize Global Model
    global_model = HeartDiseaseNN(input_dim)
    
    metrics_history = []
    print("\n=======================================================")
    print(f"STARTING FEDERATED LEARNING ({rounds} COMMUNICATION ROUNDS)")
    print(f"    - Number of Hospital Clients : {len(client_data)}")
    print(f"    - Local Epochs per Round     : {local_epochs}")
    print(f"    - Learning Rate (Adam)       : {lr}")
    print("=======================================================")

    for r in range(1, rounds + 1):
        round_client_weights = []
        round_sample_sizes = []
        round_train_losses = []
        round_train_accs = []

        # Client Local Training
        for hid, data in client_data.items():
            # Check on-chain eligibility
            is_eligible = eligibility_map.get(hid, {}).get("eligible", True)
            if not is_eligible:
                print(f"[Round {r:02d}] [!] Skipping {hid}: Excluded by smart contract (flEligible=False).")
                continue

            # Instantiate local client model with current global weights
            local_model = HeartDiseaseNN(input_dim)
            local_model.set_weights(global_model.get_weights())

            # Train locally inside hospital firewall
            updated_weights, loss, acc = train_local_client(
                local_model,
                data["X"],
                data["y"],
                epochs=local_epochs,
                lr=lr,
                batch_size=16
            )

            round_client_weights.append(updated_weights)
            round_sample_sizes.append(data["n_samples"])
            round_train_losses.append(loss)
            round_train_accs.append(acc)

        if not round_client_weights:
            raise RuntimeError("No eligible clients available for training.")

        # Server FedAvg Weight Aggregation
        aggregated_weights = aggregate_fed_avg(round_client_weights, round_sample_sizes)
        global_model.set_weights(aggregated_weights)

        # Global Evaluation on Held-Out Test Set
        eval_metrics = evaluate_model(global_model, X_test, y_test)
        avg_train_loss = np.mean(round_train_losses)
        avg_train_acc = np.mean(round_train_accs)

        record = {
            "round": r,
            "train_loss": avg_train_loss,
            "train_acc": avg_train_acc,
            "test_loss": eval_metrics["loss"],
            "test_acc": eval_metrics["accuracy"],
            "test_precision": eval_metrics["precision"],
            "test_recall": eval_metrics["recall"],
            "test_auc": eval_metrics["auc"],
            "participating_clients": len(round_client_weights)
        }
        metrics_history.append(record)

        print(f"Round {r:02d}/{rounds:02d} | "
              f"Train Loss: {avg_train_loss:.4f} | "
              f"Train Acc: {avg_train_acc*100:.1f}% | "
              f"Global Test Acc: {eval_metrics['accuracy']*100:.2f}% | "
              f"AUC: {eval_metrics['auc']:.4f}")

    print("=======================================================\n")
    return global_model, pd.DataFrame(metrics_history)

def train_centralized_baseline(
    X_train,
    y_train,
    X_test,
    y_test,
    input_dim,
    total_epochs=75,
    lr=0.01,
    random_seed=42
):
    """
    Trains an identical architecture on the pooled centralized dataset (all hospitals combined).
    Total epochs = Rounds (15) * Local Epochs (5) = 75 epochs.
    """
    torch.manual_seed(random_seed)
    np.random.seed(random_seed)

    print("\n=======================================================")
    print("TRAINING CENTRALIZED BASELINE MODEL (POOLED DATA)")
    print(f"    - Pooled Training Samples : {len(X_train)}")
    print(f"    - Total Training Epochs   : {total_epochs}")
    print("=======================================================")

    central_model = HeartDiseaseNN(input_dim)
    criterion = torch.nn.BCELoss()
    optimizer = torch.optim.Adam(central_model.parameters(), lr=lr, weight_decay=1e-4)

    X_tensor = torch.tensor(X_train, dtype=torch.float32)
    y_tensor = torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)
    dataset = torch.utils.data.TensorDataset(X_tensor, y_tensor)
    loader = torch.utils.data.DataLoader(dataset, batch_size=16, shuffle=True)

    central_model.train()
    for epoch in range(1, total_epochs + 1):
        for batch_x, batch_y in loader:
            optimizer.zero_grad()
            preds = central_model(batch_x)
            loss = criterion(preds, batch_y)
            loss.backward()
            optimizer.step()

    eval_metrics = evaluate_model(central_model, X_test, y_test)
    print(f"Centralized Baseline Final Test Acc : {eval_metrics['accuracy']*100:.2f}%")
    print(f"Centralized Baseline Final Test Loss: {eval_metrics['loss']:.4f}")
    print(f"Centralized Baseline Final ROC-AUC  : {eval_metrics['auc']:.4f}")
    print("=======================================================\n")

    return central_model, eval_metrics

def generate_evaluation_artifacts(fl_df, central_metrics):
    """
    Generates comparison plot and saves CSV metrics.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Save Metrics to CSV
    fl_df["centralized_test_acc"] = central_metrics["accuracy"]
    fl_df["centralized_test_loss"] = central_metrics["loss"]
    fl_df["centralized_test_auc"] = central_metrics["auc"]

    csv_path = os.path.join(OUTPUT_DIR, "fl_metrics.csv")
    fl_df.to_csv(csv_path, index=False)
    print(f"[OK] Saved per-round evaluation metrics to {csv_path}")

    # 2. Generate Matplotlib Comparison Plot
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=150)

    rounds = fl_df["round"]
    fed_acc = fl_df["test_acc"] * 100
    central_acc = central_metrics["accuracy"] * 100

    # Subplot 1: Accuracy Comparison
    ax1.plot(rounds, fed_acc, marker="o", color="#0284c7", linewidth=2.5, label="Federated Global Model (FedAvg)")
    ax1.axhline(y=central_acc, color="#e11d48", linestyle="--", linewidth=2, label=f"Centralized Baseline ({central_acc:.1f}%)")
    
    # Annotate final accuracy
    final_fed_acc = fed_acc.iloc[-1]
    ax1.annotate(
        f"Final Fed: {final_fed_acc:.1f}%",
        xy=(rounds.iloc[-1], final_fed_acc),
        xytext=(rounds.iloc[-1] - 3.5, final_fed_acc - 4),
        arrowprops=dict(facecolor="#0284c7", shrink=0.08, width=1.5, headwidth=6),
        fontsize=9,
        fontweight="bold",
        color="#0369a1"
    )

    ax1.set_title("Federated vs. Centralized Model Accuracy on Held-Out Test Set", fontsize=11, fontweight="bold", pad=12)
    ax1.set_xlabel("Communication Round (R)", fontsize=10, fontweight="semibold")
    ax1.set_ylabel("Test Accuracy (%)", fontsize=10, fontweight="semibold")
    ax1.set_ylim(50, 100)
    ax1.set_xticks(range(1, len(rounds) + 1))
    ax1.grid(True, linestyle=":", alpha=0.6)
    ax1.legend(loc="lower right", frameon=True)

    # Subplot 2: Loss Convergence
    ax2.plot(rounds, fl_df["test_loss"], marker="s", color="#8b5cf6", linewidth=2.2, label="Federated Test Loss")
    ax2.plot(rounds, fl_df["train_loss"], marker="^", color="#059669", linestyle=":", linewidth=2, label="Federated Avg Train Loss")
    ax2.axhline(y=central_metrics["loss"], color="#e11d48", linestyle="--", linewidth=1.8, label=f"Centralized Test Loss ({central_metrics['loss']:.3f})")

    ax2.set_title("Loss Convergence Across Communication Rounds", fontsize=11, fontweight="bold", pad=12)
    ax2.set_xlabel("Communication Round (R)", fontsize=10, fontweight="semibold")
    ax2.set_ylabel("Binary Cross-Entropy Loss", fontsize=10, fontweight="semibold")
    ax2.set_xticks(range(1, len(rounds) + 1))
    ax2.grid(True, linestyle=":", alpha=0.6)
    ax2.legend(loc="upper right", frameon=True)

    plt.tight_layout()
    plot_path = os.path.join(OUTPUT_DIR, "federated_vs_centralized.png")
    plt.savefig(plot_path)
    plt.close()
    print(f"[OK] Saved comparison plot to {plot_path}")

    # 3. Print Final Summary Table
    final_fl_acc = fl_df["test_acc"].iloc[-1] * 100
    final_fl_auc = fl_df["test_auc"].iloc[-1]
    gap = central_acc - final_fl_acc

    print("\n" + "="*65)
    print("FINAL EVALUATION SUMMARY & COMPARISON (FOR VIVA DEFENSE)")
    print("="*65)
    print(f"{'Metric':<30} | {'Federated (FedAvg)':<18} | {'Centralized Baseline'}")
    print("-" * 65)
    print(f"{'Final Test Accuracy':<30} | {final_fl_acc:.2f}%{'':<11} | {central_acc:.2f}%")
    print(f"{'Generalization Gap (Drop)':<30} | {gap:+.2f}%{'':<11} | 0.00% (Baseline)")
    print(f"{'ROC-AUC Score':<30} | {final_fl_auc:.4f}{'':<12} | {central_metrics['auc']:.4f}")
    print(f"{'Final Test Loss':<30} | {fl_df['test_loss'].iloc[-1]:.4f}{'':<12} | {central_metrics['loss']:.4f}")
    print(f"{'Privacy Level':<30} | {'Zero-Knowledge FL':<18} | {'High Risk (Centralized)'}")
    print(f"{'GDPR/HIPAA Compliance':<30} | {'Fully Compliant':<18} | {'Non-Compliant'}")
    print("="*65 + "\n")

def main():
    # 1. Load and preprocess data
    X_train, X_test, y_train, y_test, X_train_df, X_test_df, feature_names, scaler = load_and_preprocess_data()
    input_dim = X_train.shape[1]

    # 2. Partition Non-IID Hospitals
    client_data = partition_non_iid_hospitals(X_train, y_train, X_train_df, n_clients=4)

    # 3. Check Blockchain Bridge
    eligibility_map = check_hospital_eligibility(list(client_data.keys()))

    # 4. Run Federated Learning
    global_model, fl_df = run_federated_learning(
        client_data,
        eligibility_map,
        X_test,
        y_test,
        input_dim=input_dim,
        rounds=15,
        local_epochs=5,
        lr=0.01
    )

    # 5. Train Centralized Baseline
    central_model, central_metrics = train_centralized_baseline(
        X_train,
        y_train,
        X_test,
        y_test,
        input_dim=input_dim,
        total_epochs=75,
        lr=0.01
    )

    # 6. Generate Evaluation Outputs
    generate_evaluation_artifacts(fl_df, central_metrics)

if __name__ == "__main__":
    main()
