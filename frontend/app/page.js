"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "../context/Web3Context";
import { Shield, User, Stethoscope, Lock, Database, Sparkles, ArrowRight, CheckCircle2, ChevronRight, Cpu } from "lucide-react";

export default function LandingPage() {
  const { account, connectWallet, isConnecting, role, setRole } = useWeb3();
  const router = useRouter();

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "patient") {
      router.push("/patient");
    } else {
      router.push("/doctor");
    }
  };

  return (
    <div className="space-y-16 py-6 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Decentralized EHR & Federated Learning
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Sovereign Medical Records with{" "}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            On-Chain Access Control
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Zero-Knowledge client-side <b>AES-256</b> encryption, decentralized <b>IPFS</b> storage, and an immutable <b>Ethereum</b> access-control layer with patient-driven <b>Federated Learning</b> consent.
        </p>

        {/* Action / Connect Box */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-base w-full sm:w-auto"
            >
              <Shield className="w-5 h-5" />
              <span>{isConnecting ? "Connecting to MetaMask..." : "Connect MetaMask Wallet"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-sky-500/30 space-y-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Wallet Connected
              </div>
              <h3 className="text-xl font-bold text-white">Select Your Project Role</h3>
              <p className="text-xs text-slate-400">Choose your persona to test the smart contract workflows:</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => handleSelectRole("patient")}
                  className="p-5 glass-card hover:bg-sky-950/40 hover:border-sky-500/50 rounded-2xl border border-slate-700 text-left transition-all group flex flex-col justify-between space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center justify-between">
                      I'm a Patient
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Encrypt & upload records, grant/revoke doctor access, and toggle FL eligibility.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectRole("doctor")}
                  className="p-5 glass-card hover:bg-indigo-950/40 hover:border-indigo-500/50 rounded-2xl border border-slate-700 text-left transition-all group flex flex-col justify-between space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center justify-between">
                      I'm a Doctor
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Query record access permissions, broadcast access requests, and decrypt records.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Client-Side Web Crypto</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Medical files are encrypted with symmetric <b>AES-GCM-256</b> in browser memory before IPFS transmission. Storage nodes never receive plaintext health data.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">IPFS & bytes32 Multihash</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            IPFS CIDv0 hashes are converted into gas-efficient 32-byte words (<code className="text-sky-300">bytes32</code>) stored on Ethereum for $O(1)$ constant-gas lookups.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Federated Learning Consent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Patients can toggle the <code className="text-purple-300">flEligible</code> flag to participate in privacy-preserving clinical AI model training without centralizing sensitive data.
          </p>
        </div>
      </div>
    </div>
  );
}
