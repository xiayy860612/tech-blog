# Configuration

理解ServiceStack中的[Configuration](http://docs.servicestack.net/appsettings)的设计
<!--more-->

## 特点
- 能够加载不同source的配置, 以**key-value**进行管理
- 能在不同的环境中使用正确的配置
- 能够读取的json格式配置映射到POCO的配置类, 解耦不同的配置类
- 支持配置的读写
- 当配置发生改变时, 无法热更新

## 示例

    IAppSettings AppSettings = new MultiAppSettings(
        new EnvironmentVariableSettings(),
        new TextFileSettings("~/appsettings.txt".MapHostAbsolutePath()),
        new AppSettings()
    );

## 设计

[ServiceStack Configuration](https://www.processon.com/view/link/58da228ee4b03eea784326cb)

### 关键的类

- IAppSettings, 定义配置管理类的基本操作
- AppSettingsBase, 配置管理类的基本实现, 通过ISettings/ISettingsWriter来读写配置
- ISettings, 负责操作source, 只读, 从source读取配置
- ISettingsWriter, 集成ISettings, 可读写, 对配置进行读写
- ParsingStrategyDelegate, 对读取的配置进行处理
