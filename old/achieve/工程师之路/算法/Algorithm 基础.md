
# 数据结构
## 线性结构

- 数组 Array
- 链表 List
- 堆栈/栈 Stack, FILO
- 队列 Queue, FIFO

### 技巧

### 前后指针

``` java
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

- https://leetcode.cn/problems/reverse-linked-list/
- https://leetcode.cn/problems/swap-nodes-in-pairs/
- https://leetcode.cn/problems/reverse-nodes-in-k-group/

### 快慢指针

``` java
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

- https://leetcode.cn/problems/linked-list-cycle
- https://leetcode.cn/problems/linked-list-cycle-ii/

### 头尾指针向中间靠拢

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

- 小顶堆
- 大顶堆
- 有序队列


> [!NOTE] 获取第 K 大的值
> 可以理解为取最大的 K 个值，其中第 K 大为其中最小的，可以使用小顶堆获取最小。

### 滑动窗口

- 使用 queue 来构建有序队列。
- 针对数组，还可以使用双指针来确定窗口的范围。

``` java
// 构建有序队列
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

## 哈希表 Hash



## 树 Tree

- 二叉搜索树(BST)
- 红黑树，**近似平衡的二叉查找树**
- B / B+ 树
- 字典树

二叉树遍历：
- 前序遍历
- 中序遍历
- 后序遍历
- 层级遍历

### 字典树

```java

```

## 图

## 并查集 union & find
 
- 初始化，每个元素的 root 指向自己
- Union，合并关联数据
- Find

```java
public class UnionFind {
  private final int[] roots;
  public UnionFind(int n) {
    roots = new int[n];
    for(int i = 0; i < n; i++) {
      roots[i] = i;
    }
  }

  private int find(int i) {
    int root = i;
    // 找到根
    while (root != roots[root]) {
      root = roots[root];
    }

    // 路径压缩, 将同一组的元素的根都设为最顶层的根
    while (i != roots[i]) {
      int parent = roots[i];
      roots[i] = root;
      i = parent;
    }
    return root;
  }

  public void union(int p, int q) {
    int pr = find(p);
    int qr = find(q);
    roots[pr] = qr;
  }

  public boolean isConnected(int p, int q) {
    return find(p) == find(q);
  }
}
```

- Union 优化：将深度较小的元素的 root 作为另一个元素的 root 的 root。
- Find 优化：对路径进行压缩，使路径的深度不会过大


# 算法

## 递归 && 分治

把一个大的问题分解为相同的小问题，对每个小问题进行求解，最后合并得到最终的结果。

- 递归终止条件
- 子问题

### 深度优先(DFS)

- 终止条件
- 计算结果的获取
- 对子节点的遍历，可以使用剪枝来优化遍历
- 节点状态，可选
	- 子节点遍历前的状态设置
	- 子节点遍历后的状态清理

``` java
private int dfs(TreeNode node, Long preSum, Map<Long, Integer> preSums, int targetSum) {  
  if (node == null) {  
    return 0;  
  }  
  
  preSum = preSum + node.val;  
  int count = preSums.getOrDefault(preSum, 0) + 1;  
  // 设置当前结点的状态
  preSums.put(preSum, count);  
  
  // 收集当前结点的结果
  int ret = preSums.getOrDefault(preSum - targetSum, 0);  
  
  // 对子节点进行遍历
  ret += dfs(node.left, preSum, preSums, targetSum);  
  ret += dfs(node.right, preSum, preSums, targetSum);  
  
  // 基于子节点的结果来计算当前结果
  
  // 清理当前结点的状态
  preSums.put(preSum,  count - 1);  
  return ret;  
}
```

### 广度优先 (BFS)


``` java
// 收集当前层的节点
Deque<TreeNode> queue = new ArrayDeque<>();  
queue.addLast(root);  
var result = new ArrayList<List<Integer>>();  
while (!queue.isEmpty()) {  
  // 队列中当前层的节点数量
  int count = queue.size();  
  List<Integer> layer = new ArrayList<>(count);  
  while (count-- != 0) {  
    // 获取当前层的节点
    TreeNode node = queue.removeFirst();  
    layer.add(node.val);  
	
	// 插入当前节点的下一层所有节点 
    if (Objects.nonNull(node.left)) {  
      queue.addLast(node.left);  
    }  
    if (Objects.nonNull(node.right)) {  
      queue.addLast(node.right);  
    }  
  }  
  result.add(layer);  
}
```

## 贪心

## 动态规划

必要元素：
- 状态定义
- 状态转移方程/递推公式，基于之前的结果来推导现有的结果。可以先用 递归 + 状态 来思考，然后转换为 递推（循环）

``` java
public int climbStairs(int n) {  
  // 状态定义，保存每一步的方法数量
  int[] result = new int[n + 1];  
  result[0] = 0;  
  for (int i = 1; i <= n; i++) {  
    if (i == 1) {  
      result[i] = 1;  
      continue;  
    }  
  
    if (i == 2) {  
      result[i] = 2;  
      continue;  
    }  
	// 递推公式
    result[i] = result[i - 2] + result[i - 1];  
  }  
  return result[n];  
}
```


# 应用场景

解题思路：

1. 列举场景中的各种用例。
2. 找出解题的方案，结合用例来证明方案的可行性，看方案是否覆盖所有用例。
3. 使用合适的数据结构以及算法来实现方案。

## 排序

### 快速排序

![[排序算法比较.png]]

``` java
public void qs(int[] nums, int start, int end) {
  if (start > end) {
    return;
  }

  int pi = qt(nums, start, end);
  qs(nums, start, pi - 1);
  qs(nums, pi + 1, end);
}

private int qt(int[] nums, int start, int end) {
  int pivot = nums[end];
  int wi = start;
  for(int i = start; i < end; i++) {
    if (nums[i] < pivot) {
      swap(nums, wi, i);
      ++wi;
    }
  }
  swap(nums, wi, end);
  return wi;
}

private void swap(int[] nums, int src, int target) {
  int tmp = nums[src];
  nums[src] = nums[target];
  nums[target] = tmp;
}
```

## 搜索

### 二分查找

前提条件：
- sorted, 单调递增或者递减
- bounded，存在上下界
- 可通过索引访问

``` java
// x 平方根的整数部分 ans 是满足 k^2 ≤ x 的最大 k 值
public int mySqrt(int x) {  
  int left = 0;  
  int right = x;  
  int ans = -1;  
  while (left <= right) {  
    int mid = left + (right - left) / 2;  
    if ((long) mid * mid <= x) {  
      ans = mid;  
      left = mid + 1;  
    } else {  
      right = mid - 1;  
    }  
  }  
  return ans;  
}

private boolean search(int[] row, int target) {
    int l = 0;
    int r = row.length - 1;
    while (l <= r) {
      int m = l + (r - l) / 2;
      if (row[m] == target) {
        return true;
      }

      if (row[m] < target) {
        l = m + 1;
      } else {
        r = m - 1;
      }
    }
    return false;
  }
```

### 查找链表的中间节点

``` java
ListNode pre = head;  
ListNode slow = head;  
ListNode fast = head;  
// 快指针的终止条件
while (fast != null && fast.next != null) {  
  pre = slow;  
  slow = slow.next;  
  fast = fast.next.next;  
}  
```

## LRU


## 位运算

位运算直接对内存进行操作，所以处理速度很快。

- 与 &，都为1时为1，否则为0
- 或 |，都为 0 时为 0，否则为 1
- 异或 ^, 相同为 0，不同为 1
- 非 ~
- 左移 <<
- 右移 >>

## 前缀和


