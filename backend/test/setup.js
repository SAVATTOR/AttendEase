// Test setup file
// This runs before all tests

// Load environment variables from .env file first
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Set test environment variables (only if not already set)
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-purposes-only-minimum-64-characters';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.PORT = process.env.PORT || '5001';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Use DATABASE_URL from .env if available (for Supabase), otherwise use test default
// Note: Integration tests will use the live Supabase database if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  console.log('⚠️  No DATABASE_URL found in .env - using test database default');
  console.log('   Integration tests will be skipped unless DATABASE_URL is set');
} else {
  console.log('✅ Using DATABASE_URL from .env for integration tests');
}

