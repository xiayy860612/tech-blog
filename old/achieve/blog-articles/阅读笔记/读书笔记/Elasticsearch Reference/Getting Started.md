# Getting Started

Elasticsearch是一个高可扩展性的开源的全文搜索和分析引擎, 
能够**近实时**的存储, 搜索和分析大量的数据, 为复杂查询提供支持.

- 近实时(NRT, near realtime)
- 可集群化(Cluster), 每个集群有**唯一的名字**, 节点通过集群名加入到对应的集群中
- 节点(Node), 每个节点也有一个**唯一的名字**
- 索引(Index), 拥有相似特点的文档的集合
- 文档(Document), 可以被索引处理的基本单元, 以**JSON**格式存储相关的业务数据
- 分片(Shards), 在创建index时可以指定分片数量, 用来避免在一个节点上的index的存储容量太大, 也为了更好提供分布式的并发处理能力.
- 复制(Replicas), 保证数据的高可用性的灾备手段, 它一般绝不会和拷贝源在同一节点上.

尽量保证不同的环境使用不同的集群名.

一个index可以被细分为多个shard, 并且可以被多次复制.
一旦复制, 一个index就会拥有一个primary shard和多个replica shard.

通过`/_cat`相关的APIs检查es的状态

es不强制用户显式创建index的内容格式(Mapping), 
当插入document到一个未创建的index时, es会自动创建.

es在_source字段中返回相关的document的数据.

es的API格式一般为: `/<index>/<type>/<id>`

在插入时, 如果不传入id, es会生成一个随机id.

es的批量操作在失败后会继续执行, 执行完毕后会返回每个命令的结果.

es可以使用两种方式来使用查询接口`_search`:

- REST request URI, 一般用于简单查询
- REST request body, 可以支持更复杂的查询操作

```
GET /<index>/_search
{
  "query": {...}, // 查询条件
  "sort": {...}, // 结果排序

  // 查询结果筛选区间
  "from": 0, 
  "size:: 10,

  "_source": [...], // 返回哪些字段
  "aggs": {...} // 聚合计算
}
```

document score用来表明document在某个查询中的权重,
score越高表明和查询相关性越高, 在查询中的重要性越高.
如果某些字段仅仅用于过滤结果集, 则不需要计算score.


