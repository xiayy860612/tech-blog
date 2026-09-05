# Http Method 和 状态码

## Http Method

### GET

用来请求已被URI识别的资源, 通过报文的body部分返回.

### POST

用来传输实体的主体, 用于创建新实体.

### PUT

用来传输文件到URI指定的位置, 用于创建或替换指定资源.

HTTP/1.1的PUT方法自身不带验证机制, 即任何人都可以上传, 存在安全性问题, 
需要应用本身提供验证机制.

### PATCH

用于部分修改URI指定的资源

### HEAD

用来请求URI对应资源的信息, 但不返回资源的内容, 
主要用于确认URI的有效性以及资源的一些信息.

### DELETE

用于删除URI指定位置的资源, 需要应用本身提供验证机制.

### OPTIONS

查询针对指定URI资源所支持的HTTP方法.

### TRACE

获取从客户端到服务器之间的请求通信环, 用于确认连接过程种发生的一系列操作

### CONNECT

要求在与代理服务器通信时建立隧道, 实现隧道协议进行TCP通信.

## Reference

- [Hypertext Transfer Protocol (HTTP/1.1): Semantics and Content](https://tools.ietf.org/html/rfc7231)
- [PATCH Method for HTTP](https://tools.ietf.org/html/rfc5789)