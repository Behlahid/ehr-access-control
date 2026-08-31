"""
Main Federated Learning Orchestrator with Live Per-Round On-Chain Consent Verification

At the START OF EVERY COMMUNICATION ROUND, this orchestrator queries EHRAccessControl.sol
via the Blockchain Bridge (check_live_hospital_eligibility) in real time.
If a patient revokes flEligible consent in the frontend UI while training is running,
the very next round dynamically excludes that hospital node from FedAvg weight aggregation!
"""

import os
import copy
import hashlib
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import torch
from sklearn.model_selection import train_test_split

from data.preprocess import load_and_preprocess_data, partition_non_iid_hospitals
from models.model import HeartDiseaseNN
from models.fed_avg import train_local_client, aggregate_fed_avg, evaluate_model
from bridge.check_eligibility import check_live_hospital_eligibility

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "evaluation")

def compute_model_weight_hash(model):
    """Computes a SHA-256 checksum across all parameter tensors in the model."""
    hasher = hashlib.sha256()
    for name, param in sorted(model.named_parameters()):
        hasher.update(param.detach().cpu().numpy().tobytes())
    return hasher.hexdigest()

def run_federated_learning(
    client_data,
    X_test,
    y_test,
    input_dim,
    rounds=15,
    local_epochs=5,
    lr=0.008,
    random_seed=42
):
    """
    Executes R rounds of Federated Averaging with LIVE PER-ROUND ON-CHAIN CONSENT RE-CHECKING.
    """
    torch.manual_seed(random_seed)
    np.random.seed(random_seed)

    global_model = HeartDiseaseNN(input_dim, dropout_rate=0.25)
    metrics_history = []
    round_exclusions = []

    print("\n=======================================================")
    print(f"STARTING FEDERATED LEARNING ({rounds} COMMUNICATION ROUNDS)")
    print(f"    - Number of Hospital Clients : {len(client_data)}")
    print(f"    - Local Epochs per Round     : {local_epochs}")
    print(f"    - Learning Rate (Adam)       : {lr}")
    print(f"    - Consent Protocol           : Live On-Chain Re-Check Every Round")
    print("=======================================================")

    for r in range(1, rounds + 1):
        # LIVE PER-ROUND ON-CHAIN CONSENT QUERY
        # Closing the loop: Checks smart contract flEligible state right before training round begins
        live_eligibility = check_live_hospital_eligibility(verbose=False)

        round_client_weights = []
        round_sample_sizes = []
        round_train_losses = []
        round_train_accs = []
        active_clients = []
        excluded_clients = []

        # Client Local Training
        for hid, data in client_data.items():
            is_eligible = live_eligibility.get(hid, {}).get("eligible", True)
            
            if not is_eligible:
                rec_hash = live_eligibility.get(hid, {}).get("recordHash", "Unknown")
                excluded_clients.append(hid)
                print(f"[Round {r:02d}] [!] DYNAMIC EXCLUSION: {hid} excluded — patient revoked flEligible consent on-chain (Record: {rec_hash[:16]}...)")
                continue

            active_clients.append(hid)

            # Instantiate local client model with current global weights
            local_model = HeartDiseaseNN(input_dim, dropout_rate=0.25)
            local_model.set_weights(global_model.get_weights())

            # Train locally inside hospital node
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
            raise RuntimeError(f"Round {r}: All hospital clients have revoked FL consent on-chain. Cannot proceed with aggregation.")

        # Record exclusions
        if excluded_clients:
            round_exclusions.append({
                "round": r,
                "excluded": excluded_clients,
                "active_count": len(active_clients)
            })

        # Server FedAvg Weight Aggregation (Weighted by contributing sample size)
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
            "test_f1": eval_metrics["f1"],
            "test_auc": eval_metrics["auc"],
            "participating_clients": len(round_client_weights),
            "excluded_clients": ",".join(excluded_clients) if excluded_clients else "None"
        }
        metrics_history.append(record)

        print(f"Round {r:02d}/{rounds:02d} | "
              f"Active Nodes: {len(active_clients)}/{len(client_data)} | "
              f"Train Loss: {avg_train_loss:.4f} | "
              f"Train Acc: {avg_train_acc*100:.1f}% | "
              f"Global Test Acc: {eval_metrics['accuracy']*100:.2f}% | "
              f"Loss: {eval_metrics['loss']:.4f} | "
              f"AUC: {eval_metrics['auc']:.4f}")

    print("=======================================================\n")
    return global_model, pd.DataFrame(metrics_history), round_exclusions

