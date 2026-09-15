const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validateRequest } = require('../middleware/validateRequest');
const { param, query } = require('express-validator');

const classIdValidation = [
    param('classId').isUUID().withMessage('Invalid class ID'),
];

const sessionIdValidation = [
    param('sessionId').isUUID().withMessage('Invalid session ID'),
];

const dateRangeValidation = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date'),
];

// Export class attendance as CSV (Teacher)
router.get(
    '/class/:classId/csv',
    authenticate,
    authorize('TEACHER'),
    classIdValidation,
    dateRangeValidation,
    validateRequest,
    exportController.exportClassAttendanceCSV
);

// Export session attendance as CSV (Teacher)
router.get(
    '/session/:sessionId/csv',
    authenticate,
    authorize('TEACHER'),
    sessionIdValidation,
    validateRequest,
    exportController.exportSessionAttendanceCSV
);

// Export student's own attendance as CSV (Student)
router.get(
    '/my-attendance/csv',
    authenticate,
    authorize('STUDENT'),
    dateRangeValidation,
    validateRequest,
    exportController.exportStudentAttendanceCSV
);

module.exports = router;