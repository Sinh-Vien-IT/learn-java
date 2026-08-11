# MODULE 2 — JAVA CONCURRENCY 🔴

> **Mục tiêu:** Concurrency là một trong những module quan trọng nhất cho Senior/Tech Lead.
> Interviewer dùng concurrency để phân biệt Junior (biết synchronized) với Senior (biết JMM, CAS, happens-before).

## Mục Lục

| File | Nội dung | Priority |
|------|----------|----------|
| [01-thread-fundamentals.md](./01-thread-fundamentals.md) | Thread, ExecutorService, ThreadPool | 🔴 |
| [02-synchronization.md](./02-synchronization.md) | synchronized, Lock, Atomic, Concurrent Utils | 🔴 |
| [03-java-memory-model.md](./03-java-memory-model.md) | JMM, happens-before, CAS, CompletableFuture | 🔴 |

## Dependency

```
Module 01 (Java Core) ─→ Module 02 (Concurrency)
                              │
                              ├──→ Module 03 (JVM - thread dump, troubleshooting)
                              ├──→ Module 11 (Kafka - consumer threading)
                              ├──→ Module 16 (Performance - thread pool tuning)
                              └──→ Module 04 (Modern Java - Virtual Threads)
```

→ Bắt đầu: [01-thread-fundamentals.md](./01-thread-fundamentals.md)
