# Logstash

学习Logstash
<!--more-->

## Directory Layout

|Type|Description|Config Setting|
|:---|:---|:---|
|home|installation path||
|bin|Binary scripts including logstash to start Logstash and logstash-plugin to install plugins||
|settings|configuration files path|path.settings|
|conf|Logstash pipeline configuration files|path.config|
|logs|Log files|path.logs|
|plugins|Local, non Ruby-Gem plugin files|path.plugins|

All these config settings are set in **logstash.yml**

Define different pipeline configurations in **path.config** directory.
Logstash tries to load all files in that directory.

## Grammar

- section, {}, used to define a scope of plugin
- field reference, [], get value of filed
    + nested, [][]...
- print value, %{}
- value types: array([]), boolean(true/false), hash({}), number, string

more refer:
- [Structure of a Config File](https://www.elastic.co/guide/en/logstash/current/configuration-file-structure.html)
- [Accessing Event Data and Fields in the Configuration](https://www.elastic.co/guide/en/logstash/current/event-dependent-configuration.html)
- [Using Environment Variables](https://www.elastic.co/guide/en/logstash/current/environment-variables.html)

## Pipeline Configuration
Pipeline Configuration defines sections of plugins 
used for **event processing pipeline**.

logstash 会自动读取**path.config**目录下所有*.conf文件,然后在内存里拼接成一个完整的大配置文件,再去执行.

logstash列出目录下所有文件时,是字母排序的.而logstash配置段的filter和output都是顺序执行,所以顺序非常重要.
采用多文件管理的用户,推荐采用**数字编号方式**命名配置文件,同时在配置中,严谨采用if判断限定不同日志的动作。

Work Flow: input | decode | filter | encode | output

[Codec][https://www.elastic.co/guide/en/logstash/current/codec-plugins.html]用来处理decode/encode事件.

对日志统一采用**UTC**时间存成**long**类型的数据，是国际安全/运维界的一个通识.

filer和output都是按顺序执行.

### Input

- [支持FileBeats的beats](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-beats.html)
- [文件监控file](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-file.html)
- [Syslog](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-syslog.html)

#### Syslog

在使用LogStash::Inputs::Syslog时, 使用TCP协议传输数据.

强烈建议使用LogStash::Inputs::TCP和LogStash::Filters::Grok配合实现同样的syslog功能.
可以很好的优化Syslog的处理性能.

### Filter

- [时间处理date](https://www.elastic.co/guide/en/logstash/current/plugins-filters-date.html)
- [日志正则匹配grok](https://www.elastic.co/guide/en/logstash/current/plugins-filters-grok.html)
- [IP地址解析geoip](https://www.elastic.co/guide/en/logstash/current/plugins-filters-geoip.html)
- [JSON解析json](https://www.elastic.co/guide/en/logstash/current/plugins-filters-json.html)
- [类型转换mutate](https://www.elastic.co/guide/en/logstash/current/plugins-filters-mutate.html)
- [强大的自定义事件ruby](https://www.elastic.co/guide/en/logstash/current/plugins-filters-ruby.html)

#### Grok

grok表达式的完整语法格式

    `%{PATTERN_NAME:capture_name:data_type}`

    date_type: int/float

可使用[Grok Debugger](http://grokdebug.herokuapp.com/)来测试自己的grok表达式

### Output

- [Elasticsearch](https://www.elastic.co/guide/en/logstash/current/plugins-outputs-elasticsearch.html)

## Reference

- [ELKstack 中文指南](https://www.gitbook.com/book/chenryn/elk-stack-guide-cn)

---
[YAML]: http://yaml.org/