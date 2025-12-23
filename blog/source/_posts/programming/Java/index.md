---
title: Java
date: 2024-05-08 20:00:00
categories:
- programming language
tags:
- Java
- programming language
---

Java 语言特性梳理

<!--more-->

## 核心特性

### 基础类

- 基础类型
  - 数字类型
    - 整数型：byte、short、int、long
    - 浮点型：float、double
  - 字符类型：char
  - 布尔类型：boolean
- Object 类，所有类的基类
  - 字符串类型：String
- 包装类
  - 八种基本类型都有对应的包装类分别为：Byte、Short、Integer、Long、Float、Double、Character、Boolean 。
  - Java 基本数据类型的包装类型的大部分都用到了`缓存机制`来提升性能, 除了 Float,Double 并没有实现缓存机制。
  - 通过`自动装箱与拆箱`可以在包装类型和基本数据类型之间进行转换。
  - 优先使用包装类的 `valueOf` 来构建实例，它会优先使用缓存中的常量，避免重复创建对象，如果没有找到才会创建对象。
- 数组，`<Type>[]`

#### 字符串类型

- String 是**不可变**的
- StringBuilder，单线程操作字符串缓冲区下操作大量数据
- (不推荐) StringBuffer，多线程操作字符串缓冲区下操作大量数据

- String 中的 equals 方法是被重写过的，比较的是 String 字符串的值是否相等。
- 字符串常量池 是 JVM 为了提升性能和减少内存消耗针对字符串（String 类）专门开辟的一块区域，主要目的是为了避免字符串的重复创建。

#### 时间类型

Java 8 之后引入 java.time 包，主要的时间类：

- Instant，绝对时间，表示时间戳，精确到纳秒，基于 UTC 时区
- ZonedDateTime，绝对时间
- LocalDateTime/LocalDate/LocalTime, 相对时间，没有时区概念
- Duration，计算时间间隔
- Period，计算日期差
- DateTimeFormatter，格式化和解析日期时间

上面所有时间类均为不可变对象。

##### 时间的格式化

使用 `DateTimeFormatter` 来格式化时间，它是**线程安全**的，可以作为静态常量复用。

```java
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class TimeFormatExample {
    private static final DateTimeFormatter FORMATTER = 
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static void main(String[] args) {
        LocalDateTime now = LocalDateTime.now();
        String output = now.format(FORMATTER);
        System.out.println(output);

        // 解析
        LocalDateTime parsed = LocalDateTime.parse(output, FORMATTER);
        System.out.println(parsed);
    }
}
```

#### BigDecimal

通常情况下，大部分需要浮点数**精确运算**结果的业务场景（比如涉及到钱的场景）都是通过 BigDecimal 来做的。

为了防止精度丢失，推荐使用它的 `BigDecimal(String val)` 构造方法或者 `BigDecimal.valueOf(double val)` 静态方法来创建对象

- 使用 `compareTo()` 方法进行等值比较，会**忽略精度**；而 equals() 方法不仅会比较值的大小（value）还会**比较精度**（scale）

#### 值的比较

- 基础类型的比较使用 `==` 操作符
- 引用类型的比较使用 `Comparable/Comparator` 接口，它们一般用于排序/比较
  - Comparable，在对象类中实现该接口中的 `compareTo(T obj)` 方法
  - (推荐) Comparator，针对指定类型单独定义的工具类，实现 `compare(T a, T b)` 方法
    - `a < b => -1`
    - `a = b => 0`
    - `a > b => 1`
- 引用类型的等值比较，还可以使用 `a.equals(b)`
  - 类没有重写 equals()方法：通过 equals() 比较该类的两个对象时，等价于通过 `==` 比较这两个对象，使用的默认是 Object 类 equals() 方法，比较两个对象的引用地址是否相同。
  - 类重写了 equals()方法：一般重写 equals() 方法来比较两个对象中的属性是否相等；若它们的属性相等，则返回 true(即，认为这两个对象相等)。
    - 重写了 equals() 也需要重写 `hashCode()`

#### Regex

主要通过 java.util.regex 包中的三个核心类：

