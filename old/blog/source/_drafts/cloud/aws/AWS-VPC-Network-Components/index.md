---
title: AWS VPC 核心网络组件详解
date: 2026-03-18 20:00:00
categories:
- aws
tags:
- aws
- vpc
- network
- internet-gateway
- nat-gateway
- vpc-endpoint
---

AWS VPC (Virtual Private Cloud) 是 AWS 云中网络架构的基础。本文将详细介绍 VPC 及其四个核心网络组件：VPC 本身、Internet Gateway、NAT Gateway 和 VPC Endpoint，帮助你深入理解 AWS 网络架构。

<!--more-->

## 一、VPC (Virtual Private Cloud)

### 1.1 是什么

**Amazon Virtual Private Cloud (Amazon VPC)** 是一种 AWS 服务，允许你在 AWS 云中创建一个逻辑上隔离的虚拟网络。在这个虚拟网络中，你可以：

- 自定义 IP 地址范围（CIDR 块）
- 创建子网（Subnet）
- 配置路由表（Route Table）
- 设置网关和安全设置

VPC 是你在 AWS 中部署资源的网络边界，类似于你在传统数据中心中构建的网络环境。

#### 默认 VPC vs 非默认 VPC

| 特性 | 默认 VPC | 非默认 VPC |
|------|----------|------------|
| 创建方式 | AWS 账户创建时自动生成 | 用户手动创建 |
| 子网 | 每个 AZ 一个公有子网 | 用户自定义 |
| Internet Gateway | 已附加 | 需手动附加 |
| 安全组 | 有默认安全组 | 有默认安全组 |

### 1.2 有什么用以及在什么场景用

#### 主要用途

1. **网络隔离**：在云中创建独立的网络环境，与其他 AWS 账户逻辑隔离
2. **IP 地址管理**：自定义内部 IP 地址范围，与现有网络规划保持一致
3. **安全控制**：结合安全组和网络 ACL 实现多层次安全防护
4. **混合云架构**：通过 VPN 或 Direct Connect 与本地数据中心互联

#### 典型使用场景

- **Web 应用托管**：创建公有子网放置面向互联网的服务器，私有子网放置数据库
- **企业级应用**：多层架构部署，Web 层、应用层、数据库层分别在不同子网
- **混合云部署**：需要与本地数据中心保持网络连通的场景
- **开发测试环境**：为不同团队创建独立的 VPC 环境

### 1.3 怎么使用

#### 通过 AWS 控制台创建 VPC

1. 登录 AWS 控制台，进入 VPC 服务
2. 点击「创建 VPC」
3. 选择创建方式：
   - **仅 VPC**：只创建 VPC 本身
   - **VPC 及其他资源**：自动创建子网、路由表、安全组等
4. 配置基本参数：
   - 名称标签
   - CIDR 块（如 10.0.0.0/16，提供 65536 个 IP）
5. （可选）配置 IPv6 CIDR 块
6. 点击「创建 VPC」

#### 通过 AWS CLI 创建

```bash
# 创建 VPC
aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=MyVPC}]'

# 创建子网
aws ec2 create-subnet \
    --vpc-id vpc-xxxxxxxx \
    --cidr-block 10.0.1.0/24 \
    --availability-zone us-east-1a
```

#### VPC 配置要点

1. **CIDR 块规划**：建议使用 RFC 1918 私有地址范围
   - 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
   - 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
   - 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)

2. **子网划分**：每个子网必须完全位于一个可用区（AZ）内

3. **子网 CIDR 预留地址**（以 10.0.0.0/24 为例）：
   - 10.0.0.0：网络地址
   - 10.0.0.1：VPC 路由器
   - 10.0.0.2：DNS 服务器
   - 10.0.0.3：预留供 AWS 使用
   - 10.0.0.255：广播地址（VPC 不支持广播）

### 1.4 其他常用特性

#### IP 地址管理

- **IPv4 CIDR 块**：最小 /28（16 个 IP），最大 /16（65536 个 IP）
- **IPv6 CIDR 块**：AWS 自动分配 /56 的 IPv6 CIDR 块
- **双栈模式**：同时支持 IPv4 和 IPv6

#### DNS 配置选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| enableDnsSupport | 启用 AWS DNS 解析 | true |
| enableDnsHostnames | 为实例分配 DNS 主机名 | 默认 VPC 为 true |

#### 安全层

