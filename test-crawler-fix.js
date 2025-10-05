// تست سریع API با کد جدید
const http = require('http');

function testSearch() {
  const data = JSON.stringify({
    userId: 'test-user-debug',
    keywords: 'machine learning'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('🔍 Testing search with improved crawler...\n');
  console.log('Request:', JSON.parse(data));
  console.log('\n⏳ Sending request...\n');

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(responseData);
        
        console.log('📊 Response Summary:');
        console.log('─'.repeat(50));
        console.log('Success:', response.success);
        console.log('Session ID:', response.sessionId);
        console.log('Search ID:', response.searchId);
        console.log('Status:', response.status);
        
        if (response.data && response.data.results) {
          console.log('\n📄 Results:', response.data.results.length, 'items');
          console.log('Current Page:', response.data.currentPage);
          console.log('Total Pages:', response.data.totalPages);
          
          console.log('\n✅ First 3 Results:');
          console.log('─'.repeat(50));
          
          response.data.results.slice(0, 3).forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.title}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   Institution: ${result.institution || '(empty)'}`);
            console.log(`   Location: ${result.location || '(empty)'}`);
            console.log(`   Funding: ${result.funding || '(empty)'}`);
          });
          
          // چک کردن مشکل "No title"
          const noTitleCount = response.data.results.filter(r => r.title === 'No title').length;
          const emptyTitleCount = response.data.results.filter(r => !r.title || r.title.trim() === '').length;
          
          console.log('\n📈 Quality Check:');
          console.log('─'.repeat(50));
          console.log('Results with "No title":', noTitleCount);
          console.log('Results with empty title:', emptyTitleCount);
          console.log('Results with valid title:', response.data.results.length - noTitleCount - emptyTitleCount);
          
          if (noTitleCount === response.data.results.length) {
            console.log('\n❌ PROBLEM: All results have "No title"!');
            console.log('The crawler selectors need to be updated.');
            console.log('Check debug-error-*.png screenshot if exists.');
          } else if (noTitleCount > response.data.results.length / 2) {
            console.log('\n⚠️  WARNING: More than half results have "No title"!');
          } else if (noTitleCount === 0) {
            console.log('\n✅ PERFECT: All results have valid titles!');
          } else {
            console.log('\n✓ GOOD: Most results have valid titles.');
          }
        }
        
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.log('Raw response:', responseData.substring(0, 500));
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.write(data);
  req.end();
}

// اجرا
testSearch();
