# 🎯 استراتژی نهایی Extraction

## کشف مهم! 🔍

بعد از بررسی دقیق HTML، فهمیدم که اطلاعات در **3 جا** هستند:

---

## 📍 منابع اطلاعات:

### 1️⃣ JSON-LD (script[type="application/ld+json"])
```json
{
  "@type": "Course",
  "name": "PhD Title",
  "description": "Full description (2000-6000 chars)",
  "provider": {
    "name": "University Name"
  }
}
```

**مزایا:**
- ✅ Title کامل
- ✅ University name
- ✅ Description بسیار کامل
- ✅ Structured و reliable

**معایب:**
- ❌ Deadline نداره
- ❌ Supervisor واضح نداره  
- ❌ Location/Department نداره
- ⚠️ بعضی وقت‌ها Program-level است نه Project-specific

---

### 2️⃣ HTML Elements (در .phd-result container)
```html
<!-- Title -->
<span class="h4">Climate impacts from water-rich...</span>

<!-- University -->
<span class="phd-result__dept-inst--title">University of Leeds</span>

<!-- Department -->
<div class="phd-result__dept-inst--dept">School of Earth & Environment</div>

<!-- Deadline -->
<i class="fa-calendar"></i>&nbsp;7 January 2026

<!-- Supervisor -->
<div class="phd-result__key-info super">
  <span style="font-weight: bold;">Supervisors:</span> 
  Dr G.W. Mann, Dr A Maycock, Dr A Rap, Dr B Johnson
</div>

<!-- Program Type -->
<i class="fa-graduation-cap"></i>&nbsp;PhD Research Project

<!-- Funding -->
<i class="fa-wallet"></i>&nbsp;Competition Funded PhD Project

<!-- Description (کوتاه) -->
<div class="descFrag">Climate impacts from... Read more</div>
```

**مزایا:**
- ✅ Deadline مشخص و واضح! ⭐
- ✅ Supervisor کامل! ⭐
- ✅ Department name
- ✅ Program Type
- ✅ Funding Type

**معایب:**
- ❌ Description کوتاه (فقط 100 کاراکتر + "Read more")

---

### 3️⃣ DataLayerManager (Google Analytics variables در script)
```javascript
DataLayerManager.dynamicInstitutionName = "University of Leeds";
DataLayerManager.dynamicDepartmentName = "School of Earth & Environment";
DataLayerManager.dynamicLocationCountryName = "United Kingdom";
DataLayerManager.dynamicLocationCityName = "";
DataLayerManager.dynamicDisciplineNames = "Chemistry,Environmental Sciences,Geography,Mathematics,Physics";
DataLayerManager.dynamicSubjectNames = "Environmental Chemistry,Climate Science,Environmental Geography,Remote Sensing...";
DataLayerManager.dynamicProgrammeTypes = "PhD Research Project";
DataLayerManager.dynamicFundingTypes = "EU,NE,SF,UK";
DataLayerManager.dynamicBpIdpId = 180868;
```

**مزایا:**
- ✅ **Disciplines** (متعدد)! ⭐⭐⭐
- ✅ **Subjects** (متعدد)! ⭐⭐⭐
- ✅ Country
- ✅ Institution و Department
- ✅ Funding Types
- ✅ Program Type

**معایب:**
- ❌ Deadline نداره
- ❌ Supervisor نداره

---

## 🎯 استراتژی بهینه: **Hybrid Method**

ترکیب هر 3 منبع برای حداکثر Coverage:

```javascript
const phdData = {
  // از JSON-LD
  title: jsonLd.name,                           // ✅ 100%
  descriptionFull: jsonLd.description,          // ✅ 100% (کامل)
  universityFromJsonLd: jsonLd.provider.name,   // ✅ 100%
  
  // از HTML Elements
  url: htmlElement.querySelector('a').href,                    // ✅ 100%
  deadline: htmlElement.querySelector('.fa-calendar').text,    // ✅ ~50%
  supervisor: htmlElement.querySelector('.super').text,        // ✅ ~50%
  descriptionShort: htmlElement.querySelector('.descFrag').text, // ✅ 100%
  
  // از DataLayerManager
  university: dataLayer.dynamicInstitutionName,     // ✅ 100%
  department: dataLayer.dynamicDepartmentName,      // ✅ ~90%
  country: dataLayer.dynamicLocationCountryName,    // ✅ ~80%
  disciplines: dataLayer.dynamicDisciplineNames,    // ✅ ~80%
  subjects: dataLayer.dynamicSubjectNames,          // ✅ ~80%
  fundingTypes: dataLayer.dynamicFundingTypes,      // ✅ ~70%
  programType: dataLayer.dynamicProgrammeTypes      // ✅ ~90%
};
```

