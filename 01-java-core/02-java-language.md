# 1.2 — Java Language Fundamentals 🔴

> **Mục tiêu:** Nắm vững những kiến thức Java tưởng cơ bản nhưng interviewer thường hỏi sâu.
> Nhiều Senior engineer "biết" nhưng không giải thích được WHY.

---

## Mục Lục

1. [Primitive vs Object](#1-primitive-vs-object)
2. [Stack vs Heap](#2-stack-vs-heap)
3. [String, String Pool, StringBuilder, StringBuffer](#3-string)
4. [Keywords: final, static, transient, volatile](#4-keywords)
5. [equals(), hashCode(), toString()](#5-equals-hashcode-tostring)
6. [Immutable Objects](#6-immutable-objects)
7. [Interview Questions](#7-interview-questions)
8. [Cheat Sheet](#8-cheat-sheet)

---

## 1. Primitive vs Object 🔴

### Kiến thức nền tảng

Java có 8 primitive types: `byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`.

Mọi thứ khác là Object (reference type).

### So sánh chi tiết

| Feature | Primitive | Object (Wrapper) |
|---------|-----------|-------------------|
| Lưu ở đâu | Stack (local var) | Heap (object) |
| Default value | `0`, `false`, `\0` | `null` |
| Memory | Nhỏ (4 bytes cho int) | Lớn hơn (16+ bytes cho Integer) |
| Nullable | ❌ | ✅ |
| Dùng trong Collection | ❌ | ✅ |
| Performance | Nhanh | Chậm hơn (boxing/unboxing) |
| Identity | So sánh value | == so sánh reference |

### Autoboxing / Unboxing

```java
// Autoboxing: primitive → wrapper
Integer x = 42; // compiler: Integer x = Integer.valueOf(42);

// Unboxing: wrapper → primitive  
int y = x; // compiler: int y = x.intValue();

// ⚠️ TRAP: Unboxing null → NullPointerException
Integer nullValue = null;
int boom = nullValue; // NPE! 
```

### Integer Cache — Interview trap 🔴

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b); // true ← cached!

Integer c = 128;
Integer d = 128;
System.out.println(c == d); // false ← different objects!

// Why? Integer.valueOf() cache -128 to 127
// Luôn dùng .equals() cho wrapper comparison
```

### Production relevance

```java
// ❌ Performance issue — boxing in hot loop
public long sumList(List<Integer> list) {
    long sum = 0;
    for (Integer i : list) { // unboxing mỗi iteration
        sum += i;
    }
    return sum;
}

// ✅ Nếu performance critical, dùng int[] thay vì List<Integer>
// Hoặc dùng specialized collections như Eclipse Collections IntList
```

---

## 2. Stack vs Heap 🔴

### Giải thích dễ hiểu

- **Stack:** Sổ tay riêng của mỗi thread. Lưu local variables, method call frames. Tự động dọn khi method return.
- **Heap:** Kho chung cho mọi thread. Lưu objects. GC dọn khi không ai reference nữa.

### Giải thích technical sâu

```
Thread 1 Stack          Thread 2 Stack          HEAP (shared)
┌─────────────┐        ┌─────────────┐        ┌──────────────────┐
│ main()      │        │ run()       │        │                  │
│  x = 42     │        │  y = 100    │        │  User("John")    │
│  ref → ─────┼────────┼─────────────┼────→   │  List[1,2,3]     │
│             │        │  ref → ─────┼────→   │  HashMap{...}    │
│ method1()   │        │             │        │  String "hello"  │
│  local = 10 │        │             │        │                  │
└─────────────┘        └─────────────┘        └──────────────────┘
```

| Feature | Stack | Heap |
|---------|-------|------|
| Scope | Thread-private | Shared |
| Lifetime | Method execution | Until GC collects |
| Speed | Rất nhanh | Chậm hơn (allocation + GC) |
| Size | Nhỏ (~1MB default) | Lớn (-Xmx) |
| Error | StackOverflowError | OutOfMemoryError |
| Content | Primitives, references | Objects |

### Method execution flow

```java
public void methodA() {
    int x = 10;          // x trên Stack
    String s = "hello";  // s (reference) trên Stack, "hello" trên Heap (String pool)
    User user = new User("John"); // user ref trên Stack, User object trên Heap
    methodB(user);       // push new stack frame
}                        // pop frame, x, s, user ref removed from stack
                         // User object vẫn trên Heap cho đến GC

public void methodB(User user) {
    // user là copy of reference (pass by value of reference)
    user.setName("Jane"); // modifies SAME object on heap
    user = new User("Bob"); // user now points to NEW object, original unaffected
}
```

### Pass by value — Interview classic 🔴

> Java luôn **pass by value**. Nhưng với objects, value đó là **copy of reference**.

```java
public void swap(Integer a, Integer b) {
    Integer temp = a;
    a = b;
    b = temp;
    // Swap KHÔNG work! Vì a, b là copies of references
}
```

→ Xem thêm: [Module 03 - JVM Architecture](../03-jvm/)

---

## 3. String 🔴

### String Pool

```java
String s1 = "hello";           // String pool (Heap - special area)
String s2 = "hello";           // Trỏ vào CÙNG object trong pool
String s3 = new String("hello"); // Tạo NEW object trên Heap (ngoài pool)

System.out.println(s1 == s2);    // true  ← cùng reference trong pool
System.out.println(s1 == s3);    // false ← khác reference
System.out.println(s1.equals(s3)); // true ← cùng value

String s4 = s3.intern();        // Đưa vào pool, return pooled reference
System.out.println(s1 == s4);    // true
```

### String Immutability

**String là immutable — mọi thao tác tạo String MỚI:**

```java
String s = "hello";
s.concat(" world"); // Tạo String mới, s vẫn là "hello"
s = s.concat(" world"); // s trỏ vào String mới "hello world"
                         // "hello" cũ vẫn tồn tại cho đến GC
```

**Tại sao String immutable?**
1. **Thread-safety** — share giữa threads không cần synchronization
2. **String Pool** — safe vì không ai modify được
3. **Security** — database URL, class name, etc. không bị tamper
4. **Caching hashCode** — tính 1 lần, dùng mãi (HashMap key performance)

### String vs StringBuilder vs StringBuffer

| Feature | String | StringBuilder | StringBuffer |
|---------|--------|---------------|--------------|
| Mutable | ❌ | ✅ | ✅ |
| Thread-safe | ✅ (immutable) | ❌ | ✅ (synchronized) |
| Performance | Chậm nếu concat nhiều | Nhanh | Chậm hơn StringBuilder |
| Use case | General | Single thread concat | Multi thread concat (hiếm) |

```java
// ❌ Tệ — tạo n String objects
String result = "";
for (int i = 0; i < 10000; i++) {
    result += i; // Mỗi += tạo String mới → O(n²)
}

// ✅ Tốt — 1 mutable buffer
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append(i); // O(n)
}
String result = sb.toString();
```

### Production note

> Modern Java compiler có thể optimize `+` thành `StringBuilder` cho simple cases. Nhưng trong loop, **luôn dùng StringBuilder explicitly**.

---

## 4. Keywords 🔴

### final

```java
// final variable — assign 1 lần
final int MAX = 100;

// final reference — reference không đổi, object bên trong CÓ THỂ đổi!
final List<String> list = new ArrayList<>();
list.add("hello"); // ✅ OK — modify object
// list = new ArrayList<>(); // ❌ Compile error — reassign reference

// final method — không override được
public final void criticalMethod() { /* ... */ }

// final class — không extend được
public final class ImmutableHelper { /* ... */ }
```

**Interview trap:**
> "`final` không có nghĩa immutable!" — `final List` vẫn mutable.
> Immutable = `Collections.unmodifiableList()` hoặc `List.of()`.

### static

```java
// static field — shared across all instances (class-level)
public class Counter {
    private static int count = 0; // 1 copy cho cả class
    private int instanceId;       // 1 copy cho mỗi instance
    
    public Counter() {
        instanceId = ++count;
    }
}

// static method — gọi không cần instance
Math.max(1, 2); // không cần new Math()

// static block — chạy 1 lần khi class load
static {
    // initialization code
}
```

**Khi nào dùng static?**
- Utility methods: `StringUtils.isEmpty()`
- Constants: `static final`
- Factory methods: `Integer.valueOf()`

**Khi nào KHÔNG dùng?**
- Khi method cần access instance state → dùng instance method
- Khi cần polymorphism → static methods KHÔNG override (hidden, not overridden)
- Khi cần testability → static khó mock → dùng DI thay thế

### transient

```java
public class User implements Serializable {
    private String username;
    private transient String password; // KHÔNG serialize
    // password sẽ là null sau deserialization
}
```

**Production use:** Exclude sensitive data khi serialize, hoặc computed/cached fields không cần persist.

### volatile 🔴

```java
public class Singleton {
    private static volatile Singleton instance; // đảm bảo visibility across threads
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                    // Không có volatile: thread khác có thể thấy
                    // partially constructed object do instruction reordering
                }
            }
        }
        return instance;
    }
}
```

**volatile đảm bảo:**
1. **Visibility** — write bởi 1 thread luôn visible cho tất cả threads khác
2. **Ordering** — prevent instruction reordering

**volatile KHÔNG đảm bảo:**
- **Atomicity** — `volatile int count; count++` vẫn NOT thread-safe!

→ Chi tiết: [Module 02 - Concurrency](../02-concurrency/)

---

## 5. equals(), hashCode(), toString() 🔴

### Contract giữa equals() và hashCode()

**Rule bắt buộc:**
1. Nếu `a.equals(b)` thì `a.hashCode() == b.hashCode()` (MUST)
2. Nếu `a.hashCode() == b.hashCode()` thì `a.equals(b)` KHÔNG nhất thiết (collision)
3. Nếu `!a.equals(b)` thì hashCode có thể bằng hoặc khác

**Hậu quả nếu vi phạm:**
```java
// ❌ Override equals() mà KHÔNG override hashCode()
public class User {
    private Long id;
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        return Objects.equals(id, ((User) o).id);
    }
    // QUÊN hashCode() → HashMap sẽ KHÔNG work đúng
}

User u1 = new User(1L);
User u2 = new User(1L);
u1.equals(u2); // true

Set<User> set = new HashSet<>();
set.add(u1);
set.contains(u2); // FALSE! Vì hashCode khác → tìm sai bucket
```

### Implementation đúng

```java
public class User {
    private Long id;
    private String email;
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "User{id=%d, email='%s'}".formatted(id, email);
        // ⚠️ Không include password hay sensitive data trong toString()!
    }
}
```

### Khi nào nên dùng field nào cho equals()?

| Entity type | equals/hashCode field | Lý do |
|-------------|----------------------|-------|
| JPA Entity | Business key hoặc ID | Tránh proxy issues |
| Value Object | Tất cả fields | Value equality |
| DTO | Tất cả fields | Value equality |

### JPA Entity — Gotcha 🔴

```java
@Entity
public class Order {
    @Id @GeneratedValue
    private Long id;
    
