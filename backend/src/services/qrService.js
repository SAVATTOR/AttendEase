const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const { generateSecureToken } = require('../utils/helpers');
const { QR_SESSION_DURATION } = require('../utils/constants');

const generateQRSession = async ({ classId, teacherId, latitude, longitude, duration, allowedRadius, lateThresholdMinutes }) => {
  const classRecord = await prisma.class.findFirst({
    where: {
      id: classId,
      teacherId,
    },
  });

  if (!classRecord) {
    throw ApiError.forbidden('You do not have access to this class');
  }

  // End any existing active sessions for this class
  await prisma.qRSession.updateMany({
    where: {
      classId,
      status: { in: ['ACTIVE', 'PAUSED'] },
    },
    data: {
      status: 'ENDED',
      endedAt: new Date(),
    },
  });

  const sessionDuration = duration
    ? duration * 60 * 1000
    : classRecord.sessionDurationMins * 60 * 1000
    || QR_SESSION_DURATION;

  const expiresAt = new Date(Date.now() + sessionDuration);
  const token = generateQRToken();

  const qrSession = await prisma.qRSession.create({
    data: {
      classId,
      token,
      latitude,
      longitude,
      expiresAt,
      status: 'ACTIVE',
      allowedRadius: allowedRadius ?? null,
      lateThresholdMinutes: lateThresholdMinutes ?? null,
    },
    include: {
      class: {
        select: {
          name: true,
          allowedRadius: true,
          lateThresholdMinutes: true,
        },
      },
    },
  });

  // Return session with per-session overrides if provided
  // These overrides take precedence over class defaults for this session
  return {
    ...qrSession,
    class: {
      ...qrSession.class,
      // Use per-session overrides if provided, otherwise use class defaults
      allowedRadius: allowedRadius ?? qrSession.class.allowedRadius,
      lateThresholdMinutes: lateThresholdMinutes ?? qrSession.class.lateThresholdMinutes,
    },
    // Also store overrides at session level for easy access
    sessionOverrides: {
      allowedRadius: allowedRadius ?? null,
      lateThresholdMinutes: lateThresholdMinutes ?? null,
    },
  };
};

// A short opaque random token, not a signed JWT: the QR payload only needs to be
// unguessable and unique, not self-describing.
//
// Size matters more than it looks here. 16 UPPERCASE hex chars encodes in the QR
// alphanumeric mode (0-9 and A-F are all in that charset, lowercase is not), which
// fits in a version-1 symbol - 21x21 modules, the smallest QR that exists. Rendered
// at 440px that's ~18px per module, so it reads instantly and from across a room.
// Lowercase would force byte mode and a denser version-2 grid for the same data.
//
// 64 bits of entropy against a token that rotates every few seconds and a
// rate-limited endpoint leaves no meaningful guessing risk. Freshness is enforced by
// validateQRToken() matching the current DB value, which every refresh overwrites.
const generateQRToken = () => generateSecureToken(8).toUpperCase();

const refreshQRToken = async (sessionId) => {
  const session = await prisma.qRSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.status !== 'ACTIVE') {
    throw ApiError.badRequest('Session not found or not active');
  }

  const newToken = generateQRToken();

  await prisma.qRSession.update({
    where: { id: sessionId },
    data: { token: newToken },
  });

  return newToken;
};

const pauseSession = async (sessionId, teacherId) => {
  const session = await prisma.qRSession.findUnique({
    where: { id: sessionId },
    include: { class: true },
  });

  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  if (session.class.teacherId !== teacherId) {
    throw ApiError.forbidden('You do not have access to this session');
  }

  if (session.status !== 'ACTIVE') {
    throw ApiError.badRequest('Only active sessions can be paused');
  }

  return prisma.qRSession.update({
    where: { id: sessionId },
    data: {
      status: 'PAUSED',
      pausedAt: new Date(),
    },
  });
};

const resumeSession = async (sessionId, teacherId) => {
  const session = await prisma.qRSession.findUnique({
    where: { id: sessionId },
    include: { class: true },
  });

  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  if (session.class.teacherId !== teacherId) {
    throw ApiError.forbidden('You do not have access to this session');
  }

  if (session.status !== 'PAUSED') {
    throw ApiError.badRequest('Only paused sessions can be resumed');
  }

  // Extend expiry time by the paused duration
  const pausedDuration = Date.now() - new Date(session.pausedAt).getTime();
  const newExpiresAt = new Date(new Date(session.expiresAt).getTime() + pausedDuration);

  const newToken = generateQRToken();

  return prisma.qRSession.update({
    where: { id: sessionId },
    data: {
      status: 'ACTIVE',
      resumedAt: new Date(),
      expiresAt: newExpiresAt,
      token: newToken,
    },
  });
};

