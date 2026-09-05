---
title: Spring Security 鉴权设计
date: 2021-12-24 21:47:19
categories:
- spring
tags:
- spring
- web
- spring security
---

Spring Security提供了以下几种方式进行鉴权:

- pre-invocation handling, 在使用被保护资源之前进行鉴权
- after invocation handling， 对调用后返回的被保护资源， 通过鉴权进行过滤
- FilterSecurityInterceptor, 在请求处理链中根据请求进行鉴权
- 基于SpEL(Spring Expression Language)， 通过注解对被保护资源进行鉴权

<!--more-->

## Architecture Core

### Pre-Invocation Handling

![](pre-invocation-design.png)

- GrantedAuthority, 描述用户的权限
- AccessDecisionManager， 决定用户是否有对受保护资源的访问权限

在访问受保护资源之前， 对用户进行鉴权

![](pre-invocation-design2.png)

### After Invocation Handling

对方法放回的值根据用户权限进行再过滤，只返回用户可以访问的资源

![](after-invocation-design.png)

- PostInvocationAdviceProvider, 当使用@PostAuthorize和@PostFilter注解时调用

## FilterSecurityInterceptor

在调用链中对请求进行鉴权

![](FilterSecurityInterceptor-flow.png)

## 基于SpEL(Spring Expression Language)

Spring Security 3.0引入， 通过注解对被保护资源进行鉴权

- 内置校验表达式，返回boolean进行校验，常用的有：
  - hasRole
  - hasPermission
  - authentication, 访问Authentication对象
  - principal，访问当前对象
- `@<bean_name>.<function>`, 引用bean中返回boolean的方法
- `#<path_variable>`, 引用方法参数列表中的变量

通过`EnableGlobalMethodSecurity注解`开启@Pre和@Post注解功能:

- @PreAuthorize, 对方法是否可以访问进行校验
- @PostAuthorize注解， 可通过returnObject来引用返回值, 校验用户是否可以访问返回对象
- @PreFilter, 对方法参数列表中的Iterable的对象进行过滤，
- @PostFilter注解，对方法返回的Iterable对象进行过滤，可通过filterObject来引用方法返回值

优先通过PreFilter进行过滤，避免后续大量无效数据的获取

## Reference

- [Spring Security Authorization](https://docs.spring.io/spring-security/site/docs/current/reference/html5/#servlet-authorization)
- [JSR-250](https://amos.s2u2m.com/2021/08/spring-security/authorization/)
- [ACL](https://amos.s2u2m.com/2021/08/spring-security/authorization/)
