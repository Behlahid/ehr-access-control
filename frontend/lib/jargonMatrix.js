/**
 * Jargon Translation Matrix (Patient Plain-Language Healthtech Dictionary)
 *
 * Maps intimidating Web3, cryptographic, and machine learning jargon into
 * empathetic, human-first clinical definitions and safety guarantees.
 */

export const JARGON_TRANSLATION_MATRIX = [
  {
    id: "bytes32-hash",
    technicalTerm: "bytes32 Multihash / Digest",
    plainTerm: "Tamper-Proof Digital Fingerprint",
    category: "Blockchain & Integrity",
    badge: "Security",
    badgeColor: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30",
    plainMeaning:
      "A unique mathematical seal created from your medical record. If even a single character in your lab report is modified, the seal breaks instantly.",
    whyItProtectsYou:
      "Guarantees that no insurance company, hacker, or database administrator can tamper with or falsify your diagnostic history without detection.",
    analogy: "Like a wax seal on a royal envelope—if the wax is broken or altered, you know it was tampered with.",
  },
  {
    id: "ipfs-cid",
    technicalTerm: "IPFS CIDv0 (Content Identifier)",
    plainTerm: "Encrypted Cloud Vault Address",
    category: "Storage",
    badge: "Privacy",
    badgeColor: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
    plainMeaning:
      "The decentralized storage address pointing to your encrypted health file across independent global nodes.",
    whyItProtectsYou:
      "Storage providers only hold randomized, encrypted bytes. They have 0% visibility into your actual diagnostic images or clinical diagnoses.",
    analogy: "Like renting a safety deposit box where the bank manager does not possess a duplicate key.",
  },
  {
    id: "aes-256",
    technicalTerm: "Client-Side AES-GCM-256 Cipher",
    plainTerm: "Patient Device Encryption",
    category: "Cryptography",
    badge: "Zero-Knowledge",
    badgeColor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    plainMeaning:
      "Military-grade encryption executed directly inside your web browser using Web Crypto API before the file leaves your computer.",
    whyItProtectsYou:
      "Your plaintext medical records are never sent over the internet unencrypted. Only someone holding your unique session key can decrypt it.",
    analogy: "Like locking your diary with a personal padlock before putting it in the mailbox.",
  },
  {
    id: "fl-eligible",
    technicalTerm: "flEligible Boolean Consent Flag",
    plainTerm: "Anonymous AI Research Contribution",
    category: "Artificial Intelligence",
    badge: "Consent",
    badgeColor: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
    plainMeaning:
      "An on-chain switch that gives you sovereign control over whether hospital AI models can learn from your medical patterns.",
    whyItProtectsYou:
      "Raw medical records never leave your hospital node. If you turn this switch OFF, training pipelines automatically exclude your data within seconds.",
    analogy: "Like voting on research participation per hospital round, with instant revocation rights.",
  },
  {
    id: "grant-access",
    technicalTerm: "grantAccess(bytes32, address)",
    plainTerm: "Doctor Consultation Authorization",
    category: "Access Control",
    badge: "Governance",
    badgeColor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    plainMeaning:
      "An official permission slip on Ethereum granting a licensed physician the right to decrypt and review your lab panel.",
    whyItProtectsYou:
      "Eliminates unapproved institutional snooping. Doctors must possess an explicit active grant to open your diagnostic results.",
    analogy: "Like handing a doctor a digital visitor pass that automatically controls which doors they can open.",
  },
  {
    id: "time-expiry",
    technicalTerm: "grantAccessWithExpiry(duration)",
    plainTerm: "Time-Bound Consultation Pass",
    category: "Access Control",
    badge: "Ephemeral",
    badgeColor: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    plainMeaning:
      "Temporary access that automatically expires after a set clinical duration (e.g., 24 hours, 7 days, or 30 days).",
    whyItProtectsYou:
      "Prevents forgotten permanent access. When your specialist consultation concludes, the doctor's access expires without requiring manual action.",
    analogy: "Like a hotel room key card that automatically stops working at checkout time.",
  },
  {
    id: "break-glass",
    technicalTerm: "breakGlassEmergencyAccess()",
    plainTerm: "Emergency Trauma Override",
    category: "Clinical Safety",
    badge: "Trauma Care",
    badgeColor: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
    plainMeaning:
      "A life-saving override protocol for emergency physicians when an unconscious trauma patient cannot provide authorization.",
    whyItProtectsYou:
      "Ensures emergency doctors can see allergies and blood types in trauma care, while enforcing mandatory justification and permanent on-chain forensic logs.",
    analogy: "Like breaking the glass on an emergency fire alarm—it saves lives, but sounds an indelible siren and audit trail.",
  },
  {
    id: "dp-sgd",
    technicalTerm: "DP-SGD (Differential Privacy)",
    plainTerm: "Mathematical Privacy Shield",
    category: "Artificial Intelligence",
    badge: "Mathematics",
    badgeColor: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
    plainMeaning:
      "An advanced mathematical algorithm that injects calibrated statistical noise into AI updates during hospital model training.",
    whyItProtectsYou:
      "Prevents 'Gradient Inversion' attacks. It mathematically proves that an adversary cannot reconstruct your personal health record from the AI model weights.",
    analogy: "Like blurring faces in a crowd photo—you can analyze the crowd density without identifying any single person.",
  },
  {
    id: "struct-packing",
    technicalTerm: "2-Slot EVM Storage Packing",
    plainTerm: "Smart Contract Gas Efficiency",
    category: "Engineering",
    badge: "Efficiency",
    badgeColor: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
    plainMeaning:
      "Compressing record metadata into fewer memory slots on the Ethereum virtual machine to save computational fees.",
    whyItProtectsYou:
      "Lowers the gas fees required to register medical records by ~45%, making sovereign patient ownership economically practical.",
    analogy: "Like packing your suitcase tightly so you don't have to pay extra baggage fees on every flight.",
  },
  {
    id: "zero-knowledge",
    technicalTerm: "Zero-Knowledge Architecture",
    plainTerm: "Proof Without Exposure",
    category: "Cryptography",
    badge: "Zero-Knowledge",
    badgeColor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    plainMeaning:
      "A privacy paradigm where the system verifies your medical record's authenticity and ownership without revealing its diagnostic contents.",
    whyItProtectsYou:
      "Miners, blockchain nodes, and cloud storage providers never see your medical records or diagnosis—only cryptographic proofs.",
    analogy: "Like showing a bouncer an ID badge that proves you are over 21 without revealing your home address or full legal name.",
  },
  {
    id: "privacy-budget",
    technicalTerm: "Privacy Loss Budget (ε, δ)",
    plainTerm: "Guaranteed Anonymity Level",
    category: "Artificial Intelligence",
    badge: "Differential Privacy",
    badgeColor: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
    plainMeaning:
      "A mathematical cap (epsilon) that strictly limits how much information any AI model update can memorize about your individual health record.",
    whyItProtectsYou:
      "Provides mathematical certainty that the hospital model cannot leak your diagnosis or medication history to outside researchers.",
    analogy: "Like setting a daily calorie budget—once the safety limit is reached, no further data consumption is permitted.",
  },
  {
    id: "fhir-observations",
    technicalTerm: "HL7-FHIR Observation Standard",
    plainTerm: "Standardized Lab & Vital Readings",
    category: "Clinical Safety",
    badge: "HL7 Standard",
    badgeColor: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30",
    plainMeaning:
      "The global medical format used by Apple Health and Epic MyChart to structure lab panels, blood pressure, and heart rate readings into clean, readable graphs.",
    whyItProtectsYou:
      "Eliminates confusing proprietary doctor notes by presenting clinical observations with standard reference ranges and color-coded safety indicators.",
    analogy: "Like a universal USB-C cable for medical devices—all hospitals and patient apps can understand the data identically.",
  },
];
