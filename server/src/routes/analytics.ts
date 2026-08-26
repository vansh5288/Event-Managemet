import { Router, Response, NextFunction } from 'express';
import { Event, EventStatus } from '../models/Event';
import { Registration, RegistrationStatus } from '../models/Registration';
import { Payment, PaymentStatus } from '../models/Payment';
import { User, UserRole } from '../models/User';
import { Review } from '../models/Review';
import { Sponsor } from '../models/Sponsor';
import { Certificate } from '../models/Certificate';
import { Notification } from '../models/Notification';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const queryFilter = isAdmin ? {} : { organizer: req.userId };

    // Get events for the user (needed for registrations/sponsors filtering)
    const userEvents = await Event.find(queryFilter).select('_id');
    const userEventIds = userEvents.map((e) => e._id);
    const regFilter = isAdmin ? {} : { event: { $in: userEventIds } };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalEvents,
      activeEvents,
      completedEvents,
      upcomingEvents,
      cancelledEvents,
      todayEvents,
      totalRegistrations,
      checkedInRegistrations,
      totalRevenue,
      successfulPayments,
      pendingPayments,
      averageRating,
      totalSponsors,
      totalVolunteers,
      totalCertificates,
      recentActivity,
      recentRegistrations,
      todaySchedule,
      latestNotifications,
      totalUsers,
      eventGrowth,
      categoryDistribution,
      revenueTrend,
      registrationTrend,
      topEvents,
    ] = await Promise.all([
      Event.countDocuments(queryFilter),
      Event.countDocuments({ ...queryFilter, status: EventStatus.ONGOING }),
      Event.countDocuments({ ...queryFilter, status: EventStatus.COMPLETED }),
      Event.countDocuments({ ...queryFilter, status: EventStatus.PUBLISHED, startDate: { $gt: new Date() } }),
      Event.countDocuments({ ...queryFilter, status: EventStatus.CANCELLED }),
      Event.countDocuments({
        ...queryFilter,
        startDate: { $gte: today },
        endDate: { $lt: tomorrow },
      }),
      Registration.countDocuments(regFilter),
      Registration.countDocuments({ ...regFilter, status: RegistrationStatus.CHECKED_IN }),
      Payment.aggregate([
        { $match: { status: PaymentStatus.SUCCESS } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.countDocuments({ status: PaymentStatus.SUCCESS }),
      Payment.countDocuments({ status: PaymentStatus.PENDING }),
      Review.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }]),
      Sponsor.countDocuments(regFilter),
      User.countDocuments({ role: UserRole.VOLUNTEER, isActive: true }),
      Certificate.countDocuments(isAdmin ? {} : { event: { $in: userEventIds } }),
      Event.find(queryFilter).sort('-updatedAt').limit(5).populate('organizer', 'name'),
      Registration.find(regFilter)
        .sort('-createdAt')
        .limit(5)
        .populate('user', 'name email avatar')
        .populate('event', 'title banner'),
      Event.find({ ...queryFilter, startDate: { $gte: today } }).sort('startDate').limit(5),
      Notification.find({ user: req.userId }).sort('-createdAt').limit(5),
      isAdmin ? User.countDocuments() : Promise.resolve(0),
      Event.aggregate([
        { $match: queryFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      Event.aggregate([
        { $match: queryFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Payment.aggregate([
        { $match: { status: PaymentStatus.SUCCESS } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      Registration.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      Event.find(queryFilter)
        .sort('-registeredCount')
        .limit(5)
        .select('title registeredCount capacity category startDate'),
    ]);

    const totalRegistrationsForRate = totalRegistrations;
    const checkInRate = totalRegistrationsForRate > 0
      ? Math.round((checkedInRegistrations / totalRegistrationsForRate) * 100)
      : 0;
    const paymentSuccessRate = (successfulPayments + pendingPayments) > 0
      ? Math.round((successfulPayments / (successfulPayments + pendingPayments)) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          activeEvents,
          completedEvents,
          upcomingEvents,
          cancelledEvents,
          todayEvents,
          totalRegistrations,
          totalRevenue: totalRevenue[0]?.total || 0,
          successfulPayments,
          pendingPayments,
          averageRating: averageRating[0]?.avgRating || 0,
          totalSponsors,
          totalVolunteers,
          totalCertificates,
          totalUsers: isAdmin ? totalUsers : undefined,
          checkInRate,
          paymentSuccessRate,
        },
        charts: {
          eventGrowth,
          categoryDistribution,
          revenueTrend,
          registrationTrend,
          topEvents,
        },
        recentActivity,
        recentRegistrations,
        todaySchedule,
        latestNotifications,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/revenue', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const queryFilter: any = { status: PaymentStatus.SUCCESS };
    if (!isAdmin) {
      const userEvents = await Event.find({ organizer: req.userId }).select('_id');
      queryFilter.event = { $in: userEvents.map((e) => e._id) };
    }
    const revenue = await Payment.aggregate([
      { $match: queryFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: revenue });
  } catch (error) {
    next(error);
  }
});

router.get('/registrations', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const queryFilter: any = {};
    if (!isAdmin) {
      const userEvents = await Event.find({ organizer: req.userId }).select('_id');
      queryFilter.event = { $in: userEvents.map((e) => e._id) };
    }
    const registrations = await Registration.aggregate([
      { $match: queryFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: registrations });
  } catch (error) {
    next(error);
  }
});

router.get('/events', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const queryFilter = isAdmin ? {} : { organizer: req.userId };

    const events = await Event.find(queryFilter)
      .sort('-registeredCount')
      .limit(10)
      .select('title category status registeredCount capacity rating price startDate');

    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
});

router.get('/top-events', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.userRole === 'admin';
    const queryFilter = isAdmin ? {} : { organizer: req.userId };

    const topEvents = await Event.aggregate([
      { $match: queryFilter },
      { $sort: { registeredCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          registeredCount: 1,
          capacity: 1,
          category: 1,
          rating: 1,
          price: 1,
        },
      },
    ]);

    res.json({ success: true, data: topEvents });
  } catch (error) {
    next(error);
  }
});

export default router;

