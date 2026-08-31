// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EHRAccessControl
 * @author Final Year Engineering Project
 * @notice Smart contract for decentralized Electronic Health Record (EHR) access control,
 *         data sovereignty, and Federated Learning (FL) eligibility management.
 * @dev All health data payloads are stored off-chain (e.g., on IPFS) and represented on-chain
 *      by their cryptographic content hashes (bytes32). This maintains on-chain privacy,
 *      scalability, and verifiable data integrity.
 */
contract EHRAccessControl {
    // ==========================================
    // DATA STRUCTURES
    // ==========================================

    /**
     * @notice Struct representing a single patient medical record metadata entry.
     * @param ipfsHash Cryptographic hash (CID/multihash) pointing to the encrypted EHR payload on IPFS.
     * @param owner Address of the patient who owns and has sovereignty over this record.
     * @param timestamp Unix epoch timestamp of when the record was registered on-chain.
     * @param flEligible Boolean flag indicating if this record is permitted for Federated Learning model training.
     */
    struct Record {
        bytes32 ipfsHash;
        address owner;
        uint256 timestamp;
        bool flEligible;
    }

    // ==========================================
    // STATE VARIABLES & MAPPINGS
    // ==========================================

    /// @notice Maps a patient address to their full list of uploaded medical records.
    mapping(address => Record[]) public patientRecords;

    /// @notice Maps a record hash to a doctor address to track active access permissions.
    /// @dev recordHash => doctorAddress => hasAccess
    mapping(bytes32 => mapping(address => bool)) public accessGranted;

    /// @notice Maps a record hash directly to its registered patient owner for O(1) ownership lookup.
    mapping(bytes32 => address) public recordOwner;

    /// @notice Maps a record hash to its array index in `patientRecords[owner]` for fast in-place mutation.
    mapping(bytes32 => uint256) private recordIndex;

    // ==========================================
    // EVENTS (For Indexing & Audit-Trail UI)
    // ==========================================

    /**
     * @notice Emitted when a patient registers a new EHR record on-chain.
     * @param recordHash Indexed hash of the IPFS stored record.
     * @param patient Indexed address of the patient record owner.
     * @param timestamp Timestamp when the record was added.
     */
    event RecordAdded(
        bytes32 indexed recordHash,
        address indexed patient,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a patient grants access permissions to a doctor/requester.
     * @param recordHash Indexed hash of the target record.
     * @param patient Indexed address of the record owner.
     * @param doctor Indexed address of the doctor receiving access.
     */
    event AccessGranted(
        bytes32 indexed recordHash,
        address indexed patient,
        address indexed doctor
    );

    /**
     * @notice Emitted when a patient revokes access permissions from a doctor.
     * @param recordHash Indexed hash of the target record.
     * @param patient Indexed address of the record owner.
     * @param doctor Indexed address of the doctor whose access is revoked.
     */
    event AccessRevoked(
        bytes32 indexed recordHash,
        address indexed patient,
        address indexed doctor
    );

    /**
     * @notice Emitted when an external entity (doctor/researcher) requests access to a specific record.
     * @param recordHash Indexed hash of the requested record.
     * @param requester Indexed address of the entity requesting access.
     * @param patient Indexed address of the record owner who must approve.
     */
    event AccessRequested(
        bytes32 indexed recordHash,
        address indexed requester,
        address indexed patient
    );

    /**
     * @notice Emitted when a patient updates the Federated Learning eligibility flag for their record.
     * @param recordHash Indexed hash of the target record.
     * @param patient Indexed address of the record owner.
     * @param eligible New Federated Learning eligibility status.
     */
    event FLEligibilityChanged(
        bytes32 indexed recordHash,
        address indexed patient,
        bool eligible
    );

    // ==========================================
    // CORE FUNCTIONS
    // ==========================================

    /**
     * @notice Registers a new medical record belonging to the caller (patient).
     * @dev Sets `flEligible` to `false` by default to enforce explicit opt-in consent.
     * @param ipfsHash 32-byte cryptographic identifier for the off-chain encrypted medical record.
     */
    function addRecord(bytes32 ipfsHash) external {
        require(ipfsHash != bytes32(0), "Invalid IPFS hash: cannot be zero");
        require(recordOwner[ipfsHash] == address(0), "Record already registered");

        Record memory newRecord = Record({
            ipfsHash: ipfsHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            flEligible: false
        });

        patientRecords[msg.sender].push(newRecord);
        recordIndex[ipfsHash] = patientRecords[msg.sender].length - 1;
        recordOwner[ipfsHash] = msg.sender;

        emit RecordAdded(ipfsHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Grants access permissions to a specified doctor for a specific record.
     * @dev Only callable by the legitimate owner of the record.
     * @param recordHash 32-byte identifier of the target record.
     * @param doctor Address of the doctor/clinician to grant access to.
     */
    function grantAccess(bytes32 recordHash, address doctor) external {
        require(recordOwner[recordHash] == msg.sender, "Unauthorized: Caller is not record owner");
        require(doctor != address(0), "Invalid doctor address: zero address");
        require(doctor != msg.sender, "Owner already possesses full access");

        accessGranted[recordHash][doctor] = true;

        emit AccessGranted(recordHash, msg.sender, doctor);
    }

    /**
     * @notice Revokes previously granted access permissions from a specified doctor.
     * @dev Only callable by the legitimate owner of the record.
     * @param recordHash 32-byte identifier of the target record.
     * @param doctor Address of the doctor whose access is being revoked.
     */
    function revokeAccess(bytes32 recordHash, address doctor) external {
        require(recordOwner[recordHash] == msg.sender, "Unauthorized: Caller is not record owner");
        require(doctor != address(0), "Invalid doctor address: zero address");

        accessGranted[recordHash][doctor] = false;

        emit AccessRevoked(recordHash, msg.sender, doctor);
    }

    /**
     * @notice Allows any doctor/researcher to broadcast an access request for a specific record.
     * @dev Does not automatically grant access; emits an on-chain event for the patient's dApp to consume.
     * @param recordHash 32-byte identifier of the target record being requested.
     */
    function requestAccess(bytes32 recordHash) external {
        address owner = recordOwner[recordHash];
        require(owner != address(0), "Record does not exist");
        require(owner != msg.sender, "Requester is already the record owner");

        emit AccessRequested(recordHash, msg.sender, owner);
    }

    /**
     * @notice Toggles whether a record can participate in Federated Learning (FL) research pipelines.
     * @dev Demonstrates patient-centric consent for AI/ML training without raw data leaving the client.
     * @param recordHash 32-byte identifier of the target record.
     * @param eligible Boolean flag indicating whether the record is eligible for FL.
     */
    function setFLEligibility(bytes32 recordHash, bool eligible) external {
        require(recordOwner[recordHash] == msg.sender, "Unauthorized: Caller is not record owner");

        uint256 idx = recordIndex[recordHash];
        patientRecords[msg.sender][idx].flEligible = eligible;

        emit FLEligibilityChanged(recordHash, msg.sender, eligible);
    }

    // ==========================================
    // VIEW / GETTER FUNCTIONS
    // ==========================================

    /**
     * @notice Retrieves all medical records owned by the calling patient.
     * @return Array of `Record` structs owned by `msg.sender`.
     */
    function getMyRecords() external view returns (Record[] memory) {
        return patientRecords[msg.sender];
    }

    /**
     * @notice Checks if a specific doctor or caller currently has access to a given record.
     * @dev The owner of the record always evaluates to `true`.
     * @param recordHash 32-byte identifier of the target record.
     * @param doctor Address of the doctor/entity being checked.
     * @return bool True if authorized, false otherwise.
     */
    function hasAccess(bytes32 recordHash, address doctor) external view returns (bool) {
        address owner = recordOwner[recordHash];
        if (owner == address(0)) {
            return false;
        }
        if (doctor == owner) {
            return true;
        }
        return accessGranted[recordHash][doctor];
    }
}
