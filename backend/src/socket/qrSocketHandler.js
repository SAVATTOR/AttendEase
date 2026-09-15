const qrService = require('../services/qrService');
const { verifyToken } = require('../services/authService');
const { QR_REFRESH_INTERVAL } = require('../utils/constants');

const activeIntervals = new Map();

const initializeQRSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user's own room for personal notifications
    socket.join(`user-${socket.userId}`);
    console.log(`User ${socket.userId} joined their personal room`);

    socket.on('join-class-room', async (classId) => {
      if (socket.userRole !== 'TEACHER') {
        socket.emit('error', { message: 'Only teachers can manage QR sessions' });
        return;
      }

      socket.join(`class-${classId}`);
      console.log(`Teacher ${socket.userId} joined class room: ${classId}`);

      try {
        const activeSession = await qrService.getActiveSession(classId);
        if (activeSession) {
          socket.emit('active-session', {
            sessionId: activeSession.id,
            token: activeSession.token,
            expiresAt: activeSession.expiresAt,
          });
        }
      } catch (error) {
        console.error('Error checking active session:', error);
      }
    });

    socket.on('leave-class-room', (classId) => {
      socket.leave(`class-${classId}`);
      console.log(`Teacher ${socket.userId} left class room: ${classId}`);
    });

    socket.on('start-qr-session', async (data) => {
      const { sessionId, classId } = data;

      if (socket.userRole !== 'TEACHER') {
        socket.emit('error', { message: 'Only teachers can start QR sessions' });
        return;
      }

      if (activeIntervals.has(sessionId)) {
        clearInterval(activeIntervals.get(sessionId));
      }

      const intervalId = setInterval(async () => {
        try {
          const session = await qrService.getSessionById(sessionId);
          
          if (!session || session.status !== 'ACTIVE') {
            clearInterval(intervalId);
            activeIntervals.delete(sessionId);
            io.to(`class-${classId}`).emit('session-ended', { sessionId });
            return;
          }

          if (new Date() > new Date(session.expiresAt)) {
            await qrService.endSession(sessionId);
            clearInterval(intervalId);
            activeIntervals.delete(sessionId);
            io.to(`class-${classId}`).emit('session-expired', { sessionId });
            return;
          }

          const newToken = await qrService.refreshQRToken(sessionId);
          
          io.to(`class-${classId}`).emit('qr-refreshed', {
            sessionId,
            token: newToken,
            refreshedAt: new Date().toISOString(),
          });

          console.log(`QR refreshed for session ${sessionId}`);
        } catch (error) {
          console.error('Error refreshing QR:', error);
        }
      }, QR_REFRESH_INTERVAL);

      activeIntervals.set(sessionId, intervalId);
      
      socket.emit('qr-session-started', {
        sessionId,
        message: 'QR auto-refresh started',
        interval: QR_REFRESH_INTERVAL,
      });
    });

    socket.on('stop-qr-session', async (data) => {
      const { sessionId, classId } = data;

      if (socket.userRole !== 'TEACHER') {
        socket.emit('error', { message: 'Only teachers can stop QR sessions' });
        return;
      }

      if (activeIntervals.has(sessionId)) {
        clearInterval(activeIntervals.get(sessionId));
        activeIntervals.delete(sessionId);
      }

      try {
        await qrService.endSession(sessionId);
        io.to(`class-${classId}`).emit('session-ended', { sessionId });
        console.log(`QR session ended: ${sessionId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to end session' });
      }
    });

    socket.on('join-attendance-room', (classId) => {
      if (socket.userRole !== 'STUDENT') {
        socket.emit('error', { message: 'Only students can join attendance room' });
        return;
      }

      socket.join(`attendance-${classId}`);
      console.log(`Student ${socket.userId} joined attendance room: ${classId}`);
    });

    socket.on('attendance-marked', (data) => {
      const { classId, studentId, studentName, status } = data;
      
      io.to(`class-${classId}`).emit('new-attendance', {
        studentId,
        studentName,
        status,
        markedAt: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  const cleanup = () => {
    activeIntervals.forEach((intervalId, sessionId) => {
      clearInterval(intervalId);
      console.log(`Cleaned up interval for session: ${sessionId}`);
    });
    activeIntervals.clear();
  };

  return { cleanup };
};

module.exports = { initializeQRSocket };