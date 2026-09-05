- [包装类型的缓存机制](https://javaguide.cn/java/basis/java-basic-questions-01.html#%E5%8C%85%E8%A3%85%E7%B1%BB%E5%9E%8B%E7%9A%84%E7%BC%93%E5%AD%98%E6%9C%BA%E5%88%B6%E4%BA%86%E8%A7%A3%E4%B9%88)

- 基础类型和相应的包装类型
- 数组
- 字符串
- 异常

# 集合

- Collections
  - ArrayList
  - LinkedList
- Map

# IO

- NIO
- 零拷贝
  - `内存映射(mmap)+write`
  - `sendfile`
  - `sendfile + DMA(Direct Memory Access) gather copy`

参考：

- https://javaguide.cn/java/io/io-model.html
- https://javaguide.cn/java/io/nio-basis.html

# 反射

- 反射
- 动态代理，在运行时动态生成类字节码，并加载到 JVM 中的
  - ASM

# SPI

**JDK SPI 机制 ServiceLoader 约定好的标准**：

1. 在  `src`  目录下新建  `META-INF/services`  文件夹
2. 新建文件名为 `SPI 的全类名` 的文件
3. 文件里面的内容是 `SPI 的实现类的全类名`

## ServiceLoader

想要使用 Java 的 SPI 机制是需要依赖  `ServiceLoader`  来实现的。

解决第三方类加载的机制其实就蕴含在 `ClassLoader cl = Thread.currentThread().getContextClassLoader();` 中，`cl` 就是**线程上下文类加载器**（Thread Context ClassLoader）。这是每个线程持有的类加载器，JDK 的设计允许应用程序或容器（如 Web 应用服务器）设置这个类加载器，以便核心类库能够通过它来加载应用程序类。

# 并发

- JUC
- CAS
- Reentrance

## 悲观锁

独占锁就是悲观锁思想的实现。

悲观锁通常多用于写比较多的情况（多写场景，竞争激烈），这样可以避免频繁失败和重试影响性能，悲观锁的开销是固定的。不过，如果乐观锁解决了频繁失败和重试这个问题的话（比如`LongAdder`），也是可以考虑使用乐观锁的，要视实际情况而定。

## 乐观锁

乐观锁总是假设最好的情况，认为共享资源每次被访问的时候不会出现问题，线程可以不停地执行，无需加锁也无需等待，只是在提交修改的时候去验证对应的资源（也就是数据）是否被其它线程修改了（具体方法可以使用**版本号机制或 CAS 算法**）。

乐观锁通常多用于写比较少的情况（多读场景，竞争较少），这样可以避免频繁加锁影响性能。不过，乐观锁主要针对的对象是单个共享变量（参考`java.util.concurrent.atomic`包下面的原子变量类）

### 版本号机制

一般是在数据表中加上一个数据版本号 `version` 字段，表示数据被修改的次数。当数据被修改时，`version` 值会加一。当线程 A 要更新数据值时，在读取数据的同时也会读取 `version` 值，在提交更新时，若刚才读取到的 version 值为当前数据库中的 `version` 值相等时才更新，否则重试更新操作，直到更新成功。

### CAS 算法

CAS 的全称是 **Compare And Swap（比较与交换）** ，用于实现乐观锁，被广泛应用于各大框架中。CAS 的思想很简单，就是用一个预期值和要更新的变量值进行比较，两值相等才会进行更新。

CAS 是一个原子操作，底层依赖于一条 CPU 的原子指令。

CAS 经常会用到**自旋操作**来进行重试，也就是不成功就一直循环执行直到成功。如果长时间不成功，会给 CPU 带来非常大的执行开销。

#### ABA

ABA 问题的解决思路是在变量前面追加上**版本号或者时间戳**。

## synchronized

**本质都是对对象的监视器 monitor 的获取**

- synchronized 方法
- synchronized 静态方法
- synchronized 同步块， 使用  `monitorenter`  和  `monitorexit`  指令

### 锁升级

Java 6 之后的优化， 引入了新的锁来减少锁的开销：

- 自旋锁
- 锁消除
- 锁粗化
- 偏向锁，JDK18 中已经被彻底废弃
- 轻量级锁

锁主要存在四种状态，依次是：无锁状态、偏向锁状态、轻量级锁状态、重量级锁状态，他们会随着竞争的激烈而逐渐升级。注意锁可以升级不可降级，这种策略是为了提高获得锁和释放锁的效率。

## ReentrantLock

`ReentrantLock` 实现了 `Lock` 接口，是一个可重入且独占式的锁，和 `synchronized` 关键字类似。不过，`ReentrantLock` 更灵活、更强大，增加了轮询、超时、中断、公平锁和非公平锁等高级功能。

`ReentrantLock` 里面有一个内部类 `Sync`，`Sync` 继承 AQS（`AbstractQueuedSynchronizer`），添加锁和释放锁的大部分操作实际上都是在 `Sync` 中实现的。`Sync` 有公平锁 `FairSync` 和非公平锁 `NonfairSync` 两个子类。

### AbstractQueuedSynchronizer（AQS）

## ThreadLocal

使用完  `ThreadLocal`方法后最好手动调用`remove()`方法，避免内存泄漏。
因为`ThreadLocalMap` 中使用的 key 为 `ThreadLocal` 的弱引用，而 value 是强引用。所以，如果 `ThreadLocal` 没有被外部强引用的情况下，在垃圾回收的时候，key 会被清理掉，而 value 不会被清理掉。这样一来，`ThreadLocalMap` 中就会出现 key 为 null 的 Entry。假如我们不做任何措施的话，value 永远无法被 GC 回收，这个时候就可能会产生内存泄露。

## 线程池

池化技术的思想主要是为了减少每次获取资源的消耗，提高对资源的利用率。

**通过`ThreadPoolExecutor`构造函数来创建**，避免使用  `Executors`  去创建，因为`Executors`  返回线程池对象有可能会导致 OOM。

```java
public ThreadPoolExecutor(
	//线程池的核心线程数量
	int corePoolSize,
	//线程池的最大线程数，如果当前阻塞队列满了，且继续提交任务，则创建新的线程执行任务
	int maximumPoolSize,
	//当线程数大于核心线程数时，多余的空闲线程存活的最长时间
	long keepAliveTime,
	//时间单位
	TimeUnit unit,
	//任务队列，如果当前线程数为corePoolSize，继续提交的任务被保存到阻塞队列中，等待被执行。
	BlockingQueue<Runnable> workQueue,
	//线程工厂，用来创建线程，一般默认即可, 可为创建的线程命名
	ThreadFactory threadFactory,
	//拒绝策略，当提交的任务过多而不能及时处理时，根据定制策略来处理任务，默认使用的是 `AbortPolicy`
	RejectedExecutionHandler handler
) { ... }
```

### 任务持久化

- 实现`RejectedExecutionHandler`接口自定义拒绝策略，自定义拒绝策略负责将线程池暂时无法处理（此时阻塞队列已满）的任务入库（保存到 MySQL 中）。
- 继承`BlockingQueue`实现一个混合式阻塞队列，该队列包含 JDK 自带的`ArrayBlockingQueue`。另外，该混合式阻塞队列需要修改取任务处理的逻辑，也就是重写`take()`方法，取任务时优先从数据库中读取最早的任务，数据库中无任务时再从 `ArrayBlockingQueue`中去取任务。

### 线程异常

- **使用`execute()`提交任务**：当任务通过`execute()`提交到线程池并在执行过程中抛出异常时，如果这个异常没有在任务内被捕获，那么该异常会导致当前线程终止，并且异常会被打印到控制台或日志文件中。线程池会检测到这种线程终止，并创建一个新线程来替换它，从而保持配置的线程数不变。
- **使用`submit()`提交任务**：对于通过`submit()`提交的任务，如果在任务执行中发生异常，这个异常不会直接打印出来。相反，异常会被封装在由`submit()`返回的`Future`对象中。当调用`Future.get()`方法时，可以捕获到一个`ExecutionException`。在这种情况下，线程不会因为异常而终止，它会继续存在于线程池中，准备执行后续的任务。

### 如何配置

- **CPU 密集型任务(N+1)：** 这种任务消耗的主要是 CPU 资源，可以将线程数设置为 N（CPU 核心数）+1。比 CPU 核心数多出来的一个线程是为了防止线程偶发的缺页中断，或者其它原因导致的任务暂停而带来的影响。一旦任务暂停，CPU 就会处于空闲状态，而在这种情况下多出来的一个线程就可以充分利用 CPU 的空闲时间。
- **I/O 密集型任务(2N)：** 这种任务应用起来，系统会用大部分的时间来处理 I/O 交互，而线程在处理 I/O 的时间段内不会占用 CPU 来处理，这时就可以将 CPU 交出给其它线程使用。因此在 I/O 密集型任务的应用中，我们可以多配置一些线程，具体的计算方法是 2N。

## Future && CompletableFuture

## Semaphore

通常用于那些资源有明确访问数量限制的场景。

## CountDownLatch

允许 count 个线程阻塞在一个地方，直至所有线程的任务都执行完毕。

## 虚拟线程

在 Java 21 正式发布。

# JVM

## 内存模型

![[JVM 运行时数据区域.png]]

堆的内存结构：

- 新生代 young generation，对象优先在这里分配
  - Eden
  - Survivor From
  - Survivor To
- 老年代 old generation，大对象直接在这里分配
- 元空间 MetaSpace

![[JVM Heap.png]]

## GC

采用了分代收集的思想来管理内存，那么内存回收时就必须能识别哪些对象应放在新生代，哪些对象应放在老年代中。为了做到这一点，虚拟机给每个对象一个对象年龄（Age）计数器，存储在对象头中。

Java 堆内存是否规整，取决于 GC 收集器的算法:

- 标记-清除（Mark-and-Sweep）
- 标记-整理/压缩（Mark-and-Compact），代表 老年代
- 标记-复制算法（Copying），一般用于新生代，代表 Survivor

内存分配的两种方式：

- 指针碰撞
- 空闲列表

GC 分类：

- Partial GC
  - Young/minor GC，只收集新生代
    - 当 Eden 区没有足够空间进行分配时会触发
  - Old GC，只收集老年代，代表 CMS
  - Mixed GC，收集全部新生代以及部分老年代， 代表 G1
- Full GC，收集整个堆，包括新生代，老年代，元空间等。

JDK 默认垃圾收集器（使用 `java -XX:+PrintCommandLineFlags -version` 命令查看）：

- JDK 8: Parallel Scavenge（新生代）+ Parallel Old（老年代）
- JDK 9 ~ JDK22: G1

- CMS（Concurrent Mark Sweep）使用标记-清除算法，在 JDK 8 的 server 模式下的最佳搭配：ParNew + CMS + Serial Old（作为 CMS 的备用），`-XX:+UseConcMarkSweepGC`。在 Java 9 中已经被标记为过时(deprecated)，并在 Java 14 中被移除
- G1，从整体来看是基于“标记-整理”算法实现的收集器；从局部上来看是基于“标记-复制”算法实现的

用于调查 OOM 相关的参数配置

```bash
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=./java_pid<pid>.hprof
-XX:OnOutOfMemoryError="< cmd args >;< cmd args >"
-XX:+UseGCOverheadLimit
```

## 对象的创建

1. 类加载
2. 分配内存
   - TLAB
   - Eden
3. 初始化零值
4. 设置对象头
5. 执行 init 方法

## 死亡对象

判断方法：

- 引用计数法
- 可达性分析算法（GC Roots）
  - 虚拟机栈(栈帧中的局部变量表)中引用的对象
  - 本地方法栈(Native 方法)中引用的对象
  - 方法区中类静态属性引用的对象
  - 方法区中常量引用的对象
  - 所有被同步锁持有的对象
  - JNI（Java Native Interface）引用的对象

要真正宣告一个对象死亡，至少要经历两次标记过程

![[引用类型.png]]

## 类加载

![[类加载过程.png]]

加载通过  **类加载器**  完成，每个 Java 类都有一个引用指向加载它的  `ClassLoader`。
JVM 启动的时候，并不会一次性加载所有的类，而是根据需要去动态加载。也就是说，大部分类在具体用到的时候才会去加载，这样对内存更加友好。

JVM 中内置了三个重要的  `ClassLoader`：

1. **`BootstrapClassLoader`(启动类加载器)**， 用来加载 JDK 内部的核心类库（ `%JAVA_HOME%/lib`目录下的  `rt.jar`、`resources.jar`、`charsets.jar`等 jar 包和类）以及被  `-Xbootclasspath`参数指定的路径下的所有类。
2. **`ExtensionClassLoader`(扩展类加载器)/`PlatformClassLoader`(Java 9 引入)**：主要负责加载 `%JRE_HOME%/lib/ext` 目录下的 jar 包和类以及被 `java.ext.dirs` 系统变量所指定的路径下的所有类。
3. **`AppClassLoader`(应用程序类加载器)**：面向我们用户的加载器，负责加载当前应用 classpath 下的所有 jar 包和类。

如果获取到  `ClassLoader`  为`null`的话，那么该类是通过  `BootstrapClassLoader`  加载的。

### 双亲委派模型

`ClassLoader`  类使用委托模型来搜索类和资源。需要查找类或资源时，`ClassLoader`  实例会在试图亲自查找类或资源之前，将搜索类或资源的任务委托给其父类加载器。

# Java 重要特性新特性

## Java 8

- Interface
- Lambda
- Stream

## Java 9

- 模块系统
- G1

## Java 11

- HTTP Client 标准化
- Lambda 局部参数声明

## Java 17

- 伪随机数生成器

## Java 21

- 分代 ZGC
- switch 模式匹配
- 虚拟线程

# 参考

- https://javaguide.cn/
- https://www.pdai.tech/
