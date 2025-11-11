/**
 * آنالیز PhD های با missing data
 * برای پیدا کردن pattern های بهتر
 */

const fs = require('fs');

// خواندن raw JSON-LD
const rawData = JSON.parse(fs.readFileSync('crawler-test-results.json', 'utf8'));

console.log('\n' + '='.repeat(120));
console.log('🔍 آنالیز PhD های با Missing Data');
console.log('='.repeat(120) + '\n');

// Remove duplicates
const uniquePhds = [];
const seenNames = new Set();

rawData.rawJsonLd.forEach(phd => {
  if (!seenNames.has(phd.name)) {
    seenNames.add(phd.name);
    uniquePhds.push(phd);
  }
});

console.log(`Total unique PhDs: ${uniquePhds.length}\n`);

// PhD های مشکل‌دار
const problematicPhds = [
  { index: 1, name: 'Physics Ph.D.' },
  { index: 4, name: 'Arts and Humanities Postgraduate Research' },
  { index: 5, name: 'P21 Development of novel tools' },
  { index: 8, name: 'Climate impacts from water-rich' },
  { index: 12, name: 'Molecular Pathways of Viral' },
  { index: 13, name: 'Ysgoloriaethau Ymchwil' },
  { index: 14, name: 'Astrophysical Sciences and Technology' }
];

problematicPhds.forEach(({ index, name }) => {
  const phd = uniquePhds[index - 1];
  
  if (!phd) return;
  
  console.log('█'.repeat(120));
  console.log(`PhD #${index}: ${phd.name}`);
  console.log('█'.repeat(120));
  console.log(`🏛️  University: ${phd.provider?.name}`);
  console.log(`📏 Description Length: ${phd.description?.length || 0} characters\n`);
  
  const desc = phd.description || '';
  
  // نمایش description به صورت بخش‌بندی شده
  console.log('📝 Full Description:');
  console.log('─'.repeat(120));
  
  // Split به بخش‌های 500 کاراکتری
  for (let i = 0; i < desc.length; i += 500) {
    const chunk = desc.substring(i, i + 500);
    console.log(chunk);
    console.log('');
  }
  
  // جستجوی patterns خاص
  console.log('🔍 Pattern Search:');
  console.log('─'.repeat(120));
  
  // Supervisor patterns
  const supervisorKeywords = [
    'supervisor', 'supervised', 'supervision',
    'Prof', 'Professor', 'Dr', 'Doctor',
    'advisor', 'adviser', 'faculty'
  ];
  
  console.log('\n👨‍🏫 Supervisor-related text:');
  supervisorKeywords.forEach(keyword => {
    const regex = new RegExp(`.{0,50}${keyword}.{0,100}`, 'gi');
    const matches = desc.match(regex);
    if (matches) {
      matches.slice(0, 3).forEach(match => {
        console.log(`   [${keyword}] → "${match.trim()}"`);
      });
    }
  });
  
  // Deadline patterns
  console.log('\n📅 Deadline-related text:');
  const deadlineKeywords = ['deadline', 'apply by', 'application', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  deadlineKeywords.forEach(keyword => {
    const regex = new RegExp(`.{0,30}${keyword}.{0,50}`, 'gi');
    const matches = desc.match(regex);
    if (matches) {
      matches.slice(0, 2).forEach(match => {
        console.log(`   [${keyword}] → "${match.trim()}"`);
      });
    }
  });
  
  // Email patterns
  console.log('\n📧 Email-related text:');
  const emailMatches = desc.match(/([a-z0-9._-]+@[a-z0-9._-]+\.[a-z]+)/gi);
  if (emailMatches) {
    emailMatches.forEach(email => {
      // context اطراف email
      const index = desc.indexOf(email);
      const context = desc.substring(Math.max(0, index - 50), Math.min(desc.length, index + email.length + 50));
      console.log(`   📧 ${email}`);
      console.log(`      Context: "${context.trim()}"`);
    });
  } else {
    console.log('   ❌ No email found');
  }
  
  console.log('\n' + '='.repeat(120) + '\n\n');
});

console.log('✅ Analysis complete!\n');

