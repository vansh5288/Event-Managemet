import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  mintNFTTicket,
  verifyCertificateOnChain,
  distributeRewards,
  recordAttendance,
  getBlockchainTransactionHistory,
} from '../blockchain';

const router = Router();

// Mint NFT Ticket
router.post('/mint-ticket', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userAddress, eventName, ticketId } = req.body;
    if (!userAddress || !eventName || !ticketId) {
      return res.status(400).json({ success: false, message: 'userAddress, eventName, and ticketId are required' });
    }

    const result = await mintNFTTicket(userAddress, eventName, ticketId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Verify Certificate on Blockchain
router.post('/verify-certificate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { certificateId } = req.body;
    if (!certificateId) {
      return res.status(400).json({ success: false, message: 'certificateId is required' });
    }

    const result = await verifyCertificateOnChain(certificateId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Distribute Rewards
router.post('/distribute-rewards', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userAddresses, amount, eventId } = req.body;
    if (!userAddresses || !Array.isArray(userAddresses) || !amount) {
      return res.status(400).json({ success: false, message: 'userAddresses array and amount are required' });
    }

    const result = await distributeRewards(userAddresses, amount, eventId ? Number(eventId) : undefined);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Record Attendance on Blockchain
router.post('/record-attendance', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { eventId, userAddress } = req.body;
    if (!eventId || !userAddress) {
      return res.status(400).json({ success: false, message: 'eventId and userAddress are required' });
    }

    const result = await recordAttendance(eventId, userAddress);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Get Blockchain Transaction History
router.get('/transactions/:userAddress', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userAddress = String(req.params.userAddress);
    const result = await getBlockchainTransactionHistory(userAddress);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
