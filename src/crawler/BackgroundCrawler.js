/**
 * Background Crawler Service
 * مسئول crawl کردن تمام PhD positions از FindAPhD.com
 * 
 * Design Patterns:
 * - Singleton Pattern: فقط یک instance
 * - Observer Pattern: برای monitoring
 * - Strategy Pattern: برای مختلف crawling strategies
 */

const FindAPhDCrawler = require('../workers/playwrightCrawler');
const PhDRepository = require('../database/repositories/PhDRepository');
const CrawlerLogRepository = require('../database/repositories/CrawlerLogRepository');

class BackgroundCrawler {
    static instance = null;

    constructor() {
        if (BackgroundCrawler.instance) {
            return BackgroundCrawler.instance;
        }

        this.crawler = new FindAPhDCrawler();
        this.phdRepo = PhDRepository;
        this.logRepo = CrawlerLogRepository;

        this.isRunning = false;
        this.currentLogId = null;
        this.stats = {
            total_pages: 0,
            total_found: 0,
            total_new: 0,
            total_updated: 0,
            total_deleted: 0,
            total_errors: 0
        };

        // Observer callbacks
        this.observers = [];

        BackgroundCrawler.instance = this;
    }

    static getInstance() {
        if (!BackgroundCrawler.instance) {
            BackgroundCrawler.instance = new BackgroundCrawler();
        }
        return BackgroundCrawler.instance;
    }

    /**
     * ثبت observer برای monitoring
     */
    subscribe(callback) {
        this.observers.push(callback);
    }

