---
title: MySQL InnoDB 实践
date: 2018-06-30 20:47:19
categories:
- storage
tags:
- storage
- mysql
---

MySQL 在开发中的实践。

<!--more-->

默认隔离级别为 `REPEATABLE READ`，通过 **MVCC 机制**解决了不可重复度的问题，并通过 **Next-Key 锁**解决了幻读的问题。

## 定义 Schema

1. 根据业务模型为每个字段选择合适的数据类型
2. 根据业务需求，创建索引

示例：

```sql
create table user {
    id bigint auto_increment primary key,
    name varchar(255) not null,
    gender tinyint unsigned not null default 0,
    ...
    created_at datetime not null default current_timestamp,
    created_by varchar(255) not null,
    updated_at datetime not null default current_timestamp on update current_timestamp,
    updated_by varchar(255) not null,

    index idx_name(name(64))
} ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- `CHARSET=utf8mb4` 完整支持 uft8 字符集

### 范式与反范式

范式的主要目的:

- 减少数据冗余
- 消除插入/删除/更新的异常

关键概念:

- 码/键(候选码), 表中的一个或多个属性组K, 除开K中的属性外的其他所有属性都完全函数依赖于K, 则K为候选码; 一个表可能存在多个码
- 主属性, 包含在各个候选码中的属性, 主属性不可为空

通常使用的范式:

- 1NF(Normal Form)第一范式, 属性的原子性保证不可再分割, 每个属性都只能存储一个值
- 2NF第二范式, 基于1NF, 定义候选码, 非主属性必须完全依赖于候选码, 即通过候选码可以确定实体的唯一性
- 3NF第三范式, 基于2NF, 消除传递依赖, 即任何非主属性不能由其他属性派生, 要求属性没有冗余
- BCNF, 基于3NF的改进范式, 消除主属性对码的部分与传递依赖

一般情况下, 关系型数据库的表设计只要达到3NF/BCNF就够了.

针对**写密集**的场景尤其需要对 schema 进行范式化, 而针对读密集的场景可以使用反范式，对不可变字段增加冗余，避免过多的 Join 操作.

范式化的表能够更好更快的进行更新操作, 但是查询往往需要多表join;
然而单独的表能够更有效的利用索引.

### 基础数据类型

- 数字
  - 整数
    - tinyint/smallint/mediumint/int/bigint
    - unsigned可选
  - 实数
    - Float/Double, 浮点计算
    - DECIMAL, 存储精确的小数, 一般可使用bigint来代替decimal, 通过乘以相应的倍数即可
- 字符串
  - char, 定长, 适合更新频繁的列或者长度固定的列
  - varchar, 变长, 需要额外的1或2个字节来存储长度, 小于等于255则1个字节, 大于则2个字节; 不适合更新频繁的列, 会导致碎片化
  - text, 很长的字符串
- 二进制字符串, 比较时以字节为单位进行比较, 效率要比普通字符串要高
  - binary, 定长
  - varbinary, 变长
  - blob, 很长的二进制字符串
- 时间
  - datetime, 从1001到9999年, 精度为秒, 把日期和时间封装到格式为**YYYYMMDDHHMMSS的整数**中, 显示**与时区无关, 使用8字节存储**
  - timestamp, 同unit时间戳, 从新纪元时间(1970-01-01T00:00:00)以来的秒数, 使用**4字节存储**, 只能表示1970到2038年, 显示依赖于时区, 会根据时区不同, 显示对应的时间; 对应的列默认为NOT NULL.

### 主键 ID 列的选择

ID 列的数据类型尽量选择**递增型整数**。

由于 InnoDB 的索引是基于 B+ Tree 实现的，所以**递增型 ID** 可以保证数据按顺序在尾部进行插入，
保证数据集中在一定范围内，避免因为随机值导致的额外的数据页的分裂和合并操作，这些操作都会导致插入变慢。

而**整型 ID** 可以使用**位运算**快速进行比较，提升查询性能，所以不建议使用字符串类型作为 id 列, 因为查询性能很差.

### 避免使用 null 字段

一般情况下尽量使用**默认值方案**来替换 NULL, 因为 NULL 会增加查询的复杂度.

### 索引

为了更高的查询性能，一般会根据业务需求来创建索引。

MySQL InnoDB 的索引是基于 B+ Tree 实现的，它是**有序的大致平衡的多叉查找树**，支持精确查找，范围查找和前缀查找。

索引的创建需要根据业务需求来选择相关的字段，并按照**区分度高低从左到右排列**；
查询时，基于**最左前缀原则**，在过滤条件中，将区分度高的列放左边，**尽可能的减小**查询结果的数据集。

针对字符串类型的字段，建议根据区分度为其设置**前缀长度**。

索引类型：

- 聚簇索引，即主键的索引，可用于查找，排序和分组，其叶子节点会关联完整的数据。
- 非聚簇索引，其叶子节点会关联**主键 ID**，所以一般情况下还需要进行一次**回表**查询，即到聚簇索引中查询完整的数据。
  - 覆盖索引，即当查询的字段被索引完全覆盖时，则不需要回表，直接返回。

## 特殊数据类型的处理

### uuid数据

uuid 数据的处理

1. 移除uuid中的**-**
2. 使用unhex函数将uuid字符串转换为16字节的数字, 存储到binary(16)中
3. 使用hex函数将16字节的数字转换为uuid字符串

```bash
mysql> select uuid();
+--------------------------------------+
| uuid()                               |
+--------------------------------------+
| e8dc60bb-6df3-11e8-8915-0800273063ab |
+--------------------------------------+
1 row in set

