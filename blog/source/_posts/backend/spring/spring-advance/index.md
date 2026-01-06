---
title: Spring Advance Features
date: 2024-12-08 20:00:00
categories:
- backend
tags:
- spring
- backend
---

Spring 高级特性的学习整理笔记。

<!--more-->

## IoC

- 依赖注入（Dependency Injection，DI）, 这是 IoC 最常见以及最合理的实现方式
- 依赖查询，通过 Bean 容器来根据类型或者名称查找相对应的 Bean。

IoC 容器：

- BeanFactory，基础容器
- ApplicationContext，应用级容器，基于 BeanFactory 扩展了更多的功能
  - 资源访问
  - 国际化
  - 事件

注入的方法：

- (推荐) 构造注入，保证注入的组件不可变 final，并且确保需要的依赖不会为空。
- setter 注入
- 基于注解的注入
  - `@Autowired`，Spring自带的注解，默认是根据**类型**进行装配
    - 如果有多个类型一样的候选者，需要配合 `@Qualifier` 指定**名称**进行装配
  - `@Resource`，JSR250规范定义的，默认根据**属性名称**进行装配
  - `@Inject`，JSR330规范定义的，默认根据**类型**进行装配的; 配合 `@Named` 可以按**名称**进行装配

### Bean 生命周期

![bean life](spring-bean-lifestyle-2.png)

![bean life](spring-bean-lifestyle.png)

1. 实例化 Instantiation，构造函数调用后生成的实例被包装成 ObjectFactory 放入第三级缓存
   - 构造注入
2. 属性赋值 Populate
   - set 注入
   - 注解注入
3. 初始化 Initialization
   - xxxAware 接口
   - BeanPostProcess
   - InitializingBean
4. 销毁 Destruction
   - DisposableBean

### 循环依赖问题

Spring只是解决了**单例模式**下 **setter 注入**的循环依赖问题，无法解决**构造注入**的循环依赖问题。

解决循环依赖主要是依赖**三级缓存**，而 Bean **只有在调用构造方法之后，才会被包装成 ObjectFactory 放入第三级缓存**，
因此如果 Bean 没有完成构造方法，那么其他的 Bean 并不能从三级缓存中获取到该依赖的 Bean，也就不能解决依赖问题。

对于构造注入的循环依赖问题，往往是因为设计上的不合理，需要调整接口的调用顺序以及梳理层级调用关系。

### 三级缓存

- **第一级缓存（singletonObjects）**，存放最终形态的 Bean（已经实例化、属性填充、初始化）
- **第二级缓存（earlySingletonObjects）**，存放过渡 Bean（实例化后的半成品，尚未属性填充以及初始化）
- **第三级缓存（singletonFactories）**，在调用 bean 的构造方法后，将实例包装成 `ObjectFactory`，放入这里

## AOP

## 自动装配

## 事件发布与订阅

## Reference

- [Spring IOC实现原理详解之Bean实例化(生命周期,循环依赖等)](https://www.pdai.tech/md/spring/spring-x-framework-ioc-source-3.html)
- [Spring IoC⭐️什么是 IoC?](https://javaguide.cn/system-design/framework/spring/spring-knowledge-and-questions-summary.html#spring-ioc)
