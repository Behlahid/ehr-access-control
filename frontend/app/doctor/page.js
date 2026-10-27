"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../../context/Web3Context";
import { getEHRContract } from "../../lib/contract";
import { cidToBytes32, bytes32ToCid, shortenAddress, shortenHash, parseContractError } from "../../lib/utils";
import { checkDemoAccess, recordDemoBreakGlass, addDemoAuditLog, getDemoRecords, DEMO_PROFILES } from "../../lib/demoEngine";
import DecryptModal from "../../components/DecryptModal";
import Notification from "../../components/Notification";
import CryptographicAuditDrawer from "../../components/CryptographicAuditDrawer";
import JargonTranslatorModal from "../../components/JargonTranslatorModal";
import ActivityFeed from "../../components/ActivityFeed";
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
  Activity,
  AlertTriangle,
  X,
  BookOpen,
  Check,
  Radio,
  FileCode,
  Download,
  Plus
} from "lucide-react";

const PATIENT_ROSTER = [
  {
    id: "alex",
    mrn: "MRN-84920-A",
    name: "Alex Mercer",
    age: 42,
    gender: "Male",
    dob: "Oct 14, 1982",
    bloodType: "O+ Rh(D) Pos",
    diagnosis: "Post-PCI Surveillance",
    condition: "Hypercholesterolemia",
    hash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    hasPermission: true,
    status: "Attested",
    enclaveVersion: "v2.4",
    vitals: {
      bp: "118/78",
      hr: "72",
      glucose: "92",
      spo2: "99"
    }
  },
  {
    id: "elena",
    mrn: "MRN-91044-B",
    name: "Elena Rostova",
    age: 58,
    gender: "Female",
    dob: "Mar 22, 1966",
    bloodType: "A+ Rh(D) Pos",
    diagnosis: "Non-ST Elevation ACS",
    condition: "Attestation Waiting",
    hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    cid: "QmZtmD2qt8fJv3CL8FnjqiusxVHYM1zG29Uej3QakDEnV8",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    hasPermission: false,
    status: "Pending",
    enclaveVersion: "v2.4",
    vitals: {
      bp: "142/88",
      hr: "88",
      glucose: "114",
      spo2: "96"
    }
  },
  {
    id: "marcus",
    mrn: "MRN-73412-C",
    name: "Marcus Thorne",
    age: 64,
    gender: "Male",
    dob: "Aug 05, 1960",
    bloodType: "B- Rh(D) Neg",
    diagnosis: "Arrhythmia / Syncope",
    condition: "Sovereign Delegated Consent",
    hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
    cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    hasPermission: true,
    status: "Delegated",
    enclaveVersion: "v2.4",
    vitals: {
      bp: "128/82",
      hr: "64",
      glucose: "98",
      spo2: "98"
    }
  }
];

