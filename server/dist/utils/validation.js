"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventValidations = exports.commonValidations = void 0;
const express_validator_1 = require("express-validator");
exports.commonValidations = {
    email: (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    password: (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    name: (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    phone: (0, express_validator_1.body)('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
    url: (0, express_validator_1.body)('url').optional().isURL().withMessage('Valid URL is required'),
    date: (0, express_validator_1.body)('date').isISO8601().withMessage('Valid date is required'),
    id: (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid ID format'),
    eventId: (0, express_validator_1.param)('eventId').isMongoId().withMessage('Invalid event ID'),
    page: (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    limit: (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
};
exports.eventValidations = {
    title: (0, express_validator_1.body)('title').trim().notEmpty().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    description: (0, express_validator_1.body)('description').trim().notEmpty().isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
    shortDescription: (0, express_validator_1.body)('shortDescription').trim().notEmpty().isLength({ max: 300 }).withMessage('Short description cannot exceed 300 characters'),
    category: (0, express_validator_1.body)('category').notEmpty().withMessage('Category is required'),
    startDate: (0, express_validator_1.body)('startDate').isISO8601().withMessage('Valid start date is required'),
    endDate: (0, express_validator_1.body)('endDate').isISO8601().withMessage('Valid end date is required'),
    capacity: (0, express_validator_1.body)('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    price: (0, express_validator_1.body)('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
};
//# sourceMappingURL=validation.js.map