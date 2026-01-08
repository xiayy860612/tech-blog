---
title: ES Quick Guide
date: 2020-08-30 14:00:00
categories:
- quick-guide
tags:
- ES
---

快速了解 ES 的基本概念以及操作

<!--more-->

## 基本概念

![ES vs RDBS](<ES vs RDBS.png>)

### 索引 Index

文档的容器, 在逻辑空间上的一类文档的结合. 一个索引就相当与数据库中的一个表.

![数据建模](数据建模.png)

![创建索引的流程](创建索引的流程.png)

### Mappings

对索引中的文档进行定义，包含的文档的字段名和类型，类似数据库中的 schema 定义。

#### 基本类型

- 文本
  - text, 全文检索用, 会被分词处理, 默认添加相关的keyword字段. 默认不支持聚合分析和排序,需要设置fielddata为true才可以.
  - keyword,精确匹配, 用于Filter, 排序和聚合分析
- Date
- Integer/Float
- Boolean
- 复杂类型
- 地理
  - geo_point
  - geo_sharp

字段常用的参数配置：

- index，控制当前字段是否被索引, 默认为true, 如果为false, 则字段不可被搜索
- store， 默认为false, 因为数据在_source中已经被存储了. store设置为true, 一般是结合_source的enabled设置为false一起使用的, 它会单独存储该字段的原始内容
- fields，通可以为字段设置多个子字段. 例如给text字段添加keyword字段, 满足既可以全文检索, 也可以精确匹配

#### 复杂类型

- object, 字段会被扁平化处理, 在搜索时有可能结果不正确，不太建议使用
- nested, 字段会被存储成独立的文档, 存储在相同的节点上
- parent/child join, 定义父子关系, 分离两个对象文档, 更新互不影响. 添加子文档时, 要指定routing为对应的父文档id, 保证它们存储在相同的分片上.

![复杂类型](复杂类型.png)

ES不擅长处理关联关系，所以尽量少用，尽量分割成不同的文档。

### 文档 Document

一个文档相当与数据库表中的一行

- 可搜索数据的最小单元
- json 格式, 会被处理成**扁平式**键值对的结构
- 每个文档有一个唯一id

### Term

相当于表中一行数据中的某一列的值。

## 操作

### 文档操作

- create
  - `PUT /<index>/_create/<id>`， 需要提供id
  - `POST /<index>/_doc`，es生成id
- get
- index，`PUT /<index>/_doc/<id>`, 文档不存在, 创建新文档; 文档存在, 则现有文档被删除, 新的文档被创建, 并且版本号+1
- update, `POST /<index>/_update/<id>`
- delete, `DELETE /<index>/_doc/<id>`
- 重建索引
  - update by query， 因为索引的新增修改对老的数据未生效, 需要通过update_by_query在现有的索引上进行重建
  - reindex，想要修改已有的索引设置, 需要在其他索引上进行重建, 将源的source中的原始数据在新的索引上进行重建，并通过 alias 来查询索引数据

### 查询

#### Term 查询

- exist
- term
- terms
- prefix
- range
- regexp
- wildcard
- fuzzy

尽量基于最左前缀匹配

#### Text 查询

基于文本的查询，需要先对查询的文本进行分词处理，然后再进行查询。

- match
- match_phrase
- match_pharse_prefix

#### bool 查询

TODO

#### 查询优化

1. 如果我们想以`后缀作`为搜索条件，可以为 Term 做`反向处理`。`* suffix -> xiffus *`
2. 对于GEO位置信息，可以将它转换为 `GEO Hash`。`(60.6384, 6.5017) -> u4u8gyykk`

### Aggregate 聚合

- 使用 aggregate 时，最好配置 `size: 0`，因为一般只需要返回聚合后的结果

#### bucket

对数据进行**分组**，还可以对分组后的结果集进行进一步的 aggregate。

- filter，对将要分组的数据集进行前置过滤
- terms，基于字段进行分组
- filters，基于条件进行分组
- range，基于数值范围进行分组
- date_range，基于时间区间进行分组

#### metric

对数据进行**统计计算**

### 索引操作

#### 自动创建索引

#### 手动创建索引

#### 查看索引状态

通过 `GET /_cat/indices` 查看集群分片状态:

- green, 主副分片都正常分配
- yellow, 主分片正常分配, 副本分片未正常分配
- red, 主分片未正常分配

通过 `GET /<index>/<_mapping|_settings>` 查看索引信息

#### settings

定义数据分布在哪些分片上。

##### 分词器 Analyzer

将全文本(text)转换为单词(term/token)。`GET /_analyze` 可以用来测试分词器

处理流程：

1. Character Filters，针对原始文本进行处理
2. Tokenizer， 切分单词的规则
3. Token Filters， 对切分后的单词进行处理

##### 分片 Shard

文档在物理空间上的划分. 对于生产环境中的分片设定, 需要提前做好容量规划.

主分片(Primary Shard)， 用于解决数据水平扩展的问题, 通过主分片可以将数据分布到集群内的所有节点上.

- 一个主分片是一个运行的lucene实例
- 主分片数在索引创建时指定, 后续不允许修改.

副本分片(Replica Shard)，用于解决数据的高可用的问题, 它是主分片的拷贝

- 副本数量可以动态修改
- 提高副本数, 可以在一定程度上提高读取的吞吐量

一般都设置分片数(主分片+副本分片)不超过节点数的 3 倍

#### 索引类型

