---
title: Spring
date: 2024-12-8 20:00:00
categories:
- spring
tags:
- spring
---

<!--more-->

## AOP

AOP 的目的是将横切关注点（如日志记录、事务管理、权限控制、接口限流、接口幂等等）从核心业务逻辑中分离出来，通过动态代理、字节码操作等技术，实现代码的复用和解耦，提高代码的可维护性和可扩展性。

Spring 默认从采用`动态代理`的方式来增强方法

- JDK Proxy
- Cglib
- AspectJ

![advice types](aspectj-advice-types.jpg)

## Spring Boot Auto Configuration

通过 SPI 的方式实现，一般在 starter 中设计接口，然后在项目中引入第三方库的具体，之后就可以在项目中使用 starter 中设计的接口，调用第三方库中的具体实现类。

- @EnableAutoConfiguration
- @AutoConfigurationImportSelector
- @Import
- @ConditionalOnXXX

classpath: META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports

## Transactions

- **编程式事务**，在代码中硬编码(在分布式系统中推荐使用)，通过 `TransactionTemplate`或者 `TransactionManager` 手动管理事务。
- **声明式事务**，直接基于注解 `@Transactional`，通过 AOP 实现，一般基于 @Transactional 注解

主要使用的事务传播行为：
- **`TransactionDefinition.PROPAGATION_REQUIRED`**， 默认值
- **`TransactionDefinition.PROPAGATION_REQUIRES_NEW`**
- **`TransactionDefinition.PROPAGATION_NESTED`**
- **`TransactionDefinition.PROPAGATION_MANDATORY`**

核心接口：

- **`PlatformTransactionManager`**，事务管理器，Spring 事务策略的核心
- **`TransactionDefinition`**，事务定义信息(事务隔离级别、传播行为、超时、只读、回滚规则)
- TransactionStatus

## Bean Validation

- @Valid
- @Validated



## 常用注解

- @SpringBootApplication
- @Autowired/@Qualifier
- @Configuration/@ConfigurationProperties/@PropertySource

## 异步处理

Spring Boot 默认情况下不启用异步支持

- @EnableAsync/@Async

在使用 @Async 时需要自己指定线程池，避免 Spring 默认线程池带来的风险。

## Reference

- [Bean 的生命周期了解么?](https://javaguide.cn/system-design/framework/spring/spring-knowledge-and-questions-summary.html#bean-%E7%9A%84%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E4%BA%86%E8%A7%A3%E4%B9%88)
