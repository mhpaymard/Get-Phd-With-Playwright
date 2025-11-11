/**
 * Migration: Add v3.0 fields to phd_positions table
 * این migration فیلدهای جدید نسخه 3.0 رو اضافه می‌کنه
 */

const db = require('../connection');

async function migrate() {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 Running Migration: Add v3.0 fields');
  console.log('='.repeat(80) + '\n');

  try {
    // اطمینان از اینکه database initialize شده
    if (!db.isInitialized) {
      await db.initialize();
    }
    
    const dbType = db.type;

    if (dbType === 'sqlite') {
      // SQLite migration
      console.log('→ Detected SQLite database\n');

      const migrations = [
        // Add new columns
        { sql: 'ALTER TABLE phd_positions ADD COLUMN disciplines TEXT', name: 'disciplines' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN subjects TEXT', name: 'subjects' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN department VARCHAR(500)', name: 'department' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN supervisor TEXT', name: 'supervisor' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN program_type VARCHAR(100)', name: 'program_type' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN deadline_date DATE', name: 'deadline_date' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN description_script TEXT', name: 'description_script' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN title_script VARCHAR(500)', name: 'title_script' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN university_script VARCHAR(500)', name: 'university_script' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN json_ld_matched BOOLEAN DEFAULT 0', name: 'json_ld_matched' }
      ];

      for (const migration of migrations) {
        try {
          await db.query(migration.sql);
          console.log(`  ✅ Added column: ${migration.name}`);
        } catch (error) {
          if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
            console.log(`  ⚠️  Column already exists: ${migration.name}`);
          } else {
            throw error;
          }
        }
      }

      // Add indexes
      console.log('\n→ Adding indexes...\n');
      const indexes = [
        { sql: 'CREATE INDEX IF NOT EXISTS idx_department ON phd_positions(department)', name: 'idx_department' },
        { sql: 'CREATE INDEX IF NOT EXISTS idx_deadline_date ON phd_positions(deadline_date)', name: 'idx_deadline_date' },
        { sql: 'CREATE INDEX IF NOT EXISTS idx_program_type ON phd_positions(program_type)', name: 'idx_program_type' }
      ];

      for (const index of indexes) {
        try {
          await db.query(index.sql);
          console.log(`  ✅ Created index: ${index.name}`);
        } catch (error) {
          console.log(`  ⚠️  Index may already exist: ${index.name}`);
        }
      }

    } else if (dbType === 'postgresql') {
      // PostgreSQL migration
      console.log('→ Detected PostgreSQL database\n');

      const migrations = [
        { sql: 'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS disciplines TEXT', name: 'disciplines' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS subjects TEXT', name: 'subjects' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS department VARCHAR(500)', name: 'department' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS supervisor TEXT', name: 'supervisor' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS program_type VARCHAR(100)', name: 'program_type' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS deadline_date DATE', name: 'deadline_date' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS description_script TEXT', name: 'description_script' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS title_script VARCHAR(500)', name: 'title_script' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS university_script VARCHAR(500)', name: 'university_script' },
        { sql: 'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS json_ld_matched BOOLEAN DEFAULT FALSE', name: 'json_ld_matched' }
      ];

      for (const migration of migrations) {
        try {
          await db.query(migration.sql);
          console.log(`  ✅ Added column: ${migration.name}`);
        } catch (error) {
          console.log(`  ⚠️  Error adding ${migration.name}:`, error.message);
        }
      }

      // Add indexes
      console.log('\n→ Adding indexes...\n');
      const indexes = [
        { sql: 'CREATE INDEX IF NOT EXISTS idx_department ON phd_positions(department)', name: 'idx_department' },
        { sql: 'CREATE INDEX IF NOT EXISTS idx_deadline_date ON phd_positions(deadline_date)', name: 'idx_deadline_date' },
        { sql: 'CREATE INDEX IF NOT EXISTS idx_program_type ON phd_positions(program_type)', name: 'idx_program_type' }
      ];

      for (const index of indexes) {
        try {
          await db.query(index.sql);
          console.log(`  ✅ Created index: ${index.name}`);
        } catch (error) {
          console.log(`  ⚠️  Index may already exist: ${index.name}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// اگر مستقیم اجرا شد
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrate;

