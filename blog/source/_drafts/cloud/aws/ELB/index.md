---
title: AWS Elastic Load Balancer (ELB) 全面指南
date: 2026-03-18 16:00:00
categories:
- cloud
tags:
- aws
- cloud
- load-balancer
- networking
---

Amazon Elastic Load Balancer (ELB) 是 AWS 提供的完全托管的负载均衡服务,能够自动将传入的应用程序流量分发到多个目标和虚拟设备,确保高可用性和容错能力。本文将详细介绍 ELB 的核心概念、使用场景和最佳实践。

<!--more-->

## 一、什么是 Elastic Load Balancer (ELB)?

### 定义

Elastic Load Balancing (ELB) 是一项**完全托管**的负载均衡服务,它可以:

- 自动将传入的应用程序流量分发到多个目标(如 EC2 实例、容器、IP 地址、Lambda 函数)
- 跨多个可用区(Availability Zones)分发流量
- 监控已注册目标的健康状况,仅将流量路由到健康的目标
- 自动扩展以处理不断变化的流量负载

### 核心价值

| 价值 | 说明 |
|------|------|
| **高可用性** | 自动检测不健康的目标,并将流量路由到健康的目标 |
| **自动扩展** | 根据流量自动扩展负载均衡容量,无需预配置 |
| **安全性** | 集成 VPC 安全功能,支持 SSL/TLS 终止 |
| **弹性** | 与 Auto Scaling 无缝集成,应对流量波动 |
| **可观测性** | 集成 CloudWatch 和访问日志,提供详细监控 |

### 负载均衡器类型

ELB 提供四种类型的负载均衡器:

| 类型 | 缩写 | OSI 层级 | 主要用途 |
|------|------|----------|----------|
| **Application Load Balancer** | ALB | Layer 7 (应用层) | HTTP/HTTPS 流量,智能路由 |
| **Network Load Balancer** | NLB | Layer 4 (传输层) | TCP/UDP 流量,超高性能 |
| **Gateway Load Balancer** | GWLB | Layer 3 + Layer 4 | 网络虚拟设备,安全设备 |
| **Classic Load Balancer** | CLB | Layer 4/7 | 传统应用 (已不推荐) |

> **注意**: Classic Load Balancer (CLB) 是第一代负载均衡器,主要用于 EC2-Classic 网络。AWS 建议新应用使用 ALB、NLB 或 GWLB。

---

## 二、负载均衡器类型详解与使用场景

### 1. Application Load Balancer (ALB)

#### 工作原理

ALB 工作在 **OSI 模型的第七层(应用层)**,能够理解 HTTP/HTTPS 协议,并基于请求内容进行智能路由。