- **Security Group（安全组）**：实例级别的有状态防火墙
- **Network ACL（网络访问控制列表）**：子网级别的无状态防火墙

#### VPC 流日志 (Flow Logs)

可捕获 VPC 中网络接口的流量信息，发送到 CloudWatch Logs 或 S3，用于：
- 安全分析
- 网络故障排查
- 合规审计

#### 对等连接 (VPC Peering)

- 连接两个 VPC，使它们可以像在同一网络中一样通信
- 支持同账户、跨账户、跨区域对等连接
- 不支持传递性对等（A-B, B-C 不代表 A-C）

---

## 二、Internet Gateway (互联网网关)

### 2.1 是什么

**Internet Gateway** 是一种横向扩展、冗余且高度可用的 VPC 组件，用于实现 VPC 与互联网之间的通信。

#### 核心特点

- **完全托管**：AWS 自动处理高可用和冗余
- **双向通信**：支持入站和出站流量
- **IPv4/IPv6 双栈支持**：同时支持两种 IP 协议
- **免费使用**：不收取网关本身费用

#### 工作原理

对于 IPv4 流量，Internet Gateway 还执行以下功能：
1. **网络地址转换 (NAT)**：将实例的私有 IP 映射到弹性 IP 或公有 IP
2. **路由转发**：将互联网流量路由到正确的实例

### 2.2 有什么用以及在什么场景用

#### 主要用途

1. **互联网访问**：让 VPC 内的资源能够访问互联网
2. **公网服务暴露**：让互联网用户能够访问 VPC 内的公共服务
3. **IPv6 原生支持**：为 IPv6 流量提供网关功能

#### 典型使用场景

- **Web 服务器**：需要从互联网访问的网站或 API 服务
- **公网 API**：对外提供服务的 RESTful API
- **CDN 源站**：作为 CloudFront 等 CDN 的后端源站
- **用户-facing 应用**：任何需要公网访问的应用

#### 公有子网 vs 私有子网

| 子网类型 | Internet Gateway | 公网 IP | 可被互联网访问 |
|----------|------------------|---------|----------------|
| 公有子网 | 路由表有 IGW 路由 | 有 | 是 |
| 私有子网 | 路由表无 IGW 路由 | 无 | 否 |

### 2.3 怎么使用

#### 创建和附加 Internet Gateway

**通过控制台：**

1. 进入 VPC 控制台，选择「Internet 网关」
2. 点击「创建 Internet 网关」
3. 输入名称标签
4. 选择创建的网关，点击「操作」→「附加到 VPC」
5. 选择目标 VPC 并确认

**通过 AWS CLI：**

```bash
# 创建 Internet Gateway
aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=MyIGW}]'

# 附加到 VPC
aws ec2 attach-internet-gateway \
    --internet-gateway-id igw-xxxxxxxx \
    --vpc-id vpc-xxxxxxxx
```

#### 配置路由表

将 Internet Gateway 添加到公有子网的路由表中：

| 目标 | 目标 |
|------|------|
| 10.0.0.0/16 | local |
| 0.0.0.0/0 | igw-xxxxxxxx |

```bash
# 创建路由表
aws ec2 create-route-table --vpc-id vpc-xxxxxxxx

# 添加默认路由到 IGW
aws ec2 create-route \
    --route-table-id rtb-xxxxxxxx \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id igw-xxxxxxxx

# 关联到子网
aws ec2 associate-route-table \
    --route-table-id rtb-xxxxxxxx \
    --subnet-id subnet-xxxxxxxx
```

#### IPv6 配置

对于 IPv6 流量，路由表配置如下：

| 目标 | 目标 |
|------|------|
| ::/0 | igw-xxxxxxxx |

### 2.4 其他常用特性

#### 高可用性

- Internet Gateway 是区域级资源，自动在所有可用区提供冗余
- 无需担心单点故障
- AWS 自动处理扩展

#### 带宽

- Internet Gateway 本身不限制带宽
- 带宽限制取决于实例类型

#### 与 NAT Gateway 的区别

| 特性 | Internet Gateway | NAT Gateway |
|------|------------------|-------------|
| 方向 | 双向（入站+出站） | 仅出站 |
| 公网 IP | 分配给实例 | 网关拥有 |
| 费用 | 免费 | 按小时+流量收费 |
| 用途 | 公有子网 | 私有子网访问互联网 |

