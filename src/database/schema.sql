-- ============================================
-- FindAPhD Database Schema
-- Version: 2.0.0
-- Database: PostgreSQL / SQLite compatible
-- ============================================

-- PhD Positions Table
CREATE TABLE IF NOT EXISTS phd_positions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- External identifiers
  external_id       VARCHAR(255) UNIQUE NOT NULL,  -- ID منحصر به فرد از FindAPhD (از URL)
  url               TEXT NOT NULL,
  
  -- Basic information
  title             TEXT NOT NULL,
  description       TEXT,
  
  -- Institution
  university        VARCHAR(500),
  location          VARCHAR(500),
  country           VARCHAR(100),
  
  -- Academic details
  discipline        VARCHAR(255),
  subject           VARCHAR(255),
  disciplines       TEXT,              -- JSON array: ["Chemistry", "Physics", ...]
  subjects          TEXT,              -- JSON array: ["Climate Science", ...]
  department        VARCHAR(500),
  supervisor        TEXT,
  program_type      VARCHAR(100),
  
  -- Funding
  funding_type      VARCHAR(100),
  funding_amount    VARCHAR(100),
  
  -- Dates
  deadline          VARCHAR(100),       -- به صورت text چون format ها متفاوت هستند
  deadline_date     DATE,              -- ISO format: 2026-01-07
  start_date        VARCHAR(100),
  
  -- JSON-LD fields (با suffix Script)
  description_script TEXT,             -- Description کامل از JSON-LD
  title_script      VARCHAR(500),       -- Title از JSON-LD (اگه در HTML نبود)
  university_script VARCHAR(500),       -- University از JSON-LD (اگه در HTML نبود)
  json_ld_matched   BOOLEAN DEFAULT 0, -- آیا با JSON-LD match شده؟
  
  -- Status
  is_active         BOOLEAN DEFAULT 1,
  is_deleted        BOOLEAN DEFAULT 0,
  
  -- Timestamps
  first_seen_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_external_id ON phd_positions(external_id);
CREATE INDEX IF NOT EXISTS idx_title ON phd_positions(title);
CREATE INDEX IF NOT EXISTS idx_university ON phd_positions(university);
CREATE INDEX IF NOT EXISTS idx_discipline ON phd_positions(discipline);
CREATE INDEX IF NOT EXISTS idx_subject ON phd_positions(subject);
CREATE INDEX IF NOT EXISTS idx_department ON phd_positions(department);
CREATE INDEX IF NOT EXISTS idx_country ON phd_positions(country);
CREATE INDEX IF NOT EXISTS idx_deadline_date ON phd_positions(deadline_date);
CREATE INDEX IF NOT EXISTS idx_program_type ON phd_positions(program_type);
CREATE INDEX IF NOT EXISTS idx_is_active ON phd_positions(is_active);
CREATE INDEX IF NOT EXISTS idx_is_deleted ON phd_positions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_last_seen ON phd_positions(last_seen_at);

-- Full-text search index (SQLite specific)
-- CREATE VIRTUAL TABLE IF NOT EXISTS phd_positions_fts USING fts5(
--   title, description, university, content=phd_positions, content_rowid=id
-- );

-- ============================================
-- Crawler Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS crawler_logs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Timing
  started_at        DATETIME NOT NULL,
  completed_at      DATETIME,
  duration_seconds  INTEGER,
  
  -- Status
  status            VARCHAR(50) NOT NULL,  -- running, completed, failed, partial
  
  -- Statistics
  total_pages       INTEGER DEFAULT 0,
  total_found       INTEGER DEFAULT 0,
  total_new         INTEGER DEFAULT 0,
  total_updated     INTEGER DEFAULT 0,
  total_deleted     INTEGER DEFAULT 0,
  total_errors      INTEGER DEFAULT 0,
  
  -- Errors
  error_message     TEXT,
  error_stack       TEXT,
  
  -- Metadata
  crawler_version   VARCHAR(50),
  trigger_type      VARCHAR(50),    -- scheduled, manual, startup
  
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crawler_started ON crawler_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_crawler_status ON crawler_logs(status);

-- ============================================
-- Crawler Progress Table (for monitoring)
-- ============================================
CREATE TABLE IF NOT EXISTS crawler_progress (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id            INTEGER NOT NULL,
  
  -- Progress
  current_page      INTEGER,
  total_pages       INTEGER,
  items_processed   INTEGER,
  
  -- Status
  message           TEXT,
  
  -- Timestamp
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (log_id) REFERENCES crawler_logs(id) ON DELETE CASCADE
);

-- ============================================
-- System Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  key               VARCHAR(100) PRIMARY KEY,
  value             TEXT,
  description       TEXT,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial settings
INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
  ('crawler_interval_hours', '1', 'تعداد ساعت بین هر بار اجرای crawler'),
  ('last_full_crawl', NULL, 'آخرین زمان crawl کامل'),
  ('crawler_enabled', 'true', 'فعال/غیرفعال بودن crawler'),
  ('max_concurrent_requests', '5', 'حداکثر درخواست همزمان به FindAPhD'),
  ('request_delay_ms', '2000', 'تاخیر بین هر درخواست (میلی‌ثانیه)'),
  ('database_version', '1.0.0', 'نسخه schema دیتابیس');

-- ============================================
-- Views for easy querying
-- ============================================

-- فقط PhD های فعال
CREATE VIEW IF NOT EXISTS active_phds AS
SELECT * FROM phd_positions
WHERE is_active = 1 AND is_deleted = 0;

-- آمار crawler
CREATE VIEW IF NOT EXISTS crawler_stats AS
SELECT 
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_runs,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
  AVG(duration_seconds) as avg_duration,
  MAX(started_at) as last_run,
  SUM(total_new) as total_new_ever,
  SUM(total_updated) as total_updated_ever
FROM crawler_logs;

-- ============================================
-- Initial Data
-- ============================================

-- یک log اولیه
INSERT OR IGNORE INTO crawler_logs (
  id, started_at, status, trigger_type, crawler_version
) VALUES (
  1, CURRENT_TIMESTAMP, 'pending', 'startup', '2.0.0'
);

