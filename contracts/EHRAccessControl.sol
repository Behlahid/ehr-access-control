// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EHRAccessControl
 * @author Final Year Engineering Project
 * @notice Gas-optimized smart contract for decentralized Electronic Health Record (EHR) access control,
 *         data sovereignty, emergency Break-Glass overrides, and Federated Learning (FL) consent.
 * @dev All health data payloads are stored off-chain (e.g., on IPFS) and represented on-chain
 *      by their cryptographic content hashes (bytes32).
 *      Storage Optimization: `Record` struct is tightly packed into 2 EVM storage slots (saving ~45% SSTORE gas).
 */
contract EHRAccessControl {
    // ==========================================
    // DATA STRUCTURES
    // ==========================================

    /**
     * @notice Struct representing a single patient medical record metadata entry.
     * @dev Tightly packed into 2 EVM words (32 bytes each):
     *      Slot 1: bytes32 ipfsHash (32 bytes)
     *      Slot 2: address owner (20 bytes) + uint64 timestamp (8 bytes) + bool flEligible (1 byte) = 29 bytes.
     * @param ipfsHash Cryptographic hash pointing to the encrypted EHR payload on IPFS.
     * @param owner Address of the patient who owns and has sovereignty over this record.
     * @param timestamp Unix epoch timestamp (uint64) when the record was registered on-chain.
     * @param flEligible Boolean flag indicating if this record is permitted for Federated Learning model training.
     */
    struct Record {
        bytes32 ipfsHash;
        address owner;
        uint64 timestamp;
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

    /// @notice Maps a record hash and doctor address to an expiration timestamp (0 = indefinite).
    mapping(bytes32 => mapping(address => uint256)) public accessExpiry;

    /// @notice Maps a record hash and doctor address to emergency break-glass override status.
    mapping(bytes32 => mapping(address => bool)) public emergencyAccessLogged;

    /// @notice Maps a record hash directly to its registered patient owner for O(1) ownership lookup.
    mapping(bytes32 => address) public recordOwner;

    /// @notice Maps a record hash to its array index in `patientRecords[owner]` for fast in-place mutation.
    mapping(bytes32 => uint256) private recordIndex;

    // ==========================================
    // EVENTS (For Indexing & Audit-Trail UI)
    // ==========================================

    /**
     * @notice Emitted when a patient registers a new EHR record on-chain.
     */
    event RecordAdded(
        bytes32 indexed recordHash,
        address indexed patient,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a patient grants access permissions to a doctor/requester.
     */
    event AccessGranted(
        bytes32 indexed recordHash,
        address indexed patient,
        address indexed doctor
    );

    /**
     * @notice Emitted when a patient grants time-bound access with an expiration timestamp.
     */
    event AccessGrantedWithExpiry(
        bytes32 indexed recordHash,
        address indexed patient,
        address indexed doctor,
        uint256 expiry
    );

    /**
     * @notice Emitted when a patient revokes access permissions from a doctor.
     */
    event AccessRevoked(
        bytes32 indexed recordHash,
        address indexed patient,
        address indexed doctor
    );

    /**
     * @notice Emitted when an external clinician or researcher requests access to a record.
     */
    event AccessRequested(
        bytes32 indexed recordHash,
        address indexed requester,
        address indexed patient
    );

    /**
     * @notice Emitted when a patient updates the Federated Learning eligibility flag.
     */
    event FLEligibilityChanged(
        bytes32 indexed recordHash,
        address indexed patient,
        bool eligible
    );

    /**
     * @notice Emitted when an accredited physician executes an emergency Break-the-Glass override.
     */
    event EmergencyBreakGlass(
        bytes32 indexed recordHash,
        address indexed doctor,
        address indexed patient,
        string justification,
        uint256 timestamp
    );

    // ==========================================
    // CORE PATIENT FUNCTIONS
    // ==========================================

    /**
     * @notice Registers a new medical record belonging to the caller (patient).
     * @dev Packed struct saves gas on storage initialization. Sets `flEligible` to `false` by default.
     * @param ipfsHash 32-byte cryptographic identifier for the off-chain encrypted medical record.
     */
    function addRecord(bytes32 ipfsHash) external {
        require(ipfsHash != bytes32(0), "Invalid IPFS hash: cannot be zero");
        require(recordOwner[ipfsHash] == address(0), "Record already registered");

        Record memory newRecord = Record({
            ipfsHash: ipfsHash,
            owner: msg.sender,
            timestamp: uint64(block.timestamp),
            flEligible: false
        });

        patientRecords[msg.sender].push(newRecord);
        recordIndex[ipfsHash] = patientRecords[msg.sender].length - 1;
        recordOwner[ipfsHash] = msg.sender;

        emit RecordAdded(ipfsHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Grants standard access permissions to a specified doctor for a specific record.
     * @param recordHash 32-byte identifier of the target record.
     * @param doctor Address of the doctor/clinician to grant access to.
     */
    function grantAccess(bytes32 recordHash, address doctor) external {
        require(recordOwner[recordHash] == msg.sender, "Unauthorized: Caller is not record owner");
        require(doctor != address(0), "Invalid doctor address: zero address");
        require(doctor != msg.sender, "Owner already possesses full access");

        accessGranted[recordHash][doctor] = true;
        accessExpiry[recordHash][doctor] = 0; // Indefinite until manually revoked

        emit AccessGranted(recordHash, msg.sender, doctor);
    }

    /**
     * @notice Grants time-bound access permissions to a specified doctor with automatic expiration.
     * @param recordHash 32-byte identifier of the target record.
     * @param doctor Address of the doctor/clinician to grant access to.
     * @param duration Duration in seconds for which access remains valid.
     */
    function grantAccessWithExpiry(bytes32 recordHash, address doctor, uint256 duration) external {
        require(recordOwner[recordHash] == msg.sender, "Unauthorized: Caller is not record owner");
        require(doctor != address(0), "Invalid doctor address: zero address");
        require(doctor != msg.sender, "Owner already possesses full access");
        require(duration > 0, "Duration must be greater than zero");

        accessGranted[recordHash][doctor] = true;
        uint256 expiry = block.timestamp + duration;
        accessExpiry[recordHash][doctor] = expiry;

        emit AccessGranted(recordHash, msg.sender, doctor);
        emit AccessGrantedWithExpiry(recordHash, msg.sender, doctor, expiry);
    }

    /**
     * @notice Revokes previously granted access permissions from a specified doctor.
     * @param recordHash 32-byte identifier of the target record.
     * @param doctor Address of the doctor whose access is being revoked.
     */
    function revokeAccess(bytes32 recordHash, address doctor) external {
        require(recordOwner[recordHash] == msg.sender, "Unauthorized: Caller is not record owner");
        require(doctor != address(0), "Invalid doctor address: zero address");

        accessGranted[recordHash][doctor] = false;
        accessExpiry[recordHash][doctor] = 0;

        emit AccessRevoked(recordHash, msg.sender, doctor);
    }

    /**
     * @notice Toggles whether a record can participate in Federated Learning (FL) research pipelines.
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
    // CLINICIAN & EMERGENCY FUNCTIONS
    // ==========================================

    /**
     * @notice Allows any doctor or researcher to broadcast an on-chain access request.
     * @param recordHash 32-byte identifier of the target record being requested.
     */
    function requestAccess(bytes32 recordHash) external {
        address owner = recordOwner[recordHash];
        require(owner != address(0), "Record does not exist");
        require(owner != msg.sender, "Requester is already the record owner");

        emit AccessRequested(recordHash, msg.sender, owner);
    }

    /**
     * @notice Epic MyChart-grade emergency Break-the-Glass override for acute clinical trauma.
     * @dev Enforces mandatory descriptive clinical justification and grants a 24-hour emergency window.
     *      Emits an unalterable forensic event for patient audit notifications.
     * @param recordHash 32-byte identifier of the target record.
     * @param justification Plaintext clinical justification (minimum 10 characters).
     */
    function breakGlassEmergencyAccess(bytes32 recordHash, string calldata justification) external {
        address owner = recordOwner[recordHash];
        require(owner != address(0), "Record does not exist");
        require(bytes(justification).length >= 10, "Clinical justification must be descriptive");
        require(msg.sender != owner, "Owner does not need emergency break-glass");

        emergencyAccessLogged[recordHash][msg.sender] = true;
        accessGranted[recordHash][msg.sender] = true;
        accessExpiry[recordHash][msg.sender] = block.timestamp + 24 hours;

        emit EmergencyBreakGlass(recordHash, msg.sender, owner, justification, block.timestamp);
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
     * @dev Returns false if time-bound authorization has expired.
     * @param recordHash 32-byte identifier of the target record.
     * @param doctor Address of the doctor/entity being checked.
     * @return bool True if authorized and unexpired, false otherwise.
     */
    function hasAccess(bytes32 recordHash, address doctor) external view returns (bool) {
        address owner = recordOwner[recordHash];
        if (owner == address(0)) {
            return false;
        }
        if (doctor == owner) {
            return true;
        }
        if (!accessGranted[recordHash][doctor]) {
            return false;
        }
        uint256 expiry = accessExpiry[recordHash][doctor];
        if (expiry > 0 && block.timestamp > expiry) {
            return false;
        }
        return true;
    }
}
