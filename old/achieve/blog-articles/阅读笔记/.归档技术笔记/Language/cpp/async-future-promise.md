# Concurrency --- async && Futures

Hight Level Interface for Concurrency:

- std::async()
- std::future<>
- std::shared_future<>

async will **try** to start func immediately in a separate thread,
at that time related func maybe start or not start.

async policy:

- std::launch::async, force to start immediately
- std::launch::deferred, start until get/wait invoked

assign async to future and use future to monitor progress.

invoke **future.get()** will raise one actions below:

- get result directly if related async func has been done
- block, won't return result until related async func done
- force to start related async func and block,
won't return result until related async func done

the result could be **an expected value or exception**.

call **get()** for future **only once**

call **future.wait()** also force related async func start and block for finished,
but won't return result.

wait_for and wait_until in future won't force related async func start,
they will return below status:

- std::future_status::deferred, not started
- std::future_status::timeout, still work in progress
- std::future_status::ready, finished.

for std::launch::async policy, if not call get and leave scope of future object,
it will block to wait for related async fun finish.

std::shared_future used for multiple threads to get same result of future.

## Promise

std::promise is counterpart of **future** object.

store value or exception by set_value or set_exception.

**future.get** blocks until shared state of promise is ready,
which exactly when **set_value or set_exception is invoked for promise**.

## packaged_task

It used to defer future until task invoked.

```
double compute(int x);

std::packaged_task<double (int)> task(compute);
std::future<double> f = task.get_future();
...
task(7,5); // compute start
...
double rst = f.get();

```