    /**
     * اطلاع‌رسانی به observers
     */
    notify(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Observer callback error:', error);
            }
        });
    }

    /**
     * شروع Full Crawl
     */
    async startFullCrawl(triggerType = 'manual') {
        if (this.isRunning) {
            console.log('⚠️  Crawler is already running');
            return { success: false, message: 'Crawler is already running' };
        }

        this.isRunning = true;
        this.resetStats();

        console.log('\n' + '='.repeat(80));
        console.log('🚀 Starting Full Crawl of FindAPhD.com');
        console.log('='.repeat(80));

        // ایجاد log جدید
        this.currentLogId = await this.logRepo.startCrawl(triggerType);
        this.notify('crawl_started', { logId: this.currentLogId, triggerType });

        const startTime = Date.now();

        try {
            // 1. Crawl تمام صفحات با keywords خالی (برای گرفتن همه)
            await this._crawlAllPages();

            // 2. علامت‌گذاری PhD های حذف شده
            await this._markDeletedPhDs();

            // 3. اتمام با موفقیت
            await this.logRepo.completeCrawl(this.currentLogId, this.stats);

            const duration = Math.round((Date.now() - startTime) / 1000);

            console.log('\n' + '='.repeat(80));
            console.log('✅ Full Crawl Completed Successfully');
            console.log(`   Duration: ${duration}s`);
            console.log(`   Found: ${this.stats.total_found}`);
            console.log(`   New: ${this.stats.total_new}`);
            console.log(`   Updated: ${this.stats.total_updated}`);
            console.log(`   Deleted: ${this.stats.total_deleted}`);
            console.log(`   Errors: ${this.stats.total_errors}`);
            console.log('='.repeat(80) + '\n');

            this.notify('crawl_completed', {
                logId: this.currentLogId,
                stats: this.stats,
                duration
            });

            return { success: true, stats: this.stats, duration };

        } catch (error) {
            console.error('\n❌ Crawler Error:', error.message);
            await this.logRepo.failCrawl(this.currentLogId, error, this.stats);

            this.notify('crawl_failed', {
                logId: this.currentLogId,
                error: error.message,
                stats: this.stats
            });

            return { success: false, error: error.message, stats: this.stats };

        } finally {
            // Close browser to free resources
            try {
                await this.crawler.closeBrowser();
            } catch (e) {
                console.warn('Warning closing browser:', e.message);
            }
            this.isRunning = false;
        }
    }

    /**
     * Crawl تمام صفحات FindAPhD
     */
    async _crawlAllPages() {
        console.log('\n📄 Phase 1: Crawling all pages...\n');

        const seenExternalIds = new Set();

        // حروف پرکاربرد انگلیسی برای جستجو
        // این حروف بیشترین coverage رو میدن
        const searchKeywords = ['a', 'e', 'i', 'o', 'r', 's', 't'];

        console.log(`📝 Strategy: Search with common letters: ${searchKeywords.join(', ')}`);
        console.log(`   This ensures maximum coverage of PhD positions\n`);

        // برای هر keyword جستجو می‌کنیم
        for (const keyword of searchKeywords) {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`🔤 Searching with keyword: "${keyword}"`);
            console.log('='.repeat(80));

            let currentPage = 1;
            let hasMorePages = true;

            while (hasMorePages) {
                try {
                    console.log(`\n→ Crawling page ${currentPage} for "${keyword}"...`);

                    const result = await this.crawler.crawlSearchPage(keyword, {}, currentPage);

                    if (!result || !result.results || result.results.length === 0) {
                        console.log('  ℹ No more results, stopping...');
                        hasMorePages = false;
                        break;
                    }

                    console.log(`  ✓ Found ${result.results.length} PhD positions`);
                    this.stats.total_pages = currentPage;
                    this.stats.total_found += result.results.length;

                    // ذخیره هر PhD
                    for (const phd of result.results) {
                        try {
                            // استفاده از external_id که crawler extract کرده
                            const external_id = phd.external_id || this._extractExternalId(phd.url);

                            if (!external_id) {
                                console.warn('  ⚠ Skipping PhD without valid URL:', phd.title || phd.titleScript);
                                continue;
                            }

                            seenExternalIds.add(external_id);

                            // تبدیل deadlineText به deadlineDate (ISO format)
                            const deadlineDate = this._parseDeadlineDate(phd.deadlineText);

                            const phdData = {
                                external_id,
                                url: phd.url,
                                title: phd.title || phd.titleScript,
                                description: phd.description || phd.desc,
                                university: phd.university || phd.universityScript || phd.institution,
                                location: phd.location,
                                country: phd.country || this._extractCountry(phd.location),
                                discipline: phd.discipline,
                                subject: phd.subject,
                                disciplines: phd.disciplines || [],
                                subjects: phd.subjects || [],
                                department: phd.department,
                                supervisor: phd.supervisor,
                                programType: phd.programType,
                                funding_type: phd.funding_type || phd.funding,
                                funding_amount: phd.funding_amount,
                                deadline: phd.deadline || phd.deadlineText,
                                deadlineDate: deadlineDate,
                                start_date: phd.start_date || phd.startDate,
                                // JSON-LD fields
                                descriptionScript: phd.descriptionScript,
                                titleScript: phd.titleScript,
                                universityScript: phd.universityScript,
                                jsonLdMatched: phd.jsonLdMatched || false
                            };

                            const result = await this.phdRepo.upsert(phdData);

                            if (result.action === 'inserted') {
                                this.stats.total_new++;
                            } else if (result.action === 'updated') {
                                this.stats.total_updated++;
                            }

                        } catch (error) {
                            console.error('  ✗ Error saving PhD:', error.message);
                            this.stats.total_errors++;
                        }
                    }

                    // آپدیت progress
                    await this.logRepo.updateProgress(this.currentLogId, this.stats);
                    await this.logRepo.logProgress(
                        this.currentLogId,
                        `Completed page ${currentPage}`,
                        currentPage,
                        result.pagination ? .totalPages,
                        this.stats.total_found
                    );

                    this.notify('progress', {
                        page: currentPage,
                        totalPages: result.pagination ? .totalPages,
                        stats: this.stats
                    });

                    // چک کردن آیا صفحه بعدی وجود دارد
                    if (result.pagination && !result.pagination.hasNextPage) {
                        hasMorePages = false;
                    }

                    // تاخیر برای جلوگیری از بار زیاد روی سایت
                    await this._delay(3001); // 3 ثانیه تاخیر

                    currentPage++;

                    // محدودیت امنیتی (حداکثر 200 صفحه)
                    if (currentPage > 200) {
                        console.log('  ⚠ Reached maximum page limit (200), stopping...');
                        hasMorePages = false;
                    }

                } catch (error) {
                    console.error(`  ✗ Error crawling page ${currentPage}:`, error.message);
                    this.stats.total_errors++;

                    // اگر خطای شدید بود، متوقف شو
                    if (error.message.includes('timeout') || error.message.includes('navigation')) {
                        console.log('  ⚠ Critical error, retrying once...');

                        // یک بار دیگر تلاش
                        try {
                            await this._delay(5000);
                            const retryResult = await this.crawler.crawlSearchPage(keyword, {}, currentPage);
                            if (!retryResult || !retryResult.results || retryResult.results.length === 0) {
                                hasMorePages = false;
                            }
                        } catch (retryError) {
                            console.error('  ✗ Retry failed, moving to next keyword');
                            hasMorePages = false;
                        }
                    } else {
                        // خطای جزئی، ادامه بده
                        await this._delay(5000);
                    }
                }
            }

            console.log(`\n✓ Completed keyword "${keyword}"`);
            console.log(`   Total found so far: ${this.stats.total_found}`);
            console.log(`   Unique PhDs: ${seenExternalIds.size}`);
        }

        console.log(`\n${'='.repeat(80)}`);
        console.log(`✓ Phase 1 Complete: Crawled with ${searchKeywords.length} keywords`);
        console.log(`   Total pages crawled: ${this.stats.total_pages}`);
        console.log(`   Total PhDs found: ${this.stats.total_found}`);
        console.log(`   Unique PhDs: ${seenExternalIds.size}`);
        console.log('='.repeat(80));

        return seenExternalIds;
    }

    /**
     * علامت‌گذاری PhD هایی که دیگر در سایت نیستند
     */
    async _markDeletedPhDs() {
        console.log('\n🗑️  Phase 2: Marking deleted PhDs...\n');

        try {
            // PhD هایی که فعال هستند اما در این crawl ندیدیم
            const allActivePhDs = await this.phdRepo.getAllActive();
            console.log(`  → Checking ${allActivePhDs.length} active PhDs...`);

            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const toDelete = allActivePhDs.filter(phd => phd.last_seen_at < oneHourAgo);

            if (toDelete.length > 0) {
                console.log(`  → Marking ${toDelete.length} PhDs as deleted...`);
                const externalIds = toDelete.map(phd => phd.external_id);
                await this.phdRepo.markAsDeleted(externalIds);
                this.stats.total_deleted = toDelete.length;
                console.log(`  ✓ Marked ${toDelete.length} PhDs as deleted`);
            } else {
                console.log('  ✓ No PhDs to delete');
            }

        } catch (error) {
            console.error('  ✗ Error marking deleted PhDs:', error.message);
            this.stats.total_errors++;
        }
    }

    /**
     * استخراج external_id از URL
     * Example: https://www.findaphd.com/phds/project/.../?p180868 -> 180868
     */
    _extractExternalId(url) {
        if (!url) return null;

        try {
            // استخراج از query parameter ?p180868
            const match = url.match(/[?&]p(\d+)/);
            if (match) {
                return match[1];
            }

            // Fallback: استفاده از pathname
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            return pathname.replace(/^\/|\/$/g, '');
        } catch (error) {
            return url;
        }
    }

    /**
     * Parse deadline text به ISO date
     * Example: "7 January 2026" -> "2026-01-07"
     */
    _parseDeadlineDate(deadlineText) {
        if (!deadlineText) return null;

        const m = deadlineText.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
        if (!m) return null;

        const months = {
            january: '01',
            february: '02',
            march: '03',
            april: '04',
            may: '05',
            june: '06',
            july: '07',
            august: '08',
            september: '09',
            october: '10',
            november: '11',
            december: '12'
        };

        const day = String(parseInt(m[1], 10)).padStart(2, '0');
        const month = months[m[2].toLowerCase()];
        const year = m[3];

        return month ? `${year}-${month}-${day}` : null;
    }

    /**
     * استخراج کشور از location
     */
    _extractCountry(location) {
        if (!location) return null;

        // معمولاً آخرین بخش location کشور هست
        // مثال: "Oxford, United Kingdom" → "United Kingdom"
        const parts = location.split(',').map(s => s.trim());
        return parts[parts.length - 1] || null;
    }

    /**
     * تاخیر (برای rate limiting)
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reset آمار
     */
    resetStats() {
        this.stats = {
            total_pages: 0,
            total_found: 0,
            total_new: 0,
            total_updated: 0,
            total_deleted: 0,
            total_errors: 0
        };
    }

    /**
     * دریافت وضعیت فعلی
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentLogId: this.currentLogId,
            stats: this.stats
        };
    }
}

module.exports = BackgroundCrawler.getInstance();