    // ❌ Dùng generated ID cho equals/hashCode
    // Problem: entity mới chưa persist → id = null → mọi entity "equals"
    
    // ✅ Dùng business key (natural key)
    private String orderNumber; // unique, assigned before persist
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Order)) return false;
        return Objects.equals(orderNumber, ((Order) o).orderNumber);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(orderNumber);
    }
}
```

---

## 6. Immutable Objects 🔴

### Cách tạo Immutable Object

```java
// Trước Java 16 — manual
public final class Money {                    // 1. final class
    private final BigDecimal amount;          // 2. final fields
    private final String currency;
    
    public Money(BigDecimal amount, String currency) {  // 3. Constructor
        this.amount = amount;
        this.currency = currency;
    }
    
    public BigDecimal getAmount() { return amount; }     // 4. Chỉ getters
    public String getCurrency() { return currency; }
    
    // 5. Return NEW object thay vì modify
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
}

// Java 16+ — Record (implicit immutable)
public record Money(BigDecimal amount, String currency) {
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
}
```

### ⚠️ Defensive Copy — Trap

```java
// ❌ Immutable bị phá vì mutable field
public final class Event {
    private final Date timestamp;
    
    public Event(Date timestamp) {
        this.timestamp = timestamp; // Giữ reference → caller có thể modify!
    }
    