- 组件模板，可重用的构建块，用于配置映射，设置和别名；它们不会直接应用于一组索引
- 索引模板，可以包含组件模板的集合，也可以直接指定设置，映射和别名。
- 自定义索引，在创建索引时显式定义。

最终的索引结构是通过 `自定义索引 + 索引模板 + 组件模板` 合并后的最终结果，他们的优先级：自定义索引 > 组件模板 > 索引模板

可以通过 `POST /_index_template/_simulate_index/<index>` 来模拟计算出该索引的最终配置。

##### 动态索引 Dynamic Mapping

尽量避免使用动态映射

![动态索引](动态索引.png)

#### 备份 & 迁移

离线方案：

- snapshot
- reindex
- logstash
- ElasticSearch-dump
- ElasticSearch-Exporter

增量备份：

- logstash

## 应用场景

- 全文检索

### ELK

基本的日志系统
![beats+logstath+elasticsearch+kibana](beats+logstath+elasticsearch+kibana.png)

增加数据源，和使用MQ
![beats+MQ+logstash+elasticsearch+kibana](beats+MQ+logstash+elasticsearch+kibana.png)

Metric收集和APM性能监控
![Metric收集和APM性能监控](Metric收集和APM性能监控.png)

## 高级特性

```puml
object Cluster
object Node
object Shard
object Index
object "Lucene Index" as LI
object "Lucene Segment" as LS

Cluster "1" -> "1..*" Node
Node "1" -> "1..*" Shard: primary and replica
Index "1" --> "1..*" Shard: primary shards

Shard "1" -> "1" LI
LI "1" -> "1..*" LS

```

### Lucene

一个Shard本质上是一个Lucene Index。

![Lucene](Lucene.png)

**Segment** 是不可变的, 并且内部有着许多数据结构，最主要的两个：

- **Inverted Index**，倒排索引，一个**有序**的数据**字典Dictionary（包括单词Term和它出现的频率）**和单词Term对应的Postings（即存在这个单词的Document）
- **Document Values**，**列式存储**，可以聚合和排序

### 节点 Node

- master-eligible node， 可以参加选主流程, 成为master node. 节点启动时, 默认为master-eligible node.
- master node，只有master node可以修改集群的状态信息.
- data node， 负责保存分片数据
- coordinating node， 负责接受请求, 将请求分发到合适的节点, 最终把结果汇集在一起. 每个节点默认为coordinating node

![节点上的索引流程](节点上的索引流程.jpg)

### 数据持久化过程

**数据持久化过程**：**write -> refresh -> flush -> merge**

![index flow](index-flow.png)

#### write

![write](write.png)

一个新文档过来，会存储在 in-memory buffer 内存缓存区中，顺便会记录 Translog（Elasticsearch 增加了一个 translog ，或者叫事务日志，在每一次对 Elasticsearch 进行操作时均进行了日志记录）。

这时候数据还没到 segment ，是搜不到这个新文档的。数据只有被 refresh 后，才可以被搜索到。

#### refresh

![refresh](refresh.png)

refresh 默认 1 秒钟，执行一次上图流程。ES 是支持修改这个值的，通过 index.refresh_interval 设置 refresh （冲刷）间隔时间。refresh 流程大致如下：

1. in-memory buffer 中的文档写入到新的 segment 中，但 segment 是存储在文件系统的缓存中。此时文档可以被搜索到
2. 最后清空 in-memory buffer。注意: Translog 没有被清空，为了将 segment 数据写到磁盘
3. 文档经过 refresh 后， segment 暂时写到文件系统缓存，这样避免了性能 IO 操作，又可以使文档搜索到。refresh 默认 1 秒执行一次，性能损耗太大。一般建议稍微延长这个 refresh 时间间隔，比如 5 s。因此，ES 其实就是**准实时**，达不到真正的实时。

#### flush

![flush](flush.png)

上个过程中 segment 在文件系统缓存中，会有意外故障文档丢失。那么，为了保证文档不会丢失，需要将文档写入磁盘。那么文档从文件缓存写入磁盘的过程就是 flush。写入磁盘后，清空 translog。具体过程如下：

1. 所有在内存缓冲区的文档都被写入一个新的段。
2. 缓冲区被清空。
3. 一个Commit Point被写入硬盘。
4. 文件系统缓存通过 fsync 被刷新（flush）。
5. 老的 translog 被删除。

#### merge

由于自动刷新流程每秒会创建一个新的段 ，这样会导致短时间内的段数量暴增。而段数目太多会带来较大的麻烦。 每一个段都会消耗文件句柄、内存和cpu运行周期。更重要的是，每个搜索请求都必须轮流检查每个段；所以段越多，搜索也就越慢。

Elasticsearch通过在后台进行Merge Segment来解决这个问题。小的段被合并到大的段，然后这些大的段再被合并到更大的段。

一旦合并结束，老的段被删除：

1. 新的段被刷新（flush）到了磁盘。 写入一个包含新段且排除旧的和较小的段的新提交点。
2. 新的段被打开用来搜索。
3. 老的段被删除。

### 读取过程

所有的搜索系统一般都是两阶段查询，第一阶段查询到匹配的DocID，第二阶段再查询DocID对应的完整文档，这种在Elasticsearch中称为query_then_fetch。

![读取过程](读取过程.jpg)

## Reference

- [Elasticsearch 核心技术与实战](https://time.geekbang.org/course/intro/100030501?tab=catalog)
- [ElasticSearch知识体系详解](https://www.pdai.tech/md/db/nosql-es/elasticsearch.html)
