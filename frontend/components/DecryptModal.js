"use client";

import React, { useState } from "react";
import { fetchEncryptedBlob } from "../lib/ipfs";
import { decryptFile } from "../lib/crypto";
import { bytes32ToCid, shortenHash } from "../lib/utils";
import { X, Unlock, Key, FileText, Download, AlertCircle, Loader2, CheckCircle2, Eye, Terminal } from "lucide-react";

export default function DecryptModal({ isOpen, recordHash, onClose }) {
  const [aesKey, setAesKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [decryptedResult, setDecryptedResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const cid = bytes32ToCid(recordHash);

  const handleDecrypt = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanKey = aesKey.trim();
    if (!cleanKey) {
      setError("Please paste the 64-character AES-256 decryption key provided by the patient.");
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch encrypted blob from IPFS
      const encryptedBuffer = await fetchEncryptedBlob(cid);

      // 2. Decrypt in-browser using Web Crypto API
      const result = await decryptFile(encryptedBuffer, cleanKey);
      setDecryptedResult(result);
      setLoading(false);
    } catch (err) {
      console.error("Decryption error:", err);
      setError(err.message || "Decryption failed. Please verify the AES key and try again.");
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!decryptedResult) return;
    const a = document.createElement("a");
    a.href = decryptedResult.url;
    a.download = decryptedResult.fileName || "medical_record.dat";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg surface-card rounded-2xl border border-white/[0.12] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Client-Side Decryption Station</h3>
              <p className="text-xs text-slate-400 font-mono">
                CID: <span className="text-cyan-400">{cid}</span>
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
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-mono leading-relaxed">{error}</div>
          </div>
        )}

        {!decryptedResult ? (
          <form onSubmit={handleDecrypt} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wide mb-2">
                Input Patient AES-256 Secret Key (64-Char Hex)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Paste the patient's AES-256 hexadecimal decryption key..."
                value={aesKey}
                onChange={(e) => setAesKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl clinical-input text-white text-xs font-mono placeholder:text-slate-500 transition-all resize-none"
              />
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Decryption runs entirely in your local browser memory via Web Crypto API.
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
                disabled={loading || !aesKey.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>Decrypt Payload</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-300 font-mono">
                  Decryption Verified Successfully
                </h4>
                <p className="text-[11px] text-slate-300">
                  AES-GCM-256 authentication tag matched. Data integrity intact.
                </p>
              </div>
            </div>

            {/* Decrypted Content Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>File: {decryptedResult.fileName}</span>
                <span>Type: {decryptedResult.mimeType || "application/octet-stream"}</span>
              </div>

              {decryptedResult.textContent ? (
                <div className="bg-obsidian-950 rounded-xl border border-slate-800 p-3.5 max-h-56 overflow-y-auto">
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                    {decryptedResult.textContent}
                  </pre>
                </div>
              ) : (
                <div className="p-8 text-center bg-obsidian-950 rounded-xl border border-slate-800 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Binary medical file (e.g. PDF/DICOM/Image) ready for local inspection.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDecryptedResult(null)}
                className="px-4 py-2 rounded-xl surface-interactive text-xs font-mono text-slate-400 hover:text-white"
              >
                Decrypt Another
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-mono text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Decrypted File</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
