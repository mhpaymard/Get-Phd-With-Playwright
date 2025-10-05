/**
 * Swagger Configuration & Documentation Test
 * این اسکریپت تمام endpoint های Swagger رو چک می‌کنه
 */

const http = require('http');

const testEndpoints = [
  { method: 'GET', path: '/', name: 'Root Endpoint' },
  { method: 'GET', path: '/api-docs', name: 'Swagger UI' },
  { method: 'GET', path: '/api/health', name: 'Health Check' },
];

async function testEndpoint(method, path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          name,
          path,
          method,
          statusCode: res.statusCode,
          success,
          response: data.substring(0, 200)
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        name,
        path,
        method,
        statusCode: 0,
        success: false,
        error: e.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name,
        path,
        method,
        statusCode: 0,
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function testSwaggerConfig() {
  console.log('\n🧪 Testing Swagger Configuration...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 1: Check if server is running
  console.log('📡 Checking if server is running...\n');
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint.method, endpoint.path, endpoint.name);
    results.push(result);
    
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.method} ${result.path}`);
    console.log(`   Status: ${result.statusCode}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (result.success) {
      console.log(`   Response: ${result.response.substring(0, 80)}...`);
    }
    console.log();
  }

  // Test 2: Test swagger.json file
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📄 Checking swagger.json file...\n');
  
  try {
    const swagger = require('./swagger.json');
    console.log('✅ swagger.json loaded successfully');
    console.log(`   Title: ${swagger.info.title}`);
    console.log(`   Version: ${swagger.info.version}`);
    console.log(`   Paths: ${Object.keys(swagger.paths).length} endpoints`);
    console.log(`   Schemas: ${Object.keys(swagger.components.schemas).length} models`);
    
    // List all paths
    console.log('\n📋 Available Endpoints:');
    Object.keys(swagger.paths).forEach(path => {
      const methods = Object.keys(swagger.paths[path]);
      methods.forEach(method => {
        const operation = swagger.paths[path][method];
        console.log(`   • ${method.toUpperCase().padEnd(7)} ${path.padEnd(40)} - ${operation.summary || 'No summary'}`);
      });
    });
    
  } catch (e) {
    console.log(`❌ Error loading swagger.json: ${e.message}`);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('📊 Test Summary:\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Swagger is configured correctly.\n');
    console.log('🔗 You can access:');
    console.log('   • Swagger UI:  http://localhost:3000/api-docs');
    console.log('   • API Info:    http://localhost:3000/');
    console.log('   • Health:      http://localhost:3000/api/health');
  } else {
    console.log('\n⚠️  Some tests failed. Check if server is running:');
    console.log('   npm start');
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

// Run tests
testSwaggerConfig().catch(console.error);
