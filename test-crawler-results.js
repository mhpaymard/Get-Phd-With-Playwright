/**
 * تست Crawler - استخراج با JSON-LD (Merged + Parsed)
 * فقط صفحه اول با keyword="a"
 * - خواندن تمام <script type="application/ld+json">
 * - ادغام Course ها (dedupe بر اساس name+provider)
 * - استخراج supervisor/deadline/email/funding/location از description
 * - اضافه کردن deadlineText و deadlineDate (ISO)
 */

const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

function normalizeSpace(s) {
    return (s || '').replace(/\u00A0/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function monthToNum(m) {
    const map = {
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
    return map[m.toLowerCase()] || null;
}

function toIsoDate(dateText) {
    if (!dateText) return null;
    // نمونه‌ها: 31 January 2026, 14th November 2025, 3 December 2025
    const m = dateText.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
    if (!m) return null;
    const day = String(parseInt(m[1], 10)).padStart(2, '0');
    const month = monthToNum(m[2]);
    const year = m[3];
    if (!month) return null;
    return `${year}-${month}-${day}`;
}

function parseFromDescription(description, universityName) {
    const result = {
        supervisors: [],
        emails: [],
        funding: null,
        deadlineText: null,
        deadlineDate: null,
        location: null,
    };

    const desc = normalizeSpace(description);
    if (!desc) return result;

    // Supervisors - چند الگو
    const supPatterns = [
        /Supervisory\s+Team:?\s*([^\.\n]{10,300})/gi,
        /(?:Primary|Main|Lead)\s+Supervisor:?\s*([^\.\n]{10,200})/gi,
        /Supervisor[s]?:?\s*([^\.\n]{10,300})/gi,
        /supervised\s+by\s+([^\.\n]{10,200})/gi,
        /(?:under the )?supervision of\s+([^\.\n]{10,200})/gi,
        /(?:PhD|Leeds|Oxford|Cambridge|York)\s+supervisors?:?\s*([^\.\n]{10,300})/gi,
        /((?:Prof(?:essor)?|Dr)\.?\s+[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)/g,
    ];
    supPatterns.forEach(p => {
        const it = desc.matchAll(p);
        for (const m of it) {
            const val = normalizeSpace(m[1] || m[0]);
            if (val && /(Prof|Dr)/i.test(val) && val.length <= 300) result.supervisors.push(val);
        }
    });
    result.supervisors = [...new Set(result.supervisors)].slice(0, 5);

    // Deadline - چند الگو
    const deadlinePatterns = [
        /Application\s+Deadline:?\s*[^0-9]*?(\d{1,2}(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
        /deadline\s+(?:is|:)\s*(\d{1,2}(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
        /apply\s+by:?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
        /applications?\s+by:?\s*(\d{1,2}(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
    ];
    for (const p of deadlinePatterns) {
        const m = p.exec(desc);
        if (m) {
            result.deadlineText = m[1] || m[0];
            result.deadlineDate = toIsoDate(result.deadlineText);
            break;
        }
    }

    // Emails
    const emails = desc.match(/\b([a-z0-9][a-z0-9._+-]*@[a-z0-9][a-z0-9._-]*\.[a-z]{2,})\b/gi) || [];
    result.emails = [...new Set(emails.map(e => e.toLowerCase()))].slice(0, 5);

    // Funding
    const fundingMap = [
        { re: /fully[- ]funded/i, v: 'Fully Funded' },
        { re: /competition funded/i, v: 'Competition Funded' },
        { re: /self[- ]funded/i, v: 'Self-Funded' },
        { re: /studentship/i, v: 'Studentship' },
        { re: /scholarship/i, v: 'Scholarship' },
        { re: /\bfunded\b/i, v: 'Funded' },
        { re: /EPSRC/i, v: 'EPSRC Funded' },
        { re: /UKRI/i, v: 'UKRI Funded' },
    ];
    for (const { re, v }
        of fundingMap) {
        if (re.test(desc)) { result.funding = v; break; }
    }

    // Location از university یا description
    if (universityName) {
        const m = universityName.match(/University of ([A-Z][a-z]+)/);
        if (m) result.location = m[1];
        else if (/Newcastle/i.test(universityName)) result.location = 'Newcastle';
        else if (/Rochester/i.test(universityName)) result.location = 'Rochester, NY, USA';
    }
    if (!result.location) {
        const locPatterns = [
            /based (?:at|in)\s+([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)/i,
            /located in\s+([A-Z][a-z]+)/i,
            /in\s+([A-Z][a-z]+),\s*(?:UK|United Kingdom|England|Scotland|Wales)/i,
        ];
        for (const p of locPatterns) {
            const m = p.exec(desc);
            if (m) { result.location = m[1]; break; }
        }
    }

    return result;
}

function mergeCourseInfo(a, b) {
    // انتخاب description بلندتر
    const description = (a.description || '').length >= (b.description || '').length ? a.description : b.description;
    const university = a.university || b.university || null;

    // ادغام field های parsed (اولویت با non-empty)
    const supervisors = [...new Set([...(a.supervisors || []), ...(b.supervisors || [])])].slice(0, 5);
    const emails = [...new Set([...(a.emails || []), ...(b.emails || [])])].slice(0, 5);
    const funding = a.funding || b.funding || null;
    const location = a.location || b.location || null;

    // deadline: اگر یکی متن دارد ولی ISO ندارد، سعی کن از دیگری ISO بگیری
    const deadlineText = a.deadlineText || b.deadlineText || null;
    const deadlineDate = a.deadlineDate || b.deadlineDate || toIsoDate(deadlineText) || null;

    return {
        title: a.title || b.title,
        university,
        description,
        supervisors,
        emails,
        funding,
        location,
        deadlineText,
        deadlineDate,
    };
}

async function testCrawler() {
    console.log('\n🔍 Testing JSON-LD (merged) with keyword "a" - Page 1\n');

    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    try {
        console.log('→ Navigating to https://www.findaphd.com/phds/?Keywords=a ...\n');
        await page.goto('https://www.findaphd.com/phds/?Keywords=a', {
            waitUntil: 'networkidle',
            timeout: 90000,
        });

        // Cookie consent
        try {
            const acceptButton = page.locator('button:has-text("Accept all")').first();
            if (await acceptButton.isVisible({ timeout: 3001 })) {
                await acceptButton.click();
                console.log('✅ Cookie consent accepted\n');
                await page.waitForTimeout(800);
            }
        } catch {}

        await page.waitForTimeout(1500);

        console.log('→ Extracting all JSON-LD scripts...\n');

        const scriptsPayload = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            const payload = [];
            scripts.forEach((s, idx) => {
                try {
                    const data = JSON.parse(s.textContent);
                    payload.push({ idx: idx + 1, data });
                } catch {}
            });
            return payload;
        });

        console.log(`✅ Found ${scriptsPayload.length} JSON-LD scripts`);

        // جمع‌آوری Course ها از همه اسکریپت‌ها
        const allCourses = [];
        scriptsPayload.forEach(({ data }) => {
            if (Array.isArray(data)) {
                data.forEach(item => { if (item['@type'] === 'Course') allCourses.push(item); });
            } else if (data && data['@type'] === 'Course') {
                allCourses.push(data);
            }
        });

        console.log(`✅ Collected ${allCourses.length} Course items from all scripts\n`);

        // تبدیل اولیه و parse description
        const prepared = allCourses.map(item => {
            const title = normalizeSpace(item.name || '');
            const university = normalizeSpace(item.provider?.name || '');
            const description = normalizeSpace(item.description || '');
            const parsed = parseFromDescription(description, university);
            return {
                title,
                university,
                description,
                supervisors: parsed.supervisors,
                emails: parsed.emails,
                funding: parsed.funding,
                location: parsed.location,
                deadlineText: parsed.deadlineText,
                deadlineDate: parsed.deadlineDate,
            };
        });

        // ادغام بر اساس کلید یکتا (title+university)
        const key = (x) => `${x.title}::${x.university}`;
        const mergedMap = new Map();
        prepared.forEach(cur => {
            const k = key(cur);
            if (!mergedMap.has(k)) mergedMap.set(k, cur);
            else mergedMap.set(k, mergeCourseInfo(mergedMap.get(k), cur));
        });

        const merged = Array.from(mergedMap.values());

        // نمایش خلاصه
        console.log('\n' + '='.repeat(120));
        console.log('📊 Merged Results Table');
        console.log('='.repeat(120) + '\n');

        console.log(
            'No'.padEnd(4) +
            '| Title'.padEnd(60) +
            '| University'.padEnd(35) +
            '| Deadline'.padEnd(18) +
            '| Deadline(ISO)'
        );
        console.log('-'.repeat(120));

        merged.forEach((item, idx) => {
            const t = (s, n) => (s ? (s.length > n ? s.substring(0, n - 3) + '...' : s) : '-');
            console.log(
                `${(idx + 1).toString().padEnd(3)} ` +
                `| ${t(item.title, 58).padEnd(60)} ` +
                `| ${t(item.university, 33).padEnd(35)} ` +
                `| ${t(item.deadlineText, 16).padEnd(18)} ` +
                `| ${t(item.deadlineDate, 10)}`
            );
        });

        // خروجی JSON
        const output = {
            metadata: {
                keyword: 'a',
                page: 1,
                crawledAt: new Date().toISOString(),
                method: 'JSON-LD merged + parsed',
                scripts: scriptsPayload.length,
                coursesRaw: allCourses.length,
                coursesMerged: merged.length,
            },
            results: merged
        };

        fs.writeFileSync(path.join(__dirname, 'crawler-test-results.json'), JSON.stringify(output, null, 2), 'utf8');
        console.log('\n💾 Saved: crawler-test-results.json\n');

        await browser.close();
        console.log('✅ Done.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        await browser.close();
        process.exit(1);
    }
}

testCrawler();