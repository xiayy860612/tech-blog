# Indices APIs

## Index Management

所有的Document都是存储在一个指定的index中.

Index的主要相关设置:

- settings
- mappings, 主要用于定义Document的schema
- aliases

已经关闭状态的index无法进行读写操作.

### Shrink

可以通过`shrink`将一个已存在的index存入另一个新的index, 它的主分片要少于源index的主分片数.
新的index的主分片数必须是源index的主分片数的**因子**.
例如源主分片数是15, 则新的index的主分片数只能是5, 3, 1.

shrink的源index必须设置为**read-only**并且所有的备份分片都需要在**同一个节点**上.

### Split


## Mapping Management

可以为已存在的index添加Document的schema, 来定义字段的各种熟悉, 比如类型等;
也可以修改**仅用于搜索**的**已存在**的字段的属性.

通常情况下, 不能对mapping中已存在的字段进行修改. 除了以下几种情况:

- 为`Object datatype`的字段添加新的内部字段
- 添加`multi-fields`可以被添加到已存在的字段
- `ignore_above`属性可以被修改

如果想要修改已存在的字段的mapping, 只能新建一个新的index, 然后配置新的mapping,
再通过`reindex`将数据添加到新的index中.

如果知识重命名字段名, 则可以使用`alias`.

## Alias Management

## Index Settings

## Monitoring

## Status Management

---

[Indices APIs]: https://www.elastic.co/guide/en/elasticsearch/reference/current/indices.html