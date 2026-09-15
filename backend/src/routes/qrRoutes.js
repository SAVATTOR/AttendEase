const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validateRequest } = require('../middleware/validateRequest');
const { body, param, query } = require('express-validator');

const generateQRValidation = [
  body('classId').isUUID().withMessage('Invalid class ID'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('duration').optional().isInt({ min: 5, max: 180 }).withMessage('Duration must be between 5 and 180 minutes'),
];

const validateQRValidation = [
  body('token').notEmpty().withMessage('QR token is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

const classIdValidation = [param('classId').isUUID().withMessage('Invalid class ID')];
const sessionIdValidation = [param('sessionId').isUUID().withMessage('Invalid session ID')];

// Generate QR session
router.post(
  '/generate',
  authenticate,
  authorize('TEACHER'),
  generateQRValidation,
  validateRequest,
  qrController.generateQRSession
);

// Get active session for class
router.get(
  '/active/:classId',
  authenticate,
  authorize('TEACHER'),
  classIdValidation,
  validateRequest,
  qrController.getActiveSession
);

// Validate QR code (Student)
router.post(
  '/validate',
  authenticate,
  authorize('STUDENT'),
  validateQRValidation,
  validateRequest,
  qrController.validateQRCode
);

// Pause session
router.post(
  '/:sessionId/pause',
  authenticate,
  authorize('TEACHER'),
  sessionIdValidation,
  validateRequest,
  qrController.pauseSession
);

// Resume session
router.post(
  '/:sessionId/resume',
  authenticate,
  authorize('TEACHER'),
  sessionIdValidation,
  validateRequest,
  qrController.resumeSession
);

// End session
router.delete(
  '/:sessionId',
  authenticate,
  authorize('TEACHER'),
  sessionIdValidation,
  validateRequest,
  qrController.endSession
);

// Get session attendance
router.get(
  '/session/:sessionId/attendance',
  authenticate,
  authorize('TEACHER'),
  sessionIdValidation,
  validateRequest,
  qrController.getSessionAttendance
);

// Get session history for class
router.get(
  '/history/:classId',
  authenticate,
  authorize('TEACHER'),
  classIdValidation,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validateRequest,
  qrController.getSessionHistory
);

// Refresh token manually
router.post(
  '/refresh-token',
  authenticate,
  authorize('TEACHER'),
  [body('sessionId').isUUID().withMessage('Invalid session ID')],
  validateRequest,
  qrController.refreshToken
);

module.exports = router;