---

## 三、NAT Gateway (网络地址转换网关)

### 3.1 是什么

**NAT Gateway** 是一种完全托管的网络地址转换服务，允许私有子网中的实例访问互联网，同时阻止互联网发起的入站连接。

#### 两种类型

| 类型 | 描述 | 使用场景 |
|------|------|----------|
| **Public NAT Gateway** | 分配弹性 IP，通过 Internet Gateway 访问互联网 | 私有子网需要访问公网 |
| **Private NAT Gateway** | 通过 Transit Gateway 或 Virtual Private Gateway 路由 | 与其他 VPC/本地数据中心通信 |

#### 核心特点

- **完全托管**：AWS 负责高可用、冗余和扩展
- **自动扩展**：带宽最高可达 100 Gbps
- **高性能**：支持最高 1000 万数据包/秒
- **协议支持**：TCP、UDP、ICMP

### 3.2 有什么用以及在什么场景用

#### 主要用途

1. **安全出站访问**：私有子网中的资源需要下载更新、访问外部 API
2. **保护内部资源**：确保私有资源无法从互联网直接访问
3. **统一出口**：所有出站流量通过固定的公网 IP

#### 典型使用场景

- **数据库补丁**：私有子网中的 RDS 需要下载安全更新
- **API 调用**：后端服务需要调用第三方 API
- **软件包下载**：EC2 实例需要从软件源下载包
- **日志上传**：将日志上传到外部服务

### 3.3 怎么使用

#### 创建 Public NAT Gateway

**前置条件：**
- 必须创建在公有子网中
- 需要分配弹性 IP (EIP)

**通过控制台：**

1. 进入 VPC 控制台，选择「NAT 网关」
2. 点击「创建 NAT 网关」
3. 选择公有子网
4. 选择弹性 IP 分配方式（新建或使用现有）
5. 点击「创建 NAT 网关」

**通过 AWS CLI：**

```bash
# 分配弹性 IP
aws ec2 allocate-address --domain vpc

# 创建 NAT Gateway
aws ec2 create-nat-gateway \
    --subnet-id subnet-xxxxxxxx \
    --allocation-id eipalloc-xxxxxxxx \
    --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=MyNAT}]'
```

#### 配置私有子网路由表

| 目标 | 目标 |
|------|------|
| 10.0.0.0/16 | local |
| 0.0.0.0/0 | nat-xxxxxxxx |

```bash
# 为私有子网添加路由
aws ec2 create-route \
    --route-table-id rtb-xxxxxxxx \
    --destination-cidr-block 0.0.0.0/0 \
    --nat-gateway-id nat-xxxxxxxx
```

#### 高可用架构

为每个可用区创建独立的 NAT Gateway，避免跨 AZ 流量和单点故障：

```
AZ-1: Public Subnet-A → NAT Gateway-A ← Private Subnet-A
AZ-2: Public Subnet-B → NAT Gateway-B ← Private Subnet-B
```

### 3.4 其他常用特性

#### 性能规格

| 指标 | 规格 |
|------|------|
| 带宽 | 最高 100 Gbps（从 5 Gbps 自动扩展） |
| 数据包处理 | 最高 1000 万 PPS（从 100 万自动扩展） |
| 并发连接 | 每个 IP 每个 unique 目标 55,000 个连接 |
| MTU | 最高 8500 字节 |

#### IPv6 支持 (NAT64/DNS64)

NAT Gateway 支持 NAT64 和 DNS64，允许 IPv6 客户端与 IPv4 服务器通信：

- **DNS64**：为 IPv4 地址生成 IPv6 地址
- **NAT64**：将 IPv6 流量转换为 IPv4

#### 监控指标

通过 CloudWatch 监控：
- `ActiveConnectionCount`：活动连接数
- `BytesOutToDestination`：发送到目的地的字节数
- `BytesOutFromSource`：从源接收的字节数
- `PacketsOutToDestination`：发送的数据包数
- `PacketsDropCount`：丢弃的数据包数

#### 费用说明

- **按小时计费**：每个 NAT Gateway 每小时收费
- **数据处理费**：按处理的数据量收费
- **跨 AZ 费用**：跨可用区的数据传输额外收费

---

## 四、VPC Endpoint (VPC 终端节点)

### 4.1 是什么

