# 🎯 Senior Java / Tech Lead — Interview Bootcamp

> **Bộ giáo trình ôn phỏng vấn hoàn chỉnh** cho vị trí Senior Java Backend Engineer & Tech Lead.
> Được cá nhân hóa cho Backend Engineer ~5 năm kinh nghiệm.

---

## 📋 Mục Lục Tổng Quan

| # | Module | Mô tả | Priority | Status |
|---|--------|--------|----------|--------|
| 00 | [Interview Fundamentals](./00-interview-fundamentals/) | Kỹ năng phỏng vấn, giới thiệu bản thân, STAR | 🔴 | ⬜ |
| 01 | [Java Core](./01-java-core/) | OOP, Collections, HashMap deep dive | 🔴 | ⬜ |
| 02 | [Concurrency](./02-concurrency/) | Thread, Lock, JMM, CompletableFuture | 🔴 | ⬜ |
| 03 | [JVM](./03-jvm/) | Architecture, GC, Troubleshooting | 🔴 | ⬜ |
| 04 | [Modern Java](./04-modern-java/) | Java 8→21, Stream, Virtual Threads | 🟠 | ⬜ |
| 05 | [Spring Core](./05-spring-core/) | IoC, DI, AOP, Proxy | 🔴 | ⬜ |
| 06 | [Spring Boot](./06-spring-boot/) | Auto-config, REST API design | 🔴 | ⬜ |
| 07 | [Transaction](./07-transaction/) | ACID, Isolation, Distributed TX, Saga | 🔴 | ⬜ |
| 08 | [Database & SQL](./08-database-sql/) | SQL mastery, Index, Performance | 🔴 | ⬜ |
| 09 | [Database Design](./09-database-design/) | Schema, Sharding, Replication, CAP | 🔴 | ⬜ |
| 10 | [Redis / Cache](./10-redis-cache/) | Cache patterns, Distributed lock | 🟠 | ⬜ |
| 11 | [Kafka](./11-kafka/) | Deep dive broker→consumer, semantics | 🔴 | ⬜ |
| 12 | [Event-Driven](./12-event-driven/) | EDA, CQRS, Saga, Outbox | 🔴 | ⬜ |
| 13 | [Microservices](./13-microservices/) | Patterns, Circuit Breaker, trade-offs | 🔴 | ⬜ |
| 14 | [Distributed System](./14-distributed-system/) | CAP, Consistency, Failures | 🔴 | ⬜ |
| 15 | [System Design](./15-system-design/) | Framework + 17 bài thiết kế hệ thống | 🔴 | ⬜ |
| 16 | [Performance](./16-performance/) | Framework debug + Case studies | 🔴 | ⬜ |
| 17 | [Kubernetes / Docker](./17-kubernetes-docker/) | K8s concepts, troubleshooting | 🟠 | ⬜ |
| 18 | [CI/CD](./18-cicd/) | Pipeline, deployment strategies | 🟠 | ⬜ |
| 19 | [Observability](./19-observability/) | Logging, Metrics, Tracing, SLO | 🟠 | ⬜ |
| 20 | [Testing](./20-testing/) | Unit, Integration, Kafka, Concurrency | 🟠 | ⬜ |
| 21 | [Security](./21-security/) | Auth, JWT, OWASP | 🟡 | ⬜ |
| 22 | [Design Patterns](./22-design-patterns/) | GOF + Spring examples | 🟠 | ⬜ |
| 23 | [Architecture](./23-architecture/) | Clean, Hexagonal, DDD | 🔴 | ⬜ |
| 24 | [Tech Lead](./24-tech-lead/) | Leadership, code review, mentoring | 🔴 | ⬜ |
| 25 | [Behavioral](./25-behavioral/) | STAR questions, 50+ Q&A | 🔴 | ⬜ |
| 26 | [Project Deep Dive](./26-project-deep-dive/) | Follow-up trees cho từng project | 🔴 | ⬜ |
| 27 | [Coding](./27-coding/) | LeetCode patterns + roadmap | 🟠 | ⬜ |
| 28 | [Mock Interview](./28-mock-interview/) | 6 mock interviews đầy đủ | 🔴 | ⬜ |
| 29 | [Cheat Sheet](./29-cheat-sheet/) | Per-module + Ultimate cheat sheet | 🔴 | ⬜ |
| 30 | [Final Interview Pack](./30-final-interview-pack/) | 560+ câu hỏi + scorecard | 🔴 | ⬜ |

