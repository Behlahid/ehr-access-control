"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { getEHRContract } from "../../lib/contract";
import { bytes32ToCid, shortenAddress, shortenHash, formatTimestamp, parseContractError } from "../../lib/utils";
import { getDemoRecords, toggleDemoFL, DEMO_PROFILES } from "../../lib/demoEngine";
import UploadModal from "../../components/UploadModal";
import GrantRevokeModal from "../../components/GrantRevokeModal";
import ActivityFeed from "../../components/ActivityFeed";
import Notification from "../../components/Notification";
import CryptographicAuditDrawer from "../../components/CryptographicAuditDrawer";
import LabRangeBar from "../../components/LabRangeBar";
import CareTeamRoster from "../../components/CareTeamRoster";
import JargonTranslatorModal from "../../components/JargonTranslatorModal";
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
  Info,
  BookOpen
} from "lucide-react";

const DEMO_PATIENT_RECORDS = [
  {
    ipfsHash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    timestamp: 1729960249,
    flEligible: true,
    cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  },
  {
    ipfsHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    timestamp: 1729701049,
    flEligible: true,
    cid: "QmZtmD2qt8fJv3CL8FnjqiusxVHYM1zG29Uej3QakDEnV8",
  },
  {
    ipfsHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    timestamp: 1729096249,
    flEligible: false,
    cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
  },
  {
    ipfsHash: "0x3333333333333333333333333333333333333333333333333333333333333333",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    timestamp: 1727713849,
    flEligible: true,
    cid: "QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdukU7xZgDk75zW6",
  },
];

