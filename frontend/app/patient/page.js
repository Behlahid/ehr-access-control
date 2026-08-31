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
} from "lucide-react";

export default function PatientDashboard() {
  const { account, signer, provider, isCorrectNetwork, connectWallet } = useWeb3();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        title: "Federated Learning Status Updated",
        message: `Successfully ${newStatus ? "opted-in" : "opted-out"} record ${shortenHash(recordHash)} for FL training.`,
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
      <div className="py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Connect Wallet to Access Patient Dashboard</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please connect your MetaMask wallet to view your sovereign medical records, manage access permissions, and opt-in to Federated Learning.
        </p>
        <button
          onClick={connectWallet}
          className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-lg shadow-sky-500/25 transition-all"
        >
          Connect MetaMask
        </button>
      </div>
    );
  }

  const flCount = records.filter((r) => r.flEligible).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      <Notification notification={notification} onClose={() => setNotification(null)} />

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(hash, tx) => {
          setNotification({
            type: "success",
            title: "Record Registered on Blockchain",
            message: `Your medical record was encrypted with AES-256 and anchored to the smart contract.`,
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Patient EHR Portal</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Zero-Knowledge Sovereign Health Records & Granular Access Control
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={loading}
            className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white transition-colors"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-400" : ""}`} />
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-sky-500/25 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Record</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Records</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{records.length}</div>
          <div className="text-[11px] text-slate-500">Anchored on Ethereum</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">FL Opt-In Records</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">{flCount}</div>
          <div className="text-[11px] text-slate-500">Eligible for AI research training</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Encryption Protocol</span>
            <Key className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400">AES-GCM 256-bit</div>
          <div className="text-[11px] text-slate-500">Client-Side Web Crypto API</div>
        </div>
      </div>

      {/* Records Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>My Registered Records</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {records.length}
            </span>
          </h2>
        </div>

        {loading && records.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500 animate-pulse glass-panel rounded-2xl">
            Loading your medical records from the blockchain...
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center glass-panel rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No Medical Records Registered Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Upload your first medical report to encrypt it client-side with AES-256 and anchor its IPFS hash on-chain.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold border border-sky-500/30 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Record
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec, idx) => (
              <div
                key={rec.ipfsHash}
                className="glass-panel p-5 rounded-2xl border border-slate-800/90 hover:border-slate-700 space-y-4 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Hash & IPFS info */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        Record #{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-mono text-sky-400">
                        {shortenHash(rec.ipfsHash)}
                      </span>
                      <button
                        onClick={() => handleCopy(rec.ipfsHash, `hash-${idx}`)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"
                        title="Copy bytes32 hash"
                      >
                        {copiedHash === `hash-${idx}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="text-slate-500">IPFS CID:</span>
                        <span className="text-slate-300 select-all">{rec.cid}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimestamp(rec.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* FL Toggle Switch */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        FL Eligible
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleFL(rec.ipfsHash, rec.flEligible)}
                        disabled={togglingFlHash === rec.ipfsHash}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          rec.flEligible ? "bg-purple-600" : "bg-slate-700"
                        }`}
                      >
                        {togglingFlHash === rec.ipfsHash ? (
                          <Loader2 className="w-3.5 h-3.5 text-white animate-spin mx-auto my-auto" />
                        ) : (
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              rec.flEligible ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        )}
                      </button>
                    </div>

                    {/* Grant Button */}
                    <button
                      onClick={() =>
                        setGrantRevokeState({
                          isOpen: true,
                          mode: "grant",
                          recordHash: rec.ipfsHash,
                        })
                      }
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Grant Access
                    </button>

                    {/* Revoke Button */}
                    <button
                      onClick={() =>
                        setGrantRevokeState({
                          isOpen: true,
                          mode: "revoke",
                          recordHash: rec.ipfsHash,
                        })
                      }
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Revoke Access
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Log Audit Trail */}
      <ActivityFeed refreshTrigger={refreshTrigger} />
    </div>
  );
}
