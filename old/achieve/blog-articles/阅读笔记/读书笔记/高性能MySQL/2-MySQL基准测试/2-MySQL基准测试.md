# MySQL 基准测试

基准测试的流程:

1. 制定测试目标
2. 制定测试规划, 记录测试数据, 系统配置的步骤, 如何测量和分析结果, 以及预热方案等
3. 执行基准测试
4. 收集测试数据
5. 将数据图形化展示
6. 分析结果

## 基准测试工具

**集成式**测试工具, 对整个应用程序系统进行测试:

- [ab](https://httpd.apache.org/docs/2.4/programs/ab.html)
- [http_load](https://acme.com/software/http_load/)
- (推荐)[JMeter](https://jmeter.apache.org/)

**单组件式**测试工具, 专门针对MySQL进行测试:

- mysqlslap
- MySQL Benchmark Suite
- Super Smack
- Database Test Suite
- (推荐)[Percona's TPCC-MySQL Tool](https://github.com/Percona-Lab/tpcc-mysql)
- (强烈推荐)(sysbench)[https://github.com/akopytov/sysbench]

[TPC-C][]是TPC组织发布的一个测试规范, 用于模拟测试复杂在线事务处理系统(OLTP), 
测试结果非常依赖硬件环境, 所以公开发布的TPC-C测试结果往往都会包含具体的系统硬件信息.

## Reference

- [Null hypothesis](https://en.wikipedia.org/wiki/Null_hypothesis)
- [TPC-C][]

---

[TPC-C]: http://www.tpc.org/tpcc/