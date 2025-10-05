const http = require('http');

const searchData = JSON.stringify({
  userId: 'test-user',
  keywords: 'machine learning',
  page: 1
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': searchData.length
  }
};

console.log('\n🧪 Testing API with New Crawler...\n');
console.log('═══════════════════════════════════════════════════════════\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      const results = response.data?.results || [];
      
      console.log(`✅ Status: ${response.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`📊 Total Results: ${results.length}`);
      console.log(`📄 Current Page: ${response.data?.currentPage}`);
      console.log(`📚 Total Pages: ${response.data?.totalPages}\n`);
      
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('📋 First 3 Results:\n');
      
      results.slice(0, 3).forEach((result, i) => {
        console.log(`${i + 1}. ${result.title || 'No title'}`);
        console.log(`   🏛️  Institution: ${result.institution || 'N/A'}`);
        console.log(`   💰 Funding: ${result.funding || 'N/A'}`);
        console.log(`   📅 Deadline: ${result.deadline || 'N/A'}`);
        console.log(`   📝 Desc: ${(result.description || 'N/A').substring(0, 80)}...`);
        console.log(`   🔗 URL: ${result.url ? result.url.substring(0, 60) + '...' : 'N/A'}\n`);
      });
      
      // Quality Analysis
      const noTitle = results.filter(r => r.title === 'No title').length;
      const withUrl = results.filter(r => r.url && r.url.length > 0).length;
      const withInst = results.filter(r => r.institution && r.institution.length > 0).length;
      const withDesc = results.filter(r => r.description && r.description.length > 30).length;
      const withFunding = results.filter(r => r.funding && r.funding.length > 0).length;
      
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('📊 Quality Analysis:\n');
      console.log(`Total Results: ${results.length}`);
      console.log(`With "No title": ${noTitle} (${(noTitle/results.length*100).toFixed(1)}%)`);
      console.log(`With URL: ${withUrl} (${(withUrl/results.length*100).toFixed(1)}%)`);
      console.log(`With Institution: ${withInst} (${(withInst/results.length*100).toFixed(1)}%)`);
      console.log(`With Description: ${withDesc} (${(withDesc/results.length*100).toFixed(1)}%)`);
      console.log(`With Funding: ${withFunding} (${(withFunding/results.length*100).toFixed(1)}%)\n`);
      
      if (noTitle === 0 && withUrl === results.length) {
        console.log('✅✅✅ SUCCESS! Crawler is working perfectly!\n');
      } else if (noTitle < results.length * 0.1) {
        console.log('⚠️  Mostly working, but some issues remain\n');
      } else {
        console.log('❌ PROBLEM: Too many "No title" results\n');
      }
      
      console.log('═══════════════════════════════════════════════════════════\n');
      
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
  console.log('\nMake sure the server is running on http://localhost:3000\n');
});

req.write(searchData);
req.end();
