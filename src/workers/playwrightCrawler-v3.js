/**
 * FindAPhD Crawler v3.0 - Hybrid Method
 * ترکیب JSON-LD + HTML Elements + DataLayerManager
 * برای حداکثر coverage
 */

const playwright = require('playwright');

class FindAPhDCrawlerV3 {
    constructor() {
        this.baseUrl = 'https://www.findaphd.com';
        this.browser = null;
    }

    async _ensureBrowser() {
        if (!this.browser) {
            console.log('  → Launching Chromium browser...');
            this.browser = await playwright.chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return this.browser;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Main crawl method - Hybrid extraction
     */
    async crawlSearchPage(keywords, filters = {}, page = 1) {
        const browser = await this._ensureBrowser();

        let context = null;
        let pageInstance = null;

        try {
            console.log(`🔍 Crawling FindAPhD: keywords="${keywords}", page=${page}`);

            context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                viewport: { width: 1920, height: 1080 },
                ignoreHTTPSErrors: true,
            });

            pageInstance = await context.newPage();

            // Build search URL
            const searchUrl = this._buildSearchUrl(keywords, filters, page);
            console.log(`📄 URL: ${searchUrl}`);

            // Navigate
            await pageInstance.goto(searchUrl, {
                waitUntil: 'networkidle',
                timeout: 60000
            });

            // Handle cookie consent
            await this._handleCookieConsent(pageInstance);

            // Wait for content
            await pageInstance.waitForTimeout(3001);

            // Scroll to trigger lazy loading
            await pageInstance.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            });
            await pageInstance.waitForTimeout(2000);

            // Extract با روش Hybrid
            const results = await this._extractHybrid(pageInstance);

            // Get pagination info
            const paginationInfo = await this._getPaginationInfo(pageInstance);

            console.log(`✅ Extracted ${results.length} results`);

