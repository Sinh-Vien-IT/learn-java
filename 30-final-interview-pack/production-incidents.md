# 30.2 — Production Incidents Scenarios 🔴

> **Mục tiêu:** 20 Kịch bản sự cố Production thực tế, các bước điều tra, câu lệnh debug và phương án khắc phục chuẩn Senior / Tech Lead.

---

## Top 20 Production Incidents Matrix

```
1.  CPU 100% (High CPU Utilization)
2.  Java Heap Space OutOfMemoryError (OOM)
3.  Metaspace OutOfMemoryError
4.  GC Pause Time Spike (Stop-The-World Spike)
5.  Kafka Consumer Lag Bùng Nổ
6.  MySQL Slow Queries & Lock Wait Timeout
7.  HikariCP DB Connection Pool Exhausted
8.  Tomcat Thread Pool Exhausted
9.  API Latency Spike (p99 > 5s)
10. Traffic Spike (Cơn bão Traffic Flash Sale)
11. Duplicate Event Processing (Duplicate Orders / Payment)
12. Distributed Data Inconsistency (Lệch data giữa MySQL & Redis/ClickHouse)
13. Kafka Message Loss
14. Database Deadlock (MySQL Deadlock)
15. Kubernetes Pod Restart Continuous (CrashLoopBackOff)
16. Deployment Failure & Rollback Pipeline Stuck
17. Cache Avalanche (Tuyết lở Cache)
18. Redis Node Unavailable / Failover Fail
19. Kafka Cluster Broker Down
20. Database Master Outage (Primary DB Crash)
```

---

## Mẫu Chi Tiết Incident 1: CPU 100%

* **Symptoms (Dấu hiệu):** Grafana báo CPU Node/Container đạt 100%, API Response Time vọt từ 20ms lên 10s hoặc Timeout.
* **Possible Causes (Nguyên nhân):** Vòng lặp vô tận (Infinite Loop), Catastrophic Regex Backtracking, Quá trình GC chạy liên tục (GC Overhead), Serialization dữ liệu quá lớn.
* **Investigation Steps (Các bước điều tra):**
  1. `top -c` -> Lấy `PID` của Java Process.
  2. `top -H -p <PID>` -> Lấy Thread ID (`LWP`) ăn CPU cao nhất.
  3. `printf '%x\n' <LWP>` -> Chuyển Thread ID sang dạng HEX.
  4. `jstack <PID> | grep -A 20 <HEX_THREAD_ID>` -> Soi Stack trace chính xác dòng code đang bị nghẽn.
* **Fix & Prevention:** Sửa logic code/regex, tune lại GC hoặc nâng Heap Size nếu do GC Overhead.

---

> → Tiếp theo: [30.3 — Master Scorecard](./scorecard.md)
