# 📊 گزارش نهایی Coverage - JSON-LD Method

## تاریخ: 2025-11-11
## Method: JSON-LD Structured Data Extraction

---

## ✅ نتایج نهایی

### تعداد PhD ها:
- **Raw Items**: 30 (از 4 اسکریپت JSON-LD)
- **Unique PhDs**: 15 (بعد از حذف تکراری)
- **Duplicates**: 15

### Coverage (از 15 PhD):

| فیلد | تعداد | درصد | وضعیت |
|------|-------|------|-------|
| **Title** | 15/15 | 100% | ✅ Excellent |
| **University** | 15/15 | 100% | ✅ Excellent |
| **Description** | 15/15 | 100% | ✅ Full text (2000-6000 chars) |
| **Location** | 13/15 | 87% | ✅ Very Good |
| **Funding** | 11/15 | 73% | ✅ Good |
| **Supervisor** | 8/15 | 53% | ⚠️ Acceptable |
| **Email** | 6/15 | 40% | ⚠️ Acceptable |
| **Deadline** | 5/15 | 33% | ⚠️ Limited |

---

## 🎯 PhD های کامل (5 Stars):

### 1. **P21 Development** (University of York) ⭐⭐⭐⭐⭐
```
✅ Title
✅ University: University of York
✅ Location: York
✅ Supervisors: Will Unsworth, Chris Spicer, Martin Fascione
✅ Deadline: 14th November 2025 (2025-11-14)
✅ Emails: william.unsworth@york.ac.uk, chris.spicer@york.ac.uk
✅ Funding: Fully Funded
```

### 2. **Characterising molecular** (Queen Mary) ⭐⭐⭐⭐⭐
```
✅ Title
✅ University: Queen Mary University of London
✅ Location: London
✅ Supervisor: Dr Elena Torlai Triglia
✅ Deadline: 28th January 2026 (2026-01-28)
✅ Email: sbbs-pgadmissions@qmul.ac.uk
✅ Funding: Studentship
```

### 3. **Molecular Pathways** (Cardiff) ⭐⭐⭐⭐⭐
```
✅ Title
✅ University: Cardiff University
✅ Supervisor: Prof Richard Stanton
✅ Deadline: 3 December 2025 (2025-12-03)
✅ Email: stantonrj@cardiff.ac.uk
✅ Funding: Fully Funded
```

---

## ⚠️ PhD های با missing data:

### PhD #1: Physics Ph.D. (Rochester)
```
✅ Title
✅ University
✅ Location
❌ Supervisor - (این یک program است نه project خاص)
❌ Deadline - (open admission)
❌ Email
```

### PhD #8: Climate impacts (Leeds)
```
✅ Title
✅ University
✅ Location
✅ Supervisors (3 نفر)
❌ Deadline - بررسی شد: هیچ deadline مشخصی در description نیست!
❌ Email
✅ Funding
```
**نکته**: "Oct 2026" start date است نه deadline!

---

## 🔍 چرا بعضی فیلدها missing هستند؟

### 1. **Deadline (33% coverage)**

**دلایل:**
- ✅ بعضی PhD ها deadline دارند: "31 January 2026", "3 December 2025"
- ❌ بعضی PhD ها **Program-level** هستند (مثل Physics Ph.D.) و deadline ندارند
- ❌ بعضی **open admission** هستند (مثل Climate impacts)
- ❌ بعضی فقط "start date" دارند نه deadline

**مثال‌های موفق:**
- ✅ "Application Deadline: 3 December 2025"
- ✅ "apply by 31 January 2026"
- ✅ "deadline is 14th November 2025"

**مثال‌های ناموفق:**
- ❌ "for this Oct 2026 round" (start date)
- ❌ "December 2025 report" (نه deadline)

---

### 2. **Supervisor (53% coverage)**

**دلایل:**
- ✅ بعضی descriptions واضح نام دارند: "Prof Daniel Stone"
- ❌ بعضی generic هستند: "under supervision of academic staff"
- ❌ بعضی Program-level هستند و supervisor خاص ندارند

**Patterns موفق:**
- ✅ "Supervisory Team: Will Unsworth, Chris Spicer"
- ✅ "Leeds PhD supervisors: Dr. Mann, Prof. Maycock"
- ✅ "Primary Supervisor: Dr Elena Torlai Triglia"

---

### 3. **Email (40% coverage)**

**دلایل:**
- ✅ بعضی project-specific هستند و email دارند
- ❌ بعضی program-level هستند و email ندارند
- ❌ بعضی به صفحه دیگر refer می‌کنند

---

## 💡 نتیجه‌گیری:

### ✅ JSON-LD Method عالی است برای:
1. **Title extraction**: 100% ✅
2. **University identification**: 100% ✅
3. **Full description**: 100% ✅ (2000-6000 chars)
4. **Location**: 87% ✅

### ⚠️ محدودیت‌های طبیعی:
- بعضی PhD ها **Program-level** هستند نه Project-specific
- این PhD ها به صورت طبیعی supervisor/deadline مشخص ندارند
- این محدودیت **ذاتی داده** هست نه مشکل extraction

---

## 🎯 پیشنهاد نهایی:

### برای Crawler:
1. ✅ از JSON-LD برای extraction استفاده کن
2. ✅ Merge کردن duplicates بر اساس title+university
3. ✅ Parse کردن description با patterns فعلی
4. ✅ ذخیره deadlineText + deadlineDate (ISO format)
5. ✅ Accept کردن که بعضی فیلدها null هستند (طبیعی است)

### برای Frontend/Users:
- نمایش اطلاعات موجود
- اگر deadline نبود: "Contact university for details"
- لینک به صفحه اصلی برای اطلاعات بیشتر

---

## 📈 مقایسه نهایی:

| Method | PhDs | University | Location | Supervisor | Deadline | Description |
|--------|------|------------|----------|------------|----------|-------------|
| **HTML Selectors** | 7 | 0% | 0% | 100% | 100% | 100 chars |
| **JSON-LD** | **15** | **100%** | **87%** | 53% | 33% | **Full text** |

**نتیجه**: JSON-LD روش بهتری است! 🚀

---

## ✅ آماده برای Production:

با این coverage:
- ✅ Title + University + Description همیشه موجود
- ✅ Location اکثراً موجود (87%)
- ⚠️ Supervisor/Deadline/Email گاهی موجود (30-50%)

این برای **MVP کافی** است! کاربران می‌تونند:
1. جستجو کنند
2. نتایج ببینند (با title, university, description)
3. روی لینک کلیک کنند برای جزئیات بیشتر

---

**تاریخ:** 2025-11-11  
**Status:** ✅ Ready for Crawler Implementation  
**Version:** 2.2.0

