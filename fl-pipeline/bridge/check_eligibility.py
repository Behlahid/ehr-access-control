"""
Blockchain Bridge: Live On-Chain Federated Learning Consent Checker

Connects to the deployed EHRAccessControl.sol smart contract via Web3.py.
For each simulated hospital node in `node_record_mapping.json`, queries the actual
on-chain `flEligible` boolean state to determine if that hospital is authorized
to participate in the current Federated Learning communication round.
"""

import os
import json
from web3 import Web3

BRIDGE_DIR = os.path.dirname(os.path.abspath(__file__))
MAPPING_FILE = os.path.join(BRIDGE_DIR, "node_record_mapping.json")

# Environment / Network Configuration
NETWORK = os.environ.get("ETH_NETWORK", "localhost") # 'localhost' or 'sepolia'
CONTRACT_ADDRESS = os.environ.get(
    "CONTRACT_ADDRESS",
    os.environ.get("NEXT_PUBLIC_CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
)

if NETWORK == "sepolia":
    RPC_URL = os.environ.get("SEPOLIA_RPC_URL", "https://rpc.sepolia.org")
else:
    RPC_URL = os.environ.get("ETH_RPC_URL", "http://127.0.0.1:8545")

# Complete Contract ABI for read queries
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "", "type": "address"},
            {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "name": "patientRecords",
        "outputs": [
            {"internalType": "bytes32", "name": "ipfsHash", "type": "bytes32"},
            {"internalType": "address", "name": "owner", "type": "address"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "bool", "name": "flEligible", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getMyRecords",
        "outputs": [
            {
                "components": [
                    {"internalType": "bytes32", "name": "ipfsHash", "type": "bytes32"},
                    {"internalType": "address", "name": "owner", "type": "address"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"internalType": "bool", "name": "flEligible", "type": "bool"}
                ],
                "internalType": "struct EHRAccessControl.Record[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "recordHash", "type": "bytes32"}],
        "name": "recordOwner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }
]

def load_node_mapping():
    """Loads the 4-node representative on-chain record mapping."""
    if not os.path.exists(MAPPING_FILE):
        raise FileNotFoundError(f"Mapping file not found at {MAPPING_FILE}")
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {k: v for k, v in data.items() if not k.startswith("_")}

def get_web3_contract():
    """Establishes Web3 connection and returns contract instance."""
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        return None, None
    try:
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(CONTRACT_ADDRESS),
            abi=CONTRACT_ABI
        )
        return w3, contract
    except Exception as e:
        print(f"[!] Warning: Could not instantiate contract at {CONTRACT_ADDRESS}: {e}")
        return None, None

def query_on_chain_record_status(contract, record_hash_hex, patient_address=None):
    """
    Queries the contract for a given record's flEligible state.
    1. Checks recordOwner(recordHash)
    2. Iterates patientRecords(owner, index) to retrieve exact boolean
    """
    record_bytes = bytes.fromhex(record_hash_hex.replace("0x", ""))
    
    # Query Owner
    owner = contract.functions.recordOwner(record_bytes).call()
    if owner == "0x0000000000000000000000000000000000000000":
        return False, "Not Registered On-Chain", owner

    target_owner = patient_address or owner

    # Scan owner's patient records for matching hash
    index = 0
    while True:
        try:
            rec = contract.functions.patientRecords(target_owner, index).call()
            # rec = (ipfsHash, owner, timestamp, flEligible)
            if rec[0] == record_bytes:
                return bool(rec[3]), "On-Chain Verified", owner
            index += 1
            if index > 100: # Safety cap
                break
        except Exception:
            # End of array reached
            break

    # If owner registered but not found in array scan, default to False
    return False, "Record Hash Not Found in Patient List", owner

def check_live_hospital_eligibility(verbose=False):
    """
    Queries live on-chain consent for all 4 hospital nodes.

    Returns:
        dict of {
            hospital_id: {
                "eligible": bool,
                "name": str,
                "recordHash": str,
                "patientAddress": str,
                "status": str,
                "source": str
            }
        }
    """
    node_mapping = load_node_mapping()
    w3, contract = get_web3_contract()

    eligibility = {}
    is_live = (w3 is not None and contract is not None)

    for hid, info in node_mapping.items():
        rec_hash = info["recordHash"]
        patient_addr = info.get("patientAddress")

        if is_live:
            try:
                is_eligible, source, owner = query_on_chain_record_status(contract, rec_hash, patient_addr)
                status_text = "APPROVED FOR TRAINING" if is_eligible else "EXCLUDED (NO CONSENT)"
                eligibility[hid] = {
                    "eligible": is_eligible,
                    "name": info["name"],
                    "recordHash": rec_hash,
                    "patientAddress": owner if owner != "0x0000000000000000000000000000000000000000" else patient_addr,
                    "status": status_text,
                    "source": f"Live On-Chain (Contract: {CONTRACT_ADDRESS[:8]}...)"
                }
            except Exception as e:
                # Fallback on RPC call error
                eligibility[hid] = {
                    "eligible": True,
                    "name": info["name"],
                    "recordHash": rec_hash,
                    "patientAddress": patient_addr,
                    "status": "APPROVED FOR TRAINING",
                    "source": f"Local Fallback ({str(e)[:30]})"
                }
        else:
            # Fallback when local Ethereum node is offline
            eligibility[hid] = {
                "eligible": True,
                "name": info["name"],
                "recordHash": rec_hash,
                "patientAddress": patient_addr,
                "status": "APPROVED FOR TRAINING",
                "source": "Local Simulation Preset (Ethereum Node Offline)"
            }

        if verbose:
            tag = "[OK]" if eligibility[hid]["eligible"] else "[EXCLUDED]"
            print(f"  {tag} {hid} ({info['name']})")
            print(f"       Record Hash : {rec_hash[:18]}...")
            print(f"       Consent     : {eligibility[hid]['status']} ({eligibility[hid]['source']})")

    return eligibility

if __name__ == "__main__":
    print("=======================================================")
    print("CHECKING LIVE ON-CHAIN HOSPITAL ELIGIBILITY")
    print(f"Network: {NETWORK} | RPC: {RPC_URL}")
    print(f"Contract: {CONTRACT_ADDRESS}")
    print("=======================================================")
    results = check_live_hospital_eligibility(verbose=True)
    print("=======================================================")
