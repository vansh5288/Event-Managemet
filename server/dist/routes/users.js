"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all users (admin)
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const users = await User_1.User.find().sort('-createdAt');
        res.json({ success: true, data: users });
    }
    catch (error) {
        next(error);
    }
});
// Get user by ID
router.get('/:id', async (req, res, next) => {
    try {
        const user = await User_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
// Update user profile
router.put('/profile', auth_1.authenticate, async (req, res, next) => {
    try {
        const allowedFields = ['name', 'bio', 'phone', 'organization', 'socialLinks', 'preferences', 'avatar'];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        const user = await User_1.User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
// Update role (admin)
router.patch('/:id/role', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const user = await User_1.User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
// Deactivate user (admin)
router.patch('/:id/deactivate', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const user = await User_1.User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map