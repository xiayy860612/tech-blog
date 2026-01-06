---
title: Spring Security的认证设计
date: 2021-02-08 21:47:19
categories:
- spring
tags:
- spring
- web
- spring security
---

通过对应的`AuthenticationProvider`对特定的`Authentication`进行认证处理。

<!--more-->

![](authorization-flow.png)

- SecurityContextHolder, 认证成功后, 可以在后续的处理中通过它来获取认证后的用户信息

## Authentication Design

![](authentication-design.png)
![](provider-manager.png)

## 常见的认证方式

### DaoAuthenticationProvider

用于对**username/password**这种形式的认证信息进行校验,
认证信息通过`UsernamePasswordAuthenticationToken`进行包装.
其中password可以从本地服务中获取.

![](dao-authentication-provider.png)

![](dao-authentication-provider-design.png)

通过`UserDetailsService`来查询username来获取对应的UserDetails用户信息, 包括用于校验的密码信息.

由于密码往往通过某种加密方式加密后保存,
所以需要通过PasswordEncoder对输入的password进行加密后, 再同UserDetails中的密码信息进行比较.

#### 对FormLogin的支持

![](form-login.png)

![](form-login-design.png)

- LoginUrlAuthenticationEntryPoint, 在认证失败时, 重导向到登录页面
- UsernamePasswordAuthenticationFilter处理登录页面的认证请求

#### 对Basic的支持

![](basic-login-flow.png)

![](basic-login-design.png)

- BasicAuthenticationEntryPoint, 在认证失败时返回WWW-Authenticate头信息
- BasicAuthenticationFilter, 处理Basic认证请求

### Pre-Authentication Framework对第三方认证的集成

![](Pre-Authentication-design.png)

- AbstractPreAuthenticatedProcessingFilter, Pre-Authentication Framework的入口
- PreAuthenticatedAuthenticationToken, 包含第三方的用户校验信息或者认证成功后的用户信息
- PreAuthenticatedAuthenticationProvider, Pre-Authentication Framework默认的校验器
- AuthenticationUserDetailsService, 同第三方进行校验, 在校验成功后获取系统中的用户信息

## Session管理

Http Session相关的功能都在以下组件中进行处理:

- SessionManagementFilter
- SessionAuthenticationStrategy, 对认证成功的用户进行session校验
- SessionRegistry, 存储session和认证后的用户信息的键值对

主要处理以下问题:

- 防御会话固定攻击(session-fixation protection attack)
  - SessionFixationProtectionStrategy
- 检查Session是否超时
  - InvalidSessionStrategy, 对无效session进行处理
- 限制用户的同时登录数
  - ConcurrentSessionFilter
  - ConcurrentSessionControlAuthenticationStrategy

## 登出处理

登出时会对用户相关的登录信息进行清理:

- session无效化
- 清理SecurityContextHolder
- 重导向到登录页面
- 清理Cookies

通过LogoutHandler进行清理, 不可以抛出异常.

LogoutSuccessHandler在logout成功后,
进行重定向(默认为/login?logout)或者返回指定的http status code(默认为200).

## Reference

- [Servlet Authentication](https://docs.spring.io/spring-security/site/docs/5.4.2/reference/html5/#servlet-authentication)
