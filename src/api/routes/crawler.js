/**
 * Crawler Admin API Routes
 * Endpoints برای monitoring و مدیریت crawler
 */

const express = require('express');
const router = express.Router();
const BackgroundCrawler = require('../../crawler/BackgroundCrawler');
const CrawlerScheduler = require('../../crawler/CrawlerScheduler');
const CrawlerLogRepository = require('../../database/repositories/CrawlerLogRepository');
const CrawlerObserver = require('../../crawler/CrawlerObserver');

/**
 * GET /api/crawler/status
 * دریافت وضعیت فعلی crawler
 */
router.get('/status', async (req, res) => {
  try {
    const crawlerStatus = BackgroundCrawler.getStatus();
    const schedulerStatus = CrawlerScheduler.getStatus();
    const latestLog = await CrawlerLogRepository.getLatest();
    
    res.json({
      success: true,
      data: {
        crawler: crawlerStatus,
        scheduler: schedulerStatus,
        latestRun: latestLog
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get crawler status',
      message: error.message
    });
  }
});

/**
 * POST /api/crawler/trigger
 * اجرای دستی crawler (manual trigger)
 */
router.post('/trigger', async (req, res) => {
  try {
    // چک کردن اینکه crawler در حال اجرا نیست
    const status = BackgroundCrawler.getStatus();
    if (status.isRunning) {
      return res.status(409).json({
        success: false,
        error: 'Crawler is already running',
        currentStatus: status
      });
    }
    
    // شروع crawl به صورت async
    CrawlerScheduler.triggerManualCrawl().catch(error => {
      console.error('Manual crawl error:', error);
    });
    
    res.json({
      success: true,
      message: 'Crawler started successfully',
      data: {
        trigger: 'manual',
        startedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Trigger error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger crawler',
      message: error.message
    });
  }
});

/**
 * GET /api/crawler/logs
 * دریافت تاریخچه crawler logs
 */
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await CrawlerLogRepository.getAll(limit);
    
    res.json({
      success: true,
      data: {
        logs,
        count: logs.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get crawler logs',
      message: error.message
    });
  }
});

/**
 * GET /api/crawler/logs/:id
 * دریافت جزئیات یک crawler log
 */
router.get('/logs/:id', async (req, res) => {
  try {
    const logId = parseInt(req.params.id);
    
    if (isNaN(logId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid log ID'
      });
    }
    
    const db = require('../../database/connection');
    const log = await db.get('SELECT * FROM crawler_logs WHERE id = ?', [logId]);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Log not found'
      });
    }
    
    // دریافت progress این log
    const progress = await CrawlerLogRepository.getProgress(logId);
    
    res.json({
      success: true,
      data: {
        log,
        progress
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Log details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get log details',
      message: error.message
    });
  }
});

/**
 * GET /api/crawler/stats
 * دریافت آمار کلی crawler
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await CrawlerLogRepository.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Crawler stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get crawler statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/crawler/events
 * دریافت real-time events از observer
 */
router.get('/events', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const events = CrawlerObserver.getEvents(limit);
    const eventStats = CrawlerObserver.getStats();
    
    res.json({
      success: true,
      data: {
        events,
        stats: eventStats
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get crawler events',
      message: error.message
    });
  }
});

/**
 * PUT /api/crawler/settings/interval
 * تنظیم interval crawler (چند ساعت یکبار)
 */
router.put('/settings/interval', async (req, res) => {
  try {
    const hours = parseInt(req.body.hours);
    
    if (isNaN(hours) || hours < 1 || hours > 24) {
      return res.status(400).json({
        success: false,
        error: 'Invalid interval. Must be between 1 and 24 hours'
      });
    }
    
    await CrawlerScheduler.setInterval(hours);
    
    res.json({
      success: true,
      message: `Crawler interval set to ${hours} hour(s)`,
      data: {
        intervalHours: hours
      }
    });
    
  } catch (error) {
    console.error('Set interval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set crawler interval',
      message: error.message
    });
  }
});

/**
 * PUT /api/crawler/settings/toggle
 * فعال/غیرفعال کردن crawler
 */
router.put('/settings/toggle', async (req, res) => {
  try {
    const enabled = req.body.enabled === true;
    
    await CrawlerScheduler.toggleCrawler(enabled);
    
    res.json({
      success: true,
      message: `Crawler ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        enabled
      }
    });
    
  } catch (error) {
    console.error('Toggle crawler error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle crawler',
      message: error.message
    });
  }
});

module.exports = router;

