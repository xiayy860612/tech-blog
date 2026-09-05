# ASP.Net Core Introduction

ASP.Net Core 简介
<!--more-->

In **Main** entry class to set up basic settings for application.
such as Content root, Web root, ...

Moslty use [Kestrel](https://docs.microsoft.com/zh-cn/aspnet/core/fundamentals/servers/kestrel) as web server behind IIS/nginx.

![Server Set Up](kestrel-to-internet.png)

## Startup
- Startup Class, configures the request pipeline that handles all requests made to the application
- appsettings[.{env}].json, app settings configuration file
- bundleconfig.json, configuration files for bundling and minifying front-end JavaScript and CSS assets.
- wwwroot, Web application root folder for public static resources like css,js, ...

## Request Pipeline
Define request pipeline in **Startup::Configure** method
by config [Middleware][] to **IApplicationBuilder** instance.

**Startup::Configure** method specifies how the ASP.NET application
will respond to HTTP requests.

Request delegates are used to build the request pipeline and handle HTTP request.

Request delegates are configured using **Run, Map, and Use extension methods**
on the IApplicationBuilder instance in **Startup::Configure** method.
- Run, short-circuits the pipeline, not call next request delegate
- Map, branches request pipeline based on matches of the given request path.
If the request path starts with the given path, the branch is executed.
- Use, perform actions both before and after the next delegate

Middleware is constructed once **per application lifetime** at app startup. 

![Ordering](middleware-invoke.png)

**Startup::ConfigureServices** is optional, 
but usefull to config some service middlewares which used in **Startup::Configure**.

## Reference
[Difference ASP.Net Http Modules and Handlers with ASP.Net Core Middleware](https://docs.microsoft.com/en-us/aspnet/core/migration/http-modules)



---
[ASP.NET MVC - 教程]: http://www.w3school.com.cn/aspnet/mvc_intro.asp
[Introduction to ASP.NET Core]: https://docs.microsoft.com/en-us/aspnet/core/
[Middleware]: https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware
