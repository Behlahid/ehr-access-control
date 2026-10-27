"use client";

import { bytes32ToCid, cidToBytes32, shortenAddress, shortenHash } from "./utils";

// -------------------------------------------------------------
// Authoritative Clinical Demo Profiles
// -------------------------------------------------------------
export const DEMO_PROFILES = {
  patient: {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    name: "Alex Mercer",
    mrn: "MRN-84920-A",
    roleTitle: "Patient Member & Sovereign Keyholder",
    organization: "Metro Health Comprehensive System",
    dob: "Oct 14, 1982 (42y)",
    gender: "Male",
    bloodType: "O+ Rh(D) Pos",
    allergies: ["Penicillin G (Severe Anaphylaxis)", "Sulfa Drugs (Mild Rash)"],
    vitals: {
      bp: "118/78 mmHg",
      hr: "72 bpm",
      glucose: "92 mg/dL",
      spo2: "99% SpO2",
      temperature: "98.6 °F",
      bmi: "23.4 kg/m²",
    },
  },
  doctor: {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    name: "Dr. Sarah Chen, MD, FACC",
    roleTitle: "Chief of Interventional Cardiology",
    organization: "St. Jude Heart Institute",
    licenseNumber: "MED-90281-NY",
    department: "Cardiovascular Telemetry & Diagnostics",
    attestationLevel: "Level-3 Clinical Enclave Credentialed",
  },
  consultingDoctor: {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    name: "Dr. Marcus Vance, MD, FAAFP",
    roleTitle: "Primary Attending Physician",
    organization: "Metro Health Comprehensive Center",
    licenseNumber: "MED-84910-NY",
    department: "Internal Medicine & Metabolic Health",
    attestationLevel: "Level-2 Verified Physician",
  },
  traumaDoctor: {
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    name: "Dr. Elena Rostova, MD, FACEP",
    roleTitle: "Director of Emergency Trauma & Resuscitation",
    organization: "Mount Sinai Emergency Pavilion",
    licenseNumber: "MED-77192-NY",
    department: "Level-1 Trauma Center",
    attestationLevel: "Trauma Break-Glass Accredited",
  },
};

// -------------------------------------------------------------
// Pristine Initial Clinical Records
// -------------------------------------------------------------
export const INITIAL_DEMO_RECORDS = [
  {
    ipfsHash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    owner: DEMO_PROFILES.patient.address,
    timestamp: 1729814400, // Oct 24, 2026
    flEligible: true,
    title: "Comprehensive Cardiac Angiography & Stress Study",
    category: "Cardiology",
    hospital: "St. Jude Heart Institute",
    key: "e4d29a73f810bcde8932470129aefb6083210495810294810293810294810293",
    loinc: "LOINC 80061-1",
    payloadPreview: `[CLINICAL OBSERVATION REPORT]\nPatient: Alex Mercer (MRN-84920-A)\nPhysician: Dr. Sarah Chen, MD, FACC (Cardiology)\nRecord Hash: 0x82a938f9...1029\nIPFS CID: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco\n\nDIAGNOSTIC FINDINGS:\n- Resting Sinus Rhythm: 72 bpm, QTc 410ms.\n- Left Ventricular Ejection Fraction (LVEF): 62% (Reference: 55-70%).\n- Stress Echocardiography: No regional wall motion abnormalities detected.\n- Serum High-Sensitivity Troponin I: < 0.01 ng/mL (Reference: < 0.04 ng/mL).\n- Coronary Artery Calcium (CAC) Score: 0 (Zero plaque burden).\n\nASSESSMENT & RECOMMENDATION:\nNormal cardiovascular diagnostic assessment. Normal vascular compliance.\nElectronically signed & verified via HealthLedger Zero-Knowledge Cryptographic Cipher.`,
  },
  {
    ipfsHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    cid: "QmZtmD2qt8fJpq3CLDHtaGAs6564RGTLoBzA4gkWWUXoxQ",
    owner: DEMO_PROFILES.patient.address,
    timestamp: 1729036800, // Oct 15, 2026
    flEligible: false,
    title: "Complete Lipid, Glucose & Metabolic Diagnostic Panel",
    category: "Biochemistry",
    hospital: "Clinical Pathology Core Lab",
    key: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
    loinc: "LOINC 2093-3",
    payloadPreview: `[BIOCHEMISTRY METABOLIC PANEL]\nPatient: Alex Mercer (MRN-84920-A)\nOrdering Physician: Dr. Marcus Vance, MD (Primary Care)\nSpecimen: Fasting Venous Plasma (12-hour fast)\n\nLABORATORY METRICS:\n- Total Serum Cholesterol: 185 mg/dL (Optimal < 200)\n- High-Density Lipoprotein (HDL): 54 mg/dL (Normal > 40)\n- Low-Density Lipoprotein (LDL): 107 mg/dL (Target < 100)\n- Triglycerides: 120 mg/dL (Optimal < 150)\n- Fasting Blood Glucose: 92 mg/dL (Euglycemic: 70-99)\n- Hemoglobin A1c: 5.3% (Normal < 5.7%)\n- Serum Creatinine: 0.95 mg/dL (eGFR > 90 mL/min/1.73m²)\n\nINTERPRETATION: Euglycemic metabolic profile. Continue standard Mediterranean dietary pattern.`,
  },
  {
    ipfsHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
    cid: "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LXZvTrGCas",
    owner: DEMO_PROFILES.patient.address,
    timestamp: 1728259200, // Oct 06, 2026
    flEligible: true,
    title: "24-Hour Ambulatory Holter ECG Rhythm Analysis",
    category: "Cardiovascular Telemetry",
    hospital: "St. Jude Heart Center",
    key: "f9e8d7c6b5a43210fedcba9876543210fedcba9876543210fedcba9876543210",
    loinc: "LOINC 8867-4",
    payloadPreview: `[CONTINUOUS 24-HOUR AMBULATORY ECG TELEMETRY]\nPatient: Alex Mercer (MRN-84920-A)\nReviewing Cardiologist: Dr. Sarah Chen, MD, FACC\nMonitoring Duration: 24h 02m | Total QRS Complexes: 103,412\n\nFINDINGS:\n- Predominant Rhythm: Normal Sinus Rhythm (NSR)\n- Mean Heart Rate: 72 bpm (Min: 54 bpm during nocturnal sleep; Max: 124 bpm during physical exertion)\n- Ventricular Ectopy: < 0.01% (Isolated single PVCs, no couplets or ventricular tachycardia)\n- Supraventricular Ectopy: Rare PACs\n- ST-Segment Shifts: No ischemic ST depressions or elevations recorded.\n\nCONCLUSION: Normal sinus rhythm with physiologically appropriate chronotropic response. No syncope correlated arrhythmia.`,
  },
];

// -------------------------------------------------------------
// Initial Care Team & Granular Permission Matrix
// -------------------------------------------------------------
export const INITIAL_DEMO_PERMISSIONS = {
  // Dr. Sarah Chen has permission for Cardiac Angiography & Holter ECG
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": {
    "0x82a938f9210c8129841802938120381029381029381029381029381029381029": {
      hasAccess: true,
      grantedAt: 1729728000,
      expiryTimestamp: 1732320000, // 30 days
      durationLabel: "30-Day Hospital Consultation",
      isEmergency: false,
    },
    "0x2222222222222222222222222222222222222222222222222222222222222222": {
      hasAccess: true,
      grantedAt: 1729728000,
      expiryTimestamp: 1732320000,
      durationLabel: "30-Day Hospital Consultation",
      isEmergency: false,
    },
  },
  // Dr. Marcus Vance has perpetual access for Primary Metabolic Panel
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906": {
    "0x1111111111111111111111111111111111111111111111111111111111111111": {
      hasAccess: true,
      grantedAt: 1726099200,
      expiryTimestamp: 0, // Indefinite
      durationLabel: "Continuous Primary Care Agreement",
      isEmergency: false,
    },
  },
};

// -------------------------------------------------------------
// Initial Audit Logs (Authoritative EIP-712 / Solidity Events)
// -------------------------------------------------------------
export const INITIAL_DEMO_AUDIT_LOGS = [
  {
    id: "log-1",
    type: "AccessGranted",
    title: "Physician Consultation Authorized",
    recordHash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    patient: DEMO_PROFILES.patient.address,
    doctor: DEMO_PROFILES.doctor.address,
    timestamp: Date.now() - 3600000 * 4,
    blockNumber: 6819420,
    transactionHash: "0x49f2b801a91e8401928301928301928301928301928301928301928301928301",
    details: "Granted 30-day read permission for Cardiac Angiography study to Dr. Sarah Chen, MD (St. Jude Heart Institute)",
  },
  {
    id: "log-2",
    type: "FLEligibilityChanged",
    title: "FL AI Research Consent Active",
    recordHash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    patient: DEMO_PROFILES.patient.address,
    eligible: true,
    timestamp: Date.now() - 3600000 * 12,
    blockNumber: 6819385,
    transactionHash: "0x12a93801a91e8401928301928301928301928301928301928301928301928302",
    details: "Federated Learning privacy consent toggled to ACTIVE for Cardiovascular Research Enclave",
  },
  {
    id: "log-3",
    type: "RecordAdded",
    title: "Health Record Anchored to Blockchain",
    recordHash: "0x82a938f9210c8129841802938120381029381029381029381029381029381029",
    patient: DEMO_PROFILES.patient.address,
    timestamp: Date.now() - 3600000 * 24,
    blockNumber: 6819210,
    transactionHash: "0x7b29a1f10928301928301928301928301928301928301928301928301928303",
    details: "Anchored AES-GCM-256 encrypted multihash to Ethereum smart contract with slot-packing storage optimization",
  },
];