mysql> select unhex('e8dc60bb6df311e889150800273063ab');
+-------------------------------------------+
| unhex('e8dc60bb6df311e889150800273063ab') |
+-------------------------------------------+
| ��`�m��
+-------------------------------------------+
1 row in set

mysql> select hex(unhex('e8dc60bb6df311e889150800273063ab'));
+------------------------------------------------+
| hex(unhex('e8dc60bb6df311e889150800273063ab')) |
+------------------------------------------------+
| E8DC60BB6DF311E889150800273063AB               |
+------------------------------------------------+
1 row in set
```

### ip数据

ip数据需要转换为数字存储

1. 使用**无符号整数**存储ip列
2. 使用inet_aton将ip字符串转换为整数
3. 使用inet_ntoa将数字转换为ip字符串

```bash
mysql> select inet_aton('192.168.0.1');
+--------------------------+
| inet_aton('192.168.0.1') |
+--------------------------+
|               3232235521 |
+--------------------------+
1 row in set

mysql> select inet_ntoa(3232235521);
+-----------------------+
| inet_ntoa(3232235521) |
+-----------------------+
| 192.168.0.1           |
+-----------------------+
1 row in set
```

## 特殊应用场景

### 缓存表 && 汇总表

通过缓存表和汇总表来缓存源数据经过逻辑计算后的冗余数据, 可以提升相应业务逻辑场景的查询性能.

- 非实时性数据, 定时计算更新的不严格计数
- 实时性数据, 通过小范围查询填满间隙的严格计数

在使用缓存表和汇总表时, 对数据的维护有两种方式:

- 实时维护, 成本较高, 数据容易碎片化
- 定期重建, 可以保持表不会有很多碎片, 而且能保证顺序组织索引, 更加高效

### 计数表

为了提升技术表的并发处理能力, 在更新时随机到相应的slot行插入, 查询时汇总结果.

```sql
-- 多slot的计数表

create table if not exists counter_tb (
    slot tinyint unsigned not null primary key, 
    cnt int unsigned not null
) engine=InnoDB default charset=utf8mb4;

-- 更新时随机slot更新
insert into counter_tb (slot, cnt)
values (rand() * 10, 1)
on duplicate key update cnt = cnt + 1;

-- 查询时汇总

select * from counter_tb;

select sum(cnt)
from counter_tb;
```

### 分布式锁表

通过**锁表**来实现分布式锁，适用于轻量级分布式锁的场景。

