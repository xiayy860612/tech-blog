# Web中常见的认证机制

## [Http Basic Auth](https://zh.wikipedia.org/wiki/HTTP%E5%9F%BA%E6%9C%AC%E8%AE%A4%E8%AF%81)

Basic Auth在请求资源时提供**用户名和密码**形式的一种**无状态**认证方式, 
基于**请求-响应（challenge-response）模式**

格式: base64(用户名:密码)

当访问一个受保护的服务器资源(realm)时, 服务器返回**401**并且响应头中包含被保护的资源名称

```
HTTP/1.1 401 Unauthorized
...
WWW-Authenticate: Basic realm="Protected page"
```

如果客户端想要访问该资源, 则需要在请求头中发送认证信息

```
Authorization: Basic QWRlcGxveSdzIGJsb2c=

QWRlcGxveSdzIGJsb2c=: base64(用户名:密码)
```

Basic Auth虽然简单, 但不安全, 可以被拦截后破解; 
并且由于认证信息保存在浏览器端, 导致服务器无法主动让用户登出.

## Http Digest Auth

Digest Auth在http 1.1中提出, 用于替代Basic Auth, 解决安全问题, 
也是基于**请求-响应（challenge-response）模式**

当用户访问受保护的资源时, 服务器返回401并且响应头包含一些信息

```
HTTP/1.1 401 Unauthorized
...
WWW-Authenticate: Digest realm="TestDigest",nonce="c7237893-4eca-478e-b016-548f7998933b",algorithm=MD5,qop="auth", opaque="cdce8a5c95a1427d74df7acbf41c9ce0"
```

- qop, 鉴别方式
- nonce, 服务器端生成的**唯一**的密码随机数, **有限的生命期**, 过期无效; 
RFC 2671建议采用nonce = BASE64(time-stamp MD5(time-stamp “:” ETag “:” private-key))
- opaque, 不透明的数据字符串，在盘问中发送给客户端，客户端会将这个数据字符串再发送回服务端器
- stale, nonce过期标志，值为true或false

客户端需要在请求头中包含从必要的响应头中获取的信息

```
GET /Auth HTTP/1.1
...
Authorization: Digest username="LiPing",realm="TestDigest",qop="auth",algorithm="MD5",uri="/Auth",nonce="c7237893-4eca-478e-b016-548f7998933b",nc=00000001,cnonce="L0RGJ52PLai068jYU55G036655qZF6D7",response="9471d8765dc5c88a78829b2e2e6eb7dd"
```

- response, 通过一定的加密算法来对口令进行加密

## Cookie/Session

Cookie和Session是为了在无状态的HTTP协议之上维护会话状态，
使得服务器可以知道当前是和哪个客户在打交道。

Cookie保存于**浏览器**, 有被篡改的安全隐患, 一般保存非敏感的用户数据.
服务器通过响应头中的**Set-Cookie字段**来告知浏览器设置Cookie, 
浏览器通过请求头中的Cookie字段来告诉服务器相关的用户信息.

Cookie不允许跨域访问(CORS), 需要防范跨站请求伪造(CSRF).

Session是借由Cookie而实现的更高层的服务器与浏览器之间的会话。

Session存储在**服务器端**, 在认证通过后, 将SessionId存放到Cookie中;
之后客户端可以在请求头的Cookie字段中发送SessionId到服务器, 
服务器根据SessionId来取出相应的用户数据.

## Token

相较于Cookie机制的优势:

- 支持跨域
- 无状态, token中包含用户信息, 不需要在服务器端保存session信息

### JSON Web Token（JWT)

JWT是Token机制的一个标准化的实现, 允许我们使用JWT在用户和服务器之间传递安全可靠的信息。

JWT由3部分组成:

- header, 头部会通过base64进行加密
    - 类型typ, 一般为jwt
    - 加密算法alg, 一般为HMAC SHA256
- playload, 存储有效信息
    - 

## OAuth




## Reference

- [Web开发中常见的认证机制](https://segmentfault.com/a/1190000008676243)
- [RFC 2617 - HTTP Authentication: Basic and Digest Access Auth](http://www.faqs.org/rfcs/rfc2617.html)
- [HTTP认证模式：Basic and Digest Access Authentication](https://www.cnblogs.com/XiongMaoMengNan/p/6671206.html)
- [web安全认证机制知多少](https://blog.csdn.net/wangyangzhizhou/article/details/51336038)
