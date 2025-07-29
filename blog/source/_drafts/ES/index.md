---
title: ES Guide
date: 2025-06-30 20:47:19
categories:
- DB
tags:
- ES
---

# 文档 Document

一个文档相当与数据库表中的一行

- 可搜索数据的最小单元
- json格式, 会被处理成扁平式键值对的结构
- 每个文档有一个唯一id

操作：
- create
	- `PUT /<index>/_create/<id>`， 需要提供id
	- `POST /<index>/_doc`，es生成id
- get
- index，`PUT /<index>/_doc/<id>`, 文档不存在, 创建新文档; 文档存在, 则现有文档被删除, 新的文档被创建, 并且版本号+1
- update, `POST /<index>/_update/<id>`
- delete, `DELETE /<index>/_doc/<id>`
- 重建索引
	- update by query， 因为索引的新增修改对老的数据未生效, 需要通过update_by_query在现有的索引上进行重建
	- reindex，想要修改已有的索引设置, 需要在其他索引上进行重建, 将源的source中的原始数据在新的索引上进行重建

# 索引 Index

![数据建模](数据建模.png)

文档的容器, 在逻辑空间上的一类文档的结合. 一个索引就相当与数据库中的一个表.

![创建索引的流程](创建索引的流程.png)

### Mappings

定义所包含的文档的字段名和类型。

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

参数配置：
- index，控制当前字段是否被索引, 默认为true, 如果为false, 则字段不可被搜索
- store， 默认为false, 因为数据在_source中已经被存储了. store设置为true, 一般是结合_source的enabled设置为false一起使用的, 它会单独存储该字段的原始内容
- fields，通可以为字段设置多个子字段. 例如给text字段添加keyword字段, 满足既可以全文检索, 也可以精确匹配

#### 复杂类型

- object, 字段会被扁平化处理, 在搜索时有可能结果不正确，不太建议使用
- nested, 字段会被存储成独立的文档, 存储在相同的节点上
- parent/child join, 定义父子关系, 分离两个对象文档, 更新互不影响. 添加子文档时, 要指定routing为对应的父文档id, 保证它们存储在相同的分片上.

![复杂类型](复杂类型.png)

ES不擅长处理关联关系
### settings

定义数据分布在哪些分片上。
####  分词器 Analyzer

将全文本(text)转换为单词(term/token)。`GET /_analyze` 可以用来测试分词器

处理流程：
1. Character Filters，针对原始文本进行处理
2. Tokenizer， 切分单词的规则
3. Token Filters， 对切分后的单词进行处理

#### 分片 Shard

文档在物理空间上的划分. 对于生产环境中的分片设定, 需要提前做好容量规划.

主分片(Primary Shard)， 用于解决数据水平扩展的问题, 通过主分片可以将数据分布到集群内的所有节点上.
- 一个主分片是一个运行的lucene实例
- 主分片数在索引创建时指定, 后续不允许修改.

副本分片(Replica Shard)，用于解决数据的高可用的问题, 它是主分片的拷贝
- 副本数量可以动态修改
- 提高副本数, 可以在一定程度上提高读取的吞吐量

一般都设置分片数不超过节点数的 3 倍
### 索引类型

- 组件模板，可重用的构建块，用于配置映射，设置和别名；它们不会直接应用于一组索引
- 索引模板，可以包含组件模板的集合，也可以直接指定设置，映射和别名。
- 自定义索引，在创建索引时显式定义。

最终的索引结构是通过 `自定义索引 + 索引模板 + 组件模板` 合并后的最终结果，他们的优先级：自定义索引 > 组件模板 > 索引模板

可以通过 `POST /_index_template/_simulate_index/<index>` 来模拟计算出该索引的最终配置。

## 动态索引 Dynamic Mapping

尽量避免使用动态映射

![动态索引](动态索引.png)

## 节点 Node

