---
title: AWS 基础核心
date: 2026-03-15 16:00:00
categories:
- cloud
tags:
- aws
- cloud
---

# AWS 基础核心架构组件

本文档基于 AWS 典型架构图，详细介绍各个核心组件。

---

## VPC 中的三层网络架构

### VPC (Virtual Private Cloud)

VPC 是 AWS 云中的虚拟网络，用户可以在其中启动 AWS 资源。它提供了网络隔离和自定义网络拓扑的能力。

**核心特性：**
- 完全隔离的虚拟网络环境
- 可自定义 IP 地址范围（CIDR块）
- 支持公有子网和私有子网
- 可配置路由表、安全组和网络 ACL

---

### Internet Gateway (互联网网关)

Internet Gateway 是一种 horizontally scaled、冗余且高度可用的 VPC 组件，允许 VPC 中的实例与 Internet 之间进行通信。

**核心特性：**
- 支持 IPv4 和 IPv6 流量
- 提供网络地址转换 (NAT) 功能
- 自动实现高可用性
- 无带宽限制

---

### Public Subnet (公有子网)

公有子网是可以直接访问 Internet 的子网，通常用于放置需要对外提供服务的资源。

**核心特性：**
- 通过 Internet Gateway 连接 Internet
- 资源具有公网 IP 地址
- 适合 Web 服务器、负载均衡器
- 路由表配置指向 IGW

---

### Private Subnet (App) (私有子网 - 应用层)

私有子网用于放置应用程序服务器，无法直接从 Internet 访问，提供更高的安全性。

**核心特性：**
- 无公网 IP，仅私有 IP
- 通过 NAT Gateway 访问 Internet
- 接收来自负载均衡器的流量
- 适合业务逻辑处理

---

### Private Subnet (DB) (私有子网 - 数据库层)

数据库层私有子网用于放置数据库实例，是架构中最内层的安全区域。

**核心特性：**
- 最高级别的网络隔离
- 仅允许来自应用层的连接
- 支持跨 AZ 部署实现高可用
- 与 RDS Multi-AZ 配合使用

---


## 服务部署

### EC2 (Elastic Compute Cloud)

Amazon EC2 是 AWS 云中提供**按需弹性计算能力**的核心服务，让你可以在云端轻松创建和管理虚拟服务器。

#### 是什么

**EC2 实例**是运行在 AWS 云端的虚拟服务器。当你启动一个实例时，指定的实例类型决定了该实例可用的硬件资源（CPU、内存、存储和网络）。

**核心概念：**
- **AMI（Amazon Machine Image）**：预配置的镜像模板，包含操作系统和软件
- **实例类型**：提供不同的 CPU、内存、存储和网络能力的组合
- **安全组**：虚拟防火墙，控制入站/出站流量
- **密钥对**：安全登录凭证

#### 有什么用及使用场景

| 场景 | 推荐实例系列 |
|------|-------------|
| 通用 Web 应用 | M 系列（通用型）、T 系列（突发性能型）|
| 高性能计算 | C 系列（计算优化型）|
| 内存数据库、大数据分析 | R 系列、X 系列（内存优化型）|
| 机器学习训练 | P 系列、Trn 系列（GPU/Accelerated）|
| iOS/macOS 开发 | Mac 实例 |

#### 怎么使用

**启动实例步骤：**

1. 登录 AWS 管理控制台，进入 EC2 服务
2. 点击"启动实例"
3. 配置实例：
   - 选择 AMI（如 Amazon Linux、Ubuntu、Windows）
   - 选择实例类型（如 t3.micro 适用于免费套餐）
   - 创建或选择 SSH 密钥对
   - 配置 VPC、子网、安全组
   - 配置存储
4. 点击"启动实例"

**连接实例（Linux）：**
```bash
chmod 400 your-key-pair.pem
ssh -i your-key-pair.pem ec2-user@your-instance-public-dns
```

#### 其他常用特性

| 购买选项 | 特点 | 适用场景 |
|---------|------|---------|
| **按需实例** | 按秒计费，无长期承诺 | 开发测试、不规则负载 |
| **Savings Plans** | 承诺使用量换取折扣 | 稳定工作负载 |
| **预留实例** | 预留特定配置获得折扣 | 长期稳定应用 |
| **Spot 实例** | 使用空闲容量，最高 90% 折扣 | 可中断任务、批处理 |

