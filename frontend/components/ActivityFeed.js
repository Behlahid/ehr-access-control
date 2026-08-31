"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getEHRContract } from "../lib/contract";
import { shortenAddress, shortenHash, formatTimestamp } from "../lib/utils";
import { Activity, ShieldAlert, UserCheck, UserX, RefreshCw, Radio, Sparkles, ExternalLink } from "lucide-react";

export default function ActivityFeed({ refreshTrigger }) {
  const { provider, signer, account } = useWeb3();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (!account || (!provider && !signer)) return;

    try {
      setLoading(true);
      setError(null);
      const runner = signer || provider;
      const contract = getEHRContract(runner);

      // Create indexed event filters
      const recordAddedFilter = contract.filters.RecordAdded(null, account);
      const accessGrantedFilter = contract.filters.AccessGranted(null, account, null);
      const accessRevokedFilter = contract.filters.AccessRevoked(null, account, null);
      const accessRequestedFilter = contract.filters.AccessRequested(null, null, account);
      const flChangedFilter = contract.filters.FLEligibilityChanged(null, account);

      // Fetch all event logs from genesis / block 0 to latest
      const [
        recordAddedLogs,
        accessGrantedLogs,
        accessRevokedLogs,
        accessRequestedLogs,
        flChangedLogs,
      ] = await Promise.all([
        contract.queryFilter(recordAddedFilter, 0, "latest").catch(() => []),
        contract.queryFilter(accessGrantedFilter, 0, "latest").catch(() => []),
        contract.queryFilter(accessRevokedFilter, 0, "latest").catch(() => []),
        contract.queryFilter(accessRequestedFilter, 0, "latest").catch(() => []),
        contract.queryFilter(flChangedFilter, 0, "latest").catch(() => []),
      ]);

      const formattedEvents = [];

      // Format RecordAdded
      for (const log of recordAddedLogs) {
        formattedEvents.push({
          type: "RecordAdded",
          title: "New Record Registered",
          recordHash: log.args[0],
          patient: log.args[1],
          timestamp: log.args[2],
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Registered encrypted record with hash ${shortenHash(log.args[0])}`,
        });
      }

      // Format AccessGranted
      for (const log of accessGrantedLogs) {
        formattedEvents.push({
          type: "AccessGranted",
          title: "Doctor Access Granted",
          recordHash: log.args[0],
          patient: log.args[1],
          doctor: log.args[2],
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Granted viewing rights for record ${shortenHash(log.args[0])} to doctor ${shortenAddress(log.args[2])}`,
        });
      }

      // Format AccessRevoked
      for (const log of accessRevokedLogs) {
        formattedEvents.push({
          type: "AccessRevoked",
          title: "Doctor Access Revoked",
          recordHash: log.args[0],
          patient: log.args[1],
          doctor: log.args[2],
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Revoked viewing rights for record ${shortenHash(log.args[0])} from doctor ${shortenAddress(log.args[2])}`,
        });
      }

      // Format AccessRequested
      for (const log of accessRequestedLogs) {
        formattedEvents.push({
          type: "AccessRequested",
          title: "Access Requested by Doctor",
          recordHash: log.args[0],
          requester: log.args[1],
          patient: log.args[2],
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Doctor ${shortenAddress(log.args[1])} requested access to record ${shortenHash(log.args[0])}`,
        });
      }

      // Format FLEligibilityChanged
      for (const log of flChangedLogs) {
        const eligible = log.args[2];
        formattedEvents.push({
          type: "FLEligibilityChanged",
          title: `Federated Learning ${eligible ? "Enabled" : "Disabled"}`,
          recordHash: log.args[0],
          patient: log.args[1],
          eligible: eligible,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `${eligible ? "Opted-in to" : "Opted-out of"} decentralized AI training for record ${shortenHash(log.args[0])}`,
        });
      }

      // Sort newest first by block number (descending)
      formattedEvents.sort((a, b) => b.blockNumber - a.blockNumber);

      setEvents(formattedEvents);
    } catch (err) {
      console.error("Error querying event filters:", err);
      setError("Failed to load on-chain activity logs.");
    } finally {
      setLoading(false);
    }
  }, [account, provider, signer]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshTrigger]);

  const getEventBadge = (type) => {
    switch (type) {
      case "RecordAdded":
        return {
          icon: <Radio className="w-4 h-4 text-sky-400" />,
          bg: "bg-sky-500/10 border-sky-500/30 text-sky-400",
        };
      case "AccessGranted":
        return {
          icon: <UserCheck className="w-4 h-4 text-emerald-400" />,
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        };
      case "AccessRevoked":
        return {
          icon: <UserX className="w-4 h-4 text-rose-400" />,
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
        };
      case "AccessRequested":
        return {
          icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
        };
      case "FLEligibilityChanged":
        return {
          icon: <Sparkles className="w-4 h-4 text-purple-400" />,
          bg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-slate-400" />,
          bg: "bg-slate-800 border-slate-700 text-slate-300",
        };
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              On-Chain Audit Trail & Activity Log
            </h3>
            <p className="text-xs text-slate-400">
              Queried directly from EVM log topics via <code className="text-sky-400">contract.queryFilter()</code>
            </p>
          </div>
        </div>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-400" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {loading && events.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
          Querying Ethereum block history for audit events...
        </div>
      ) : events.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/50">
          No on-chain activity recorded for this wallet yet. Upload a record to begin.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {events.map((evt, idx) => {
            const badge = getEventBadge(evt.type);
            return (
              <div
                key={`${evt.transactionHash}-${idx}`}
                className="p-3 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-start gap-3 transition-colors"
              >
                <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${badge.bg}`}>
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{evt.title}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Block #{evt.blockNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{evt.details}</p>
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${evt.transactionHash}`}
                  target="_blank"
                  rel="noreferrer"
                  title="View on Etherscan"
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-sky-400 transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
