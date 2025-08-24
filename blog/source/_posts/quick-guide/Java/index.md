---
title: Java
date: 2024-05-08 20:00:00
categories:
- quick-guide
tags:
- Java
---

Java 快速入门

<!--more-->

## 类型系统

### 基础类

- 基本类型
  - 6 种数字类型：
    - 4 种整数型：byte、short、int、long
    - 2 种浮点型：float、double
  - 1 种字符类型：char
  - 1 种布尔型：boolean
- Object 类，所有类的基类
- 包装类
  - 八种基本类型都有对应的包装类分别为：Byte、Short、Integer、Long、Float、Double、Character、Boolean 。
  - Java 基本数据类型的包装类型的大部分都用到了`缓存机制`来提升性能, 除了 Float,Double 并没有实现缓存机制。
  - 通过`自动装箱与拆箱`可以在包装类型和基本数据类型之间进行转换。
- 数组，`<Type>[]`

#### 字符串类型

- String 是不可变的
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

#### BigDecimal

通常情况下，大部分需要浮点数精确运算结果的业务场景（比如涉及到钱的场景）都是通过 BigDecimal 来做的。

为了防止精度丢失，推荐使用它的BigDecimal(String val)构造方法或者 BigDecimal.valueOf(double val) 静态方法来创建对象

- 一般使用 `compareTo()` 方法进行等值比较，它会忽略精度；而 equals() 方法不仅会比较值的大小（value）还会比较精度（scale）

#### Comparable && Comparator

它们都是 Java 中用于排序/比较的接口

- Comparable，在对象类中实现该接口中的 `compareTo(T obj)` 方法
- (推荐) Comparator，针对指定类型单独定义的工具类，实现 `compare(T a, T b)` 方法

#### Regex

TODO

- Pattern
- Matcher

### 容器类

- Collection
  - List
  - Set
  - Queue
- Map

#### List

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

#### Stack && Queue

##### ArrayDeque

底层通过`循环数组`实现

当需要使用栈或者队列时，首选 ArrayDeque。

##### PriorityQueue

通过基于`完全二叉树的小顶堆`实现的，可以通过构造时传入 Comparator 来定义元素的优先级。

#### Set && Map

##### HashMap

Java 8 之后通过`bucket 数组+链表/红黑树`的方式实现。在解决哈希冲突时, 如果当前数组的长度小于 64，那么会选择先进行数组扩容; 否则当链表长度大于等于阈值（默认为 8）时，将链表转化为红黑树，以减少搜索时间。

HashMap 默认的初始化大小为 16。之后每次扩充，容量变为原来的 `2 倍`。并且， HashMap 总是`使用 2 的幂作为哈希表的大小`。

放入 HashMap 的元素需要重写 `hashCode()` 和 `equals()` 方法，hashCode 决定了放入哪个 bucket 数组，equals 决定了元素在链表/红黑树中的位置。

HashSet, 基于 HashMap 实现的，底层采用 HashMap 来保存元素。

##### LinkedHashMap

LinkedHashMap 在 HashMap 的基础上，采用`双向链表`将所有entry连接起来，**保证元素的迭代顺序跟插入顺序相同**。

常用场景：

- 基于 HashMap，保证迭代顺序
- 固定大小的 FIFO 策略的缓存

### I/O

- 字节流, InputStream/OutputStream
- 字符流, Reader/Writer, 需要指定`字符集`

IO 操作是很消耗性能的，建议使用`缓冲流`，将数据加载至缓冲区，一次性读取/写入多个字节，从而避免频繁的 IO 操作，提高流的传输效率。

- BufferedInputStream/BufferedOutputStream
- BufferedReader/BufferedWriter

### 异常类

在 Java 中，所有的异常都有一个共同的祖先 java.lang 包中的 Throwable 类。

- Error，程序无法处理的错误，表示运行应用程序中出现了严重的错误。
- Exception，程序本身可以处理的异常
  - 受检查异常 Checked Exception，
  - 非受检查异常 Unchecked Exception，`RuntimeException` 及其子类都统称为非受检查异常

- try-catch-finally，在 catch 中处理异常，并在异常处理完毕后，在 finally 中进行清理操作
- try-with-resource，针对实现了 `AutoCloseable` 或者 `Closeable` 的资源类，在异常处理完毕后，关闭资源

实践：

- 只针对不正常的情况才使用异常，不应该被用于正常的控制流，而且建立并抛出一个异常对象开销非常大。
- 优先捕获最具体的异常
- 不要记录并抛出异常
- 包装异常时不要抛弃原始的异常

## 运算

### 相等操作

`==` 对于基本类型和引用类型的作用效果是不同的：

- 对于基本数据类型来说，== 比较的是值。
- 对于引用数据类型来说，== 比较的是对象的内存地址。

`equals()` 不能用于判断基本数据类型的变量，只能用来判断两个对象的内容是否相等。

- 类没有重写 equals()方法：通过equals()比较该类的两个对象时，等价于通过 `==` 比较这两个对象，使用的默认是 Object 类 equals() 方法。
- 类重写了 equals()方法：一般我们都重写 equals() 方法来比较两个对象中的属性是否相等；若它们的属性相等，则返回 true(即，认为这两个对象相等)。
  - 重写了 equals() 也需要重写 `hashCode()`

### 数组转集合

- Arrays.asList
- Arrays.stream
- List.of

## 高级特性

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

#### 注解 Annotation

TODO

### 序列化 serialization

- 一般使用第三方的序列化工具，避免使用 Java 自带的序列化工具
- 对于不想进行序列化的变量，使用 transient 关键字修饰。

### JDK Proxy

TODO

### SPI (Service Provider Interface)

TODO

## 调式

- jmap
- jstack
- EAT

## Reference
