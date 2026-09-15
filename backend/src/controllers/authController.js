const authService = require('../services/authService');
const ApiError = require('../utils/ApiError');

const register = async (req, res, next) => {
  try {
    const { email, password, name, role, indexNumber, session, program } = req.body;

    const result = await authService.register({
      email,
      password,
      name,
      role,
      // Student-specific fields (optional)
      indexNumber: role === 'STUDENT' ? indexNumber : undefined,
      session: role === 'STUDENT' ? session : undefined,
      program: role === 'STUDENT' ? program : undefined,
    });

    res.status(201).json({
      success: true,
      message: result.message || 'Registration successful. Please check your email for verification code.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    const result = await authService.verifyEmail({ email, code });

    res.status(200).json({
      success: true,
      message: result.message || 'Email verified successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const sendPreRegistrationCode = async (req, res, next) => {
  try {
    const { email, name, role } = req.body;

    const result = await authService.sendPreRegistrationCode({ email, name, role });

    res.status(200).json({
      success: true,
      message: result.message || 'Verification code sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

const resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.resendVerificationCode({ email });

    res.status(200).json({
      success: true,
      message: result.message || 'Verification code sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.token);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Test helper: Clear sessions for test accounts (only in development)
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPassword({ email });

    res.status(200).json({
      success: true,
      message: result.message || 'If an account exists with this email, a password reset code has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    const result = await authService.resetPassword({ email, code, newPassword });

    res.status(200).json({
      success: true,
      message: result.message || 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

const clearTestSessions = async (req, res, next) => {
  try {
    // Only allow in development/test environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is not available in production',
      });
    }

    const { prisma } = require('../config/database');

    // Get test user IDs
    const teacher = await prisma.user.findUnique({
      where: { email: 'teacher1@school.edu' },
      select: { id: true },
    });

    const student = await prisma.user.findUnique({
      where: { email: 'student1@school.edu' },
      select: { id: true },
    });

    let clearedCount = 0;

    // Clear all active sessions for test accounts
    if (teacher) {
      const result = await prisma.loginSession.updateMany({
        where: { userId: teacher.id },
        data: { isActive: false },
      });
      clearedCount += result.count;
    }

    if (student) {
      const result = await prisma.loginSession.updateMany({
        where: { userId: student.id },
        data: { isActive: false },
      });
      clearedCount += result.count;
    }

    res.status(200).json({
      success: true,
      message: `Cleared ${clearedCount} test sessions`,
      data: { clearedCount },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  sendPreRegistrationCode,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  login,
  logout,
  logoutAll,
  me,
  clearTestSessions,
};