- Pattern，表示编译后的正则表达式模式，**线程安全**，可复用
- Matcher，对输入字符串使用 Pattern 进行匹配操作，非线程安全

```java
import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class RegexExample {
    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("(?<prefix>\\w+)@\\w+\\.\\w+");

    public static boolean isValidEmail(String email) {
        Matcher matcher = EMAIL_PATTERN.matcher(email);
        // 完整匹配
        boolean result = matcher.matches();
        // 部分匹配
        // boolean result = matcher.finds();

        // 完整匹配的内容
        String full = matcher.group(0);
        // 命名分组
        String prefix = matcher.group("prefix");
        // 索引分组
        String prefix = matcher.group(1);
        return result;
    }

    public static void main(String[] args) {
        System.out.println(isValidEmail("test@domain.com")); // true
    }
}
```

### 容器框架

![collection](collection.png)

#### List

存储的元素是**有序的**、**可重复的**。

##### ArrayList

适用于`读操作多`的场景，绝大部分情况下使用 ArrayList，而不是 LinkedList。

底层是 Object 数组，建议**在初始化时就指定数组长度**，
ArrayList 每次自动扩容之后容量都会变为原来的 `1.5 倍`左右。

数组进行扩容时，会将老数组中的元素重新拷贝一份到新的数组中，涉及到的 API：

- System.arraycopy
- Arrays.copyOf，底层还是调用 `System.arraycopy`

当实际添加大量元素，可以通过调用 `ensureCapacity(int minCapacity)` 来进行手动扩容，减少递增式再分配。

##### LinkedList

基于`双向链表`实现，适用于`修改操作（增删改）比较多`的场景。

#### Stack && Queue/Deque

##### ArrayDeque

底层通过`循环数组`实现

当需要使用栈或者队列时，首选 ArrayDeque。

##### PriorityQueue

通过基于`完全二叉树的小顶堆`实现的，可以通过构造时传入 Comparator 来定义元素的优先级。

#### Set && Map

set 存储的元素不可重复的，map 存储的 key 不可重复。

Java 中的 Set 大多基于相对应等 Map 进行实现。

##### HashMap/HashSet

Java 8 之后通过`bucket 数组+链表/红黑树`的方式实现。在解决哈希冲突时, 如果当前数组的长度小于 64，那么会选择先进行数组扩容; 否则当链表长度大于等于阈值（默认为 8）时，将链表转化为红黑树，以减少搜索时间。

HashMap 默认的初始化大小为 16。之后每次扩充，容量变为原来的 `2 倍`。并且， HashMap 总是`使用 2 的幂作为哈希表的大小`。

放入 HashMap 的元素需要重写 `hashCode()` 和 `equals()` 方法，hashCode 决定了放入哪个 bucket 数组，equals 决定了元素在链表/红黑树中的位置。

HashSet, 基于 HashMap 实现的，底层采用 HashMap 来保存元素。

##### LinkedHashMap/LinkedHashSet

LinkedHashMap 在 HashMap 的基础上，采用`双向链表`将所有entry连接起来，**保证元素的迭代顺序跟插入顺序相同**。

常用场景：

- 基于 HashMap，保证迭代顺序
- 固定大小的 FIFO 策略的缓存
- 实现 LRU

#### 容器类的操作

##### 数组转集合

- (**推荐**) new ArrayList<>(Arrays.asList(array))，可修改
- Arrays.stream(array)
- Arrays.asList(array)，只读集合
- List.of(array)，只读集合

#### 集合转数组

- (**推荐**) Collection.toArray(new T[0]), 传入空数组，JVM 会自动创建合适大小的新数组。

### I/O

- 字节流, InputStream/OutputStream
- 字符流, Reader/Writer, 需要指定`字符集`

IO 操作是很消耗性能的，建议使用`缓冲流`，将数据加载至缓冲区，一次性读取/写入多个字节，从而避免频繁的 IO 操作，提高流的传输效率。

- BufferedInputStream/BufferedOutputStream
- BufferedReader/BufferedWriter

#### try-with-resource

针对实现了 `AutoCloseable` 或者 `Closeable` 的资源类，在使用完毕后，不管是否发生异常都能保证触发关闭资源的操作。

