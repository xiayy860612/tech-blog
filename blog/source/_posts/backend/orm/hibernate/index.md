---
title: Spring JPA + Hibernate 实践
date: 2026-01-18 20:00:00
categories:
- backend
tags:
- Hibernate
- ORM
---

Hibernate 是 JPA（Jakarta Persistence API）的一个实现，
一般情况下，建议使用 JPA 标准提供的接口。

Spring Data JPA 简化了 JPA 的使用，通过**接口命名约定**自动生成查询实现。

<!--more-->

Spring Data JPA，JPA 和 Hibernate 的关系：

| 方面      | JPA                           | Spring Data JPA          | Hibernate          |
|-----------|-------------------------------|--------------------------|--------------------|
| 性质      | 规范/标准                      | JPA 抽象层             | JPA 实现           |
| 接口      | `EntityManager`                | `JpaRepository`          | `Session`          |
| 注解      | `jakarta.persistence.*`        | `@Query` 命名           | `org.hibernate.*`  |
| 查询语言  | JPQL                          | 方法名、`@Query`          | HQL                |

## Entity 定义

Entity（实体）是 Java 类与数据库表的映射，Entity 定义的要求：

- 必须有 `@Entity` 注解
- 必须有无参构造函数（可以是 `public` 或 `protected`）
- 必须有一个主键属性（`@Id`）
- 不能是 `final` 类
- 必须有持久化属性（字段或属性访问）

```java
@Entity
class Book {
    Book() {} // 必须有无参构造函数

    @Id
    Long id;

    String title;
}
```

### 主键

主键（Id）是实体**唯一标识**，映射到数据库表的**主键列**。

#### 自增主键

使用 `@GeneratedValue` 生成主键：

```java
@Entity
class Book {
    @Id
    @GeneratedValue
    Long id; // 使用数据库自增或序列生成
}
```

JPA 定义了多种生成策略：

| 策略 | 说明 |
|------|------|
| `GenerationType.IDENTITY` | 数据库自增列（MySQL `AUTO_INCREMENT`） |
| `GenerationType.SEQUENCE` | 数据库序列（PostgreSQL `SEQUENCE`） |
| `GenerationType.UUID` | Java UUID 生成 |
| `GenerationType.AUTO` | JPA 自动选择 |

#### 自然主键

如果使用业务字段作为主键（如 ISBN），不需要 `@GeneratedValue`：

```java
@Entity
class Book {
    @Id
    String isbn; // 应用程序负责赋值
}
```

### 复合主键

复合主键，即主键由多个字段组成。

在 Hibernate 中，当数据库表使用复合主键时，有两种方式来映射：

- `@IdClass`
- （推荐）`@EmbeddedId`，它可以消除一些重复代码

```java
@Embeddable
record BookId(String isbn, int printing) {}

@Entity
class Book {
    @EmbeddedId
    BookId bookId;
}
```

### 继承

JPA 支持多种实体继承映射策略，用于将继承层次结构映射到数据库。

| 策略             | 说明                              | 优点                     | 缺点                           |
|------------------|-----------------------------------|--------------------------|--------------------------------|
| `SINGLE_TABLE`   | 所有类在同一张表，通过鉴别器列区分 | 查询性能好，无 JOIN      | 字段可能为 NULL，约束弱        |
| `JOINED`         | 每个类一张表，通过 JOIN 关联      | 规范化，约束完整         | 查询需要 JOIN，性能较差        |
| `TABLE_PER_CLASS`| 每个具体类一张表，包含所有字段    | 无 NULL 字段             | 查询复杂，需要 UNION           |

#### SINGLE_TABLE（单表继承）

**所有子类**数据存储在**同一张表**中，通过**鉴别器列**区分类型：

```java
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "book_type", discriminatorType = DiscriminatorType.STRING)
public abstract class Book {
    @Id
    @GeneratedValue
    private Long id;

    private String title;

    // 共享字段
    private String isbn;
}

@Entity
@DiscriminatorValue("EBOOK")
public class EBook extends Book {
    private String downloadUrl;
    private Double fileSize; // MB
}

@Entity
@DiscriminatorValue("PRINT")
public class PrintedBook extends Book {
    private Integer pageCount;
    private String dimensions; // e.g., "6x9"
}
```

