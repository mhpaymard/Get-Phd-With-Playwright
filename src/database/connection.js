/**
 * Database Connection Manager (Singleton Pattern)
 * Supports both SQLite (development) and PostgreSQL (production)
 */

const sqlite3 = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

/**
 * Database class - Singleton Pattern
 * فقط یک instance از database connection در کل برنامه وجود دارد
 */
class Database {
    static instance = null;

    constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        this.db = null;
        this.type = process.env.DB_TYPE || 'sqlite';
        this.isInitialized = false;

        Database.instance = this;
    }

    /**
     * دریافت instance منحصر به فرد (Singleton)
     */
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    /**
     * اتصال و initialize کردن database
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✓ Database already initialized');
            return this.db;
        }

        try {
            console.log(`\n${'='.repeat(60)}`);
            console.log('🗄️  Initializing Database...');

            if (this.type === 'sqlite') {
                await this._initializeSQLite();
            } else if (this.type === 'postgresql') {
                await this._initializePostgreSQL();
            }

            // اجرای migration ها
            await this._runMigrations();

            // اجرای migration v3.0 (اضافه کردن فیلدهای جدید)
            await this._runV3Migration();

            this.isInitialized = true;
            console.log('✓ Database initialized successfully');
            console.log(`${'='.repeat(60)}\n`);

            return this.db;
        } catch (error) {
            console.error('✗ Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize SQLite (برای development)
     */
    async _initializeSQLite() {
        const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../data/findaphd.db');

        // ایجاد پوشه data اگر وجود نداشت
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        console.log(`  → Connecting to SQLite: ${dbPath}`);

        this.db = sqlite3(dbPath);
        this.db.pragma('journal_mode = WAL'); // بهینه‌سازی performance
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('cache_size = 10000');

        console.log('  ✓ SQLite connection established');
    }

    /**
     * Initialize PostgreSQL (برای production)
     */
    async _initializePostgreSQL() {
        const { Pool } = require('pg');

        const pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'findaphd',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            max: 20,
            idleTimeoutMillis: 30010,
            connectionTimeoutMillis: 2000,
        });

        // تست اتصال
        const client = await pool.connect();
        console.log('  ✓ PostgreSQL connection established');
        client.release();

        this.db = pool;
    }

    /**
     * اجرای migration ها (schema.sql)
     */
    async _runMigrations() {
        console.log('  → Running migrations...');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        if (this.type === 'sqlite') {
            // SQLite: اجرای کل schema به صورت یکجا
            try {
                this.db.exec(schema);
            } catch (error) {
                // Ignore duplicate table/index errors
                if (!error.message.includes('already exists')) {
                    console.warn('  ⚠ Migration warning:', error.message);
                }
            }
        } else if (this.type === 'postgresql') {
            // PostgreSQL: اجرای کل schema
            await this.db.query(schema);
        }

        console.log('  ✓ Migrations completed');
    }

    /**
     * اجرای migration v3.0 (اضافه کردن فیلدهای جدید)
     */
    async _runV3Migration() {
        console.log('  → Running v3.0 migration (adding new fields)...');

        try {
            // اجرای مستقیم migration بدون require کردن (برای جلوگیری از loop)
            const dbType = this.type;

            if (dbType === 'sqlite') {
                const migrations = [
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
                        this.db.exec(migration.sql);
                        console.log(`    ✓ Added column: ${migration.name}`);
                    } catch (error) {
                        if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
                            // Column already exists, skip
                        } else {
                            throw error;
                        }
                    }
                }

                // Add indexes
                const indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_department ON phd_positions(department)',
                    'CREATE INDEX IF NOT EXISTS idx_deadline_date ON phd_positions(deadline_date)',
                    'CREATE INDEX IF NOT EXISTS idx_program_type ON phd_positions(program_type)'
                ];

                for (const indexSql of indexes) {
                    try {
                        this.db.exec(indexSql);
                    } catch (error) {
                        // Ignore index errors
                    }
                }
            } else if (dbType === 'postgresql') {
                const migrations = [
                    'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS disciplines TEXT',
                    'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS subjects TEXT',
                    'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS department VARCHAR(500)',
                    'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS supervisor TEXT',
                    'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS program_type VARCHAR(100)',
                    'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS deadline_date DATE',
                    'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS description_script TEXT',
                    'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS title_script VARCHAR(500)',
                    'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS university_script VARCHAR(500)',
                    'ALTER TABLE phd_positions ADD COLUMN IF NOT EXISTS json_ld_matched BOOLEAN DEFAULT FALSE'
                ];

                for (const sql of migrations) {
                    try {
                        await this.db.query(sql);
                    } catch (error) {
                        // Ignore errors
                    }
                }
            }

            console.log('  ✓ v3.0 migration completed');
        } catch (error) {
            // اگر migration قبلاً اجرا شده، ignore کن
            if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
                console.log('  ⚠ v3.0 migration already applied (or columns exist)');
            } else {
                console.warn('  ⚠ v3.0 migration warning:', error.message);
            }
        }
    }

    /**
     * اجرای query (Generic method for both SQLite and PostgreSQL)
     */
    async query(sql, params = []) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.type === 'sqlite') {
            try {
                const stmt = this.db.prepare(sql);

                // تشخیص نوع query
                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    return stmt.all(params);
                } else {
                    const result = stmt.run(params);
                    return {
                        changes: result.changes,
                        lastInsertRowid: result.lastInsertRowid
                    };
                }
            } catch (error) {
                console.error('SQLite query error:', error.message);
                console.error('SQL:', sql);
                console.error('Params:', params);
                throw error;
            }
        } else if (this.type === 'postgresql') {
            const result = await this.db.query(sql, params);
            return result.rows;
        }
    }

    /**
     * اجرای query با گرفتن یک نتیجه
     */
    async get(sql, params = []) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.type === 'sqlite') {
            const stmt = this.db.prepare(sql);
            return stmt.get(params);
        } else if (this.type === 'postgresql') {
            const result = await this.db.query(sql, params);
            return result.rows[0];
        }
    }

    /**
     * اجرای همزمان چند query (Transaction)
     */
    async transaction(callback) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.type === 'sqlite') {
            const transaction = this.db.transaction(callback);
            return transaction();
        } else if (this.type === 'postgresql') {
            const client = await this.db.connect();
            try {
                await client.query('BEGIN');
                const result = await callback(client);
                await client.query('COMMIT');
                return result;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }
    }

    /**
     * بستن اتصال
     */
    async close() {
        if (!this.isInitialized) {
            return;
        }

        console.log('🗄️  Closing database connection...');

        if (this.type === 'sqlite') {
            this.db.close();
        } else if (this.type === 'postgresql') {
            await this.db.end();
        }

        this.isInitialized = false;
        console.log('✓ Database connection closed');
    }

    /**
     * دریافت آمار database
     */
    async getStats() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const totalPhDs = await this.get(
            'SELECT COUNT(*) as count FROM phd_positions'
        );

        const activePhDs = await this.get(
            'SELECT COUNT(*) as count FROM phd_positions WHERE is_active = 1 AND is_deleted = 0'
        );

        const crawlerStats = await this.get(
            'SELECT * FROM crawler_stats'
        );

        return {
            type: this.type,
            isInitialized: this.isInitialized,
            totalPhDs: totalPhDs ? .count || 0,
            activePhDs: activePhDs ? .count || 0,
            crawlerStats: crawlerStats || {}
        };
    }
}

// Export singleton instance
module.exports = Database.getInstance();