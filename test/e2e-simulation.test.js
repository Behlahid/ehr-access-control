const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

// 1. Re-implement the exact Base58 and CID conversion functions from lib/utils.js
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function bs58Encode(bytes) {
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
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    str += ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += ALPHABET[digits[i]];
  }
  return str;
}

function bs58Decode(str) {
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

function cidToBytes32(cid) {
  const decoded = bs58Decode(cid);
  if (decoded.length === 34 && decoded[0] === 0x12 && decoded[1] === 0x20) {
    const digest = decoded.slice(2);
    return "0x" + Array.from(digest).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  throw new Error("Invalid CIDv0 format");
}

function bytes32ToCid(bytes32Hex) {
  const cleanHex = bytes32Hex.replace(/^0x/, "");
  const digest = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    digest[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  const multihash = new Uint8Array(34);
  multihash[0] = 0x12;
  multihash[1] = 0x20;
  multihash.set(digest, 2);
  return bs58Encode(multihash);
}

// 2. Re-implement exact Web Crypto AES-GCM-256 encryption/decryption from lib/crypto.js
async function encryptPayload(plainBuffer, filename, mimeType) {
  const subtle = crypto.webcrypto.subtle;
  const key = await subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const rawKey = await subtle.exportKey("raw", key);
  const keyHex = Array.from(new Uint8Array(rawKey)).map(b => b.toString(16).padStart(2, "0")).join("");

  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Metadata header
  const headerObj = { name: filename, type: mimeType };
  const headerJson = JSON.stringify(headerObj);
  const headerBytes = new TextEncoder().encode(headerJson);
  const headerLengthBytes = new Uint8Array(4);
  new DataView(headerLengthBytes.buffer).setUint32(0, headerBytes.length, false);

  const payloadToEncrypt = new Uint8Array(4 + headerBytes.length + plainBuffer.byteLength);
  payloadToEncrypt.set(headerLengthBytes, 0);
  payloadToEncrypt.set(headerBytes, 4);
  payloadToEncrypt.set(new Uint8Array(plainBuffer), 4 + headerBytes.length);

  const encryptedCiphertext = await subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    payloadToEncrypt
  );

  const finalBlobBytes = new Uint8Array(iv.length + encryptedCiphertext.byteLength);
  finalBlobBytes.set(iv, 0);
  finalBlobBytes.set(new Uint8Array(encryptedCiphertext), iv.length);

  return { finalBlobBytes, keyHex };
}

async function decryptPayload(encryptedBytes, keyHex) {
  const subtle = crypto.webcrypto.subtle;
  const cleanHex = keyHex.trim().replace(/^0x/, "");
  const keyBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    keyBytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }

  const key = await subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);

  const decryptedBuffer = await subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );

  const dataView = new DataView(decryptedBuffer);
  const headerLength = dataView.getUint32(0, false);
  const headerBytes = new Uint8Array(decryptedBuffer, 4, headerLength);
  const headerJson = new TextDecoder().decode(headerBytes);
  const header = JSON.parse(headerJson);
  const fileData = decryptedBuffer.slice(4 + headerLength);

  return { fileData, header };
}

// 3. Compute CIDv0 Multihash (SHA-256)
async function computeCidV0(buffer) {
  const hashBuffer = await crypto.webcrypto.subtle.digest("SHA-256", buffer);
  const hashBytes = new Uint8Array(hashBuffer);
  const multihash = new Uint8Array(34);
  multihash[0] = 0x12;
  multihash[1] = 0x20;
  multihash.set(hashBytes, 2);
  return bs58Encode(multihash);
}

