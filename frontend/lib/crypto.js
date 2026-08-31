/**
 * Client-Side Cryptographic Utilities using the native Web Crypto API (AES-GCM 256-bit).
 *
 * All medical files are encrypted in the patient's browser BEFORE transmission to IPFS.
 * This guarantees zero-knowledge storage where no cloud or storage provider can inspect raw health data.
 */

/**
 * Generates a fresh AES-GCM 256-bit symmetric key.
 * @returns {Promise<CryptoKey>}
 */
export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a CryptoKey into a 64-character Hex string for easy storage and sharing.
 * @param {CryptoKey} key
 * @returns {Promise<string>}
 */
export async function exportKeyHex(key) {
  const raw = await window.crypto.subtle.exportKey("raw", key);
  const bytes = new Uint8Array(raw);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Imports a 64-character Hex string back into an AES-GCM CryptoKey.
 * @param {string} hexKey
 * @returns {Promise<CryptoKey>}
 */
export async function importKeyHex(hexKey) {
  const cleanHex = hexKey.trim().replace(/^0x/, "");
  if (cleanHex.length !== 64) {
    throw new Error("Invalid key length: AES-256 key must be exactly 64 hexadecimal characters (32 bytes).");
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return await window.crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a File or ArrayBuffer client-side with AES-GCM.
 * Prepends the 12-byte random Initialization Vector (IV) directly to the ciphertext.
 *
 * Payload format: [12 bytes IV] + [AES-GCM Ciphertext + 16 bytes Auth Tag]
 *
 * @param {File | Blob | ArrayBuffer} fileData
 * @param {CryptoKey} [existingKey]
 * @returns {Promise<{ encryptedBlob: Blob, keyHex: string, originalName: string, mimeType: string }>}
 */
export async function encryptFile(fileData, existingKey = null) {
  const key = existingKey || (await generateAESKey());
  const keyHex = await exportKeyHex(key);

  let fileBuffer;
  let originalName = "record.dat";
  let mimeType = "application/octet-stream";

  if (fileData instanceof File) {
    originalName = fileData.name;
    mimeType = fileData.type || "application/octet-stream";
    fileBuffer = await fileData.arrayBuffer();
  } else if (fileData instanceof Blob) {
    mimeType = fileData.type || "application/octet-stream";
    fileBuffer = await fileData.arrayBuffer();
  } else {
    fileBuffer = fileData;
  }

  // Generate 12-byte IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Package metadata header (JSON string) to preserve filename and MIME type upon decryption
  const headerObj = { name: originalName, type: mimeType };
  const headerJson = JSON.stringify(headerObj);
  const headerBytes = new TextEncoder().encode(headerJson);
  const headerLengthBytes = new Uint8Array(4);
  new DataView(headerLengthBytes.buffer).setUint32(0, headerBytes.length, false);

  // Combine header length + header + fileBuffer
  const payloadToEncrypt = new Uint8Array(4 + headerBytes.length + fileBuffer.byteLength);
  payloadToEncrypt.set(headerLengthBytes, 0);
  payloadToEncrypt.set(headerBytes, 4);
  payloadToEncrypt.set(new Uint8Array(fileBuffer), 4 + headerBytes.length);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    payloadToEncrypt
  );

  // Combine IV (12 bytes) + Encrypted Buffer
  const finalEncryptedBytes = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  finalEncryptedBytes.set(iv, 0);
  finalEncryptedBytes.set(new Uint8Array(encryptedBuffer), iv.length);

  const encryptedBlob = new Blob([finalEncryptedBytes], { type: "application/octet-stream" });

  return {
    encryptedBlob,
    keyHex,
    originalName,
    mimeType,
  };
}

/**
 * Decrypts an encrypted ArrayBuffer or Blob using the provided Hex key.
 *
 * @param {ArrayBuffer | Uint8Array} encryptedData
 * @param {string} keyHex
 * @returns {Promise<{ decryptedBuffer: ArrayBuffer, fileName: string, mimeType: string, url: string }>}
 */
export async function decryptFile(encryptedData, keyHex) {
  const key = await importKeyHex(keyHex);

  const bytes = encryptedData instanceof Uint8Array ? encryptedData : new Uint8Array(encryptedData);
  if (bytes.length < 28) {
    throw new Error("Encrypted payload is corrupted or too short (minimum 28 bytes required).");
  }

  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);

  let decryptedBuffer;
  try {
    decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );
  } catch (err) {
    throw new Error("Decryption failed. The provided AES key is incorrect or the ciphertext was altered.");
  }

  // Parse header
  const dataView = new DataView(decryptedBuffer);
  let fileName = "decrypted_record";
  let mimeType = "application/octet-stream";
  let fileDataBuffer = decryptedBuffer;

  try {
    const headerLength = dataView.getUint32(0, false);
    if (headerLength > 0 && headerLength < decryptedBuffer.byteLength - 4) {
      const headerBytes = new Uint8Array(decryptedBuffer, 4, headerLength);
      const headerJson = new TextDecoder().decode(headerBytes);
      const header = JSON.parse(headerJson);
      if (header.name) fileName = header.name;
      if (header.type) mimeType = header.type;
      fileDataBuffer = decryptedBuffer.slice(4 + headerLength);
    }
  } catch (e) {
    // If not matching structured header, fallback to raw decrypted content
    console.warn("Raw decrypted payload without metadata header");
  }

  const blob = new Blob([fileDataBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);

  return {
    decryptedBuffer: fileDataBuffer,
    fileName,
    mimeType,
    url,
  };
}
