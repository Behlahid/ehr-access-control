const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("Seeding 4 Representative Hospital Records On-Chain...");
  console.log(`Network: ${hre.network.name}`);
  console.log("=================================================");

  const mappingPath = path.join(__dirname, "..", "fl-pipeline", "bridge", "node_record_mapping.json");
  const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Patient Account: ${deployer.address}`);

  // Fetch or attach deployed contract
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const EHRAccessControl = await hre.ethers.getContractFactory("EHRAccessControl");
  const contract = EHRAccessControl.attach(contractAddress);

  for (const [nodeId, info] of Object.entries(mapping)) {
    if (nodeId.startsWith("_")) continue;
    const hash = info.recordHash;
    console.log(`\nProcessing ${nodeId} (${info.name})...`);

    // Check if already registered
    const owner = await contract.recordOwner(hash);
    if (owner === hre.ethers.ZeroAddress) {
      console.log(`  [+] Calling addRecord(${hash})...`);
      const tx1 = await contract.addRecord(hash);
      await tx1.wait();
      console.log(`  [OK] Registered record on-chain. Tx: ${tx1.hash}`);

      console.log(`  [+] Enabling FL Consent via setFLEligibility(${hash}, true)...`);
      const tx2 = await contract.setFLEligibility(hash, true);
      await tx2.wait();
      console.log(`  [OK] flEligible set to TRUE on-chain. Tx: ${tx2.hash}`);
    } else {
      console.log(`  [i] Record already registered by owner: ${owner}`);
      // Ensure FL is enabled
      const tx2 = await contract.setFLEligibility(hash, true);
      await tx2.wait();
      console.log(`  [OK] Ensured flEligible is TRUE. Tx: ${tx2.hash}`);
    }
  }

  console.log("\n=================================================");
  console.log("✓ All 4 Hospital representative records are ready on-chain!");
  console.log("You can now view/toggle them in the Patient Portal UI (/patient).");
  console.log("=================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
