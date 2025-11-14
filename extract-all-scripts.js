/**
 * استخراج کامل تمام اسکریپت‌های JSON-LD
 * ذخیره HTML کامل + تک تک اسکریپت‌ها
 */

const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

async function extractAllScripts() {
    console.log('\n' + '='.repeat(120));
    console.log('🔍 استخراج کامل تمام اسکریپت‌های JSON-LD');
    console.log('='.repeat(120) + '\n');

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('→ Loading page...\n');
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

        // 1. ذخیره HTML کامل
        console.log('→ Saving full HTML...\n');
        const html = await page.content();
        fs.writeFileSync('page-html.html', html, 'utf8');
        console.log(`✅ HTML saved: page-html.html (${html.length} bytes)\n`);

        // 2. استخراج تمام اسکریپت‌های JSON-LD
        console.log('→ Extracting all JSON-LD scripts...\n');

        const scriptsData = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            const results = [];

            scripts.forEach((script, index) => {
                try {
                    const jsonText = script.textContent;
                    const jsonData = JSON.parse(jsonText);

                    results.push({
                        scriptIndex: index + 1,
                        rawText: jsonText,
                        parsed: jsonData,
                        textLength: jsonText.length
                    });
                } catch (e) {
                    results.push({
                        scriptIndex: index + 1,
                        error: e.message,
                        rawText: script.textContent.substring(0, 200)
                    });
                }
            });

            return results;
        });

        console.log(`✅ Found ${scriptsData.length} JSON-LD scripts\n`);

        // 3. ذخیره هر اسکریپت به صورت جداگانه
        console.log('→ Saving individual scripts...\n');

        scriptsData.forEach((script, idx) => {
            const filename = `script-${idx + 1}.json`;
            fs.writeFileSync(filename, JSON.stringify(script, null, 2), 'utf8');
            console.log(`   ✅ Saved: ${filename} (${script.textLength || 0} bytes)`);
        });

        // 4. آنالیز تمام Course ها در همه اسکریپت‌ها
        console.log('\n' + '='.repeat(120));
        console.log('📊 آنالیز Course ها در هر اسکریپت');
        console.log('='.repeat(120) + '\n');

        const allCoursesDetailed = [];

        scriptsData.forEach((script, scriptIdx) => {
            if (script.error) {
                console.log(`Script ${script.scriptIndex}: ❌ Parse error`);
                return;
            }

            const data = script.parsed;
            let courses = [];

            if (Array.isArray(data)) {
                courses = data.filter(item => item['@type'] === 'Course');
            } else if (data && data['@type'] === 'Course') {
                courses = [data];
            }

            console.log(`Script ${script.scriptIndex}: Found ${courses.length} Course items`);

            courses.forEach(course => {
                allCoursesDetailed.push({
                    scriptIndex: script.scriptIndex,
                    title: course.name,
                    university: course.provider ? .name,
                    descriptionLength: course.description ? .length || 0,
                    hasDeadlineInDesc: course.description ? .toLowerCase().includes('deadline'),
                    description: course.description
                });
            });
        });

        console.log(`\n✅ Total Course items: ${allCoursesDetailed.length}\n`);

        // 5. جستجوی خاص برای "Climate impacts"
        console.log('='.repeat(120));
        console.log('🔍 جستجوی خاص برای "Climate impacts from water-rich"');
        console.log('='.repeat(120) + '\n');

        const climatePhds = allCoursesDetailed.filter(c =>
            c.title && c.title.toLowerCase().includes('climate') && c.title.toLowerCase().includes('water')
        );

        console.log(`Found ${climatePhds.length} matches for "Climate impacts"\n`);

        climatePhds.forEach(phd => {
            console.log(`▼ در Script #${phd.scriptIndex}:`);
            console.log(`   Title: ${phd.title}`);
            console.log(`   University: ${phd.university}`);
            console.log(`   Description Length: ${phd.descriptionLength} chars`);
            console.log(`   Has "deadline" keyword: ${phd.hasDeadlineInDesc ? '✅' : '❌'}`);

            if (phd.description) {
                console.log('\n   🔍 جستجوی Deadline در Description:\n');

                // جستجوی تمام تاریخ‌ها
                const datePattern = /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi;
                const dates = phd.description.match(datePattern);

                if (dates) {
                    console.log(`   📅 تاریخ‌های پیدا شده (${dates.length}):`);
                    dates.forEach(date => console.log(`      - ${date}`));
                } else {
                    console.log('   ❌ هیچ تاریخی پیدا نشد');
                }

                // جستجوی deadline با context
                const deadlineWithContext = /(.{0,80}deadline.{0,100})/gi;
                const deadlineMatches = phd.description.match(deadlineWithContext);

                if (deadlineMatches) {
                    console.log(`\n   🎯 Context حول کلمه "deadline" (${deadlineMatches.length}):`);
                    deadlineMatches.slice(0, 3).forEach((match, idx) => {
                        console.log(`      ${idx + 1}. "${match.trim()}"`);
                    });
                }
            }

            console.log('\n' + '─'.repeat(120) + '\n');
        });

        // 6. نمایش خلاصه همه Course ها
        console.log('='.repeat(120));
        console.log('📋 لیست کامل همه Course ها');
        console.log('='.repeat(120) + '\n');

        const uniqueCourses = new Map();
        allCoursesDetailed.forEach(c => {
            const key = `${c.title}::${c.university}`;
            if (!uniqueCourses.has(key)) {
                uniqueCourses.set(key, [c]);
            } else {
                uniqueCourses.get(key).push(c);
            }
        });

        console.log(`Total unique Course names: ${uniqueCourses.size}`);
        console.log(`Total Course instances: ${allCoursesDetailed.length}`);
        console.log(`Duplicates: ${allCoursesDetailed.length - uniqueCourses.size}\n`);

        uniqueCourses.forEach((instances, key) => {
            const [title, university] = key.split('::');
            console.log(`\n📚 ${title.substring(0, 70)}...`);
            console.log(`   University: ${university}`);
            console.log(`   Appears in scripts: ${instances.map(i => i.scriptIndex).join(', ')}`);

            // چک deadline در تمام instance ها
            const hasDeadlineInAny = instances.some(i => i.hasDeadlineInDesc);
            console.log(`   Has deadline keyword: ${hasDeadlineInAny ? '✅' : '❌'}`);
        });

        // 7. ذخیره آنالیز کامل
        const analysisOutput = {
            metadata: {
                analyzedAt: new Date().toISOString(),
                keyword: 'a',
                page: 1,
                totalScripts: scriptsData.length,
                totalCourses: allCoursesDetailed.length,
                uniqueCourses: uniqueCourses.size
            },
            scripts: scriptsData.map(s => ({
                scriptIndex: s.scriptIndex,
                textLength: s.textLength,
                coursesCount: s.parsed && Array.isArray(s.parsed) ?
                    s.parsed.filter(item => item['@type'] === 'Course').length :
                    (s.parsed && s.parsed['@type'] === 'Course' ? 1 : 0)
            })),
            allCourses: allCoursesDetailed,
            uniqueCoursesWithScripts: Array.from(uniqueCourses.entries()).map(([key, instances]) => {
                const [title, university] = key.split('::');
                return {
                    title,
                    university,
                    appearanceCount: instances.length,
                    scriptIndices: instances.map(i => i.scriptIndex),
                    hasDeadlineInAny: instances.some(i => i.hasDeadlineInDesc)
                };
            })
        };

        fs.writeFileSync('all-scripts-analysis.json', JSON.stringify(analysisOutput, null, 2), 'utf8');

        console.log('\n' + '='.repeat(120));
        console.log('✅ آنالیز کامل شد!');
        console.log('\n📁 فایل‌های ایجاد شده:');
        console.log('   - page-html.html (HTML کامل صفحه)');
        for (let i = 1; i <= scriptsData.length; i++) {
            console.log(`   - script-${i}.json (اسکریپت #${i})`);
        }
        console.log('   - all-scripts-analysis.json (آنالیز کامل)');
        console.log('='.repeat(120) + '\n');

        await browser.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await browser.close();
        process.exit(1);
    }
}

extractAllScripts();