# 2.3 — Java Memory Model & CompletableFuture 🔴

> **Mục tiêu:** Java Memory Model (JMM) là kiến thức phân biệt Senior thực sự.
> Nếu trả lời được JMM + happens-before → interviewer biết bạn hiểu concurrency ở mức deep.

---

## Mục Lục

1. [Java Memory Model (JMM)](#1-java-memory-model)
2. [Happens-Before](#2-happens-before)
3. [volatile Deep Dive](#3-volatile-deep-dive)
4. [CompletableFuture](#4-completablefuture)
5. [30 Câu Hỏi Phỏng Vấn Concurrency](#5-30-câu-hỏi-phỏng-vấn-concurrency)
6. [Cheat Sheet](#6-cheat-sheet)

---

## 1. Java Memory Model 🔴

### Vấn đề: Tại sao cần JMM?

```
Hardware reality:

CPU 1                CPU 2
┌──────────┐        ┌──────────┐
│ Register │        │ Register │
│ L1 Cache │        │ L1 Cache │   ← Mỗi CPU có cache riêng
│ L2 Cache │        │ L2 Cache │
└────┬─────┘        └────┬─────┘
     │                    │
     └────────┬───────────┘
              │
     ┌────────▼────────┐
     │   Main Memory   │
     └─────────────────┘

Problem: CPU 1 write x = 42 vào cache nhưng KHÔNG flush ra main memory
→ CPU 2 đọc x vẫn thấy 0 (stale value)
→ VISIBILITY problem
```

### JMM là gì?

Java Memory Model là **specification** (JLS Chapter 17) define:
1. **Khi nào** write bởi thread A **visible** cho thread B
2. **Ordering** — thứ tự instruction execution
3. **Atomicity** — operation nào atomic

### Mô hình Working Memory

```
JMM abstraction:

Thread 1               Thread 2
┌─────────────┐        ┌─────────────┐
│   Working   │        │   Working   │
│   Memory    │        │   Memory    │
│  (CPU cache │        │  (CPU cache │
│   + regs)   │        │   + regs)   │
│             │        │             │
│  x = 42     │        │  x = 0 ??  │  ← stale!
└──────┬──────┘        └──────┬──────┘
       │                      │
       │     ┌──────────┐     │
       └─────│   Main   │─────┘
             │  Memory  │
             │  x = ??  │
             └──────────┘
```

### 3 vấn đề JMM giải quyết

**1. Visibility**
```java
// Thread A              // Thread B
running = true;          while (running) { // có thể KHÔNG bao giờ thấy running = false!
// ...                   }
running = false;         
// Nếu running không volatile, Thread B cache giá trị cũ
```

**2. Ordering (Instruction Reordering)**
```java
// Code bạn viết:
int x = 1;     // 1
int y = 2;     // 2
boolean flag = true; // 3

// CPU/Compiler CÓ THỂ reorder thành:
boolean flag = true; // 3 ← flag set TRƯỚC khi x, y!
int y = 2;     // 2
int x = 1;     // 1
// → Thread khác thấy flag = true nhưng x, y chưa set → BUG
```

**3. Atomicity**
```java
long value = 123456789L; // ❌ Trên 32-bit JVM, long/double write KHÔNG atomic!
// Có thể thread khác thấy nửa giá trị (upper 32 bits mới, lower 32 bits cũ)
// Fix: volatile long (đảm bảo atomic read/write)
```

---

## 2. Happens-Before 🔴

### Định nghĩa

Happens-before (hb) là relation giữa 2 actions:
> Nếu action A **happens-before** action B, thì A's effects **guaranteed visible** cho B.

### Rules

**Rule 1: Program Order**
```java
// Trong cùng 1 thread, statement trước hb statement sau
int x = 1;    // hb
int y = x + 1; // thấy x = 1
```

**Rule 2: Monitor Lock (synchronized)**
```java
synchronized (lock) {
    x = 42;              // write
}                         // unlock hb...
// ...
synchronized (lock) {     // ...lock (thread khác)
    System.out.println(x); // guaranteed thấy 42
}
```

**Rule 3: volatile**
```java
volatile boolean flag;
int x;

// Thread A
x = 42;           // 1
flag = true;       // 2 (volatile write)

// Thread B  
if (flag) {        // 3 (volatile read) — hb guaranteed bởi volatile
    System.out.println(x); // 4 — guaranteed thấy 42!
    // Vì: 1 hb 2 (program order), 2 hb 3 (volatile), 3 hb 4 (program order)
    // → Transitive: 1 hb 4
}
```

**Rule 4: Thread Start**
```java
x = 42;
thread.start(); // start() hb mọi action trong thread
// → thread guaranteed thấy x = 42
```

**Rule 5: Thread Join**
```java
thread.join(); // mọi action trong thread hb join()
System.out.println(result); // thấy tất cả changes bởi thread
```

**Rule 6: Transitivity**
```
If A hb B, and B hb C, then A hb C.
```

### Tại sao Happens-Before quan trọng?

> Không có happens-before relationship → **KHÔNG có visibility guarantee**. Code có thể "trông đúng" nhưng chạy sai trên multi-core CPU.

---

## 3. volatile Deep Dive 🔴

### volatile đảm bảo gì?

```java
volatile int x;

// 1. VISIBILITY: write → flush to main memory, read → read from main memory
// 2. ORDERING: 
//    - Mọi write TRƯỚC volatile write → visible cho thread đọc SAU volatile read
//    - Prevents reordering across volatile access (memory barrier/fence)
```

### volatile KHÔNG đảm bảo gì?

```java
volatile int count = 0;

count++; // ❌ KHÔNG atomic!
// Equivalent to:
// int temp = count;  // READ (volatile → from main memory)
// temp = temp + 1;   // INCREMENT (local)
// count = temp;      // WRITE (volatile → to main memory)
// 2 threads có thể cùng READ cùng value → LOST UPDATE
```

### Khi nào dùng volatile?

```java
// ✅ Status flag
volatile boolean shutdown = false;
// Thread A: shutdown = true;
// Thread B: while (!shutdown) { /* work */ }

// ✅ Double-checked locking
private static volatile Singleton instance;

// ✅ Publishing immutable objects
volatile ImmutableConfig config; // swap new config atomically

// ❌ Counter → dùng AtomicInteger
// ❌ Multiple related variables → dùng synchronized
```

### volatile vs synchronized vs Atomic

| Feature | volatile | synchronized | Atomic |
|---------|----------|-------------|--------|
| Visibility | ✅ | ✅ | ✅ |
| Atomicity | ❌ (chỉ single read/write) | ✅ | ✅ (single variable) |
| Ordering | ✅ (memory barrier) | ✅ | ✅ |
| Blocking | ❌ | ✅ | ❌ (CAS spin) |
| Use case | Flag, config publish | Critical section | Counter, reference update |

---

## 4. CompletableFuture 🔴

### Tại sao cần CompletableFuture?

```java
// ❌ Future.get() = blocking → waste thread
Future<User> future = executor.submit(() -> getUser(id));
User user = future.get(); // BLOCKED cho đến khi complete
Future<Order> orderFuture = executor.submit(() -> getOrders(user));
List<Order> orders = orderFuture.get(); // BLOCKED lần nữa

// ✅ CompletableFuture = non-blocking chaining
CompletableFuture
    .supplyAsync(() -> getUser(id))           // async
    .thenApply(user -> getOrders(user))       // chain, non-blocking
    .thenAccept(orders -> process(orders))    // consume result
    .exceptionally(ex -> handleError(ex));    // error handling
```

### Core APIs

```java
// 1. Creation
CompletableFuture.supplyAsync(() -> computeValue());        // return value
CompletableFuture.runAsync(() -> doSideEffect());           // no return
CompletableFuture.supplyAsync(() -> compute(), executor);   // custom executor

// 2. Transform (thenApply = map)
CompletableFuture<String> nameFuture = 
    CompletableFuture.supplyAsync(() -> getUser(1))
        .thenApply(user -> user.getName());      // User → String

// 3. Chain async (thenCompose = flatMap)
CompletableFuture<List<Order>> ordersFuture =
    CompletableFuture.supplyAsync(() -> getUser(1))
        .thenCompose(user -> getOrdersAsync(user)); // User → CF<List<Order>>

// 4. Combine (2 futures → 1 result)
CompletableFuture<String> result = 
    userFuture.thenCombine(orderFuture, (user, orders) -> 
        user.getName() + " has " + orders.size() + " orders");

// 5. All of (chờ tất cả)
CompletableFuture.allOf(future1, future2, future3)
    .thenRun(() -> System.out.println("All done!"));

// 6. Any of (chờ 1 cái nhanh nhất)
CompletableFuture.anyOf(future1, future2, future3)
    .thenAccept(result -> System.out.println("Fastest: " + result));
```

### Error Handling

```java
CompletableFuture.supplyAsync(() -> riskyOperation())
    .thenApply(result -> process(result))
    .exceptionally(ex -> {
        log.error("Failed", ex);
        return defaultValue;   // recover
    })
    .whenComplete((result, ex) -> {
        if (ex != null) log.error("Error", ex);
        else log.info("Success: {}", result);
    });

// handle = process both success and error
.handle((result, ex) -> {
    if (ex != null) return fallback;
    return transform(result);
});
```

### Production example — Parallel API calls

```java
@Service
public class DashboardService {
    
    public DashboardData getDashboard(Long userId) {
        // 3 API calls in parallel instead of sequential
        CompletableFuture<User> userFuture = 
            CompletableFuture.supplyAsync(() -> userService.getUser(userId));
        
        CompletableFuture<List<Order>> ordersFuture = 
            CompletableFuture.supplyAsync(() -> orderService.getRecentOrders(userId));
        
        CompletableFuture<UserStats> statsFuture = 
            CompletableFuture.supplyAsync(() -> statsService.getStats(userId));
        
        // Wait all and combine
        return CompletableFuture.allOf(userFuture, ordersFuture, statsFuture)
            .thenApply(v -> new DashboardData(
                userFuture.join(),
                ordersFuture.join(),
                statsFuture.join()
            ))
            .orTimeout(5, TimeUnit.SECONDS)       // timeout
            .exceptionally(ex -> DashboardData.empty()) // fallback
            .join();
    }
}
```

### ⚠️ Common mistakes

```java
// 1. ❌ Dùng default ForkJoinPool cho blocking I/O
CompletableFuture.supplyAsync(() -> callExternalApi()); // ForkJoinPool!
// ForkJoinPool size = CPU cores → blocking I/O exhausts pool

// ✅ Dùng custom executor cho I/O tasks
ExecutorService ioPool = Executors.newFixedThreadPool(50);
CompletableFuture.supplyAsync(() -> callExternalApi(), ioPool);

// 2. ❌ Swallow exception
future.thenApply(r -> process(r)); // exception silently lost!

// ✅ Always handle errors
future.thenApply(r -> process(r))
    .exceptionally(ex -> { log.error("Error", ex); return null; });

// 3. ❌ join() trong main request thread → defeat the purpose
// Dùng reactive approach hoặc return CompletableFuture to caller
```

---

## 5. 30 Câu Hỏi Phỏng Vấn Concurrency

### Fundamentals (1-10)

**1. "Thread vs Process?"** 🔴
> "Process = isolated, separate memory. Thread = share memory within process. Thread lighter nhưng cần synchronization cho shared data."

**2. "Tạo thread bằng mấy cách?"** 🟠
> "3 cách: extend Thread (legacy), implement Runnable (preferred), implement Callable (return value + exception). Production: dùng ExecutorService, không tạo Thread trực tiếp."

**3. "start() vs run()?"** 🔴
> "start() tạo thread mới và gọi run() trong đó. run() chạy trong current thread — không tạo thread mới."

**4. "Thread states?"** 🟠
> "NEW → RUNNABLE → (BLOCKED/WAITING/TIMED_WAITING) → TERMINATED. BLOCKED: chờ lock. WAITING: wait()/join(). TIMED_WAITING: sleep()/wait(ms)."

**5. "Thread.sleep() vs Object.wait()?"** 🔴
> "sleep() giữ lock, chỉ pause execution. wait() release lock và chờ notify(). wait() phải gọi trong synchronized block."

**6. "notify() vs notifyAll()?"** 🟠
> "notify() wake 1 thread ngẫu nhiên. notifyAll() wake tất cả. Production: dùng notifyAll() an toàn hơn — tránh case signal miss."

**7. "Join hoạt động thế nào?"** 🟠
> "thread.join() block current thread cho đến khi target thread terminate. join(ms) = chờ tối đa ms. Establish happens-before."

**8. "Interrupt hoạt động thế nào?"** 🟠
> "thread.interrupt() set interrupt flag. Nếu thread đang sleep/wait → throw InterruptedException. Nếu đang running → phải check Thread.interrupted() manually."

**9. "Thread pool sizing?"** 🔴
> Xem [Module 2.1](./01-thread-fundamentals.md#5-threadpool-types--sizing)

**10. "ThreadLocal là gì?"** 🟠
> "Thread-private variable. Mỗi thread có copy riêng, không shared. Use: request context, connection per thread. ⚠️ Memory leak nếu không remove() — đặc biệt với thread pool vì threads reused."

### Synchronization (11-20)

**11. "synchronized hoạt động thế nào?"** 🔴
> "Acquire monitor lock khi enter, release khi exit. Đảm bảo mutual exclusion + visibility + ordering (happens-before). Reentrant — cùng thread acquire nhiều lần."

**12. "synchronized vs Lock?"** 🔴
> Xem [Module 2.2](./02-synchronization.md#3-lock--reentrantlock)

**13. "volatile hoạt động thế nào?"** 🔴
> "Memory barrier: write flush to main memory, read from main memory. Visibility + ordering. KHÔNG đảm bảo atomicity. `volatile count++` vẫn race condition."

**14. "volatile vs synchronized?"** 🔴
> "volatile: visibility + ordering, lock-free, single variable. synchronized: + atomicity, blocking, multiple variables. volatile cho flag, synchronized cho critical section."

**15. "AtomicInteger vs synchronized?"** 🔴
> "AtomicInteger dùng CAS — lock-free. Tốt cho single variable. synchronized cho complex critical section. High contention → LongAdder > AtomicLong."

**16. "CAS là gì?"** 🔴
> "Compare-And-Swap: CPU instruction — 'nếu memory = expected thì set new value, atomically'. Lock-free. Fail → retry (spin). Ưu: không blocking. Nhược: spin waste CPU under contention."

**17. "ABA problem?"** 🟠
> "CAS check value = expected. Nếu thread khác change A→B→A, CAS vẫn thành công dù value đã bị modified. Fix: AtomicStampedReference — thêm version stamp."

**18. "Deadlock conditions + prevention?"** 🔴
> Xem [Module 2.2](./02-synchronization.md#7-deadlock-livelock-starvation)

**19. "Race condition ví dụ production?"** 🔴
> "Inventory: 2 requests cùng check qty > 0, cùng decrement → qty âm. Fix: optimistic locking (version field) hoặc database-level WHERE qty > 0."

**20. "False sharing?"** 🟡
> "2 variables trên cùng CPU cache line (64 bytes). Thread A modify var1, invalidate cache line → Thread B phải reload var2 dù var2 không đổi. Fix: @Contended padding. Relevant cho low-latency systems."

### Advanced (21-30)

**21. "Java Memory Model giải thích?"** 🔴
> Xem [Section 1](#1-java-memory-model) — đây là câu trả lời level Senior.

**22. "Happens-before?"** 🔴
> Xem [Section 2](#2-happens-before)

**23. "CompletableFuture vs Future?"** 🔴
> "Future: blocking get(). CompletableFuture: non-blocking chaining (thenApply, thenCompose), combine, error handling, timeout. Production: dùng CF cho parallel API calls."

**24. "ForkJoinPool?"** 🟠
> "Work-stealing pool: mỗi thread có queue riêng, thread idle steal tasks từ threads khác. Default pool cho CompletableFuture, parallel streams. ⚠️ Không dùng cho blocking I/O."

**25. "Virtual Threads (Java 21)?"** 🟠
> "Lightweight threads managed bởi JVM, không phải OS. Cost: ~KB thay vì ~MB. Millions possible. Perfect cho I/O-bound. Không nên dùng cho CPU-bound. Thay đổi game cho server-side Java."
> → Xem [Module 04 - Modern Java](../04-modern-java/)

**26. "StampedLock?"** 🟡
> "Optimistic read lock: read không acquire lock, check stamp sau khi đọc. Nếu stamp valid → done (zero-overhead). Nếu invalid → fallback sang read lock. Best performance cho read-heavy workload."

**27. "Phaser?"** 🟡
> "Advanced CyclicBarrier: dynamic registration (threads join/leave), multiple phases, supports both arrival and advance. Use: complex phased algorithms."

**28. "BlockingQueue types?"** 🟠
> "ArrayBlockingQueue (bounded, fair), LinkedBlockingQueue (optionally bounded), SynchronousQueue (0 capacity — handoff), PriorityBlockingQueue (priority). Use: producer-consumer pattern."

**29. "Thread dump analysis?"** 🔴
> "jstack <pid>. Look for: BLOCKED threads (contention), WAITING threads (deadlock/leak), thread names (identify pool), lock hierarchy. JVM auto-detect deadlocks in dump."
> → Xem [Module 03 - JVM](../03-jvm/)

**30. "Design thread-safe singleton?"** 🔴
> "Preferred: enum singleton. Or: static holder class (lazy, thread-safe by classloader). Double-checked locking with volatile. @Component in Spring (singleton bean by default)."

```java
// Best: Enum singleton
public enum Singleton {
    INSTANCE;
    public void doWork() { /* ... */ }
}

// Spring: already singleton
@Service
public class MyService { /* Spring manages lifecycle */ }
```

---

## 6. Cheat Sheet

```
┌──────────────────────────────────────────────────────────────┐
│              CONCURRENCY CHEAT SHEET                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ JMM:                                                         │
│ • Problem: CPU caches → visibility, reordering, atomicity    │
│ • Solution: happens-before relationships                     │
│ • synchronized → visibility + atomicity + ordering           │
│ • volatile → visibility + ordering (NO atomicity)            │
│                                                              │
│ Happens-Before:                                              │
│ • Program order (within thread)                              │
│ • synchronized unlock → lock                                 │
│ • volatile write → read                                      │
│ • thread.start() → thread actions                            │
│ • thread actions → thread.join()                             │
│ • Transitive: A hb B, B hb C → A hb C                       │
│                                                              │
│ Synchronization:                                             │
│ • synchronized = simple, auto-release, good enough usually   │
│ • ReentrantLock = tryLock, timeout, fairness, conditions     │
│ • ReadWriteLock = read-heavy workload                        │
│ • Atomic = CAS, lock-free, single variable                   │
│ • LongAdder = high contention counter (faster than Atomic)   │
│                                                              │
│ Concurrency Problems:                                        │
│ • Race condition: 2+ threads + shared mutable state          │
│ • Deadlock: circular wait (4 Coffman conditions)             │
│ • Livelock: threads active but no progress                   │
│ • Starvation: thread never gets CPU time                     │
│                                                              │
│ CompletableFuture:                                           │
│ • supplyAsync = create                                       │
│ • thenApply = map (sync)                                     │
│ • thenCompose = flatMap (async)                              │
│ • thenCombine = combine 2 futures                            │
│ • allOf/anyOf = wait all/any                                 │
│ • exceptionally = error recovery                             │
│ • ⚠️ Use custom executor for I/O (not ForkJoinPool)          │
│                                                              │
│ Interview Traps:                                             │
│ • volatile count++ = NOT thread-safe                         │
│ • synchronized(this) = anyone can lock your object           │
│ • Future.get() = blocking (use CompletableFuture)            │
│ • Thread.run() ≠ Thread.start()                              │
│ • ThreadLocal + thread pool = memory leak                    │
│ • Default ForkJoinPool + blocking I/O = pool exhaustion      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 03 - JVM](../03-jvm/)
