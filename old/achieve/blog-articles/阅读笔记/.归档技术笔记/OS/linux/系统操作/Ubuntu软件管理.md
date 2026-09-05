# Ubuntu 软件管理操作

绝大部分的linux发行版本分别属于两大包管理阵营:

- Debian的deb
- Red Hat的rpm

Ubuntu属于Debian系列, 内部集成了**dpkg和apt**来对安装软件进行管理.

deb软件包的格式: `<package>_<version>-<build>_<architecture>.deb`

## dpkg

dpkg相关的配置文件:

- /etc/dpkg/dpkg.cfg, dpkg包管理软件的配置文件
- /var/log/dpkg.log, dpkg包管理软件的日志文件
- /var/lib/dpkg/available, 存放系统所有安装过的软件包信息
- /var/lib/dpkg/status, 存放系统现在所有安装软件的状态信息
- /var/lib/dpkg/info, 安装软件包控制目录的控制信息文件
- /var/lib/dpkg/info/*.list, 相应软件的安装目录清单

### 查看已安装列表

`dpkg -l`, 显示所有已安装的Deb包

```
$ dpkg -l

||/ Name           Version      Architecture Description
+++-==============-============-============-=================================
ii  adduser        3.116ubuntu1 all          add and remove users and groups
...

```

- 第一列为期望值, Unknown(u)/Install(i)/Remove(r)/Purge(p)/Hold(h)
    - Unknown(u), 软件包未安装,并且用户也未发出安装请求
    - Install(i), 用户请求安装软件包
    - Remove(r), 用户请求卸载软件包
    - Purge(p), 用户请求清除软件包
    - Hold(h), 用户请求保持软件包版本锁定
- 第二列为当前状态
    - Not(n), 软件包未安装
    - Inst(i), 软件包安装并完成配置
    - Conf-files(c), 软件包以前安装过,现在删除了,但是它的配置文件还留在系统中
    - Unpacked(u), 软件包被解包,但还未配置
    - halF-conf(f), 试图配置软件包,但是失败了
    - Half-inst(h), 软件包安装, 但是没有成功
    - trig-aWait(w), 触发器等待
    - Trig-pend(t), 触发器未决
- 第三列标识错误状态
    - None(空), 没有问题
    - h, 软件包被强制保持,因为有其它软件包依赖需求,无法升级
    - Reinst-required(r), 软件包被破坏,可能需要重新安装才能正常使用(包括删除)
    - x, 软包件被破坏,并且被强制保持

`dpkg -L <package>`, 查看软件包的安装目录清单

### 搜索程序

`dpkg -l <pattern>`, 搜索符合pattern的软件包

```
# 查找所有包含vim字符的软件包
$ dpkg \*vim*
```

`dpkg -S <pattern>`, 从已安装的软件包中搜索

### 安装和升级程序

`dpkg -i <package>.deb`, 安装指定的包

### 卸载程序

`dpkg -r <package>`, 移除软件, 但保留配置文件

`dpkg -p <package>`, 彻底删除软件以及相关配置文件

## apt

apt在dpkg的基础上, 解决了自动安装包依赖问题

apt相关的配置:

- /etc/apt/sources.list, 软件源的地址配置, 可同时配置多个软件源, 安装时会选择各个源中的最新版本
- /var/lib/apt/lists/, 软件源的信息缓存
- /var/apt/sources.list.d/, 第三方软件的源

### 更新软件源在本地的缓存

`apt-get update`, 更新本地的软件源信息缓存

### 查看

`apt-cache show <package>`

### 搜索

`apt-cache search <pattern>`

### 安装

`apt-get install <package>(=<version>)`, version可选

`apt-get upgrade <package>`, 升级软件

`apt-get dist-upgrade`, 升级系统

### 卸载

`apt-get remove/purge <package>`, 类似dpkg

`apt-get autoclean`, 删除已经删除的软件包, 可以释放硬盘空间

## Reference

- [Linux软件安装管理之——dpkg与apt-*详解](https://segmentfault.com/a/1190000011463440)