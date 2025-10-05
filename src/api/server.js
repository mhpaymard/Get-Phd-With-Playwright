// Main API Server with Express
const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../swagger.json');
const config = require('../core/config');
const sessionManager = require('./sessionManager');
const browserPool = require('./browserPool');
const searchRoutes = require('./routes/search');
const sessionRoutes = require('./routes/session');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request ID middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  req.timestamp = Date.now();
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${req.id}`);
  next();
});

// Root endpoint (before other routes)
app.get('/', (req, res) => {
  res.json({
    service: 'FindAPhD Search API',
    version: '1.0.0',
    status: 'running',
    documentation: `http://91.99.13.17:${PORT}/api-docs`,
    endpoints: {
      search: '/api/search',
      session: '/api/session',
      health: '/api/health'
    }
  });
});

// Swagger JSON endpoint (برای دانلود مستقیم)
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="swagger.json"');
  res.json(swaggerDocument);
});

// Swagger Documentation (must be before 404 handler)
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FindAPhD API Documentation'
}));

// API Routes
app.use('/api/search', searchRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/health', healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] Request ${req.id}:`, err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.id
  });
});

// Graceful shutdown
async function shutdown() {
  console.log('\nShutting down gracefully...');
  await browserPool.closeAll();
  await sessionManager.cleanup();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
async function start() {
  try {
    await browserPool.initialize();
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`✓ FindAPhD API Server running on port ${PORT}`);
      console.log(`✓ Browser pool initialized with max ${browserPool.getMaxTabs()} tabs`);
      console.log(`\n📚 Documentation URLs:`);
      console.log(`   • Swagger UI:    http://91.99.13.17:${PORT}/api-docs`);
      console.log(`   • API Info:      http://91.99.13.17:${PORT}/`);
      console.log(`   • Health Check:  http://91.99.13.17:${PORT}/api/health`);
      console.log(`${'='.repeat(60)}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