**VPC Endpoint** 允许你私有地连接 VPC 到支持的 AWS 服务和 VPC 终端节点服务，而无需通过互联网网关、NAT 设备、VPN 连接或 AWS Direct Connect。

VPC Endpoint 基于 **AWS PrivateLink** 技术，确保流量不暴露在公共互联网上。

#### 两种类型

| 类型 | 描述 | 支持的服务 | 费用 |
|------|------|------------|------|
| **Gateway Endpoint** | 以路由表目标形式存在 | Amazon S3, DynamoDB | 免费 |
| **Interface Endpoint** | 以弹性网络接口 (ENI) 形式存在 | 大多数 AWS 服务 | 按小时+数据处理收费 |

### 4.2 有什么用以及在什么场景用

#### 主要用途

1. **安全访问**：不经过公网访问 AWS 服务
2. **合规要求**：满足数据不离开私有网络的要求
3. **降低延迟**：直接通过 AWS 内部网络访问服务
4. **简化架构**：无需 NAT Gateway 即可访问 AWS 服务

#### 典型使用场景

- **私有子网访问 S3**：无需 NAT Gateway，直接访问 S3 存储桶
- **合规环境**：需要确保数据不经过公网的金融、医疗等场景
- **Lambda 访问 VPC 内资源**：Lambda 函数通过 VPC Endpoint 访问 AWS 服务
- **共享服务**：跨账户共享内部服务

### 4.3 怎么使用

#### Gateway Endpoint（S3/DynamoDB）

**通过控制台：**

1. 进入 VPC 控制台，选择「终端节点」
2. 点击「创建终端节点」
3. 选择服务类别：「AWS 服务」
4. 选择服务：`com.amazonaws.<region>.s3` 或 `com.amazonaws.<region>.dynamodb`
5. 选择 VPC
6. 配置路由表（选择需要访问 S3 的子网关联的路由表）
7. 点击「创建终端节点」

**通过 AWS CLI：**

```bash
# 创建 S3 Gateway Endpoint
aws ec2 create-vpc-endpoint \
    --vpc-id vpc-xxxxxxxx \
    --service-name com.amazonaws.us-east-1.s3 \
    --route-table-ids rtb-xxxxxxxx rtb-yyyyyyyy
```

**路由表自动添加的路由：**

| 目标 | 目标 |
|------|------|
| pl-xxxxxxxx (S3 前缀列表) | vpce-xxxxxxxx |

#### Interface Endpoint

**通过控制台：**

1. 进入 VPC 控制台，选择「终端节点」
2. 点击「创建终端节点」
3. 选择服务类别：「AWS 服务」
4. 选择服务（如 `com.amazonaws.<region>.ec2`）
5. 选择 VPC 和子网
6. 配置安全组
7. （可选）启用私有 DNS
8. 点击「创建终端节点」

**通过 AWS CLI：**

```bash
# 创建 Interface Endpoint
aws ec2 create-vpc-endpoint \
    --vpc-id vpc-xxxxxxxx \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.us-east-1.secrets-manager \
    --subnet-ids subnet-xxxxxxxx subnet-yyyyyyyy \
    --security-group-ids sg-xxxxxxxx
```

#### 私有 DNS 配置

启用私有 DNS 后，可以使用标准 AWS 服务域名（如 `s3.us-east-1.amazonaws.com`）直接访问终端节点，无需修改应用程序。

### 4.4 其他常用特性

#### Gateway Endpoint 特性

- **免费使用**：不产生额外费用
- **路由表集成**：通过前缀列表（Prefix List）配置路由
- **策略控制**：可通过终端节点策略限制访问

**终端节点策略示例：**

```json
{
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::my-bucket",
                "arn:aws:s3:::my-bucket/*"
            ]
        }
    ]
}
```

#### Interface Endpoint 特性

- **ENI 形式存在**：在子网中创建网络接口，分配私有 IP
- **安全组保护**：可通过安全组控制访问
- **私有 DNS**：支持私有 DNS 解析
- **IPv6 支持**：部分服务支持 IPv6（需满足条件）

#### IPv6 支持条件

Interface Endpoint 支持 IPv6 需满足：
- VPC 必须启用 IPv6
- 子网必须启用 IPv6
- 安全组必须允许 IPv6 流量
- 服务必须支持 IPv6

#### 常见支持的 AWS 服务

