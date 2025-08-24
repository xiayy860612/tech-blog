---
title: Redis Guide
date: 2025-07-24 14:00:00
categories:
- quick-guide
tags:
- redis
- cache
---

Redis 使用快速入门

<!--more-->

![redis](redis-so-fast.png)

## 数据存储

基于 `key-value` 的形式存储，而 value 支持多种数据类型

### 基本数据类型

#### String

String 是一种二进制安全的数据类型，可以用来存储任何类型的数据，
比如字符串、整数、浮点数、图片（图片的 base64 编码或者解码或者图片的路径）、序列化后的对象。

- `SET/SETNX key value`
- `GET key`
- `EXISTS key`
- `DEL key`
- `EXPIRE key seconds`
- 针对数字操作
  - `INCR key`
  - `DECR key`

适用场景

- 存储 json 序列化后的对象数据，尤其是多层嵌套的复杂对象
- 计数的场景，通过 redis 来提供整型自增 id

#### List

Redis 的 List 的实现为双向链表

#### Set

无序集合，集合中的元素没有先后顺序但都唯一。

- `SINTER/SINTERSTORE`，交集
- `SUNION/SUNIONSTORE`，并集
- `SDIFF/SDIFFSTORE`，差集
- `SADD key member1 member2 ...`，向指定集合添加一个或多个元素
- `SPOP key count`，随机移除并获取指定集合中一个或多个元素，适合**不允许重复**的场景
- `SRANDMEMBER key count`, 随机获取指定集合中指定数量的元素，适合**允许重复**的场景

主要通过多个 set 的集合运算来获取相关数据。

适用场景

- 通过交集获取共同数据
- 通过差集获取推荐数据
- 获取随机数据

#### Hash

适用于写操作比较多的简单对象（非嵌套对象）的存储

适用场景

- 购物车

#### Zset 有序集合

Sorted Set 增加了一个权重参数 score，使得集合中的元素能够按 score 进行有序排列

- `ZSCORE key member`, 获取指定有序集合中指定元素的 score 值
- `ZREVRANK key member`, 获取指定有序集合中指定元素的排名(score 从大到小排序)
- `ZRANK key member`, 获取指定有序集合中指定元素的排名(score 从低到高)
- `ZRANGE key start end`,获取指定有序集合 start 和 end 之间的元素（score 从低到高）
- `ZREVRANGE key start end`, 获取指定有序集合 start 和 end 之间的元素（score 从高到底）

适用场景

- 排行榜

### 特殊数据类型

TODO

## 常见问题分析以及优化

### 缓存过期

一般情况下，在缓存数据的时候都会设置一个过期时间，避免内存一直占用，最后可能导致 OOM。

- `expire key number`, 设置多少秒后过期
- `ttl key`，查看过期时间

适用场景：

- 数据只在一段时间内存在，比如验证码，用户 session 等

常用的过期数据的删除策略

- 惰性删除：只会在查询 key 的时候才对数据进行过期检查。这种方式对 CPU 最友好，但是可能会造成太多过期 key 没有被删除。
- 定期删除：周期性地随机从设置了过期时间的 key 中抽查一批，然后逐个检查这些 key 是否过期，过期就删除 key。相比于惰性删除，定期删除对内存更友好，对 CPU 不太友好。
- 延迟队列：把设置过期时间的 key 放到一个延迟队列里，到期之后就删除 key。这种方式可以保证每个过期 key 都能被删除，但维护延迟队列太麻烦，队列本身也要占用资源。
- 定时删除：每个设置了过期时间的 key 都会在设置的时间到达时立即被删除。这种方法可以确保内存中不会有过期的键，但是它对 CPU 的压力最大，因为它需要为每个键都设置一个定时器。

Redis 采用的是 `定期删除+惰性删除` 结合的策略，这也是大部分缓存框架的选择。
默认情况下，定期删除任务线程是在 Redis 主线程中执行的，如果存在大量过期的 key，就会导致客户端请求没办法被及时处理，响应速度会比较慢。

