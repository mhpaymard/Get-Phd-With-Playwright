/**
 * Database Tests
 * تست عملکرد Database Layer و Repository Pattern
 */

const db = require('../src/database/connection');
const PhDRepository = require('../src/database/repositories/PhDRepository');
const CrawlerLogRepository = require('../src/database/repositories/CrawlerLogRepository');

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Database Tests');
  console.log('='.repeat(60) + '\n');
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: Database Initialize
    console.log('Test 1: Database Initialize...');
    await db.initialize();
    const stats = await db.getStats();
    console.log('  ✓ Database initialized');
    console.log(`  ✓ Type: ${stats.type}`);
    console.log(`  ✓ Total PhDs: ${stats.totalPhDs}`);
    passed++;
    
    // Test 2: Insert PhD
    console.log('\nTest 2: Insert PhD...');
    const testPhD = {
      external_id: 'test-phd-' + Date.now(),
      url: 'https://www.findaphd.com/test',
      title: 'Test PhD in Machine Learning',
      description: 'This is a test PhD position',
      university: 'Test University',
      location: 'London, United Kingdom',
      country: 'United Kingdom',
      discipline: 'Computer Science',
      subject: 'Machine Learning',
      funding_type: 'Funded PhD Project',
      deadline: '2025-12-31'
    };
    
    const insertResult = await PhDRepository.insert(testPhD);
    if (insertResult.success) {
      console.log('  ✓ PhD inserted successfully');
      console.log(`  ✓ ID: ${insertResult.id}`);
      passed++;
    } else {
      throw new Error('Failed to insert PhD');
    }
    
    // Test 3: Find by External ID
    console.log('\nTest 3: Find by External ID...');
    const foundPhD = await PhDRepository.findByExternalId(testPhD.external_id);
    if (foundPhD && foundPhD.title === testPhD.title) {
      console.log('  ✓ PhD found by external_id');
      console.log(`  ✓ Title: ${foundPhD.title}`);
      passed++;
    } else {
      throw new Error('PhD not found');
    }
    
    // Test 4: Update PhD
    console.log('\nTest 4: Update PhD...');
    const updateData = {
      ...testPhD,
      title: 'Updated Test PhD in Machine Learning'
    };
    const updateResult = await PhDRepository.update(testPhD.external_id, updateData);
    if (updateResult.success) {
      console.log('  ✓ PhD updated successfully');
      passed++;
    } else {
      throw new Error('Failed to update PhD');
    }
    
    // Test 5: Search PhD
    console.log('\nTest 5: Search PhD...');
    const searchResult = await PhDRepository.search({
      keywords: 'Machine Learning',
      page: 1,
      limit: 10
    });
    console.log(`  ✓ Search completed`);
    console.log(`  ✓ Found: ${searchResult.results.length} results`);
    console.log(`  ✓ Total: ${searchResult.pagination.total}`);
    passed++;
    
    // Test 6: Get Stats
    console.log('\nTest 6: Get PhD Stats...');
    const phdStats = await PhDRepository.getStats();
    console.log(`  ✓ Total: ${phdStats.total}`);
    console.log(`  ✓ Active: ${phdStats.active}`);
    console.log(`  ✓ Deleted: ${phdStats.deleted}`);
    passed++;
    
    // Test 7: Crawler Log - Start
    console.log('\nTest 7: Crawler Log - Start...');
    const logId = await CrawlerLogRepository.startCrawl('test');
    console.log(`  ✓ Crawler log started`);
    console.log(`  ✓ Log ID: ${logId}`);
    passed++;
    
    // Test 8: Crawler Log - Update Progress
    console.log('\nTest 8: Crawler Log - Update Progress...');
    await CrawlerLogRepository.updateProgress(logId, {
      total_pages: 5,
      total_found: 50,
      total_new: 10,
      total_updated: 30
    });
    console.log('  ✓ Progress updated');
    passed++;
    
    // Test 9: Crawler Log - Complete
    console.log('\nTest 9: Crawler Log - Complete...');
    await CrawlerLogRepository.completeCrawl(logId, {
      total_pages: 10,
      total_found: 100,
      total_new: 20,
      total_updated: 60,
      total_deleted: 5
    });
    console.log('  ✓ Crawler log completed');
    passed++;
    
    // Test 10: Get Crawler Logs
    console.log('\nTest 10: Get Crawler Logs...');
    const logs = await CrawlerLogRepository.getAll(10);
    console.log(`  ✓ Retrieved ${logs.length} logs`);
    passed++;
    
    // Test 11: Mark as Deleted
    console.log('\nTest 11: Mark PhD as Deleted...');
    const deleteResult = await PhDRepository.markAsDeleted([testPhD.external_id]);
    if (deleteResult.success) {
      console.log(`  ✓ Marked ${deleteResult.deleted} PhD(s) as deleted`);
      passed++;
    } else {
      throw new Error('Failed to mark as deleted');
    }
    
  } catch (error) {
    console.error(`  ✗ Test failed: ${error.message}`);
    failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log('='.repeat(60) + '\n');
  
  await db.close();
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

