// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title EventHub
 * @dev NFT tickets, certificate verification, reward distribution,
 * and proof-of-attendance tracking for the EventHub platform.
 */
contract EventHub is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIds;
    Counters.Counter private _certificateIds;

    // Platform fee in basis points (0-1000 => 0%-100%)
    uint256 public platformFeeBps;

    // ---- Certificate data ----
    struct Certificate {
        address owner;
        string eventName;
        string certificateHash;
        bool issued;
        bool revoked;
        uint256 issuedAt;
    }
    mapping(uint256 => Certificate) public certificates;

    // ---- Attendance ----
    mapping(uint256 => mapping(address => bool)) public attendance; // eventId => user => attended
    mapping(address => uint256[]) public attendedEvents;

    // ---- Rewards ----
    mapping(address => uint256) public rewardBalances;
    mapping(address => uint256[]) public transactionHistory;
    mapping(address => mapping(uint256 => bool)) public hasRewardForEvent;

    // ---- Events ----
    struct EventInfo {
        address organizer;
        string name;
        bool exists;
    }
    mapping(uint256 => EventInfo) public events;

    event TicketMinted(address indexed to, uint256 indexed tokenId, string eventName, uint256 eventId);
    event CertificateIssued(address indexed to, uint256 indexed certificateId, string eventName);
    event CertificateRevoked(uint256 indexed certificateId);
    event RewardsDistributed(address indexed user, uint256 amount, uint256 eventId);
    event AttendanceRecorded(uint256 indexed eventId, address indexed user);
    event EventCreated(uint256 indexed eventId, address indexed organizer, string name);
    event RewardDeposited(address indexed from, uint256 amount, uint256 indexed eventId);

    constructor() ERC721("EventHub Ticket", "EVT") {}

    receive() external payable {}

    // ---- Event management ----
    function createEvent(uint256 eventId, string memory name) external onlyOwner {
        require(!events[eventId].exists, "Event already exists");
        events[eventId] = EventInfo({ organizer: msg.sender, name: name, exists: true });
        emit EventCreated(eventId, msg.sender, name);
    }

    // ---- Ticket minting ----
    function mintTicket(address to, string memory eventName, uint256 ticketId)
        external
        payable
        whenNotPaused
        onlyOwner
        returns (uint256)
    {
        require(to != address(0), "Invalid address");
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, generateTokenURI(newTokenId, ticketId, eventName));

        emit TicketMinted(to, newTokenId, eventName, ticketId);
        return newTokenId;
    }

    function generateTokenURI(uint256 tokenId, uint256 ticketId, string memory eventName)
        internal
        pure
        returns (string memory)
    {
        bytes memory metadata = abi.encodePacked(
            '{"name":"',
            eventName,
            ' Ticket #',
            tokenId.toString(),
            '","description":"Official EventHub NFT Ticket for ',
            eventName,
            '","attributes":[{"trait_type":"Ticket ID","value":"',
            ticketId.toString(),
            '"},{"trait_type":"Platform","value":"EventHub"},{"trait_type":"Network","value":"Ethereum"}]}'
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(metadata)));
    }

    // ---- Certificates ----
    function mintCertificate(
        address to,
        string memory eventName,
        string memory certificateHash
    ) external onlyOwner returns (uint256) {
        _certificateIds.increment();
        uint256 newCertId = _certificateIds.current();

        certificates[newCertId] = Certificate({
            owner: to,
            eventName: eventName,
            certificateHash: certificateHash,
            issued: true,
            revoked: false,
            issuedAt: block.timestamp
        });

        emit CertificateIssued(to, newCertId, eventName);
        return newCertId;
    }

    function revokeCertificate(uint256 certificateId) external onlyOwner {
        require(certificates[certificateId].issued, "Certificate does not exist");
        require(!certificates[certificateId].revoked, "Certificate already revoked");
        certificates[certificateId].revoked = true;
        certificates[certificateId].issued = false;
        emit CertificateRevoked(certificateId);
    }

    function verifyCertificate(uint256 certificateId)
        external
        view
        returns (bool valid, string memory eventName, uint256 issuedAt)
    {
        Certificate memory cert = certificates[certificateId];
        return (cert.issued && !cert.revoked, cert.eventName, cert.issuedAt);
    }

    function getCertificateOwner(uint256 certificateId) external view returns (address) {
        return certificates[certificateId].owner;
    }

    // ---- Proof of attendance ----
    function recordAttendance(uint256 eventId, address userAddr) external whenNotPaused onlyOwner {
        require(events[eventId].exists, "Event does not exist");
        require(userAddr != address(0), "Invalid address");
        require(!attendance[eventId][userAddr], "Attendance already recorded");

        attendance[eventId][userAddr] = true;
        attendedEvents[userAddr].push(eventId);

        emit AttendanceRecorded(eventId, userAddr);
    }

    function hasAttended(address user, uint256 eventId) public view returns (bool) {
        return attendance[eventId][user];
    }

    function getAttendedEvents(address user) external view returns (uint256[] memory) {
        return attendedEvents[user];
    }

    // ---- Reward distribution ----
    function depositRewards(uint256 eventId) external payable {
        require(events[eventId].exists, "Event does not exist");
        require(msg.value > 0, "Reward amount must be positive");
        emit RewardDeposited(msg.sender, msg.value, eventId);
    }

    function distributeRewards(address[] memory users, uint256 amount, uint256 eventId)
        external
        onlyOwner
        nonReentrant
    {
        require(events[eventId].exists, "Event does not exist");
        require(amount > 0, "Amount must be positive");

        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (hasAttended(user, eventId) && !hasRewardForEvent[user][eventId]) {
                rewardBalances[user] += amount;
                hasRewardForEvent[user][eventId] = true;
                transactionHistory[user].push(block.timestamp);

                emit RewardsDistributed(user, amount, eventId);
            }
        }
    }

    function getRewardBalance(address user) external view returns (uint256) {
        return rewardBalances[user];
    }

    function withdrawRewards() external nonReentrant {
        uint256 balance = rewardBalances[msg.sender];
        require(balance > 0, "No rewards to withdraw");

        rewardBalances[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{ value: balance }("");
        require(success, "Withdrawal failed");
    }

    // ---- Transaction history & utilities ----
    function getTransactionHistory(address user) external view returns (uint256[] memory) {
        return transactionHistory[user];
    }

    function totalTicketsMinted() external view returns (uint256) {
        return _tokenIds.current();
    }

    function totalCertificatesIssued() external view returns (uint256) {
        return _certificateIds.current();
    }

    // ---- Required overrides ----
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ---- Admin ----
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high");
        platformFeeBps = _feeBps;
    }

    function withdrawPlatformFees() external onlyOwner {
        (bool success, ) = payable(owner()).call{ value: address(this).balance }("");
        require(success, "Withdrawal failed");
    }
}

