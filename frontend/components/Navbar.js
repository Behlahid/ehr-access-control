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
  BookOpen,
  RotateCcw
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
    resetDemoSandbox,
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
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-obsidian-950/90 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-9 h-9 rounded-xl bg-cyan-600 dark:bg-cyan-500 text-white flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors whitespace-nowrap">
                      HealthLedger
                    </span>
                    <span className="hidden 2xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      ZK Enclave
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden xl:block truncate">
                    Decentralized EHR
                  </p>
                </div>
              </Link>
            </div>

            {/* Navigation Segmented Controls */}
            <div className="flex items-center h-10 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-inner shrink-0">
              <button
                id="nav-patient-tab"
                onClick={() => handleSwitchRole("patient")}
                className={`flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                  pathname.startsWith("/patient")
                    ? "bg-white dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/40 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Patient Portal</span>
                <span className="sm:hidden whitespace-nowrap">Patient</span>
              </button>

              <button
                id="nav-doctor-tab"
                onClick={() => handleSwitchRole("doctor")}
                className={`flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
                  pathname.startsWith("/doctor")
                    ? "bg-white dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-indigo-500/40 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Physician Terminal</span>
                <span className="sm:hidden whitespace-nowrap">Doctor</span>
              </button>
            </div>

            {/* Right Action / Wallet / Theme Toggle / Demo Status */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Quick OmniSearch Bar on 2xl screens */}
              <div
                onClick={() => setIsCommandOpen(true)}
                className="hidden 2xl:flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-cyan-500/40 cursor-pointer transition-all w-40 shadow-2xs hover:scale-[1.01] shrink-0"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs truncate">Search...</span>
                <kbd className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 shrink-0">
                  ⌘K
                </kbd>
              </div>

              {/* Compact Search Trigger on screens < 2xl */}
              <button
                id="command-palette-mobile-btn"
                type="button"
                onClick={() => setIsCommandOpen(true)}
                className="2xl:hidden h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="Search (⌘K)"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Plain-Language Healthtech Guide (Jargon Translation Matrix) */}
              <button
                id="jargon-matrix-btn"
                type="button"
                onClick={() => setIsJargonOpen(true)}
                className="btn-premium group h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-xs shadow-xs cursor-pointer active:scale-95 shrink-0"
                title="Patient Plain-Language Guide / Jargon Matrix (⌘J or Ctrl+J)"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 transition-transform group-hover:scale-110 shrink-0" />
                <span className="hidden xl:inline whitespace-nowrap">Plain Language</span>
                <span className="hidden md:inline xl:hidden whitespace-nowrap">Guide</span>
                <kbd className="hidden 2xl:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  ⌘J
                </kbd>
              </button>

              {/* Theme Switcher Button */}
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={toggleTheme}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm active:scale-90 hover:scale-105 shrink-0"
                title={theme === "light" ? "Switch to Physician Dark Mode" : "Switch to Clean Clinical Light Mode (Apple Health)"}
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4 text-slate-600 transition-transform hover:-rotate-12" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
                )}
              </button>

              {isDemoMode ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                    <span className="font-semibold whitespace-nowrap hidden sm:inline">{demoUser?.name || "Clinical Demo"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetDemoSandbox();
                      window.location.reload();
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer active:scale-95"
                    title="Reset Demo Sandbox to Default State"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={exitDemoMode}
                    className="h-9 px-2.5 rounded-xl text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer active:scale-95"
                    title="Exit Demo Sandbox"
                  >
                    Exit
                  </button>
                </div>
              ) : account ? (
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Network Pill */}
                  <div
                    onClick={() => !isCorrectNetwork && switchNetwork(11155111)}
                    className={`h-9 hidden lg:flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-mono font-medium border cursor-pointer transition-all active:scale-95 ${
                      isCorrectNetwork
                        ? "bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300"
                        : "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-300"
                    }`}
                    title={!isCorrectNetwork ? "Click to switch network to Sepolia" : `Connected to ${networkName}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isCorrectNetwork ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <span className="truncate max-w-[80px]">{networkName}</span>
                  </div>

                  {/* Account Address Pill */}
                  <div className="h-9 flex items-center gap-1.5 bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 sm:px-3 shadow-sm shrink-0">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                    <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                      {shortenAddress(account)}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors active:scale-90"
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
                    className="h-9 w-9 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-transparent hover:border-rose-300 dark:hover:border-rose-500/30 rounded-xl transition-all active:scale-95 shrink-0"
                    title="Disconnect Wallet"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={() => enterDemoMode(pathname.startsWith("/doctor") ? "doctor" : "patient")}
                    className="btn-premium group h-9 hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                    title="Explore simulated records without MetaMask"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110 shrink-0" />
                    <span className="hidden xl:inline">Explore Demo</span>
                    <span className="xl:hidden">Demo</span>
                  </button>

                  <button
                    onClick={connectWallet}
                    className="btn-premium group h-9 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-tight shadow-md shadow-cyan-600/20 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Shield className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
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
      </header>

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
    </>
  );
}
