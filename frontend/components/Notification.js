"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info, X, ExternalLink } from "lucide-react";

export default function Notification({ notification, onClose }) {
  if (!notification) return null;

  const { type = "info", title, message, txHash } = notification;

  const isSuccess = type === "success";
  const isError = type === "error";

  const getStyle = () => {
    if (isSuccess)
      return "border-emerald-300 dark:border-emerald-500/30 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-emerald-100 shadow-xl shadow-emerald-500/5";
    if (isError)
      return "border-rose-300 dark:border-rose-500/30 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-rose-100 shadow-xl shadow-rose-500/5";
    return "border-sky-300 dark:border-cyan-500/30 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-cyan-100 shadow-xl shadow-sky-500/5";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${getStyle()} flex items-start gap-3`}>
        <div className="shrink-0 mt-0.5">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          {isError && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          {!isSuccess && !isError && <Info className="w-5 h-5 text-sky-600 dark:text-cyan-400" />}
        </div>

        <div className="flex-1 min-w-0">
          {title && <h4 className="text-sm font-bold mb-0.5 text-slate-900 dark:text-white font-heading">{title}</h4>}
          <p className="text-xs text-slate-600 dark:text-slate-300 break-words leading-relaxed font-mono">{message}</p>

          {txHash && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                Tx: {txHash}
              </span>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-sky-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold shrink-0 ml-auto"
              >
                Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
