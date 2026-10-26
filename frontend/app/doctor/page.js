"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../../context/Web3Context";
import { getEHRContract } from "../../lib/contract";
import { cidToBytes32, bytes32ToCid, shortenAddress, shortenHash, parseContractError } from "../../lib/utils";
import DecryptModal from "../../components/DecryptModal";
import Notification from "../../components/Notification";
import CryptographicAuditDrawer from "../../components/CryptographicAuditDrawer";
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
  Clock,
  Sparkles,
  ArrowRight,
  Heart,
  Activity
} from "lucide-react";

const DEMO_SHORTCUTS = [
  {
    id: "demo1",
    label: "Demo Patient #1: Cardiac Angiography",
    hash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    patientName: "Alex Mercer",
    title: "Comprehensive Cardiac Angiography & Stress Study",
    hasPermission: true,
    department: "St. Jude Heart Institute",
  },
  {
    id: "demo2",
    label: "Demo Patient #2: Metabolic & Lipid Panel",
    hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    cid: "QmZtmD2qt8fJv3CL8FnjqiusxVHYM1zG29Uej3QakDEnV8",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    patientName: "Alex Mercer",
    title: "Complete Lipid, Glucose & Metabolic Diagnostic Panel",
    hasPermission: false,
    department: "Clinical Pathology Labs",
  },
  {
    id: "demo3",
    label: "Demo Patient #3: 24h Holter ECG Study",
    hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
    cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    patientName: "Alex Mercer",
    title: "24-Hour Ambulatory Holter ECG Rhythm Analysis",
    hasPermission: true,
    department: "Memorial Hospital Telemetry",
  },
];

