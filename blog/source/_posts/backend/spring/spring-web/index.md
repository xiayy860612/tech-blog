---
title: Spring Web MVC
date: 2022-03-05 17:47:19
categories:
- backend
tags:
- spring
- web
- backend
- Java
---

Spring Web MVC 是基于 `Servlet 容器`，使用 Spring 框架来开发 http web 服务。

![请求处理流](request-workflow.jpg)

web 服务启动时的初始化顺序: ServletContext -> listener -> filter -> servlet
spring bean 的初始化是在 listener 中声明的, 保证了可以在后续流程中使用.

<!--more-->

## 配置管理

使用 Spring Environment 将服务的配置和部署环境解耦，通过 `spring.profiles.active=<profile1,...>` 激活的配置来加载相关的配置。

配置的数据源：

- 命令行参数
- 系统的环境变量
- application 配置文件，支持 `.properties` 和 `.yml/.yaml` 文件格式，推荐使用 yaml 格式
  - `application` 文件
  - `application-<profile>` 文件
- `@Configuration + @PropertySource` 指定的**自定义**配置文件

配置的优先级从小到大：

1. 命令行参数
2. 系统环境变量
3. Jar 包**外部同级目录**下的 `application-<profile>` 文件
4. Jar 包**外部同级目录**下的 `application` 文件
5. Jar 包**内部**的 `application-<profile>` 文件
6. Jar 包**内部**的 `application` 文件

## Filter

- Servlet 规范规定的，只能用于 Web 服务中, 由 `Servlet 容器`提供支持
- 作用于 Servlet 执行前后

```java
@Order(1)
@WebFilter(filterName = "customized", urlPatterns = "/*")
public class CustomizedFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("CustomizedFilter Init");
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        log.info("CustomizedFilter doFilter before");

        // 执行Servlet
        filterChain.doFilter(servletRequest, servletResponse);

        log.info("CustomizedFilter doFilter after");
    }

    @Override
    public void destroy() {
        log.info("CustomizedFilter destroy");
    }
}
```

必须要对启动类添加注解**ServletComponentScan**才能让自定义的Filter其效果.

在filterChain.doFilter调用的前后来执行操作, 作用于Servlet之前的前后.

## DispatcherServlet

为 Spring 框架定制的 Servlet, 用来对请求进行处理的入口。

- 路由，获取请求处理链HandlerExecutionChain以及相应的HandlerAdapter
- 通过HandlerAdapter对请求进行处理
- 使用Interceptor对request/response进行拦截
- 对异常进行处理

Spring MVC中的各种相关配置可参考`WebMvcAutoConfigurationAdapter`.
通过定义一个或者多个`WebMvcConfigurer`来扩展Spring MVC中的配置

## 路由

![路由](request-mapping.png)

通过对 handler 方法添加 `@RequestMapping` 注解来定义请求处理器的匹配要求，
生成对应的`RequestMappingInfo`和多个`RequestCondition`，
用于请求路由, 选择最匹配的 handler 方法来处理请求。

```java
@RequestMapping(value = "/{ping}", method = RequestMethod.GET)
public String getPingPong( String ping) {
    return ping;
}

@GetMapping(value = "/{ping}", params = "ex=1")
public String getPingPongEx( String ping) {
    return ping + " Ex";
}
```

`DispatcherServlet::getHandler`用于获取请求处理链 `HandlerExecutionChain`，
通过比较 RequestMappingInfo 和 RequestCondition，查找最匹配的 Handler 方法。
定义的 RequestCondition 越多，则 Handler 的针对性越强；反之，则 Handler 越通用。

## Interceptor 拦截器

Interceptor 用于对请求对 handler 方法进行拦截，
处理一些和请求没有依赖的业务，比如鉴权，日志等

- 作用于 handler 方法，在其前后执行
- 不能修改request
- Spring 中优先使用 Interceptor, 而不是 filter

```java
public class CustomizedInterceptor extends HandlerInterceptorAdapter {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        log.info("CustomizedInterceptor prehandle");
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
        @Nullable ModelAndView modelAndView) throws Exception {
        log.info("CustomizedInterceptor postHandle");
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
            @Nullable Exception ex) throws Exception {
        log.info("CustomizedInterceptor afterCompletion");
    }

}

// 添加interceptor
@Configuration
public class AppServiceConfig extends WebMvcConfigurationSupport {

    @Autowired
    private CustomizedInterceptor customizedInterceptor;

    @Override
    protected void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(customizedInterceptor).addPathPatterns("/**");
    }
}
```

