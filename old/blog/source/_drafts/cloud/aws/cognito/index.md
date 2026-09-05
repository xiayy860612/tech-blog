---
title: AWS Cognito
date: 2026-03-07 10:00:00
categories:
- cloud
tags:
- aws
- cloud
- IDP
---

Amazon Cognito 是一个面向 Web 和移动应用的**身份平台**，同时具备以下三个核心角色：

| 角色 | 职责 |
|------|------|
| **用户目录** (User Directory) | 存储和管理用户信息 |
| **认证服务器** (Authentication Server) | 处理用户登录认证 |
| **授权服务** (Authorization Service) | 发放 OAuth 2.0 访问令牌和 AWS 凭证 |

通过 Amazon Cognito，你可以从内置用户目录、企业目录以及 Google、Facebook 等消费者身份提供商处认证和授权用户。

<!--more-->

## 核心组件

### User Pools（用户池）

用户池是一个**用户目录**，提供用户注册、管理和认证功能，是应用的身份提供商。

**主要能力：**

| 功能 | 描述 |
|------|------|
| OIDC 身份提供商 | 发放 ID Token 用于用户认证 |
| 授权服务器 | 发放 Access Token 用于 API 访问授权 |
| SAML 2.0 服务提供商 | 将 SAML 断言转换为 Token |
| 社交登录集成 | 支持 Apple、Facebook、Amazon、Google 登录 |
| 多因素认证 (MFA) | 支持 SMS、TOTP 等多种认证方式 |
| 自定义认证流程 | 可构建自定义认证机制 |
| 用户分组 | 创建用户逻辑分组，支持 IAM 角色层级 |
| Token 自定义 | 可自定义 ID 和 Access Token 的 claims |

### Identity Pools（身份池）

身份池用于**授权已认证或匿名用户访问 AWS 资源**，发放临时 AWS 凭证。

**主要能力：**

| 功能 | 描述 |
|------|------|
| User Pool 依赖方 | 用 User Pool 的 ID Token 交换 AWS STS 凭证 |
| SAML 2.0 服务提供商 | 用 SAML 断言交换 AWS 凭证 |
| OIDC 依赖方 | 用 OIDC Token 交换 AWS 凭证 |
| 社交提供商依赖方 | 用第三方 OAuth Token 交换 AWS 凭证 |
| 匿名访问 | 无需认证即可发放有限权限的 AWS 凭证 |
| 基于角色的访问控制 (RBAC) | 根据用户 claims 选择 IAM 角色 |
| 基于属性的访问控制 (ABAC) | 将 claims 转换为 AWS STS 会话的 principal tags |

## 工作原理

### 典型认证流程

User Pool 和 Identity Pool 配合使用的典型流程：

```
┌─────────────┐     1. 登录      ┌─────────────┐
│   用户/应用   │ ──────────────> │  User Pool  │
└─────────────┘                  └─────────────┘
       │                                │
       │         2. OAuth Token         │
       │<───────────────────────────────┘
       │
       │     3. 交换凭证
       ▼
┌─────────────┐                  ┌─────────────┐
│Identity Pool│ ──────────────── │   AWS STS   │
└─────────────┘   4. 临时凭证     └─────────────┘
       │
       │     5. 访问 AWS 资源
       ▼
┌─────────────┐
│  AWS Services│
│ (S3, DynamoDB│
│   etc.)      │
└─────────────┘
```

1. **用户登录** - 用户通过 User Pool 登录，获得 OAuth 2.0 Token
2. **交换凭证** - 应用将 Token 交给 Identity Pool，换取临时 AWS 凭证
3. **访问资源** - 应用使用临时凭证访问 AWS 服务

### Token 类型

User Pool 发放三种 JWT Token：

| Token 类型 | 用途 | 有效期 |
|-----------|------|--------|
| **ID Token** | 包含用户身份信息，用于认证用户 | 默认 1 小时 |
| **Access Token** | 授权访问 API 和用户资料 | 默认 1 小时 |
| **Refresh Token** | 用于获取新的 ID/Access Token | 默认 30 天 |

## 关键特性

### 托管登录 UI（Managed Login）

Cognito 提供托管登录页面，包括注册、登录、MFA 验证和密码重置等功能。

- **开箱即用** - 无需自己构建 UI
- **品牌自定义** - 支持自定义域名、Logo、颜色和 CSS
- **响应式设计** - 自适应各种设备
- **多语言支持** - 支持多种语言的认证界面

### 身份联合（Identity Federation）

支持全面的身份联合：

| 提供商类型 | User Pools | Identity Pools |
|-----------|:----------:|:--------------:|
| Amazon Cognito User Pool | ✓ | ✓ |
| Google / Facebook / Apple / Amazon | ✓ | ✓ |
| SAML 2.0 (如 Okta, ADFS) | ✓ | ✓ |
| OIDC Provider | ✓ | ✓ |
| Developer Authenticated | | ✓ |

### Lambda 触发器

在认证生命周期的各个阶段支持 Lambda 触发器：

