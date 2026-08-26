import { Router, Request, Response, NextFunction } from 'express';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ExportService } from '../services/export.service';

const router = Router();

// Get report summary data
router.get('/summary', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const eventQuery = isAdmin ? {} : { organizer: req.userId };

    const events = await Event.find(eventQuery).lean();
    const eventIds = events.map((e) => e._id);

    const registrations = await Registration.find(isAdmin ? {} : { event: { $in: eventIds } })
      .populate('user', 'name email')
      .populate('event', 'title category startDate endDate')
      .populate('ticket', 'name type price')
      .lean();

    const payments = await Payment.find(isAdmin ? {} : { event: { $in: eventIds } })
      .populate('user', 'name email')
      .populate('event', 'title')
      .lean();

    const users = await User.find().select('name email role createdAt isActive').lean();

    res.json({
      success: true,
      data: {
        events,
        registrations,
        payments,
        users,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Export registrations as CSV / XLSX / PDF
router.get('/registrations/export', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const format = String(req.query.format || 'csv');
    const isAdmin = req.userRole === 'admin';
    const eventQuery = isAdmin ? {} : { organizer: req.userId };
    const eventIds = (await Event.find(eventQuery).select('_id')).map((e) => e._id);

    const registrations = await Registration.find(isAdmin ? {} : { event: { $in: eventIds } })
      .populate('user', 'name email')
      .populate('event', 'title')
      .populate('ticket', 'name')
      .lean();

    const data = registrations.map((reg: any) => ({
      'User Name': reg.user?.name || 'N/A',
      'User Email': reg.user?.email || 'N/A',
      'Event': reg.event?.title || 'N/A',
      'Ticket': reg.ticket?.name || 'N/A',
      'Quantity': reg.quantity,
      'Total Price': reg.totalPrice,
      'Currency': reg.currency,
      'Status': reg.status,
      'Registered At': new Date(reg.createdAt).toISOString(),
    }));

    if (format === 'xlsx') {
      const buf = ExportService.toXLSX(data, 'registrations');
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="registrations-${Date.now()}.xls"`);
      return res.send(buf);
    }
    if (format === 'pdf') {
      const buf = ExportService.toPDF('Event Registrations Report', data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="registrations-${Date.now()}.pdf"`);
      return res.send(buf);
    }
    const csv = ExportService.toCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="registrations-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export payments as CSV / XLSX / PDF
router.get('/payments/export', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const format = String(req.query.format || 'csv');
    const isAdmin = req.userRole === 'admin';
    const eventQuery = isAdmin ? {} : { organizer: req.userId };
    const eventIds = (await Event.find(eventQuery).select('_id')).map((e) => e._id);

    const payments = await Payment.find(isAdmin ? {} : { event: { $in: eventIds } })
      .populate('user', 'name email')
      .populate('event', 'title')
      .lean();

    const data = payments.map((p: any) => ({
      'Invoice': p.invoiceNumber || 'N/A',
      'User': p.user?.name || 'N/A',
      'Event': p.event?.title || 'N/A',
      'Amount': p.amount,
      'Currency': p.currency,
      'Gateway': p.gateway,
      'Status': p.status,
      'Date': new Date(p.createdAt).toISOString(),
    }));

    if (format === 'xlsx') {
      const buf = ExportService.toXLSX(data, 'payments');
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.xls"`);
      return res.send(buf);
    }
    if (format === 'pdf') {
      const buf = ExportService.toPDF('Event Payments Report', data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.pdf"`);
      return res.send(buf);
    }
    const csv = ExportService.toCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export events as CSV / XLSX / PDF
router.get('/events/export', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const format = String(req.query.format || 'csv');
    const isAdmin = req.userRole === 'admin';
    const eventQuery = isAdmin ? {} : { organizer: req.userId };

    const events = await Event.find(eventQuery).lean();

    const data = events.map((e: any) => ({
      'Title': e.title,
      'Category': e.category,
      'Status': e.status,
      'Start Date': new Date(e.startDate).toISOString(),
      'End Date': new Date(e.endDate).toISOString(),
      'Capacity': e.capacity,
      'Registered': e.registeredCount,
      'Price': e.price,
      'Currency': e.currency,
      'City': e.location?.city || '',
      'Country': e.location?.country || '',
      'Created': new Date(e.createdAt).toISOString(),
    }));

    if (format === 'xlsx') {
      const buf = ExportService.toXLSX(data, 'events');
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="events-${Date.now()}.xls"`);
      return res.send(buf);
    }
    if (format === 'pdf') {
      const buf = ExportService.toPDF('Events Report', data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="events-${Date.now()}.pdf"`);
      return res.send(buf);
    }
    const csv = ExportService.toCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="events-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;