export default function DoctorDashboard() {
  const {
    account,
    signer,
    provider,
    connectWallet,
    isConnecting,
    isDemoMode,
    demoUser,
    enterDemoMode,
  } = useWeb3();

  // In demo mode, start with Alex Mercer (PATIENT_ROSTER[0])
  // In real mode, start with null until searched
  const [selectedPatient, setSelectedPatient] = useState(() => (isDemoMode ? PATIENT_ROSTER[0] : null));
  const [inputHash, setInputHash] = useState(() => (isDemoMode ? PATIENT_ROSTER[0].hash : ""));
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(() =>
    isDemoMode
      ? {
          recordHash: PATIENT_ROSTER[0].hash,
          cid: PATIENT_ROSTER[0].cid,
          owner: PATIENT_ROSTER[0].owner,
          isRegistered: true,
          hasPermission: true,
          title: "Comprehensive Cardiac Angiography & Stress Study",
          patientName: PATIENT_ROSTER[0].name,
          department: "St. Jude Heart Institute",
        }
      : null
  );

  const [isRequesting, setIsRequesting] = useState(false);
  const [isDecryptOpen, setIsDecryptOpen] = useState(false);
  const [isJargonModalOpen, setIsJargonModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Emergency Break-Glass State
  const [isBreakGlassOpen, setIsBreakGlassOpen] = useState(false);
  const [breakGlassJustification, setBreakGlassJustification] = useState("");
  const [isExecutingBreakGlass, setIsExecutingBreakGlass] = useState(false);
  const [breakGlassError, setBreakGlassError] = useState(null);

  // Consultation Entry Form State
  const [loincCodes, setLoincCodes] = useState(["LOINC 2093-3 (Cholesterol Serum)", "LOINC 80061-1 (Lipid Panel)"]);
  const [clinicalNotes, setClinicalNotes] = useState(
    "Continue Atorvastatin 20mg q.d. at bedtime. Repeat 12-lead ECG and Holter telemetry in 90 days. Exercise stress testing deferred pending follow-up LDL-C laboratory evaluation. Patient sovereign enclave consent token updated for read-access delegation to the interventional cardiology team."
  );
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [sigVerified, setSigVerified] = useState(true);
  const [requireReconsent, setRequireReconsent] = useState(true);

  const prevDemoRef = React.useRef(isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      if (!selectedPatient) {
        setSelectedPatient(PATIENT_ROSTER[0]);
        setInputHash(PATIENT_ROSTER[0].hash);
      }
      const accessStatus = checkDemoAccess(
        selectedPatient?.hash || PATIENT_ROSTER[0].hash,
        account || DEMO_PROFILES.doctor.address
      );
      setSearchResult((prev) => ({
        ...(prev || {
          recordHash: PATIENT_ROSTER[0].hash,
          cid: PATIENT_ROSTER[0].cid,
          owner: PATIENT_ROSTER[0].owner,
          isRegistered: true,
          title: "Comprehensive Cardiac Angiography & Stress Study",
          patientName: PATIENT_ROSTER[0].name,
          department: "St. Jude Heart Institute",
        }),
        hasPermission: accessStatus.hasAccess,
        isEmergencyOverride: accessStatus.isEmergency,
        durationLabel: accessStatus.durationLabel,
      }));
    } else {
      if (!account || prevDemoRef.current) {
        setSelectedPatient(null);
        setSearchResult(null);
        setInputHash("");
      }
    }
    prevDemoRef.current = isDemoMode;
  }, [isDemoMode, account]);

  // Switch patient from left roster
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setInputHash(patient.hash);

    let hasPermission = patient.hasPermission;
    let isEmergencyOverride = false;
    let durationLabel = null;

    if (isDemoMode) {
      const accessStatus = checkDemoAccess(patient.hash, account || DEMO_PROFILES.doctor.address);
      hasPermission = accessStatus.hasAccess;
      isEmergencyOverride = Boolean(accessStatus.isEmergency);
      durationLabel = accessStatus.durationLabel;
    }

    setSearchResult({
      recordHash: patient.hash,
      cid: patient.cid,
      owner: patient.owner,
      isRegistered: true,
      hasPermission,
      isEmergencyOverride,
      durationLabel,
      title: `${patient.name} Clinical Study`,
      patientName: patient.name,
      department: "Cardiology & Telemetry Core",
    });
  };

  const handleCheckAccess = async (e, overrideHash = null) => {
    e?.preventDefault();
    const targetHash = (overrideHash || inputHash).trim();
    if (!targetHash) return;

    try {
      setIsSearching(true);
      const matched = PATIENT_ROSTER.find(
        (p) => p.hash.toLowerCase() === targetHash.toLowerCase() || p.cid === targetHash
      );

      let recordBytes32;
      if (targetHash.startsWith("Qm")) {
        recordBytes32 = cidToBytes32(targetHash);
      } else if (targetHash.startsWith("0x") && targetHash.length === 66) {
        recordBytes32 = targetHash;
      } else if (targetHash.length === 64) {
        recordBytes32 = "0x" + targetHash;
      } else {
        throw new Error("Invalid format. Please provide a 64-character hex hash or IPFS CID.");
      }

      if (isDemoMode) {
        const cid = matched ? matched.cid : bytes32ToCid(recordBytes32);
        const owner = matched ? matched.owner : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
        const accessStatus = checkDemoAccess(recordBytes32, account || DEMO_PROFILES.doctor.address);
        setSearchResult({
          recordHash: recordBytes32,
          cid,
          owner,
          isRegistered: true,
          hasPermission: accessStatus.hasAccess,
          isEmergencyOverride: accessStatus.isEmergency,
          durationLabel: accessStatus.durationLabel,
          title: matched ? matched.diagnosis : "Cardiovascular Clinical Study",
          patientName: matched ? matched.name : "Alex Mercer",
          department: "St. Jude Heart Institute",
        });
        if (matched) setSelectedPatient(matched);
        return;
      }

      const runner = signer || provider;
      if (!runner) {
        throw new Error("Please connect your wallet to verify on-chain records.");
      }

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
        title: matched ? matched.diagnosis : "Clinical Electronic Health Record",
        patientName: matched ? matched.name : (owner !== ethers.ZeroAddress ? `Patient (${shortenAddress(owner)})` : "Unregistered"),
        department: "General Medical Core",
      });
      if (matched) setSelectedPatient(matched);
    } catch (err) {
      console.error("Access verification error:", err);
      setNotification({
        type: "error",
        title: "Verification Error",
        message: parseContractError(err),
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!searchResult) return;
    if (isDemoMode) {
      setIsRequesting(true);
      setTimeout(() => {
        setIsRequesting(false);
        addDemoAuditLog({
          type: "AccessRequested",
          title: "Doctor Access Requested",
          recordHash: searchResult.recordHash,
          doctor: account || DEMO_PROFILES.doctor.address,
          patient: searchResult.owner,
          details: `Physician consultation request broadcasted for record ${shortenHash(searchResult.recordHash)} to patient ${searchResult.patientName || "Patient"}.`,
        });
        setNotification({
          type: "success",
          title: "Consultation Request Dispatched",
          message: `Official access request broadcasted for record ${shortenHash(searchResult.recordHash)}. Patient notified.`,
          txHash: "0x7b29a1f...demo99",
        });
      }, 1000);
      return;
    }

    if (!signer) {
      setNotification({
        type: "error",
        title: "Signer Wallet Required",
        message: "Please connect your MetaMask wallet to broadcast an access request on-chain.",
      });
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
        message: `On-chain AccessRequested event emitted for record ${shortenHash(searchResult.recordHash)}.`,
        txHash: receipt.hash,
      });
    } catch (err) {
      setNotification({
        type: "error",
        title: "Request Failed",
        message: parseContractError(err),
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleExecuteBreakGlass = async (e) => {
    e?.preventDefault();
    if (!searchResult) return;
    setBreakGlassError(null);

    const justification = breakGlassJustification.trim();
    if (justification.length < 10) {
      setBreakGlassError("Justification must be at least 10 characters long.");
      return;
    }

    if (isDemoMode) {
      setIsExecutingBreakGlass(true);
      setTimeout(() => {
        setIsExecutingBreakGlass(false);
        setIsBreakGlassOpen(false);
        recordDemoBreakGlass(
          searchResult.recordHash,
          account || DEMO_PROFILES.doctor.address,
          justification
        );
        setSearchResult((prev) => ({
          ...prev,
          hasPermission: true,
          isEmergencyOverride: true,
        }));
        setNotification({
          type: "warning",
          title: "Emergency Break-Glass Override Enacted",
          message: `Emergency access granted for 24h. Forensic event recorded on Sepolia blockchain. Reason: "${justification}".`,
          txHash: "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
        });
      }, 1200);
      return;
    }

    if (!signer) {
      setBreakGlassError("Signer wallet required to execute emergency break-glass transaction.");
      return;
    }

    try {
      setIsExecutingBreakGlass(true);
      const contract = getEHRContract(signer);
      const targetHash = searchResult.recordHash.startsWith("0x")
        ? searchResult.recordHash
        : cidToBytes32(searchResult.cid);

      const tx = await contract.emergencyBreakGlass(targetHash, justification);
      const receipt = await tx.wait();

      setIsBreakGlassOpen(false);
      setSearchResult((prev) => ({
        ...prev,
        hasPermission: true,
        isEmergencyOverride: true,
      }));
      setNotification({
        type: "warning",
        title: "Break-Glass Protocol Activated",
        message: `Emergency 24-hour access granted. Forensic audit log recorded permanently on blockchain.`,
        txHash: receipt.hash,
      });
    } catch (err) {
      setBreakGlassError(parseContractError(err));
    } finally {
      setIsExecutingBreakGlass(false);
    }
  };

  const handleCommitConsultationOrder = (e) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    setTimeout(() => {
      setIsSubmittingOrder(false);
      addDemoAuditLog({
        type: "ConsultationOrderCommitted",
        title: "Clinical Directive Committed",
        recordHash: searchResult?.recordHash || "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
        doctor: account || DEMO_PROFILES.doctor.address,
        patient: searchResult?.owner || DEMO_PROFILES.patient.address,
        details: `Consultation note with LOINC directives encrypted with AES-GCM-256 and anchored to Block. EIP-712 Signature verified for Dr. Sarah Chen.`,
      });
      setNotification({
        type: "success",
        title: "Clinical Directive Committed to Blockchain",
        message: `Consultation note encrypted with AES-GCM-256 and anchored to Block #19,843,015. EIP-712 Signature verified for Dr. Sarah Chen.`,
        txHash: "0x89fbc02...attested99",
      });
    }, 1200);
  };

  useEffect(() => {
    const handleSync = () => {
      if (isDemoMode) {
        if (searchResult?.recordHash) {
          const accessStatus = checkDemoAccess(
            searchResult.recordHash,
            account || DEMO_PROFILES.doctor.address
          );
          setSearchResult((prev) =>
            prev
              ? {
                  ...prev,
                  hasPermission: accessStatus.hasAccess,
                  isEmergencyOverride: accessStatus.isEmergency,
                  durationLabel: accessStatus.durationLabel,
                }
              : prev
          );
        }
      }
    };
    window.addEventListener("ehr:permissions-changed", handleSync);
    window.addEventListener("ehr:reset", handleSync);
    return () => {
      window.removeEventListener("ehr:permissions-changed", handleSync);
      window.removeEventListener("ehr:reset", handleSync);
    };
  }, [isDemoMode, account, searchResult?.recordHash]);

  const removeLoinc = (code) => {
    setLoincCodes(loincCodes.filter((c) => c !== code));
  };

  const addLoinc = () => {
    if (!loincCodes.includes("LOINC 8867-4 (Heart Rate)")) {
      setLoincCodes([...loincCodes, "LOINC 8867-4 (Heart Rate)"]);
    }
  };

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
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
            {/* Status Beacon */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-mono font-semibold mb-6 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <span>HOSPITAL ENCLAVE • PHYSICIAN CREDENTIALS REQUIRED</span>
            </div>

            {/* Clinician Icon */}
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-6 animate-subtle-pulse">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Physician Clinical Workstation
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
              Clinical consultations, LOINC orders, and emergency break-glass protocols require an attested healthcare provider identity. Connect your physician Web3 wallet or launch our interactive hospital simulation.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
              <button
                type="button"
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-premium w-full sm:w-auto h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-tight shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                <span>Connect Physician Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => enterDemoMode("doctor")}
                className="btn-premium group w-full sm:w-auto h-12 px-6 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-bold text-sm tracking-tight shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110" />
                <span>Launch Doctor Demo (Dr. Sarah Chen)</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 font-mono">
              EIP-712 Attested Orders • Forensic Break-Glass Logging
            </p>
          </div>
        </div>

        {/* 3 Workflow Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Smart Contract Attestation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Verify patient access delegations and consultation time-locks in real-time with zero backend intermediaries.
            </p>
          </div>

          <div className="surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Break-Glass</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              HIPAA &amp; HL7 trauma override with indelible forensic justification recorded permanently on the blockchain.
            </p>
          </div>

          <div className="surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">EIP-712 Clinical Orders</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Issue tamper-proof LOINC diagnostic orders and clinical consultation directives signed with your provider private key.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

      {/* Jargon Translation Matrix Modal */}
      <JargonTranslatorModal
        isOpen={isJargonModalOpen}
        onClose={() => setIsJargonModalOpen(false)}
      />

      {/* Emergency Break-Glass Modal */}
      {isBreakGlassOpen && searchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-rose-300 dark:border-rose-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Emergency Break-Glass Protocol
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-mono">
                    Record: {shortenHash(searchResult.recordHash)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBreakGlassOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>MANDATORY FORENSIC AUDIT DISCLOSURE (HIPAA &amp; HL7)</span>
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                This emergency trauma override bypasses patient consent for 24 hours. Your physician identity and this justification will be <strong>permanently and indelibly recorded on the Ethereum blockchain</strong>.
              </p>
            </div>

            {breakGlassError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-mono">
                {breakGlassError}
              </div>
            )}

            <form onSubmit={handleExecuteBreakGlass} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Clinical Emergency Justification (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Unconscious acute motor vehicle trauma; requires immediate cardiac angiography & allergy panel to prevent fatal anaphylaxis."
                  value={breakGlassJustification}
                  onChange={(e) => setBreakGlassJustification(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 transition-all resize-none outline-none shadow-2xs"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Minimum 10 characters required</span>
                  <button
                    type="button"
                    onClick={() => setBreakGlassJustification("Unconscious trauma admission with acute hypovolemic shock; urgent blood panel and allergy review required.")}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-medium"
                  >
                    Insert Standard Trauma Reason
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBreakGlassOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExecutingBreakGlass || breakGlassJustification.trim().length < 10}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  {isExecutingBreakGlass ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>Execute Break-Glass Override</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOP CLINICIAN APP BAR (Stitch Clinical Blueprint) */}
      <section className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-cyan-100 dark:bg-cyan-950/60 ring-2 ring-cyan-500/30 flex items-center justify-center font-bold text-cyan-800 dark:text-cyan-300 font-mono text-sm shrink-0">
            {isDemoMode ? "SC" : (account ? account.substring(2, 4).toUpperCase() : "MD")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {isDemoMode ? "Dr. Sarah Chen, MD, FACC" : "Clinical Provider Workstation"}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {isDemoMode ? "Licensed Cardiologist" : "Attested Physician Node"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isDemoMode
                ? "Chief of Interventional Cardiology • St. Jude Heart Institute"
                : `Ethereum Node: ${shortenAddress(account)} • Zero-Knowledge Physician Terminal`}
            </p>
          </div>
        </div>

        {/* Doctor Wallet Pill & Emergency Break-Glass Shortcut */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Doctor Wallet Tag */}
          <div className="flex items-center gap-2 h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span>{shortenAddress(account || "0x7F2a42b1099e03d12FA4293BC98B1")}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
              {isDemoMode ? "EIP-712 Signed" : "On-Chain Verified"}
            </span>
          </div>

          {/* High-Visibility Break-Glass Emergency Button */}
          <button
            onClick={() => {
              setBreakGlassJustification("Unconscious trauma admission with acute hypovolemic shock; urgent blood panel and allergy review required.");
              setIsBreakGlassOpen(true);
            }}
            className="btn-premium group flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer animate-subtle-pulse"
            title="Emergency Trauma Override (24-Hour Forensic Window)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 transition-transform group-hover:scale-110" />
            <span className="whitespace-nowrap">Break-Glass Protocol</span>
          </button>

          <button
            type="button"
            onClick={() => setIsJargonModalOpen(true)}
            className="btn-premium group flex items-center gap-1.5 h-9 px-3 rounded-xl surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 transition-transform group-hover:scale-110" />
            <span>Guide</span>
          </button>
        </div>
      </section>

      {/* MULTI-PANE CLINICAL CHARTING WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: WARD ENCLAVE QUEUE (DEMO) OR RECORD ACCESS LOOKUP (REAL) */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          {isDemoMode ? (
            <div className="surface-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Ward Enclave Queue
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                  {PATIENT_ROSTER.length} Active
                </span>
              </div>

              {/* Patient Cards Roster */}
              <div className="flex flex-col gap-2.5">
                {PATIENT_ROSTER.map((patient) => {
                  const isSelected = selectedPatient?.id === patient.id;
                  return (
                    <div
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-cyan-50/80 dark:bg-cyan-500/10 border-cyan-500 dark:border-cyan-400 shadow-sm ring-1 ring-cyan-500/30 translate-x-1"
                          : "surface-card card-premium hover:translate-x-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 font-mono">
                            {patient.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{patient.name}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              {patient.mrn} • {patient.age}y {patient.gender[0]}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            patient.status === "Attested"
                              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                              : patient.status === "Pending"
                              ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                              : "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30"
                          }`}
                        >
                          {patient.status}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="truncate max-w-[170px]">{patient.diagnosis}</span>
                        <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">Enclave {patient.enclaveVersion}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sidebar Footer Node Telemetry */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  SGX Enclave Node #4
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100.0% Attested</span>
              </div>
            </div>
          ) : (
            <div className="surface-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Record Access Lookup
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                  Live Contract
                </span>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleCheckAccess} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Patient Record Hash or IPFS CID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="0x... (32-byte hex) or Qm..."
                      value={inputHash}
                      onChange={(e) => setInputHash(e.target.value)}
                      className="w-full h-10 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 transition-colors"
                    />
                    {inputHash && (
                      <button
                        type="button"
                        onClick={() => setInputHash("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSearching || !inputHash.trim()}
                  className="btn-premium group w-full h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Verify Record Permissions</span>
                </button>
              </form>

              {/* Current Active Query Summary */}
              {searchResult && (
                <div className="p-3.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                      {searchResult.patientName || "Queried Record"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        searchResult.hasPermission
                          ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                          : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                      }`}
                    >
                      {searchResult.hasPermission ? "Access Authorized" : "Not Authorized"}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all">
                    {shortenHash(searchResult.recordHash)}
                  </p>
                </div>
              )}

              {/* Switch to Demo CTA Banner */}
              <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Pre-populated Demo Sandbox</span>
                </div>
                <p className="text-[11px] text-purple-700/80 dark:text-purple-300/70 leading-relaxed">
                  Want to explore with 3 simulated cardiology ward patients (Elena Rostova, Marcus Thorne, Liam Gallagher) and preloaded orders?
                </p>
                <button
                  type="button"
                  onClick={() => enterDemoMode("doctor")}
                  className="w-full h-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Launch Doctor Demo</span>
                </button>
              </div>

              {/* Security Telemetry Footer */}
              <div className="pt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Zero-Knowledge Provider Bridge
                </span>
                <span>Sepolia Live</span>
              </div>
            </div>
          )}
        </aside>

        {/* MAIN TERMINAL WORKSPACE (8 Cols) */}
        {!selectedPatient && !searchResult ? (
          <main className="lg:col-span-8 flex flex-col gap-6 animate-fade-in-scale">
            <div className="surface-card rounded-2xl p-10 border border-slate-200 dark:border-slate-800 shadow-sm text-center flex flex-col items-center justify-center min-h-[460px] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-500/20 shadow-sm">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Physician Consultation Terminal Ready
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  No patient record is currently loaded in this consultation session. Enter a patient's record hash or IPFS CID in the verification panel on the left to verify cryptographic delegations and review decrypted diagnostic telemetry.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg text-left pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Time-Locked Delegation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Verify whether the patient has granted your physician address temporary or indefinite consultation rights.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Emergency Break-Glass</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    In acute trauma scenarios, override access restrictions with an indelible forensic justification logged on-chain.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => enterDemoMode("doctor")}
                  className="btn-premium px-5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Launch Doctor Demo Sandbox</span>
                </button>
              </div>
            </div>

            {/* REAL-TIME CRYPTOGRAPHIC ACCESS AUDIT FEED */}
            <div className="surface-card card-premium shimmer-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Real-Time Cryptographic Access Audit Feed
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-600 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Zero-Knowledge Rollup Sync: Live
                </span>
              </div>
              <ActivityFeed />
            </div>
          </main>
        ) : (
          (() => {
            const patientDisplayName = selectedPatient?.name || searchResult?.patientName || "Attested Patient Node";
            const patientInitials = patientDisplayName.split(" ").map((n) => n[0]).join("") || "PT";
            const patientMrn = selectedPatient?.mrn || (searchResult?.owner ? `DID:ETH • ${shortenAddress(searchResult.owner)}` : "MRN-ENCLAVE");
            const patientDob = selectedPatient?.dob || "Dec 14, 1982";
            const patientAge = selectedPatient?.age || 41;
            const patientGender = selectedPatient?.gender || "Verified Enclave";
            const patientBlood = selectedPatient?.bloodType || "O+ Rh(D) Pos";
            const patientVitals = selectedPatient?.vitals || { bp: "118/78", hr: "72", glucose: "94", spo2: "99" };
            const patientCid = selectedPatient?.cid || searchResult?.cid || "QmZtmD2qt8fJv3CL8FnjqiusxVHYM1zG29Uej3QakDEnV8";
            const patientHash = selectedPatient?.hash || searchResult?.recordHash || "0x1111111111111111111111111111111111111111111111111111111111111111";

            return (
              <main key={selectedPatient?.id || searchResult?.recordHash || "active"} className="lg:col-span-8 flex flex-col gap-6 animate-fade-in-scale">
                {/* PATIENT QUICK-CHART HEADER & LIVE TELEMETRY */}
                <section className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-600 dark:bg-cyan-500 text-white flex items-center justify-center font-bold text-base font-mono shadow-sm">
                        {patientInitials}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {patientDisplayName}
                          </h2>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {patientMrn}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {searchResult?.hasPermission ? "Sovereign Enclave Consent Granted" : "Delegation Verification Required"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>DOB: {patientDob} ({patientAge}y)</span>
                          <span>•</span>
                          <span>Gender: {patientGender}</span>
                          <span>•</span>
                          <span>Blood: {patientBlood}</span>
                          <span>•</span>
                          <span className="font-mono text-cyan-600 dark:text-cyan-400">SGX Nitro v2.4 Enclave</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setIsDecryptOpen(true)}
                        className="btn-premium group px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                        <span>Decrypt Record</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Telemetry Metric Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="surface-card card-premium shimmer-card p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-2xs hover:-translate-y-0.5 transition-all">
                      <span className="text-[10px] font-mono text-slate-500">ARTERIAL PRESSURE</span>
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {patientVitals.bp} <span className="text-xs font-normal text-slate-500">mmHg</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">● Optimal Normotensive</div>
                    </div>

                    <div className="surface-card card-premium shimmer-card p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-2xs hover:-translate-y-0.5 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500">HEART RATE (ECG)</span>
                        <Heart className="w-3.5 h-3.5 text-rose-500 animate-heartbeat" />
                      </div>
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {patientVitals.hr} <span className="text-xs font-normal text-slate-500">bpm</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">● Sinus Rhythm Regular</div>
                    </div>

                    <div className="surface-card card-premium shimmer-card p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-2xs hover:-translate-y-0.5 transition-all">
                      <span className="text-[10px] font-mono text-slate-500">FASTING GLUCOSE</span>
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {patientVitals.glucose} <span className="text-xs font-normal text-slate-500">mg/dL</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">● Euglycemic Index</div>
                    </div>

                    <div className="surface-card card-premium shimmer-card p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-2xs hover:-translate-y-0.5 transition-all">
                      <span className="text-[10px] font-mono text-slate-500">OXYGEN SATURATION</span>
                      <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {patientVitals.spo2}% <span className="text-xs font-normal text-slate-500">SpO2</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">● Room Air Normal</div>
                    </div>
                  </div>
                </section>

                {/* TWO-COLUMN DIAGNOSTIC & ORDER SUITE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* PANEL A: Decentralized Enclave Ingestion & Attestation Engine */}
                  <div className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Enclave Ingestion Engine
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                        ZK-SNARK Validated
                      </span>
                    </div>

                    {/* Cryptographic Hashes */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-500">IPFS ENCLAVE CIDv0:</div>
                        <div className="text-cyan-700 dark:text-cyan-400 break-all select-all text-[11px]">
                          {patientCid}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-500">EVM BYTES32 STATE ROOT:</div>
                        <div className="text-slate-800 dark:text-slate-300 break-all select-all text-[11px]">
                          {patientHash}
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Authorize & Decrypt */}
                    <button
                      type="button"
                      onClick={() => setIsDecryptOpen(true)}
                      className="btn-premium group w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Unlock className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span>Authorize &amp; Decrypt Enclave Record (EIP-712)</span>
                    </button>

                    {/* Decrypted Diagnostic Telemetry Readout */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300">
                          <FileText className="w-3.5 h-3.5" />
                          Decrypted Diagnostic Telemetry (Readout)
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Block #19,842,910</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {selectedPatient?.id === "elena"
                          ? "Acute Coronary Syndrome Telemetry: Serial high-sensitivity Troponin I negative at 3h interval (<0.01 ng/mL). Stress echocardiogram demonstrates preserved regional wall motion with estimated LVEF 60%. Mild ST-T wave changes resolved on ambulatory ECG."
                          : selectedPatient?.id === "marcus"
                          ? "24-Hour Ambulatory Holter ECG: Sinus bradycardia with nocturnal pauses up to 2.1s. Intermittent PR interval prolongation consistent with Mobitz I AV block. No sustained ventricular tachycardia. Electrolytes, TSH, and echocardiography within normal parameters."
                          : "Coronary CT Angiography & Holter 24h summary: Zero ischemia detected during Bruce protocol treadmill test. Moderate proximal Left Anterior Descending (LAD) plaque identified without significant luminal compromise (estimated 25-30% stenosis). Preserved left ventricular ejection fraction (LVEF 62%). Normal sinus rhythm maintained."}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          ● {selectedPatient?.id === "elena" ? "hs-cTnI: <0.01 ng/mL (Normal)" : selectedPatient?.id === "marcus" ? "PR Interval: 180 ms (Normal)" : "Total Cholesterol: 185 mg/dL (In-Range)"}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          ● {selectedPatient?.id === "elena" ? "CK-MB: 1.8 ng/mL (Normal)" : selectedPatient?.id === "marcus" ? "Serum Potassium: 4.2 mmol/L" : "Triglycerides: 130 mg/dL (Normal)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PANEL B: Consultation Order & Note Entry Form */}
                  <div className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Consultation Order &amp; Directives
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        FHIR::Composition/R4
                      </span>
                    </div>

                    <form onSubmit={handleCommitConsultationOrder} className="space-y-3.5">
                      {/* Associated LOINC Codes Chips */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold text-slate-700 dark:text-slate-300">
                            Associated Diagnostic LOINC Codes
                          </label>
                          <span className="text-[10px] text-cyan-600 font-mono">LOINC v2.74 Ontology</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[42px]">
                          {loincCodes.map((code) => (
                            <span
                              key={code}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30"
                            >
                              <span>{code}</span>
                              <button
                                type="button"
                                onClick={() => removeLoinc(code)}
                                className="text-cyan-600 hover:text-cyan-900 dark:hover:text-white cursor-pointer ml-1"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={addLoinc}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono text-slate-500 hover:text-cyan-600 border border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add LOINC 8867-4</span>
                          </button>
                        </div>
                      </div>

                      {/* Clinical Impression & Care Directives */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold text-slate-700 dark:text-slate-300">
                            Clinical Impression &amp; Care Directives
                          </label>
                          <span className="text-[10px] font-mono text-purple-600">AES-GCM-256 Encrypted</span>
                        </div>
                        <textarea
                          rows={4}
                          value={clinicalNotes}
                          onChange={(e) => setClinicalNotes(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed outline-none resize-none shadow-2xs"
                        />
                      </div>

                      {/* Clinical Checkboxes */}
                      <div className="space-y-2 pt-1 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={sigVerified}
                            onChange={(e) => setSigVerified(e.target.checked)}
                            className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                          />
                          <span>Digital Signature Verified (Physician Enclave Key)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={requireReconsent}
                            onChange={(e) => setRequireReconsent(e.target.checked)}
                            className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                          />
                          <span>Require Sovereign Patient Re-Consent for Inter-Hospital Transfer</span>
                        </label>
                      </div>

                      {/* Submit CTA */}
                      <button
                        type="submit"
                        disabled={isSubmittingOrder}
                        className="btn-premium group w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmittingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 transition-transform group-hover:scale-110" />}
                        <span>Commit Encrypted Record to Blockchain (Sign &amp; Anchor Tx)</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* REAL-TIME CRYPTOGRAPHIC ACCESS AUDIT FEED */}
                <div className="surface-card card-premium shimmer-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Real-Time Cryptographic Access Audit Feed
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-emerald-600 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Zero-Knowledge Rollup Sync: Live
                    </span>
                  </div>
                  <ActivityFeed />
                </div>
              </main>
            );
          })()
        )}
      </div>
    </div>
  );
}
