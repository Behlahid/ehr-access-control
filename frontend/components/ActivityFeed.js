"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getEHRContract } from "../lib/contract";
import { shortenAddress, shortenHash, formatTimestamp } from "../lib/utils";
import {
  Activity,
  ShieldAlert,
  UserCheck,
  UserX,
  RefreshCw,
  Radio,
  Cpu,
  ExternalLink,
  Layers,
  FileCheck,
  KeyRound,
  Filter
} from "lucide-react";

export default function ActivityFeed({ refreshTrigger }) {
  const { provider, signer, account } = useWeb3();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");

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

      // Fetch all event logs
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

      for (const log of recordAddedLogs) {
        formattedEvents.push({
          type: "RecordAdded",
          title: "Record Anchored",
          recordHash: log.args[0],
          patient: log.args[1],
          timestamp: log.args[2] ? Number(log.args[2]) : null,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Anchored AES-256 encrypted multihash ${shortenHash(log.args[0])} to Ethereum`,
        });
      }

      for (const log of accessGrantedLogs) {
        formattedEvents.push({
          type: "AccessGranted",
          title: "Physician Authorized",
          recordHash: log.args[0],
          patient: log.args[1],
          doctor: log.args[2],
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Granted viewing permission for record ${shortenHash(log.args[0])} to ${shortenAddress(log.args[2])}`,
        });
      }

      for (const log of accessRevokedLogs) {
        formattedEvents.push({
          type: "AccessRevoked",
          title: "Physician Revoked",
          recordHash: log.args[0],
          patient: log.args[1],
          doctor: log.args[2],
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Revoked viewing rights for record ${shortenHash(log.args[0])} from ${shortenAddress(log.args[2])}`,
        });
      }

      for (const log of accessRequestedLogs) {
        formattedEvents.push({
          type: "AccessRequested",
          title: "Access Inbound Request",
          recordHash: log.args[0],
          requester: log.args[1],
          patient: log.args[2],
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Physician ${shortenAddress(log.args[1])} broadcasted request for record ${shortenHash(log.args[0])}`,
        });
      }

      for (const log of flChangedLogs) {
        const eligible = log.args[2];
        formattedEvents.push({
          type: "FLEligibilityChanged",
          title: eligible ? "FL Consent Granted" : "FL Consent Revoked",
          recordHash: log.args[0],
          patient: log.args[1],
          eligible,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Federated Learning status updated to ${eligible ? "ACTIVE" : "EXCLUDED"} for ${shortenHash(log.args[0])}`,
        });
      }

      // Sort descending by blockNumber
      formattedEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      setEvents(formattedEvents);
    } catch (err) {
      console.error("Error fetching activity events:", err);
      setError("Unable to index on-chain event logs.");
    } finally {
      setLoading(false);
    }
  }, [account, provider, signer]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshTrigger]);

  const filteredEvents = events.filter((ev) => {
    if (filterType === "all") return true;
    if (filterType === "records") return ev.type === "RecordAdded";
    if (filterType === "access") return ev.type === "AccessGranted" || ev.type === "AccessRevoked" || ev.type === "AccessRequested";
    if (filterType === "fl") return ev.type === "FLEligibilityChanged";
    return true;
  });

  const getEventBadge = (type, eligible) => {
    switch (type) {
      case "RecordAdded":
        return {
          icon: FileCheck,
          color: "text-cyan-400",
          border: "border-cyan-500/30",
          bg: "bg-cyan-500/10",
        };
      case "AccessGranted":
        return {
          icon: UserCheck,
          color: "text-emerald-400",
          border: "border-emerald-500/30",
          bg: "bg-emerald-500/10",
        };
      case "AccessRevoked":
        return {
          icon: UserX,
          color: "text-rose-400",
          border: "border-rose-500/30",
          bg: "bg-rose-500/10",
        };
      case "AccessRequested":
        return {
          icon: ShieldAlert,
          color: "text-amber-400",
          border: "border-amber-500/30",
          bg: "bg-amber-500/10",
        };
      case "FLEligibilityChanged":
        return {
          icon: Cpu,
          color: eligible ? "text-purple-400" : "text-slate-400",
          border: eligible ? "border-purple-500/30" : "border-slate-700",
          bg: eligible ? "bg-purple-500/10" : "bg-slate-800",
        };
      default:
        return {
          icon: Activity,
          color: "text-slate-400",
          border: "border-slate-800",
          bg: "bg-slate-900",
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Feed Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 p-1 bg-obsidian-950 rounded-lg border border-slate-800 font-mono">
          <button
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 rounded transition-all ${
              filterType === "all" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => setFilterType("records")}
            className={`px-2.5 py-1 rounded transition-all ${
              filterType === "records" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Anchors
          </button>
          <button
            onClick={() => setFilterType("access")}
            className={`px-2.5 py-1 rounded transition-all ${
              filterType === "access" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Permissions
          </button>
          <button
            onClick={() => setFilterType("fl")}
            className={`px-2.5 py-1 rounded transition-all ${
              filterType === "fl" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            FL Consent
          </button>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white font-mono text-[11px] self-end sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          <span>Sync Events</span>
        </button>
      </div>

      {loading && events.length === 0 ? (
        <div className="py-12 text-center text-xs font-mono text-slate-400 animate-pulse">
          Indexing smart contract event logs...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-slate-500">
          No audit logs found for this filter.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEvents.map((ev, index) => {
            const badge = getEventBadge(ev.type, ev.eligible);
            const Icon = badge.icon;

            return (
              <div
                key={`${ev.transactionHash}-${index}`}
                className="p-3 rounded-xl bg-obsidian-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${badge.bg} border ${badge.border} ${badge.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{ev.title}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Block #{ev.blockNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono">{ev.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 shrink-0 pl-11 sm:pl-0">
                  <span className="text-slate-400">
                    Tx: {ev.transactionHash ? shortenHash(ev.transactionHash) : "N/A"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