export default function DoctorDashboard() {
  const {
    account,
    signer,
    provider,
    connectWallet,
    isDemoMode,
    demoUser,
    enterDemoMode,
  } = useWeb3();

  const [inputHash, setInputHash] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDecryptOpen, setIsDecryptOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleCheckAccess = async (e, overrideHash = null) => {
    e?.preventDefault();
    const targetHash = (overrideHash || inputHash).trim();
    if (!targetHash) return;

    try {
      setIsSearching(true);
      setSearchResult(null);

      // Check if matching a demo shortcut
      const matchedDemo = DEMO_SHORTCUTS.find(
        (d) => d.hash.toLowerCase() === targetHash.toLowerCase() || d.cid === targetHash
      );

      // Clean input: handle if user entered a CID (Qm...) or a bytes32 hex (0x...)
      let recordBytes32;
      if (targetHash.startsWith("Qm")) {
        recordBytes32 = cidToBytes32(targetHash);
      } else if (targetHash.startsWith("0x") && targetHash.length === 66) {
        recordBytes32 = targetHash;
      } else if (targetHash.length === 64) {
        recordBytes32 = "0x" + targetHash;
      } else {
        throw new Error("Invalid format. Please provide a 64-character hex hash (0x...) or an IPFS CID (Qm...).");
      }

      // If in demo mode without live contract, or matched demo record
      if (isDemoMode || !signer && !provider) {
        const cid = matchedDemo ? matchedDemo.cid : bytes32ToCid(recordBytes32);
        const owner = matchedDemo ? matchedDemo.owner : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
        const hasPermission = matchedDemo ? matchedDemo.hasPermission : true;
        const title = matchedDemo ? matchedDemo.title : "Cardiovascular Angiography & Stress Study";

        setSearchResult({
          recordHash: recordBytes32,
          cid,
          owner,
          isRegistered: true,
          hasPermission,
          title,
          patientName: matchedDemo ? matchedDemo.patientName : "Alex Mercer",
          department: matchedDemo ? matchedDemo.department : "St. Jude Heart Institute",
        });
        return;
      }

      // Live contract query
      const runner = signer || provider;
      const contract = getEHRContract(runner);

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
        title: matchedDemo ? matchedDemo.title : "Clinical Electronic Health Record",
        patientName: matchedDemo ? matchedDemo.patientName : "Verified Patient",
        department: matchedDemo ? matchedDemo.department : "General Medical Core",
      });
    } catch (err) {
      console.error("Access verification error:", err);
      // Fallback demo result for testing if RPC is unreachable
      if (isDemoMode) {
        setSearchResult({
          recordHash: targetHash.startsWith("0x") ? targetHash : "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
          cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
          owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          isRegistered: true,
          hasPermission: true,
          title: "Comprehensive Cardiac Angiography & Stress Study",
          patientName: "Alex Mercer",
          department: "St. Jude Heart Institute",
        });
      } else {
        setNotification({
          type: "error",
          title: "Verification Error",
          message: parseContractError(err),
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectShortcut = (shortcut) => {
    setInputHash(shortcut.hash);
    handleCheckAccess(null, shortcut.hash);
  };

  const handleRequestAccess = async () => {
    if (!searchResult) return;

    if (isDemoMode || !signer) {
      setIsRequesting(true);
      setTimeout(() => {
        setIsRequesting(false);
        setNotification({
          type: "success",
          title: "Consultation Request Dispatched",
          message: `An official clinical access request was broadcasted for record ${shortenHash(searchResult.recordHash)}. Patient Alex Mercer will receive an on-chain alert.`,
          txHash: "0x7b29a1f...demo99",
        });
      }, 1000);
      return;
    }

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

  const effectiveAccount = account || "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const isSimulated = !account;

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

      {/* Physician Terminal Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Physician Consultation Terminal
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Licensed Clinician
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {isSimulated || isDemoMode ? (
              <span>Authenticated as <strong className="text-slate-900 dark:text-slate-200">Dr. Sarah Chen, MD</strong> • Chief of Clinical Cardiology (St. Jude Heart Institute)</span>
            ) : (
              <span>Physician Key: <span className="text-slate-900 dark:text-slate-200 font-mono">{account}</span></span>
            )}
          </p>
        </div>

        {isSimulated && (
          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Clinical Demo Sandbox</span>
          </span>
        )}
      </div>

      {/* Interactive Demo Sandbox Banner */}
      {isSimulated && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Interactive Physician Demo Mode Active</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Viewing as <strong className="text-slate-900 dark:text-slate-200">Dr. Sarah Chen, MD</strong> (St. Jude Heart Institute). Click any Quick-Inspect demo chip below to test instant on-chain verification and clinical decryption.
              </p>
            </div>
          </div>
          <button
            onClick={connectWallet}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            <Shield className="w-4 h-4" />
            <span>Connect MetaMask</span>
          </button>
        </div>
      )}

      {/* Query Search Card with Linear-Style Quick Chips */}
      <div className="surface-card rounded-2xl border border-slate-200 dark:border-white/[0.08] p-6 space-y-5 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Inspect Patient Record Permissions</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Enter an IPFS Content Identifier (CIDv0) or a 32-byte hexadecimal multihash, or choose a patient record from the demo list below.
          </p>
        </div>

        <form onSubmit={handleCheckAccess} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco or 0x82a9..."
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              className="w-full pl-4 pr-32 py-3 rounded-xl clinical-input text-xs font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-sans"
            />
            <button
              type="submit"
              disabled={isSearching || !inputHash.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Verify</span>
            </button>
          </div>
        </form>

        {/* Quick Demo Clinical Record Chips */}
        <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" />
            <span>Quick-Inspect Clinical Demo Records:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {DEMO_SHORTCUTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectShortcut(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Result Card: Clinical Healthcare Card */}
      {searchResult && (
        <div className="surface-card rounded-2xl border border-slate-200 dark:border-white/[0.1] overflow-hidden space-y-6 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
          {/* Header Banner Based on Permission */}
          <div
            className={`p-5 flex items-center justify-between border-b ${
              !searchResult.isRegistered
                ? "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
                : searchResult.hasPermission
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-3.5">
              {!searchResult.isRegistered ? (
                <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : searchResult.hasPermission ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Lock className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <div>
                <h4 className="text-sm font-bold">
                  {!searchResult.isRegistered
                    ? "Record Not Found on Ethereum"
                    : searchResult.hasPermission
                    ? "Consultation Access Authorized"
                    : "Access Restricted — Patient Consent Required"}
                </h4>
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                  {!searchResult.isRegistered
                    ? "This multihash does not correspond to any active electronic health record."
                    : searchResult.hasPermission
                    ? "Your physician address is authorized to decrypt and review this clinical record."
                    : "Your address is not currently authorized. Broadcast an official on-chain request to the patient."}
                </p>
              </div>
            </div>

            <div className="text-xs font-bold uppercase tracking-wider hidden sm:block">
              {!searchResult.isRegistered ? "Unanchored" : searchResult.hasPermission ? "Authorized" : "Restricted"}
            </div>
          </div>

          {/* Record Clinical Overview */}
          <div className="p-6 space-y-5 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  PATIENT SOVEREIGN IDENTITY
                </span>
                <div className="text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-semibold">{searchResult.patientName || "Alex Mercer"}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({shortenAddress(searchResult.owner)})</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {searchResult.department || "St. Jude Heart Institute"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-obsidian-950 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  CLINICAL ACCESS STATUS
                </span>
                <div className={`text-xs flex items-center gap-1.5 font-semibold ${
                  searchResult.hasPermission ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                }`}>
                  {searchResult.hasPermission ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Decryption Permission Active</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Awaiting Patient Authorization</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">
                  {searchResult.hasPermission
                    ? "Session symmetric key decryption permitted"
                    : "Submit on-chain access request for approval"}
                </div>
              </div>
            </div>

            {/* Action Triggers */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {searchResult.isRegistered && searchResult.hasPermission && (
                <button
                  onClick={() => setIsDecryptOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Open Clinical Decryption Station</span>
                </button>
              )}

              {searchResult.isRegistered && !searchResult.hasPermission && (
                <button
                  onClick={handleRequestAccess}
                  disabled={isRequesting}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Request Patient Consultation Access</span>
                </button>
              )}
            </div>

            {/* Progressive Disclosure Component: Cryptographic Audit Drawer */}
            <CryptographicAuditDrawer
              recordHash={searchResult.recordHash}
              cid={searchResult.cid}
              owner={searchResult.owner}
              isOwner={false}
              hasAccess={searchResult.hasPermission}
            />
          </div>
        </div>
      )}
    </div>
  );
}
