/**
 * اجرای Migration برای اضافه کردن فیلدهای v3.0
 */

const migrate = require('./src/database/migrations/add-v3-fields');

migrate()
  .then(() => {
    console.log('\n✅ Migration completed! You can now run `npm start`');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  });