**高级特性：**
- **Auto Scaling**：自动调整实例数量
- **Elastic Load Balancing**：自动分发流量
- **增强联网（ENA）**：提供高网络性能
- **Nitro 系统**：AWS 自研轻量级虚拟化技术，提升性能

### Bastion Host (堡垒机)

Bastion Host 是一个安全入口点，用于安全地访问私有子网中的实例。

**核心特性：**
- SSH/RDP 访问的跳板机
- 严格的访问控制
- 安全组限制源 IP
- 审计和日志记录

### Elastic Load Balancer (ELB)

ELB 是一项**完全托管**的负载均衡服务，自动将传入的应用程序流量分发到多个目标，确保高可用性和容错能力。

#### 是什么

ELB 可以自动将流量分发到多个目标（如 EC2 实例、容器、IP 地址、Lambda 函数），跨多个可用区分发流量，监控目标健康状况，并自动扩展以处理变化的流量负载。

**负载均衡器类型：**

| 类型 | 缩写 | OSI 层级 | 主要用途 |
|------|------|----------|----------|
| **Application Load Balancer** | ALB | Layer 7 | HTTP/HTTPS 流量,智能路由 |
| **Network Load Balancer** | NLB | Layer 4 | TCP/UDP 流量,超高性能 |
| **Gateway Load Balancer** | GWLB | Layer 3 + Layer 4 | 网络虚拟设备,安全设备 |

#### 有什么用及使用场景

| 类型 | 适用场景 |
|------|----------|
| **ALB** | 微服务架构、容器化应用、Web 应用、API 网关、蓝绿部署 |
| **NLB** | 游戏服务器、流媒体、IoT 应用、需要静态 IP、超高性能要求 |
| **GWLB** | 防火墙、IDS/IPS、深度包检测、第三方安全设备 |

#### 怎么使用

**基本步骤：**

```bash
# 1. 创建负载均衡器
aws elbv2 create-load-balancer \
    --name my-application-lb \
    --subnets subnet-123456 subnet-789012 \
    --security-groups sg-123456 \
    --type application

# 2. 创建目标组
aws elbv2 create-target-group \
    --name my-targets \
    --protocol HTTP \
    --port 80 \
    --target-type instance \
    --vpc-id vpc-123456

# 3. 注册目标
aws elbv2 register-targets \
    --target-group-arn arn:aws:... \
    --targets Id=i-1234567890abcdef0

# 4. 创建监听器
aws elbv2 create-listener \
    --load-balancer-arn arn:aws:... \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=arn:aws:... \
    --default-actions Type=forward,TargetGroupArn=arn:aws:...
```

#### 其他常用特性

| 特性 | 说明 |
|------|------|
| **健康检查** | 监控目标健康状况，自动路由到健康目标 |
| **SSL/TLS 终止** | 支持 SSL/TLS 卸载，减轻后端负担 |
| **会话粘性** | 确保同一客户端请求路由到同一目标 |
| **跨区域负载均衡** | 跨可用区分发流量 |
| **访问日志** | 详细请求信息存储到 S3 |
| **WAF 集成** | 与 AWS WAF 配合保护 Web 应用 |

---


### Auto Scaling Group (自动伸缩组)

Auto Scaling Group 是一组 EC2 实例的逻辑集合，自动调整实例数量以应对负载变化，确保应用可用性。

#### 是什么

**Auto Scaling Group (ASG)** 是 AWS 提供的服务，确保应用程序拥有正确数量的 EC2 实例来处理负载。

**核心概念：**
- **启动模板**：定义实例配置（AMI、实例类型、安全组等）
- **容量设置**：
  - 最小容量：始终保持的最少实例数
  - 最大容量：允许的最大实例数
  - 期望容量：希望维持的实例数

#### 有什么用及使用场景

**主要用途：**
1. **自动维护实例数量**：确保始终有指定数量的健康实例
2. **弹性伸缩**：根据需求自动增加或减少实例
3. **成本优化**：低负载时减少实例，高负载时增加实例
4. **高可用性**：跨多个可用区分布实例

**典型场景：**
- Web 应用程序处理流量波动
- 微服务架构独立伸缩
- 定时任务（如促销活动期间）
- 结合 Spot 实例降低成本

#### 怎么使用

```bash
# 1. 创建启动模板
aws ec2 create-launch-template \
    --launch-template-name my-launch-template \
    --launch-template-data file://launch-template.json

# 2. 创建 Auto Scaling Group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name my-asg \
    --launch-template LaunchTemplateId=lt-1234567890abcdef0,Version=1 \
    --min-size 1 \
    --max-size 5 \
    --desired-capacity 2 \
    --vpc-zone-identifier "subnet-12345678,subnet-87654321"
```

