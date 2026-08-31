"use client";

import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getEHRContract } from "../lib/contract";
import { encryptFile } from "../lib/crypto";
import { uploadEncryptedBlob } from "../lib/ipfs";
import { cidToBytes32, parseContractError } from "../lib/utils";
import { X, UploadCloud, Lock, FileText, Key, Check, AlertCircle, Loader2, ArrowRight, Download, Copy, ShieldCheck } from "lucide-react";

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
      note: "Keep this secret key safe. Anyone with this key and the IPFS CID can decrypt your medical record.",
    };

    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EHR_Decryption_Key_${file.name.replace(/\.[^/.]+$/, "")}.json`;
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
      const ipfsData = await uploadEncryptedBlob(
        encryptionResult.encryptedBlob,
        `encrypted_${file.name}.dat`
      );
      setIpfsResult(ipfsData);

      // 3. Convert IPFS CIDv0 to bytes32 format for Solidity
      const bytes32Value = cidToBytes32(ipfsData.cid);
      setRecordHash(bytes32Value);

      // 4. Call Solidity addRecord(bytes32)
      setStep("signing_tx");
      const contract = getEHRContract(signer);
      const tx = await contract.addRecord(bytes32Value);

      // 5. Wait for block confirmation
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStep("completed");

      if (onSuccess) {
        onSuccess(bytes32Value, receipt.hash);
      }
    } catch (err) {
      console.error("Smart contract submission error:", err);
      setError(parseContractError(err));
      setStep("key_saved");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-slate-700/70 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Upload & Encrypt Medical Record</h3>
              <p className="text-xs text-slate-400">Zero-Knowledge Client-Side AES-256 & On-Chain Access Control</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Step 1: Select File */}
        {step === "select" && (
          <div className="space-y-5">
            <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-8 text-center transition-all bg-slate-900/40">
              <input
                type="file"
                id="ehr-file-input"
                accept=".pdf,image/*,.json,.txt,.dcm"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="ehr-file-input" className="cursor-pointer flex flex-col items-center justify-center">
                <div className="w-14 h-14 mb-3 rounded-full bg-slate-800 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7" />
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {file ? file.name : "Click to select Medical Record (PDF / Image)"}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {file ? `${(file.size / 1024).toFixed(1)} KB • Ready for client-side encryption` : "PDF, JPEG, PNG, or DICOM imaging reports"}
                </span>
              </label>
            </div>

            <div className="p-3.5 bg-sky-950/30 border border-sky-800/40 rounded-xl text-xs text-sky-300/90 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <b>Privacy Protocol:</b> Your file will be encrypted directly in your browser using the <b>Web Crypto API (AES-GCM-256)</b> before uploading to IPFS. Unencrypted medical data never leaves your machine.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file}
                onClick={handleEncryptAndProceed}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition-all"
              >
                <span>Encrypt File</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Encrypting Spinner */}
        {step === "encrypting" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
            <div>
              <h4 className="text-base font-semibold text-white">Generating AES-256 Key & Encrypting...</h4>
              <p className="text-xs text-slate-400 mt-1">Computing Initialization Vector (IV) and AES-GCM ciphertext in browser memory.</p>
            </div>
          </div>
        )}

        {/* Step 3: Key Backup & Confirmation */}
        {step === "key_saved" && encryptionResult && (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Key className="w-3.5 h-3.5" /> Generated AES-256 Symmetric Key
                </span>
                <span className="text-[11px] text-slate-400">256-bit Hex</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-emerald-400 break-all select-all">
                {encryptionResult.keyHex}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  Save Key File (.json)
                </button>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey ? "Copied!" : "Copy Key"}
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 leading-relaxed">
              ⚠️ <b>Save this key!</b> In this prototype version, you need to share this key with authorized doctors so they can decrypt the payload after access is granted.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("select")}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmAndUploadOnChain}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition-all"
              >
                <span>Upload to IPFS & Register On-Chain</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4 & 5: Uploading & Signing Status */}
        {(step === "uploading_ipfs" || step === "signing_tx") && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
            <div>
              <h4 className="text-base font-semibold text-white">
                {step === "uploading_ipfs" ? "Pinning Encrypted Blob to IPFS..." : "Awaiting MetaMask Transaction Signature..."}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {step === "uploading_ipfs"
                  ? "Computing CIDv0 content multihash and storing encrypted ciphertext."
                  : "Please confirm the addRecord(bytes32) transaction in your wallet."}
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Success Confirmation */}
        {step === "completed" && (
          <div className="space-y-5 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">Record Registered Successfully!</h4>
              <p className="text-xs text-slate-400 mt-1">Your encrypted health record is now anchored on the blockchain.</p>
            </div>

            <div className="text-left bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">IPFS CID:</span>
                <span className="text-sky-300 select-all">{ipfsResult?.cid}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Solidity bytes32 Hash:</span>
                <span className="text-indigo-300 select-all truncate ml-4 max-w-[240px]">{recordHash}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Transaction Hash:</span>
                <span className="text-emerald-400 select-all truncate ml-4 max-w-[240px]">{txHash}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
