/**
 * 🚀 FindAPhD.com Crawler - Version 2.0
 * Completely rewritten from scratch based on actual site structure
 * Author: AI Assistant
 * Date: October 2025
 */

const playwright = require('playwright');

class FindAPhDCrawler {
  constructor(browserPool) {
    this.browserPool = browserPool;
    this.baseUrl = 'https://www.findaphd.com';
  }

  /**
   * Main crawl method - searches FindAPhD and extracts results
   */
  async crawlSearchPage(keywords, filters = {}, page = 1) {
    const browser = await this.browserPool.acquire();
    
    try {
      console.log(`🔍 Crawling FindAPhD: keywords="${keywords}", page=${page}`);
      
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
      });

      const pageInstance = await context.newPage();
      
      // Build search URL
      const searchUrl = this._buildSearchUrl(keywords, filters, page);
      console.log(`📄 URL: ${searchUrl}`);
      
      // Navigate to search page
      await pageInstance.goto(searchUrl, {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // Handle cookie consent
      await this._handleCookieConsent(pageInstance);
      
      // Wait for content to load
      await pageInstance.waitForTimeout(3000);
      
      // Scroll to trigger lazy loading
      await pageInstance.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await pageInstance.waitForTimeout(2000);

      // Extract results
      const results = await this._extractResults(pageInstance);
      
      // Get pagination info
      const paginationInfo = await this._getPaginationInfo(pageInstance);
      
      console.log(`✅ Extracted ${results.length} results`);
      
      await context.close();
      
      return {
        results,
        currentPage: page,
        totalPages: paginationInfo.totalPages,
        totalResults: paginationInfo.totalResults,
      };
      
    } catch (error) {
      console.error('❌ Crawl error:', error.message);
      throw error;
    } finally {
      await this.browserPool.release(browser);
    }
  }

  /**
   * Build search URL with keywords and filters
   */
  _buildSearchUrl(keywords, filters, page) {
    const params = new URLSearchParams();
    
    // Keywords
    if (keywords) {
      params.append('Keywords', keywords);
    }
    
    // Filters
    if (filters.discipline) {
      params.append('discipline', filters.discipline);
    }
    if (filters.country) {
      params.append('country', filters.country);
    }
    if (filters.location) {
      params.append('location', filters.location);
    }
    if (filters.institution) {
      params.append('institution', filters.institution);
    }
    if (filters.fundingType) {
      // FindAPhD funding filters:
      // 0100 = UK students
      // 01M0 = Self-funded
      // 01w0 = Non-EU students
      // 01g0 = EU students
      params.append('funding', filters.fundingType);
    }
    if (filters.studyType) {
      params.append('studyType', filters.studyType);
    }
    
    // Pagination
    if (page > 1) {
      params.append('PG', page);
    }
    
    return `${this.baseUrl}/phds/?${params.toString()}`;
  }

