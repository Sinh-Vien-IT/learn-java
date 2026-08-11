# 🗺️ ROADMAP — Lộ Trình Học Chi Tiết

## Dependency Map

Các module được sắp xếp theo dependency — học module trước mới có nền tảng cho module sau.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: FOUNDATION                         │
│                                                                 │
│  [00 Interview Fundamentals]                                    │
│         │                                                       │
│  [01 Java Core] ──→ [02 Concurrency] ──→ [03 JVM]             │
│         │                    │                │                  │
│         └────────────────────┼────────────────┘                  │
│                              │                                   │
│                    [04 Modern Java]                              │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                    PHASE 2: SPRING & DATA                       │
│                              │                                   │
│  [05 Spring Core] ──→ [06 Spring Boot]                          │
│                              │                                   │
│                    [07 Transaction]                              │
│                         │         │                              │
│              [08 DB/SQL] ←┘       └→ [09 DB Design]             │
│                                          │                       │
│                              [10 Redis/Cache]                    │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                    PHASE 3: DISTRIBUTED                         │
│                              │                                   │
│  [11 Kafka] ──→ [12 Event-Driven] ──→ [13 Microservices]       │
│                                              │                   │
│                              [14 Distributed System]             │
│                                              │                   │
│                         [15 System Design] ←─┘                   │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                    PHASE 4: OPERATIONS                          │
│                              │                                   │
│  [16 Performance]    [17 K8s/Docker] ──→ [18 CI/CD]             │
│                                              │                   │
│  [19 Observability]  [20 Testing]    [21 Security]              │
│                                                                  │
│  [22 Design Patterns] ──→ [23 Architecture]                     │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                    PHASE 5: INTERVIEW                           │
│                              │                                   │
│  [24 Tech Lead]      [25 Behavioral]                            │
│         │                    │                                   │
│         └────→ [26 Project Deep Dive]                            │
│                       │                                          │
│  [27 Coding] ─────────┼──→ [28 Mock Interview]                  │
│                       │          │                                │
│              [29 Cheat Sheet]    └──→ [30 Final Pack]            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 Lộ Trình 8 Tuần (Recommended)

### Tuần 1: Java Foundation
| Ngày | Nội dung | Thời gian |
|------|----------|-----------|
| T2 | Module 00: Interview Fundamentals | 2h |
| T3 | Module 01: OOP + SOLID | 3h |
| T4 | Module 01: Java Language | 2h |
| T5 | Module 01: Collections + HashMap deep dive | 4h |
| T6 | Module 04: Modern Java (Lambda, Stream, Optional) | 3h |
| T7 | Ôn lại tuần 1 + Làm bài tập | 2h |

### Tuần 2: Concurrency & JVM
| Ngày | Nội dung | Thời gian |
|------|----------|-----------|
| T2 | Module 02: Thread fundamentals | 3h |
| T3 | Module 02: Synchronization, Lock, Atomic | 3h |
| T4 | Module 02: Java Memory Model, CompletableFuture | 3h |
| T5 | Module 03: JVM Architecture, ClassLoader | 2h |
| T6 | Module 03: GC + Troubleshooting | 3h |
| T7 | Ôn tuần 1-2 + Interview questions | 2h |

### Tuần 3: Spring & Transaction
| Ngày | Nội dung | Thời gian |
|------|----------|-----------|
| T2 | Module 05: Spring Core (IoC, DI, AOP) | 3h |
| T3 | Module 05: Proxy, Bean lifecycle | 2h |
| T4 | Module 06: Spring Boot + REST API | 3h |
| T5 | Module 07: Transaction (ACID, Isolation) | 3h |
| T6 | Module 07: Distributed TX, Saga, Outbox | 3h |
| T7 | Ôn tuần 1-3 + Interview questions | 2h |

### Tuần 4: Database & Cache
| Ngày | Nội dung | Thời gian |
|------|----------|-----------|
| T2 | Module 08: SQL Mastery | 3h |
| T3 | Module 08: Index, Query Performance | 3h |
| T4 | Module 09: Database Design, Sharding | 3h |
| T5 | Module 10: Redis, Cache Patterns | 3h |
| T6 | Module 22: Design Patterns | 3h |
| T7 | Ôn tuần 1-4 + Mock Q&A | 2h |

### Tuần 5: Kafka & Distributed Systems
| Ngày | Nội dung | Thời gian |
|------|----------|-----------|
| T2 | Module 11: Kafka Fundamentals | 4h |
| T3 | Module 11: Delivery Semantics | 3h |
| T4 | Module 11: Kafka Production | 3h |
| T5 | Module 12: Event-Driven Architecture | 3h |
| T6 | Module 14: Distributed System Concepts | 3h |
| T7 | Ôn tuần 1-5 + Kafka deep dive Q&A | 2h |

### Tuần 6: System Design
| Ngày | Nội dung | Thời gian |
|------|----------|-----------|
| T2 | Module 15: System Design Framework | 3h |
| T3 | Module 15: URL Shortener + Notification System | 3h |
| T4 | Module 15: Order + Payment System | 3h |
| T5 | Module 15: Data Pipeline + Analytics Platform | 3h |
| T6 | Module 13: Microservices + Module 23: Architecture | 4h |
| T7 | Ôn + Thực hành system design 45 phút | 3h |

### Tuần 7: Operations & Leadership
| Ngày | Nội dung | Thời gian |
|------|----------|-----------|
| T2 | Module 16: Performance Engineering | 3h |
| T3 | Module 17: K8s/Docker + Module 18: CI/CD | 3h |
| T4 | Module 19: Observability + Module 20: Testing | 3h |
| T5 | Module 24: Tech Lead | 3h |
| T6 | Module 25: Behavioral Interview | 3h |
| T7 | Module 21: Security + Ôn | 2h |

### Tuần 8: Final Preparation
| Ngày | Nội dung | Thời gian |
|------|----------|-----------|
| T2 | Module 26: Project Deep Dive | 3h |
| T3 | Module 27: Coding Patterns (nếu cần) | 3h |
| T4 | Module 28: Mock Interview 1-3 | 4h |
| T5 | Module 28: Mock Interview 4-6 | 4h |
| T6 | Module 29: Cheat Sheet review + Module 30: Final Pack | 4h |
| T7 | Full mock interview simulation | 3h |

---

## 📅 Lộ Trình 4 Tuần (Accelerated)

Ưu tiên 🔴 MUST KNOW topics.

| Tuần | Focus | Modules |
|------|-------|---------|
| 1 | Java + Spring + DB | 00, 01, 02(JMM), 05, 07, 08 |
| 2 | Kafka + Distributed + System Design | 11, 13, 14, 15(framework + 5 bài) |
| 3 | Performance + Architecture + Leadership | 16, 23, 24, 25 |
| 4 | Mock + Review + Final Pack | 26, 28, 29, 30 |

---

## 📅 Lộ Trình 1 Tuần (Emergency)

| Ngày | Focus |
|------|-------|
| T2 | Module 00 + 29 (Cheat Sheet) |
| T3 | Module 01 (Collections) + 02 (JMM) |
| T4 | Module 05 + 07 + 08 (SQL/Index) |
| T5 | Module 11 (Kafka) + 14 (Distributed) |
| T6 | Module 15 (System Design 3 bài) |
| T7 | Module 24 + 25 + Mock Interview |
| CN | Module 30 (Final Pack review) |

---

## Spaced Repetition Schedule

Xem chi tiết tại [REVISION_TRACKER.md](./REVISION_TRACKER.md)
