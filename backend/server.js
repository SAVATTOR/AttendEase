const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const env = require('./src/config/env');
const { connectDatabase, disconnectDatabase } = require('./src/config/database');
const { initializeQRSocket } = require('./src/socket/qrSocketHandler');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);

const { cleanup: cleanupSockets } = initializeQRSocket(io);

const startServer = async () => {
  try {
    await connectDatabase();
    console.log('✅ Database connected successfully');

    // Verify email transporter if configured
    try {
      const { verifyTransporter } = require('./src/services/emailService');
      const emailVerified = await verifyTransporter();
      if (emailVerified) {
        console.log('✅ Email transporter verified successfully');
      } else {
        console.warn('⚠️ Email transporter not configured or verification failed');
        console.warn('   Email functionality may not work. Check EMAIL_USER and EMAIL_PASSWORD environment variables.');
      }
    } catch (error) {
      console.warn('⚠️ Email transporter verification skipped:', error.message);
    }

    server.listen(env.PORT, () => {
      console.log(`
🚀 Smart Attendance System Server is running!
📍 Environment: ${env.NODE_ENV}
🔗 URL: http://localhost:${env.PORT}
📡 Socket.io: Enabled
⏰ Started at: ${new Date().toISOString()}
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('✅ HTTP server closed');

    cleanupSockets();
    console.log('✅ Socket connections cleaned up');

    await disconnectDatabase();
    console.log('✅ Database connection closed');

    console.log('👋 Graceful shutdown completed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

startServer();

module.exports = { server, io };