def train_centralized_baseline(
    X_train,
    y_train,
    X_test,
    y_test,
    input_dim,
    max_epochs=75,
    patience=8,
    lr=0.008,
    random_seed=42
):
    """
    Trains Centralized Baseline with:
    - Validation split (15%) for early stopping
    - Early stopping on val_loss with patience to prevent overfitting
    - Dropout & L2 weight decay
    - Restores best performing weights on validation set
    """
    torch.manual_seed(random_seed)
    np.random.seed(random_seed)

    print("\n=======================================================")
    print("TRAINING CENTRALIZED BASELINE (WITH VALIDATION & EARLY STOPPING)")
    print("=======================================================")

    X_sub_train, X_val, y_sub_train, y_val = train_test_split(
        X_train, y_train, test_size=0.15, random_state=random_seed, stratify=y_train
    )

    print(f"    - Sub-Train Samples   : {len(X_sub_train)}")
    print(f"    - Validation Samples  : {len(X_val)}")
    print(f"    - Max Epochs          : {max_epochs}")
    print(f"    - Early Stop Patience : {patience} epochs (monitoring val_loss)")

    central_model = HeartDiseaseNN(input_dim, dropout_rate=0.25)
    criterion = torch.nn.BCELoss()
    optimizer = torch.optim.Adam(central_model.parameters(), lr=lr, weight_decay=1e-3)

    X_train_t = torch.tensor(X_sub_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_sub_train, dtype=torch.float32).unsqueeze(1)
    X_val_t = torch.tensor(X_val, dtype=torch.float32)
    y_val_t = torch.tensor(y_val, dtype=torch.float32).unsqueeze(1)

    dataset = torch.utils.data.TensorDataset(X_train_t, y_train_t)
    loader = torch.utils.data.DataLoader(dataset, batch_size=16, shuffle=True)

    best_val_loss = float("inf")
    best_weights = None
    best_epoch = 0
    patience_counter = 0

    for epoch in range(1, max_epochs + 1):
        central_model.train()
        running_train_loss = 0.0
        for batch_x, batch_y in loader:
            optimizer.zero_grad()
            preds = central_model(batch_x)
            loss = criterion(preds, batch_y)
            loss.backward()
            optimizer.step()
            running_train_loss += loss.item() * batch_x.size(0)

        central_model.eval()
        with torch.no_grad():
            val_preds = central_model(X_val_t)
            val_loss = criterion(val_preds, y_val_t).item()

        if val_loss < best_val_loss - 1e-4:
            best_val_loss = val_loss
            best_weights = copy.deepcopy(central_model.get_weights())
            best_epoch = epoch
            patience_counter = 0
        else:
            patience_counter += 1

        if patience_counter >= patience:
            print(f"    [!] Early stopping triggered at Epoch {epoch:02d} (Best Val Loss: {best_val_loss:.4f} at Epoch {best_epoch:02d})")
            break

    if best_weights is not None:
        central_model.set_weights(best_weights)

    eval_metrics = evaluate_model(central_model, X_test, y_test)
    print(f"Centralized Model Converged at Epoch : {best_epoch}")
    print(f"Centralized Test Accuracy            : {eval_metrics['accuracy']*100:.2f}%")
    print(f"Centralized Test Loss                : {eval_metrics['loss']:.4f}")
    print(f"Centralized Test ROC-AUC             : {eval_metrics['auc']:.4f}")
    print("=======================================================\n")

    return central_model, eval_metrics, best_epoch

def verify_models_differ(fed_model, central_model, X_test, y_test, num_samples=15):
    """
    Step 1 & 3: Rigorous Model Verification & Side-by-Side Probabilities.
    """
    print("\n=======================================================")
    print("STEP 1: MODEL INDEPENDENCE & WEIGHT CHECKSUM VERIFICATION")
    print("=======================================================")

    fed_hash = compute_model_weight_hash(fed_model)
    central_hash = compute_model_weight_hash(central_model)

    print(f"Federated Model Weight Checksum   (SHA-256): {fed_hash}")
    print(f"Centralized Model Weight Checksum (SHA-256): {central_hash}")

    is_identical = (fed_hash == central_hash)
    print(f"Are models identical in memory? : {'YES [BUG]' if is_identical else 'NO - Fully Independent Distinct Models'}")

    l2_dist = 0.0
    for (k1, v1), (k2, v2) in zip(fed_model.named_parameters(), central_model.named_parameters()):
        l2_dist += torch.norm(v1 - v2).item() ** 2
    l2_dist = np.sqrt(l2_dist)
    print(f"Total Parameter L2 Distance ||W_fed - W_central||: {l2_dist:.4f}")

    fed_eval = evaluate_model(fed_model, X_test, y_test)
    central_eval = evaluate_model(central_model, X_test, y_test)

    print("\n-------------------------------------------------------------------------------------")
    print(f"PREDICTED PROBABILITIES SIDE-BY-SIDE (FIRST {num_samples} TEST SAMPLES)")
    print("-------------------------------------------------------------------------------------")
    print(f"{'Sample #':<10} | {'True Label':<12} | {'FedAvg Probability':<20} | {'Centralized Probability':<24} | {'Match?'}")
    print("-------------------------------------------------------------------------------------")

    for i in range(min(num_samples, len(y_test))):
        true_y = int(y_test[i])
        p_fed = fed_eval["probs"][i]
        p_cen = central_eval["probs"][i]
        match = (p_fed >= 0.5) == (p_cen >= 0.5)
        print(f"#{i+1:<9} | {true_y:<12} | {p_fed:.4f} ({'Pos' if p_fed>=0.5 else 'Neg'}){'':<8} | {p_cen:.4f} ({'Pos' if p_cen>=0.5 else 'Neg'}){'':<10} | {'YES' if match else 'DIFFERENT'}")

    print("-------------------------------------------------------------------------------------\n")
    return fed_eval, central_eval

