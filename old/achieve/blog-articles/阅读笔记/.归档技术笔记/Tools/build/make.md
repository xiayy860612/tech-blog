# GNU make

通过配置Makefile, 使用make对C++工程进行构建
<!--more-->

默认的情况下,make命令会在当前目录下按顺序找寻文件名为“GNUmakefile”,“makefile”,“Makefile”的文件,找到了就解析这个文件.
推荐最好使用“Makefile”这个文件名.

当文件名不是Makefile时, Makefile文件比较常用的后缀有"mk", "make"等.

## Grammar

    targets : prerequisites
            command
            ...

Recommend to declare **fake target** into **.PHONY**

if next command depends on previous command, these commands should be one line and split with "**;**".

When any error raise, make will be interrupted.

Use "**-**" before command could ignore error raised by command and make will go on.

make支持三个通配符：“*”，“?”和“~”。

### Variant

1. Variant should be initialized when declaration, use **=**, **:=** to initialization. 
the difference is **=** could use variants defined later, **:==** only use defined variants.

    objs = test.o foo.o

2. Invoke variant by **$(variant) or ${variant}**, use its value to replace. **variant** is only a placeholder.

#### Auto Variant
- $?, 比目标新的依赖目标的集合
- $@, 目标文件集
- $<, 依赖目标prerequist

### Function

    $(<function> <arguments>)

arguments is splited by **,**

#### Command Macro
Use **define/endef** to define a command which could be resued.

    define <command name>
    command
    ...
    endef

### 自动推导(Auto-Deduction)



### Makefile Include
为了让构建更加清晰和更好的维护, 将构建拆分成多个Makefiles, 然后根据需求通过组合进行构建.

    # filename可以是当前操作系统Shell的文件模式, 可以包含路径和通配符.
    # 包含多个文件时, 用一个或多个空格隔开
    include <filename>;

#### 文件搜索

文件搜索路径在**VPATH**变量中设置, 由":"分割.

    VPATH = src:../headers

或者在**vpath**关键字设置

    vpath <pattern> <directories>

    # Example
    vpath %.c foo
    vpath %.c blish

## Reference
- [GNU make](https://www.gnu.org/software/make/manual/html_node/index.html#SEC_Contents)
- [跟我一起写Makefile](http://wiki.ubuntu.org.cn/%E8%B7%9F%E6%88%91%E4%B8%80%E8%B5%B7%E5%86%99Makefile)