"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress } from "../lib/utils";
import { Shield, Activity, User, Stethoscope, AlertTriangle, Copy, Check, LogOut, RefreshCw } from "lucide-react";

export default function Navbar() {
  const { account, networkName, isCorrectNetwork, connectWallet, disconnect, switchNetwork, role, setRole } = useWeb3();
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
    if (newRole === "patient") router.push("/patient");
    else if (newRole === "doctor") router.push("/doctor");
    else router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold bg-gradient-to-r from-sky-400 to-indigo-300 bg-clip-text text-transparent">
                HealthLedger
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                EHR Access Control & FL
              </div>
            </div>
          </Link>

          {/* Role Navigation Pills (if wallet connected) */}
          {account && (
            <div className="hidden md:flex items-center p-1 bg-slate-900/70 rounded-xl border border-slate-800">
              <button
                onClick={() => handleSwitchRole("patient")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname.startsWith("/patient") || role === "patient"
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <User className="w-4 h-4" />
                Patient Portal
              </button>
              <button
                onClick={() => handleSwitchRole("doctor")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname.startsWith("/doctor") || role === "doctor"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                Doctor Portal
              </button>
            </div>
          )}

          {/* Right Action / Wallet Info */}
          <div className="flex items-center gap-3">
            {account ? (
              <>
                {/* Network Pill */}
                <div
                  onClick={() => !isCorrectNetwork && switchNetwork(11155111)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                    isCorrectNetwork
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                  }`}
                  title={!isCorrectNetwork ? "Click to switch to Sepolia" : networkName}
                >
                  {isCorrectNetwork ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="hidden sm:inline">{networkName}</span>
                </div>

                {/* Account Address Pill */}
                <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="text-xs font-mono text-slate-200">
                    {shortenAddress(account)}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                    title="Copy Address"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Disconnect */}
                <button
                  onClick={() => {
                    disconnect();
                    router.push("/");
                  }}
                  className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-sky-500/25 transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Network Warning Banner */}
      {account && !isCorrectNetwork && (
        <div className="bg-amber-500/15 border-y border-amber-500/30 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>You are connected to an unsupported network. Please switch to <b>Ethereum Sepolia Testnet</b> or <b>Localhost (31337)</b>.</span>
          <button
            onClick={() => switchNetwork(11155111)}
            className="ml-2 underline font-semibold text-amber-300 hover:text-white"
          >
            Switch to Sepolia
          </button>
        </div>
      )}
    </header>
  );
}
