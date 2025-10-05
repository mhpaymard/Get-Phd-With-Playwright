// Minimal in-memory queue stub; replace with Redis/Rabbit in production.
class SimpleQueue {
  constructor() { this.q = []; this.consumers = []; }
  enqueue(job) { this.q.push(job); this._drain(); }
  register(handler) { this.consumers.push(handler); this._drain(); }
  _drain() {
    while (this.q.length && this.consumers.length) {
      const job = this.q.shift();
      for (const h of this.consumers) h(job).catch(()=>{});
    }
  }
}
module.exports = { SimpleQueue };
