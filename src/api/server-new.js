/**
 * FindAPhD API Server - Version 2.0
 * Background Crawler Architecture
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');

// Database & Crawler
const db = require('../database/connection');
const CrawlerScheduler = require('../crawler/CrawlerScheduler');
const BackgroundCrawler = require('../crawler/BackgroundCrawler');
const CrawlerObserver = require('../crawler/CrawlerObserver');

// Routes
const phdRoutes = require('./routes/phd');
const crawlerRoutes = require('./routes/crawler');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

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

// Root endpoint
app.get('/', async(req, res) => {
    const dbStats = await db.getStats();
    const crawlerStatus = BackgroundCrawler.getStatus();

    res.json({
        service: 'FindAPhD Search API',
        version: '2.0.0',
        architecture: 'Background Crawler + Database',
        status: 'running',
        documentation: `http://localhost:${PORT}/api-docs`,
        database: {
            type: dbStats.type,
            totalPhDs: dbStats.totalPhDs,
            activePhDs: dbStats.activePhDs
        },
        crawler: {
            isRunning: crawlerStatus.isRunning,
            lastStats: crawlerStatus.stats
        },
        endpoints: {
            phd: '/api/phd',
            crawler: '/api/crawler',
            health: '/api/health'
        }
    });
});

// Swagger Documentation
let swaggerDocument;
try {
    swaggerDocument = require('../../swagger-v2.json');
} catch (error) {
    console.warn('⚠️  Swagger v2 document not found, using placeholder');
    swaggerDocument = {
        openapi: '3.0.0',
        info: {
            title: 'FindAPhD API v2.0',
            version: '2.0.0',
            description: 'Background Crawler Architecture'
        },
        paths: {}
    };
}

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FindAPhD API v2.0 Documentation'
}));

// Swagger JSON download
app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="swagger-v2.json"');
    res.json(swaggerDocument);
});

// API Routes
app.use('/api/phd', phdRoutes);
app.use('/api/crawler', crawlerRoutes);
app.use('/api/health', healthRoutes);

// Backward compatibility - redirect old routes
app.use('/api/search', (req, res) => {
    res.status(301).json({
        message: 'This endpoint has moved',
        newEndpoint: '/api/phd/search',
        documentation: `http://localhost:${PORT}/api-docs`
    });
});

app.use('/api/session', (req, res) => {
    res.status(410).json({
        message: 'Session management is no longer needed in v2.0',
        reason: 'Database-backed search is instant, no session state required',
        newEndpoint: '/api/phd/search'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        documentation: `http://localhost:${PORT}/api-docs`
    });
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
    console.log('\n🛑 Shutting down gracefully...');

    try {
        // توقف scheduler
        CrawlerScheduler.stop();

        // صبر برای اتمام crawler (اگر در حال اجرا است)
        const crawlerStatus = BackgroundCrawler.getStatus();
        if (crawlerStatus.isRunning) {
            console.log('⏳ Waiting for crawler to finish...');
            // در production باید یک timeout داشته باشیم
        }

        // بستن database
        await db.close();

        console.log('✓ Shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('✗ Shutdown error:', error);
        process.exit(1);
    }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
async function start() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('🚀 FindAPhD API Server v2.0');
        console.log('   Architecture: Background Crawler + Database');
        console.log('='.repeat(80));

        // 1. Initialize Database
        console.log('\n📊 Step 1: Initializing Database...');
        await db.initialize();
        const dbStats = await db.getStats();
        console.log(`   ✓ Database ready: ${dbStats.activePhDs} active PhDs`);

        // 2. Setup Crawler Observer
        console.log('\n👁️  Step 2: Setting up Crawler Observer...');
        BackgroundCrawler.subscribe((event, data) => {
            CrawlerObserver.handleEvent(event, data);
        });
        console.log('   ✓ Observer attached');

        // 3. Start Crawler Scheduler
        console.log('\n⏰ Step 3: Starting Crawler Scheduler...');
        await CrawlerScheduler.start();
        console.log('   ✓ Scheduler started (runs every 1 hour)');

        // 4. Start Express Server
        console.log('\n🌐 Step 4: Starting API Server...');
        app.listen(PORT, () => {
            console.log(`   ✓ Server listening on port ${PORT}`);
            console.log('\n' + '='.repeat(80));
            console.log('📚 API Documentation:');
            console.log(`   • Swagger UI:    http://localhost:${PORT}/api-docs`);
            console.log(`   • API Root:      http://localhost:${PORT}/`);
            console.log(`   • Health Check:  http://localhost:${PORT}/api/health`);
            console.log(`   • Search PhDs:   http://localhost:${PORT}/api/phd/search`);
            console.log(`   • Crawler Status: http://localhost:${PORT}/api/crawler/status`);
            console.log('='.repeat(80));
            console.log('\n✅ Server is ready to accept requests!\n');
        });

    } catch (error) {
        console.error('\n❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Run if main module
if (require.main === module) {
    start();
}

module.exports = { app, start };