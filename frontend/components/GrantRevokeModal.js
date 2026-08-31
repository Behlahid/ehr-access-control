"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { getEHRContract } from "../lib/contract";
import { shortenHash, parseContractError } from "../lib/utils";
import { X, UserPlus, UserX, AlertCircle, Loader2, Check } from "lucide-react";

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
      setError("Please enter a valid Ethereum wallet address (0x...).");
      return;
    }

    if (cleanAddress.toLowerCase() === account?.toLowerCase() && isGrant) {
      setError("You are the record owner and already possess full access.");
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
            ? `Granted clinical viewing permissions for record to doctor ${cleanAddress}.`
            : `Revoked access permissions for doctor ${cleanAddress}.`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-2xl border border-slate-700/70 p-6 shadow-2xl">
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
                {isGrant ? "Grant Doctor Access" : "Revoke Doctor Access"}
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Doctor / Clinician Wallet Address
            </label>
            <input
              type="text"
              required
              placeholder="0x71C...3a5b"
              value={doctorAddress}
              onChange={(e) => setDoctorAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs font-mono placeholder:text-slate-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              {isGrant
                ? "This will update the on-chain access mapping and emit an AccessGranted event."
                : "This will remove the doctor's viewing authorization on-chain and emit AccessRevoked."}
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !doctorAddress}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg disabled:opacity-50 transition-all ${
                isGrant
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isGrant ? "Confirm Grant" : "Confirm Revocation"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