```sql
CREATE TABLE db_lock (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `lock_key` int NOT NULL,
    `holder_id` VARCHAR(100) NOT NULL,
    `created_at` datetime not null default current_timestamp,

    PRIMARY KEY (id),
    UNIQUE KEY uiq_idx_lock_key (lock_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--  获取锁，获取锁失败则抛出 DuplicateKey 异常
insert into db_lock (lock_key, holder_id) values (1, 'test');

--  释放锁，必须校验 holder_id，防止误删他人持有的锁
delete from db_lock where lock_key = 1 and holder_id = 'test';
```

## 运维

### 对 schema 修改

MySQL 中大部分执行 alter table 来修改表结构的操作都会导致**重建表**, 即用新的结构创建新表, 将旧表数据导入新表, 最后删除旧表. 这对**大表**来说需要花费很大的时间和代价.

大部分的 alter table 操作都会导致 MySQL 服务中断.
对于在生产环境中修改表结构, 一般可采用以下方法:

- 在备用数据库上修改结构后, 和主库进行切换
- 影子拷贝, 操作同创建影子表的操作; 也可借助一些第三方工具来进行影子拷贝

#### 影子表

重建表可以通过影子表的技巧，操作流程：

1. 创建相同结构的新表, `create table <test_table_new> like <test_table>`
2. 填充数据, 数据有可能时老数据, 也可能时重新整理后的数据
3. 通过重命名来交换新表和旧表的名字,

    ``` sql
    rename table <test_table> to <test_table_old>
    rename <test_table_new> to <test_table>   
    ```

4. 如果出问题了, 可以很容易回滚旧表

### 备份和恢复

规划备份和恢复时, 可以根据一些需求来考虑:

- 恢复点目标(RPO), 指恢复到哪个时间点, 可以容许丢失多少数据
- 恢复时间目标(RTO), 指恢复可以容许的恢复时间长度
- 备份到目的地的时间, 比如本地, NFS等

备份的内容：

- MySQL配置
- schema
- 数据
- 二进制日志

备份策略：

- 逻辑全备份，用于恢复**基线数据**，备份和恢复速度慢，不适用于生产以及大数据量的场景。
- 快照全备份，用于恢复**基线数据**，备份和恢复速度快，但需要比较大的存储空间，适用于生产环境。
- binlog 定时备份，基于基线数据，恢复到某个**秒级时间点**。

备份的最佳实践：一般在**从库**上执行`快照备份 + binlog 定时备份`。

恢复策略：基线数据 + binlog 回放

#### binlog 备份和回放

```bash
# 备份
mysql -e "flush logs;"
cp binlog.* <backup_dir_path>
mysql -e "purge binary logs to ‘<最新的二进制日志>'"

# 回放
# 禁用二进制日志
$ mysql -e "set sql_log_bin=0;"
# 重放二进制日志
$ mysqlbinlog --start-position= --database=<database_name> <binlog二进制文件路径> | mysql
# 打开二进制日志
$ mysql -e "set sql_log_bin=1;"
```

## 高性能

数据库服务器的性能用**查询的响应时间**来度量，查询的时间分为两部分: **执行时间和等待时间**.

- 优化执行时间, 最好是通过测量**定位不同的子任务花费的时间**, 然后优化去掉一些子任务, 降低子任务的执行频率或者提升子任务的效率.
- 优化等待时间相对要复杂一些, 它往往是由其他系统间接影响导致.

性能剖析一般有两个步骤:

1. 测量任务所花费的时间
2. 对结果进行统计和排序, 将重要任务排到前面

- 基于执行时间的分析, 研究的是**什么任务的执行时间最长**
- 基于等待时间的分析, 研究的是判断任务在**什么地方被阻塞的时间最长**

对系统的性能剖析建议**自上而下**的进行, 这样可以追踪自用户发起到服务器响应的整个流程.
而优化的顺序，

1. **抓住核心：慢 SQL 定位与分析**
2. **索引、表结构和 SQL 优化**
3. **架构优化**

### 慢查询分析

MySQL中的慢查询日志是 MySQL 中开销最低, 精度最高的测量查询时间的工具.
可以通过设置 `slow_query_log` 为 on 来开启慢查询日志.