def generate_evaluation_artifacts(fl_df, central_metrics, fed_metrics):
    """
    Generates updated comparison plot and saves CSV metrics.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    fl_df["centralized_test_acc"] = central_metrics["accuracy"]
    fl_df["centralized_test_loss"] = central_metrics["loss"]
    fl_df["centralized_test_f1"] = central_metrics["f1"]
    fl_df["centralized_test_auc"] = central_metrics["auc"]

    csv_path = os.path.join(OUTPUT_DIR, "fl_metrics.csv")
    fl_df.to_csv(csv_path, index=False)
    print(f"[OK] Saved per-round evaluation metrics to {csv_path}")

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=150)

    rounds = fl_df["round"]
    fed_acc = fl_df["test_acc"] * 100
    central_acc = central_metrics["accuracy"] * 100

    # Subplot 1: Accuracy
    ax1.plot(rounds, fed_acc, marker="o", color="#0284c7", linewidth=2.5, label="Federated Global Model (FedAvg)")
    ax1.axhline(y=central_acc, color="#e11d48", linestyle="--", linewidth=2, label=f"Centralized Baseline ({central_acc:.1f}%)")
    
    final_fed_acc = fed_acc.iloc[-1]
    ax1.annotate(
        f"Final Fed: {final_fed_acc:.1f}%",
        xy=(rounds.iloc[-1], final_fed_acc),
        xytext=(rounds.iloc[-1] - 3.5, final_fed_acc - 5),
        arrowprops=dict(facecolor="#0284c7", shrink=0.08, width=1.5, headwidth=6),
        fontsize=9,
        fontweight="bold",
        color="#0369a1"
    )

    ax1.set_title("Federated vs. Centralized Test Accuracy Across Rounds", fontsize=11, fontweight="bold", pad=12)
    ax1.set_xlabel("Communication Round (R)", fontsize=10, fontweight="semibold")
    ax1.set_ylabel("Test Accuracy (%)", fontsize=10, fontweight="semibold")
    ax1.set_ylim(50, 100)
    ax1.set_xticks(range(1, len(rounds) + 1))
    ax1.grid(True, linestyle=":", alpha=0.6)
    ax1.legend(loc="lower right", frameon=True)

    # Subplot 2: Loss
    ax2.plot(rounds, fl_df["test_loss"], marker="s", color="#8b5cf6", linewidth=2.2, label="Federated Test Loss")
    ax2.plot(rounds, fl_df["train_loss"], marker="^", color="#059669", linestyle=":", linewidth=2, label="Federated Avg Train Loss")
    ax2.axhline(y=central_metrics["loss"], color="#e11d48", linestyle="--", linewidth=1.8, label=f"Centralized Test Loss ({central_metrics['loss']:.3f})")

    ax2.set_title("Loss Convergence (Regularized Centralized vs. FedAvg)", fontsize=11, fontweight="bold", pad=12)
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

def print_final_comparison_tables(fed_metrics, central_metrics, round_exclusions):
    """
    Prints Classification Reports, Confusion Matrices, and Final Measured Comparison Table.
    """
    print("\n=======================================================")
    print("CLASSIFICATION REPORT: FEDERATED GLOBAL MODEL (FedAvg)")
    print("=======================================================")
    print(fed_metrics["report"])
    print(f"Confusion Matrix (FedAvg):")
    print(f"  [[TN={fed_metrics['tn']}, FP={fed_metrics['fp']}],")
    print(f"   [FN={fed_metrics['fn']}, TP={fed_metrics['tp']}]]")

    print("\n=======================================================")
    print("CLASSIFICATION REPORT: CENTRALIZED BASELINE MODEL")
    print("=======================================================")
    print(central_metrics["report"])
    print(f"Confusion Matrix (Centralized):")
    print(f"  [[TN={central_metrics['tn']}, FP={central_metrics['fp']}],")
    print(f"   [FN={central_metrics['fn']}, TP={central_metrics['tp']}]]")

    gap_acc = central_metrics["accuracy"]*100 - fed_metrics["accuracy"]*100
    gap_loss = central_metrics["loss"] - fed_metrics["loss"]

    print("\n" + "="*70)
    print("FINAL EMPIRICAL EVALUATION SUMMARY TABLE (MEASURED METRICS ONLY)")
    print("="*70)
    print(f"{'Metric':<28} | {'Federated (FedAvg)':<18} | {'Centralized Baseline':<20} | {'Delta'}")
    print("-" * 70)
    print(f"{'Accuracy (%)':<28} | {fed_metrics['accuracy']*100:<17.2f}% | {central_metrics['accuracy']*100:<19.2f}% | {gap_acc:+.2f}%")
    print(f"{'Binary Cross-Entropy Loss':<28} | {fed_metrics['loss']:<18.4f} | {central_metrics['loss']:<20.4f} | {gap_loss:+.4f}")
    print(f"{'Precision (Macro)':<28} | {fed_metrics['precision']:<18.4f} | {central_metrics['precision']:<20.4f} | {central_metrics['precision'] - fed_metrics['precision']:+.4f}")
    print(f"{'Recall (Macro)':<28} | {fed_metrics['recall']:<18.4f} | {central_metrics['recall']:<20.4f} | {central_metrics['recall'] - fed_metrics['recall']:+.4f}")
    print(f"{'F1-Score':<28} | {fed_metrics['f1']:<18.4f} | {central_metrics['f1']:<20.4f} | {central_metrics['f1'] - fed_metrics['f1']:+.4f}")
    print(f"{'ROC-AUC Score':<28} | {fed_metrics['auc']:<18.4f} | {central_metrics['auc']:<20.4f} | {central_metrics['auc'] - fed_metrics['auc']:+.4f}")
    print(f"{'True Positives (TP)':<28} | {fed_metrics['tp']:<18} | {central_metrics['tp']:<20} | {central_metrics['tp'] - fed_metrics['tp']:+d}")
    print(f"{'True Negatives (TN)':<28} | {fed_metrics['tn']:<18} | {central_metrics['tn']:<20} | {central_metrics['tn'] - fed_metrics['tn']:+d}")
    print(f"{'False Positives (FP)':<28} | {fed_metrics['fp']:<18} | {central_metrics['fp']:<20} | {central_metrics['fp'] - fed_metrics['fp']:+d}")
    print(f"{'False Negatives (FN)':<28} | {fed_metrics['fn']:<18} | {central_metrics['fn']:<20} | {central_metrics['fn'] - fed_metrics['fn']:+d}")
    print("="*70)

    if round_exclusions:
        print("\n[!] ON-CHAIN DYNAMIC EXCLUSION EVENT LOG:")
        for exc in round_exclusions:
            print(f"   * Round {exc['round']:02d}: Excluded {', '.join(exc['excluded'])} ({exc['active_count']} active contributing nodes)")
    else:
        print("\n[*] ON-CHAIN DYNAMIC EXCLUSION EVENT LOG: All 4 Hospital Nodes Maintained Active Consent throughout.")
    print("="*70 + "\n")

def main():
    # 1. Load data
    X_train, X_test, y_train, y_test, X_train_df, X_test_df, feature_names, scaler = load_and_preprocess_data()
    input_dim = X_train.shape[1]

    # 2. Partition Non-IID Hospitals
    client_data = partition_non_iid_hospitals(X_train, y_train, X_train_df, n_clients=4)

    # 3. Run Federated Learning with Per-Round Live Consent Querying
    fed_model, fl_df, round_exclusions = run_federated_learning(
        client_data,
        X_test,
        y_test,
        input_dim=input_dim,
        rounds=15,
        local_epochs=5,
        lr=0.008
    )

    # 4. Train Centralized Baseline with Validation & Early Stopping
    central_model, central_eval, best_epoch = train_centralized_baseline(
        X_train,
        y_train,
        X_test,
        y_test,
        input_dim=input_dim,
        max_epochs=75,
        patience=8,
        lr=0.008
    )

    # 5. Verify Models Differ (Checksums & Raw Probabilities)
    fed_eval, central_eval = verify_models_differ(fed_model, central_model, X_test, y_test, num_samples=15)

    # 6. Generate Evaluation Artifacts
    generate_evaluation_artifacts(fl_df, central_eval, fed_eval)

    # 7. Print Reports & Comparison Table
    print_final_comparison_tables(fed_eval, central_eval, round_exclusions)

if __name__ == "__main__":
    main()
