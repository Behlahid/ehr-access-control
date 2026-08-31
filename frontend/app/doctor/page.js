"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../../context/Web3Context";
import { getEHRContract } from "../../lib/contract";
import { cidToBytes32, bytes32ToCid, shortenAddress, shortenHash, parseContractError } from "../../lib/utils";
import DecryptModal from "../../components/DecryptModal";
import Notification from "../../components/Notification";
import {
  Stethoscope,
  Search,
  Key,
  ShieldCheck,
  ShieldAlert,
  Send,
  Unlock,
  Loader2,
  FileText,
  User,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function DoctorDashboard() {
  const { account, signer, provider, connectWallet } = useWeb3();
  const [inputHash, setInputHash] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDecryptOpen, setIsDecryptOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleCheckAccess = async (e) => {
    e?.preventDefault();
    if (!inputHash.trim() || (!signer && !provider)) return;

    try {
      setIsSearching(true);
      setSearchResult(null);

      // Clean input: handle if user entered a CID (Qm...) or a bytes32 hex (0x...)
      let recordBytes32;
      const rawInput = inputHash.trim();
      if (rawInput.startsWith("Qm")) {
        recordBytes32 = cidToBytes32(rawInput);
      } else if (rawInput.startsWith("0x") && rawInput.length === 66) {
        recordBytes32 = rawInput;
      } else if (rawInput.length === 64) {
        recordBytes32 = "0x" + rawInput;
      } else {
        throw new Error("Invalid format. Please provide a 64-character hex hash (0x...) or an IPFS CID (Qm...).");
      }

      const runner = signer || provider;
      const contract = getEHRContract(runner);

      // Check on-chain owner & permissions
      const owner = await contract.recordOwner(recordBytes32);
      const isRegistered = owner !== ethers.ZeroAddress;

      let hasPermission = false;
      if (isRegistered && account) {
        hasPermission = await contract.hasAccess(recordBytes32, account);
      }

      const cid = bytes32ToCid(recordBytes32);

      setSearchResult({
        recordHash: recordBytes32,
        cid,
        owner,
        isRegistered,
        hasPermission,
      });
    } catch (err) {
      console.error("Access verification error:", err);
      setNotification({
        type: "error",
        title: "Verification Error",
        message: parseContractError(err),
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!searchResult || !signer) return;

    try {
      setIsRequesting(true);
      const contract = getEHRContract(signer);

      const tx = await contract.requestAccess(searchResult.recordHash);
      const receipt = await tx.wait();

      setNotification({
        type: "success",
        title: "Access Request Broadcasted",
        message: `Broadcasted AccessRequested event on-chain to patient ${shortenAddress(searchResult.owner)}.`,
        txHash: receipt.hash,
      });
    } catch (err) {
      console.error("Error requesting access:", err);
      setNotification({
        type: "error",
        title: "Request Failed",
        message: parseContractError(err),
      });
    } finally {
      setIsRequesting(false);
    }
  };

  if (!account) {
    return (
      <div className="py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Stethoscope className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Connect Wallet to Access Clinician Dashboard</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please connect your MetaMask wallet to verify on-chain EHR viewing permissions, request record access from patients, and decrypt clinical payloads.
        </p>
        <button
          onClick={connectWallet}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all"
        >
          Connect MetaMask
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Notification notification={notification} onClose={() => setNotification(null)} />

      {searchResult && (
        <DecryptModal
          isOpen={isDecryptOpen}
          recordHash={searchResult.recordHash}
          onClose={() => setIsDecryptOpen(false)}
        />
      )}

      {/* Page Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Doctor / Clinician Portal</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Verify On-Chain Access Rights, Request Consent, and Decrypt Medical Payloads
        </p>
      </div>

      {/* Search Access Box */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Check Record Access Permissions</h3>
            <p className="text-xs text-slate-400">
              Enter a 32-byte record hash (<code className="text-sky-300">0x...</code>) or IPFS CID (<code className="text-sky-300">Qm...</code>)
            </p>
          </div>
        </div>

        <form onSubmit={handleCheckAccess} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g. 0xa536a54990058dd58a3a060b349601852b6299e3043315b9fab5cb359c302078 or Qm..."
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl glass-input text-white text-xs font-mono placeholder:text-slate-500 pr-28 transition-all"
            />
            <button
              type="submit"
              disabled={isSearching || !inputHash.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Verify</span>
            </button>
          </div>
        </form>

        {/* Verification Result Display */}
        {searchResult && (
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5 animate-in fade-in">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                {searchResult.isRegistered ? (
                  searchResult.hasPermission ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>ACCESS AUTHORIZED</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                      <ShieldAlert className="w-4 h-4" />
                      <span>ACCESS NOT GRANTED</span>
                    </div>
                  )
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>UNREGISTERED RECORD HASH</span>
                  </div>
                )}
              </div>

              {searchResult.isRegistered && (
                <span className="text-xs font-mono text-slate-400">
                  Doctor: <span className="text-slate-200">{shortenAddress(account)}</span>
                </span>
              )}
            </div>

            {/* Metadata Fields */}
            {searchResult.isRegistered ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 block">Record Patient Owner</span>
                  <span className="text-sky-400 font-semibold select-all">{searchResult.owner}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 block">IPFS Content Identifier (CIDv0)</span>
                  <span className="text-slate-200 select-all">{searchResult.cid}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                This cryptographic hash has not been registered by any patient on the smart contract.
              </p>
            )}

            {/* Action Buttons */}
            {searchResult.isRegistered && (
              <div className="flex flex-wrap gap-3 pt-2">
                {searchResult.hasPermission ? (
                  <button
                    onClick={() => setIsDecryptOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Decrypt & View Medical Payload</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRequestAccess}
                    disabled={isRequesting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
                  >
                    {isRequesting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Request Access from Patient</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="p-5 glass-panel rounded-2xl border border-slate-800 flex items-start gap-3.5 text-xs text-slate-400">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-semibold text-white">How Access Rights & Decryption Function:</p>
          <p>
            1. Calling <code className="text-sky-300">hasAccess(recordHash, doctor)</code> verifies if the caller is the patient owner or an authorized clinician.
          </p>
          <p>
            2. If access is missing, clicking <b>"Request Access"</b> triggers <code className="text-amber-300">requestAccess()</code>, emitting an on-chain event to alert the patient.
          </p>
          <p>
            3. Once granted, the doctor fetches the encrypted blob from IPFS and decrypts it directly in-browser using the patient-provided AES-256 key.
          </p>
        </div>
      </div>
    </div>
  );
}
