# Concurrency - [Thread][Managed Threading]

.Net provides some [Concurrency Mechanisms][Parallel Processing and Concurrency in the .NET Framework] such like [Managed Thread][Managed Threading].

<!--more-->

The .NET Framework subdivides an operating system process into lightweight managed subprocesses, called **application domains represented by System.AppDomain**.

A managed thread can move freely between different application domains
inside the same managed process.

Uhandled exception causes the application to terminate.

lock with private object instead of class type or instance,
because a class or instance can be locked by code potentially
causing deadlocks or performance problems.

## [Foreground and Background Threads][]
Background thread does not keep the managed execution environment running.
Once all foreground threads have been stopped in a managed process,
the system stops all background threads and shuts down.

## [Apartments][Processes, Threads, and Apartments]
- [Single-threaded apartments(STA)][Single-Threaded Apartments]
- [Multithreaded apartments(MTA)][Multithreaded Apartments]

## Thread Local Storage(TLS)
Whether use thread-relative static fields or data slots,
data in managed TLS is unique to the combination of **thread and application domain**.

Not rely on class constructors to initialize thread-relative static fields.
Avoid initializing thread-relative static fields
and assume that they are initialized to null(reference type)
or default values(value type).

## Cancellation Token
.NET Framework uses a unified model for cooperative cancellation
of asynchronous or long-running synchronous operations.

## Static constructors
CLR blocks all calls from other threads to static members of the class
until the class constructor(static constructor) has finished running.

## Thread Pool
- all threads are background threads in thread pool
- uses the default stack size, runs at the default priority,
and is in the multithreaded apartment
- only one thread pool per process

## [Synchronization Primitives][Overview of Synchronization Primitives]

### Lock
Control access to resources.

Exclusive Lock, access resource with one thread at a time
- lock/Monitor
- Mutex
- SpinLock

Non-Exclusive Lock, access resource with some threads at a time
- ReaderWriterLock
- Semaphore

### Signal
Control work flow of threads, such like thread process orders.

- Wait Handles
- Event Wait Handles
- Mutex
- Semaphore
- Barrier

Performance Comparision: Interlocked > lock/Monitor > Mutex

---
[Parallel Processing and Concurrency in the .NET Framework]: https://msdn.microsoft.com/en-us/library/hh156548(v=vs.110).aspx
[Managed Threading]: https://msdn.microsoft.com/en-us/library/3e8s7xdd(v=vs.110).aspx
[Foreground and Background Threads]: https://msdn.microsoft.com/en-us/library/h339syd0(v=vs.110).aspx
[Overview of Synchronization Primitives]: https://msdn.microsoft.com/en-us/library/ms228964(v=vs.110).aspx
[Processes, Threads, and Apartments]: https://msdn.microsoft.com/library/windows/desktop/ms693344.aspx
[Single-Threaded Apartments]: https://msdn.microsoft.com/library/windows/desktop/ms680112.aspx
[Multithreaded Apartments]: https://msdn.microsoft.com/library/windows/desktop/ms693421.aspx
