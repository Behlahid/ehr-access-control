import { ethers } from "ethers";

// Default deployed address on local hardhat / Sepolia (update as needed when redeploying)
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
  "event RecordAdded(bytes32 indexed recordHash, address indexed patient, uint256 timestamp)",
  "event AccessGranted(bytes32 indexed recordHash, address indexed patient, address indexed doctor)",
  "event AccessRevoked(bytes32 indexed recordHash, address indexed patient, address indexed doctor)",
  "event AccessRequested(bytes32 indexed recordHash, address indexed requester, address indexed patient)",
  "event FLEligibilityChanged(bytes32 indexed recordHash, address indexed patient, bool eligible)",
  "function addRecord(bytes32 ipfsHash) external",
  "function grantAccess(bytes32 recordHash, address doctor) external",
  "function revokeAccess(bytes32 recordHash, address doctor) external",
  "function requestAccess(bytes32 recordHash) external",
  "function setFLEligibility(bytes32 recordHash, bool eligible) external",
  "function getMyRecords() external view returns (tuple(bytes32 ipfsHash, address owner, uint256 timestamp, bool flEligible)[])",
  "function hasAccess(bytes32 recordHash, address doctor) external view returns (bool)",
  "function recordOwner(bytes32) external view returns (address)",
  "function accessGranted(bytes32, address) external view returns (bool)"
];

/**
 * Returns an ethers Contract instance connected to either a Signer (for write txs) or Provider (for read-only queries)
 * @param {ethers.Signer | ethers.Provider} runner
 * @param {string} [customAddress]
 */
export function getEHRContract(runner, customAddress) {
  const address = customAddress || CONTRACT_ADDRESS;
  return new ethers.Contract(address, CONTRACT_ABI, runner);
}
