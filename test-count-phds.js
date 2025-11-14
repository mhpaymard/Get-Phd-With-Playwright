/**
 * تست تعداد PhD ها - چرا فقط 7 تا می‌گیریم؟
 */

const playwright = require('playwright');

async function testCount() {
    console.log('\n🔍 بررسی تعداد واقعی PhD ها در صفحه\n');

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://www.findaphd.com/phds/?Keywords=a', {
            waitUntil: 'networkidle',
            timeout: 90000
        });

        // Cookie
        try {
            const acceptButton = page.locator('button:has-text("Accept all")').first();
            if (await acceptButton.isVisible({ timeout: 3001 })) {
                await acceptButton.click();
                await page.waitForTimeout(1000);
            }
        } catch {}

        await page.waitForTimeout(2000);

        console.log('✅ Page loaded\n');

        // تست selectors مختلف
        const counts = await page.evaluate(() => {
            return {
                // Selector های مختلف
                'div.phd-result': document.querySelectorAll('div.phd-result').length,
                '.phd-result': document.querySelectorAll('.phd-result').length,
                '[id^="searchResultImpression"]': document.querySelectorAll('[id^="searchResultImpression"]').length,
                '.resultsRow': document.querySelectorAll('.resultsRow').length,
                'a[href*="/phds/project/"]': document.querySelectorAll('a[href*="/phds/project/"]').length,

                // لیست ID ها
                searchResultIds: Array.from(document.querySelectorAll('[id^="searchResultImpression"]'))
                    .map(el => el.id)
            };
        });

        console.log('📊 تعداد elements با selector های مختلف:\n');
        Object.entries(counts).forEach(([selector, count]) => {
            if (selector === 'searchResultIds') return;
            console.log(`   ${selector.padEnd(40)} → ${count} items`);
        });

        console.log('\n📋 لیست searchResultImpression IDs:\n');
        counts.searchResultIds.forEach(id => console.log(`   - ${id}`));

        console.log(`\n✅ Total: ${counts.searchResultIds.length} PhDs\n`);

        // تست extraction با selector درست
        console.log('→ Testing extraction با [id^="searchResultImpression"]...\n');

        const testResults = await page.evaluate(() => {
            const containers = document.querySelectorAll('[id^="searchResultImpression"]');
            const results = [];

            containers.forEach((container, index) => {
                const titleSpan = container.querySelector('.h4, h3 .h4');
                const titleLink = container.querySelector('a[href*="/phds/project/"]');
                const calendar = container.querySelector('.fa-calendar');
                const supervisor = container.querySelector('.phd-result__key-info.super');

                results.push({
                    id: container.id,
                    hasTitle: !!titleSpan,
                    hasUrl: !!titleLink,
                    hasDeadline: !!calendar,
                    hasSupervisor: !!supervisor,
                    title: titleSpan ? titleSpan.textContent.trim().substring(0, 60) : '(not found)'
                });
            });

            return results;
        });

        console.log('📋 نتایج تست:\n');
        testResults.forEach(r => {
            console.log(`${r.id}:`);
            console.log(`   Title: ${r.hasTitle ? '✅' : '❌'} ${r.title}`);
            console.log(`   URL: ${r.hasUrl ? '✅' : '❌'}`);
            console.log(`   Deadline: ${r.hasDeadline ? '✅' : '❌'}`);
            console.log(`   Supervisor: ${r.hasSupervisor ? '✅' : '❌'}`);
            console.log('');
        });

        console.log('='.repeat(80));
        console.log(`✅ باید ${testResults.length} PhD extract بشه!`);
        console.log('='.repeat(80) + '\n');

        await browser.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await browser.close();
    }
}

testCount();