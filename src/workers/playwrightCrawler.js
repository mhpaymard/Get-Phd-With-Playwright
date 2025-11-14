/**
 * 🚀 FindAPhD.com Crawler - Version 3.0 (Fixed)
 * Hybrid Method: HTML + DataLayerManager + JSON-LD
 * - همه searchResultImpression* رو می‌گیره (حتی اگه داده ناقص باشه)
 * - Match با JSON-LD و merge اطلاعات
 * - فیلدهای از script با suffix "Script"
 * Author: AI Assistant
 * Date: November 2025
 */

const playwright = require('playwright');

class FindAPhDCrawler {
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
     * Extract external_id from URL
     * Example: https://www.findaphd.com/phds/project/.../?p180868 -> 180868
     */
    _extractExternalId(url) {
        if (!url) return null;
        const match = url.match(/[?&]p(\d+)/);
        return match ? match[1] : null;
    }

    /**
     * Main crawl method
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

            const searchUrl = this._buildSearchUrl(keywords, filters, page);
            console.log(`📄 URL: ${searchUrl}`);

            await pageInstance.goto(searchUrl, {
                waitUntil: 'networkidle',
                timeout: 60000
            });

            await this._handleCookieConsent(pageInstance);
            await pageInstance.waitForTimeout(3001);

            // Scroll برای lazy loading
            await pageInstance.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            });
            await pageInstance.waitForTimeout(2000);

            const results = await this._extractHybrid(pageInstance);

            // اضافه کردن external_id به هر result
            results.forEach(phd => {
                phd.external_id = this._extractExternalId(phd.url);
            });

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
     * Hybrid Extraction: همه searchResultImpression* رو می‌گیره
     */
    async _extractHybrid(page) {
        return await page.evaluate(() => {
            const results = [];

            // 1. پیدا کردن همه searchResultImpression* (حتی اگه داده ناقص باشه)
            const allContainers = document.querySelectorAll('[id^="searchResultImpression"]');
            console.log(`Found ${allContainers.length} searchResultImpression containers`);

            // 2. Extract JSON-LD اول (برای match بعدی)
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            const jsonLdItems = [];

            scripts.forEach((script, scriptIdx) => {
                try {
                    const data = JSON.parse(script.textContent);
                    if (Array.isArray(data)) {
                        data.forEach(item => {
                            if (item['@type'] === 'Course') {
                                jsonLdItems.push({
                                    scriptIndex: scriptIdx + 1,
                                    title: item.name,
                                    description: item.description,
                                    university: item.provider ? .name,
                                    raw: item
                                });
                            }
                        });
                    } else if (data['@type'] === 'Course') {
                        jsonLdItems.push({
                            scriptIndex: scriptIdx + 1,
                            title: data.name,
                            description: data.description,
                            university: data.provider ? .name,
                            raw: data
                        });
                    }
                } catch (e) {
                    console.warn(`Error parsing JSON-LD script ${scriptIdx + 1}:`, e.message);
                }
            });

            console.log(`Found ${jsonLdItems.length} Course items in JSON-LD`);

            // 3. Extract از هر container (حتی اگه ناقص باشه)
            allContainers.forEach((container, index) => {
                const phd = {
                    index: index + 1,
                    containerId: container.id,
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
                    description: null,
                    // فیلدهای از script (با suffix Script)
                    titleScript: null,
                    descriptionScript: null,
                    universityScript: null,
                    jsonLdMatched: false
                };

                // Title - چند selector مختلف
                const titleSelectors = [
                    'span.h4',
                    '.h4',
                    'h3 .h4',
                    'h3 span.h4',
                    'a[href*="/phds/project/"] .h4',
                    'a[href*="/phds/project/"] span.h4'
                ];

                for (const selector of titleSelectors) {
                    const el = container.querySelector(selector);
                    if (el) {
                        phd.title = el.textContent.trim();
                        break;
                    }
                }

                // URL
                const urlSelectors = [
                    'a[href*="/phds/project/"]',
                    'a.card',
                    'a[href*="?p"]'
                ];

                for (const selector of urlSelectors) {
                    const el = container.querySelector(selector);
                    if (el && el.href) {
                        phd.url = el.href;
                        break;
                    }
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

                // Deadline
                const calendarIcon = container.querySelector('.fa-calendar');
                if (calendarIcon) {
                    const parent = calendarIcon.closest('.badge, .subButton, span');
                    if (parent) {
                        let text = parent.textContent.trim();
                        text = text.replace(/^\s*<i[^>]*>.*?<\/i>\s*/i, '');
                        phd.deadlineText = text;
                    }
                }

                // Supervisor
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

                // DataLayerManager از script
                const scriptTag = container.querySelector('script');
                if (scriptTag) {
                    const scriptText = scriptTag.textContent;

                    const extractVar = (varName) => {
                        const regex = new RegExp(`DataLayerManager\\.${varName}\\s*=\\s*"([^"]+)"`, 'i');
                        const match = scriptText.match(regex);
                        return match ? match[1] : null;
                    };

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

                // 4. Match با JSON-LD و merge
                if (phd.title || phd.url) {
                    // Normalize title برای matching
                    const normalizeTitle = (t) => {
                        if (!t) return '';
                        return t.toLowerCase()
                            .replace(/[^\w\s]/g, '')
                            .replace(/\s+/g, ' ')
                            .trim()
                            .substring(0, 50);
                    };

                    const htmlTitleNorm = normalizeTitle(phd.title);
                    let bestMatch = null;
                    let bestScore = 0;

                    jsonLdItems.forEach(jsonItem => {
                        const jsonTitleNorm = normalizeTitle(jsonItem.title);

                        // Similarity check
                        if (jsonTitleNorm.includes(htmlTitleNorm) || htmlTitleNorm.includes(jsonTitleNorm)) {
                            const score = Math.min(jsonTitleNorm.length, htmlTitleNorm.length);
                            if (score > bestScore && score > 10) {
                                bestScore = score;
                                bestMatch = jsonItem;
                            }
                        }
                    });

                    // Merge اطلاعات از JSON-LD (با suffix Script)
                    if (bestMatch) {
                        phd.jsonLdMatched = true;

                        // Description کامل از script
                        if (bestMatch.description && bestMatch.description.length > (phd.description || '').length) {
                            phd.descriptionScript = bestMatch.description;
                        }

                        // Title از script (اگه در HTML نبود)
                        if (!phd.title && bestMatch.title) {
                            phd.titleScript = bestMatch.title;
                        }

                        // University از script (اگه در HTML نبود)
                        if (!phd.university && bestMatch.university) {
                            phd.universityScript = bestMatch.university;
                        }
                    }
                }

                // اضافه کردن به results (حتی اگه ناقص باشه)
                results.push(phd);
            });

            console.log(`Extracted ${results.length} PhDs (including incomplete ones)`);
            return results;
        });
    }

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

    async _getPaginationInfo(page) {
        return await page.evaluate(() => {
            const paginationInfo = {
                totalPages: 1,
                totalResults: 0,
                hasNext: false,
                hasPrev: false
            };

            const totalText = document.querySelector('.showing-count, .results-count');
            if (totalText) {
                const match = totalText.textContent.match(/(\d+)/);
                if (match) {
                    paginationInfo.totalResults = parseInt(match[1]);
                }
            }

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

module.exports = FindAPhDCrawler;