TODO

#### Files 操作

TODO

#### URI/URL 操作

TODO

### 异常类

在 Java 中，所有的异常都有一个共同的祖先 java.lang 包中的 Throwable 类。

- Error，程序无法处理的错误，表示运行应用程序中出现了严重的错误。
- Exception，程序本身可以处理的异常
  - 受检查异常 Checked Exception，需要在**方法声明**中通过 `throws` 关键字显式声明
  - 非受检查异常 Unchecked Exception，`RuntimeException` 及其子类都统称为非受检查异常

`try-catch-finally` 在 catch 中处理异常，并在异常处理完毕后，在 finally 中进行清理操作

实践：

- 只针对不正常的情况才使用异常，不应该被用于正常的控制流，而且建立并抛出一个异常对象开销非常大。
- 优先捕获最具体的异常
- 不要记录并抛出异常
- 包装异常时不要抛弃原始的异常

### 并发

#### 线程 && 线程池

![Executor Framework](executer-service-framework.png)

通过**手动**创建 `ThreadPoolExecutor` 实例来创建线程池。

```java
public ThreadPoolExecutor(
    int corePoolSize,
    int maximumPoolSize,
    long keepAliveTime,
    TimeUnit unit,
    BlockingQueue<Runnable> workQueue,
    ThreadFactory threadFactory,
    RejectedExecutionHandler handler)
```

- corePoolSize，核心线程数，一般等于 CPU 数量
- maximumPoolSize，最大线程数，一般将任务分为 CPU 密集和 IO 密集来综合评估
- keepAliveTime && unit，针对超过核心线程数的那部分线程空闲多久后被回收
- workQueue，使用 BlockingQueue 阻塞队列，存放要执行的任务
- threadFactory，创建线程的工厂，可以为线程命名以及线程中的统一异常处理
- handler，线程池的饱和策略，当阻塞队列满了并且没有空闲的线程时，决定如何处理任务，默认为 `AbortPolicy`，直接抛出异常

线程数评估方式：

- CPU 密集型：`N_threads = N_cpu`
- IO 密集型：`N_threads = N_cpu * (1 + W/C)`
  - W：平均等待时间（Waiting time）
  - C：平均计算时间（Computing time）
  - W/C 称为“阻塞系数”，通常远大于 1

任务如何通过线程池来执行：

- `void execute(Runnable command)`
- `Future<T> submit(Callable<T>/Runnable task)`

线程池的关闭：

- (推荐) shutdown，拒绝再接受任务，中断所有未执行的任务，并等待正在执行的任务完成
- shutdownNow，拒绝再接受任务，中断所有任务，包括正在执行的任务

#### JUC

![JUC](JUC.png)

##### AtomicXXX

通过 `CAS + 自旋`来实现。

- 针对基础类型，AtomicBoolean，AtomicInteger，AtomicLong
- 针对数组，AtomicIntegerArray，AtomicLongArray，BooleanArray
- 针对引用，AtomicReference，AtomicStampedReference

###### CAS (Compare-And-Swap)

CAS 是一条CPU的**原子**指令，是基于硬件平台的汇编指令，靠硬件实现的。
操作需要输入两个数值，一个旧值(期望操作前的值)和一个新值，在操作期间先比较下在旧值有没有发生变化，如果没有发生变化，才交换成新值，发生了变化则不交换。

CAS 操作一般会配合自旋来实现重试机制，但为了避免长时间不成功，导致 CPU 一直被占用而带来的执行开销，一般都会设置**自旋的次数**。

##### ThreadLocal

通过 `ThreadLocalMap` 来维护线程和线程独占的上下文数据。
由于 key 使用了 **WeakReference**，只要发生垃圾回收，若这个对象只被弱引用指向，那么就会被回收，从而导致 value(即上下文数据) 的内存泄漏。
所以为了避免内存泄漏，当不再需要上下文时，显式调用 `ThreadLocal.remove()` 手动移除上下文。

##### Lock && Condition

![Lock框架和Tools类](Lock框架和Tools类.png)

- ReentrantLock，可重入锁，支持公平锁和非公平锁
- ReentrantReadWriteLock，读写锁，用于读多写少的场景

