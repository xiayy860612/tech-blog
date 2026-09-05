# Document APIs

每个index可以被拆分为多个shard, 每个shard可以有多个**备份组(replication group)**.
这些replication之间必须保证数据同步, 保证结果的一致性.

Elasticsearch的数据备份模型是基于[primary-backup model][]模型.
该模型要求一个replication group必须要有一个主分片以及多个备份分片.

所有的index操作都会在主分片上进行, 成功后同步到其他备份分片.

## Basic write model

每个index相关操作的流程:

1. 基于document id路由到对应的replication group
2. 路由到该replication group中的主分片
3. 主分片负责校验和执行操作
4. 主分片执行成功后, 备份到其他**in-sync copies** set中的备份分片上
5. 备份成功后, 返回response给客户端

当index不存在时, 添加document会自动生成index.

每个document都有一个`version`值.

## Basic read model

1. 分片接收到读请求
2. 将读请求分别发送到不同的index的分片去获取子结果集
3. 将获取到的所有子结果集进行合并并返回给用户

## 错误处理

### primary replication failed

主分片如果失败, 则会通知到master, 
由master来将其他分片提升为主分片, 然后将请求转发给新的主分片来处理.

一旦操作在主分片上执行成功后, 主分片需要负责处理之后所有来自备份分片的错误.

Elasticsearch需要至少3个节点才能提供容错机制.

## 操作

### Index

ES默认开启自动Index, 可以通过**action.auto_create_index**进行设置

- 动态添加新字段到mapper
- 如果索引不存在, 自动创建

使用Index API去更新Document会直接生成新的Document, 而不会获取老的Document并进行比较.

每个Document都有一个`version`, 当Document发生update, delete时会递增.

### Get

当Document发生update但还没有refresh, GET API默认会触发index的refresh操作.

### Update

Update API会出发reIndex.


---

[primary-backup model]: https://www.microsoft.com/en-us/research/publication/pacifica-replication-in-log-based-distributed-storage-systems/