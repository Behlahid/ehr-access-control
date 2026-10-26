"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress } from "../lib/utils";
import {
  Shield,
  Activity,
  User,
  Stethoscope,
  AlertTriangle,
  Copy,
  Check,
  LogOut,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Zap
} from "lucide-react";

export default function Navbar() {
  const {
    account,
    networkName,
    isCorrectNetwork,
    connectWallet,
    disconnect,
    switchNetwork,
    role,
    setRole,
    isDemoMode,
    demoUser,
    enterDemoMode,
    exitDemoMode,
  } = useWeb3();

  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleCopy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchRole = (newRole) => {
    setRole(newRole);
    if (isDemoMode) {
      enterDemoMode(newRole);
    }
    if (newRole === "patient") router.push("/patient");
    else if (newRole === "doctor") router.push("/doctor");
    else router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-obsidian-950/90 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-obsidian-900 border border-slate-700/80 flex items-center justify-center shadow-md group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/10 transition-all">
              <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  HealthLedger
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Clinical Web3
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight">
                Sovereign Healthcare & Collaborative AI
              </p>
            </div>
          </Link>

          {/* Navigation Segmented Controls (Always Visible for seamless switching) */}
          <div className="flex items-center p-1 bg-obsidian-900/90 rounded-xl border border-white/[0.08] shadow-inner">
            <button
              onClick={() => handleSwitchRole("patient")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname.startsWith("/patient")
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient Portal</span>
            </button>

            <button
              onClick={() => handleSwitchRole("doctor")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname.startsWith("/doctor")
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Physician Terminal</span>
            </button>
          </div>

          {/* Right Action / Wallet / Demo Status */}
          <div className="flex items-center gap-3">
            {isDemoMode ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-semibold hidden sm:inline">{demoUser?.name || "Clinical Demo"}</span>
                  <span className="text-[10px] opacity-75 hidden md:inline">({demoUser?.organization})</span>
                </div>
                <button
                  onClick={exitDemoMode}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-all"
                  title="Exit Demo Sandbox"
                >
                  Exit Demo
                </button>
              </div>
            ) : account ? (
              <>
                {/* Network Pill */}
                <div
                  onClick={() => !isCorrectNetwork && switchNetwork(11155111)}
                  className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border cursor-pointer transition-all ${
                    isCorrectNetwork
                      ? "bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-600"
                      : "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                  }`}
                  title={!isCorrectNetwork ? "Click to switch network to Sepolia" : `Connected to ${networkName}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCorrectNetwork ? "bg-emerald-400 ring-2 ring-emerald-500/20" : "bg-amber-400 animate-pulse"
                    }`}
                  />
                  <span>{networkName}</span>
                </div>

                {/* Account Address Pill */}
                <div className="flex items-center gap-1.5 bg-obsidian-900 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-mono font-medium text-slate-200">
                    {shortenAddress(account)}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Copy Wallet Address"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={() => {
                    disconnect();
                    router.push("/");
                  }}
                  className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 rounded-xl transition-all"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => enterDemoMode(pathname.startsWith("/doctor") ? "doctor" : "patient")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
                  title="Explore simulated records without MetaMask"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Explore Demo</span>
                </button>

                <button
                  onClick={connectWallet}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs tracking-tight shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-[0.98]"
                >
                  <Shield className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Warning Banner */}
      {account && !isDemoMode && !isCorrectNetwork && (
        <div className="bg-amber-500/10 border-y border-amber-500/30 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Unsupported Network. Switch to <b>Ethereum Sepolia Testnet</b> or <b>Localhost Hardhat (31337)</b>.</span>
          <button
            onClick={() => switchNetwork(11155111)}
            className="ml-2 px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors"
          >
            Switch to Sepolia
          </button>
        </div>
      )}
    </header>
  );
}
