"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const Web3Context = createContext({
  account: null,
  chainId: null,
  networkName: "",
  isCorrectNetwork: true,
  provider: null,
  signer: null,
  isConnecting: false,
  role: null,
  error: null,
  isDemoMode: false,
  demoUser: null,
  connectWallet: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {},
  setRole: () => {},
  enterDemoMode: () => {},
  exitDemoMode: () => {},
});

export const SUPPORTED_NETWORKS = {
  31337: "Hardhat / Localhost",
  1337: "Localhost",
  11155111: "Ethereum Sepolia Testnet",
  1: "Ethereum Mainnet",
};

export const DEMO_PROFILES = {
  doctor: {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    name: "Dr. Sarah Chen, MD",
    roleTitle: "Chief of Clinical Cardiology",
    organization: "St. Jude Heart Institute",
    licenseNumber: "MED-90281-NY",
    department: "Cardiovascular Telemetry & Diagnostics",
  },
  patient: {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    name: "Alex Mercer",
    roleTitle: "Patient Member",
    organization: "Metro Health System",
    mrn: "MRN-9482-A",
    dob: "August 14, 1972",
    bloodType: "O-Positive",
  },
};

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState("");
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [role, setRoleState] = useState(null);
  const [error, setError] = useState(null);

  // Interactive Demo Mode State
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState(null);

  // Load saved role and demo preferences
  useEffect(() => {
    const savedRole = localStorage.getItem("ehr_user_role");
    const savedDemo = localStorage.getItem("ehr_demo_mode");
    if (savedRole) {
      setRoleState(savedRole);
    }
    if (savedDemo === "true") {
      const targetRole = savedRole || "doctor";
      setIsDemoMode(true);
      const profile = DEMO_PROFILES[targetRole] || DEMO_PROFILES.doctor;
      setAccount(profile.address);
      setDemoUser(profile);
      setNetworkName("Simulated Clinical Sandbox");
      setIsCorrectNetwork(true);
    }
  }, []);

  const setRole = (newRole) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem("ehr_user_role", newRole);
    } else {
      localStorage.removeItem("ehr_user_role");
    }
  };

  const enterDemoMode = (targetRole = "doctor") => {
    setIsDemoMode(true);
    localStorage.setItem("ehr_demo_mode", "true");
    setRole(targetRole);
    const profile = DEMO_PROFILES[targetRole] || DEMO_PROFILES.doctor;
    setAccount(profile.address);
    setDemoUser(profile);
    setNetworkName("Simulated Clinical Sandbox");
    setIsCorrectNetwork(true);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem("ehr_demo_mode");
    setDemoUser(null);
    setAccount(null);
    setNetworkName("");
  };

  const handleNetworkChange = useCallback((id) => {
    const numId = typeof id === "string" ? parseInt(id, 16) : Number(id);
    setChainId(numId);
    const name = SUPPORTED_NETWORKS[numId] || `Chain ID ${numId}`;
    setNetworkName(name);

    // Accept Sepolia (11155111) and Localhost (31337, 1337)
    const valid = numId === 11155111 || numId === 31337 || numId === 1337;
    setIsCorrectNetwork(valid);
  }, []);

  const handleAccountsChanged = useCallback(async (accounts) => {
    if (!accounts || accounts.length === 0) {
      setAccount(null);
      setSigner(null);
      setError("Please connect your MetaMask wallet.");
    } else {
      setIsDemoMode(false);
      setDemoUser(null);
      const selected = accounts[0];
      setAccount(selected);
      setError(null);
      if (window.ethereum) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const currentSigner = await browserProvider.getSigner();
        setProvider(browserProvider);
        setSigner(currentSigner);
      }
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask is not installed. You can use 'Enter Clinical Demo Mode' to explore the full platform!");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setIsDemoMode(false);
      setDemoUser(null);

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();

      setAccount(accounts[0]);
      setProvider(browserProvider);
      setSigner(currentSigner);
      handleNetworkChange(network.chainId);
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err.message || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setSigner(null);
    setRole(null);
    setIsDemoMode(false);
    setDemoUser(null);
  };

  const switchNetwork = async (targetChainId = 11155111) => {
    if (!window.ethereum) return;
    const hexChainId = "0x" + targetChainId.toString(16);

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902 && targetChainId === 11155111) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hexChainId,
                chainName: "Sepolia Test Network",
                nativeCurrency: { name: "Sepolia ETH", symbol: "SEP", decimals: 18 },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
        }
      }
    }
  };

  // Listen to MetaMask provider events
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleNetworkChange);

    const checkInitialConnection = async () => {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.listAccounts();
        if (accounts.length > 0) {
          const network = await browserProvider.getNetwork();
          const currentSigner = await browserProvider.getSigner();
          setAccount(accounts[0].address);
          setProvider(browserProvider);
          setSigner(currentSigner);
          handleNetworkChange(network.chainId);
        }
      } catch (e) {
        console.warn("Initial wallet check skipped:", e);
      }
    };

    checkInitialConnection();

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleNetworkChange);
      }
    };
  }, [handleAccountsChanged, handleNetworkChange]);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        networkName,
        isCorrectNetwork,
        provider,
        signer,
        isConnecting,
        role,
        error,
        isDemoMode,
        demoUser,
        connectWallet,
        disconnect,
        switchNetwork,
        setRole,
        enterDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
