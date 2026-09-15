const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./emailService');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async ({ email, password, name, role, indexNumber, session, program }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw ApiError.badRequest('Please send verification code first');
  }

  if (!user.isEmailVerified) {
    throw ApiError.badRequest('Please verify your email first');
  }

  // Update password and student-specific fields (user was created during sendPreRegistrationCode)
  const hashedPassword = await hashPassword(password);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      // Student-specific fields
      ...(role === 'STUDENT' && {
        indexNumber: indexNumber || null,
        session: session || null,
        program: program || null,
      }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      indexNumber: true,
      session: true,
      program: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  // Create login session
  const token = generateToken(updatedUser.id, updatedUser.role);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.loginSession.create({
    data: {
      userId: updatedUser.id,
      token,
      expiresAt,
      isActive: true,
    },
  });

  return {
    user: updatedUser,
    token,
    message: 'Registration successful',
  };
};

const login = async ({ email, password, deviceId }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isEmailVerified) {
    throw ApiError.forbidden('Please verify your email before logging in. Check your inbox for the verification code.');
  }

  await prisma.loginSession.updateMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  const token = generateToken(user.id, user.role);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.loginSession.create({
    data: {
      userId: user.id,
      token,
      deviceId: deviceId || null,
      expiresAt,
    },
  });

  const { password: _, emailVerificationCode: __, emailVerificationCodeExpiresAt: ___, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

const verifyEmail = async ({ email, code }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email already verified');
  }

  if (!user.emailVerificationCode) {
    throw ApiError.badRequest('No verification code found. Please request a new one.');
  }

  if (user.emailVerificationCode !== code) {
    throw ApiError.unauthorized('Invalid verification code');
  }

  if (user.emailVerificationCodeExpiresAt && new Date() > user.emailVerificationCodeExpiresAt) {
    throw ApiError.badRequest('Verification code has expired. Please request a new one.');
  }

  // Mark email as verified and clear verification code
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpiresAt: null,
    },
  });

  return {
    message: 'Email verified successfully. You can now log in.',
  };
};

// Send verification code before registration (for signup flow)
const sendPreRegistrationCode = async ({ email, name, role }) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    if (existingUser.isEmailVerified) {
      throw ApiError.conflict('Email already registered and verified');
    }
    // User exists but not verified - update code
    const verificationCode = generateVerificationCode();
    const codeExpiresAt = new Date();
    codeExpiresAt.setMinutes(codeExpiresAt.getMinutes() + 10);

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpiresAt: codeExpiresAt,
        name: name, // Update name with latest input
        role: role || existingUser.role, // Update role if provided
      },
    });

    try {
      await sendVerificationEmail(updatedUser.email, updatedUser.name, verificationCode);
      return { message: 'Verification code sent to your email' };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw ApiError.internal('Failed to send verification email');
    }
  }

  // User doesn't exist - create temporary user record
  const verificationCode = generateVerificationCode();
  const codeExpiresAt = new Date();
  codeExpiresAt.setMinutes(codeExpiresAt.getMinutes() + 10);

  // Create user with temporary password (will be set during registration)
  const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const hashedPassword = await hashPassword(tempPassword);

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword, // Temporary, will be updated during registration
      name,
      role: role || 'STUDENT',
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpiresAt: codeExpiresAt,
    },
  });

  try {
    await sendVerificationEmail(email, name, verificationCode);
    return { message: 'Verification code sent to your email' };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Clean up created user if email fails
    await prisma.user.delete({ where: { email: email.toLowerCase() } });
    throw ApiError.internal('Failed to send verification email');
  }
};

const resendVerificationCode = async ({ email }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email already verified');
  }

  // Generate new verification code
  const verificationCode = generateVerificationCode();
  const codeExpiresAt = new Date();
  codeExpiresAt.setMinutes(codeExpiresAt.getMinutes() + 10); // Code expires in 10 minutes

  // Update user with new code
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpiresAt: codeExpiresAt,
    },
  });

  // Send verification email
  try {
    await sendVerificationEmail(user.email, user.name, verificationCode);
    console.log(`✅ Verification email resent to ${user.email}`);
  } catch (error) {
    console.error('❌ Failed to resend verification email:', error.message);
    console.error('   Error details:', error);
    throw ApiError.internal('Failed to send verification email. Please check your email configuration and try again later.');
  }

  return {
    message: 'Verification code sent to your email',
  };
};

const logout = async (token) => {
  await prisma.loginSession.updateMany({
    where: { token },
    data: { isActive: false },
  });
};

const logoutAll = async (userId) => {
  await prisma.loginSession.updateMany({
    where: { userId },
    data: { isActive: false },
  });
};

const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Don't reveal if user exists for security
    return {
      message: 'If an account exists with this email, a password reset code has been sent.',
    };
  }

  // Generate reset code
  const resetCode = generateVerificationCode();
  const codeExpiresAt = new Date();
  codeExpiresAt.setHours(codeExpiresAt.getHours() + 1); // Code expires in 1 hour

  // Store reset code (we can reuse emailVerificationCode field or add a new field)
  // For now, we'll use emailVerificationCode as it's available
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCode: resetCode,
      emailVerificationCodeExpiresAt: codeExpiresAt,
    },
  });

  // Send reset email
  try {
    const resetLink = `${env.FRONTEND_URL}/reset-password?code=${resetCode}&email=${encodeURIComponent(user.email)}`;
    await sendPasswordResetEmail(user.email, user.name, resetCode, resetLink);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw ApiError.internal('Failed to send password reset email. Please try again later.');
  }

  return {
    message: 'If an account exists with this email, a password reset code has been sent.',
  };
};

const resetPassword = async ({ email, code, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
    throw ApiError.unauthorized('Invalid reset code');
  }

  if (user.emailVerificationCodeExpiresAt && new Date() > user.emailVerificationCodeExpiresAt) {
    throw ApiError.badRequest('Reset code has expired. Please request a new one.');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and clear reset code
  // Note: We don't touch isEmailVerified - if user was verified before, they stay verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      emailVerificationCode: null,
      emailVerificationCodeExpiresAt: null,
      // Keep isEmailVerified as is - don't require re-verification after password reset
    },
  });

  // Invalidate all existing sessions for security
  await prisma.loginSession.updateMany({
    where: { userId: user.id },
    data: { isActive: false },
  });

  return {
    message: 'Password reset successfully. Please log in with your new password.',
  };
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  register,
  verifyEmail,
  sendPreRegistrationCode,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  login,
  logout,
  logoutAll,
};