生成的表结构：

```sql
CREATE TABLE book (
    id BIGINT PRIMARY KEY,
    book_type VARCHAR(31), -- 鉴别器列
    title VARCHAR(255),
    isbn VARCHAR(255),
    downloadUrl VARCHAR(255), -- EBook 专用，PrintedBook 为 NULL
    fileSize DOUBLE,          -- EBook 专用，PrintedBook 为 NULL
    pageCount INTEGER,        -- PrintedBook 专用，EBook 为 NULL
    dimensions VARCHAR(255)   -- PrintedBook 专用，EBook 为 NULL
);
```

#### JOINED（连接表继承）

每个类一张表，通过 JOIN 关联：

```java
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Book {
    @Id
    @GeneratedValue
    private Long id;

    private String title;
    private String isbn;
}

@Entity
public class EBook extends Book {
    private String downloadUrl;
    private Double fileSize;
}

@Entity
public class PrintedBook extends Book {
    private Integer pageCount;
    private String dimensions;
}
```

生成的表结构：

```sql
CREATE TABLE book (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255),
    isbn VARCHAR(255)
);

CREATE TABLE ebook (
    ebook_id BIGINT PRIMARY KEY REFERENCES book(id),
    download_url VARCHAR(255),
    file_size DOUBLE
);

CREATE TABLE printed_book (
    printed_book_id BIGINT PRIMARY KEY REFERENCES book(id),
    page_count INTEGER,
    dimensions VARCHAR(255)
);
```

#### TABLE_PER_CLASS（每个具体类一张表）

每个具体类一张完整的表，包含**所有字段（包括继承的字段）**：

```java
@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public abstract class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.TABLE)
    private Long id;

    private String title;
    private String isbn;
}

@Entity
public class EBook extends Book {
    private String downloadUrl;
    private Double fileSize;
}

@Entity
public class PrintedBook extends Book {
    private Integer pageCount;
    private String dimensions;
}
```

生成的表结构：

```sql
CREATE TABLE ebook (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255),
    isbn VARCHAR(255),
    download_url VARCHAR(255),
    file_size DOUBLE
);

CREATE TABLE printed_book (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255),
    isbn VARCHAR(255),
    page_count INTEGER,
    dimensions VARCHAR(255)
);
```

**注意**：`TABLE_PER_CLASS` 策略下，主键生成策略不能使用 `IDENTITY`。

#### Mapped Superclass（映射超类）

当父类**不需要作为独立实体存储**时，使用 `@MappedSuperclass`：

```java
@MappedSuperclass
public abstract class BaseEntity {
    @Id
    @GeneratedValue
    private Long id;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}

@Entity
public class Book extends BaseEntity {
    private String title;
    private String isbn;
}

@Entity
public class Author extends BaseEntity {
    private String name;
    private String email;
}
```

生成的表只包含子类字段和父类的持久化字段：

```sql
CREATE TABLE book (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    title VARCHAR(255),
    isbn VARCHAR(255)
);

CREATE TABLE author (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    name VARCHAR(255),
    email VARCHAR(255)
);
```

### Auditing

JPA Auditing 用于自动跟踪实体的创建、修改时间等信息。

启用 JPA Auditing

```java
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
```

使用审计注解 `@EntityListeners(AuditingEntityListener.class)` 监听是否更新审计字段：

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class Auditable {

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String modifiedBy;
}

@Entity
public class Book extends Auditable {
    @Id
    @GeneratedValue
    private Long id;

    private String title;
}
```

#### AuditingAware 获取当前用户

```java
@Component
public class AuditingAwareImpl implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        // 从 Spring Security 获取当前用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        return Optional.of(authentication.getName());
    }
}
```

### 软删除/逻辑删除（Soft Delete）

使用 `@Where + @SQLDelete` 注解实现软删除：

```java
import org.hibernate.annotations.SQLDelete;

