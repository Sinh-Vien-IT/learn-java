# MODULE 5 — SPRING CORE 🔴

> **Mục tiêu:** Hiểu Spring không chỉ ở level "dùng @Autowired" mà ở level "Spring Proxy hoạt động thế nào, tại sao @Transactional không work trong self-invocation".
> Đây là câu hỏi phân biệt "biết dùng Spring" vs "hiểu Spring".

---

## Mục Lục

1. [IoC & Dependency Injection](#1-ioc--dependency-injection)
2. [Bean Lifecycle](#2-bean-lifecycle)
3. [Bean Scope](#3-bean-scope)
4. [Component Annotations](#4-component-annotations)
5. [Spring Proxy & AOP](#5-spring-proxy--aop)
6. [@Transactional Pitfalls](#6-transactional-pitfalls)
7. [Interview Questions](#7-interview-questions)
8. [Cheat Sheet](#8-cheat-sheet)

---

## 1. IoC & Dependency Injection 🔴

### Inversion of Control — Bản chất

```
Truyền thống (no IoC):
  → Class tự tạo dependencies
  → OrderService creates MySqlRepository directly
  → Tight coupling

IoC:
  → Container tạo và inject dependencies
  → OrderService nhận Repository qua constructor
  → Loose coupling

DI là MỘT CÁCH implement IoC.
```

### 3 Cách Inject

```java
// 1. ✅ Constructor Injection (RECOMMENDED)
@Service
public class OrderService {
    private final OrderRepository repository;    // final = immutable
    private final PaymentGateway paymentGateway;
    
    // Spring auto-detect constructor (nếu chỉ có 1)
    // @Autowired optional từ Spring 4.3
    public OrderService(OrderRepository repository, PaymentGateway paymentGateway) {
        this.repository = repository;
        this.paymentGateway = paymentGateway;
    }
}

// 2. ⚠️ Setter Injection (khi dependency optional)
@Service
public class NotificationService {
    private EmailSender emailSender;
    
    @Autowired(required = false)  // optional dependency
    public void setEmailSender(EmailSender emailSender) {
        this.emailSender = emailSender;
    }
}

// 3. ❌ Field Injection (avoid!)
@Service
public class OrderService {
    @Autowired
    private OrderRepository repository;  // ❌ không final, khó test, hide dependencies
}
```

### Tại sao Constructor Injection tốt nhất?

| Benefit | Constructor | Field | Setter |
|---------|------------|-------|--------|
| Immutable (final) | ✅ | ❌ | ❌ |
| Required dependencies clear | ✅ | ❌ | ❌ |
| Testability (no reflection) | ✅ | ❌ (need reflection/Spring) | ✅ |
| Circular dependency detection | ✅ (fail fast at startup) | ❌ (runtime error) | ❌ |
| Plain Java (no annotations) | ✅ (Spring 4.3+) | ❌ | ❌ |

### @Qualifier & @Primary

```java
// Khi có multiple implementations
public interface PaymentGateway { }

@Component("stripe")
public class StripeGateway implements PaymentGateway { }

@Component("paypal")
@Primary  // default khi không specify
public class PayPalGateway implements PaymentGateway { }

// Usage
@Service
public class PaymentService {
    // Inject specific implementation
    public PaymentService(@Qualifier("stripe") PaymentGateway gateway) {
        this.gateway = gateway;
    }
}

// Or inject all implementations
@Service
public class PaymentService {
    private final List<PaymentGateway> gateways; // Spring injects ALL
}
```

---

## 2. Bean Lifecycle 🔴

### Lifecycle Flow

```
1. Instantiation        → Constructor called
2. Populate Properties  → DI inject dependencies
3. BeanNameAware        → setBeanName()
4. BeanFactoryAware     → setBeanFactory()
5. ApplicationContextAware → setApplicationContext()
6. BeanPostProcessor    → postProcessBeforeInitialization()
7. @PostConstruct       → Custom init method ← DÙNG NHIỀU
8. InitializingBean     → afterPropertiesSet()
9. Custom init-method   → @Bean(initMethod="init")
10. BeanPostProcessor   → postProcessAfterInitialization() ← AOP PROXY TẠO Ở ĐÂY
11. Bean ready to use
    ...
12. @PreDestroy          → Custom cleanup ← DÙNG NHIỀU
13. DisposableBean       → destroy()
14. Custom destroy-method
```

### Production-relevant hooks

```java
@Service
public class CacheService {
    
    @PostConstruct
    public void init() {
        // Load cache data from DB
        // Validate configuration
        // Connect to external services
        log.info("CacheService initialized, loaded {} entries", cache.size());
    }
    
    @PreDestroy
    public void cleanup() {
        // Close connections
        // Flush data
        // Deregister listeners
        log.info("CacheService shutting down");
    }
}
```

### BeanPostProcessor — How Spring works internally

```java
// BeanPostProcessor là mechanism Spring dùng để tạo AOP proxies, 
// inject dependencies, resolve annotations, etc.

public interface BeanPostProcessor {
    // Before @PostConstruct
    Object postProcessBeforeInitialization(Object bean, String beanName);
    
    // After @PostConstruct — nơi AOP proxy được tạo
    Object postProcessAfterInitialization(Object bean, String beanName);
    // Return proxy object thay vì original bean!
}
```

---

## 3. Bean Scope 🔴

| Scope | Lifecycle | Use case |
|-------|-----------|----------|
| **singleton** (default) | 1 instance per ApplicationContext | Services, repositories, config |
| **prototype** | New instance mỗi lần inject/getBean | Stateful beans, builders |
| request | 1 instance per HTTP request | Request-scoped data |
| session | 1 instance per HTTP session | Session-scoped data |
| application | 1 instance per ServletContext | App-wide shared state |

### ⚠️ Singleton + Prototype Trap

```java
@Service // singleton
public class OrderService {
    @Autowired
    private ShoppingCart cart; // prototype — NHƯNG CHỈ INJECT 1 LẦN!
    // cart CÙNG instance cho MỌI requests → BUG!
}

// Fix 1: ObjectProvider (lazy lookup)
@Service
public class OrderService {
    private final ObjectProvider<ShoppingCart> cartProvider;
    
    public void process() {
        ShoppingCart cart = cartProvider.getObject(); // new instance mỗi lần
    }
}

// Fix 2: @Scope proxyMode
@Component
@Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class ShoppingCart { }
```

---

## 4. Component Annotations 🟠

```java
@Component        // Generic Spring-managed bean
@Service          // Business logic layer (semantic, same as @Component)
@Repository       // Data access layer (+ exception translation)
@Controller       // MVC controller (return view)
@RestController   // REST controller (= @Controller + @ResponseBody)
@Configuration    // Configuration class (contains @Bean methods)

// Difference? Mostly SEMANTIC — help readability
// @Repository has extra: PersistenceExceptionTranslationPostProcessor
// → translates DB exceptions to Spring DataAccessException hierarchy
```

### @Configuration vs @Component

```java
// @Configuration: @Bean methods are PROXIED — singleton guarantee
@Configuration
public class AppConfig {
    @Bean
    public DataSource dataSource() {
        return new HikariDataSource(config());
    }
    
    @Bean
    public JdbcTemplate jdbcTemplate() {
        return new JdbcTemplate(dataSource()); // gọi dataSource() LẦN NỮA
        // Nhưng Spring proxy intercept → return CÙNG instance!
    }
}

// @Component: @Bean methods NOT proxied — mỗi call = new instance
@Component
public class AppConfig {
    @Bean
    public JdbcTemplate jdbcTemplate() {
        return new JdbcTemplate(dataSource()); // GỌI dataSource() TẠO INSTANCE MỚI!
    }
}
// → @Bean trong @Configuration mới đảm bảo singleton!
```

---

## 5. Spring Proxy & AOP 🔴🔴

### Spring Proxy — Cách Spring "magic" hoạt động

```
Khi bạn @Autowired một @Service, bạn KHÔNG nhận original object.
Bạn nhận PROXY object.

@Service
public class OrderService {
    @Transactional
    public void createOrder(OrderRequest req) { ... }
}

Thực tế:
┌────────────────────┐          ┌────────────────────┐
│   Proxy Object     │          │  Real OrderService  │
│                    │          │                     │
│ createOrder():     │          │ createOrder():      │
│   1. Begin TX      │──call──→│   Business logic    │
│   2. Delegate      │          │                     │
│   3. Commit TX     │          │                     │
│   (or Rollback)    │          │                     │
└────────────────────┘          └────────────────────┘

Client → Proxy → Real object
Client không biết đang nói chuyện với proxy
```

### 2 Loại Proxy

```
1. JDK Dynamic Proxy (default cho interfaces):
   → Implement CÙNG interface
   → Chỉ proxy interface methods
   → Target class PHẢI implement interface

2. CGLIB Proxy (default Spring Boot):
   → Extend target class (subclass)
   → Proxy TẤT CẢ public methods
   → Target class KHÔNG cần interface
   → ❌ Không proxy final methods/classes
   
Spring Boot default: CGLIB (spring.aop.proxy-target-class=true)
```

### AOP Concepts

```java
// Aspect: cross-cutting concern (logging, security, transaction)
// Advice: what to do (before, after, around)
// Pointcut: where to apply (which methods)
// Join Point: execution point (method execution)

@Aspect
@Component
public class LoggingAspect {
    
    // Pointcut: tất cả methods trong package service
    @Around("execution(* com.myapp.service.*.*(..))")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        
        Object result = joinPoint.proceed(); // gọi method thực
        
        long duration = System.currentTimeMillis() - start;
        log.info("{}.{} took {}ms", 
            joinPoint.getSignature().getDeclaringTypeName(),
            joinPoint.getSignature().getName(), 
            duration);
        
        return result;
    }
}
```

### AOP Use Cases (Production)

| Use case | Advice type | Example |
|----------|-------------|---------|
| Logging | @Around | Log execution time, parameters |
| Transaction | @Around | @Transactional |
| Security | @Before | @PreAuthorize |
| Caching | @Around | @Cacheable |
| Retry | @Around | @Retryable |
| Exception handling | @AfterThrowing | Log and translate exceptions |

---

## 6. @Transactional Pitfalls 🔴🔴

### Pitfall 1: Self-Invocation (KINH ĐIỂN) 🔴

```java
@Service
public class OrderService {
    
    public void processOrder(OrderRequest req) {
        // ...
        createOrder(req); // ❌ SELF-INVOCATION — @Transactional KHÔNG WORK!
    }
    
    @Transactional
    public void createOrder(OrderRequest req) {
        // Expect transaction... but NO transaction!
    }
}
```

**Tại sao?**
```
processOrder() gọi createOrder() trực tiếp qua 'this'
→ BYPASS proxy!
→ @Transactional là AOP proxy behavior
→ Proxy chỉ intercept khi gọi TỪ BÊN NGOÀI

External call:   Proxy.createOrder() → TX begin → Real.createOrder() → TX commit ✅
Self-invocation:  Real.processOrder() → Real.createOrder() → NO TX ❌
```

**Fix:**
```java
// Fix 1: Tách ra service khác
@Service
public class OrderService {
    private final OrderCreationService creationService;
    
    public void processOrder(OrderRequest req) {
        creationService.createOrder(req); // external call → proxy intercept ✅
    }
}

// Fix 2: Inject self (not ideal)
@Service
public class OrderService {
    @Autowired
    private OrderService self; // proxy instance
    
    public void processOrder(OrderRequest req) {
        self.createOrder(req); // through proxy ✅
    }
}

// Fix 3: ApplicationContext.getBean()
// Fix 4: AopContext.currentProxy() (cần enable expose-proxy)
```

### Pitfall 2: Exception Type

```java
@Transactional // Chỉ rollback RuntimeException + Error!
public void process() {
    // ...
    throw new IOException("file error"); // Checked exception → NO rollback! ❌
}

// Fix:
@Transactional(rollbackFor = Exception.class) // rollback mọi exception
@Transactional(rollbackFor = {IOException.class, BusinessException.class})
```

### Pitfall 3: Private Methods

```java
@Service
public class OrderService {
    
    @Transactional // ❌ IGNORED — proxy không intercept private methods!
    private void internalMethod() { }
}
// CGLIB proxy extends class → override methods → private KHÔNG override được
```

### Pitfall 4: Not In Spring Context

```java
// ❌ new OrderService() — không phải Spring bean → không có proxy → @Transactional ignored
OrderService service = new OrderService(); 
service.createOrder(req); // NO transaction!

// ✅ Phải lấy từ Spring context
@Autowired OrderService service; // Spring inject proxy
```

---

## 7. Interview Questions

### Q1: "Spring IoC/DI là gì?" 🔴

#### Strong answer
> "IoC là nguyên tắc: object không tự tạo dependencies, container tạo và inject cho nó. DI là implementation: Spring ApplicationContext quản lý lifecycle beans và inject dependencies qua constructor, setter, hoặc field.
>
> Tôi prefer constructor injection vì: fields là final (immutable), required dependencies rõ ràng, dễ test (không cần Spring context), fail fast nếu circular dependency."

### Q2: "Spring Proxy hoạt động thế nào?" 🔴

#### Strong answer
> "Khi Spring tạo bean có AOP annotation (@Transactional, @Cacheable, @Async), BeanPostProcessor tạo proxy object. Client nhận proxy thay vì real object.
>
> 2 loại: JDK Dynamic Proxy (cho interface, implement cùng interface) và CGLIB (cho class, extend class thành subclass). Spring Boot default CGLIB.
>
> Proxy intercept method call, thực hiện cross-cutting logic (begin TX, check cache, etc.), rồi delegate cho real object. Đó là lý do self-invocation không work — gọi `this.method()` bypass proxy."

#### Follow-up: "Tại sao @Transactional đôi khi không hoạt động?"
> "4 lý do chính: (1) Self-invocation — gọi method khác trong cùng class bypass proxy. (2) Private method — proxy không override private. (3) Checked exception — default chỉ rollback RuntimeException. (4) Object không phải Spring bean — new trực tiếp, không có proxy."

### Q3: "Bean scope nào bạn dùng nhiều nhất?" 🟠

#### Strong answer
> "Singleton — 99% cases. Services, repositories, configs đều stateless → singleton tốt nhất. Prototype rất hiếm, chỉ khi cần stateful bean mới mỗi lần dùng, nhưng phải cẩn thận inject prototype vào singleton — dùng ObjectProvider."

### Q4: "@Configuration vs @Component cho @Bean?" 🟠

#### Strong answer
> "@Configuration proxy @Bean methods — gọi dataSource() 2 lần vẫn trả về cùng instance. @Component không proxy — mỗi call tạo instance mới. Luôn dùng @Configuration cho config classes với @Bean."

---

## 8. Cheat Sheet

```
┌──────────────────────────────────────────────────────────────┐
│                  SPRING CORE CHEAT SHEET                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ DI:                                                          │
│ • Constructor injection = BEST (final, testable, clear)      │
│ • Field injection = AVOID (hide deps, untestable)            │
│ • @Qualifier = choose specific impl                          │
│ • @Primary = default impl                                    │
│                                                              │
│ Bean Lifecycle:                                               │
│ • Constructor → DI → @PostConstruct → ... → @PreDestroy      │
│ • Proxy created in postProcessAfterInitialization             │
│                                                              │
│ Proxy:                                                       │
│ • JDK = interface-based, CGLIB = class-based (default SB)    │
│ • Self-invocation bypasses proxy!                             │
│ • Private methods NOT proxied                                │
│ • @Transactional, @Cacheable, @Async = proxy-based           │
│                                                              │
│ @Transactional Pitfalls:                                     │
│ 1. Self-invocation → bypass proxy → NO TX                    │
│ 2. Private method → NOT proxied                              │
│ 3. Checked exception → NO rollback (use rollbackFor)         │
│ 4. Not Spring bean → NO proxy                                │
│                                                              │
│ Scope:                                                       │
│ • Singleton (default, 99% cases)                             │
│ • Prototype + Singleton = trap (use ObjectProvider)           │
│ • @Configuration @Bean = proxied (singleton guarantee)       │
│ • @Component @Bean = NOT proxied                             │
│                                                              │
│ Interview killer questions:                                   │
│ • "Why self-invocation breaks @Transactional?"               │
│ • "How does Spring create proxies?"                          │
│ • "Constructor vs Field injection?"                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> → Tiếp theo: [Module 06 - Spring Boot](../06-spring-boot/)