#### 其他常用特性

**伸缩策略：**

| 策略类型 | 说明 |
|---------|------|
| **目标跟踪** | 保持指标接近目标值（推荐） |
| **步进伸缩** | 根据警报阈值违规程度预定义增量伸缩 |
| **计划伸缩** | 在特定时间自动调整组大小 |
| **预测性伸缩** | 基于历史数据预测未来负载 |

**健康检查：**
- **EC2 状态检查**（默认）：监控硬件和软件问题
- **ELB 健康检查**：检查实例是否能正常响应

**生命周期钩子：**
- 在实例启动或终止时执行自定义操作
- 如安装软件、清理资源

---


## 存储

### Amazon RDS (关系数据库服务)

RDS 是 AWS 提供的**完全托管式关系型数据库服务**，让用户能够在 AWS 云端轻松设置、运行和扩展关系型数据库。

#### 是什么

**DB 实例**是 AWS 云中的隔离数据库环境，是 Amazon RDS 的基本构建块。一个 DB 实例可以包含一个或多个用户创建的数据库。

**支持的数据库引擎：**
- MySQL、PostgreSQL、MariaDB
- Microsoft SQL Server、Oracle Database、IBM Db2

**相比自建数据库的优势：**

| 特性 | EC2 管理 | RDS 管理 |
|------|----------|----------|
| 数据库备份 | 客户负责 | AWS 负责 |
| 数据库软件补丁 | 客户负责 | AWS 负责 |
| 高可用性 | 客户负责 | AWS 负责 |
| 扩展 | 客户负责 | AWS 负责 |

#### 有什么用及使用场景

**主要用途：**
- **Web/移动应用后端**：动态网站内容存储、用户会话管理
- **企业应用系统**：ERP、CRM、电商系统
- **数据分析**：配合只读副本进行数据分析
- **开发测试环境**：快速创建开发/测试数据库

#### 怎么使用

```bash
# 创建数据库实例
aws rds create-db-instance \
    --db-instance-identifier mydb \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --master-username admin \
    --master-user-password MyPassword123 \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-12345678

# 连接数据库（MySQL）
mysql -h mydb.xxxxx.us-east-1.rds.amazonaws.com \
      -P 3306 \
      -u admin \
      -p
```

#### 其他常用特性

**Multi-AZ 部署（高可用）：**
- 一个主实例 + 一个备用实例（不同可用区）
- 同步复制，故障时自动切换（通常 35 秒内）

**只读副本（Read Replicas）：**
- 将读取流量分流到副本，减轻主实例压力
- 支持跨区域灾难恢复
- 最多支持 5 个只读副本

**备份与恢复：**
| 特性 | 自动备份 | 手动快照 |
|------|----------|----------|
| 执行方式 | 自动执行 | 用户主动创建 |
| 保留期 | 1-35 天 | 永久保留 |
| 时间点恢复 | 支持 | 不支持 |

**安全性：**
- VPC 部署在私有子网
- 安全组控制访问
- 静态加密（KMS）和传输加密（SSL/TLS）

### Amazon S3 (简单存储服务)

S3 是 AWS 提供的**对象存储服务**，提供业界领先的可扩展性、数据可用性、安全性和性能。

#### 是什么

S3 专为存储和检索任意数量的数据而设计，数据量可以从几个字节到数 TB 不等。

**核心特点：**
- **极高的持久性**：99.999999999% (11 个 9) 的数据持久性
- **无限存储容量**：可以存储任意数量的对象，每个对象最大可达 5 TB
- **强一致性**：为所有区域的 PUT 和 DELETE 请求提供强读后写一致性
- **高可用性**：数据默认跨至少 3 个可用区冗余存储

**基本概念：**
- **Bucket（存储桶）**：存储对象的容器，名称全局唯一
- **Object（对象）**：存储在 S3 中的基本实体，由数据和元数据组成
- **Key（键）**：对象在 Bucket 中的唯一标识符

#### 有什么用及使用场景

**主要用途：**
1. **数据湖**：存储原始数据，用于大数据分析和机器学习
2. **静态网站托管**：托管静态网站和 Web 应用前端
3. **备份与恢复**：企业数据备份、灾难恢复
4. **数据归档**：长期数据保留、合规存储
5. **应用程序存储**：移动应用和 Web 应用的后端存储

