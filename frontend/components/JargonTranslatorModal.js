"use client";

import React, { useState } from "react";
import { JARGON_TRANSLATION_MATRIX } from "../lib/jargonMatrix";
import {
  BookOpen,
  Search,
  X,
  Shield,
  ArrowRight,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  FileText
} from "lucide-react";

export default function JargonTranslatorModal({ isOpen, onClose, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("all");

  React.useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || "");
      setSelectedCategory("all");

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, initialQuery, onClose]);

  if (!isOpen) return null;

  const categories = [
    "all",
    "Blockchain & Integrity",
    "Storage",
    "Cryptography",
    "Access Control",
    "Clinical Safety",
    "Artificial Intelligence",
    "Engineering",
  ];

  const filteredItems = JARGON_TRANSLATION_MATRIX.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const q = query.toLowerCase();
    const matchesQuery =
      !query.trim() ||
      item.technicalTerm.toLowerCase().includes(q) ||
      item.plainTerm.toLowerCase().includes(q) ||
      item.plainMeaning.toLowerCase().includes(q) ||
      item.whyItProtectsYou.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Patient Plain-Language Healthtech Guide
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  Jargon Translation Matrix
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Translating intimidating Web3 & AI terms into clear, human-first clinical definitions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by technical term, plain English word, or concept..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-cyan-600 text-white font-semibold shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Card List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No jargon translation found matching "{query}"
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2.5"
              >
                {/* Top Row: Technical vs Plain */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20 line-through opacity-85">
                      {item.technicalTerm}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.plainTerm}
                    </span>
                  </div>
                  <span className={`self-start sm:self-auto text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                {/* Plain Explanation */}
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {item.plainMeaning}
                </div>

                {/* Why It Protects You + Analogy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/15 space-y-0.5">
                    <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Why This Protects You</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-normal">
                      {item.whyItProtectsYou}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/15 space-y-0.5">
                    <div className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Everyday Analogy</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-normal italic">
                      "{item.analogy}"
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Showing {filteredItems.length} plain-language translations</span>
          <span className="font-mono text-slate-400">HIPAA & HL7 Plain-Language Compliant</span>
        </div>
      </div>
    </div>
  );
}
