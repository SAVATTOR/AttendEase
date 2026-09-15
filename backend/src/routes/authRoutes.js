const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');
const { checkLoginCooldown, getCooldownStatus } = require('../middleware/loginCooldown');
const { validateRequest } = require('../middleware/validateRequest');
const { body } = require('express-validator');

const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('role')
    .optional()
    .isIn(['STUDENT', 'TEACHER'])
    .withMessage('Role must be STUDENT or TEACHER'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

router.post(
  '/register',
  registerValidation,
  validateRequest,
  authController.register
);

const verifyEmailValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .matches(/^\d+$/)
    .withMessage('Verification code must contain only numbers'),
];

const resendCodeValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
];

const sendPreRegistrationCodeValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('role')
    .optional()
    .isIn(['STUDENT', 'TEACHER'])
    .withMessage('Role must be STUDENT or TEACHER'),
];

router.post(
  '/send-pre-registration-code',
  sendPreRegistrationCodeValidation,
  validateRequest,
  authController.sendPreRegistrationCode
);

router.post(
  '/verify-email',
  verifyEmailValidation,
  validateRequest,
  authController.verifyEmail
);

router.post(
  '/resend-verification',
  resendCodeValidation,
  validateRequest,
  authController.resendVerificationCode
);

const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits')
    .matches(/^\d+$/)
    .withMessage('Reset code must contain only numbers'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
];

router.post(
  '/forgot-password',
  forgotPasswordValidation,
  validateRequest,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  resetPasswordValidation,
  validateRequest,
  authController.resetPassword
);

router.post(
  '/login',
  loginValidation,
  validateRequest,
  checkLoginCooldown,
  authController.login
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll
);

router.get(
  '/me',
  authenticate,
  authController.me
);

router.get(
  '/cooldown-status',
  getCooldownStatus
);

// Test helper endpoint (only in development)
if (process.env.NODE_ENV !== 'production') {
  router.post('/test/clear-sessions', authController.clearTestSessions);
}

module.exports = router;