const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const { LOGIN_COOLDOWN } = require('../utils/constants');

const checkLoginCooldown = async (req, res, next) => {
  try {
    const { email, deviceId } = req.body;

    if (!email) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, role: true },
    });

    if (!user) {
      return next();
    }

    // Skip cooldown for teachers
    if (user.role === 'TEACHER') {
      return next();
    }

    // Check for ANY recent login session (active or inactive) within cooldown period
    const recentSession = await prisma.loginSession.findFirst({
      where: {
        userId: user.id,
        loginAt: {
          gt: new Date(Date.now() - LOGIN_COOLDOWN),
        },
      },
      orderBy: {
        loginAt: 'desc',
      },
    });

    if (recentSession) {
      // Allow same device re-login without cooldown
      if (deviceId && recentSession.deviceId === deviceId) {
        return next();
      }

      const cooldownEnd = new Date(recentSession.loginAt.getTime() + LOGIN_COOLDOWN);
      const remainingMs = cooldownEnd.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      throw ApiError.tooManyRequests(
        `Login cooldown active. Please wait ${remainingMinutes} minutes before logging in again.`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

const getCooldownStatus = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.json({
        success: true,
        data: {
          isOnCooldown: false,
          remainingMinutes: 0,
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, role: true },
    });

    // Skip cooldown check for teachers
    if (user && user.role === 'TEACHER') {
      return res.json({
        success: true,
        data: {
          isOnCooldown: false,
          remainingMinutes: 0,
        },
      });
    }

    if (!user) {
      return res.json({
        success: true,
        data: {
          isOnCooldown: false,
          remainingMinutes: 0,
        },
      });
    }

    // Check for ANY recent login session (active or inactive) within cooldown period
    // This prevents users from bypassing cooldown by logging in from different browsers
    const recentSession = await prisma.loginSession.findFirst({
      where: {
        userId: user.id,
        loginAt: {
          gt: new Date(Date.now() - LOGIN_COOLDOWN),
        },
      },
      orderBy: {
        loginAt: 'desc',
      },
    });

    if (recentSession) {
      const cooldownEnd = new Date(recentSession.loginAt.getTime() + LOGIN_COOLDOWN);
      const remainingMs = cooldownEnd.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      return res.json({
        success: true,
        data: {
          isOnCooldown: true,
          remainingMinutes,
          cooldownEndsAt: cooldownEnd.toISOString(),
        },
      });
    }

    return res.json({
      success: true,
      data: {
        isOnCooldown: false,
        remainingMinutes: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkLoginCooldown, getCooldownStatus };