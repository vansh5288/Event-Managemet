import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { Wallet } from '../models/Wallet';
import { Transaction, TransactionType, TransactionStatus } from '../models/Transaction';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Get or create user's wallet
const getOrCreateWallet = async (userId: string) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
};

// Get my wallet + transactions
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const wallet = await getOrCreateWallet(req.userId!);
    const transactions = await Transaction.find({ wallet: wallet._id }).sort('-createdAt').limit(50);
    res.json({ success: true, data: { wallet, transactions } });
  } catch (error) {
    next(error);
  }
});

// Credit wallet (rewards, admin)
router.post(
  '/credit',
  authenticate,
  authorize('admin', 'organizer'),
  validate([
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, amount, description, reference } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' });
      }
      const wallet = await getOrCreateWallet(userId);
      wallet.balance += Number(amount);
      await wallet.save();

      const transaction = await Transaction.create({
        wallet: wallet._id,
        user: userId,
        type: TransactionType.CREDIT,
        amount: Number(amount),
        currency: wallet.currency,
        description,
        reference,
        status: TransactionStatus.COMPLETED,
      });

      res.json({ success: true, data: { wallet, transaction } });
    } catch (error) {
      next(error);
    }
  }
);

// Debit wallet (payments, admin/organizer with balance)
router.post(
  '/debit',
  authenticate,
  validate([
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { amount, description, reference } = req.body;
      const wallet = await getOrCreateWallet(req.userId!);

      if (wallet.balance < amount) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }

      wallet.balance -= Number(amount);
      await wallet.save();

      const transaction = await Transaction.create({
        wallet: wallet._id,
        user: req.userId,
        type: TransactionType.DEBIT,
        amount: Number(amount),
        currency: wallet.currency,
        description,
        reference,
        status: TransactionStatus.COMPLETED,
      });

      res.json({ success: true, data: { wallet, transaction } });
    } catch (error) {
      next(error);
    }
  }
);

// Get all wallets (admin)
router.get('/', authenticate, authorize('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const wallets = await Wallet.find().populate('user', 'name email');
    res.json({ success: true, data: wallets });
  } catch (error) {
    next(error);
  }
});

export default router;