避免大量 key 集中过期问题的方法：

- （最重要）尽量避免 key 集中过期：在设置键的过期时间时尽量随机一点。
- 开启 lazy free 机制，Redis 会在后台异步删除过期的 key，不会阻塞主线程的运行，从而降低对 Redis 性能的影响。

#### 缓存雪崩

缓存雪崩指在同一时间大批量的数据的过期或者缓存服务宕机，导致大量的请求都直接落到了数据库上，对数据库造成了巨大的压力。

![缓存雪崩](缓存雪崩.png)

针对 Redis 服务不可用的情况:

- 采用 Redis 集群，避免单机出现问题整个缓存服务都没办法使用

针对大批量的数据的过期：

- 设置随机失效时间，在固定过期时间的基础上加上一个随机值，这样可以避免大量缓存同时到期，从而减少缓存雪崩的风险。

### BigKey

如果一个 key 对应的 value 所占用的内存比较大，那这个 key 就可以看作是 bigkey（大 Key）。

bigkey 会导致

- 客户端超时阻塞，在操作大 key 时会比较耗时，导致很久没有响应
- 网络阻塞，每次获取大 key 产生的网络流量较大
- 工作线程阻塞，使用 del 删除大 key 时，会阻塞工作线程，就没办法处理后续的命令

尽量避免 Redis 中存在 bigkey

通过 --bigkeys 参数来查找 bigkey

```sh
# 扫描 Redis 中的所有 key, 每次扫描后休息的时间间隔为 3 秒
$ redis-cli -p 6379 --bigkeys -i 3
```

bigkey 的常见处理以及优化办法：

- 分割 bigkey，将一个 bigkey 分割为多个小 key
- 采用合适的数据结构

### Hotkey

一个 key 的访问次数比较多且明显多于其他 key 的话，那这个 key 就可以看作是 hotkey（热 Key）。

危害：

- 处理 hotkey 会占用大量的 CPU 和带宽，可能会影响 Redis 实例对其他请求的正常处理

当使用 LFU 内存淘汰策略时，可以使用 `--hotkeys` 参数来查找

```sh
redis-cli -p 6379 --hotkeys
```

hotkey 的常见处理以及优化办法

- 读写分离：主节点处理写请求，从节点处理读请求
- 分片，将热点数据分散存储在多个 Redis 节点上
- 二级缓存，将 hotkey 存放一份到本地内存中

#### 缓存击穿

缓存击穿一般指请求的**热点数据**的 key 对应的数据存在于数据库中，不存在于缓存中，通常是因为缓存中的那份数据已经过期。
这就可能会导致瞬时大量的请求直接到了数据库上，对数据库造成了巨大的压力。

![缓存击穿](缓存击穿.png)

解决方法：

- （推荐）提前预热，针对热点数据提前将其存入缓存中并设置合理的过期时间，保证在热点时间内不过其，比如秒杀场景下的数据在秒杀结束之前不过期。

### 缓存穿透

大量请求的 key 不存在于缓存中，也不存在于数据库中。

![缓存穿透](缓存穿透.png)

解决方法：

- （必须）应用程序做好参数校验
- 布隆过滤器，快速判断 key 相关的数据是否**不存在**，需要提前把把所有可能存在的 key 存到布隆过滤器
- 接口限流

### 慢查询命令

命令的执行可以通过 Round Trip Time（RTT，往返时间）来衡量。
而慢查询命令指那些执行时间较长的命令。

redis 提供的**慢查询日志 (Slow Log)** 专门用来记录执行时间超过指定阈值的命令。
可通过 redis.conf 中的 `slowlog-log-slower-than` 参数设置耗时命令的阈值和 `slowlog-max-len` 参数设置耗时命令的最大记录条数。
也可以通过命令来设置。

