---
title: Java
date: 2024-05-08 20:00:00
categories:
- quick-guide
tags:
- Java
---

<!--more-->

## 类型系统

### 基础类型

- 6 种数字类型：
  - 4 种整数型：byte、short、int、long
  - 2 种浮点型：float、double
- 1 种字符类型：char
- 1 种布尔型：boolean

### Object 类

#### 包装类

这八种基本类型都有对应的包装类分别为：Byte、Short、Integer、Long、Float、Double、Character、Boolean 。

Java 基本数据类型的包装类型的大部分都用到了`缓存机制`来提升性能, 除了 Float,Double 并没有实现缓存机制。

通过`自动装箱与拆箱`可以在包装类型和基本数据类型之间进行转换。

#### 字符串类型

- String 是不可变的
- StringBuilder，单线程操作字符串缓冲区下操作大量数据
- StringBuffer，多线程操作字符串缓冲区下操作大量数据

- String 中的 equals 方法是被重写过的，比较的是 String 字符串的值是否相等。
- 字符串常量池 是 JVM 为了提升性能和减少内存消耗针对字符串（String 类）专门开辟的一块区域，主要目的是为了避免字符串的重复创建。

#### 时间类型

#### BigDecimal

通常情况下，大部分需要浮点数精确运算结果的业务场景（比如涉及到钱的场景）都是通过 BigDecimal 来做的。

为了防止精度丢失，推荐使用它的BigDecimal(String val)构造方法或者 BigDecimal.valueOf(double val) 静态方法来创建对象

- 一般使用 compareTo() 方法进行等值比较，它会忽略精度；而 equals() 方法不仅会比较值的大小（value）还会比较精度（scale）

### 容器类

- List
- Set
- Queue
- Map

#### 数组

数组转集合

- Arrays.asList
- Arrays.stream
- List.of()

#### List

- ArrayList
- LinkedList

##### ArrayList

绝大部分情况下使用 ArrayList，而不是 LinkedList。

底层是 Object 数组，建议在初始化时就指定数组长度，
ArrayList 每次扩容之后容量都会变为原来的 1.5 倍左右

- System.arraycopy()
- Arrays.copyOf()

##### LinkedList

基于双向链表实现，适用于增删比较多的场景。

#### Set && Map

- HashMap
- HashSet, 基于 HashMap 实现的，底层采用 HashMap 来保存元素
- LinkedHashMap
- TreeMap

Comparable 接口和 Comparator 接口都是 Java 中用于排序的接口，一般我们需要对一个集合使用自定义排序时，我们就要重写compareTo()方法或compare()方法

##### HashMap

JDK1.8 以后的 HashMap 在解决哈希冲突时, 如果当前数组的长度小于 64，那么会选择先进行数组扩容; 否则当链表长度大于等于阈值（默认为 8）时，将链表转化为红黑树，以减少搜索时间。

HashMap 默认的初始化大小为 16。之后每次扩充，容量变为原来的 2 倍。并且， HashMap 总是使用 2 的幂作为哈希表的大小

##### ConcurrentHashMap



#### Queue && Deque

- ArrayDeque
- PriorityQueue，默认是小顶堆
- BlockingQueue
  - ArrayBlockingQueue

##### ArrayBlockingQueue

### 异常类

在 Java 中，所有的异常都有一个共同的祖先 java.lang 包中的 Throwable 类。

- Error，程序无法处理的错误。
- Exception，程序本身可以处理的异常
  - 受检查异常 Checked Exception，
  - 非受检查异常 Unchecked Exception，`RuntimeException` 及其子类都统称为非受检查异常

### I/O

- 字节流, InputStream/OutputStream
- 字符流, Reader/Writer, 需要指定字符集

IO 操作是很消耗性能的，缓冲流将数据加载至缓冲区，一次性读取/写入多个字节，从而避免频繁的 IO 操作，提高流的传输效率。

- BufferedInputStream/BufferedOutputStream
- BufferedReader/BufferedWriter

#### IO 模型

- BIO
- NIO
  - IO 多路复用
- AIO

## 运算

### 相等操作

`==` 对于基本类型和引用类型的作用效果是不同的：

- 对于基本数据类型来说，== 比较的是值。
- 对于引用数据类型来说，== 比较的是对象的内存地址。

`equals()` 不能用于判断基本数据类型的变量，只能用来判断两个对象的内容是否相等。

- 类没有重写 equals()方法：通过equals()比较该类的两个对象时，等价于通过 `==` 比较这两个对象，使用的默认是 Object 类 equals() 方法。
- 类重写了 equals()方法：一般我们都重写 equals() 方法来比较两个对象中的属性是否相等；若它们的属性相等，则返回 true(即，认为这两个对象相等)。
  - 重写了 equals() 也需要重写 `hashCode()`

### try-catch-finally

### try-with-resource

- 可用于任何实现 `AutoCloseable` 或者 `Closeable` 的对象

## 泛型 Generics

在编译阶段通过类型擦除的方式进行解语法糖。

类型擦除的主要过程如下：

1.将所有的泛型参数用其最左边界（最顶级的父类型）类型替换。 
2.移除所有的类型参数。

## 反射

### 注解 Annotation

## SPI (Service Provider Interface)

## 序列化 serialization

- 对于不想进行序列化的变量，使用 transient 关键字修饰。

## JDK Proxy

## 并发



### JUC

## 调式

- jmap
- jstack
- EAT

## Reference