  /**
   * Handle cookie consent popup
   */
  async _handleCookieConsent(page) {
    try {
      const acceptButton = page.locator('button:has-text("Accept all")').first();
      if (await acceptButton.isVisible({ timeout: 3000 })) {
        await acceptButton.click();
        console.log('✅ Cookie consent accepted');
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // No cookie consent or already accepted
    }
  }

  /**
   * Extract PhD results from the page
   */
  async _extractResults(page) {
    return await page.evaluate(() => {
      const results = [];
      
      // FindAPhD uses this class structure for result rows
      const resultContainers = document.querySelectorAll('.phd-result');
      
      console.log(`Found ${resultContainers.length} result containers`);
      
      resultContainers.forEach((container, index) => {
        try {
          const result = {
            title: 'No title',
            url: '',
            institution: '',
            location: '',
            discipline: '',
            funding: '',
            studyType: '',
            publishedDate: '',
            deadline: '',
            description: '',
            supervisor: '',
            index: index + 1
          };
          
          // ─────────────────────────────────────────────────────────
          // TITLE & URL
          // ─────────────────────────────────────────────────────────
          const titleLink = container.querySelector('a[href*="/phds/project/"]');
          if (titleLink) {
            result.url = titleLink.href;
            
            // Title is inside the link, but clean it up
            let titleText = titleLink.textContent || '';
            
            // Remove "More details" prefix
            titleText = titleText.replace(/^\s*More details\s*/i, '');
            
            // Get the main title (usually after a lot of whitespace)
            const lines = titleText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            // Find the longest meaningful line as title
            let bestTitle = lines.find(line => line.length > 20 && line.length < 200) || lines[0] || 'No title';
            result.title = bestTitle.trim();
          }
          
          // ─────────────────────────────────────────────────────────
          // INSTITUTION & DEPARTMENT
          // ─────────────────────────────────────────────────────────
          // FindAPhD structure typically has:
          // <h4>University Name</h4>
          // Followed by department or faculty text
          
          const h4Elements = container.querySelectorAll('h4');
          let institution = '';
          let department = '';
          
          if (h4Elements.length > 0) {
            // First h4 is usually the university
            institution = h4Elements[0].textContent.trim();
            
            // Second h4 or following text might be department
            if (h4Elements.length > 1) {
              department = h4Elements[1].textContent.trim();
            } else {
              // Look for department in following siblings
              let sibling = h4Elements[0].nextElementSibling;
              while (sibling && !department) {
                const text = sibling.textContent.trim();
                if (text.length > 5 && text.length < 200 && 
                    (text.includes('Department') || text.includes('Faculty') || text.includes('School'))) {
                  department = text;
                  break;
                }
                sibling = sibling.nextElementSibling;
              }
            }
          }
          
          // Fallback: try other selectors
          if (!institution) {
            const fallbackSelectors = [
              'strong',
              '.inst',
              '[class*="institution"]'
            ];
            
            for (const selector of fallbackSelectors) {
              const el = container.querySelector(selector);
              if (el) {
                const text = el.textContent.trim();
                if (text.length > 3 && text.length < 200 && 
                    !text.includes('More details') && !text.includes('Read more')) {
                  institution = text;
                  break;
                }
              }
            }
          }
          
          // Combine institution and department
          if (institution && department) {
            result.institution = `${institution} - ${department}`;
          } else if (institution) {
            result.institution = institution;
          } else if (department) {
            result.institution = department;
          }
          
          // ─────────────────────────────────────────────────────────
          // DESCRIPTION
          // ─────────────────────────────────────────────────────────
          const descSelectors = [
            '.desc',
            '.description',
            'p',
            '[class*="desc"]',
            '.details'
          ];
          
          for (const selector of descSelectors) {
            const descEl = container.querySelector(selector);
            if (descEl) {
              const text = descEl.textContent.trim();
              if (text.length > 30 && text.length < 1000 && text.includes(' ')) {
                result.description = text.replace(/\s+/g, ' ').substring(0, 500);
                break;
              }
            }
          }
          
          // ─────────────────────────────────────────────────────────
          // SUPERVISOR
          // ─────────────────────────────────────────────────────────
          const supervisorMatch = container.textContent.match(/Supervisors?:\s*([^\n]+)/i);
          if (supervisorMatch) {
            result.supervisor = supervisorMatch[1].trim();
          }
          
          // ─────────────────────────────────────────────────────────
          // DEADLINE/DATE
          // ─────────────────────────────────────────────────────────
          const datePatterns = [
            /(\d{1,2}\s+\w+\s+\d{4})/i,  // "20 October 2025"
            /(\w+\s+\d{4})/i,             // "October 2025"
            /Year round applications/i
          ];
          
          const containerText = container.textContent;
          for (const pattern of datePatterns) {
            const match = containerText.match(pattern);
            if (match) {
              result.deadline = match[0].trim();
              break;
            }
          }
          
          // ─────────────────────────────────────────────────────────
          // FUNDING TYPE
          // ─────────────────────────────────────────────────────────
          const fundingPatterns = [
            'Self-Funded',
            'Funded',
            'Scholarship',
            'Studentship',
            'Competition Funded',
            'Fully Funded'
          ];
          
          for (const pattern of fundingPatterns) {
            if (containerText.includes(pattern)) {
              result.funding = pattern;
              break;
            }
          }
          
          // ─────────────────────────────────────────────────────────
          // STUDY TYPE
          // ─────────────────────────────────────────────────────────
          if (containerText.includes('PhD Research Project')) {
            result.studyType = 'PhD Research Project';
          } else if (containerText.includes('PhD Programme')) {
            result.studyType = 'PhD Programme';
          }
          
          // ─────────────────────────────────────────────────────────
          // PUBLISHED DATE (for sorting)
          // ─────────────────────────────────────────────────────────
          const publishedMatch = containerText.match(/Added\s+(.+?)(?:\n|$)/i);
          if (publishedMatch) {
            result.publishedDate = publishedMatch[1].trim();
          }
          
          // ─────────────────────────────────────────────────────────
          // VALIDATION: Only add if we have at least title and URL
          // ─────────────────────────────────────────────────────────
          if (result.url && result.title !== 'No title') {
            results.push(result);
          }
          
        } catch (error) {
          console.error(`Error extracting result ${index + 1}:`, error.message);
        }
      });
      
      return results;
    });
  }

  /**
   * Get pagination information
   */
  async _getPaginationInfo(page) {
    return await page.evaluate(() => {
      const paginationInfo = {
        totalPages: 1,
        totalResults: 0,
        hasNext: false,
        hasPrev: false
      };
      
      // Look for result count
      const resultText = document.body.textContent;
      const countMatch = resultText.match(/We have (\d+)/i);
      if (countMatch) {
        paginationInfo.totalResults = parseInt(countMatch[1]);
        // Assuming 15 results per page
        paginationInfo.totalPages = Math.ceil(paginationInfo.totalResults / 15);
      }
      
      // Check for pagination links
      const pageLinks = document.querySelectorAll('a[href*="PG="]');
      if (pageLinks.length > 0) {
        // Find highest page number
        let maxPage = 1;
        pageLinks.forEach(link => {
          const match = link.href.match(/PG=(\d+)/);
          if (match) {
            const pageNum = parseInt(match[1]);
            if (pageNum > maxPage) maxPage = pageNum;
          }
        });
        if (maxPage > paginationInfo.totalPages) {
          paginationInfo.totalPages = maxPage;
        }
      }
      
      // Also check for "39" style pagination display
      const paginationText = document.querySelector('.pagination, [class*="page"]');
      if (paginationText) {
        const text = paginationText.textContent;
        const lastPageMatch = text.match(/(\d+)\s*$/);
        if (lastPageMatch) {
          const lastPage = parseInt(lastPageMatch[1]);
          if (lastPage > paginationInfo.totalPages) {
            paginationInfo.totalPages = lastPage;
          }
        }
      }
      
      return paginationInfo;
    });
  }
}

module.exports = FindAPhDCrawler;
