"use client";

import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getEHRContract } from "../lib/contract";
import { encryptFile } from "../lib/crypto";
import { uploadEncryptedBlob } from "../lib/ipfs";
import { cidToBytes32, shortenHash, parseContractError } from "../lib/utils";
import { addDemoRecord, DEMO_PROFILES } from "../lib/demoEngine";
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
  Sparkles,
  ShieldAlert
} from "lucide-react";

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  const { signer, account, isDemoMode } = useWeb3();
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

  const handleLoadSampleFile = () => {
    const sampleClinicalText = `[CLINICAL OBSERVATION & TELEMETRY REPORT - ST. JUDE MEDICAL ENCLAVE]
PATIENT: Alex Mercer | MRN: 84920-A | AGE: 42 | GENDER: Male | BLOOD: O+
ADMISSION DIAGNOSIS: Post-PCI Surveillance / Non-ST Elevation Coronary Ischemia
ATTESTATION: Cryptographically verified via HealthLedger SGX Enclave v2.4

VITAL SIGNS & CARDIOVASCULAR TELEMETRY:
- Heart Rate (ECG Lead II): 72 bpm (Normal Sinus Rhythm)
- Blood Pressure: 118/78 mmHg (Right Arm, Sitting)
- Pulse Oximetry (SpO2): 99% on Ambient Room Air
- Left Ventricular Ejection Fraction (LVEF): 62%
- Serum High-Sensitivity Cardiac Troponin I (hs-cTnI): < 0.01 ng/mL (Ref: < 0.04 ng/mL)
- Fasting Serum Glucose: 92 mg/dL

CLINICAL IMPRESSION & RECOMMENDATIONS:
1. Hemodynamic stability confirmed. No inducible ST-segment depression during ambulation.
2. Maintain secondary prevention pharmacological regimen: Atorvastatin 20mg daily, Aspirin 81mg.
3. Federated Learning consent status: OPTED-IN for privacy-preserving cardiovascular risk modeling.

AUTHORIZING CARDIOLOGIST:
Dr. Sarah Chen, MD, FACC (License #CA-8849201)
Digital Signature: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (EIP-712 Attested)`;

    const sampleBlob = new Blob([sampleClinicalText], { type: "text/plain" });
    const sampleFile = new File([sampleBlob], "Alex_Mercer_Telemetry_ECG_2026.txt", {
      type: "text/plain",
      lastModified: Date.now(),
    });
    setFile(sampleFile);
    setError(null);
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
      patientAddress: account || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
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
    if (!encryptionResult) return;

    try {
      setError(null);

      // 2. Upload Encrypted Blob to IPFS
      setStep("uploading_ipfs");
      const ipfsRes = await uploadEncryptedBlob(encryptionResult.encryptedBlob, `${file.name}.enc`);
      setIpfsResult(ipfsRes);

      // 3. Convert IPFS CID to bytes32 Multihash
      const hashBytes32 = cidToBytes32(ipfsRes.cid);
      setRecordHash(hashBytes32);

      // Demo Mode Fallback
      if (isDemoMode) {
        setStep("signing_tx");
        setTimeout(() => {
          const mockTx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
          setTxHash(mockTx);
          setStep("completed");

          addDemoRecord(
            {
              ipfsHash: hashBytes32,
              cid: ipfsRes.cid,
              owner: account || DEMO_PROFILES.patient.address,
              timestamp: Math.floor(Date.now() / 1000),
              flEligible: true,
              title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Uploaded Clinical Observation",
              category: "Diagnostic Record",
              hospital: "Sovereign Health Node",
              key: encryptionResult.key,
            },
            encryptionResult.key
          );

          if (onSuccess) {
            onSuccess(hashBytes32, mockTx, file.name, encryptionResult.key);
          }
        }, 1000);
        return;
      }

      if (!signer) {
        throw new Error("MetaMask wallet connection required to anchor records on-chain. Please connect your wallet or enter Demo Mode.");
      }

      // 4. Anchor to Ethereum Smart Contract
      setStep("signing_tx");
      const contract = getEHRContract(signer);
      const tx = await contract.addRecord(hashBytes32);
      const receipt = await tx.wait();

      setTxHash(receipt.hash);
      setStep("completed");

      if (onSuccess) {
        onSuccess(hashBytes32, receipt.hash, file.name);
      }
    } catch (err) {
      console.error("Upload / on-chain registration error:", err);
      setError(parseContractError(err));
      setStep("key_saved");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0284C7]/10 border border-[#0284C7]/20 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                Encrypt &amp; Anchor Medical Record
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Zero-Knowledge Client-Side AES-256 Protocol
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Stage Stepper Bar */}
        <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 text-xs font-mono">
          <div
            className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 ${
              step === "select" || step === "encrypting"
                ? "bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] font-bold"
                : step !== "select"
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {step !== "select" && step !== "encrypting" ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-[#0284C7] text-white text-[10px] flex items-center justify-center">1</span>
            )}
            <span>1. File &amp; AES-256</span>
          </div>

          <div
            className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 ${
              step === "key_saved"
                ? "bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] font-bold"
                : step === "completed"
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {step === "completed" ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] flex items-center justify-center">2</span>
            )}
            <span>2. Key Backup</span>
          </div>

          <div
            className={`p-3 text-center flex items-center justify-center gap-1.5 ${
              step === "uploading_ipfs" || step === "signing_tx" || step === "completed"
                ? "bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] font-bold"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {step === "completed" ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] flex items-center justify-center">3</span>
            )}
            <span>3. IPFS &amp; On-Chain</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-mono">{error}</div>
            </div>
          )}

          {/* STEP 1: SELECT FILE */}
          {step === "select" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#0284C7]/50 rounded-2xl p-8 text-center transition-colors cursor-pointer relative bg-slate-50 dark:bg-slate-950/60">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-2.5">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                    {file ? file.name : "Select or Drop Medical Record"}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB • Ready for AES-GCM-256 encryption`
                      : "Supports PDF, JSON, DICOM, or FHIR clinical bundles"}
                  </p>
                </div>
              </div>

              {/* 1-Click Sample File Loader */}
              <button
                type="button"
                onClick={handleLoadSampleFile}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none"
              >
                <Sparkles className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8] shrink-0" />
                <span>Load Sample Clinical Telemetry Report (1-Click Demo)</span>
              </button>

              <button
                type="button"
                onClick={handleEncryptAndProceed}
                disabled={!file}
                className="w-full h-11 rounded-xl bg-[#0284C7] hover:bg-[#0284C7]/90 disabled:opacity-40 text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Encrypt File in Memory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ENCRYPTING PROGRESS STATE */}
          {step === "encrypting" && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0284C7] dark:text-[#38BDF8] mx-auto" />
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                Generating AES-GCM-256 Ciphertext...
              </div>
              <p className="text-xs text-slate-500">
                Deriving cryptographic key in browser memory via Web Crypto API.
              </p>
            </div>
          )}

          {/* STEP 2: KEY BACKUP */}
          {step === "key_saved" && encryptionResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 space-y-1">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-mono">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>CRITICAL: Back Up Your Decryption Key</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Your medical data is encrypted with client-side Zero-Knowledge AES-256. If you lose this key, your data cannot be decrypted by anyone, including the hospital or smart contract.
                </p>
              </div>

              {/* Secret Key Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  AES-256 Secret Key (Hexadecimal)
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <code className="text-xs font-mono text-emerald-700 dark:text-emerald-400 truncate flex-1 select-all">
                    {encryptionResult.keyHex}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                    title="Copy Key"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadKey}
                  className="w-full sm:w-1/2 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Key JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndUploadOnChain}
                  className="w-full sm:w-1/2 h-11 rounded-xl bg-[#0284C7] hover:bg-[#0284C7]/90 text-white font-bold font-mono text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Anchor to Ethereum</span>
                </button>
              </div>
            </div>
          )}

          {/* UPLOADING TO IPFS / SMART CONTRACT STATE */}
          {(step === "uploading_ipfs" || step === "signing_tx") && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#0284C7] dark:text-[#38BDF8] mx-auto" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {step === "uploading_ipfs"
                    ? "Pinning Encrypted Blob to IPFS..."
                    : "Confirming Smart Contract Transaction..."}
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {step === "uploading_ipfs"
                    ? "Generating tamper-evident CIDv0 multihash"
                    : "Executing addRecord(bytes32) on-chain"}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: COMPLETED */}
          {step === "completed" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Record Successfully Anchored
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your encrypted health record is pinned to IPFS and registered on the Ethereum smart contract.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left font-mono text-xs space-y-1">
                <div className="text-slate-500">32-Byte Record Multihash:</div>
                <div className="text-slate-900 dark:text-white truncate font-semibold">{recordHash}</div>
                {txHash && (
                  <div className="text-slate-500 pt-1">
                    Transaction: <span className="text-[#0284C7] dark:text-[#38BDF8]">{txHash.slice(0, 18)}...</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-semibold transition-all cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none"
              >
                Close &amp; View in Ledger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
