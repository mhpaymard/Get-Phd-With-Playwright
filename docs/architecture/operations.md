# عملیات و Resilience
- Monitoring: Prometheus metrics + Grafana dashboards.
- Alerts: نرخ خطا > 5% در 5 دقیقه، افزایش p95 latency > 2x baseline.
- Health Checks: /health (سریع) و /ready (بررسی queue + dictionary version).
- Log Rotation: روزانه + retention 14 روز.
- Schema Drift Detection: مقایسه فیلدهای استخراج شده با آخرین snapshot schema.
- Replay Mechanism: ذخیره raw HTML برای 24h جهت debug.
- Backpressure: اگر in_flight_jobs > threshold → تعلیق enqueue جدید.
- Fallback: ارائه نتایج cache قدیمی تا 10 دقیقه پس از انقضا.
- Disaster Recovery: Snapshot از token_dictionary هر 6h.
