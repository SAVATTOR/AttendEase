const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const { calculateDistance } = require('../utils/helpers');
const { ATTENDANCE_STATUS, LATE_THRESHOLD_MINUTES, MAX_GPS_ACCURACY_SLACK_METERS } = require('../utils/constants');

const markAttendance = async ({ studentId, qrSessionId, latitude, longitude, accuracy }) => {
  const qrSession = await prisma.qRSession.findUnique({
    where: { id: qrSessionId },
    include: {
      class: true,
    },
  });

  if (!qrSession) {
    throw ApiError.notFound('QR session not found');
  }

  if (qrSession.status !== 'ACTIVE') {
    throw ApiError.badRequest('QR session has ended');
  }

  if (new Date() > new Date(qrSession.expiresAt)) {
    throw ApiError.badRequest('QR session has expired');
  }

  let enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_classId: {
        studentId,
        classId: qrSession.classId,
      },
    },
  });

  // Auto-enroll student if not enrolled (first time scanning QR code)
  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId: qrSession.classId,
        status: 'PENDING', // Requires teacher approval
      },
    });
  }

  // Check if enrollment is approved
  if (enrollment.status !== 'APPROVED') {
    throw ApiError.forbidden('Your enrollment request is pending approval from the teacher');
  }

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      studentId_qrSessionId: {
        studentId,
        qrSessionId,
      },
    },
  });

  if (existingAttendance) {
    throw ApiError.conflict('Attendance already marked for this session');
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    qrSession.latitude,
    qrSession.longitude
  );

  // Use per-session overrides if set, otherwise fall back to class defaults
  const effectiveRadius = qrSession.allowedRadius ?? qrSession.class.allowedRadius;
  const effectiveLateThreshold = qrSession.lateThresholdMinutes ?? qrSession.class.lateThresholdMinutes ?? LATE_THRESHOLD_MINUTES;

  // A GPS fix is a circle, not a point. Comparing two fixes as if they were exact made
  // a student standing beside the lecturer read as ~52m away, because both readings carry
  // error. Give back the student's own reported uncertainty, capped so a forged accuracy
  // can't be used to mark attendance from outside the venue.
  const reportedAccuracy = Number.isFinite(accuracy) && accuracy > 0 ? accuracy : 0;
  const accuracySlack = Math.min(reportedAccuracy, MAX_GPS_ACCURACY_SLACK_METERS);
  const effectiveDistance = Math.max(0, distance - accuracySlack);

  const isWithinRange = effectiveDistance <= effectiveRadius;

  const minutesSinceStart = (Date.now() - qrSession.createdAt.getTime()) / 60000;
  const isLate = minutesSinceStart > effectiveLateThreshold;

  let status;
  if (!isWithinRange) {
    status = ATTENDANCE_STATUS.INVALID_LOCATION;
  } else if (isLate) {
    status = ATTENDANCE_STATUS.LATE;
  } else {
    status = ATTENDANCE_STATUS.PRESENT;
  }

  const attendance = await prisma.attendance.create({
    data: {
      studentId,
      classId: qrSession.classId,
      qrSessionId,
      latitude,
      longitude,
      distance: Math.round(distance * 100) / 100,
      status,
    },
    include: {
      class: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    ...attendance,
    isWithinRange,
    allowedRadius: qrSession.class.allowedRadius,
  };
};

const getStudentAttendance = async (studentId, filters = {}) => {
  const { classId, startDate, endDate, status, page = 1, limit = 10 } = filters;

  const where = { studentId };

  if (classId) {
    where.classId = classId;
  }

  if (startDate || endDate) {
    where.markedAt = {};
    if (startDate) {
      where.markedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.markedAt.lte = new Date(endDate);
    }
  }

  if (status) {
    where.status = status;
  }

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        qrSession: {
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: { markedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    attendances,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const getClassAttendance = async (classId, teacherId, filters = {}) => {
  const classRecord = await prisma.class.findFirst({
    where: {
      id: classId,
      teacherId,
    },
  });

  if (!classRecord) {
    throw ApiError.forbidden('You do not have access to this class');
  }

  const { sessionId, startDate, endDate, status, page = 1, limit = 10 } = filters;

  const where = { classId };

  if (sessionId) {
    where.qrSessionId = sessionId;
  }

  if (startDate || endDate) {
    where.markedAt = {};
    if (startDate) {
      where.markedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.markedAt.lte = new Date(endDate);
    }
  }

  if (status) {
    where.status = status;
  }

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            indexNumber: true,
          },
        },
        qrSession: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: { markedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    attendances,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const getAttendanceStats = async (userId, role) => {
  if (role === 'STUDENT') {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        select: { classId: true },
      });

      const classIds = enrollments.map((e) => e.classId);

      // Handle empty classIds array to prevent Prisma errors
      let totalSessions = 0;
      let attendedSessions = 0;
      let stats = [];

      try {
        [totalSessions, attendedSessions, stats] = await Promise.all([
          classIds.length > 0
            ? prisma.qRSession.count({
              where: {
                classId: { in: classIds },
                status: { in: ['ENDED', 'EXPIRED'] }, // Count completed sessions
              },
            })
            : Promise.resolve(0),
          prisma.attendance.count({
            where: {
              studentId: userId,
              status: { in: ['PRESENT', 'LATE'] },
            },
          }),
          prisma.attendance.groupBy({
            by: ['status'],
            where: { studentId: userId },
            _count: { status: true },
          }).catch((err) => {
            console.error('groupBy error:', err);
            return [];
          }),
        ]);
      } catch (error) {
        // If any query fails, log and use defaults
        console.error('Error in getAttendanceStats queries (STUDENT):', error);
        totalSessions = 0;
        attendedSessions = 0;
        stats = [];
      }

      const statusCounts = stats.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {});

      return {
        totalClasses: classIds.length,
        totalSessions,
        attendedSessions,
        attendanceRate: totalSessions > 0
          ? Math.round((attendedSessions / totalSessions) * 100)
          : 0,
        breakdown: {
          present: statusCounts.PRESENT || 0,
          late: statusCounts.LATE || 0,
          absent: totalSessions - attendedSessions,
          invalidLocation: statusCounts.INVALID_LOCATION || 0,
        },
      };
    } catch (error) {
      console.error('Error in getAttendanceStats (STUDENT):', error);
      // Return default stats structure on any error
      return {
        totalClasses: 0,
        totalSessions: 0,
        attendedSessions: 0,
        attendanceRate: 0,
        breakdown: {
          present: 0,
          late: 0,
          absent: 0,
          invalidLocation: 0,
        },
      };
    }
  }

  const classes = await prisma.class.findMany({
    where: { teacherId: userId },
    select: { id: true },
  });

  const classIds = classes.map((c) => c.id);

  // Get today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Handle empty classIds array to prevent Prisma errors
  const [totalStudents, totalSessions, totalAttendances, sessionsToday, recentActivity] = await Promise.all([
    classIds.length > 0
      ? prisma.enrollment.count({
        where: { classId: { in: classIds }, status: 'APPROVED' },
      })
      : Promise.resolve(0),
    classIds.length > 0
      ? prisma.qRSession.count({
        where: { classId: { in: classIds } },
      })
      : Promise.resolve(0),
    classIds.length > 0
      ? prisma.attendance.count({
        where: { classId: { in: classIds }, status: { in: ['PRESENT', 'LATE'] } },
      })
      : Promise.resolve(0),
    classIds.length > 0
      ? prisma.qRSession.count({
        where: {
          classId: { in: classIds },
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      })
      : Promise.resolve(0),
    classIds.length > 0
      ? prisma.attendance.findMany({
        where: { classId: { in: classIds } },
        include: {
          student: { select: { id: true, name: true } },
          class: { select: { name: true } },
        },
        orderBy: { markedAt: 'desc' },
        take: 10,
      })
      : Promise.resolve([]),
  ]);

  // Calculate average attendance rate
  const totalPossibleAttendances = totalStudents * totalSessions;
  const averageAttendance = totalPossibleAttendances > 0
    ? Math.round((totalAttendances / totalPossibleAttendances) * 1000) / 10
    : 0;

  return {
    totalClasses: classIds.length,
    totalStudents,
    totalSessions,
    sessionsToday,
    averageAttendance,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      studentName: a.student.name,
      className: a.class.name,
      status: a.status.toLowerCase(),
      time: a.markedAt,
    })),
  };
};

module.exports = {
  markAttendance,
  getStudentAttendance,
  getClassAttendance,
  getAttendanceStats,
};