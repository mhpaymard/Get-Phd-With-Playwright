# 🔐 راهنمای کامل Session Management و Browser Pool

> **توضیح کامل: چطور Session ها و Tab ها مدیریت می‌شوند**

---

## 📋 فهرست

1. [مفهوم Session](#مفهوم-session)
2. [چرا Session لازم است؟](#چرا-session-لازم-است)
3. [نحوه کار Browser Pool](#نحوه-کار-browser-pool)
4. [چرخه عمر Session](#چرخه-عمر-session)
5. [Timeout ها و زمان‌بندی](#timeout-ها-و-زمانبندی)
6. [سناریوهای مختلف](#سناریوهای-مختلف)
7. [بهترین روش‌ها](#بهترین-روشها)

---

## 🎯 مفهوم Session

### Session چیست؟

**Session** یک شناسه یکتا برای هر کاربر است که:
- ✅ جستجوهای مختلف یک کاربر را از هم تفکیک می‌کند
- ✅ تاریخچه جستجوها را نگه می‌دارد
- ✅ State (وضعیت) جستجوها را ذخیره می‌کند
- ✅ امکان ادامه جستجو را فراهم می‌کند

**مهم:** Session ≠ Browser Tab

---

## 🤔 چرا Session لازم است؟

### سناریو 1: بدون Session (مشکل دار ❌)

```javascript
// جستجوی اول
fetch('/api/search', {
  body: JSON.stringify({
    userId: 'user-123',
    keywords: 'AI'
  })
})

// جستجوی دوم (همزمان)
fetch('/api/search', {
  body: JSON.stringify({
    userId: 'user-123',
    keywords: 'ML'
  })
})

// ❌ مشکل: دو جستجو با هم قاطی می‌شوند!
// ❌ نمی‌دانیم کدام جستجو برای کدام درخواست است
```

### سناریو 2: با Session (درست ✅)

```javascript
// ایجاد session برای کاربر
const session = await createSession('user-123');
// session.sessionId = 'session-aaa-111'

// جستجوی اول در session خودش
fetch('/api/search', {
  body: JSON.stringify({
    userId: 'user-123',
    sessionId: 'session-aaa-111',
    keywords: 'AI'
  })
})

// جستجوی دوم در session جدید
const session2 = await createSession('user-123');
fetch('/api/search', {
  body: JSON.stringify({
    userId: 'user-123',
    sessionId: 'session-bbb-222',
    keywords: 'ML'
  })
})

// ✅ هر جستجو مستقل است
// ✅ تاریخچه هر session جدا نگه داشته می‌شود
```

---

## 🌐 نحوه کار Browser Pool

### معماری کلی:

```
┌────────────────────────────────────────────────────────┐
│                    Browser Pool                        │
│  (مدیریت حداکثر 100 تب همزمان)                        │
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐       ┌──────┐           │
│  │ Tab 1│ │ Tab 2│ │ Tab 3│  ...  │Tab100│           │
│  └──────┘ └──────┘ └──────┘       └──────┘           │
│     ↑        ↑        ↑               ↑               │
└─────┼────────┼────────┼───────────────┼───────────────┘
      │        │        │               │
   Session  Session  Session        Session
   (user-1) (user-2) (user-1)       (user-50)
```

### قوانین:

1. **یک Session ≠ یک Tab ثابت**
   - Session فقط یک شناسه منطقی است
   - Tab ها به صورت موقت به Session اختصاص داده می‌شوند

2. **Tab ها به اشتراک گذاشته می‌شوند**
   - وقتی جستجو تمام شد، Tab آزاد می‌شود
   - Tab بعدی می‌تواند توسط Session دیگری استفاده شود

3. **محدودیت: 100 تب همزمان**
   - اگر 100 تب در حال استفاده باشند، درخواست‌های جدید در صف قرار می‌گیرند

---

## 📊 چرخه عمر Session

### مرحله 1: ایجاد Session

```javascript
// درخواست
POST /api/session
{
  "userId": "user-123"
}

// پاسخ
{
  "sessionId": "session-xyz-789",
  "createdAt": 1696512000000
}
```

**اتفاقات پشت صحنه:**
```javascript
// در سرور:
sessionManager.createSession('user-123')
  ↓
- یک sessionId یکتا تولید می‌شود (UUID)
- اطلاعات Session در حافظه ذخیره می‌شود:
  {
    sessionId: 'session-xyz-789',
    userId: 'user-123',
    createdAt: 1696512000000,
    lastAccessedAt: 1696512000000,
    searches: [],        // تاریخچه جستجوها (خالی)
    currentSearch: null  // جستجوی فعال (هیچی)
  }
- هیچ Tab ای هنوز اختصاص داده نشده ❌
```

**نکته مهم:** ✨ Session ایجاد شد اما **هیچ Tab ای هنوز باز نشده!**

---

### مرحله 2: اولین جستجو

```javascript
// درخواست
POST /api/search
{
  "userId": "user-123",
  "sessionId": "session-xyz-789",
  "keywords": "artificial intelligence"
}
```

**اتفاقات پشت صحنه:**

#### گام 1: درخواست Tab
```javascript
// در searchService.js:
const { page, context } = await browserPool.acquireTab(sessionId);

// در browserPool.js:
acquireTab(sessionId) {
  // چک می‌کنیم: آیا تب آزاد وجود دارد؟
  
  if (activeTabs.size < MAX_TABS) {
    // ✅ تب آزاد داریم
    // یک Context جدید (تب جدید) می‌سازیم
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // اختصاص به Session
    activeTabs.set(sessionId, {
      page,
      context,
      sessionId,
      acquiredAt: Date.now()
    });
    
    return { page, context };
  } else {
    // ❌ تمام 100 تب پر است
    // درخواست در صف قرار می‌گیرد
    return new Promise((resolve) => {
      queue.push({ sessionId, resolve });
    });
  }
}
```

#### گام 2: انجام جستجو
```javascript
// با Tab اختصاص داده شده
await page.goto('https://www.findaphd.com/...');
await page.waitForSelector('.search-results');
const results = await extractResults(page);
```

#### گام 3: آزاد کردن Tab
```javascript
// بعد از اتمام جستجو:
await browserPool.releaseTab(sessionId);

// در browserPool.js:
releaseTab(sessionId) {
  const tab = activeTabs.get(sessionId);
  
  if (tab) {
    // آزاد کردن Context
    await tab.context.close();
    
    // حذف از لیست فعال
    activeTabs.delete(sessionId);
    
    // اگر صف دارد، بعدی را اجرا کن
    if (queue.length > 0) {
      const next = queue.shift();
      const newTab = await acquireTab(next.sessionId);
      next.resolve(newTab);
    }
  }
}
```

#### گام 4: ذخیره نتایج
```javascript
// در sessionManager.js:
sessionManager.saveSearchState(sessionId, {
  searchId: 'search-abc-123',
  query: 'artificial intelligence',
  results: [...],
  currentPage: 1,
  totalPages: 15,
  status: 'completed'
});

// Session به‌روز می‌شود:
{
  sessionId: 'session-xyz-789',
  userId: 'user-123',
  lastAccessedAt: 1696512115000,  // ← به‌روز شد
  searches: [
    {
      searchId: 'search-abc-123',
      query: 'artificial intelligence',
      status: 'completed',
      results: [...]
    }
  ],
  currentSearch: 'search-abc-123'
}
```

**نتیجه:** 
- ✅ جستجو انجام شد
- ✅ نتایج ذخیره شدند
- ✅ Tab آزاد شد (برای Session بعدی قابل استفاده)
- ✅ Session هنوز فعال است (در حافظه)

---

### مرحله 3: جستجوی دوم (5 دقیقه بعد)

```javascript
// کاربر 5 دقیقه بعد یک جستجوی دیگر می‌کنه
POST /api/search
{
  "userId": "user-123",
  "sessionId": "session-xyz-789",  // ← همون Session قبلی
  "keywords": "machine learning"
}
```

**اتفاقات:**

```javascript
// 1. بررسی Session
const session = sessionManager.getSession('session-xyz-789');
// ✅ Session هنوز موجود است (چون تا 24 ساعت نگه داشته می‌شود)

// 2. درخواست Tab جدید
const { page } = await browserPool.acquireTab('session-xyz-789');
// ✅ یک Tab جدید (یا آزاد شده) اختصاص می‌یابد
// ⚠️ این Tab ممکن است همان Tab قبلی نباشد!

// 3. جستجو
// ... انجام جستجو ...

// 4. آزادسازی Tab
await browserPool.releaseTab('session-xyz-789');

// 5. به‌روزرسانی Session
sessionManager.saveSearchState('session-xyz-789', {
  searchId: 'search-def-456',
  query: 'machine learning',
  ...
});

// Session حالا دو جستجو دارد:
{
  searches: [
    { searchId: 'search-abc-123', query: 'AI', ... },
    { searchId: 'search-def-456', query: 'ML', ... }  // ← جدید
  ]
}
```

**نکته کلیدی:** 🔑
- Session همچنان زنده است
- Tab جدیدی اختصاص داده می‌شود (موقت)
- تاریخچه کامل نگه داشته می‌شود

---

## ⏱️ Timeout ها و زمان‌بندی

### 1. Idle Tab Cleanup (10 دقیقه)

```javascript
// در browserPool.js:
setInterval(() => {
  const now = Date.now();
  
  activeTabs.forEach((tab, sessionId) => {
    const idleTime = now - tab.acquiredAt;
    
    if (idleTime > 10 * 60 * 1000) {  // 10 دقیقه
      // Tab بیش از 10 دقیقه Idle بوده
      console.log(`Closing idle tab for session ${sessionId}`);
      
      // بستن Tab
      await tab.context.close();
      activeTabs.delete(sessionId);
    }
  });
}, 5 * 60 * 1000);  // هر 5 دقیقه چک می‌کنیم
```

**سناریو:**
```
User: جستجو می‌کنم
  ↓
[Tab اختصاص می‌یابد]
  ↓
[جستجو در حال انجام... اما کاربر Browser خودش را بست یا شبکه قطع شد]
  ↓
[10 دقیقه می‌گذرد]
  ↓
[System: Tab را می‌بندم]
  ↓
[Tab آزاد می‌شود برای استفاده بعدی]

❌ Session حذف نمی‌شود! فقط Tab بسته می‌شود.
```

---

### 2. Session Cleanup (24 ساعت)

```javascript
// در sessionManager.js:
setInterval(() => {
  const now = Date.now();
  const MAX_SESSION_AGE = 24 * 60 * 60 * 1000;  // 24 ساعت
  
  sessions.forEach((session, sessionId) => {
    const age = now - session.lastAccessedAt;
    
    if (age > MAX_SESSION_AGE) {
      // Session بیش از 24 ساعت استفاده نشده
      console.log(`Deleting old session ${sessionId}`);
      
      sessions.delete(sessionId);
      // تمام تاریخچه جستجوها پاک می‌شود
    }
  });
}, 60 * 60 * 1000);  // هر 1 ساعت چک می‌کنیم
```

**سناریو:**
```
User: Session ایجاد می‌کنم
  ↓
[Session ساخته می‌شود]
  ↓
[چند جستجو انجام می‌دهم]
  ↓
[24 ساعت کاری نمی‌کنم]
  ↓
[System: Session را حذف می‌کنم]
  ↓
❌ تمام تاریخچه پاک می‌شود
```

---

### 3. Cache Timeout (15 دقیقه)

```javascript
// در searchService.js:
const CACHE_TTL = 15 * 60 * 1000;  // 15 دقیقه

performSearch(params) {
  const cacheKey = generateCacheKey(params);
  const cached = searchCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // ✅ نتایج از Cache برگردانده می‌شود (بدون نیاز به Tab)
    return cached.data;
  }
  
  // ❌ Cache منقضی شده، باید جستجوی جدید انجام شود
  const results = await actualSearch(params);
  searchCache.set(cacheKey, {
    data: results,
    timestamp: Date.now()
  });
  
  return results;
}
```

---

## 🎬 سناریوهای مختلف

### سناریو 1: کاربر 5 دقیقه سرچ نکرد

```
زمان 0:00 - User: ایجاد Session
  ↓
  Session created: session-123
  Tab status: هیچ Tab ای باز نشده ❌

زمان 0:01 - User: جستجوی "AI"
  ↓
  [Tab #17 اختصاص می‌یابد]
  [جستجو انجام می‌شود... 10 ثانیه]
  [نتایج ذخیره می‌شوند]
  [Tab #17 آزاد می‌شود ✅]
  
  Session status: زنده ✅
  Tab status: آزاد شده، دیگر به Session اختصاص ندارد

زمان 0:06 (5 دقیقه بعد) - User: سکوت...
  ↓
  Session status: هنوز زنده ✅ (تا 24 ساعت)
  Tab status: ممکن است توسط کاربر دیگری استفاده شده باشد
  Data saved: ✅ تمام نتایج جستجوی قبلی ذخیره است

زمان 0:07 - User: جستجوی "ML"
  ↓
  [بررسی Session: session-123 هنوز موجود است ✅]
  [Tab #42 اختصاص می‌یابد] ← ممکن است Tab جدیدی باشد
  [جستجو انجام می‌شود]
  [Tab #42 آزاد می‌شود]
  
  Session status: ✅ زنده، شامل 2 جستجو
  Previous data: ✅ همچنان در دسترس
```

**نتیجه:**
- ✅ Session زنده می‌ماند
- ✅ داده‌های قبلی نگه داشته می‌شوند
- ✅ Tab جدیدی (موقت) اختصاص می‌یابد
- ✅ می‌تواند از همان جا ادامه دهد

---

### سناریو 2: کاربر 10 دقیقه در حین جستجو منتظر می‌ماند (مشکل!)

```
زمان 0:00 - User: جستجوی "AI"
  ↓
  [Tab #5 اختصاص می‌یابد]
  [جستجو شروع می‌شود...]
  [کاربر شبکه خود را قطع می‌کند یا Browser را می‌بندد]
  
  Tab #5 status: گیر کرده! (Hung)

زمان 0:10 (10 دقیقه بعد)
  ↓
  [System: Tab #5 بیش از 10 دقیقه Idle است]
  [Tab #5 بسته می‌شود ✅]
  [Session هنوز زنده است]

زمان 0:11 - User: دوباره تلاش می‌کند
  ↓
  [بررسی Session: هنوز موجود است ✅]
  [Tab جدید اختصاص می‌یابد]
  [جستجو از اول انجام می‌شود]
  ✅ موفق
```

**نتیجه:**
- ✅ System خودش را پاک می‌کند
- ✅ Tab های Idle بسته می‌شوند
- ✅ Session نگه داشته می‌شود
- ✅ کاربر می‌تواند دوباره تلاش کند

---

### سناریو 3: 100 کاربر همزمان

```
کاربران 1-100: همه شروع به جستجو می‌کنند
  ↓
  [Tab های 1-100 اختصاص می‌یابند]
  [تمام Tab ها پر هستند!]

کاربر 101: تلاش برای جستجو
  ↓
  [درخواست Tab]
  ❌ هیچ Tab آزادی وجود ندارد
  [درخواست در صف قرار می‌گیرد]
  
  Waiting...

کاربر 50: جستجویش تمام شد
  ↓
  [Tab #50 آزاد می‌شود]
  [System: یک درخواست در صف است]
  [Tab #50 به کاربر 101 اختصاص می‌یابد]
  
  کاربر 101: ✅ شروع جستجو
```

**نتیجه:**
- ✅ صف خودکار مدیریت می‌شود
- ✅ هیچ درخواستی رد نمی‌شود
- ⏱️ ممکن است کمی صبر کنند

---

### سناریو 4: ادامه جستجو (صفحات بعدی)

```
User: جستجوی "AI" (صفحه 1)
  ↓
  [Session: session-aaa]
  [Tab اختصاص → جستجو → آزادسازی]
  [ذخیره: searchId = search-111, page = 1]

5 دقیقه بعد...

User: ادامه جستجو (صفحه 2)
  ↓
  POST /api/search/search-111/continue
  {
    "sessionId": "session-aaa",
    "page": 2
  }
  
  [بررسی Session: ✅ موجود است]
  [بررسی Search: ✅ search-111 در Session است]
  [بارگذاری state: page=1, filters={...}, query="AI"]
  [Tab جدید اختصاص می‌یابد]
  [جستجو صفحه 2 با همان filters]
  [ذخیره: page = 2]
  [Tab آزاد می‌شود]

✅ State کامل نگه داشته شده
✅ فیلترها یادآوری شدند
✅ کاربر از همان جا ادامه داد
```

---

## 📝 خلاصه Timeline ها

### Timeline Tab:
```
Request → Acquire Tab (موقت) → Use → Release → Gone ❌
```
**مدت:** فقط در حین جستجو (10-20 ثانیه)

### Timeline Session:
```
Create → Active → ... 24 hours ... → Delete
```
**مدت:** تا 24 ساعت بعد از آخرین استفاده

### Timeline Data:
```
Search → Save in Session → Available until Session deleted
```
**مدت:** تا وقتی Session حذف نشود

---

## ✅ بهترین روش‌ها

### 1. یک Session برای یک کاربر در یک نشست

```javascript
// ✅ درست
const session = await createSession('user-123');

// تمام جستجوهای این نشست
await search(session.sessionId, 'AI');
await search(session.sessionId, 'ML');
await search(session.sessionId, 'Quantum');

// وقتی کار تمام شد
await deleteSession(session.sessionId);
```

```javascript
// ❌ اشتباه
// هر بار Session جدید (تاریخچه از بین می‌رود)
const session1 = await createSession('user-123');
await search(session1.sessionId, 'AI');

const session2 = await createSession('user-123');
await search(session2.sessionId, 'ML');  // تاریخچه قبلی در دسترس نیست!
```

---

### 2. Reuse Session تا جایی که ممکن است

```javascript
// ✅ درست: یک Session، چندین جستجو
const client = new PhDSearchClient();
await client.createSession();

// روز اول
await client.search('AI');
await client.search('ML');

// روز دوم (Session هنوز زنده است)
await client.search('Quantum');

// تاریخچه
const history = await client.getHistory();
// ✅ تمام 3 جستجو موجود است
```

---

### 3. Handle Errors به درستی

```javascript
async function robustSearch(sessionId, keywords) {
  try {
    const result = await search(sessionId, keywords);
    return result;
  } catch (error) {
    if (error.message.includes('Session not found')) {
      // Session منقضی شده، دوباره بساز
      const newSession = await createSession(userId);
      return await search(newSession.sessionId, keywords);
    }
    throw error;
  }
}
```

---

### 4. Cleanup بعد از اتمام کار

```javascript
// ✅ درست
try {
  const session = await createSession('user-123');
  await search(session.sessionId, 'AI');
  // ... کارها ...
} finally {
  // حتی در صورت خطا، Session پاک می‌شود
  await deleteSession(session.sessionId);
}
```

---

## 🎯 خلاصه کلیدی

### Session:
- ✅ یک شناسه منطقی (UUID)
- ✅ تا 24 ساعت نگه داشته می‌شود
- ✅ تاریخچه جستجوها را ذخیره می‌کند
- ✅ State را حفظ می‌کند

### Tab:
- ⚡ موقتی (فقط در حین جستجو)
- 🔄 قابل استفاده مجدد توسط Session های مختلف
- 🔢 محدود به 100 تب همزمان
- ⏱️ بعد از 10 دقیقه Idle بسته می‌شود

### جواب سوالات شما:

**1. باید اول Session بسازم؟**
- ✅ بله، توصیه می‌شود (برای نگهداری تاریخچه)
- ⚠️ اگر نسازی، API خودکار می‌سازد اما تاریخچه نداری

**2. اگر 5 دقیقه سرچ نکرد چی میشه؟**
- ✅ Session هنوز زنده است
- ❌ Tab بسته شده (آزاد شده برای دیگران)
- ✅ داده‌ها ذخیره هستند
- ✅ می‌تواند از همان جا ادامه دهد

**3. Tab چی میشه؟**
- 🔄 آزاد می‌شود برای Session بعدی
- ❌ به Session اختصاص ثابت ندارد
- ✅ هر بار Tab موقت جدید می‌گیرد

---

**🎉 حالا دقیقاً می‌دونی چطور Session و Tab ها کار می‌کنند!**
