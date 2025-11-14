/**
 * تست عمیق JSON-LD
 * بررسی دقیق تمام فیلدها و ساختار JSON-LD
 */

const playwright = require('playwright');
const fs = require('fs');

async function deepTestJsonLd() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 بررسی عمیق JSON-LD از FindAPhD');
    console.log('='.repeat(80) + '\n');

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('→ Loading page: https://www.findaphd.com/phds/?Keywords=a\n');

        await page.goto('https://www.findaphd.com/phds/?Keywords=a', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log('→ Waiting for page to fully load...\n');
        await page.waitForTimeout(2000);

        // Handle cookie
        try {
            const acceptButton = page.locator('button:has-text("Accept all")').first();
            if (await acceptButton.isVisible({ timeout: 3001 })) {
                await acceptButton.click();
                console.log('✅ Cookie accepted\n');
                await page.waitForTimeout(1000);
            }
        } catch (e) {}

        // Scroll to trigger lazy loading
        console.log('→ Scrolling to trigger content loading...\n');
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await page.waitForTimeout(2000);

        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(3001);

        // Extract JSON-LD
        const jsonLdData = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            const allData = [];

            scripts.forEach((script, idx) => {
                try {
                    const data = JSON.parse(script.textContent);
                    allData.push({
                        scriptIndex: idx + 1,
                        data: data
                    });
                } catch (e) {
                    console.error('Error parsing script', idx, e);
                }
            });

            return allData;
        });

        console.log(`✅ Found ${jsonLdData.length} JSON-LD scripts\n`);

        // بررسی هر script
        jsonLdData.forEach(({ scriptIndex, data }) => {
            console.log('█'.repeat(80));
            console.log(`Script #${scriptIndex}`);
            console.log('█'.repeat(80));

            if (Array.isArray(data)) {
                console.log(`\n📦 Type: Array with ${data.length} items\n`);

                // نمایش اولین item به صورت کامل
                if (data[0]) {
                    console.log('▼ First item structure:');
                    console.log(JSON.stringify(data[0], null, 2).substring(0, 1000));
                    console.log('...\n');

                    // شمارش Course items
                    const courses = data.filter(item => item['@type'] === 'Course');
                    console.log(`📚 Total Course items: ${courses.length}`);

                    // بررسی unique بودن
                    const uniqueNames = new Set(courses.map(c => c.name));
                    console.log(`🔍 Unique course names: ${uniqueNames.size}`);

                    if (uniqueNames.size < courses.length) {
                        console.log(`⚠️  WARNING: ${courses.length - uniqueNames.size} duplicate courses detected!`);
                    }

                    // نمایش لیست تمام fields موجود در یک Course
                    if (courses[0]) {
                        console.log('\n📋 Available fields in Course item:');
                        const allKeys = Object.keys(courses[0]);
                        allKeys.forEach(key => {
                            const value = courses[0][key];
                            const type = Array.isArray(value) ? 'Array' : typeof value;
                            console.log(`   - ${key.padEnd(25)} → ${type}`);
                        });

                        // بررسی عمیق‌تر
                        console.log('\n🔬 Deep field analysis:');

                        // Provider
                        if (courses[0].provider) {
                            console.log('\n   📌 provider:');
                            Object.keys(courses[0].provider).forEach(key => {
                                console.log(`      - ${key}: ${courses[0].provider[key]}`);
                            });
                        }

                        // Offers
                        if (courses[0].offers && courses[0].offers.length > 0) {
                            console.log('\n   📌 offers[0]:');
                            Object.keys(courses[0].offers[0]).forEach(key => {
                                console.log(`      - ${key}: ${courses[0].offers[0][key]}`);
                            });
                        }

                        // hasCourseInstance
                        if (courses[0].hasCourseInstance && courses[0].hasCourseInstance.length > 0) {
                            console.log('\n   📌 hasCourseInstance[0]:');
                            const instance = courses[0].hasCourseInstance[0];
                            Object.keys(instance).forEach(key => {
                                if (typeof instance[key] === 'object') {
                                    console.log(`      - ${key}: ${JSON.stringify(instance[key])}`);
                                } else {
                                    console.log(`      - ${key}: ${instance[key]}`);
                                }
                            });
                        }
                    }

                    // نمایش 5 نمونه از course names
                    console.log('\n📚 Sample Course Names:');
                    courses.slice(0, 5).forEach((course, idx) => {
                        console.log(`   ${idx + 1}. ${course.name}`);
                    });

                    // بررسی description برای پیدا کردن اطلاعات اضافی
                    console.log('\n🔍 Analyzing descriptions for hidden data...');
                    if (courses[0] && courses[0].description) {
                        const desc = courses[0].description;

                        // Check for deadline patterns
                        const deadlinePatterns = [
                            /deadline[:\s]+([^.]+)/i,
                            /apply by[:\s]+([^.]+)/i,
                            /applications?.+?by[:\s]+([^.]+)/i,
                            /\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi
                        ];

                        console.log('\n   Searching for patterns in description:');
                        deadlinePatterns.forEach((pattern, idx) => {
                            const matches = desc.match(pattern);
                            if (matches) {
                                console.log(`   ✅ Pattern ${idx + 1} matched: "${matches[0].substring(0, 80)}"`);
                            }
                        });

                        // Check for supervisor
                        if (desc.includes('Supervisor') || desc.includes('supervisor')) {
                            console.log('   ✅ "Supervisor" keyword found in description');
                        }

                        // Check for location/university
                        if (desc.includes('University')) {
                            console.log('   ✅ "University" keyword found in description');
                        }
                    }
                }
            } else {
                console.log(`\n📦 Type: Object\n`);
                console.log(JSON.stringify(data, null, 2).substring(0, 500));
            }

            console.log('\n');
        });

        // Extract URLs from page (برای map کردن به JSON-LD items)
        console.log('='.repeat(80));
        console.log('🔗 Extracting PhD URLs from page');
        console.log('='.repeat(80) + '\n');

        const phdUrls = await page.evaluate(() => {
            const links = document.querySelectorAll('a[href*="/phds/project/"]');
            return Array.from(links).map(link => ({
                href: link.href,
                text: link.textContent ? .trim().substring(0, 100)
            }));
        });

        console.log(`✅ Found ${phdUrls.length} PhD URLs\n`);
        console.log('Sample URLs:');
        phdUrls.slice(0, 5).forEach((link, idx) => {
            console.log(`   ${idx + 1}. ${link.href}`);
        });

        // ذخیره همه چیز
        const fullOutput = {
            metadata: {
                crawledAt: new Date().toISOString(),
                keyword: 'a',
                page: 1,
                totalJsonLdScripts: jsonLdData.length
            },
            jsonLdScripts: jsonLdData,
            phdUrls: phdUrls,
            analysis: {
                totalCoursesInJsonLd: jsonLdData.reduce((sum, script) => {
                    if (Array.isArray(script.data)) {
                        return sum + script.data.filter(item => item['@type'] === 'Course').length;
                    }
                    return sum;
                }, 0),
                totalPhdUrls: phdUrls.length
            }
        };

        fs.writeFileSync(
            'jsonld-deep-analysis.json',
            JSON.stringify(fullOutput, null, 2),
            'utf8'
        );

        console.log('\n' + '='.repeat(80));
        console.log('✅ Deep analysis complete!');
        console.log('\n📁 Detailed results saved to: jsonld-deep-analysis.json');
        console.log('   This file contains:');
        console.log('   - Raw JSON-LD scripts');
        console.log('   - All Course items');
        console.log('   - All PhD URLs from page');
        console.log('   - Analysis data');
        console.log('='.repeat(80) + '\n');

        await browser.close();

    } catch (error) {
        console.error('❌ Error:', error);
        await browser.close();
    }
}

deepTestJsonLd();