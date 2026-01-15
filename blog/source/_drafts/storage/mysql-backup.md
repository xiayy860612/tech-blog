---
title: MySQL 运维
date: 2021-06-16 20:47:19
categories:
- storage
tags:
- storage
- RDBS
- mysql
---

本文主要针对MySQL的InnoDB数据库，本文的目标:

- 对数据进行备份
- 将数据恢复到某一个时间点

<!--more-->

## 对 schema 的修改

MySQL中大部分执行alter table来修改表结构的操作都会导致**重建表**, 即用新的结构创建新表, 将旧表数据导入新表, 最后删除旧表. 这对大表来说需要花费很大的时间和代价.

大部分的alter table操作都会导致MySQL服务中断. 对于在生产环境中修改表结构, 一般可采用以下方法:

- 在备用数据库上修改结构后, 和主库进行切换
- 影子拷贝, 操作同创建影子表的操作; 也可借助一些第三方工具来进行影子拷贝

### 影子表

主要用于重建表，操作流程：

1. 创建相同结构的新表, `create table <test_table_new> like <test_table>`
2. 填充数据, 数据有可能时老数据, 也可能时重新整理后的数据
3. 通过重命名来交换新表和旧表的名字,

    ``` sql
    rename table <test_table> to <test_table_old>
    rename <test_table_new> to <test_table>   
    ```

4. 如果出问题了, 可以很容易回滚旧表

## 备份和恢复策略

规划备份和恢复策略时, 可以根据一些需求来考虑:

- 恢复点目标(RPO), 指恢复到哪个时间点, 可以容许丢失多少数据
- 恢复时间目标(RTO), 指恢复可以容许的恢复时间长度
- 备份到目的地的时间, 比如本地, NFS等

备份的内容：

- MySQL配置
- schema和数据
- 二进制日志

Innodb是一个ACID系统， 任何时刻， 每个提交的事务
要么在**Innodb数据文件**中， 要么在**二进制日志文件**中。
所以为了保证一致性， 即属于同一个时间点， 备份Innodb时需要对数据和二进制日志都进行备份。

关闭MySQL备份是最简单安全的, 也是获取一致性的最好的方法, 并且损坏的风险最小.
但对于在线系统来说, 停机备份的代价太大.

如果使用了全局读锁FLUSH TABLE WITH READ LOCK, 并且备份的事务执行需要很长的时间,
则全局读锁需要等待备份的事务完成提交后才释放, 在这期间的所有操作很可能会被阻塞和积压,
即当发生一些修改操作需要等待表的写锁时, 之后的所有读写操作都会被阻塞.
而**避免全局读锁的最好方法就是只使用InnoDB, 如果使用少量的MyISAM表, 则只需要锁住它们即可**，
因为InnoDB支持事务， 能报保证在一个事务中的的数据的一致性。

建议混合使用物理和逻辑两种方式进行备份:
先使用物理复制, 然后启动一个测试的MySQL实例并运行mysqlcheck来检查;
然后周期性的使用mysqldump来执行逻辑备份.

## 备份

### 逻辑备份

逻辑备份只用于数据备份, 通过**MySQL服务器**将存储引擎中的数据导出, 与存储引擎无关,
并且可以对备份的数据进行裁剪.

缺点： 需要通过MySQL加载, 转为存储格式, 并且需要重建索引, 过程很慢,
尤其在加载一个巨大的导出文件的代价很大

需要尽量控制导出的数据文件大小，在保证一致性的前提下，
按照业务逻辑导出到多个文件中，以控制导出到粒度。

导出方式:

- 导出sql格式的schema和数据
- 导出sql格式的schema和csv格式的数据,
必须保证secure_file_priv变量不为NULL, 以及相应的路径必须存在.
需要在MySQL启动前在my.conf中配置

```bash
-- 将schema导出
$ mysqldump --single-transaction -d --databases <database_name> > schema.sql
-- 将相关连的表的数据导到sql文件中
$ mysqldump --single-transaction -t --databases <database_name> > data.sql
-- 每张表都会导出一个sql格式的表结构文件, csv格式的数据导文件
$ mysqldump --single-transaction --tab=<backup_dirname> <database_name> [table1, ...]

```

### 物理备份

优点:

- 物理备份的方式更加简单高效
- 恢复往往要比逻辑备份要快, 省去了加载和重建过程