通过 Lock 来生成 Condition，通过 condition 的 await/signal/signalAll 来控制线程的挂起和唤醒。

`synchronized + Object 的 wait/notify/notifyAll` 模式可以使用 `Lock + Condition 的 await/signal/signalAll` 进行替换，
但大部分场景优先使用 synchronized，除非对线程调度需要高度灵活可控的场景。

###### AQS && CLH

AQS(AbstractQueuedSynchronizer)，Java 中的悲观锁都是基于 AQS 来实现的。
它的核心包括两个部分：

- state，用于描述**守护条件**，通过守护条件的判断来决定线程的状态是执行还是挂起
- CLH，请求资源的线程队列，使用**双向链表**来实现

##### Concurrent Collections

![Concurrent Collections](<Concurrent Collections.png>)

- ConcurrentHashMap，采用CAS和synchronized实现对 bucket 数组中的 key 进行加锁。
- CopyOnWriteArrayList
- BlockingQueue，阻塞队列
  - (**推荐**) ArrayBlockingQueue，通过数组实现的**有界**的阻塞队列，在初始化的时候设置长度后，就不能再修改。
  - DelayQueue，**无界**，需要实现 JUC 的 `Delayed` 接口，元素只有到期后才能被获取
  - LinkedBlockingQueue，基于单向链表实现，**默认无界，可以在初始化时设置有界的长度**
  - PriorityBlockingQueue，基于优先级队列实现的**无界**阻塞队列
  - SynchronousQueue，同步队列，只存放一个元素，只有一个元素被取走后才能放下一个

##### fail-fast（快速失败）和 fail-safe（安全失败）

它们是Java集合框架在处理并发修改问题时，两种截然不同的设计哲学和容错策略。

fail-fast 快速失败是针对可能发生的异常通过**尽早的发现和停止错误**，降低故障系统级联的风险。
在 java.util 包下的大部分集合（如 ArrayList, HashMap）是不支持线程安全的，为了能够提前发现并发操作导致线程安全风险，
提出通过维护一个 `modCount` 记录修改的次数，迭代期间通过比对预期修改次数 `expectedModCount` 和 `modCount` 是否一致来判断是否存在并发操作，从而抛出 `ConcurrentModificationException` 实现快速失败，由此保证在避免在异常时执行非必要的复杂代码。

fail-safe 安全失败是在面对意外情况也能**恢复并继续**运行，这使得它特别适用于不确定或者不稳定的环境。
该思想常运用于**并发容器**，最经典的实现就是 CopyOnWriteArrayList 的实现，通过写时复制（Copy-On-Write）的思想保证在进行修改操作时复制出一份快照，基于这份快照完成添加或者删除操作后，将 CopyOnWriteArrayList 底层的数组引用指向这个新的数组空间，由此避免迭代时被并发修改所干扰所导致并发操作安全问题，当然这种做法也存在缺点，即进行**遍历操作时无法获得实时结果**。

### 内存管理

Java 对象的内存分配是通过 JVM 来管理。

![JVM Memory Design](JVM-Memory.png)

- 线程共享
  - 堆，用于存放对象实例，几乎所有的对象实例以及数组都在这里分配内存。
    - 字符串常量池，为了避免字符串的重复创建。
  - 本地内存·
    - 元空间，存放加载的类的元数据
      - 运行时常量池，存放编译期生成的各种字面量（Literal）和符号引用（Symbolic Reference）
    - 直接内存
- 线程私有
  - 程序计数器，用于当线程切换回来时，恢复线程执行的上下文，告诉线程当前执行到哪里了
  - 虚拟机栈
  - 本地方法栈

#### 对象的创建过程

```puml
: 类加载;
: 分配内存;
: 将分配到的内存空间都初始化为零值;
: 设置对象头;
: 执行 init 方法，即构造函数;
```

#### 类加载

![class lifecycle](class-lifecycle.png)

类加载器 ClassLoader，为了动态加载 Java 类的字节码（ .class 文件）到 JVM 中（在内存中生成一个代表该类的 Class 对象）。