**典型场景：**
- 静态网站托管（配合 CloudFront）
- 数据湖（配合 Athena、EMR）
- 备份归档（使用生命周期策略）

#### 怎么使用

```bash
# 创建 bucket
aws s3 mb s3://my-unique-bucket-name --region us-east-1

# 上传文件
aws s3 cp myfile.txt s3://my-bucket/

# 同步目录
aws s3 sync ./local-folder s3://my-bucket/remote-folder/

# 下载文件
aws s3 cp s3://my-bucket/myfile.txt ./
```

**Python (Boto3) 示例：**
```python
import boto3
s3 = boto3.client('s3')

# 上传文件
s3.upload_file('local-file.txt', 'my-bucket', 'remote-file.txt')

# 下载文件
s3.download_file('my-bucket', 'remote-file.txt', 'local-file.txt')
```

#### 其他常用特性

**存储类别：**

| 存储类别 | 访问频率 | 延迟 | 适用场景 |
|---------|---------|------|----------|
| S3 Standard | 频繁 | 毫秒 | 动态网站、内容分发 |
| S3 Intelligent-Tiering | 变化 | 毫秒 | 数据湖、新应用 |
| S3 Standard-IA | 不频繁 | 毫秒 | 备份、灾难恢复 |
| S3 Glacier Instant Retrieval | 极少 | 毫秒 | 归档数据 |
| S3 Glacier Deep Archive | 长期归档 | 12-48小时 | 合规归档 |

**生命周期策略：**
```json
{
  "Rules": [{
    "ID": "MoveToGlacier",
    "Status": "Enabled",
    "Transitions": [
      { "Days": 30, "StorageClass": "STANDARD_IA" },
      { "Days": 90, "StorageClass": "GLACIER" }
    ]
  }]
}
```

**其他重要特性：**
- **版本控制**：保留多个版本，防止意外删除
- **静态网站托管**：直接托管静态网站
- **S3 Replication**：跨区域/同区域复制
- **S3 Select**：使用 SQL 查询对象内容

## 网络

### VPC Endpoint (VPC 终端节点)

VPC Endpoint 允许你私有地连接 VPC 到 AWS 服务，而无需通过互联网网关、NAT 设备或 VPN 连接。

#### 是什么

VPC Endpoint 基于 **AWS PrivateLink** 技术，确保流量不暴露在公共互联网上。

**两种类型：**

| 类型 | 描述 | 支持的服务 | 费用 |
|------|------|------------|------|
| **Gateway Endpoint** | 以路由表目标形式存在 | Amazon S3, DynamoDB | 免费 |
| **Interface Endpoint** | 以弹性网络接口 (ENI) 形式存在 | 大多数 AWS 服务 | 按小时+数据处理收费 |

#### 有什么用及使用场景

**主要用途：**
1. **安全访问**：不经过公网访问 AWS 服务
2. **合规要求**：满足数据不离开私有网络的要求
3. **降低延迟**：直接通过 AWS 内部网络访问服务
4. **简化架构**：无需 NAT Gateway 即可访问 AWS 服务

**典型使用场景：**
- 私有子网访问 S3 存储桶
- 合规环境（金融、医疗）
- Lambda 访问 VPC 内资源
- 共享服务（跨账户）

#### 怎么使用

**Gateway Endpoint（S3/DynamoDB）：**
```bash
# 创建 S3 Gateway Endpoint
aws ec2 create-vpc-endpoint \
    --vpc-id vpc-xxxxxxxx \
    --service-name com.amazonaws.us-east-1.s3 \
    --route-table-ids rtb-xxxxxxxx
```

**Interface Endpoint：**
```bash
# 创建 Interface Endpoint
aws ec2 create-vpc-endpoint \
    --vpc-id vpc-xxxxxxxx \
    --vpc-endpoint-type Interface \
    --service-name com.amazonaws.us-east-1.secrets-manager \
    --subnet-ids subnet-xxxxxxxx \
    --security-group-ids sg-xxxxxxxx
```

#### 其他常用特性

- **终端节点策略**：限制访问特定资源
- **私有 DNS**：启用后使用标准 AWS 服务域名
- **IPv6 支持**：部分服务支持

### NAT Gateway (网络地址转换网关)

NAT Gateway 是一种**完全托管**的网络地址转换服务，允许私有子网中的实例访问互联网，同时阻止互联网发起的入站连接。

#### 是什么

