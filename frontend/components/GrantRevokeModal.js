"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { getEHRContract } from "../lib/contract";
import { shortenHash, parseContractError } from "../lib/utils";
import { grantDemoAccess, revokeDemoAccess } from "../lib/demoEngine";
import { X, UserPlus, UserX, AlertCircle, Loader2, Check, Shield } from "lucide-react";

export default function GrantRevokeModal({
  isOpen,
  mode = "grant",
  recordHash,
  initialDoctorAddress = "",
  onClose,
  onSuccess,
}) {
  const { signer, account, isDemoMode } = useWeb3();
  const [doctorAddress, setDoctorAddress] = useState(initialDoctorAddress);
  const [duration, setDuration] = useState(0); // 0 = indefinite, 86400 = 24h, 604800 = 7d, 2592000 = 30d
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      setDoctorAddress(initialDoctorAddress || "");
      setError(null);
    }
  }, [isOpen, initialDoctorAddress]);

  if (!isOpen) return null;

  const isGrant = mode === "grant";

  const durationOptions = [
    { label: "Indefinite", value: 0 },
    { label: "24 Hours (Consultation)", value: 86400 },
    { label: "7 Days (Care Episode)", value: 604800 },
    { label: "30 Days (Specialist Referral)", value: 2592000 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanAddress = doctorAddress.trim();
    if (!ethers.isAddress(cleanAddress)) {
      setError("Please enter a valid Ethereum address (0x...).");
      return;
    }

    if (cleanAddress.toLowerCase() === account?.toLowerCase() && isGrant) {
      setError("You are the record owner and already possess complete access rights.");
      return;
    }

    // Demo Mode Simulation Fallback
    if (isDemoMode) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const durationLabel = durationOptions.find((d) => d.value === duration)?.label || "Indefinite";
        if (isGrant) {
          grantDemoAccess(recordHash, cleanAddress, duration, durationLabel);
        } else {
          revokeDemoAccess(recordHash, cleanAddress);
        }
        if (onSuccess) {
          onSuccess(
            isGrant ? "Physician Authorization Granted" : "Physician Authorization Revoked",
            isGrant
              ? `Granted ${durationLabel.toLowerCase()} permission for record to Dr. (${cleanAddress.slice(0, 8)}...). (Demo Mode)`
              : `Revoked access permissions for doctor (${cleanAddress.slice(0, 8)}...). (Demo Mode)`,
            "0x5a18d...demo99"
          );
        }
        onClose();
      }, 700);
      return;
    }

    if (!signer) {
      setError("MetaMask wallet connection required to sign transaction. Please connect your wallet or enter Demo Mode.");
      return;
    }

    try {
      setLoading(true);
      const contract = getEHRContract(signer);

      let tx;
      if (isGrant) {
        if (duration > 0) {
          tx = await contract.grantAccessWithExpiry(recordHash, cleanAddress, duration);
        } else {
          tx = await contract.grantAccess(recordHash, cleanAddress);
        }
      } else {
        tx = await contract.revokeAccess(recordHash, cleanAddress);
      }

      const receipt = await tx.wait();
      setLoading(false);

      if (onSuccess) {
        onSuccess(
          isGrant ? "Access Granted Successfully" : "Access Revoked Successfully",
          isGrant
            ? `Authorized physician permissions for record to doctor ${cleanAddress}.`
            : `Revoked physician access permissions for doctor ${cleanAddress}.`,
          receipt.hash
        );
      }
      onClose();
    } catch (err) {
      console.error(`Error in ${mode} access:`, err);
      setError(parseContractError(err));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isGrant
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400"
              }`}
            >
              {isGrant ? <UserPlus className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isGrant ? "Authorize Physician Access" : "Revoke Physician Access"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Record: {shortenHash(recordHash)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="font-mono leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Physician Ethereum Address
            </label>
            <input
              type="text"
              placeholder="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
              value={doctorAddress}
              onChange={(e) => setDoctorAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 outline-none shadow-2xs"
              required
            />
            {/* Quick demo doctor button */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{isGrant ? "Grants cryptographic consultation rights." : "Revokes cryptographic viewing rights."}</span>
              <button
                type="button"
                onClick={() => setDoctorAddress("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")}
                className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-medium"
              >
                Use Dr. Sarah Chen
              </button>
            </div>
          </div>

          {/* Time Expiry Duration Picker (Grant Mode only) */}
          {isGrant && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Access Duration Guarantee</span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">grantAccessWithExpiry</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {durationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDuration(opt.value)}
                    className={`p-2 rounded-xl text-[11px] font-medium border text-left transition-all cursor-pointer ${
                      duration === opt.value
                        ? "bg-cyan-50 dark:bg-cyan-500/15 border-cyan-400 dark:border-cyan-500/40 text-cyan-900 dark:text-cyan-300 font-semibold shadow-xs"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !doctorAddress.trim()}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                isGrant
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20"
              }`}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{isGrant ? "Authorize Access" : "Revoke Access"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
