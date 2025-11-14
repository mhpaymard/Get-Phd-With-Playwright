/**
 * تست Crawler v3 با چند keyword مختلف
 */

const FindAPhDCrawlerV3 = require('./src/workers/playwrightCrawler-v3');
const fs = require('fs');

async function testMultipleKeywords() {
    console.log('\n' + '='.repeat(120));
    console.log('🧪 Testing Crawler v3 با چند Keyword');
    console.log('='.repeat(120) + '\n');

    const crawler = new FindAPhDCrawlerV3();
    const keywords = ['a', 'e', 'i']; // تست 3 keyword
    const allResults = [];

    try {
        for (const keyword of keywords) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🔤 Testing keyword: "${keyword}"`);
            console.log('='.repeat(60));

            const result = await crawler.crawlSearchPage(keyword, {}, 1);

            console.log(`✅ Found: ${result.results.length} PhDs`);
            console.log(`   Pages: ${result.totalPages}`);

            // Statistics
            const stats = {
                hasDeadline: result.results.filter(r => r.deadlineText).length,
                hasSupervisor: result.results.filter(r => r.supervisor).length,
                hasDisciplines: result.results.filter(r => r.disciplines && r.disciplines.length > 0).length,
                hasCountry: result.results.filter(r => r.country).length
            };

            console.log(`   Deadline: ${stats.hasDeadline}/${result.results.length} (${Math.round(stats.hasDeadline/result.results.length*100)}%)`);
            console.log(`   Supervisor: ${stats.hasSupervisor}/${result.results.length} (${Math.round(stats.hasSupervisor/result.results.length*100)}%)`);
            console.log(`   Disciplines: ${stats.hasDisciplines}/${result.results.length} (${Math.round(stats.hasDisciplines/result.results.length*100)}%)`);
            console.log(`   Country: ${stats.hasCountry}/${result.results.length} (${Math.round(stats.hasCountry/result.results.length*100)}%)`);

            allResults.push({
                keyword,
                count: result.results.length,
                results: result.results
            });

            // تاخیر بین keywords
            await new Promise(resolve => setTimeout(resolve, 3001));
        }

        // خلاصه کل
        console.log('\n' + '='.repeat(120));
        console.log('📊 خلاصه کل تست‌ها');
        console.log('='.repeat(120) + '\n');

        const totalPhds = allResults.reduce((sum, r) => sum + r.count, 0);
        console.log(`✅ Total PhDs extracted: ${totalPhds}`);

        keywords.forEach(keyword => {
            const result = allResults.find(r => r.keyword === keyword);
            console.log(`   Keyword "${keyword}": ${result.count} PhDs`);
        });

        // بررسی unique بودن
        const allPhdsFlat = allResults.flatMap(r => r.results);
        const uniqueUrls = new Set(allPhdsFlat.map(p => p.url));
        console.log(`\n📊 Unique PhDs (by URL): ${uniqueUrls.size}`);
        console.log(`   Duplicates across keywords: ${totalPhds - uniqueUrls.size}`);

        // Save
        fs.writeFileSync('multi-keyword-test.json', JSON.stringify({
            metadata: {
                testedAt: new Date().toISOString(),
                keywords,
                totalPhds,
                uniquePhds: uniqueUrls.size
            },
            results: allResults
        }, null, 2), 'utf8');

        console.log('\n✅ Test کامل شد!');
        console.log('📁 Saved to: multi-keyword-test.json\n');

        await crawler.closeBrowser();

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await crawler.closeBrowser();
        process.exit(1);
    }
}

testMultipleKeywords();