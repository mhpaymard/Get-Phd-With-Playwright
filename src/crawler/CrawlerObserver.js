/**
 * Crawler Observer
 * Observer Pattern برای monitoring و logging crawler events
 */

class CrawlerObserver {
  constructor() {
    this.events = [];
    this.maxEvents = 1000; // حداکثر تعداد events در حافظه
  }
  
  /**
   * Callback اصلی که به crawler متصل می‌شود
   */
  handleEvent(event, data) {
    const timestamp = new Date().toISOString();
    const eventData = {
      timestamp,
      event,
      data
    };
    
    // ذخیره در حافظه
    this.events.push(eventData);
    if (this.events.length > this.maxEvents) {
      this.events.shift(); // حذف قدیمی‌ترین event
    }
    
    // Log کردن
    this._logEvent(event, data);
  }
  
  /**
   * Log کردن events
   */
  _logEvent(event, data) {
    switch (event) {
      case 'crawl_started':
        console.log(`\n📊 Crawler Started`);
        console.log(`   Log ID: ${data.logId}`);
        console.log(`   Trigger: ${data.triggerType}`);
        break;
        
      case 'progress':
        console.log(`\n📊 Progress Update:`);
        console.log(`   Page: ${data.page}/${data.totalPages || '?'}`);
        console.log(`   Found: ${data.stats.total_found}`);
        console.log(`   New: ${data.stats.total_new}`);
        console.log(`   Updated: ${data.stats.total_updated}`);
        console.log(`   Errors: ${data.stats.total_errors}`);
        break;
        
      case 'crawl_completed':
        console.log(`\n✅ Crawler Completed`);
        console.log(`   Duration: ${data.duration}s`);
        console.log(`   Total Found: ${data.stats.total_found}`);
        console.log(`   New: ${data.stats.total_new}`);
        console.log(`   Updated: ${data.stats.total_updated}`);
        console.log(`   Deleted: ${data.stats.total_deleted}`);
        break;
        
      case 'crawl_failed':
        console.error(`\n❌ Crawler Failed`);
        console.error(`   Error: ${data.error}`);
        console.error(`   Progress: ${data.stats.total_found} found before failure`);
        break;
    }
  }
  
  /**
   * دریافت تاریخچه events
   */
  getEvents(limit = 100) {
    return this.events.slice(-limit);
  }
  
  /**
   * دریافت آخرین event
   */
  getLatestEvent() {
    return this.events[this.events.length - 1] || null;
  }
  
  /**
   * پاک کردن تاریخچه
   */
  clearEvents() {
    this.events = [];
  }
  
  /**
   * دریافت آمار events
   */
  getStats() {
    const stats = {
      total: this.events.length,
      byType: {}
    };
    
    this.events.forEach(e => {
      stats.byType[e.event] = (stats.byType[e.event] || 0) + 1;
    });
    
    return stats;
  }
}

module.exports = new CrawlerObserver();