| 触发器 | 时机 | 典型用途 |
|-------|------|---------|
| Pre Sign-up | 注册前 | 验证注册信息 |
| Post Confirmation | 注册确认后 | 同步用户数据 |
| Pre Token Generation | Token 生成前 | 自定义 claims |
| Post Authentication | 认证成功后 | 记录日志 |
| Define Auth Challenge | 自定义认证 | 实现自定义流程 |
| Migrate User | 用户迁移 | 从遗留系统迁移 |

### 分析和监控

- **用户分析** - 通过 Amazon Pinpoint 分析用户认证模式
- **审计日志** - 与 AWS CloudTrail 集成，记录所有事件
- **运营监控** - 与 AWS CloudWatch 集成，监控性能和错误率

## 集成方式

| 方式 | 适用场景 | 复杂度 |
|------|---------|:------:|
| **Managed Login** | 快速部署、标准认证流程 | 低 |
| **AWS Amplify** | 全栈应用开发 | 中 |
| **AWS SDK** | 自定义 UI、细粒度控制 | 高 |
| **OIDC 客户端库** | 非 AWS 平台、标准 OIDC 集成 | 中 |

### Managed Login（推荐入门）

1. 在 AWS 控制台创建 User Pool
2. 配置 App Client 和回调 URL
3. 应用中使用 OIDC 库重定向到托管登录页
4. 处理回调中的授权码，换取 Token

```javascript
// 重定向到托管登录页
const loginUrl = `https://${domain}/login?client_id=${clientId}&response_type=code&scope=openid+profile&redirect_uri=${redirectUri}`;
window.location.href = loginUrl;
```

## 应用场景

### 移动和 Web 应用认证

为面向客户的应用实现安全的用户认证。

- 提供 iOS、Android、JavaScript 等平台的 SDK
- 支持离线功能和自动 Token 刷新
- 处理安全 Token 存储和自动凭证更新

### 企业应用现代化

为遗留应用添加现代认证能力。

- SAML 2.0 和 OIDC 支持渐进式迁移
- Lambda 触发器集成现有用户数据库
- 保留现有用户管理工作流和合规要求

### Serverless 应用安全

保护 API Gateway 端点和 Lambda 函数。

- 与 AWS serverless 服务无缝集成
- 自动 Token 验证和用户上下文注入
- 生成临时 AWS 凭证

### 多租户 SaaS 平台

实现多租户认证，每个客户组织可以有自己的用户目录。

- 用户组和自定义属性实现租户隔离
- 基于角色的访问控制
- 支持白标解决方案

## 安全最佳实践

| 实践 | 说明 |
|------|------|
| **Token 存储** | 不要将 Token 存储在 localStorage，使用 httpOnly Cookie 或内存 |
| **最小权限原则** | 为 Identity Pool 配置最小必要的 IAM 权限 |
| **启用 MFA** | 对敏感操作要求多因素认证 |
| **Token 验证** | 后端 API 必须验证 Token 的签名和有效期 |
| **使用 HTTPS** | 所有认证请求必须通过 HTTPS |
| **配置 AWS WAF** | 保护 User Pool 免受恶意请求 |

## 术语表

| 术语 | 中文含义 |
|------|---------|
| **User Pool** | 用户池，用于用户注册、登录和管理的用户目录 |
| **Identity Pool** | 身份池，用于授权用户访问 AWS 资源 |
| **OIDC (OpenID Connect)** | 基于 OAuth 2.0 的身份认证协议 |
| **OAuth 2.0** | 授权框架，允许第三方应用获取有限访问权限 |
| **SAML 2.0** | 安全断言标记语言，用于单点登录的企业标准 |
| **JWT (JSON Web Token)** | JSON 格式的安全令牌，用于在各方之间传输信息 |
| **ID Token** | 身份令牌，包含用户身份信息 |
| **Access Token** | 访问令牌，用于授权访问 API |
| **Refresh Token** | 刷新令牌，用于获取新的访问令牌 |
| **Claims** | 声明，Token 中包含的用户信息键值对 |
| **MFA (Multi-Factor Authentication)** | 多因素认证，要求用户提供两种或以上验证方式 |
| **TOTP (Time-based One-Time Password)** | 基于时间的一次性密码 |
| **RBAC (Role-Based Access Control)** | 基于角色的访问控制 |
| **ABAC (Attribute-Based Access Control)** | 基于属性的访问控制 |
| **Managed Login** | 托管登录，Cognito 提供的托管认证页面 |
| **Identity Federation** | 身份联合，允许使用外部身份提供商登录 |
| **Identity Provider (IdP)** | 身份提供商，提供用户认证服务的系统 |
| **Relying Party (RP)** | 依赖方，信任 IdP 进行用户认证的应用 |
| **Principal Tags** | 主体标签，AWS STS 会话中的用户属性标签 |
| **STS (Security Token Service)** | AWS 安全令牌服务，用于生成临时凭证 |

## 参考

- [AWS Identity and Access Management - Cognito Getting Started](https://skillbuilder.aws/learn/49UPDB8UTA/aws-identity-and-access-management--cognito-getting-started/D1BRS1F1Z9)
- [Amazon Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)
