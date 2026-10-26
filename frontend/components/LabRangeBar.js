"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, ArrowDown } from "lucide-react";

/**
 * LabRangeBar Component
 * Faithfully implemented from Google Stitch "Clinical Precision" Design System.
 * Features:
 * - High-precision continuous 3-segment range slider (Optimal, Borderline, High/Out-of-range)
 * - Dynamic dropdown pointer with numeric readout badge
 * - LOINC code metadata tag
 * - Clinical status pill with live status indicator
 * - Dual-theme support: Clean Clinical Light Mode and Physician Dark Mode
 */
export default function LabRangeBar({
  name,
  value,
  unit = "mg/dL",
  loinc = "LOINC: 2093-3",
  min = 0,
  max = 300,
  optimalMax = 200,
  borderlineMax = 240,
  targetLabel = "(<200 mg/dL Desirable)",
  status = "normal", // 'normal' | 'borderline' | 'abnormal'
  statusLabel = "In-Range"
}) {
  // Clamp value between min and max
  const clampedVal = Math.min(max, Math.max(min, value));
  const markerPercent = Math.min(96, Math.max(4, ((clampedVal - min) / (max - min)) * 100));

  // Segment widths
  const optimalWidth = Math.min(100, Math.max(10, ((optimalMax - min) / (max - min)) * 100));
  const borderlineWidth = Math.min(100 - optimalWidth, Math.max(10, ((borderlineMax - optimalMax) / (max - min)) * 100));
  const highWidth = Math.max(0, 100 - optimalWidth - borderlineWidth);

  const isNormal = status === "normal" || value <= optimalMax;
  const isBorderline = status === "borderline" || (value > optimalMax && value <= borderlineMax);

  return (
    <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0">
      {/* Metric Name, LOINC Code & Current Readout */}
      <div className="md:w-1/3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{name}</h4>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80">
            {loinc}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{value}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{unit}</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium ml-1.5">{targetLabel}</span>
        </div>
      </div>

      {/* Visual Reference Segmented Continuous Range Slider */}
      <div className="flex-1 max-w-xl flex flex-col gap-1.5">
        {/* Interval Boundaries */}
        <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>{min}</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">Optimal &lt;{optimalMax}</span>
          <span className="text-slate-600 dark:text-slate-400">Borderline {optimalMax}–{borderlineMax}</span>
          <span className="text-rose-600 dark:text-rose-400">High &gt;{borderlineMax}</span>
        </div>

        {/* 3-Zone Segmented Track */}
        <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div className="bg-emerald-200 dark:bg-emerald-600/35 h-full transition-all" style={{ width: `${optimalWidth}%` }} />
          <div className="bg-amber-100 dark:bg-amber-500/25 h-full transition-all" style={{ width: `${borderlineWidth}%` }} />
          <div className="bg-rose-100 dark:bg-rose-500/25 h-full transition-all" style={{ width: `${highWidth}%` }} />
        </div>

        {/* Dynamic Indicator Dropdown Pin */}
        <div className="relative w-full h-5">
          <div
            className="absolute -top-1.5 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
            style={{ left: `${markerPercent}%` }}
          >
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-cyan-600 dark:border-b-cyan-400" />
            <span className="text-[10px] font-mono font-bold bg-cyan-600 dark:bg-cyan-500 text-white px-1.5 py-0.5 rounded shadow-sm">
              {value}
            </span>
          </div>
        </div>
      </div>

      {/* Clinical Status Pill Badge */}
      <div className="md:w-32 flex md:justify-end">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-2xs ${
            isNormal
              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
              : isBorderline
              ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
              : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isNormal ? "bg-emerald-500" : isBorderline ? "bg-amber-500" : "bg-rose-500"
            }`}
          />
          <span>{statusLabel}</span>
        </span>
      </div>
    </div>
  );
}
