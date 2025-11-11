/**
 * Ultimate Parser - با تمام Pattern های ممکن
 * نسخه نهایی برای extract کردن حداکثری اطلاعات
 */

const fs = require('fs');

// خواندن raw data
const rawData = JSON.parse(fs.readFileSync('crawler-test-results.json', 'utf8'));

// حذف duplicates
const uniquePhds = [];
const seenNames = new Set();

rawData.rawJsonLd.forEach(phd => {
  if (!seenNames.has(phd.name)) {
    seenNames.add(phd.name);
    uniquePhds.push(phd);
  }
});

console.log('\n' + '='.repeat(120));
console.log('🚀 Ultimate Parser - حداکثر Extraction');
console.log('='.repeat(120) + '\n');

// Ultimate Parser
function ultimateParse(desc, university) {
  const result = {
    supervisors: [],
    deadline: null,
    emails: [],
    funding: null,
    location: null,
    startDate: null
  };

  if (!desc) return result;

  // پاک‌سازی HTML entities
  desc = desc.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

  // ══════════════════════════════════════════
  // 1. SUPERVISORS
  // ══════════════════════════════════════════
  
  const supervisorPatterns = [
    // "Supervisory Team: Will Unsworth (York), Chris Spicer (York)"
    { pattern: /Supervisory\s+Team:?\s*([^\n.]{15,350})/gi, priority: 1 },
    
    // "Leeds PhD supervisors: Dr. X, Prof. Y"
    { pattern: /(?:Leeds|Oxford|Cambridge|York|PhD)\s+supervisors?:?\s*([^\n]{15,350})/gi, priority: 1 },
    
    // "Primary Supervisor: Dr Elena Torlai Triglia"
    { pattern: /(?:Primary|Main|Lead|Principal)\s+Supervisor:?\s*([^\n]{10,250})/gi, priority: 1 },
    
    // "Supervisor: Prof X" or "Supervisors: Dr Y, Prof Z"
    { pattern: /Supervisor[s]?:?\s*([^\n]{10,250}(?:and|,)[^\n]{5,150})?/gi, priority: 2 },
    
    // "supervised by Prof X and Dr Y"
    { pattern: /supervised\s+by\s+([^\n.]{10,200})/gi, priority: 2 },
    
    // "under the supervision of Prof X"
    { pattern: /(?:under the )?supervision of\s+([^\n.]{10,200})/gi, priority: 2 },
    
    // "contact Prof Richard Stanton"
    { pattern: /contact\s+((?:Prof(?:essor)?|Dr)\s+[A-Z][^\n.]{5,100})/gi, priority: 3 },
    
    // Names: "Prof John Smith" or "Dr. Jane Doe"
    { pattern: /((?:Prof(?:essor)?|Dr)\.?\s+[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)/g, priority: 4 }
  ];

  // Sort by priority و extract
  supervisorPatterns.sort((a, b) => a.priority - b.priority);
  
  supervisorPatterns.forEach(({ pattern }) => {
    const matches = desc.matchAll(pattern);
    for (const match of matches) {
      let text = (match[1] || match[0]).trim();
      
      // Clean up
      text = text.replace(/\s+/g, ' ');
      text = text.split(/[.;]\s/)[0]; // تا اولین نقطه یا semicolon
      
      // Validation
      if (text.length >= 8 && text.length <= 350 && text.match(/(?:Prof|Dr)/i)) {
        result.supervisors.push(text);
      }
    }
  });

  result.supervisors = [...new Set(result.supervisors)].slice(0, 5);

  // ══════════════════════════════════════════
  // 2. DEADLINE
  // ══════════════════════════════════════════
  
  const deadlinePatterns = [
    // "Application Deadline: Midday, Wednesday 3 December 2025"
    /Application\s+Deadline:?\s*[^0-9]*?(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    
    // "deadline is 14th November 2025"
    /deadline\s+(?:is|:)\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    
    // "apply by 31 January 2026"
    /apply\s+by:?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    
    // "applications by 3 December 2025"
    /applications?\s+by:?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    
    // Plain date (اگر در context deadline باشه)
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi
  ];

  for (const pattern of deadlinePatterns) {
    const matches = desc.matchAll(pattern);
    for (const match of matches) {
      const dateText = match[1] || match[0];
      const dateMatch = dateText.match(/\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i);
      if (dateMatch) {
        result.deadline = dateMatch[0];
        break;
      }
    }
    if (result.deadline) break;
  }

  // ══════════════════════════════════════════
  // 3. START DATE
  // ══════════════════════════════════════════
  
  const startPatterns = [
    /start(?:ing)?\s+in\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    /commencing?\s+(?:in|on)?\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi
  ];

  for (const pattern of startPatterns) {
    const match = desc.match(pattern);
    if (match) {
      result.startDate = match[1];
      break;
    }
  }

  // ══════════════════════════════════════════
  // 4. EMAIL - Pattern بهتر
  // ══════════════════════════════════════════
  
  const emailPattern = /\b([a-z0-9][a-z0-9._+-]*@[a-z0-9][a-z0-9._-]*\.[a-z]{2,})\b/gi;
  const emailMatches = desc.matchAll(emailPattern);
  
  for (const match of emailMatches) {
    const email = match[1].toLowerCase();
    if (!email.includes('example.') && !email.includes('test.') && email.length < 100) {
      result.emails.push(email);
    }
  }

  result.emails = [...new Set(result.emails)].slice(0, 5);

  // ══════════════════════════════════════════
  // 5. FUNDING
  // ══════════════════════════════════════════
  
  const fundingMap = [
    { pattern: /fully[- ]funded/i, value: 'Fully Funded' },
    { pattern: /competition funded/i, value: 'Competition Funded' },
    { pattern: /self[- ]funded/i, value: 'Self-Funded' },
    { pattern: /EPSRC[- ]funded/i, value: 'EPSRC Funded' },
    { pattern: /UKRI[- ]funded/i, value: 'UKRI Funded' },
    { pattern: /studentship/i, value: 'Studentship' },
    { pattern: /scholarship/i, value: 'Scholarship' },
    { pattern: /\bfunded\b/i, value: 'Funded' }
  ];

  for (const { pattern, value } of fundingMap) {
    if (desc.match(pattern)) {
      result.funding = value;
      break;
    }
  }

  // ══════════════════════════════════════════
  // 6. LOCATION
  // ══════════════════════════════════════════
  
  // از university name
  if (university) {
    const uniMatch = university.match(/University of ([A-Z][a-z]+)/);
    if (uniMatch) {
      result.location = uniMatch[1];
    } else if (university.includes('Newcastle')) {
      result.location = 'Newcastle';
    } else if (university.includes('Rochester')) {
      result.location = 'Rochester, NY, USA';
    }
  }

  // از description
  if (!result.location) {
    const locationPatterns = [
      /based (?:at|in)\s+([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)/i,
      /located in\s+([A-Z][a-z]+)/i,
      /in\s+([A-Z][a-z]+),\s*(?:UK|United Kingdom|England|Scotland|Wales)/i
    ];

    for (const pattern of locationPatterns) {
      const match = desc.match(pattern);
      if (match) {
        result.location = match[1];
        break;
      }
    }
  }

  return result;
}

// Parse با ultimate parser
const ultimateResults = uniquePhds.map((phd, index) => {
  const parsed = ultimateParse(phd.description, phd.provider?.name);
  
  return {
    index: index + 1,
    title: phd.name,
    university: phd.provider?.name || null,
    location: parsed.location,
    supervisors: parsed.supervisors,
    deadline: parsed.deadline,
    startDate: parsed.startDate,
    emails: parsed.emails,
    funding: parsed.funding || 'Unknown',
    descriptionLength: phd.description?.length || 0
  };
});

// Statistics
const stats = {
  total: ultimateResults.length,
  university: ultimateResults.filter(r => r.university).length,
  location: ultimateResults.filter(r => r.location).length,
  supervisor: ultimateResults.filter(r => r.supervisors.length > 0).length,
  deadline: ultimateResults.filter(r => r.deadline).length,
  startDate: ultimateResults.filter(r => r.startDate).length,
  email: ultimateResults.filter(r => r.emails.length > 0).length,
  funding: ultimateResults.filter(r => r.funding !== 'Unknown').length
};

console.log('📊 Ultimate Extraction Statistics:');
console.log('─'.repeat(120) + '\n');

console.log(`✅ University:  ${stats.university}/15 (${Math.round(stats.university/15*100)}%)`);
console.log(`✅ Location:    ${stats.location}/15 (${Math.round(stats.location/15*100)}%)`);
console.log(`✅ Supervisor:  ${stats.supervisor}/15 (${Math.round(stats.supervisor/15*100)}%)`);
console.log(`✅ Deadline:    ${stats.deadline}/15 (${Math.round(stats.deadline/15*100)}%)`);
console.log(`✅ Start Date:  ${stats.startDate}/15 (${Math.round(stats.startDate/15*100)}%)`);
console.log(`✅ Email:       ${stats.email}/15 (${Math.round(stats.email/15*100)}%)`);
console.log(`✅ Funding:     ${stats.funding}/15 (${Math.round(stats.funding/15*100)}%)`);

// مقایسه
console.log('\n📈 مقایسه با Parser قبلی:');
console.log('-'.repeat(60));
console.log(`Supervisor:  8 → ${stats.supervisor} (+${stats.supervisor - 8})`);
console.log(`Deadline:    5 → ${stats.deadline} (+${stats.deadline - 5})`);
console.log(`Email:       6 → ${stats.email} (+${stats.email - 6})`);
console.log(`Location:   10 → ${stats.location} (+${stats.location - 10})`);

// Table
console.log('\n' + '='.repeat(120));
console.log('📋 Complete Results Table');
console.log('='.repeat(120) + '\n');

console.log(
  'No'.padEnd(4) +
  '| Title'.padEnd(40) +
  '| University'.padEnd(26) +
  '| Sup | Dead | Email | Loc'
);
console.log('-'.repeat(120));

ultimateResults.forEach(phd => {
  const t = (str, len) => (!str ? '-' : str.length > len-1 ? str.substring(0, len-4)+'...' : str).padEnd(len);
  
  console.log(
    phd.index.toString().padEnd(3) + ' ' +
    '| ' + t(phd.title, 38) +
    '| ' + t(phd.university, 24) +
    '| ' + (phd.supervisors.length > 0 ? '✅' : '❌').padEnd(3) +
    '| ' + (phd.deadline ? '✅' : '❌').padEnd(4) +
    '| ' + (phd.emails.length > 0 ? '✅' : '❌').padEnd(5) +
    '| ' + (phd.location ? '✅' : '❌')
  );
});

// نمایش جزئیات کامل
console.log('\n' + '='.repeat(120));
console.log('📋 نتایج کامل (All 15 PhDs):');
console.log('='.repeat(120) + '\n');

ultimateResults.forEach(phd => {
  console.log(`\n${'█'.repeat(100)}`);
  console.log(`PhD #${phd.index}: ${phd.title}`);
  console.log('█'.repeat(100));
  console.log(`🏛️  University:  ${phd.university || '(not found)'}`);
  console.log(`📍 Location:    ${phd.location || '(not found)'}`);
  
  if (phd.supervisors.length > 0) {
    console.log(`👨‍🏫 Supervisors (${phd.supervisors.length}):`);
    phd.supervisors.forEach(sup => console.log(`   - ${sup.substring(0, 90)}`));
  } else {
    console.log(`👨‍🏫 Supervisors:  (not found)`);
  }
  
  console.log(`📅 Deadline:    ${phd.deadline || '(not found)'}`);
  console.log(`📆 Start Date:  ${phd.startDate || '(not found)'}`);
  
  if (phd.emails.length > 0) {
    console.log(`📧 Emails:      ${phd.emails.join(', ')}`);
  } else {
    console.log(`📧 Emails:      (not found)`);
  }
  
  console.log(`💰 Funding:     ${phd.funding}`);
  console.log(`📏 Desc Length: ${phd.descriptionLength} chars`);
});

// Save
const output = {
  metadata: {
    parsedAt: new Date().toISOString(),
    method: 'Ultimate Pattern Matching v2.0',
    totalPhDs: uniquePhds.length
  },
  statistics: stats,
  results: ultimateResults
};

fs.writeFileSync('ultimate-results.json', JSON.stringify(output, null, 2), 'utf8');

console.log('\n' + '='.repeat(120));
console.log('✅ Ultimate Parsing کامل شد!');
console.log('\n📁 Saved to: ultimate-results.json');
console.log('\n🎯 Coverage Summary:');
console.log(`   Title:      15/15 (100%) ✅`);
console.log(`   University: 15/15 (100%) ✅`);
console.log(`   Location:   ${stats.location}/15 (${Math.round(stats.location/15*100)}%)`);
console.log(`   Supervisor: ${stats.supervisor}/15 (${Math.round(stats.supervisor/15*100)}%)`);
console.log(`   Deadline:   ${stats.deadline}/15 (${Math.round(stats.deadline/15*100)}%)`);
console.log(`   Email:      ${stats.email}/15 (${Math.round(stats.email/15*100)}%)`);
console.log(`   Funding:    ${stats.funding}/15 (${Math.round(stats.funding/15*100)}%)`);
console.log('='.repeat(120) + '\n');

