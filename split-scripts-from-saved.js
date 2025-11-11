/**
 * جدا کردن تمام اسکریپت‌های JSON-LD از فایل ذخیره شده
 * + بررسی دقیق هر Course در هر اسکریپت
 */

const fs = require('fs');

console.log('\n' + '='.repeat(120));
console.log('🔍 آنالیز دقیق تمام اسکریپت‌های JSON-LD ذخیره شده');
console.log('='.repeat(120) + '\n');

// خواندن فایل
const savedData = JSON.parse(fs.readFileSync('crawler-test-results.json', 'utf8'));

console.log(`📊 Metadata:`);
console.log(`   Keyword: ${savedData.metadata.keyword}`);
console.log(`   Page: ${savedData.metadata.page}`);
console.log(`   Crawled At: ${savedData.metadata.crawledAt}`);
console.log(`   Method: ${savedData.metadata.method}\n`);

// در فایل قبلی، rawJsonLd یک آرایه flat از همه Course هاست
// ولی ما نمی‌دونیم از کدوم script اومدن
// پس باید یک بار دیگه با test-crawler-results اجرا کنیم که script ها رو جدا نگه داره

console.log('⚠️  فایل فعلی همه Course ها رو flat کرده و script source رو نگه نداشته\n');
console.log('→ بذار یک تست جدید بنویسیم که script ها رو جدا نگه داره...\n');

// بررسی Course ها
const courses = savedData.rawJsonLd || [];

console.log(`📚 Total Courses in file: ${courses.length}\n`);

// گروه‌بندی بر اساس title
const groupedByTitle = {};
courses.forEach((course, idx) => {
  const title = course.name;
  if (!groupedByTitle[title]) {
    groupedByTitle[title] = [];
  }
  groupedByTitle[title].push({ originalIndex: idx, course });
});

console.log('='.repeat(120));
console.log('📋 گروه‌بندی بر اساس Title:');
console.log('='.repeat(120) + '\n');

Object.entries(groupedByTitle).forEach(([title, items]) => {
  console.log(`\n📚 ${title.substring(0, 70)}${title.length > 70 ? '...' : ''}`);
  console.log(`   تعداد تکرار: ${items.length}x`);
  console.log(`   University: ${items[0].course.provider?.name}`);
  
  // بررسی deadline در هر instance
  items.forEach((item, idx) => {
    const desc = item.course.description || '';
    const hasDeadlineKeyword = desc.toLowerCase().includes('deadline');
    const dateMatches = desc.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi);
    
    console.log(`   Instance ${idx + 1} (index ${item.originalIndex}):`);
    console.log(`      Has "deadline" keyword: ${hasDeadlineKeyword ? '✅' : '❌'}`);
    console.log(`      Dates found: ${dateMatches ? dateMatches.length : 0}`);
    if (dateMatches && dateMatches.length > 0) {
      dateMatches.slice(0, 2).forEach(date => {
        console.log(`         - ${date}`);
      });
    }
  });
});

// جستجوی خاص برای "Climate impacts"
console.log('\n' + '='.repeat(120));
console.log('🎯 جستجوی خاص برای "Climate impacts from water-rich"');
console.log('='.repeat(120) + '\n');

const climateInstances = courses.filter(c => 
  c.name && c.name.toLowerCase().includes('climate') && c.name.toLowerCase().includes('water')
);

console.log(`Found ${climateInstances.length} instances\n`);

climateInstances.forEach((course, idx) => {
  console.log(`\n▼ Instance ${idx + 1}:`);
  console.log('─'.repeat(120));
  console.log(`📌 Title: ${course.name}`);
  console.log(`🏛️  University: ${course.provider?.name}`);
  console.log(`📏 Description: ${course.description?.length || 0} chars\n`);

  if (course.description) {
    const desc = course.description;

    // جستجوی تمام تاریخ‌ها
    console.log('📅 جستجوی تاریخ‌ها:\n');
    const datePattern = /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi;
    const allDates = desc.match(datePattern);

    if (allDates) {
      console.log(`   ✅ پیدا شد ${allDates.length} تاریخ:\n`);
      allDates.forEach((date, i) => {
        // Context اطراف تاریخ
        const pos = desc.indexOf(date);
        const before = desc.substring(Math.max(0, pos - 50), pos);
        const after = desc.substring(pos + date.length, Math.min(desc.length, pos + date.length + 50));
        
        console.log(`      ${i + 1}. ${date}`);
        console.log(`         Context: "...${before.trim()} [${date}] ${after.trim()}..."`);
        console.log('');
      });
    } else {
      console.log('   ❌ هیچ تاریخی پیدا نشد\n');
    }

    // جستجوی کلمه deadline
    console.log('🔍 جستجوی کلمه "deadline":\n');
    const deadlinePattern = /.{0,100}deadline.{0,100}/gi;
    const deadlineMatches = desc.match(deadlinePattern);

    if (deadlineMatches) {
      console.log(`   ✅ پیدا شد ${deadlineMatches.length} مورد:\n`);
      deadlineMatches.forEach((match, i) => {
        console.log(`      ${i + 1}. "${match.trim()}"`);
        console.log('');
      });
    } else {
      console.log('   ❌ کلمه "deadline" پیدا نشد\n');
    }

    // جستجوی patterns مختلف deadline
    console.log('🎯 Pattern های خاص deadline:\n');
    
    const specificPatterns = [
      { name: 'October 2026', pattern: /Oct(?:ober)?\s*\d{4}/gi },
      { name: 'start in October', pattern: /start(?:ing)?\s+in\s+(?:October|Sept|January)/gi },
      { name: 'by [date]', pattern: /by\s+\d{1,2}\s+\w+\s+\d{4}/gi },
      { name: 'Application deadline', pattern: /Application\s+(?:deadline|Deadline)/gi }
    ];

    specificPatterns.forEach(({ name, pattern }) => {
      const matches = desc.match(pattern);
      if (matches) {
        console.log(`   ✅ ${name}: ${matches.slice(0, 2).join(', ')}`);
      }
    });

    // Description کامل (برای من)
    console.log('\n📝 Description کامل (برای بررسی دستی):');
    console.log('─'.repeat(120));
    console.log(desc);
    console.log('─'.repeat(120));
  }
});

// ذخیره برای بررسی دستی
const detailedOutput = {
  totalCourses: courses.length,
  uniqueTitles: Object.keys(groupedByTitle).length,
  climateImpactsAnalysis: climateInstances.map(c => ({
    title: c.name,
    university: c.provider?.name,
    descriptionFull: c.description,
    descriptionLength: c.description?.length || 0
  }))
};

fs.writeFileSync('detailed-analysis.json', JSON.stringify(detailedOutput, null, 2), 'utf8');

console.log('\n' + '='.repeat(120));
console.log('✅ آنالیز کامل شد!');
console.log('\n📁 فایل ذخیره شده:');
console.log('   - detailed-analysis.json (شامل description کامل "Climate impacts")');
console.log('='.repeat(120) + '\n');

