import "./globals.css";
import { Web3Provider } from "../context/Web3Context";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";

export const metadata = {
  title: "HealthLedger | Sovereign EHR Access Control & Clinical FL",
  description: "Enterprise Patient Data Sovereignty, Client-Side AES-256-GCM Encryption, IPFS Multihash Indexing, and Granular Smart Contract Access Control.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#090D14] text-slate-900 dark:text-slate-100 selection:bg-sky-500/15 selection:text-sky-900 dark:selection:text-sky-200">
        <Web3Provider>
          {/* Navigation Bar */}
          <Navbar />

          {/* Main Application Canvas */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {children}
          </main>

          {/* Institutional Clinical Status Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Logo size={20} showText={true} />
                <span className="hidden md:inline text-slate-200 dark:text-slate-800">|</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>EHR Integrity: <strong>AES-256-GCM</strong> · <strong>IPFS CIDv0</strong> · <strong>Solidity 0.8.24</strong></span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="text-slate-700 dark:text-slate-300 font-medium">HIPAA & GDPR Article 7(3)</span>
                <span>·</span>
                <span>Sovereign Access Governance</span>
                <span>·</span>
                <span>Cross-Silo FedAvg</span>
              </div>
            </div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
