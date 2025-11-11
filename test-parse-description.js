/**
 * Parse کردن Description برای استخراج اطلاعات پنهان
 * مثل: Supervisor, Deadline, Location, etc.
 */

const fs = require('fs');

// خواندن نتایج قبلی
const data = JSON.parse(fs.readFileSync('crawler-test-results.json', 'utf8'));

console.log('\n' + '='.repeat(80));
console.log('🔍 Parse کردن Description برای پیدا کردن اطلاعات پنهان');
console.log('='.repeat(80) + '\n');

// Helper function برای extract کردن patterns
function extractFromDescription(description) {
  const extracted = {
    supervisors: [],
    deadlines: [],
    locations: [],
    universities: [],
    contacts: [],
    funding: [],
    requirements: []
  };

  if (!description) return extracted;

  // 1. Supervisor patterns
  const supervisorPatterns = [
    /Supervisor[s]?:\s*([^.\n]+)/gi,
    /supervised by\s+([^.\n]+)/gi,
    /under the supervision of\s+([^.\n]+)/gi,
    /(Prof|Dr|Professor|Doctor)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g
  ];

  supervisorPatterns.forEach(pattern => {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        extracted.supervisors.push(match[1].trim());
      } else if (match[0]) {
        extracted.supervisors.push(match[0].trim());
      }
    }
  });

  // 2. Deadline patterns
  const deadlinePatterns = [
    /deadline[:\s]+(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    /apply by[:\s]+(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    /application deadline[:\s]+(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    /\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/g
  ];

  deadlinePatterns.forEach(pattern => {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        extracted.deadlines.push(match[1].trim());
      } else if (match[0]) {
        extracted.deadlines.push(match[0].trim());
      }
    }
  });

  // 3. University/Institution
  const uniPattern = /University of ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  const uniMatches = description.matchAll(uniPattern);
  for (const match of uniMatches) {
    extracted.universities.push(match[0]);
  }

  // 4. Location/City
  const locationPatterns = [
    /based (?:at|in)\s+([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)/g,
    /located in\s+([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)/g
  ];

  locationPatterns.forEach(pattern => {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        extracted.locations.push(match[1].trim());
      }
    }
  });

  // 5. Email
  const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emailMatches = description.matchAll(emailPattern);
  for (const match of emailMatches) {
    extracted.contacts.push(match[0]);
  }

  // 6. Funding
  const fundingKeywords = ['fully funded', 'funded', 'scholarship', 'studentship', 'EPSRC', 'UKRI', 'self-funded'];
  fundingKeywords.forEach(keyword => {
    if (description.toLowerCase().includes(keyword.toLowerCase())) {
      if (!extracted.funding.includes(keyword)) {
        extracted.funding.push(keyword);
      }
    }
  });

  return extracted;
}

// Process هر PhD
console.log('Processing all 30 PhDs...\n');

const enrichedResults = data.rawJsonLd.map((phd, index) => {
  const extracted = extractFromDescription(phd.description);
  
  return {
    index: index + 1,
    name: phd.name,
    university: phd.provider?.name || null,
    
    // Extracted from description
    supervisors: [...new Set(extracted.supervisors)].slice(0, 5), // unique, max 5
    deadlines: [...new Set(extracted.deadlines)].slice(0, 3), // unique, max 3
    locations: [...new Set(extracted.locations)],
    universitiesInDesc: [...new Set(extracted.universities)],
    contacts: [...new Set(extracted.contacts)],
    funding: extracted.funding,
    
    // Original
    description: phd.description ? phd.description.substring(0, 200) + '...' : null
  };
});

// Statistics
console.log('='.repeat(80));
console.log('📊 Extraction Statistics from Descriptions');
console.log('='.repeat(80) + '\n');

const stats = {
  supervisors: enrichedResults.filter(r => r.supervisors.length > 0).length,
  deadlines: enrichedResults.filter(r => r.deadlines.length > 0).length,
  locations: enrichedResults.filter(r => r.locations.length > 0).length,
  contacts: enrichedResults.filter(r => r.contacts.length > 0).length,
  funding: enrichedResults.filter(r => r.funding.length > 0).length
};

console.log(`✅ Supervisors found:  ${stats.supervisors}/30 (${Math.round(stats.supervisors/30*100)}%)`);
console.log(`✅ Deadlines found:    ${stats.deadlines}/30 (${Math.round(stats.deadlines/30*100)}%)`);
console.log(`⚠️  Locations found:    ${stats.locations}/30 (${Math.round(stats.locations/30*100)}%)`);
console.log(`✅ Contacts found:     ${stats.contacts}/30 (${Math.round(stats.contacts/30*100)}%)`);
console.log(`✅ Funding info found: ${stats.funding}/30 (${Math.round(stats.funding/30*100)}%)`);

// نمایش نمونه‌ها
console.log('\n' + '='.repeat(80));
console.log('📋 Sample Enriched Results (First 5):');
console.log('='.repeat(80) + '\n');

enrichedResults.slice(0, 5).forEach(phd => {
  console.log(`\n▼ PhD #${phd.index}: ${phd.name}`);
  console.log('─'.repeat(80));
  console.log(`🏛️  University: ${phd.university || '(not found)'}`);
  console.log(`👨‍🏫 Supervisors: ${phd.supervisors.length > 0 ? phd.supervisors.join(', ') : '(not found)'}`);
  console.log(`📅 Deadlines: ${phd.deadlines.length > 0 ? phd.deadlines.join(', ') : '(not found)'}`);
  console.log(`📍 Locations: ${phd.locations.length > 0 ? phd.locations.join(', ') : '(not found)'}`);
  console.log(`📧 Contacts: ${phd.contacts.length > 0 ? phd.contacts.slice(0, 2).join(', ') : '(not found)'}`);
  console.log(`💰 Funding: ${phd.funding.length > 0 ? phd.funding.join(', ') : '(not found)'}`);
});

// Table summary
console.log('\n' + '='.repeat(80));
console.log('📊 Summary Table');
console.log('='.repeat(80) + '\n');

console.log('No'.padEnd(4) + '| Title'.padEnd(50) + '| University'.padEnd(35) + '| Has Supervisor');
console.log('-'.repeat(100));

enrichedResults.forEach(phd => {
  const titleShort = phd.name.length > 47 ? phd.name.substring(0, 47) + '...' : phd.name;
  const uniShort = (phd.university || '').length > 32 ? (phd.university || '').substring(0, 32) + '...' : (phd.university || '-');
  const hasSup = phd.supervisors.length > 0 ? '✅' : '❌';
  
  console.log(
    phd.index.toString().padEnd(3) + ' ' +
    '| ' + titleShort.padEnd(48) + 
    '| ' + uniShort.padEnd(33) + 
    '| ' + hasSup
  );
});

// ذخیره
fs.writeFileSync(
  'enriched-results.json',
  JSON.stringify({ stats, results: enrichedResults }, null, 2),
  'utf8'
);

console.log('\n' + '='.repeat(80));
console.log('✅ Analysis complete!');
console.log('\n📁 Enriched results saved to: enriched-results.json');
console.log('='.repeat(80) + '\n');