## 请求处理

通过 HandlerAdapter 增强 handler 方法来对请求进行处理。

`HandlerAdapter.handle`主要做以下几件事：

- `HandlerMethodArgumentResolver`对输入参数进行解析
- 调用 handler 方法对请求进行处理
- `HandlerMethodReturnValueHandler`对返回进行处理
- ExceptionHandler异常统一处理

### 基于 String 输入的参数解析

主要是针对 `path/query string/header` 中的参数进行解析。

![基于 String 输入的参数解析](string-param-resolver.png)

通过定义 Converters 中的 bean，就可以在启动时
通过 `WebMvcAutoConfigurationAdapter#addFormatters` 添加进来，
用于 `AbstractNamedValueMethodArgumentResolver` 的输入类型转换。

```java
// Money.java
@Getter
@Setter
public class Money {
    private String currency = "CNY";
    private String value;

    @Override
    public String toString() {
        return currency + " " + value;
    }
}

// MoneyFormatter.java
@Component
public class MoneyFormatter implements Formatter<Money> {
    @Override
    public Money parse(String text, Locale locale) throws ParseException {
        String[] input = text.split(" ");
        Money money = new Money();
        if (input.length == 1) {
            money.setValue(input[0]);
        } else {
            money.setCurrency(input[0]);
            money.setValue(input[1]);
        }
        return money;
    }

    @Override
    public String print(Money object, Locale locale) {
        return object.getCurrency()
                + " " + object.getValue();
    }
}

// IndexController.java
@GetMapping(value = "/price")
public Money price( Money money) {
    return money;
}
```

### 针对 Body 的输入和输出处理

![body 参数解析](body-param-resolver.png)

通过 `HttpMessageConverter` 对 body 进行序列化和反序列化,
其中最常用的就是 json 的处理模块`MappingJackson2HttpMessageConverter`.

通过定义 `HttpMessageConverters` 的bean，将自定义的 `HttpMessageConverter` 添加进来，
通过 `WebMvcAutoConfigurationAdapter#configureMessageConverters` 进行注册

```java
// StringConverter.java
public StringConverter implements HttpMessageConverter<String> {
  ...
}

// ConverterConfig.java
@Bean
public HttpMessageConverters converters() {
    return new HttpMessageConverters(new StringConverter());
}
```

#### JacksonJson序列化的支持

Spring MVC中提供了`MappingJackson2HttpMessageConverter`对json对象进行序列化处理。
通过JsonComponnet相关的bean来注册JSON序列化组件

- JsonSerializer
- JsonDeserializer

```java
@JsonComponent
public class MoneyJson extends StdSerializer<Money> {

    protected MoneyJson() {
        super(Money.class);
    }

    @Override
    public void serialize(Money money, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
        jsonGenerator.writeString(money.toString());
    }
}
```

### 参数校验

TODO

## Exception处理

通过定义注解 `@ExceptionHandler` 对请求 Handler 方法抛出的异常进行处理。

处理的优先级从小到大：

  1. Controller 层异常处理
  2. (**required**) ControllerAdvice 全局异常处理

## 统一 Response

统一 Response 的目的是让对接的客户端能够以统一的方式来判断响应的结果，尤其是针对错误返回的场景。
判断响应结果的依据：

- http status code
- 业务相关的错误码

常见的统一 Response 结构：

```json
// 错误响应
{
    "code": 1000,
    "message": "error message",
    "data": null
}

// 正确响应
{
    "code": 0,
    "message": null,
    "data": {}
}
```

Spring MVC 中通过 `ResponseBodyAdvice` 对返回结果进行统一处理，
它会在 handler 方法的返回值写入 response 前被调用；
如果正常响应不需要统一结构的响应，那么只需要在异常处理场景中返回错误响应结构即可。

## 测试

TODO

## 异步任务处理

- 应用内异步执行
  - `@Async + 线程池`
  - `@Async + Application Event`
- 基于 MQ 分布式异步执行

### @Async + 线程池

