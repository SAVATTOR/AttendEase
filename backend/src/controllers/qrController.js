const qrService = require('../services/qrService');
const ApiError = require('../utils/ApiError');
const { prisma } = require('../config/database');
const { sendSessionStartedEmail, shouldSendEmail } = require('../services/emailService');

const generateQRSession = async (req, res, next) => {
  try {
    const { classId, latitude, longitude, duration, allowedRadius, lateThresholdMinutes } = req.body;
    const teacherId = req.user.id;

    const session = await qrService.generateQRSession({
      classId,
      teacherId,
      latitude,
      longitude,
      duration,
      allowedRadius,
      lateThresholdMinutes,
    });

    const io = req.app.get('io');
    if (io) {
      // Get class details for notification
      const classDetails = await prisma.class.findUnique({
        where: { id: classId },
        select: { name: true, teacher: { select: { name: true } } },
      });

      const sessionData = {
        sessionId: session.id,
        classId: classId,
        className: classDetails?.name || 'Unknown Class',
        teacherName: classDetails?.teacher?.name || 'Unknown Lecturer',
        token: session.token,
        expiresAt: session.expiresAt,
      };

      // Emit to both teacher room (class-${classId}) and student room (attendance-${classId})
      io.to(`class-${classId}`).emit('session-started', sessionData);
      io.to(`attendance-${classId}`).emit('session-started', sessionData);
    }

    // Send email notifications to all enrolled students
    try {
      const enrolledStudents = await prisma.enrollment.findMany({
        where: {
          classId,
          status: 'APPROVED', // Only notify approved students
        },
        include: {
          student: {
            select: { id: true, email: true, name: true, indexNumber: true },
          },
        },
      });

      // Calculate session duration in minutes
      const sessionDuration = duration
        ? duration
        : session.expiresAt
          ? Math.round((new Date(session.expiresAt) - new Date()) / (1000 * 60))
          : 60;

      // Send emails asynchronously (don't wait for all to complete)
      enrolledStudents.forEach(async (enrollment) => {
        try {
          if (await shouldSendEmail(enrollment.student.id)) {
            await sendSessionStartedEmail(
              enrollment.student.email,
              enrollment.student.name,
              classDetails?.name || 'Unknown Class',
              classDetails?.teacher?.name || 'Unknown Lecturer',
              sessionDuration
            );
          }
        } catch (error) {
          console.error(`Failed to send session started email to ${enrollment.student.email}:`, error);
          // Continue with other students even if one fails
        }
      });
    } catch (error) {
      console.error('Failed to send session started emails:', error);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'QR session started',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveSession = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const session = await qrService.getActiveSession(classId);

    if (!session) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active session',
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const validateQRCode = async (req, res, next) => {
  try {
    const { token, latitude, longitude } = req.body;
    const studentId = req.user.id;

    const result = await qrService.validateQRToken(
      token,
      studentId,
      latitude,
      longitude
    );

    res.status(200).json({
      success: true,
      message: 'QR code is valid',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const pauseSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    const session = await qrService.pauseSession(sessionId, teacherId);

    const io = req.app.get('io');
    if (io) {
      io.to(`class-${session.classId}`).emit('session-paused', {
        sessionId: session.id,
        pausedAt: session.pausedAt,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session paused',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const resumeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    const session = await qrService.resumeSession(sessionId, teacherId);

    const io = req.app.get('io');
    if (io) {
      io.to(`class-${session.classId}`).emit('session-resumed', {
        sessionId: session.id,
        token: session.token,
        resumedAt: session.resumedAt,
        expiresAt: session.expiresAt,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session resumed',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    const session = await qrService.endSession(sessionId, teacherId);

    const io = req.app.get('io');
    if (io) {
      io.to(`class-${session.classId}`).emit('session-ended', {
        sessionId: session.id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session ended',
    });
  } catch (error) {
    next(error);
  }
};

const getSessionAttendance = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user.id;

    const result = await qrService.getSessionAttendance(sessionId, teacherId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSessionHistory = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;
    const { page, limit } = req.query;

    const result = await qrService.getSessionHistory(
      classId,
      teacherId,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    const newToken = await qrService.refreshQRToken(sessionId);

    res.status(200).json({
      success: true,
      data: { token: newToken },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateQRSession,
  getActiveSession,
  validateQRCode,
  pauseSession,
  resumeSession,
  endSession,
  getSessionAttendance,
  getSessionHistory,
  refreshToken,
};