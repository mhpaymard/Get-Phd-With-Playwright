/**
 * تست صفحه آخر - چک کردن handle کردن کمتر از 15 PhD
 */

const FindAPhDCrawler = require('./src/workers/playwrightCrawler');

async function testLastPage() {
  console.log('\n' + '='.repeat(120));
  console.log('🧪 تست صفحه آخر - کمتر از 15 PhD');
  console.log('='.repeat(120) + '\n');

  const crawler = new FindAPhDCrawler();

  try {
    // پیدا کردن آخرین صفحه
    console.log('→ Finding last page...\n');
    
    const firstPage = await crawler.crawlSearchPage('a', {}, 1);
    const totalPages = firstPage.totalPages;
    
    console.log(`✅ Total pages: ${totalPages}\n`);
    
    if (totalPages < 2) {
      console.log('⚠️  Only 1 page available, cannot test last page');
      await crawler.closeBrowser();
      return;
    }

    // تست آخرین صفحه
    console.log(`→ Testing last page (${totalPages})...\n`);
    
    const lastPage = await crawler.crawlSearchPage('a', {}, totalPages);
    
    console.log(`✅ Last page results:`);
    console.log(`   Found: ${lastPage.results.length} PhDs`);
    console.log(`   Expected: ≤15 PhDs (last page may have fewer)\n`);

    // Statistics
    const stats = {
      total: lastPage.results.length,
      hasTitle: lastPage.results.filter(r => r.title || r.titleScript).length,
      hasUrl: lastPage.results.filter(r => r.url).length,
      hasExternalId: lastPage.results.filter(r => r.external_id).length,
      hasUniversity: lastPage.results.filter(r => r.university || r.universityScript).length,
      hasDeadline: lastPage.results.filter(r => r.deadlineText).length,
      jsonLdMatched: lastPage.results.filter(r => r.jsonLdMatched).length
    };

    console.log('='.repeat(120));
    console.log('📊 Coverage Statistics (Last Page)');
    console.log('='.repeat(120) + '\n');

    Object.entries(stats).forEach(([field, count]) => {
      if (field === 'total') return;
      const pct = Math.round((count / stats.total) * 100);
      const status = pct === 100 ? '✅' : pct >= 70 ? '⚠️' : '❌';
      console.log(`${status} ${field.padEnd(25)} → ${count}/${stats.total} (${pct}%)`);
    });

    // نمایش همه container IDs
    console.log('\n' + '='.repeat(120));
    console.log('📋 Container IDs در صفحه آخر:');
    console.log('='.repeat(120) + '\n');

    lastPage.results.forEach(phd => {
      const status = (phd.title || phd.titleScript) && phd.url ? '✅' : '⚠️';
      console.log(`${status} ${phd.containerId || 'N/A'.padEnd(30)} → Title: ${phd.title || phd.titleScript || '(none)'}`);
    });

    // نتیجه
    console.log('\n' + '='.repeat(120));
    if (lastPage.results.length > 0 && lastPage.results.length <= 15) {
      console.log('✅ SUCCESS: Last page handled correctly!');
      console.log(`   Found ${lastPage.results.length} PhDs (expected ≤15)`);
    } else if (lastPage.results.length === 0) {
      console.log('⚠️  WARNING: Last page returned 0 results');
    } else {
      console.log('⚠️  WARNING: Last page has more than 15 results?');
    }
    console.log('='.repeat(120) + '\n');

    await crawler.closeBrowser();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await crawler.closeBrowser();
    process.exit(1);
  }
}

testLastPage();

