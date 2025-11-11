/**
 * کد تشخیصی کامل - بررسی دقیق چرا فقط 7 تا می‌گیریم
 */

const playwright = require('playwright');
const fs = require('fs');

async function diagnose() {
  console.log('\n' + '='.repeat(120));
  console.log('🔍 تشخیص کامل - چرا فقط 7 تا می‌گیریم؟');
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
      if (await acceptButton.isVisible({ timeout: 3000 })) {
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {}

    await page.waitForTimeout(3000);

    console.log('✅ Page loaded\n');

    // استخراج کامل اطلاعات
    const diagnosis = await page.evaluate(() => {
      const result = {
        allImpressionIds: [],
        detailedAnalysis: []
      };

      // 1. پیدا کردن همه searchResultImpression*
      const allContainers = document.querySelectorAll('[id^="searchResultImpression"]');
      
      console.log(`Found ${allContainers.length} containers with searchResultImpression ID`);

      allContainers.forEach((container, idx) => {
        const analysis = {
          id: container.id,
          index: idx,
          hasTitle: false,
          hasUrl: false,
          hasDeadline: false,
          hasSupervisor: false,
          title: null,
          url: null,
          deadline: null,
          supervisor: null,
          htmlSnippet: null,
          selectors: {}
        };

        result.allImpressionIds.push(container.id);

        // چک کردن selectors مختلف
        const titleSelectors = [
          '.h4',
          'h3 .h4',
          'h3 span.h4',
          'a[href*="/phds/project/"] .h4',
          'span.h4'
        ];

        for (const selector of titleSelectors) {
          const el = container.querySelector(selector);
          if (el) {
            analysis.selectors.title = selector;
            analysis.title = el.textContent.trim();
            analysis.hasTitle = true;
            break;
          }
        }

        // URL
        const urlSelectors = [
          'a[href*="/phds/project/"]',
          'a.card',
          'a[href*="?p"]'
        ];

        for (const selector of urlSelectors) {
          const el = container.querySelector(selector);
          if (el && el.href) {
            analysis.selectors.url = selector;
            analysis.url = el.href;
            analysis.hasUrl = true;
            break;
          }
        }

        // Deadline
        const calendarIcon = container.querySelector('.fa-calendar');
        if (calendarIcon) {
          const parent = calendarIcon.closest('.badge, .subButton, span');
          if (parent) {
            analysis.deadline = parent.textContent.trim();
            analysis.hasDeadline = true;
          }
        }

        // Supervisor
        const supervisorDiv = container.querySelector('.phd-result__key-info.super');
        if (supervisorDiv) {
          const iconText = supervisorDiv.querySelector('.icon-text');
          if (iconText) {
            analysis.supervisor = iconText.textContent.trim();
            analysis.hasSupervisor = true;
          }
        }

        // HTML snippet (اولین 500 کاراکتر)
        analysis.htmlSnippet = container.innerHTML.substring(0, 500);

        result.detailedAnalysis.push(analysis);
      });

      // 2. استخراج JSON-LD scripts
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      result.jsonLdItems = [];

      scripts.forEach((script, idx) => {
        try {
          const data = JSON.parse(script.textContent);
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item['@type'] === 'Course') {
                result.jsonLdItems.push({
                  scriptIndex: idx + 1,
                  title: item.name,
                  description: item.description,
                  university: item.provider?.name,
                  raw: item
                });
              }
            });
          } else if (data['@type'] === 'Course') {
            result.jsonLdItems.push({
              scriptIndex: idx + 1,
              title: data.name,
              description: data.description,
              university: data.provider?.name,
              raw: data
            });
          }
        } catch (e) {
          console.error(`Error parsing script ${idx + 1}:`, e.message);
        }
      });

      return result;
    });

    // نمایش نتایج
    console.log('='.repeat(120));
    console.log(`📊 تعداد کل containers: ${diagnosis.allImpressionIds.length}`);
    console.log('='.repeat(120) + '\n');

    console.log('📋 لیست همه IDs:\n');
    diagnosis.allImpressionIds.forEach((id, idx) => {
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${id}`);
    });

    console.log('\n' + '='.repeat(120));
    console.log('🔍 تحلیل دقیق هر container:');
    console.log('='.repeat(120) + '\n');

    diagnosis.detailedAnalysis.forEach((analysis, idx) => {
      console.log(`\n${'─'.repeat(120)}`);
      console.log(`Container #${idx + 1}: ${analysis.id}`);
      console.log('─'.repeat(120));

      console.log(`\n✅ Status:`);
      console.log(`   Title:     ${analysis.hasTitle ? '✅' : '❌'} ${analysis.title || '(not found)'}`);
      console.log(`   URL:       ${analysis.hasUrl ? '✅' : '❌'} ${analysis.url ? analysis.url.substring(0, 60) + '...' : '(not found)'}`);
      console.log(`   Deadline:  ${analysis.hasDeadline ? '✅' : '❌'} ${analysis.deadline || '(not found)'}`);
      console.log(`   Supervisor: ${analysis.hasSupervisor ? '✅' : '❌'} ${analysis.supervisor ? analysis.supervisor.substring(0, 50) + '...' : '(not found)'}`);

      if (analysis.selectors.title) {
        console.log(`\n   Selector used for title: ${analysis.selectors.title}`);
      }
      if (analysis.selectors.url) {
        console.log(`   Selector used for URL: ${analysis.selectors.url}`);
      }

      // اگر title یا url نداره، HTML snippet رو نشون بده
      if (!analysis.hasTitle || !analysis.hasUrl) {
        console.log(`\n⚠️  Missing data! HTML snippet:`);
        console.log(analysis.htmlSnippet.substring(0, 300) + '...');
      }
    });

    // خلاصه
    console.log('\n' + '='.repeat(120));
    console.log('📊 خلاصه:');
    console.log('='.repeat(120) + '\n');

    const stats = {
      total: diagnosis.detailedAnalysis.length,
      hasTitle: diagnosis.detailedAnalysis.filter(a => a.hasTitle).length,
      hasUrl: diagnosis.detailedAnalysis.filter(a => a.hasUrl).length,
      hasDeadline: diagnosis.detailedAnalysis.filter(a => a.hasDeadline).length,
      hasSupervisor: diagnosis.detailedAnalysis.filter(a => a.hasSupervisor).length,
      complete: diagnosis.detailedAnalysis.filter(a => a.hasTitle && a.hasUrl).length
    };

    console.log(`Total containers:     ${stats.total}`);
    console.log(`Has Title:            ${stats.hasTitle}/${stats.total} (${Math.round(stats.hasTitle/stats.total*100)}%)`);
    console.log(`Has URL:              ${stats.hasUrl}/${stats.total} (${Math.round(stats.hasUrl/stats.total*100)}%)`);
    console.log(`Has Deadline:         ${stats.hasDeadline}/${stats.total} (${Math.round(stats.hasDeadline/stats.total*100)}%)`);
    console.log(`Has Supervisor:       ${stats.hasSupervisor}/${stats.total} (${Math.round(stats.hasSupervisor/stats.total*100)}%)`);
    console.log(`Complete (Title+URL): ${stats.complete}/${stats.total} (${Math.round(stats.complete/stats.total*100)}%)`);

    // JSON-LD analysis
    console.log('\n' + '='.repeat(120));
    console.log(`📚 JSON-LD Items: ${diagnosis.jsonLdItems.length}`);
    console.log('='.repeat(120) + '\n');

    diagnosis.jsonLdItems.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.title?.substring(0, 60) || '(no title)'}`);
      console.log(`   University: ${item.university || '(not found)'}`);
      console.log(`   Description: ${item.description ? item.description.length + ' chars' : '(not found)'}`);
    });

    // ذخیره برای بررسی دستی
    fs.writeFileSync('diagnosis-results.json', JSON.stringify(diagnosis, null, 2), 'utf8');

    // ذخیره HTML snippets برای بررسی
    const htmlSnippets = diagnosis.detailedAnalysis.map(a => ({
      id: a.id,
      html: a.htmlSnippet
    }));
    fs.writeFileSync('html-snippets.json', JSON.stringify(htmlSnippets, null, 2), 'utf8');

    console.log('\n' + '='.repeat(120));
    console.log('✅ Diagnosis Complete!');
    console.log('\n📁 فایل‌های ذخیره شده:');
    console.log('   - diagnosis-results.json (تحلیل کامل)');
    console.log('   - html-snippets.json (HTML snippets برای بررسی)');
    console.log('='.repeat(120) + '\n');

    await browser.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await browser.close();
    process.exit(1);
  }
}

diagnose();