    public Date getTimestamp() {
        return timestamp; // Caller có thể: event.getTimestamp().setTime(0)
    }
}

// ✅ Defensive copy
public final class Event {
    private final Date timestamp;
    
    public Event(Date timestamp) {
        this.timestamp = new Date(timestamp.getTime()); // copy in
    }
    
    public Date getTimestamp() {
        return new Date(timestamp.getTime()); // copy out
    }
}

// ✅✅ Better: dùng Java 8+ immutable types
public record Event(Instant timestamp) {} // Instant is immutable
```

### Tại sao Immutable quan trọng?

1. **Thread-safe by default** — không cần synchronization
2. **Safe HashMap key** — hashCode không bao giờ thay đổi
3. **Safe sharing** — pass reference không sợ bị modify
4. **Easy to reason about** — state không thay đổi = less bugs

### Production example

```java
// Spring: @ConfigurationProperties thường nên immutable
@ConfigurationProperties(prefix = "app.kafka")
public record KafkaConfig(
    String bootstrapServers,
    String groupId,
    int maxPollRecords,
    Duration pollTimeout
) {} // immutable, thread-safe, clean
```

---

## 7. Interview Questions

### Q1: "Java pass by value hay pass by reference?" 🔴

#### What interviewer is testing
Hiểu cơ chế truyền tham số — rất nhiều Senior vẫn nhầm.

#### Short answer
> "Java luôn pass by value. Với primitives thì pass copy of value. Với objects thì pass copy of reference — reference mới trỏ vào cùng object."

#### Strong answer
> "Java luôn pass by value — JLS define rõ ràng. Nhưng cần phân biệt: primitive thì pass copy of value, object thì pass copy of reference.
>
> Nghĩa là: nếu method nhận object và modify field → original object bị ảnh hưởng (vì cùng object). Nhưng nếu method reassign reference → chỉ local reference thay đổi, caller's reference không đổi. Ví dụ swap function không work vì lý do này."

#### Follow-up
1. "Vậy làm sao implement swap?"
> "Không thể swap references trong Java. Workaround: wrap trong mutable container hoặc return Pair."

2. "Tại sao Java chọn pass by value?"
> "Simplicity và safety. Pass by reference cho phép method thay đổi caller's variable → khó reason about. Java trade flexibility cho safety."

---

### Q2: "String immutable có lợi gì?" 🔴

#### Strong answer
> "String immutable vì 4 lý do chính:
> 1. **Thread-safety** — share giữa threads không cần synchronization
> 2. **String Pool** — JVM cache và reuse String objects, chỉ work vì immutable
> 3. **Security** — database URLs, class names, file paths dùng String — nếu mutable thì attacker có thể modify
> 4. **HashMap performance** — String cache hashCode, tính 1 lần — vì value không bao giờ đổi
>
> Trade-off: concat nhiều String tạo nhiều object → dùng StringBuilder."

---

### Q3: "equals() và hashCode() — tại sao phải override cả hai?" 🔴

#### Strong answer
> "Contract: nếu a.equals(b) thì hashCode phải bằng nhau. HashMap/HashSet dùng hashCode để tìm bucket TRƯỚC, rồi mới dùng equals() để compare. Nếu override equals mà không hashCode: 2 objects 'equal' nhưng rơi vào bucket khác nhau → HashSet chứa duplicate, HashMap.get() trả null.
>
> Trong production tôi đã gặp bug vì entity override equals theo business key nhưng quên hashCode — Set không hoạt động đúng."

---

### Q4: "volatile có thread-safe không?" 🔴

#### What interviewer is testing
Đây là trap question — xem [Module 30 - Trap Questions](../30-final-interview-pack/)

#### Short answer
> "Volatile đảm bảo visibility, KHÔNG đảm bảo atomicity. `volatile int count; count++` vẫn race condition."

#### Strong answer
> "volatile giải quyết 2 vấn đề: visibility (đảm bảo tất cả threads thấy latest value) và ordering (prevent instruction reordering). Nhưng nó KHÔNG đảm bảo atomicity.
>
> `count++` gồm 3 bước: read → increment → write. volatile chỉ đảm bảo mỗi bước thấy latest value, nhưng 2 threads có thể cùng read cùng value → cùng increment → lost update.
>
> Để thread-safe: dùng `AtomicInteger` (CAS) hoặc `synchronized`."

→ Chi tiết: [Module 02 - Concurrency](../02-concurrency/)

---

## 8. Cheat Sheet

```
┌───────────────────────────────────────────────────┐
│         JAVA LANGUAGE CHEAT SHEET                 │
├───────────────────────────────────────────────────┤
│                                                   │
│ Primitive vs Object:                              │
│ • Primitive: stack, no null, fast                  │
│ • Object: heap, nullable, autobox overhead        │
│ • Integer cache: -128 to 127                      │
│ • Luôn dùng .equals() cho wrapper comparison      │
│                                                   │
│ String:                                           │
│ • Immutable — concat tạo String mới               │
│ • String Pool: "hello" == "hello" → true          │
│ • new String("hello") bypass pool                 │
│ • Loop concat → StringBuilder                     │
│ • StringBuffer = synchronized StringBuilder       │
│                                                   │
│ Keywords:                                         │
│ • final ≠ immutable (final List vẫn mutable)      │
│ • static = class-level, không override (hidden)   │
│ • volatile = visibility + ordering, NOT atomicity  │
│ • transient = skip serialization                  │
│                                                   │
│ equals/hashCode:                                  │
│ • Override cả 2 hoặc không override               │
│ • a.equals(b) → hashCode PHẢI bằng               │
│ • JPA Entity: dùng business key, không dùng gen ID│
│                                                   │
│ Immutable Objects:                                │
│ • final class + final fields + no setters         │
│ • Defensive copy cho mutable fields               │
│ • Java 16+ → Record                              │
│ • Thread-safe by default                          │
│                                                   │
│ Java pass by VALUE:                               │
│ • Primitives: copy of value                       │
│ • Objects: copy of reference (same object)        │
│ • swap() KHÔNG work trong Java                    │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [03-collections.md](./03-collections.md)
