---
title: 并发设计模式
date: 2025-11-27 20:00:00
categories:
- concurrent
tags:
- it
- concurrent
---

快速学习并发编程的各种模式设计。

<!--more-->

## Thread

![thread status flow](<thread status flow.png>)

- wait，当前线程**释放**实例对象的锁，状态变为等待并进入等待队列，其他线程获取锁然后执行相关操作。
- sleep，当前线程**不会释放**实例对象的锁，其他想要获取锁的线程仍然被阻塞
- notify/notifyAll/interrupt/超时，通知等待队列中的线程，重新尝试去获取实例对象的锁，如果没有获取到，则进入阻塞状态

### 中断线程

当执行 interrupt 时, 线程并不需要获取 Thread 实例的锁。
无论何时,任何线程都可以调用其他线程的 interrupt 方法。

interrupt方法只是改变了线程的中断状态而已。
所谓中断状态 (interrupted status),是一种用于表示线程是否被中断的状态。

正在 sleep/join 的线程被 interrupt 之后， 因为本身就持有锁，
所以会立即终止暂停状态, 抛出 InterruptedException 异常。

正在 wait 的线程被调用 interrupt 方法时, 该线程会在重新获取锁之后,
抛出 InterruptedException 异常。在获取锁之前, 线程不会抛出 InterruptedException 异常。

如果没有调用 sleep、wait、join 等方法, 或者没有编写**检查线程的中断状态**，
并抛出 InterruptedException 异常的代码, 那么 InterruptedException 异常就不会被抛出。

## Single Thread Execution Pattern

该模式通过对有状态并且**状态会变化**的**共享资源**设置**临界区**，
来限制**同一时间**只能让**一个线程**执行处理。
一般通过**悲观锁**对不安全的方法设置临界区，使其同一时间只能被一个线程访问。。

```puml
class SharedResource {
    state
    unsafeMethod() { guarded }
}
```

```java
void unsafeMethod() {
    // 通过获取锁，进入临界区
    lock();
    try {
        ...
    } finally {
        // 无论何时，都要保证在最后的时候锁要被释放
        unlock();
    }
}
```

该模式会降低性能，抑制性能下降的方法：

- 尽量减少状态会变化的共享资源的数量，以减少需要获取的锁的数量
- 尽量缩小临界区的范围，以降低线程冲突的概率，就能抑制性能的下降。

### 计数信号量 Semaphore

Semaphore 可以用来控制线程的数量，来确保临界区**最多只能由 N 个线程**执行。

```java
class SharedResource {
    private final Semaphore semaphore;

    public SharedResource(int permits) {
        semaphore = new Semaphore(permits);
    }

    void unsafeMethod() {
        semaphore.acquire();
        try {
            ...
        } finally {
            semaphore.release();
        }
    }
}
```

## Immutable Pattern

该模式保证共享资源的状态**不可变**，所以也就不需要执行耗时的互斥处理，进而提高程序的性能。

Immutable 的实例被创建后，其状态就不再发生变化。

```puml

class ImmutableSharedResouce {
    field { frozen }

    getField() { concurrent }
}

```

适用的场景：

- 实例创建后，其状态不再发生变化
- 共享并且频繁被访问

### Mutable 和 Immutable 成对出现

Mutable 实例用于构建 Immutable 实例，可被修改；
Immutable 实例则用于共享。
两者可以根据需求，互相转换。

```puml

class Immutable {
    constructor(Mutable obj) {}
}

class Mutable {
    Immutable build();
}

Immutable <--> Mutable: 转换

```

## Guarded Suspension Pattern

该模式通过让线程等待来保证共享资源的安全性，
当**守护条件(guard condition)**不成立时，让线程等待，直到守护条件满足才能执行操作。

![Guarded Suspension Pattern](<Guarded Suspension Pattern.png>)