---

## 🎓 Vòng Phỏng Vấn Mục Tiêu

| Round | Nội dung | Modules liên quan |
|-------|----------|-------------------|
| **Round 1** | Java / Coding / Backend Fundamentals | 01, 02, 03, 04, 27 |
| **Round 2** | Spring Boot / Database / Kafka / Distributed | 05, 06, 07, 08, 09, 10, 11, 14 |
| **Round 3** | System Design / Architecture | 15, 23, 12, 13 |
| **Round 4** | Technical Deep Dive | 16, 26, 03, 11 |
| **Round 5** | Tech Lead / Leadership / Behavioral | 24, 25, 00 |
| **Round 6** | Mock Interview | 28 |

---

## 🧭 Cách Sử Dụng Giáo Trình

### Nếu có 4 tuần:
1. **Tuần 1:** Module 00 → 01 → 02 → 03
2. **Tuần 2:** Module 05 → 06 → 07 → 08 → 11
3. **Tuần 3:** Module 13 → 14 → 15 → 24
4. **Tuần 4:** Module 28 → 29 → 30 + Ôn lại

### Nếu có 2 tuần:
1. **Tuần 1:** Module 00 → 01 (Collections) → 02 (JMM) → 05 → 07 → 08 → 11
2. **Tuần 2:** Module 15 → 24 → 25 → 29 → 30

### Nếu chỉ có 3 ngày:
1. **Ngày 1:** Module 00 → 29 (Cheat Sheet) → 30 (Trap Questions + Top 100 Java)
2. **Ngày 2:** Module 15 (System Design framework + 3 bài) → 11 (Kafka)
3. **Ngày 3:** Module 24 → 25 → 28 (Mock Interview)

---

## 📊 Priority Legend

| Icon | Level | Ý nghĩa |
|------|-------|---------|
| 🔴 | MUST KNOW | Không biết = fail phỏng vấn |
| 🟠 | SHOULD KNOW | Biết = điểm cộng lớn |
| 🟡 | GOOD TO KNOW | Biết = ấn tượng interviewer |
| ⚪ | OPTIONAL | Chỉ cần nếu có thời gian |

---

## 🔗 Cross-Reference Map

```
Java Core ──→ Concurrency ──→ Kafka ──→ Event-Driven ──→ System Design
    │              │              │           │
    ↓              ↓              ↓           ↓
Collections    JMM/Lock     Delivery     Saga/Outbox
    │              │         Semantics        │
    ↓              ↓              │           ↓
 HashMap      Performance        ↓      Distributed
 deep dive     Engineering   Production     System
                              Patterns
                              
Spring Core ──→ Spring Boot ──→ Transaction ──→ Database
    │                │              │              │
    ↓                ↓              ↓              ↓
  Proxy           REST API     Isolation      Index/Query
  AOP            Exception     Locking        Performance
                 Handling      Saga
```

---

## 📁 Tài Liệu Bổ Sung

- [ROADMAP.md](./ROADMAP.md) — Lộ trình học chi tiết + dependency map
- [REVISION_TRACKER.md](./REVISION_TRACKER.md) — Hệ thống ôn tập spaced repetition

---

> **Mindset học:**
> Theory → Implementation → Production → Failure → Trade-off → Interview
>
> Mục tiêu không phải "biết" mà là "có thể giải thích cho interviewer một cách tự tin, chính xác, có chiều sâu."
# learn-java
# learn-java
