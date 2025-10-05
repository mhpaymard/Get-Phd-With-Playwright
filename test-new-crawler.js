/**
 * Test script for the NEW FindAPhD Crawler
 */

const FindAPhDCrawler = require('./src/workers/newPlaywrightCrawler');
const playwright = require('playwright');

// Simple browser pool for testing
class SimpleBrowserPool {
  constructor() {
    this.browser = null;
  }
  
  async acquire() {
    if (!this.browser) {
      this.browser = await playwright.chromium.launch({
        headless: false, // Set to true in production
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }
  
  async release(browser) {
    // Keep browser alive for reuse in this test
  }
  
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

async function testCrawler() {
  console.log('🚀 Testing NEW FindAPhD Crawler\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const pool = new SimpleBrowserPool();
  const crawler = new FindAPhDCrawler(pool);
  
  try {
    // Test 1: Simple search
    console.log('📝 Test 1: Simple keyword search\n');
    const results1 = await crawler.crawlSearchPage('artificial intelligence', {}, 1);
    
    console.log(`\n✅ Results: ${results1.results.length} PhDs found`);
    console.log(`📄 Current Page: ${results1.currentPage}`);
    console.log(`📚 Total Pages: ${results1.totalPages}`);
    console.log(`📊 Total Results: ${results1.totalResults}\n`);
    
    // Show first 3 results
    console.log('─────────────────────────────────────────────────────────\n');
    console.log('First 3 Results:\n');
    
    results1.results.slice(0, 3).forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.title}`);
      console.log(`   🏛️  Institution: ${result.institution || 'N/A'}`);
      console.log(`   📍 Location: ${result.location || 'N/A'}`);
      console.log(`   💰 Funding: ${result.funding || 'N/A'}`);
      console.log(`   📅 Deadline: ${result.deadline || 'N/A'}`);
      console.log(`   👨‍🏫 Supervisor: ${result.supervisor || 'N/A'}`);
      console.log(`   🔗 URL: ${result.url}`);
      if (result.description) {
        console.log(`   📄 Desc: ${result.description.substring(0, 100)}...`);
      }
    });
    
    console.log('\n\n═══════════════════════════════════════════════════════════\n');
    
    // Test 2: Search with filters
    console.log('📝 Test 2: Search with filters (UK students, funded)\n');
    const results2 = await crawler.crawlSearchPage('machine learning', {
      fundingType: '0100', // UK students
    }, 1);
    
    console.log(`\n✅ Results: ${results2.results.length} PhDs found`);
    console.log(`📊 Total Results: ${results2.totalResults}\n`);
    
    // Test 3: Pagination test
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📝 Test 3: Testing pagination (page 2)\n');
    const results3 = await crawler.crawlSearchPage('computer science', {}, 2);
    
    console.log(`\n✅ Results: ${results3.results.length} PhDs found`);
    console.log(`📄 Current Page: ${results3.currentPage}`);
    console.log(`📚 Total Pages: ${results3.totalPages}\n`);
    
    // Quality analysis
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 QUALITY ANALYSIS\n');
    
    const allResults = [...results1.results, ...results2.results, ...results3.results];
    
    const stats = {
      total: allResults.length,
      withTitle: allResults.filter(r => r.title && r.title !== 'No title').length,
      withInstitution: allResults.filter(r => r.institution && r.institution.length > 0).length,
      withURL: allResults.filter(r => r.url && r.url.length > 0).length,
      withDescription: allResults.filter(r => r.description && r.description.length > 30).length,
      withFunding: allResults.filter(r => r.funding && r.funding.length > 0).length,
      withDeadline: allResults.filter(r => r.deadline && r.deadline.length > 0).length,
    };
    
    console.log(`Total Results Tested: ${stats.total}`);
    console.log(`With Valid Title: ${stats.withTitle} (${Math.round(stats.withTitle/stats.total*100)}%)`);
    console.log(`With Institution: ${stats.withInstitution} (${Math.round(stats.withInstitution/stats.total*100)}%)`);
    console.log(`With URL: ${stats.withURL} (${Math.round(stats.withURL/stats.total*100)}%)`);
    console.log(`With Description: ${stats.withDescription} (${Math.round(stats.withDescription/stats.total*100)}%)`);
    console.log(`With Funding Info: ${stats.withFunding} (${Math.round(stats.withFunding/stats.total*100)}%)`);
    console.log(`With Deadline: ${stats.withDeadline} (${Math.round(stats.withDeadline/stats.total*100)}%)`);
    
    if (stats.withTitle === stats.total && stats.withURL === stats.total) {
      console.log('\n✅✅✅ SUCCESS! Crawler is working perfectly!');
    } else {
      console.log('\n⚠️  Some fields are missing. Check the logs above.');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.close();
    console.log('\n✅ Tests complete!\n');
  }
}

// Run tests
testCrawler().catch(console.error);
