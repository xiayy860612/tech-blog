---
title: HTTPS的安全性
date: 2023-11-21 17:47:19
categories:
- it
tags:
- https
- ssl
---

Https相较于Htp主要增加了通信的安全性。主要指：

- 所有信息都是**加密**传播，第三方无法窃听。
- 具有**校验机制**，一旦被篡改，通信双方会立刻发现。
- 配备**身份证书**，防止身份被冒充。

<!--more-->

## 加密

Https中的加密主要分为2块：

- 握手阶段的加密， 使用非对称加密技术（例如RSA等）对pre-master key的加密
- 通信阶段的加密，使用会话密钥对通信内容进行加密，会话密钥采用对称加密技术，例如DES等

### 握手过程

```puml
participant Client as C
participant Server as S
participant CA

== 握手阶段 ==
== 握手阶段---明文 ==
C --> S: 发出加密通信的请求, 包括SSL/TLS version, 客户端生成的**随机数**， 支持的加密方法和压缩方法
S --> C: 确认使用的加密通信协议版本， 服务器生成的**随机数**， 确认使用的加密方法， 服务器证书
C --> CA: 验证服务器证书
C --> C: 从证书中取出服务器的公钥
== 握手阶段---密文 ==
C --> S: 用服务器公钥加密的**随机数（pre-master key）**， 编码改变通知, 客户端证书， 客户端握手结束通知
C --> C: 用三个随机数基于确认的加密方法生成一个**对称密钥**作为会话密钥
S --> S: 用服务器私钥解密获得随机数（pre-master key）， 用三个随机数基于确认的加密方法导出一个对称密钥作为会话密钥
S --> C: 编码改变通知， 服务器握手结束通知

== 使用会话密钥对http进行加密 ==
```

- 整个握手阶段都不加密（也没法加密），都是明文的。
整个通话的安全，只取决于第三个随机数（Premaster secret）能不能被破解
- CA证书
- 会话密钥，**对称加密**生成, 用三个随机数通过密钥导出器最终导出一个对称密钥
- 服务器的公钥和私钥， **非对称加密**生成， 整个会话过程只使用**一次**， 用于加密和解密"会话密钥"

### 会话恢复

- session id, 只保留在一台服务器上
- session ticket, 加密的，只有服务器才能解密，其中包括本次会话的主要信息，比如会话密钥和加密方法。
当服务器收到session ticket以后，解密后就不必重新生成会话密钥了。

## 报文完整性的校验机制

使用散列算法来计算哈希值，用于完整性的校验。
主要使用以下散列算法

- MD5，生成128bit的散列
- SHA-1，生成160bit的散列

## 报文机密性

报文的机密性用于进行**端点校验**，不是必要的，
取决于应用的场景，常见于金融领域

### 报文鉴别码MAC

有些通信需要保证通信双方的机密性，防止中间人冒充通信双方。

鉴别密钥只有通信双方知道，通过将鉴别密钥和报文内容一起进行散列计算，然后发送给对方。

### 数字签名

使用数字签名作为鉴别密钥，而非对称加密可用于实现数字签名。

由于私钥只有生成密钥对的人保留，通过使用私钥对报文的散列码进行加密处理生成数字签名，
然后将报文以及数字签名一起发送给对方;
接收方使用公钥对报文散列码进行解密，解密成功则保证了报文的完整性，也验证了发送方是指定的对象。

数字签名需要依赖具有认证中心支撑的公钥基础设施PKI。

#### 公钥认证

公钥认证，即证实一个公钥属于某个特定的实体。
而将公钥和特定实体绑定通常由**认证中心CA**完成，它的职责就是使识别和发行**证书**合法化。
它的主要职责：

- 证实一个实体的真实身份
- 负责生成一个将身份和公钥绑定的证书，即CA Certificate

```puml
participant Owner as O
participant User as U
participant CA

O --> O: generate public key and private key
O --> CA: generate CA certificate with public key
U --> O: get owner's CA certificate
U --> CA: verify CA certificate
U --> U: get public key from CA certificate
U --> U: use public key to encrypt data
U --> O: send encrypt data
O --> O: decrypt data by private key
```

涉及几个关键元素：
- CA证书
- 公钥
- 私钥，私钥只保存在拥有者那

## SSL证书格式

公钥证书的格式标准为**X509**，可使用openssl工具进行处理

编码格式：
- DER编码, 二进制格式
- PEM编码, ASCII文本格式，经过base64处理

各种文件类型：
- .DER .CER，文件是**二进制格式**，只保存证书，不保存私钥，多用于Java和Windows服务器端
- .PEM，一般是**文本格式**，可保存证书，可保存私钥; 常用语apache/nginx
- .CRT，可能使用PEM编码，也可能使用DER编码，不保存私钥。
- .PFX .P12，二进制格式，同时包含证书和私钥，一般有密码保护; 一般用于Windows IIS以及Mac。
- .JKS，二进制格式，同时包含证书和私钥，一般有密码保护; java专用格式，使用keytool进行处理，一般用于tomcat服务器

### 证书链

证书链(certificate chain)可以有任意长度，但证书链越长，加载速度越慢，信任度越差。
合规SSL证书一般有3层：根证书、中间证书、服务器证书。

在验证证书的有效性的时候，会逐级去寻找签发者的证书，直至根证书为结束，
然后通过公钥一级一级验证数字签名的正确性。

### openssl 常用命令

```bash
# 获取证书
openssl s_client -showcerts -connect <server host>:443

# 查看证书
openssl x509 -noout -text -in <certificate file>

# 校验证书
openssl verify -CAfile <certificate chain file> <certificate file>

# 将pem转换为der, 或者从der转换为pem
openssl x509 -inform <pem/der> -in <input certificate file> -outform <der/pem> -out <out certificate file>
```

### Java证书管理

在Java中通过keytool来对证书以及密钥进行管理，证书的格式为jks

- keystore, 一般存储**自己的私钥和公钥**，需要**密码保护**，不可被分享, 向客户端提供所需的证书和公钥信息
- truststore， 本质上也是keystore, 只是用来存储**信任对象的公钥**， 可被分享，用于验证服务端是否可信

```bash
# 查看证书
keytool -list -keystore <keystore file>

# 添加证书
keytool -import -alias <alias name> -file <certificate file> -keystore <keystore file>

# 删除证书
keytool -delete -keystore <keystore file> -alias <alias name>
```

## 参考

- [SSL/TLS协议运行机制的概述](https://www.ruanyifeng.com/blog/2014/02/ssl_tls.html) 
- [SSL 证书格式普及，PEM、CER、JKS、PKCS12](https://blog.freessl.cn/ssl-cert-format-introduce/)
