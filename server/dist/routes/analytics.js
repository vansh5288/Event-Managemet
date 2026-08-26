"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Event_1 = require("../models/Event");
const Registration_1 = require("../models/Registration");
const Payment_1 = require("../models/Payment");
const User_1 = require("../models/User");
const Review_1 = require("../models/Review");
const Sponsor_1 = require("../models/Sponsor");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/dashboard', auth_1.authenticate, async (req, res, next) => {
    try {
        const isAdmin = req.userRole === 'admin';
        const queryFilter = isAdmin ? {} : { organizer: req.userId };
        const [totalEvents, activeEvents, completedEvents, upcomingEvents, cancelledEvents, todayEvents, totalRegistrations, totalRevenue, successfulPayments, pendingPayments, averageRating, totalSponsors, totalVolunteers, totalCertificates, recentActivity, recentRegistrations, todaySchedule, latestNotifications, totalUsers, eventGrowth,] = await Promise.all([
            Event_1.Event.countDocuments(queryFilter),
            Event_1.Event.countDocuments({ ...queryFilter, status: Event_1.EventStatus.ONGOING }),
            Event_1.Event.countDocuments({ ...queryFilter, status: Event_1.EventStatus.COMPLETED }),
            Event_1.Event.countDocuments({ ...queryFilter, status: Event_1.EventStatus.PUBLISHED, startDate: { $gt: new Date() } }),
            Event_1.Event.countDocuments({ ...queryFilter, status: Event_1.EventStatus.CANCELLED }),
            Event_1.Event.countDocuments({
                ...queryFilter,
                startDate: { $gte: new Date().setHours(0, 0, 0, 0) },
                endDate: { $lte: new Date().setHours(23, 59, 59, 999) },
            }),
            Registration_1.Registration.countDocuments(isAdmin ? {} : { event: { $in: (await Event_1.Event.find(queryFilter)).map(e => e._id) } }),
            Payment_1.Payment.aggregate([
                { $match: { status: Payment_1.PaymentStatus.SUCCESS } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Payment_1.Payment.countDocuments({ status: Payment_1.PaymentStatus.SUCCESS }),
            Payment_1.Payment.countDocuments({ status: Payment_1.PaymentStatus.PENDING }),
            Review_1.Review.aggregate([
                { $group: { _id: null, avgRating: { $avg: '$rating' } } },
            ]),
            Sponsor_1.Sponsor.countDocuments(isAdmin ? {} : { event: { $in: (await Event_1.Event.find(queryFilter)).map(e => e._id) } }),
            0, // Volunteers
            0, // Certificates
            Event_1.Event.find(queryFilter).sort('-updatedAt').limit(5).populate('organizer', 'name'),
            Registration_1.Registration.find(isAdmin ? {} : { event: { $in: (await Event_1.Event.find(queryFilter)).map(e => e._id) } })
                .sort('-createdAt').limit(5).populate('user', 'name email').populate('event', 'title'),
            Event_1.Event.find({ ...queryFilter, startDate: { $gte: new Date() } }).sort('startDate').limit(5),
            [], // Notifications
            User_1.User.countDocuments(),
            Event_1.Event.aggregate([
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
        ]);
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
                    checkInRate: 0,
                },
                charts: {
                    eventGrowth,
                },
                recentActivity,
                recentRegistrations,
                todaySchedule,
                latestNotifications,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/revenue', auth_1.authenticate, async (req, res, next) => {
    try {
        const revenue = await Payment_1.Payment.aggregate([
            { $match: { status: Payment_1.PaymentStatus.SUCCESS } },
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/registrations', auth_1.authenticate, async (req, res, next) => {
    try {
        const registrations = await Registration_1.Registration.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.json({ success: true, data: registrations });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map