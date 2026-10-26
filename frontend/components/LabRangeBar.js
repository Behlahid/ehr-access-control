"use client";

import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * LabRangeBar Component
 * Inspired by Apple Health & Epic MyChart laboratory observation interfaces.
 * Displays discrete medical lab metrics with standard reference intervals,
 * an interactive horizontal gauge, and clinical status flags.
 * Fully supports clean clinical light mode and dark mode.
 */
export default function LabRangeBar({
  name,
  value,
  unit,
  min = 0,
  max = 300,
  optimalMin = 100,
  optimalMax = 200,
  status = "normal", // 'normal' | 'borderline' | 'abnormal'
  notes,
}) {
  // Compute percentage clamped between 0% and 100%
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const optimalStartPct = Math.max(0, ((optimalMin - min) / (max - min)) * 100);
  const optimalWidthPct = Math.min(100 - optimalStartPct, ((optimalMax - optimalMin) / (max - min)) * 100);

  const isNormal = status === "normal" || (value >= optimalMin && value <= optimalMax);

  return (
    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-2 shadow-sm">
      {/* Header: Test Name & Measured Value */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{name}</span>
          {notes && <span className="text-[10px] text-slate-500 dark:text-slate-400">({notes})</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
            {value} <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">{unit}</span>
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
              isNormal
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
            }`}
          >
            {isNormal ? (
              <>
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span>Normal</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                <span>Borderline</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Visual Reference Range Gauge */}
      <div className="space-y-1">
        <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden">
          {/* Normal Reference Range Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/20 dark:bg-emerald-500/25 rounded-sm"
            style={{
              left: `${optimalStartPct}%`,
              width: `${optimalWidthPct}%`,
            }}
          />
          {/* Active Value Indicator Pin */}
          <div
            className={`absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full shadow-md transition-all ${
              isNormal ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-500 shadow-amber-500/50"
            }`}
            style={{ left: `${percentage}%` }}
          />
        </div>

        {/* Range Labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <span>{min}</span>
          <span className="text-slate-600 dark:text-slate-400">
            Standard: {optimalMin}–{optimalMax} {unit}
          </span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}
