"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "../context/Web3Context";
import Logo from "../components/Logo";
import {
  Shield,
  User,
  Stethoscope,
  Lock,
  Database,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Zap,
  ExternalLink,
  Sparkles,
  Radio,
  Key,
  ShieldCheck,
  FileCode,
  Activity,
  Server,
  FileText
} from "lucide-react";

export default function LandingPage() {
  const { account, connectWallet, isConnecting, setRole, enterDemoMode } = useWeb3();
  const router = useRouter();

  const handleDemoLaunch = (selectedRole) => {
    enterDemoMode(selectedRole);
    if (selectedRole === "patient") {
      router.push("/patient");
    } else {
      router.push("/doctor");
    }
  };

  const cryptographicPipeline = [
    {
      step: "01",
      title: "WebCrypto AES-GCM-256",
      badge: "In-Memory Ephemeral Session",
      icon: Lock,
      description:
        "Medical records and FHIR observation bundles are encrypted inside the client browser memory via Web Crypto API. Nonces and raw keys are never transmitted unencrypted.",
      codeSnippet: `// 256-bit symmetric encryption in memory
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 }, true, ["encrypt"]
);
const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv }, key, fhirPayloadBuffer
);`
    },
    {
      step: "02",
      title: "IPFS Content-Addressing",
      badge: "Immutable Content Pinning",
      icon: Database,
      description:
        "Encrypted ciphertext is pinned to IPFS nodes, producing a tamper-evident Content Identifier (CIDv0). Storage hosts possess randomized encrypted bytes with 0% plaintext visibility.",
      codeSnippet: `// IPFS CIDv0 Multihash Content Addressing
CID: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
Digest: SHA-256 / Base58 (34 bytes multihash)
Payload: Encrypted Blob (0% Plaintext Leakage)`
    },
    {
      step: "03",
      title: "Solidity bytes32 Struct",
      badge: "EVM SSTORE Gas Optimized",
      icon: Layers,
      description:
        "Base58 multihash is decoded without truncation, packing the 32-byte digest into a native EVM bytes32 slot. Achieves ~45% SSTORE gas savings via 2-slot EVM struct packing.",
      codeSnippet: `// 2-Slot Packed EVM Struct (45% Gas Savings)
struct Record {
    bytes32 ipfsHash;  // Slot 0 (32B)
    address owner;     // Slot 1 (20B)
    uint64 timestamp;  // Slot 1 (8B)
    bool flEligible;   // Slot 1 (1B)
}`
    },
    {
      step: "04",
      title: "Federated Learning (DP)",
      badge: "DP-SGD Privacy Consensus",
      icon: Cpu,
      description:
        "Local model gradients are computed on hospital nodes under (ε=1.2, δ=1e-5)-Differential Privacy with L2 norm clipping and Gaussian noise. Smart contract live checks verify patient consent each round.",
      codeSnippet: `// DP-SGD + Live On-Chain Re-Check Every Round
if not contract.hasAccess(record_hash, node_address):
    exclude_hospital_node(node_id)
clip_grad_norm_(model.parameters(), max_norm=1.0)
grad.add_(torch.randn_like(grad) * noise_multiplier)`
    }
  ];

  return (
    <div className="space-y-16 py-4 relative">
      {/* 1. HERO SECTION (Swiss Clinical Precision) */}
      <section className="relative pt-4 pb-2 text-center max-w-4xl mx-auto space-y-6">
        {/* Brand Emblem & Architecture Pill */}
        <div className="flex flex-col items-center gap-3">
          <Logo size={54} className="hover:scale-105 transition-transform duration-200" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-700 dark:text-slate-300 font-semibold">
              Enterprise Zero-Knowledge EHR Architecture
            </span>
          </div>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading leading-[1.12]">
          Sovereign Patient Health Records with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] via-[#0891B2] to-[#10B981]">
            Cryptographic Access Control
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
          Client-side <strong className="text-slate-900 dark:text-slate-200">AES-256-GCM</strong> encryption meets decentralized <strong className="text-slate-900 dark:text-slate-200">IPFS</strong> multihash indexing, <strong className="text-slate-900 dark:text-slate-200">Ethereum</strong> smart contracts, and privacy-preserving <strong className="text-slate-900 dark:text-slate-200">Federated Learning</strong> with Differential Privacy.
        </p>

        {/* Primary Dual Launch CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={() => handleDemoLaunch("patient")}
            className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#0284C7] hover:bg-[#0284C7]/90 text-white font-bold text-sm tracking-tight shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none"
          >
            <User className="w-4 h-4" />
            <span>Enter Patient Executive Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleDemoLaunch("doctor")}
            className="w-full sm:w-auto h-12 px-6 rounded-xl surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-800 transition-all shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none"
          >
            <Stethoscope className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
            <span>Launch Physician Diagnostic Terminal</span>
          </button>
        </div>

        {/* Real-Time Network Trust Telemetry (4 Metric Tiles) */}
        <div className="pt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Cryptographic Enclaves
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              14 Active SGX Nodes
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
              Latency: 18ms • Sync 100%
            </div>
          </div>

          <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              On-Chain Verified Records
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              1,429 Attested
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
              +12 past hour • Block #19,842,910
            </div>
          </div>

          <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Storage Integrity
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              0% Plaintext Leakage
            </div>
            <div className="text-[11px] text-[#0284C7] dark:text-[#38BDF8] font-mono">
              100% Client WebCrypto Encrypted
            </div>
          </div>

          <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              SSTORE Gas Optimization
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              45% Slot Savings
            </div>
            <div className="text-[11px] text-[#0891B2] dark:text-[#22D3EE] font-mono">
              2-Slot Packed bytes32 Struct
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4-STAGE CRYPTOGRAPHIC PIPELINE ARCHITECTURE */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[#0284C7] dark:text-[#38BDF8] text-xs font-mono font-bold tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5" />
              <span>Zero-Trust Verification Topology</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 font-heading">
              4-Stage Cryptographic Pipeline Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Every FHIR diagnostic bundle is processed client-side prior to decentralized IPFS distribution and Ethereum consensus logging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cryptographicPipeline.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="surface-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-[#0284C7]/50 transition-all shadow-2xs space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      STEP {item.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                      {item.title}
                    </h3>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>

                {/* Code / Architecture Snippet */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 font-mono text-[10px] text-slate-700 dark:text-slate-300 overflow-x-auto leading-tight shadow-inner">
                  <pre>{item.codeSnippet}</pre>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. DUAL PERSONA DIAGNOSTIC TERMINALS */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[#0284C7] dark:text-[#38BDF8] text-xs font-mono font-bold tracking-wider uppercase">
              <Layers className="w-3.5 h-3.5" />
              <span>Role-Based Sovereign Enclaves</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 font-heading">
              Dual Persona Diagnostic Terminals
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Zero-knowledge cryptographic access boundaries for both sovereign patients and licensed diagnostic physicians.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Persona Card 1: Patient Executive Portal */}
          <div className="surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0284C7] text-white flex items-center justify-center font-bold text-sm font-mono shadow-sm">
                    AM
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                        Alex Mercer
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        MRN-9482-A
                      </span>
                    </div>
                    <span className="text-xs text-[#0284C7] dark:text-[#38BDF8] font-medium">
                      Patient Executive Portal
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Active Vault
                </span>
              </div>

              {/* Patient Features Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Continuous Biometric &amp; Lab Feeds
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 dark:text-slate-300">Fasting Blood Glucose:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    94 mg/dL <span className="text-emerald-600 dark:text-emerald-400 font-normal">(Normal)</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 dark:text-slate-300">Total Cholesterol (LOINC: 2093-3):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    172 mg/dL <span className="text-emerald-600 dark:text-emerald-400 font-normal">(Desirable)</span>
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  EIP-712 Active Consents
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Dr. Sarah Chen, MD (Cardiology)
                  </span>
                  <span className="text-[10px] font-mono text-[#0284C7] dark:text-[#38BDF8]">
                    Active (30-day Pass)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0284C7]/5 border border-[#0284C7]/20 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white font-heading">
                    Federated Research Gradient Contribution
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Differential privacy budget: ε=1.2
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  CONSENTED
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDemoLaunch("patient")}
              className="w-full h-11 rounded-xl bg-[#0284C7] hover:bg-[#0284C7]/90 text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none"
            >
              <span>Open Patient Portal View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Persona Card 2: Physician Diagnostic Terminal */}
          <div className="surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0891B2] text-white flex items-center justify-center font-bold text-sm font-mono shadow-sm">
                    SC
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                        Dr. Sarah Chen, MD, FACC
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        NPI-104928501
                      </span>
                    </div>
                    <span className="text-xs text-[#0891B2] dark:text-[#22D3EE] font-medium">
                      Physician Diagnostic Terminal
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  EIP-712 Bound
                </span>
              </div>

              {/* Physician Features Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Ward Enclave Triage Queue
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 dark:text-slate-300">Alex Mercer (Post-PCI)</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">
                    Attested
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 dark:text-slate-300">Elena Rostova (Non-ST ACS)</span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">
                    Pending
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  HL7 FHIR v4.0.1 Composition Station
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Diagnostic Directives (LOINC 8867-4)
                  </span>
                  <span className="text-[10px] font-mono text-[#0284C7] dark:text-[#38BDF8]">
                    AES-GCM-256 Encrypted
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-rose-900 dark:text-rose-300 font-heading">
                    Emergency Break-Glass Protocol
                  </div>
                  <div className="text-[10px] text-rose-700 dark:text-rose-400 font-mono">
                    HL7 trauma override with forensic blockchain logging
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                  AVAILABLE
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDemoLaunch("doctor")}
              className="w-full h-11 rounded-xl surface-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none"
            >
              <span>Open Physician Terminal View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. ENCRYPTED TELEMETRY INGESTION LOG */}
      <section className="surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-[#0284C7] dark:text-[#38BDF8] uppercase font-bold tracking-wider">
              FHIR::Observation Telemetry Feed
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
              Encrypted Telemetry Ingestion Log
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Contract: EHRAccessControl.sol</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Live Stream
            </span>
          </div>
        </div>

        <div className="space-y-2.5 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:translate-x-1 transition-all duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                FHIR Resource: Observation/ECG-Lead-II
              </span>
              <span className="text-[10px] text-slate-500">LOINC 8601-5 • Sinus Rhythm 72 bpm</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>CID: QmNlei78z...4901</span>
              <span>Gas: 41,200 (Packed)</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/30">
                ZK-Attested
              </span>
              <span className="text-[10px]">14s ago</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:translate-x-1 transition-all duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                FHIR Resource: DiagnosticReport/Serum-Electrolytes
              </span>
              <span className="text-[10px] text-slate-500">LOINC 24326-1 • Potassium 4.1 mmol/L</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>CID: QmPf88wXk...1102</span>
              <span>Gas: 42,050 (Packed)</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/30">
                ZK-Attested
              </span>
              <span className="text-[10px]">1m ago</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:translate-x-1 transition-all duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                FHIR Resource: Observation/BloodPressure-Ambulatory
              </span>
              <span className="text-[10px] text-slate-500">LOINC 85354-9 • 118/78 mmHg</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>CID: QmU88kLm1...9934</span>
              <span>Gas: 41,890 (Packed)</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#0284C7]/10 text-[#0284C7] dark:text-[#38BDF8] font-bold border border-[#0284C7]/30">
                Enclave Queued
              </span>
              <span className="text-[10px]">4m ago</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CLINICAL COMPLIANCE & CRYPTOGRAPHIC TRUST BADGES */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
        <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
          <Shield className="w-5 h-5 mx-auto text-[#0284C7] dark:text-[#38BDF8]" />
          <div className="text-xs font-bold text-slate-900 dark:text-white font-heading">
            HIPAA Safe Harbor
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Certified §164.514(b)</div>
        </div>

        <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
          <Lock className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
          <div className="text-xs font-bold text-slate-900 dark:text-white font-heading">
            GDPR Art. 9
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Special Category Health</div>
        </div>

        <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
          <Database className="w-5 h-5 mx-auto text-[#0891B2] dark:text-[#22D3EE]" />
          <div className="text-xs font-bold text-slate-900 dark:text-white font-heading">
            HL7 FHIR v4.0.1
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Interoperability Standard</div>
        </div>

        <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
          <Key className="w-5 h-5 mx-auto text-[#0284C7] dark:text-[#38BDF8]" />
          <div className="text-xs font-bold text-slate-900 dark:text-white font-heading">
            W3C DID v1.0
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Decentralized Identifiers</div>
        </div>

        <div className="surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs col-span-2 sm:col-span-1">
          <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
          <div className="text-xs font-bold text-slate-900 dark:text-white font-heading">
            OpenZeppelin v5.0
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Audited Smart Contracts</div>
        </div>
      </section>
    </div>
  );
}
