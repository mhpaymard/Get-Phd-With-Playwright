/**
 * Parser بهبود یافته با Pattern های دقیق‌تر
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
console.log('🔍 Parser بهبود یافته - Pattern های دقیق‌تر');
console.log('='.repeat(120) + '\n');

// Parser function بهبود یافته
function parseImproved(desc, university) {
  const result = {
    supervisors: [],
    deadline: null,
    emails: [],
    funding: null,
    requirements: null,
    location: null
  };

  if (!desc) return result;

  // ══════════════════════════════════════════
  // 1. SUPERVISORS - Pattern های متنوع
  // ══════════════════════════════════════════
  
  const supervisorPatterns = [
    // "Supervisory Team: Will Unsworth (York), Chris Spicer"
    /Supervisory Team:?\s*([^\n.]{10,300})/gi,
    
    // "Supervisor: Prof X" یا "Supervisors: Dr Y, Prof Z"
    /Supervisor[s]?:?\s*([^\n]{10,300})/gi,
    
    // "supervised by Prof X and Dr Y"
    /supervised by\s+([^\n.]{10,200})/gi,
    
    // "under the supervision of Prof X"
    /(?:under the )?supervision of\s+([^\n.]{10,200})/gi,
    
    // "Leeds PhD supervisors: Dr. X, Prof. Y"
    /(?:Leeds|Oxford|Cambridge|PhD)\s+supervisors?:?\s*([^\n]{10,300})/gi,
    
    // "Primary Supervisor: Dr X"
    /(?:Primary|Main|Lead)\s+Supervisor:?\s*([^\n]{10,200})/gi,
    
    // Names with titles: "Prof John Smith, Dr Jane Doe"
    /(?:Prof(?:essor)?|Dr)\s+[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s*,\s*(?:Prof(?:essor)?|Dr)\s+[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)*/g
  ];

  supervisorPatterns.forEach(pattern => {
    const matches = desc.matchAll(pattern);
    for (const match of matches) {
      let text = (match[1] || match[0]).trim();
      
      // پاک‌سازی
      text = text.replace(/&nbsp;/g, ' ');
      text = text.replace(/\s+/g, ' ');
      
      // فیلتر: طول معقول
      if (text.length >= 10 && text.length <= 300) {
        // چک کن که حاوی نام باشه (Prof یا Dr)
        if (text.match(/(?:Prof|Dr)/i)) {
          result.supervisors.push(text);
        }
      }
    }
  });

  // Deduplicate
  result.supervisors = [...new Set(result.supervisors)].slice(0, 5);

  // ══════════════════════════════════════════
  // 2. DEADLINE - Pattern های متنوع
  // ══════════════════════════════════════════
  
  const deadlinePatterns = [
    // "deadline is 14th November 2025"
    /(?:application\s+)?deadline\s+(?:is|:)\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    
    // "apply by 31 January 2026"
    /apply\s+by:?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    
    // "Applications must be received by..."
    /applications?.+?(?:by|before):?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    
    // Plain date: "31 January 2026"
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi
  ];

  for (const pattern of deadlinePatterns) {
    const match = desc.match(pattern);
    if (match) {
      // گرفتن date از match[1] یا match[0]
      const dateText = match[1] || match[0];
      const dateMatch = dateText.match(/\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i);
      if (dateMatch) {
        result.deadline = dateMatch[0];
        break; // اولین deadline رو می‌گیریم
      }
    }
  }

  // ══════════════════════════════════════════
  // 3. EMAIL - Pattern بهتر
  // ══════════════════════════════════════════
  
  const emailPattern = /\b([a-z0-9][a-z0-9._-]*@[a-z0-9][a-z0-9._-]*\.[a-z]{2,})\b/gi;
  const emailMatches = desc.matchAll(emailPattern);
  
  for (const match of emailMatches) {
    const email = match[1].toLowerCase();
    // فیلتر کردن email های مشکوک
    if (!email.includes('example.com') && !email.includes('test.com')) {
      result.emails.push(email);
    }
  }

  result.emails = [...new Set(result.emails)]; // deduplicate

  // ══════════════════════════════════════════
  // 4. FUNDING - Pattern بهتر
  // ══════════════════════════════════════════
  
  const fundingPatterns = [
    { keyword: 'fully funded', value: 'Fully Funded' },
    { keyword: 'fully-funded', value: 'Fully Funded' },
    { keyword: 'competition funded', value: 'Competition Funded' },
    { keyword: 'self funded', value: 'Self-Funded' },
    { keyword: 'self-funded', value: 'Self-Funded' },
    { keyword: 'studentship', value: 'Studentship' },
    { keyword: 'scholarship', value: 'Scholarship' },
    { keyword: 'EPSRC funded', value: 'EPSRC Funded' },
    { keyword: 'UKRI funded', value: 'UKRI Funded' },
    { keyword: 'funded PhD', value: 'Funded' },
    { keyword: 'funded', value: 'Funded' }
  ];

  for (const { keyword, value } of fundingPatterns) {
    if (desc.toLowerCase().includes(keyword.toLowerCase())) {
      result.funding = value;
      break;
    }
  }

  // ══════════════════════════════════════════
  // 5. LOCATION - از university name یا description
  // ══════════════════════════════════════════
  
  // از university name
  if (university) {
    const locationMatch = university.match(/University of ([A-Z][a-z]+)/);
    if (locationMatch) {
      result.location = locationMatch[1];
    }
  }

  // از description - "based in Glasgow", "located in Oxford"
  if (!result.location) {
    const locationPatterns = [
      /based (?:at|in)\s+([A-Z][a-z]+)/i,
      /located in\s+([A-Z][a-z]+)/i,
      /(?:at|in)\s+([A-Z][a-z]+),\s*(?:UK|United Kingdom)/i
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

// Parse همه
const improvedResults = uniquePhds.map((phd, index) => {
  const parsed = parseImproved(phd.description, phd.provider?.name);
  
  return {
    index: index + 1,
    title: phd.name,
    university: phd.provider?.name || null,
    
    // Parsed data
    location: parsed.location,
    supervisors: parsed.supervisors,
    deadline: parsed.deadline,
    emails: parsed.emails,
    funding: parsed.funding || 'Unknown',
    
    // Metadata
    descriptionLength: phd.description?.length || 0,
    
    // Coverage flags
    hasSupervisor: parsed.supervisors.length > 0,
    hasDeadline: !!parsed.deadline,
    hasEmail: parsed.emails.length > 0,
    hasLocation: !!parsed.location
  };
});

// Statistics
const stats = {
  total: improvedResults.length,
  university: improvedResults.filter(r => r.university).length,
  location: improvedResults.filter(r => r.hasLocation).length,
  supervisor: improvedResults.filter(r => r.hasSupervisor).length,
  deadline: improvedResults.filter(r => r.hasDeadline).length,
  email: improvedResults.filter(r => r.hasEmail).length,
  funding: improvedResults.filter(r => r.funding !== 'Unknown').length
};

console.log('📊 نتایج بهبود یافته:');
console.log('─'.repeat(120) + '\n');

console.log(`✅ University:  ${stats.university}/15 (${Math.round(stats.university/15*100)}%)`);
console.log(`✅ Location:    ${stats.location}/15 (${Math.round(stats.location/15*100)}%)`);
console.log(`✅ Supervisor:  ${stats.supervisor}/15 (${Math.round(stats.supervisor/15*100)}%)`);
console.log(`✅ Deadline:    ${stats.deadline}/15 (${Math.round(stats.deadline/15*100)}%)`);
console.log(`✅ Email:       ${stats.email}/15 (${Math.round(stats.email/15*100)}%)`);
console.log(`✅ Funding:     ${stats.funding}/15 (${Math.round(stats.funding/15*100)}%)`);

// مقایسه با قبل
console.log('\n📈 مقایسه با Parser قبلی:');
console.log('─'.repeat(120));
console.log('Field'.padEnd(15) + '| Before'.padEnd(12) + '| After'.padEnd(12) + '| Improvement');
console.log('-'.repeat(50));
console.log('Supervisor'.padEnd(15) + `| 8/15 (53%)`.padEnd(12) + `| ${stats.supervisor}/15 (${Math.round(stats.supervisor/15*100)}%)`.padEnd(12) + `| +${stats.supervisor - 8}`);
console.log('Deadline'.padEnd(15) + `| 5/15 (33%)`.padEnd(12) + `| ${stats.deadline}/15 (${Math.round(stats.deadline/15*100)}%)`.padEnd(12) + `| +${stats.deadline - 5}`);
console.log('Email'.padEnd(15) + `| 6/15 (40%)`.padEnd(12) + `| ${stats.email}/15 (${Math.round(stats.email/15*100)}%)`.padEnd(12) + `| +${stats.email - 6}`);

// Table
console.log('\n' + '='.repeat(120));
console.log('📊 Complete Results');
console.log('='.repeat(120) + '\n');

console.log(
  'No'.padEnd(4) +
  '| Title'.padEnd(42) +
  '| University'.padEnd(28) +
  '| Sup'.padEnd(5) +
  '| Deadline'.padEnd(5) +
  '| Email'.padEnd(5) +
  '| Loc'
);
console.log('-'.repeat(120));

improvedResults.forEach(phd => {
  const t = (str, len) => {
    if (!str) return '-'.padEnd(len);
    return str.length > len-1 ? str.substring(0, len-4) + '...' : str.padEnd(len);
  };

  console.log(
    phd.index.toString().padEnd(3) + ' ' +
    '| ' + t(phd.title, 40) +
    '| ' + t(phd.university, 26) +
    '| ' + (phd.hasSupervisor ? '✅' : '❌').padEnd(3) +
    '| ' + (phd.hasDeadline ? '✅' : '❌').padEnd(3) +
    '| ' + (phd.hasEmail ? '✅' : '❌').padEnd(3) +
    '| ' + (phd.hasLocation ? '✅' : '❌')
  );
});

// نمایش PhD های با بهبود
console.log('\n' + '='.repeat(120));
console.log('🎯 PhD های که بهبود پیدا کردند:');
console.log('='.repeat(120) + '\n');

improvedResults.forEach(phd => {
  if (phd.hasSupervisor || phd.hasDeadline || phd.hasEmail) {
    console.log(`\n▼ PhD #${phd.index}: ${phd.title.substring(0, 60)}...`);
    console.log('─'.repeat(120));
    
    if (phd.supervisors.length > 0) {
      console.log(`👨‍🏫 Supervisors (${phd.supervisors.length}):`);
      phd.supervisors.forEach(sup => {
        console.log(`   - ${sup.substring(0, 100)}`);
      });
    }
    
    if (phd.deadline) {
      console.log(`📅 Deadline: ${phd.deadline}`);
    }
    
    if (phd.emails.length > 0) {
      console.log(`📧 Emails: ${phd.emails.join(', ')}`);
    }
    
    if (phd.location) {
      console.log(`📍 Location: ${phd.location}`);
    }
    
    console.log(`💰 Funding: ${phd.funding}`);
  }
});

// ذخیره
const output = {
  metadata: {
    parsedAt: new Date().toISOString(),
    method: 'Improved Pattern Matching',
    version: '2.0'
  },
  statistics: stats,
  improvements: {
    supervisors: `+${stats.supervisor - 8} (${Math.round((stats.supervisor - 8)/15*100)}% improvement)`,
    deadlines: `+${stats.deadline - 5} (${Math.round((stats.deadline - 5)/15*100)}% improvement)`,
    emails: `+${stats.email - 6} (${Math.round((stats.email - 6)/15*100)}% improvement)`
  },
  results: improvedResults
};

fs.writeFileSync('improved-results.json', JSON.stringify(output, null, 2), 'utf8');

console.log('\n' + '='.repeat(120));
console.log('✅ Parsing کامل شد!');
console.log('\n📁 Results saved to: improved-results.json');
console.log('\n💡 بهبودها:');
console.log(`   ✅ Supervisors: ${stats.supervisor}/15 (${Math.round(stats.supervisor/15*100)}%)`);
console.log(`   ✅ Deadlines: ${stats.deadline}/15 (${Math.round(stats.deadline/15*100)}%)`);
console.log(`   ✅ Emails: ${stats.email}/15 (${Math.round(stats.email/15*100)}%)`);
console.log(`   ✅ Location: ${stats.location}/15 (${Math.round(stats.location/15*100)}%)`);
console.log('='.repeat(120) + '\n');

