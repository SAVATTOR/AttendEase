const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');

const exportClassAttendanceCSV = async (req, res, next) => {
    try {
        const { classId } = req.params;
        const teacherId = req.user.id;
        const { startDate, endDate, sessionId } = req.query;

        // Verify teacher owns this class
        const classRecord = await prisma.class.findFirst({
            where: { id: classId, teacherId },
        });

        if (!classRecord) {
            throw ApiError.forbidden('You do not have access to this class');
        }

        // Build query
        const where = { classId };

        if (sessionId) {
            where.qrSessionId = sessionId;
        }

        if (startDate || endDate) {
            where.markedAt = {};
            if (startDate) where.markedAt.gte = new Date(startDate);
            if (endDate) where.markedAt.lte = new Date(endDate);
        }

        const attendances = await prisma.attendance.findMany({
            where,
            include: {
                student: {
                    select: { name: true, email: true, indexNumber: true },
                },
                qrSession: {
                    select: { createdAt: true },
                },
            },
            orderBy: { markedAt: 'desc' },
        });

        // Calculate statistics
        const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
        const lateCount = attendances.filter((a) => a.status === 'LATE').length;
        const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;

        // Format dates for header
        const exportDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const dateRangeStr = startDate || endDate
            ? `${startDate ? new Date(startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : 'Start'} - ${endDate ? new Date(endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : 'End'}`
            : 'All Time';

        // Generate CSV
        const headers = [
            'Student Name',
            'Index Number',
            'Student Email',
            'Session Date',
            'Marked At',
            'Status',
            'Distance (meters)',
            'Latitude',
            'Longitude',
        ];

        const rows = attendances.map((a) => [
            a.student.name,
            a.student.indexNumber || a.student.email,
            a.student.email,
            new Date(a.qrSession.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            new Date(a.markedAt).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
            a.status,
            a.distance.toFixed(2),
            a.latitude.toFixed(6),
            a.longitude.toFixed(6),
        ]);

        const csvContent = [
            `Class Name:,${classRecord.name}`,
            `Export Date:,${exportDate}`,
            `Date Range:,${dateRangeStr}`,
            `Total Records:,${attendances.length}`,
            `Present:,${presentCount}`,
            `Late:,${lateCount}`,
            `Absent:,${absentCount}`,
            '',
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        // Format filename: <class_name>_<date>
        const className = classRecord.name.replace(/[^a-z0-9]/gi, '_');
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${className}_${dateStr}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        );

        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

const exportSessionAttendanceCSV = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const teacherId = req.user.id;

        const session = await prisma.qRSession.findUnique({
            where: { id: sessionId },
            include: {
                class: true,
                attendances: {
                    include: {
                        student: {
                            select: { name: true, email: true, indexNumber: true },
                        },
                    },
                    orderBy: { markedAt: 'asc' },
                },
            },
        });

        if (!session) {
            throw ApiError.notFound('Session not found');
        }

        if (session.class.teacherId !== teacherId) {
            throw ApiError.forbidden('You do not have access to this session');
        }

        // Get all enrolled students to mark absent ones (only APPROVED enrollments)
        const enrollments = await prisma.enrollment.findMany({
            where: {
                classId: session.classId,
                status: 'APPROVED', // Only count approved enrollments
            },
            include: {
                student: {
                    select: { id: true, name: true, email: true, indexNumber: true },
                },
            },
        });

        const attendedStudentIds = new Set(session.attendances.map((a) => a.studentId));

        const headers = [
            'Student Name',
            'Index Number',
            'Student Email',
            'Status',
            'Marked At',
            'Distance (meters)',
        ];

        const presentRows = session.attendances.map((a) => [
            a.student.name,
            a.student.indexNumber || a.student.email,
            a.student.email,
            a.status,
            new Date(a.markedAt).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
            a.distance.toFixed(2),
        ]);

        const absentRows = enrollments
            .filter((e) => !attendedStudentIds.has(e.student.id))
            .map((e) => [
                e.student.name,
                e.student.indexNumber || e.student.email,
                e.student.email,
                'ABSENT',
                '-',
                '-',
            ]);

        const allRows = [...presentRows, ...absentRows];

        const sessionDate = new Date(session.createdAt);
        const dateStr = sessionDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const timeStr = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        const presentCount = session.attendances.filter((a) => a.status === 'PRESENT').length;
        const lateCount = session.attendances.filter((a) => a.status === 'LATE').length;
        const absentCount = absentRows.length;

        const csvContent = [
            `Class Name:,${session.class.name}`,
            `Session Date:,${dateStr}`,
            `Session Time:,${timeStr}`,
            `Total Students:,${enrollments.length}`,
            `Present:,${presentCount}`,
            `Late:,${lateCount}`,
            `Absent:,${absentCount}`,
            '',
            headers.join(','),
            ...allRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        // Format filename: <class_name>_<date>
        const className = session.class.name.replace(/[^a-z0-9]/gi, '_');
        const filenameDateStr = new Date(session.createdAt).toISOString().split('T')[0];
        const filename = `${className}_${filenameDateStr}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        );

        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

const exportStudentAttendanceCSV = async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { classId, startDate, endDate } = req.query;

        // Get student info
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: { name: true },
        });

        const where = { studentId };

        if (classId) {
            where.classId = classId;
        }

        if (startDate || endDate) {
            where.markedAt = {};
            if (startDate) where.markedAt.gte = new Date(startDate);
            if (endDate) where.markedAt.lte = new Date(endDate);
        }

        const attendances = await prisma.attendance.findMany({
            where,
            include: {
                class: {
                    select: { name: true },
                },
                qrSession: {
                    select: { createdAt: true },
                },
            },
            orderBy: { markedAt: 'desc' },
        });

        const headers = ['Class Name', 'Session Date', 'Marked At', 'Status', 'Distance (meters)'];

        const rows = attendances.map((a) => [
            a.class.name,
            new Date(a.qrSession.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            new Date(a.markedAt).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
            a.status,
            a.distance ? a.distance.toFixed(2) : '-',
        ]);

        // Add summary
        const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
        const lateCount = attendances.filter((a) => a.status === 'LATE').length;
        const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;

        // Format dates for header
        const exportDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const dateRangeStr = startDate || endDate
            ? `${startDate ? new Date(startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : 'Start'} - ${endDate ? new Date(endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : 'End'}`
            : 'All Time';

        const csvContent = [
            `Student Name:,${student?.name || 'Unknown'}`,
            `Export Date:,${exportDate}`,
            `Date Range:,${dateRangeStr}`,
            `Total Records:,${attendances.length}`,
            `Present:,${presentCount}`,
            `Late:,${lateCount}`,
            `Absent:,${absentCount}`,
            '',
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        // Format filename: <student_name>_attendance_<date>
        const studentName = (student?.name || 'student').replace(/[^a-z0-9]/gi, '_');
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${studentName}_attendance_${dateStr}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        );

        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    exportClassAttendanceCSV,
    exportSessionAttendanceCSV,
    exportStudentAttendanceCSV,
};