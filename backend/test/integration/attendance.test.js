const request = require('supertest');
const app = require('../../src/app');
const { prisma } = require('../../src/config/database');
const bcrypt = require('bcryptjs');

// Check if database is available (shared with auth.test.js)
let databaseAvailable = false;

beforeAll(async () => {
  try {
    await prisma.$connect();
    databaseAvailable = true;
  } catch (error) {
    console.log('⚠️  Database not available - integration tests will be skipped');
    databaseAvailable = false;
  }
});

afterAll(async () => {
  if (databaseAvailable) {
    try {
      await prisma.$disconnect();
    } catch (error) {
      // Ignore disconnect errors
    }
  }
});

const describeIf = (condition) => condition ? describe : describe.skip;

describeIf(databaseAvailable)('Attendance API Integration Tests', () => {
  let teacherToken;
  let studentToken;
  let teacherId;
  let studentId;
  let classId;
  let sessionId;

  beforeAll(async () => {
    // Clean up test data (in correct order due to foreign keys)
    // Note: Prisma model names are camelCase: qRSession, not qrSession
    await prisma.attendance.deleteMany({});
    await prisma.qRSession.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.loginSession.deleteMany({});
    await prisma.userSettings.deleteMany({});
    await prisma.user.deleteMany({});

    // Create teacher
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@test.com',
        password: hashedPassword,
        name: 'Test Teacher',
        role: 'TEACHER',
      },
    });
    teacherId = teacher.id;

    // Create student
    const student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        password: hashedPassword,
        name: 'Test Student',
        role: 'STUDENT',
      },
    });
    studentId = student.id;

    // Login teacher
    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teacher@test.com',
        password: 'Password123',
      });
    teacherToken = teacherLogin.body.data.token;

    // Login student
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@test.com',
        password: 'Password123',
      });
    studentToken = studentLogin.body.data.token;

    // Create class
    const classResponse = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Test Class',
        code: 'TEST101',
        description: 'Test Description',
      });
    classId = classResponse.body.data.id;

    // Enroll student
    await request(app)
      .post('/api/classes/enroll')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        code: 'TEST101',
      });
  });

  afterAll(async () => {
    if (!databaseAvailable) return;
    
    try {
      await prisma.attendance.deleteMany({});
      await prisma.qRSession.deleteMany({});
      await prisma.enrollment.deleteMany({});
      await prisma.class.deleteMany({});
      await prisma.loginSession.deleteMany({});
      await prisma.userSettings.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('POST /api/qr/generate', () => {
    it('should create a QR session as teacher', async () => {
      const response = await request(app)
        .post('/api/qr/generate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          latitude: 40.7128,
          longitude: -74.0060,
          allowedRadius: 50,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('token');
      sessionId = response.body.data.sessionId;
    });

    it('should return 403 if student tries to create session', async () => {
      const response = await request(app)
        .post('/api/qr/generate')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId,
          latitude: 40.7128,
          longitude: -74.0060,
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/attendance/mark', () => {
    it('should mark attendance successfully', async () => {
      // Get active session token
      const sessionResponse = await request(app)
        .get(`/api/qr/active/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      const qrToken = sessionResponse.body.data.token;

      const response = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          qrToken,
          latitude: 40.7128,
          longitude: -74.0060,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('attendance');
    });

    it('should return 400 for duplicate attendance', async () => {
      const sessionResponse = await request(app)
        .get(`/api/qr/active/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      const qrToken = sessionResponse.body.data.token;

      const response = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          qrToken,
          latitude: 40.7128,
          longitude: -74.0060,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/attendance/my', () => {
    it('should get student attendance records', async () => {
      const response = await request(app)
        .get('/api/attendance/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

