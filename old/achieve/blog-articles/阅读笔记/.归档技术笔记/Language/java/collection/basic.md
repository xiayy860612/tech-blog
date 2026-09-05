# Java Collection的使用

Java的Collection类库将接口和实现进行了分离.

集合类有两类基本接口

- Collection
- Map

## 迭代器Iterator

Iterator接口的主要方法:

  - hasNext
  - next

Collection接口继承自Iterable, 它提供了生成iterator的方法:

  - iterator

Iterator是用来描述Collection集合中的位置.

foreach可以和任何实现了Iterable接口的对象一起工作,
通过iterator来遍历所有元素, **元素被访问的顺序取决于集合类型**.

使用Iterator访问时, 必须顺序的访问元素.

随机访问可以按任意顺序访问元素.

可以使用Java 1.4引入的**RandomAccess**来测试集合是否支持随机访问.

每个Iterator都维护一个独立的计数值.

## List

- ArrayList
- LinkedList

List是一个有序的列表, 按照人们的意愿排列元素,
但人们需要知道**元素的位置**才能获取, 
否则必须通过遍历比较来获取.

### LinkedList

Java中的链表都是以**双向链表**来实现.

可以通过ListIterator对LinkedList进行遍历.

再需要使用整数索引访问元素时, 通常不选择LinkedList.

使用LinkedList的理由是尽可能减少再列表中插入/删除所付出的代价.

ListIterator
  - previousIndex
  - nextIndex

ListIterator可以告之当前位置的索引.

### ArrayList

ArrayList封装了一个动态再分配的对象数组.

Vector同样使用了动态数组, 但它是线程安全的,
所以在不需要同步时使用ArrayList.

## 队列Queue

先进先出

通常的实现方式:

- 循环数组, ArrayDeque
  - 有界集合, 即容量有限
- 链表, LinkedList
  - 容量没有上限


