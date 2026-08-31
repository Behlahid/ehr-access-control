import "./globals.css";
import { Web3Provider } from "../context/Web3Context";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "HealthLedger | Decentralized EHR Access Control",
  description: "Patient Data Sovereignty, Off-Chain IPFS Encryption, and Federated Learning Consent via Ethereum Smart Contracts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Web3Provider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
            HealthLedger • Final Year Engineering Project • Solidity 0.8.24 + Web Crypto AES-256 + IPFS
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}
