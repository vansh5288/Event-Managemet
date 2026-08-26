import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { Coupon, DiscountType } from '../models/Coupon';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Get all coupons (admin) with optional event filter
router.get('/', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { event } = req.query;
    const query: any = req.userRole === 'admin' ? {} : { event };
    if (event) query.event = event;

    const coupons = await Coupon.find(query).sort('-createdAt');
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
});

// Validate a coupon code (public, for checkout)
router.get('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, event, amount } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon' });
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return res.status(400).json({ success: false, message: 'Coupon is not yet valid' });
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    if (event && coupon.event && coupon.event.toString() !== String(event)) {
      return res.status(400).json({ success: false, message: 'Coupon not valid for this event' });
    }

    const purchaseAmount = Number(amount) || 0;
    if (coupon.minPurchase && purchaseAmount < coupon.minPurchase) {
      return res.status(400).json({ success: false, message: `Minimum purchase of ${coupon.minPurchase} required` });
    }

    const discount =
      coupon.type === DiscountType.PERCENTAGE
        ? (purchaseAmount * coupon.value) / 100
        : coupon.value;
    const finalDiscount = coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
    const finalAmount = Math.max(0, purchaseAmount - finalDiscount);

    res.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount: finalDiscount,
        finalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create coupon (admin/organizer)
router.post(
  '/',
  authenticate,
  authorize('admin', 'organizer'),
  validate([
    body('code').trim().notEmpty().withMessage('Coupon code is required'),
    body('type').isIn(Object.values(DiscountType)).withMessage('Invalid discount type'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be positive'),
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const existing = await Coupon.findOne({ code: String(req.body.code).toUpperCase() });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Coupon code already exists' });
      }
      const coupon = await Coupon.create({ ...req.body, code: String(req.body.code).toUpperCase() });
      res.status(201).json({ success: true, data: coupon });
    } catch (error) {
      next(error);
    }
  }
);

// Update coupon
router.put('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Delete coupon
router.delete('/:id', authenticate, authorize('admin', 'organizer'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

