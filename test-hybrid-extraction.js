/**
 * Hybrid Extraction Method
 * ترکیب JSON-LD + HTML Elements + DataLayerManager
 * برای حداکثر Coverage
 */

const playwright = require('playwright');
const fs = require('fs');

async function testHybridExtraction() {
    console.log('\n' + '='.repeat(120));
    console.log('🚀 Hybrid Extraction: JSON-LD + HTML + DataLayerManager');
    console.log('='.repeat(120) + '\n');

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('→ Loading https://www.findaphd.com/phds/?Keywords=a ...\n');

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

        // Extract همه چیز با یک evaluate
        const extractedData = await page.evaluate(() => {
            const results = [];

            // پیدا کردن تمام PhD result containers
            const containers = document.querySelectorAll('.phd-result');

            containers.forEach((container, index) => {
                const result = {
                    index: index + 1,
                    title: null,
                    url: null,
                    university: null,
                    department: null,
                    location: null,
                    country: null,
                    disciplines: [],
                    subjects: [],
                    supervisor: null,
                    deadline: null,
                    programType: null,
                    funding: null,
                    description: null
                };

                // 1. Title & URL
                const titleLink = container.querySelector('a[href*="/phds/project/"]');
                if (titleLink) {
                    result.url = titleLink.href;
                    const titleSpan = container.querySelector('.h4');
                    if (titleSpan) {
                        result.title = titleSpan.textContent.trim();
                    }
                }

                // 2. University & Department از HTML
                const instTitle = container.querySelector('.phd-result__dept-inst--inst .phd-result__dept-inst--title');
                if (instTitle) {
                    result.university = instTitle.textContent.trim();
                }

                const deptLink = container.querySelector('.phd-result__dept-inst--dept');
                if (deptLink) {
                    result.department = deptLink.textContent.trim();
                }

                // 3. Deadline - از icon calendar
                const calendarSpan = container.querySelector('.fa-calendar');
                if (calendarSpan && calendarSpan.parentElement) {
                    const deadlineText = calendarSpan.parentElement.textContent.trim();
                    result.deadline = deadlineText;
                }

                // 4. Supervisor - از icon person-chalkboard
                const supervisorDiv = container.querySelector('.phd-result__key-info.super');
                if (supervisorDiv) {
                    const iconText = supervisorDiv.querySelector('.icon-text');
                    if (iconText) {
                        let text = iconText.textContent.trim();
                        // حذف "Supervisors:" از اول
                        text = text.replace(/^\s*Supervisors?:\s*/i, '');
                        result.supervisor = text;
                    }
                }

                // 5. Program Type
                const programSpan = container.querySelector('.fa-graduation-cap');
                if (programSpan && programSpan.parentElement) {
                    const programText = programSpan.parentElement.textContent.trim();
                    result.programType = programText;
                }

                // 6. Funding
                const fundingSpan = container.querySelector('.fa-wallet');
                if (fundingSpan && fundingSpan.closest('.badge')) {
                    const fundingText = fundingSpan.closest('.badge').textContent.trim();
                    result.funding = fundingText;
                }

                // 7. Description
                const descDiv = container.querySelector('.phd-result__description .descFrag');
                if (descDiv) {
                    result.description = descDiv.textContent.trim().replace(/Read more.*$/i, '').trim();
                }

                // 8. DataLayerManager variables (از script tag)
                const scriptTag = container.querySelector('script');
                if (scriptTag) {
                    const scriptText = scriptTag.textContent;

                    // Extract از DataLayerManager
                    const extractVar = (name) => {
                        const match = scriptText.match(new RegExp(`DataLayerManager\\.${name}\\s*=\\s*"([^"]+)"`));
                        return match ? match[1] : null;
                    };

                    result.country = extractVar('dynamicLocationCountryName');
                    result.disciplines = (extractVar('dynamicDisciplineNames') || '').split(',').map(s => s.trim()).filter(Boolean);
                    result.subjects = (extractVar('dynamicSubjectNames') || '').split(',').map(s => s.trim()).filter(Boolean);

                    // اگر university/department از HTML نیومد، از DataLayer بگیر
                    if (!result.university) result.university = extractVar('dynamicInstitutionName');
                    if (!result.department) result.department = extractVar('dynamicDepartmentName');
                }

                // فقط اضافه کن اگر title و url داریم
                if (result.title && result.url) {
                    results.push(result);
                }
            });

            return results;
        });

        console.log(`✅ Extracted ${extractedData.length} PhDs with Hybrid Method\n`);

        // Statistics
        const stats = {
            total: extractedData.length,
            hasTitle: extractedData.filter(r => r.title).length,
            hasUrl: extractedData.filter(r => r.url).length,
            hasUniversity: extractedData.filter(r => r.university).length,
            hasDepartment: extractedData.filter(r => r.department).length,
            hasLocation: extractedData.filter(r => r.location).length,
            hasCountry: extractedData.filter(r => r.country).length,
            hasDisciplines: extractedData.filter(r => r.disciplines && r.disciplines.length > 0).length,
            hasSubjects: extractedData.filter(r => r.subjects && r.subjects.length > 0).length,
            hasSupervisor: extractedData.filter(r => r.supervisor).length,
            hasDeadline: extractedData.filter(r => r.deadline).length,
            hasProgramType: extractedData.filter(r => r.programType).length,
            hasFunding: extractedData.filter(r => r.funding).length,
            hasDescription: extractedData.filter(r => r.description).length
        };

        console.log('='.repeat(120));
        console.log('📊 Hybrid Method Coverage Statistics');
        console.log('='.repeat(120) + '\n');

        Object.entries(stats).forEach(([field, count]) => {
            if (field === 'total') return;
            const percentage = Math.round((count / stats.total) * 100);
            const status = percentage === 100 ? '✅' : percentage >= 70 ? '⚠️' : '❌';
            console.log(`${status} ${field.padEnd(20)} → ${count}/${stats.total} (${percentage}%)`);
        });

        // جستجوی "Climate impacts"
        console.log('\n' + '='.repeat(120));
        console.log('🎯 Climate impacts از Hybrid Method:');
        console.log('='.repeat(120) + '\n');

        const climate = extractedData.find(r => r.title && r.title.includes('Climate impacts'));

        if (climate) {
            console.log('✅ پیدا شد!\n');
            console.log(JSON.stringify(climate, null, 2));
        } else {
            console.log('❌ پیدا نشد');
        }

        // نمایش 5 نمونه
        console.log('\n' + '='.repeat(120));
        console.log('📋 نمونه‌های کامل (اولین 5):');
        console.log('='.repeat(120) + '\n');

        extractedData.slice(0, 5).forEach(phd => {
            console.log(`\n█ PhD #${phd.index}: ${phd.title}`);
            console.log('─'.repeat(120));
            console.log(`🏛️  University:  ${phd.university}`);
            console.log(`🏢 Department:  ${phd.department || '(not found)'}`);
            console.log(`📍 Country:     ${phd.country || '(not found)'}`);
            console.log(`🎓 Disciplines: ${phd.disciplines.length > 0 ? phd.disciplines.slice(0, 3).join(', ') : '(not found)'}`);
            console.log(`📚 Subjects:    ${phd.subjects.length > 0 ? phd.subjects.slice(0, 3).join(', ') : '(not found)'}`);
            console.log(`👨‍🏫 Supervisor:  ${phd.supervisor || '(not found)'}`);
            console.log(`📅 Deadline:    ${phd.deadline || '(not found)'}`);
            console.log(`💼 Program:     ${phd.programType || '(not found)'}`);
            console.log(`💰 Funding:     ${phd.funding || '(not found)'}`);
            console.log(`🔗 URL:         ${phd.url}`);
        });

        // Save
        const output = {
            metadata: {
                extractedAt: new Date().toISOString(),
                keyword: 'a',
                page: 1,
                method: 'Hybrid: JSON-LD + HTML + DataLayerManager',
                totalFound: extractedData.length
            },
            statistics: stats,
            results: extractedData
        };

        fs.writeFileSync('hybrid-extraction-results.json', JSON.stringify(output, null, 2), 'utf8');

        console.log('\n' + '='.repeat(120));
        console.log('✅ Hybrid Extraction کامل شد!');
        console.log('\n📁 Saved to: hybrid-extraction-results.json');
        console.log('\n🎯 Coverage Summary:');
        console.log(`   Title:       ${stats.hasTitle}/${stats.total} (100%) ✅`);
        console.log(`   University:  ${stats.hasUniversity}/${stats.total} (${Math.round(stats.hasUniversity/stats.total*100)}%)`);
        console.log(`   Department:  ${stats.hasDepartment}/${stats.total} (${Math.round(stats.hasDepartment/stats.total*100)}%)`);
        console.log(`   Country:     ${stats.hasCountry}/${stats.total} (${Math.round(stats.hasCountry/stats.total*100)}%)`);
        console.log(`   Disciplines: ${stats.hasDisciplines}/${stats.total} (${Math.round(stats.hasDisciplines/stats.total*100)}%)`);
        console.log(`   Subjects:    ${stats.hasSubjects}/${stats.total} (${Math.round(stats.hasSubjects/stats.total*100)}%)`);
        console.log(`   Supervisor:  ${stats.hasSupervisor}/${stats.total} (${Math.round(stats.hasSupervisor/stats.total*100)}%)`);
        console.log(`   Deadline:    ${stats.hasDeadline}/${stats.total} (${Math.round(stats.hasDeadline/stats.total*100)}%)`);
        console.log(`   Funding:     ${stats.hasFunding}/${stats.total} (${Math.round(stats.hasFunding/stats.total*100)}%)`);
        console.log('='.repeat(120) + '\n');

        await browser.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await browser.close();
        process.exit(1);
    }
}

testHybridExtraction();