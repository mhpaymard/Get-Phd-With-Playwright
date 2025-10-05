# 🐛 راهنمای Debug و رفع مشکل Crawler

## مشکل فعلی

API در حال حاضر نتایج "No title" برمی‌گرداند چون:
- Selector های قدیمی با ساختار جدید سایت FindAPhD مطابقت ندارند
- سایت ممکن است ساختار HTML خود را تغییر داده باشد
- JavaScript rendering ممکن است نیاز به تاخیر بیشتری داشته باشد

## راه حل گام‌به‌گام

### گام 1: پیدا کردن Selector های صحیح

#### روش 1: با Browser DevTools (دستی)

1. باز کردن سایت:
```bash
https://www.findaphd.com/phds/?Keywords=artificial+intelligence
```

2. باز کردن DevTools (F12 یا Right Click → Inspect)

3. رفتن به tab **Elements**

4. پیدا کردن یک نتیجه (Right Click → Inspect Element)

5. یادداشت کردن:
   - Tag name (article, div, li, ...)
   - Class names
   - Structure

#### روش 2: با اسکریپت Debug (خودکار)

```bash
cd "e:\Projects 2\Real-chatplatform-main\get-phd"
node debug-selectors.js
```

این اسکریپت:
- مرورگر را باز می‌کند
- به صفحه جستجو می‌رود
- ساختار HTML را تحلیل می‌کند
- اسکرین شات می‌گیرد
- نتایج را نمایش می‌دهد

### گام 2: تست Manual در Console

در DevTools Console این کد را اجرا کنید:

```javascript
// تست 1: پیدا کردن لینک‌های پروژه
const links = document.querySelectorAll('a[href*="/phds/project/"]');
console.log('Project Links:', links.length);
console.log('First link:', links[0]?.textContent.trim());

// تست 2: پیدا کردن container های نتایج
const articles = document.querySelectorAll('article');
console.log('Articles:', articles.length);

// تست 3: نمایش class های موجود
if (articles.length > 0) {
  console.log('First article classes:', articles[0].className);
  console.log('First article HTML:', articles[0].innerHTML.substring(0, 300));
}

// تست 4: پیدا کردن عناوین
const titles = document.querySelectorAll('h3 a, h2 a');
console.log('Title links:', titles.length);
if (titles.length > 0) {
  console.log('First title:', titles[0].textContent.trim());
  console.log('First URL:', titles[0].href);
}
```

### گام 3: بررسی ساختار احتمالی

سایت FindAPhD معمولاً از این ساختارها استفاده می‌کند:

```html
<!-- Option 1: Article based -->
<article class="phd-result result-card">
  <h3><a href="/phds/project/...">عنوان</a></h3>
  <p class="institution">دانشگاه</p>
  <p class="location">مکان</p>
  <p class="funding">تامین مالی</p>
</article>

<!-- Option 2: Div based -->
<div class="search-result">
  <div class="result-title">
    <a href="/phds/project/...">عنوان</a>
  </div>
  <div class="result-meta">
    <span class="uni">دانشگاه</span>
    <span class="loc">مکان</span>
  </div>
</div>

<!-- Option 3: List based -->
<li class="phd-listing">
  <a href="/phds/project/..." class="title">عنوان</a>
  <span class="details">...</span>
</li>
```

### گام 4: به‌روزرسانی playwrightCrawler.js

بعد از پیدا کردن selector های صحیح، فایل را به‌روز کنید:

```javascript
// در _extractDetailedResults method:

async _extractDetailedResults(page) {
  // منتظر بمانید تا محتوا لود شود
  await page.waitForTimeout(3000); // ✅ افزایش تاخیر
  
  return await page.evaluate(() => {
    const results = [];
    
    // ✅ Selector های به‌روز شده (بعد از Debug)
    const resultElements = document.querySelectorAll('SELECTOR_GOES_HERE');
    
    resultElements.forEach((element, index) => {
      const titleLink = element.querySelector('TITLE_SELECTOR');
      const title = titleLink?.textContent.trim() || 'No title';
      const url = titleLink?.href || '';
      
      // سایر فیلدها...
      
      results.push({ title, url, ... });
    });
    
    return results;
  });
}
```

