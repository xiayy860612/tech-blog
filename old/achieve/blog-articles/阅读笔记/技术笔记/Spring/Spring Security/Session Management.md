# Session Management

session的作用是获取已认证的凭证信息, 即已认证的Authentication, 
从而避免用户重复登录.

核心模块:

- HttpSession, 对请求中的session信息进行包装, session的值一般来自请求的**cookie或者url的query string**部分
- SecurityContextRepository, 用于存储/获取SecurityContext
- SecurityContextPersistenceFilter, 在Filter处理链靠前的位置, 
为**安全处理链**提供新建/已存在的SecurityContext
- SessionAuthenticationStrategy, 根据已认证的Authentication来创建/更新HttpSession,
可以控制同一个帐号在系统中的同时登录数量
- SessionManagementFilter, 执行SessionAuthenticationStrategy, 
并保存已认证的SecurityContext到SecurityContextRepository
- FilterSecurityInterceptor, 对根据HttpSession获取的Authentication进行校验

![](Session&#32;Management.png)


## Reference

- [Session Management](https://docs.spring.io/spring-security/site/docs/5.2.0.RELEASE/reference/htmlsingle/#ns-session-mgmt)
