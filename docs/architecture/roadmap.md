# Roadmap
## Phase 1 (MVP)
- URL build/parse + filterMapper (DONE)
- Basic crawl listing pages (DONE placeholder extraction)
- Integration test skeleton (DONE)

## Phase 2 (Discovery)
- Playwright discovery worker
- Token dictionary versioning + diff
- Institution, Study Mode, PhD Type capture

## Phase 3 (Enrichment)
- Detail page parser
- Snapshot entity persistence
- HTML raw cache 24h

## Phase 4 (Caching & Scale)
- L1/L2 cache implementation
- Redis queue + backpressure
- Horizontal worker scaling guidelines

## Phase 5 (Security & Ops)
- Auth gateway (JWT/API keys)
- Quota enforcement + adaptive throttling
- Full metrics + alert rules deployment

## Phase 6 (Quality & UX)
- Advanced dedupe across snapshots
- Search result ranking heuristics
- API docs & SDK

## Phase 7 (Resilience Enhancements)
- Replay + anomaly detection
- Schema drift auto-mitigation
- Canary workers

## Phase 8 (Optimization)
- Parallel segment prefetch
- Adaptive pagination depth per query entropy
- Cost-based prioritization in queue
