// Search Routes - مسیرهای مربوط به جستجو
const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');
const sessionManager = require('../sessionManager');

/**
 * POST /api/search
 * ایجاد جستجوی جدید
 */
router.post('/', async (req, res) => {
  try {
    const { userId, sessionId, keywords, filters, page = 1 } = req.body;

    // اعتبارسنجی
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // ایجاد یا دریافت session
    let session;
    if (sessionId) {
      session = sessionManager.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
    } else {
      session = sessionManager.createSession(userId);
    }

    // شروع جستجو
    const searchResult = await searchService.performSearch({
      sessionId: session.id,
      userId,
      keywords,
      filters,
      page
    });

    res.json({
      success: true,
      sessionId: session.id,
      searchId: searchResult.id,
      status: searchResult.status,
      data: searchResult
    });

  } catch (error) {
    console.error('[SearchRoute] Error:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id 
    });
  }
});

/**
 * GET /api/search/:searchId
 * دریافت وضعیت و نتایج جستجو
 */
router.get('/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const search = session.searches.find(s => s.id === searchId);
    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    res.json({
      success: true,
      data: search
    });

  } catch (error) {
    console.error('[SearchRoute] Error:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id 
    });
  }
});

/**
 * POST /api/search/:searchId/continue
 * ادامه جستجو (صفحه بعدی)
 */
router.post('/:searchId/continue', async (req, res) => {
  try {
    const { searchId } = req.params;
    const { sessionId, page } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const search = session.searches.find(s => s.id === searchId);
    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    // ادامه جستجو با صفحه جدید
    const continuedSearch = await searchService.continueSearch({
      sessionId,
      searchId,
      page: page || (search.currentPage + 1)
    });

    res.json({
      success: true,
      data: continuedSearch
    });

  } catch (error) {
    console.error('[SearchRoute] Error:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id 
    });
  }
});

/**
 * GET /api/search/history/:sessionId
 * دریافت تاریخچه جستجوها
 */
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const history = sessionManager.getSearchHistory(sessionId);

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('[SearchRoute] Error:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id 
    });
  }
});

/**
 * POST /api/search/filters/available
 * دریافت فیلترهای موجود (از token dictionary)
 */
router.post('/filters/available', async (req, res) => {
  try {
    const filters = await searchService.getAvailableFilters();

    res.json({
      success: true,
      data: filters
    });

  } catch (error) {
    console.error('[SearchRoute] Error:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id 
    });
  }
});

module.exports = router;
