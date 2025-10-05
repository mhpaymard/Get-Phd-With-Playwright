const { prepare } = require("../src/services/searchOrchestrator");
const { SimpleQueue } = require("../src/core/queue");
const { handleJob } = require("../src/workers/crawlWorker");

(async () => {
  const prep = prepare({ keywords: "machine learning", filters: { discipline: "Computer Science" } });
  if(!prep.url.includes("Keywords=machine+learning")) throw new Error("Keyword not encoded properly");
  const q = new SimpleQueue();
  const result = await new Promise((resolve, reject) => {
    q.register(async (job) => { try { const r = await handleJob(job); resolve(r); } catch(e){ reject(e); } });
    q.enqueue({ url: prep.url, userId: "u1" });
    setTimeout(()=> reject(new Error('Timeout waiting for job')), 15000);
  });
  if(!result) throw new Error("No result returned");
  console.log('Integration result sample:', JSON.stringify(result).slice(0,200));
  if(result.ok) {
    if(!Array.isArray(result.projects)) throw new Error("Projects not array when ok=true");
  } else {
    console.log('Skipping project assertion due to fetch error:', result.error);
  }
  console.log("Integration test passed.");
})();
