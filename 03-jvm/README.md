# MODULE 3 — JVM 🔴

> **Mục tiêu:** Hiểu JVM architecture, GC, và quan trọng nhất — biết troubleshoot production issues.
> Interviewer đánh giá Senior qua khả năng debug OOM, memory leak, high GC pause.

## Mục Lục

| File | Nội dung | Priority |
|------|----------|----------|
| [01-architecture.md](./01-architecture.md) | JVM Architecture, ClassLoader, Runtime Data Areas | 🔴 |
| [02-gc.md](./02-gc.md) | GC Algorithms, G1, ZGC, GC Tuning | 🔴 |
| [03-troubleshooting.md](./03-troubleshooting.md) | OOM, Memory Leak, CPU, Thread Dump, Profiling | 🔴 |

## Dependency

```
Module 01 (Java Core) ──→ Module 03 (JVM)
Module 02 (Concurrency) ─→ Module 03 (thread dump, deadlock detection)
                              │
                              ├──→ Module 16 (Performance Engineering)
                              └──→ Module 30 (Production Incidents)
```

→ Bắt đầu: [01-architecture.md](./01-architecture.md)
