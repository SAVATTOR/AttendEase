const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/authenticate');
const { validateRequest } = require('../middleware/validateRequest');
const { body } = require('express-validator');

const updateSettingsValidation = [
    body('emailNotifications')
        .optional()
        .isBoolean()
        .withMessage('Email notifications must be a boolean'),
    body('sessionReminders')
        .optional()
        .isBoolean()
        .withMessage('Session reminders must be a boolean'),
    body('defaultSessionDuration')
        .optional()
        .isInt({ min: 5, max: 180 })
        .withMessage('Session duration must be between 5 and 180 minutes'),
    body('defaultAllowedRadius')
        .optional()
        .isInt({ min: 10, max: 500 })
        .withMessage('Allowed radius must be between 10 and 500 meters'),
    body('lateThresholdMinutes')
        .optional()
        .isInt({ min: 1, max: 60 })
        .withMessage('Late threshold must be between 1 and 60 minutes'),
];

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
        .withMessage('Password must contain uppercase, lowercase, and number'),
    body('confirmPassword')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match'),
];

const deleteAccountValidation = [
    body('password')
        .notEmpty()
        .withMessage('Password is required to delete account'),
];

// Get user settings
router.get(
    '/',
    authenticate,
    settingsController.getUserSettings
);

// Update user settings
router.put(
    '/',
    authenticate,
    updateSettingsValidation,
    validateRequest,
    settingsController.updateUserSettings
);

// Update profile
router.put(
    '/profile',
    authenticate,
    updateProfileValidation,
    validateRequest,
    settingsController.updateProfile
);

// Change password
router.put(
    '/password',
    authenticate,
    changePasswordValidation,
    validateRequest,
    settingsController.changePassword
);

// Delete account
router.delete(
    '/account',
    authenticate,
    deleteAccountValidation,
    validateRequest,
    settingsController.deleteAccount
);

module.exports = router;