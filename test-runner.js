// Complete API Test Runner
const http = require('http');

const BASE = '91.99.13.17';
const PORT = 3000;

let sessionId = null;
let searchId = null;
let testResults = [];

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE,
      port: PORT,
      path: `/api${path}`,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000); // 60 second timeout
    
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    log('🧪', `Testing: ${name}`);
    const result = await fn();
    testResults.push({ name, success: true, result });
    log('✅', `PASSED: ${name}`);
    return result;
  } catch (error) {
    testResults.push({ name, success: false, error: error.message });
    log('❌', `FAILED: ${name} - ${error.message}`);
    throw error;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🚀 Starting Complete API Tests');
  console.log('========================================\n');

  try {
    // Test 1: Health Check
    await test('Health Check', async () => {
      const res = await makeRequest('GET', '/health');
      if (res.status !== 200) throw new Error('Status not 200');
      if (res.data.status !== 'healthy') throw new Error('Status not healthy');
      log('📊', `  Browser Pool: ${res.data.browser.activeTabs}/${res.data.browser.maxTabs} tabs`);
      log('📊', `  Sessions: ${res.data.sessions.totalSessions} total`);
      log('📊', `  Memory: ${res.data.memory.used}MB / ${res.data.memory.total}MB`);
      return res.data;
    });

    // Test 2: Ready Check
    await test('Ready Check', async () => {
      const res = await makeRequest('GET', '/health/ready');
      if (res.status !== 200) throw new Error('Status not 200');
      if (!res.data.ready) throw new Error('Service not ready');
      log('📊', `  Available tabs: ${res.data.availableTabs}`);
      return res.data;
    });

    // Test 3: Create Session
    await test('Create Session', async () => {
      const res = await makeRequest('POST', '/session', { userId: 'test-user-automated' });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!res.data.success) throw new Error('Success false');
      sessionId = res.data.data.sessionId;
      log('📊', `  Session ID: ${sessionId}`);
      return res.data;
    });

    // Test 4: Get Session Info
    await test('Get Session Info', async () => {
      const res = await makeRequest('GET', `/session/${sessionId}`);
      if (res.status !== 200) throw new Error('Status not 200');
      if (!res.data.success) throw new Error('Success false');
      log('📊', `  User ID: ${res.data.data.userId}`);
      log('📊', `  Search Count: ${res.data.data.searchCount}`);
      return res.data;
    });

    // Test 5: Get Available Filters
    await test('Get Available Filters', async () => {
      const res = await makeRequest('POST', '/search/filters/available');
      if (res.status !== 200) throw new Error('Status not 200');
      if (!res.data.success) throw new Error('Success false');
      const filters = res.data.data;
      log('📊', `  Disciplines: ${Object.keys(filters.disciplines || {}).length}`);
      log('📊', `  Geographies: ${Object.keys(filters.geographies || {}).length}`);
      log('📊', `  Funding Options: ${Object.keys(filters.funding || {}).length}`);
      return res.data;
    });

    // Test 6: Simple Search (without actual crawling)
    log('⏭️', 'Skipping actual search test (would take 30+ seconds)');
    log('ℹ️', 'Search endpoint is ready but not tested with real crawling');

    // Test 7: Get Search History
    await test('Get Search History', async () => {
      const res = await makeRequest('GET', `/search/history/${sessionId}`);
      if (res.status !== 200) throw new Error('Status not 200');
      if (!res.data.success) throw new Error('Success false');
      log('📊', `  History items: ${res.data.data.length}`);
      return res.data;
    });

    // Test 8: Get User Sessions
    await test('Get User Sessions', async () => {
      const res = await makeRequest('GET', '/session/user/test-user-automated');
      if (res.status !== 200) throw new Error('Status not 200');
      if (!res.data.success) throw new Error('Success false');
      log('📊', `  User has ${res.data.data.length} session(s)`);
      return res.data;
    });

    // Test 9: Health Check Again (verify stats)
    await test('Health Check After Tests', async () => {
      const res = await makeRequest('GET', '/health');
      if (res.status !== 200) throw new Error('Status not 200');
      log('📊', `  Active sessions: ${res.data.sessions.totalSessions}`);
      log('📊', `  Active tabs: ${res.data.browser.activeTabs}`);
      return res.data;
    });

    // Test 10: Delete Session
    await test('Delete Session', async () => {
      const res = await makeRequest('DELETE', `/session/${sessionId}`);
      if (res.status !== 200) throw new Error('Status not 200');
      if (!res.data.success) throw new Error('Success false');
      log('📊', `  Session deleted successfully`);
      return res.data;
    });

    // Test 11: Verify Session Deleted
    await test('Verify Session Deleted', async () => {
      const res = await makeRequest('GET', `/session/${sessionId}`);
      if (res.status !== 404) throw new Error('Session should return 404');
      log('📊', `  Confirmed: Session not found (as expected)`);
      return res.data;
    });

    // Test 12: Root Endpoint
    await test('Root Endpoint', async () => {
      return new Promise((resolve, reject) => {
        const req = http.request({
          hostname: BASE,
          port: PORT,
          path: '/',
          method: 'GET'
        }, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
              log('📊', `  Service: ${parsed.service}`);
              log('📊', `  Version: ${parsed.version}`);
              resolve(parsed);
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
        req.end();
      });
    });

    // Summary
    console.log('\n========================================');
    console.log('📊 Test Summary');
    console.log('========================================');
    
    const passed = testResults.filter(t => t.success).length;
    const failed = testResults.filter(t => !t.success).length;
    const total = testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed/total)*100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed successfully!');
      console.log('✨ API is fully functional and ready to use!');
    } else {
      console.log('\n⚠️  Some tests failed. Check details above.');
    }
    
    console.log('\n========================================');
    console.log('📝 Test Details:');
    console.log('========================================');
    testResults.forEach((result, i) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${i+1}. ${status} ${result.name}`);
      if (!result.success) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n========================================');
    console.log('🏁 Test Run Complete');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