// -------------------------------------------------------------
// Engine LocalStorage Helper Functions
// -------------------------------------------------------------
function isBrowser() {
  return typeof window !== "undefined";
}

function notifyDemoChange(channel, payload = {}) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(`ehr:${channel}`, { detail: payload }));
}

// 1. Records Management
export function getDemoRecords() {
  if (!isBrowser()) return INITIAL_DEMO_RECORDS;
  try {
    const raw = localStorage.getItem("ehr_demo_records");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to load demo records from cache:", e);
  }
  return INITIAL_DEMO_RECORDS;
}

export function saveDemoRecords(records) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem("ehr_demo_records", JSON.stringify(records));
  } catch (e) {}
  notifyDemoChange("records-changed", { records });
}

export function addDemoRecord(newRecord, rawKey = null) {
  const records = getDemoRecords();
  const updated = [newRecord, ...records];
  saveDemoRecords(updated);

  // Store record key if provided
  if (rawKey && newRecord.ipfsHash) {
    saveDemoKey(newRecord.ipfsHash, rawKey);
  }

  // Audit event
  addDemoAuditLog({
    type: "RecordAdded",
    title: "Record Anchored to Ledger",
    recordHash: newRecord.ipfsHash,
    patient: newRecord.owner || DEMO_PROFILES.patient.address,
    details: `Encrypted client-side with AES-256 and anchored multihash ${shortenHash(newRecord.ipfsHash)} to Sepolia.`,
  });

  return updated;
}

export function toggleDemoFL(recordHash, nextStatus) {
  const records = getDemoRecords();
  const updated = records.map((r) =>
    r.ipfsHash.toLowerCase() === recordHash.toLowerCase()
      ? { ...r, flEligible: nextStatus }
      : r
  );
  saveDemoRecords(updated);

  addDemoAuditLog({
    type: "FLEligibilityChanged",
    title: nextStatus ? "AI Research Consent Granted" : "AI Research Consent Paused",
    recordHash: recordHash,
    patient: DEMO_PROFILES.patient.address,
    eligible: nextStatus,
    details: `Federated learning consent toggled to ${nextStatus ? "ACTIVE" : "EXCLUDED"} for record ${shortenHash(recordHash)}.`,
  });

  return updated;
}

// 2. Encryption Key Vault (Simulated Patient Enclave Storage)
export function getDemoKeys() {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem("ehr_demo_keys");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  // Default keys for initial records
  const initialMap = {};
  INITIAL_DEMO_RECORDS.forEach((r) => {
    if (r.key) initialMap[r.ipfsHash.toLowerCase()] = r.key;
  });
  return initialMap;
}

export function saveDemoKey(recordHash, key) {
  if (!isBrowser()) return;
  const keys = getDemoKeys();
  keys[recordHash.toLowerCase()] = key;
  try {
    localStorage.setItem("ehr_demo_keys", JSON.stringify(keys));
  } catch (e) {}
}

export function getDemoRecordKey(recordHash) {
  if (!recordHash) return null;
  const keys = getDemoKeys();
  return keys[recordHash.toLowerCase()] || null;
}

// 3. Granular Access Permissions Management
export function getDemoPermissions() {
  if (!isBrowser()) return INITIAL_DEMO_PERMISSIONS;
  try {
    const raw = localStorage.getItem("ehr_demo_permissions");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch (e) {}
  return INITIAL_DEMO_PERMISSIONS;
}

export function saveDemoPermissions(perms) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem("ehr_demo_permissions", JSON.stringify(perms));
  } catch (e) {}
  notifyDemoChange("permissions-changed", { permissions: perms });
}

export function checkDemoAccess(recordHash, doctorAddress) {
  if (!recordHash || !doctorAddress) return { hasAccess: false, isEmergency: false };
  const perms = getDemoPermissions();
  const docLower = doctorAddress.toLowerCase();
  const hashLower = recordHash.toLowerCase();

  const docPerms = perms[docLower] || perms[doctorAddress];
  if (!docPerms) return { hasAccess: false, isEmergency: false };

  const recPerm = docPerms[hashLower] || docPerms[recordHash];
  if (!recPerm) return { hasAccess: false, isEmergency: false };

  // Check expiration if expiryTimestamp is set
  if (recPerm.expiryTimestamp && recPerm.expiryTimestamp > 0) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec > recPerm.expiryTimestamp) {
      return { hasAccess: false, isExpired: true, isEmergency: recPerm.isEmergency };
    }
  }

  return {
    hasAccess: Boolean(recPerm.hasAccess),
    isEmergency: Boolean(recPerm.isEmergency),
    expiryTimestamp: recPerm.expiryTimestamp,
    durationLabel: recPerm.durationLabel,
  };
}