缺点:

- 往往备份的大小要比逻辑备份大得多

物理备份方式:

- 基于文件拷贝的备份, 适用于关机下备份， 配置文件备份， 日志备份等
- 通过快照进行备份

#### 快照备份

物理数据存放在`/var/lib/mysql`目录下， 每个数据库存储在相同名字的目录下，
同时也包含服务器配置和二进制日志文件。

快照备份是非常好的在线备份方法, 并且可以减少持有锁的时间。
又分为：

- 最小化锁快照备份, 只锁MyISAM表，InnoDB不需要锁
- 无锁快照备份, 如果MyISAM不会发生修改, 就可以不锁表

快照备份后， 通过挂在快照， 拷贝数据文件到备份的地方。

但使用快照备份需要额外的磁盘空间， 用于快照需要的写时复制空间。
并且要求将MySQL的数据相关文件（/var/lib/mysql/）部署在同一个专有卷上。
而且会导致原始卷和快照比正常读写性能要差， 尤其在过多使用写时复制空间时。

对数据进行物理快照备份后, 需要构建一个MySQL实例并加载物理备份,
然后使用mysqlcheck可以对所有的表执行`CHECK TABLES`操作,
检查物理备份的正确性.

#### MySQL配置备份

- /etc/mysql/my.cnf, 默认配置文件
- /etc/mysql/conf.d, 自定义配置目录, 会覆盖默认配置中的设置.

#### 二进制日志备份

二进制日志默认存储在`/var/lib/mysql/`目录下, 格式为`binlog.*`,
可通过命令`mysqlbinlog -d <database_name> <binlog>`来查看指定数据库的二进制日志

常用命令：

- 查看二进制日志， `show binary logs`;
- 创建新的二进制日志文件, `flush logs`;
- 清理指定二进制日志文件之前的日志文件, `purge binary logs to 'binlog.000005'`;

在备份数据之前， 建议flush logs生成新的日志，
可保证备份期间的操作被清楚的记录在最新的日志文件里。

### 最佳实践

一般情况下备份策略采用长周期的逻辑全备份（保底恢复，但加载慢） + 短周期的快照物理备份（快速恢复） + 二进制日志文件定时备份（恢复到某个时间点）。
如果数据量不大， 则只需要逻辑全备份 + 二进制日志文件备份就可以。

逻辑全备份流程：

1. 在进行全备份之前， 创建新二进制日志， 保证在备份期间的操作会被记录到新二进制日志中
2. 进行全备份
3. 清理老的二进制日志， 只保留最新二进制日志
4. 在下一次全备份之前， 定时备份二进制日志

```bash
mysql -e "flush logs;"
mysql -e "show binary logs;"
mkdir <backup_dir_path>
mysqldump --single-transaction -d <database_name>
mysqldump --single-transaction --tab=<backup_dir_path> <database_name>
mysql -e "purge binary logs to ‘<最新的二进制日志>'"
```

二进制日志文件备份流程：

```bash
mysql -e "flush logs;"
cp binlog.* <backup_dir_path>
mysql -e "purge binary logs to ‘<最新的二进制日志>'"
```

## 恢复

在恢复过程中， 要保证MySQL除了恢复进程外不接受其他访问， 直到恢复并检测完毕， 重新提供服务为止。

### 基于时间点的逻辑备份的恢复

基于时间点的恢复要求建立日常备份, 并保证所需要的二进制日志有效.
这样才能基于某一次全备份, 然后从那个时间点开始重放二进制日志,
将数据来恢复到指定时间.

基于逻辑备份恢复和二进制重放都是一个很慢的过程, 在开始恢复之前， 建议通过`set sql_log_bin=0;`关闭二进制日志。

```bash
# 禁用二进制日志
$ mysql -e "set sql_log_bin=0;"
# 创建schema
$ mysql < schema.sql
# 导入数据, mysqlimporter是对load data infile命令的封装
$ mysqlimportor <database_name> <csv数据文件路径>
# 重放从那个时间点之后的二进制日志
$ mysqlbinlog --database=<database_name> <binlog二进制文件路径> | mysql
# 打开二进制日志
$ mysql -e "set sql_log_bin=1;"
```

## Reference

- 高性能MySQL — 第15章备份与恢复
