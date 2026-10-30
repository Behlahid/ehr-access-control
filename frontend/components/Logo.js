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
        className="shrink-0 transition-opacity hover:opacity-90 duration-150"
      >
        <defs>
          <linearGradient id="hl-shield" x1="9" y1="4" x2="39" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
        </defs>

        {/* Outer Hexagonal Shield */}
        <path
          d="M24 4L39 11V23.5C39 32.5 32.5 40.5 24 44C15.5 40.5 9 32.5 9 23.5V11L24 4Z"
          stroke="url(#hl-shield)"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#0284C7"
          fillOpacity="0.06"
        />

        {/* Constellation Blockchain Links */}
        <path
          d="M24 4V14M9 11L18 17M39 11L30 17M14 24L18 24M34 24L30 24M15 35L24 28M33 35L24 28M24 44V34"
          stroke="#0284C7"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />

        {/* Medical Cross (Centered Core) */}
        <path
          d="M21 14H27V21H34V27H27V34H21V27H14V21H21V14Z"
          fill="#0284C7"
          fillOpacity="0.9"
        />

        {/* Distributed Federated Nodes */}
        <circle cx="24" cy="4" r="1.5" fill="#0284C7" />
        <circle cx="39" cy="11" r="1.5" fill="#0284C7" />
        <circle cx="9" cy="11" r="1.5" fill="#0284C7" />
        <circle cx="39" cy="23.5" r="1.5" fill="#0284C7" />
        <circle cx="9" cy="23.5" r="1.5" fill="#0284C7" />
        <circle cx="24" cy="44" r="1.5" fill="#0284C7" />
        <circle cx="24" cy="24" r="2" fill="#FFFFFF" />
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
