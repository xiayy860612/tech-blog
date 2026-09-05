---
title: AWS ALB (Application Load Balancer)
date: 2026-03-15 16:00:00
categories:
- cloud
tags:
- aws
- cloud
- Load Balance
---

Application Load Balancer (ALB) 是 AWS Elastic Load Balancing 提供的一种负载均衡器，工作在 **OSI 模型的第七层（应用层）**。它能够自动将传入的应用流量分发到多个目标（如 EC2 实例、容器、IP 地址），支持跨多个可用区部署，并监控已注册目标的健康状况，仅将流量路由到健康的目标。

<!--more-->

### ALB 核心组件

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Load Balancer                    │
│  ┌──────────────────┐                                           │
│  │    Listener      │                                           │
│  │  (HTTP/HTTPS)    │                                           │
│  │   ┌──────────┐   │     ┌─────────────┐     ┌─────────────┐  │
│  │   │  Rule 1  │───┼────▶│ Target Group│────▶│   Target 1  │  │
│  │   │ Path: /api│   │     │   (EC2)     │     │   (EC2)     │  │
│  │   └──────────┘   │     └─────────────┘     └─────────────┘  │
│  │   ┌──────────┐   │                                           │
│  │   │  Rule 2  │───┼─────┐                                     │
│  │   │ Path: /web│   │     │     ┌─────────────┐               │
│  │   └──────────┘   │     └────▶│ Target Group│────▶ ...       │
│  │   ┌──────────┐   │           │  (Lambda)   │               │
│  │   │ Default  │───┼──────────▶└─────────────┘               │
│  │   └──────────┘   │                                           │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

| 组件 | 说明 |
|------|------|
| **Load Balancer** | 客户端流量的单一入口点，将传入流量分发到多个目标 |
| **Listener** | 使用配置的协议和端口检查来自客户端的连接请求 |
| **Target Group** | 将请求路由到一个或多个已注册的目标，支持独立健康检查 |
| **Rule** | 决定如何路由请求，包含优先级、条件和动作 |

## 核心功能

### 1. 高级路由能力

ALB 支持基于请求内容的智能路由：

#### 路由条件类型

| 条件类型 | 说明 | 示例 |
|----------|------|------|
| `path-pattern` | 基于 URL 路径路由 | `/api/*`, `/images/*` |
| `host-header` | 基于 HTTP 主机头路由 | `*.example.com`, `api.example.com` |
| `http-header` | 基于 HTTP 请求头路由 | 自定义 Header 匹配 |
| `http-request-method` | 基于 HTTP 方法路由 | `GET`, `POST`, `PUT` |
| `query-string` | 基于查询字符串参数路由 | `?version=v2` |
| `source-ip` | 基于源 IP 地址路由 | CIDR 格式的 IP 地址 |

#### 动作类型

| 动作类型 | 说明 |
|----------|------|
| `forward` | 将请求转发到目标组 |
| `redirect` | 将请求重定向到另一个 URL（支持 301/302） |
| `fixed-response` | 返回自定义 HTTP 响应 |

### 2. 协议支持

- **HTTP/HTTPS**: 支持 HTTP/1.1 和 HTTP/2
- **WebSockets**: 原生支持 `ws://` 和 `wss://` 协议
- **端口范围**: 1-65535

### 3. 健康检查

ALB 在目标组级别配置健康检查：

```yaml
健康检查配置:
  - 健康检查路径: /health
  - 健康检查间隔: 30秒
  - 健康检查超时: 5秒
  - 健康阈值: 5次成功
  - 不健康阈值: 2次失败
```

### 4. 目标类型

| 目标类型 | 说明 |
|----------|------|
| `instance` | EC2 实例 ID |
| `ip` | IP 地址（支持 VPC 内外的 IP） |
| `lambda` | Lambda 函数 |
| `alb` | 另一个 ALB（用于链式负载均衡） |

### 5. 路由算法

| 算法 | 说明 |
|------|------|
| **Round Robin** (默认) | 轮询分发请求 |
| **Least Outstanding Requests** | 将请求分发到当前未完成请求数最少的目标 |

## 常用功能详解

### HTTPS/TLS 终止

ALB 支持 SSL/TLS 终止，可使用 AWS Certificate Manager (ACM) 管理证书：

