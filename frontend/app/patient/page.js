"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { getEHRContract } from "../../lib/contract";
import { bytes32ToCid, shortenHash, formatTimestamp, parseContractError } from "../../lib/utils";
import UploadModal from "../../components/UploadModal";
import GrantRevokeModal from "../../components/GrantRevokeModal";
import ActivityFeed from "../../components/ActivityFeed";
import Notification from "../../components/Notification";
import CryptographicAuditDrawer from "../../components/CryptographicAuditDrawer";
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
  Info
} from "lucide-react";

export default function PatientDashboard() {
  const { account, signer, provider, isCorrectNetwork, connectWallet } = useWeb3();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [flFilter, setFlFilter] = useState("all"); // 'all' | 'eligible' | 'excluded'

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [grantRevokeState, setGrantRevokeState] = useState({
    isOpen: false,
    mode: "grant", // 'grant' | 'revoke'
    recordHash: null,
  });

  // Toggling state per record
  const [togglingFlHash, setTogglingFlHash] = useState(null);

  // Notification state
  const [notification, setNotification] = useState(null);

  const fetchMyRecords = useCallback(async () => {
    if (!account || (!signer && !provider)) return;

    try {
      setLoading(true);
      const runner = signer || provider;
      const contract = getEHRContract(runner);

      const recordsData = await contract.getMyRecords();

      const parsed = recordsData.map((rec) => ({
        ipfsHash: rec.ipfsHash,
        owner: rec.owner,
        timestamp: Number(rec.timestamp),
        flEligible: rec.flEligible,
        cid: bytes32ToCid(rec.ipfsHash),
      }));

      setRecords(parsed);
    } catch (err) {
      console.error("Error fetching my records:", err);
      setNotification({
        type: "error",
        title: "Failed to Fetch Records",
        message: parseContractError(err),
      });
    } finally {
      setLoading(false);
    }
  }, [account, signer, provider]);

  useEffect(() => {
    fetchMyRecords();
  }, [fetchMyRecords, refreshTrigger]);

  const handleToggleFL = async (recordHash, currentStatus) => {
    if (!signer) return;

    try {
      setTogglingFlHash(recordHash);
      const contract = getEHRContract(signer);
      const newStatus = !currentStatus;

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
        color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      },
      {
        title: "Complete Lipid, Glucose & Metabolic Diagnostic Panel",
        category: "Biochemistry",
        hospital: "Clinical Pathology Core Lab",
        icon: Activity,
        color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      },
      {
        title: "24-Hour Ambulatory Holter ECG Rhythm Analysis",
        category: "Cardiovascular Telemetry",
        hospital: "St. Jude Heart Center",
        icon: Heart,
        color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      },
      {
        title: "High-Resolution Chest CT & Pulmonary Assessment",
        category: "Diagnostic Radiology",
        hospital: "Memorial University Medical Center",
        icon: FileText,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      },
    ];

    const chosen = archetypes[index % archetypes.length];
    return {
      ...chosen,
      recordId: `EHR-${hash ? hash.substring(2, 6).toUpperCase() : (index + 101)}`,
    };
  };

  if (!account) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-obsidian-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-lg">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Patient Health Portal</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Sign in with your digital cryptographic health key to manage your verified medical history, delegate physician consultation permissions, and control anonymous AI research consent.
        </p>
        <button
          onClick={connectWallet}
          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs tracking-tight shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
        >
          Sign In with Digital Health ID (MetaMask)
        </button>
      </div>
    );
  }

  const flCount = records.filter((r) => r.flEligible).length;
  const flPercentage = records.length > 0 ? Math.round((flCount / records.length) * 100) : 0;

  // Filtered records
  const filteredRecords = records.filter((rec, index) => {
    const profile = getClinicalProfile(index, rec.ipfsHash);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      profile.title.toLowerCase().includes(searchLower) ||
      profile.category.toLowerCase().includes(searchLower) ||
      profile.recordId.toLowerCase().includes(searchLower) ||
      rec.cid.toLowerCase().includes(searchLower) ||
      rec.ipfsHash.toLowerCase().includes(searchLower);

    if (flFilter === "eligible") return matchesSearch && rec.flEligible;
    if (flFilter === "excluded") return matchesSearch && !rec.flEligible;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      <Notification notification={notification} onClose={() => setNotification(null)} />

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(hash, tx) => {
          setNotification({
            type: "success",
            title: "Health Record Successfully Anchored",
            message: `Your medical file was encrypted client-side with AES-GCM-256 and registered on-chain.`,
            txHash: tx,
          });
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      <GrantRevokeModal
        isOpen={grantRevokeState.isOpen}
        mode={grantRevokeState.mode}
        recordHash={grantRevokeState.recordHash}
        onClose={() => setGrantRevokeState({ isOpen: false, mode: "grant", recordHash: null })}
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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Patient Health Portal
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sovereign & Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Personal Health ID: <span className="text-slate-200 font-mono">{account}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={loading}
            className="p-2.5 rounded-xl surface-interactive text-slate-400 hover:text-white transition-colors"
            title="Refresh Medical Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            <span>Add New Medical Record</span>
          </button>
        </div>
      </div>

      {/* Executive Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-card p-5 rounded-xl border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>SOVEREIGN MEDICAL RECORDS</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">{records.length}</div>
          <div className="text-[11px] text-slate-400">Stored off-chain on IPFS, secured on Ethereum</div>
        </div>

        <div className="surface-card p-5 rounded-xl border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>AI RESEARCH CONTRIBUTION</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-purple-300">{flCount} of {records.length}</span>
            <span className="text-xs font-mono text-slate-400">({flPercentage}%)</span>
          </div>
          <div className="text-[11px] text-slate-400">Anonymous participation in clinical AI training</div>
        </div>

        <div className="surface-card p-5 rounded-xl border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>CLIENT PRIVACY STANDARD</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 font-mono">Zero-Knowledge AES-256</div>
          <div className="text-[11px] text-slate-400">Encrypted in browser memory before transmission</div>
        </div>
      </div>

      {/* Medical Records Management Section */}
      <div className="surface-card rounded-2xl border border-white/[0.08] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Your Electronic Health Records</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filteredRecords.length} of {records.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage doctor consultation access and choose which records contribute to privacy-preserving medical research.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 p-1 bg-obsidian-950 rounded-lg border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFlFilter("all")}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                flFilter === "all" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setFlFilter("eligible")}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                flFilter === "eligible"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-slate-400 hover:text-purple-300"
              }`}
            >
              Research Active
            </button>
            <button
              onClick={() => setFlFilter("excluded")}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                flFilter === "excluded"
                  ? "bg-slate-700 text-slate-200 border border-slate-600"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Research Paused
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records by clinical title, category, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl clinical-input text-xs placeholder:text-slate-500"
          />
        </div>

        {/* Records List */}
        {loading && records.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Retrieving your verified medical records from Ethereum...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No matching medical records found</div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {records.length === 0
                ? "No medical records have been added to your profile yet."
                : "Try clearing your search query or switching filters."}
            </p>
            {records.length === 0 && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs shadow-md transition-all"
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
                  className="surface-card p-5 rounded-2xl border border-white/[0.08] hover:border-cyan-500/30 transition-all space-y-4"
                >
                  {/* Card Header: Human-First Medical Title & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl border ${profile.color} flex-shrink-0`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white tracking-tight">
                            {profile.title}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {profile.recordId}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                          <span>{profile.hospital}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatTimestamp(rec.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2 self-start">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Tamper-Proof</span>
                      </span>

                      {rec.flEligible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>AI Research: Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <span>AI Research: Paused</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Patient Sovereignty Controls: Research Toggle & Doctor Access */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: AI Medical Research Opt-In Toggle */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">
                          Contribute to Collaborative AI Heart Disease Research
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                          GDPR / HIPAA Opt-In
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-lg leading-relaxed">
                        Trains local hospital diagnostic models without sharing your private medical records or identity.
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                      {/* Consent Switch Button */}
                      <button
                        onClick={() => handleToggleFL(rec.ipfsHash, rec.flEligible)}
                        disabled={isToggling}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                          rec.flEligible
                            ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                        title="Toggle consent for privacy-preserving AI training"
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5 text-purple-400" />
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
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
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
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all shadow-sm"
                      >
                        <UserX className="w-3.5 h-3.5 text-rose-400" />
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

      {/* Embedded Live Audit Trail Feed */}
      <div className="surface-card rounded-2xl border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Immutable Medical Event Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cryptographically signed transaction history (Access Grants, Revocations, Record Registrations, and Consent Changes).
            </p>
          </div>
        </div>
        <ActivityFeed key={refreshTrigger} />
      </div>
    </div>
  );
}
