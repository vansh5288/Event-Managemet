"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const blockchain_1 = require("../blockchain");
const router = (0, express_1.Router)();
// Mint NFT Ticket
router.post('/mint-ticket', auth_1.authenticate, async (req, res, next) => {
    try {
        const { userAddress, eventName, ticketId } = req.body;
        if (!userAddress || !eventName || !ticketId) {
            return res.status(400).json({ success: false, message: 'userAddress, eventName, and ticketId are required' });
        }
        const result = await (0, blockchain_1.mintNFTTicket)(userAddress, eventName, ticketId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
// Verify Certificate on Blockchain
router.post('/verify-certificate', async (req, res, next) => {
    try {
        const { certificateId } = req.body;
        if (!certificateId) {
            return res.status(400).json({ success: false, message: 'certificateId is required' });
        }
        const result = await (0, blockchain_1.verifyCertificateOnChain)(certificateId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
// Distribute Rewards
router.post('/distribute-rewards', auth_1.authenticate, async (req, res, next) => {
    try {
        const { userAddresses, amount } = req.body;
        if (!userAddresses || !Array.isArray(userAddresses) || !amount) {
            return res.status(400).json({ success: false, message: 'userAddresses array and amount are required' });
        }
        const result = await (0, blockchain_1.distributeRewards)(userAddresses, amount);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
// Record Attendance on Blockchain
router.post('/record-attendance', auth_1.authenticate, async (req, res, next) => {
    try {
        const { eventId, userAddress } = req.body;
        if (!eventId || !userAddress) {
            return res.status(400).json({ success: false, message: 'eventId and userAddress are required' });
        }
        const result = await (0, blockchain_1.recordAttendance)(eventId, userAddress);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
// Get Blockchain Transaction History
router.get('/transactions/:userAddress', auth_1.authenticate, async (req, res, next) => {
    try {
        const userAddress = String(req.params.userAddress);
        const result = await (0, blockchain_1.getBlockchainTransactionHistory)(userAddress);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=blockchain.js.map