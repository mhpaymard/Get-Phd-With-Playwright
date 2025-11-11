/**
 * Crawler Scheduler
 * مسئول اجرای خودکار crawler در بازه‌های زمانی مشخص
 */

const cron = require('node-cron');
const BackgroundCrawler = require('./BackgroundCrawler');
const db = require('../database/connection');

class CrawlerScheduler {
  constructor() {
    this.crawler = BackgroundCrawler;
    this.cronJob = null;
    this.isSchedulerRunning = false;
    this.intervalHours = 1; // هر 1 ساعت (قابل تنظیم)
  }
  
  /**
   * شروع scheduler
   */
  async start() {
    if (this.isSchedulerRunning) {
      console.log('⚠️  Scheduler is already running');
      return;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('⏰ Starting Crawler Scheduler');
    
    // خواندن تنظیمات از database
    await this._loadSettings();
    
    // اجرای اولیه در startup
    console.log('   → Running initial crawl on startup...');
    this._scheduleCrawl('startup');
    
    // تنظیم cron job برای اجرای دوره‌ای
    const cronExpression = this._getCronExpression();
    console.log(`   → Scheduled to run every ${this.intervalHours} hour(s)`);
    console.log(`   → Cron expression: ${cronExpression}`);
    console.log('='.repeat(60) + '\n');
    
    this.cronJob = cron.schedule(cronExpression, () => {
      this._scheduleCrawl('scheduled');
    });
    
    this.isSchedulerRunning = true;
  }
  
  /**
   * توقف scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isSchedulerRunning = false;
    console.log('⏰ Crawler Scheduler stopped');
  }
  
  /**
   * اجرای دستی crawler
   */
  async triggerManualCrawl() {
    console.log('🔧 Manual crawl triggered');
    return await this._scheduleCrawl('manual');
  }
  
  /**
   * اجرای crawler (با چک کردن اینکه در حال اجرا نباشد)
   */
  async _scheduleCrawl(triggerType) {
    // چک کردن اینکه crawler در حال اجرا نیست
    const status = this.crawler.getStatus();
    if (status.isRunning) {
      console.log(`⚠️  Crawler is already running, skipping ${triggerType} crawl`);
      return { success: false, message: 'Crawler is already running' };
    }
    
    // چک کردن اینکه crawler فعال هست
    const enabled = await this._isCrawlerEnabled();
    if (!enabled && triggerType === 'scheduled') {
      console.log('⚠️  Crawler is disabled, skipping scheduled crawl');
      return { success: false, message: 'Crawler is disabled' };
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Starting ${triggerType} crawl...`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const result = await this.crawler.startFullCrawl(triggerType);
      return result;
    } catch (error) {
      console.error('❌ Crawler error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * دریافت cron expression بر اساس interval
   */
  _getCronExpression() {
    // هر X ساعت یکبار
    // مثال: هر 1 ساعت = "0 * * * *"
    // مثال: هر 2 ساعت = "0 */2 * * *"
    // مثال: هر 6 ساعت = "0 */6 * * *"
    
    if (this.intervalHours === 1) {
      return '0 * * * *'; // هر ساعت در دقیقه 0
    } else {
      return `0 */${this.intervalHours} * * *`;
    }
  }
  
  /**
   * خواندن تنظیمات از database
   */
  async _loadSettings() {
    try {
      const setting = await db.get(
        "SELECT value FROM system_settings WHERE key = 'crawler_interval_hours'"
      );
      
      if (setting && setting.value) {
        this.intervalHours = parseInt(setting.value);
        console.log(`   → Interval set to ${this.intervalHours} hour(s)`);
      }
    } catch (error) {
      console.warn('   ⚠ Could not load settings, using default (1 hour)');
    }
  }
  
  /**
   * چک کردن فعال بودن crawler
   */
  async _isCrawlerEnabled() {
    try {
      const setting = await db.get(
        "SELECT value FROM system_settings WHERE key = 'crawler_enabled'"
      );
      return setting && setting.value === 'true';
    } catch (error) {
      return true; // به صورت پیش‌فرض فعال
    }
  }
  
  /**
   * تنظیم interval جدید
   */
  async setInterval(hours) {
    if (hours < 1 || hours > 24) {
      throw new Error('Interval must be between 1 and 24 hours');
    }
    
    this.intervalHours = hours;
    
    // ذخیره در database
    await db.query(
      "UPDATE system_settings SET value = ?, updated_at = datetime('now') WHERE key = 'crawler_interval_hours'",
      [hours.toString()]
    );
    
    // Restart scheduler
    if (this.isSchedulerRunning) {
      this.stop();
      await this.start();
    }
    
    console.log(`✓ Crawler interval updated to ${hours} hour(s)`);
  }
  
  /**
   * فعال/غیرفعال کردن crawler
   */
  async toggleCrawler(enabled) {
    await db.query(
      "UPDATE system_settings SET value = ?, updated_at = datetime('now') WHERE key = 'crawler_enabled'",
      [enabled ? 'true' : 'false']
    );
    
    console.log(`✓ Crawler ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * دریافت وضعیت scheduler
   */
  getStatus() {
    return {
      isRunning: this.isSchedulerRunning,
      intervalHours: this.intervalHours,
      nextRun: this._getNextRunTime(),
      crawlerStatus: this.crawler.getStatus()
    };
  }
  
  /**
   * محاسبه زمان اجرای بعدی
   */
  _getNextRunTime() {
    if (!this.isSchedulerRunning) {
      return null;
    }
    
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(now.getHours() + this.intervalHours);
    nextRun.setMinutes(0);
    nextRun.setSeconds(0);
    
    return nextRun.toISOString();
  }
}

module.exports = new CrawlerScheduler();

