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
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-obsidian-950 text-slate-900 dark:text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-800 dark:selection:text-cyan-200">
        <Web3Provider>
          {/* Subtle ambient light accents */}
          <div className="fixed inset-0 pointer-events-none bg-dot-pattern opacity-40 z-0" />
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-gradient-to-b from-sky-500/[0.08] via-cyan-500/[0.03] to-transparent blur-3xl pointer-events-none -z-10" />

          {/* Navigation Bar */}
          <Navbar />

          {/* Main Application Canvas */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            {children}
          </main>

          {/* Enterprise Status Footer */}
          <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-obsidian-950/90 backdrop-blur-md py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Logo size={22} showText={true} />
                <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  Clinical Security: <strong className="text-slate-900 dark:text-slate-200">AES-GCM-256</strong> • <strong className="text-slate-900 dark:text-slate-200">IPFS Multihash</strong> • <strong className="text-slate-900 dark:text-slate-200">Ethereum Smart Contract</strong>
                </span>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">HIPAA & GDPR Compliant</span>
                <span>•</span>
                <span>Patient Data Sovereignty</span>
                <span>•</span>
                <span>Collaborative Clinical AI</span>
              </div>
            </div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