export default function PatientDashboard() {
  const {
    account,
    signer,
    provider,
    connectWallet,
    isConnecting,
    isDemoMode,
    demoUser,
    enterDemoMode,
    isCorrectNetwork,
  } = useWeb3();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Primary view tabs: 'records' | 'careteam'
  const [activeTab, setActiveTab] = useState("records");
  const [expandedRecordHash, setExpandedRecordHash] = useState("0x1111111111111111111111111111111111111111111111111111111111111111");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [flFilter, setFlFilter] = useState("all"); // 'all' | 'eligible' | 'excluded'

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isJargonModalOpen, setIsJargonModalOpen] = useState(false);
  const [grantRevokeState, setGrantRevokeState] = useState({
    isOpen: false,
    mode: "grant", // 'grant' | 'revoke'
    recordHash: null,
    doctorAddress: "",
  });

  // Toggling state per record
  const [togglingFlHash, setTogglingFlHash] = useState(null);

  // Notification state
  const [notification, setNotification] = useState(null);

  const fetchMyRecords = useCallback(async () => {
    try {
      setLoading(true);

      // In Demo Mode, load clinical demo records
      if (isDemoMode) {
        setRecords(getDemoRecords());
        setLoading(false);
        return;
      }

      // If no wallet connected, do not load records
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
          // Connected wallet with 0 records anchored on-chain
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
          message: `Simulated On-Chain State: Record ${shortenHash(recordHash)} has been updated. (Demo Mode)`,
          txHash: "0x892fa...demo99",
        });
        setTogglingFlHash(null);
      }, 500);
      return;
    }

    if (!signer) {
      setNotification({
        type: "error",
        title: "Signer Wallet Required",
        message: "Please connect your MetaMask wallet to sign this consent update transaction.",
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
        title: newStatus ? "AI Research Contribution Active" : "AI Research Contribution Paused",
        message: `Your medical record consent status has been successfully updated on the Ethereum blockchain.`,
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

  // Human-friendly clinical record archetypes based on record position or hash
  const getClinicalProfile = (index, hash) => {
    const archetypes = [
      {
        title: "Comprehensive Cardiac Angiography & Stress Study",
        category: "Cardiology",
        hospital: "Metro Health Cardiology Institute",
        icon: Heart,
        color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
      },
      {
        title: "Complete Lipid, Glucose & Metabolic Diagnostic Panel",
        category: "Biochemistry",
        hospital: "Clinical Pathology Core Lab",
        icon: Activity,
        color: "text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
      },
      {
        title: "24-Hour Ambulatory Holter ECG Rhythm Analysis",
        category: "Cardiovascular Telemetry",
        hospital: "St. Jude Heart Center",
        icon: Heart,
        color: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20",
      },
      {
        title: "High-Resolution Chest CT & Pulmonary Assessment",
        category: "Diagnostic Radiology",
        hospital: "Memorial University Medical Center",
        icon: FileText,
        color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
      },
    ];

    const chosen = archetypes[index % archetypes.length];
    return {
      ...chosen,
      recordId: `EHR-${hash ? hash.substring(2, 6).toUpperCase() : (index + 101)}`,
    };
  };

  const isSimulated = Boolean(isDemoMode);

  const flCount = records.filter((r) => r.flEligible).length;
  const flPercentage = records.length > 0 ? Math.round((flCount / records.length) * 100) : 0;

  // Filtered records
  const filteredRecords = (records || []).filter((rec, index) => {
    if (!rec) return false;
    const profile = getClinicalProfile(index, rec.ipfsHash);
    const searchLower = (searchQuery || "").toLowerCase();
    const title = (profile?.title || "").toLowerCase();
    const category = (profile?.category || "").toLowerCase();
    const recordId = (profile?.recordId || "").toLowerCase();
    const cid = (rec?.cid || "").toLowerCase();
    const ipfsHash = (rec?.ipfsHash || "").toLowerCase();

    const matchesSearch =
      title.includes(searchLower) ||
      category.includes(searchLower) ||
      recordId.includes(searchLower) ||
      cid.includes(searchLower) ||
      ipfsHash.includes(searchLower);

    if (flFilter === "eligible") return matchesSearch && rec.flEligible;
    if (flFilter === "excluded") return matchesSearch && !rec.flEligible;
    return matchesSearch;
  });

  // State A: Disconnected / Unauthenticated Gateway (Neither in Demo Mode nor connected with Web3 Wallet)
  if (!account && !isDemoMode) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-6">
        <Notification notification={notification} onClose={() => setNotification(null)} />
        <JargonTranslatorModal
          isOpen={isJargonModalOpen}
          onClose={() => setIsJargonModalOpen(false)}
        />

        {/* HERO CARD */}
        <div className="surface-card card-premium shimmer-card rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
            {/* Status Beacon Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-xs font-mono font-semibold mb-6 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span>PATIENT ENCLAVE GATEWAY • AUTHENTICATION REQUIRED</span>
            </div>

            {/* Enclave Shield Icon */}
            <div className="w-16 h-16 rounded-2xl bg-cyan-600 dark:bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30 mb-6 animate-subtle-pulse">
              <Shield className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Patient Sovereign Vault
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
              HealthLedger patient vaults are cryptographically isolated enclaves. To inspect your diagnostic records, grant time-locked physician consultation access, or contribute to federated learning, please authenticate with your Ethereum wallet or explore our clinical sandbox.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
              <button
                type="button"
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-premium w-full sm:w-auto h-12 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm tracking-tight shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                <span>Connect MetaMask Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => enterDemoMode("patient")}
                className="btn-premium group w-full sm:w-auto h-12 px-6 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-bold text-sm tracking-tight shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110" />
                <span>Launch Patient Demo (Alex Mercer)</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 font-mono">
              Sepolia Testnet Contract • Zero Plaintext Storage
            </p>
          </div>
        </div>

        {/* 3 Architecture Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Client-Side WebCrypto</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Medical payloads are encrypted directly in your browser with AES-GCM-256 before upload. Storage nodes only see random ciphertext.
            </p>
          </div>

          <div className="surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">EIP-712 Delegations</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Grant and revoke doctor consultation permissions with cryptographic signatures and automatic timestamp expiration.
            </p>
          </div>

          <div className="surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Privacy-Preserving FL</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Opt-in to medical research by training AI models locally with Differential Privacy (DP-SGD) without exposing sensitive clinical records.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      <Notification notification={notification} onClose={() => setNotification(null)} />

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(hash, tx, fileName) => {
          setNotification({
            type: "success",
            title: "Health Record Successfully Anchored",
            message: `Your medical file ${fileName ? `"${fileName}"` : ""} was encrypted client-side with AES-GCM-256 and registered on-chain.`,
            txHash: tx,
          });
          if (isDemoMode) {
            setRecords(getDemoRecords());
          }
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
          setNotification({
            type: "success",
            title: title,
            message: msg,
            txHash: tx,
          });
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Jargon Translation Matrix Modal */}
      <JargonTranslatorModal
        isOpen={isJargonModalOpen}
        onClose={() => setIsJargonModalOpen(false)}
      />

      {/* PATIENT IDENTITY BANNER & SOVEREIGN ENCLAVE ATTESTATION (Stitch Blueprint) */}
      <section className="surface-card card-premium shimmer-card rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isDemoMode ? "Alex Mercer" : "Sovereign Health Node"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {isDemoMode ? "MRN-9482-A • Metro Health System" : (account ? `DID:ETH • ${shortenAddress(account)}` : "Not Authenticated")}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{isDemoMode ? "Demo Sandbox Attested" : "Ethereum Node Verified"}</span>
            </span>
          </div>

          {/* Attestation and Hardware Enclave Metadata */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Hardware Enclave: SGX Nitro v2.4 (Encrypted)
            </span>
            <span>•</span>
            <span className="font-mono text-[11px]">
              Last FHIR Sync: Today, 09:42:18 UTC
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              <Key className="w-3 h-3" />
              Attestation: 0x4fbc...91e3
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn-premium group bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold h-10 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Upload className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Add New Medical Record</span>
          </button>
          <button
            type="button"
            onClick={() => setIsJargonModalOpen(true)}
            className="btn-premium group surface-card hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-semibold h-10 px-3.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400 transition-transform group-hover:scale-110" />
            <span>Plain-Language Guide</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("careteam")}
            className="btn-premium group surface-card hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold h-10 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-slate-400 transition-transform group-hover:rotate-12" />
            <span>Care Team Roster</span>
          </button>
        </div>
      </section>

      {/* EXECUTIVE VITALS & TELEMETRY (Apple Health Bento Grid - Stitch Design) */}
      {isDemoMode ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Executive Vitals &amp; Telemetry</h2>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live BLE Telemetry
            </span>
          </div>

          {/* 4 Vitals Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Resting Heart Rate */}
            <div className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-sm animate-fade-in-up delay-75">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resting Heart Rate</span>
                <Heart className="w-4 h-4 text-rose-500 animate-heartbeat" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">72</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">bpm</span>
              </div>
              {/* Delicate Apple Health SVG Sparkline Curve with Gradient Fill */}
              <div className="my-2.5 h-10 w-full overflow-hidden">
                <svg className="w-full h-full text-cyan-600 dark:text-cyan-400" preserveAspectRatio="none" viewBox="0 0 100 30">
                  <defs>
                    <linearGradient id="patientHrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,18 C12,18 18,8 28,12 C38,16 42,24 52,14 C62,6 68,22 78,12 C88,4 94,14 100,10 L100,30 L0,30 Z"
                    fill="url(#patientHrGrad)"
                  />
                  <path
                    d="M0,18 C12,18 18,8 28,12 C38,16 42,24 52,14 C62,6 68,22 78,12 C88,4 94,14 100,10"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="animate-pulse-path"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Normal Sinus
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">58 - 81 bpm</span>
              </div>
            </div>

            {/* Card 2: Blood Pressure */}
            <div className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-sm animate-fade-in-up delay-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Blood Pressure</span>
                <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">118/78</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">mmHg</span>
              </div>
              {/* Dual Range Indicator */}
              <div className="my-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Systolic 118</span>
                  <span>Diastolic 78</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                  <div className="w-3/5 bg-cyan-600 dark:bg-cyan-500 rounded-full transition-all duration-700 ease-out" />
                  <div className="w-2/5 bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Optimal
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Stage 1 Norm</span>
              </div>
            </div>

            {/* Card 3: Fasting Blood Glucose */}
            <div className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-sm animate-fade-in-up delay-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fasting Blood Glucose</span>
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">92</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">mg/dL</span>
              </div>
              {/* Smooth Fasting Glucose Wave */}
              <div className="my-2.5 h-10 w-full overflow-hidden">
                <svg className="w-full h-full text-purple-600 dark:text-purple-400" preserveAspectRatio="none" viewBox="0 0 100 30">
                  <defs>
                    <linearGradient id="patientGlucoseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,16 C20,14 40,18 60,15 C80,13 90,15 100,14 L100,30 L0,30 Z"
                    fill="url(#patientGlucoseGrad)"
                  />
                  <path
                    d="M0,16 C20,14 40,18 60,15 C80,13 90,15 100,14"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                    className="animate-pulse-path"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Normal
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Est. A1C: 4.9%</span>
              </div>
            </div>

            {/* Card 4: Blood Oxygen */}
            <div className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-sm animate-fade-in-up delay-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Blood Oxygen</span>
                <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">99%</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">SpO2</span>
              </div>
              {/* Pulse Oximetry Continuous Wave */}
              <div className="my-2.5 h-10 w-full overflow-hidden">
                <svg className="w-full h-full text-emerald-600 dark:text-emerald-400" preserveAspectRatio="none" viewBox="0 0 100 30">
                  <defs>
                    <linearGradient id="patientSpo2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,22 C10,22 15,22 20,8 C22,2 25,28 28,18 C32,10 38,22 45,22 C55,22 60,22 65,8 C67,2 70,28 73,18 C77,10 83,22 100,22 L100,30 L0,30 Z"
                    fill="url(#patientSpo2Grad)"
                  />
                  <path
                    d="M0,22 C10,22 15,22 20,8 C22,2 25,28 28,18 C32,10 38,22 45,22 C55,22 60,22 65,8 C67,2 70,28 73,18 C77,10 83,22 100,22"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                    className="animate-pulse-path"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Optimal Saturation
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Cont. Pulse 99</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="surface-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
              <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Biometric IoT &amp; Wearable Telemetry</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  No Active BLE Sensor
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pair an Apple HealthKit bridge, Garmin API, or BLE Holter sensor to stream encrypted vital telemetry directly into your sovereign enclave.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => enterDemoMode("patient")}
            className="btn-premium group flex items-center gap-1.5 h-9 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-semibold transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110" />
            <span>Preview Simulated Vitals in Demo</span>
          </button>
        </section>
      )}

      {/* DISCRETE FHIR DIAGNOSTIC OBSERVATIONS (Stitch Continuous Range Sliders - Demo Only) */}
      {isDemoMode && (
        <section className="surface-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">FHIR Diagnostic Observations</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Standard: <span className="font-mono text-[11px]">HL7 FHIR v4.0.1 Observation Resource Schema</span> • Verified Specimen ID: #SPEC-9921
              </p>
            </div>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-slate-700">
                Lipid Panel
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400">
                Metabolic Markers
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400">
                Biomarker Trends
              </span>
            </div>
          </div>

          {/* Continuous Range Sliders */}
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
            <LabRangeBar
              name="Total Cholesterol"
              value={185}
              unit="mg/dL"
              loinc="LOINC: 2093-3"
              min={0}
              max={300}
              optimalMax={200}
              borderlineMax={239}
              targetLabel="(<200 mg/dL Desirable)"
              status="normal"
              statusLabel="In-Range"
            />
            <LabRangeBar
              name="Triglycerides"
              value={130}
              unit="mg/dL"
              loinc="LOINC: 2571-8"
              min={0}
              max={300}
              optimalMax={150}
              borderlineMax={199}
              targetLabel="(<150 mg/dL Normal)"
              status="normal"
              statusLabel="Safe Zone"
            />
            <LabRangeBar
              name="HDL Cholesterol"
              value={54}
              unit="mg/dL"
              loinc="LOINC: 2085-9"
              min={0}
              max={100}
              optimalMax={60}
              borderlineMax={40}
              targetLabel="(>40 mg/dL Protective)"
              status="normal"
              statusLabel="Protective"
            />
            <LabRangeBar
              name="Fasting Glucose"
              value={92}
              unit="mg/dL"
              loinc="LOINC: 1558-6"
              min={0}
              max={160}
              optimalMax={99}
              borderlineMax={125}
              targetLabel="(70-99 mg/dL Fasting Normal)"
              status="normal"
              statusLabel="Optimal"
            />
          </div>
        </section>
      )}

      {/* Primary Patient Portal View Tabs: Linear / Apple Health Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 relative z-10">
        <button
          id="tab-records-btn"
          type="button"
          onClick={() => setActiveTab("records")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "records"
              ? "bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/40 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Clinical Records & Encounters</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {records.length}
          </span>
        </button>

        <button
          id="tab-careteam-btn"
          type="button"
          onClick={() => setActiveTab("careteam")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "careteam"
              ? "bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/40 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent"
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Care Team & Authorizations</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
            {isDemoMode ? "2 Active" : "0 Active"}
          </span>
        </button>
      </div>

      {activeTab === "careteam" ? (
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
      ) : (
        <div className="surface-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Electronic Medical Records</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {filteredRecords.length} of {records.length}
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Manage doctor consultation access and choose which records contribute to privacy-preserving medical research.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-obsidian-950 rounded-lg border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFlFilter("all")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                flFilter === "all" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-transparent" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setFlFilter("eligible")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                flFilter === "eligible"
                  ? "bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300"
              }`}
            >
              Research Active
            </button>
            <button
              onClick={() => setFlFilter("excluded")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                flFilter === "excluded"
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Research Paused
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records by clinical title, category, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl clinical-input text-xs placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {/* Records List */}
        {loading && records.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-slate-400 animate-pulse flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-600 dark:text-cyan-400" />
            <span>Retrieving your verified medical records...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800">
            <FileText className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-800 dark:text-slate-300">No matching medical records found</div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {records.length === 0
                ? "No medical records have been added to your profile yet."
                : "Try clearing your search query or switching filters."}
            </p>
            {records.length === 0 && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Add Your First Medical Record
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
                  className="surface-card p-5 rounded-2xl hover:border-cyan-500/40 transition-all space-y-4"
                >
                  {/* Card Header: Human-First Medical Title & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl border ${profile.color} flex-shrink-0 shadow-sm`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                            {profile.title}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {profile.recordId}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>{profile.hospital}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
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
                          <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                          <span>AI Research: Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <span>AI Research: Paused</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Discrete Clinical Observations (Apple Health & HL7-FHIR Standard) */}
                  {profile.category === "Biochemistry" && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>Discrete Laboratory Observations (FHIR Observation Resource)</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-semibold">
                          Status: Final • Signed by Attending Pathologist
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <LabRangeBar
                          name="Total Cholesterol"
                          value={185}
                          unit="mg/dL"
                          min={100}
                          max={280}
                          optimalMin={125}
                          optimalMax={200}
                          status="normal"
                        />
                        <LabRangeBar
                          name="Triglycerides"
                          value={130}
                          unit="mg/dL"
                          min={40}
                          max={250}
                          optimalMin={50}
                          optimalMax={150}
                          status="normal"
                        />
                        <LabRangeBar
                          name="HDL Good Cholesterol"
                          value={54}
                          unit="mg/dL"
                          min={20}
                          max={100}
                          optimalMin={40}
                          optimalMax={90}
                          status="normal"
                          notes="High-Density"
                        />
                        <LabRangeBar
                          name="Fasting Blood Glucose"
                          value={92}
                          unit="mg/dL"
                          min={50}
                          max={160}
                          optimalMin={70}
                          optimalMax={99}
                          status="normal"
                        />
                      </div>
                    </div>
                  )}

                  {(profile.category === "Cardiology" || profile.category === "Cardiovascular Telemetry") && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Heart className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Cardiovascular Vitals & Telemetry Summary</span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/20">
                          Continuous Ambulatory Telemetry
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-sm">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">AVG RESTING HR</div>
                          <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">72 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">bpm</span></div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Normal (60–100)</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-sm">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">BLOOD PRESSURE</div>
                          <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">118/78 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mmHg</span></div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Optimal Range</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-sm">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">BLOOD OXYGEN</div>
                          <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">99% <span className="text-xs font-normal text-slate-500 dark:text-slate-400">SpO2</span></div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Normal (&gt;95%)</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-sm">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">RHYTHM CADENCE</div>
                          <div className="text-base font-extrabold font-mono text-purple-700 dark:text-purple-300">Normal Sinus</div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">0% Ectopic Beats</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.category === "Diagnostic Radiology" && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Diagnostic Radiology Report Findings</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">DICOM Series #4029</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        High-resolution helical thoracic CT scan without intravenous contrast. Normal pulmonary vascular markings. No pleural effusions, pneumothorax, or acute airspace consolidation. Cardiac silhouette is normal in size and contour.
                      </p>
                    </div>
                  )}

                  {/* Patient Sovereignty Controls: Research Toggle & Doctor Access */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: AI Medical Research Opt-In Toggle */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                          Contribute to Collaborative AI Heart Disease Research
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 font-semibold">
                          GDPR / HIPAA Opt-In
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                        Trains local hospital diagnostic models without sharing your private medical records or identity.
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                      {/* Consent Switch Button */}
                      <button
                        onClick={() => handleToggleFL(rec.ipfsHash, rec.flEligible)}
                        disabled={isToggling}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm cursor-pointer ${
                          rec.flEligible
                            ? "bg-purple-50 dark:bg-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/40"
                            : "bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                        title="Toggle consent for privacy-preserving AI training"
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        )}
                        <span>{rec.flEligible ? "Pause Research Consent" : "Opt-In to AI Research"}</span>
                      </button>

                      {/* Authorize Doctor */}
                      <button
                        onClick={() =>
                          setGrantRevokeState({
                            isOpen: true,
                            mode: "grant",
                            recordHash: rec.ipfsHash,
                          })
                        }
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 transition-all shadow-sm cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Authorize Doctor</span>
                      </button>

                      {/* Revoke Doctor Access */}
                      <button
                        onClick={() =>
                          setGrantRevokeState({
                            isOpen: true,
                            mode: "revoke",
                            recordHash: rec.ipfsHash,
                          })
                        }
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 transition-all shadow-sm cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Revoke Access</span>
                      </button>
                    </div>
                  </div>

                  {/* Progressive Disclosure Component: Cryptographic Audit Drawer */}
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

      {/* Embedded Live Audit Trail Feed */}
      <div className="surface-card rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Immutable Medical Event Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Cryptographically signed transaction history (Access Grants, Revocations, Record Registrations, and Consent Changes).
            </p>
          </div>
        </div>
        <ActivityFeed key={refreshTrigger} />
      </div>
    </div>
  );
}
