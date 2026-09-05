# String

字符串由char序列组成, char是采用的UTF-16编码的Unicode码.

**String类对象是不可变对象,
对String对象的任何改变都不影响到原对象，
相关的任何change操作都会生成新的对象.**

字符串比较:

- ==, 用来比较两个字符串的**存储位置**是否相同, 即检查是否同一个对象
- equals, 用来比较两个字符串的**值**是否相等

字符串字面量存储在jvm虚拟机的常量池里, 能够快速读取, 只读.

```
// "hello"为字符串字面量, 存储在jvm的常量池里
String s0 = "hello";
```

## 字符串的构建StringBuffer, StringBuilder

String字符串可以通过+, contact来进行拼接生成一个新的String对象

- contact只能拼接字符串
- 使用+进行字符串拼接时, 不管后者是不是字符串, 总是会被转换为字符串,
但效率低, 会被编译器转换为StringBuilder来进行拼接


```
String s0 = "hello";
String s1 = s0 + 123;

反编译:
   0: ldc           #2		// String hello
   2: astore_1
   3: new           #8		// class java/lang/StringBuilder
   6: dup
   7: invokespecial #9		// Method java/lang/StringBuilder."<init>":()V
  10: aload_1
  11: invokevirtual #10		// Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
  14: bipush        123
  16: invokevirtual #11		// Method java/lang/StringBuilder.append:(I)Ljava/lang/StringBuilder;
  19: invokevirtual #12		// Method java/lang/StringBuilder.toString:()Ljava/lang/String;
  22: astore_2
```

推荐直接使用StringBuilder来进行字符串拼接.

StringBuilder和StringBuffer的区别在于StringBuffer是线程安全的,
所以如果不需要再多线程中进行字符串拼接的话, 就使用StringBuilder.

字符串字面量的拼接操作会被jvm优化, 而如果有引用变量的拼接不会被优化.
而对于被final修饰的变量，会在常量池中保存一个副本，
对final变量的访问在编译期间都会直接被替代为真实的值。

```
String s2 = "hello123";
// 直接使用字符串字面量拼接
String s3 = "hello" + 123;

反编译:
0: ldc           #13                 // String hello123
2: astore_1
3: ldc           #13                 // String hello123
5: astore_2

```

```
String s0 = "hello";
// 使用引用变量s0进行拼接
String s1 = s0 + 123;

反编译:
0: ldc           #2		    // String hello
2: astore_1
3: new           #8		    // class java/lang/StringBuilder
6: dup
7: invokespecial #9		    // Method java/lang/StringBuilder."<init>":()V
10: aload_1
11: invokevirtual #10		// Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
14: bipush        123
16: invokevirtual #11		// Method java/lang/StringBuilder.append:(I)Ljava/lang/StringBuilder;
19: invokevirtual #12		// Method java/lang/StringBuilder.toString:()Ljava/lang/String;
22: astore_2
```

```
String s0 = "hello123";
final String s1 = "hello";
// 使用final变量s1进行拼接, 编译期间引用s1的地方都会直接被替代为"hello"字面量。
String s2 = s1 + 123;
assertTrue(s0 == s2);

反编译:
0: ldc           #13                 // String hello123
2: astore_1
3: ldc           #2                  // String hello
5: astore_2
6: ldc           #13                 // String hello123
8: astore_3
```

## Reference

- [探秘Java中的String、StringBuilder以及StringBuffer](https://www.cnblogs.com/dolphin0520/p/3778589.html)





