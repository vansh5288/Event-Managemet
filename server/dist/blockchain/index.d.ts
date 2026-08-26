import { ethers } from 'ethers';
/**
 * Mint an NFT ticket for an event registration
 */
export declare const mintNFTTicket: (userAddress: string, eventName: string, ticketId: number) => Promise<{
    success: boolean;
    message: string;
    simulation: boolean;
    data: {
        tokenId: string;
    };
    txHash?: undefined;
    blockNumber?: undefined;
    error?: undefined;
} | {
    success: boolean;
    txHash: any;
    blockNumber: any;
    simulation: boolean;
    message?: undefined;
    data?: undefined;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    simulation?: undefined;
    data?: undefined;
    txHash?: undefined;
    blockNumber?: undefined;
}>;
/**
 * Verify certificate on blockchain
 */
export declare const verifyCertificateOnChain: (certificateId: number) => Promise<{
    success: boolean;
    valid: any;
    simulation: boolean;
    message?: undefined;
} | {
    success: boolean;
    message: string;
    valid?: undefined;
    simulation?: undefined;
}>;
/**
 * Distribute rewards to users
 */
export declare const distributeRewards: (userAddresses: string[], amount: number) => Promise<{
    success: boolean;
    simulation: boolean;
    message: string;
    txHash?: undefined;
} | {
    success: boolean;
    txHash: any;
    simulation: boolean;
    message?: undefined;
} | {
    success: boolean;
    message: string;
    simulation?: undefined;
    txHash?: undefined;
}>;
/**
 * Record proof of attendance on blockchain
 */
export declare const recordAttendance: (eventId: number, userAddress: string) => Promise<{
    success: boolean;
    simulation: boolean;
    recorded: boolean;
    txHash?: undefined;
    message?: undefined;
} | {
    success: boolean;
    txHash: any;
    simulation: boolean;
    recorded?: undefined;
    message?: undefined;
} | {
    success: boolean;
    message: string;
    simulation?: undefined;
    recorded?: undefined;
    txHash?: undefined;
}>;
/**
 * Get user's transaction history from blockchain
 */
export declare const getBlockchainTransactionHistory: (userAddress: string) => Promise<{
    success: boolean;
    data: any;
    simulation: boolean;
    message?: undefined;
} | {
    success: boolean;
    message: string;
    data?: undefined;
    simulation?: undefined;
}>;
/**
 * Get the underlying provider (if configured)
 */
export declare const getProvider: () => ethers.JsonRpcProvider | null;
//# sourceMappingURL=index.d.ts.map