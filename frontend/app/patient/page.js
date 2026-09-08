"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { getEHRContract } from "../../lib/contract";
import { bytes32ToCid, shortenHash, formatTimestamp, parseContractError } from "../../lib/utils";
import UploadModal from "../../components/UploadModal";
import GrantRevokeModal from "../../components/GrantRevokeModal";
import ActivityFeed from "../../components/ActivityFeed";
import Notification from "../../components/Notification";
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
  Lock
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
  const [copiedHash, setCopiedHash] = useState(null);

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
        title: "FL Consent Status Updated",
        message: `Successfully ${newStatus ? "opted-in" : "opted-out"} record ${shortenHash(recordHash)} for Federated Learning training.`,
        txHash: receipt.hash,
      });

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error toggling FL:", err);
      setNotification({
        type: "error",
        title: "FL Update Failed",
        message: parseContractError(err),
      });
    } finally {
      setTogglingFlHash(null);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  if (!account) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-obsidian-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-lg">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Patient EHR Console</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Authenticate with your Ethereum wallet to review your anchored sovereign records, manage physician access delegations, and enforce Federated Learning consent.
        </p>
        <button
          onClick={connectWallet}
          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs tracking-tight shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
        >
          Connect MetaMask Wallet
        </button>
      </div>
    );
  }

  const flCount = records.filter((r) => r.flEligible).length;
  const flPercentage = records.length > 0 ? Math.round((flCount / records.length) * 100) : 0;

  // Filtered records
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.cid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.ipfsHash.toLowerCase().includes(searchQuery.toLowerCase());

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
            title: "Record Anchored to Ethereum",
            message: `Medical file encrypted with AES-GCM-256 and multihash stored on-chain.`,
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
              Patient Sovereign Ledger
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Live Contract
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            Wallet Owner: <span className="text-slate-200">{account}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={loading}
            className="p-2.5 rounded-xl surface-interactive text-slate-400 hover:text-white transition-colors"
            title="Refresh On-Chain State"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            <span>Encrypt & Upload Record</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-card p-5 rounded-xl border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-medium">
            <span>REGISTERED RECORDS</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">{records.length}</div>
          <div className="text-[11px] text-slate-400">Anchored via multihash on Ethereum</div>
        </div>

        <div className="surface-card p-5 rounded-xl border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-medium">
            <span>FL OPT-IN RATE</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-purple-300">{flCount}</span>
            <span className="text-xs font-mono text-slate-400">({flPercentage}%)</span>
          </div>
          <div className="text-[11px] text-slate-400">Eligible for privacy-preserving AI training</div>
        </div>

        <div className="surface-card p-5 rounded-xl border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono font-medium">
            <span>CLIENT CRYPTO CIPHER</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 font-mono">AES-GCM-256</div>
          <div className="text-[11px] text-slate-400">SubtleCrypto browser-native in-memory</div>
        </div>
      </div>

      {/* Search & Ledger Controls */}
      <div className="surface-card rounded-2xl border border-white/[0.08] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Medical Records Ledger</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filteredRecords.length} of {records.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Granular access control policies and dynamic Federated Learning consent.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 p-1 bg-obsidian-950 rounded-lg border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFlFilter("all")}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                flFilter === "all" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFlFilter("eligible")}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                flFilter === "eligible"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-slate-400 hover:text-purple-300"
              }`}
            >
              FL Eligible
            </button>
            <button
              onClick={() => setFlFilter("excluded")}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                flFilter === "excluded"
                  ? "bg-slate-700 text-slate-200 border border-slate-600"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              FL Excluded
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by IPFS CID (Qm...) or bytes32 record hash (0x...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl clinical-input text-xs font-mono placeholder:text-slate-500 placeholder:font-sans"
          />
        </div>

        {/* Records Table / List */}
        {loading && records.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-slate-400 animate-pulse">
            Querying Ethereum smart contract state...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No records match your criteria</div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {records.length === 0
                ? "No medical records have been anchored to this account yet."
                : "Try adjusting your search query or filter."}
            </p>
            {records.length === 0 && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs shadow-md transition-all"
              >
                Upload First Record
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredRecords.map((rec) => {
              const isToggling = togglingFlHash === rec.ipfsHash;
              const isCopied = copiedHash === rec.ipfsHash;

              return (
                <div
                  key={rec.ipfsHash}
                  className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-900/30 px-3 rounded-xl transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {shortenHash(rec.ipfsHash)}
                      </span>
                      <button
                        onClick={() => handleCopy(rec.ipfsHash, rec.ipfsHash)}
                        className="p-1 text-slate-500 hover:text-cyan-300 transition-colors"
                        title="Copy 32-byte Record Hash"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* FL Status Badge */}
                      {rec.flEligible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <Cpu className="w-3 h-3 text-purple-400" /> FL Opted-In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          FL Excluded
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-500">
                        {formatTimestamp(rec.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                      <span className="text-slate-500">IPFS CID:</span>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${rec.cid}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        {rec.cid}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* FL Consent Toggle Button */}
                    <button
                      onClick={() => handleToggleFL(rec.ipfsHash, rec.flEligible)}
                      disabled={isToggling}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                        rec.flEligible
                          ? "bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border-purple-800/80"
                          : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-700"
                      }`}
                      title="Toggle on-chain permission for clinical Federated Learning"
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      ) : (
                        <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      )}
                      <span>{rec.flEligible ? "Revoke FL Consent" : "Enable FL Consent"}</span>
                    </button>

                    {/* Grant Doctor Access */}
                    <button
                      onClick={() =>
                        setGrantRevokeState({
                          isOpen: true,
                          mode: "grant",
                          recordHash: rec.ipfsHash,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Grant Doctor</span>
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/60 transition-all"
                    >
                      <UserX className="w-3.5 h-3.5 text-rose-400" />
                      <span>Revoke</span>
                    </button>
                  </div>
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
            <h3 className="text-base font-bold text-white">Immutable Event Audit Trail</h3>
            <p className="text-xs text-slate-400">
              Live smart contract events (RecordAdded, AccessGranted, AccessRevoked, FLEligibilityChanged)
            </p>
          </div>
        </div>
        <ActivityFeed key={refreshTrigger} />
      </div>
    </div>
  );
}
