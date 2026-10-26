"use client";

import React, { useState, useEffect } from "react";
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
  Zap,
  Sun,
  Moon,
  Search,
  Command,
  BookOpen
} from "lucide-react";
import CommandPalette from "./CommandPalette";
import JargonTranslatorModal from "./JargonTranslatorModal";

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
  const [theme, setTheme] = useState("light");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isJargonOpen, setIsJargonOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsJargonOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Default to clean clinical light mode (Apple Health / Epic MyChart standard)
    const savedTheme = localStorage.getItem("ehr_theme") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("ehr_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-obsidian-950/90 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 dark:from-slate-800 dark:to-obsidian-900 border border-cyan-400/30 dark:border-slate-700/80 flex items-center justify-center shadow-md group-hover:border-cyan-500 transition-all text-white">
              <Shield className="w-5 h-5 text-white dark:text-cyan-400 group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                  HealthLedger
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Clinical Web3
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight">
                Sovereign Healthcare & Collaborative AI
              </p>
            </div>
          </Link>

          {/* Navigation Segmented Controls (Always Visible for seamless switching) */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-obsidian-900/90 rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-inner">
            <button
              id="nav-patient-tab"
              onClick={() => handleSwitchRole("patient")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname.startsWith("/patient")
                  ? "bg-white dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient Portal</span>
            </button>

            <button
              id="nav-doctor-tab"
              onClick={() => handleSwitchRole("doctor")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname.startsWith("/doctor")
                  ? "bg-white dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-indigo-500/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Physician Terminal</span>
            </button>
          </div>

          {/* Right Action / Wallet / Theme Toggle / Demo Status */}
          <div className="flex items-center gap-2.5">
            {/* Plain-Language Healthtech Guide (Jargon Translation Matrix) */}
            <button
              id="jargon-matrix-btn"
              type="button"
              onClick={() => setIsJargonOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-xs shadow-xs"
              title="Patient Plain-Language Guide / Jargon Matrix (⌘J or Ctrl+J)"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden md:inline">Plain-Language</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                ⌘J
              </kbd>
            </button>

            {/* Linear Command Palette Trigger */}
            <button
              id="command-palette-btn"
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-xs shadow-xs"
              title="Linear OmniSearch (⌘K or Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Theme Switcher Button */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
              title={theme === "light" ? "Switch to Physician Dark Mode" : "Switch to Clean Clinical Light Mode (Apple Health)"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-slate-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {isDemoMode ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                  <span className="font-semibold hidden sm:inline">{demoUser?.name || "Clinical Demo"}</span>
                  <span className="text-[10px] opacity-75 hidden md:inline">({demoUser?.organization})</span>
                </div>
                <button
                  onClick={exitDemoMode}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 transition-all"
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
                      ? "bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300"
                      : "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-300"
                  }`}
                  title={!isCorrectNetwork ? "Click to switch network to Sepolia" : `Connected to ${networkName}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCorrectNetwork ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-amber-400 animate-pulse"
                    }`}
                  />
                  <span>{networkName}</span>
                </div>

                {/* Account Address Pill */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                    {shortenAddress(account)}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
                    title="Copy Wallet Address"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={() => {
                    disconnect();
                    router.push("/");
                  }}
                  className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-transparent hover:border-rose-300 dark:hover:border-rose-500/30 rounded-xl transition-all"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => enterDemoMode(pathname.startsWith("/doctor") ? "doctor" : "patient")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-semibold transition-all shadow-sm"
                  title="Explore simulated records without MetaMask"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="hidden sm:inline">Explore Demo</span>
                </button>

                <button
                  onClick={connectWallet}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-tight shadow-md shadow-cyan-600/20 transition-all active:scale-[0.98]"
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
        <div className="bg-amber-500/10 border-y border-amber-500/30 px-4 py-2 text-center text-xs text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Unsupported Network. Switch to <b>Ethereum Sepolia Testnet</b> or <b>Localhost Hardhat (31337)</b>.</span>
          <button
            onClick={() => switchNetwork(11155111)}
            className="ml-2 px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 text-[11px] font-semibold transition-colors"
          >
            Switch to Sepolia
          </button>
        </div>
      )}

      {/* Linear-Style Global OmniSearch Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onOpenJargon={() => setIsJargonOpen(true)}
      />

      {/* Jargon Translation Matrix Modal */}
      <JargonTranslatorModal
        isOpen={isJargonOpen}
        onClose={() => setIsJargonOpen(false)}
      />
    </header>
  );
}