```shell
-- 获取慢查询配置
mysql> show variables like 'slow_query_%';
+---------------------+--------------------------------------+
| Variable_name       | Value                                |
+---------------------+--------------------------------------+
| slow_query_log      | ON                                   |
| slow_query_log_file | /var/lib/mysql/b6e22fa50b2c-slow.log |
+---------------------+--------------------------------------+

-- 获取慢查询的阀值
mysql> show variables like 'long_query_time';

```

通过设置`long_query_time`为 0 来捕获所有的查询, 响应时间的最小可为**微秒**,
修改后需要重连来重置连接会话, 使设置生效.

可以通过工具 `Percona Toolkit --- pt-query-digest` 对整个慢查询日志进行分析, 生成报告, 更好的去分析问题.

对单条查询分析，主要通过下面的工具：

- `show profiles`/`show profile for query <query-id>`，查看查询以及相关的响应时间。
- explain，分析查询的执行计划，看是否存在性能问题。

### EXPLAIN

使用 `EXPLAIN` 命令来分析 SQL 的 **执行计划**。
执行计划是指一条 SQL 语句在经过 MySQL 查询优化器的优化会后，具体的执行方式。

- select_type，查询的类型，主要用于区分普通查询、联合查询、子查询等复杂的查询
- type，查询执行的类型，描述了查询是如何执行的。所有值的顺序从最优到最差排序为：system > const > eq_ref > ref > fulltext > ref_or_null > index_merge > unique_subquery > index_subquery > range > index > ALL
- key
- extra，包含了 MySQL 解析查询的额外信息，通过这些信息，可以更准确的理解 MySQL 到底是如何执行查询的。

type 常见的几种类型具体含义如下：

- **system**：如果表使用的引擎对于表行数统计是精确的（如：MyISAM），且表中只有一行记录的情况下，访问方法是 system ，是 const 的一种特例。
- **const**：表中最多只有一行匹配的记录，一次查询就可以找到，常用于使用主键或唯一索引的所有字段作为查询条件。
- **eq_ref**：当连表查询时，前一张表的行在当前这张表中只有一行与之对应。是除了 system 与 const 之外最好的 join 方式，常用于使用主键或唯一索引的所有字段作为连表条件。
- **ref**：使用普通索引作为查询条件，查询结果可能找到多个符合条件的行。
- **index_merge**：当查询条件使用了多个索引时，表示开启了 Index Merge 优化，此时执行计划中的 key 列列出了使用到的索引。
- **range**：对索引列进行范围查询，执行计划中的 key 列表示哪个索引被使用了。
- **index**：查询遍历了整棵索引树，与 ALL 类似，只不过扫描的是索引，而索引一般在内存中，速度更快。
- **ALL**：全表扫描。

Extra常见的值：

- **Using filesort**：在排序时使用了外部的索引排序，没有用到表内索引进行排序。
- **Using temporary**：MySQL 需要创建临时表来存储查询的结果，常见于 ORDER BY 和 GROUP BY。
- **Using index**：表明查询使用了覆盖索引，不用回表，查询效率非常高。
- **Using index condition**：表示查询优化器选择使用了索引条件下推这个特性。
- **Using where**：表明查询使用了 WHERE 子句进行条件过滤。一般在没有使用到索引的时候会出现。
- **Using join buffer (Block Nested Loop)**：连表查询的方式，表示当被驱动表的没有使用索引的时候，MySQL 会先将驱动表读出来放到 join buffer 中，再遍历被驱动表与驱动表进行查询。

## 高可用

通过集群实现高可用，集群中的节点会通过**主从复制**和**读写分离**。
而客户端一般会通过 `Database Proxy` 代理来访问数据库集群来实现负载均衡。

主从复制，从节点会从主节点读取 binlog 并进行回放来重建数据。

![主从复制](master-replica.png)

读写分离，通过 `Database Proxy` 代理将读操作导向从节点/主节点，而写操作导向主节点。

![读写分离](db-read-write-decouple.png)

## Reference

- [高性能 MySQL](https://book.douban.com/subject/23008813/)
- [解释一下关系数据库的第一第二第三范式](https://www.zhihu.com/question/24696366)
- [数据库设计三大范式与BCNF，学习笔记](https://www.cnblogs.com/ybwang/archive/2010/06/04/1751279.html)