export function grantDemoAccess(recordHash, doctorAddress, durationSeconds = 0, durationLabel = "Indefinite") {
  const perms = getDemoPermissions();
  const docLower = doctorAddress.toLowerCase();
  const hashLower = recordHash.toLowerCase();

  if (!perms[docLower]) perms[docLower] = {};

  const nowSec = Math.floor(Date.now() / 1000);
  const expiryTimestamp = durationSeconds > 0 ? nowSec + durationSeconds : 0;

  perms[docLower][hashLower] = {
    hasAccess: true,
    grantedAt: nowSec,
    expiryTimestamp,
    durationLabel,
    isEmergency: false,
  };

  saveDemoPermissions(perms);

  addDemoAuditLog({
    type: "AccessGranted",
    title: "Doctor Access Authorized",
    recordHash,
    patient: DEMO_PROFILES.patient.address,
    doctor: doctorAddress,
    details: `Granted ${durationLabel.toLowerCase()} viewing permissions for record ${shortenHash(recordHash)} to Dr. (${shortenAddress(doctorAddress)}).`,
  });

  return perms;
}

export function revokeDemoAccess(recordHash, doctorAddress) {
  const perms = getDemoPermissions();
  const docLower = doctorAddress.toLowerCase();
  const hashLower = recordHash.toLowerCase();

  if (perms[docLower] && perms[docLower][hashLower]) {
    perms[docLower][hashLower] = {
      hasAccess: false,
      revokedAt: Math.floor(Date.now() / 1000),
      isEmergency: false,
    };
    saveDemoPermissions(perms);
  }

  addDemoAuditLog({
    type: "AccessRevoked",
    title: "Doctor Access Revoked",
    recordHash,
    patient: DEMO_PROFILES.patient.address,
    doctor: doctorAddress,
    details: `Revoked access rights for physician (${shortenAddress(doctorAddress)}) on Ethereum smart contract.`,
  });

  return perms;
}

export function recordDemoBreakGlass(recordHash, doctorAddress, justification) {
  const perms = getDemoPermissions();
  const docLower = doctorAddress.toLowerCase();
  const hashLower = recordHash.toLowerCase();

  if (!perms[docLower]) perms[docLower] = {};

  const nowSec = Math.floor(Date.now() / 1000);
  const expiry24h = nowSec + 86400; // 24 hour emergency window

  perms[docLower][hashLower] = {
    hasAccess: true,
    grantedAt: nowSec,
    expiryTimestamp: expiry24h,
    durationLabel: "24-Hour Trauma Break-Glass",
    isEmergency: true,
    justification,
  };

  saveDemoPermissions(perms);

  addDemoAuditLog({
    type: "EmergencyBreakGlass",
    title: "Emergency Break-Glass Override Enacted",
    recordHash,
    doctor: doctorAddress,
    patient: DEMO_PROFILES.patient.address,
    justification,
    details: `Forensic trauma override executed by Dr. (${shortenAddress(doctorAddress)}). Justification: "${justification}".`,
  });

  return perms;
}

// 4. Live Audit Logs Management
export function getDemoAuditLogs() {
  if (!isBrowser()) return INITIAL_DEMO_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem("ehr_demo_audit_logs");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_DEMO_AUDIT_LOGS;
}

export function addDemoAuditLog(entry) {
  const logs = getDemoAuditLogs();
  const mockTx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    blockNumber: 6819400 + logs.length + 1,
    transactionHash: entry.transactionHash || mockTx,
    ...entry,
  };
  const updated = [newLog, ...logs];
  try {
    localStorage.setItem("ehr_demo_audit_logs", JSON.stringify(updated));
  } catch (e) {}
  notifyDemoChange("audit-changed", { log: newLog, logs: updated });
  return updated;
}

// 5. Complete Sandbox Reset
export function resetDemoSandbox() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem("ehr_demo_records");
    localStorage.removeItem("ehr_demo_permissions");
    localStorage.removeItem("ehr_demo_audit_logs");
    localStorage.removeItem("ehr_demo_keys");
  } catch (e) {}
  notifyDemoChange("reset", {});
  notifyDemoChange("records-changed", { records: INITIAL_DEMO_RECORDS });
  notifyDemoChange("permissions-changed", { permissions: INITIAL_DEMO_PERMISSIONS });
  notifyDemoChange("audit-changed", { logs: INITIAL_DEMO_AUDIT_LOGS });
}