1. BootstrapClassLoader(启动类加载器)
2. ExtensionClassLoader(扩展类加载器)
3. AppClassLoader(应用程序类加载器)
4. 自定义类加载器

JVM 判定两个 Java 类是否相同的具体规则：JVM 不仅要看类的全名是否相同，还要看加载此类的类加载器是否一样。
只有两者都相同的情况，才认为两个类是相同的。即使两个类来源于同一个 Class 文件，被同一个虚拟机加载，只要加载它们的类加载器不同，那这两个类就必定不相同。

类加载器默认通过**双亲委派机制**来加载类，也是官方推荐的方式。可以通过设置**线程上下文类加载器（ThreadContextClassLoader）**来打破加载的顺序。

#### 垃圾回收 GC

Java 堆是垃圾收集器管理的主要区域，因此也被称作 GC 堆（Garbage Collected Heap）。
由于现在收集器基本都采用**分代垃圾收集算法**，所以 Java 堆被划分为了几个不同的区域：

- 新生代
  - Eden
  - Survivor 1 和 Survivor 2
- 老年代

对象内存分配的位置：

- 大多数情况下，对象优先在新生代中 Eden 区分配。当 Eden 区没有足够空间进行分配时，虚拟机将发起一次 Minor GC。
- 大对象直接进入老年代是一种优化策略，旨在避免将大对象放入新生代，从而减少新生代的垃圾回收频率和成本。
- 如果对象在 Eden 出生并经过第一次 Minor GC 后仍然能够存活，并且能被 Survivor 容纳的话，将被移动到 Survivor 空间（s0 或者 s1）中，并将对象年龄设为 1(Eden 区->Survivor 区后对象的初始年龄变为 1)。
- 对象在 Survivor 中每熬过一次 MinorGC, 年龄就增加 1 岁，当它的年龄增加到一定程度（默认为 15 岁），就会被晋升到老年代中。

对象死亡的判定通过**可达性分析**，即通过被称为 “GC Roots” 的对象作为起点，从这些节点开始向下搜索，当一个对象到 GC Roots 没有任何引用相连的话，则证明此对象是不可用的，需要被回收。

GC Roots：

- 虚拟机栈(栈帧中的局部变量表)中引用的对象
- 本地方法栈(Native 方法)中引用的对象
- 类中静态变量引用的对象
- 常量引用的对象
- 被同步锁持有的对象
- JNI（Java Native Interface）引用的对象

垃圾回收算法：

- 标记-清除（Mark-and-Sweep）算法
- 复制（Copying）收集算法，Survivor 就是使用这种方式
- 标记-整理（Mark-and-Compact）算法

从 JDK9 开始，G1 垃圾收集器成为了默认的垃圾收集器。

#### 相关 JVM 参赛配置

- `-Xms/-Xmx<heap size>[unit]`，通常建议将它们设置为相同的值，以避免运行时堆内存的动态调整带来的性能开销
- OOM 相关参赛
  - `-XX:+HeapDumpOnOutOfMemoryError`，在发生 OOM 时生成堆转储文件
  - `-XX:HeapDumpPath`，指定堆转储文件的输出路径

调式工具：

- jmap
- jstack
- MAT

## 其他特性

### 泛型 Generics

- 泛型接口
- 泛型类
- 泛型方法

在编译阶段通过`类型擦除`的方式进行解语法糖。

类型参数的定义：

- 上下边界机制，定义类型参数的范围，编译时擦除到类型 A
  - `<T extends A>` 定义类型的上界
  - `<T super E>` 定义类型的下界

类型擦除的主要过程如下：

1.将所有的泛型参数用其最左边界（最顶级的父类型）类型替换。
2.移除所有的类型参数。

### 反射

TODO

#### 注解 Annotation

TODO

### NIO

### 序列化 serialization

- 一般使用第三方的序列化工具，避免使用 Java 自带的序列化工具
- 对于不想进行序列化的变量，使用 transient 关键字修饰。

### JDK Proxy

TODO

### SPI (Service Provider Interface)

TODO

### 字节码

TODO

## Reference

- [Java 全栈学习](https://www.pdai.tech/md/java/basic/java-basic-oop.html)