NAT Gateway 提供从私有子网到互联网的单向出站访问，保护内部资源不被公网直接访问。

**两种类型：**

| 类型 | 描述 | 使用场景 |
|------|------|----------|
| **Public NAT Gateway** | 分配弹性 IP，通过 IGW 访问互联网 | 私有子网访问公网 |
| **Private NAT Gateway** | 通过 Transit Gateway 或 VPN 路由 | 与本地数据中心通信 |

**核心特点：**
- **完全托管**：AWS 负责高可用、冗余和扩展
- **自动扩展**：带宽最高可达 100 Gbps
- **高性能**：支持最高 1000 万数据包/秒

#### 有什么用及使用场景

**主要用途：**
1. **安全出站访问**：私有子网资源下载更新、访问外部 API
2. **保护内部资源**：确保私有资源无法从互联网直接访问
3. **统一出口**：所有出站流量通过固定的公网 IP

**典型使用场景：**
- 数据库补丁下载
- 后端服务调用第三方 API
- 软件包下载
- 日志上传到外部服务

#### 怎么使用

**创建 NAT Gateway：**
```bash
# 1. 分配弹性 IP
aws ec2 allocate-address --domain vpc

# 2. 创建 NAT Gateway（必须在公有子网）
aws ec2 create-nat-gateway \
    --subnet-id subnet-xxxxxxxx \
    --allocation-id eipalloc-xxxxxxxx \
    --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=MyNAT}]'
```

**配置私有子网路由表：**

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

#### 其他常用特性

| 特性 | 说明 |
|------|------|
| **性能规格** | 最高 100 Gbps 带宽，1000 万 PPS |
| **NAT64/DNS64** | 支持 IPv6 客户端与 IPv4 服务器通信 |
| **高可用架构** | 每个可用区部署独立的 NAT Gateway |

**费用说明：**
- 按小时计费 + 数据处理费
- 跨 AZ 数据传输额外收费

## Security

### Security Identity & Compliance (安全、身份与合规)

AWS 提供全面的安全、身份管理和合规服务套件，帮助你保护数据、系统和资产。

#### IAM (Identity and Access Management)

**是什么：**

AWS IAM 是一项 Web 服务，帮助你安全地控制对 AWS 资源的访问。它控制谁被认证（登录）以及谁被授权（拥有权限）使用资源。

**核心概念：**
- **用户（User）**：与人员或应用程序关联的身份
- **用户组（Group）**：用户的集合
- **角色（Role）**：临时凭证，用于跨账户访问或服务访问
- **策略（Policy）**：定义权限的 JSON 文档

**有什么用：**
- 管理用户和权限
- 实现**最小权限原则**
- 跨账户访问管理
- 为 EC2 实例提供临时凭证

**怎么使用：**
```bash
# 创建用户
aws iam create-user --user-name DevUser

# 创建用户组并附加策略
aws iam create-group --group-name Developers
aws iam attach-group-policy \
    --group-name Developers \
    --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
aws iam add-user-to-group --user-name DevUser --group-name Developers

# 创建角色用于 EC2
aws iam create-role \
    --role-name EC2S3AccessRole \
    --assume-role-policy-document file://trust-policy.json
```

**常用特性：**
| 特性 | 说明 |
|------|------|
| **MFA** | 多因素认证，增强安全性 |
| **Access Analyzer** | 识别账户外部对资源的访问 |
| **权限边界** | 设置 IAM 实体的最大权限限制 |

---

#### AWS Organizations

**是什么：**

AWS Organizations 帮助你集中管理和治理多个 AWS 账户，可以程序化地创建账户、将账户分组、应用策略进行治理。

**有什么用：**
- 集中账户管理
- 分层组织结构（组织单位 OU）
- 统一账单
- 策略治理（服务控制策略 SCP）

**怎么使用：**
```bash
# 创建组织
aws organizations create-organization

# 创建组织单位
aws organizations create-organizational-unit \
    --parent-id r-xxxx \
    --name "Production"

# 邀请账户
aws organizations invite-account-to-organization \
    --target '{"Type": "EMAIL", "Id": "account@example.com"}'
```

---

#### AWS Shield

**是什么：**

AWS Shield 提供 DDoS（分布式拒绝服务）攻击保护服务。

**两个层级：**

| 版本 | 功能 | 费用 |
|------|------|------|
| **Shield Standard** | 基础 DDoS 防护（Layer 3/4） | 免费 |
| **Shield Advanced** | 增强防护 + 24/7 响应团队 | 付费 |

