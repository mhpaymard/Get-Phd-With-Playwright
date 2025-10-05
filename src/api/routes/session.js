// Session Routes - مسیرهای مربوط به session
const express = require('express');
const router = express.Router();
const sessionManager = require('../sessionManager');

/**
 * POST /api/session
 * ایجاد session جدید
 */
router.post('/', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const session = sessionManager.createSession(userId);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        userId: session.userId,
        createdAt: session.createdAt
      }
    });

  } catch (error) {
    console.error('[SessionRoute] Error:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id 
    });
  }
});

/**
 * GET /api/session/:sessionId
 * دریافت اطلاعات session
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        lastAccessedAt: session.lastAccessedAt,
        searchCount: session.searches.length,
        currentSearch: session.currentSearch
      }
    });

  } catch (error) {
    console.error('[SessionRoute] Error:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id 
    });
  }
});

/**
 * DELETE /api/session/:sessionId
 * حذف session
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const deleted = sessionManager.deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('[SessionRoute] Error:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id 
    });
  }
});

/**
 * GET /api/session/user/:userId
 * دریافت تمام session های یک کاربر
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const sessions = sessionManager.getUserSessions(userId);

    res.json({
      success: true,
      data: sessions.map(s => ({
        sessionId: s.id,
        createdAt: s.createdAt,
        lastAccessedAt: s.lastAccessedAt,
        searchCount: s.searches.length
      }))
    });

  } catch (error) {
    console.error('[SessionRoute] Error:', error);
    res.status(500).json({ 
      error: error.message,
      requestId: req.id 
    });
  }
});

module.exports = router;