@Entity
@SQLDelete(sql = "UPDATE book SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Book {

    @Id
    @GeneratedValue
    private Long id;

    private String title;

    private boolean deleted = false;
}
```

## Relational Mapping

使用关联时的实践：

- 一般情况下，尽量使用**单向关联**，避免双向关联增加代码复杂度。
- 一般情况下，关联都应该采取**延迟获取**的方式。
- 优先使用**多对一**，而针对一对多的场景通过**查询表达式**来执行。
- 所有关联字段必须显式指定 `@JoinColumn`

### Many-to-One

多对一关联映射到外键，是 ORM 中最基本的关联类型：

```java
@Entity
class Book {
    @Id @GeneratedValue
    Long id;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "publisher_id")
    Publisher publisher;
}
```

### One-to-One

一对一关联有两种映射方式：

#### 主键和外键分离

```java
@Entity
class Author {
    @Id
    Long id;

    @OneToOne(optional = false, fetch = LAZY)
    Person person;
}
```

Author 和 Person 的关系可以是**组合关系**，也可以是**聚合关系**，通过业务逻辑进行控制。

#### 主键和外键不分离

```java
@Entity
class Author {
    @Id
    Long id;

    @OneToOne(optional = false, fetch = LAZY)
    @MapsId
    Person person;
}
```

使用 `@MapsId` 时，`Author` 表的主键列 id 同时也是指向 `Person` 表主键的外键。
Author 和 Person 关系是**聚合关系**，Author 的生命周期跟随 Person 的生命周期，
如果 Person 被删除了，相关联的所有 Author 也需要被删除。

## Spring JPA

Spring Data JPA 简化了 JPA 的使用

核心优势：

- **无需编写实现类**：继承 `JpaRepository` 接口即可获得 CRUD 功能
- **自动生成查询**：方法名遵循**命名约定**即可自动生成 JPQL 查询
- **自动分页和排序**：支持 `Pageable` 和 `Sort` 参数
- **与 Spring 生态集成**：无缝集成 Spring 的事务管理和依赖注入

### 查询

根据**命名约定**，通过方法名自动生成查询实现。

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    // 自动生成：select b from Book b where b.title = ?1
    Book findByTitle(String title);

    // 自动生成：select b from Book b where b.title like ?1
    List<Book> findByTitleLike(String titlePattern);

    // 自动生成：select b from Book b where b.publisher.id = ?1
    List<Book> findByPublisherId(Long publisherId);
}
```

Spring Data JPA 查询方法命名约定：
`<find|read|get|query>[<First>|<Top<number>>|<Distinct>]By<condition>[<And|Or><condition>...][OrderBy<Field>[Desc|Asc][<Field>[Desc|Asc]...]]`

- `condition`
  - 区间查询，`Between|LessThan|GreaterThan`
  - 字符串查询，`Like|NotLike|Containing|Containing|StartingWith`
  - 列表查询，`In|NotIn`
  - Null 检查，`IsNull|IsNotNull`
  - 取反，`Not`

#### @Query 注解

使用 `@Query` 自定义 JPQL 或原生 SQL：

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    @Query("select b from Book b where b.title = :title")
    List<Book> findByTitleNamed(@Param("title") String title);

    @Query(value = "select * from books where isbn = :isbn", nativeQuery = true)
    Book findByIsbnNative(@Param("isbn") String isbn);
}
```

#### 分页查询

使用 `Pageable` 参数实现分页：

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    Page<Book> findByPublisherId(Long publisherId, Pageable pageable);
}

// 使用示例
Pageable pageable = PageRequest.of(0, 20, Sort.by("title"));
Page<Book> books = bookRepository.findByPublisherId(publisherId, pageable);
```

#### 排序查询

使用 `Sort` 参数实现排序：

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    // 按标题升序
    List<Book> findByPublisherId(Long publisherId, Sort sort);

    // 同时支持排序和分页
    Page<Book> findByPublisherId(Long publisherId, Pageable pageable);
}

List<Book> books = bookRepository.findByPublisherId(
    publisherId, Sort.by("title").and(Sort.by("id").descending())
);
```

#### Fetch Join

JPA 默认是`懒加载 + 逐条触发查询`。当要批量查询相关联的数据时，一般采用 `fetch join`，避免 **N+1 查询**，并且 ORM 还能正常的管理对象。

```java
@Entity
class Book {
    @ManyToOne(fetch = LAZY)
    Author author;
}