            return {
                results,
                currentPage: page,
                totalPages: paginationInfo.totalPages,
                totalResults: paginationInfo.totalResults,
                pagination: {
                    currentPage: page,
                    totalPages: paginationInfo.totalPages,
                    totalResults: paginationInfo.totalResults,
                    hasNextPage: page < paginationInfo.totalPages
                }
            };

        } catch (error) {
            console.error('❌ Crawl error:', error.message);
            throw error;
        } finally {
            try {
                if (pageInstance) await pageInstance.close();
                if (context) await context.close();
            } catch (e) {
                console.warn('Warning closing context:', e.message);
            }
        }
    }

    /**
     * Hybrid Extraction: HTML + DataLayerManager + JSON-LD
     */
    async _extractHybrid(page) {
        return await page.evaluate(() => {
            const results = [];

            // 1. Extract از HTML elements
            // استفاده از selector بهتر: ID based یا class های multiple
            const selectors = [
                '[id^="searchResultImpression"]', // اولویت اول
                '.phd-result', // fallback
                '.resultsRow.phd-result-row' // fallback
            ];

            let containers = [];
            for (const selector of selectors) {
                containers = document.querySelectorAll(selector);
                if (containers.length > 0) {
                    console.log(`Using selector: ${selector}, found ${containers.length} items`);
                    break;
                }
            }

            containers.forEach((container, index) => {
                const phd = {
                    index: index + 1,
                    title: null,
                    url: null,
                    university: null,
                    department: null,
                    location: null,
                    country: null,
                    disciplines: [],
                    subjects: [],
                    supervisor: null,
                    deadline: null,
                    deadlineText: null,
                    programType: null,
                    funding: null,
                    description: null
                };

                // Title & URL
                const titleLink = container.querySelector('a[href*="/phds/project/"]');
                if (titleLink) {
                    phd.url = titleLink.href;
                }

                const titleSpan = container.querySelector('.h4, h3 .h4');
                if (titleSpan) {
                    phd.title = titleSpan.textContent.trim();
                }

                // University
                const instTitle = container.querySelector('.phd-result__dept-inst--inst .phd-result__dept-inst--title');
                if (instTitle) {
                    phd.university = instTitle.textContent.trim();
                }

                // Department
                const deptLink = container.querySelector('.phd-result__dept-inst--dept');
                if (deptLink) {
                    phd.department = deptLink.textContent.trim();
                }

                // Deadline - از icon calendar
                const calendarIcon = container.querySelector('.fa-calendar');
                if (calendarIcon) {
                    const parent = calendarIcon.closest('.badge, .subButton, span');
                    if (parent) {
                        let text = parent.textContent.trim();
                        // حذف icon text
                        text = text.replace(/^\s*<i[^>]*>.*?<\/i>\s*/i, '');
                        phd.deadlineText = text;
                    }
                }

                // Supervisor - از badge با icon person-chalkboard
                const supervisorDiv = container.querySelector('.phd-result__key-info.super');
                if (supervisorDiv) {
                    const iconText = supervisorDiv.querySelector('.icon-text');
                    if (iconText) {
                        let text = iconText.textContent.trim();
                        text = text.replace(/^\s*Supervisors?:\s*/i, '');
                        phd.supervisor = text;
                    }
                }

                // Program Type
                const graduationIcon = container.querySelector('.fa-graduation-cap');
                if (graduationIcon) {
                    const parent = graduationIcon.closest('.badge, span');
                    if (parent) {
                        let text = parent.textContent.trim();
                        phd.programType = text;
                    }
                }

                // Funding
                const walletIcon = container.querySelector('.fa-wallet');
                if (walletIcon) {
                    const parent = walletIcon.closest('.badge, span');
                    if (parent) {
                        let text = parent.textContent.trim();
                        phd.funding = text;
                    }
                }

                // Description (short)
                const descDiv = container.querySelector('.phd-result__description .descFrag');
                if (descDiv) {
                    let text = descDiv.textContent.trim();
                    text = text.replace(/Read more.*$/i, '').trim();
                    phd.description = text;
                }

                // DataLayerManager variables از script
                const scriptTag = container.querySelector('script');
                if (scriptTag) {
                    const scriptText = scriptTag.textContent;

                    const extractVar = (varName) => {
                        const regex = new RegExp(`DataLayerManager\\.${varName}\\s*=\\s*"([^"]+)"`, 'i');
                        const match = scriptText.match(regex);
                        return match ? match[1] : null;
                    };

                    // Extract variables
                    if (!phd.university) phd.university = extractVar('dynamicInstitutionName');
                    if (!phd.department) phd.department = extractVar('dynamicDepartmentName');
                    phd.country = extractVar('dynamicLocationCountryName');
                    phd.location = extractVar('dynamicLocationCityName');

                    const disciplineNames = extractVar('dynamicDisciplineNames');
                    if (disciplineNames) {
                        phd.disciplines = disciplineNames.split(',').map(s => s.trim()).filter(Boolean);
                    }

                    const subjectNames = extractVar('dynamicSubjectNames');
                    if (subjectNames) {
                        phd.subjects = subjectNames.split(',').map(s => s.trim()).filter(Boolean);
                    }

                    if (!phd.programType) phd.programType = extractVar('dynamicProgrammeTypes');

                    const fundingTypes = extractVar('dynamicFundingTypes');
                    if (fundingTypes && !phd.funding) {
                        phd.funding = fundingTypes;
                    }
                }

                // فقط اضافه کن اگه title و url داریم
                if (phd.title && phd.url) {
                    results.push(phd);
                }
            });

            // 2. Extract JSON-LD برای اطلاعات تکمیلی
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            const jsonLdItems = [];

            scripts.forEach(script => {
                try {
                    const data = JSON.parse(script.textContent);
                    if (Array.isArray(data)) {
                        data.forEach(item => {
                            if (item['@type'] === 'Course') {
                                jsonLdItems.push(item);
                            }
                        });
                    }
                } catch (e) {}
            });

            console.log(`Found ${jsonLdItems.length} Course items in JSON-LD`);

            // 3. Merge: Match کردن HTML results با JSON-LD items
            results.forEach(htmlPhd => {
                // سعی می‌کنیم match کنیم بر اساس title
                // گاهی title ها دقیقاً یکی نیستند پس از fuzzy matching استفاده می‌کنیم

                const normalizeTitle = (t) => {
                    if (!t) return '';
                    return t.toLowerCase()
                        .replace(/[^\w\s]/g, '')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .substring(0, 50); // اولین 50 کاراکتر
                };

                const htmlTitleNorm = normalizeTitle(htmlPhd.title);

                // جستجو برای بهترین match
                let bestMatch = null;
                let bestScore = 0;

                jsonLdItems.forEach(jsonItem => {
                    const jsonTitleNorm = normalizeTitle(jsonItem.name);

                    // محاسبه similarity score (ساده)
                    if (jsonTitleNorm.includes(htmlTitleNorm) || htmlTitleNorm.includes(jsonTitleNorm)) {
                        const score = Math.min(jsonTitleNorm.length, htmlTitleNorm.length);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMatch = jsonItem;
                        }
                    }
                });

                // اگر match پیدا شد، merge کن
                if (bestMatch && bestScore > 10) {
                    // Description کامل از JSON-LD
                    if (bestMatch.description && bestMatch.description.length > (htmlPhd.description || '').length) {
                        htmlPhd.descriptionFull = bestMatch.description;
                    }

                    // اگر چیزی در HTML نبود، از JSON-LD بگیر
                    if (!htmlPhd.university && bestMatch.provider ? .name) {
                        htmlPhd.university = bestMatch.provider.name;
                    }

                    // Merge اطلاعات اضافی
                    htmlPhd.jsonLdMatched = true;
                } else {
                    htmlPhd.jsonLdMatched = false;
                }
            });

            return results;
        });
    }

    /**
     * Handle cookie consent
     */
    async _handleCookieConsent(page) {
        try {
            const acceptButton = page.locator('button:has-text("Accept all")').first();
            if (await acceptButton.isVisible({ timeout: 3001 })) {
                await acceptButton.click();
                console.log('✅ Cookie consent accepted');
                await page.waitForTimeout(1000);
            }
        } catch (e) {}
    }

    /**
     * Get pagination info
     */
    async _getPaginationInfo(page) {
        return await page.evaluate(() => {
            const paginationInfo = {
                totalPages: 1,
                totalResults: 0,
                hasNext: false,
                hasPrev: false
            };

            // تعداد کل نتایج
            const totalText = document.querySelector('.showing-count, .results-count');
            if (totalText) {
                const match = totalText.textContent.match(/(\d+)/);
                if (match) {
                    paginationInfo.totalResults = parseInt(match[1]);
                }
            }

            // تعداد صفحات
            const paginationLinks = document.querySelectorAll('.pagination a, .pager a');
            let maxPage = 1;
            paginationLinks.forEach(link => {
                const pageMatch = link.href.match(/[?&]PG=(\d+)/);
                if (pageMatch) {
                    maxPage = Math.max(maxPage, parseInt(pageMatch[1]));
                }
            });
            paginationInfo.totalPages = maxPage;

            return paginationInfo;
        });
    }

    /**
     * Build search URL
     */
    _buildSearchUrl(keywords, filters, page) {
        const params = new URLSearchParams();

        if (keywords) {
            params.append('Keywords', keywords);
        }

        if (filters.discipline) {
            params.append('discipline', filters.discipline);
        }

        if (page > 1) {
            params.append('PG', page);
        }

        return `${this.baseUrl}/phds/?${params.toString()}`;
    }
}

module.exports = FindAPhDCrawlerV3;