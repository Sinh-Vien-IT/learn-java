# 3.3 — JVM Troubleshooting 🔴

> **Mục tiêu:** Đây là phần Senior/Tech Lead PHẢI biết.
> Interviewer không hỏi "GC là gì" mà hỏi "Production bị OOM, bạn debug thế nào?"

---

## Mục Lục

1. [Troubleshooting Framework](#1-troubleshooting-framework)
2. [OutOfMemoryError](#2-outofmemoryerror)
3. [Memory Leak](#3-memory-leak)
4. [High CPU](#4-high-cpu)
5. [High GC Pause](#5-high-gc-pause)
6. [Thread Deadlock](#6-thread-deadlock)
7. [Thread Pool Exhausted](#7-thread-pool-exhausted)
8. [Tools & Commands](#8-tools--commands)
9. [Production Scenarios](#9-production-scenarios)
10. [Interview Questions](#10-interview-questions)
11. [Cheat Sheet](#11-cheat-sheet)

---

## 1. Troubleshooting Framework 🔴

```
SYMPTOM → MEASURE → HYPOTHESIZE → INVESTIGATE → FIX → PREVENT

1. Symptom:     Cái gì xảy ra? (alert, user report, metrics)
2. Measure:     Thu thập data (logs, metrics, dumps)
3. Hypothesize: Dựa trên data, nguyên nhân có thể là gì?
4. Investigate:  Xác minh hypothesis
5. Fix:         Short-term fix + long-term fix
6. Prevent:     Monitoring, alerting, test
```

---

## 2. OutOfMemoryError 🔴

### Types of OOM

| OOM Type | Nguyên nhân | Area |
|----------|------------|------|
| `Java heap space` | Heap full | Heap |
| `Metaspace` | Quá nhiều classes loaded | Metaspace |
| `GC overhead limit exceeded` | >98% time spent in GC, <2% heap freed | Heap |
| `unable to create new native thread` | Thread limit reached | OS |
| `Direct buffer memory` | NIO direct buffers full | Native |

### Scenario: Java heap space

```
SYMPTOM:
  Application crash, log: "java.lang.OutOfMemoryError: Java heap space"

INVESTIGATION:
  1. Check -Xmx setting — heap đủ lớn chưa?
  2. Check GC log — Full GC recover bao nhiêu?
     → Nếu Full GC recover ít → memory leak
     → Nếu Full GC recover nhiều nhưng GC quá frequent → heap quá nhỏ
  3. Heap dump analysis

COMMANDS:
  # Tự động dump khi OOM (PHẢI enable production!)
  -XX:+HeapDumpOnOutOfMemoryError
  -XX:HeapDumpPath=/var/log/java/heapdump.hprof
  
  # Manual heap dump
  jmap -dump:live,format=b,file=heap.hprof <pid>
  
  # Quick histogram (no dump file, fast)
  jmap -histo <pid> | head -30

ANALYSIS:
  # Dùng Eclipse MAT (Memory Analyzer Tool) hoặc VisualVM
  # Tìm: Leak Suspects report, Dominator tree
  # Top memory consumers: class nào chiếm nhiều nhất?
  # Retention path: ai giữ reference → tại sao không GC?
```

### Scenario: GC overhead limit exceeded

```
SYMPTOM:
  "java.lang.OutOfMemoryError: GC overhead limit exceeded"
  → GC chạy >98% time nhưng free <2% heap

ROOT CAUSE:
  → Heap almost full, GC liên tục chạy nhưng không free được
  → Memory leak (objects không release)
  → Processing data set quá lớn cho heap hiện tại

FIX:
  Short-term: tăng -Xmx
  Long-term: find memory leak, optimize data structure
```

### Scenario: Metaspace

```
SYMPTOM:
  "java.lang.OutOfMemoryError: Metaspace"

ROOT CAUSE:
  → Quá nhiều classes loaded
  → ClassLoader leak (Tomcat hot deploy)
  → Dynamic proxy generation (CGLib, Reflection)
  → Excessive use of Groovy/script languages (mỗi eval = new class)

FIX:
  -XX:MaxMetaspaceSize=512m (set limit)
  Fix ClassLoader leak
  Reduce dynamic class generation
```

---

## 3. Memory Leak 🔴

### Memory Leak trong Java?

> "Java có GC mà sao lại leak?" — Leak xảy ra khi objects vẫn có reference nhưng application không dùng nữa → GC không collect được.

### Common Memory Leak Patterns

**1. Collection grow vô hạn**
```java
// ❌ Static map grow forever
public class CacheManager {
    private static final Map<String, Object> cache = new HashMap<>();
    
    public static void put(String key, Object value) {
        cache.put(key, value); // NEVER remove → leak!
    }
}

// ✅ Fix: bounded cache, TTL, eviction
// Dùng Caffeine, Guava Cache, hoặc WeakHashMap
```

**2. Connection/Resource không close**
```java
// ❌ Connection leak
public User getUser(Long id) {
    Connection conn = dataSource.getConnection();
    // ... query
    return user;
    // conn.close() NEVER called nếu exception!
}

// ✅ Fix: try-with-resources
public User getUser(Long id) {
    try (Connection conn = dataSource.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
        // ...
    } // auto-close
}
```

**3. Listeners/Callbacks không deregister**
```java
// ❌ EventListener leak
eventBus.register(listener);
// Object bị destroy nhưng eventBus vẫn giữ reference → leak

// ✅ Fix: deregister khi không cần
@PreDestroy
public void cleanup() {
    eventBus.unregister(listener);
}
```

**4. ThreadLocal không remove**
```java
// ❌ ThreadLocal leak (đặc biệt với thread pool!)
private static final ThreadLocal<UserContext> context = new ThreadLocal<>();

public void process(Request req) {
    context.set(new UserContext(req.getUser()));
    // process...
    // QUÊN context.remove()
    // Thread được reuse → UserContext cũ vẫn sống → LEAK
}

// ✅ Fix: always remove in finally
public void process(Request req) {
    context.set(new UserContext(req.getUser()));
    try {
        // process...
    } finally {
        context.remove(); // MUST!
    }
}
```

**5. Inner class giữ reference outer class**
```java
// ❌ Non-static inner class giữ reference outer (this$0)
public class Outer {
    private byte[] largeData = new byte[10_000_000]; // 10MB
    
    public Runnable createTask() {
        return new Runnable() { // anonymous inner → giữ reference Outer
            @Override
            public void run() { /* ... */ }
        };
    } // Outer không GC được vì Runnable giữ reference
}

// ✅ Fix: dùng static inner class hoặc lambda (lambda capture chỉ cần thiết)
public Runnable createTask() {
    return () -> { /* no reference to Outer */ }; // OK nếu không dùng Outer fields
}
```

### Detect Memory Leak

```bash
# 1. Monitor heap usage over time
#    Leak pattern: heap usage after Full GC TĂNG DẦN
#    
#    Healthy:  ↗↘↗↘↗↘  (sau GC drop về baseline)
#    Leak:     ↗↘↗↗↘↗↗↗↘↗↗↗↗  (baseline tăng dần)

# 2. GC log: check "heap after GC"
#    Full GC: 2G→500M (OK — freed 75%)
#    Full GC: 2G→1.5G (BAD — only freed 25%, growing)

# 3. Heap dump comparison
#    Dump at T1, dump at T2
#    Compare: class nào tăng instance count?
#    → Đó là leak candidate
```

---

## 4. High CPU 🔴

### Investigation Steps

```bash
# Step 1: Xác định process nào dùng nhiều CPU
top -c

# Step 2: Xác định thread nào trong Java process
top -H -p <java_pid>
# → Ghi lại thread ID (LWP) dùng CPU cao nhất

# Step 3: Convert thread ID sang hex
printf '%x\n' <thread_id>
# Ví dụ: 12345 → 0x3039

# Step 4: Thread dump
jstack <java_pid> > thread_dump.txt

# Step 5: Tìm thread trong dump
grep -A 20 "0x3039" thread_dump.txt
# → Thấy thread đang execute ở đâu
```

### Common causes

| Cause | Dấu hiệu trong thread dump |
|-------|---------------------------|
| Infinite loop | Thread RUNNABLE, cùng 1 stack trace liên tục |
| Excessive GC | GC threads chiếm CPU, check GC log |
| Regex backtracking | Thread RUNNABLE trong Pattern/Matcher |
| Serialization | Thread RUNNABLE trong ObjectOutputStream |
| Sorting large dataset | Thread RUNNABLE trong Arrays.sort/Collections.sort |

---

## 5. High GC Pause 🔴

### Investigation

```bash
# 1. Enable GC logging
-Xlog:gc*:file=gc.log:time,uptime,level,tags

# 2. Analyze GC log
# Tool: GCViewer, GCEasy.io
# Check:
#   → Pause duration: > target?
#   → Frequency: quá thường xuyên?
#   → Heap before/after: free được bao nhiêu?
#   → Type: Young GC vs Mixed GC vs Full GC?

# 3. Common fixes:
# → Pause too long: giảm heap (smaller → faster GC) hoặc switch GC
# → GC too frequent: tăng heap hoặc giảm allocation rate
# → Full GC: fix memory leak hoặc tăng heap
# → Humongous allocation: tăng G1HeapRegionSize
```

---

## 6. Thread Deadlock 🔴

### Detection

```bash
# jstack auto-detect deadlocks
jstack <pid>

# Output:
# Found one Java-level deadlock:
# =============================
# "thread-1":
#   waiting to lock monitor 0x00007f...(object 0x000000..., a java.lang.Object),
#   which is held by "thread-2"
# "thread-2":
#   waiting to lock monitor 0x00007f...(object 0x000000..., a java.lang.Object),
#   which is held by "thread-1"
```

### Fix

```
1. Identify lock ordering issue
2. Fix: consistent lock ordering
3. Hoặc: tryLock with timeout
4. Long-term: reduce lock granularity, use concurrent collections
```

→ Chi tiết: [Module 02 - Synchronization](../02-concurrency/02-synchronization.md#7-deadlock-livelock-starvation)

---

## 7. Thread Pool Exhausted 🔴

### Symptoms

```
- Requests timeout
- Thread dump: hàng trăm threads WAITING hoặc TIMED_WAITING
- Connection pool: all connections in use
- Tomcat: "Max number of threads reached"
```

### Investigation

```bash
# Thread dump — count threads by state
jstack <pid> | grep "java.lang.Thread.State" | sort | uniq -c
#  150 RUNNABLE
#  800 WAITING (parking)     ← quá nhiều waiting!
#   50 TIMED_WAITING

# Check: threads đang chờ gì?
# → DB connection? → connection pool exhausted
# → Lock? → contention
# → External API? → downstream slow
```

### Common causes & fixes

| Cause | Fix |
|-------|-----|
| Downstream API slow | Add timeout, circuit breaker |
| DB connection pool exhausted | Tăng pool size, fix slow queries, add timeout |
| Thread pool too small | Tăng pool size (nếu resource cho phép) |
| Synchronous blocking call | Convert sang async (CompletableFuture) |
| Long-running tasks | Async processing, break into smaller tasks |

---

## 8. Tools & Commands 🔴

### Essential Commands

```bash
# ===== PROCESS INFO =====
jps -lvm                          # List Java processes

# ===== HEAP =====
jmap -heap <pid>                  # Heap summary
jmap -histo <pid> | head -30      # Object histogram (top consumers)
jmap -dump:live,format=b,file=heap.hprof <pid>  # Heap dump

# ===== THREADS =====
jstack <pid>                      # Thread dump
jstack -l <pid>                   # Thread dump + locks

# ===== GC =====
jstat -gc <pid> 1000              # GC stats every 1s
jstat -gcutil <pid> 1000          # GC utilization %

# ===== JVM FLAGS =====
jinfo -flags <pid>                # Current JVM flags

# ===== MODERN (Java 11+) =====
jhsdb jmap --heap --pid <pid>     # Replaces some jmap functions
jcmd <pid> GC.heap_dump /tmp/heap.hprof  # Heap dump
jcmd <pid> Thread.print           # Thread dump
jcmd <pid> VM.flags               # JVM flags
jcmd <pid> GC.run                 # Force GC (testing only!)
```

### Must-Have JVM Flags (Production)

```bash
java \
  -Xms4g -Xmx4g \                        # Heap (set equal!)
  -XX:+UseG1GC \                          # G1 GC
  -XX:MaxGCPauseMillis=200 \              # GC pause target
  -XX:+HeapDumpOnOutOfMemoryError \       # Auto dump on OOM
  -XX:HeapDumpPath=/var/log/java/ \       # Dump location
  -Xlog:gc*:file=/var/log/java/gc.log:time,uptime,level,tags:filecount=5,filesize=100m \
  -XX:+ExitOnOutOfMemoryError \           # Exit on OOM (K8s restart)
  -jar myapp.jar
```

### Analysis Tools

| Tool | Purpose | Free? |
|------|---------|-------|
| Eclipse MAT | Heap dump analysis | ✅ |
| VisualVM | Profiling, monitoring | ✅ |
| JConsole | JMX monitoring | ✅ (bundled) |
| GCViewer | GC log analysis | ✅ |
| GCEasy | GC log analysis (web) | ✅ (basic) |
| Arthas | Online diagnostics | ✅ |
| async-profiler | CPU/allocation profiling | ✅ |
| JFR (Flight Recorder) | Low-overhead profiling | ✅ (Java 11+) |
| YourKit | Profiling | Paid |

---

## 9. Production Scenarios 🔴

### Scenario 1: API Latency Spike Every 5 Minutes

```
SYMPTOM: p99 latency spike from 50ms to 2s every ~5 minutes

INVESTIGATION:
1. Check GC log → Full GC every 5 minutes, pause 1.5s
2. Check heap after Full GC → only 30% freed (normally should be 50%+)
3. Heap dump → large HashMap in CacheService, 500K entries, growing

ROOT CAUSE:
  In-memory cache without eviction policy → grows unbounded → 
  triggers Full GC → long pause → latency spike

FIX:
  Short-term: tăng heap -Xmx8g
  Long-term: replace HashMap with Caffeine Cache (TTL + max size)
  
PREVENTION:
  Alert: Full GC count > 1/hour
  Alert: heap after Full GC > 60%
  Monitoring: cache size metric
```

### Scenario 2: CPU 100% Suddenly

```
SYMPTOM: CPU jumps to 100%, service unresponsive

INVESTIGATION:
1. top -H -p <pid> → thread 12345 using 99% CPU
2. printf '%x\n' 12345 → 0x3039
3. jstack <pid> → thread "0x3039":
   at java.util.regex.Pattern$GroupHead.match(Pattern.java:4168)
   at java.util.regex.Pattern$Loop.match(Pattern.java:4295)
   at java.util.regex.Pattern$GroupHead.match(Pattern.java:4168)
   ... (repeated — backtracking!)

ROOT CAUSE:
  Regex catastrophic backtracking on malicious input
  Pattern: "^(a+)+$" → exponential backtracking

FIX:
  Fix regex pattern (avoid nested quantifiers)
  Add timeout for regex matching
  Input validation (max length)

PREVENTION:
  Code review regex patterns
  Fuzz testing
  CPU alert > 80% sustained
```

### Scenario 3: Memory Grows Continuously

```
SYMPTOM: Heap usage after GC increases 10MB every hour

INVESTIGATION:
1. GC log confirms: post-GC heap baseline increasing
2. Heap dump at T1, heap dump at T2 (1 hour later)
3. Compare: EventListener instances increased 10K → 20K
4. Trace retention: EventBus holds strong references

ROOT CAUSE:
  Event listeners registered but never deregistered
  → Each request creates listener, never cleanup

FIX:
  Add @PreDestroy cleanup
  Use WeakReference for listeners
  
PREVENTION:
  Monitor: instance count of key classes
  Load test with longer duration (detect slow leak)
```

### Scenario 4: Pod OOMKilled (Kubernetes)

```
SYMPTOM: Pod OOMKilled, but -Xmx=4g and pod limit=4g

ROOT CAUSE:
  JVM uses MORE than -Xmx!
  Total = Heap + Metaspace + Thread stacks + Direct buffers + 
          Native memory + JIT code cache + GC overhead
  
  4GB heap + 256MB metaspace + 200 threads × 1MB + misc = ~5GB > 4GB limit

FIX:
  Pod memory limit = -Xmx × 1.5 (rule of thumb)
  Or: -Xmx=2.5g for 4GB pod limit
  Or: -XX:MaxRAMPercentage=75 (Java 10+)
  
PREVENTION:
  Set -XX:MaxRAMPercentage instead of -Xmx for containers
  Monitor: RSS (Resident Set Size) vs heap
```

---

## 10. Interview Questions

### Q1: "OOM trong production — debug thế nào?" 🔴

#### Strong answer
> "Đầu tiên phải có heap dump — luôn enable `-XX:+HeapDumpOnOutOfMemoryError` production. Nếu quên → jmap dump manual nếu process còn sống.
>
> Phân tích dump bằng Eclipse MAT: xem Leak Suspects report — nó chỉ ra objects chiếm nhiều memory nhất và retention path. Ví dụ tôi đã gặp: static HashMap cache không có eviction, 2 triệu entries chiếm 3GB.
>
> Song song check GC log: nếu Full GC frequent mà free ít → confirm leak. Nếu Full GC free nhiều nhưng heap grow nhanh → allocation rate quá cao, cần optimize hoặc tăng heap.
>
> Prevention: HeapDumpOnOOM, GC logging, monitoring heap trend."

---

### Q2: "Memory leak trong Java tìm thế nào?" 🔴

#### Strong answer
> "Pattern nhận biết: heap after Full GC tăng dần theo thời gian. Investigation: 2 heap dumps cách nhau — compare instance count, tìm class nào tăng bất thường. Eclipse MAT Dominator Tree cho thấy ai giữ memory nhiều nhất.
>
> Common causes tôi đã gặp: (1) Static collection grow unbounded, (2) ThreadLocal không remove trong thread pool, (3) Connection/stream không close, (4) Event listener không deregister. Fix case-by-case rồi verify leak không tái phát."

---

### Q3: "CPU 100% — debug thế nào?" 🔴

#### Strong answer
> "4 bước: top -H tìm thread ID dùng CPU cao → convert sang hex → jstack lấy thread dump → grep thread hex trong dump → thấy stack trace.
>
> Common causes: infinite loop, regex backtracking, excessive GC, serialization. GC case: check GC log, nếu GC chiếm >50% CPU thì đó là root cause — fix memory issue."

---

### Q4: "JVM flags quan trọng cho production?" 🔴

#### Strong answer
> "Must-have: -Xms=-Xmx (tránh resize), HeapDumpOnOutOfMemoryError, GC logging. Quan trọng: ExitOnOutOfMemoryError cho container (K8s restart). Cho container: MaxRAMPercentage thay -Xmx. GC: G1 default đủ tốt, ZGC nếu cần sub-ms pause."

---

## 11. Cheat Sheet

```
┌──────────────────────────────────────────────────────────────┐
│                    JVM CHEAT SHEET                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Memory Areas:                                                │
│ • Heap: objects (-Xms, -Xmx) → OOM: heap space              │
│ • Stack: per thread, local vars (-Xss) → StackOverflow      │
│ • Metaspace: class metadata → OOM: Metaspace                 │
│                                                              │
│ GC:                                                          │
│ • Young Gen: Eden + S0/S1, Minor GC (~10-50ms)               │
│ • Old Gen: Major/Full GC (100ms-seconds)                     │
│ • G1 (default): regions, target pause time                   │
│ • ZGC: <1ms pause, Java 15+                                  │
│                                                              │
│ Troubleshooting:                                             │
│ • OOM → heap dump (MAT) → find leak                         │
│ • CPU 100% → top -H → jstack → find thread                  │
│ • GC pause → GC log → tune or switch GC                     │
│ • Deadlock → jstack auto-detect                              │
│ • Thread pool exhausted → thread dump → find blocking        │
│                                                              │
│ Production Must-Have:                                        │
│ • -Xms = -Xmx                                               │
│ • -XX:+HeapDumpOnOutOfMemoryError                            │
│ • GC logging enabled                                         │
│ • -XX:+ExitOnOutOfMemoryError (containers)                   │
│ • Container: -XX:MaxRAMPercentage=75                         │
│                                                              │
│ Commands:                                                    │
│ • jstack <pid>     → thread dump                             │
│ • jmap -histo <pid> → object histogram                       │
│ • jmap -dump:live,format=b,file=heap.hprof <pid>             │
│ • jstat -gcutil <pid> 1000  → GC stats                       │
│ • jcmd <pid> GC.heap_dump /path/heap.hprof                   │
│                                                              │
│ Leak Pattern: heap after Full GC ↑ over time                 │
│ Common Leaks: static collection, ThreadLocal, unclosed conn  │
│                                                              │
│ Pod OOMKilled: JVM uses more than -Xmx!                      │
│   Total = Heap + Metaspace + Threads + DirectBuffers + GC    │
│   Pod limit = Xmx × 1.5                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 04 - Modern Java](../04-modern-java/)
