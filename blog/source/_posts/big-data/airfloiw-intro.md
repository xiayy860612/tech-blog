---
title: Airflow介绍
date: 2020-08-23 20:47:19
categories:
- big data
tags:
- big data
- ETL
- airflow
---

了解airflow的基本元素以及并发控制

<!--more-->

## 基本元素

- DAG, 有向无环图, 用于描述整个处理流程中的任务之间的关系和依赖,
只有定义在globals(全局作用域)的dag才会被airflow扫描到并加载
- Operator, 用于定义任务要去做什么, 尽量保证每个Operator可以独立运行, 没有依赖;
如果不能避免依赖, 则通过xcom/其他存储方式进行参数传递
- default_args, 可被所有相关dag的Operator共享使用
- DAG Run, DAG被触发后生成的具体执行的DAG实例
  - 创建时间
  - execution_date, DAG Run的开始执行时间, 
  在同一个DAG中必须保持唯一, 即在同一个DAG在同一时间只能有一个DAG Run.
- Task, Operator实例
- Task instance, 每次触发Task都会生成一个task instance, 用于记录这次的task运行. 
它拥有很多的状态, 状态的完成生命周期:
  1. no status
  2. scheduled, scheduler已计划将要运行对应的task instance
  3. queued, dispatch将task instance发送对相关的队列上进行排队
  4. Running, worker拿到队列中的任务进行执行
  5. success/failed, 任务完成后

![](airflow-status-flow.png)

## DAG调度

通过在DAG中定义schedule_interval来指定如何调度,
schedule_interval最好指定为预定义的值或者cron表达式

DAG的调度分为:

- 手动触发, 即schedule_interval=None
- 周期性调度
  - backfill and catchup, 根据start_date到现在为止, 来创建过去的Dag Run并依次执行. 
  针对以时间为周期的数据集非常有用.
  - 非回填追赶模式, 即DAG的catchup=False, 不会为过去创建Dag Run.

关于周期性调度的DAG, 它的创建时间为`上一个DAG Run的创建时间+schedule_interval`,
而第一个DAG Run的创建时间为min(start_date),
务必将start_date设置为一个指定的值

## 并发控制

- Pools, 用于控制task instance的并行数,
它由以下元素组成, 默认任务会被分配到default_pool池中, 它的工作槽有128个位置:
  - 工作槽, 用于指定可同时运行的任务数
  - 等待队列, 当工作槽满时, 任务就进入等待队列, 直到工作槽有空闲位置
  - priority_weight, 用于定义队列中的任务优先级以及在工作槽有空闲位置时优先执行哪些任务, 
  默认任务本身的priority_weight为1, 但在评估任务优先级时会计算任务本身及其下游任务的总和.
- Celery Queue, 只在使用CeleryExecutor时才有用, 用于给任务贴标签,
这样工作节点就可以通过标签来筛选要执行哪些任务. 默认任务会被分配到default_queue.

![](airflwo-with-celery.png)

DAG的多维度并发控制的参数:

- airflow.cfg的parallelism, airflow集群中同时运行的最大task instance数量
- airflow.cfg的dag_concurrency, 一个dag run中可以同时执行的task instance数量, 超出则排队;
可以通过DAG的concurrency进行自定义
- max_active_runs, 针对同一个DAG, 同一时间最多运行几个DAG Run,
如果没有设置, 默认读取airflow.cfg的max_active_runs_per_dag
- task_concurrency, 控制Operator对应的task同一时间最多运行几个task instance
- pool, 指定task的Pools, 通过Pools来控制某类task的最大并发数

调度的并发控制参数:

- airflow.cfg的max_threads, 调度线程数, 可以设置为CPU数-1
- airflow.cfg的scheduler_heartbeat_sec, scheduler扫描task并将task调度起来的频率