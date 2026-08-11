# MODULE 4 — MODERN JAVA (Java 8 → 21) 🟠

> **Mục tiêu:** Biết feature mới từ Java 8-21, đặc biệt Lambda, Stream, Optional, Records, Virtual Threads.
> Interviewer expect Senior Java biết modern Java — đừng viết code kiểu Java 6.

---

## Mục Lục

1. [Java 8: Lambda & Functional Interface](#1-java-8-lambda--functional-interface)
2. [Java 8: Stream API](#2-java-8-stream-api)
3. [Java 8: Optional](#3-java-8-optional)
4. [Java 8: Method Reference](#4-java-8-method-reference)
5. [Java 11 Features](#5-java-11-features)
6. [Java 17: Records, Sealed Classes, Pattern Matching](#6-java-17)
7. [Java 21: Virtual Threads](#7-java-21-virtual-threads)
8. [Interview Questions](#8-interview-questions)
9. [Cheat Sheet](#9-cheat-sheet)

---

## 1. Java 8: Lambda & Functional Interface 🔴

### Functional Interface

```java
// Functional Interface = interface với DUY NHẤT 1 abstract method
@FunctionalInterface
public interface Predicate<T> {
    boolean test(T t);  // 1 abstract method
    // Có thể có default methods, static methods
}

// Built-in Functional Interfaces:
// Function<T,R>:  T → R          (transform)
// Predicate<T>:   T → boolean    (test/filter)
// Consumer<T>:    T → void       (side effect)
// Supplier<T>:    () → T         (produce)
// UnaryOperator<T>: T → T        (same type transform)
// BiFunction<T,U,R>: (T,U) → R  (2 inputs)
```

### Lambda Expression

```java
// Trước Java 8 — Anonymous class
Runnable task = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello");
    }
};

// Java 8+ — Lambda
Runnable task = () -> System.out.println("Hello");

// Với parameters
Comparator<String> comp = (a, b) -> a.compareTo(b);
Function<String, Integer> strlen = s -> s.length();
Predicate<Integer> isEven = n -> n % 2 == 0;
Consumer<String> printer = s -> System.out.println(s);
Supplier<LocalDateTime> now = () -> LocalDateTime.now();
```

### Lambda vs Anonymous Class

| Feature | Lambda | Anonymous Class |
|---------|--------|-----------------|
| `this` | Enclosing class | Anonymous class itself |
| State | Stateless (captures variables) | Can have fields |
| Performance | Better (invokedynamic) | Class loaded, instantiated |
| Readability | Concise | Verbose |
| Scope | Final/effectively final locals | Final/effectively final locals |

### ⚠️ Effectively Final

```java
int x = 10;
Runnable r = () -> System.out.println(x); // OK — x effectively final

int y = 10;
y = 20; // y modified → NOT effectively final
Runnable r2 = () -> System.out.println(y); // ❌ Compile error!
```

---

## 2. Java 8: Stream API 🔴

### Fundamentals

```java
List<Order> orders = getOrders();

// Pipeline: source → intermediate ops → terminal op
List<String> result = orders.stream()          // source
    .filter(o -> o.getStatus() == COMPLETED)   // intermediate: filter
    .map(Order::getCustomerName)               // intermediate: transform
    .distinct()                                // intermediate: unique
    .sorted()                                  // intermediate: sort
    .limit(10)                                 // intermediate: limit
    .collect(Collectors.toList());             // terminal: collect

// Stream = LAZY — intermediate ops don't execute until terminal op
```

### Essential Operations

```java
// ===== FILTER =====
stream.filter(x -> x > 10)              // keep elements matching predicate

// ===== MAP =====
stream.map(User::getName)               // transform each element
stream.flatMap(u -> u.getOrders().stream()) // flatten nested collections

// ===== REDUCE =====
int sum = stream.reduce(0, Integer::sum);
Optional<Integer> max = stream.reduce(Integer::max);

// ===== COLLECT =====
List<String> list = stream.collect(Collectors.toList());
Set<String> set = stream.collect(Collectors.toSet());
Map<Long, User> map = stream.collect(Collectors.toMap(User::getId, u -> u));
String joined = stream.collect(Collectors.joining(", "));

// ===== GROUP BY =====
Map<OrderStatus, List<Order>> grouped = 
    orders.stream().collect(Collectors.groupingBy(Order::getStatus));

Map<OrderStatus, Long> counts = 
    orders.stream().collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));

// ===== PARTITION =====
Map<Boolean, List<Order>> partitioned = 
    orders.stream().collect(Collectors.partitioningBy(o -> o.getTotal() > 100));

// ===== OTHER TERMINALS =====
stream.forEach(System.out::println);    // side effect
stream.count();                          // count elements
stream.anyMatch(x -> x > 10);          // any element matches?
stream.allMatch(x -> x > 0);           // all elements match?
stream.noneMatch(x -> x < 0);          // no element matches?
stream.findFirst();                      // Optional<T>
stream.findAny();                        // Optional<T> (parallel friendly)
stream.min(Comparator.naturalOrder());   // Optional<T>
stream.max(Comparator.naturalOrder());   // Optional<T>
```

### ⚠️ Stream Pitfalls

```java
// 1. ❌ Stream can only be consumed ONCE
Stream<String> stream = list.stream();
stream.forEach(System.out::println);
stream.forEach(System.out::println); // IllegalStateException!

// 2. ❌ Modifying source during stream
List<String> list = new ArrayList<>(Arrays.asList("a", "b", "c"));
list.stream().forEach(item -> list.remove(item)); // ConcurrentModificationException!

// 3. ❌ Parallel stream cho I/O operations
list.parallelStream()
    .map(id -> callExternalApi(id))  // ❌ ForkJoinPool + blocking I/O!
    .collect(toList());
// Fix: dùng CompletableFuture + custom executor

// 4. ❌ Performance: stream cho simple operations
// Loop đơn giản nhanh hơn stream (overhead lambda, object creation)
// Stream shine khi: complex transformations, readability matters
```

### Parallel Stream

```java
// Dùng ForkJoinPool (shared!)
list.parallelStream()
    .filter(x -> x > 10)
    .map(x -> x * 2)
    .collect(toList());

// ⚠️ Khi nào dùng parallel stream?
// ✅ CPU-bound, large dataset, stateless operations
// ❌ I/O-bound, small dataset, shared mutable state, ordered requirement
// ❌ Non-thread-safe operations (HashMap, ArrayList)

// Rule of thumb: benchmark! Parallel không luôn nhanh hơn.
```

---

## 3. Java 8: Optional 🔴

### Tại sao Optional?

```java
// ❌ Null → NullPointerException (#1 exception in Java)
User user = userRepository.findById(id);
String name = user.getName(); // NPE nếu user null!

// ✅ Optional — explicit "might be empty"
Optional<User> user = userRepository.findById(id);
String name = user.map(User::getName).orElse("Unknown");
```

### Essential APIs

```java
// Creation
Optional<String> opt = Optional.of("hello");        // NPE nếu null
Optional<String> opt = Optional.ofNullable(value);   // OK with null
Optional<String> opt = Optional.empty();              // empty

// Consume
opt.isPresent();                     // boolean
opt.ifPresent(v -> process(v));      // consume if present
opt.get();                           // ⚠️ NoSuchElementException nếu empty

// Default value
opt.orElse("default");              // return default nếu empty
opt.orElseGet(() -> computeDefault()); // lazy default
opt.orElseThrow(() -> new NotFoundException()); // throw nếu empty

// Transform
opt.map(String::toUpperCase);       // Optional<String>
opt.flatMap(this::findByName);      // Optional → Optional (avoid nesting)
opt.filter(s -> s.length() > 3);    // Optional (empty nếu không match)

// Java 11+
opt.isEmpty();                       // opposite of isPresent
opt.ifPresentOrElse(v -> use(v), () -> handleEmpty());

// Java 9+
opt.or(() -> Optional.of("fallback")); // chain Optionals
opt.stream();                          // Optional → Stream (0 or 1 element)
```

### ⚠️ Optional Anti-patterns

```java
// ❌ Optional as method parameter
public void process(Optional<String> name) { ... }
// → Dùng overloading hoặc @Nullable thay thế

// ❌ Optional.get() without check
String value = opt.get(); // throws NoSuchElementException!
// → Dùng orElse, orElseThrow

// ❌ Optional for collections
Optional<List<String>> optList;
// → Return empty list thay vì Optional<List>: Collections.emptyList()

// ❌ Optional as field (not serializable)
public class User {
    private Optional<String> nickname; // ❌
    private String nickname; // ✅ nullable
}

// ✅ Optional chỉ cho return type của methods
public Optional<User> findByEmail(String email) { ... }
```

---

## 4. Java 8: Method Reference 🟠

```java
// 4 types of method references:

// 1. Static method: ClassName::staticMethod
Function<String, Integer> parser = Integer::parseInt;

// 2. Instance method of particular object: object::method  
String str = "hello";
Supplier<Integer> len = str::length;

// 3. Instance method of arbitrary object: ClassName::instanceMethod
Function<String, String> upper = String::toUpperCase;
// Equivalent: s -> s.toUpperCase()

// 4. Constructor: ClassName::new
Supplier<ArrayList<String>> listFactory = ArrayList::new;
Function<String, User> userFactory = User::new;
```

---

## 5. Java 11 Features 🟠

```java
// 1. var (local variable type inference, actually Java 10)
var list = new ArrayList<String>();
var user = userRepository.findById(1L);
// ⚠️ Chỉ cho local variables, không cho fields, parameters, return types

// 2. String methods
"  hello  ".strip();         // "hello" (Unicode-aware trim)
"  hello  ".stripLeading();  // "hello  "
"hello".repeat(3);           // "hellohellohello"
"hello".isBlank();           // false
"".isBlank();                // true
"line1\nline2".lines();      // Stream<String>

// 3. Collection factory methods (Java 9+)
List<String> list = List.of("a", "b", "c");        // immutable
Set<String> set = Set.of("a", "b");                 // immutable
Map<String, Integer> map = Map.of("a", 1, "b", 2); // immutable

// 4. HTTP Client (Java 11)
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users"))
    .GET()
    .build();
HttpResponse<String> response = client.send(request, BodyHandlers.ofString());
```

---

## 6. Java 17 🟠

### Records

```java
// Immutable data carrier — replaces boilerplate POJO
public record UserDTO(Long id, String name, String email) {
    // Auto-generated: constructor, getters, equals, hashCode, toString
    
    // Compact constructor (validation)
    public UserDTO {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name required");
        }
    }
    
    // Custom methods OK
    public String displayName() {
        return name + " (" + email + ")";
    }
}

// Usage:
var user = new UserDTO(1L, "John", "john@example.com");
String name = user.name();  // getter (no "get" prefix)
```

### Sealed Classes

```java
// Restrict which classes can extend/implement
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}

public record Circle(double radius) implements Shape {
    public double area() { return Math.PI * radius * radius; }
}
public record Rectangle(double width, double height) implements Shape {
    public double area() { return width * height; }
}
public final class Triangle implements Shape { /* ... */ }
// Compile error nếu class khác implement Shape!

// Benefits: exhaustive pattern matching (Java 21)
```

### Pattern Matching (instanceof)

```java
// Trước Java 16
if (obj instanceof String) {
    String s = (String) obj; // manual cast
    System.out.println(s.length());
}

// Java 16+
if (obj instanceof String s) {
    System.out.println(s.length()); // s already cast and scoped
}

// Java 21: switch pattern matching
String describe(Shape shape) {
    return switch (shape) {
        case Circle c    -> "Circle radius=" + c.radius();
        case Rectangle r -> "Rect " + r.width() + "x" + r.height();
        case Triangle t  -> "Triangle";
    }; // exhaustive — compiler checks all cases!
}
```

### Text Blocks (Java 15+)

```java
String json = """
    {
        "name": "John",
        "age": 30,
        "email": "john@example.com"
    }
    """;

String sql = """
    SELECT u.id, u.name, o.total
    FROM users u
    JOIN orders o ON u.id = o.user_id
    WHERE o.status = 'COMPLETED'
    ORDER BY o.total DESC
    LIMIT 10
    """;
```

---

## 7. Java 21: Virtual Threads 🔴

### Problem: Thread-per-request model

```
Traditional (Platform Threads):
  → Each HTTP request = 1 OS thread
  → OS thread cost: ~1MB stack + OS resources
  → Server with 4GB RAM → ~4000 threads max
  → Blocking I/O → thread idle → waste resources
  → Workaround: reactive (WebFlux) → complex code
```

### Virtual Threads = Game Changer

```
Virtual Threads (Project Loom):
  → Lightweight threads managed by JVM
  → Cost: ~KB (not MB)
  → Millions possible
  → Blocking I/O → JVM unmounts virtual thread from OS thread
  → OS thread free to run other virtual thread
  → Simple blocking code = as efficient as reactive!
```

### How Virtual Threads Work

```
Platform Thread (OS Thread) ←→ Virtual Threads

Carrier Thread 1:     Carrier Thread 2:
  ├── VT-1 (running)    ├── VT-4 (running)
  ├── VT-2 (blocked)    ├── VT-5 (blocked)
  └── VT-3 (waiting)    └── VT-6 (running)

When VT-2 does blocking I/O:
  1. JVM unmounts VT-2 from Carrier Thread 1
  2. Carrier Thread 1 picks up VT-3 (or other ready VT)
  3. When I/O completes, VT-2 becomes ready
  4. Any available carrier thread mounts VT-2
  → OS thread NEVER blocks!
```

### Usage

```java
// 1. Simple creation
Thread vt = Thread.ofVirtual().name("vt-1").start(() -> {
    System.out.println("Running in virtual thread");
});

// 2. ExecutorService (recommended)
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    // Submit millions of tasks — each gets a virtual thread
    for (int i = 0; i < 1_000_000; i++) {
        executor.submit(() -> {
            // Blocking I/O is fine! JVM handles it efficiently
            String result = callExternalApi();
            saveToDatabase(result);
        });
    }
}

// 3. Spring Boot 3.2+ (simple config)
// application.properties:
// spring.threads.virtual.enabled=true
// → All request handling uses virtual threads!
```

### ⚠️ Virtual Thread Caveats

```java
// 1. ❌ Synchronized blocks PIN virtual thread to carrier
synchronized (lock) {
    callExternalApi(); // Virtual thread PINNED → carrier thread blocked!
}
// ✅ Fix: dùng ReentrantLock thay synchronized
lock.lock();
try {
    callExternalApi(); // VT can unmount during I/O
} finally {
    lock.unlock();
}

// 2. ❌ CPU-bound tasks — không lợi từ virtual threads
// Virtual threads shine cho I/O-bound (waiting for DB, API, file)
// CPU-bound: dùng platform thread pool

// 3. ❌ ThreadLocal + virtual threads = memory issue
// Millions of VTs × ThreadLocal = massive memory
// Use Scoped Values (Java 21 preview) instead

// 4. ❌ Pool virtual threads — anti-pattern
// Don't: Executors.newFixedThreadPool(10) with virtual threads
// Do: newVirtualThreadPerTaskExecutor() — tạo VT per task
```

### Khi nào dùng Virtual Threads?

```
✅ I/O-bound server applications (web servers, microservices)
✅ High concurrency (thousands+ concurrent requests)
✅ Want simple blocking code instead of reactive
✅ Spring Boot 3.2+ (just enable in config)

❌ CPU-bound computation
❌ When synchronized blocks are used extensively
❌ Libraries not compatible (some native libraries)
```

---

## 8. Interview Questions

### Q1: "Stream vs for-loop — khi nào dùng gì?" 🔴

#### Strong answer
> "Stream cho readability khi pipeline complex — filter-map-reduce pattern. For-loop cho simple iterations, performance-critical paths, khi cần break/continue/mutate state.
>
> Production: tôi dùng stream cho business logic transformations (clean, expressive), for-loop cho hot loops trong performance-critical code. Parallel stream: chỉ CPU-bound, large dataset, benchmark trước."

### Q2: "Optional best practices?" 🔴

#### Strong answer
> "Optional chỉ cho method return type — explicitly nói 'có thể không có giá trị'. Không dùng cho fields, parameters, collections. Dùng orElse/orElseThrow thay vì get(). Return empty collection thay Optional<List>."

### Q3: "Virtual Threads giải quyết vấn đề gì?" 🔴

#### Strong answer
> "Thread-per-request model giới hạn concurrency vì OS thread đắt (~1MB). Khi thread chờ I/O → waste resource. Virtual threads: lightweight (~KB), JVM managed, millions possible. Blocking code trở nên efficient như reactive mà code vẫn simple.
>
> Quan trọng: không dùng synchronized (pin carrier thread), dùng ReentrantLock thay. Chỉ cho I/O-bound, không cho CPU-bound. Spring Boot 3.2+ hỗ trợ native — chỉ cần config."

### Q4: "Records vs Class?" 🟠

#### Strong answer
> "Records cho immutable data carriers — auto-generate constructor, getters, equals, hashCode, toString. Dùng cho DTOs, API responses, value objects. Không thay thế entities (cần mutability, JPA proxy). Records final, không extend được."

---

## 9. Cheat Sheet

```
┌──────────────────────────────────────────────────────────────┐
│                 MODERN JAVA CHEAT SHEET                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Java 8:                                                      │
│ • Lambda: (params) -> expression                             │
│ • Stream: filter-map-reduce pipeline (LAZY)                  │
│ • Optional: explicit null handling (return type only)        │
│ • Functional interfaces: Function, Predicate, Consumer       │
│                                                              │
│ Java 11:                                                     │
│ • var: local type inference                                  │
│ • String: strip(), isBlank(), lines(), repeat()              │
│ • List.of(), Set.of(), Map.of() (immutable)                  │
│ • HttpClient (built-in)                                      │
│                                                              │
│ Java 17:                                                     │
│ • Records: immutable data carriers                           │
│ • Sealed classes: restricted inheritance                     │
│ • Pattern matching instanceof                                │
│ • Text blocks (""")                                          │
│                                                              │
│ Java 21:                                                     │
│ • Virtual Threads: millions of lightweight threads           │
│   → I/O-bound only, ReentrantLock not synchronized           │
│   → Spring Boot 3.2+: spring.threads.virtual.enabled=true    │
│ • Pattern matching switch (exhaustive)                       │
│ • Sequenced Collections                                      │
│                                                              │
│ Stream Pitfalls:                                             │
│ • Single use only                                            │
│ • Parallel stream + blocking I/O = ❌                        │
│ • Parallel not always faster — benchmark!                    │
│                                                              │
│ Optional Rules:                                              │
│ • Return type only (not field, not parameter)                │
│ • Never .get() without check                                │
│ • Empty collection > Optional<Collection>                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 05 - Spring Core](../05-spring-core/)
