---
title: Algorithm For Junior
date: 2025-07-24 14:00:00
categories:
- quick-guide
tags:
- algorithm
---

<!--more-->

## 线性结构

### 数组 Array

- 内存连续，适合**较少**的相同类型的数据
- 支持随机访问，通过**索引**快速访问数据，时间复杂度为 `O(1)`
- 遍历查找元素的时间复杂度为 `O(n)`
- 插入删除元素的时间复杂度为 `O(n)`

适合**读操作多**的场景。

#### 循环数组

TODO

### 链表 List

- 内存分散，通过指针指向下一个节点，可用于较多的相同类型的数据
- 遍历查找元素的时间复杂度为 `O(n)`
- 支持快速插入删除，时间复杂度为 `O(1)`

适合**写操作多**的场景。

### 堆栈/栈 Stack && 队列 Queue

- Stack, FILO
  - 栈顶操作的时间复杂度为 `O(1)`
- Queue, FIFO
  - 头尾操作的时间复杂度为 `O(1)`

应用场景：

- 校验表达式的有效性

### 滑动窗口

- 使用 queue 来构建有序队列。
- 针对数组，还可以使用双指针来确定窗口的范围。

``` java
// 构建从大到小的有序队列
Deque<Integer> queue = new ArrayDeque<>(k);  
...  
int[] rst = new int[nums.length - k + 1];
for (int i = k - 1; i < nums.length; i++) {  
  // 构建从大到小的有序队列
  while (!queue.isEmpty() && nums[queue.getLast()] <= nums[i]) {  
    queue.removeLast();  
  }
  // 添加当前元素
  queue.addLast(i);  
  
  // 计算滑动窗口的起始位置
  int start = i - k + 1;  
  // 清理不属于滑动窗口范围的旧数据
  while (queue.getFirst() < start) {  
    queue.removeFirst();  
  }  
  // 获取有序队列中的最大值
  rst[start] = nums[queue.getFirst()];  
}
```

### 常见的遍历方式

#### 前后指针

```java
public ListNode reverseList(ListNode head) {
  ListNode pre = null;
  ListNode cur = head;
  while (cur != null) {
    ListNode tmp = cur.next;
    cur.next = pre;
    
    pre = cur;
    cur = tmp;
  }
  return pre;
}
```

#### 快慢指针

```java
public boolean hasCycle(ListNode head) {  
  ListNode fast = head;  
  ListNode slow = head;  
  while (fast != null && fast.next != null) {  
    slow = slow.next;  
    fast = fast.next.next;  
  
    if (slow == fast) {  
      return true;
    }  
  }  
  return false;  
}

ListNode findMidNode(ListNode head) {
  ListNode slow = head;
  ListNode fast = head;
  while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
```

#### 头尾指针向中间靠拢

``` java
int l = i + 1;  
int r = nums.length - 1;  
while (l <= r) {  
  int total = cur + nums[l] + nums[r];  
  if (total == 0) {  
    // process logic
    ... 
    ++l;  
    --r;  
  } else if (total > 0){  
    --r;  
  } else {  
    ++l;  
  }
}
```

## 优先队列 PriorityQueue

对输入的元素进行排序，按照优先级来输出。

常见的应用场景：

- 返回第 K 大的元素
- 滑动窗口

## 哈希 Hash

- 哈希函数
- 哈希碰撞
- 查找的时间复杂度为 `O(1)`

## 二叉树

## 图

## 遍历技巧

- 剪枝
