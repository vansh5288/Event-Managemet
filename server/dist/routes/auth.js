"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const User_1 = require("../models/User");
const validate_1 = require("../middleware/validate");
const tokens_1 = require("../utils/tokens");
const email_1 = require("../utils/email");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Signup
router.post('/signup', (0, validate_1.validate)([
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]), async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        const user = await User_1.User.create({ name, email, password });
        const otp = (0, tokens_1.generateOTP)();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await (0, email_1.sendOTPEmail)(email, otp);
        await (0, email_1.sendWelcomeEmail)(email, name);
        const accessToken = (0, tokens_1.generateAccessToken)(user._id.toString(), user.role);
        const refreshToken = (0, tokens_1.generateRefreshToken)(user._id.toString());
        res.status(201).json({
            success: true,
            message: 'Account created. Please verify your email with OTP.',
            data: { user, accessToken, refreshToken },
        });
    }
    catch (error) {
        next(error);
    }
});
// Login
router.post('/login', (0, validate_1.validate)([
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
]), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (!user.isVerified) {
            return res.status(401).json({ success: false, message: 'Please verify your email first' });
        }
        user.lastLogin = new Date();
        await user.save();
        const accessToken = (0, tokens_1.generateAccessToken)(user._id.toString(), user.role);
        const refreshToken = (0, tokens_1.generateRefreshToken)(user._id.toString());
        res.json({
            success: true,
            message: 'Login successful',
            data: { user, accessToken, refreshToken },
        });
    }
    catch (error) {
        next(error);
    }
});
// Verify OTP
router.post('/verify-otp', (0, validate_1.validate)([
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('otp').notEmpty().withMessage('OTP is required'),
]), async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        res.json({ success: true, message: 'Email verified successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Forgot Password
router.post('/forgot-password', (0, validate_1.validate)([(0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required')]), async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const otp = (0, tokens_1.generateOTP)();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await (0, email_1.sendOTPEmail)(email, otp);
        res.json({ success: true, message: 'OTP sent to your email' });
    }
    catch (error) {
        next(error);
    }
});
// Reset Password
router.post('/reset-password', (0, validate_1.validate)([
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('otp').notEmpty().withMessage('OTP is required'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]), async (req, res, next) => {
    try {
        const { email, otp, password } = req.body;
        const user = await User_1.User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        user.password = password;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Get current user
router.get('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await User_1.User.findById(req.userId);
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map