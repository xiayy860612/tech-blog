# Future && Promise

## Future

Future是一种用于指代某个尚未就绪的值而被当成 **只读占位符** 的对象类型。
而这个值，往往是某个计算过程的结果:

- 若该计算过程尚未完成，我们就说该Future未就位
- 若该计算过程正常结束，或中途抛出异常，我们就说该Future已就位。

Future的就位分为两种情况:

- 计算成功
- 抛出异常

**Future只能被赋值一次. 一旦给定了某个值或某个异常，future对象就变成了不可变对象——无法再被改写。**

Future是一种特殊的Event，它只能被计算一次，而Event可以被reset，然后重新使用。

## Promise

Promise是 **可写的**，用于构建Future，一旦构建则不能更改。

**一个 Future 实例总是和一个（也只能是一个）Promise 实例关联在一起,
以确保 Promise 和 Future 之间一对一的关系。**

## Reference

- [Wiki --- Futures and promises](https://en.wikipedia.org/wiki/Futures_and_promises)
- [Future](http://docs.scala-lang.org/zh-cn/overviews/core/futures.html)
- [实战中的 Promise 和 Future](https://windor.gitbooks.io/beginners-guide-to-scala/content/chp9-promises-and-futures-in-practice.html)
