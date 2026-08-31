# Federated Learning Pipeline with Smart Contract Consent Bridge

This subproject implements a **Cross-Silo Federated Learning (FL)** framework for healthcare disease prediction, integrated with an **Ethereum Smart Contract Consent Bridge** (`EHRAccessControl.sol`).

---

## Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [Dataset & Non-IID Clinical Partitioning](#dataset--non-iid-clinical-partitioning)
3. [Federated Averaging (FedAvg) Mathematical Foundation](#federated-averaging-fedavg-mathematical-foundation)
4. [Smart Contract Consent Bridge & Node Mapping](#smart-contract-consent-bridge--node-mapping)
5. [Live Demo Walkthrough for Viva Examination](#live-demo-walkthrough-for-viva-examination)
6. [Why Per-Round On-Chain Consent Re-Checking Matters (Core Viva Concept)](#why-per-round-on-chain-consent-re-checking-matters-core-viva-concept)
7. [Windows vs. Linux / TFF Compatibility](#windows-vs-linux--tff-compatibility)
8. [Evaluation Results & Output](#evaluation-results--output)
9. [Viva Defense & Q&A Cheatsheet](#viva-defense--qa-cheatsheet)

---

## Overview & Architecture

In medical AI, centralized data aggregation is prohibited under privacy regulations (HIPAA, GDPR) because raw electronic health records contain Protected Health Information (PHI). 

**Cross-Silo Federated Learning** solves this dilemma:
1. $N=4$ hospital nodes keep their clinical records stored locally behind institutional firewalls.
2. A shared global Neural Network model is trained iteratively without raw data ever leaving the client.
3. In each communication round, hospitals train the model locally and transmit **only gradient/weight updates** to a central aggregator.
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
|   1. Query EHRAccessControl.sol for flEligible consent AT START OF EVERY ROUND                |
|   2. Dynamically exclude nodes with revoked consent from aggregation                          |
|   3. Broadcast Global Weights W_t to active nodes                                             |
|   4. Compute Sample-Weighted FedAvg: W_{t+1} = sum (n_k / N_active) * W_{t+1}^k               |
|   5. Evaluate against Held-Out Test Set                                                       |
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

## Dataset & Non-IID Clinical Partitioning

### Dataset: UCI Heart Disease (Cleveland Clinic)
- **Features**: 14 standard clinical attributes (Age, Sex, Chest Pain Type, Resting BP, Serum Cholesterol, Fasting Blood Sugar, Resting ECG, Max Heart Rate, Exercise Angina, ST Depression, Slope, Major Vessels, Thalassemia).
- **Target**: Binary classification (0 = Healthy, 1 = Heart Disease Presence).

### Non-IID Partitioning Rationale (Viva Defense)
Random (IID) shuffling is clinically unrealistic because real hospitals serve different patient demographics. We partition the training dataset into 4 distinct hospital silos:
1. **Hospital 1 (Geriatric Clinic)**: Patients aged $\ge 60$ (higher vascular stiffness and comorbid hypertension; 59.2% disease rate).
2. **Hospital 2 (Tertiary General Hospital)**: Patients aged $52-59$ (balanced cross-section of general population; 50.0% disease rate).
3. **Hospital 3 (Cardiology Referral Specialist Unit)**: High-risk referrals with severe ischemic markers and exercise angina (46.8% disease rate).
4. **Hospital 4 (Youth / Community Outpatient)**: Patients aged $< 52$ (predominantly healthy / lower risk; 29.3% disease rate).

---

## Federated Averaging (FedAvg) Mathematical Foundation

In standard FedAvg (McMahan et al., 2017):
At communication round $t \in [1, R]$:
1. The global model parameterized by weights $W_t$ is broadcast to active hospitals $S_t$.
2. Each hospital $k \in S_t$ optimizes its local model for $E$ local epochs on local private dataset $(X_k, y_k)$ minimizing Binary Cross-Entropy Loss:
   $$\mathcal{L}(y, \hat{y}) = - \left[ y \log(\hat{y}) + (1-y) \log(1-\hat{y}) \right]$$
3. The central server computes the sample-weighted average across active participating nodes:
   $$W_{t+1} = \sum_{k \in S_t} \frac{n_k}{N_t} W_{t+1}^k \quad \text{where} \quad N_t = \sum_{k \in S_t} n_k$$

---

## Smart Contract Consent Bridge & Node Mapping

In `fl-pipeline/bridge/node_record_mapping.json`, each simulated hospital node is mapped to a representative on-chain record hash:

| Hospital Node | Mapped Record Hash | Clinical Persona | Initial State |
| :--- | :--- | :--- | :--- |
| **Hospital 1** | `0x11111111...` | Geriatric Cohort ($\ge 60$) | `flEligible = true` |
| **Hospital 2** | `0x22222222...` | Tertiary General ($52-59$) | `flEligible = true` |
| **Hospital 3** | `0x33333333...` | Cardiology Specialist | `flEligible = true` |
| **Hospital 4** | `0x44444444...` | Community Clinic ($< 52$) | `flEligible = true` |

> [!NOTE]
> In a multi-million record production hospital deployment, each individual patient EHR record carries its own sovereign on-chain record hash and `flEligible` flag. For our 4-node academic simulation, one representative record hash stands in for each hospital's institutional consent status.

---

## Live Demo Walkthrough for Viva Examination

Follow these exact steps to demonstrate the live integration to examiners:

### Step 1: Start Hardhat Local Blockchain
```powershell
cd C:\Users\Behlah\.gemini\antigravity-ide\scratch\ehr-access-control
npx hardhat node
```

### Step 2: Deploy Contract & Seed 4 Hospital Records
In a second terminal:
```powershell
cd C:\Users\Behlah\.gemini\antigravity-ide\scratch\ehr-access-control
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/seed-demo-records.js --network localhost
```

### Step 3: Start Next.js Frontend dApp
```powershell
cd C:\Users\Behlah\.gemini\antigravity-ide\scratch\ehr-access-control\frontend
npm run dev
```
Open **[http://localhost:3000/patient](http://localhost:3000/patient)** with MetaMask connected to Account #0 (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`). You will see all 4 hospital records listed with active **FL Eligible** toggles!

### Step 4: Run Live Interactive Consent Verification Script
In a third terminal:
```powershell
cd C:\Users\Behlah\.gemini\antigravity-ide\scratch\ehr-access-control\fl-pipeline
python demo_live_consent_toggle.py
```
- The script prints all 4 nodes as `APPROVED`.
- It prompts: *"Now go toggle Hospital 2's FL consent OFF in the frontend UI, then press Enter"*.
- In your browser at `/patient`, flip the **FL Eligible** toggle for Record #2 (Hospital 2) and confirm in MetaMask.
- Return to your terminal and press **Enter**.
- The script immediately outputs:
  ```
  [*] Hospital_2 (Hospital 2 (Tertiary General Hospital - Age 52-59)):
      Status Changed: REVOKED (True -> False)
      FL Action     : Hospital node will be AUTOMATICALLY EXCLUDED in next FedAvg round!
  ```

### Step 5: Run Full FL Simulation to Show Dynamic Exclusion in Action
```powershell
python run_fl.py
```
Observe in the live round-by-round terminal output:
```
[Round 01] [!] DYNAMIC EXCLUSION: Hospital_2 excluded — patient revoked flEligible consent on-chain
Round 01/15 | Active Nodes: 3/4 | Global Test Acc: 88.52% | AUC: 0.9535
...
```

---

## Why Per-Round On-Chain Consent Re-Checking Matters (Core Viva Concept)

> [!IMPORTANT]
> **Key Viva Defense Topic**: Why query the blockchain at every communication round rather than just once at the start?

1. **Patient Sovereignty is Continuous, Not Static**:
   - In traditional machine learning, patient consent is treated as a one-time static agreement signed at registration. If a patient changes their mind mid-study, centralized systems have no mechanism to retract data from an ongoing training pipeline.
   - In our decentralized architecture, consent is a **live, sovereign state on Ethereum**. A patient can revoke consent at any second from their smartphone or browser dApp.

2. **Zero-Latency Dynamic Exclusion**:
   - By querying `EHRAccessControl.sol` at the start of each communication round ($R_1, R_2, \dots, R_{15}$), our FL server guarantees that the moment `setFLEligibility(recordHash, false)` is mined into a block, the very next round mathematically excludes that node from local training and global weight aggregation.

3. **Cryptographic Auditability & GDPR "Right to Withdraw" (Article 7(3))**:
   - Under GDPR Article 7(3), data subjects have the legal right to withdraw consent at any time as easily as giving it.
   - Because our bridge reads directly from an immutable smart contract, every inclusion or exclusion event is tied to an on-chain transaction hash, providing auditors with tamper-proof mathematical proof of regulatory compliance.

---

## Windows vs. Linux / TFF Compatibility

> [!NOTE]
> Google TensorFlow Federated (TFF) relies on Bazel-compiled C++ gRPC runtime kernels and only publishes official wheels for Linux and macOS. 
> To guarantee **100% cross-platform execution on Windows without WSL2 dependencies**, this project provides:
> 1. **`run_fl.py`**: A native PyTorch/NumPy FedAvg engine that executes immediately on Windows.
> 2. **`tff_implementation/tff_pipeline.py`**: The official `tensorflow_federated` implementation for Linux/WSL2 deployment.

---

## Evaluation Results & Output

Across 15 communication rounds vs. Regularized Centralized Baseline (with Early Stopping at Epoch 10 & Dropout):

| Metric | Federated (FedAvg - 4 Nodes) | Centralized Baseline | Delta |
| :--- | :--- | :--- | :--- |
| **Accuracy (%)** | **86.89%** | **88.52%** | **+1.64%** |
| **Binary Cross-Entropy Loss** | **0.3067** | **0.2683** | **-0.0384** |
| **Precision (Positive Class)**| **0.8125** | **0.8387** | **+0.0262** |
| **Recall (Positive Class)** | **0.9286** | **0.9286** | **0.0000** |
| **F1-Score (Positive Class)** | **0.8667** | **0.8814** | **+0.0147** |
| **ROC-AUC Score** | **0.9513** | **0.9578** | **+0.0065** |

- **Metrics CSV**: [`evaluation/fl_metrics.csv`](./evaluation/fl_metrics.csv)
- **Comparison Plot**: [`evaluation/federated_vs_centralized.png`](./evaluation/federated_vs_centralized.png)

---

## Viva Defense & Q&A Cheatsheet

### Q1: Why does Centralized training achieve slightly higher accuracy (88.52% vs 86.89%)?
> In centralized training, the optimizer has simultaneous access to the entire pooled dataset with zero communication latency, allowing gradient descent to find a smoother global minimum. In Federated Learning with **Non-IID client distributions**, local gradient updates drift in different directions (client drift). However, FedAvg trades off an expected 1.64% accuracy gap to achieve **100% zero-knowledge data privacy and regulatory compliance**.

### Q2: How does sample-weighted FedAvg handle uneven hospital dataset sizes?
> If we used simple unweighted averaging ($\frac{1}{K} \sum W_k$), a tiny clinic with 15 patients would exert the exact same influence as a regional hospital with 500 patients, overfitting the global model to small sample noise. By weighting each client update by $\frac{n_k}{N_t}$, the global model proportionally reflects empirical population distribution.

### Q3: What happens mathematically when a hospital is excluded dynamically?
> When a hospital node is excluded on-chain, its local model weights are not computed or sent to the server. The aggregation denominator $N_t = \sum_{k \in S_t} n_k$ is recalculated using only the remaining active nodes, ensuring weights normalize cleanly to $1.0$.
