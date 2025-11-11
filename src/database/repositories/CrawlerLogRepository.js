/**
 * Crawler Log Repository
 * مسئول ذخیره و بازیابی لاگ‌های crawler
 */

const db = require('../connection');

class CrawlerLogRepository {
  /**
   * شروع یک crawl جدید (ایجاد log)
   */
  async startCrawl(triggerType = 'manual') {
    const sql = `
      INSERT INTO crawler_logs (
        started_at, status, trigger_type, crawler_version
      ) VALUES (datetime('now'), 'running', ?, '2.0.0')
    `;
    
    const result = await db.query(sql, [triggerType]);
    return result.lastInsertRowid;
  }
  
  /**
   * آپدیت progress یک crawl
   */
  async updateProgress(logId, stats) {
    const sql = `
      UPDATE crawler_logs SET
        total_pages = ?,
        total_found = ?,
        total_new = ?,
        total_updated = ?,
        total_deleted = ?,
        total_errors = ?
      WHERE id = ?
    `;
    
    const params = [
      stats.total_pages || 0,
      stats.total_found || 0,
      stats.total_new || 0,
      stats.total_updated || 0,
      stats.total_deleted || 0,
      stats.total_errors || 0,
      logId
    ];
    
    await db.query(sql, params);
  }
  
  /**
   * اتمام crawl با موفقیت
   */
  async completeCrawl(logId, stats) {
    const sql = `
      UPDATE crawler_logs SET
        completed_at = datetime('now'),
        status = 'completed',
        duration_seconds = (
          CAST((julianday(datetime('now')) - julianday(started_at)) * 86400 AS INTEGER)
        ),
        total_pages = ?,
        total_found = ?,
        total_new = ?,
        total_updated = ?,
        total_deleted = ?,
        total_errors = ?
      WHERE id = ?
    `;
    
    const params = [
      stats.total_pages || 0,
      stats.total_found || 0,
      stats.total_new || 0,
      stats.total_updated || 0,
      stats.total_deleted || 0,
      stats.total_errors || 0,
      logId
    ];
    
    await db.query(sql, params);
    
    // آپدیت last_full_crawl در system_settings
    await db.query(
      `UPDATE system_settings SET value = datetime('now'), updated_at = datetime('now') WHERE key = 'last_full_crawl'`
    );
  }
  
  /**
   * اتمام crawl با خطا
   */
  async failCrawl(logId, error, stats = {}) {
    const sql = `
      UPDATE crawler_logs SET
        completed_at = datetime('now'),
        status = 'failed',
        duration_seconds = (
          CAST((julianday(datetime('now')) - julianday(started_at)) * 86400 AS INTEGER)
        ),
        error_message = ?,
        error_stack = ?,
        total_pages = ?,
        total_found = ?,
        total_new = ?,
        total_updated = ?,
        total_deleted = ?,
        total_errors = ?
      WHERE id = ?
    `;
    
    const params = [
      error.message || 'Unknown error',
      error.stack || '',
      stats.total_pages || 0,
      stats.total_found || 0,
      stats.total_new || 0,
      stats.total_updated || 0,
      stats.total_deleted || 0,
      stats.total_errors || 0,
      logId
    ];
    
    await db.query(sql, params);
  }
  
  /**
   * ثبت progress message
   */
  async logProgress(logId, message, currentPage = null, totalPages = null, itemsProcessed = null) {
    const sql = `
      INSERT INTO crawler_progress (
        log_id, current_page, total_pages, items_processed, message
      ) VALUES (?, ?, ?, ?, ?)
    `;
    
    await db.query(sql, [logId, currentPage, totalPages, itemsProcessed, message]);
  }
  
  /**
   * دریافت آخرین crawl log
   */
  async getLatest() {
    const sql = `
      SELECT * FROM crawler_logs 
      ORDER BY started_at DESC 
      LIMIT 1
    `;
    return await db.get(sql);
  }
  
  /**
   * دریافت لیست crawler logs
   */
  async getAll(limit = 50) {
    const sql = `
      SELECT * FROM crawler_logs 
      ORDER BY started_at DESC 
      LIMIT ?
    `;
    return await db.query(sql, [limit]);
  }
  
  /**
   * دریافت progress یک crawl خاص
   */
  async getProgress(logId) {
    const sql = `
      SELECT * FROM crawler_progress 
      WHERE log_id = ? 
      ORDER BY created_at DESC
    `;
    return await db.query(sql, [logId]);
  }
  
  /**
   * دریافت آمار کلی crawler
   */
  async getStats() {
    const sql = 'SELECT * FROM crawler_stats';
    return await db.get(sql);
  }
  
  /**
   * چک کردن اینکه آیا crawler در حال اجرا هست
   */
  async isRunning() {
    const sql = `
      SELECT COUNT(*) as count 
      FROM crawler_logs 
      WHERE status = 'running'
    `;
    const result = await db.get(sql);
    return result.count > 0;
  }
  
  /**
   * دریافت crawler log در حال اجرا
   */
  async getRunningCrawl() {
    const sql = `
      SELECT * FROM crawler_logs 
      WHERE status = 'running' 
      ORDER BY started_at DESC 
      LIMIT 1
    `;
    return await db.get(sql);
  }
}

module.exports = new CrawlerLogRepository();

