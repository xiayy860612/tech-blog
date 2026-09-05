# Async Programming Pattern

C#的异步编程模型
<!--more-->

## Task-based Asynchronous Pattern([TAP][])
TAP is based on the **System.Threading.Tasks.Task**
and **System.Threading.Tasks.Task<TResult>** types
in **System.Threading.Tasks** namespace.

## Event-based Asynchronous Pattern([EAP][])
Asynchronous method is end with **Async**
- event handler end with **EventHandler**
- event arguments end with **EventArgs** from **AsyncCompletedEventArgs**

## Asynchronous Programming Model([APM][])
Asynchronous operation uses **IAsyncResult** design pattern
is implemented as two methods named **Begin OperationName and End OperationName**
that begin and end the asynchronous operation OperationName respectively.

---
[TAP]: https://msdn.microsoft.com/en-us/library/hh873175(v=vs.110).aspx
[EAP]: https://msdn.microsoft.com/en-us/library/ms228969(v=vs.110).aspx
[APM]: https://msdn.microsoft.com/en-us/library/ms228963(v=vs.110).aspx
