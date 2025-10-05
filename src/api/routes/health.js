// Health Routes - مسیرهای health check
const express = require('express');
const router = express.Router();
const browserPool = require('../browserPool');
const sessionManager = require('../sessionManager');

/**
 * GET /api/health
 * بررسی وضعیت کلی سرویس
 */
router.get('/', async (req, res) => {
  try {
    const browserStats = browserPool.getStats();
    const sessionStats = sessionManager.getStats();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      browser: browserStats,
      sessions: sessionStats,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    res.json(health);

  } catch (error) {
    console.error('[HealthRoute] Error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

/**
 * GET /api/health/ready
 * بررسی آماده بودن سرویس برای دریافت درخواست
 */
router.get('/ready', async (req, res) => {
  try {
    const browserStats = browserPool.getStats();
    
    const ready = browserStats.availableTabs > 0;

    res.json({
      ready,
      availableTabs: browserStats.availableTabs,
      queueLength: browserStats.queueLength
    });

  } catch (error) {
    console.error('[HealthRoute] Error:', error);
    res.status(503).json({ 
      ready: false,
      error: error.message 
    });
  }
});

module.exports = router;
