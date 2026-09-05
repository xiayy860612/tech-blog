# Socket简介

POSIX规范的socket结构**sockaddr_in**中必须有以下3个字段, 其他额外字段取决于实现

- sin_family
- sin_addr, in_addr 类型
- sin_port

---

socket的种类:

- IPv4, 固定长度
- IPv6, 固定长度
- Unix域结构, 变长
- 数据链路, 变长
- 存储

---

socket参数是一种value-result参数, 它有2个传递方向:

- 进程->内核, 用于内核读, bind/connect/sendto
- 内核->进程, 用于内核写, accept/recvfrom/getsocketname/getpeername

---

内存存储字节的方式:

- big-endian大端
- little-endian小端

```
2个字节的值的组成:  高序字节 | 低序字节
如: 269492256        1010|2020

内存增长方向      --->
大端:             高序字节 | 低序字节, 1010|2020
小端:             低序字节 | 高序字节, 2020|1010
```

主机字节序(host byte order)指的是系统所使用的字节序.
网络字节序(network byte order), 使用**大端字节序**来传送多字节整数.

---

在点分十进制ip字符串(206.168.112.96)和ip存储结构in_addr之间转换:

- ip字符串 -> in_addr, inet_aton/inet_pton
- in_addr -> ip字符串, inet_ntoa/inet_ntop

inet_pton/inet_ntop 支持IPv6.


