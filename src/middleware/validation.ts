import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation error', details: errors.array() });
    return;
  }
  next();
};

export const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('attendeeType')
    .isIn(['general', 'speaker', 'sponsor', 'vip'])
    .withMessage('Invalid attendee type'),
  validateRequest
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

export const areaValidation = [
  body('name')
    .notEmpty()
    .withMessage('Area name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Area name must be between 2 and 200 characters'),
  validateRequest
];

export const profileUpdateValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('company').optional(),
  body('jobTitle').optional(),
  body('attendeeType')
    .optional()
    .isIn(['general', 'speaker', 'sponsor', 'vip'])
    .withMessage('Invalid attendee type'),
  validateRequest
];
