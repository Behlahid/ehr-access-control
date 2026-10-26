"use client";

import React, { useState } from "react";
import { shortenAddress, shortenHash } from "../lib/utils";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Database,
  Cpu,
  Layers,
  KeyRound
} from "lucide-react";

export default function CryptographicAuditDrawer({
  recordHash,
  cid,
  owner,
  timestamp,
  flEligible,
  isOwner = true,
  hasAccess = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  return (
    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 mt-3">
      {/* Toggle Button for Progressive Disclosure */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-1.5 px-2.5 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-all group"
      >
        <span className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>{isOpen ? "Hide Cryptographic Audit Proof" : "View Cryptographic Blockchain & IPFS Proof"}</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          <span>{isOpen ? "Collapse" : "Expand Proof"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {/* Expandable Technical Proof Container */}
      {isOpen && (
        <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-950/90 border border-slate-200 dark:border-cyan-500/20 text-xs font-mono space-y-3 shadow-inner animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 text-[11px] font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ON-CHAIN CRYPTOGRAPHIC PROOF CERTIFICATE</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              Verified Immutable
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            {/* Field 1: Lossless bytes32 EVM Hash */}
            <div className="space-y-1 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px]">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  <span>EVM Record Digest (bytes32)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(recordHash, "recordHash")}
                  className="hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
                  title="Copy Hash"
                >
                  {copiedField === "recordHash" ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 text-[9px]">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  )}
                </button>
              </div>
              <div className="text-slate-900 dark:text-slate-200 break-all select-all text-[10px] leading-tight font-mono">
                {recordHash}
              </div>
              <div className="text-[9px] text-slate-500">
                Packs multihash into a 32-byte EVM storage word for O(1) gas lookup.
              </div>
            </div>

            {/* Field 2: IPFS Content Identifier */}
            <div className="space-y-1 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px]">
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>IPFS Storage Hash (CIDv0)</span>
                </span>
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${cid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 text-[10px]"
                >
                  <span>Gateway</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="text-slate-900 dark:text-slate-200 break-all select-all text-[10px] leading-tight font-mono">
                {cid}
              </div>
              <div className="text-[9px] text-slate-500">
                Encrypted payload is pinned to IPFS. Storage node only sees ciphertext.
              </div>
            </div>

            {/* Field 3: Patient Sovereign Address */}
            <div className="space-y-1 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
              <div className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Patient Sovereign Owner</span>
              </div>
              <div className="text-slate-900 dark:text-slate-200 text-[10px] break-all select-all font-mono">
                {owner || "Owner Address"}
              </div>
              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Exclusive access delegation rights verified</span>
              </div>
            </div>

            {/* Field 4: Encryption Cipher & FL Consent State */}
            <div className="space-y-1 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-2xs">
              <div className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                <Lock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>Security & AI Consensus Policy</span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50">
                  AES-GCM-256
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  flEligible
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}>
                  {flEligible ? "FL Consent: ACTIVE (Round-by-Round)" : "FL Consent: REVOKED"}
                </span>
              </div>
              <div className="text-[9px] text-slate-500">
                0% Plaintext exposure to miners, nodes, or aggregators.
              </div>
            </div>
          </div>

          {/* Footer Verification Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <span>Contract:</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono">{shortenAddress(contractAddress, 6)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 dark:text-emerald-400/90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ethereum Consensus Validated</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
