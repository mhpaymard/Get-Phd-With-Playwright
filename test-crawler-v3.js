/**
 * تست Crawler v3.0 - Hybrid Method
 */

const FindAPhDCrawlerV3 = require('./src/workers/playwrightCrawler-v3');
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

async function testV3() {
  console.log('\n' + '='.repeat(120));
  console.log('🚀 Testing Crawler v3.0 - Hybrid Method');
  console.log('='.repeat(120) + '\n');

  const crawler = new FindAPhDCrawlerV3();

  try {
    console.log('→ Crawling keyword "a", page 1...\n');
    
    const result = await crawler.crawlSearchPage('a', {}, 1);

    console.log(`✅ Crawl complete!`);
    console.log(`   Found: ${result.results.length} PhDs`);
    console.log(`   Pages: ${result.totalPages}`);
    console.log(`   Total Results: ${result.totalResults}\n`);

    // اضافه کردن deadlineDate (ISO)
    result.results.forEach(phd => {
      phd.deadlineDate = toIsoDate(phd.deadlineText);
    });

    // Statistics
    const stats = {
      total: result.results.length,
      hasTitle: result.results.filter(r => r.title).length,
      hasUrl: result.results.filter(r => r.url).length,
      hasUniversity: result.results.filter(r => r.university).length,
      hasDepartment: result.results.filter(r => r.department).length,
      hasCountry: result.results.filter(r => r.country).length,
      hasDisciplines: result.results.filter(r => r.disciplines && r.disciplines.length > 0).length,
      hasSubjects: result.results.filter(r => r.subjects && r.subjects.length > 0).length,
      hasSupervisor: result.results.filter(r => r.supervisor).length,
      hasDeadline: result.results.filter(r => r.deadlineText).length,
      hasDeadlineISO: result.results.filter(r => r.deadlineDate).length,
      hasProgramType: result.results.filter(r => r.programType).length,
      hasFunding: result.results.filter(r => r.funding).length,
      hasDescription: result.results.filter(r => r.description).length,
      hasDescriptionFull: result.results.filter(r => r.descriptionFull).length
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

    // Table
    console.log('\n' + '='.repeat(120));
    console.log('📋 Results Table');
    console.log('='.repeat(120) + '\n');

    console.log(
      'No'.padEnd(4) +
      '| Title'.padEnd(55) +
      '| University'.padEnd(30) +
      '| Deadline'.padEnd(18) +
      '| Has Sup'
    );
    console.log('-'.repeat(120));

    result.results.forEach(phd => {
      const t = (s, n) => (s ? (s.length > n ? s.substring(0, n - 3) + '...' : s) : '-').padEnd(n);
      console.log(
        phd.index.toString().padEnd(3) + ' ' +
        '| ' + t(phd.title, 53) +
        '| ' + t(phd.university, 28) +
        '| ' + t(phd.deadlineText, 16) +
        '| ' + (phd.supervisor ? '✅' : '❌')
      );
    });

    // جستجوی Climate impacts
    console.log('\n' + '='.repeat(120));
    console.log('🎯 "Climate impacts" Details:');
    console.log('='.repeat(120) + '\n');

    const climate = result.results.find(r => r.title && r.title.includes('Climate impacts'));
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
        method: 'Hybrid v3.0: HTML + DataLayerManager + JSON-LD'
      },
      statistics: stats,
      results: result.results
    };

    fs.writeFileSync('crawler-v3-results.json', JSON.stringify(output, null, 2), 'utf8');

    console.log('\n' + '='.repeat(120));
    console.log('✅ Test Complete!');
    console.log('\n📁 Results saved to: crawler-v3-results.json');
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

testV3();

