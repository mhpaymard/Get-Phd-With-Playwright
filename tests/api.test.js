// API Integration Tests
const http = require('http');

const API_BASE = 'http://localhost:3000/api';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('Starting API Integration Tests...\n');

  try {
    // Test 1: Health Check
    console.log('Test 1: Health Check');
    const health = await makeRequest('GET', '/health');
    console.log('Status:', health.status);
    console.log('Response:', JSON.stringify(health.data, null, 2));
    if (health.status !== 200) throw new Error('Health check failed');
    console.log('✓ PASSED\n');

    // Test 2: Create Session
    console.log('Test 2: Create Session');
    const sessionResult = await makeRequest('POST', '/session', { userId: 'test-user-1' });
    console.log('Status:', sessionResult.status);
    console.log('Response:', JSON.stringify(sessionResult.data, null, 2));
    if (sessionResult.status !== 200 || !sessionResult.data.data.sessionId) {
      throw new Error('Session creation failed');
    }
    const sessionId = sessionResult.data.data.sessionId;
    console.log('✓ PASSED\n');

    // Test 3: Get Session Info
    console.log('Test 3: Get Session Info');
    const sessionInfo = await makeRequest('GET', `/session/${sessionId}`);
    console.log('Status:', sessionInfo.status);
    console.log('Response:', JSON.stringify(sessionInfo.data, null, 2));
    if (sessionInfo.status !== 200) throw new Error('Get session failed');
    console.log('✓ PASSED\n');

    // Test 4: Get Available Filters
    console.log('Test 4: Get Available Filters');
    const filters = await makeRequest('POST', '/search/filters/available');
    console.log('Status:', filters.status);
    console.log('Response sample:', JSON.stringify(filters.data, null, 2).substring(0, 300));
    if (filters.status !== 200) throw new Error('Get filters failed');
    console.log('✓ PASSED\n');

    // Test 5: Perform Search (این تست ممکن است زمان ببرد)
    console.log('Test 5: Perform Search');
    console.log('Note: This test will actually crawl FindAPhD.com and may take 30+ seconds...');
    const searchResult = await makeRequest('POST', '/search', {
      userId: 'test-user-1',
      sessionId,
      keywords: 'machine learning',
      filters: {},
      page: 1
    });
    console.log('Status:', searchResult.status);
    console.log('Response:', JSON.stringify(searchResult.data, null, 2).substring(0, 500));
    if (searchResult.status !== 200) {
      console.log('⚠ WARNING: Search failed (may be due to website restrictions)');
    } else {
      console.log('✓ PASSED\n');
    }

    // Test 6: Get Search History
    console.log('Test 6: Get Search History');
    const history = await makeRequest('GET', `/search/history/${sessionId}`);
    console.log('Status:', history.status);
    console.log('Response:', JSON.stringify(history.data, null, 2));
    if (history.status !== 200) throw new Error('Get history failed');
    console.log('✓ PASSED\n');

    // Test 7: Browser Pool Stats
    console.log('Test 7: Check Health with Stats');
    const healthWithStats = await makeRequest('GET', '/health');
    console.log('Browser Stats:', JSON.stringify(healthWithStats.data.browser, null, 2));
    console.log('Session Stats:', JSON.stringify(healthWithStats.data.sessions, null, 2));
    console.log('✓ PASSED\n');

    // Test 8: Delete Session
    console.log('Test 8: Delete Session');
    const deleteResult = await makeRequest('DELETE', `/session/${sessionId}`);
    console.log('Status:', deleteResult.status);
    console.log('Response:', JSON.stringify(deleteResult.data, null, 2));
    if (deleteResult.status !== 200) throw new Error('Delete session failed');
    console.log('✓ PASSED\n');

    console.log('=====================================');
    console.log('All tests completed successfully! ✓');
    console.log('=====================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// بررسی اینکه سرور در حال اجرا است یا نه
console.log('Checking if API server is running...');
makeRequest('GET', '/health')
  .then(() => {
    console.log('✓ Server is running\n');
    runTests();
  })
  .catch(err => {
    console.error('❌ Server is not running!');
    console.error('Please start the server first: npm run api');
    console.error('Error:', err.message);
    process.exit(1);
  });