---

## 📊 پیش‌بینی Coverage با Hybrid Method:

| فیلد | Estimated Coverage | منبع |
|------|-------------------|------|
| **Title** | 100% | JSON-LD + HTML |
| **URL** | 100% | HTML |
| **University** | 100% | JSON-LD + HTML + DataLayer |
| **Department** | 90% | HTML + DataLayer |
| **Country** | 80% | DataLayer |
| **Disciplines** | 80% | DataLayer ⭐ |
| **Subjects** | 80% | DataLayer ⭐ |
| **Supervisor** | 50% | HTML |
| **Deadline** | 50% | HTML |
| **Program Type** | 90% | HTML + DataLayer |
| **Funding** | 70% | HTML + DataLayer |
| **Description (Full)** | 100% | JSON-LD |
| **Description (Short)** | 100% | HTML |

**Average Coverage: ~85%** 🎯

---

## 🚀 پیاده‌سازی در Crawler:

### Step 1: Extract از هر 3 منبع
```javascript
async function extractHybrid(page) {
  return await page.evaluate(() => {
    const results = [];
    const containers = document.querySelectorAll('.phd-result');
    
    containers.forEach(container => {
      const phd = {
        // از HTML
        title: container.querySelector('.h4')?.textContent,
        url: container.querySelector('a[href*="/phds/project/"]')?.href,
        deadline: container.querySelector('.fa-calendar')?.parentElement.textContent,
        supervisor: container.querySelector('.super .icon-text')?.textContent,
        university: container.querySelector('.phd-result__dept-inst--inst')?.textContent,
        department: container.querySelector('.phd-result__dept-inst--dept')?.textContent,
        
        // از DataLayerManager (در script tag)
        dataLayer: extractDataLayerFromScript(container)
      };
      
      results.push(phd);
    });
    
    return results;
  });
}
```

### Step 2: Merge با JSON-LD
```javascript
// 1. Extract HTML
const htmlResults = await extractHybrid(page);

// 2. Extract JSON-LD
const jsonLdResults = await extractJsonLd(page);

// 3. Merge by matching title
const merged = mergeResults(htmlResults, jsonLdResults);
```

### Step 3: Enrich با parse description
```javascript
merged.forEach(phd => {
  // اگه از HTML نیومد، از description JSON-LD parse کن
  if (!phd.supervisor) {
    phd.supervisor = parseSuperfvisor(phd.descriptionFull);
  }
  if (!phd.deadline) {
    phd.deadline = parseDeadline(phd.descriptionFull);
  }
  // ... و غیره
});
```

---

## ✅ مزایای Hybrid Method:

1. ✅ **Best of both worlds**
2. ✅ Coverage بالای 85%
3. ✅ Disciplines و Subjects (که قبلاً نداشتیم!)
4. ✅ Department و Country
5. ✅ Description کامل + کوتاه

---

## 📋 Implementation Plan:

### 1. Refactor `playwrightCrawler.js`:
- ✅ نگه داشتن HTML extraction فعلی
- ✅ اضافه کردن JSON-LD extraction
- ✅ اضافه کردن DataLayerManager extraction
- ✅ Merge کردن هر 3 منبع

### 2. Update Database Schema:
```sql
ALTER TABLE phd_positions ADD COLUMN disciplines TEXT;
ALTER TABLE phd_positions ADD COLUMN subjects TEXT;
ALTER TABLE phd_positions ADD COLUMN department VARCHAR(500);
ALTER TABLE phd_positions ADD COLUMN program_type VARCHAR(100);
ALTER TABLE phd_positions ADD COLUMN deadline_date DATE; -- ISO format
```

### 3. Test Coverage:
- بعد از refactor → تست با keyword "a"
- انتظار: 15 PhD با 85%+ coverage

---

**Version:** 3.0.0 (Hybrid Method)  
**Status:** 🎯 Ready for Implementation  
**Estimated Coverage:** 85%+

