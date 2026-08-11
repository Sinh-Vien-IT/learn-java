# 2.2 — Synchronization & Concurrent Utilities 🔴

> **Mục tiêu:** Hiểu sâu các cơ chế synchronization trong Java.
> Phân biệt synchronized vs Lock, biết khi nào dùng gì, hiểu Atomic classes.

---

## Mục Lục

1. [Race Condition & Critical Section](#1-race-condition--critical-section)
2. [synchronized](#2-synchronized)
3. [Lock & ReentrantLock](#3-lock--reentrantlock)
4. [ReadWriteLock](#4-readwritelock)
5. [Atomic Classes](#5-atomic-classes)
6. [Concurrent Utilities](#6-concurrent-utilities)
7. [Deadlock, Livelock, Starvation](#7-deadlock-livelock-starvation)
8. [Interview Questions](#8-interview-questions)

---

## 1. Race Condition & Critical Section 🔴

### Giải thích dễ hiểu

Race condition xảy ra khi 2+ threads access shared data đồng thời, và ít nhất 1 thread write. Kết quả phụ thuộc vào thứ tự execution — **non-deterministic**.

### Ví dụ kinh điển

```java
public class Counter {
    private int count = 0;
    
    public void increment() {
        count++; // KHÔNG atomic! Gồm 3 bước:
        // 1. READ:  temp = count     (đọc giá trị hiện tại)
        // 2. MODIFY: temp = temp + 1  (tăng)
        // 3. WRITE: count = temp      (ghi lại)
    }
}

// Thread A: READ count = 0
// Thread B: READ count = 0  ← cùng đọc 0!
// Thread A: WRITE count = 1
// Thread B: WRITE count = 1 ← lost update! Expected 2, got 1
```

### 3 vấn đề concurrency

| Vấn đề | Mô tả | Giải pháp |
|---------|--------|-----------|
| **Visibility** | Thread A write, Thread B không thấy | volatile, synchronized |
| **Atomicity** | Operation bị interrupt giữa chừng | synchronized, Atomic, Lock |
| **Ordering** | Instructions bị reorder | volatile, synchronized, happens-before |

---

## 2. synchronized 🔴

### Cách hoạt động

Mỗi object trong Java có 1 **monitor lock** (intrinsic lock). `synchronized` acquire lock trước khi enter, release khi exit.

```java
public class SafeCounter {
    private int count = 0;
    
    // Method-level: lock trên 'this' object
    public synchronized void increment() {
        count++;
    }
    
    // Block-level: lock trên specific object
    private final Object lock = new Object();
    public void incrementV2() {
        synchronized (lock) { // chỉ lock block này
            count++;
        }
    }
    
    // Static method: lock trên Class object
    private static int globalCount = 0;
    public static synchronized void globalIncrement() {
        globalCount++; // lock trên SafeCounter.class
    }
}
```

### ⚠️ synchronized(this) vs synchronized(lock)

```java
// ❌ synchronized(this) — anyone có reference đều có thể lock
public class Service {
    public synchronized void methodA() { /* ... */ }
}
// Bên ngoài: synchronized(service) { ... } → BLOCK methodA()!

// ✅ Private lock object — chỉ class mình control
public class Service {
    private final Object lock = new Object();
    public void methodA() {
        synchronized (lock) { /* ... */ }
    }
}
```

### synchronized đảm bảo gì?

1. **Mutual exclusion** — chỉ 1 thread vào critical section
2. **Visibility** — changes visible cho thread tiếp theo acquire lock
3. **Ordering** — happens-before relationship

---

## 3. Lock & ReentrantLock 🔴

### Tại sao cần Lock khi đã có synchronized?

| Feature | synchronized | ReentrantLock |
|---------|-------------|---------------|
| Release | Tự động (exit block/method) | Manual: `lock.unlock()` |
| Try lock | ❌ | ✅ `tryLock()` |
| Timeout | ❌ (block forever) | ✅ `tryLock(time)` |
| Interruptible | ❌ | ✅ `lockInterruptibly()` |
| Fairness | ❌ (unfair) | ✅ Option fair/unfair |
| Multiple conditions | 1 wait set | Multiple `Condition` objects |
| Performance | Tương đương (JVM optimized) | Tương đương |

### ReentrantLock usage

```java
public class SafeCounter {
    private int count = 0;
    private final ReentrantLock lock = new ReentrantLock();
    
    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock(); // PHẢI unlock trong finally!
        }
    }
    
    // tryLock — non-blocking
    public boolean tryIncrement() {
        if (lock.tryLock()) {
            try {
                count++;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false; // lock không available → return false thay vì block
    }
    
    // tryLock with timeout
    public boolean tryIncrementWithTimeout() throws InterruptedException {
        if (lock.tryLock(100, TimeUnit.MILLISECONDS)) {
            try {
                count++;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false; // timeout
    }
}
```

### "Reentrant" nghĩa gì?

```java
// Thread có thể acquire cùng lock nhiều lần (re-enter)
ReentrantLock lock = new ReentrantLock();

public void methodA() {
    lock.lock();      // hold count = 1
    try {
        methodB();    // gọi methodB cũng cần lock
    } finally {
        lock.unlock(); // hold count = 0 → released
    }
}

public void methodB() {
    lock.lock();      // hold count = 2 (same thread, OK!)
    try {
        // ...
    } finally {
        lock.unlock(); // hold count = 1
    }
}

// synchronized cũng reentrant!
public synchronized void a() { b(); }
public synchronized void b() { /* OK, same thread */ }
```

### Condition — Advanced wait/notify

```java
public class BoundedBuffer<T> {
    private final Queue<T> queue = new LinkedList<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();
    
    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (queue.size() == capacity) {
                notFull.await(); // chờ không full
            }
            queue.add(item);
            notEmpty.signal(); // thông báo consumer
        } finally {
            lock.unlock();
        }
    }
    
    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) {
                notEmpty.await(); // chờ có data
            }
            T item = queue.poll();
            notFull.signal(); // thông báo producer
            return item;
        } finally {
            lock.unlock();
        }
    }
}
```

---

## 4. ReadWriteLock 🟠

### Khi nào dùng?

Khi **read >> write** — cho phép nhiều readers đồng thời, chỉ exclusive khi write.

```java
public class ThreadSafeCache<K, V> {
    private final Map<K, V> cache = new HashMap<>();
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    
    public V get(K key) {
        readLock.lock();         // Multiple readers OK
        try {
            return cache.get(key);
        } finally {
            readLock.unlock();
        }
    }
    
    public void put(K key, V value) {
        writeLock.lock();        // Exclusive — block all readers + writers
        try {
            cache.put(key, value);
        } finally {
            writeLock.unlock();
        }
    }
}
```

### Locking rules

```
Reader ↔ Reader:  ✅ Concurrent (cùng đọc OK)
Reader ↔ Writer:  ❌ Exclusive (reader phải chờ writer, writer phải chờ reader)
Writer ↔ Writer:  ❌ Exclusive
```

### Production note

> "Trong thực tế tôi hiếm khi dùng ReadWriteLock trực tiếp. Cho simple cache, dùng ConcurrentHashMap. Cho complex cache, dùng Caffeine/Guava Cache. ReadWriteLock chỉ dùng khi cần custom read-heavy data structure."

---

## 5. Atomic Classes 🔴

### CAS — Compare-And-Swap

```
CAS flow:
1. Đọc current value
2. Tính new value
3. CAS: "nếu current value vẫn bằng expected value → set new value"
   → Nếu thành công → done
   → Nếu thất bại (thread khác đã thay đổi) → retry

Ưu điểm: lock-free, không blocking
Nhược điểm: spin (retry) nếu contention cao → waste CPU
```

### AtomicInteger

```java
AtomicInteger count = new AtomicInteger(0);

count.incrementAndGet();  // ++count (atomic)
count.getAndIncrement();  // count++ (atomic)
count.addAndGet(5);       // count += 5 (atomic)
count.compareAndSet(5, 10); // if count == 5, set to 10 (CAS)
count.updateAndGet(x -> x * 2); // atomic transform
```

### AtomicReference

```java
AtomicReference<User> currentUser = new AtomicReference<>(null);

// Atomic update
User oldUser = currentUser.get();
User newUser = new User("John");
boolean success = currentUser.compareAndSet(oldUser, newUser);

// Atomic transform
currentUser.updateAndGet(user -> user.withName("Jane"));
```

### LongAdder — High contention counter 🔴

```java
// AtomicLong: 1 value, tất cả threads CAS vào → contention high
// LongAdder: chia ra nhiều cells, mỗi thread add vào cell riêng → aggregate khi sum()

LongAdder adder = new LongAdder();
adder.increment();       // distributed across cells
long total = adder.sum(); // aggregate all cells

// Production use: metrics counters
// 3-4x faster than AtomicLong under high contention
```

### Khi nào dùng Atomic vs synchronized?

| Scenario | Dùng | Lý do |
|----------|------|-------|
| Single variable update | Atomic | Lock-free, fast |
| Multiple variables cần consistent | synchronized/Lock | Atomic chỉ cho 1 variable |
| Simple counter | LongAdder | Best performance |
| Complex state | synchronized/Lock | Easier to reason about |

---

## 6. Concurrent Utilities 🟠

### Semaphore — Giới hạn concurrent access

```java
// Cho phép tối đa N threads access đồng thời
Semaphore semaphore = new Semaphore(10); // max 10 concurrent

public void accessResource() throws InterruptedException {
    semaphore.acquire(); // decrement permit, block nếu 0
    try {
        // access shared resource
    } finally {
        semaphore.release(); // increment permit
    }
}

// Production use: rate limiting, connection pool sizing
```

### CountDownLatch — Chờ N events hoàn thành

```java
// One-shot: đếm ngược từ N về 0, không reset được
CountDownLatch latch = new CountDownLatch(3);

// Worker threads
for (int i = 0; i < 3; i++) {
    executor.submit(() -> {
        doWork();
        latch.countDown(); // N-1
    });
}

latch.await(); // Block cho đến khi count = 0
// Tất cả 3 workers done!

// Production use: 
// - Chờ tất cả services initialize
// - Chờ parallel tasks hoàn thành
// - Testing: coordinate thread start
```

### CyclicBarrier — Synchronization point tái sử dụng

```java
// Reusable: tất cả threads phải đến barrier trước khi tiếp tục
CyclicBarrier barrier = new CyclicBarrier(3, () -> {
    System.out.println("All 3 threads reached barrier");
});

// Mỗi thread:
executor.submit(() -> {
    phase1Work();
    barrier.await(); // chờ tất cả threads xong phase 1
    phase2Work();
    barrier.await(); // chờ tất cả xong phase 2 (reusable!)
});

// Use: phased computation, parallel matrix operations
```

### CountDownLatch vs CyclicBarrier

| Feature | CountDownLatch | CyclicBarrier |
|---------|----------------|---------------|
| Reusable | ❌ One-shot | ✅ Reusable |
| Role | 1 waiter, N workers | N peers synchronize |
| Reset | ❌ | ✅ auto reset |
| Action on complete | ❌ | ✅ Optional Runnable |

---

## 7. Deadlock, Livelock, Starvation 🔴

### Deadlock

```java
// Thread 1: lock A → try lock B
// Thread 2: lock B → try lock A
// → Cả 2 chờ nhau FOREVER

Object lockA = new Object();
Object lockB = new Object();

// Thread 1
synchronized (lockA) {      // acquired A
    Thread.sleep(100);
    synchronized (lockB) {   // waiting for B (held by Thread 2)
        // never reached
    }
}

// Thread 2
synchronized (lockB) {      // acquired B
    Thread.sleep(100);
    synchronized (lockA) {   // waiting for A (held by Thread 1)
        // never reached
    }
}
```

### 4 điều kiện deadlock (Coffman conditions)

1. **Mutual exclusion** — resource chỉ 1 thread dùng tại 1 thời điểm
2. **Hold and wait** — thread hold resource và chờ resource khác
3. **No preemption** — không ai force release
4. **Circular wait** — A chờ B, B chờ A

### Prevention

```java
// 1. Lock ordering — luôn acquire locks theo thứ tự cố định
// Thread 1 và 2 đều: lock A trước, lock B sau → no circular wait

// 2. Try-lock with timeout
if (lock1.tryLock(100, TimeUnit.MILLISECONDS)) {
    try {
        if (lock2.tryLock(100, TimeUnit.MILLISECONDS)) {
            try { /* work */ }
            finally { lock2.unlock(); }
        }
    } finally { lock1.unlock(); }
}

// 3. Giảm lock scope — lock ít nhất có thể
```

### Livelock

```java
// Threads liên tục thay đổi state nhưng không tiến triển
// Ví dụ: 2 người đi ngược chiều hành lang, cả 2 cùng nhường sang phải,
// rồi cùng nhường sang trái, liên tục không ai qua được

// Prevention: thêm random backoff
```

### Starvation

```
Thread priority thấp liên tục bị preempted bởi threads priority cao → không bao giờ chạy.
Prevention: fair lock, đừng dùng thread priority.
```

### Production: Detect deadlock

```bash
# Thread dump — xem threads đang lock gì, chờ gì
jstack <pid>

# Output sẽ show:
# "Found one Java-level deadlock:"
# Thread 1: locked 0x000... waiting for 0x001...
# Thread 2: locked 0x001... waiting for 0x000...
```

→ Chi tiết: [Module 03 - JVM Troubleshooting](../03-jvm/03-troubleshooting.md)

---

## 8. Interview Questions

### Q1: "synchronized vs ReentrantLock?" 🔴

#### Strong answer
> "Cả hai đều mutual exclusion, reentrant. synchronized đơn giản hơn, auto-release, JVM optimize tốt. ReentrantLock flexible hơn: tryLock (non-blocking), timeout, interruptible, fair mode, multiple conditions.
>
> Rule of thumb: dùng synchronized khi đủ. ReentrantLock khi cần tryLock, timeout, hoặc multiple conditions. Trong production tôi dùng synchronized cho simple cases, ReentrantLock cho distributed locking patterns hoặc complex wait/notify."

---

### Q2: "Race condition là gì? Cho ví dụ?" 🔴

#### Strong answer
> "Race condition khi kết quả phụ thuộc vào thứ tự execution — non-deterministic. Classic example: `count++` — gồm read, increment, write — 2 threads cùng read → cùng value → lost update.
>
> Production example tôi gặp: 2 requests cùng check inventory > 0, cùng decrement → inventory âm. Fix: optimistic locking `UPDATE inventory SET qty = qty - 1 WHERE id = ? AND qty > 0` hoặc distributed lock."

---

### Q3: "Deadlock xử lý thế nào?" 🔴

#### Strong answer
> "Detection: thread dump bằng jstack — JVM auto-detect deadlock. Prevention: (1) lock ordering — luôn acquire theo thứ tự cố định, (2) tryLock with timeout — tránh block vĩnh viễn, (3) giảm lock scope.
>
> Trong database deadlock: DB tự detect và kill 1 transaction. Application cần retry logic. Trong production, tôi thêm monitoring cho lock acquisition time — nếu tăng là dấu hiệu sắp deadlock."

---

### Q4: "AtomicInteger hoạt động thế nào?" 🔴

#### Strong answer
> "Dùng CAS — Compare And Swap. Đọc current value, tính new value, CAS instruction: 'nếu memory vẫn bằng expected, set to new' — CPU-level atomic operation. Nếu thất bại (thread khác đã modify) → retry.
>
> Ưu điểm: lock-free, không blocking. Nhược điểm: high contention → spin waste CPU. Cho high contention counters, dùng LongAdder — chia ra nhiều cells, mỗi thread add vào cell riêng, aggregate khi sum(). LongAdder 3-4x nhanh hơn AtomicLong under contention."

---

### Q5: "Semaphore dùng khi nào?" 🟠

#### Strong answer
> "Khi cần giới hạn concurrent access. Ví dụ: rate limiter — max 100 concurrent API calls. Connection pool — max 50 connections. Khác mutex (semaphore(1)): semaphore cho phép N concurrent, mutex chỉ 1."

---

> → Tiếp theo: [03-java-memory-model.md](./03-java-memory-model.md)
