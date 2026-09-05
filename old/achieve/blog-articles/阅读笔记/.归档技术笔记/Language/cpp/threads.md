# Concurrency --- threads

Unless really know what you are doing,
you should pass all objects necessary **by value**,
so that thread use only **local copies**.

when assign a func to thread, it will start directly or raise exception.

**thread.join** will block until done.

**thread.detach** will make thread run background.

## Concurrency Data Access

- mutex && lock
- condition variable
- atomic

**condition race**, multiple threads access same object,
someone modify it and some read it,
it there is no control result will be undefined.

## Mutex && lock

use mutex to get **exclusive access** to resource.

use **std::lock_guard<>** to make sure unlock mutex automatically when required.

lock should be limited to shortest, or bad performance it will block others.

**std::mutex** can't be recursive.
**std::recursive_mutex** is recursive by same thead.

## Conditio Variable

it's used to sync logic dependencies in data flow between multiple threads.

it can wake up other waiting threads.

wait for a condition variable need **mutex && unique_lock**.

Due to spurious wakeups, after notify a thread, 
waiting threads should double check if condition variable.

# Atomic

**std::atomic** is graenteed to provides **sequential consisitency**, happen in order.