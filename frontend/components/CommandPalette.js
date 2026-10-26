"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Command,
  FileText,
  User,
  Heart,
  Activity,
  Sun,
  Moon,
  Shield,
  ArrowRight,
  Sparkles,
  X,
  CornerDownLeft,
  Lock,
  Stethoscope,
  BookOpen
} from "lucide-react";

export default function CommandPalette({ isOpen, onClose, onOpenJargon }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keyboard listener for Escape and Arrow navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("ehr_theme", isDark ? "dark" : "light");
    } catch (e) {}
  };

  const ITEMS = [
    // Navigation
    {
      id: "nav-patient",
      category: "Navigation",
      title: "Open Patient Health Records Portal",
      subtitle: "View discrete observations, Apple Health vitals & Care Team",
      icon: Heart,
      iconColor: "text-rose-500",
      shortcut: "G P",
      onSelect: () => router.push("/patient"),
    },
    {
      id: "nav-doctor",
      category: "Navigation",
      title: "Open Physician Consultation Terminal",
      subtitle: "Inspect patient records, permissions & clinical decryption",
      icon: Stethoscope,
      iconColor: "text-indigo-500",
      shortcut: "G D",
      onSelect: () => router.push("/doctor"),
    },
    {
      id: "action-theme",
      category: "Preferences",
      title: "Toggle Clean Clinical Light / Physician Dark Mode",
      subtitle: "Switch between daytime hospital light and radiology dark mode",
      icon: Sun,
      iconColor: "text-amber-500",
      shortcut: "T",
      onSelect: () => toggleTheme(),
    },
    {
      id: "action-jargon",
      category: "Patient Education & Transparency",
      title: "Open Plain-Language Healthtech Guide (Jargon Translation Matrix)",
      subtitle: "Plain-English clinical definitions for Web3, cryptographic hashes & AI training terms",
      icon: BookOpen,
      iconColor: "text-cyan-500",
      shortcut: "⌘J",
      onSelect: () => {
        if (onOpenJargon) onOpenJargon();
      },
    },
    // Clinical Records
    {
      id: "rec-cardio",
      category: "Clinical Diagnostic Records",
      title: "Comprehensive Cardiac Angiography & Stress Study",
      subtitle: "MRN-9024-C • St. Jude Heart Institute • Dr. Sarah Chen, MD",
      icon: Activity,
      iconColor: "text-rose-500",
      badge: "Cardiology",
      onSelect: () => router.push("/patient?filter=Cardiology"),
    },
    {
      id: "rec-lipid",
      category: "Clinical Diagnostic Records",
      title: "Complete Lipid, Glucose & Metabolic Diagnostic Panel",
      subtitle: "MRN-4819-M • Clinical Pathology Labs • Reference Range Visualizer",
      icon: FileText,
      iconColor: "text-emerald-500",
      badge: "Biochemistry",
      onSelect: () => router.push("/patient?filter=Biochemistry"),
    },
    {
      id: "rec-holter",
      category: "Clinical Diagnostic Records",
      title: "24-Hour Ambulatory Holter ECG Rhythm Analysis",
      subtitle: "MRN-7731-H • Memorial Hospital Telemetry • Normal Sinus Rhythm",
      icon: Activity,
      iconColor: "text-purple-500",
      badge: "Telemetry",
      onSelect: () => router.push("/patient?filter=Telemetry"),
    },
    // Care Team
    {
      id: "doc-chen",
      category: "Care Team & Clinicians",
      title: "Dr. Sarah Chen, MD, FACC (Attending Cardiologist)",
      subtitle: "Mount Sinai Heart • Active Authorization: 28 Days Remaining",
      icon: User,
      iconColor: "text-cyan-500",
      badge: "Active",
      onSelect: () => router.push("/patient?tab=careteam"),
    },
    {
      id: "doc-vance",
      category: "Care Team & Clinicians",
      title: "Dr. Marcus Vance, MD (Consulting Endocrinologist)",
      subtitle: "Metro Health Endocrinology • Authorized Consultation",
      icon: User,
      iconColor: "text-slate-400",
      badge: "Active",
      onSelect: () => router.push("/patient?tab=careteam"),
    },
    // Safety & Governance
    {
      id: "action-breakglass",
      category: "Security & Safety Governance",
      title: "Emergency Break-the-Glass Policy & Audit Log",
      subtitle: "Forensic trauma override guarantees & on-chain accountability",
      icon: Shield,
      iconColor: "text-amber-500",
      badge: "Security",
      onSelect: () => router.push("/patient?tab=careteam"),
    },
  ];

  const filteredItems = ITEMS.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search records, lab results, doctors, or commands..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No clinical records or commands matching "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-950 dark:text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? "bg-indigo-100 dark:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {item.shortcut}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Linear Keyboard Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">esc</kbd>
              <span>to close</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
            <Command className="w-3 h-3" />
            <span>HealthLedger OmniSearch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
