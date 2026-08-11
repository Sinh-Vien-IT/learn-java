# 1.1 — OOP, SOLID & Clean Code 🔴

> **Mục tiêu:** Hiểu sâu OOP không phải ở level "4 tính chất" mà ở level "tại sao cần, khi nào nên, khi nào không".
> Interviewer kiểm tra OOP không phải bằng "kể 4 tính chất" mà bằng "cho scenario, bạn design thế nào?"

---

## Mục Lục

1. [Encapsulation](#1-encapsulation)
2. [Inheritance](#2-inheritance)
3. [Polymorphism](#3-polymorphism)
4. [Abstraction](#4-abstraction)
5. [Composition vs Inheritance](#5-composition-vs-inheritance)
6. [Interface vs Abstract Class](#6-interface-vs-abstract-class)
7. [SOLID Principles](#7-solid-principles)
8. [DRY, KISS, YAGNI](#8-dry-kiss-yagni)
9. [Clean Code](#9-clean-code)
10. [Interview Questions](#10-interview-questions)
11. [Cheat Sheet](#11-cheat-sheet)

---

## 1. Encapsulation 🔴

### Kiến thức nền tảng

Encapsulation là việc **ẩn internal state** của object và chỉ cho phép truy cập thông qua **controlled interface** (methods).

### Giải thích dễ hiểu

Giống như bạn dùng xe ô tô: bạn bấm ga, đạp phanh, quay tay lái — nhưng không cần biết bên trong engine hoạt động thế nào. Nếu hãng xe thay engine mới, bạn vẫn lái bình thường vì interface (ga, phanh, lái) không đổi.

### Giải thích technical sâu

Encapsulation hoạt động ở 2 level:

**Level 1: Field-level** — dùng `private` fields + `public` getters/setters

```java
public class BankAccount {
    private BigDecimal balance; // internal state - hidden
    
    public BigDecimal getBalance() {
        return balance;
    }
    
    // Không có setBalance() — bắt buộc dùng business method
    public void deposit(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        this.balance = this.balance.add(amount);
    }
}
```

**Level 2: Class-level** — ẩn implementation detail, expose behavior

```java
// ❌ Expose implementation
public class OrderService {
    public List<Order> orders = new ArrayList<>(); // anyone can modify
}

// ✅ Encapsulate behavior
public class OrderService {
    private final List<Order> orders = new ArrayList<>();
    
    public void placeOrder(Order order) {
        validateOrder(order);
        orders.add(order);
        notifyWarehouse(order);
    }
    
    public List<Order> getOrders() {
        return Collections.unmodifiableList(orders); // defensive copy
    }
}
```

### Ví dụ production

Trong Spring Boot service:

```java
@Service
public class PaymentService {
    // Dependencies encapsulated — client không biết dùng gì internally
    private final PaymentGateway gateway;
    private final TransactionRepository repository;
    private final KafkaTemplate<String, PaymentEvent> kafkaTemplate;
    
    // Expose behavior, not implementation
    public PaymentResult processPayment(PaymentRequest request) {
        // Client không cần biết flow: validate → charge → save → publish event
        validate(request);
        ChargeResult charge = gateway.charge(request);
        Transaction tx = repository.save(toTransaction(charge));
        kafkaTemplate.send("payment-events", new PaymentCompletedEvent(tx));
        return PaymentResult.success(tx.getId());
    }
}
```

### Khi nào sử dụng

Luôn luôn. Encapsulation là default mindset, không phải optional feature.

### Khi nào KHÔNG nên

- **DTO/Value Object đơn giản** — Java Record hoặc POJO cho data transfer thì public fields hoặc getters OK
- **Configuration class** — `@ConfigurationProperties` cần getters/setters

### Trade-off

| Pro | Con |
|-----|-----|
| Thay đổi implementation không break client | Thêm boilerplate code |
| Validate invariant trước khi thay đổi state | Over-encapsulation làm code phức tạp |
| Dễ test vì interface rõ ràng | Getters/setters cho mọi field = vô nghĩa |

### Common mistakes

1. **Getter/Setter cho mọi field** → Không phải encapsulation, đây là "tự lừa mình". Nếu mọi field đều có getter+setter thì không khác gì public.
2. **Return mutable collection** → `getOrders()` return `List<Order>` trực tiếp → client có thể modify list. Phải return `Collections.unmodifiableList()` hoặc copy.
3. **Expose internal data structure** → Return `HashMap` thay vì `Map` → client depend on implementation.

---

## 2. Inheritance 🔴

### Kiến thức nền tảng

Inheritance cho phép class con (subclass) kế thừa fields và methods từ class cha (superclass).

### Giải thích technical sâu

```java
public class Animal {
    protected String name;
    
    public void eat() {
        System.out.println(name + " is eating");
    }
}

public class Dog extends Animal {
    public void bark() {
        System.out.println(name + " is barking");
    }
    
    @Override
    public void eat() {
        System.out.println(name + " is eating dog food"); // override behavior
    }
}
```

### Vấn đề của Inheritance

**1. Tight coupling**
```java
// Nếu thay đổi class cha → ảnh hưởng TẤT CẢ class con
// "Fragile base class problem"
```

**2. Diamond problem** (Java resolve bằng single inheritance)

**3. Breaking encapsulation**
```java
// HashSet → extends AbstractSet → extends AbstractCollection
// Nếu bạn override add(), addAll() vẫn gọi AbstractCollection.addAll() 
// mà bên trong gọi add() → count bị doubled
// Đây là ví dụ kinh điển từ Effective Java
```

### Khi nào KHÔNG dùng Inheritance

- Khi chỉ muốn **reuse code** → dùng Composition
- Khi quan hệ là **"has-a"** thay vì **"is-a"** → dùng Composition
- Khi class cha có thể thay đổi → dùng Composition

### Rule of thumb

> **Prefer Composition over Inheritance** — Effective Java, Item 18

---

## 3. Polymorphism 🔴

### Kiến thức nền tảng

Polymorphism = "nhiều hình thái" — cùng một interface/method nhưng behavior khác nhau tùy implementation.

### 2 loại

**Compile-time (Static)** — Method overloading
```java
public class Calculator {
    public int add(int a, int b) { return a + b; }
    public double add(double a, double b) { return a + b; }
    public int add(int a, int b, int c) { return a + b + c; }
}
```

**Runtime (Dynamic)** — Method overriding (quan trọng hơn nhiều)
```java
public interface NotificationSender {
    void send(String message, String recipient);
}

public class EmailSender implements NotificationSender {
    @Override
    public void send(String message, String recipient) {
        // Send email via SMTP
    }
}

public class SmsSender implements NotificationSender {
    @Override
    public void send(String message, String recipient) {
        // Send SMS via Twilio API
    }
}

public class PushSender implements NotificationSender {
    @Override
    public void send(String message, String recipient) {
        // Send push notification via FCM
    }
}

// Client code — không cần biết implementation
@Service
public class NotificationService {
    private final List<NotificationSender> senders;
    
    public void notifyUser(String message, User user) {
        for (NotificationSender sender : senders) {
            sender.send(message, user.getContact());
            // Runtime quyết định gọi Email, SMS, hay Push
        }
    }
}
```

### Ví dụ production

Spring Framework sử dụng polymorphism cực kỳ nhiều:

```java
// Spring DI inject implementation tùy config
@Service
public class OrderService {
    private final PaymentGateway gateway; // Interface
    
    // Stripe? PayPal? Mock? → Tuỳ @Profile hoặc @Conditional
    public OrderService(PaymentGateway gateway) {
        this.gateway = gateway;
    }
}
```

### Tại sao Polymorphism quan trọng cho interview?

Vì nó là foundation cho:
- **Strategy Pattern** → [Module 22](../22-design-patterns/)
- **Dependency Injection** → [Module 05](../05-spring-core/)
- **Open/Closed Principle** → [SOLID](#7-solid-principles)
- **Testability** — Mock interface thay vì mock implementation

---

## 4. Abstraction 🔴

### Kiến thức nền tảng

Abstraction là việc **ẩn chi tiết phức tạp** và chỉ expose **essential features**.

### Giải thích technical sâu

Abstraction hoạt động ở nhiều level:

```
Level 1: Method      → processPayment() ẩn 10 steps bên trong
Level 2: Class       → PaymentService ẩn interaction với gateway, DB, Kafka
Level 3: Interface   → PaymentGateway ẩn Stripe vs PayPal
Level 4: Module      → Payment module ẩn internal classes
Level 5: Service     → Payment microservice ẩn cả database + queue
Level 6: API         → REST API ẩn toàn bộ backend
```

### Production example — Layered abstraction

```java
// Controller → chỉ biết request/response
@RestController
public class OrderController {
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest req) {
        return ResponseEntity.ok(orderService.create(req));
    }
}

// Service → chỉ biết business logic
@Service  
public class OrderService {
    public OrderResponse create(OrderRequest req) {
        Order order = Order.from(req);
        order.validate();
        Order saved = orderRepository.save(order);
        eventPublisher.publish(new OrderCreatedEvent(saved));
        return OrderResponse.from(saved);
    }
}

// Repository → chỉ biết persistence
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // JPA abstract away SQL completely
}
```

### Common mistake

**Leaky abstraction** — khi abstraction "rò rỉ" implementation detail:

```java
// ❌ Leaky — client phải biết SQL syntax
public interface OrderRepository {
    List<Order> findByQuery(String sqlQuery); 
}

// ✅ Proper abstraction
public interface OrderRepository {
    List<Order> findByStatusAndDateRange(OrderStatus status, LocalDate from, LocalDate to);
}
```

---

## 5. Composition vs Inheritance 🔴

### Đây là câu hỏi rất hay gặp

### So sánh

| Tiêu chí | Inheritance | Composition |
|-----------|-------------|-------------|
| Quan hệ | is-a (Dog IS Animal) | has-a (Car HAS Engine) |
| Coupling | Tight — thay đổi cha ảnh hưởng con | Loose — thay đổi component không ảnh hưởng wrapper |
| Flexibility | Compile-time — không đổi được | Runtime — swap implementation dễ dàng |
| Code reuse | Reuse từ 1 class cha | Reuse từ nhiều component |
| Encapsulation | Phá vỡ — subclass thấy protected members | Giữ nguyên — chỉ thấy public interface |

### Ví dụ

```java
// ❌ Inheritance — tight coupling
public class LoggingList<E> extends ArrayList<E> {
    @Override
    public boolean add(E e) {
        log.info("Adding: {}", e);
        return super.add(e);
    }
    // Problem: addAll() internally gọi add() hay không? Depends on implementation!
}

// ✅ Composition — flexible, safe
public class LoggingList<E> implements List<E> {
    private final List<E> delegate; // composition
    
    public LoggingList(List<E> delegate) {
        this.delegate = delegate;
    }
    
    @Override
    public boolean add(E e) {
        log.info("Adding: {}", e);
        return delegate.add(e);
    }
    
    @Override
    public boolean addAll(Collection<? extends E> c) {
        log.info("Adding all: {} items", c.size());
        return delegate.addAll(c); // no double-counting issue
    }
    // ... delegate other methods
}
```

### Interview answer

> "Tôi prefer composition over inheritance trong hầu hết cases. Inheritance chỉ hợp lý khi có quan hệ is-a thực sự và class hierarchy stable. Trong thực tế, tôi thấy composition + interface cho flexibility tốt hơn: dễ test (inject mock), dễ thay đổi implementation, và tránh fragile base class problem. Ví dụ trong Spring, DI chính là composition — inject dependencies thay vì inherit."

---

## 6. Interface vs Abstract Class 🔴

### So sánh chi tiết

| Feature | Interface | Abstract Class |
|---------|-----------|---------------|
| Multiple inheritance | ✅ implement nhiều | ❌ chỉ extend 1 |
| Fields | Chỉ `static final` constants | Có instance fields |
| Constructor | ❌ Không có | ✅ Có |
| Access modifier | `public` (default) | Bất kỳ |
| Default methods | ✅ (Java 8+) | ✅ |
| State | ❌ Stateless | ✅ Có state |
| Purpose | Contract (what) | Partial implementation (what + some how) |

### Khi nào dùng gì?

**Interface khi:**
- Define contract/capability: `Serializable`, `Comparable`, `Runnable`
- Multiple inheritance cần: `class Dog implements Pet, Trainable`
- Không cần shared state
- Muốn loose coupling

**Abstract class khi:**
- Có shared state/implementation giữa subclasses
- Template Method pattern: define skeleton, subclasses fill details
- Có constructor logic

### Java 8+ làm ranh giới mờ hơn

```java
// Interface với default method — gần giống abstract class
public interface Auditable {
    LocalDateTime getCreatedAt();
    LocalDateTime getUpdatedAt();
    
    // Default implementation
    default boolean isRecent() {
        return getCreatedAt().isAfter(LocalDateTime.now().minusDays(7));
    }
}
```

### Interview answer (Senior level)

> "Trong modern Java, interface là default choice vì hỗ trợ multiple inheritance, default methods, và tạo loose coupling. Abstract class chỉ dùng khi cần shared mutable state hoặc constructor logic. Ví dụ trong Spring: `JpaRepository` là interface, `AbstractRoutingDataSource` là abstract class vì cần manage internal state cho dynamic datasource routing."

---

## 7. SOLID Principles 🔴

### S — Single Responsibility Principle

> "A class should have only ONE reason to change."

**Giải thích dễ hiểu:** Mỗi class chỉ làm MỘT việc. Nếu class có 2 lý do thay đổi → tách ra.

```java
// ❌ Violates SRP — 3 reasons to change
public class OrderService {
    public Order createOrder(OrderRequest req) { /* business logic */ }
    public void sendEmail(Order order) { /* email logic */ }
    public String generatePdf(Order order) { /* PDF logic */ }
}

// ✅ SRP — each class has one job
public class OrderService {
    public Order createOrder(OrderRequest req) { /* only business */ }
}
public class OrderNotificationService {
    public void sendOrderConfirmation(Order order) { /* only notification */ }
}
public class OrderReportService {
    public String generateOrderReport(Order order) { /* only report */ }
}
```

**Production example:** Trong microservices, SRP apply ở service level — mỗi service chịu trách nhiệm 1 domain (Order Service, Payment Service, Notification Service).

**Common mistake:** Over-applying SRP → tạo hàng trăm tiny classes, mỗi class 1 method. Cần balance.

---

### O — Open/Closed Principle

> "Open for extension, closed for modification."

**Giải thích:** Code mới nên mở rộng behavior mà không cần sửa code cũ.

```java
// ❌ Violates OCP — phải sửa method mỗi khi thêm payment type
public class PaymentProcessor {
    public void process(Payment payment) {
        if (payment.getType() == PaymentType.CREDIT_CARD) {
            processCreditCard(payment);
        } else if (payment.getType() == PaymentType.PAYPAL) {
            processPayPal(payment);
        } else if (payment.getType() == PaymentType.CRYPTO) {
            processCrypto(payment);  // thêm type = sửa code
        }
    }
}

// ✅ OCP — thêm payment type = thêm class mới, không sửa gì
public interface PaymentProcessor {
    boolean supports(PaymentType type);
    PaymentResult process(Payment payment);
}

@Component
public class CreditCardProcessor implements PaymentProcessor {
    public boolean supports(PaymentType type) { return type == CREDIT_CARD; }
    public PaymentResult process(Payment payment) { /* ... */ }
}

@Component
public class CryptoProcessor implements PaymentProcessor {
    public boolean supports(PaymentType type) { return type == CRYPTO; }
    public PaymentResult process(Payment payment) { /* ... */ }
}

@Service
public class PaymentService {
    private final List<PaymentProcessor> processors; // Spring inject all implementations
    
    public PaymentResult process(Payment payment) {
        return processors.stream()
            .filter(p -> p.supports(payment.getType()))
            .findFirst()
            .orElseThrow(() -> new UnsupportedPaymentException(payment.getType()))
            .process(payment);
    }
}
```

**Spring đã apply OCP ở đâu?**
- `HandlerInterceptor` — thêm interceptor mới không sửa framework
- `@EventListener` — thêm listener mới không sửa publisher
- Strategy pattern qua DI — inject implementation mới không sửa service

---

### L — Liskov Substitution Principle

> "Subclass phải thay thế được superclass mà không break chương trình."

**Giải thích dễ hiểu:** Nếu function nhận `Animal`, bạn pass `Dog` vào phải work đúng. Nếu không → design sai.

```java
// ❌ Violates LSP — kinh điển
public class Rectangle {
    protected int width, height;
    
    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int area() { return width * height; }
}

public class Square extends Rectangle {
    @Override
    public void setWidth(int w) { 
        this.width = w; 
        this.height = w; // bất ngờ thay đổi height!
    }
    @Override
    public void setHeight(int h) { 
        this.height = h; 
        this.width = h; // bất ngờ thay đổi width!
    }
}

// Code client expect:
Rectangle rect = new Square();
rect.setWidth(5);
rect.setHeight(3);
assert rect.area() == 15; // FAIL! area = 9 vì Square override cả 2
```

**Production example:**

```java
// ❌ LSP violation trong real code
public class ReadOnlyList<E> extends ArrayList<E> {
    @Override
    public boolean add(E e) {
        throw new UnsupportedOperationException(); // surprise!
    }
}
// Client expect List.add() works → breaks

// ✅ Better: dùng separate interface
public interface ReadableList<E> {
    E get(int index);
    int size();
    // Không có add() — client biết rõ
}
```

---

### I — Interface Segregation Principle

> "Client không nên bị ép implement interface mà nó không dùng."

```java
// ❌ Fat interface
public interface Worker {
    void work();
    void eat();
    void sleep();
}

public class Robot implements Worker {
    public void work() { /* OK */ }
    public void eat() { throw new UnsupportedOperationException(); } // robot không ăn!
    public void sleep() { throw new UnsupportedOperationException(); }
}

// ✅ Segregated
public interface Workable { void work(); }
public interface Feedable { void eat(); }
public interface Restable { void sleep(); }

public class Robot implements Workable {
    public void work() { /* only what robot needs */ }
}

public class Human implements Workable, Feedable, Restable {
    // implements all 3
}
```

**Spring example:**
- `CrudRepository` vs `JpaRepository` vs `PagingAndSortingRepository` — bạn chọn interface phù hợp thay vì bị ép dùng fat interface.

---

### D — Dependency Inversion Principle

> "High-level modules không nên depend vào low-level modules. Cả hai nên depend vào abstractions."

```java
// ❌ DIP violation
public class OrderService {
    private MySqlOrderRepository repository = new MySqlOrderRepository(); // depend vào concrete
    private SmtpEmailSender emailSender = new SmtpEmailSender(); // depend vào concrete
}

// ✅ DIP — depend on abstractions
public class OrderService {
    private final OrderRepository repository;  // interface
    private final EmailSender emailSender;      // interface
    
    public OrderService(OrderRepository repository, EmailSender emailSender) {
        this.repository = repository;
        this.emailSender = emailSender;
    }
}
```

**Tại sao DIP cực quan trọng?**
1. **Testability** — inject mock repository trong unit test
2. **Flexibility** — switch từ MySQL sang PostgreSQL bằng cách change config
3. **Decoupling** — high-level business logic không biết về low-level infrastructure

**DIP = nền tảng của Spring DI** → Xem [Module 05 - Spring Core](../05-spring-core/)

---

## 8. DRY, KISS, YAGNI 🟠

### DRY — Don't Repeat Yourself

> "Every piece of knowledge must have a single, unambiguous representation."

**Common mistake:** Áp dụng DRY quá mức → tạo abstraction không cần thiết.

```java
// ❌ Over-DRY — 2 function tình cờ giống nhau nhưng khác domain
// Gộp chung → sau này change 1 sẽ break cái kia
public BigDecimal calculateAmount(String type, BigDecimal base) {
    if (type.equals("tax")) return base.multiply(TAX_RATE);
    if (type.equals("discount")) return base.multiply(DISCOUNT_RATE);
}

// ✅ Separate — giống nhau bây giờ nhưng có thể diverge
public BigDecimal calculateTax(BigDecimal base) { return base.multiply(TAX_RATE); }
public BigDecimal calculateDiscount(BigDecimal base, DiscountPolicy policy) { /* ... */ }
```

**Rule of Three:** Chờ đến khi duplicate 3 lần rồi mới refactor.

### KISS — Keep It Simple, Stupid

> Giải pháp đơn giản nhất thường là tốt nhất.

```java
// ❌ Over-engineered
public class SmartCacheKeyGenerator implements CacheKeyGenerator {
    @Override
    public String generate(Object... params) {
        return MessageDigest.getInstance("SHA-256")
            .digest(Arrays.stream(params)
                .map(Object::toString)
                .collect(Collectors.joining(":"))
                .getBytes())
            .toString();
    }
}

// ✅ Simple
public class SimpleCacheKeyGenerator implements CacheKeyGenerator {
    @Override
    public String generate(Object... params) {
        return String.join(":", Arrays.stream(params)
            .map(Object::toString)
            .toArray(String[]::new));
    }
}
```

### YAGNI — You Aren't Gonna Need It

> Đừng build feature mà chưa ai yêu cầu.

**Production example:**
> "Tôi đã từng mất 2 tuần build generic plugin system cho notification service 'để sau này dễ mở rộng'. Kết quả: 2 năm chỉ có 3 notification types, plugin system quá phức tạp và mọi người đều confused. Nếu làm lại, tôi chỉ dùng simple if-else ban đầu rồi refactor khi thực sự cần."

---

## 9. Clean Code 🟠

### Principles quan trọng nhất

**1. Meaningful names**
```java
// ❌
int d; // elapsed time in days
List<int[]> list1;

// ✅
int elapsedDays;
List<Cell> flaggedCells;
```

**2. Small functions**
```java
// ❌ 100 lines method
public void processOrder(Order order) {
    // validate... 20 lines
    // calculate... 30 lines
    // save... 20 lines
    // notify... 30 lines
}

// ✅ Each function does ONE thing
public void processOrder(Order order) {
    validate(order);
    BigDecimal total = calculateTotal(order);
    Order saved = save(order, total);
    notifyCustomer(saved);
}
```

**3. Avoid comments — code should explain itself**
```java
// ❌ Comment giải thích code tệ
// Check if the employee is eligible for benefits
if (employee.flags & 0x0004 != 0 && employee.age > 65) { ... }

// ✅ Self-explanatory
if (employee.isEligibleForBenefits()) { ... }
```

**4. Error handling**
```java
// ❌ Return null
public User findUser(Long id) {
    User user = repository.findById(id);
    return user; // null nếu không tìm thấy → NPE potential
}

// ✅ Use Optional
public Optional<User> findUser(Long id) {
    return repository.findById(id);
}

// ✅ hoặc throw meaningful exception
public User getUser(Long id) {
    return repository.findById(id)
        .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
}
```

---

## 10. Interview Questions

### Q1: "Giải thích 4 tính chất OOP" 🔴

#### What interviewer is testing
Không phải kiểm tra bạn nhớ 4 từ. Kiểm tra bạn hiểu bản chất và biết apply.

#### Short answer (30 giây)
> "4 tính chất: Encapsulation ẩn internal state chỉ expose behavior, Inheritance cho code reuse nhưng tôi prefer composition, Polymorphism cho phép cùng interface khác behavior — nền tảng của DI, Abstraction ẩn complexity expose essential features."

#### Strong answer (Senior level)
> "4 tính chất OOP cùng nhau giúp build maintainable code. Nhưng trong thực tế production, tôi thấy quan trọng nhất là Polymorphism và Encapsulation.
>
> Polymorphism là nền tảng cho Dependency Injection trong Spring, Strategy Pattern, và testability. Khi tôi define PaymentGateway là interface, tôi có thể inject Stripe implementation ở production và Mock ở test.
>
> Encapsulation — không phải getter/setter — mà là expose behavior thay vì state. Ví dụ `account.deposit(100)` thay vì `account.setBalance(account.getBalance() + 100)`.
>
> Inheritance tôi dùng rất ít — prefer composition vì loose coupling. Chỉ dùng khi có quan hệ is-a rõ ràng và class hierarchy stable, ví dụ `HttpServletRequest extends ServletRequest`.
>
> Abstraction apply ở mọi level: method → class → module → service."

#### Follow-up questions
1. "Composition vs Inheritance — khi nào dùng cái nào?"
2. "Cho ví dụ OCP trong project của bạn?"
3. "Polymorphism và Strategy Pattern liên quan thế nào?"

---

### Q2: "Giải thích SOLID" 🔴

#### What interviewer is testing
Không phải đọc thuộc 5 principles. Test bạn biết apply thực tế.

#### Short answer
> "SOLID là 5 principles cho maintainable OO design. Trong đó tôi thấy quan trọng nhất cho production code là SRP — mỗi class một responsibility, OCP — extend không modify, và DIP — depend on abstraction — đây chính là foundation của Spring DI."

#### Strong answer
> *(Dùng examples từ [Section 7](#7-solid-principles), liên hệ Spring)*

#### Deep answer
> "Tôi muốn focus vào DIP vì nó fundamental nhất. DIP nói high-level module không depend low-level. Trong Spring, OrderService depend interface OrderRepository, không depend MySqlOrderRepository. Khi test, inject InMemoryRepository. Khi switch database, chỉ change config.
>
> Nhưng cũng cần cẩn thận: quá nhiều abstraction = complexity. Tôi từng thấy project có 1 implementation cho mỗi interface — vô nghĩa. Interface chỉ cần khi có hoặc sẽ có multiple implementations, hoặc cần cho testability."

---

### Q3: "Composition vs Inheritance?" 🔴

#### Strong answer
> *(Dùng examples từ [Section 5](#5-composition-vs-inheritance))*

#### What makes this Tech Lead level?
> "Khi design, tôi hướng dẫn team: default dùng Composition. Chỉ dùng Inheritance khi: (1) có quan hệ is-a rõ ràng, (2) hierarchy stable, (3) framework yêu cầu (extend AbstractController). Lý do: composition dễ test, dễ change, tránh fragile base class. Code review nếu thấy `extends` tôi sẽ hỏi 'có thể dùng composition được không?'"

---

### Q4: "Clean Code theo bạn là gì?" 🟠

#### Senior answer
> "Clean code là code mà developer khác đọc vào hiểu được mà không cần hỏi tác giả. Cụ thể: meaningful names, small focused functions, minimal comments (code tự giải thích), proper error handling dùng exceptions thay vì return codes, và consistent formatting.
>
> Nhưng clean code không phải mục tiêu — nó là phương tiện. Mục tiêu là maintainability và developer productivity. Đôi khi code 'không clean' nhưng đúng performance requirement thì OK — miễn có comment giải thích tại sao."

---

## 11. Cheat Sheet

```
┌─────────────────────────────────────────────┐
│           OOP & SOLID CHEAT SHEET           │
├─────────────────────────────────────────────┤
│                                             │
│ OOP:                                        │
│ • Encapsulation = hide state, expose behavior│
│ • Inheritance = is-a, prefer composition    │
│ • Polymorphism = same interface, diff impl  │
│ • Abstraction = hide complexity             │
│                                             │
│ SOLID:                                      │
│ • S = 1 class, 1 reason to change           │
│ • O = extend, don't modify                  │
│ • L = subclass replaces superclass safely   │
│ • I = small interfaces > fat interface      │
│ • D = depend on abstraction, not concrete   │
│                                             │
│ Rules:                                      │
│ • Composition > Inheritance (default)       │
│ • Interface > Abstract Class (default)      │
│ • Rule of 3 before DRY                      │
│ • YAGNI — don't build what's not needed     │
│ • DIP = foundation of Spring DI             │
│                                             │
│ Common interview traps:                     │
│ • "OOP 4 tính chất?" → Don't just list them │
│ • "SOLID?" → Give production examples       │
│ • "Clean Code?" → It's a means, not a goal  │
│                                             │
└─────────────────────────────────────────────┘
```

---

> → Tiếp theo: [02-java-language.md](./02-java-language.md)
