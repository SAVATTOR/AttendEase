# 🧪 Testing Guide

This document provides a comprehensive guide for testing the Smart Attendance System.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Running Tests](#running-tests)
- [Writing New Tests](#writing-new-tests)
- [Test Coverage](#test-coverage)

---

## 🚀 Quick Start

### Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Run All Tests

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm test
```

---

## 🔧 Backend Testing

### Test Framework
- **Jest** - Test runner and assertion library
- **Supertest** - HTTP assertion library for API testing

### Test Structure

```
backend/
├── test/
│   ├── setup.js                    # Global test configuration
│   ├── unit/                       # Unit tests (mocked)
│   │   └── authService.test.js
│   └── integration/                 # Integration tests (real DB)
│       ├── auth.test.js
│       └── attendance.test.js
└── jest.config.js                  # Jest configuration
```

### Running Backend Tests

```bash
# Run all tests with coverage
npm test

# Run in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Backend Test Examples

#### Unit Test Example
```javascript
// test/unit/authService.test.js
const authService = require('../../src/services/authService');

jest.mock('../../src/config/database');

describe('authService', () => {
  it('should register a new user', async () => {
    // Mock Prisma
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: '1', email: 'test@example.com' });
    
    const result = await authService.register({
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
      role: 'STUDENT',
    });
    
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
  });
});
```

#### Integration Test Example
```javascript
// test/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'STUDENT',
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Backend Test Database

⚠️ **Important**: Integration tests use your actual database. Make sure to:
- Use a separate test database in production
- Clean up test data in `beforeAll`/`afterAll` hooks
- Use unique test data to avoid conflicts

---

## ⚛️ Frontend Testing

### Test Framework
- **Vitest** - Fast test runner (Vite-native)
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers

### Test Structure

```
frontend/
├── src/
│   ├── test/
│   │   ├── setup.ts                # Global test setup
│   │   └── README.md
│   ├── services/
│   │   └── __tests__/
│   │       └── authService.test.ts
│   └── components/
│       └── auth/
│           └── __tests__/
│               └── ProtectedRoute.test.tsx
└── vite.config.ts                  # Vitest configuration
```

### Running Frontend Tests

```bash
# Run all tests once
npm test

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Frontend Test Examples

#### Service Test Example
```typescript
// src/services/__tests__/authService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { authService } from '../authService';

vi.mock('../api');

describe('authService', () => {
  it('should login successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: { user: {...}, token: 'mock-token' },
      },
    };
    
    (api.post as any).mockResolvedValue(mockResponse);
    
    const result = await authService.login({
      email: 'test@example.com',
      password: 'Password123',
    });
    
    expect(result.success).toBe(true);
    expect(localStorage.getItem('token')).toBe('mock-token');
  });
});
```

#### Component Test Example
```typescript
// src/components/auth/__tests__/ProtectedRoute.test.tsx
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';

describe('ProtectedRoute', () => {
  it('should render children when authenticated', () => {
    // Mock useAuth hook
    vi.mock('@/context/AuthContext', () => ({
      useAuth: () => ({
        user: { id: '1', role: 'STUDENT' },
        isAuthenticated: true,
      }),
    }));
    
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
```

---

## 📝 Writing New Tests

### Backend Test Checklist

1. ✅ **Unit Tests**: Test service functions with mocked dependencies
2. ✅ **Integration Tests**: Test API endpoints with real database
3. ✅ **Error Cases**: Test error handling and edge cases
4. ✅ **Validation**: Test input validation
5. ✅ **Authentication**: Test protected routes

### Frontend Test Checklist

1. ✅ **Component Rendering**: Test components render correctly
2. ✅ **User Interactions**: Test clicks, form submissions, etc.
3. ✅ **Service Functions**: Test API calls and data handling
4. ✅ **Error Handling**: Test error states and messages
5. ✅ **Accessibility**: Test ARIA labels and keyboard navigation

### Test Best Practices

1. **Arrange-Act-Assert (AAA) Pattern**
   ```javascript
   it('should do something', () => {
     // Arrange: Set up test data
     const input = { email: 'test@example.com' };
     
     // Act: Execute the function
     const result = authService.login(input);
     
     // Assert: Check the result
     expect(result).toBeDefined();
   });
   ```

2. **Use Descriptive Test Names**
   ```javascript
   // ✅ Good
   it('should return 401 when token is invalid', ...)
   
   // ❌ Bad
   it('should work', ...)
   ```

3. **Test One Thing Per Test**
   ```javascript
   // ✅ Good - Separate tests
   it('should register with valid email', ...)
   it('should reject invalid email', ...)
   
   // ❌ Bad - Multiple assertions in one test
   it('should handle registration', () => {
     expect(valid).toBe(true);
     expect(invalid).toBe(false);
   });
   ```

4. **Mock External Dependencies**
   ```javascript
   // Mock API calls, database, etc.
   vi.mock('../api');
   jest.mock('../../src/config/database');
   ```

5. **Clean Up After Tests**
   ```javascript
   afterAll(async () => {
     await prisma.user.deleteMany({});
     await prisma.$disconnect();
   });
   ```

---

## 📊 Test Coverage

### Viewing Coverage

**Backend:**
```bash
cd backend
npm test
# Coverage report is displayed in terminal
```

**Frontend:**
```bash
cd frontend
npm run test:coverage
# Coverage HTML report in coverage/ directory
```

### Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **Components**: User-facing components tested

### Current Coverage

Run tests to see current coverage:
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run test:coverage
```

---

## 🐛 Troubleshooting

### Backend Tests

**Issue**: Database connection errors
```bash
# Solution: Check DATABASE_URL in .env
# Make sure database is running
```

**Issue**: Tests timeout
```bash
# Solution: Increase timeout in jest.config.js
testTimeout: 30000, // 30 seconds
```

### Frontend Tests

**Issue**: Module not found errors
```bash
# Solution: Check path aliases in vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

**Issue**: localStorage not working in tests
```bash
# Solution: Mock localStorage in test/setup.ts
```

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

## ✅ Test Checklist

Before committing, ensure:

- [ ] All tests pass (`npm test`)
- [ ] New features have tests
- [ ] Coverage is maintained/improved
- [ ] Integration tests use test database
- [ ] No console errors in tests
- [ ] Tests are fast (< 30s for full suite)

---

**Happy Testing! 🎉**

