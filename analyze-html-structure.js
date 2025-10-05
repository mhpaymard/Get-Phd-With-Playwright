const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://www.findaphd.com/phds/?Keywords=machine+learning');
  await page.waitForTimeout(3000);
  
  try {
    await page.locator('button:has-text("Accept all")').first().click();
    await page.waitForTimeout(1000);
  } catch (e) {}
  
  const htmlStructure = await page.evaluate(() => {
    const first = document.querySelector('.phd-result');
    if (!first) return 'No results found';
    
    // Get all text nodes and their parent elements
    function getStructure(el, depth = 0) {
      const indent = '  '.repeat(depth);
      let output = '';
      
      if (el.nodeType === Node.ELEMENT_NODE) {
        const tag = el.tagName.toLowerCase();
        const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
        const id = el.id ? `#${el.id}` : '';
        
        output += `${indent}<${tag}${classes}${id}>\n`;
        
        // Show direct text content (not from children)
        const directText = Array.from(el.childNodes)
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.textContent.trim())
          .filter(t => t.length > 0)
          .join(' ');
        
        if (directText) {
          output += `${indent}  TEXT: "${directText.substring(0, 100)}"\n`;
        }
        
        // Process children
        for (const child of el.children) {
          output += getStructure(child, depth + 1);
        }
        
        output += `${indent}</${tag}>\n`;
      }
      
      return output;
    }
    
    return getStructure(first);
  });
  
  console.log('HTML Structure of first result:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(htmlStructure);
  
  await page.waitForTimeout(60000);
  await browser.close();
})();
