import { body, param, query } from 'express-validator';

export const commonValidations = {
  email: body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  password: body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  name: body('name').trim().notEmpty().withMessage('Name is required'),
  phone: body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
  url: body('url').optional().isURL().withMessage('Valid URL is required'),
  date: body('date').isISO8601().withMessage('Valid date is required'),
  id: param('id').isMongoId().withMessage('Invalid ID format'),
  eventId: param('eventId').isMongoId().withMessage('Invalid event ID'),
  page: query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  limit: query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
};

export const eventValidations = {
  title: body('title').trim().notEmpty().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  description: body('description').trim().notEmpty().isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  shortDescription: body('shortDescription').trim().notEmpty().isLength({ max: 300 }).withMessage('Short description cannot exceed 300 characters'),
  category: body('category').notEmpty().withMessage('Category is required'),
  startDate: body('startDate').isISO8601().withMessage('Valid start date is required'),
  endDate: body('endDate').isISO8601().withMessage('Valid end date is required'),
  capacity: body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  price: body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
};
