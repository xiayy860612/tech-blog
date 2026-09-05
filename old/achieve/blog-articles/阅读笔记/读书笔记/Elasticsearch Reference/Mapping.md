# Mapping

elasticsearch 6.0.0之后的版本只允许有一个mapping type(`_doc`), **它将在未来的7.0.0版本中被移除**.

Mapping用于定义Document的schema, 主要包括:

- 字段类型
- 存储与否
- 是否被索引

Mapping Type:

- Meta-Fields, 元数据相关的字段
- Fields, Document内容相关的字段

## Field DataType

- text, 支持全文检索
- keyword, 会做分词索引
- 数值类型
- date, es内部使用UTC时间来存储从epoch时间开始的毫秒数, 可以通过`format`指定输入的格式
- 数值范围或者时间范围类型
- 数组, 一个字段可以存储多个值, 但每个值的类型必须一致, 以第一个值作为类型Schema.
- object, 在es内部, 字段会被flatten, 转换为`full dotted path`. 例如: `user: { "first": "123" } => user.first: "123"`
- nested, object类型的数组

通过`fields`属性来定义**multi-field**.

## Meta Field

- _index, index的名字
- _uid, _type+_id的唯一性
- _type, mapping type
- _id, 文档id

## Dynamic Mapping

通过执行index document来自动添加新增字段, 支持添加的范围:

- top-level mapping type
- object和nested类型的字段



---

[Mapping]: https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html