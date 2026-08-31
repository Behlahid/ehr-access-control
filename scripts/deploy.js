const hre = require("hardhat");

async function main() {
  console.log("=================================================");
  console.log("Deploying EHRAccessControl Smart Contract...");
  console.log(`Network: ${hre.network.name}`);
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer Account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy Contract
  const EHRAccessControl = await hre.ethers.getContractFactory("EHRAccessControl");
  const ehrContract = await EHRAccessControl.deploy();

  await ehrContract.waitForDeployment();

  const deployedAddress = await ehrContract.getAddress();
  const deployTxHash = ehrContract.deploymentTransaction().hash;

  console.log("-------------------------------------------------");
  console.log(`EHRAccessControl deployed successfully!`);
  console.log(`Contract Address : ${deployedAddress}`);
  console.log(`Transaction Hash : ${deployTxHash}`);
  console.log("-------------------------------------------------");

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations before verifying...");
    await ehrContract.deploymentTransaction().wait(5);
    console.log("Contract is ready on live network.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