@Query("""
select b from Book b
join fetch b.author
""")
List<Book> findAllWithAuthor();
```

#### Specification

`Specification` 接口用于构建**动态查询**，适用于根据运行时的条件组合查询的场景。
相关的 Repository 需要继承 `JpaSpecificationExecutor` 才可以执行 Specification 的查询。

```java
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {
}
```

定义 Specification：

```java
public class BookSpecs {

    // 标题包含指定关键词
    public static Specification<Book> titleContains(String keyword) {
        return (root, query, cb) ->
            cb.like(root.get("title"), "%" + keyword + "%");
    }

    // 出版社 ID 匹配
    public static Specification<Book> hasPublisher(Long publisherId) {
        return (root, query, cb) ->
            cb.equal(root.get("publisher").get("id"), publisherId);
    }

    // 价格在指定区间
    public static Specification<Book> priceBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) ->
            cb.between(root.get("price"), min, max);
    }
}
```

使用 Specification 组合查询：

```java
@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    // 单个条件
    public List<Book> searchByKeyword(String keyword) {
        return bookRepository.findAll(BookSpecs.titleContains(keyword));
    }

    // 组合多个条件（AND）
    public List<Book> searchBooks(String keyword, Long publisherId) {
        return bookRepository.findAll(
            Specification.where(BookSpecs.titleContains(keyword))
                .and(BookSpecs.hasPublisher(publisherId))
        );
    }

    // 组合多个条件（OR）
    public List<Book> searchBooksOr(String keyword, Long publisherId) {
        return bookRepository.findAll(
            Specification.where(BookSpecs.titleContains(keyword))
                .or(BookSpecs.hasPublisher(publisherId))
        );
    }

    // 分页 + Specification
    public Page<Book> searchBooksWithPagination(
        String keyword,
        Long publisherId,
        Pageable pageable
    ) {
        Specification<Book> spec = Specification.where(BookSpecs.titleContains(keyword))
            .and(BookSpecs.hasPublisher(publisherId));
        return bookRepository.findAll(spec, pageable);
    }
}
```

##### Join 查询

TODO

#### Projections

Projections（投影）用于只查询实体的部分字段，避免查询不需要的数据。

**Projections 注意事项**：

1. **性能优化**：只查询需要的字段，减少数据传输
2. **只读**：投影接口返回的数据是**只读的**，不能用于修改操作
3. **延迟加载**：投影接口中访问关联属性可能触发额外的查询
4. **类型安全**：基于接口的投影在编译时检查类型

##### 基于接口的投影

定义投影接口：

```java
// 只包含标题和作者
public interface BookTitleAndAuthor {
    String getTitle();
    String getAuthor();
}

// 只包含标题和价格
public interface BookTitleAndPrice {
    String getTitle();
    BigDecimal getPrice();
}
```

在 Repository 中使用：

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    // 返回投影接口
    List<BookTitleAndAuthor> findByPublisherId(Long publisherId);

    BookTitleAndPrice findProjectionById(Long id);
}
```

##### 基于类的投影（DTO）

最常用的方式，通过定义 DTO 类：

```java
public class BookSummary {
    private final String title;
    private final String author;
    private final BigDecimal price;

    public BookSummary(String title, String author, BigDecimal price) {
        this.title = title;
        this.author = author;
        this.price = price;
    }

    // Getters
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public BigDecimal getPrice() { return price; }
}
```

在 Repository 中使用：

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    List<BookSummary> findByPublisherId(Long publisherId);

    // 使用 @Query 自定义投影
    @Query("select new com.example.BookSummary(b.title, b.author, b.price) " +
           "from Book b where b.publisher.id = :publisherId")
    List<BookSummary> findSummaryByPublisherId(@Param("publisherId") Long publisherId);
}
```

##### 动态投影

支持根据调用方选择返回类型：

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    <T> List<T> findByPublisherId(Long publisherId, Class<T> type);
}
```

使用示例：

```java
// 返回完整实体
List<Book> books = bookRepository.findByPublisherId(1L, Book.class);

// 返回投影接口
List<BookTitleAndAuthor> projections = bookRepository.findByPublisherId(1L, BookTitleAndAuthor.class);

// 返回 DTO
List<BookSummary> summaries = bookRepository.findByPublisherId(1L, BookSummary.class);
```

