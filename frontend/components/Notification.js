"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info, X, ExternalLink } from "lucide-react";

export default function Notification({ notification, onClose }) {
  if (!notification) return null;

  const { type = "info", title, message, txHash } = notification;

  const isSuccess = type === "success";
  const isError = type === "error";

  const getBorderColor = () => {
    if (isSuccess) return "border-emerald-500/40 bg-emerald-950/80 text-emerald-100";
    if (isError) return "border-rose-500/40 bg-rose-950/80 text-rose-100";
    return "border-sky-500/40 bg-slate-900/90 text-sky-100";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${getBorderColor()} flex items-start gap-3`}>
        <div className="shrink-0 mt-0.5">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {!isSuccess && !isError && <Info className="w-5 h-5 text-sky-400" />}
        </div>

        <div className="flex-1 min-w-0">
          {title && <h4 className="text-sm font-semibold mb-0.5">{title}</h4>}
          <p className="text-xs opacity-90 break-words leading-relaxed">{message}</p>

          {txHash && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
              <span className="text-[11px] font-mono opacity-80 truncate">
                Tx: {txHash}
              </span>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium shrink-0 ml-auto"
              >
                Etherscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
