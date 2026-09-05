# Java --- 时间探索

Java 8 引入了新的时间模块java.time,
以穿过英国格林尼治天文台的本初子午线所处时区(UTC+0时区)的
**1970.1.1 00:00::00**作为新纪元的时间原点, 通常称为epoch时间.

而Java的Instant表示以epoch为原点的时间线上的某个时间点, 是一个绝对时间.

```
见源码:

public static Instant now() {
    return Clock.systemUTC().instant();
}
```

使用Duration来计算两个Instant之间的时间差.

Java有三种种时间

- 绝对时间, 以epoch为原点的时间间隔, 通常用ms来描述
    + System.currentTimeMillis
    + Instant
- 本地时间, 不包含时区信息, 只是纯粹的时间信息
- 时区时间, 包含时间信息和时区信息,
时区信息来源于[IANA数据库](http://www.iana.org/time-zones)

本地时间+时区 => 时区时间 <=> Instant时间

```
// 本地时间
LocalDateTime date = LocalDateTime.of(year, month, day, hour, 0);
System.out.println(date);

// 本地时间不包含将时区信息, 可设置为任意时区, 但时间信息不会发生变化
ZonedDateTime zdt = date.atZone(ZoneId.of("UTC+9"));
System.out.println(zdt);
assertEquals(hour, zdt.getHour());

zdt = date.atZone(ZoneId.of("UTC+7"));
System.out.println(zdt);
assertEquals(hour, zdt.getHour());
```

## 时间的格式化

两种比较常用的时间标准

- ISO8601, 格式`yyyy-MM-ddTHH:mm:ss.sssZ`
- RFC822/RFC1123, 格式`Wed Mar 25 2015 09:56:24 GMT+0100`

关于这两种标准的说明, 请见:
[时间的探索之旅 --- Java篇](https://github.com/xiayy860612/pure-blog-content/blob/master/content/IT-Chat/Language/java/Time.md)

Java8使用**DateTimeFormatter**来进行格式化时间.

## java.util.Date && java.sql.Date

这俩个都是老的SDK里的时间模块, 其中java.sql.Date只用于sql语句而且只保存日期信息,
过去我们一般都是用java.util.Date用来表示时间.

java.util.Date如果没有显式设置时区的话, 默认使用系统设置的默认时区.

```
// 设置Date的默认时区
TimeZone.setDefault(TimeZone.getTimeZone(ZoneId.of("GMT+7")));
```

设置时区差值字符串时使用**GMT**, 不要使用**UTC**,
因为UTC有些库会解析不出来, 比如TimeZone.getTimeZone.

SimpleDateFormat用来解析指定时区的时间,
如果没有显式设置时区, 则使用系统时区.

## Reference

- [Java Formatter](https://docs.oracle.com/javase/8/docs/api/java/util/Formatter.html)
- [java处理时区的注意事项](https://blog.csdn.net/wangpeng047/article/details/8560690)
