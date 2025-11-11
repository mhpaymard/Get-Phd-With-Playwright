/**
 * پاک کردن database برای شروع از اول
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data/findaphd.db');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Database deleted:', dbPath);
} else {
  console.log('⚠️  Database file not found:', dbPath);
}

// پاک کردن WAL و SHM files
const walPath = dbPath + '-wal';
const shmPath = dbPath + '-shm';

if (fs.existsSync(walPath)) {
  fs.unlinkSync(walPath);
  console.log('✅ WAL file deleted');
}

if (fs.existsSync(shmPath)) {
  fs.unlinkSync(shmPath);
  console.log('✅ SHM file deleted');
}

console.log('\n✅ Database completely deleted!');
console.log('Now run: npm start');

