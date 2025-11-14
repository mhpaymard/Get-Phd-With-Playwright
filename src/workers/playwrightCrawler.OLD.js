// Advanced Crawler Worker با Playwright - استخراج کامل اطلاعات
const { prepare } = require('../../services/searchOrchestrator');

class PlaywrightCrawler {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelay = 2000;
    }

    /**
     * استخراج دقیق‌تر نتایج با Playwright
     */
    async crawlSearchPage(page, url) {
        try {
            console.log(`[Crawler] Navigating to: ${url}`);

            // تنظیم User Agent برای جلوگیری از Bot Detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            await page.goto(url, {
                waitUntil: 'networkidle', // تغییر به networkidle برای بارگذاری کامل
                timeout: 60000
            });

            console.log(`[Crawler] Page loaded, waiting for content...`);

            // انتظار بیشتر برای بارگذاری JavaScript
            await page.waitForTimeout(5000);

            // Scroll برای فعال کردن lazy loading (اگر وجود داشته باشد)
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            });
            await page.waitForTimeout(1000);

            // تلاش برای یافتن نتایج با selector های مختلف
            const selectorsTried = [];
            const possibleSelectors = [
                'article',
                '.phd-result',
                '.result-card',
                '.search-result',
                '[class*="result" i]',
                'a[href*="/phds/project/"]',
                '.course-list-item',
                'div[data-result]',
                'li[class*="listing"]'
            ];

            let resultsFound = false;
            for (const selector of possibleSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 2000 });
                    selectorsTried.push({ selector, found: true });
                    resultsFound = true;
                    console.log(`[Crawler] ✓ Found results with selector: ${selector}`);
                    break;
                } catch {
                    selectorsTried.push({ selector, found: false });
                }
            }

            if (!resultsFound) {
                console.warn('[Crawler] ⚠️  No results found with any selector, trying fallback...');
            }

            // استخراج metadata صفحه
            const metadata = await this._extractMetadata(page);

            // استخراج نتایج با روش پیشرفته
            const results = await this._extractDetailedResults(page);

            // استخراج pagination
            const pagination = await this._extractPagination(page);

            console.log(`[Crawler] ✅ Extracted ${results.length} results`);

            return {
                success: true,
                url,
                metadata,
                results,
                pagination,
                debug: {
                    selectorsTried,
                    resultsCount: results.length
                },
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('[Crawler] Error:', error);

            // اسکرین شات برای debug
            try {
                const screenshotPath = `debug-error-${Date.now()}.png`;
                await page.screenshot({ path: screenshotPath });
                console.log(`[Crawler] Debug screenshot saved: ${screenshotPath}`);
            } catch (e) {
                // ignore screenshot error
            }

            return {
                success: false,
                url,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * استخراج metadata صفحه
     */
    async _extractMetadata(page) {
        return await page.evaluate(() => {
            return {
                title: document.title,
                totalResults: (() => {
                    const resultCount = document.querySelector('.result-count, [class*="result-count"]');
                    if (resultCount) {
                        const match = resultCount.textContent.match(/(\d+)/);
                        return match ? parseInt(match[1]) : null;
                    }
                    return null;
                })()
            };
        });
    }

    /**
     * استخراج جزئیات کامل نتایج
     */
    async _extractDetailedResults(page) {
        return await page.evaluate(() => {
            const results = [];

            console.log('[Browser] Starting result extraction...');

            // سلکتورهای مختلف برای یافتن نتایج - ترتیب از خاص به کلی
            const selectors = [
                // Specific selectors
                '.phd-result',
                '.result-card',
                '.ResultCard',
                '.search-result',
                '[data-result]',
                '[data-testid="phd-result"]',
                'article[class*="result" i]',
                'div[class*="result" i]',
                '.course-list-item',
                'div[class*="ProjectCard"]',
                'li[class*="listing"]',
                // Generic selectors
                'article',
                'main article',
                'main > div > article',
                'main > div > div'
            ];

            let resultElements = [];
            let usedSelector = null;

            for (const selector of selectors) {
                try {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        // چک کنید که واقعاً نتایج پروژه هستند
                        let hasProjectLinks = 0;
                        for (let i = 0; i < Math.min(5, elements.length); i++) {
                            if (elements[i].querySelector('a[href*="/phds/project/"]')) {
                                hasProjectLinks++;
                            }
                        }

                        if (hasProjectLinks > 0 || selector === 'article') {
                            resultElements = elements;
                            usedSelector = selector;
                            console.log(`[Browser] ✓ Found ${elements.length} results with selector: ${selector}`);
                            break;
                        }
                    }
                } catch (e) {
                    console.log(`[Browser] Failed with selector: ${selector}`);
                }
            }

            // اگر هیچ container پیدا نشد، مستقیم لینک‌ها را بردار
            if (resultElements.length === 0) {
                console.log('[Browser] ⚠️  No result containers found, trying direct links...');
                const links = document.querySelectorAll('a[href*="/phds/project/"]');

                // برای هر لینک، parent element را پیدا کن
                const uniqueParents = new Set();
                links.forEach(link => {
                    let parent = link.closest('article, div, li, section');
                    if (!parent) parent = link.parentElement;

                    // فقط parent های یکتا
                    if (parent && !uniqueParents.has(parent)) {
                        uniqueParents.add(parent);
                        resultElements = Array.from(uniqueParents);
                    }
                });

                usedSelector = 'parent-of-project-links';
                console.log(`[Browser] Found ${resultElements.length} unique parent elements`);
            }

            console.log(`[Browser] Processing ${resultElements.length} elements...`);

            resultElements.forEach((element, index) => {
                try {
                    // عنوان و لینک - با selector های بیشتر
                    const titleSelectors = [
                        'h3 a[href*="/phds/project/"]',
                        'h2 a[href*="/phds/project/"]',
                        'a[href*="/phds/project/"]',
                        'a[class*="title"]',
                        'a.title',
                        'h3 a',
                        'h2 a',
                        '.title a'
                    ];

                    let titleLink = null;
                    for (const sel of titleSelectors) {
                        titleLink = element.querySelector(sel);
                        if (titleLink) break;
                    }

                    const title = titleLink ? titleLink.textContent.trim() : null;
                    const projectUrl = titleLink ? titleLink.href : '';

                    // اگر عنوان خالی بود، از innerHTML محدود استفاده کن
                    const fallbackTitle = title || element.textContent.trim().substring(0, 100);

                    // موسسه / دانشگاه
                    const institution = (() => {
                        const selectors = [
                            '.institution',
                            '[class*="institution" i]',
                            '.university',
                            '[class*="university" i]',
                            '[class*="institution"]',
                            '[data-label="Institution"]',
                            '.inst',
                            'span[class*="uni"]'
                        ];
                        for (const sel of selectors) {
                            const el = element.querySelector(sel);
                            if (el && el.textContent.trim().length > 2 && el.textContent.trim().length < 200) {
                                return el.textContent.trim();
                            }
                        }
                        return '';
                    })();

                    // مکان
                    const location = (() => {
                        const selectors = [
                            '.location',
                            '[class*="location" i]',
                            '[data-label="Location"]',
                            '.place',
                            '.country',
                            'span[class*="loc"]',
                            '[class*="geo"]'
                        ];
                        for (const sel of selectors) {
                            const el = element.querySelector(sel);
                            if (el && el.textContent.trim().length > 2 && el.textContent.trim().length < 100) {
                                return el.textContent.trim();
                            }
                        }
                        return '';
                    })();

                    // رشته / Subject
                    const discipline = (() => {
                        const selectors = [
                            '.discipline',
                            '[class*="subject" i]',
                            '[data-label="Subject"]',
                            '.subject',
                            '[class*="disc"]',
                            '.field'
                        ];
                        for (const sel of selectors) {
                            const el = element.querySelector(sel);
                            if (el && el.textContent.trim().length > 2 && el.textContent.trim().length < 200) {
                                return el.textContent.trim();
                            }
                        }
                        return '';
                    })();

                    // تامین مالی
                    const funding = (() => {
                        const selectors = [
                            '.funding',
                            '[class*="funding" i]',
                            '[data-label="Funding"]',
                            '[class*="fee"]',
                            '.financial',
                            'span[class*="fund"]'
                        ];
                        for (const sel of selectors) {
                            const el = element.querySelector(sel);
                            if (el && el.textContent.trim().length > 2 && el.textContent.trim().length < 200) {
                                return el.textContent.trim();
                            }
                        }
                        return '';
                    })();

                    // تاریخ انتشار
                    const publishedDate = (() => {
                        const selectors = [
                            'time',
                            '.date',
                            '[class*="date" i]',
                            '[datetime]',
                            '.published',
                            'span[class*="date"]'
                        ];
                        for (const sel of selectors) {
                            const el = element.querySelector(sel);
                            if (el) {
                                const datetime = el.getAttribute('datetime');
                                const text = el.textContent.trim();
                                return datetime || text;
                            }
                        }
                        return '';
                    })();

                    // توضیحات
                    const description = (() => {
                        const selectors = [
                            '.description',
                            '.summary',
                            '[class*="desc" i]',
                            '.excerpt',
                            'p.text',
                            'p'
                        ];
                        for (const sel of selectors) {
                            const el = element.querySelector(sel);
                            if (el && el.textContent.trim().length > 30) {
                                return el.textContent.trim().substring(0, 300);
                            }
                        }
                        return '';
                    })();

                    // نوع دوره
                    const studyType = (() => {
                        const selectors = [
                            '.study-type',
                            '[class*="type" i]',
                            '.degree',
                            '[class*="level"]'
                        ];
                        for (const sel of selectors) {
                            const el = element.querySelector(sel);
                            if (el && el.textContent.trim().length > 2) {
                                return el.textContent.trim();
                            }
                        }
                        return '';
                    })();

                    // فقط اگر title یا URL وجود داشت اضافه کن
                    if (fallbackTitle || projectUrl) {
                        results.push({
                            title: fallbackTitle || 'No title',
                            url: projectUrl,
                            institution: institution || '',
                            location: location || '',
                            discipline: discipline || '',
                            funding: funding || '',
                            publishedDate: publishedDate || '',
                            description: description || '',
                            studyType: studyType || '',
                            index: index + 1
                        });
                    }

                } catch (error) {
                    console.error('[Browser] Error extracting result:', error);
                }
            });

            console.log(`[Browser] Successfully extracted ${results.length} results`);

            return results;
        });
    }

    /**
     * استخراج اطلاعات pagination
     */
    async _extractPagination(page) {
        return await page.evaluate(() => {
            const pagination = {
                currentPage: 1,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
                pages: []
            };

            // یافتن pagination elements
            const paginationContainer = document.querySelector('.pagination, [class*="pagination"]');

            if (!paginationContainer) {
                return pagination;
            }

            // صفحه فعلی
            const currentPageEl = paginationContainer.querySelector('.active, [class*="active"]');
            if (currentPageEl) {
                const pageNum = parseInt(currentPageEl.textContent.trim());
                if (!isNaN(pageNum)) pagination.currentPage = pageNum;
            }

            // تمام لینک‌های صفحات
            const pageLinks = paginationContainer.querySelectorAll('a');
            const pageNumbers = [];

            pageLinks.forEach(link => {
                const text = link.textContent.trim();
                const pageNum = parseInt(text);

                if (!isNaN(pageNum)) {
                    pageNumbers.push(pageNum);
                    pagination.pages.push({
                        page: pageNum,
                        url: link.href
                    });
                }

                // بررسی دکمه‌های Next/Previous
                if (text.toLowerCase().includes('next') || text.includes('›') || text.includes('»')) {
                    pagination.hasNext = true;
                }
                if (text.toLowerCase().includes('prev') || text.includes('‹') || text.includes('«')) {
                    pagination.hasPrev = true;
                }
            });

            // محاسبه تعداد کل صفحات
            if (pageNumbers.length > 0) {
                pagination.totalPages = Math.max(...pageNumbers);
            }

            return pagination;
        });
    }

    /**
     * استخراج جزئیات یک پروژه
     */
    async crawlProjectDetail(page, url) {
        try {
            console.log(`[Crawler] Crawling project: ${url}`);

            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30010
            });

            const details = await page.evaluate(() => {
                const data = {
                    title: '',
                    institution: '',
                    department: '',
                    location: '',
                    description: '',
                    funding: '',
                    eligibility: '',
                    deadline: '',
                    startDate: '',
                    duration: '',
                    studyMode: '',
                    qualifications: '',
                    applicationProcess: '',
                    contactEmail: '',
                    contactName: '',
                    reference: ''
                };

                // عنوان
                const titleEl = document.querySelector('h1');
                if (titleEl) data.title = titleEl.textContent.trim();

                // سایر فیلدها
                const extractField = (labels) => {
                    for (const label of labels) {
                        const el = document.querySelector(`[data-label="${label}"], .${label.toLowerCase()}`);
                        if (el) return el.textContent.trim();
                    }
                    return '';
                };

                data.institution = extractField(['Institution', 'University']);
                data.department = extractField(['Department', 'Faculty']);
                data.location = extractField(['Location', 'Country']);
                data.funding = extractField(['Funding', 'Fees']);
                data.deadline = extractField(['Application Deadline', 'Deadline']);
                data.startDate = extractField(['Start Date']);
                data.duration = extractField(['Duration']);
                data.studyMode = extractField(['Study Mode', 'Type']);

                // توضیحات
                const descEl = document.querySelector('.description, [class*="description"]');
                if (descEl) data.description = descEl.textContent.trim();

                return data;
            });

            return {
                success: true,
                url,
                details,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('[Crawler] Error crawling project:', error);
            return {
                success: false,
                url,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
}

module.exports = new PlaywrightCrawler();