- master-eligible node， 可以参加选主流程, 成为master node. 节点启动时, 默认为master-eligible node.
- master node，只有master node可以修改集群的状态信息.
- data node， 负责保存分片数据
- coordinating node， 负责接受请求, 将请求分发到合适的节点, 最终把结果汇集在一起. 每个节点默认为coordinating node

![节点上的索引流程](节点上的索引流程.jpg)

## 数据持久化过程

**数据持久化过程**：**write -> refresh -> flush -> merge**

### write

![write](write.png)

一个新文档过来，会存储在 in-memory buffer 内存缓存区中，顺便会记录 Translog（Elasticsearch 增加了一个 translog ，或者叫事务日志，在每一次对 Elasticsearch 进行操作时均进行了日志记录）。

这时候数据还没到 segment ，是搜不到这个新文档的。数据只有被 refresh 后，才可以被搜索到。

### refresh

![refresh](refresh.png)

refresh 默认 1 秒钟，执行一次上图流程。ES 是支持修改这个值的，通过 index.refresh_interval 设置 refresh （冲刷）间隔时间。refresh 流程大致如下：

1. in-memory buffer 中的文档写入到新的 segment 中，但 segment 是存储在文件系统的缓存中。此时文档可以被搜索到
2. 最后清空 in-memory buffer。注意: Translog 没有被清空，为了将 segment 数据写到磁盘
3. 文档经过 refresh 后， segment 暂时写到文件系统缓存，这样避免了性能 IO 操作，又可以使文档搜索到。refresh 默认 1 秒执行一次，性能损耗太大。一般建议稍微延长这个 refresh 时间间隔，比如 5 s。因此，ES 其实就是准实时，达不到真正的实时。


### flush

![flush](flush.png)

上个过程中 segment 在文件系统缓存中，会有意外故障文档丢失。那么，为了保证文档不会丢失，需要将文档写入磁盘。那么文档从文件缓存写入磁盘的过程就是 flush。写入磁盘后，清空 translog。具体过程如下：

1. 所有在内存缓冲区的文档都被写入一个新的段。
2. 缓冲区被清空。
3. 一个Commit Point被写入硬盘。
4. 文件系统缓存通过 fsync 被刷新（flush）。
5. 老的 translog 被删除。

### merge

由于自动刷新流程每秒会创建一个新的段 ，这样会导致短时间内的段数量暴增。而段数目太多会带来较大的麻烦。 每一个段都会消耗文件句柄、内存和cpu运行周期。更重要的是，每个搜索请求都必须轮流检查每个段；所以段越多，搜索也就越慢。

Elasticsearch通过在后台进行Merge Segment来解决这个问题。小的段被合并到大的段，然后这些大的段再被合并到更大的段。

一旦合并结束，老的段被删除：

1. 新的段被刷新（flush）到了磁盘。 写入一个包含新段且排除旧的和较小的段的新提交点。
2. 新的段被打开用来搜索。
3. 老的段被删除。



## 读取过程

所有的搜索系统一般都是两阶段查询，第一阶段查询到匹配的DocID，第二阶段再查询DocID对应的完整文档，这种在Elasticsearch中称为query_then_fetch。

![读取过程](读取过程.jpg)


# 搜索 Search

`GET /[index]/_search` 

搜索的方式：
- URL Search
- Body DSL Search， 一般用这种方式。

## Body DSL Search

- `_source`， 指定返回的字段
- `sort`, 指定排序, 默认按算分进行排序
- query，查询条件
- 分页
	- From/Size， 默认最大10000, From+Size超过这个值就会报错.
	- Search After， 搜索时需要指定sort, 且值必须是唯一的，不支持指定页数，只能往下翻
	- Scroll

### Query 常用的查询条件

- Term 查询，Term是表达语义的最小单元, 对输入不做分词处理, 在索引中查找完全匹配的token。
	- Term Query
	- Range Query
	- Exists Query
	- Prefix Query
	- Wildcard Query
- Text 全文查询，索引和搜索时都会使用分词器进行分词处理. 输入的查询字符串会先传递到一个合适的分词器进行处理, 生成一个供查询的token列表, 然后对每个token都进行查询, 最后合并结果.
	- Match Query
	- Match Phrase Query
