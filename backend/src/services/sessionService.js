const { prisma } = require('../config/database');
const { LOGIN_COOLDOWN } = require('../utils/constants');

const createSession = async (userId, token, expiresAt) => {
  return prisma.loginSession.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
};

const invalidateSession = async (token) => {
  return prisma.loginSession.updateMany({
    where: { token },
    data: { isActive: false },
  });
};

const invalidateAllUserSessions = async (userId) => {
  return prisma.loginSession.updateMany({
    where: { userId },
    data: { isActive: false },
  });
};

const getActiveSession = async (userId) => {
  return prisma.loginSession.findFirst({
    where: {
      userId,
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      loginAt: 'desc',
    },
  });
};

const isOnCooldown = async (userId) => {
  const recentSession = await prisma.loginSession.findFirst({
    where: {
      userId,
      isActive: true,
      loginAt: {
        gt: new Date(Date.now() - LOGIN_COOLDOWN),
      },
    },
    orderBy: {
      loginAt: 'desc',
    },
  });

  if (!recentSession) {
    return { onCooldown: false };
  }

  const cooldownEnd = new Date(recentSession.loginAt.getTime() + LOGIN_COOLDOWN);
  const remainingMs = cooldownEnd.getTime() - Date.now();

  return {
    onCooldown: true,
    remainingMs,
    remainingMinutes: Math.ceil(remainingMs / 60000),
    cooldownEndsAt: cooldownEnd,
  };
};

const cleanupExpiredSessions = async () => {
  const result = await prisma.loginSession.updateMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          isActive: true,
          loginAt: { lt: new Date(Date.now() - LOGIN_COOLDOWN) },
        },
      ],
    },
    data: { isActive: false },
  });

  return result.count;
};

module.exports = {
  createSession,
  invalidateSession,
  invalidateAllUserSessions,
  getActiveSession,
  isOnCooldown,
  cleanupExpiredSessions,
};