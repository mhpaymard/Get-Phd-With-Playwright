/**
 * PhD API Routes
 * Endpoints برای جستجو و دریافت اطلاعات PhD positions
 */

const express = require('express');
const router = express.Router();
const PhDRepository = require('../../database/repositories/PhDRepository');

/**
 * GET /api/phd/search
 * جستجو در PhD positions با فیلتر و pagination
 */
router.get('/search', async (req, res) => {
  try {
    const options = {
      keywords: req.query.keywords || req.query.q || null,
      discipline: req.query.discipline || null,
      subject: req.query.subject || null,
      country: req.query.country || null,
      university: req.query.university || null,
      funding_type: req.query.funding_type || req.query.funding || null,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'last_seen_at',
      sortOrder: req.query.sortOrder || 'DESC'
    };
    
    // محدودیت limit
    if (options.limit > 100) {
      options.limit = 100;
    }
    
    const result = await PhDRepository.search(options);
    
    res.json({
      success: true,
      data: {
        results: result.results,
        pagination: result.pagination,
        filters: {
          keywords: options.keywords,
          discipline: options.discipline,
          subject: options.subject,
          country: options.country,
          university: options.university,
          funding_type: options.funding_type
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search PhD positions',
      message: error.message
    });
  }
});

/**
 * POST /api/phd/search
 * جستجو با body (برای فیلترهای پیچیده‌تر)
 */
router.post('/search', async (req, res) => {
  try {
    const options = {
      keywords: req.body.keywords || req.body.q || null,
      discipline: req.body.discipline || null,
      subject: req.body.subject || null,
      country: req.body.country || null,
      university: req.body.university || null,
      funding_type: req.body.funding_type || req.body.funding || null,
      page: parseInt(req.body.page) || 1,
      limit: parseInt(req.body.limit) || 20,
      sortBy: req.body.sortBy || 'last_seen_at',
      sortOrder: req.body.sortOrder || 'DESC'
    };
    
    if (options.limit > 100) {
      options.limit = 100;
    }
    
    const result = await PhDRepository.search(options);
    
    res.json({
      success: true,
      data: {
        results: result.results,
        pagination: result.pagination,
        filters: {
          keywords: options.keywords,
          discipline: options.discipline,
          subject: options.subject,
          country: options.country,
          university: options.university,
          funding_type: options.funding_type
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search PhD positions',
      message: error.message
    });
  }
});

/**
 * GET /api/phd/:id
 * دریافت جزئیات یک PhD
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid PhD ID'
      });
    }
    
    const phd = await PhDRepository.findById(id);
    
    if (!phd) {
      return res.status(404).json({
        success: false,
        error: 'PhD not found'
      });
    }
    
    res.json({
      success: true,
      data: phd,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get PhD error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get PhD details',
      message: error.message
    });
  }
});

/**
 * GET /api/phd/stats/summary
 * دریافت آمار کلی PhD positions
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await PhDRepository.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/phd/filters/available
 * دریافت لیست فیلترهای موجود
 */
router.get('/filters/available', async (req, res) => {
  try {
    const db = require('../../database/connection');
    
    // دریافت لیست disciplines
    const disciplines = await db.query(`
      SELECT DISTINCT discipline, COUNT(*) as count
      FROM phd_positions
      WHERE is_active = 1 AND is_deleted = 0 AND discipline IS NOT NULL
      GROUP BY discipline
      ORDER BY count DESC
    `);
    
    // دریافت لیست countries
    const countries = await db.query(`
      SELECT DISTINCT country, COUNT(*) as count
      FROM phd_positions
      WHERE is_active = 1 AND is_deleted = 0 AND country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
    `);
    
    // دریافت لیست funding types
    const fundingTypes = await db.query(`
      SELECT DISTINCT funding_type, COUNT(*) as count
      FROM phd_positions
      WHERE is_active = 1 AND is_deleted = 0 AND funding_type IS NOT NULL
      GROUP BY funding_type
      ORDER BY count DESC
    `);
    
    // دریافت لیست subjects
    const subjects = await db.query(`
      SELECT DISTINCT subject, COUNT(*) as count
      FROM phd_positions
      WHERE is_active = 1 AND is_deleted = 0 AND subject IS NOT NULL
      GROUP BY subject
      ORDER BY count DESC
      LIMIT 50
    `);
    
    res.json({
      success: true,
      data: {
        disciplines,
        countries,
        fundingTypes,
        subjects
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Filters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available filters',
      message: error.message
    });
  }
});

module.exports = router;