- 组合查询(bool query)

### 组合查询 bool query

- Query, 贡献相关性算分
	- must, 必须匹配, 贡献算分
	- should, 选择性匹配, 贡献算分
- Filter, 不贡献算分
	- must not, 必须不能匹配, 不贡献算分
	- fitler, 必须匹配, 但不贡献算分

## 相关性

- Precision(查准率)，尽可能返回较少的无关文档
- Recall(查全率)，尽可能返回较多的相关文档
- Ranking
- Score
# 聚合 Aggregations

建议size设置为0, 只返回统计结果. 支持聚合嵌套.

- bucket, 分桶
	- terms, 对指定字段进行分桶
	- range, 对指定字段的范围进行分桶
- metric, 统计计算

![aggregations](aggregations.png)

# 优化

- 大多数 Elasticsearch 部署往往对 CPU 要求不高。
- 排序和聚合都很耗内存，所以有足够的堆空间来应付它们是很重要的。即使堆空间是比较小的时候，也能为操作系统文件缓存提供额外的内存。因为 Lucene 使用的许多数据结构是基于磁盘的格式，Elasticsearch 利用操作系统缓存能产生很大效果。有必要优先将一半的物理内存留给 lucene；另**一半的物理内存留给 ES**（JVM heap）。
- 禁止 swap，一旦允许内存与磁盘的交换，会引起致命的性能问题。可以通过在 elasticsearch.yml 中 bootstrap.memory_lock: true，以保持 JVM 锁定内存，保证 ES 的性能。
- 硬盘对所有的集群都很重要, **在经济压力能承受的范围下，尽量使用固态硬盘（SSD）**。**使用正确的调度程序**, 针对 SSD deadline 或者 noop 应该被使用。deadline 调度程序基于写入等待时间进行优化，noop 只是一个简单的 FIFO 队列。**使用 RAID0 是提高硬盘速度的有效途径，对机械硬盘和 SSD 来说都是如此**。
- 当有大量数据提交的时候，建议采用批量提交（Bulk 操作）；此外使用 bulk 请求时，每个请求不超过几十M，因为太大会导致内存使用过大。
- 如果我们的系统对数据延迟要求不高的话，我们可以**通过延长 refresh 时间间隔，可以有效地减少 segment 合并压力，提高索引速度**。
- Elasticsearch 默认副本数量为3个，虽然这样会提高集群的可用性，增加搜索的并发数，但是同时也会影响写入索引的效率。针对日志相关的索引，可以将副本数目设置为1个。
- 路由优化，使用带 routing 的查询，routing 默认值是文档的 id，也可以采用自定义值。
- 尽可能使用过滤器上下文（Filter）替代查询上下文（Query），Filter结果可以缓存

# 运维

通过 `GET /_cat/indices` 查看集群分片状态:
- green, 主副分片都正常分配
- yellow, 主分片正常分配, 副本分片未正常分配
- red, 主分片未正常分配

通过 `GET /<index>/<_mapping|_settings>` 查看索引信息

## 备份 & 迁移

离线方案：
- snapshot
- reindex
- logstash
- ElasticSearch-dump
- ElasticSearch-Exporter

增量备份：
- logstash
# ELK

基本的日志系统
![beats+logstath+elasticsearch+kibana](beats+logstath+elasticsearch+kibana.png)

增加数据源，和使用MQ
![beats+MQ+logstash+elasticsearch+kibana](beats+MQ+logstash+elasticsearch+kibana.png)

Metric收集和APM性能监控
![Metric收集和APM性能监控](Metric收集和APM性能监控.png)


# Lucene

![Lucene](Lucene.png)

**Segment内部**（有着许多数据结构）
- Inverted Index，一个有序的数据字典Dictionary（包括单词Term和它出现的频率）和单词Term对应的Postings（即存在这个单词的文件）
- Stored Fields
- Document Values
- Cache


# 参考

- 