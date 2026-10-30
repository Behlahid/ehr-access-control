"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "../context/Web3Context";
import Logo from "../components/Logo";
import {
  User,
  Stethoscope,
  Lock,
  Database,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  Key,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText
} from "lucide-react";

export default function LandingPage() {
  const { enterDemoMode } = useWeb3();
  const router = useRouter();

  const handleDemoLaunch = (selectedRole) => {
    enterDemoMode(selectedRole);
    if (selectedRole === "patient") {
      router.push("/patient");
    } else {
      router.push("/doctor");
    }
  };

  const PIPELINE_STAGES = [
    {
      num: "01",
      title: "Client-Side Encryption",
      spec: "Web Crypto AES-256-GCM",
      detail:
        "Medical records and FHIR JSON bundles are encrypted in-memory before transmission. A random 96-bit IV is generated per record; raw keys never touch external servers.",
      code: `const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 }, true, ["encrypt"]
);
const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv }, key, fileBuffer
);`
    },
    {
      num: "02",
      title: "Content-Addressed Storage",
      spec: "IPFS CIDv0 Multihash",
      detail:
        "Encrypted ciphertext is pinned to IPFS nodes, producing a tamper-proof 34-byte multihash (SHA-256 digest). Storage hosts hold encrypted blobs with zero plaintext access.",
      code: `CID: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
Multihash: 0x12 0x20 [32-byte sha256 digest]
Format: Base58 encoded string (34 bytes)`
    },
    {
      num: "03",
      title: "On-Chain Access Registry",
      spec: "Solidity 0.8.24 (2-Slot Packed)",
      detail:
        "The multihash digest is stored in EHRAccessControl.sol. The Record struct is tightly packed into 2 EVM storage slots, saving ~45% SSTORE gas on record registration.",
      code: `struct Record {
    bytes32 ipfsHash;  // Slot 0 (32 bytes)
    address owner;     // Slot 1 (20 bytes)
    uint64 timestamp;  // Slot 1 (8 bytes)
    bool flEligible;   // Slot 1 (1 byte)
}`
    },
    {
      num: "04",
      title: "Collaborative Clinical AI",
      spec: "PyTorch Cross-Silo FedAvg",
      detail:
        "Hospital nodes train disease prediction models locally without sharing raw data. The central aggregator verifies on-chain consent before every communication round.",
      code: `for r in range(1, rounds + 1):
    eligibility = check_live_hospital_eligibility()
    active_nodes = [h for h in nodes if eligibility[h]]
    weights = train_local_hospitals(active_nodes)
    global_model = aggregate_fed_avg(weights)`
    }
  ];

  return (
    <div className="space-y-16 py-2">
      {/* 1. EDITORIAL HERO (Authoritative, Calm, No Rainbow Text) */}
      <section className="pt-6 pb-2 max-w-4xl mx-auto space-y-6 text-center">
        {/* Product Identity */}
        <div className="flex flex-col items-center gap-3">
          <Logo size={48} showText={false} />
          <span className="text-[11px] font-mono font-medium tracking-wide text-slate-500 dark:text-slate-400">
            HealthLedger Research &amp; Clinical Engineering
          </span>
        </div>

        {/* Solid, High-Contrast Typography */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading leading-[1.12]">
          Patient-Owned Health Records with Cryptographic Access Control
        </h1>

        {/* Clinical Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
          A decentralized Electronic Health Record (EHR) architecture synthesizing client-side <span className="text-slate-900 dark:text-slate-200 font-medium">AES-256-GCM encryption</span>, content-addressed <span className="text-slate-900 dark:text-slate-200 font-medium">IPFS storage</span>, EVM smart contracts, and privacy-preserving <span className="text-slate-900 dark:text-slate-200 font-medium">Federated Learning</span>.
        </p>

        {/* Action Controls (Solid ink & crisp secondary, no neon glows) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => handleDemoLaunch("patient")}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-sm tracking-tight transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <User className="w-4 h-4 text-slate-300 dark:text-slate-700" />
            <span>Open Patient Portal</span>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />
          </button>

          <button
            type="button"
            onClick={() => handleDemoLaunch("doctor")}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#0D121C] dark:hover:bg-[#121824] text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Stethoscope className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Open Physician Terminal</span>
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="pt-1 flex items-center justify-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px]">⌘K</kbd> for quick command search</span>
          <span>•</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px]">⌘J</kbd> for medical jargon translator</span>
        </div>

        {/* Unified Telemetry Strip (Hairline-divided, tabular figures, no icons in colored circles) */}
        <div className="pt-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0D121C] grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 text-left">
            <div className="p-4 space-y-1">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Cryptographic Security
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                AES-256-GCM
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Zero plaintext leakage to storage
              </div>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Gas Optimization
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                ~45% SSTORE
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                2-slot EVM struct packing (Solidity)
              </div>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Federated Accuracy
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                86.89% Test
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                0.9513 ROC-AUC across 4 silos
              </div>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Clinical Safety
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                24h Break-Glass
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Forensic trauma override with audit
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CRYPTOGRAPHIC DATA FLOW SPECIFICATION (Clean, Structured Timeline) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="text-slate-500 dark:text-slate-400 text-xs font-mono font-medium uppercase tracking-wider">
              Technical Architecture
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 font-heading">
              Four-Stage Cryptographic Data Pipeline
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            How medical data moves from in-browser client memory through IPFS content-addressing, smart contract access governance, and federated learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.num}
              className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0D121C] p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-600">
                    STAGE {stage.num}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {stage.spec}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  {stage.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  {stage.detail}
                </p>
              </div>

              {/* Exact Technical Code Preview */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#070A0F] border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300 overflow-x-auto leading-relaxed">
                <pre>{stage.code}</pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CLINICAL WORKSPACE PREVIEWS (Real Data, Honest Interfaces) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="text-slate-500 dark:text-slate-400 text-xs font-mono font-medium uppercase tracking-wider">
              Application Roles
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 font-heading">
              Sovereign Patient &amp; Attending Physician Interfaces
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Decoupled access boundaries ensuring patients retain key ownership while clinicians receive structured consultation passes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Role Panel */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0D121C] p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                      Patient Executive Portal
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      MRN-84920-A
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Alex Mercer • Metro Health Comprehensive Center
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Keyholder
                </span>
              </div>

              {/* Vitals Summary */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  Baseline Biometric &amp; Diagnostic State
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-mono">
                  <div>Blood Pressure: <strong className="text-slate-900 dark:text-white">118/78 mmHg</strong></div>
                  <div>Heart Rate: <strong className="text-slate-900 dark:text-white">72 bpm</strong></div>
                  <div>Total Cholesterol: <strong className="text-slate-900 dark:text-white">172 mg/dL</strong></div>
                  <div>Oxygen Saturation: <strong className="text-slate-900 dark:text-white">99% SpO2</strong></div>
                </div>
              </div>

              {/* Patient Capabilities List */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span><strong>Client-Side Encryption:</strong> Encrypt lab reports in browser memory before IPFS storage.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span><strong>Time-Bound Delegation:</strong> Grant 24-hour, 7-day, or 30-day read privileges to attending doctors.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span><strong>GDPR Art. 7(3) Consent Toggle:</strong> Revoke Federated Learning research consent in 1 click.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDemoLaunch("patient")}
              className="w-full h-10 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Sovereign Patient Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Physician Role Panel */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0D121C] p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                      Physician Diagnostic Terminal
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      MED-90281-NY
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Dr. Sarah Chen, MD, FACC • St. Jude Heart Institute
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium text-sky-600 dark:text-sky-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  Level-3 Credentialed
                </span>
              </div>

              {/* Clinical Station Preview */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  Active Consultation &amp; Decryption Queue
                </div>
                <div className="space-y-1.5 font-mono text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between items-center">
                    <span>EHR-82A9 (Cardiac Angiography)</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Decrypted (Verified)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>EHR-1111 (Lipid Diagnostic Panel)</span>
                    <span className="text-[10px] text-slate-500">Read Permission Valid (24d remaining)</span>
                  </div>
                </div>
              </div>

              {/* Physician Capabilities List */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span><strong>In-Browser Decryption:</strong> Decrypt authorized records using patient-provided symmetric keys.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span><strong>EIP-712 Directives:</strong> Issue standardized LOINC &amp; SNOMED-CT clinical orders with digital signatures.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span><strong>Emergency Break-Glass:</strong> Override standard locks in acute trauma with mandatory on-chain audit log.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDemoLaunch("doctor")}
              className="w-full h-10 rounded-lg bg-white hover:bg-slate-50 dark:bg-[#121824] dark:hover:bg-[#171F2E] text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Physician Diagnostic Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. INSTITUTIONAL STANDARDS & AUDIT INTEGRITY */}
      <section className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0D121C] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Regulatory &amp; Cryptographic Standards
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              Healthcare Governance &amp; Compliance Verification
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Verified Solidity 0.8.24 · Hardhat 29/29</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">HIPAA Security Rule</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">45 CFR § 164.312(a)</div>
            <div className="text-slate-500 text-[11px]">Zero-plaintext transmission</div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">GDPR Privacy Rights</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">Article 7(3) &amp; Art. 9</div>
            <div className="text-slate-500 text-[11px]">Real-time consent revocation</div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">Clinical Interoperability</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">HL7 FHIR v4.0.1</div>
            <div className="text-slate-500 text-[11px]">Standardized observation bundles</div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400 text-[10px] uppercase">Smart Contract Audit</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">OpenZeppelin SafeGuard</div>
            <div className="text-slate-500 text-[11px]">Re-entrancy &amp; access guards</div>
          </div>
        </div>
      </section>
    </div>
  );
}
