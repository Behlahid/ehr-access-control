"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress } from "../lib/utils";
import {
  Shield,
  User,
  Stethoscope,
  AlertTriangle,
  Copy,
  Check,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Search,
  BookOpen,
  RotateCcw,
  Menu,
  X,
  ExternalLink
} from "lucide-react";
import CommandPalette from "./CommandPalette";
import JargonTranslatorModal from "./JargonTranslatorModal";
import Logo from "./Logo";

export default function Navbar() {
  const {
    account,
    networkName,
    isCorrectNetwork,
    connectWallet,
    disconnect,
    switchNetwork,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Keyboard shortcuts (⌘K for Search, ⌘J for Jargon Matrix)
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

  // Theme synchronization with persistence
  useEffect(() => {
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
    setIsMobileMenuOpen(false);
    if (newRole === "patient") router.push("/patient");
    else if (newRole === "doctor") router.push("/doctor");
    else router.push("/");
  };

  const isPatientActive = pathname.startsWith("/patient");
  const isDoctorActive = pathname.startsWith("/doctor");

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#BAE6FD]/70 dark:border-slate-800/80 bg-white/95 dark:bg-[#06080C]/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* 1. Brand Logo & Product Name */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none rounded-xl"
              >
                <Logo size={34} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white font-heading group-hover:text-[#0284C7] transition-colors">
                      Health<span className="text-[#0284C7]">Ledger</span>
                    </span>
                    <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      EHR Smart Contract
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
                    Zero-Knowledge Sovereignty
                  </span>
                </div>
              </Link>
            </div>

            {/* 2. Primary Navigation: Segmented Switcher (Desktop) */}
            <nav
              aria-label="Portal Navigation"
              className="hidden md:flex items-center h-10 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <button
                type="button"
                id="nav-patient-tab"
                onClick={() => handleSwitchRole("patient")}
                className={`flex items-center gap-2 h-8 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none ${
                  isPatientActive
                    ? "bg-[#0284C7] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient Portal</span>
              </button>

              <button
                type="button"
                id="nav-doctor-tab"
                onClick={() => handleSwitchRole("doctor")}
                className={`flex items-center gap-2 h-8 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:outline-none ${
                  isDoctorActive
                    ? "bg-[#0891B2] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor Terminal</span>
              </button>
            </nav>

            {/* 3. Right Utility Area: Search, Plain-Language Guide, Theme, Wallet */}
            <div className="flex items-center gap-2 shrink-0">
              
              {/* Search Command Trigger (⌘K) */}
              <button
                type="button"
                onClick={() => setIsCommandOpen(true)}
                className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-[#0284C7]/40 transition-all text-xs cursor-pointer shadow-2xs"
                title="Search Command Palette (⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-sans">Search...</span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
                  ⌘K
                </kbd>
              </button>

              {/* Compact Search Trigger on small screens */}
              <button
                type="button"
                onClick={() => setIsCommandOpen(true)}
                className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title="Search (⌘K)"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Jargon Translation Matrix Trigger (⌘J) */}
              <button
                type="button"
                onClick={() => setIsJargonOpen(true)}
                className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-2xs"
                title="Medical Plain-Language Glossary (⌘J)"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#0284C7]" />
                <span className="hidden xl:inline">Plain-Language</span>
                <span>Guide</span>
              </button>

              {/* Theme Toggle (Sun/Moon with smooth rotation) */}
              <button
                type="button"
                onClick={toggleTheme}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                title={theme === "light" ? "Switch to Dark Mode" : "Switch to Clinical Light Mode"}
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
                )}
              </button>

              {/* Wallet / Demo Mode Status */}
              {isDemoMode ? (
                <div className="flex items-center gap-1.5">
                  <div className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="hidden sm:inline">{demoUser?.name || "Demo Sandbox"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetDemoSandbox();
                      window.location.reload();
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all cursor-pointer"
                    title="Reset Sandbox Records"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={exitDemoMode}
                    className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    Exit
                  </button>
                </div>
              ) : account ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Network Indicator */}
                  <div
                    onClick={() => !isCorrectNetwork && switchNetwork(11155111)}
                    className={`h-9 hidden lg:flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                      isCorrectNetwork
                        ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        : "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 animate-pulse"
                    }`}
                    title={!isCorrectNetwork ? "Click to switch to Ethereum Sepolia" : `Connected: ${networkName}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isCorrectNetwork ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-amber-500"
                      }`}
                    />
                    <span className="truncate max-w-[85px]">{networkName}</span>
                  </div>

                  {/* Account Address Pill with Copy */}
                  <div className="h-9 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 sm:px-3 text-xs font-mono text-slate-800 dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                    <span>{shortenAddress(account)}</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-[#0284C7] transition-colors cursor-pointer"
                      title="Copy Address"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Disconnect Button */}
                  <button
                    type="button"
                    onClick={() => {
                      disconnect();
                      router.push("/");
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-xl border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Disconnect Wallet"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => enterDemoMode(isDoctorActive ? "doctor" : "patient")}
                    className="h-9 hidden md:flex items-center gap-1.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={connectWallet}
                    className="h-9 px-4 rounded-xl bg-[#0284C7] hover:bg-sky-500 text-white font-bold text-xs tracking-tight shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
                  </button>
                </div>
              )}

              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#06080C] px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSwitchRole("patient")}
                className={`flex items-center justify-center gap-2 h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isPatientActive
                    ? "bg-[#0284C7] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Patient Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("doctor")}
                className={`flex items-center justify-center gap-2 h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDoctorActive
                    ? "bg-[#0891B2] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Doctor Terminal</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setIsJargonOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 py-1.5 font-semibold text-[#0284C7]"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open Plain-Language Guide</span>
              </button>

              {!account && !isDemoMode && (
                <button
                  type="button"
                  onClick={() => {
                    enterDemoMode("patient");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-purple-600 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Demo</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Network Warning Banner */}
        {account && !isDemoMode && !isCorrectNetwork && (
          <div className="bg-amber-500/10 border-y border-amber-500/30 px-4 py-2 text-center text-xs text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Unsupported Network. Switch to <b>Ethereum Sepolia Testnet</b> or <b>Localhost Hardhat</b>.</span>
            <button
              type="button"
              onClick={() => switchNetwork(11155111)}
              className="ml-2 px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Switch to Sepolia
            </button>
          </div>
        )}
      </header>

      {/* Global Command Palette Modal */}
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
