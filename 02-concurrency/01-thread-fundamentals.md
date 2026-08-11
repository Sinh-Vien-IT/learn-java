# 2.1 — Thread Fundamentals 🔴

> **Mục tiêu:** Hiểu Thread lifecycle, cách tạo và quản lý threads, ExecutorService và ThreadPool.
> Đây là nền tảng cho toàn bộ concurrency.

---

## Mục Lục

1. [Process vs Thread](#1-process-vs-thread)
2. [Thread Lifecycle](#2-thread-lifecycle)
3. [Tạo Thread: Runnable, Callable, Future](#3-tạo-thread)
4. [ExecutorService & ThreadPool](#4-executorservice--threadpool)
5. [ThreadPool Types & Sizing](#5-threadpool-types--sizing)
6. [Interview Questions](#6-interview-questions)

---

## 1. Process vs Thread 🔴

### Kiến thức nền tảng

| Feature | Process | Thread |
|---------|---------|--------|
| Định nghĩa | Instance of running program | Lightweight unit of execution within a process |
| Memory | Separate memory space | Share memory space within process |
| Communication | IPC (pipes, sockets, shared memory) | Shared variables (nhưng cần synchronization) |
| Creation cost | Cao (fork, allocate memory) | Thấp (share parent's memory) |
| Isolation | Full isolation (crash 1 không ảnh hưởng khác) | Shared state (1 thread corrupt → ảnh hưởng tất cả) |
| Context switch | Expensive | Cheaper |

### Production relevance

```
Microservices = multiple processes (separate JVMs)
  → Isolation: service A crash không ảnh hưởng B
  → Communication: HTTP, gRPC, Kafka (IPC)

Within 1 service = multiple threads
  → Tomcat thread pool handles HTTP requests
  → Each request = 1 thread (traditional model)
  → Shared resources: DB connection pool, cache, etc.
```

---

## 2. Thread Lifecycle 🔴

```
                    ┌─────────┐
                    │   NEW   │  ← Thread created but not started
                    └────┬────┘
                         │ start()
                         ▼
                    ┌──────────┐
              ┌─────│ RUNNABLE │←──────────────────┐
              │     └────┬─────┘                    │
              │          │                          │
              │    ┌─────▼──────┐          ┌────────┴────────┐
              │    │  RUNNING   │          │    WAITING/      │
              │    │ (CPU time) │──────────│  TIMED_WAITING   │
              │    └─────┬──────┘ wait()   │  BLOCKED         │
              │          │        sleep()   └─────────────────┘
              │          │        join()         notify()
              │          │        lock            timeout
              │          │                        lock acquired
              │          │ run() completes
              │          ▼
              │    ┌────────────┐
              └───→│ TERMINATED │  ← Thread finished or exception
                   └────────────┘
```

### States chi tiết

| State | Khi nào | Chuyển sang |
|-------|---------|-------------|
| NEW | `new Thread()` | RUNNABLE (khi `start()`) |
| RUNNABLE | `start()` called | RUNNING (CPU schedules), BLOCKED/WAITING |
| BLOCKED | Waiting to acquire `synchronized` lock | RUNNABLE (lock acquired) |
| WAITING | `wait()`, `join()`, `LockSupport.park()` | RUNNABLE (notify, join returns) |
| TIMED_WAITING | `sleep(ms)`, `wait(ms)`, `join(ms)` | RUNNABLE (timeout or notify) |
| TERMINATED | `run()` completes or exception | — |

### ⚠️ BLOCKED vs WAITING

```java
// BLOCKED — đang chờ monitor lock
synchronized (lockObject) {  // Thread B blocked ở đây nếu Thread A đang hold lock
    // critical section
}

// WAITING — tự nguyện chờ
synchronized (lockObject) {
    lockObject.wait();  // Thread release lock VÀ vào WAITING state
}                       // Cần notify() từ thread khác để wake up
```

---

## 3. Tạo Thread 🔴

### Cách 1: Implement Runnable (Preferred)

```java
// ✅ Preferred — class có thể extend class khác
Runnable task = () -> {
    System.out.println("Running in: " + Thread.currentThread().getName());
};

Thread thread = new Thread(task, "worker-1");
thread.start(); // start() NOT run()!
// run() chỉ gọi method trong current thread — KHÔNG tạo thread mới
```

### Cách 2: Callable + Future (Return value + Exception)

```java
Callable<Integer> task = () -> {
    Thread.sleep(1000);
    return 42;
};

ExecutorService executor = Executors.newSingleThreadExecutor();
Future<Integer> future = executor.submit(task);

// Blocking call — chờ kết quả
Integer result = future.get();           // block forever
Integer result = future.get(5, TimeUnit.SECONDS); // timeout

// Check status
future.isDone();      // completed?
future.isCancelled(); // cancelled?
future.cancel(true);  // cancel (mayInterruptIfRunning)
```

### Runnable vs Callable

| Feature | Runnable | Callable |
|---------|----------|----------|
| Return value | void | V (generic) |
| Exception | Không throw checked | Throw Exception |
| Submit | execute() hoặc submit() | submit() only |
| Result | Không có | Future<V> |

### ⚠️ Common mistake: start() vs run()

```java
Thread t = new Thread(() -> System.out.println("Hello"));
t.run();   // ❌ Chạy trong CURRENT thread — không tạo thread mới!
t.start(); // ✅ Tạo thread mới và gọi run() trong đó
```

---

## 4. ExecutorService & ThreadPool 🔴

### Tại sao cần ThreadPool?

```java
// ❌ Tạo thread mới cho mỗi task
for (Request request : requests) {
    new Thread(() -> process(request)).start();
    // Problem:
    // 1. Thread creation expensive (~1MB stack per thread)
    // 2. 10K requests = 10K threads → OOM
    // 3. Không control được số lượng threads
    // 4. Không reuse threads
}

// ✅ ThreadPool — reuse threads
ExecutorService executor = Executors.newFixedThreadPool(10);
for (Request request : requests) {
    executor.submit(() -> process(request));
    // 10 threads reused, 10K tasks queued
}
executor.shutdown();
```

### ThreadPoolExecutor — Understanding core parameters 🔴

```java
// Đây là class underlying tất cả Executors factory methods
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    corePoolSize,       // Số threads luôn duy trì (kể cả idle)
    maximumPoolSize,    // Số threads tối đa
    keepAliveTime,      // Thời gian thread idle trước khi bị kill (nếu > core)
    timeUnit,           // Đơn vị thời gian
    workQueue,          // Queue chứa tasks chờ
    threadFactory,      // Cách tạo threads (đặt tên, daemon, etc.)
    rejectionHandler    // Xử lý khi queue full VÀ max threads reached
);
```

### Flow khi submit task

```
submit(task)
    │
    ▼
activeThreads < corePoolSize? ──Yes──→ Tạo thread mới, run task
    │
    No
    │
    ▼
workQueue full? ──No──→ Đặt task vào queue
    │
   Yes
    │
    ▼
activeThreads < maxPoolSize? ──Yes──→ Tạo thread mới, run task
    │
    No
    │
    ▼
Rejection Handler (default: throw RejectedExecutionException)
```

### Rejection Handlers

| Handler | Behavior | Use case |
|---------|----------|----------|
| AbortPolicy | Throw RejectedExecutionException | Default — fail fast |
| CallerRunsPolicy | Run task in caller's thread | Backpressure — slow down producer |
| DiscardPolicy | Silently discard task | Acceptable loss (metrics, logs) |
| DiscardOldestPolicy | Discard oldest queued task | Latest data more important |

### Production example: Custom ThreadPool

```java
@Configuration
public class ThreadPoolConfig {
    
    @Bean("asyncProcessor")
    public ExecutorService asyncProcessorPool() {
        return new ThreadPoolExecutor(
            10,                            // core: 10 threads always ready
            50,                            // max: burst lên 50
            60, TimeUnit.SECONDS,          // idle > core threads die after 60s
            new LinkedBlockingQueue<>(1000), // queue capacity 1000
            new ThreadFactory() {           // named threads for debugging
                private final AtomicInteger counter = new AtomicInteger(0);
                @Override
                public Thread newThread(Runnable r) {
                    Thread t = new Thread(r, "async-processor-" + counter.incrementAndGet());
                    t.setDaemon(false);
                    return t;
                }
            },
            new ThreadPoolExecutor.CallerRunsPolicy() // backpressure
        );
    }
}
```

---

## 5. ThreadPool Types & Sizing 🔴

### Factory Methods (Executors)

```java
// 1. Fixed — known concurrency
Executors.newFixedThreadPool(10);
// = new ThreadPoolExecutor(10, 10, 0, LINKED_BLOCKING_QUEUE)
// Use: stable workload, know how many threads needed

// 2. Cached — variable workload
Executors.newCachedThreadPool();
// = new ThreadPoolExecutor(0, Integer.MAX_VALUE, 60s, SYNCHRONOUS_QUEUE)
// ⚠️ DANGER: unbounded threads → OOM under load!

// 3. Single — sequential execution
Executors.newSingleThreadExecutor();
// = new ThreadPoolExecutor(1, 1, 0, LINKED_BLOCKING_QUEUE)
// Use: ordered processing, sequential tasks

// 4. Scheduled — delayed/periodic tasks
Executors.newScheduledThreadPool(5);
// Use: cron-like tasks, delayed execution

// 5. Virtual Thread (Java 21+)
Executors.newVirtualThreadPerTaskExecutor();
// Lightweight threads → millions possible
```

### ⚠️ Production Warning: KHÔNG dùng Executors factory trong production

```java
// ❌ Executors.newFixedThreadPool(10)
// Dùng LinkedBlockingQueue UNBOUNDED → queue grow vô hạn → OOM

// ❌ Executors.newCachedThreadPool()
// maxPoolSize = Integer.MAX_VALUE → tạo vô hạn threads → OOM

// ✅ Luôn dùng ThreadPoolExecutor trực tiếp với bounded queue
new ThreadPoolExecutor(10, 50, 60, SECONDS, new LinkedBlockingQueue<>(1000));
```

### Thread Pool Sizing

**CPU-bound tasks:**
```
threads = number of CPU cores
// Ví dụ: 8 cores → 8 threads
// Thêm thread chỉ tăng context switch, không tăng throughput
```

**I/O-bound tasks:**
```
threads = number of CPU cores × (1 + wait_time / compute_time)
// Ví dụ: 8 cores, API call 200ms, compute 10ms
// threads = 8 × (1 + 200/10) = 8 × 21 = 168
```

**Production heuristic:**
```
CPU-bound: cores
I/O-bound: cores × 2 to cores × 10
Mixed: benchmark and tune

// Luôn benchmark với actual workload!
// Monitor: queue size, active threads, rejected tasks
```

### Graceful Shutdown 🔴

```java
executor.shutdown();           // Không nhận task mới, chờ running tasks hoàn thành
executor.shutdownNow();        // Interrupt running tasks, return queued tasks
executor.awaitTermination(30, TimeUnit.SECONDS); // Block cho đến khi terminate

// Production shutdown hook
@PreDestroy
public void cleanup() {
    executor.shutdown();
    try {
        if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
            executor.shutdownNow();
            if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                log.error("ThreadPool did not terminate");
            }
        }
    } catch (InterruptedException e) {
        executor.shutdownNow();
        Thread.currentThread().interrupt();
    }
}
```

---

## 6. Interview Questions

### Q1: "Runnable vs Callable?" 🟠

#### Short answer
> "Runnable không return value và không throw checked exception. Callable return value (Future<V>) và throw Exception. Dùng Callable khi cần kết quả hoặc propagate exception."

---

### Q2: "Thread pool sizing thế nào?" 🔴

#### Strong answer
> "Phụ thuộc workload type. CPU-bound: number of cores. I/O-bound: cores × (1 + wait/compute ratio). Nhưng đây chỉ là starting point — production phải benchmark. Monitor queue size, active threads, rejection rate. Quan trọng là dùng bounded queue để tránh OOM."

#### Follow-up: "Tại sao không dùng Executors.newCachedThreadPool?"
> "Vì maxPoolSize = Integer.MAX_VALUE. Nếu burst traffic, tạo hàng nghìn threads → OOM. Luôn dùng ThreadPoolExecutor trực tiếp với bounded maxPoolSize và bounded queue."

---

### Q3: "Thread pool exhausted — xử lý thế nào?" 🔴

#### Strong answer
> "Symptoms: requests timeout, queue grow, rejection. Debug: monitor active threads, queue size. Possible causes: (1) downstream slow → threads blocked waiting, (2) pool size quá nhỏ, (3) task quá lâu.
>
> Immediate fix: tăng pool size (nếu server resource cho phép). Long-term: identify root cause — nếu downstream slow → add timeout, circuit breaker. Nếu task quá lâu → async processing, break into smaller tasks.
>
> Prevention: bounded queue + rejection handler (CallerRunsPolicy cho backpressure), monitoring + alerting on queue size."

→ Xem thêm: [Module 16 - Performance](../16-performance/)

---

### Q4: "Daemon thread vs User thread?" 🟠

#### Short answer
> "JVM exits khi tất cả user threads terminate. Daemon threads bị kill khi JVM exits. Use: background tasks (GC is daemon thread). Đừng dùng daemon cho tasks quan trọng cần hoàn thành."

---

> → Tiếp theo: [02-synchronization.md](./02-synchronization.md)
