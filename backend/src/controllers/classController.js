const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const { generateClassCode, getPaginationParams, createPaginationResponse } = require('../utils/helpers');
const {
  sendEnrollmentRequestEmail,
  sendEnrollmentStatusEmail,
  sendStudentRemovedEmail,
  shouldSendEmail
} = require('../services/emailService');

const getMyClasses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { page, limit, offset } = getPaginationParams(req.query.page, req.query.limit);

    let classes, total;

    if (role === 'TEACHER') {
      const classRecords = await prisma.class.findMany({
        where: { teacherId: userId },
        include: {
          _count: {
            select: { enrollments: true, qrSessions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      // Get separate counts for approved and pending enrollments for each class
      const classesWithCounts = await Promise.all(
        classRecords.map(async (classRecord) => {
          const [approvedCount, pendingCount] = await Promise.all([
            prisma.enrollment.count({
              where: {
                classId: classRecord.id,
                status: 'APPROVED',
              },
            }),
            prisma.enrollment.count({
              where: {
                classId: classRecord.id,
                status: 'PENDING',
              },
            }),
          ]);

          return {
            ...classRecord,
            enrollmentCounts: {
              approved: approvedCount,
              pending: pendingCount,
              total: approvedCount + pendingCount,
            },
          };
        })
      );

      total = await prisma.class.count({ where: { teacherId: userId } });
      classes = classesWithCounts;
    } else {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        include: {
          class: {
            include: {
              teacher: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        skip: offset,
        take: limit,
      });

      // Get approved enrollment counts for each class
      const classesWithCounts = await Promise.all(
        enrollments.map(async (e) => {
          const approvedCount = await prisma.enrollment.count({
            where: {
              classId: e.classId,
              status: 'APPROVED',
            },
          });

          return {
            ...e.class,
            enrolledAt: e.enrolledAt,
            enrollmentStatus: e.status,
            _count: {
              enrollments: approvedCount, // Only count approved enrollments
            },
          };
        })
      );

      classes = classesWithCounts;
      total = await prisma.enrollment.count({ where: { studentId: userId } });
    }

    res.status(200).json({
      success: true,
      ...createPaginationResponse(classes, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const classRecord = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { enrollments: true, qrSessions: true, attendances: true },
        },
      },
    });

    if (!classRecord) {
      throw ApiError.notFound('Class not found');
    }

    if (role === 'TEACHER' && classRecord.teacherId !== userId) {
      throw ApiError.forbidden('You do not have access to this class');
    }

    if (role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_classId: { studentId: userId, classId: id },
        },
      });

      if (!enrollment) {
        throw ApiError.forbidden('You are not enrolled in this class');
      }
    }

    res.status(200).json({
      success: true,
      data: classRecord,
    });
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const { name, description, schedule, allowedRadius, code: providedCode, group } = req.body;
    const teacherId = req.user.id;

    let code;

    if (providedCode && providedCode.trim()) {
      // Use provided code (validate uniqueness)
      const existing = await prisma.class.findUnique({ where: { code: providedCode.trim() } });
      if (existing) {
        throw ApiError.badRequest('Class code already exists. Please choose a different one.');
      }
      code = providedCode.trim();
    } else {
      // Auto-generate unique code
      let isUnique = false;
      while (!isUnique) {
        code = generateClassCode();
        const existing = await prisma.class.findUnique({ where: { code } });
        isUnique = !existing;
      }
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        code,
        group,
        teacherId,
        schedule,
        allowedRadius: allowedRadius || 50,
      },
    });

    // Emit WebSocket notification to teacher
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${teacherId}`).emit('class-created', {
        classId: newClass.id,
        className: newClass.name,
        classCode: newClass.code,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, schedule, allowedRadius, isActive } = req.body;
    const teacherId = req.user.id;

    const existingClass = await prisma.class.findFirst({
      where: { id, teacherId },
    });

    if (!existingClass) {
      throw ApiError.notFound('Class not found or you do not have access');
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(schedule && { schedule }),
        ...(allowedRadius && { allowedRadius }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass,
    });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const existingClass = await prisma.class.findFirst({
      where: { id, teacherId },
    });

    if (!existingClass) {
      throw ApiError.notFound('Class not found or you do not have access');
    }

    await prisma.class.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const enrollInClass = async (req, res, next) => {
  try {
    const { classCode } = req.body;
    const studentId = req.user.id;

    const classRecord = await prisma.class.findUnique({
      where: { code: classCode },
    });

    if (!classRecord) {
      throw ApiError.notFound('Class not found. Please check the class code.');
    }

    if (!classRecord.isActive) {
      throw ApiError.badRequest('This class is not accepting new enrollments');
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: { studentId, classId: classRecord.id },
      },
    });

    if (existingEnrollment) {
      throw ApiError.conflict('You are already enrolled in this class');
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId: classRecord.id,
        status: 'PENDING', // Requires teacher approval
      },
      include: {
        class: {
          select: { id: true, name: true, code: true, teacherId: true },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Emit WebSocket notification to teacher
    const io = req.app.get('io');
    if (io) {
      const notificationData = {
        enrollmentId: enrollment.id,
        classId: classRecord.id,
        className: classRecord.name,
        studentId: enrollment.student.id,
        studentName: enrollment.student.name,
        studentEmail: enrollment.student.email,
        requestedAt: enrollment.enrolledAt,
      };

      // Notify class room (for teachers viewing the class)
      io.to(`class-${classRecord.id}`).emit('enrollment-request', notificationData);

      // Also notify teacher's user room directly (so they see it on any page)
      io.to(`user-${classRecord.teacherId}`).emit('enrollment-request', notificationData);
    }

    // Send email notification to teacher
    try {
      const teacher = await prisma.user.findUnique({
        where: { id: classRecord.teacherId },
        select: { id: true, email: true, name: true },
      });

      if (teacher && await shouldSendEmail(teacher.id)) {
        await sendEnrollmentRequestEmail(
          teacher.email,
          teacher.name,
          enrollment.student.name,
          enrollment.student.email,
          enrollment.student.indexNumber || null,
          classRecord.name,
          classRecord.id
        );
      }
    } catch (error) {
      console.error('Failed to send enrollment request email:', error);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Enrollment request submitted. Waiting for lecturer approval.',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

const unenrollFromClass = async (req, res, next) => {
  try {
    const { id: classId } = req.params;
    const studentId = req.user.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: { studentId, classId },
      },
    });

    if (!enrollment) {
      throw ApiError.notFound('You are not enrolled in this class');
    }

    await prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    res.status(200).json({
      success: true,
      message: 'Successfully unenrolled from class',
    });
  } catch (error) {
    next(error);
  }
};

const getClassStudents = async (req, res, next) => {
  try {
    const { id: classId } = req.params;
    const teacherId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.query.page, req.query.limit);

    const classRecord = await prisma.class.findFirst({
      where: { id: classId, teacherId },
    });

    if (!classRecord) {
      throw ApiError.forbidden('You do not have access to this class');
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          classId,
          status: 'APPROVED', // Only return approved enrollments
        },
        include: {
          student: {
            select: { id: true, name: true, email: true, indexNumber: true, session: true, program: true, createdAt: true },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.enrollment.count({
        where: {
          classId,
          status: 'APPROVED',
        },
      }),
    ]);

    const students = enrollments.map((e) => ({
      ...e.student,
      enrolledAt: e.enrolledAt,
    }));

    res.status(200).json({
      success: true,
      ...createPaginationResponse(students, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

const removeStudent = async (req, res, next) => {
  try {
    const { id: classId, studentId } = req.params;
    const teacherId = req.user.id;

    const classRecord = await prisma.class.findFirst({
      where: { id: classId, teacherId },
      select: { id: true, name: true },
    });

    if (!classRecord) {
      throw ApiError.forbidden('You do not have access to this class');
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: { studentId, classId },
      },
    });

    if (!enrollment) {
      throw ApiError.notFound('Student is not enrolled in this class');
    }

    const studentInfo = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true },
    });

    await prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    // Emit WebSocket notifications
    const io = req.app.get('io');
    if (io) {
      // Notify teacher (class room)
      io.to(`class-${classId}`).emit('student-removed', {
        classId,
        studentId,
        studentName: studentInfo?.name || 'Unknown',
      });

      // Notify student
      io.to(`user-${studentId}`).emit('enrollment-status-changed', {
        classId,
        status: 'REMOVED',
      });
    }

    // Send email notification to student
    try {
      const teacherInfo = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { name: true },
      });

      if (studentInfo && await shouldSendEmail(studentId)) {
        await sendStudentRemovedEmail(
          studentInfo.email,
          studentInfo.name,
          classRecord?.name || 'Unknown',
          teacherInfo?.name || 'your lecturer'
        );
      }
    } catch (error) {
      console.error('Failed to send student removed email:', error);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Student removed from class',
    });
  } catch (error) {
    next(error);
  }
};

const getStudentOtherClasses = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;

    // Get all enrollments for this student
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            teacherId: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Filter to only show classes taught by the requesting teacher (privacy)
    const teacherClasses = enrollments
      .filter((e) => e.class.teacherId === teacherId)
      .map((e) => ({
        id: e.class.id,
        name: e.class.name,
        code: e.class.code,
        teacher: e.class.teacher,
        enrolledAt: e.enrolledAt,
      }));

    res.status(200).json({
      success: true,
      data: teacherClasses,
    });
  } catch (error) {
    next(error);
  }
};

const approveEnrollment = async (req, res, next) => {
  try {
    const { id: classId, studentId } = req.params;
    const teacherId = req.user.id;

    // Verify teacher owns the class
    const classRecord = await prisma.class.findFirst({
      where: { id: classId, teacherId },
    });

    if (!classRecord) {
      throw ApiError.forbidden('You do not have access to this class');
    }

    // Find the enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: { studentId, classId },
      },
      include: {
        student: {
          select: { id: true, name: true, email: true, indexNumber: true },
        },
      },
    });

    if (!enrollment) {
      throw ApiError.notFound('Enrollment not found');
    }

    // Update status to APPROVED
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'APPROVED' },
      include: {
        student: {
          select: { id: true, name: true, email: true, indexNumber: true },
        },
        class: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Emit WebSocket notifications
    const io = req.app.get('io');
    if (io) {
      // Notify lecturer (class room)
      io.to(`class-${classId}`).emit('enrollment-approved', {
        classId,
        studentId: updatedEnrollment.student.id,
        studentName: updatedEnrollment.student.name,
        className: updatedEnrollment.class.name,
      });

      // Notify student
      io.to(`user-${studentId}`).emit('enrollment-status-changed', {
        classId,
        className: updatedEnrollment.class.name,
        classCode: updatedEnrollment.class.code,
        status: 'APPROVED',
      });
    }

    // Send email notification to student
    try {
      if (await shouldSendEmail(studentId)) {
        await sendEnrollmentStatusEmail(
          updatedEnrollment.student.email,
          updatedEnrollment.student.name,
          updatedEnrollment.class.name,
          updatedEnrollment.class.code,
          'APPROVED'
        );
      }
    } catch (error) {
      console.error('Failed to send enrollment approval email:', error);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment approved',
      data: updatedEnrollment,
    });
  } catch (error) {
    next(error);
  }
};

const rejectEnrollment = async (req, res, next) => {
  try {
    const { id: classId, studentId } = req.params;
    const teacherId = req.user.id;

    // Verify teacher owns the class
    const classRecord = await prisma.class.findFirst({
      where: { id: classId, teacherId },
    });

    if (!classRecord) {
      throw ApiError.forbidden('You do not have access to this class');
    }

    // Find the enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: { studentId, classId },
      },
    });

    if (!enrollment) {
      throw ApiError.notFound('Enrollment not found');
    }

    const studentInfo = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true },
    });

    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, code: true },
    });

    // Delete the enrollment (rejection means removal)
    await prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    // Emit WebSocket notifications
    const io = req.app.get('io');
    if (io) {
      // Notify teacher (class room)
      io.to(`class-${classId}`).emit('enrollment-rejected', {
        classId,
        studentId,
        studentName: studentInfo?.name || 'Unknown',
        className: classInfo?.name || 'Unknown',
      });

      // Notify student
      io.to(`user-${studentId}`).emit('enrollment-status-changed', {
        classId,
        className: classInfo?.name || 'Unknown',
        classCode: classInfo?.code || 'Unknown',
        status: 'REJECTED',
      });
    }

    // Send email notification to student
    try {
      if (studentInfo && await shouldSendEmail(studentId)) {
        await sendEnrollmentStatusEmail(
          studentInfo.email,
          studentInfo.name,
          classInfo?.name || 'Unknown',
          classInfo?.code || 'Unknown',
          'REJECTED'
        );
      }
    } catch (error) {
      console.error('Failed to send enrollment rejection email:', error);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment rejected',
    });
  } catch (error) {
    next(error);
  }
};

const getPendingEnrollments = async (req, res, next) => {
  try {
    const { id: classId } = req.params;
    const teacherId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.query.page, req.query.limit);

    // Verify teacher owns the class
    const classRecord = await prisma.class.findFirst({
      where: { id: classId, teacherId },
    });

    if (!classRecord) {
      throw ApiError.forbidden('You do not have access to this class');
    }

    // Get pending enrollments
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          classId,
          status: 'PENDING',
        },
        include: {
          student: {
            select: { id: true, name: true, email: true, indexNumber: true, createdAt: true },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.enrollment.count({
        where: { classId, status: 'PENDING' },
      }),
    ]);

    const students = enrollments.map((e) => ({
      ...e.student,
      enrolledAt: e.enrolledAt,
      enrollmentId: e.id,
    }));

    res.status(200).json({
      success: true,
      ...createPaginationResponse(students, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

const regenerateClassCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const classRecord = await prisma.class.findFirst({
      where: { id, teacherId },
    });

    if (!classRecord) {
      throw ApiError.notFound('Class not found or you do not have access');
    }

    let code;
    let isUnique = false;

    while (!isUnique) {
      code = generateClassCode();
      const existing = await prisma.class.findUnique({ where: { code } });
      isUnique = !existing;
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: { code },
    });

    res.status(200).json({
      success: true,
      message: 'Class code regenerated',
      data: { code: updatedClass.code },
    });
  } catch (error) {
    next(error);
  }
};

// Approve all pending enrollments for a class
const approveAllEnrollments = async (req, res, next) => {
  try {
    const { id: classId } = req.params;
    const teacherId = req.user.id;

    // Verify teacher owns the class
    const classRecord = await prisma.class.findFirst({
      where: { id: classId, teacherId },
    });

    if (!classRecord) {
      throw ApiError.forbidden('You do not have access to this class');
    }

    // Get all pending enrollments
    const pendingEnrollments = await prisma.enrollment.findMany({
      where: { classId, status: 'PENDING' },
      include: {
        student: { select: { id: true, name: true, email: true, indexNumber: true } },
      },
    });

    if (pendingEnrollments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending enrollments to approve',
        data: { approvedCount: 0 },
      });
    }

    // Approve all
    await prisma.enrollment.updateMany({
      where: { classId, status: 'PENDING' },
      data: { status: 'APPROVED' },
    });

    // Emit WebSocket notifications
    const io = req.app.get('io');
    if (io) {
      for (const enrollment of pendingEnrollments) {
        io.to(`user-${enrollment.student.id}`).emit('enrollment-status-changed', {
          classId,
          className: classRecord.name,
          status: 'APPROVED',
        });
      }
      io.to(`class-${classId}`).emit('bulk-enrollment-approved', {
        classId,
        count: pendingEnrollments.length,
      });
    }

    // Send emails (don't block response)
    pendingEnrollments.forEach(async (enrollment) => {
      try {
        if (await shouldSendEmail(enrollment.student.id)) {
          await sendEnrollmentStatusEmail(
            enrollment.student.email,
            enrollment.student.name,
            classRecord.name,
            classRecord.code,
            'APPROVED'
          );
        }
      } catch (error) {
        console.error('Failed to send approval email:', error);
      }
    });

    res.status(200).json({
      success: true,
      message: `Approved ${pendingEnrollments.length} enrollment(s)`,
      data: { approvedCount: pendingEnrollments.length },
    });
  } catch (error) {
    next(error);
  }
};

// Remove all students from a class
const removeAllStudents = async (req, res, next) => {
  try {
    const { id: classId } = req.params;
    const teacherId = req.user.id;

    // Verify teacher owns the class
    const classRecord = await prisma.class.findFirst({
      where: { id: classId, teacherId },
    });

    if (!classRecord) {
      throw ApiError.forbidden('You do not have access to this class');
    }

    // Get all approved enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { classId, status: 'APPROVED' },
      include: {
        student: { select: { id: true, name: true, email: true, indexNumber: true } },
      },
    });

    if (enrollments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No students to remove',
        data: { removedCount: 0 },
      });
    }

    // Remove all
    await prisma.enrollment.deleteMany({
      where: { classId, status: 'APPROVED' },
    });

    // Emit WebSocket notifications
    const io = req.app.get('io');
    if (io) {
      for (const enrollment of enrollments) {
        io.to(`user-${enrollment.student.id}`).emit('enrollment-status-changed', {
          classId,
          status: 'REMOVED',
        });
      }
      io.to(`class-${classId}`).emit('bulk-students-removed', {
        classId,
        count: enrollments.length,
      });
    }

    // Send emails (don't block response)
    const teacherInfo = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { name: true },
    });

    enrollments.forEach(async (enrollment) => {
      try {
        if (await shouldSendEmail(enrollment.student.id)) {
          await sendStudentRemovedEmail(
            enrollment.student.email,
            enrollment.student.name,
            classRecord.name,
            teacherInfo?.name || 'your lecturer'
          );
        }
      } catch (error) {
        console.error('Failed to send removal email:', error);
      }
    });

    res.status(200).json({
      success: true,
      message: `Removed ${enrollments.length} student(s) from class`,
      data: { removedCount: enrollments.length },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  enrollInClass,
  unenrollFromClass,
  getClassStudents,
  removeStudent,
  removeAllStudents,
  getStudentOtherClasses,
  approveEnrollment,
  approveAllEnrollments,
  rejectEnrollment,
  getPendingEnrollments,
  regenerateClassCode,
};