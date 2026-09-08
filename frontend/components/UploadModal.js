"use client";

import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getEHRContract } from "../lib/contract";
import { encryptFile } from "../lib/crypto";
import { uploadEncryptedBlob } from "../lib/ipfs";
import { cidToBytes32, parseContractError } from "../lib/utils";
import {
  X,
  UploadCloud,
  Lock,
  FileText,
  Key,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  Download,
  Copy,
  ShieldCheck,
  CheckCircle2,
  Database,
  Layers,
  Cpu
} from "lucide-react";

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  const { signer, account } = useWeb3();
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("select"); // 'select' | 'encrypting' | 'key_saved' | 'uploading_ipfs' | 'signing_tx' | 'completed'
  const [encryptionResult, setEncryptionResult] = useState(null);
  const [ipfsResult, setIpfsResult] = useState(null);
  const [recordHash, setRecordHash] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const resetModal = () => {
    setFile(null);
    setStep("select");
    setEncryptionResult(null);
    setIpfsResult(null);
    setRecordHash(null);
    setTxHash(null);
    setError(null);
    setCopiedKey(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleEncryptAndProceed = async () => {
    if (!file) return;

    try {
      setError(null);
      setStep("encrypting");

      // 1. Client-side Web Crypto AES-GCM 256-bit encryption
      const encrypted = await encryptFile(file);
      setEncryptionResult(encrypted);

      // Move to key backup confirmation step
      setStep("key_saved");
    } catch (err) {
      console.error("Encryption error:", err);
      setError(err.message || "Failed to encrypt file client-side.");
      setStep("select");
    }
  };

  const handleDownloadKey = () => {
    if (!encryptionResult) return;
    const keyData = {
      recordName: file.name,
      patientAddress: account,
      timestamp: new Date().toISOString(),
      aes256KeyHex: encryptionResult.keyHex,
      algorithm: "AES-GCM-256",
      note: "Store this decryption key securely. Anyone with this key and the IPFS CID can decrypt your medical record.",
    };

    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EHR_Key_${file.name.replace(/\.[^/.]+$/, "")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyKey = () => {
    if (!encryptionResult) return;
    navigator.clipboard.writeText(encryptionResult.keyHex);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleConfirmAndUploadOnChain = async () => {
    if (!encryptionResult || !signer) return;

    try {
      setError(null);

      // 2. Upload Encrypted Blob to IPFS
      setStep("uploading_ipfs");
      const ipfsRes = await uploadEncryptedBlob(encryptionResult.encryptedBlob, `${file.name}.enc`);
      setIpfsResult(ipfsRes);

      // 3. Convert IPFS CID to bytes32 Multihash
      const hashBytes32 = cidToBytes32(ipfsRes.cid);
      setRecordHash(hashBytes32);

      // 4. Anchor to Ethereum Smart Contract
      setStep("signing_tx");
      const contract = getEHRContract(signer);
      const tx = await contract.addRecord(hashBytes32);
      const receipt = await tx.wait();

      setTxHash(receipt.hash);
      setStep("completed");

      if (onSuccess) {
        onSuccess(hashBytes32, receipt.hash);
      }
    } catch (err) {
      console.error("Upload / on-chain registration error:", err);
      setError(parseContractError(err));
      setStep("key_saved");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl surface-card rounded-2xl border border-white/[0.12] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Encrypt & Anchor Medical Record</h3>
              <p className="text-[11px] font-mono text-slate-400">Zero-Knowledge Client-Side AES-256 Protocol</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-[11px] font-mono">
          <div
            className={`p-3 text-center border-r border-slate-800 flex items-center justify-center gap-1.5 ${
              step === "select" || step === "encrypting"
                ? "bg-cyan-500/10 text-cyan-300 font-bold"
                : "text-slate-500"
            }`}
          >
            <span>1. File & AES-256</span>
          </div>
          <div
            className={`p-3 text-center border-r border-slate-800 flex items-center justify-center gap-1.5 ${
              step === "key_saved"
                ? "bg-cyan-500/10 text-cyan-300 font-bold"
                : "text-slate-500"
            }`}
          >
            <span>2. Key Backup</span>
          </div>
          <div
            className={`p-3 text-center flex items-center justify-center gap-1.5 ${
              step === "uploading_ipfs" || step === "signing_tx" || step === "completed"
                ? "bg-cyan-500/10 text-cyan-300 font-bold"
                : "text-slate-500"
            }`}
          >
            <span>3. IPFS & Ethereum</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-mono">{error}</div>
            </div>
          )}

          {/* Step 1: File Selection */}
          {step === "select" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-8 text-center transition-colors cursor-pointer relative bg-obsidian-950/60">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 flex items-center justify-center text-slate-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-white">
                    {file ? file.name : "Select or Drop Medical File"}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB • Ready for AES-GCM-256 encryption`
                      : "Supports PDF, JSON, DICOM, or clinical records"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleEncryptAndProceed}
                disabled={!file}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-obsidian-950 font-bold text-xs font-mono shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Encrypt File Client-Side</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Encrypting State */}
          {step === "encrypting" && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
              <div className="text-sm font-bold text-white font-mono">Generating AES-GCM-256 Ciphertext...</div>
              <p className="text-xs text-slate-500">Deriving cryptographic key in browser memory via Web Crypto API.</p>
            </div>
          )}

          {/* Step 2: Secret Key Backup */}
          {step === "key_saved" && encryptionResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                  <Key className="w-3.5 h-3.5" /> CRITICAL: Back Up Your Decryption Key
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Your medical data is encrypted with client-side Zero-Knowledge AES-256. If you lose this key, your data cannot be decrypted by anyone, including the contract authors.
                </p>
              </div>

              {/* Secret Key Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase">
                  AES-256 Secret Key (Hexadecimal)
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-obsidian-950 border border-slate-800">
                  <code className="text-xs font-mono text-emerald-400 truncate flex-1">
                    {encryptionResult.keyHex}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors shrink-0"
                    title="Copy Key"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadKey}
                  className="w-full sm:w-1/2 py-2.5 rounded-xl surface-interactive text-slate-300 hover:text-white font-mono text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Key JSON</span>
                </button>

                <button
                  onClick={handleConfirmAndUploadOnChain}
                  className="w-full sm:w-1/2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold font-mono text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Anchor to Ethereum</span>
                </button>
              </div>
            </div>
          )}

          {/* Uploading / Signing State */}
          {(step === "uploading_ipfs" || step === "signing_tx") && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-white font-mono">
                  {step === "uploading_ipfs"
                    ? "Pinning Encrypted Blob to IPFS..."
                    : "Confirming Smart Contract Transaction in MetaMask..."}
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {step === "uploading_ipfs"
                    ? "Generating tamper-evident CIDv0 multihash"
                    : "Executing addRecord(bytes32) on-chain"}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Completed */}
          {step === "completed" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Record Successfully Anchored</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Your encrypted health record is pinned to IPFS and registered on the Ethereum smart contract.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-obsidian-950 border border-slate-800 text-left font-mono text-xs space-y-1">
                <div className="text-slate-500">32-Byte Record Multihash:</div>
                <div className="text-white truncate">{recordHash}</div>
                {txHash && (
                  <div className="text-slate-500 pt-1">
                    Transaction: <span className="text-cyan-400">{txHash.slice(0, 16)}...</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-semibold transition-all"
              >
                Close & View in Ledger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
