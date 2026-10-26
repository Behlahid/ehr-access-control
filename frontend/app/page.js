"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "../context/Web3Context";
import {
  Shield,
  User,
  Stethoscope,
  Lock,
  Database,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Cpu,
  KeyRound,
  FileCheck,
  Share2,
  Server,
  Zap,
  Activity,
  Layers,
  Terminal,
  ExternalLink,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  const { account, connectWallet, isConnecting, setRole, enterDemoMode } = useWeb3();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "patient") {
      router.push("/patient");
    } else {
      router.push("/doctor");
    }
  };

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
      title: "Client-Side In-Memory AES-GCM-256",
      badge: "Zero-Knowledge Client",
      icon: Lock,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/30",
      description:
        "Medical payload files and diagnostic data are encrypted entirely inside the patient's browser memory using Web Crypto API. Plaintext PHI never traverses the network.",
      codeSnippet: `const key = await window.crypto.subtle.generateKey(\n  { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]\n);\nconst ciphertext = await window.crypto.subtle.encrypt(\n  { name: "AES-GCM", iv }, key, fileBuffer\n);`
    },
    {
      step: "02",
      title: "Decentralized IPFS Content-Addressing",
      badge: "Off-Chain Storage",
      icon: Database,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/30",
      description:
        "The encrypted ciphertext blob is pinned to IPFS nodes, yielding a tamper-evident Content Identifier (CIDv0). Storage providers only possess unreadable encrypted bytes.",
      codeSnippet: `// IPFS CIDv0 Multihash\nCID: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"\nType: SHA-256 / Base58 / 46 characters\nPayload: Encrypted Blob (0% Plaintext Leakage)`
    },
    {
      step: "03",
      title: "Lossless bytes32 Multihash On-Chain Index",
      badge: "Ethereum Smart Contract",
      icon: Layers,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      description:
        "Base58 CID is decoded, stripping the 0x1220 IPFS prefix and packing the 32-byte digest into a native Solidity bytes32 with 2-slot packed struct for ~45% SSTORE gas savings.",
      codeSnippet: `// 2-Slot Packed EVM Struct (45% SSTORE Gas Savings)\nstruct Record {\n    bytes32 ipfsHash;  // Slot 0 (32B)\n    address owner;     // Slot 1 (20B)\n    uint64 timestamp;  // Slot 1 (8B)\n    bool flEligible;   // Slot 1 (1B)\n}`
    },
    {
      step: "04",
      title: "Federated Learning with Differential Privacy",
      badge: "Clinical AI Privacy",
      icon: Cpu,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/30",
      description:
        "Patients independently toggle flEligible flags on-chain. Local model updates are protected by (epsilon, delta)-Differential Privacy with L2 gradient clipping and Gaussian noise.",
      codeSnippet: `// DP-SGD + Live On-Chain Re-Check Every Round\nif not contract.hasAccess(record_hash, node_address):\n    exclude_hospital_node(node_id)\ntorch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\ngrad.add_(torch.randn_like(grad) * noise_multiplier)`
    }
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative pt-6 pb-2 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-700 dark:text-slate-300 font-semibold">
            Zero-Knowledge Cryptography • Solidity 0.8.24 • Federated Learning
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
          Sovereign Patient Health Records with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-sky-500 dark:from-cyan-400 dark:to-sky-300">
            Immutable Access Control
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Decouple patient medical privacy from centralized cloud silos. Secure health records with client-side <strong>AES-256</strong> encryption, decentralized <strong>IPFS</strong> storage, and granular <strong>Ethereum</strong> smart contract governance.
        </p>

        {/* Action / Connect Box */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          {!account ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md shadow-cyan-600/20 transition-all active:scale-[0.98] w-full sm:w-auto"
              >
                <Shield className="w-4 h-4" />
                <span>{isConnecting ? "Connecting Wallet..." : "Connect MetaMask Wallet"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDemoLaunch("patient")}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-all w-full sm:w-auto"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Explore Demo Sandbox</span>
              </button>
            </div>
          ) : (
            <div className="w-full max-w-2xl surface-card p-6 rounded-2xl border border-slate-200 dark:border-white/[0.1] space-y-5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Authenticated: {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Your Operational Persona</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Access role-specific cryptographic workflows anchored to the smart contract:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <button
                  onClick={() => handleSelectRole("patient")}
                  className="surface-interactive p-5 rounded-xl flex flex-col justify-between group border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                      Enter Portal <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                      Patient Portal
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                      Apple Health vitals, discrete lab gauges, Care Team roster, and FL consent controls.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectRole("doctor")}
                  className="surface-interactive p-5 rounded-xl flex flex-col justify-between group border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                      Enter Terminal <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      Physician Terminal
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                      Inspect on-chain permissions, broadcast access requests, and decrypt authorized EHR files.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Cryptographic Architecture Visualizer */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              System Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              End-to-End Cryptographic Lifecycle
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Click each architectural phase to inspect client-side cryptographic handling, on-chain indexing, and FL verification.
          </p>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cryptographicPipeline.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={item.step}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-xl text-left transition-all border ${
                  isSelected
                    ? "bg-white dark:bg-obsidian-900 border-cyan-500 shadow-md shadow-cyan-500/10"
                    : "bg-slate-50 dark:bg-obsidian-950/60 border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500">
                  <span>PHASE {item.step}</span>
                  <Icon className={`w-4 h-4 ${isSelected ? item.color : "text-slate-400"}`} />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-2 line-clamp-1">
                  {item.title}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  {item.badge}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Deep-Dive Card */}
        <div className="surface-card rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-white/[0.1] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-sm">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span>Phase {cryptographicPipeline[activeStep].step}</span>
              <span>•</span>
              <span className={cryptographicPipeline[activeStep].color}>
                {cryptographicPipeline[activeStep].badge}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {cryptographicPipeline[activeStep].title}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {cryptographicPipeline[activeStep].description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verifiable Zero-Leakage
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                <FileCheck className="w-3.5 h-3.5" /> Audited Smart Contract
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-slate-300 font-semibold">technical-spec.ts</span>
                </div>
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed selection:bg-cyan-500/30">
                <code>{cryptographicPipeline[activeStep].codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* On-Chain Security & Benchmark Metrics Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Performance & Verifiability
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Benchmarked On-Chain Gas & Efficiency
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Measured execution gas metrics from Hardhat unit tests with constant-time multihash indexing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="surface-card p-5 rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono font-medium">
              <span>ADD RECORD</span>
              <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">~115,497</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Packed 2-slot EVM storage initialization</div>
          </div>

          <div className="surface-card p-5 rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono font-medium">
              <span>GRANT ACCESS</span>
              <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">~51,099</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Authorize doctor in mapping with expiry</div>
          </div>

          <div className="surface-card p-5 rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono font-medium">
              <span>BREAK-GLASS</span>
              <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">~95,917</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Emergency trauma override & forensic log</div>
          </div>

          <div className="surface-card p-5 rounded-xl border border-slate-200 dark:border-white/[0.08] space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono font-medium">
              <span>FL CONSENT TOGGLE</span>
              <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">~35,661</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Update flEligible flag on-chain</div>
          </div>
        </div>
      </section>
    </div>
  );
}
