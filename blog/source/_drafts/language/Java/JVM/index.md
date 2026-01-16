---
title: Java JVM
date: 2024-05-08 20:00:00
categories:
- system
tags:
- Java
- JVM
---

![](JVM Model.png)

<!--more-->

## 对象初始化

1. 分配内存空间。
2. 初始化对象。
3. 将内存空间的地址赋值给对应的引用。

## JIT (Just in Time Compilation)

## AOT (Ahead of Time Compilation)

## ASM

## JMM

## JVM



## 锁机制

并发的三个特性

- 原子性
- 可见性
- 有序性

乐观锁总是假设最好的情况，认为共享资源每次被访问的时候不会出现问题，线程可以不停地执行，无需加锁也无需等待，只是在提交修改的时候去验证对应的资源（也就是数据）是否被其它线程修改了（具体方法可以使用版本号机制或 CAS 算法）。

- 悲观锁通常多用于写比较多的情况（多写场景，竞争激烈），这样可以避免频繁失败和重试影响性能，悲观锁的开销是固定的。不过，如果乐观锁解决了频繁失败和重试这个问题的话（比如LongAdder），也是可以考虑使用乐观锁的，要视实际情况而定。
- 乐观锁通常多用于写比较少的情况（多读场景，竞争较少），这样可以避免频繁加锁影响性能。不过，乐观锁主要针对的对象是单个共享变量（参考java.util.concurrent.atomic包下面的原子变量类）。

### volatile

volatile 关键字可以保证变量的可见性，如果我们将变量声明为 volatile ，这就指示 JVM，这个变量是共享且不稳定的，每次使用它都到主存中进行读取

volatile 关键字能保证变量的可见性，但不能保证对变量的操作是原子性的。

### synchronized

### ThreadLocal

由于 ThreadLocalMap 中 key 是弱引用，而 value 是强引用，导致 key 被 GC 回收后，value 仍然被 ThreadLocalMap.Entry 强引用， 无法被回收，导致内存泄漏。所以在使用完 ThreadLocal 后，务必调用 remove() 方法显式地移除对应的 entry, 解决内存泄漏的风险。

### ThreadPool

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

- 用execute()时，未捕获异常导致线程终止，线程池创建新线程替代；
- 使用submit()时，异常被封装在Future中，线程继续复用。

### AQS

AQS 是基于 CLH 锁 （Craig, Landin, and Hagersten locks） 进一步优化实现的.

- state, 表示共享资源
- CLH 队列, 等待队列,里面的每个节点表示一个请求共享资源的线程



## Reference

- [Java基础常见面试题总结(上)](https://javaguide.cn/java/basis/java-basic-questions-01.html)