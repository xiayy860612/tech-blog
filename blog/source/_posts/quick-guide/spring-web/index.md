---
title: Spring MVC请求处理流程
date: 2022-03-05 17:47:19
categories:
- quick-guide
tags:
- spring
- web
---

```
环境: 
- org.springframework:spring-webmvc:5.3.10
- org.springframework.boot:spring-boot:2.5.5
```

web程序启动时的初始化顺序: ServletContext -> listener -> filter -> servlet
spring bean的初始化是在listener中声明的, 可以在后面使用.

<!--more-->

![](request-workflow.jpg)

## Filter

- Servlet规范规定的，只能用于Web程序中, 由Servlet容器提供支持
- 作用于Servlet执行前后

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

必须要注解**ServletComponentScan**才能让自定义的Filter其效果.

在filterChain.doFilter调用的前后来执行操作, 作用于Servlet之前的前后.

## DispatcherServlet

为Spring框架定制的Servlet, 用来对请求进行处理

- 获取请求处理链HandlerExecutionChain以及相应的HandlerAdapter
- 通过HandlerAdapter对请求进行处理
- 使用Interceptor对request/response进行拦截
- 对异常进行处理

Spring MVC中的各种相关配置可参考`WebMvcAutoConfigurationAdapter`.
通过定义一个或者多个`WebMvcConfigurer`来扩展Spring MVC中的配置

## 获取Handler

![](request-mapping.png)

通过`@RequestMapping`注解定义方法Handler的匹配要求，
生成对应的`RequestMappingInfo`和多个`RequestCondition`，
用于请求匹配, 匹配成功后调用对应的方法Handler。

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

`DispatcherServlet::getHandler`用于获取请求处理链HandlerExecutionChain，
通过比较RequestMappingInfo和RequestCondition，查找最匹配的方法Handler。
定义的RequestCondition越多，则方法Handler的针对性越强；反之，则方法Handler越通用。

## 通过HandlerAdapter处理请求

`HandlerAdapter.handle`主要做以下几件事：

- `HandlerMethodArgumentResolver`对输入参数进行解析
- 调用handler对请求进行处理
- `HandlerMethodReturnValueHandler`对返回进行处理
- ExceptionHandler异常统一处理

### 基于String输入的参数解析

![](string-param-resolver.png)

通过定义Converters中的bean，就可以在启动时
通过`WebMvcAutoConfigurationAdapter#addFormatters`添加进来，
用于`AbstractNamedValueMethodArgumentResolver`的输入类型转换。

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

### 针对Body的输入和输出处理

![](body-param-resolver.png)

通过`HttpMessageConverter`对body进行序列化和反序列化,
其中最常用的就是json的处理模块`MappingJackson2HttpMessageConverter`.

通过定义`HttpMessageConverters`的bean，将自定义的`HttpMessageConverter`添加进来，
通过`WebMvcAutoConfigurationAdapter#configureMessageConverters`进行注册

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

### JacksonJson序列化的支持

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

## Interceptor

Interceptor用于对Controller层进行拦截，
处理一些和controller没有依赖的业务，比如鉴权，日志等

- 作用于Controller前后执行
- 不能修改request
- spring中优先使用Interceptor, 而不是filter

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

## Exception处理

对Request Mapping Handler方法抛出的异常进行处理。

- ExceptionHandler
  - Controller层异常处理
  - ControllerAdvice全局异常处理

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
