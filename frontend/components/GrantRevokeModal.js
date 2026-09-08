"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { getEHRContract } from "../lib/contract";
import { shortenHash, parseContractError } from "../lib/utils";
import { X, UserPlus, UserX, AlertCircle, Loader2, Check, Shield } from "lucide-react";

export default function GrantRevokeModal({ isOpen, mode = "grant", recordHash, onClose, onSuccess }) {
  const { signer, account } = useWeb3();
  const [doctorAddress, setDoctorAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const isGrant = mode === "grant";

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

    try {
      setLoading(true);
      const contract = getEHRContract(signer);

      let tx;
      if (isGrant) {
        tx = await contract.grantAccess(recordHash, cleanAddress);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md surface-card rounded-2xl border border-white/[0.12] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isGrant
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
              }`}
            >
              {isGrant ? <UserPlus className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isGrant ? "Authorize Physician Access" : "Revoke Physician Access"}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Record: {shortenHash(recordHash)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="font-mono leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase tracking-wide">
              Physician Ethereum Address
            </label>
            <input
              type="text"
              placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
              value={doctorAddress}
              onChange={(e) => setDoctorAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl clinical-input text-xs font-mono placeholder:text-slate-500 placeholder:font-sans"
              required
            />
            <p className="text-[11px] text-slate-500 font-mono">
              {isGrant
                ? "This transaction sets accessGranted[recordHash][doctor] = true on Ethereum."
                : "This transaction sets accessGranted[recordHash][doctor] = false on Ethereum."}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl surface-interactive text-xs font-mono text-slate-400 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !doctorAddress.trim()}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-50 ${
                isGrant
                  ? "bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 shadow-md shadow-emerald-500/20"
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20"
              }`}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{isGrant ? "Grant Access" : "Revoke Access"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
