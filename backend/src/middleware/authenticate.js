const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Access token is required');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token has expired');
      }
      throw ApiError.unauthorized('Invalid token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    const session = await prisma.loginSession.findFirst({
      where: {
        userId: user.id,
        token: token,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      throw ApiError.unauthorized('Session expired or invalid');
    }

    req.user = user;
    req.token = token;
    req.sessionId = session.id;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };