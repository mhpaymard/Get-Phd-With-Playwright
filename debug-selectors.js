// Debug script to find correct selectors on FindAPhD.com
const { chromium } = require('playwright');

async function debugSelectors() {
  console.log('🔍 Starting selector debugging...\n');
  
  const browser = await chromium.launch({ 
    headless: false,  // نمایش مرورگر
    slowMo: 1000 
  });
  
  const page = await browser.newPage();
  
  try {
    const searchUrl = 'https://www.findaphd.com/phds/?Keywords=artificial+intelligence';
    console.log(`📡 Navigating to: ${searchUrl}\n`);
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully!\n');
    console.log('⏳ Waiting 5 seconds for dynamic content...\n');
    await page.waitForTimeout(5000);
    
    // استخراج HTML صفحه برای تحلیل
    const htmlStructure = await page.evaluate(() => {
      const results = [];
      
      // جستجوی المنت‌های اصلی
      console.log('=== SEARCHING FOR RESULT CONTAINERS ===');
      
      const possibleContainers = [
        'article',
        '[class*="result"]',
        '[class*="Result"]',
        '[class*="card"]',
        '[class*="Card"]',
        '[class*="phd"]',
        '[class*="project"]',
        '[class*="listing"]',
        'div[role="article"]',
        'li[class*="item"]'
      ];
      
      for (const selector of possibleContainers) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`✓ Found ${elements.length} elements with selector: ${selector}`);
          
          // نمونه اول را تحلیل کن
          const first = elements[0];
          results.push({
            selector,
            count: elements.length,
            className: first.className,
            innerHTML: first.innerHTML.substring(0, 500),
            structure: {
              hasH3: !!first.querySelector('h3'),
              hasH2: !!first.querySelector('h2'),
              hasLink: !!first.querySelector('a[href*="/phds/project/"]'),
              hasTitle: !!first.querySelector('[class*="title"]'),
              allClasses: Array.from(first.querySelectorAll('*')).map(el => el.className).filter(c => c).slice(0, 20)
            }
          });
        }
      }
      
      return {
        results,
        pageTitle: document.title,
        bodyClasses: document.body.className,
        mainClasses: document.querySelector('main') ? document.querySelector('main').className : 'no main',
        allPhdLinks: document.querySelectorAll('a[href*="/phds/project/"]').length
      };
    });
    
    console.log('📊 Analysis Results:\n');
    console.log(JSON.stringify(htmlStructure, null, 2));
    
    // اسکرین شات بگیر
    await page.screenshot({ path: 'findaphd-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved: findaphd-debug.png');
    
    // تست استخراج با selector های مختلف
    console.log('\n🔬 Testing extraction methods...\n');
    
    const testResults = await page.evaluate(() => {
      const tests = [];
      
      // تست 1: همه لینک‌های پروژه
      const projectLinks = document.querySelectorAll('a[href*="/phds/project/"]');
      tests.push({
        method: 'Project Links',
        count: projectLinks.length,
        sample: projectLinks.length > 0 ? {
          text: projectLinks[0].textContent.trim(),
          href: projectLinks[0].href,
          parentClass: projectLinks[0].parentElement?.className
        } : null
      });
      
      // تست 2: جستجوی article tags
      const articles = document.querySelectorAll('article');
      tests.push({
        method: 'Articles',
        count: articles.length,
        sample: articles.length > 0 ? {
          className: articles[0].className,
          hasLink: !!articles[0].querySelector('a[href*="/phds/project/"]')
        } : null
      });
      
      // تست 3: div با class شامل result
      const resultDivs = document.querySelectorAll('div[class*="result" i]');
      tests.push({
        method: 'Result Divs',
        count: resultDivs.length
      });
      
      return tests;
    });
    
    console.log('Test Results:');
    testResults.forEach(test => {
      console.log(`\n${test.method}: ${test.count} found`);
      if (test.sample) {
        console.log('Sample:', JSON.stringify(test.sample, null, 2));
      }
    });
    
    console.log('\n\n⏸️  Browser will stay open for manual inspection...');
    console.log('Press Ctrl+C to close');
    
    // نگه داشتن مرورگر برای بررسی دستی
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

debugSelectors().catch(console.error);