```java
synchronized void guardedMethod（） {
    ...
    while (isGuradConditionFalse()) {
        try {
            // 守护条件不满足，则等待
            wait();
        } catch (InterruptedException e) {
        }
    }
    // 守护条件满足，则执行目标操作
    ...
}

synchronized void stateChangingMethod() {
    ...
    // 更新状态后，通知等待队列中的线程重新检查守护条件
    notiyAll();
    ...
}
```

## Balking Pattern

该模式用于当**守护条件**不满足时，就停止处理，直接返回，而 `Guarded Suspension Pattern` 则是一直等待。

![Balking Pattern](<Balking Pattern.png>)

```java
synchronized void guardedMethod() {
    ...
    while (isGuradConditionFalse()) {
        try {
            // 守护条件不满足，则停止处理，直接返回
            return;
        } catch (InterruptedException e) {
        }
    }
    // 守护条件满足，则执行目标操作
    ...
}
```

针对守护条件不满足时，停止处理的方式:

- 直接 return, 没有返回值
- return 有返回值
- 抛出异常

### 通过 Balking Pattern 和 Guarded Suspension Pattern 实现超时等待

```java
synchronized void guardedMethod() throws InterruptedException, TimeoutException {
    ...
    long start = System.currentTimeMillis();
    while (isGuradConditionFalse()) {
        long now = System.currentTimeMillis();
        long rest = now - start;
        if (rest <= 0) {
            // 守护条件不满足并且超时，则停止处理
            throw new TimeoutException();
        }
        // 守护条件不满足，但未超时，则等待
        wait(rest);
    }
    // 守护条件满足，则执行目标操作
    ...
}
```

## Producer-Consumer Pattern

通过阻塞队列来消除生产者和消费者之间的处理速度。

![Producer-Consumer Pattern](<Producer-Consumer Pattern.png>)

Channel 角色位于 Producer 角色和 Consumer 角色之间, 承担用于传递 Data 角色的
中转站、通道的任务，实现线程的协调运行。而传递 Data 的顺序的方式有:

- 队列，FIFO
- 栈，LIFO
- 优先队列(priority queue)

## Read-Write Lock Pattern

在Read-Write Lock 模式中, 读取操作和写入操作是分开考虑的。在执行读取操作之前,线程
必须获取用于读取的锁。而在执行写入操作之前,线程必须获取用于写入的锁。

一般来说,执行互斥处理会降低程序性能。但如果把针对写入的互斥处理和针对读取的互斥处
理分开来考虑,则可以提高程序性能。

![Read-Write Lock Pattern](<Read-Write Lock Pattern.png>)

![Read-Write Lock Flow](<Read-Write Lock Flow.png>)

适用场景：

- 适合读取操作繁重时
- 适合读取频率比写入频率高时

## Thread-Per-Message Pattern

该模式为每个请求新分配一个线程, 由这个线程来执行处理，并且最终不需要获取请求的结果。

![Thread-Per-Message Pattern](<Thread-Per-Message Pattern.png>)

![Thread-Per-Message Flow](<Thread-Per-Message Flow.png>)

## Worker Thread Pattern

该模式为了不必要的线程创建的开销，对线程进行重用，工作线程会逐个取得任务，并对任务进行处理，
在全部任务处理完毕后会等待新的任务。

![Worker Thread Pattern](<Worker Thread Pattern.png>)

![Worker Thread Flow](<Worker Thread Flow.png>)

需要根据实际运行环境来调整 worker 的数量。

优势：

- 任务分发和执行的分离
- 提高了响应速度
- 可以控制执行顺序，比如按创建事件或者自定义的优先级
- 任务可以被取消
- 支持分布式

## Future Pattern

该模式为每个请求分配一个线程, 由这个线程来执行处理，并且最终需要获得请求处理的结果。

![Future Pattern](<Future Pattern.png>)

![Future Pattern Flow](<Future Pattern Flow.png>)

## Two-Phase Termination Pattern

## Thread-Specific Storage

## Active Object Pattern

## Reference

- [图解java多线程设计模式](https://book.douban.com/subject/27116724/)
