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
  connectWallet: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {},
  setRole: () => {},
});

export const SUPPORTED_NETWORKS = {
  31337: "Hardhat / Localhost",
  1337: "Localhost",
  11155111: "Ethereum Sepolia Testnet",
  1: "Ethereum Mainnet",
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

  // Load saved role from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("ehr_user_role");
    if (savedRole) {
      setRoleState(savedRole);
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
      setError("MetaMask is not installed. Please install MetaMask to use this dApp.");
      alert("MetaMask not detected. Please install the MetaMask browser extension.");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

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
      // Chain not added to metamask
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

    // Initial silent check
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
        connectWallet,
        disconnect,
        switchNetwork,
        setRole,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
