const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validateRequest } = require('../middleware/validateRequest');
const { body, param, query } = require('express-validator');

const markAttendanceValidation = [
  body('token')
    .notEmpty()
    .withMessage('QR token is required'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
];

const classIdValidation = [
  param('id').isUUID().withMessage('Invalid class ID'),
];

const filterValidation = [
  query('classId').optional().isUUID().withMessage('Invalid class ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('status')
    .optional()
    .isIn(['PRESENT', 'LATE', 'ABSENT', 'INVALID_LOCATION'])
    .withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
];

router.post(
  '/mark',
  authenticate,
  authorize('STUDENT'),
  markAttendanceValidation,
  validateRequest,
  attendanceController.markAttendance
);

router.get(
  '/my',
  authenticate,
  authorize('STUDENT'),
  filterValidation,
  validateRequest,
  attendanceController.getMyAttendance
);

router.get(
  '/class/:id',
  authenticate,
  authorize('TEACHER'),
  classIdValidation,
  filterValidation,
  validateRequest,
  attendanceController.getClassAttendance
);

router.get(
  '/stats',
  authenticate,
  attendanceController.getAttendanceStats
);

module.exports = router;