## 🔍 روش‌های Debug پیشرفته

### روش 1: Screenshot + HTML Dump

```javascript
// در searchService.js یا playwrightCrawler.js

// اسکرین شات
await page.screenshot({ path: `debug-${Date.now()}.png`, fullPage: true });

// ذخیره HTML
const html = await page.content();
require('fs').writeFileSync(`debug-${Date.now()}.html`, html);

console.log('✅ Debug files saved!');
```

### روش 2: Console Logs در Browser

```javascript
// فعال کردن console logs
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

// در evaluate:
await page.evaluate(() => {
  console.log('Page loaded');
  console.log('Links found:', document.querySelectorAll('a').length);
  console.log('Articles found:', document.querySelectorAll('article').length);
});
```

### روش 3: Network Monitoring

```javascript
// مانیتور کردن درخواست‌های شبکه
page.on('response', response => {
  console.log('Response:', response.url(), response.status());
});
```

## 🛠️ Fix های رایج

### Fix 1: افزایش Timeout

```javascript
await page.goto(url, { 
  waitUntil: 'networkidle',  // ✅ تغییر از 'domcontentloaded'
  timeout: 60000             // ✅ افزایش به 60 ثانیه
});

await page.waitForTimeout(5000); // ✅ تاخیر برای JS rendering
```

### Fix 2: منتظر ماندن برای Selector

```javascript
// منتظر بمانید تا نتایج ظاهر شوند
await page.waitForSelector('article, .result, [class*="phd"]', { 
  timeout: 10000 
});
```

### Fix 3: Scroll برای Lazy Loading

```javascript
// اگر سایت از lazy loading استفاده می‌کند
await page.evaluate(() => {
  window.scrollTo(0, document.body.scrollHeight);
});
await page.waitForTimeout(2000);
```

### Fix 4: User Agent

```javascript
// برخی سایت‌ها bot detection دارند
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
```

## 📝 Checklist تست

- [ ] مرورگر با headless: false باز می‌شود
- [ ] صفحه به درستی لود می‌شود
- [ ] نتایج در صفحه قابل مشاهده هستند (بصری)
- [ ] اسکرین شات گرفته شده
- [ ] HTML ذخیره شده
- [ ] Console logs چک شده
- [ ] Selector های درست پیدا شده
- [ ] کد به‌روز شده
- [ ] تست مجدد با API

## 🚀 تست سریع

برای تست سریع بعد از fix:

```bash
# تست با curl
curl -X POST http://91.99.13.17:3000/api/search \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "test-user",
    "keywords": "machine learning"
  }'

# چک کردن نتایج
# باید title ها پر شوند (نه "No title")
```

## 📚 منابع

- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Chrome DevTools Guide](https://developer.chrome.com/docs/devtools/)
- [CSS Selectors Reference](https://www.w3schools.com/cssref/css_selectors.php)

## 🆘 اگر هنوز کار نکرد

1. سایت ممکن است CAPTCHA یا Bot Detection داشته باشد
2. نیاز به Login یا Cookie داشته باشد
3. محتوا کاملاً با JavaScript render می‌شود (نیاز به تاخیر بیشتر)
4. ساختار سایت کاملاً تغییر کرده (نیاز به Reverse Engineering)

در این صورت:
- از Stealth Plugin استفاده کنید
- Cookie handling اضافه کنید
- از Proxy استفاده کنید
- Rate limiting اعمال کنید

---

**بعدی:** بعد از پیدا کردن selector های صحیح، فایل `playwrightCrawler.js` را به‌روز می‌کنیم.
