/**
 * Comprehensive API Functionality Test
 * Tests all endpoints, authentication, and core features
 * 
 * Usage: node comprehensive-ui-test.cjs
 * Make sure backend is running on port 5000
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = '/api';

// Test state
let teacherToken = '';
let studentToken = '';
let testClassId = '';
let testClassCode = '';
let testSessionId = '';
let testUserId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log();
  log('═'.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('═'.repeat(60), 'cyan');
}

// Fixed API call helper
function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    // Properly construct the full path
    const fullPath = path.startsWith('/api') ? path : `${API_BASE}${path}`;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: fullPath,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            body: parsed,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers,
            parseError: e.message,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout after 10s'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test tracking
const results = {
  passed: [],
  failed: [],
  skipped: [],
};

async function test(name, fn) {
  try {
    await fn();
    results.passed.push(name);
    log(`  ✅ ${name}`, 'green');
    return true;
  } catch (error) {
    results.failed.push({ name, error: error.message });
    log(`  ❌ ${name}`, 'red');
    log(`     └─ ${error.message}`, 'gray');
    return false;
  }
}

function skip(name, reason) {
  results.skipped.push({ name, reason });
  log(`  ⏭️  ${name} - ${reason}`, 'yellow');
}

// ============================================
// TEST SUITES
// ============================================

async function testHealthCheck() {
  logSection('🏥 HEALTH CHECK');
  
  await test('API Health Endpoint', async () => {
    const res = await apiCall('GET', '/health');
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    if (!res.body.success) {
      throw new Error('Health check returned success: false');
    }
    log(`     └─ Uptime: ${res.body.uptime?.toFixed(2)}s`, 'gray');
  });

  await test('API Root Info', async () => {
    const res = await apiCall('GET', '/');
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    log(`     └─ Version: ${res.body.version}`, 'gray');
  });
}

async function testAuthentication() {
  logSection('🔐 AUTHENTICATION');

  await test('Teacher Login', async () => {
    const res = await apiCall('POST', '/auth/login', {
      email: 'teacher1@school.edu',
      password: 'Password123',
    });
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}: ${res.body.message || 'Unknown error'}`);
    }
    if (!res.body.data?.token) {
      throw new Error('No token in response');
    }
    
    teacherToken = res.body.data.token;
    testUserId = res.body.data.user.id;
    log(`     └─ Logged in as: ${res.body.data.user.name}`, 'gray');
  });

  await test('Get Current User (Teacher)', async () => {
    const res = await apiCall('GET', '/auth/me', null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    if (res.body.data?.user?.role !== 'TEACHER') {
      throw new Error(`Expected TEACHER role, got ${res.body.data?.user?.role}`);
    }
  });

  await test('Student Login', async () => {
    const res = await apiCall('POST', '/auth/login', {
      email: 'student1@school.edu',
      password: 'Password123',
    });
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    studentToken = res.body.data.token;
    log(`     └─ Logged in as: ${res.body.data.user.name}`, 'gray');
  });

  await test('Invalid Login Rejected', async () => {
    const res = await apiCall('POST', '/auth/login', {
      email: 'teacher1@school.edu',
      password: 'WrongPassword',
    });
    
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('Missing Token Rejected', async () => {
    const res = await apiCall('GET', '/auth/me');
    
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('Invalid Token Rejected', async () => {
    const res = await apiCall('GET', '/auth/me', null, 'invalid-token-12345');
    
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await test('Check Cooldown Status', async () => {
    const res = await apiCall('GET', '/auth/cooldown-status?email=teacher1@school.edu');
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });
}

async function testClassManagement() {
  logSection('📚 CLASS MANAGEMENT');

  await test('Get Teacher Classes', async () => {
    const res = await apiCall('GET', '/classes', null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    const classes = res.body.data || [];
    log(`     └─ Found ${classes.length} existing classes`, 'gray');
    
    if (classes.length > 0) {
      testClassId = classes[0].id;
      testClassCode = classes[0].code;
    }
  });

  await test('Create New Class', async () => {
    const uniqueCode = `TC${Date.now().toString().slice(-6)}`;
    const res = await apiCall('POST', '/classes', {
      name: `Test Class ${Date.now()}`,
      description: 'Automated test class',
      allowedRadius: 50,
      lateThresholdMinutes: 15,
      sessionDurationMins: 60,
    }, teacherToken);
    
    if (res.status !== 201) {
      throw new Error(`Expected 201, got ${res.status}: ${res.body.message || JSON.stringify(res.body)}`);
    }
    
    testClassId = res.body.data.id;
    testClassCode = res.body.data.code;
    log(`     └─ Created: ${res.body.data.name} (Code: ${testClassCode})`, 'gray');
  });

  await test('Get Class by ID', async () => {
    if (!testClassId) throw new Error('No test class ID');
    
    const res = await apiCall('GET', `/classes/${testClassId}`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  await test('Update Class', async () => {
    if (!testClassId) throw new Error('No test class ID');
    
    const res = await apiCall('PUT', `/classes/${testClassId}`, {
      name: `Updated Class ${Date.now()}`,
      allowedRadius: 75,
    }, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  await test('Get Class Students', async () => {
    if (!testClassId) throw new Error('No test class ID');
    
    const res = await apiCall('GET', `/classes/${testClassId}/students`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    const students = res.body.data || [];
    log(`     └─ Enrolled students: ${students.length}`, 'gray');
  });

  await test('Regenerate Class Code', async () => {
    if (!testClassId) throw new Error('No test class ID');
    
    const res = await apiCall('POST', `/classes/${testClassId}/regenerate-code`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    testClassCode = res.body.data.code;
    log(`     └─ New code: ${testClassCode}`, 'gray');
  });

  await test('Student Enroll in Class', async () => {
    if (!testClassCode) throw new Error('No test class code');
    
    const res = await apiCall('POST', '/classes/enroll', {
      classCode: testClassCode,
    }, studentToken);
    
    // 201 = enrolled, 409 = already enrolled (both acceptable)
    if (res.status !== 201 && res.status !== 409) {
      throw new Error(`Expected 201 or 409, got ${res.status}`);
    }
    
    log(`     └─ Status: ${res.status === 201 ? 'Enrolled' : 'Already enrolled'}`, 'gray');
  });

  await test('Get Student Classes', async () => {
    const res = await apiCall('GET', '/classes', null, studentToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    const classes = res.body.data || [];
    log(`     └─ Student enrolled in ${classes.length} classes`, 'gray');
  });

  await test('Student Access Denied to Other Routes', async () => {
    const res = await apiCall('POST', '/classes', {
      name: 'Unauthorized Class',
    }, studentToken);
    
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  });
}

async function testQRSessions() {
  logSection('📱 QR SESSION MANAGEMENT');

  await test('Generate QR Session', async () => {
    if (!testClassId) throw new Error('No test class ID');
    
    const res = await apiCall('POST', '/qr/generate', {
      classId: testClassId,
      latitude: 40.7128,
      longitude: -74.0060,
      duration: 60,
    }, teacherToken);
    
    if (res.status !== 201) {
      throw new Error(`Expected 201, got ${res.status}: ${res.body.message || ''}`);
    }
    
    testSessionId = res.body.data.id;
    log(`     └─ Session ID: ${testSessionId.slice(0, 8)}...`, 'gray');
    log(`     └─ Token: ${res.body.data.token.slice(0, 20)}...`, 'gray');
  });

  await test('Get Active Session', async () => {
    if (!testClassId) throw new Error('No test class ID');
    
    const res = await apiCall('GET', `/qr/active/${testClassId}`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    if (res.body.data) {
      log(`     └─ Active session found, status: ${res.body.data.status}`, 'gray');
    }
  });

  await test('Pause Session', async () => {
    if (!testSessionId) throw new Error('No test session ID');
    
    const res = await apiCall('POST', `/qr/${testSessionId}/pause`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    log(`     └─ Session paused`, 'gray');
  });

  await test('Resume Session', async () => {
    if (!testSessionId) throw new Error('No test session ID');
    
    const res = await apiCall('POST', `/qr/${testSessionId}/resume`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    log(`     └─ Session resumed`, 'gray');
  });

  await test('Get Session Attendance', async () => {
    if (!testSessionId) throw new Error('No test session ID');
    
    const res = await apiCall('GET', `/qr/session/${testSessionId}/attendance`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    log(`     └─ Present: ${res.body.data?.stats?.present || 0}`, 'gray');
  });

  await test('Get Session History', async () => {
    if (!testClassId) throw new Error('No test class ID');
    
    const res = await apiCall('GET', `/qr/history/${testClassId}`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    log(`     └─ Total sessions: ${res.body.data?.total || 0}`, 'gray');
  });

  await test('Student Cannot Generate Session', async () => {
    const res = await apiCall('POST', '/qr/generate', {
      classId: testClassId,
      latitude: 40.7128,
      longitude: -74.0060,
    }, studentToken);
    
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  });

  await test('End Session', async () => {
    if (!testSessionId) throw new Error('No test session ID');
    
    const res = await apiCall('DELETE', `/qr/${testSessionId}`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    log(`     └─ Session ended`, 'gray');
  });
}

async function testAttendance() {
  logSection('📋 ATTENDANCE');

  await test('Get Student Attendance (My Attendance)', async () => {
    const res = await apiCall('GET', '/attendance/my', null, studentToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    const records = res.body.data?.attendances || [];
    log(`     └─ Attendance records: ${records.length}`, 'gray');
  });

  await test('Get Class Attendance (Teacher)', async () => {
    if (!testClassId) throw new Error('No test class ID');
    
    const res = await apiCall('GET', `/attendance/class/${testClassId}`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  await test('Get Attendance Stats (Teacher)', async () => {
    const res = await apiCall('GET', '/attendance/stats', null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    log(`     └─ Total classes: ${res.body.data?.totalClasses || 0}`, 'gray');
  });

  await test('Get Attendance Stats (Student)', async () => {
    const res = await apiCall('GET', '/attendance/stats', null, studentToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    log(`     └─ Attendance rate: ${res.body.data?.attendanceRate || 0}%`, 'gray');
  });

  await test('Attendance with Filters', async () => {
    const res = await apiCall(
      'GET', 
      `/attendance/my?startDate=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&endDate=${new Date().toISOString()}`,
      null, 
      studentToken
    );
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });
}

async function testSettings() {
  logSection('⚙️ SETTINGS');

  await test('Get User Settings', async () => {
    const res = await apiCall('GET', '/settings', null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    log(`     └─ Default radius: ${res.body.data?.defaultAllowedRadius}m`, 'gray');
  });

  await test('Update User Settings', async () => {
    const res = await apiCall('PUT', '/settings', {
      defaultSessionDuration: 45,
      defaultAllowedRadius: 100,
      lateThresholdMinutes: 10,
      emailNotifications: true,
      sessionReminders: true,
    }, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  await test('Update Profile Name', async () => {
    const newName = `Test Teacher ${Date.now().toString().slice(-4)}`;
    const res = await apiCall('PUT', '/settings/profile', {
      name: newName,
    }, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    // Verify change persisted
    const verifyRes = await apiCall('GET', '/auth/me', null, teacherToken);
    if (verifyRes.body.data?.user?.name !== newName) {
      throw new Error('Name change did not persist');
    }
    
    log(`     └─ Updated to: ${newName}`, 'gray');
  });

  await test('Password Validation - Same Password Rejected', async () => {
    const res = await apiCall('PUT', '/settings/password', {
      currentPassword: 'Password123',
      newPassword: 'Password123',
      confirmPassword: 'Password123',
    }, teacherToken);
    
    // Should be rejected (400)
    if (res.status !== 400) {
      throw new Error(`Expected 400 for same password, got ${res.status}`);
    }
    
    log(`     └─ Correctly rejected: ${res.body.message || 'Same password error'}`, 'gray');
  });

  await test('Password Validation - Mismatch Rejected', async () => {
    const res = await apiCall('PUT', '/settings/password', {
      currentPassword: 'Password123',
      newPassword: 'NewPassword123',
      confirmPassword: 'DifferentPassword123',
    }, teacherToken);
    
    if (res.status !== 400) {
      throw new Error(`Expected 400 for mismatch, got ${res.status}`);
    }
  });

  await test('Password Validation - Wrong Current Rejected', async () => {
    const res = await apiCall('PUT', '/settings/password', {
      currentPassword: 'WrongPassword',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    }, teacherToken);
    
    if (res.status !== 400) {
      throw new Error(`Expected 400 for wrong password, got ${res.status}`);
    }
  });

  skip('Change Password (Actual)', 'Skipped to preserve test account');
}

async function testExport() {
  logSection('📥 EXPORT FUNCTIONALITY');

  await test('Export Class Attendance CSV', async () => {
    if (!testClassId) throw new Error('No test class ID');
    
    const res = await apiCall('GET', `/export/class/${testClassId}/csv`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    // Should have CSV content-type header
    if (!res.headers['content-type']?.includes('csv')) {
      throw new Error('Response is not CSV');
    }
    
    log(`     └─ CSV generated successfully`, 'gray');
  });

  await test('Export Student Attendance CSV', async () => {
    const res = await apiCall('GET', '/export/my-attendance/csv', null, studentToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  await test('Export with Date Filters', async () => {
    if (!testClassId) throw new Error('No test class ID');
    
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();
    
    const res = await apiCall(
      'GET',
      `/export/class/${testClassId}/csv?startDate=${startDate}&endDate=${endDate}`,
      null,
      teacherToken
    );
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });
}

async function testUserManagement() {
  logSection('👤 USER MANAGEMENT');

  await test('Get User Profile', async () => {
    const res = await apiCall('GET', '/users/profile', null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  await test('Get Dashboard Stats', async () => {
    const res = await apiCall('GET', '/users/dashboard-stats', null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  await test('Get User by ID', async () => {
    if (!testUserId) throw new Error('No test user ID');
    
    const res = await apiCall('GET', `/users/${testUserId}`, null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  skip('Delete Account', 'Skipped to preserve test accounts');
}

async function testErrorHandling() {
  logSection('🚨 ERROR HANDLING');

  await test('404 for Invalid Endpoint', async () => {
    const res = await apiCall('GET', '/invalid/endpoint/12345', null, teacherToken);
    
    if (res.status !== 404) {
      throw new Error(`Expected 404, got ${res.status}`);
    }
  });

  await test('400 for Invalid UUID', async () => {
    const res = await apiCall('GET', '/classes/not-a-valid-uuid', null, teacherToken);
    
    if (res.status !== 400) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
  });

  await test('403 for Unauthorized Class Access', async () => {
    // Student trying to access teacher-only endpoint
    const res = await apiCall('GET', `/classes/${testClassId}/students`, null, studentToken);
    
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  });

  await test('Validation Error Response Format', async () => {
    const res = await apiCall('POST', '/auth/login', {
      email: 'not-an-email',
      // missing password
    });
    
    if (res.status !== 400) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
    
    if (!res.body.errors || !Array.isArray(res.body.errors)) {
      throw new Error('Expected errors array in response');
    }
  });
}

async function cleanup() {
  logSection('🧹 CLEANUP');

  if (testClassId) {
    await test('Delete Test Class', async () => {
      const res = await apiCall('DELETE', `/classes/${testClassId}`, null, teacherToken);
      
      if (res.status !== 200 && res.status !== 404) {
        throw new Error(`Expected 200 or 404, got ${res.status}`);
      }
    });
  } else {
    skip('Delete Test Class', 'No class to delete');
  }

  await test('Logout Teacher', async () => {
    const res = await apiCall('POST', '/auth/logout', null, teacherToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  await test('Logout Student', async () => {
    const res = await apiCall('POST', '/auth/logout', null, studentToken);
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });
}

// ============================================
// MAIN
// ============================================

async function printSummary() {
  console.log();
  log('═'.repeat(60), 'cyan');
  log('  📊 TEST RESULTS SUMMARY', 'bright');
  log('═'.repeat(60), 'cyan');
  console.log();

  log(`  ✅ Passed:  ${results.passed.length}`, 'green');
  log(`  ❌ Failed:  ${results.failed.length}`, results.failed.length > 0 ? 'red' : 'green');
  log(`  ⏭️  Skipped: ${results.skipped.length}`, 'yellow');
  console.log();

  if (results.failed.length > 0) {
    log('  Failed Tests:', 'red');
    results.failed.forEach(({ name, error }) => {
      log(`    ❌ ${name}`, 'red');
      log(`       ${error}`, 'gray');
    });
    console.log();
  }

  const total = results.passed.length + results.failed.length;
  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;
  
  log(`  Pass Rate: ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');
  log('═'.repeat(60), 'cyan');
  console.log();

  return results.failed.length === 0;
}

async function checkServerRunning() {
  log('\n🔍 Checking server status...', 'cyan');
  
  try {
    const res = await apiCall('GET', '/health');
    if (res.status === 200) {
      log('✅ Backend server is running\n', 'green');
      return true;
    }
  } catch (error) {
    // Server not running
  }
  
  log('❌ Backend server is NOT running!', 'red');
  log('   Start it with: cd backend && npm run dev\n', 'yellow');
  return false;
}

async function main() {
  console.log();
  log('╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║       SMART ATTENDANCE SYSTEM - API TEST SUITE             ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    process.exit(1);
  }

  try {
    await testHealthCheck();
    await testAuthentication();
    await testClassManagement();
    await testQRSessions();
    await testAttendance();
    await testSettings();
    await testExport();
    await testUserManagement();
    await testErrorHandling();
    await cleanup();

    const allPassed = await printSummary();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();

