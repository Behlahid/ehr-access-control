"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { getEHRContract } from "../../lib/contract";
import { bytes32ToCid, shortenAddress, shortenHash, formatTimestamp, parseContractError } from "../../lib/utils";
import { getDemoRecords, toggleDemoFL } from "../../lib/demoEngine";
import UploadModal from "../../components/UploadModal";
import GrantRevokeModal from "../../components/GrantRevokeModal";
import ActivityFeed from "../../components/ActivityFeed";
import Notification from "../../components/Notification";
import CryptographicAuditDrawer from "../../components/CryptographicAuditDrawer";
import CareTeamRoster from "../../components/CareTeamRoster";
import {
  Shield,
  Upload,
  UserCheck,
  UserX,
  Sparkles,
  RefreshCw,
  Clock,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Cpu,
  Layers,
  FileText,
  Lock,
  Heart,
  Activity,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight
} from "lucide-react";

export default function PatientDashboard() {
  const {
    account,
    signer,
    provider,
    connectWallet,
    isConnecting,
    isDemoMode,
    enterDemoMode,
  } = useWeb3();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Tabs: 'records' | 'careteam' | 'audit'
  const [activeTab, setActiveTab] = useState("records");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [flFilter, setFlFilter] = useState("all"); // 'all' | 'eligible' | 'excluded'

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [grantRevokeState, setGrantRevokeState] = useState({
    isOpen: false,
    mode: "grant",
    recordHash: null,
    doctorAddress: "",
  });

  // Toggling state per record hash
  const [togglingFlHash, setTogglingFlHash] = useState(null);
  const [notification, setNotification] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const fetchMyRecords = useCallback(async () => {
    try {
      setLoading(true);

      if (isDemoMode) {
        setRecords(getDemoRecords());
        setLoading(false);
        return;
      }

      if (!account) {
        setRecords([]);
        setLoading(false);
        return;
      }

      const runner = signer || provider;
      if (!runner) {
        setRecords([]);
        setLoading(false);
        return;
      }

      const contract = getEHRContract(runner);
      try {
        const recordsData = await contract.getMyRecords();
        if (recordsData && recordsData.length > 0) {
          const parsed = recordsData.map((rec) => ({
            ipfsHash: rec.ipfsHash,
            owner: rec.owner,
            timestamp: Number(rec.timestamp || 0),
            flEligible: Boolean(rec.flEligible),
            cid: bytes32ToCid(rec.ipfsHash) || "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
          }));
          setRecords(parsed);
        } else {
          setRecords([]);
        }
      } catch (contractErr) {
        console.warn("Could not query on-chain records:", contractErr);
        setRecords([]);
      }
    } catch (err) {
      console.error("Error fetching my records:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [account, signer, provider, isDemoMode]);

  useEffect(() => {
    fetchMyRecords();
  }, [fetchMyRecords, refreshTrigger]);

  useEffect(() => {
    const handleSync = () => {
      if (isDemoMode) {
        setRecords(getDemoRecords());
      } else if (account) {
        fetchMyRecords();
      }
    };
    window.addEventListener("ehr:records-changed", handleSync);
    window.addEventListener("ehr:reset", handleSync);
    return () => {
      window.removeEventListener("ehr:records-changed", handleSync);
      window.removeEventListener("ehr:reset", handleSync);
    };
  }, [account, isDemoMode, fetchMyRecords]);

  const handleToggleFL = async (recordHash, currentStatus) => {
    const newStatus = !currentStatus;

    if (isDemoMode) {
      setTogglingFlHash(recordHash);
      setTimeout(() => {
        const updated = toggleDemoFL(recordHash, newStatus);
        setRecords(updated);
        setNotification({
          type: "success",
          title: newStatus ? "AI Research Consent Active" : "AI Research Consent Paused",
          message: `Simulated Record ${shortenHash(recordHash)} updated in sandbox.`,
          txHash: "0x892fa...demo99",
        });
        setTogglingFlHash(null);
      }, 400);
      return;
    }

    if (!signer) {
      setNotification({
        type: "error",
        title: "Signer Wallet Required",
        message: "Please connect your MetaMask wallet to sign this consent update on Ethereum.",
      });
      return;
    }

    try {
      setTogglingFlHash(recordHash);
      const contract = getEHRContract(signer);
      const tx = await contract.setFLEligibility(recordHash, newStatus);
      const receipt = await tx.wait();

      setNotification({
        type: "success",
        title: newStatus ? "AI Research Consent Active" : "AI Research Consent Paused",
        message: `On-chain consent flag updated successfully in block #${receipt.blockNumber}.`,
        txHash: receipt.hash,
      });

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error toggling FL:", err);
      setNotification({
        type: "error",
        title: "Consent Update Failed",
        message: parseContractError(err),
      });
    } finally {
      setTogglingFlHash(null);
    }
  };

  const getClinicalProfile = (index, hash) => {
    const archetypes = [
      {
        title: "Comprehensive Cardiac Angiography & Stress Study",
        category: "Cardiology",
        institution: "Metro Health Cardiology Institute",
        badge: "Cardiovascular Telemetry",
        badgeColor: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",
        icon: Heart,
      },
      {
        title: "Complete Lipid, Glucose & Metabolic Diagnostic Panel",
        category: "Biochemistry",
        institution: "Clinical Pathology Core Lab",
        badge: "FHIR Observation",
        badgeColor: "text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30",
        icon: Activity,
      },
      {
        title: "24-Hour Ambulatory Holter ECG Rhythm Analysis",
        category: "Telemetry",
        institution: "St. Jude Heart Center",
        badge: "Electrophysiology",
        badgeColor: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30",
        icon: Heart,
      },
      {
        title: "High-Resolution Chest CT & Pulmonary Assessment",
        category: "Radiology",
        institution: "Memorial University Medical Center",
        badge: "DICOM Series",
        badgeColor: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
        icon: FileText,
      },
    ];

    const chosen = archetypes[index % archetypes.length];
    return {
      ...chosen,
      recordId: `EHR-${hash ? hash.substring(2, 6).toUpperCase() : (index + 101)}`,
    };
  };

  const copyAddress = (addr) => {
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const flCount = records.filter((r) => r.flEligible).length;
  const flPercentage = records.length > 0 ? Math.round((flCount / records.length) * 100) : 0;

  const filteredRecords = (records || []).filter((rec, index) => {
    if (!rec) return false;
    const profile = getClinicalProfile(index, rec.ipfsHash);
    const q = (searchQuery || "").toLowerCase();
    const matchesSearch =
      profile.title.toLowerCase().includes(q) ||
      profile.category.toLowerCase().includes(q) ||
      profile.recordId.toLowerCase().includes(q) ||
      (rec.cid || "").toLowerCase().includes(q) ||
      (rec.ipfsHash || "").toLowerCase().includes(q);

    if (flFilter === "eligible") return matchesSearch && rec.flEligible;
    if (flFilter === "excluded") return matchesSearch && !rec.flEligible;
    return matchesSearch;
  });

  // -------------------------------------------------------------
  // Unauthenticated State (Connect Wallet or Sandbox)
  // -------------------------------------------------------------
  if (!account && !isDemoMode) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-10 animate-in fade-in duration-300">
        <Notification notification={notification} onClose={() => setNotification(null)} />

        <div className="bg-white dark:bg-[#0B0F17] rounded-3xl p-8 sm:p-12 border border-[#BAE6FD] dark:border-slate-800 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 text-xs font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              <span>PATIENT DATA SOVEREIGNTY VAULT</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-[#0284C7] text-white flex items-center justify-center mx-auto shadow-lg shadow-sky-600/25">
              <Shield className="w-8 h-8" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
              Sovereign Health Records
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-sans">
              Connect your Ethereum wallet to manage client-side encrypted diagnostic records, grant time-bound doctor access, and maintain granular consent over collaborative federated learning.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#0284C7] hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                <span>Connect MetaMask Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => enterDemoMode("patient")}
                className="w-full sm:w-auto h-12 px-7 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Explore Clinical Demo</span>
              </button>
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Zero Plaintext Storage
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Client AES-GCM-256
              </span>
            </div>
          </div>
        </div>

        {/* 3 Pillar Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#0B0F17] rounded-2xl p-6 border border-[#BAE6FD]/70 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Zero-Knowledge Storage</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              All files are encrypted inside your browser with AES-GCM before transmission. Storage nodes only see randomized ciphertext.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B0F17] rounded-2xl p-6 border border-[#BAE6FD]/70 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Granular Doctor Delegation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              Authorize attending physicians on a per-record basis with automatic expiration timestamps enforced by EVM smart contracts.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B0F17] rounded-2xl p-6 border border-[#BAE6FD]/70 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Federated AI Sovereignty</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              Dynamically opt-in or pause AI model training consent per record with live smart contract verification before each round.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Authenticated Patient Portal
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      <Notification notification={notification} onClose={() => setNotification(null)} />

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(hash, tx, fileName) => {
          setNotification({
            type: "success",
            title: "Record Anchored On-Chain",
            message: `"${fileName || "Medical File"}" encrypted client-side and registered on the blockchain.`,
            txHash: tx,
          });
          if (isDemoMode) setRecords(getDemoRecords());
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      <GrantRevokeModal
        isOpen={grantRevokeState.isOpen}
        mode={grantRevokeState.mode}
        recordHash={grantRevokeState.recordHash}
        initialDoctorAddress={grantRevokeState.doctorAddress}
        onClose={() => setGrantRevokeState({ isOpen: false, mode: "grant", recordHash: null, doctorAddress: "" })}
        onSuccess={(title, msg, tx) => {
          setNotification({ type: "success", title, message: msg, txHash: tx });
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Top Banner: Patient Enclave Identity & High-Level Metrics */}
      <section className="bg-white dark:bg-[#0B0F17] rounded-3xl p-6 sm:p-8 border border-[#BAE6FD] dark:border-slate-800 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
              {isDemoMode ? "Alex Mercer" : "Sovereign Health Vault"}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span>{isDemoMode ? "MRN-84920-A" : shortenAddress(account)}</span>
              {account && (
                <button
                  type="button"
                  onClick={() => copyAddress(account)}
                  className="hover:text-sky-600 transition-colors cursor-pointer"
                  title="Copy Ethereum Address"
                >
                  {copiedAddress ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>{isDemoMode ? "Demo Enclave Attested" : "Ethereum Smart Contract Active"}</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed max-w-2xl">
            You maintain cryptographic sovereignty over your health data. Medical payloads are indexed off-chain on IPFS and unlocked strictly via on-chain access grants.
          </p>
        </div>

        {/* Quick Action: Add Record */}
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#0284C7] hover:bg-sky-500 text-white font-bold text-xs tracking-tight shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload & Encrypt Medical Record</span>
          </button>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0B0F17] rounded-2xl p-5 border border-[#BAE6FD]/60 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">Anchored Medical Records</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-heading">
            {records.length}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">100% Client AES-GCM Encrypted</div>
        </div>

        <div className="bg-white dark:bg-[#0B0F17] rounded-2xl p-5 border border-[#BAE6FD]/60 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">Active Doctor Authorizations</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading">
            {isDemoMode ? "2 Clinicians" : "Dynamic Permissions"}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Time-bound access expiry enabled</div>
        </div>

        <div className="bg-white dark:bg-[#0B0F17] rounded-2xl p-5 border border-[#BAE6FD]/60 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">Federated Learning Contribution</div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-heading">
            {flPercentage}% Opted-In
          </div>
          <div className="text-[11px] text-slate-500 font-mono">{flCount} of {records.length} records consented</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("records")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "records"
              ? "bg-[#0284C7] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Medical Records ({records.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("careteam")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "careteam"
              ? "bg-[#0284C7] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Care Team &amp; Delegations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#0284C7] text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Immutable Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: Medical Records */}
      {activeTab === "records" && (
        <div className="space-y-4">
          {/* Search & Filter Header */}
          <div className="bg-white dark:bg-[#0B0F17] rounded-2xl p-4 border border-[#BAE6FD]/60 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search diagnostic encounters by title, category, ID, or IPFS hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFlFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  flFilter === "all" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                All ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setFlFilter("eligible")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  flFilter === "eligible" ? "bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-purple-600"
                }`}
              >
                AI Consented ({flCount})
              </button>
              <button
                type="button"
                onClick={() => setFlFilter("excluded")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  flFilter === "excluded" ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Paused ({records.length - flCount})
              </button>
            </div>
          </div>

          {/* Records List */}
          {loading && records.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#0284C7]" />
              <span>Verifying and querying smart contract records...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-[#0B0F17] rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-base font-bold text-slate-900 dark:text-white font-heading">No matching health records found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
                {records.length === 0 ? "You have not registered any encrypted diagnostic records yet." : "No records match your search criteria."}
              </p>
              {records.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload First Medical Record</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((rec, index) => {
                const profile = getClinicalProfile(index, rec.ipfsHash);
                const IconComponent = profile.icon;
                const isToggling = togglingFlHash === rec.ipfsHash;

                return (
                  <div
                    key={rec.ipfsHash}
                    className="bg-white dark:bg-[#0B0F17] p-5 sm:p-6 rounded-2xl border border-[#BAE6FD]/70 dark:border-slate-800 shadow-sm hover:border-[#0284C7]/50 transition-all space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-[#0284C7] dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 shrink-0 shadow-sm">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                              {profile.title}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {profile.recordId}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${profile.badgeColor}`}>
                              {profile.badge}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-sans">
                            <span>{profile.institution}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {formatTimestamp(rec.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2 self-start">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Tamper-Proof</span>
                        </span>

                        {rec.flEligible ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span>AI Research: Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span>AI Research: Paused</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Patient Sovereignty & Consent Action Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 font-sans">
                          <span>Collaborative AI Training (Differential Privacy)</span>
                          <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-500/30">
                            Live On-Chain Check
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                          Hospital federated nodes verify your smart contract consent before every round.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                        {/* FL Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleFL(rec.ipfsHash, rec.flEligible)}
                          disabled={isToggling}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs cursor-pointer ${
                            rec.flEligible
                              ? "bg-purple-50 dark:bg-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/40"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                          ) : (
                            <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          )}
                          <span>{rec.flEligible ? "Pause AI Consent" : "Opt-In to AI Training"}</span>
                        </button>

                        {/* Authorize Doctor */}
                        <button
                          type="button"
                          onClick={() =>
                            setGrantRevokeState({
                              isOpen: true,
                              mode: "grant",
                              recordHash: rec.ipfsHash,
                              doctorAddress: "",
                            })
                          }
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 transition-all shadow-xs cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Authorize Doctor</span>
                        </button>

                        {/* Revoke Doctor */}
                        <button
                          type="button"
                          onClick={() =>
                            setGrantRevokeState({
                              isOpen: true,
                              mode: "revoke",
                              recordHash: rec.ipfsHash,
                              doctorAddress: "",
                            })
                          }
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition-all shadow-xs cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Revoke Access</span>
                        </button>
                      </div>
                    </div>

                    {/* Cryptographic Proof Progressive Disclosure */}
                    <CryptographicAuditDrawer
                      recordHash={rec.ipfsHash}
                      cid={rec.cid}
                      owner={rec.owner}
                      timestamp={rec.timestamp}
                      flEligible={rec.flEligible}
                      isOwner={true}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Care Team Roster */}
      {activeTab === "careteam" && (
        <div className="bg-white dark:bg-[#0B0F17] rounded-3xl p-6 sm:p-8 border border-[#BAE6FD]/70 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
              Physician Consultation Delegations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Active clinicians authorized to inspect your diagnostic encrypted records under sovereign Smart Contract delegations.
            </p>
          </div>
          <CareTeamRoster
            onRevokeClick={(doctor) => {
              setGrantRevokeState({
                isOpen: true,
                mode: "revoke",
                recordHash: doctor.primaryRecordHash || (records.length > 0 ? records[0].ipfsHash : null),
                doctorAddress: doctor.address,
              });
            }}
            onNotification={(n) => setNotification(n)}
          />
        </div>
      )}

      {/* TAB 3: Immutable Audit Trail */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-[#0B0F17] rounded-3xl p-6 sm:p-8 border border-[#BAE6FD]/70 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0284C7]" />
              <span>Immutable On-Chain Audit Feed</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Unalterable cryptographic event log of record registrations, physician delegations, emergency break-glass overrides, and consent updates.
            </p>
          </div>
          <ActivityFeed key={refreshTrigger} />
        </div>
      )}
    </div>
  );
}
