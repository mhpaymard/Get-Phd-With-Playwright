// Browser Pool Manager - مدیریت تب‌های Playwright با محدودیت
const { chromium } = require('playwright');
const config = require('../core/config');

class BrowserPool {
    constructor() {
        this.browser = null;
        this.contexts = new Map(); // sessionId -> { context, tabs: [] }
        this.maxTabs = Number(process.env.MAX_BROWSER_TABS || 100);
        this.activeTabCount = 0;
        this.queue = []; // صف درخواست‌های در انتظار
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log('Initializing browser pool...');
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.isInitialized = true;
        console.log('Browser pool initialized successfully');
    }

    async acquireTab(sessionId) {
        // اگر ظرفیت پر است، درخواست را به صف اضافه کن
        if (this.activeTabCount >= this.maxTabs) {
            console.log(`[BrowserPool] Max tabs reached (${this.maxTabs}). Queueing request for session ${sessionId}`);
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    const index = this.queue.findIndex(q => q.sessionId === sessionId);
                    if (index !== -1) this.queue.splice(index, 1);
                    reject(new Error('Tab acquisition timeout'));
                }, 30010); // 30 second timeout

                this.queue.push({
                    sessionId,
                    resolve: (tab) => {
                        clearTimeout(timeout);
                        resolve(tab);
                    },
                    reject: (err) => {
                        clearTimeout(timeout);
                        reject(err);
                    }
                });
            });
        }

        // ایجاد یا دریافت context برای این session
        let contextData = this.contexts.get(sessionId);

        if (!contextData) {
            const context = await this.browser.newContext({
                userAgent: config.userAgent,
                viewport: { width: 1920, height: 1080 }
            });

            contextData = { context, tabs: [] };
            this.contexts.set(sessionId, contextData);
        }

        // ایجاد تب جدید
        const page = await contextData.context.newPage();
        const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const tab = {
            id: tabId,
            page,
            sessionId,
            createdAt: Date.now(),
            lastUsed: Date.now()
        };

        contextData.tabs.push(tab);
        this.activeTabCount++;

        console.log(`[BrowserPool] Tab acquired: ${tabId} for session ${sessionId}. Active tabs: ${this.activeTabCount}/${this.maxTabs}`);

        return tab;
    }

    async releaseTab(tabId) {
        // پیدا کردن و بستن تب
        for (const [sessionId, contextData] of this.contexts.entries()) {
            const tabIndex = contextData.tabs.findIndex(t => t.id === tabId);

            if (tabIndex !== -1) {
                const tab = contextData.tabs[tabIndex];

                try {
                    await tab.page.close();
                } catch (e) {
                    console.error(`[BrowserPool] Error closing tab ${tabId}:`, e.message);
                }

                contextData.tabs.splice(tabIndex, 1);
                this.activeTabCount--;

                console.log(`[BrowserPool] Tab released: ${tabId}. Active tabs: ${this.activeTabCount}/${this.maxTabs}`);

                // پردازش صف
                this._processQueue();

                return true;
            }
        }

        return false;
    }

    async releaseSessionTabs(sessionId) {
        const contextData = this.contexts.get(sessionId);

        if (!contextData) return;

        // بستن تمام تب‌های این session
        for (const tab of contextData.tabs) {
            try {
                await tab.page.close();
                this.activeTabCount--;
            } catch (e) {
                console.error(`[BrowserPool] Error closing tab ${tab.id}:`, e.message);
            }
        }

        // بستن context
        try {
            await contextData.context.close();
        } catch (e) {
            console.error(`[BrowserPool] Error closing context for session ${sessionId}:`, e.message);
        }

        this.contexts.delete(sessionId);

        console.log(`[BrowserPool] All tabs released for session ${sessionId}. Active tabs: ${this.activeTabCount}/${this.maxTabs}`);

        // پردازش صف
        this._processQueue();
    }

    _processQueue() {
        // پردازش درخواست‌های در صف
        while (this.queue.length > 0 && this.activeTabCount < this.maxTabs) {
            const request = this.queue.shift();

            this.acquireTab(request.sessionId)
                .then(request.resolve)
                .catch(request.reject);
        }
    }

    async closeAll() {
        console.log('Closing all browser tabs and contexts...');

        for (const [sessionId, contextData] of this.contexts.entries()) {
            for (const tab of contextData.tabs) {
                try {
                    await tab.page.close();
                } catch (e) {
                    // ignore
                }
            }

            try {
                await contextData.context.close();
            } catch (e) {
                // ignore
            }
        }

        this.contexts.clear();
        this.activeTabCount = 0;

        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }

        this.isInitialized = false;
        console.log('All browser resources closed');
    }

    getStats() {
        return {
            maxTabs: this.maxTabs,
            activeTabs: this.activeTabCount,
            activeSessions: this.contexts.size,
            queueLength: this.queue.length,
            availableTabs: this.maxTabs - this.activeTabCount
        };
    }

    getMaxTabs() {
        return this.maxTabs;
    }

    /**
     * Acquire browser instance for crawler (compatibility method)
     * This returns the main browser instance for use with new crawler
     */
    async acquire() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return this.browser;
    }

    /**
     * Release browser instance (no-op since we reuse the same browser)
     */
    async release(browser) {
        // Browser is shared, so we don't close it
        // Individual pages/contexts are managed separately
        return Promise.resolve();
    }

    // پاکسازی تب‌های قدیمی (بعد از 10 دقیقه عدم استفاده)
    async cleanupIdleTabs() {
        const now = Date.now();
        const maxIdleTime = 10 * 60 * 1000; // 10 minutes

        for (const [sessionId, contextData] of this.contexts.entries()) {
            const idleTabs = contextData.tabs.filter(tab => now - tab.lastUsed > maxIdleTime);

            for (const tab of idleTabs) {
                await this.releaseTab(tab.id);
            }
        }
    }
}

// Singleton instance
const browserPool = new BrowserPool();

// پاکسازی دوره‌ای
setInterval(() => {
    browserPool.cleanupIdleTabs().catch(console.error);
}, 60000); // هر 1 دقیقه

module.exports = browserPool;