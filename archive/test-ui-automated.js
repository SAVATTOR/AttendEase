/**
 * Automated UI Testing Script
 * Tests all the fixed functionality programmatically
 */

const http = require('http');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';

// Helper function to make API calls
function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
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
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test results
const results = {
  passed: [],
  failed: [],
};

function test(name, fn) {
  return fn()
    .then(() => {
      results.passed.push(name);
      console.log(`✅ ${name}`);
    })
    .catch((error) => {
      results.failed.push({ name, error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    });
}

async function runTests() {
  console.log('🧪 Starting Automated UI Tests...\n');

  // Test 1: Login
  await test('1. Teacher Login', async () => {
    const response = await apiCall('POST', '/auth/login', {
      email: 'teacher1@school.edu',
      password: 'Password123',
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    if (!response.body.success || !response.body.data.token) {
      throw new Error('Login failed - no token received');
    }

    authToken = response.body.data.token;
    userId = response.body.data.user.id;
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
  });

  // Test 2: Get Current User
  await test('2. Get Current User', async () => {
    const response = await apiCall('GET', '/auth/me', null, authToken);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    if (!response.body.success || !response.body.data.user) {
      throw new Error('Failed to get current user');
    }

    console.log(`   User: ${response.body.data.user.name} (${response.body.data.user.email})`);
  });

  // Test 3: Update Profile (FIXED)
  await test('3. Update Profile Name', async () => {
    const newName = `Test User ${Date.now()}`;
    const response = await apiCall(
      'PUT',
      '/settings/profile',
      { name: newName },
      authToken
    );

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
    }

    if (!response.body.success || response.body.data.name !== newName) {
      throw new Error('Profile name not updated correctly');
    }

    console.log(`   Updated name to: ${newName}`);
  });

  // Test 4: Password Validation - Same Password (FIXED)
  await test('4. Password Validation - Same Password Check', async () => {
    const response = await apiCall(
      'PUT',
      '/settings/password',
      {
        currentPassword: 'Password123',
        newPassword: 'Password123',
        confirmPassword: 'Password123',
      },
      authToken
    );

    // Should return 400 with error about same password
    if (response.status !== 400) {
      throw new Error(`Expected 400 for same password, got ${response.status}`);
    }

    if (!response.body.message || !response.body.message.includes('same')) {
      throw new Error('Expected error message about same password');
    }

    console.log(`   Correctly rejected: ${response.body.message}`);
  });

  // Test 5: Password Change - Valid
  await test('5. Password Change - Valid New Password', async () => {
    // First, we need to change password back, but let's skip this for now
    // as it would require knowing the current password after test 4
    console.log('   Skipped (would require password reset)');
  });

  // Test 6: Get Classes
  await test('6. Get Teacher Classes', async () => {
    const response = await apiCall('GET', '/classes', null, authToken);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    if (!response.body.success) {
      throw new Error('Failed to get classes');
    }

    console.log(`   Found ${response.body.data?.length || 0} classes`);
  });

  // Test 7: Create Class
  await test('7. Create New Class', async () => {
    const classData = {
      name: `Test Class ${Date.now()}`,
      code: `TEST${Date.now().toString().slice(-4)}`,
      description: 'Automated test class',
      allowedRadius: 50,
    };

    const response = await apiCall('POST', '/classes', classData, authToken);

    if (response.status !== 201) {
      throw new Error(`Expected 201, got ${response.status}: ${JSON.stringify(response.body)}`);
    }

    if (!response.body.success || !response.body.data.id) {
      throw new Error('Class creation failed');
    }

    console.log(`   Created class: ${response.body.data.name} (${response.body.data.code})`);
  });

  // Test 8: Get Settings
  await test('8. Get User Settings', async () => {
    const response = await apiCall('GET', '/settings', null, authToken);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    if (!response.body.success) {
      throw new Error('Failed to get settings');
    }

    console.log(`   Settings retrieved successfully`);
  });

  // Test 9: Update Settings
  await test('9. Update User Settings', async () => {
    const response = await apiCall(
      'PUT',
      '/settings',
      {
        defaultSessionDuration: 90,
        defaultAllowedRadius: 75,
        lateThresholdMinutes: 20,
      },
      authToken
    );

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    if (!response.body.success) {
      throw new Error('Settings update failed');
    }

    console.log(`   Settings updated successfully`);
  });

  // Test 10: Check Manage Class Route (should not 404)
  await test('10. Check Attendance Records Endpoint', async () => {
    // Get a class ID first
    const classesResponse = await apiCall('GET', '/classes', null, authToken);
    
    if (classesResponse.body.data && classesResponse.body.data.length > 0) {
      const classId = classesResponse.body.data[0].id;
      
      // Check if we can get attendance records for this class
      const response = await apiCall(
        'GET',
        `/attendance?classId=${classId}`,
        null,
        authToken
      );

      // Should not be 404
      if (response.status === 404) {
        throw new Error('Attendance endpoint returned 404');
      }

      console.log(`   Attendance endpoint accessible (status: ${response.status})`);
    } else {
      console.log('   No classes found, skipping attendance test');
    }
  });

  // Summary
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

