# ECMAScript Introduction

ECMAScript是由ECMA-262标准化的脚本语言的名称，
弱类型的语言，可以为不同种类的宿主环境提供核心的脚本编程能力.

JavaScript由3部分组成：
- ECMAScript，作为JavaScript的核心， 描述了该语言的语法和基本对象。
- DOM
- BOM
<!-- more -->

# 历史发展
1. 2011.6，ECMAScript 5.1
2. 2015.6，ECMAScript 6

# 变量命名
变量名需要遵守两条简单的规则：
- 第一个字符必须是字母、下划线（_）或美元符号（$）
- 余下的字符可以是下划线、美元符号或任何字母或数字字符

# 基本语法
- ECMAScript 的解释程序遇到未声明过的标识符时，
用该变量名创建一个全局变量，并将其初始化为指定的值。
- undefined表示声明了变量但未对其初始化时赋予该变量的值
- null表示尚未存在的对象
- NaN表示非数(Not a Number), 一般发生在类型(String, Boolean等)转换失败时; 
NaN 的另一个奇特之处在于，它与自身不相等
- 变量可以存在两种类型的值，即原始值和引用值。
    + 原始值，存储在栈（stack）中的简单数据段，
    也就是说，它们的值直接存储在变量访问的位置。
    + 引用值， 存储在堆（heap）中的对象，
    也就是说，存储在变量处的值是一个指针（point），指向存储对象的内存处。
- 原始类型：Undefined、Null、Boolean、Number 和 String，原始类型占据的空间是固定的
- 类的2个属性，类的属性和方法的绑定为晚绑定
    + constructor用于创建实例
    + prototype用于定义类的属性和方法
- [类的定义和创建](http://www.w3school.com.cn/js/pro_js_object_defining.asp)
    + 混合的构造函数/原型方式
    + 动态原型方法
- [类的继承](http://www.w3school.com.cn/js/pro_js_inheritance_implementing.asp)
    + 对象冒充
    + 原型链, 用另一类型的对象重写类的prototype属性
    + 对象冒充和原型链混合

# 特性
## let and const
ES6明确规定，如果区块中存在let和const命令，这个区块对这些命令声明的变量，
从一开始就形成了封闭作用域。凡是在声明之前就使用这些变量，就会报错。
这在语法上，称为“暂时性死区”（temporal dead zone，简称TDZ）。

ES6规定暂时性死区和let、const语句**不出现变量提升**，主要是为了减少运行时错误，
防止在变量声明前就使用这个变量，从而导致意料之外的行为。


# Reference
- [JavaScript 高级教程](http://www.w3school.com.cn/js/index_pro.asp)
- [ECMAScript 6入门](http://es6.ruanyifeng.com/), 阮一峰
