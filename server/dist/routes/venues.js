"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Venue_1 = require("../models/Venue");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all venues
router.get('/', async (req, res, next) => {
    try {
        const { page = '1', limit = '20', city, country, isActive } = req.query;
        const query = {};
        if (city)
            query.city = city;
        if (country)
            query.country = country;
        if (isActive !== undefined)
            query.isActive = isActive === 'true';
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [venues, total] = await Promise.all([
            Venue_1.Venue.find(query).sort('-createdAt').skip(skip).limit(limitNum),
            Venue_1.Venue.countDocuments(query),
        ]);
        res.json({
            success: true,
            data: venues,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// Get single venue
router.get('/:id', async (req, res, next) => {
    try {
        const venue = await Venue_1.Venue.findById(req.params.id);
        if (!venue) {
            return res.status(404).json({ success: false, message: 'Venue not found' });
        }
        res.json({ success: true, data: venue });
    }
    catch (error) {
        next(error);
    }
});
// Create venue
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const venue = await Venue_1.Venue.create(req.body);
        res.status(201).json({ success: true, data: venue });
    }
    catch (error) {
        next(error);
    }
});
// Update venue
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const venue = await Venue_1.Venue.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!venue) {
            return res.status(404).json({ success: false, message: 'Venue not found' });
        }
        res.json({ success: true, data: venue });
    }
    catch (error) {
        next(error);
    }
});
// Delete venue
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'organizer'), async (req, res, next) => {
    try {
        const venue = await Venue_1.Venue.findByIdAndDelete(req.params.id);
        if (!venue) {
            return res.status(404).json({ success: false, message: 'Venue not found' });
        }
        res.json({ success: true, message: 'Venue deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=venues.js.map