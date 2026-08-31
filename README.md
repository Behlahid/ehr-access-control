# Decentralized EHR Access Control Smart Contract

An Ethereum-based smart contract implementation for decentralized **Electronic Health Record (EHR)** access control, patient data sovereignty, and privacy-preserving **Federated Learning (FL)** consent management.

Built with **Solidity (0.8.24)**, **Hardhat**, **Ethers.js**, **Mocha/Chai**, and **hardhat-gas-reporter**.

---

## 📋 Table of Contents
1. [System Architecture & Design](#system-architecture--design)
2. [Smart Contract Deep Dive](#smart-contract-deep-dive)
3. [Project Directory Layout](#project-directory-layout)
4. [Setup & Installation](#setup--installation)
5. [Running Tests & Gas Evaluation](#running-tests--gas-evaluation)
6. [Deployment Guide](#deployment-guide)
7. [Viva Defense & Q&A Cheatsheet](#viva-defense--qa-cheatsheet)

---

## 🏛️ System Architecture & Design

In conventional centralized EHR architectures:
- Patient medical data is siloed inside hospital databases (single points of failure, vulnerable to ransomware and data breaches).
- Patients lack visibility and granular control over which clinical entities access their medical histories.
- Sharing data for secondary medical research or AI training requires disclosing raw patient data.

### Decentralized Solution
```
+-------------------+           +-----------------------+           +--------------------+
|  Patient / dApp   |           |  IPFS Storage Network |           |  Ethereum Contract |
+-------------------+           +-----------------------+           +--------------------+
          |                                 |                                  |
          | 1. Encrypt EHR locally          |                                  |
          | 2. Upload ciphertext ---------> | (Stores encrypted payload)       |
          |    <-- Returns IPFS CID (Hash) -+                                  |
          |                                                                    |
          | 3. addRecord(bytes32 ipfsHash) ----------------------------------> |
          |                                                                    | (Registers metadata,
          |                                                                    |  maps owner, emits
          |                                                                    |  RecordAdded event)
          |                                                                    |
+-------------------+                                               +--------------------+
|  Doctor / Requester|                                              |  Ethereum Contract |
+-------------------+                                               +--------------------+
          |                                                                    |
          | 4. requestAccess(recordHash) ------------------------------------> | (Emits AccessRequested)
          |                                                                    |
          | <-- Patient approves via grantAccess(recordHash, doctor) --------- | (Sets accessGranted=true)
          |                                                                    |
          | 5. hasAccess(recordHash, doctor) == true ------------------------> | (Verifies on-chain permission)
          |                                                                    |
          | 6. Fetches ciphertext from IPFS & decrypts with session key        |
```

1. **Off-Chain Data / On-Chain Access Control**: Medical records (imaging, lab reports, EHR JSON) are encrypted on client devices and stored on decentralized storage (IPFS). Only 32-byte cryptographic hashes (`bytes32`) and ownership metadata are stored on-chain.
2. **Patient Data Sovereignty**: Only the patient address that added a record can grant access, revoke access, or modify research/FL eligibility.
3. **Auditable Trail**: Every access grant, revocation, request, and state change produces an indexed Ethereum event that can be queried by indexers (The Graph / subgraphs) or dApp UIs.
4. **Federated Learning (FL) Opt-In**: The `flEligible` flag provides a cryptographic consent switch allowing decentralized clinical machine learning pipelines to include the patient's local data node without transmitting raw patient records to a central server.

---

## 🔍 Smart Contract Deep Dive (`EHRAccessControl.sol`)

### 1. Data Structures & State Mappings
- **`struct Record`**:
  - `bytes32 ipfsHash`: Cryptographic hash identifying the encrypted EHR on IPFS.
  - `address owner`: Patient address that registered the record.
  - `uint256 timestamp`: `block.timestamp` when registered on-chain.
  - `bool flEligible`: Consent toggle for Federated Learning participation (defaults to `false`).
- **`mapping(address => Record[]) public patientRecords`**: Keeps an indexed list of records per patient.
- **`mapping(bytes32 => mapping(address => bool)) public accessGranted`**: Tracks active doctor permissions per record hash.
- **`mapping(bytes32 => address) public recordOwner`**: Provides $O(1)$ ownership lookup and enforces global record hash uniqueness.
- **`mapping(bytes32 => uint256) private recordIndex`**: Enables $O(1)$ updates to the `flEligible` flag inside the `patientRecords` array without iterating.

### 2. Core Functions
| Function | Access Modifier | Description |
| :--- | :--- | :--- |
| `addRecord(bytes32 ipfsHash)` | `external` | Patient registers new record metadata. Reverts on zero hash or duplicate hash. |
| `grantAccess(bytes32 recordHash, address doctor)` | `external` | Owner grants viewing rights to `doctor`. Reverts if caller is not owner or doctor is `address(0)`. |
| `revokeAccess(bytes32 recordHash, address doctor)` | `external` | Owner revokes viewing rights from `doctor`. |
| `requestAccess(bytes32 recordHash)` | `external` | Anyone (doctor/researcher) can broadcast an access request event without mutating permissions. |
| `setFLEligibility(bytes32 recordHash, bool eligible)` | `external` | Owner toggles Federated Learning eligibility flag for the given record. |
| `getMyRecords()` | `external view` | Returns `Record[]` belonging to `msg.sender`. |
| `hasAccess(bytes32 recordHash, address doctor)` | `external view` | Returns `true` if `doctor == owner` or if `accessGranted[recordHash][doctor] == true`. |

---

## 📁 Project Directory Layout

```
ehr-access-control/
├── contracts/
│   └── EHRAccessControl.sol       # Core smart contract with complete NatSpec
├── test/
│   └── EHRAccessControl.test.js   # 16+ unit tests covering all functions, reverts & events
├── scripts/
│   └── deploy.js                  # Deployment script for local and Sepolia testnets
├── hardhat.config.js              # Hardhat configuration (Solidity 0.8.24, Sepolia, Gas Reporter)
├── .env.example                   # Template for RPC URLs and private keys
├── .gitignore                     # Git ignore rules for node_modules, cache, artifacts
├── package.json                   # Project manifest and scripts
└── README.md                      # Complete documentation & Viva defense guide
```

---

## 🚀 Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Fill in your Sepolia RPC URL (from Alchemy or Infura) and your MetaMask test account's private key:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0xyour_private_key_here
REPORT_GAS=true
```

---

## 🧪 Running Tests & Gas Evaluation

### Compile Smart Contract
```bash
npx hardhat compile
```

### Run Unit & Integration Tests
```bash
npx hardhat test
```

### Capture Gas Cost Report (Evaluation Section)
```bash
npm run test:gas
```
This activates `hardhat-gas-reporter` and generates a detailed table of execution and deployment gas consumption for every function call in the contract.

---

## 🌐 Deployment Guide

### 1. Local Deployment (Ephemeral Hardhat Network)
```bash
npx hardhat run scripts/deploy.js
```

### 2. Standalone Local Node
Terminal 1:
```bash
npx hardhat node
```
Terminal 2:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Ethereum Sepolia Testnet Deployment
Ensure your testnet account has Sepolia ETH (from a faucet like Google Cloud Web3 Faucet or Sepolia PoW Faucet).
```bash
npm run deploy:sepolia
```

---

## 🎓 Viva Defense & Q&A Cheatsheet

### Q1: Why store `bytes32` on-chain instead of raw IPFS CID strings (`Qm...` or `bafy...`)?
> **Answer**:
> 1. **Gas Efficiency**: A `string` in Solidity is dynamically-sized, requiring variable storage slots and higher gas cost for allocation and copying. A `bytes32` is a fixed-size value type that fits inside a single 32-byte EVM storage slot (20,000 gas initial write vs. dynamic slot overhead).
> 2. **Deterministic Lookups**: `bytes32` values can be directly used as keys in mappings (`mapping(bytes32 => ...)`), whereas dynamic strings cannot be used directly as mapping keys without hashing (`keccak256(abi.encodePacked(str))`).
> 3. **Format**: An IPFS CIDv0 (Base58) multihash is composed of a 2-byte header (`0x1220`) followed by a 32-byte SHA-256 digest. Stripping the standard header allows packing into `bytes32` directly, or storing the `keccak256` content digest.

### Q2: How does the contract prevent unauthorized doctors from accessing patient data?
> **Answer**:
> Access is enforced at both the smart contract layer and the cryptographic off-chain layer:
> 1. **On-Chain**: `grantAccess`, `revokeAccess`, and `setFLEligibility` contain `require(recordOwner[recordHash] == msg.sender)` checks that immediately revert transactions if called by any address other than the legitimate patient owner.
> 2. **Off-Chain (Zero-Knowledge / Public Key Encryption)**: The raw EHR is encrypted using symmetric AES keys before IPFS upload. The symmetric key is encrypted using the patient's public key (and re-encrypted for the authorized doctor's public key upon access grant). Even if someone reads the IPFS hash, the payload cannot be decrypted without the private key.

### Q3: Why is `flEligible` included in the smart contract?
> **Answer**:
> In healthcare AI, centralizing clinical datasets violates GDPR/HIPAA. **Federated Learning (FL)** solves this by training AI models locally at client nodes and aggregating model weights. The `flEligible` flag provides an on-chain, auditable consent mechanism: patient nodes query the smart contract to verify if their local records are opted-in before allowing the FL client daemon to load them into the local model training batch.

### Q4: Why are events indexed (`indexed recordHash`, `indexed patient`, `indexed doctor`)?
> **Answer**:
> Indexed event parameters are stored in EVM log bloom filters as topics (up to 3 indexed topics per event). This allows frontend dApps, indexers (The Graph), and hospital audit nodes to execute fast, low-latency filter queries (e.g., "Find all records where patient == 0x123..." or "Find all access requests for doctor == 0xABC...") without scanning the entire blockchain history.

### Q5: How is storage optimized for array mutations in `setFLEligibility`?
> **Answer**:
> Finding a record inside a dynamic array (`Record[]`) usually requires a linear search ($O(N)$ gas loop). To optimize this, the contract maintains `mapping(bytes32 => uint256) private recordIndex`, which maps the record hash to its exact index in `patientRecords[owner]`. This allows $O(1)$ constant-time and constant-gas state updates.
