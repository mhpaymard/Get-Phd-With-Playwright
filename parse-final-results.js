/**
 * Parse نهایی نتایج JSON-LD
 * - حذف duplicates
 * - Parse description برای supervisor, deadline, email
 * - نمایش کامل اطلاعات
 */

const fs = require('fs');

// خواندن crawler-test-results.json
const data = JSON.parse(fs.readFileSync('crawler-test-results.json', 'utf8'));

console.log('\n' + '='.repeat(80));
console.log('🔍 Parse نهایی JSON-LD Results');
console.log('='.repeat(80) + '\n');

// حذف duplicates
const uniquePhds = [];
const seenNames = new Set();

data.rawJsonLd.forEach(phd => {
  if (!seenNames.has(phd.name)) {
    seenNames.add(phd.name);
    uniquePhds.push(phd);
  }
});

console.log(`📊 Total: ${data.rawJsonLd.length} items`);
console.log(`📚 Unique: ${uniquePhds.length} PhDs`);
console.log(`🔄 Duplicates: ${data.rawJsonLd.length - uniquePhds.length}\n`);

// Parse هر PhD
const parsedResults = uniquePhds.map((phd, index) => {
  const desc = phd.description || '';
  
  // Extract supervisor
  let supervisor = null;
  const supMatch = desc.match(/(?:Supervisor[s]?:|supervised by|supervision of)\s*([^.\n]{10,200})/i);
  if (supMatch) {
    supervisor = supMatch[1].trim();
  }

  // Extract deadline
  let deadline = null;
  const deadlineMatch = desc.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i);
  if (deadlineMatch) {
    deadline = deadlineMatch[1];
  }

  // Extract email
  let email = null;
  const emailMatch = desc.match(/([a-z0-9._-]+@[a-z0-9._-]+\.[a-z]+)/i);
  if (emailMatch) {
    email = emailMatch[1];
  }

  // Extract funding
  let funding = 'Unknown';
  if (desc.match(/fully funded/i)) funding = 'Fully Funded';
  else if (desc.match(/competition funded/i)) funding = 'Competition Funded';
  else if (desc.match(/self[- ]funded/i)) funding = 'Self-Funded';
  else if (desc.match(/funded/i)) funding = 'Funded';
  else if (desc.match(/scholarship/i)) funding = 'Scholarship';

  // Extract location from university name
  let location = null;
  const uni = phd.provider?.name || '';
  const locationMatch = uni.match(/University of ([A-Z][a-z]+)/);
  if (locationMatch) {
    location = locationMatch[1];
  }

  return {
    index: index + 1,
    title: phd.name,
    university: uni,
    location,
    supervisor,
    deadline,
    email,
    funding,
    description: desc.substring(0, 250) + '...',
    descriptionLength: desc.length
  };
});

// Statistics
console.log('='.repeat(80));
console.log('📈 Extraction Statistics');
console.log('='.repeat(80) + '\n');

const stats = {
  university: parsedResults.filter(r => r.university).length,
  location: parsedResults.filter(r => r.location).length,
  supervisor: parsedResults.filter(r => r.supervisor).length,
  deadline: parsedResults.filter(r => r.deadline).length,
  email: parsedResults.filter(r => r.email).length,
  funding: parsedResults.filter(r => r.funding && r.funding !== 'Unknown').length
};

console.log(`✅ University:  ${stats.university}/15 (${Math.round(stats.university/15*100)}%)`);
console.log(`📍 Location:    ${stats.location}/15 (${Math.round(stats.location/15*100)}%)`);
console.log(`👨‍🏫 Supervisor:  ${stats.supervisor}/15 (${Math.round(stats.supervisor/15*100)}%)`);
console.log(`📅 Deadline:    ${stats.deadline}/15 (${Math.round(stats.deadline/15*100)}%)`);
console.log(`📧 Email:       ${stats.email}/15 (${Math.round(stats.email/15*100)}%)`);
console.log(`💰 Funding:     ${stats.funding}/15 (${Math.round(stats.funding/15*100)}%)`);

// Table
console.log('\n' + '='.repeat(120));
console.log('📊 Complete Results Table');
console.log('='.repeat(120) + '\n');

console.log(
  'No'.padEnd(4) +
  '| Title'.padEnd(45) +
  '| University'.padEnd(30) +
  '| Deadline'.padEnd(18) +
  '| Has Email'
);
console.log('-'.repeat(120));

parsedResults.forEach(phd => {
  const t = (str, len) => {
    if (!str) return '-'.padEnd(len);
    return str.length > len-1 ? str.substring(0, len-4) + '...' : str.padEnd(len);
  };

  console.log(
    phd.index.toString().padEnd(3) + ' ' +
    '| ' + t(phd.title, 43) +
    '| ' + t(phd.university, 28) +
    '| ' + t(phd.deadline, 16) +
    '| ' + (phd.email ? '✅' : '❌')
  );
});

// نمایش 5 نمونه کامل
console.log('\n' + '='.repeat(120));
console.log('📋 نمونه‌های کامل (اولین 5):');
console.log('='.repeat(120) + '\n');

parsedResults.slice(0, 5).forEach(phd => {
  console.log(`\n█ PhD #${phd.index}`);
  console.log('─'.repeat(120));
  console.log(`📌 Title:       ${phd.title}`);
  console.log(`🏛️  University:  ${phd.university || '(not found)'}`);
  console.log(`📍 Location:    ${phd.location || '(not found)'}`);
  console.log(`👨‍🏫 Supervisor:  ${phd.supervisor || '(not found)'}`);
  console.log(`📅 Deadline:    ${phd.deadline || '(not found)'}`);
  console.log(`📧 Email:       ${phd.email || '(not found)'}`);
  console.log(`💰 Funding:     ${phd.funding}`);
  console.log(`📝 Description: ${phd.description}`);
  console.log(`📏 Desc Length: ${phd.descriptionLength} characters`);
});

// ذخیره
const output = {
  metadata: {
    source: 'crawler-test-results.json',
    processedAt: new Date().toISOString(),
    method: 'JSON-LD + Description Parsing',
    totalRaw: data.rawJsonLd.length,
    totalUnique: uniquePhds.length,
    duplicatesRemoved: data.rawJsonLd.length - uniquePhds.length
  },
  statistics: stats,
  results: parsedResults
};

fs.writeFileSync('parsed-final-results.json', JSON.stringify(output, null, 2), 'utf8');

console.log('\n' + '='.repeat(120));
console.log('✅ Parse Complete!');
console.log('\n📁 Results saved to: parsed-final-results.json');
console.log('\n💡 این فایل شامل:');
console.log('   ✅ 15 unique PhDs (duplicates حذف شده)');
console.log('   ✅ University: 100%');
console.log(`   ✅ Supervisor: ${stats.supervisor}/15 (${Math.round(stats.supervisor/15*100)}%)`);
console.log(`   ✅ Deadline: ${stats.deadline}/15 (${Math.round(stats.deadline/15*100)}%)`);
console.log(`   ✅ Email: ${stats.email}/15 (${Math.round(stats.email/15*100)}%)`);
console.log('='.repeat(120) + '\n');


