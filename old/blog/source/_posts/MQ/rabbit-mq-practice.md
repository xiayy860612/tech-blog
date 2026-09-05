---
title: RabbitMQ 开发实践
date: 2021-12-23 20:47:19
categories:
- MQ
tags:
- MQ
- event
---

快速熟悉RabbitMQ的元素, 以及开发相关的最佳实践总结.

<!--more-->

![](rmq-modal.png)

## 声明Exchange和Queue

Exchange负责对消息的路由, 而Queue负责对消息的存储.

### Exchange

Exchange主要有以下几种路由方式:

- fanout, 分发到所有绑定的Queue中
- direct, 只分发到路由键完全匹配的Queue中
- topic, 分发到和路由键匹配的Queue中

Exchange的常用属性:

- durable, 对于长期使用的交换器设置为true, 保证服务重启后仍然存在.
- auto delete, 对于长期使用的交换器设置为false
- internal, 用于Broker内部的路由, 对于同客户端连接的交换器设置为false, AE可设置为true.

### Queue

交换器的使用并不真正消耗服务器的性能,
但队列会, 所以需要更加关注队列的设计,
需要对队列的流量, 内存占用以及网卡占用要有一个清晰的评估,
预估其平均值和峰值, 以便合理分配硬件资源.

Queue的主要属性:

- durable, 设置为true, 则服务重启后队列信息仍然存在; 配合消息的持久化, 可以保证服务重启后消息不丢失.
- exclusive, true则仅对声明它的连接可见, 断开时自动删除; 一般情况下设置为false
- auto delete, 一般设置为false
- 队列中消息的TTL, 通过x-message-ttl来设置, 最终消息的TTL=min(队列中消息的TTL, 消息设置的TTL), 消息过期后则变为死信(Dead Message)

当一个队列有多个消费者时, 队列中的消息会被平均分摊(Round-Robin, 即轮询)
给多个消费者进行处理, 而不是每个消费者都收到所有的消息并处理.

通过路由键(Route Key)将Exchange和Queue进行绑定.

Queue的应用:

- 死信队列, 需要配合死信交换器(DLX), 当消息过期后会被路由到死信队列
- 延迟队列, 通过死信队列+消息的TTL来实现
- 优先级队列
- RPC队列

### 备用交换器(AE, Alternate Exchange)

为了防止消息丢失, 一般建议配置AE,
当交换器无法路由消息到指定的队列时, 会将消息路由到AE,
由AE保存到与它绑定的队列中,
之后在修复后, 通过工具将这些丢失的消息重新入队.

### 基本模板

```java
// AE声明
channel.exchangeDeclare(RabbitMQConfig.AE, BuiltinExchangeType.FANOUT,
    false, false, true, null);
channel.queueDeclare(RabbitMQConfig.AE_QUEUE,
    true, false, false, null);
channel.queueBind(RabbitMQConfig.AE_QUEUE, RabbitMQConfig.AE, "");

// Exchange和Queue声明
Map<String, Object> args = new HashMap<>();
args.put("alternate-exchange", RabbitMQConfig.AE);
channel.exchangeDeclare(RabbitMQConfig.EX, BuiltinExchangeType.DIRECT,
    true, false, false, args);
channel.queueDeclare(RabbitMQConfig.EX_QUEUE,
    true, false, false, null);
channel.queueBind(RabbitMQConfig.EX_QUEUE, RabbitMQConfig.EX, 
    RabbitMQConfig.EX_QUEUE_ROUTE_KEY);
```

### Message

生产者创建的消息分为两部分:

- 消息标签, 包含路由相关的信息
- 消息体, 消息的内容, 可以被Queue保存

消息的常用属性:

- durable, 通过设置deliverMode为2, 可实现消息的持久化; 
对于可靠性/重要性不是那么高的消息不采用持久化处理, 以提高系统的吞吐量
- 消息的TTL, 通过设置expiration参数

### Connect && Channel

客户端需要和RabbitMQ建立TCP Connection, 建立后会创建AMQP信道(Channel),
并被指派一个唯一的ID.
Channel是建立在Connection上的虚拟连接, 用于处理AMQP指令.

建立/销毁TCP连接是非常大的开销, 高峰时, 性能瓶颈也就随之出现.
所以RabbitMQ采用类似NIO的做法, 对TCP连接进行复用.

建议客户端采用连接池, 将Channel均摊到池中的Connection上;
每个线程持有一个Channel.

为了当发生阻塞时可以在阻止生产者的同时, 又不影响消费者的运行,
建议生产者和消费者的逻辑使用不同的Connection.

## 实现Publisher

为了避免发送方的消息丢失, RabbitMQ提供了以下几种机制:

- 发送消息时设置mandatory, 当交换器无法找到复合条件的队列时, 通过Basic.Return将消息返回给生产者; 如果交换器存在AE, 则mandatory失效.
- 事务机制, txSelect/txCommit/txRollback, 每次只能处理一条消息, 在消息发送后会**阻塞**发送端, 
等待RabbitMQ的回应, 回应提交成功, 则表明消息已经到达RabbitMQ;
如果发生任何异常, 发送端可以捕获异常并进行回滚;
它**严重降低了RabbitMQ的消息吞吐量**.
- 发送方确认机制, confirmSelect该模式下, 发布的消息都会被指派唯一ID,
消息到达匹配队列后, RabbitMQ会发送Basic.Ack并携带消息的唯一ID, 使发送方知道消息已经正确到达;
如果内部发生错误, 则会发送Basic.Nack告知发送方.

推荐使用**异步的发送方确认机制**的方式来批量发送消息.

## 实现Consumer

消费端有两种消费模式:

- Push模式, RabbitMQ主动向订阅的消费者推送消息, 适用于吞吐量大的情况;
不同的订阅消费者采用唯一标签(consumerTag)来区分.
- Pull模式, 消费者从RabbitMQ拉取消息, 适用于吞吐量少的情况

为了保证消息从队列可靠的到达消费者, RabbitMQ提供了消息确认机制(Message Acknowledge).
通过设置auto ack为false, 让消费者有足够的时间处理消息,
处理完毕后再显式的发送Basic.Ack给RabbitMQ,
然后RabbitMQ才从内存/磁盘中移除消息(实际上是先打上删除标记, 之后再删除).
如果设置为true, 则RabbitMQ发送消息后就会将其从内存/磁盘中移除.

RabbitMQ队列中的消息分为两个部分:

- Ready, 等待投递给消费者的消息
- Unacked, 已经投递给消费者, 但还没有收到确认信号的消息

如果一直没有收到消费者的确认信号, 并且消费者断开了连接,
RabbitMQ则会安排该消息重新进入队列, 等待投递给下一个消费者,
确保消息被正确的消费.

RabbitMQ判断此消息是否重新投递给消费者的唯一依据是消费该消息的消费者连接是否断开,
因为RabbitMQ允许消费者消费一条消息的时间可以很久.

通过Basic.Qos来对消费者端的吞吐量进行控制,

- global为false模式时, 针对每个消费者进行限制
- global为true模式时, 针对一个Channle中所有的消费者做限制

如果同时设置了两种模式, 则同时生效,
即对信道中的每一个消费者做限制, 也对信道中的总数做限制.
一般需要根据节点的性能进行配置.

## Reference

- [RabbitMQ实战指南](https://book.douban.com/subject/27591386/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
