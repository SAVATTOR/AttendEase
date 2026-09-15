const attendanceService = require('../services/attendanceService');
const qrService = require('../services/qrService');
const ApiError = require('../utils/ApiError');

const markAttendance = async (req, res, next) => {
  try {
    const { token, latitude, longitude } = req.body;
    const studentId = req.user.id;

    const validationResult = await qrService.validateQRToken(
      token,
      studentId,
      latitude,
      longitude
    );

    const attendance = await attendanceService.markAttendance({
      studentId,
      qrSessionId: validationResult.sessionId,
      latitude,
      longitude,
    });

    const io = req.app.get('io');
    if (io) {
      // Notify teacher (class room)
      io.to(`class-${attendance.classId}`).emit('new-attendance', {
        studentId,
        studentName: req.user.name,
        status: attendance.status,
        markedAt: attendance.markedAt,
        classId: attendance.classId,
      });

      // Notify student (user room)
      io.to(`user-${studentId}`).emit('attendance-marked', {
        attendanceId: attendance.id,
        classId: attendance.classId,
        status: attendance.status,
        markedAt: attendance.markedAt,
      });
    }

    res.status(201).json({
      success: true,
      message: attendance.isWithinRange
        ? 'Attendance marked successfully'
        : 'Attendance recorded but location was outside allowed range',
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { classId, startDate, endDate, status, page, limit } = req.query;

    const result = await attendanceService.getStudentAttendance(studentId, {
      classId,
      startDate,
      endDate,
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getClassAttendance = async (req, res, next) => {
  try {
    const { id: classId } = req.params;
    const teacherId = req.user.id;
    const { sessionId, startDate, endDate, status, page, limit } = req.query;

    const result = await attendanceService.getClassAttendance(classId, teacherId, {
      sessionId,
      startDate,
      endDate,
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const stats = await attendanceService.getAttendanceStats(userId, role);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getMyAttendance,
  getClassAttendance,
  getAttendanceStats,
};