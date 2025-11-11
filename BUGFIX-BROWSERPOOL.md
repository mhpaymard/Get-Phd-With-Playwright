# 🐛 Bug Fix: Browser Pool Error

## مشکل

هنگام اجرای سرور، خطای زیر رخ می‌داد:

```
Cannot read properties of undefined (reading 'acquire')
```

## علت

در نسخه 1.0، `FindAPhDCrawler` به `browserPool` وابسته بود که برای on-demand crawling طراحی شده بود:

```javascript
// v1.0
class FindAPhDCrawler {
  constructor(browserPool) {
    this.browserPool = browserPool;
  }
  
  async crawlSearchPage(...) {
    const browser = await this.browserPool.acquire(); // ❌ Error!
    ...
  }
}
```

اما در نسخه 2.0، ما `browserPool` را حذف کردیم چون به آن نیازی نبود (Background Crawler خودش browser را مدیریت می‌کند).

## راه حل ✅

Crawler را refactor کردیم که **خودش browser را مدیریت کند** بدون نیاز به browserPool:

```javascript
// v2.0
class FindAPhDCrawler {
  constructor() {
    this.baseUrl = 'https://www.findaphd.com';
    this.browser = null; // خودش browser رو نگه میداره
  }

  // Lazy initialization
  async _ensureBrowser() {
    if (!this.browser) {
      console.log('  → Launching Chromium browser...');
      this.browser = await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  // Close browser
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async crawlSearchPage(keywords, filters = {}, page = 1) {
    const browser = await this._ensureBrowser(); // ✅ خودش browser رو launch می‌کنه
    
    let context = null;
    let pageInstance = null;
    
    try {
      context = await browser.newContext({...});
      pageInstance = await context.newPage();
      
      // ... crawl logic
      
      return results;
    } finally {
      // Close context and page (browser stays open for reuse)
      if (pageInstance) await pageInstance.close();
      if (context) await context.close();
    }
  }
}
```

## تغییرات انجام شده

### 1. `src/workers/playwrightCrawler.js`
- ✅ حذف وابستگی به `browserPool`
- ✅ اضافه کردن `_ensureBrowser()` - lazy initialization
- ✅ اضافه کردن `closeBrowser()` - برای آزادسازی منابع
- ✅ اصلاح `finally` block برای close کردن context/page

### 2. `src/crawler/BackgroundCrawler.js`
- ✅ اضافه کردن `await this.crawler.closeBrowser()` در finally
- ✅ آزادسازی browser بعد از هر crawl

## مزایا

1. **سادگی**: دیگه نیازی به browserPool نیست
2. **بهینه‌سازی**: Browser یکبار launch میشه و reuse میشه
3. **منابع**: Context/Page بعد از هر request close میشن
4. **Memory**: بعد از crawl، browser close میشه

## تست

```bash
# تست سریع crawler
node test-crawler-simple.js

# نتیجه:
✅ Crawl successful!
   Found: 14 results
   Total Pages: 66
   Total Results: 986
```

## وضعیت

✅ **مشکل حل شد**  
✅ Crawler کار می‌کنه  
✅ Server می‌تونه start بشه  
✅ Background crawling عملیاتی است  

---

**تاریخ:** 2025-11-11  
**Fix By:** Refactoring playwrightCrawler.js  
**Status:** ✅ Resolved

