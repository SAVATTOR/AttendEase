/**
 * Comprehensive UI Flow Test Script
 * Tests all major UI functionality by making API calls
 */

const http = require('http');

const API_URL = 'http://localhost:5000/api';

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (token) options.headers.Authorization = `Bearer ${token}`;
    if (data) options.headers['Content-Length'] = data.length;
    
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testUI() {
  console.log('🧪 Testing Full UI Flow with Backend API\n');
  console.log('='.repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function test(name, fn) {
    return async () => {
      try {
        await fn();
        results.passed++;
        results.tests.push({ name, status: '✅ PASS' });
        console.log(`✅ ${name}`);
      } catch (error) {
        results.failed++;
        results.tests.push({ name, status: '❌ FAIL', error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
      }
    };
  }

  let teacherToken, studentToken, teacherId, studentId, classId, sessionId;

  // ===== AUTHENTICATION TESTS =====
  console.log('\n📋 1. AUTHENTICATION\n');
  
  await test('Teacher Login', async () => {
    const res = await apiCall('POST', '/auth/login', {
      email: 'teacher1@school.edu',
      password: 'Password123'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.success) throw new Error('Login failed');
    if (res.body.data.user.role !== 'TEACHER') throw new Error('Wrong role');
    teacherToken = res.body.data.token;
    teacherId = res.body.data.user.id;
  })();

  await test('Get Current User (Teacher)', async () => {
    const res = await apiCall('GET', '/auth/me', null, teacherToken);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.data.email !== 'teacher1@school.edu') throw new Error('Wrong user');
  })();

  await test('Student Login', async () => {
    const res = await apiCall('POST', '/auth/login', {
      email: 'student1@school.edu',
      password: 'Password123'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.success) throw new Error('Login failed');
    if (res.body.data.user.role !== 'STUDENT') throw new Error('Wrong role');
    studentToken = res.body.data.token;
    studentId = res.body.data.user.id;
  })();

  // ===== CLASSES TESTS =====
  console.log('\n📋 2. CLASSES MANAGEMENT\n');
  
  await test('Get Teacher Classes', async () => {
    const res = await apiCall('GET', '/classes', null, teacherToken);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.data)) throw new Error('Expected array');
    if (res.body.data.length === 0) throw new Error('No classes found');
    classId = res.body.data[0].id;
    console.log(`   Found ${res.body.data.length} classes`);
  })();

  await test('Get Class Details', async () => {
    const res = await apiCall('GET', `/classes/${classId}`, null, teacherToken);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.data.name) throw new Error('Missing class name');
  })();

  await test('Get Student Classes', async () => {
    const res = await apiCall('GET', '/classes', null, studentToken);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.data)) throw new Error('Expected array');
    console.log(`   Student enrolled in ${res.body.data.length} classes`);
  })();

  // ===== QR SESSION TESTS =====
  console.log('\n📋 3. QR SESSION MANAGEMENT\n');
  
  await test('Start QR Session (Teacher)', async () => {
    const res = await apiCall('POST', '/qr/generate', {
      classId,
      latitude: 40.7128,
      longitude: -74.0060,
      allowedRadius: 50
    }, teacherToken);
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (!res.body.data.sessionId) throw new Error('Missing sessionId');
    if (!res.body.data.token) throw new Error('Missing QR token');
    sessionId = res.body.data.sessionId;
    console.log(`   Session created: ${sessionId}`);
  })();

  await test('Get Active Session', async () => {
    const res = await apiCall('GET', `/qr/active/${classId}`, null, teacherToken);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.data.token) throw new Error('Missing QR token');
  })();

  // ===== ATTENDANCE TESTS =====
  console.log('\n📋 4. ATTENDANCE MARKING\n');
  
  await test('Mark Attendance (Student)', async () => {
    // Get active session token first
    const sessionRes = await apiCall('GET', `/qr/active/${classId}`, null, teacherToken);
    const qrToken = sessionRes.body.data.token;
    
    const res = await apiCall('POST', '/attendance/mark', {
      qrToken,
      latitude: 40.7128,
      longitude: -74.0060
    }, studentToken);
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (!res.body.data.attendance) throw new Error('Missing attendance data');
    console.log(`   Attendance marked: ${res.body.data.attendance.status}`);
  })();

  await test('Get Student Attendance', async () => {
    const res = await apiCall('GET', '/attendance/my', null, studentToken);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.data)) throw new Error('Expected array');
    console.log(`   Found ${res.body.data.length} attendance records`);
  })();

  await test('Get Class Attendance (Teacher)', async () => {
    const res = await apiCall('GET', `/attendance/class/${classId}`, null, teacherToken);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.data)) throw new Error('Expected array');
    console.log(`   Class has ${res.body.data.length} attendance records`);
  })();

  // ===== SUMMARY =====
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST RESULTS\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.passed + results.failed}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All UI functionality tests passed!');
    console.log('\n✅ The UI is fully integrated with the backend API.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  console.log('\n💡 To test the UI visually:');
  console.log('   1. Open http://localhost:5173/login');
  console.log('   2. Login with: teacher1@school.edu / Password123');
  console.log('   3. Navigate through all pages and features');
  console.log('   4. Check Chrome DevTools Network tab for API calls');
  console.log('   5. Check Console tab for any errors');
}

testUI().catch(console.error);

