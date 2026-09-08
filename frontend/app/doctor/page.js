"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../../context/Web3Context";
import { getEHRContract } from "../../lib/contract";
import { cidToBytes32, bytes32ToCid, shortenAddress, shortenHash, parseContractError } from "../../lib/utils";
import DecryptModal from "../../components/DecryptModal";
import Notification from "../../components/Notification";
import {
  Stethoscope,
  Search,
  Key,
  ShieldCheck,
  ShieldAlert,
  Send,
  Unlock,
  Loader2,
  FileText,
  User,
  Info,
  CheckCircle2,
  ExternalLink,
  Shield,
  Cpu,
  Lock,
  Terminal,
  Clock
} from "lucide-react";

export default function DoctorDashboard() {
  const { account, signer, provider, connectWallet } = useWeb3();
  const [inputHash, setInputHash] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDecryptOpen, setIsDecryptOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleCheckAccess = async (e) => {
    e?.preventDefault();
    if (!inputHash.trim() || (!signer && !provider)) return;

    try {
      setIsSearching(true);
      setSearchResult(null);

      // Clean input: handle if user entered a CID (Qm...) or a bytes32 hex (0x...)
      let recordBytes32;
      const rawInput = inputHash.trim();
      if (rawInput.startsWith("Qm")) {
        recordBytes32 = cidToBytes32(rawInput);
      } else if (rawInput.startsWith("0x") && rawInput.length === 66) {
        recordBytes32 = rawInput;
      } else if (rawInput.length === 64) {
        recordBytes32 = "0x" + rawInput;
      } else {
        throw new Error("Invalid format. Please provide a 64-character hex hash (0x...) or an IPFS CID (Qm...).");
      }

      const runner = signer || provider;
      const contract = getEHRContract(runner);

      // Check on-chain owner & permissions
      const owner = await contract.recordOwner(recordBytes32);
      const isRegistered = owner !== ethers.ZeroAddress;

      let hasPermission = false;
      if (isRegistered && account) {
        hasPermission = await contract.hasAccess(recordBytes32, account);
      }

      const cid = bytes32ToCid(recordBytes32);

      setSearchResult({
        recordHash: recordBytes32,
        cid,
        owner,
        isRegistered,
        hasPermission,
      });
    } catch (err) {
      console.error("Access verification error:", err);
      setNotification({
        type: "error",
        title: "Verification Error",
        message: parseContractError(err),
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!searchResult || !signer) return;

    try {
      setIsRequesting(true);
      const contract = getEHRContract(signer);

      const tx = await contract.requestAccess(searchResult.recordHash);
      const receipt = await tx.wait();

      setNotification({
        type: "success",
        title: "Access Request Broadcasted",
        message: `An on-chain AccessRequested event was emitted for record ${shortenHash(searchResult.recordHash)}.`,
        txHash: receipt.hash,
      });
    } catch (err) {
      console.error("Error requesting access:", err);
      setNotification({
        type: "error",
        title: "Request Failed",
        message: parseContractError(err),
      });
    } finally {
      setIsRequesting(false);
    }
  };

  if (!account) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-obsidian-900 border border-slate-700/80 flex items-center justify-center text-indigo-400 shadow-lg">
          <Stethoscope className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Physician Terminal</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Connect your authorized clinical Ethereum wallet to verify patient EHR permissions, broadcast access requests, and decrypt authorized medical payloads.
        </p>
        <button
          onClick={connectWallet}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-tight shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
        >
          Connect Physician Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Toast Notification */}
      <Notification notification={notification} onClose={() => setNotification(null)} />

      {/* Decrypt Modal */}
      {searchResult && (
        <DecryptModal
          isOpen={isDecryptOpen}
          cid={searchResult.cid}
          recordHash={searchResult.recordHash}
          onClose={() => setIsDecryptOpen(false)}
        />
      )}

      {/* Terminal Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Physician Access Terminal
          </h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            EHR Verifier
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
          Physician Address: <span className="text-slate-200">{account}</span>
        </p>
      </div>

      {/* Query Search Card */}
      <div className="surface-card rounded-2xl border border-white/[0.08] p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Verify Record Permission On-Chain</span>
          </h3>
          <p className="text-xs text-slate-400">
            Enter an IPFS Content Identifier (CIDv0) or a 32-byte hexadecimal multihash to query smart contract permissions.
          </p>
        </div>

        <form onSubmit={handleCheckAccess} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco or 0x82a9..."
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              className="w-full pl-4 pr-32 py-3 rounded-xl clinical-input text-xs font-mono placeholder:text-slate-500 placeholder:font-sans"
            />
            <button
              type="submit"
              disabled={isSearching || !inputHash.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Inspect</span>
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="text-slate-500">Supported Formats:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            IPFS CIDv0 (Qm...)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            Solidity bytes32 (0x...)
          </span>
        </div>
      </div>

      {/* Query Result Card */}
      {searchResult && (
        <div className="surface-card rounded-2xl border border-white/[0.1] overflow-hidden space-y-6">
          {/* Header Banner Based on Permission */}
          <div
            className={`p-5 flex items-center justify-between border-b ${
              !searchResult.isRegistered
                ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                : searchResult.hasPermission
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {!searchResult.isRegistered ? (
                <ShieldAlert className="w-6 h-6 text-amber-400" />
              ) : searchResult.hasPermission ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <Lock className="w-6 h-6 text-rose-400" />
              )}
              <div>
                <h4 className="text-sm font-bold">
                  {!searchResult.isRegistered
                    ? "Record Not Registered On-Chain"
                    : searchResult.hasPermission
                    ? "Access Permission Granted"
                    : "Access Permission Denied"}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  {!searchResult.isRegistered
                    ? "This multihash does not correspond to any active medical record on Ethereum."
                    : searchResult.hasPermission
                    ? "Your physician address is authorized to decrypt and review this patient's EHR payload."
                    : "Your address is not currently listed in the patient's smart contract access mapping."}
                </p>
              </div>
            </div>

            <div className="font-mono text-xs font-bold uppercase">
              {!searchResult.isRegistered ? "Unanchored" : searchResult.hasPermission ? "Authorized" : "Restricted"}
            </div>
          </div>

          {/* Record Technical Properties */}
          <div className="p-6 space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-obsidian-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono font-medium text-slate-500 uppercase">
                  RECORD MULTIHASH (bytes32)
                </span>
                <div className="font-mono text-xs text-white truncate">
                  {searchResult.recordHash}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-obsidian-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono font-medium text-slate-500 uppercase">
                  IPFS CONTENT IDENTIFIER
                </span>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-cyan-400 truncate">
                    {searchResult.cid}
                  </div>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${searchResult.cid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-cyan-300 ml-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-obsidian-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono font-medium text-slate-500 uppercase">
                  PATIENT RECORD OWNER
                </span>
                <div className="font-mono text-xs text-white">
                  {searchResult.isRegistered ? searchResult.owner : "Zero Address (0x000...)"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-obsidian-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono font-medium text-slate-500 uppercase">
                  CONSENSUS CHECK
                </span>
                <div className="font-mono text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> O(1) Constant Gas Verified
                </div>
              </div>
            </div>

            {/* Action Triggers */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {searchResult.isRegistered && searchResult.hasPermission && (
                <button
                  onClick={() => setIsDecryptOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Open Decryption Station</span>
                </button>
              )}

              {searchResult.isRegistered && !searchResult.hasPermission && (
                <button
                  onClick={handleRequestAccess}
                  disabled={isRequesting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Broadcast On-Chain Access Request</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
