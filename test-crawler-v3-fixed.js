/**
 * تست Crawler v3.0 Fixed - باید 15 تا بگیره!
 */

const FindAPhDCrawlerV3Fixed = require('./src/workers/playwrightCrawler-v3-fixed');
const fs = require('fs');

function toIsoDate(dateText) {
  if (!dateText) return null;
  const m = dateText.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
  if (!m) return null;
  const months = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };
  const day = String(parseInt(m[1], 10)).padStart(2, '0');
  const month = months[m[2].toLowerCase()];
  const year = m[3];
  return month ? `${year}-${month}-${day}` : null;
}

async function testFixed() {
  console.log('\n' + '='.repeat(120));
  console.log('🚀 Testing Crawler v3.0 FIXED - باید 15 تا بگیره!');
  console.log('='.repeat(120) + '\n');

  const crawler = new FindAPhDCrawlerV3Fixed();

  try {
    console.log('→ Crawling keyword "a", page 1...\n');
    
    const result = await crawler.crawlSearchPage('a', {}, 1);

    console.log(`✅ Crawl complete!`);
    console.log(`   Found: ${result.results.length} PhDs`);
    console.log(`   Expected: 15 PhDs`);
    console.log(`   Pages: ${result.totalPages}\n`);

    if (result.results.length !== 15) {
      console.log(`⚠️  WARNING: Expected 15 but got ${result.results.length}!\n`);
    }

    // اضافه کردن deadlineDate
    result.results.forEach(phd => {
      phd.deadlineDate = toIsoDate(phd.deadlineText);
    });

    // Statistics
    const stats = {
      total: result.results.length,
      hasTitle: result.results.filter(r => r.title || r.titleScript).length,
      hasUrl: result.results.filter(r => r.url).length,
      hasUniversity: result.results.filter(r => r.university || r.universityScript).length,
      hasDepartment: result.results.filter(r => r.department).length,
      hasCountry: result.results.filter(r => r.country).length,
      hasDisciplines: result.results.filter(r => r.disciplines && r.disciplines.length > 0).length,
      hasSubjects: result.results.filter(r => r.subjects && r.subjects.length > 0).length,
      hasSupervisor: result.results.filter(r => r.supervisor).length,
      hasDeadline: result.results.filter(r => r.deadlineText).length,
      hasDeadlineISO: result.results.filter(r => r.deadlineDate).length,
      hasProgramType: result.results.filter(r => r.programType).length,
      hasFunding: result.results.filter(r => r.funding).length,
      hasDescription: result.results.filter(r => r.description || r.descriptionScript).length,
      jsonLdMatched: result.results.filter(r => r.jsonLdMatched).length,
      incomplete: result.results.filter(r => !r.title && !r.url).length
    };

    console.log('='.repeat(120));
    console.log('📊 Coverage Statistics');
    console.log('='.repeat(120) + '\n');

    Object.entries(stats).forEach(([field, count]) => {
      if (field === 'total') return;
      const pct = Math.round((count / stats.total) * 100);
      const status = pct === 100 ? '✅' : pct >= 70 ? '⚠️' : '❌';
      console.log(`${status} ${field.padEnd(25)} → ${count}/${stats.total} (${pct}%)`);
    });

    // نمایش همه container IDs
    console.log('\n' + '='.repeat(120));
    console.log('📋 همه Container IDs:');
    console.log('='.repeat(120) + '\n');

    result.results.forEach(phd => {
      const status = (phd.title || phd.titleScript) && phd.url ? '✅' : '⚠️';
      console.log(`${status} ${phd.containerId.padEnd(30)} → Title: ${phd.title ? '✅' : '❌'} | URL: ${phd.url ? '✅' : '❌'} | JSON-LD: ${phd.jsonLdMatched ? '✅' : '❌'}`);
    });

    // Table
    console.log('\n' + '='.repeat(120));
    console.log('📋 Results Table');
    console.log('='.repeat(120) + '\n');

    console.log(
      'No'.padEnd(4) +
      '| Container ID'.padEnd(30) +
      '| Title'.padEnd(50) +
      '| Deadline'.padEnd(18) +
      '| JSON-LD'
    );
    console.log('-'.repeat(120));

    result.results.forEach(phd => {
      const t = (s, n) => (s ? (s.length > n ? s.substring(0, n - 3) + '...' : s) : '-').padEnd(n);
      const title = phd.title || phd.titleScript || '(no title)';
      console.log(
        phd.index.toString().padEnd(3) + ' ' +
        '| ' + t(phd.containerId, 28) +
        '| ' + t(title, 48) +
        '| ' + t(phd.deadlineText, 16) +
        '| ' + (phd.jsonLdMatched ? '✅' : '❌')
      );
    });

    // جستجوی Climate impacts
    console.log('\n' + '='.repeat(120));
    console.log('🎯 "Climate impacts" Details:');
    console.log('='.repeat(120) + '\n');

    const climate = result.results.find(r => 
      (r.title && r.title.includes('Climate')) || 
      (r.titleScript && r.titleScript.includes('Climate'))
    );
    
    if (climate) {
      console.log(JSON.stringify(climate, null, 2));
    } else {
      console.log('❌ Not found');
    }

    // Save
    const output = {
      metadata: {
        crawledAt: new Date().toISOString(),
        keyword: 'a',
        page: 1,
        method: 'Hybrid v3.0 Fixed: HTML + DataLayerManager + JSON-LD (with Script suffix)',
        expectedCount: 15,
        actualCount: result.results.length
      },
      statistics: stats,
      results: result.results
    };

    fs.writeFileSync('crawler-v3-fixed-results.json', JSON.stringify(output, null, 2), 'utf8');

    console.log('\n' + '='.repeat(120));
    console.log('✅ Test Complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   Expected: 15 PhDs`);
    console.log(`   Found: ${result.results.length} PhDs`);
    console.log(`   JSON-LD Matched: ${stats.jsonLdMatched}/${stats.total}`);
    console.log(`   Incomplete: ${stats.incomplete}/${stats.total}`);
    console.log('\n📁 Results saved to: crawler-v3-fixed-results.json');
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

testFixed();

