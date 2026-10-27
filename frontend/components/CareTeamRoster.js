"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { getDemoPermissions, revokeDemoAccess } from "../lib/demoEngine";
import {
  Stethoscope,
  Building,
  Calendar,
  ShieldCheck,
  UserX,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight,
  Shield
} from "lucide-react";

const INITIAL_CARE_TEAM = [
  {
    id: "doc-1",
    name: "Dr. Sarah Chen, MD, FACC",
    title: "Attending Cardiologist & Director of Interventional Imaging",
    institution: "St. Jude Heart Institute • Cardiovascular Center",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    status: "Active Consultation",
    authorizedDate: "Oct 24, 2026",
    expiryDate: "Nov 23, 2026 (30 Days)",
    accessibleRecords: ["EHR-82A9 (Cardiac Angiography)", "EHR-2222 (24h Holter ECG)"],
    primaryRecordHash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    avatar: "SC",
    color: "from-rose-500 to-amber-500",
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Vance, MD, FAAFP",
    title: "Primary Attending Physician",
    institution: "Metro Health Comprehensive Center",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    status: "Primary Care Continuous",
    authorizedDate: "Sep 12, 2026",
    expiryDate: "Perpetual Care Agreement",
    accessibleRecords: ["EHR-1111 (Metabolic & Lipid Diagnostic Panel)"],
    primaryRecordHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    avatar: "MV",
    color: "from-cyan-500 to-blue-500",
  },
];

export default function CareTeamRoster({ onRevokeClick, onNotification }) {
  const { isDemoMode } = useWeb3();

  const computeCareTeam = useCallback(() => {
    if (!isDemoMode) {
      return [];
    }
    const perms = getDemoPermissions();
    return INITIAL_CARE_TEAM.map((doc) => {
      const docLower = doc.address.toLowerCase();
      const docPerms = perms[docLower] || perms[doc.address] || {};

      const activeHashes = Object.keys(docPerms).filter((h) => docPerms[h]?.hasAccess);
      const isStillActive = activeHashes.length > 0;
      const firstActive = isStillActive ? docPerms[activeHashes[0]] : null;

      let status = "Permissions Revoked";
      if (isStillActive) {
        status = firstActive?.isEmergency ? "Emergency Override Active" : doc.status;
      }

      return {
        ...doc,
        status,
        isActive: isStillActive,
        isEmergency: Boolean(firstActive?.isEmergency),
        accessibleRecords: isStillActive ? doc.accessibleRecords : ["No records authorized"],
      };
    });
  }, [isDemoMode]);

  const [careTeam, setCareTeam] = useState(() => (isDemoMode ? INITIAL_CARE_TEAM : []));
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    setCareTeam(computeCareTeam());
    const handleSync = () => setCareTeam(computeCareTeam());
    window.addEventListener("ehr:permissions-changed", handleSync);
    window.addEventListener("ehr:reset", handleSync);
    return () => {
      window.removeEventListener("ehr:permissions-changed", handleSync);
      window.removeEventListener("ehr:reset", handleSync);
    };
  }, [computeCareTeam]);

  const handleRevoke = (doctor) => {
    if (onRevokeClick) {
      onRevokeClick(doctor);
      return;
    }
    setRevokingId(doctor.id);
    setTimeout(() => {
      revokeDemoAccess(doctor.primaryRecordHash, doctor.address);
      setCareTeam(computeCareTeam());
      setRevokingId(null);
      if (onNotification) {
        onNotification({
          type: "success",
          title: "Doctor Access Revoked",
          message: `${doctor.name}'s permissions have been revoked on the Ethereum blockchain.`,
          txHash: "0x49f2b...revoke01",
        });
      }
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Care Team Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Authorized Care Team</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {careTeam.length} Active Providers
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Epic MyChart-style directory of clinicians currently granted cryptographic decryption permissions for your medical records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Granular Smart Contract Access
          </span>
        </div>
      </div>

      {/* Clinician Cards Roster */}
      {careTeam.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-white dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Stethoscope className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-slate-800 dark:text-slate-300">No Active Physician Authorizations</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no external doctors authorized. When you grant record access during a hospital visit, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {careTeam.map((doc) => (
            <div
              key={doc.id}
              className="surface-card p-5 rounded-2xl hover:border-cyan-500/50 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Doctor Identity */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${doc.color} flex items-center justify-center text-white font-extrabold text-sm shadow-md flex-shrink-0`}
                  >
                    {doc.avatar}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{doc.name}</h3>
                      {doc.isEmergency ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" /> Emergency Override Active
                        </span>
                      ) : doc.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> {doc.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                          <UserX className="w-3 h-3" /> Permissions Revoked
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-cyan-700 dark:text-cyan-400 font-semibold">{doc.title}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.institution}</span>
                    </div>
                  </div>
                </div>

                {/* Revoke Action Button */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                  {doc.isActive ? (
                    <button
                      onClick={() => handleRevoke(doc)}
                      disabled={revokingId === doc.id}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>{revokingId === doc.id ? "Revoking On-Chain..." : "Revoke Access"}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                      Revocation Finalized
                    </span>
                  )}
                </div>
              </div>

              {/* Authorization Details & Accessible Records */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Authorized Since
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.authorizedDate}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Permission Duration
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.expiryDate}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Authorized Records
                  </div>
                  <div className="font-medium text-slate-700 dark:text-slate-300 truncate">
                    {doc.accessibleRecords.join(", ")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Emergency Break-Glass Policy Explainer */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-3 text-xs shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-900 dark:text-amber-300">
            Clinical Safety & Emergency "Break-Glass" Protocol (HL7-FHIR Compatible)
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            In trauma emergencies where patient consent cannot be given, accredited ER trauma physicians can invoke the smart contract’s <code className="font-mono text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/40 px-1 py-0.5 rounded">breakGlassEmergencyAccess()</code> function. This creates an unalterable forensic record on Ethereum and instantly broadcasts a high-priority notification to your personal device.
          </p>
        </div>
      </div>
    </div>
  );
}