**检测的攻击类型：**
- 网络容量攻击（Layer 3）
- 网络协议攻击（Layer 4）
- 应用层攻击（Layer 7）

---

#### AWS WAF (Web Application Firewall)

**是什么：**

AWS WAF 是一个 Web 应用程序防火墙，监控和管理转发到受保护资源的 HTTP/HTTPS 请求。

**有什么用：**
- SQL 注入防护
- XSS（跨站脚本）防护
- 地理限制
- IP 地址过滤
- 速率限制

**可保护的资源：**
- CloudFront 分配
- Application Load Balancer
- API Gateway REST API
- AWS AppSync GraphQL API

**怎么使用：**
```bash
# 创建 IP Set
aws wafv2 create-ip-set \
    --name "BlockedIPs" \
    --scope REGIONAL \
    --ip-addresses "192.0.2.0/24"

# 创建 Web ACL
aws wafv2 create-web-acl \
    --name "MyWebACL" \
    --scope REGIONAL \
    --default-action Allow={}
```

**常用特性：**
| 特性 | 说明 |
|------|------|
| **AWS 托管规则** | 预配置的规则组 |
| **Bot Control** | 检测和管理机器人流量 |
| **CAPTCHA** | 对可疑请求实施验证 |

## 其他常用服务

### Amazon CloudFront (内容分发网络)

CloudFront 是 AWS 提供的**全球内容分发网络 (CDN)** 服务，旨在低延迟地向全球用户分发静态和动态 Web 内容。

#### 是什么

**CloudFront** 通过全球分布的边缘站点（Edge Locations）缓存和分发内容，让用户从最近的节点获取数据。

**核心概念：**
- **边缘站点（Edge Location）**：位于全球各地的数据中心，用于缓存和分发内容
- **源服务器（Origin）**：存储原始内容的服务器（S3、ELB、EC2 或自定义服务器）
- **分配（Distribution）**：CloudFront 的配置单元

**全球基础设施：**
- **600+** 个边缘站点（Points of Presence）
- **100+** 座城市
- **50+** 个国家

#### 有什么用及使用场景

**主要用途：**
1. **加速静态内容分发**：图片、CSS、JavaScript、HTML
2. **动态内容加速**：API 响应、动态网页
3. **视频流媒体**：点播视频 (VOD) 和实时直播
4. **安全防护**：DDoS 防护、Web 应用防火墙

**典型使用场景：**

| 场景 | 描述 |
|------|------|
| **静态网站托管** | 配合 S3 托管静态网站 |
| **视频点播/直播** | 支持 MPEG DASH、Apple HLS |
| **API 加速** | 加速 REST/GraphQL API 响应 |
| **软件分发** | 软件安装包、游戏更新包 |

#### 怎么使用

**创建 CloudFront 分配：**
```bash
# 创建分配
aws cloudfront create-distribution \
    --origin-domain-name my-bucket.s3.amazonaws.com \
    --default-cache-behavior AllowedMethods=GET,HEAD,ViewerProtocolPolicy=redirect-to-https

# 使用自定义域名
# 需要在 us-east-1 区域创建 ACM 证书
```

**基本配置步骤：**
1. 准备源服务器（S3 存储桶或自定义源）
2. 创建 CloudFront 分配
3. 配置缓存行为（TTL、允许的方法等）
4. 配置域名和 SSL 证书（通过 ACM）
5. 使用 CloudFront 域名或自定义域名访问内容

#### 其他常用特性

**Lambda@Edge 和 CloudFront Functions：**

| 特性 | CloudFront Functions | Lambda@Edge |
|------|---------------------|-------------|
| 执行时间 | 亚毫秒级 | 5-30 秒 |
| 适用场景 | URL/Header 操作 | 复杂逻辑、加密操作 |
| 成本 | 更低 | 较高 |

**触发点：**
- Viewer Request：接收用户请求后
- Origin Request：转发到源服务器前
- Origin Response：收到源服务器响应后
- Viewer Response：返回用户响应前

**安全特性：**
| 特性 | 说明 |
|------|------|
| **AWS WAF 集成** | SQL 注入、XSS 防护、地理限制 |
| **AWS Shield** | DDoS 防护（Standard 免费） |
| **SSL/TLS** | 端到端加密，支持自定义证书 |
| **签名 URL/Cookie** | 私有内容访问控制 |
| **源访问控制 (OAC)** | 限制只有 CloudFront 可访问 S3 |
