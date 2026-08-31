const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EHRAccessControl Smart Contract", function () {
  let ehrContract;
  let owner;
  let patient1;
  let patient2;
  let doctor1;
  let doctor2;
  let researcher;

  // Sample bytes32 IPFS content hashes (representing Sha256/CID hashes)
  const SAMPLE_HASH_1 = ethers.keccak256(ethers.toUtf8Bytes("QmPatient1_EHR_Record_V1"));
  const SAMPLE_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("QmPatient1_EHR_Record_V2"));
  const SAMPLE_HASH_3 = ethers.keccak256(ethers.toUtf8Bytes("QmPatient2_EHR_Record_V1"));
  const ZERO_HASH = ethers.ZeroHash;

  beforeEach(async function () {
    [owner, patient1, patient2, doctor1, doctor2, researcher] = await ethers.getSigners();

    const EHRAccessControlFactory = await ethers.getContractFactory("EHRAccessControl");
    ehrContract = await EHRAccessControlFactory.deploy();
    await ehrContract.waitForDeployment();
  });

  describe("1. Contract Deployment", function () {
    it("Should deploy cleanly and return a valid contract address", async function () {
      const address = await ehrContract.getAddress();
      expect(address).to.be.properAddress;
      expect(address).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("2. Record Registration (addRecord & getMyRecords)", function () {
    it("Should allow a patient to register a new EHR record with default flEligible = false", async function () {
      const tx = await ehrContract.connect(patient1).addRecord(SAMPLE_HASH_1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      // Verify RecordAdded event emission with indexed parameters
      await expect(tx)
        .to.emit(ehrContract, "RecordAdded")
        .withArgs(SAMPLE_HASH_1, patient1.address, block.timestamp);

      // Verify record ownership
      expect(await ehrContract.recordOwner(SAMPLE_HASH_1)).to.equal(patient1.address);

      // Verify record retrieved via getMyRecords
      const myRecords = await ehrContract.connect(patient1).getMyRecords();
      expect(myRecords.length).to.equal(1);
      expect(myRecords[0].ipfsHash).to.equal(SAMPLE_HASH_1);
      expect(myRecords[0].owner).to.equal(patient1.address);
      expect(myRecords[0].timestamp).to.equal(block.timestamp);
      expect(myRecords[0].flEligible).to.equal(false);
    });

    it("Should allow a patient to add multiple records independently", async function () {
      await ehrContract.connect(patient1).addRecord(SAMPLE_HASH_1);
      await ehrContract.connect(patient1).addRecord(SAMPLE_HASH_2);

      const patient1Records = await ehrContract.connect(patient1).getMyRecords();
      expect(patient1Records.length).to.equal(2);
      expect(patient1Records[0].ipfsHash).to.equal(SAMPLE_HASH_1);
      expect(patient1Records[1].ipfsHash).to.equal(SAMPLE_HASH_2);

      // Another patient calling getMyRecords gets only their records (empty array initially)
      const patient2Records = await ehrContract.connect(patient2).getMyRecords();
      expect(patient2Records.length).to.equal(0);
    });

    it("Should revert if trying to add a zero hash", async function () {
      await expect(
        ehrContract.connect(patient1).addRecord(ZERO_HASH)
      ).to.be.revertedWith("Invalid IPFS hash: cannot be zero");
    });

    it("Should revert if registering an already registered record hash", async function () {
      await ehrContract.connect(patient1).addRecord(SAMPLE_HASH_1);

      // Same patient attempting duplicate
      await expect(
        ehrContract.connect(patient1).addRecord(SAMPLE_HASH_1)
      ).to.be.revertedWith("Record already registered");

      // Different patient attempting same hash
      await expect(
        ehrContract.connect(patient2).addRecord(SAMPLE_HASH_1)
      ).to.be.revertedWith("Record already registered");
    });
  });

  describe("3. Access Control (grantAccess & revokeAccess)", function () {
    beforeEach(async function () {
      await ehrContract.connect(patient1).addRecord(SAMPLE_HASH_1);
    });

    it("Should allow the record owner to grant access to a doctor and emit AccessGranted", async function () {
      const tx = await ehrContract.connect(patient1).grantAccess(SAMPLE_HASH_1, doctor1.address);

      await expect(tx)
        .to.emit(ehrContract, "AccessGranted")
        .withArgs(SAMPLE_HASH_1, patient1.address, doctor1.address);

      expect(await ehrContract.accessGranted(SAMPLE_HASH_1, doctor1.address)).to.equal(true);
      expect(await ehrContract.hasAccess(SAMPLE_HASH_1, doctor1.address)).to.equal(true);
    });

    it("Should allow the record owner to revoke previously granted access and emit AccessRevoked", async function () {
      // Grant first
      await ehrContract.connect(patient1).grantAccess(SAMPLE_HASH_1, doctor1.address);
      expect(await ehrContract.hasAccess(SAMPLE_HASH_1, doctor1.address)).to.equal(true);

      // Revoke
      const tx = await ehrContract.connect(patient1).revokeAccess(SAMPLE_HASH_1, doctor1.address);

      await expect(tx)
        .to.emit(ehrContract, "AccessRevoked")
        .withArgs(SAMPLE_HASH_1, patient1.address, doctor1.address);

      expect(await ehrContract.accessGranted(SAMPLE_HASH_1, doctor1.address)).to.equal(false);
      expect(await ehrContract.hasAccess(SAMPLE_HASH_1, doctor1.address)).to.equal(false);
    });

    it("Should revert when an unauthorized non-owner attempts to grant access", async function () {
      await expect(
        ehrContract.connect(patient2).grantAccess(SAMPLE_HASH_1, doctor1.address)
      ).to.be.revertedWith("Unauthorized: Caller is not record owner");

      await expect(
        ehrContract.connect(doctor1).grantAccess(SAMPLE_HASH_1, doctor2.address)
      ).to.be.revertedWith("Unauthorized: Caller is not record owner");
    });

    it("Should revert when an unauthorized non-owner attempts to revoke access", async function () {
      await ehrContract.connect(patient1).grantAccess(SAMPLE_HASH_1, doctor1.address);

      await expect(
        ehrContract.connect(patient2).revokeAccess(SAMPLE_HASH_1, doctor1.address)
      ).to.be.revertedWith("Unauthorized: Caller is not record owner");
    });

    it("Should revert when granting access to address(0)", async function () {
      await expect(
        ehrContract.connect(patient1).grantAccess(SAMPLE_HASH_1, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid doctor address: zero address");
    });

    it("Should revert when revoking access for address(0)", async function () {
      await expect(
        ehrContract.connect(patient1).revokeAccess(SAMPLE_HASH_1, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid doctor address: zero address");
    });

    it("Should revert when owner attempts to grant access to themselves", async function () {
      await expect(
        ehrContract.connect(patient1).grantAccess(SAMPLE_HASH_1, patient1.address)
      ).to.be.revertedWith("Owner already possesses full access");
    });
  });

  describe("4. Access Requests (requestAccess)", function () {
    beforeEach(async function () {
      await ehrContract.connect(patient1).addRecord(SAMPLE_HASH_1);
    });

    it("Should allow an external doctor or researcher to broadcast an access request and emit AccessRequested", async function () {
      const tx = await ehrContract.connect(doctor1).requestAccess(SAMPLE_HASH_1);

      await expect(tx)
        .to.emit(ehrContract, "AccessRequested")
        .withArgs(SAMPLE_HASH_1, doctor1.address, patient1.address);

      // Verify that requesting does not automatically grant access
      expect(await ehrContract.hasAccess(SAMPLE_HASH_1, doctor1.address)).to.equal(false);
    });

    it("Should revert if requesting access for a non-existent record", async function () {
      const nonExistentHash = ethers.keccak256(ethers.toUtf8Bytes("QmNonExistentRecord"));

      await expect(
        ehrContract.connect(doctor1).requestAccess(nonExistentHash)
      ).to.be.revertedWith("Record does not exist");
    });

    it("Should revert if the record owner requests access to their own record", async function () {
      await expect(
        ehrContract.connect(patient1).requestAccess(SAMPLE_HASH_1)
      ).to.be.revertedWith("Requester is already the record owner");
    });
  });

  describe("5. Federated Learning (FL) Eligibility (setFLEligibility)", function () {
    beforeEach(async function () {
      await ehrContract.connect(patient1).addRecord(SAMPLE_HASH_1);
    });

    it("Should allow the owner to toggle FL eligibility to true and emit FLEligibilityChanged", async function () {
      const tx = await ehrContract.connect(patient1).setFLEligibility(SAMPLE_HASH_1, true);

      await expect(tx)
        .to.emit(ehrContract, "FLEligibilityChanged")
        .withArgs(SAMPLE_HASH_1, patient1.address, true);

      const records = await ehrContract.connect(patient1).getMyRecords();
      expect(records[0].flEligible).to.equal(true);
    });

    it("Should allow the owner to toggle FL eligibility back to false", async function () {
      await ehrContract.connect(patient1).setFLEligibility(SAMPLE_HASH_1, true);
      const tx = await ehrContract.connect(patient1).setFLEligibility(SAMPLE_HASH_1, false);

      await expect(tx)
        .to.emit(ehrContract, "FLEligibilityChanged")
        .withArgs(SAMPLE_HASH_1, patient1.address, false);

      const records = await ehrContract.connect(patient1).getMyRecords();
      expect(records[0].flEligible).to.equal(false);
    });

    it("Should correctly update the specific record when patient has multiple records", async function () {
      await ehrContract.connect(patient1).addRecord(SAMPLE_HASH_2);

      // Toggle record 2 to true, leave record 1 false
      await ehrContract.connect(patient1).setFLEligibility(SAMPLE_HASH_2, true);

      const records = await ehrContract.connect(patient1).getMyRecords();
      expect(records[0].ipfsHash).to.equal(SAMPLE_HASH_1);
      expect(records[0].flEligible).to.equal(false);

      expect(records[1].ipfsHash).to.equal(SAMPLE_HASH_2);
      expect(records[1].flEligible).to.equal(true);
    });

    it("Should revert if an unauthorized user attempts to change FL eligibility", async function () {
      await expect(
        ehrContract.connect(patient2).setFLEligibility(SAMPLE_HASH_1, true)
      ).to.be.revertedWith("Unauthorized: Caller is not record owner");

      await expect(
        ehrContract.connect(doctor1).setFLEligibility(SAMPLE_HASH_1, true)
      ).to.be.revertedWith("Unauthorized: Caller is not record owner");
    });
  });

  describe("6. Authorization Checks (hasAccess)", function () {
    beforeEach(async function () {
      await ehrContract.connect(patient1).addRecord(SAMPLE_HASH_1);
    });

    it("Should return true for the record owner by default", async function () {
      expect(await ehrContract.hasAccess(SAMPLE_HASH_1, patient1.address)).to.equal(true);
    });

    it("Should return false for non-owners prior to grant", async function () {
      expect(await ehrContract.hasAccess(SAMPLE_HASH_1, doctor1.address)).to.equal(false);
      expect(await ehrContract.hasAccess(SAMPLE_HASH_1, patient2.address)).to.equal(false);
    });

    it("Should return false for a non-existent record hash", async function () {
      const nonExistentHash = ethers.keccak256(ethers.toUtf8Bytes("RandomRecordHash"));
      expect(await ehrContract.hasAccess(nonExistentHash, doctor1.address)).to.equal(false);
      expect(await ehrContract.hasAccess(nonExistentHash, patient1.address)).to.equal(false);
    });

    it("Should return true only for the granted doctor, not other doctors", async function () {
      await ehrContract.connect(patient1).grantAccess(SAMPLE_HASH_1, doctor1.address);

      expect(await ehrContract.hasAccess(SAMPLE_HASH_1, doctor1.address)).to.equal(true);
      expect(await ehrContract.hasAccess(SAMPLE_HASH_1, doctor2.address)).to.equal(false);
      expect(await ehrContract.hasAccess(SAMPLE_HASH_1, researcher.address)).to.equal(false);
    });
  });
});
