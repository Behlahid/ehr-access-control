# Federated Learning Pipeline with Smart Contract Consent Bridge

This subproject implements a **Cross-Silo Federated Learning (FL)** framework for healthcare disease prediction, integrated with an **Ethereum Smart Contract Consent Bridge** (`EHRAccessControl.sol`).

---

## 📋 Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [Dataset & Non-IID Clinical Partitioning](#dataset--non-iid-clinical-partitioning)
3. [Federated Averaging (FedAvg) Mathematical Foundation](#federated-averaging-fedavg-mathematical-foundation)
4. [Smart Contract Consent Bridge](#smart-contract-consent-bridge)
5. [Windows vs. Linux / TFF Compatibility](#windows-vs-linux--tff-compatibility)
6. [Running the Simulation](#running-the-simulation)
7. [Evaluation Results & Output](#evaluation-results--output)
8. [Viva Defense & Q&A Cheatsheet](#viva-defense--qa-cheatsheet)

---

## 🏛️ Overview & Architecture

In medical AI, centralized data aggregation is prohibited under privacy regulations (HIPAA, GDPR) because raw electronic health records contain Protected Health Information (PHI). 

**Cross-Silo Federated Learning** solves this dilemma:
1. $N=4$ hospital nodes keep their clinical records stored locally behind institutional firewalls.
2. A shared global Neural Network model is trained iteratively without raw data ever leaving the client.
3. In each communication round, hospitals train the model locally and transmit **only encrypted weight updates** to a central aggregator.
4. The central aggregator computes the **Federated Average (FedAvg)** of weights and broadcasts the improved model.

```
                            +-----------------------------------+
                            |    Ethereum Smart Contract        |
                            |    (EHRAccessControl.sol)         |
                            |    Checks flEligible consent      |
                            +-----------------+-----------------+
                                              |
                                              v
+-----------------------------------------------------------------------------------------------+
|                               CENTRAL FL AGGREGATION SERVER                                   |
|   1. Broadcast Global Weights W_t                                                             |
|   2. Compute Sample-Weighted FedAvg: W_{t+1} = sum (n_k / N) * W_{t+1}^k                      |
|   3. Evaluate against Held-Out Test Set                                                       |
+-------------------+--------------------+---------------------+--------------------+-----------+
                    |                    |                     |                    |
             W_t | W_{t+1}^1      W_t | W_{t+1}^2       W_t | W_{t+1}^3      W_t | W_{t+1}^4
                    |                    |                     |                    |
                    v                    v                     v                    v
          +-------------------+ +-------------------+ +-------------------+ +-------------------+
          |    Hospital 1     | |    Hospital 2     | |    Hospital 3     | |    Hospital 4     |
          | Geriatric Center  | | Tertiary Hospital | | Cardiology Clinic | | Community Clinic  |
          |  (Age >= 60)      | |  (Age 52 - 59)    | | (High Angina/CAD) | |   (Age < 52)      |
          |   Local Train     | |   Local Train     | |   Local Train     | |   Local Train     |
          +-------------------+ +-------------------+ +-------------------+ +-------------------+
```

---

## 📊 Dataset & Non-IID Clinical Partitioning

### Dataset: UCI Heart Disease (Cleveland Clinic)
- **Features**: 14 standard clinical attributes (Age, Sex, Chest Pain Type, Resting BP, Serum Cholesterol, Fasting Blood Sugar, Resting ECG, Max Heart Rate, Exercise Angina, ST Depression, Slope, Major Vessels, Thalassemia).
- **Target**: Binary classification (0 = Healthy, 1 = Heart Disease Presence).

### Non-IID Partitioning Rationale (Viva Defense)
Random (IID) shuffling is clinically unrealistic because real hospitals serve different patient demographics. We partition the training dataset into 4 distinct hospital silos:
1. **Hospital 1 (Geriatric Clinic)**: Patients aged $\ge 60$ (higher vascular stiffness and comorbid hypertension).
2. **Hospital 2 (Tertiary General Hospital)**: Patients aged $52-59$ (balanced cross-section of general population).
3. **Hospital 3 (Cardiology Referral Specialist Unit)**: High-risk referrals with severe ischemic markers and exercise angina.
4. **Hospital 4 (Youth / Community Outpatient)**: Patients aged $< 52$ (predominantly healthy / lower risk).

---

## 🧮 Federated Averaging (FedAvg) Mathematical Foundation

In standard FedAvg (McMahan et al., 2017):
At communication round $t \in [1, R]$:
1. The global model parameterized by weights $W_t$ is broadcast to active hospitals $S_t$.
2. Each hospital $k \in S_t$ optimizes its local model for $E$ local epochs on local private dataset $(X_k, y_k)$ minimizing Binary Cross-Entropy Loss:
   $$\mathcal{L}(y, \hat{y}) = - \left[ y \log(\hat{y}) + (1-y) \log(1-\hat{y}) \right]$$
3. The central server computes the sample-weighted average:
   $$W_{t+1} = \sum_{k \in S_t} \frac{n_k}{N_t} W_{t+1}^k \quad \text{where} \quad N_t = \sum_{k \in S_t} n_k$$

---

## 🔗 Smart Contract Consent Bridge (`bridge/check_eligibility.py`)

Before admitting a hospital partition into a training round, the FL orchestrator connects to the deployed `EHRAccessControl.sol` smart contract via **Web3.py**:
1. Maps hospital partitions to their registered `bytes32` record hashes on-chain.
2. Queries the patient's `flEligible` flag.
3. If `flEligible == True`, the partition participates. If `flEligible == False`, the node is dynamically skipped for that round.

---

## 💻 Windows vs. Linux / TFF Compatibility

> [!IMPORTANT]
> **TensorFlow Federated (TFF) Windows Compatibility Note**:
> Google TFF relies on Bazel-compiled C++ gRPC runtime kernels and only publishes official wheels for Linux and macOS. 
> To guarantee **100% cross-platform execution on Windows without WSL2 dependencies**, this project provides:
> 1. **`run_fl.py`**: A native PyTorch/NumPy FedAvg engine that executes immediately on Windows.
> 2. **`tff_implementation/tff_pipeline.py`**: The official `tensorflow_federated` implementation for Linux/WSL2 deployment.

---

## 🚀 Running the Simulation

### 1. Run Native Federated Learning vs. Centralized Baseline
```bash
cd C:\Users\Behlah\.gemini\antigravity-ide\scratch\ehr-access-control\fl-pipeline
python run_fl.py
```

### 2. Output Artifacts Generated
- **`evaluation/fl_metrics.csv`**: Full per-round loss, accuracy, precision, recall, and AUC table.
- **`evaluation/federated_vs_centralized.png`**: High-resolution publication-quality comparison chart.

---

## 🎓 Viva Defense & Q&A Cheatsheet

### Q1: Why does Centralized training achieve slightly higher accuracy than Federated Learning?
> **Answer**:
> In centralized training, the optimizer has simultaneous access to the entire pooled dataset with zero communication latency, allowing gradient descent to find a smoother global minimum. In Federated Learning with **Non-IID client distributions**, local gradient updates drift in different directions (client drift). However, FedAvg trades off a minimal 1–3% accuracy gap to achieve **100% zero-knowledge data privacy and regulatory compliance**.

### Q2: How does sample-weighted FedAvg handle uneven hospital dataset sizes?
> **Answer**:
> If we used simple unweighted averaging ($\frac{1}{K} \sum W_k$), a tiny community clinic with 15 patients would exert the exact same influence as a regional hospital with 500 patients, overfitting the global model to small sample noise. By weighting each client update by $\frac{n_k}{N}$, the global model proportionally reflects empirical data distribution.

### Q3: Why is blockchain essential for Federated Learning in healthcare?
> **Answer**:
> In standard FL, hospitals must trust a centralized orchestrator not to train on unauthorized data. By coupling FL with the `EHRAccessControl.sol` smart contract, patients hold sovereign, cryptographic veto power. If a patient toggles `flEligible = false`, their record hash is rejected on-chain, creating an **immutable, auditable proof of consent**.
