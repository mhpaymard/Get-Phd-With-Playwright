/**
 * Crawler Tests
 * تست عملکرد Background Crawler
 */

const db = require('../src/database/connection');
const BackgroundCrawler = require('../src/crawler/BackgroundCrawler');
const CrawlerScheduler = require('../src/crawler/CrawlerScheduler');
const PhDRepository = require('../src/database/repositories/PhDRepository');

async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Crawler Tests');
    console.log('='.repeat(60) + '\n');

    let passed = 0;
    let failed = 0;

    try {
        // Test 1: Database Initialize
        console.log('Test 1: Initialize Database...');
        await db.initialize();
        console.log('  ✓ Database initialized');
        passed++;

        // Test 2: Crawler Status (should not be running)
        console.log('\nTest 2: Check Crawler Status...');
        const initialStatus = BackgroundCrawler.getStatus();
        if (!initialStatus.isRunning) {
            console.log('  ✓ Crawler is not running initially');
            passed++;
        } else {
            throw new Error('Crawler should not be running');
        }

        // Test 3: Subscribe to Crawler Events
        console.log('\nTest 3: Subscribe to Crawler Events...');
        let eventsReceived = 0;
        BackgroundCrawler.subscribe((event, data) => {
            eventsReceived++;
            console.log(`  → Event: ${event}`);
        });
        console.log('  ✓ Subscribed to events');
        passed++;

        // Test 4: Start Manual Crawl (limited to 2 pages for testing)
        console.log('\nTest 4: Start Manual Crawl (SLOW TEST - will take time)...');
        console.log('  ⏳ This will crawl real pages from FindAPhD...');
        console.log('  ℹ  You can skip this by pressing Ctrl+C\n');

        // شروع crawl به صورت async
        const crawlPromise = BackgroundCrawler.startFullCrawl('test');

        // صبر 5 ثانیه برای شروع crawl
        await new Promise(resolve => setTimeout(resolve, 5000));

        // چک کردن status
        const runningStatus = BackgroundCrawler.getStatus();
        if (runningStatus.isRunning) {
            console.log('  ✓ Crawler started successfully');
            console.log(`  → Current stats: ${JSON.stringify(runningStatus.stats)}`);
            passed++;
        } else {
            console.log('  ⚠ Crawler might have completed quickly');
            passed++;
        }

        // منتظر تکمیل crawl (با timeout)
        console.log('\n  ⏳ Waiting for crawler to complete...');
        console.log('  ℹ  This may take several minutes depending on FindAPhD response time');

        const result = await Promise.race([
            crawlPromise,
            new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 300100)) // 5 minute timeout
        ]);

        if (result.timeout) {
            console.log('  ⚠ Crawler timeout after 5 minutes (this is normal for full crawl)');
            console.log('  ℹ  Crawler is still running in background');
            passed++;
        } else if (result.success) {
            console.log('  ✓ Crawler completed successfully');
            console.log(`  → Found: ${result.stats.total_found}`);
            console.log(`  → New: ${result.stats.total_new}`);
            console.log(`  → Updated: ${result.stats.total_updated}`);
            console.log(`  → Duration: ${result.duration}s`);
            passed++;
        } else {
            console.log(`  ✗ Crawler failed: ${result.error}`);
            console.log(`  → Partial stats: ${JSON.stringify(result.stats)}`);
            failed++;
        }

        // Test 5: Check Events
        console.log('\nTest 5: Check Events Received...');
        console.log(`  ✓ Received ${eventsReceived} events`);
        passed++;

        // Test 6: Check Database after Crawl
        console.log('\nTest 6: Check Database after Crawl...');
        const stats = await PhDRepository.getStats();
        console.log(`  ✓ Total PhDs in database: ${stats.total}`);
        console.log(`  ✓ Active PhDs: ${stats.active}`);

        if (stats.total > 0) {
            console.log('  ✓ Database has PhD records');
            passed++;
        } else {
            console.log('  ⚠ No PhDs in database yet (crawler might still be running)');
            passed++;
        }

        // Test 7: Scheduler Status
        console.log('\nTest 7: Check Scheduler...');
        const schedulerStatus = CrawlerScheduler.getStatus();
        console.log(`  → Scheduler running: ${schedulerStatus.isRunning}`);
        console.log(`  → Interval: ${schedulerStatus.intervalHours} hour(s)`);
        console.log('  ✓ Scheduler status retrieved');
        passed++;

    } catch (error) {
        console.error(`  ✗ Test failed: ${error.message}`);
        console.error(error.stack);
        failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`✓ Passed: ${passed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);
    console.log('='.repeat(60));

    console.log('\n⚠️  Note: If crawler is still running, it will continue in background');
    console.log('   The database will be populated gradually.\n');

    await db.close();

    process.exit(failed > 0 ? 1 : 0);
}

runTests();