```java
@Confiuguration
@EnableAsync
public class AsyncConfig { 
    // @Async 的自定义线程池
    @Bean(name = "asyncEventTaskExecutor")
    public TaskExecutor asyncEventTaskExecutor() {
        return new ThreadPoolTaskExecutor(...);
    }

    // 传统线程池
    @Bean
    public Executor taskExecutor() { 
        return new ThreadPoolExecutor(...);
    }
}
```

### @Async + Application Event

Application Event 采用发布/订阅模式，基于事件驱动的方式处理**本地的**异步任务，用于**服务内**解耦，服务**重启后事件丢失**。

- 通过 `ApplicationEventPublisher.publishEvent` 来发布事件
- 通过 `@EventListener` 来监听事件

如果没有开启 `@EnableAsync`，则默认为同步处理；只有开启后才会使用**相关联的线程池**进行异步处理。

```java
// 异步执行配置
@Confiuguration
@EnableAsync
public class AsyncConfig { 
    // 自定义线程池
    @Bean(name = "asyncEventTaskExecutor")
    public TaskExecutor asyncEventTaskExecutor() {
        return new ThreadPoolTaskExecutor(...);
    }
}

public class CustomEvent {...}

@Component
public class AsyncCustomEventListener {

    @EventListener
    @Async("asyncEventTaskExecutor") // 需要开启 @EnableAsync
    public void handleAsync(CustomEvent event) {
        // 异步处理，不阻塞主流程
    }
}
```

### 基于 MQ

适用场景：跨服务异步、削峰填谷、保证最终一致性

## RPC 调用

- RestTemplate
- (**推荐**) Feign

TODO

## Reference

- [JSR 340: Java Servlet 3.1 Specification](https://jcp.org/en/jsr/detail?id=340)
- [中文翻译](https://waylau.gitbooks.io/servlet-3-1-specification/content/)
- [Spring MVC](https://docs.spring.io/spring-framework/reference/)
- [玩转Spring全家桶 — 46 | Spring MVC中的常用视图（上）](https://time.geekbang.org/course/detail/100023501-85504)
- [SpringMVC系列（一）核心：处理请求流程](https://blog.csdn.net/zhaolijing2012/article/details/41596803)
- [Spring Boot :Request请求处理流程](http://www.cnblogs.com/cnndevelop/p/7255622.html)
- [Spring MVC工作流程以及请求处理流程](http://www.51gjie.com/javaweb/909.html)
- [码农小汪-Spring MVC -DispatcherServlet 详解](https://blog.csdn.net/u012881904/article/details/51292211)
- [Servlet 工作原理解析](https://www.ibm.com/developerworks/cn/java/j-lo-servlet/index.html)
- [Spring filter和拦截器(Interceptor)的区别和执行顺序](https://www.cnblogs.com/ycpanda/p/3637312.html)
- [Spring Boot 使用 Servlet、Filter、Listener](http://fanlychie.github.io/post/spring-boot-servlet-filter-listener-usage.html)
- [SpringMVC源码剖析（五)-消息转换器HttpMessageConverter](https://my.oschina.net/lichhao/blog/172562)
- [Spring MVC HandlerMapping HandlerAdapter](https://leokongwq.github.io/2015/04/17/springMVCOutlines.html)
- [SpringMVC中WebDataBinder的应用及原理](https://blog.csdn.net/hongxingxiaonan/article/details/50282001)
- [说说Spring中的WebDataBinder](https://blog.csdn.net/u010913106/article/details/50855691)
- [Spring Boot：定制HTTP消息转换器](https://www.jianshu.com/p/ffe56d9553fd)
- [Spring Boot 统一异常处理最佳实践 – 拓展篇](https://cloud.tencent.com/developer/article/1561782)
- - [Spring IOC实现原理详解之Bean实例化(生命周期,循环依赖等)](https://www.pdai.tech/md/spring/spring-x-framework-ioc-source-3.html)
- [Spring IoC⭐️什么是 IoC?](https://javaguide.cn/system-design/framework/spring/spring-knowledge-and-questions-summary.html#spring-ioc)
- [掌握Spring Environment：配置管理的关键](https://cloud.tencent.com/developer/article/2526691?policyId=1003)
- [详细分析ResponseBodyAdvice的使用与原理](https://juejin.cn/post/7209542304863486012)
- [Spring MVC异步处理架构实战：线程池+消息队列+事件驱动+反应式高并发性能优化](https://www.51cto.com/article/819931.html)