describe("E2E Simulation: Patient -> IPFS Encrypt -> Contract -> Doctor Decrypt", function () {
  it("Should complete the entire zero-knowledge EHR workflow with byte-for-byte validation", async function () {
    console.log("\n=======================================================");
    console.log("🚀 STARTING E2E HANDS-ON WORKFLOW SIMULATION");
    console.log("=======================================================");

    const [deployer, patient, doctor, unauthorizedUser] = await ethers.getSigners();

    // 1. Deploy Contract
    const EHRAccessControl = await ethers.getContractFactory("EHRAccessControl");
    const ehrContract = await EHRAccessControl.deploy();
    await ehrContract.waitForDeployment();
    const contractAddress = await ehrContract.getAddress();
    console.log(`[1] EHRAccessControl deployed at: ${contractAddress}`);

    // 2. Patient creates a sample medical report
    const originalContent = "PATIENT MEDICAL RECORD\nName: John Doe\nDiagnosis: Hypertension Stage 1\nPrescription: Lisinopril 10mg daily\nLab Results: Normal ECG, BP 138/88";
    const originalBuffer = Buffer.from(originalContent, "utf-8");
    console.log(`[2] Created sample EHR plaintext (${originalBuffer.length} bytes)`);

    // 3. Patient encrypts client-side using Web Crypto AES-GCM-256
    const { finalBlobBytes, keyHex } = await encryptPayload(originalBuffer, "ehr_report_john_doe.pdf", "application/pdf");
    console.log(`[3] Encrypted client-side:`);
    console.log(`    - AES-256 Key (Hex) : ${keyHex}`);
    console.log(`    - Ciphertext Size   : ${finalBlobBytes.length} bytes (IV + Ciphertext + Auth Tag)`);

    // 4. IPFS CIDv0 computation
    const originalCid = await computeCidV0(finalBlobBytes);
    console.log(`[4] IPFS CIDv0 Multihash: ${originalCid}`);
    expect(originalCid).to.match(/^Qm[1-9A-HJ-NP-za-km-z]{44}$/);

    // 5. Convert CIDv0 to bytes32 for Solidity
    const recordBytes32 = cidToBytes32(originalCid);
    console.log(`[5] Solidity bytes32 Hash: ${recordBytes32}`);

    // 6. Test round-trip CID reconstruction
    const reconstructedCid = bytes32ToCid(recordBytes32);
    console.log(`[6] Reconstructed CID from bytes32: ${reconstructedCid}`);
    expect(reconstructedCid).to.equal(originalCid);
    console.log("    ✓ CID <-> bytes32 round-trip verified perfectly!");

    // 7. Patient registers record on-chain
    const addTx = await ehrContract.connect(patient).addRecord(recordBytes32);
    await addTx.wait();
    console.log(`[7] Patient registered record on-chain. Tx: ${addTx.hash}`);

    // Verify ownership
    expect(await ehrContract.recordOwner(recordBytes32)).to.equal(patient.address);
    expect(await ehrContract.hasAccess(recordBytes32, patient.address)).to.equal(true);

    // 8. Doctor checks access BEFORE grant
    let hasAccessBefore = await ehrContract.hasAccess(recordBytes32, doctor.address);
    console.log(`[8] Doctor access check before grant: ${hasAccessBefore}`);
    expect(hasAccessBefore).to.equal(false);

    // 9. Doctor requests access on-chain
    const reqTx = await ehrContract.connect(doctor).requestAccess(recordBytes32);
    await expect(reqTx)
      .to.emit(ehrContract, "AccessRequested")
      .withArgs(recordBytes32, doctor.address, patient.address);
    console.log(`[9] Doctor broadcasted AccessRequested event.`);

    // 10. Patient grants access to Doctor
    const grantTx = await ehrContract.connect(patient).grantAccess(recordBytes32, doctor.address);
    await grantTx.wait();
    console.log(`[10] Patient granted access to doctor. Tx: ${grantTx.hash}`);

    // 11. Doctor checks access AFTER grant
    let hasAccessAfter = await ehrContract.hasAccess(recordBytes32, doctor.address);
    console.log(`[11] Doctor access check after grant: ${hasAccessAfter}`);
    expect(hasAccessAfter).to.equal(true);

    // 12. Unauthorized user check
    let unauthorizedAccess = await ehrContract.hasAccess(recordBytes32, unauthorizedUser.address);
    expect(unauthorizedAccess).to.equal(false);

    // 13. Doctor fetches from IPFS (simulated by using encrypted blob with CID) and decrypts
    console.log(`[12] Doctor fetching CID ${reconstructedCid} and decrypting with AES key...`);
    const { fileData, header } = await decryptPayload(finalBlobBytes, keyHex);
    const decryptedText = Buffer.from(fileData).toString("utf-8");

    console.log(`[13] Decryption Output:`);
    console.log(`    - File Name : ${header.name}`);
    console.log(`    - MIME Type : ${header.type}`);
    console.log(`    - Plaintext :\n"${decryptedText}"`);

    // 14. Byte-for-byte exact equality assertion
    expect(decryptedText).to.equal(originalContent);
    expect(header.name).to.equal("ehr_report_john_doe.pdf");
    expect(header.type).to.equal("application/pdf");
    console.log("\n✅ E2E VERIFICATION SUCCEEDED: 100% BYTE-FOR-BYTE FIDELITY");
    console.log("=======================================================\n");
  });
});
