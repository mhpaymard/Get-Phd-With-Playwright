/**
 * آنالیز JSON-LD که قبلاً extract شده
 */

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('crawler-test-results.json', 'utf8'));

console.log('\n' + '='.repeat(80));
console.log('🔍 آنالیز JSON-LD Extract شده');
console.log('='.repeat(80) + '\n');

console.log(`Total items: ${data.rawJsonLd.length}\n`);

// نمایش یک نمونه کامل
console.log('▼ نمونه کامل PhD #2 (University of Leeds):');
console.log('='.repeat(80));
console.log(JSON.stringify(data.rawJsonLd[1], null, 2));
console.log('='.repeat(80) + '\n');

// بررسی تکراری بودن
const names = data.rawJsonLd.map(item => item.name);
const uniqueNames = [...new Set(names)];

console.log(`📊 Duplicates:`);
console.log(`   Total: ${names.length}`);
console.log(`   Unique: ${uniqueNames.length}`);
console.log(`   Duplicates: ${names.length - uniqueNames.length}\n`);

// لیست unique names
console.log('📚 Unique PhD Names:');
uniqueNames.forEach((name, idx) => {
  console.log(`   ${idx + 1}. ${name}`);
});

console.log('\n✅ Done!\n');

