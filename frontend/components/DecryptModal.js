"use client";

import React, { useState } from "react";
import { fetchEncryptedBlob } from "../lib/ipfs";
import { decryptFile } from "../lib/crypto";
import { bytes32ToCid, shortenHash } from "../lib/utils";
import { X, Unlock, Key, FileText, Download, AlertCircle, Loader2, CheckCircle2, Eye } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-slate-700/70 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Client-Side Record Decryption</h3>
              <p className="text-xs text-slate-400 font-mono">
                CID: <span className="text-sky-400">{cid}</span>
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
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {!decryptedResult ? (
          <form onSubmit={handleDecrypt} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Paste 256-bit AES Decryption Key (Hex)
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. 4a8f9c2d1b0e3f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a"
                value={aesKey}
                onChange={(e) => setAesKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-xs font-mono placeholder:text-slate-600 transition-all resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                The ciphertext is pulled from IPFS and decrypted strictly inside your browser. No plaintext data is transmitted.
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
                disabled={loading || !aesKey.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Fetch from IPFS & Decrypt</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Decryption Successful!</h4>
                <p className="text-[11px] text-emerald-300/90">
                  Authenticated and decrypted via Web Crypto API (AES-GCM-256).
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">File Name:</span>
                <span className="text-white font-medium">{decryptedResult.fileName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">MIME Type:</span>
                <span className="text-slate-300 font-mono">{decryptedResult.mimeType}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Size:</span>
                <span className="text-slate-300">{(decryptedResult.decryptedBuffer.byteLength / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            {/* In-Browser Preview if Image */}
            {decryptedResult.mimeType.startsWith("image/") && (
              <div className="max-h-60 overflow-hidden rounded-xl border border-slate-800 flex items-center justify-center bg-black/40">
                <img
                  src={decryptedResult.url}
                  alt="Decrypted Medical Record"
                  className="max-h-60 object-contain rounded-lg"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Decrypted File</span>
              </button>
              <button
                type="button"
                onClick={() => setDecryptedResult(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                Decrypt Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
