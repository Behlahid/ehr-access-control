const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const targetNode = process.env.NODE_ID || "Hospital_2";
  const targetEligible = process.env.ELIGIBLE ? process.env.ELIGIBLE.toLowerCase() === "true" : false;

  const mappingPath = path.join(__dirname, "..", "fl-pipeline", "bridge", "node_record_mapping.json");
  const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));

  if (!mapping[targetNode]) {
    console.error(`Invalid node: ${targetNode}. Valid nodes: ${Object.keys(mapping).filter(k => !k.startsWith('_')).join(', ')}`);
    process.exit(1);
  }

  const hash = mapping[targetNode].recordHash;
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const EHRAccessControl = await hre.ethers.getContractFactory("EHRAccessControl");
  const contract = EHRAccessControl.attach(contractAddress);

  console.log(`Setting FL Consent for ${targetNode} (${mapping[targetNode].name})...`);
  console.log(`Record Hash: ${hash}`);
  console.log(`New flEligible state: ${targetEligible}`);

  const tx = await contract.setFLEligibility(hash, targetEligible);
  await tx.wait();

  console.log(`[OK] Updated on-chain successfully! Tx: ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Toggle failed:", err);
    process.exit(1);
  });
