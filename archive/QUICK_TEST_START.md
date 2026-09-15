# 🚀 Quick Test Start Guide

## Install Dependencies

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

## Run Tests

### Backend Tests
```bash
cd backend
npm test
```

This will run:
- ✅ Unit tests (mocked dependencies)
- ✅ Integration tests (real database)
- ✅ Coverage report

### Frontend Tests
```bash
cd frontend
npm test
```

This will run:
- ✅ Component tests
- ✅ Service tests
- ✅ Coverage report

## Test Commands

### Backend
```bash
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode
npm run test:unit     # Only unit tests
npm run test:integration  # Only integration tests
```

### Frontend
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode
npm run test:ui       # Visual test UI
npm run test:coverage # With coverage report
```

## What's Tested

### Backend
- ✅ Authentication (register, login, logout)
- ✅ Attendance marking
- ✅ QR session generation
- ✅ API endpoints
- ✅ Error handling

### Frontend
- ✅ Auth service functions
- ✅ Protected routes
- ✅ Component rendering
- ✅ User interactions

## Next Steps

1. **Run the tests** to see them in action
2. **Check coverage** reports to see what's covered
3. **Add more tests** for your specific features
4. **Read TESTING.md** for detailed documentation

## Troubleshooting

**Backend tests failing?**
- Make sure your database is running
- Check `.env` file has correct `DATABASE_URL`
- Integration tests use your actual database

**Frontend tests failing?**
- Make sure all dependencies are installed
- Check `vite.config.ts` has test configuration

---

**Ready to test! 🎉**

