const { body, param, query } = require('express-validator');

const emailValidator = body('email')
  .trim()
  .isEmail()
  .withMessage('Invalid email format')
  .normalizeEmail();

const passwordValidator = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');

const nameValidator = body('name')
  .trim()
  .notEmpty()
  .withMessage('Name is required')
  .isLength({ min: 2, max: 100 })
  .withMessage('Name must be between 2 and 100 characters');

const uuidParamValidator = (paramName) =>
  param(paramName).isUUID().withMessage(`Invalid ${paramName} format`);

const coordinateValidators = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  emailValidator,
  passwordValidator,
  nameValidator,
  uuidParamValidator,
  coordinateValidators,
  paginationValidators,
};