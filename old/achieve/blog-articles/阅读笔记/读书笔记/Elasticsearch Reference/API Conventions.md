# API Conventions

Elasticsearch REST APIs基于HTTP使用JSON格式.

## Multiple Indices

在需要`index`参数的地方可以列出多个index, 通过下面的方式来列举多个index

- 多个index的名字, 通过`,`分割; 可以使用`_all`来表示所有的index
- 使用通配符匹配多个index; 排除某个index, 格式: **`-`<index>**

## Date math support in index names

添加时间信息到index的名字, 可以通过时间来对index进行过滤, 降低吞吐量和提供执行的性能.

带时间信息的index的名字格式: `<static_name{date_math_expr{date_format|time_zone}}>`

## Common options

所有REST APIs支持的通用参数, 在`query string`中设置

- ?pretty=true
- ?human=false
- date match, 用于时间参数计算
- filter_path, 指定要返回的数据, 支持通配符.
- error_trace=true, 调试用, 用于返回更详细的错误信息
