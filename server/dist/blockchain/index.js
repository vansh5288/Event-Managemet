"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvider = exports.getBlockchainTransactionHistory = exports.recordAttendance = exports.distributeRewards = exports.verifyCertificateOnChain = exports.mintNFTTicket = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../config");
/**
 * Blockchain service for NFT tickets, certificates verification,
 * and reward distribution
 */
// Simple contract ABI for NFT ticket/event contract
const eventContractABI = [
    'function mintTicket(address to, string memory eventName, uint256 ticketId) public returns (uint256)',
    'function verifyCertificate(uint256 certificateId) public view returns (bool)',
    'function getRewardBalance(address user) public view returns (uint256)',
    'function distributeRewards(address[] memory users, uint256 amount) public',
    'function mintCertificate(address to, string memory eventName, string memory certificateHash) public returns (uint256)',
    'function hasAttended(address user, uint256 eventId) public view returns (bool)',
    'function recordAttendance(uint256 eventId, address user) public',
    'function getTransactionHistory(address user) public view returns (uint256[] memory)',
    'event TicketMinted(address indexed to, uint256 indexed tokenId, string eventName)',
    'event CertificateIssued(address indexed to, uint256 indexed certificateId, string eventName)',
    'event RewardsDistributed(address indexed user, uint256 amount)',
];
let provider = null;
let contract = null;
const initContract = async () => {
    if (!config_1.config.contractAddress || !config_1.config.ethereumRpcUrl)
        return null;
    try {
        provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.ethereumRpcUrl);
        const signer = await provider.getSigner();
        contract = new ethers_1.ethers.Contract(config_1.config.contractAddress, eventContractABI, signer);
        return contract;
    }
    catch (error) {
        console.error('Contract initialization failed:', error);
        return null;
    }
};
/**
 * Mint an NFT ticket for an event registration
 */
const mintNFTTicket = async (userAddress, eventName, ticketId) => {
    const contractInstance = await initContract();
    if (!contractInstance) {
        return {
            success: false,
            message: 'Blockchain not configured. Running in simulation mode.',
            simulation: true,
            data: { tokenId: `sim-${ticketId}` },
        };
    }
    try {
        const tx = await contractInstance.mintTicket(userAddress, eventName, ticketId);
        const receipt = await tx.wait();
        return {
            success: true,
            txHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            simulation: false,
        };
    }
    catch (error) {
        console.error('NFT minting failed:', error);
        return { success: false, message: 'NFT minting failed', error };
    }
};
exports.mintNFTTicket = mintNFTTicket;
/**
 * Verify certificate on blockchain
 */
const verifyCertificateOnChain = async (certificateId) => {
    const contractInstance = await initContract();
    if (!contractInstance) {
        return { success: true, simulation: true, valid: true };
    }
    try {
        const valid = await contractInstance.verifyCertificate(certificateId);
        return { success: true, valid, simulation: false };
    }
    catch (error) {
        console.error('Certificate verification failed:', error);
        return { success: false, message: 'Verification failed' };
    }
};
exports.verifyCertificateOnChain = verifyCertificateOnChain;
/**
 * Distribute rewards to users
 */
const distributeRewards = async (userAddresses, amount) => {
    const contractInstance = await initContract();
    if (!contractInstance) {
        return {
            success: true,
            simulation: true,
            message: `Simulated distribution of ${amount} to ${userAddresses.length} users`,
        };
    }
    try {
        const tx = await contractInstance.distributeRewards(userAddresses, amount);
        const receipt = await tx.wait();
        return { success: true, txHash: receipt.transactionHash, simulation: false };
    }
    catch (error) {
        console.error('Reward distribution failed:', error);
        return { success: false, message: 'Reward distribution failed' };
    }
};
exports.distributeRewards = distributeRewards;
/**
 * Record proof of attendance on blockchain
 */
const recordAttendance = async (eventId, userAddress) => {
    const contractInstance = await initContract();
    if (!contractInstance) {
        return { success: true, simulation: true, recorded: true };
    }
    try {
        const tx = await contractInstance.recordAttendance(eventId, userAddress);
        const receipt = await tx.wait();
        return { success: true, txHash: receipt.transactionHash, simulation: false };
    }
    catch (error) {
        console.error('Attendance recording failed:', error);
        return { success: false, message: 'Failed to record attendance' };
    }
};
exports.recordAttendance = recordAttendance;
/**
 * Get user's transaction history from blockchain
 */
const getBlockchainTransactionHistory = async (userAddress) => {
    const contractInstance = await initContract();
    if (!contractInstance) {
        return { success: true, simulation: true, data: [] };
    }
    try {
        const txHistory = await contractInstance.getTransactionHistory(userAddress);
        return { success: true, data: txHistory, simulation: false };
    }
    catch (error) {
        console.error('Failed to fetch transaction history:', error);
        return { success: false, message: 'Failed to fetch transaction history' };
    }
};
exports.getBlockchainTransactionHistory = getBlockchainTransactionHistory;
/**
 * Get the underlying provider (if configured)
 */
const getProvider = () => {
    if (!config_1.config.ethereumRpcUrl)
        return null;
    try {
        return new ethers_1.ethers.JsonRpcProvider(config_1.config.ethereumRpcUrl);
    }
    catch (error) {
        console.error('Failed to create provider:', error);
        return null;
    }
};
exports.getProvider = getProvider;
//# sourceMappingURL=index.js.map