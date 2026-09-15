const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validateRequest } = require('../middleware/validateRequest');
const { body, param, query } = require('express-validator');

const createClassValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Class name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('schedule')
    .optional()
    .isObject()
    .withMessage('Schedule must be an object'),
  body('allowedRadius')
    .optional()
    .isInt({ min: 10, max: 1000 })
    .withMessage('Allowed radius must be between 10 and 1000 meters'),
];

const updateClassValidation = [
  param('id').isUUID().withMessage('Invalid class ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Class name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('schedule')
    .optional()
    .isObject()
    .withMessage('Schedule must be an object'),
  body('allowedRadius')
    .optional()
    .isInt({ min: 10, max: 1000 })
    .withMessage('Allowed radius must be between 10 and 1000 meters'),
];

const classIdValidation = [
  param('id').isUUID().withMessage('Invalid class ID'),
];

const enrollValidation = [
  body('classCode')
    .trim()
    .notEmpty()
    .withMessage('Class code is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Invalid class code format'),
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

router.get(
  '/',
  authenticate,
  paginationValidation,
  validateRequest,
  classController.getMyClasses
);

router.get(
  '/:id',
  authenticate,
  classIdValidation,
  validateRequest,
  classController.getClassById
);

router.post(
  '/',
  authenticate,
  authorize('TEACHER'),
  createClassValidation,
  validateRequest,
  classController.createClass
);

router.put(
  '/:id',
  authenticate,
  authorize('TEACHER'),
  updateClassValidation,
  validateRequest,
  classController.updateClass
);

router.delete(
  '/:id',
  authenticate,
  authorize('TEACHER'),
  classIdValidation,
  validateRequest,
  classController.deleteClass
);

router.post(
  '/enroll',
  authenticate,
  authorize('STUDENT'),
  enrollValidation,
  validateRequest,
  classController.enrollInClass
);

router.delete(
  '/:id/unenroll',
  authenticate,
  authorize('STUDENT'),
  classIdValidation,
  validateRequest,
  classController.unenrollFromClass
);

router.get(
  '/:id/students',
  authenticate,
  authorize('TEACHER'),
  classIdValidation,
  paginationValidation,
  validateRequest,
  classController.getClassStudents
);

router.delete(
  '/:id/students/:studentId',
  authenticate,
  authorize('TEACHER'),
  [
    param('id').isUUID().withMessage('Invalid class ID'),
    param('studentId').isUUID().withMessage('Invalid student ID'),
  ],
  validateRequest,
  classController.removeStudent
);

router.get(
  '/students/:studentId/other-classes',
  authenticate,
  authorize('TEACHER'),
  [param('studentId').isUUID().withMessage('Invalid student ID')],
  validateRequest,
  classController.getStudentOtherClasses
);

router.get(
  '/:id/pending-enrollments',
  authenticate,
  authorize('TEACHER'),
  classIdValidation,
  paginationValidation,
  validateRequest,
  classController.getPendingEnrollments
);

router.put(
  '/:id/enrollments/:studentId/approve',
  authenticate,
  authorize('TEACHER'),
  [
    param('id').isUUID().withMessage('Invalid class ID'),
    param('studentId').isUUID().withMessage('Invalid student ID'),
  ],
  validateRequest,
  classController.approveEnrollment
);

router.put(
  '/:id/enrollments/:studentId/reject',
  authenticate,
  authorize('TEACHER'),
  [
    param('id').isUUID().withMessage('Invalid class ID'),
    param('studentId').isUUID().withMessage('Invalid student ID'),
  ],
  validateRequest,
  classController.rejectEnrollment
);

router.post(
  '/:id/regenerate-code',
  authenticate,
  authorize('TEACHER'),
  classIdValidation,
  validateRequest,
  classController.regenerateClassCode
);

// Bulk approve all pending enrollments
router.put(
  '/:id/enrollments/approve-all',
  authenticate,
  authorize('TEACHER'),
  classIdValidation,
  validateRequest,
  classController.approveAllEnrollments
);

// Bulk remove all students from class
router.delete(
  '/:id/students',
  authenticate,
  authorize('TEACHER'),
  classIdValidation,
  validateRequest,
  classController.removeAllStudents
);

module.exports = router;