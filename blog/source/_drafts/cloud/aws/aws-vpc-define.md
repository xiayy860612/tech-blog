---
title: AWS VPC 网络规划及安全配置
date: 2023-12-27 20:00:00
categories:
- aws
tags:
- aws
- network
- subnet
- route
---



<!--more-->

## 网络规划

### 创建VPC

- 设置VPC在哪个region
- 配置CIDR来定义VPC的ip范围，这决定了VPC内最大的可用ip数量.

### 创建subnet

- 在每个AZ中至少创建两种subnet： public subnet和private subnet
- 为了高可用，一般会复制相同的配置到另一个AZ中
- 配置CIDR来决定subnet中的可用ip范围，其中有5个预留的地址
  - 10.0.0.0， network address
  - 10.0.0.1, VPC local router
  - 10.0.0.2, DNS server
  - 10.0.0.3, future use
  - 10.0.0.255, network broadcast address

### 创建internet gateway

- 创建后关联到对应的vpc

### 配置public Route table

当VPC创建之后，系统会创建一个默认的main route table，自动关联到VPC中的subnet。
一般不会去修改默认的main route table，而是会自定义新的route table.

- 创建新的route table
- 添加route: 0.0.0.0/0到public gateway
- 关联到public subnet

## 安全配置

### Network ACL

Network ACL用于subnet级别的虚拟防火墙， 支持黑白名单，
可以控制流量的进出，分为Inbound和Outbound两部分。

默认的Network ACL允许所有流量进出。
一般不修改默认Network ACL, 而是创建新的。

### Security Group

Security Group用于aws资源级别， 主要用于EC2 instances。 
只支持白名单，不在白名单的流量都会被拒绝。

默认是拒绝所有流量的进出，所以需要根据应用来添加相关的rules
