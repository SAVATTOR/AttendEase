const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authenticate');
const { validateRequest } = require('../middleware/validateRequest');
const { body, param } = require('express-validator');

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain uppercase, lowercase, and number'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];

const userIdValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
];

router.get(
  '/profile',
  authenticate,
  userController.getProfile
);

router.put(
  '/profile',
  authenticate,
  updateProfileValidation,
  validateRequest,
  userController.updateProfile
);

router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validateRequest,
  userController.changePassword
);

router.get(
  '/dashboard-stats',
  authenticate,
  userController.getDashboardStats
);

router.get(
  '/:id',
  authenticate,
  userIdValidation,
  validateRequest,
  userController.getUserById
);

router.delete(
  '/account',
  authenticate,
  userController.deleteAccount
);

module.exports = router;