const validateQRToken = async (token, studentId, latitude, longitude) => {
  if (!token) {
    throw ApiError.badRequest('Invalid QR code');
  }

  // The token is looked up directly rather than decoded: it's overwritten in the DB
  // on every refresh, so a stale/previously scanned token simply won't match any
  // active session anymore.
  const session = await prisma.qRSession.findFirst({
    where: {
      token,
      status: 'ACTIVE',
    },
    include: {
      class: {
        select: {
          name: true,
          allowedRadius: true,
          lateThresholdMinutes: true,
        },
      },
    },
  });

  if (!session) {
    throw ApiError.badRequest('Invalid or expired QR code. Please scan the current code.');
  }

  if (new Date() > new Date(session.expiresAt)) {
    await prisma.qRSession.update({
      where: { id: session.id },
      data: { status: 'EXPIRED' },
    });
    throw ApiError.badRequest('Session has expired');
  }

  return {
    sessionId: session.id,
    classId: session.classId,
    className: session.class.name,
    teacherLocation: {
      latitude: session.latitude,
      longitude: session.longitude,
    },
    allowedRadius: session.class.allowedRadius,
    lateThresholdMinutes: session.class.lateThresholdMinutes,
    sessionStartedAt: session.createdAt,
  };
};

const getActiveSession = async (classId) => {
  return prisma.qRSession.findFirst({
    where: {
      classId,
      status: { in: ['ACTIVE', 'PAUSED'] },
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      class: {
        select: {
          name: true,
          allowedRadius: true,
          lateThresholdMinutes: true,
        },
      },
      _count: {
        select: {
          attendances: true,
        },
      },
    },
  });
};

const getSessionById = async (sessionId) => {
  return prisma.qRSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        select: {
          name: true,
          teacherId: true,
          allowedRadius: true,
        },
      },
    },
  });
};

const endSession = async (sessionId, teacherId) => {
  const session = await prisma.qRSession.findUnique({
    where: { id: sessionId },
    include: { class: true },
  });

  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  if (teacherId && session.class.teacherId !== teacherId) {
    throw ApiError.forbidden('You do not have access to this session');
  }

  return prisma.qRSession.update({
    where: { id: sessionId },
    data: {
      status: 'ENDED',
      endedAt: new Date(),
    },
  });
};

const getSessionAttendance = async (sessionId, teacherId) => {
  const session = await prisma.qRSession.findUnique({
    where: { id: sessionId },
    include: { class: true },
  });

  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  if (session.class.teacherId !== teacherId) {
    throw ApiError.forbidden('You do not have access to this session');
  }

  const attendances = await prisma.attendance.findMany({
    where: { qrSessionId: sessionId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          indexNumber: true,
        },
      },
    },
    orderBy: { markedAt: 'asc' },
  });

  const enrolledCount = await prisma.enrollment.count({
    where: { classId: session.classId },
  });

  return {
    session: {
      id: session.id,
      status: session.status,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      pausedAt: session.pausedAt,
      endedAt: session.endedAt,
    },
    attendances,
    stats: {
      total: enrolledCount,
      present: attendances.filter((a) => a.status === 'PRESENT').length,
      late: attendances.filter((a) => a.status === 'LATE').length,
      invalidLocation: attendances.filter((a) => a.status === 'INVALID_LOCATION').length,
      absent: enrolledCount - attendances.length,
    },
  };
};

const getSessionHistory = async (classId, teacherId, page = 1, limit = 10) => {
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId },
  });

  if (!classRecord) {
    throw ApiError.forbidden('You do not have access to this class');
  }

  const [sessions, total] = await Promise.all([
    prisma.qRSession.findMany({
      where: { classId },
      include: {
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.qRSession.count({ where: { classId } }),
  ]);

  return {
    sessions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = {
  generateQRSession,
  generateQRToken,
  refreshQRToken,
  pauseSession,
  resumeSession,
  validateQRToken,
  getActiveSession,
  getSessionById,
  endSession,
  getSessionAttendance,
  getSessionHistory,
};