```
┌─────────────────────────────────────────────────────────┐
│            Application Load Balancer (L7)              │
│                                                         │
│  ┌──────────────┐                                       │
│  │   Listener   │  HTTP/HTTPS/gRPC                     │
│  │   Port 443   │                                       │
│  └──────┬───────┘                                       │
│         │                                               │
│  ┌──────▼───────┐     ┌──────────────┐                 │
│  │  Rule: /api  │────▶│ Target Group │──▶ EC2/Lambda  │
│  └──────────────┘     │   (API)      │                 │
│  ┌──────────────┐     └──────────────┘                 │
│  │  Rule: /web  │────▶ Target Group (Web)             │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

#### 核心特性

| 特性 | 说明 |
|------|------|
| **内容路由** | 基于路径、主机名、HTTP Header、查询字符串等路由 |
| **主机路由** | 支持基于域名的虚拟主机 |
| **路径路由** | 如 `/api/*` 路由到 API 服务,`/static/*` 路由到静态资源 |
| **方法路由** | 基于 HTTP 方法(GET、POST、PUT 等)路由 |
| **Header 路由** | 基于自定义 HTTP Header 路由 |
| **Lambda 集成** | 直接将请求路由到 Lambda 函数 |
| **用户认证** | 集成 Cognito、OIDC 进行身份认证 |
| **WebSocket** | 原生支持 WebSocket 连接 |
| **HTTP/2** | 支持 HTTP/2 协议 |
| **SSL 终止** | 支持 SSL/TLS 卸载 |

#### 适用场景

- **微服务架构**: 基于路径和 Header 的智能路由
- **容器化应用**: 与 ECS/EKS 无缝集成,支持动态端口
- **Web 应用**: HTTP/HTTPS 流量分发
- **API 网关**: API 请求路由和负载均衡
- **蓝绿部署**: 加权目标组实现流量分流
- **多租户应用**: 基于主机名隔离不同租户

#### 典型架构示例

```
用户请求
   │
   ▼
┌──────────────────────────────────┐
│  Application Load Balancer       │
│  - Listener: HTTPS:443           │
│  - 路由规则:                      │
│    /api/*    → API Service       │
│    /app/*    → Web App           │
│    /static/* → S3/CloudFront     │
└──────────────────────────────────┘
         │
    ┌────┼────┬────────┐
    ▼    ▼    ▼        ▼
  API   Web  Static  Lambda
  服务  服务  资源    函数
```

---

### 2. Network Load Balancer (NLB)

#### 工作原理

NLB 工作在 **OSI 模型的第四层(传输层)**,基于 IP 协议数据(TCP/UDP/TLS)进行路由,提供超高性能和极低延迟。

```
┌─────────────────────────────────────────────────────────┐
│              Network Load Balancer (L4)                 │
│                                                         │
│  ┌──────────────┐                                       │
│  │   Listener   │  TCP/UDP/TLS                         │
│  │   Port 443   │                                       │
│  └──────┬───────┘                                       │
│         │ Flow Hash Algorithm                          │
│         │                                               │
│    ┌────┼────┬────────┐                                │
│    ▼    ▼    ▼        ▼                                │
│  Target Target Target Target                           │
│  (AZ-a) (AZ-b) (AZ-c) (AZ-d)                          │
└─────────────────────────────────────────────────────────┘
```

#### 核心特性

| 特性 | 说明 |
|------|------|
| **超高性能** | 支持每秒数百万请求,极低延迟 |
| **静态 IP** | 每个可用区提供一个静态 IP 地址 |
| **Elastic IP** | 支持为每个可用区分配固定的 Elastic IP |
| **TCP/UDP** | 支持 TCP、UDP、TLS 协议 |
| **源 IP 保留** | 后端可以看到客户端真实 IP |
| **长连接** | 支持长期 TCP 连接 |
| **Zonal DNS** | DNS 响应可以返回特定可用区的 IP |
| **PrivateLink** | 支持 AWS PrivateLink 服务 |

#### 适用场景

- **高性能游戏**: 低延迟、高吞吐量的游戏服务器
- **实时通信**: WebSocket、gRPC、即时通讯
- **流媒体**: 视频流、音频流分发
- **IoT 应用**: 大量设备连接,MQTT 协议
- **数据库负载均衡**: 多个数据库副本的负载均衡
- **需要静态 IP**: 防火墙白名单、DNS 记录固定
- **非 HTTP 协议**: TCP/UDP 应用(如 SMTP、DNS、LDAP)

#### 典型架构示例

```
全球用户
   │
   ▼
┌──────────────────────────────────┐
│  Network Load Balancer           │
│  - Listener: TCP:1935            │
│  - 静态 IP:                       │
│    AZ-a: 52.10.10.1              │
│    AZ-b: 52.10.10.2              │
│  - Flow Hash 路由                 │
└──────────────────────────────────┘
         │
    ┌────┼────┬────────┐
    ▼    ▼    ▼        ▼
 流媒体 流媒体 流媒体 流媒体
 服务器 服务器 服务器 服务器
 (AZ-a) (AZ-b) (AZ-c) (AZ-d)
```

---

### 3. Gateway Load Balancer (GWLB)

#### 工作原理

GWLB 工作在 **OSI 模型的第三层(网络层)**,结合了**透明网络网关**和**负载均衡器**的功能,用于部署、扩展和管理第三方网络虚拟设备。

```
┌─────────────────────────────────────────────────────────┐
│            Gateway Load Balancer (L3 + L4)              │
│                                                         │
│  ┌──────────────────┐                                   │
│  │  Route Table     │                                   │
│  │  0.0.0.0/0 → GWLB│                                   │
│  └────────┬─────────┘                                   │
│           │                                             │
│           ▼                                             │
│  ┌──────────────────┐                                   │
│  │ Gateway Endpoint │                                   │
│  └────────┬─────────┘                                   │
│           │                                             │
│    ┌──────┼──────┬──────────┐                          │
│    ▼      ▼      ▼          ▼                          │
│ Firewall IDS/IPS DPI   Packet Inspector                │
│ 设备-A  设备-B 设备-C   设备-D                          │
└─────────────────────────────────────────────────────────┘
```

#### 核心特性

| 特性 | 说明 |
|------|------|
| **透明网关** | 充当所有流量的单一入口和出口点 |
| **GENEVE 封装** | 使用 GENEVE 协议封装流量 |
| **跨 VPC** | 支持跨 VPC 边界的流量交换 |
| **可扩展性** | 根据需求自动扩展虚拟设备 |
| **第三方设备** | 支持 Firewall、IDS/IPS、DPI 等设备 |
| **健康检查** | 监控虚拟设备的健康状况 |
| **流量镜像** | 可用于流量分析和安全检查 |

#### 适用场景

- **防火墙**: Palo Alto、Fortinet、Check Point 等防火墙设备
- **入侵检测/防御**: IDS/IPS 系统
- **深度包检测**: DPI (Deep Packet Inspection)
- **流量分析**: 网络流量分析和监控
- **安全设备**: 第三方安全虚拟设备的负载均衡
- **混合云**: 云和本地环境之间的流量管理

#### 典型架构示例

```
Internet 流量
   │
   ▼
┌──────────────────────────────────┐
│  Internet Gateway                │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  Gateway Load Balancer           │
│  - 所有流量经过安全设备检查        │
│  - 自动扩展安全设备实例            │
└────────────┬─────────────────────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
 Firewall Firewall Firewall
  集群-A   集群-B   集群-C
             │
             ▼
┌──────────────────────────────────┐
│  应用 VPC (私有子网)              │
│  - EC2 实例                      │
│  - RDS 数据库                    │
└──────────────────────────────────┘
```

---

### 4. 负载均衡器类型对比

| 特性 | ALB | NLB | GWLB | CLB |
|------|-----|-----|------|-----|
| **OSI 层级** | Layer 7 | Layer 4 | Layer 3 + Layer 4 | Layer 4/7 |
| **协议支持** | HTTP, HTTPS, gRPC | TCP, UDP, TLS | IP (GENEVE) | TCP, SSL, HTTP |
| **路由方式** | 内容路由 | IP + 端口 | 路由表 | IP + 端口 |
| **目标类型** | Instance, IP, Lambda | Instance, IP, ALB | Instance, IP | Instance |
| **静态 IP** | 否 | 是 | 否 | 否 |
| **SSL 终止** | 是 | 是 | 否 | 是 |
| **WebSocket** | 是 | 是 | - | 否 |
| **HTTP/2** | 是 | 否 | - | 否 |
| **用户认证** | 是 | 否 | - | 否 |
| **健康检查** | HTTP, HTTPS, gRPC | TCP, HTTP, HTTPS | TCP, HTTP, HTTPS | TCP, HTTP |
| **路由算法** | Round Robin | Flow Hash | Routing Table | Round Robin |
| **性能** | 高 | 极高 | 高 | 中 |
| **延迟** | 低 | 极低 | 低 | 中 |
| **典型场景** | Web 应用, 微服务 | 游戏, 流媒体, IoT | 安全设备 | 传统应用 |

---

## 三、如何使用 Elastic Load Balancer

### 基本使用步骤

#### 步骤 1: 创建负载均衡器

**通过 AWS 控制台:**

1. 登录 AWS 控制台,导航到 **EC2** 服务
2. 在左侧菜单选择 **Load Balancers**
3. 点击 **Create Load Balancer**
4. 选择负载均衡器类型 (ALB/NLB/GWLB)

**通过 AWS CLI:**

```bash
# 创建 ALB
aws elbv2 create-load-balancer \
    --name my-application-lb \
    --subnets subnet-123456 subnet-789012 \
    --security-groups sg-123456 \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4

# 创建 NLB
aws elbv2 create-load-balancer \
    --name my-network-lb \
    --subnets subnet-123456 subnet-789012 \
    --type network
```

#### 步骤 2: 创建目标组

目标组是负载均衡器将请求路由到的目标集合。

```bash
# 创建目标组 (EC2 实例)
aws elbv2 create-target-group \
    --name my-targets \
    --protocol HTTP \
    --port 80 \
    --target-type instance \
    --vpc-id vpc-123456

# 创建目标组 (IP 地址)
aws elbv2 create-target-group \
    --name my-ip-targets \
    --protocol TCP \
    --port 8080 \
    --target-type ip \
    --vpc-id vpc-123456
```

#### 步骤 3: 注册目标

将 EC2 实例或 IP 地址注册到目标组:

```bash
# 注册 EC2 实例
aws elbv2 register-targets \
    --target-group-arn arn:aws:elasticloadbalancing:region:account-id:targetgroup/my-targets/123456 \
    --targets Id=i-1234567890abcdef0 Id=i-0987654321fedcba0

# 注册 IP 地址
aws elbv2 register-targets \
    --target-group-arn arn:aws:elasticloadbalancing:region:account-id:targetgroup/my-ip-targets/123456 \
    --targets Id=10.0.1.10 Id=10.0.2.20
```

#### 步骤 4: 创建监听器

监听器使用配置的协议和端口检查来自客户端的连接请求:

```bash
# 创建 HTTP 监听器 (ALB)
aws elbv2 create-listener \
    --load-balancer-arn arn:aws:elasticloadbalancing:region:account-id:loadbalancer/app/my-application-lb/123456 \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:region:account-id:targetgroup/my-targets/123456

# 创建 HTTPS 监听器 (ALB)
aws elbv2 create-listener \
    --load-balancer-arn arn:aws:elasticloadbalancing:region:account-id:loadbalancer/app/my-application-lb/123456 \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=arn:aws:acm:region:account-id:certificate/123456 \
    --ssl-policy ELBSecurityPolicy-2016-08 \
    --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:region:account-id:targetgroup/my-targets/123456

# 创建 TCP 监听器 (NLB)
aws elbv2 create-listener \
    --load-balancer-arn arn:aws:elasticloadbalancing:region:account-id:loadbalancer/net/my-network-lb/123456 \
    --protocol TCP \
    --port 443 \
    --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:region:account-id:targetgroup/my-targets/123456
```

#### 步骤 5: 配置路由规则 (ALB)

为 ALB 配置基于内容的路由规则:

```bash
# 创建路径路由规则
aws elbv2 create-rule \
    --listener-arn arn:aws:elasticloadbalancing:region:account-id:listener/app/my-application-lb/123456/789012 \
    --priority 1 \
    --conditions Field=path-pattern,Values='/api/*' \
    --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:region:account-id:targetgroup/api-targets/123456

# 创建主机路由规则
aws elbv2 create-rule \
    --listener-arn arn:aws:elasticloadbalancing:region:account-id:listener/app/my-application-lb/123456/789012 \
    --priority 2 \
    --conditions Field=host-header,Values='api.example.com' \
    --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:region:account-id:targetgroup/api-targets/123456
```

#### 步骤 6: 配置健康检查

```bash
# 配置目标组健康检查
aws elbv2 modify-target-group \
    --target-group-arn arn:aws:elasticloadbalancing:region:account-id:targetgroup/my-targets/123456 \
    --health-check-protocol HTTP \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 3 \
    --unhealthy-threshold-count 2
```

### 完整架构示例

以下是一个典型的三层 Web 应用架构,使用 ALB 分发流量:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet                                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Internet Gateway                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Public Subnet (AZ-a)          │  Public Subnet (AZ-b)          │
│  ┌──────────────────────┐      │  ┌──────────────────────┐      │
│  │ Application Load     │      │  │ Application Load     │      │
│  │ Balancer (ALB)       │      │  │ Balancer (ALB)       │      │
│  │ DNS: myapp.elb.aws   │      │  │ (同一 ALB 跨 AZ)      │      │
│  └──────────┬───────────┘      │  └──────────┬───────────┘      │
└─────────────┼──────────────────┼─────────────┼──────────────────┘
              │                  │             │
              └──────────┬───────┴─────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Private Subnet (AZ-a)         │  Private Subnet (AZ-b)         │
│  ┌──────────────┐              │  ┌──────────────┐              │
│  │  EC2 Web 1   │              │  │  EC2 Web 2   │              │
│  │  Target Group│              │  │  Target Group│              │
│  └──────────────┘              │  └──────────────┘              │
└─────────────────────────────────┴────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Private Subnet (DB) - AZ-a    │  Private Subnet (DB) - AZ-b    │
│  ┌──────────────┐              │  ┌──────────────┐              │
│  │  RDS Primary │              │  │  RDS Standby │              │
│  │  (Multi-AZ)  │              │  │  (Multi-AZ)  │              │
│  └──────────────┘              │  └──────────────┘              │
└─────────────────────────────────┴────────────────────────────────┘
```

---

## 四、常用特性与最佳实践

### 1. 核心特性

#### 高可用性 (High Availability)

- **多可用区部署**: 在至少 2 个可用区中部署目标
- **自动故障转移**: 检测到不健康目标时自动路由到健康目标
- **跨区域负载均衡**: 支持跨 AWS 区域的负载均衡(配合 Route 53 或 Global Accelerator)

#### 健康检查 (Health Checks)

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| **HealthCheckPath** | 健康检查路径 | `/health` 或 `/status` |
| **HealthCheckIntervalSeconds** | 检查间隔 | 30 秒 |
| **HealthCheckTimeoutSeconds** | 超时时间 | 5 秒 |
| **HealthyThresholdCount** | 健康阈值 | 3 次 |
| **UnhealthyThresholdCount** | 不健康阈值 | 2 次 |

```bash
# 健康检查端点示例 (Node.js)
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  };
  try {
    res.send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).send();
  }
});
```

#### SSL/TLS 终止

ELB 支持 SSL/TLS 终止,减轻后端服务器的加密解密负担:

```bash
# 创建 HTTPS 监听器
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=$CERT_ARN \
    --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

**推荐 SSL 策略:**
- `ELBSecurityPolicy-TLS13-1-2-2021-06` (推荐,支持 TLS 1.3)
- `ELBSecurityPolicy-FS-1-2-Res-2020-10` (支持前向保密)

#### 会话粘性 (Sticky Sessions)

确保同一客户端的请求始终路由到同一目标:

```bash
# 启用基于 Cookie 的粘性 (ALB)
aws elbv2 modify-target-group-attributes \
    --target-group-arn $TG_ARN \
    --attributes Key=stickiness.enabled,Value=true Key=stickiness.type,Value=lb_cookie Key=stickiness.duration_seconds,Value=86400
```

**粘性类型:**
- `lb_cookie`: 负载均衡器生成的 Cookie
- `app_cookie`: 应用自定义 Cookie

#### 跨区域负载均衡 (Cross-Zone Load Balancing)

默认情况下,NLB 的跨区域负载均衡是关闭的,建议启用:

```bash
# 启用跨区域负载均衡
aws elbv2 modify-load-balancer-attributes \
    --load-balancer-arn $LB_ARN \
    --attributes Key=load_balancing.cross_zone.enabled,Value=true
```

#### 连接 draining (Connection Draining)

在目标注销或健康检查失败时,允许现有连接完成:

```bash
# 配置注销延迟 (默认 300 秒)
aws elbv2 modify-target-group-attributes \
    --target-group-arn $TG_ARN \
    --attributes Key=deregistration_delay.timeout_seconds,Value=300
```

#### 访问日志 (Access Logs)

启用访问日志,将详细请求信息存储到 S3:

```bash
# 启用访问日志
aws elbv2 modify-load-balancer-attributes \
    --load-balancer-arn $LB_ARN \
    --attributes Key=access_logs.s3.enabled,Value=true Key=access_logs.s3.bucket,Value=my-bucket Key=access_logs.s3.prefix,Value=elb-logs
```

**访问日志字段 (ALB):**
```
h2 2024-03-15T12:00:00.000000Z app/my-alb/1234567890abcdef
192.168.1.100:54321 10.0.1.10:80 0.001 0.002 0.000 200 200 1234 1024
"GET /api/users HTTP/1.1" "Mozilla/5.0" arn:aws:acm:region:account-id:certificate/123456
TLS_AES_128_GCM_SHA256 TLSv1.3
```

#### 删除保护 (Deletion Protection)

防止负载均衡器被意外删除:

```bash
# 启用删除保护
aws elbv2 modify-load-balancer-attributes \
    --load-balancer-arn $LB_ARN \
    --attributes Key=deletion_protection.enabled,Value=true
```

### 2. 安全最佳实践

#### 安全组配置

**ALB 安全组 (入站规则):**
```yaml
类型: HTTPS
端口: 443
源: 0.0.0.0/0 (或限制特定 IP)

类型: HTTP
端口: 80
源: 0.0.0.0/0 (用于重定向到 HTTPS)
```

**后端服务器安全组 (入站规则):**
```yaml
类型: HTTP/HTTPS
端口: 80/8080/443
源: sg-alb-security-group (仅允许来自 ALB 的流量)
```

#### 网络架构

```
Internet
   │
   ▼
Internet Gateway
   │
   ▼
┌──────────────────────────────────┐
│  Public Subnet                   │
│  ┌──────────────────────┐        │
│  │  ALB/NLB (公有)       │        │
│  │  Security Group:      │        │
│  │  - In: 443 from 0.0.0.0/0│     │
│  └──────────┬───────────┘        │
└─────────────┼────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│  Private Subnet                  │
│  ┌──────────────────────┐        │
│  │  EC2 Instances       │        │
│  │  Security Group:      │        │
│  │  - In: 80 from sg-alb │        │
│  └──────────────────────┘        │
└──────────────────────────────────┘
```

#### WAF 集成 (ALB)

将 AWS WAF 与 ALB 集成,保护 Web 应用:

```bash
# 关联 WAF Web ACL 到 ALB
aws wafv2 associate-web-acl \
    --web-acl-arn arn:aws:wafv2:region:account-id:webacl/my-web-acl/123456 \
    --resource-arn arn:aws:elasticloadbalancing:region:account-id:loadbalancer/app/my-alb/123456
```

### 3. 性能优化

#### 超时配置

```bash
# 配置空闲超时 (ALB, 默认 60 秒)
aws elbv2 modify-load-balancer-attributes \
    --load-balancer-arn $LB_ARN \
    --attributes Key=idle_timeout.timeout_seconds,Value=120
```

#### Slow Start 模式

新目标逐渐接收流量,避免突然负载:

```bash
# 启用 Slow Start (ALB)
aws elbv2 modify-target-group-attributes \
    --target-group-arn $TG_ARN \
    --attributes Key=slow_start.duration_seconds,Value=300
```

#### 保留源 IP 地址

```bash
# 启用源 IP 保留 (NLB)
aws elbv2 modify-target-group-attributes \
    --target-group-arn $TG_ARN \
    --attributes Key=preserve_client_ip.enabled,Value=true
```

### 4. 监控与告警

#### CloudWatch 关键指标

| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| **RequestCount** | 请求数量 | - |
| **TargetResponseTime** | 目标响应时间 | > 1 秒 |
| **HTTPCode_Target_5XX** | 5XX 错误数 | > 10/分钟 |
| **HTTPCode_Target_4XX** | 4XX 错误数 | 监控异常增长 |
| **HealthyHostCount** | 健康主机数 | < 2 |
| **UnHealthyHostCount** | 不健康主机数 | > 0 |
| **TargetConnectionErrorCount** | 连接错误数 | > 0 |

#### CloudWatch 告警配置

```bash
# 创建响应时间告警
aws cloudwatch put-metric-alarm \
    --alarm-name "ALB-High-Response-Time" \
    --alarm-description "ALB response time > 1 second" \
    --metric-name TargetResponseTime \
    --namespace AWS/ApplicationELB \
    --statistic Average \
    --period 60 \
    --evaluation-periods 3 \
    --threshold 1.0 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=LoadBalancer,Value=my-alb \
    --alarm-actions arn:aws:sns:region:account-id:my-alerts

# 创建 5XX 错误告警
aws cloudwatch put-metric-alarm \
    --alarm-name "ALB-High-5XX-Errors" \
    --alarm-description "High 5XX error rate" \
    --metric-name HTTPCode_Target_5XX_Count \
    --namespace AWS/ApplicationELB \
    --statistic Sum \
    --period 60 \
    --evaluation-periods 2 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=LoadBalancer,Value=my-alb \
    --alarm-actions arn:aws:sns:region:account-id:my-alerts
```

### 5. 与其他 AWS 服务集成

| 服务 | 集成方式 |
|------|----------|
| **Auto Scaling** | 自动注册/注销 EC2 实例 |
| **ECS/EKS** | 容器服务自动发现和注册目标 |
| **Route 53** | DNS 路由和健康检查,实现故障转移 |
| **AWS WAF** | Web 应用防火墙保护 (ALB) |
| **AWS Shield** | DDoS 保护 (Standard 和 Advanced) |
| **Global Accelerator** | 全球加速和跨区域负载均衡 |
| **CloudFront** | CDN 分发静态和动态内容 |
| **AWS Certificate Manager** | SSL/TLS 证书管理 |
| **CloudWatch** | 监控和告警 |
| **AWS Config** | 合规性检查 |
| **AWS CloudTrail** | API 调用审计 |

### 6. 定价

ELB 定价由以下部分组成:

| 组件 | ALB 价格 | NLB 价格 | GWLB 价格 |
|------|----------|----------|-----------|
| **每小时费用** | $0.0225/小时 | $0.0225/小时 | $0.0225/小时 |
| **LCU (Load Balancer Capacity Unit)** | $0.008/LCU | $0.006/NLCU | $0.008/GLCU |
| **数据处理** | - | $0.006/GB | $0.006/GB |

**ALB LCU 计算维度:**
- 每秒新连接数: 25
- 每分钟活跃连接数: 3,000
- 每小时处理字节数: 1 GB
- 规则评估数: 1,000

---

## 五、常见问题与故障排除

### 1. 健康检查失败

**可能原因:**
- 目标端口未开放
- 安全组阻止 ALB 访问
- 应用未响应健康检查路径
- 健康检查超时时间过短

**解决方案:**
```bash
# 检查目标健康状态
aws elbv2 describe-target-health \
    --target-group-arn $TG_ARN

# 常见错误信息
# - "Target.InvalidState": 目标处于停止或终止状态
# - "Target.RegistrationInProgress": 目标正在注册中
# - "Target.HealthCheckFailed": 健康检查失败
```

### 2. 502 Bad Gateway

**可能原因:**
- 后端服务器关闭了连接
- 后端服务器响应格式错误
- 后端服务器超时

**解决方案:**
- 检查后端应用日志
- 增加 ALB 空闲超时时间
- 确保后端正确处理 HTTP 请求

### 3. 503 Service Unavailable

**可能原因:**
- 所有目标都不健康
- 目标组没有注册目标
- 目标组容量不足

**解决方案:**
```bash
# 检查目标组目标
aws elbv2 describe-target-groups \
    --target-group-arns $TG_ARN \
    --query 'TargetGroups[0].TargetType'

# 检查目标健康
aws elbv2 describe-target-health \
    --target-group-arn $TG_ARN
```

### 4. 504 Gateway Timeout

**可能原因:**
- 后端处理时间过长
- ALB 空闲超时时间过短

**解决方案:**
```bash
# 增加空闲超时时间
aws elbv2 modify-load-balancer-attributes \
    --load-balancer-arn $LB_ARN \
    --attributes Key=idle_timeout.timeout_seconds,Value=300
```

---

## 六、总结

### 选择负载均衡器的决策树

```
你的应用需要负载均衡吗?
         │
         ├─ 是 ─▶ 什么协议?
         │         │
         │         ├─ HTTP/HTTPS/gRPC ─▶ ALB
         │         │   - Web 应用
         │         │   - 微服务
         │         │   - 容器应用
         │         │   - 需要内容路由
         │         │
         │         ├─ TCP/UDP ─▶ NLB
         │         │   - 游戏服务器
         │         │   - 流媒体
         │         │   - IoT 应用
         │         │   - 需要静态 IP
         │         │   - 超高性能要求
         │         │
         │         └─ 需要部署网络设备? ─▶ GWLB
         │             - 防火墙
         │             - IDS/IPS
         │             - 深度包检测
         │
         └─ 否 ─▶ 考虑其他方案
```

### 最佳实践清单

- [ ] 在至少 2 个可用区部署目标
- [ ] 配置健康检查端点
- [ ] 启用跨区域负载均衡
- [ ] 启用访问日志
- [ ] 配置 CloudWatch 告警
- [ ] 启用删除保护
- [ ] 配置安全组规则
- [ ] 使用 HTTPS 并配置 SSL 策略
- [ ] 配置连接 draining
- [ ] 与 Auto Scaling 集成

---

## 参考资源

- [Elastic Load Balancing Documentation](https://docs.aws.amazon.com/elasticloadbalancing/)
- [Elastic Load Balancing Features](https://aws.amazon.com/elasticloadbalancing/features/)
- [What is an Application Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [What is a Network Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html)
- [What is a Gateway Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/introduction.html)
- [Application, Network, and Gateway Load Balancing Comparison](https://aws.amazon.com/compare/the-difference-between-the-difference-between-application-network-and-gateway-load-balancing/)
- [ELB Best Practices (GitHub)](https://aws.github.io/aws-elb-best-practices/)
- [Elastic Load Balancing Pricing](https://aws.amazon.com/elasticloadbalancing/pricing/)
