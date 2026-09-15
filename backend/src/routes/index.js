const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const classRoutes = require('./classRoutes');
const qrRoutes = require('./qrRoutes');
const userRoutes = require('./userRoutes');
const settingsRoutes = require('./settingsRoutes');
const exportRoutes = require('./exportRoutes');

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Attendance System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      classes: '/api/classes',
      attendance: '/api/attendance',
      qr: '/api/qr',
      settings: '/api/settings',
      export: '/api/export',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/qr', qrRoutes);
router.use('/settings', settingsRoutes);
router.use('/export', exportRoutes);

module.exports = router;