# Java 探索 --- Collection

![Collection Design](./img/collection-design.gif)

Java中集合类的基本接口为Collection接口.

- List, 表示有序集合
    + ArrayList, 支持随机访问
    + LinkedList, 便于中间插入删除
- Set
    + HashSet, 表示不重复无序集合, 可以快速查找元素, 通过自定义元素的hashCode和equals来去重
    + TreeSet, 有序集合, 通过自定义元素的Comparator接口来去重
- Queue/Dequeue, 在队列头尾进行操作
- Map, 存储键值对
    + HashMap
    + TreeMap

Vector和ArrayList都是使用动态数组来实现,
但Vector是线程安全, 而ArrayList不是;
效率上ArrayList要优于Vector.

Hashtable和HashMap拥有相同的接口,
Hashtable是线程安全, HashMap不是.
如果有并发访问的需求, 使用ConcurrentHashMap.

Collection通过使用Iterator迭代器来**顺序**访问集合中的元素,
元素被访问的顺序取决于集合类型.

```

Collection<String> collection = new ArrayList<>();
collection.add("hello");
collection.add("world");

Iterator<String> it = collection.iterator();
while (it.hasNext()) {
    String next = it.next();
    System.out.println(next);
}

```

在Collection中间位置添加元素需要通过Iterator来进行插入.

```
ListIterator<String> listIterator = collection.listIterator();
listIterator.next();
listIterator.add("yeyeye");
```

Iterator的add只依赖于迭代器的位置,
而remove依赖于迭代器的状态, 不能连续多次调用.

每个迭代器都维护一个独立的计数值, 跟踪对集合的改写操作次数,
如果发现操作次数不一致, 则抛出异常ConcurrentModificationException.

```
List<String> collection = new LinkedList<>();
collection.add("hello");
collection.add("world");
collection.add("yeyeye");
collection.forEach(v -> System.out.println(v));

Iterator<String> iteratorOrg = collection.iterator();

Iterator<String> iterator = collection.iterator();
iterator.next();

iterator.remove();
// Debug Point, check expectModCount
Iterator<String> iterator1 = collection.iterator();

// expectModCount: iteratorOrg为3, iterator和iterator1为4

```

通过使用视图view可以获得其他的实现Collection接口和Map接口的对象.

- 不可修改的视图


## Reference

- [Java Collections Framework Internals](https://github.com/CarpenterLee/JCFInternals)