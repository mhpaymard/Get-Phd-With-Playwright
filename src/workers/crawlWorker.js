// Worker skeleton: fetch and parse listing pages.
const https = require('https');
const { parse } = require('../findaphd/url');

function fetchUrl(url, { timeout = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, { timeout }).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('Status ' + res.statusCode));
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(timeout, ()=>{ req.destroy(new Error('Timeout')); });
  });
}

function extractProjects(html) {
  // Very naive placeholder: find project links by pattern /phds/project/
  const regex = /https:\/\/www\.findaphd\.com\/phds\/project\/[^"']+/g;
  const links = new Set();
  let m; while ((m = regex.exec(html))) links.add(m[0]);
  return Array.from(links).slice(0, 50).map(url => ({ url }));
}

async function handleJob(job) {
  const { url } = job;
  try {
    const html = await fetchUrl(url);
    const listing = parse(url);
    const projects = extractProjects(html);
    return { ok: true, url, listing, count: projects.length, projects };
  } catch (e) {
    return { ok: false, url, error: e.message };
  }
}

module.exports = { handleJob };