- 自动证书续期
- 支持 SNI (Server Name Indication)
- 可配置安全策略

### 用户认证

ALB 支持在路由请求前对用户进行身份认证：

- **Cognito User Pools**: Amazon Cognito 身份池
- **OIDC**: OpenID Connect 提供商
- **社交身份提供商**: Google, Facebook, Amazon 等

### Mutual TLS (mTLS)

支持双向 TLS 认证，适用于需要客户端证书验证的场景：

- **Passthrough 模式**: 将客户端证书传递给后端
- **Verify 模式**: ALB 验证客户端证书

### 请求/响应头修改

ALB 支持添加、修改或删除 HTTP 头：

```yaml
常用响应头:
  - Strict-Transport-Security (HSTS)
  - Content-Security-Policy
  - X-Content-Type-Options
  - X-Frame-Options
  - Access-Control-* (CORS 相关)
```

### X-Forwarded Headers

ALB 自动添加以下头信息：

| Header | 说明 |
|--------|------|
| `X-Forwarded-For` | 客户端源 IP |
| `X-Forwarded-Proto` | 原始请求协议 |
| `X-Forwarded-Port` | 原始请求端口 |

### 会话粘性 (Stickiness)

支持基于 Cookie 的会话粘性，确保同一客户端的请求始终路由到同一目标：

- **Duration-based**: 基于时间的粘性 Cookie
- **App-based**: 应用自定义粘性 Cookie

### 加权目标组

支持将流量按权重分发到多个目标组：

```
目标组 A: 权重 70% → 70% 流量
目标组 B: 权重 30% → 30% 流量
```

适用于蓝绿部署和金丝雀发布。

## 监控与日志

### CloudWatch 指标

| 指标 | 说明 |
|------|------|
| `RequestCount` | 请求数量 |
| `TargetResponseTime` | 目标响应时间 |
| `HTTPCode_Target_2XX` | 2XX 响应码数量 |
| `HTTPCode_Target_4XX` | 4XX 响应码数量 |
| `HTTPCode_Target_5XX` | 5XX 响应码数量 |
| `HealthyHostCount` | 健康主机数量 |
| `UnHealthyHostCount` | 不健康主机数量 |

### Access Logs

ALB 访问日志包含详细的请求信息：

- 请求时间戳
- 客户端 IP 和端口
- 请求方法和路径
- 响应码
- 目标处理时间
- SSL/TLS 信息

日志自动存储到 S3，以压缩格式保存。

## 与其他 AWS 服务集成

| 服务 | 集成说明 |
|------|----------|
| **Amazon EC2** | 将流量路由到 EC2 实例 |
| **Auto Scaling** | 自动注册/注销实例 |
| **ECS/EKS** | 容器服务自动发现和注册 |
| **AWS WAF** | Web 应用防火墙保护 |
| **Route 53** | DNS 路由和故障转移 |
| **Global Accelerator** | 全球加速和跨区域负载均衡 |
| **Shield** | DDoS 保护 |

## ALB vs 其他负载均衡器

| 特性 | ALB | NLB | CLB |
|------|-----|-----|-----|
| 工作层级 | L7 (应用层) | L4 (传输层) | L4/L7 |
| 路由能力 | 路径/主机/Header | IP/端口 | IP/端口 |
| 目标类型 | 实例/IP/Lambda | 实例/IP | 实例 |
| 健康检查 | 应用层 | TCP/HTTP | TCP/HTTP |
| WebSocket | ✓ | ✓ | ✗ |
| HTTP/2 | ✓ | ✗ | ✗ |
| 用户认证 | ✓ | ✗ | ✗ |

## 最佳实践

1. **多可用区部署**: 在至少两个可用区中部署目标
2. **健康检查优化**: 设置合理的健康检查间隔和阈值
3. **超时配置**: 根据应用需求调整空闲超时和连接超时
4. **安全配置**: 启用访问日志，配置安全组和网络 ACL
5. **监控告警**: 设置 CloudWatch 告警监控关键指标

## Reference

- [What is an Application Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [Listeners for your Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html)
- [Target groups for your Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html)
- [Listener rules for your Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-rules.html)
- [AWS ELB Documentation](https://docs.aws.amazon.com/elasticloadbalancing/)
