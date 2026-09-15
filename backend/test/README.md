# Backend Testing Guide

This project uses **Jest** for testing, with **Supertest** for API integration tests.

## Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Test Structure

```
test/
├── setup.js              # Global test setup
├── unit/                 # Unit tests (mocked dependencies)
│   └── authService.test.js
└── integration/          # Integration tests (real database)
    ├── auth.test.js
    └── attendance.test.js
```

## Writing Tests

### Unit Tests

Unit tests mock external dependencies (database, services, etc.):

```javascript
const authService = require('../../src/services/authService');
const { prisma } = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('authService', () => {
  it('should register user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: '1', email: 'test@example.com' });
    
    const result = await authService.register({...});
    expect(result).toHaveProperty('user');
  });
});
```

### Integration Tests

Integration tests use a real database connection:

```javascript
const request = require('supertest');
const app = require('../../src/app');
const { prisma } = require('../../src/config/database');

describe('Auth API', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it('should register user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', ... });
    
    expect(response.status).toBe(201);
  });
});
```

## Test Database

Integration tests use the same database as development. Make sure to:
- Use a separate test database in production
- Clean up test data in `beforeAll`/`afterAll`
- Use unique test data to avoid conflicts

## Coverage

Coverage reports are generated automatically. Aim for:
- **Unit tests**: 80%+ coverage
- **Integration tests**: Critical paths covered

