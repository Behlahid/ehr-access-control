"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../../context/Web3Context";
import { getEHRContract } from "../../lib/contract";
import { cidToBytes32, bytes32ToCid, shortenAddress, shortenHash, parseContractError } from "../../lib/utils";
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
    isDemoMode,
    demoUser,
  } = useWeb3();

  // Selected patient from triage roster
  const [selectedPatient, setSelectedPatient] = useState(PATIENT_ROSTER[0]);
  const [inputHash, setInputHash] = useState(PATIENT_ROSTER[0].hash);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState({
    recordHash: PATIENT_ROSTER[0].hash,
    cid: PATIENT_ROSTER[0].cid,
    owner: PATIENT_ROSTER[0].owner,
    isRegistered: true,
    hasPermission: true,
    title: "Comprehensive Cardiac Angiography & Stress Study",
    patientName: PATIENT_ROSTER[0].name,
    department: "St. Jude Heart Institute",
  });

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

  // Switch patient from left roster
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setInputHash(patient.hash);
    setSearchResult({
      recordHash: patient.hash,
      cid: patient.cid,
      owner: patient.owner,
      isRegistered: true,
      hasPermission: patient.hasPermission,
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

      if (isDemoMode || (!signer && !provider)) {
        const cid = matched ? matched.cid : bytes32ToCid(recordBytes32);
        const owner = matched ? matched.owner : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
        const hasPermission = matched ? matched.hasPermission : true;
        setSearchResult({
          recordHash: recordBytes32,
          cid,
          owner,
          isRegistered: true,
          hasPermission,
          title: matched ? matched.diagnosis : "Cardiovascular Clinical Study",
          patientName: matched ? matched.name : "Alex Mercer",
          department: "St. Jude Heart Institute",
        });
        return;
      }

      const runner = signer || provider;
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
        patientName: matched ? matched.name : "Verified Patient",
        department: "General Medical Core",
      });
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
    if (isDemoMode || !signer) {
      setIsRequesting(true);
      setTimeout(() => {
        setIsRequesting(false);
        setNotification({
          type: "success",
          title: "Consultation Request Dispatched",
          message: `Official access request broadcasted for record ${shortenHash(searchResult.recordHash)}. Patient ${selectedPatient.name} notified.`,
          txHash: "0x7b29a1f...demo99",
        });
      }, 1000);
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

    if (isDemoMode || !signer) {
      setIsExecutingBreakGlass(true);
      setTimeout(() => {
        setIsExecutingBreakGlass(false);
        setIsBreakGlassOpen(false);
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
      setNotification({
        type: "success",
        title: "Clinical Directive Committed to Blockchain",
        message: `Consultation note encrypted with AES-GCM-256 and anchored to Block #19,843,015. EIP-712 Signature verified for Dr. Sarah Chen.`,
        txHash: "0x89fbc02...attested99",
      });
    }, 1200);
  };

  const removeLoinc = (code) => {
    setLoincCodes(loincCodes.filter((c) => c !== code));
  };

  const addLoinc = () => {
    if (!loincCodes.includes("LOINC 8867-4 (Heart Rate)")) {
      setLoincCodes([...loincCodes, "LOINC 8867-4 (Heart Rate)"]);
    }
  };

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
      <section className="surface-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-cyan-100 dark:bg-cyan-950/60 ring-2 ring-cyan-500/30 flex items-center justify-center font-bold text-cyan-800 dark:text-cyan-300 font-mono text-sm shrink-0">
            SC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Dr. Sarah Chen, MD, FACC
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Licensed Cardiologist
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chief of Interventional Cardiology • St. Jude Heart Institute
            </p>
          </div>
        </div>

        {/* Doctor Wallet Pill & Emergency Break-Glass Shortcut */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* EIP-712 Doctor Wallet Tag */}
          <div className="flex items-center gap-2 h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span>{shortenAddress(account || "0x7F2a42b1099e03d12FA4293BC98B1")}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
              EIP-712 Signed
            </span>
          </div>

          {/* High-Visibility Break-Glass Emergency Button */}
          <button
            onClick={() => {
              setBreakGlassJustification("Unconscious trauma admission with acute hypovolemic shock; urgent blood panel and allergy review required.");
              setIsBreakGlassOpen(true);
            }}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Emergency Trauma Override (24-Hour Forensic Window)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="whitespace-nowrap">Break-Glass Protocol</span>
          </button>

          <button
            type="button"
            onClick={() => setIsJargonModalOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Guide</span>
          </button>
        </div>
      </section>

      {/* MULTI-PANE CLINICAL CHARTING WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: WARD ENCLAVE QUEUE (4 Cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <div className="surface-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Ward Enclave Queue
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                3 Active
              </span>
            </div>

            {/* Patient Cards Roster */}
            <div className="flex flex-col gap-2.5">
              {PATIENT_ROSTER.map((patient) => {
                const isSelected = selectedPatient.id === patient.id;
                return (
                  <div
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-cyan-50/70 dark:bg-cyan-500/10 border-cyan-500 dark:border-cyan-400 shadow-sm ring-1 ring-cyan-500/20"
                        : "surface-card hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-200 dark:border-slate-800"
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
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SGX Enclave Node #4
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100.0% Attested</span>
            </div>
          </div>
        </aside>

        {/* MAIN TERMINAL WORKSPACE (8 Cols) */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          {/* PATIENT QUICK-CHART HEADER & LIVE TELEMETRY (Stitch Blueprint) */}
          <section className="surface-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-600 dark:bg-cyan-500 text-white flex items-center justify-center font-bold text-base font-mono shadow-sm">
                  {selectedPatient.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {selectedPatient.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {selectedPatient.mrn}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Sovereign Enclave Consent Granted
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>DOB: {selectedPatient.dob} ({selectedPatient.age}y)</span>
                    <span>•</span>
                    <span>Gender: {selectedPatient.gender}</span>
                    <span>•</span>
                    <span>Blood: {selectedPatient.bloodType}</span>
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
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Decrypt Record</span>
                </button>
              </div>
            </div>

            {/* 4 Telemetry Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-mono text-slate-500">ARTERIAL PRESSURE</span>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {selectedPatient.vitals.bp} <span className="text-xs font-normal text-slate-500">mmHg</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">● Optimal Normotensive</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-mono text-slate-500">HEART RATE (ECG)</span>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {selectedPatient.vitals.hr} <span className="text-xs font-normal text-slate-500">bpm</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">● Sinus Rhythm Regular</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-mono text-slate-500">FASTING GLUCOSE</span>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {selectedPatient.vitals.glucose} <span className="text-xs font-normal text-slate-500">mg/dL</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">● Euglycemic Index</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-mono text-slate-500">OXYGEN SATURATION</span>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {selectedPatient.vitals.spo2}% <span className="text-xs font-normal text-slate-500">SpO2</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">● Room Air Normal</div>
              </div>
            </div>
          </section>

          {/* TWO-COLUMN DIAGNOSTIC & ORDER SUITE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* PANEL A: Decentralized Enclave Ingestion & Attestation Engine */}
            <div className="surface-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
                    {selectedPatient.cid}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500">EVM BYTES32 STATE ROOT:</div>
                  <div className="text-slate-800 dark:text-slate-300 break-all select-all text-[11px]">
                    {selectedPatient.hash}
                  </div>
                </div>
              </div>

              {/* Action Button: Authorize & Decrypt */}
              <button
                type="button"
                onClick={() => setIsDecryptOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
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
                  {selectedPatient.id === "elena"
                    ? "Acute Coronary Syndrome Telemetry: Serial high-sensitivity Troponin I negative at 3h interval (<0.01 ng/mL). Stress echocardiogram demonstrates preserved regional wall motion with estimated LVEF 60%. Mild ST-T wave changes resolved on ambulatory ECG."
                    : selectedPatient.id === "marcus"
                    ? "24-Hour Ambulatory Holter ECG: Sinus bradycardia with nocturnal pauses up to 2.1s. Intermittent PR interval prolongation consistent with Mobitz I AV block. No sustained ventricular tachycardia. Electrolytes, TSH, and echocardiography within normal parameters."
                    : "Coronary CT Angiography & Holter 24h summary: Zero ischemia detected during Bruce protocol treadmill test. Moderate proximal Left Anterior Descending (LAD) plaque identified without significant luminal compromise (estimated 25-30% stenosis). Preserved left ventricular ejection fraction (LVEF 62%). Normal sinus rhythm maintained."}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    ● {selectedPatient.id === "elena" ? "hs-cTnI: <0.01 ng/mL (Normal)" : selectedPatient.id === "marcus" ? "PR Interval: 180 ms (Normal)" : "Total Cholesterol: 185 mg/dL (In-Range)"}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                    ● {selectedPatient.id === "elena" ? "CK-MB: 1.8 ng/mL (Normal)" : selectedPatient.id === "marcus" ? "Serum Potassium: 4.2 mmol/L" : "Triglycerides: 130 mg/dL (Normal)"}
                  </span>
                </div>
              </div>
            </div>

            {/* PANEL B: Consultation Order & Note Entry Form */}
            <div className="surface-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
                    <span>Digital Signature Verified (Dr. Sarah Chen • Private Key Enclave)</span>
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
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Commit Encrypted Record to Blockchain (Sign &amp; Anchor Tx)</span>
                </button>
              </form>
            </div>
          </div>

          {/* REAL-TIME CRYPTOGRAPHIC ACCESS AUDIT FEED */}
          <div className="surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-Time Cryptographic Access Audit Feed
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Zero-Knowledge Rollup Sync: Live
              </span>
            </div>
            <ActivityFeed />
          </div>
        </main>
      </div>
    </div>
  );
}
