const http = require('http');

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (token) options.headers.Authorization = 'Bearer ' + token;
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
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log('=== Testing API Endpoints ===\n');
  
  try {
    // 1. Teacher Login
    const login1 = await apiCall('POST', '/api/auth/login', {
      email: 'teacher1@school.edu',
      password: 'Password123'
    });
    console.log('1. Teacher Login:', login1.status === 200 ? '✅' : '❌');
    if (login1.status === 200) {
      console.log('   User:', login1.body.data.user.email, '- Role:', login1.body.data.user.role);
      const token1 = login1.body.data.token;
      
      // 2. Get Current User
      const me1 = await apiCall('GET', '/api/auth/me', null, token1);
      console.log('2. Get Current User:', me1.status === 200 ? '✅' : '❌');
      if (me1.status === 200) {
        const user = me1.body.data.user || me1.body.data;
        console.log('   Email:', user.email);
      }
      
      // 3. Get Classes (Teacher)
      const classes = await apiCall('GET', '/api/classes', null, token1);
      console.log('3. Get Teacher Classes:', classes.status === 200 ? '✅' : '❌');
      if (classes.status === 200) {
        console.log('   Found', classes.body.data.length, 'classes');
        classes.body.data.forEach(c => {
          console.log('   -', c.code + ':', c.name);
        });
      }
    }
    
    // 4. Student Login
    const login2 = await apiCall('POST', '/api/auth/login', {
      email: 'student1@school.edu',
      password: 'Password123'
    });
    console.log('\n4. Student Login:', login2.status === 200 ? '✅' : '❌');
    if (login2.status === 200) {
      console.log('   User:', login2.body.data.user.email, '- Role:', login2.body.data.user.role);
      const token2 = login2.body.data.token;
      
      // 5. Get Student Classes
      const myClasses = await apiCall('GET', '/api/classes', null, token2);
      console.log('5. Get Student Classes:', myClasses.status === 200 ? '✅' : '❌');
      if (myClasses.status === 200) {
        console.log('   Enrolled in', myClasses.body.data.length, 'classes');
        myClasses.body.data.forEach(c => {
          console.log('   -', c.code + ':', c.name);
        });
      }
    }
    
    console.log('\n=== All API Tests Completed! ===');
  } catch (error) {
    console.error('Error:', error.message);
  }
})();