```sh
# 超过 10000 微妙（即10毫秒）就会被记录
CONFIG SET slowlog-log-slower-than 10000
CONFIG SET slowlog-max-len 128
# 获取最近 10 条慢查询日志
SLOWLOG GET 10
```

Redis 命令的执行简化为以下几步：

1. 发送命令；
2. 命令排队；
3. 命令执行；
4. 返回结果。

## 应用模式以及场景

### 数据缓存

- 分布式 Session
- 热点数据
- 静态数据

### 排行榜

### 发布订阅

### 分布式锁

## 高级特性

### 快的原因

- 纯内存操作 (Memory-Based Storage)，读写操作都发生在内存中，访问速度是纳秒级别
- 高效的 I/O 模型 (I/O Multiplexing & Single-Threaded Event Loop) ，
让单个线程可以同时处理多个网络连接上的 I/O 事件（如读写），避免了多线程模型中的上下文切换和锁竞争问题。
- 优化的内部数据结构 (Optimized Data Structures) ，会根据数据大小和类型动态选择最合适的内部编码，以在性能和空间效率之间取得最佳平衡
- 简洁高效的通信协议 (Simple Protocol - RESP)，

### 内存淘汰策略

Redis 的内存淘汰策略只有在运行内存达到了配置的最大内存阈值时才会触发，这个阈值是通过 redis.conf 的 `maxmemory` 参数来定义的。

可用于保证 redis 中的数据为热点数据。

- `config get maxmemory`，查看最大内存阈值
- `config get maxmemory-policy`, 查看内存淘汰策略

内存淘汰策略：

- allkeys-xxx，从**所有的键值**中淘汰数据
  - allkeys-lru，挑选最近最少使用的数据淘汰
  - allkeys-random，任意选择数据淘汰
  - allkeys-lfu，挑选最不经常使用的数据淘汰
- volatile-xxx，从**设置了过期时间的键值**中淘汰数据
  - volatile-lru，挑选最近最少使用的数据淘汰
  - volatile-ttl，挑选将要过期的数据淘汰
  - volatile-random，任意选择数据淘汰
  - volatile-lfu，挑选最不经常使用的数据淘汰
- no-eviction，默认，禁止驱逐数据，当内存不足以容纳新写入数据时，新写入操作会报错

### 持久化

- 快照（snapshotting，RDB）；
- 只追加文件（append-only file，AOF），实时性
- RDB 和 AOF 的混合持久化（Redis 4.0 新增）

#### AOF

TODO

### 缓存读写策略

缓存读写策略是为了保证缓存和数据库一致性。

#### Cache Aside Pattern（旁路缓存模式）

Cache Aside Pattern（旁路缓存模式）是一种非常常用的缓存读写策略

- 读操作
  1. 先尝试从缓存读取数据
  2. 如果缓存命中，直接返回数据
  3. 如果缓存未命中，从数据库查询数据，将查到的数据放入缓存并返回数据
- 写操作
  1. 先更新数据库
  2. 再直接删除缓存中对应的数据

如果更新数据库成功，而删除缓存这一步失败的情况的话，一般采用**缓存更新重试机制**，
通过引入 MQ 实现异步重试，当删除缓存失败时，将删除缓存重试的消息投递到消息队列，然后由专门的消费者来重试，直到成功。

#### Write Behind Pattern（异步缓存写入）

把缓存视为主要数据存储，从中读取数据并将数据写入其中；然后异步批量的更新 db。

异步批量的更新 db 的方式：

- 定时任务，定时查找更新过但未同步到 db 的数据，将其更新到 db
- 消息队列，在 cache 的写操作成功后，发送消息到队列中，由专门的消费者来将数据写入到 db，可以结合定时任务

使用场景：

- 适合一些数据经常变化又对数据一致性要求没那么高的场景

## Reference

- [Why is Redis so fast?](https://twitter.com/alexxubyte/status/1498703822528544770)
- [Redis常见面试题总结](https://javaguide.cn/database/redis/redis-questions-01.html)