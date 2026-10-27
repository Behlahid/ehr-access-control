"use client";

import React from "react";

export default function Logo({ size = 36, className = "", showText = false, textClassName = "" }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Scalable Vector Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
      >
        <defs>
          {/* Clinical Sapphire -> Cyan -> Emerald Gradient */}
          <linearGradient id="hl-gradient" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#0891B2" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <linearGradient id="hl-gradient-cross" x1="16" y1="12" x2="32" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>

          <filter id="hl-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284C7" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Hexagonal Shield */}
        <path
          d="M24 4L39 11V23.5C39 32.5 32.5 40.5 24 44C15.5 40.5 9 32.5 9 23.5V11L24 4Z"
          stroke="url(#hl-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#hl-gradient)"
          fillOpacity="0.08"
          filter="url(#hl-glow)"
        />

        {/* Constellation Blockchain Links */}
        <path
          d="M24 4V14M9 11L18 17M39 11L30 17M14 24L18 24M34 24L30 24M15 35L24 28M33 35L24 28M24 44V34"
          stroke="url(#hl-gradient)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />

        {/* Medical Cross (Centered Core) */}
        <path
          d="M21 14H27V21H34V27H27V34H21V27H14V21H21V14Z"
          fill="url(#hl-gradient-cross)"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* Distributed Federated Nodes */}
        <circle cx="24" cy="4" r="1.75" fill="#38BDF8" />
        <circle cx="39" cy="11" r="1.75" fill="#22D3EE" />
        <circle cx="9" cy="11" r="1.75" fill="#0284C7" />
        <circle cx="39" cy="23.5" r="1.75" fill="#10B981" />
        <circle cx="9" cy="23.5" r="1.75" fill="#0891B2" />
        <circle cx="24" cy="44" r="1.75" fill="#34D399" />
        <circle cx="24" cy="24" r="2.2" fill="#FFFFFF" />
      </svg>

      {/* Brand Typography (Optional) */}
      {showText && (
        <div className="flex flex-col">
          <span className={`text-base font-extrabold tracking-tight text-slate-900 dark:text-white font-heading ${textClassName}`}>
            Health<span className="text-[#0284C7]">Ledger</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 -mt-0.5 tracking-wider uppercase">
            Sovereign EHR
          </span>
        </div>
      )}
    </div>
  );
}
