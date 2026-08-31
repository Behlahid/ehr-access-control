"""
Live Demo Script: Interactive Blockchain Consent Toggle Verification

Designed for live viva demonstrations to professors & evaluators.
Demonstrates closing the loop between the patient Next.js UI and the Python FL pipeline.
"""

import sys
import time
from bridge.check_eligibility import check_live_hospital_eligibility, RPC_URL, CONTRACT_ADDRESS, NETWORK

def print_status_table(eligibility):
    print("\n" + "-"*75)
    print(f"{'Hospital Node':<16} | {'Status':<24} | {'Record Hash (On-Chain)':<20} | {'Source'}")
    print("-" * 75)
    for hid, info in eligibility.items():
        status_color = "APPROVED" if info["eligible"] else "EXCLUDED"
        tag = "[ENABLED]" if info["eligible"] else "[REVOKED]"
        print(f"{hid:<16} | {tag + ' ' + status_color:<24} | {info['recordHash'][:18]}... | {info['source'][:20]}")
    print("-" * 75 + "\n")

def main():
    print("\n" + "="*75)
    print("LIVE DEMO: SMART CONTRACT GOVERNED FEDERATED LEARNING CONSENT")
    print(f"Network: {NETWORK} | RPC: {RPC_URL} | Contract: {CONTRACT_ADDRESS}")
    print("="*75)
    print("This script queries the actual EHRAccessControl.sol smart contract in real time.")
    print("When a patient flips the 'FL Eligible' toggle in the Next.js UI (/patient),")
    print("the change is immediately reflected on-chain and picked up by the FL pipeline.\n")

    # Step 1: Initial check
    print("[1] Querying Initial On-Chain State for 4 Hospital Nodes...")
    initial_status = check_live_hospital_eligibility(verbose=False)
    print_status_table(initial_status)

    # Step 2: Interactive Prompt for Live Demo
    print("="*75)
    print("LIVE DEMO INSTRUCTIONS FOR EVALUATION / VIVA:")
    print("   1. Open your browser at http://localhost:3000/patient")
    print("   2. Look at Record #2 (Hospital 2 - Tertiary General Hospital)")
    print("   3. Toggle its 'FL Eligible' switch in the UI (Confirm MetaMask transaction)")
    print("   4. Once the transaction confirms in MetaMask, return here.")
    print("="*75)

    input("\nPress [ENTER] after toggling the consent on-chain to re-check...")

    # Step 3: Re-check on-chain state
    print("\n[2] Re-Querying Live On-Chain State from Smart Contract...")
    updated_status = check_live_hospital_eligibility(verbose=False)
    print_status_table(updated_status)

    # Step 4: Show Diff
    print("="*75)
    print("LIVE CONSENT STATE DIFF REPORT:")
    print("="*75)
    changed_count = 0
    for hid in initial_status:
        before = initial_status[hid]["eligible"]
        after = updated_status[hid]["eligible"]
        if before != after:
            changed_count += 1
            direction = "REVOKED (True -> False)" if before and not after else "GRANTED (False -> True)"
            print(f"  [*] {hid} ({initial_status[hid]['name']}):")
            print(f"      Status Changed: {direction}")
            print(f"      FL Action     : Hospital node will be {'AUTOMATICALLY EXCLUDED' if not after else 'INCLUDED'} in next FedAvg round!")
        else:
            state_str = "Active" if after else "Excluded"
            print(f"  - {hid}: Unchanged ({state_str})")

    if changed_count == 0:
        print("\n  [i] No on-chain change detected yet. (Ensure MetaMask transaction confirmed).")
    else:
        print(f"\n  [OK] Verified: Live on-chain consent update successfully detected across {changed_count} node(s)!")
    print("="*75 + "\n")

if __name__ == "__main__":
    main()
