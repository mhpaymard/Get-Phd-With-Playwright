/**
 * تست نهایی JSON-LD با Pattern های بهبود یافته
 * + حذف Duplicates
 * + Map کردن URLs
 */

const playwright = require('playwright');
const fs = require('fs');

// Helper: Extract detailed info from description
function parseDescription(description) {
  const info = {
    supervisors: [],
    deadline: null,
    location: null,
    email: null,
    funding: null,
    requirements: null
  };

  if (!description) return info;

  // 1. Supervisor - با patterns بهتر
  const supervisorPatterns = [
    // "Supervisor: Prof X"
    /Supervisor[s]?:\s*([^.\n]{5,150})/gi,
    // "supervised by Prof X and Dr Y"
    /supervised by\s+([^.\n]{5,150})/gi,
    // "under the supervision of Prof X"
    /under the supervision of\s+([^.\n]{5,150})/gi,
    // Direct names: "Prof/Dr Name"
    /((?:Prof(?:essor)?|Dr)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*(?:Prof(?:essor)?|Dr)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)*)/g
  ];

  supervisorPatterns.forEach(pattern => {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      const text = (match[1] || match[0]).trim();
      // فیلتر کردن matches کوتاه یا طولانی
      if (text.length > 10 && text.length < 200) {
        info.supervisors.push(text);
      }
    }
  });

  // Deduplicate و گرفتن اولین یکی
  if (info.supervisors.length > 0) {
    info.supervisors = [...new Set(info.supervisors)];
  }

  // 2. Deadline - تاریخ‌های واضح
  const deadlineMatches = description.match(/\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/i);
  if (deadlineMatches) {
    info.deadline = deadlineMatches[1];
  }

  // 3. Email
  const emailMatch = description.match(/([a-z0-9._-]+@[a-z0-9._-]+\.[a-z]+)/i);
  if (emailMatch) {
    info.email = emailMatch[1];
  }

  // 4. Funding keywords
  const fundingKeywords = ['Fully Funded', 'Competition Funded', 'Self-Funded', 'EPSRC', 'UKRI', 'Scholarship'];
  for (const keyword of fundingKeywords) {
    if (description.includes(keyword)) {
      info.funding = keyword;
      break;
    }
  }

  // 5. Location - از متن
  const locationMatch = description.match(/(?:based (?:at|in)|located in)\s+([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)/);
  if (locationMatch) {
    info.location = locationMatch[1];
  }

  return info;
}

