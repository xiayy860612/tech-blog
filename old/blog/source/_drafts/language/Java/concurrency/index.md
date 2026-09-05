---
title: Java Concurrency
date: 2024-05-08 20:00:00
categories:
- quick-guide
tags:
- Java
- concurrency
---

JUC

<!--more-->

## IO 模型

- BIO
- NIO
  - IO 多路复用
- AIO

## ThreadPool

### BlockingQueue

### Future

常用使用方式：

- Future + ExecutorService
- FutureTask + ExecutorService

## CAS (Compare-And-Swap)

## Atomic

- AtomicBoolean
- AtomicInteger
- AtomicLong
- AtomicReference
- AtomicStampedReference

数组：

- AtomicIntegerArray
- AtomicLongArray
- AtomicReferenceArray

## Lock

### AQS
