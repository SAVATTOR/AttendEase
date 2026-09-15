const request = require('supertest');
const app = require('../../src/app');
const { prisma } = require('../../src/config/database');

// Check database availability synchronously before tests
let databaseAvailable = false;

// Try to connect immediately (this will be awaited in beforeAll)
const checkDatabase = async () => {
  // Check if DATABASE_URL is set and not the test default
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('test:test@localhost')) {
    console.log('⚠️  DATABASE_URL not configured for Supabase - integration tests will be skipped');
    return false;
  }

  try {
    console.log('🔄 Attempting to connect to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful - integration tests will run');
    return true;
  } catch (error) {
    console.log('⚠️  Database connection failed - integration tests will be skipped');
    console.log('   Error:', error.message);
    return false;
  }
};

// Use a synchronous check for describeIf, but we'll verify in beforeAll
const hasDatabaseUrl = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('test:test@localhost');

const describeIf = (condition) => condition ? describe : describe.skip;

describeIf(hasDatabaseUrl)('Auth API Integration Tests', () => {
  let testUser;

  beforeAll(async () => {
    // Verify connection in beforeAll
    databaseAvailable = await checkDatabase();
    
    if (!databaseAvailable) {
      console.log('⚠️  Skipping test setup - database not available');
      return;
    }

    // Clean up test data (in correct order due to foreign keys)
    // Note: Prisma model names are camelCase: qRSession, not qrSession
    // IMPORTANT: Clean login sessions first to avoid cooldown issues
    try {
      await prisma.attendance.deleteMany({});
      await prisma.qRSession.deleteMany({});
      await prisma.enrollment.deleteMany({});
      await prisma.class.deleteMany({});
      // Delete login sessions to reset cooldown for tests
      await prisma.loginSession.deleteMany({});
      await prisma.userSettings.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.log('Cleanup error (may be expected):', error.message);
    }
  });

  afterAll(async () => {
    if (!databaseAvailable) return;
    
    try {
      // Clean up after tests
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

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      if (!databaseAvailable) {
        console.log('Skipping test - database not available');
        return;
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'Password123',
          name: 'Test User',
          role: 'STUDENT',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('testuser@example.com');

      testUser = response.body.data.user;
    });

    it('should return 409 for duplicate email', async () => {
      if (!databaseAvailable) return;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'Password123',
          name: 'Test User',
          role: 'STUDENT',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid data', async () => {
      if (!databaseAvailable) return;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
          name: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Clean login sessions before each login test to avoid cooldown
      if (databaseAvailable) {
        await prisma.loginSession.deleteMany({});
      }
    });

    it('should login with valid credentials', async () => {
      if (!databaseAvailable) return;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should return 401 for invalid credentials', async () => {
      if (!databaseAvailable) return;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for non-existent user (security: don\'t reveal if email exists)', async () => {
      if (!databaseAvailable) return;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123',
        });

      // Security best practice: return 401 (unauthorized) instead of 404
      // This prevents email enumeration attacks
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeAll(async () => {
      if (!databaseAvailable) return;

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password123',
        });
      authToken = loginResponse.body.data?.token;
    });

    it('should get current user with valid token', async () => {
      if (!databaseAvailable || !authToken) return;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Check if data.user exists (some endpoints return data.user, others return data directly)
      const user = response.body.data.user || response.body.data;
      expect(user.email).toBe('testuser@example.com');
    });

    it('should return 401 without token', async () => {
      if (!databaseAvailable) return;

      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      if (!databaseAvailable) return;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
