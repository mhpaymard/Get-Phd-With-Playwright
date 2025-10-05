// Demo script: enqueue a sample crawl job and print extracted project count.
const { prepare } = require('../services/searchOrchestrator');
const { SimpleQueue } = require('../core/queue');
const { handleJob } = require('../workers/crawlWorker');

async function main() {
  const queue = new SimpleQueue();
  queue.register(async job => {
    const result = await handleJob(job);
    console.log(JSON.stringify(result, null, 2));
  });

  const req = { keywords: 'machine learning', filters: { fundingTokens: ['01M0'] }, page: 1 };
  const { url } = prepare(req);
  queue.enqueue({ url });
}

main().catch(e => { console.error(e); process.exit(1); });