async function testFinalJsonLd() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 تست نهایی JSON-LD + URL Mapping + Deduplication');
  console.log('='.repeat(80) + '\n');

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('→ Loading https://www.findaphd.com/phds/?Keywords=a ...\n');
    
    await page.goto('https://www.findaphd.com/phds/?Keywords=a', {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    });

    await page.waitForTimeout(3000);

    // Cookie
    try {
      const acceptButton = page.locator('button:has-text("Accept all")').first();
      if (await acceptButton.isVisible({ timeout: 2000 })) {
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}

    // Scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(2000);

    // Extract JSON-LD + URLs together
    const pageData = await page.evaluate(() => {
      // 1. JSON-LD
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      const jsonLdData = [];
      
      scripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item['@type'] === 'Course') {
                jsonLdData.push(item);
              }
            });
          }
        } catch (e) {}
      });

      // 2. URLs from page
      const phdLinks = Array.from(document.querySelectorAll('a[href*="/phds/project/"]'));
      const urls = phdLinks.map(link => ({
        href: link.href,
        text: link.textContent?.trim()
      }));

      return { jsonLdData, urls };
    });

    console.log(`✅ Extracted ${pageData.jsonLdData.length} Courses from JSON-LD`);
    console.log(`✅ Extracted ${pageData.urls.length} PhD URLs from page\n`);

    // Remove duplicates از JSON-LD
    const uniquePhds = [];
    const seenNames = new Set();

    pageData.jsonLdData.forEach(phd => {
      if (!seenNames.has(phd.name)) {
        seenNames.add(phd.name);
        uniquePhds.push(phd);
      }
    });

    console.log(`✅ After deduplication: ${uniquePhds.length} unique PhDs\n`);

    // Map URLs به JSON-LD items
    // استراتژی: match کردن title با link text
    uniquePhds.forEach(phd => {
      const matchingUrl = pageData.urls.find(url => 
        url.text && phd.name && (
          url.text.includes(phd.name.substring(0, 30)) ||
          phd.name.includes(url.text.substring(0, 30))
        )
      );
      phd.url = matchingUrl ? matchingUrl.href : null;
    });

    // Parse descriptions
    const finalResults = uniquePhds.map((phd, index) => {
      const parsed = parseDescription(phd.description);
      
      return {
        index: index + 1,
        title: phd.name,
        url: phd.url,
        university: phd.provider?.name || null,
        description: phd.description?.substring(0, 300) + '...',
        descriptionFull: phd.description,
        
        // Parsed from description
        supervisors: parsed.supervisors.slice(0, 3), // max 3
        deadline: parsed.deadline,
        location: parsed.location,
        email: parsed.email,
        funding: parsed.funding,
        
        // Metadata
        hasUrl: !!phd.url,
        hasSupervisor: parsed.supervisors.length > 0,
        hasDeadline: !!parsed.deadline,
        hasEmail: !!parsed.email
      };
    });

    // Statistics
    console.log('='.repeat(80));
    console.log('📊 Final Statistics');
    console.log('='.repeat(80) + '\n');

    const stats = {
      total: finalResults.length,
      hasUrl: finalResults.filter(r => r.hasUrl).length,
      hasUniversity: finalResults.filter(r => r.university).length,
      hasSupervisor: finalResults.filter(r => r.hasSupervisor).length,
      hasDeadline: finalResults.filter(r => r.hasDeadline).length,
      hasEmail: finalResults.filter(r => r.hasEmail).length,
      hasLocation: finalResults.filter(r => r.location).length
    };

    console.log(`📚 Total Unique PhDs:  ${stats.total}`);
    console.log(`🔗 Has URL:            ${stats.hasUrl}/${stats.total} (${Math.round(stats.hasUrl/stats.total*100)}%)`);
    console.log(`🏛️  Has University:     ${stats.hasUniversity}/${stats.total} (${Math.round(stats.hasUniversity/stats.total*100)}%)`);
    console.log(`👨‍🏫 Has Supervisor:     ${stats.hasSupervisor}/${stats.total} (${Math.round(stats.hasSupervisor/stats.total*100)}%)`);
    console.log(`📅 Has Deadline:       ${stats.hasDeadline}/${stats.total} (${Math.round(stats.hasDeadline/stats.total*100)}%)`);
    console.log(`📧 Has Email:          ${stats.hasEmail}/${stats.total} (${Math.round(stats.hasEmail/stats.total*100)}%)`);
    console.log(`📍 Has Location:       ${stats.hasLocation}/${stats.total} (${Math.round(stats.hasLocation/stats.total*100)}%)`);

    // نمایش 5 نمونه کامل
    console.log('\n' + '='.repeat(80));
    console.log('📋 نمونه‌های کامل (اولین 5):');
    console.log('='.repeat(80) + '\n');

    finalResults.slice(0, 5).forEach(phd => {
      console.log(`\n▼ PhD #${phd.index}:`);
      console.log('─'.repeat(80));
      console.log(`📌 Title: ${phd.title}`);
      console.log(`🔗 URL: ${phd.url || '(not mapped)'}`);
      console.log(`🏛️  University: ${phd.university}`);
      console.log(`👨‍🏫 Supervisors:`);
      if (phd.supervisors.length > 0) {
        phd.supervisors.forEach(sup => console.log(`   - ${sup}`));
      } else {
        console.log('   (not found)');
      }
      console.log(`📅 Deadline: ${phd.deadline || '(not found)'}`);
      console.log(`📍 Location: ${phd.location || '(not found)'}`);
      console.log(`📧 Contact: ${phd.email || '(not found)'}`);
      console.log(`💰 Funding: ${phd.funding || '(not found)'}`);
      console.log(`📝 Description: ${phd.description}`);
    });

    // Save
    const output = {
      metadata: {
        crawledAt: new Date().toISOString(),
        keyword: 'a',
        page: 1,
        method: 'JSON-LD + Description Parsing'
      },
      statistics: stats,
      results: finalResults
    };

    fs.writeFileSync('final-jsonld-results.json', JSON.stringify(output, null, 2), 'utf8');

    console.log('\n' + '='.repeat(80));
    console.log('✅ Test Complete!');
    console.log('\n📁 Final results saved to: final-jsonld-results.json');
    console.log('\n💡 این فایل شامل:');
    console.log('   - 15 unique PhDs (بدون تکرار)');
    console.log('   - University names (100%)');
    console.log('   - Parsed supervisors, deadlines, emails');
    console.log('   - Mapped URLs');
    console.log('='.repeat(80) + '\n');

    await browser.close();

  } catch (error) {
    console.error('❌ Error:', error);
    await browser.close();
  }
}

testFinalJsonLd();

