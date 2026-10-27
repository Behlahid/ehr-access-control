"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getEHRContract } from "../lib/contract";
import { shortenAddress, shortenHash, formatTimestamp } from "../lib/utils";
import { getDemoAuditLogs } from "../lib/demoEngine";
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
  Filter,
  Clock,
  AlertTriangle
} from "lucide-react";

const SIMULATED_AUDIT_LOGS = [
  {
    type: "EmergencyBreakGlass",
    title: "Emergency Break-Glass Override",
    recordHash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    doctor: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    patient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    justification: "Acute trauma admission: Hypovolemic shock following motor vehicle incident. Urgent allergy panel and angiography review.",
    blockNumber: 6819435,
    transactionHash: "0xec914a801a91e8401928301928301928301928301928301928301928301928300",
    details: 'Forensic emergency override executed by Dr. Sarah Chen, MD: "Acute trauma admission: Hypovolemic shock following motor vehicle incident."',
  },
  {
    type: "AccessGranted",
    title: "Physician Authorized",
    recordHash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    patient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    doctor: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    blockNumber: 6819420,
    transactionHash: "0x49f2b801a91e8401928301928301928301928301928301928301928301928301",
    details: "Granted 30-day viewing permission to Dr. Sarah Chen, MD (Mount Sinai Heart)",
  },
  {
    type: "FLEligibilityChanged",
    title: "FL Consent Active",
    recordHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    patient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    eligible: true,
    blockNumber: 6819385,
    transactionHash: "0x12a93801a91e8401928301928301928301928301928301928301928301928302",
    details: "Federated Learning status updated to ACTIVE (Consented for AI research)",
  },
  {
    type: "RecordAdded",
    title: "Record Anchored",
    recordHash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    patient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    blockNumber: 6819210,
    transactionHash: "0x7b29a1f10928301928301928301928301928301928301928301928301928303",
    details: "Anchored AES-256 encrypted multihash to Ethereum smart contract (Slot Packed)",
  },
];

export default function ActivityFeed({ refreshTrigger }) {
  const { provider, signer, account, isDemoMode, isCorrectNetwork } = useWeb3();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");

  const fetchEvents = useCallback(async () => {
    if (isDemoMode) {
      setEvents(getDemoAuditLogs());
      setLoading(false);
      return;
    }

    if (!account || (!provider && !signer) || !isCorrectNetwork) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const runner = signer || provider;
      const contract = getEHRContract(runner);

      // Create indexed event filters safely
      const recordAddedFilter = contract.filters?.RecordAdded ? contract.filters.RecordAdded(null, account) : null;
      const accessGrantedFilter = contract.filters?.AccessGranted ? contract.filters.AccessGranted(null, account, null) : null;
      const accessGrantedExpiryFilter = contract.filters?.AccessGrantedWithExpiry ? contract.filters.AccessGrantedWithExpiry(null, account, null) : null;
      const accessRevokedFilter = contract.filters?.AccessRevoked ? contract.filters.AccessRevoked(null, account, null) : null;
      const accessRequestedFilter = contract.filters?.AccessRequested ? contract.filters.AccessRequested(null, null, account) : null;
      const flChangedFilter = contract.filters?.FLEligibilityChanged ? contract.filters.FLEligibilityChanged(null, account) : null;
      const emergencyFilter = contract.filters?.EmergencyBreakGlass ? contract.filters.EmergencyBreakGlass(null, null, account) : null;

      // Fetch all event logs with safe block range (-5000)
      const fromBlock = -5000;
      const [
        recordAddedLogs,
        accessGrantedLogs,
        accessGrantedExpiryLogs,
        accessRevokedLogs,
        accessRequestedLogs,
        flChangedLogs,
        emergencyLogs,
      ] = await Promise.all([
        recordAddedFilter ? contract.queryFilter(recordAddedFilter, fromBlock, "latest").catch(() => []) : [],
        accessGrantedFilter ? contract.queryFilter(accessGrantedFilter, fromBlock, "latest").catch(() => []) : [],
        accessGrantedExpiryFilter ? contract.queryFilter(accessGrantedExpiryFilter, fromBlock, "latest").catch(() => []) : [],
        accessRevokedFilter ? contract.queryFilter(accessRevokedFilter, fromBlock, "latest").catch(() => []) : [],
        accessRequestedFilter ? contract.queryFilter(accessRequestedFilter, fromBlock, "latest").catch(() => []) : [],
        flChangedFilter ? contract.queryFilter(flChangedFilter, fromBlock, "latest").catch(() => []) : [],
        emergencyFilter ? contract.queryFilter(emergencyFilter, fromBlock, "latest").catch(() => []) : [],
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

      for (const log of accessGrantedExpiryLogs) {
        formattedEvents.push({
          type: "AccessGrantedWithExpiry",
          title: "Time-Bound Authorization",
          recordHash: log.args[0],
          patient: log.args[1],
          doctor: log.args[2],
          expiry: log.args[3] ? Number(log.args[3]) : null,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Granted time-limited consultation to Dr. ${shortenAddress(log.args[2])} until ${formatTimestamp(Number(log.args[3]))}`,
        });
      }

      for (const log of emergencyLogs) {
        formattedEvents.push({
          type: "EmergencyBreakGlass",
          title: "Emergency Break-Glass Override",
          recordHash: log.args[0],
          doctor: log.args[1],
          patient: log.args[2],
          justification: log.args[3],
          timestamp: log.args[4] ? Number(log.args[4]) : null,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          details: `Forensic trauma override executed by Dr. ${shortenAddress(log.args[1])}: "${log.args[3]}"`,
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

  useEffect(() => {
    const handleSync = () => {
      if (isDemoMode) {
        setEvents(getDemoAuditLogs());
      } else {
        fetchEvents();
      }
    };
    window.addEventListener("ehr:audit-changed", handleSync);
    window.addEventListener("ehr:reset", handleSync);
    return () => {
      window.removeEventListener("ehr:audit-changed", handleSync);
      window.removeEventListener("ehr:reset", handleSync);
    };
  }, [isDemoMode, fetchEvents]);

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
      case "EmergencyBreakGlass":
        return {
          icon: AlertTriangle,
          color: "text-rose-600 dark:text-rose-400",
          border: "border-rose-200 dark:border-rose-500/30",
          bg: "bg-rose-50 dark:bg-rose-500/10",
        };
      case "AccessGrantedWithExpiry":
        return {
          icon: Clock,
          color: "text-amber-600 dark:text-amber-400",
          border: "border-amber-200 dark:border-amber-500/30",
          bg: "bg-amber-50 dark:bg-amber-500/10",
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
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
          <button
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filterType === "all" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => setFilterType("records")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filterType === "records" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Anchors
          </button>
          <button
            onClick={() => setFilterType("access")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filterType === "access" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Permissions
          </button>
          <button
            onClick={() => setFilterType("fl")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filterType === "fl" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            FL Consent
          </button>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-mono text-[11px] self-end sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600 dark:text-cyan-400" : ""}`} />
          <span>Sync Events</span>
        </button>
      </div>

      {loading && events.length === 0 ? (
        <div className="py-12 text-center text-xs font-mono text-slate-500 dark:text-slate-400 animate-pulse">
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
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${badge.bg} border ${badge.border} ${badge.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{ev.title}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Block #{ev.blockNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">{ev.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 shrink-0 pl-11 sm:pl-0">
                  <span className="text-slate-500 dark:text-slate-400">
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
