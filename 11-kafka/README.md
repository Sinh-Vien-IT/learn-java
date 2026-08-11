# MODULE 11 — KAFKA 🔴

> **Mục tiêu:** Đây phải là một trong những module sâu nhất vì bạn có kinh nghiệm thực tế với Kafka pipeline, Data platform và Microservices.
> Phân tích từ cơ chế Internals (Broker, Partition, Consumer Group, Rebalance), Delivery Semantics đến Production Scenarios (Consumer Lag, Backpressure, Schema Registry).

## Mục Lục

| File | Nội dung | Priority |
|------|----------|----------|
| [01-fundamentals.md](./01-fundamentals.md) | Broker, Topic, Partitioning, Producer & Consumer Internals, Rebalance | 🔴 |
| [02-delivery-semantics.md](./02-delivery-semantics.md) | At-most-once, At-least-once, Exactly-once (Transactional Producer + Idempotent Consumer) | 🔴 |
| [03-production.md](./03-production.md) | Consumer Lag Debugging, Backpressure, DLQ, Retry Strategy, Avro & Schema Registry | 🔴 |

## Dependency

```
Module 02 (Concurrency) ──→ Module 11 (Kafka)
                                    │
                                    ├──→ Module 12 (Event-Driven Architecture)
                                    ├──→ Module 15 (System Design)
                                    └──→ Module 26 (Project Deep Dive)
```

→ Bắt đầu: [01-fundamentals.md](./01-fundamentals.md)
