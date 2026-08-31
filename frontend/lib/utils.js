// Base58 Alphabet used by IPFS / Bitcoin
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE = BigInt(58);

/**
 * Encodes a Uint8Array into a Base58 string (used for IPFS CIDv0).
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function bs58Encode(bytes) {
  if (bytes.length === 0) return "";
  let digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let str = "";
  // Deal with leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    str += ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += ALPHABET[digits[i]];
  }
  return str;
}

/**
 * Decodes a Base58 string back into a Uint8Array.
 * @param {string} str
 * @returns {Uint8Array}
 */
export function bs58Decode(str) {
  if (str.length === 0) return new Uint8Array(0);
  let bytes = [0];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const value = ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid Base58 character: ${char}`);
    }
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  let leadingZeros = 0;
  for (let i = 0; i < str.length && str[i] === ALPHABET[0]; i++) {
    leadingZeros++;
  }
  const result = new Uint8Array(leadingZeros + bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[result.length - 1 - i] = bytes[i];
  }
  return result;
}

/**
 * Converts an IPFS CIDv0 string (e.g., Qm...) into a 32-byte hex string (bytes32 for Solidity).
 * @param {string} cid IPFS CIDv0 starting with 'Qm'
 * @returns {string} 0x-prefixed 64-character hex string (32 bytes)
 */
export function cidToBytes32(cid) {
  if (!cid) return "0x0000000000000000000000000000000000000000000000000000000000000000";
  
  // If it's already a 0x hex string of length 66, return directly
  if (cid.startsWith("0x") && cid.length === 66) {
    return cid;
  }

  try {
    const decoded = bs58Decode(cid);
    // CIDv0 format: [0x12 (Sha256), 0x20 (32 bytes length), ...32 bytes digest]
    if (decoded.length === 34 && decoded[0] === 0x12 && decoded[1] === 0x20) {
      const digest = decoded.slice(2);
      return "0x" + Array.from(digest).map(b => b.toString(16).padStart(2, "0")).join("");
    } else {
      // Fallback: if not standard CIDv0, take last 32 bytes or pad
      const hashBytes = decoded.slice(-32);
      return "0x" + Array.from(hashBytes).map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (err) {
    console.error("CID to bytes32 conversion error:", err);
    throw new Error(`Unable to convert CID to bytes32: ${err.message}`);
  }
}

/**
 * Converts a 32-byte hex string back into an IPFS CIDv0 Base58 multihash string (Qm...).
 * @param {string} bytes32Hex 0x-prefixed 64-char hex string
 * @returns {string} Base58 encoded CIDv0 string
 */
export function bytes32ToCid(bytes32Hex) {
  if (!bytes32Hex || bytes32Hex === "0x" || bytes32Hex === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return "";
  }
  const cleanHex = bytes32Hex.replace(/^0x/, "");
  if (cleanHex.length !== 64) {
    return bytes32Hex;
  }
  const digest = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    digest[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  // Prepend multihash header: 0x12 (sha2-256) + 0x20 (32 bytes length)
  const multihash = new Uint8Array(34);
  multihash[0] = 0x12;
  multihash[1] = 0x20;
  multihash.set(digest, 2);

  return bs58Encode(multihash);
}

/**
 * Formats an Ethereum address for display (0x1234...5678).
 */
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Formats a 32-byte hash for display.
 */
export function shortenHash(hash) {
  if (!hash) return "";
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
}

/**
 * Formats a unix epoch timestamp into a readable date string.
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return "Unknown";
  const num = typeof timestamp === "bigint" ? Number(timestamp) : Number(timestamp);
  const date = new Date(num * 1000);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Parses user-friendly error messages from contract reverts.
 */
export function parseContractError(error) {
  if (!error) return "An unknown error occurred.";
  if (typeof error === "string") return error;

  // Check for require revert reason
  if (error.reason) return error.reason;
  if (error.shortMessage) return error.shortMessage;
  if (error.data && typeof error.data === "string") return error.data;
  if (error.message) {
    if (error.message.includes("user rejected action") || error.message.includes("User rejected")) {
      return "Transaction was cancelled in MetaMask.";
    }
    const match = error.message.match(/reverted with reason string '([^']+)'/);
    if (match && match[1]) return match[1];
    return error.message;
  }
  return "Transaction failed. Please check parameters and try again.";
}
