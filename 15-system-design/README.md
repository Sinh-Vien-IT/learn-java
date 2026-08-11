# MODULE 15 — SYSTEM DESIGN 🔴

> **Mục tiêu:** Cung cấp Framework 13 bước chuẩn mực để chinh phục bất kỳ buổi System Design Interview nào, kèm bộ thiết kế chi tiết cho 17 bài toán thực tế chuẩn Senior / Tech Lead.

## Mục Lục

| File | Bài toán System Design | Priority |
|------|------------------------|----------|
| [README.md](./README.md) | **Framework 13 Bước Trả Lời System Design Interview** | 🔴 |
| [01-url-shortener.md](./01-url-shortener.md) | URL Shortener (TinyURL) | 🔴 |
| [02-notification-system.md](./02-notification-system.md) | High-throughput Notification System | 🔴 |
| [03-order-system.md](./03-order-system.md) | High-concurrency Order System | 🔴 |
| [04-payment-system.md](./04-payment-system.md) | Payment System (Idempotency & Reconciliation) | 🔴 |
| [05-ecommerce.md](./05-ecommerce.md) | E-commerce Flash Sale Platform | 🔴 |
| [06-chat-system.md](./06-chat-system.md) | Real-time Chat System (WhatsApp/Slack) | 🔴 |
| [07-file-upload.md](./07-file-upload.md) | Distributed File Upload System (S3-like) | 🟠 |
| [08-rate-limiter.md](./08-rate-limiter.md) | Distributed Rate Limiter | 🔴 |
| [09-job-scheduler.md](./09-job-scheduler.md) | Distributed Job Scheduler | 🔴 |
| [10-logging-system.md](./10-logging-system.md) | Distributed Centralized Logging System | 🟠 |
| [11-metrics-system.md](./11-metrics-system.md) | Time-Series Metrics System (Prometheus-like) | 🟠 |
| [12-reporting-platform.md](./12-reporting-platform.md) | Enterprise Data Reporting Platform | 🔴 |
| [13-realtime-analytics.md](./13-realtime-analytics.md) | Real-time Analytics Platform (ClickHouse-based) | 🔴 |
| [14-kafka-event-processing.md](./14-kafka-event-processing.md) | Heavy Kafka Event Processing System | 🔴 |
| [15-data-pipeline.md](./15-data-pipeline.md) | End-to-End CDC Data Pipeline (Debezium + Kafka + ClickHouse) | 🔴 |
| [16-ride-hailing.md](./16-ride-hailing.md) | Ride-Hailing Backend (Uber/Grab) | 🔴 |
| [17-social-feed.md](./17-social-feed.md) | Social Newsfeed System (Twitter/Facebook) | 🔴 |

---

## 13-Step System Design Interview Framework 🔴

Khi phỏng vấn System Design, **ĐỪNG VÀO NHAU VẼ NGAY HỆ THỐNG**. Hãy tuân thủ đúng 13 bước sau:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SYSTEM DESIGN 13-STEP FRAMEWORK                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Clarify Requirements (Hỏi rõ Functional & Non-Functional Req)            │
│ 2. Capacity Estimation (Tính toán Throughput RPS, Storage, Bandwidth)        │
│ 3. API Design (Thiết kế REST / gRPC Endpoints)                             │
│ 4. Data Model & DB Selection (SQL vs NoSQL vs Columnar)                     │
│ 5. High-Level Architecture (Vẽ Diagram tổng quan)                           │
│ 6. Deep Dive: Core Features (Đi sâu vào cơ chế xử lý chính)                 │
│ 7. Deep Dive: Scalability (Horizontal Scaling, Caching, Sharding)           │
│ 8. Deep Dive: Reliability & Fault Tolerance (Failover, Circuit Breaker)     │
│ 9. Deep Dive: Data Consistency (Transactions, Saga, Outbox)                 │
│ 10. Bottlenecks & Single Point of Failure (SPOF) Analysis                   │
│ 11. Monitoring, Alerting & Observability (Metrics, Logs, Tracing)           │
│ 12. Trade-offs Analysis (Tại sao chọn X mà không chọn Y?)                   │
│ 13. Summary & Interviewer Follow-up Q&A                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

> Bắt đầu bài viết chi tiết đầu tiên: [01-url-shortener.md](./01-url-shortener.md)
