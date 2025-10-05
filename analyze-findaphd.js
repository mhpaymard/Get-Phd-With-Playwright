const playwright = require('playwright');

(async () => {
  console.log('��� Starting FindAPhD Structure Analysis...\n');
  
  const browser = await playwright.chromium.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Go to search page
    console.log('��� Step 1: Loading search page...');
    await page.goto('https://www.findaphd.com/phds/?Keywords=machine+learning', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    await page.waitForTimeout(3000);
    
    // Handle cookie consent if exists
    try {
      const acceptButton = await page.locator('button:has-text("Accept all")').first();
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        console.log('✅ Cookie consent accepted');
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('ℹ️  No cookie consent needed');
    }
    
    // Step 2: Analyze page structure
    console.log('\n��� Step 2: Analyzing page structure...\n');
    
    const analysis = await page.evaluate(() => {
      const results = [];
      
      // Try to find result containers
      const possibleContainers = [
        { selector: '.result', name: '.result' },
        { selector: '.phd-result', name: '.phd-result' },
        { selector: '[class*="result"]', name: '[class*="result"]' },
        { selector: 'article', name: 'article' },
        { selector: '[data-phd]', name: '[data-phd]' },
        { selector: '.search-result', name: '.search-result' },
      ];
      
      let foundContainer = null;
      
      for (const container of possibleContainers) {
        const elements = document.querySelectorAll(container.selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with: ${container.name}`);
          
          // Check if these elements contain PhD links
          let hasPhDLinks = 0;
          for (let i = 0; i < Math.min(3, elements.length); i++) {
            const link = elements[i].querySelector('a[href*="/phds/project/"]');
            if (link) hasPhDLinks++;
          }
          
          if (hasPhDLinks > 0) {
            foundContainer = container.selector;
            console.log(`✅ CONFIRMED: ${container.name} contains PhD links!`);
            break;
          }
        }
      }
      
      // If we found containers, analyze first 3
      if (foundContainer) {
        const containers = document.querySelectorAll(foundContainer);
        
        for (let i = 0; i < Math.min(3, containers.length); i++) {
          const el = containers[i];
          
          const result = {
            index: i + 1,
            html: el.outerHTML.substring(0, 500) + '...',
            classes: el.className,
            
            // Title
            title: null,
            titleSelectors: [],
            
            // Link
            link: null,
            linkSelectors: [],
            
            // Institution
            institution: null,
            institutionSelectors: [],
            
            // Location
            location: null,
            locationSelectors: [],
            
            // Description
            description: null,
            descriptionSelectors: [],
            
            // Other fields
            funding: null,
            discipline: null,
            deadline: null,
          };
          
          // Find title
          const titleOptions = [
            'h2 a', 'h3 a', '.title a', 'a[href*="/phds/project/"]',
            'h2', 'h3', '.title'
          ];
          
          for (const sel of titleOptions) {
            const titleEl = el.querySelector(sel);
            if (titleEl && titleEl.textContent.trim().length > 5) {
              result.title = titleEl.textContent.trim();
              result.titleSelectors.push(sel);
              break;
            }
          }
          
          // Find link
          const linkEl = el.querySelector('a[href*="/phds/project/"]');
          if (linkEl) {
            result.link = linkEl.href;
            result.linkSelectors.push('a[href*="/phds/project/"]');
          }
          
          // Find institution
          const instOptions = [
            '.institution', '[class*="institution"]', '[class*="university"]',
            'p:has-text("University")', 'div:has-text("University")',
          ];
          
          for (const sel of instOptions) {
            try {
              const instEl = el.querySelector(sel);
              if (instEl && instEl.textContent.trim().length > 3) {
                result.institution = instEl.textContent.trim();
                result.institutionSelectors.push(sel);
                break;
              }
            } catch (e) {}
          }
          
          // Find location
          const locOptions = [
            '.location', '[class*="location"]', '[class*="place"]',
          ];
          
          for (const sel of locOptions) {
            const locEl = el.querySelector(sel);
            if (locEl && locEl.textContent.trim().length > 2) {
              result.location = locEl.textContent.trim();
              result.locationSelectors.push(sel);
              break;
            }
          }
          
          // Find description
          const descOptions = [
            '.description', 'p', '.summary', '[class*="description"]'
          ];
          
          for (const sel of descOptions) {
            const descEl = el.querySelector(sel);
            if (descEl && descEl.textContent.trim().length > 20) {
              result.description = descEl.textContent.trim().substring(0, 150);
              result.descriptionSelectors.push(sel);
              break;
            }
          }
          
          results.push(result);
        }
      } else {
        // Fallback: Find all PhD links
        const links = document.querySelectorAll('a[href*="/phds/project/"]');
        console.log(`Fallback: Found ${links.length} PhD links`);
        
        for (let i = 0; i < Math.min(3, links.length); i++) {
          const link = links[i];
          const parent = link.closest('div, article, section, li');
          
          results.push({
            index: i + 1,
            link: link.href,
            title: link.textContent.trim(),
            parentHTML: parent ? parent.outerHTML.substring(0, 500) : 'No parent',
            parentTag: parent ? parent.tagName : 'None',
            parentClasses: parent ? parent.className : 'None'
          });
        }
      }
      
      return {
        totalLinks: document.querySelectorAll('a[href*="/phds/project/"]').length,
        results
      };
    });
    
    console.log('\n��� ANALYSIS RESULTS:\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`Total PhD Links Found: ${analysis.totalLinks}\n`);
    
    analysis.results.forEach(result => {
      console.log(`\n──────────── Result #${result.index} ────────────`);
      console.log(`Title: ${result.title || 'NOT FOUND'}`);
      console.log(`Link: ${result.link || 'NOT FOUND'}`);
      console.log(`Institution: ${result.institution || 'NOT FOUND'}`);
      console.log(`Location: ${result.location || 'NOT FOUND'}`);
      if (result.description) {
        console.log(`Description: ${result.description.substring(0, 100)}...`);
      }
      if (result.classes) {
        console.log(`Container classes: ${result.classes}`);
      }
      console.log('');
    });
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
    // Step 3: Test pagination
    console.log('��� Step 3: Checking pagination...\n');
    
    const pagination = await page.evaluate(() => {
      const pageLinks = document.querySelectorAll('a[href*="page="], .pagination a, [class*="page"]');
      return {
        found: pageLinks.length,
        samples: Array.from(pageLinks).slice(0, 5).map(a => ({
          text: a.textContent.trim(),
          href: a.href
        }))
      };
    });
    
    console.log(`Pagination links found: ${pagination.found}`);
    if (pagination.samples.length > 0) {
      console.log('Sample links:', pagination.samples);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'e:/Projects 2/Real-chatplatform-main/get-phd/findaphd-analysis.png',
      fullPage: false 
    });
    console.log('\n��� Screenshot saved: findaphd-analysis.png');
    
    // Keep browser open
    console.log('\n✅ Analysis complete! Browser will stay open for manual inspection.');
    console.log('Press Ctrl+C to close when done.\n');
    
    await page.waitForTimeout(300000); // 5 minutes
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ 
      path: 'e:/Projects 2/Real-chatplatform-main/get-phd/error-analysis.png' 
    });
  } finally {
    await browser.close();
  }
})();
