import { ethers } from 'ethers';
import { config } from '../config';

/**
 * Blockchain service for NFT tickets, certificates verification,
 * and reward distribution
 */

// Contract ABI matching contracts/EventHub.sol
const eventContractABI = [
  'function mintTicket(address to, string memory eventName, uint256 ticketId) public payable returns (uint256)',
  'function verifyCertificate(uint256 certificateId) public view returns (bool valid, string memory eventName, uint256 issuedAt)',
  'function getCertificateOwner(uint256 certificateId) public view returns (address)',
  'function getRewardBalance(address user) public view returns (uint256)',
  'function distributeRewards(address[] memory users, uint256 amount, uint256 eventId) public',
  'function depositRewards(uint256 eventId) public payable',
  'function mintCertificate(address to, string memory eventName, string memory certificateHash) public returns (uint256)',
  'function hasAttended(address user, uint256 eventId) public view returns (bool)',
  'function getAttendedEvents(address user) public view returns (uint256[] memory)',
  'function recordAttendance(uint256 eventId, address user) public',
  'function withdrawRewards() public',
  'function getTransactionHistory(address user) public view returns (uint256[] memory)',
  'event TicketMinted(address indexed to, uint256 indexed tokenId, string eventName, uint256 eventId)',
  'event CertificateIssued(address indexed to, uint256 indexed certificateId, string eventName)',
  'event RewardsDistributed(address indexed user, uint256 amount, uint256 eventId)',
  'event AttendanceRecorded(uint256 indexed eventId, address indexed user)',
  'event EventCreated(uint256 indexed eventId, address indexed organizer, string name)',
];

let provider: ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;

const initContract = async () => {
  if (!config.contractAddress || !config.ethereumRpcUrl) return null;

  try {
    provider = new ethers.JsonRpcProvider(config.ethereumRpcUrl);
    const signer = await provider.getSigner();
    contract = new ethers.Contract(config.contractAddress, eventContractABI, signer);
    return contract;
  } catch (error) {
    console.error('Contract initialization failed:', error);
    return null;
  }
};

/**
 * Mint an NFT ticket for an event registration
 */
export const mintNFTTicket = async (userAddress: string, eventName: string, ticketId: number) => {
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
  } catch (error) {
    console.error('NFT minting failed:', error);
    return { success: false, message: 'NFT minting failed', error };
  }
};

/**
 * Verify certificate on blockchain
 */
export const verifyCertificateOnChain = async (certificateId: number) => {
  const contractInstance = await initContract();
  if (!contractInstance) {
    return { success: true, simulation: true, valid: true };
  }

  try {
    const result = await contractInstance.verifyCertificate(certificateId);
    const valid = result.valid;
    const eventName = result.eventName;
    const issuedAt = result.issuedAt;
    return { success: true, valid, eventName, issuedAt: issuedAt.toString(), simulation: false };
  } catch (error) {
    console.error('Certificate verification failed:', error);
    return { success: false, message: 'Verification failed' };
  }
};

/**
 * Distribute rewards to users
 */
export const distributeRewards = async (userAddresses: string[], amount: number, eventId?: number) => {
  const contractInstance = await initContract();
  if (!contractInstance) {
    return {
      success: true,
      simulation: true,
      message: `Simulated distribution of ${amount} to ${userAddresses.length} users`,
    };
  }

  try {
    const tx = await contractInstance.distributeRewards(userAddresses, amount, eventId || 0);
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.transactionHash, simulation: false };
  } catch (error) {
    console.error('Reward distribution failed:', error);
    return { success: false, message: 'Reward distribution failed' };
  }
};

/**
 * Record proof of attendance on blockchain
 */
export const recordAttendance = async (eventId: number, userAddress: string) => {
  const contractInstance = await initContract();
  if (!contractInstance) {
    return { success: true, simulation: true, recorded: true };
  }

  try {
    const tx = await contractInstance.recordAttendance(eventId, userAddress);
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.transactionHash, simulation: false };
  } catch (error) {
    console.error('Attendance recording failed:', error);
    return { success: false, message: 'Failed to record attendance' };
  }
};

/**
 * Get user's transaction history from blockchain
 */
export const getBlockchainTransactionHistory = async (userAddress: string) => {
  const contractInstance = await initContract();
  if (!contractInstance) {
    return { success: true, simulation: true, data: [] };
  }

  try {
    const txHistory = await contractInstance.getTransactionHistory(userAddress);
    return { success: true, data: txHistory, simulation: false };
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    return { success: false, message: 'Failed to fetch transaction history' };
  }
};

/**
 * Get the underlying provider (if configured)
 */
export const getProvider = () => {
  if (!config.ethereumRpcUrl) return null;
  try {
    return new ethers.JsonRpcProvider(config.ethereumRpcUrl);
  } catch (error) {
    console.error('Failed to create provider:', error);
    return null;
  }
};
