# MySQL 慢查询日志

MySQL的慢查询日志通过设置`slow_query_log`为on来开启慢查询日志.

```
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

通过设置`long_query_time`为0来捕获所有的查询, 响应时间的最小可为**微秒**, 
修改后需要重连来重置连接会话, 使设置生效.

MySQL中的慢查询日志是MySQL中开销最低, 精度最高的测量查询时间的工具.

## 慢日志分析

使用Percona Toolkit中的**pt-query-digest**来对慢日志进行分析, 生成报告, 样本如下.

```
# 180ms user time, 10ms system time, 29.00k rss, 1.00k vsz
# Current date: Thu Nov 29 01:21:12 2018
# Hostname: b6e22fa50b2c
# Files: /var/lib/mysql/b6e22fa50b2c-slow.log
# Overall: 115 total, 14 unique, 0.00 QPS, 0.00x concurrency _____________
# Time range: 2018-11-28T03:38:43 to 2018-11-29T01:18:56
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time           22ms    19us     4ms   189us   445us   492us    98us
# Lock time            2ms       0   586us    18us   108us    75us       0
# Rows sent             25       0       6    0.22    0.99    0.83       0
# Rows examine       5.41k       0   1.07k   48.19   30.19  216.76       0
# Query size         3.01k      10      55   26.83   31.70    6.89   26.08

# Profile
# Rank Query ID                         Response time Calls R/Call V/M   I
# ==== ================================ ============= ===== ====== ===== =
#    1 0xE8390778DC20D4CC04FE01C5B31...  0.0081 37.2%    88 0.0001  0.00 ADMIN PING
#    2 0x873D3AAF7C4528CF9439C8E2DE9...  0.0061 28.0%     4 0.0015  0.00 SHOW VARIABLES
#    3 0xE77769C62EF669AA7DD5F6760F2...  0.0044 20.5%     1 0.0044  0.00 SHOW VARIABLES
#    4 0x751417D45B8E80EE5CBA2034458...  0.0010  4.7%     2 0.0005  0.00 SHOW DATABASES
#    5 0x76B3C1CAEC686C634699F54E638...  0.0005  2.1%     1 0.0005  0.00 
#    6 0x0E7680C04FF2596BE3A3649C5FA...  0.0003  1.5%     1 0.0003  0.00 SELECT
#    7 0x80AEBDBE9DD8458C3AEAAD0E15D...  0.0003  1.3%     4 0.0001  0.00 SET
# MISC 0xMISC                            0.0010  4.8%    14 0.0001   0.0 <7 ITEMS>

# Query 1: 0.00 QPS, 0.00x concurrency, ID 0xE8390778DC20D4CC04FE01C5B31FD305 at byte 10897
# Scores: V/M = 0.00
# Time range: 2018-11-28T03:38:43 to 2018-11-29T01:18:56
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         76      88
# Exec time     37     8ms    19us   154us    91us   125us    29us    98us
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Query size    77   2.32k      27      27      27      27       0      27
# String:
# Databases    test
# Hosts        172.17.0.1
# Users        root
# Query_time distribution
#   1us
#  10us  ##########################################################
# 100us  ################################################################
#   1ms
#  10ms
# 100ms
#    1s
#  10s+
administrator command: Ping\G
```

其中**V/M列**为方差均值比(variance-to-mean ratio)/离差指数(index of dispersion), 
它的值越高表明查询的执行时间变化越大, 说明查询不稳定, 需要去优化.

**Query_time distribution**提供了响应时间的直方图, 可以看到该查询的响应时间分布, 
如果出现多个尖峰, 则需要对查询进行分析和优化.

## 单条查询分析

- show status
- show profile
- 检查慢查询日志的条目(官方版本mysql的信息比较少)
- 使用MySQL的Performance Schema
- explain
- show processlist

### show profile

show profile 默认是关闭的, 可以在连接会话级上动态的修改;
用于在语句执行期间剖析服务器的具体工作.

```
mysql> show variables like 'profiling';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| profiling     | OFF   |
+---------------+-------+
1 row in set (0.00 sec)

-- 开启profiling
mysql> set profiling=1;
Query OK, 0 rows affected, 1 warning (0.00 sec)

mysql> show variables like 'profiling';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| profiling     | ON    |
+---------------+-------+
1 row in set (0.01 sec)
```

通过`show profiles`来查看执行了哪些查询,
通过`show profile for query <query-id>`来查看某个查询的每个步骤执行的时间, 
从而定位花费时间最多的步骤.

```
mysql> show profiles;
+----------+------------+---------------------------------+
| Query_ID | Duration   | Query                           |
+----------+------------+---------------------------------+
|        1 | 0.00390050 | show variables like 'profiling' |
|        2 | 0.00092400 | select * from mysql.user        |
+----------+------------+---------------------------------+
2 rows in set, 1 warning (0.00 sec)

mysql> show profile for query 2;
+----------------------------+----------+
| Status                     | Duration |
+----------------------------+----------+
| starting                   | 0.000159 |
| checking permissions       | 0.000021 |
| Opening tables             | 0.000131 |
| init                       | 0.000020 |
| System lock                | 0.000021 |
| optimizing                 | 0.000014 |
| statistics                 | 0.000032 |
| preparing                  | 0.000028 |
| executing                  | 0.000010 |
| Sending data               | 0.000251 |
| end                        | 0.000014 |
| query end                  | 0.000012 |
| waiting for handler commit | 0.000016 |
| query end                  | 0.000014 |
| closing tables             | 0.000020 |
| freeing items              | 0.000039 |
| logging slow query         | 0.000070 |
| cleaning up                | 0.000055 |
+----------------------------+----------+
18 rows in set, 1 warning (0.01 sec)
```

profile的很多信息来自于`information_schema.profiling`表.

### show status

show [gloabl] status 返回一些计数器.

比较有用的计数器: 

- 句柄计数器(Handler_*)
- 临时文件和表计数器(*_tmp_*)
- 每秒查询数(queries)
- 慢查询数(slow_queries)
- 连接数(Threads_connected)
- 正在执行查询的线程数(Threads_running)

### Performance Schema

通过MySQL的performance_schema数据库来查看一些性能相关的指数, 但相对来说比较偏底层.
主要用于修改MySQL源码来提升性能时, 作为参考指标.

### explain

**TODO**

### show processlist

通过不停捕获`show processlist`的信息(尤其是**State字段**)来观察是否存在大量不正常状态的线程.

## 系统性能分析

- oprofile
- gdb堆栈跟踪
- [poor man's profiler](https://poormansprofiler.org/)
- Percona Toolkit

## Reference

- [Goal-Driven Performance Optimization](https://www.percona.com/resources/white-papers/goal-driven-performance-optimization)
- [Optimizing Oracle Performance](http://shop.oreilly.com/product/9780596005276.do), Cary的优化方法, 又被称为R方法, Oracle世界的优化黄金定律

