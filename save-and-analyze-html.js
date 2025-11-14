/**
 * ذخیره HTML کامل صفحه و تحلیل offline
 */

const playwright = require('playwright');
const fs = require('fs');

async function saveAndAnalyze() {
    console.log('\n' + '='.repeat(120));
    console.log('💾 ذخیره HTML کامل و تحلیل');
    console.log('='.repeat(120) + '\n');

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

        await page.waitForTimeout(3001);

        // Scroll برای lazy loading
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(2000);

        // ذخیره HTML کامل
        const html = await page.content();
        fs.writeFileSync('full-page.html', html, 'utf8');
        console.log('✅ HTML saved: full-page.html\n');

        // استخراج اطلاعات
        const data = await page.evaluate(() => {
            const result = {
                allIds: [],
                containers: []
            };

            // همه searchResultImpression*
            const all = document.querySelectorAll('[id^="searchResultImpression"]');
            console.log(`Found ${all.length} containers`);

            all.forEach((container, idx) => {
                const info = {
                    id: container.id,
                    index: idx,
                    innerHTML: container.innerHTML.substring(0, 1000), // اول 1000 کاراکتر
                    outerHTML: container.outerHTML.substring(0, 1000)
                };

                result.allIds.push(container.id);
                result.containers.push(info);
            });

            return result;
        });

        console.log(`📊 Found ${data.allIds.length} containers\n`);

        // ذخیره
        fs.writeFileSync('containers-analysis.json', JSON.stringify(data, null, 2), 'utf8');
        console.log('✅ Analysis saved: containers-analysis.json\n');

        // نمایش خلاصه
        console.log('📋 IDs found:\n');
        data.allIds.forEach((id, idx) => {
            console.log(`   ${(idx + 1).toString().padStart(2)}. ${id}`);
        });

        await browser.close();

        // حالا تحلیل offline
        console.log('\n' + '='.repeat(120));
        console.log('🔍 تحلیل Offline از HTML ذخیره شده');
        console.log('='.repeat(120) + '\n');

        analyzeOffline(html);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await browser.close();

        // اگه HTML ذخیره شده، از اون استفاده کن
        if (fs.existsSync('full-page.html')) {
            console.log('\n→ Using saved HTML for offline analysis...\n');
            const html = fs.readFileSync('full-page.html', 'utf8');
            analyzeOffline(html);
        }
    }
}

function analyzeOffline(html) {
    // استفاده از regex برای پیدا کردن همه searchResultImpression
    const impressionRegex = /id="(searchResultImpression\d+)"/g;
    const matches = [];
    let match;

    while ((match = impressionRegex.exec(html)) !== null) {
        matches.push(match[1]);
    }

    console.log(`📊 Found ${matches.length} searchResultImpression IDs in HTML\n`);

    matches.forEach((id, idx) => {
        console.log(`   ${(idx + 1).toString().padStart(2)}. ${id}`);
    });

    // پیدا کردن content هر container
    console.log('\n' + '='.repeat(120));
    console.log('🔍 تحلیل محتوای هر container:');
    console.log('='.repeat(120) + '\n');

    matches.forEach((id, idx) => {
        // پیدا کردن div با این id
        const idRegex = new RegExp(`<div[^>]*id="${id}"[^>]*>([\\s\\S]*?)</div>`, 'i');
        const containerMatch = html.match(idRegex);

        if (containerMatch) {
            const content = containerMatch[1];

            // چک کردن title
            const hasTitle = /<span[^>]*class="[^"]*h4[^"]*"[^>]*>([^<]+)</i.test(content);
            const hasUrl = /href="([^"]*\/phds\/project\/[^"]*)"/i.test(content);
            const hasDeadline = /fa-calendar/i.test(content);
            const hasSupervisor = /phd-result__key-info super/i.test(content);

            console.log(`\n${idx + 1}. ${id}:`);
            console.log(`   Title:     ${hasTitle ? '✅' : '❌'}`);
            console.log(`   URL:       ${hasUrl ? '✅' : '❌'}`);
            console.log(`   Deadline:  ${hasDeadline ? '✅' : '❌'}`);
            console.log(`   Supervisor: ${hasSupervisor ? '✅' : '❌'}`);

            // اگر title یا url نداره، نشون بده چرا
            if (!hasTitle || !hasUrl) {
                const titleMatch = content.match(/<h3[^>]*>([\s\S]{0,200})<\/h3>/i);
                const urlMatch = content.match(/href="([^"]*\/phds\/project\/[^"]*)"/i);

                console.log(`   ⚠️  Title snippet: ${titleMatch ? titleMatch[1].substring(0, 80) : 'NOT FOUND'}`);
                console.log(`   ⚠️  URL: ${urlMatch ? urlMatch[1] : 'NOT FOUND'}`);
            }
        } else {
            console.log(`\n${idx + 1}. ${id}: ❌ Container not found in HTML`);
        }
    });

    // JSON-LD analysis
    console.log('\n' + '='.repeat(120));
    console.log('📚 تحلیل JSON-LD Scripts:');
    console.log('='.repeat(120) + '\n');

    const scriptRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    const scripts = [];
    let scriptMatch;

    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
        try {
            const jsonData = JSON.parse(scriptMatch[1]);
            scripts.push(jsonData);
        } catch (e) {
            console.warn(`⚠️  Error parsing JSON-LD script: ${e.message}`);
        }
    }

    console.log(`Found ${scripts.length} JSON-LD scripts\n`);

    const courses = [];
    scripts.forEach((data, idx) => {
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item['@type'] === 'Course') {
                    courses.push({
                        scriptIndex: idx + 1,
                        title: item.name,
                        university: item.provider ? .name
                    });
                }
            });
        } else if (data['@type'] === 'Course') {
            courses.push({
                scriptIndex: idx + 1,
                title: data.name,
                university: data.provider ? .name
            });
        }
    });

    console.log(`Found ${courses.length} Course items in JSON-LD\n`);
    courses.forEach((c, idx) => {
        console.log(`${idx + 1}. ${c.title?.substring(0, 60) || '(no title)'}`);
        console.log(`   University: ${c.university || '(not found)'}`);
    });

    // ذخیره
    fs.writeFileSync('offline-analysis.json', JSON.stringify({
        impressionIds: matches,
        jsonLdCourses: courses,
        totalImpressionIds: matches.length,
        totalJsonLdCourses: courses.length
    }, null, 2), 'utf8');

    console.log('\n' + '='.repeat(120));
    console.log('✅ Offline Analysis Complete!');
    console.log('\n📁 Saved to: offline-analysis.json');
    console.log('='.repeat(120) + '\n');
}

saveAndAnalyze();