##### 嵌套投影

处理关联实体的投影：

```java
// 出版社投影
public interface PublisherProjection {
    String getName();
}

// 书籍投影（包含出版社投影）
public interface BookWithPublisher {
    String getTitle();
    PublisherProjection getPublisher();
}
```

### 事务

Spring Data JPA 方法默认使用 `@Transactional` 注解，自动管理事务。

```java
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    // 只读事务
    @Transactional(readOnly = true)
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    // 读写事务，指定回滚条件
    @Transactional(rollbackFor = {Exception.class})
    public Book createBook(String title) {
        Book book = new Book();
        book.setTitle(title);
        return bookRepository.save(book);
    }
}
```

#### 编程式事务

除了使用 `@Transactional` 注解，还可以使用 `TransactionTemplate` 通过编程方式自定义事务：

```java
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.TransactionDefinition;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    // 编程式事务
    public Book createBookWithTemplate(String title) {
        return transactionTemplate.execute(status -> {
            Book book = new Book();
            book.setTitle(title);
            return bookRepository.save(book);
        });
    }
}
```

**何时使用编程式事务**：

- 需要在同一个方法中执行多个 Repository 调用，并要求它们在同一个事务中
- 需要根据运行时条件动态决定事务属性
- 需要对返回值进行特殊处理，并在事务提交后才执行

### 修改

修改操作注意事项

1. **脏检查自动更新**：JPA 会自动检测实体的变化并在事务提交时同步到数据库
2. **@Transactional 必需**：删除和批量更新操作需要在事务中执行
3. **@Modifying 清除持久化上下文**：使用 `@Modifying` 后，EntityManager 会清除缓存，需要重新查询

#### JpaRepository

通过继承 `JpaRepository` 接口即可获得 CRUD 功能

##### Save（保存和更新）

`save()` 方法用于保存新实体或更新已有实体：

```java
@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    // 新增实体
    public Book createBook(String title) {
        Book book = new Book();
        book.setTitle(title);
        return bookRepository.save(book); // INSERT
    }

    // 更新实体
    public Book updateTitle(Long id, String newTitle) {
        Book book = bookRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Book not found"));
        book.setTitle(newTitle);
        return bookRepository.save(book); // UPDATE
    }
}
```

`save()` 的行为：

- 如果实体的 ID 为 `null`，执行 `INSERT`
- 如果实体的 ID 不为 `null` 且存在于数据库，执行 `UPDATE`
- 如果实体的 ID 不为 `null` 但不存在于数据库，可能抛出异常（取决于 ID 生成策略）

##### SaveAll（批量保存）

使用 `saveAll()` 批量保存或更新：

```java
List<Book> books = List.of(
    new Book("9781932394153", "Hibernate in Action"),
    new Book("9781932394887", "Java Persistence with Hibernate")
);
List<Book> savedBooks = bookRepository.saveAll(books);
```

##### Delete（删除）

Spring Data JPA 提供多种删除方式：

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    // 按 ID 删除（JpaRepository 提供）
    void deleteById(Long id);

    // 删除实体（JpaRepository 提供）
    void delete(Book book);

    // 批量删除（JpaRepository 提供）
    void deleteAll(List<Book> books);
    void deleteAll();

    // 删除所有并返回被删除的实体
    List<Book> deleteAllBy();
}
```

#### @Modifying 注解

使用 `@Modifying + @Query` 注解自定义修改操作：

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    @Modifying
    @Query("update Book b set b.title = :title where b.id = :id")
    int updateTitle(@Param("id") Long id, @Param("title") String title);

    @Modifying
    @Query("delete from Book b where b.title = :title")
    int deleteByTitle(@Param("title") String title);

    @Modifying
    @Query("update Book b set b.available = false where b.publishDate < :date")
    int expireOldBooks(@Param("date") LocalDate date);
}
```

## Reference

- [Hibernate实战（第2版）](https://book.douban.com/subject/26902437/)
- [Hibernate ORM 官方文档](https://docs.hibernate.org/orm/7.2/introduction/html_single/)
- [Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/jpa.html)
