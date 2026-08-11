# 1.3 — Collections Deep Dive 🔴

> **Mục tiêu:** Hiểu Collections không chỉ ở level "dùng cái nào" mà ở level "hoạt động thế nào bên trong".
> HashMap internals là câu hỏi phỏng vấn KINH ĐIỂN — phải nắm cực kỳ vững.

---

## Mục Lục

1. [Collections Overview](#1-collections-overview)
2. [List: ArrayList vs LinkedList](#2-list-arraylist-vs-linkedlist)
3. [Map: HashMap Deep Dive](#3-map-hashmap-deep-dive)
4. [Map: LinkedHashMap, TreeMap](#4-map-linkedhashmap-treemap)
5. [Set: HashSet, TreeSet](#5-set-hashset-treeset)
6. [Queue, Deque, PriorityQueue](#6-queue-deque-priorityqueue)
7. [ConcurrentHashMap](#7-concurrenthashmap)
8. [Interview Questions](#8-interview-questions)
9. [Cheat Sheet](#9-cheat-sheet)

---

## 1. Collections Overview 🔴

### Collections Framework Hierarchy

```
                    Iterable
                       │
                   Collection
                 /     |      \
              List    Set     Queue
              /        |        \
        ArrayList   HashSet   LinkedList (cũng là List)
        LinkedList  TreeSet   PriorityQueue
        Vector      LinkedHashSet  ArrayDeque
                       
                    Map (separate hierarchy)
                   /    |     \
            HashMap  TreeMap  LinkedHashMap
                              ConcurrentHashMap
```

### Chọn Collection nào?

```
Cần giữ thứ tự insert?
├── Có → Cần access by index?
│       ├── Có → ArrayList
│       └── Không → LinkedList (nếu insert/delete nhiều ở giữa)
│
Cần unique elements?
├── Có → Cần sorted?
│       ├── Có → TreeSet (O(log n))
│       └── Không → Cần giữ insert order?
│               ├── Có → LinkedHashSet
│               └── Không → HashSet (O(1))
│
Cần key-value mapping?
├── Có → Cần sorted by key?
│       ├── Có → TreeMap
│       └── Không → Cần insert order?
│               ├── Có → LinkedHashMap
│               └── Không → Cần thread-safe?
│                       ├── Có → ConcurrentHashMap
│                       └── Không → HashMap
│
Cần FIFO?
├── Có → Cần priority?
│       ├── Có → PriorityQueue
│       └── Không → ArrayDeque (nhanh hơn LinkedList cho Queue)
```

---

## 2. List: ArrayList vs LinkedList 🔴

### ArrayList — Dynamic Array

**Internal structure:**
```java
// Simplified ArrayList internals
public class ArrayList<E> {
    transient Object[] elementData; // backing array
    private int size;              // actual number of elements
    
    // Default capacity = 10
    // Grow: khi full → tạo array mới size 1.5x → copy tất cả elements
}
```

**Complexity:**
| Operation | Complexity | Notes |
|-----------|-----------|-------|
| get(i) | O(1) | Direct index access |
| add(e) | O(1) amortized | O(n) khi resize |
| add(i, e) | O(n) | Shift elements right |
| remove(i) | O(n) | Shift elements left |
| contains(e) | O(n) | Linear scan |
| size() | O(1) | |

### LinkedList — Doubly Linked List

**Internal structure:**
```java
// Simplified LinkedList internals
public class LinkedList<E> {
    Node<E> first;
    Node<E> last;
    int size;
    
    static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;
    }
}
```

**Complexity:**
| Operation | Complexity | Notes |
|-----------|-----------|-------|
| get(i) | O(n) | Traverse from head/tail |
| add(e) | O(1) | Append to tail |
| add(i, e) | O(n) | Find position + O(1) link |
| remove(i) | O(n) | Find position + O(1) unlink |
| addFirst/Last | O(1) | |

### So sánh thực tế

| Tiêu chí | ArrayList | LinkedList |
|-----------|-----------|------------|
| Random access | ✅ Rất nhanh | ❌ Chậm |
| Memory | Ít hơn (chỉ array) | Nhiều hơn (mỗi node 3 pointers) |
| Cache locality | ✅ Tốt (contiguous memory) | ❌ Kém (scattered) |
| Insert ở giữa | O(n) shift | O(n) traverse + O(1) insert |
| Iteration | Nhanh | Chậm (pointer chasing) |

### Khi nào dùng LinkedList?

> **Hầu như KHÔNG BAO GIỜ trong production.** ArrayList nhanh hơn cho hầu hết use cases nhờ CPU cache locality. LinkedList chỉ có ưu thế lý thuyết ở insert/remove ở giữa, nhưng thực tế traverse đến vị trí đó đã O(n) rồi.

**Chỉ dùng LinkedList khi:**
- Implement Queue/Deque (nhưng `ArrayDeque` thường nhanh hơn)
- Thực sự cần O(1) insert/remove ở head/tail và có iterator đang ở vị trí đó

**Interview answer:**
> "Trong thực tế tôi gần như luôn dùng ArrayList. LinkedList có overhead lớn về memory (3 pointers per node) và cache locality kém. Chỉ khi cần Queue behavior thì dùng ArrayDeque. Tôi chưa gặp case nào trong production mà LinkedList là choice đúng."

---

## 3. Map: HashMap Deep Dive 🔴🔴🔴

> **ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CỦA MODULE NÀY.**
> HashMap internals là câu hỏi phỏng vấn được hỏi nhiều nhất cho Java engineer.

### 3.1 Cấu Trúc Bên Trong

```
HashMap internal structure (Java 8+):
                    
    table[] (Node array)
    ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
    │  0  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  ← buckets
    └──┬──┴─────┴──┬──┴─────┴──┬──┴─────┴──┬──┴─────┘
       │           │           │           │
       ▼           ▼           ▼           ▼
    [K:A,V:1]   [K:C,V:3]  [K:E,V:5]  [K:G,V:7]
       │                      │
       ▼                      ▼
    [K:B,V:2]              [K:F,V:6]   ← linked list (collision chain)
       │
       ▼
    (nếu chain > 8 → chuyển sang Red-Black Tree)
```

### 3.2 put() — Từng Bước Chi Tiết

```java
map.put(key, value);
```

**Step 1: Hash the key**
```java
// HashMap.hash() — NOT key.hashCode() directly
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    // XOR high bits với low bits → spread hash more evenly
    // Gọi là "perturbation function"
}
```

**Tại sao XOR với upper 16 bits?**
> Vì bucket index = `hash & (n-1)` (n = table size, luôn power of 2). Nếu n nhỏ (ví dụ 16), chỉ 4 low bits quyết định bucket. XOR upper bits vào đảm bảo high bits cũng ảnh hưởng → giảm collision.

**Step 2: Tìm bucket index**
```java
int index = hash & (table.length - 1);
// Equivalent to: hash % table.length (khi table.length là power of 2)
// Dùng bitwise AND nhanh hơn modulo
```

**Step 3: Check bucket**
- **Bucket rỗng:** Tạo Node mới, đặt vào bucket → done
- **Bucket có data:** Collision → Step 4

**Step 4: Handle collision**
```java
// Traverse linked list (hoặc tree)
for (each node in chain) {
    if (node.hash == hash && (node.key == key || key.equals(node.key))) {
        // Key đã tồn tại → UPDATE value
        node.value = newValue;
        return oldValue;
    }
}
// Key chưa tồn tại → ADD new node to end of chain
```

**Step 5: Check treeification**
```java
// Nếu chain length > TREEIFY_THRESHOLD (8)
// VÀ table size >= MIN_TREEIFY_CAPACITY (64)
// → Convert linked list → Red-Black Tree
// Tại sao? Linked list O(n) → Tree O(log n) cho lookup
```

**Step 6: Check resize**
```java
if (++size > threshold) { // threshold = capacity * loadFactor
    resize(); // double capacity, rehash ALL entries
}
```

### 3.3 get() — Flow

```java
map.get(key);

// 1. hash(key) → find bucket index
// 2. Check first node in bucket
// 3. If match (hash + equals) → return value
// 4. If chain → traverse (linked list or tree)
// 5. Not found → return null
```

### 3.4 Resize (Rehashing) 🔴

```
Trước resize (capacity=4, loadFactor=0.75, threshold=3):
┌─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │
└──┬──┴──┬──┴──┬──┴─────┘
   ▼     ▼     ▼
  [A]   [B]   [C]    ← 3 entries = threshold → RESIZE!

Sau resize (capacity=8, threshold=6):
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │
└──┬──┴──┬──┴──┬──┴─────┴─────┴─────┴─────┴─────┘
   ▼     ▼     ▼
  [A]   [B]   [C]    ← rehashed to new positions
```

**Resize cost:**
- Tạo array mới gấp đôi
- Rehash MỌI entry (recalculate index cho capacity mới)
- **O(n)** — expensive!

**Production impact:**
> "Nếu bạn biết trước HashMap sẽ chứa 10,000 entries, initialize capacity: `new HashMap<>(13334)` (10000/0.75 + 1, round to power of 2). Tránh multiple resizes."

### 3.5 Load Factor 🔴

```
Default loadFactor = 0.75

Low loadFactor (0.5):
  → Nhiều bucket trống → ít collision → nhanh hơn
  → Nhưng waste memory
  → Resize sớm hơn

High loadFactor (1.0):
  → Ít bucket trống → nhiều collision → chậm hơn
  → Tiết kiệm memory
  → Resize muộn hơn

0.75 = balance giữa time và space complexity
```

### 3.6 Treeification (Java 8+) 🔴

```
Khi collision chain > 8 nodes VÀ table >= 64:

Linked List:          →  Red-Black Tree:
[A] → [B] → [C]...        [D]
(O(n) lookup)             /   \
                        [B]   [F]
                       / \   / \
                     [A] [C][E] [G]
                     (O(log n) lookup)

Khi tree shrinks < 6 nodes → convert back to linked list
```

**Tại sao threshold là 8?**
> Với good hash function, probability collision chain > 8 là ~0.00000006 (Poisson distribution). Nên thực tế rất hiếm khi tree hóa. Nếu xảy ra thường xuyên → bad hashCode() implementation.

### 3.7 HashMap Concurrency Problem 🔴

```java
// HashMap KHÔNG thread-safe!

// Java 7: Concurrent put → infinite loop (linked list cycle do resize)
// Java 8: Fixed infinite loop nhưng vẫn:
// - Lost updates
// - Corrupted data
// - ConcurrentModificationException khi iterate

// ❌ NEVER
Map<String, Integer> map = new HashMap<>();
// 2 threads cùng put() → UNDEFINED BEHAVIOR

// ✅ Options:
// 1. ConcurrentHashMap (best performance)
Map<String, Integer> map = new ConcurrentHashMap<>();

// 2. synchronized wrapper (kém hơn)
Map<String, Integer> map = Collections.synchronizedMap(new HashMap<>());

// 3. Lock manually
```

→ Chi tiết ConcurrentHashMap: [Section 7](#7-concurrenthashmap)

### 3.8 HashMap null handling

```java
HashMap<String, String> map = new HashMap<>();
map.put(null, "value");    // ✅ OK — null key đặt ở bucket 0
map.put("key", null);       // ✅ OK — null value

// ConcurrentHashMap
ConcurrentHashMap<String, String> cmap = new ConcurrentHashMap<>();
cmap.put(null, "value");    // ❌ NPE!
cmap.put("key", null);      // ❌ NPE!
// ConcurrentHashMap KHÔNG cho phép null key hoặc null value
```

### 3.9 Complete HashMap Flow Diagram

```
put(key, value)
    │
    ▼
hash = key.hashCode() ^ (key.hashCode() >>> 16)
    │
    ▼
index = hash & (table.length - 1)
    │
    ▼
table[index] == null? ──── Yes ──→ Create new Node → DONE
    │                                                  │
    No                                                 ▼
    │                                        size > threshold?
    ▼                                            │
Traverse chain                              Yes → resize()
    │                                        No → DONE
    ▼
key exists? (hash == && equals())
    │           │
   Yes         No
    │           │
    ▼           ▼
Update      Add to chain
value           │
    │           ▼
    │     chainLength > 8?
    │       │        │
    │      Yes      No
    │       │        │
    │       ▼        │
    │   Treeify      │
    │       │        │
    ▼       ▼        ▼
    size > threshold? ──── Yes ──→ resize()
         │
         No → DONE
```

---

## 4. Map: LinkedHashMap, TreeMap 🟠

### LinkedHashMap

```java
// HashMap + Doubly Linked List → maintain insertion order
Map<String, Integer> map = new LinkedHashMap<>();
map.put("B", 2);
map.put("A", 1);
map.put("C", 3);
// Iteration: B → A → C (insertion order)

// Access-order mode: cho LRU Cache
Map<String, Integer> lruCache = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, Integer> eldest) {
        return size() > MAX_CACHE_SIZE; // auto-evict oldest
    }
};
```

**Production use:** Simple LRU cache (trước khi dùng Caffeine/Guava Cache)

### TreeMap

```java
// Red-Black Tree → sorted by key
Map<String, Integer> map = new TreeMap<>();
map.put("C", 3);
map.put("A", 1);
map.put("B", 2);
// Iteration: A → B → C (natural order)

// Custom comparator
Map<String, Integer> map = new TreeMap<>(Comparator.reverseOrder());
// C → B → A

// Range operations
TreeMap<Integer, String> scores = new TreeMap<>();
scores.subMap(60, 90);   // entries with key [60, 90)
scores.headMap(60);       // entries with key < 60
scores.tailMap(90);       // entries with key >= 90
scores.firstKey();        // smallest key
scores.lastKey();         // largest key
```

| Feature | HashMap | LinkedHashMap | TreeMap |
|---------|---------|---------------|---------|
| Order | None | Insertion/Access | Sorted (natural/comparator) |
| get/put | O(1) | O(1) | O(log n) |
| Null key | ✅ | ✅ | ❌ (nếu dùng Comparable) |
| Implementation | Array + List/Tree | HashMap + DLinkedList | Red-Black Tree |

---

## 5. Set: HashSet, TreeSet 🟠

### HashSet — backed by HashMap

```java
// HashSet internally dùng HashMap!
public class HashSet<E> {
    private transient HashMap<E, Object> map;
    private static final Object PRESENT = new Object(); // dummy value
    
    public boolean add(E e) {
        return map.put(e, PRESENT) == null;
    }
}
// → Mọi đặc tính HashMap áp dụng cho HashSet
// → equals/hashCode contract áp dụng cho elements
```

### TreeSet — backed by TreeMap

```java
// Sorted, O(log n) operations
Set<Integer> set = new TreeSet<>();
set.add(3);
set.add(1);
set.add(2);
// Iteration: 1 → 2 → 3

// Production use: maintain sorted list of timestamps, scores, etc.
```

---

## 6. Queue, Deque, PriorityQueue 🟠

### Queue Interface

```java
// FIFO: First In, First Out
Queue<String> queue = new LinkedList<>();
// Better: 
Queue<String> queue = new ArrayDeque<>(); // faster, no overhead of linked nodes

queue.offer("A");   // add to tail (return false if full — for bounded queues)
queue.add("B");     // add to tail (throw exception if full)
queue.poll();       // remove from head (return null if empty)
queue.remove();     // remove from head (throw exception if empty)
queue.peek();       // view head without removing (return null if empty)
```

### Deque (Double-Ended Queue)

```java
Deque<String> deque = new ArrayDeque<>();

// As Queue (FIFO)
deque.offerLast("A");   // add to tail
deque.pollFirst();       // remove from head

// As Stack (LIFO)  
deque.push("A");         // add to head
deque.pop();             // remove from head

// ✅ Prefer ArrayDeque over Stack class (legacy, synchronized, extends Vector)
```

### PriorityQueue — Heap

```java
// Min-heap by default
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(3);
minHeap.offer(1);
minHeap.offer(2);
minHeap.poll(); // 1 (smallest)
minHeap.poll(); // 2
minHeap.poll(); // 3

// Max-heap
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

// Production use: task scheduling by priority, top-K problems
// Complexity: offer/poll = O(log n), peek = O(1)
```

**⚠️ PriorityQueue iterator KHÔNG guarantee sorted order!** Chỉ `poll()` guarantee.

---

## 7. ConcurrentHashMap 🔴

### Tại sao cần ConcurrentHashMap?

```java
// HashMap: NOT thread-safe → data corruption
// Collections.synchronizedMap: toàn bộ map bị lock → poor concurrency
// ConcurrentHashMap: fine-grained locking → high concurrency
```

### Java 8+ Implementation

```
ConcurrentHashMap (Java 8+):

┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │
└──┬──┴──┬──┴──┬──┴──┬──┴─────┴─────┴─────┴─────┘
   │     │     │     │
   ▼     ▼     ▼     ▼
  [A]   [B]   [C]   [D]
   │                  │
   ▼                  ▼
  [E]                [F]

Lock per bucket (CAS + synchronized on node):
Thread1 put ở bucket 0 → lock bucket 0 ONLY
Thread2 put ở bucket 3 → lock bucket 3 ONLY → CONCURRENT!
Thread3 get → NO lock needed (volatile reads)
```

### Key mechanisms

**1. CAS (Compare-And-Swap) cho empty bucket:**
```java
// Nếu bucket empty → dùng CAS, không cần lock
// CAS: "nếu bucket vẫn null thì set = new node, atomically"
```

**2. synchronized trên first node cho non-empty bucket:**
```java
// Nếu bucket có data → synchronized(firstNode) 
// Chỉ lock 1 bucket, không phải toàn bộ map
```

**3. Volatile reads cho get():**
```java
// get() KHÔNG cần lock
// Node.val và Node.next đều volatile → visibility guaranteed
```

### So sánh

| Feature | HashMap | synchronizedMap | ConcurrentHashMap |
|---------|---------|-----------------|-------------------|
| Thread-safe | ❌ | ✅ (toàn bộ lock) | ✅ (fine-grained) |
| Null key/value | ✅ | ✅ | ❌ |
| Read performance | O(1) | O(1) + lock overhead | O(1) volatile read |
| Write concurrency | N/A | 1 writer at a time | Many writers (per bucket) |
| Iterator | Fail-fast | Fail-fast | Weakly consistent |

### ConcurrentHashMap.compute() — Atomic operations 🔴

```java
ConcurrentHashMap<String, AtomicInteger> counters = new ConcurrentHashMap<>();

// ❌ NOT atomic — race condition
Integer count = counters.get(key);
counters.put(key, count + 1);

// ✅ Atomic compound operation
counters.compute(key, (k, v) -> v == null ? new AtomicInteger(1) : { v.incrementAndGet(); return v; });

// ✅ Simpler alternatives
counters.merge(key, 1, Integer::sum);
counters.computeIfAbsent(key, k -> new AtomicInteger()).incrementAndGet();
```

### Production use cases

```java
// 1. Thread-safe cache
ConcurrentHashMap<String, User> userCache = new ConcurrentHashMap<>();
userCache.computeIfAbsent(userId, id -> userRepository.findById(id));

// 2. Concurrent counters
ConcurrentHashMap<String, LongAdder> metrics = new ConcurrentHashMap<>();
metrics.computeIfAbsent("requests", k -> new LongAdder()).increment();

// 3. Rate limiting
ConcurrentHashMap<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
```

---

## 8. Interview Questions

### Q1: "HashMap hoạt động thế nào?" 🔴🔴🔴

#### What interviewer is testing
Deep understanding of data structure internals. Đây là câu hỏi #1 cho Java interview.

#### Short answer (30 giây)
> "HashMap dùng array of buckets. put() hash key để tìm bucket index, nếu collision thì chain bằng linked list, Java 8+ chuyển sang red-black tree khi chain > 8. Load factor 0.75, resize gấp đôi khi vượt threshold."

#### Strong answer (Senior — 2 phút)
> "HashMap internal là array of Node, mỗi Node chứa hash, key, value, next pointer.
>
> Khi put(key, value): đầu tiên hash key bằng perturbation function — XOR hashCode upper 16 bits vào lower bits để spread evenly. Sau đó tính bucket index bằng `hash & (capacity - 1)` — dùng bitwise AND thay modulo vì capacity luôn power of 2.
>
> Nếu bucket empty → tạo Node mới. Nếu collision → traverse chain, check `hash ==` trước rồi `equals()`. Key tồn tại → update value. Key mới → append to chain.
>
> Java 8 optimization: khi chain > 8 nodes VÀ table >= 64 → treeify thành red-black tree, giảm worst case từ O(n) xuống O(log n). Khi tree shrink < 6 → untreeify.
>
> Resize khi `size > capacity * loadFactor`. Default loadFactor 0.75 = balance time/space. Resize = allocate double capacity + rehash mọi entry — O(n), expensive.
>
> HashMap KHÔNG thread-safe. Concurrent put có thể gây lost update, corrupted data. Production cần thread-safe → ConcurrentHashMap."

#### Deep answer (cho follow-up sâu)
> *(Thêm vào Strong answer:)*
> "Về perturbation function: `h ^ (h >>> 16)` — lý do là capacity thường nhỏ (16, 32, 64), nên chỉ vài low bits quyết định bucket. XOR high bits vào đảm bảo toàn bộ hashCode ảnh hưởng distribution.
>
> Treeify threshold 8 dựa trên Poisson distribution — với load factor 0.75, probability bucket có > 8 entries ~0.00000006. Nếu thường xuyên treeify → hashCode() implementation tệ.
>
> Java 8 thêm optimization cho resize: mỗi node chỉ cần check 1 bit (hash & oldCapacity) để quyết định ở bucket cũ hay bucket mới = oldIndex + oldCapacity. Không cần recalculate index.
>
> Null key luôn map vào bucket 0, hash = 0."

#### Follow-up questions
1. **"Tại sao capacity phải là power of 2?"**
> "Để dùng `hash & (n-1)` thay vì `hash % n`. Bitwise AND nhanh hơn modulo rất nhiều. Và khi n = power of 2, `n-1` có tất cả bits = 1 → perfect mask."

2. **"Collision chain O(n) có xảy ra production không?"**
> "Rất hiếm với good hashCode. Nhưng có thể bị exploit: attacker craft keys có cùng hashCode → DDoS bằng hash collision. Java 8 treeify giảm attack impact từ O(n) xuống O(log n)."

3. **"Resize impact performance thế nào?"**
> "Resize O(n) gây latency spike. Trong production, nếu biết trước size thì init capacity: `new HashMap<>((int)(expectedSize / 0.75f) + 1)`. Trong hot path, avoid HashMap tự resize."

4. **"HashMap vs Hashtable?"**
> "Hashtable legacy, synchronized toàn bộ → chậm, không cho null key/value. Dùng ConcurrentHashMap thay Hashtable. HashMap cho single-thread, ConcurrentHashMap cho multi-thread."

#### Common mistakes
1. Nói "HashMap dùng LinkedList" mà quên Java 8 treeification
2. Không biết perturbation function — chỉ nói "dùng hashCode()"
3. Không mention load factor và resize
4. Nói "HashMap thread-safe nếu chỉ read" — sai nếu có concurrent write

#### What makes this Senior-level?
- Biết perturbation function chi tiết
- Biết treeification threshold và lý do (Poisson distribution)
- Mention production implications (pre-size, concurrency)
- Biết Java 8 resize optimization

#### What makes this Tech Lead-level?
- Biết hash collision attack scenario
- Discuss capacity planning cho HashMap trong high-performance code
- Recommend ConcurrentHashMap với lý do cụ thể
- Mention monitoring/profiling để detect poor hash distribution

---

### Q2: "ArrayList vs LinkedList — khi nào dùng cái nào?" 🔴

#### Strong answer
> "Hầu như luôn ArrayList. LinkedList thua ArrayList ở hầu hết operations vì 2 lý do: memory overhead (3 pointers per node) và poor cache locality (scattered memory → CPU cache miss).
>
> Lý thuyết nói LinkedList O(1) insert ở giữa, nhưng thực tế phải traverse O(n) để tìm vị trí — nên tổng vẫn O(n). ArrayList shift elements cũng O(n) nhưng dùng System.arraycopy (native, optimized) + contiguous memory = nhanh hơn.
>
> Tôi chỉ dùng LinkedList khi cần Queue/Deque behavior, nhưng thực tế ArrayDeque còn nhanh hơn LinkedList cho cả Queue use case."

---

### Q3: "HashSet hoạt động thế nào?" 🟠

#### Strong answer
> "HashSet internally dùng HashMap. Element của Set là key của HashMap, value là dummy constant object `PRESENT`. Nên mọi đặc tính HashMap áp dụng: O(1) add/remove/contains, cần equals/hashCode đúng, không thread-safe."

---

### Q4: "ConcurrentHashMap vs Collections.synchronizedMap?" 🔴

#### Strong answer
> "synchronizedMap wrap toàn bộ HashMap bằng synchronized — mọi operation lock toàn bộ map → chỉ 1 thread access tại 1 thời điểm → bottleneck.
>
> ConcurrentHashMap dùng fine-grained locking: Java 8+ lock per bucket (CAS cho empty bucket, synchronized trên first node cho non-empty). Nhiều threads có thể read/write đồng thời ở different buckets. get() không cần lock (volatile read).
>
> Ngoài ra, ConcurrentHashMap cung cấp atomic compound operations: computeIfAbsent, merge, compute — mà synchronizedMap không có (phải tự wrap thêm synchronized).
>
> Trade-off: ConcurrentHashMap không cho null key/value, iterator weakly consistent (có thể không reflect latest updates)."

---

### Q5: "equals() và hashCode() liên quan gì đến HashMap?" 🔴

#### Strong answer
> "HashMap dùng hashCode() để tìm bucket, dùng equals() để xác định key match. Nếu class override equals() mà không override hashCode(): 2 objects equal nhưng hashCode khác → rơi vào bucket khác → HashMap.get() trả null cho key logically equal.
>
> Contract: if a.equals(b) then a.hashCode() == b.hashCode(). Vi phạm → HashMap, HashSet, mọi hash-based collection sẽ behave incorrectly.
>
> Tôi đã gặp bug production: custom entity override equals theo business key nhưng quên hashCode. Entity add vào HashSet thành công nhưng contains() return false."

---

### Q6: "Khi nào dùng TreeMap thay HashMap?" 🟠

#### Strong answer
> "TreeMap khi cần: (1) sorted keys, (2) range queries (subMap, headMap, tailMap), (3) first/last key. Trade-off: O(log n) thay vì O(1) cho get/put.
>
> Production use case: leaderboard (sorted by score), time-based data (sorted by timestamp), scheduling (sorted by priority). Nếu chỉ cần insert order → LinkedHashMap."

---

## 9. Cheat Sheet

```
┌──────────────────────────────────────────────────────────────┐
│                  COLLECTIONS CHEAT SHEET                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ LIST:                                                        │
│ • ArrayList = default choice (O(1) get, O(1) amortized add) │
│ • LinkedList = almost never (poor cache locality)            │
│ • ArrayDeque > LinkedList for Queue/Stack                    │
│                                                              │
│ MAP:                                                         │
│ • HashMap = default (O(1), unordered)                        │
│ • LinkedHashMap = insertion order / LRU cache                │
│ • TreeMap = sorted keys, range queries (O(log n))            │
│ • ConcurrentHashMap = thread-safe (fine-grained lock)        │
│                                                              │
│ SET:                                                         │
│ • HashSet = backed by HashMap                                │
│ • TreeSet = sorted elements                                  │
│ • LinkedHashSet = insertion order                            │
│                                                              │
│ HASHMAP INTERNALS:                                           │
│ • Array of buckets + linked list/tree per bucket             │
│ • hash: hashCode() ^ (hashCode() >>> 16)                    │
│ • index: hash & (capacity - 1)                               │
│ • Load factor: 0.75 (default)                                │
│ • Treeify: chain > 8 AND table >= 64                         │
│ • Resize: capacity × 2, rehash ALL                           │
│ • NOT thread-safe → ConcurrentHashMap                        │
│ • null key OK (bucket 0), ConcurrentHashMap: NO null         │
│                                                              │
│ CONCURRENTHASHMAP:                                           │
│ • CAS for empty bucket                                       │
│ • synchronized(firstNode) for non-empty                      │
│ • Volatile read for get() → no lock                          │
│ • computeIfAbsent, merge = atomic compound ops               │
│ • No null key/value                                          │
│                                                              │
│ TOP INTERVIEW TRAPS:                                         │
│ • Integer cache -128 to 127 (== vs equals)                   │
│ • HashMap not thread-safe (Java 7 infinite loop)             │
│ • Override equals without hashCode → HashSet broken          │
│ • LinkedList "faster insert" → mostly myth                   │
│ • PriorityQueue iterator != sorted order                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 02 - Concurrency](../02-concurrency/)