| 服务 | Gateway Endpoint | Interface Endpoint |
|------|------------------|-------------------|
| Amazon S3 | Yes | Yes |
| DynamoDB | Yes | No |
| EC2 | No | Yes |
| Secrets Manager | No | Yes |
| Systems Manager | No | Yes |
| CloudWatch | No | Yes |
| KMS | No | Yes |

---

## 五、架构示例

### 5.1 典型三层 Web 应用架构

```
                        ┌─────────────────┐
                        │   Internet      │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Internet Gateway│
                        └────────┬────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                            VPC                                  │
│  ┌─────────────────────────────┼─────────────────────────────┐  │
│  │                      Route Table (Public)                  │  │
│  │         0.0.0.0/0 → igw-xxx                                │  │
│  └─────────────────────────────┬─────────────────────────────┘  │
│                                │                                 │
│  ┌─────────────────────────────┼─────────────────────────────┐  │
│  │                     Public Subnet                          │  │
│  │  ┌──────────┐                                               │  │
│  │  │   ALB    │                                               │  │
│  │  └────┬─────┘                                               │  │
│  │       │                                                     │  │
│  │  ┌────▼─────┐     ┌──────────┐                              │  │
│  │  │  NAT GW  │◄────│  IGW     │                              │  │
│  │  └──────────┘     └──────────┘                              │  │
│  └─────────────────────────────┬─────────────────────────────┘  │
│                                │                                 │
│  ┌─────────────────────────────┼─────────────────────────────┐  │
│  │                     Route Table (Private)                  │  │
│  │         0.0.0.0/0 → nat-xxx                                │  │
│  └─────────────────────────────┬─────────────────────────────┘  │
│                                │                                 │
│  ┌─────────────────────────────┼─────────────────────────────┐  │
│  │                    Private Subnet                          │  │
│  │  ┌──────────┐    ┌──────────┐                              │  │
│  │  │   EC2    │    │   RDS    │◄──── VPC Endpoint (S3)       │  │
│  │  │ (App)    │────│   (DB)   │                              │  │
│  │  └──────────┘    └──────────┘                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 组件协同工作流程

1. **用户请求**：用户通过互联网访问应用
2. **Internet Gateway**：接收流量并路由到公有子网
3. **ALB**：负载均衡器分发请求到 EC2 实例
4. **EC2 (App)**：应用服务器处理请求
5. **NAT Gateway**：EC2 需要访问外网时通过 NAT 出去
6. **VPC Endpoint**：应用访问 S3 或其他 AWS 服务
7. **RDS**：数据库存储在私有子网，仅应用层可访问

---

## 六、最佳实践

### 6.1 VPC 规划

- 使用足够大的 CIDR 块（推荐 /16），为未来扩展预留空间
- 每个可用区规划独立的公有/私有子网对
- 预留子网用于未来的服务扩展

### 6.2 高可用设计

- 每个可用区部署独立的 NAT Gateway
- 跨多个可用区部署应用
- 使用 Route 53 进行健康检查和故障转移

### 6.3 安全建议

- 最小权限原则：安全组和网络 ACL 只开放必要端口
- 使用 VPC Endpoint 避免流量经过公网
- 启用 VPC Flow Logs 进行网络审计
- 使用 PrivateLink 共享服务而非 VPC Peering

### 6.4 成本优化

- 对于 S3/DynamoDB 访问优先使用免费的 Gateway Endpoint
- 评估是否真的需要 NAT Gateway（某些场景可用 VPC Endpoint 替代）
- 使用单一 NAT Gateway 的架构需要权衡成本和高可用

---

## 七、总结

| 组件 | 核心功能 | 典型场景 |
|------|----------|----------|
| **VPC** | 网络隔离边界 | 所有 AWS 资源部署的基础 |
| **Internet Gateway** | VPC 与互联网双向通信 | Web 服务、公网 API |
| **NAT Gateway** | 私有子网单向访问互联网 | 数据库更新、API 调用 |
| **VPC Endpoint** | 私有访问 AWS 服务 | 合规环境、安全访问 S3 |

理解这四个组件的工作原理和使用场景，是构建安全、可靠、高效的 AWS 网络架构的基础。

---

## 参考资料

- [Amazon VPC 官方文档](https://docs.aws.amazon.com/vpc/)
- [Internet Gateway 文档](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)
- [NAT Gateway 文档](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [VPC Endpoint 文档](https://docs.aws.amazon.com/vpc/latest/privatelink/)
