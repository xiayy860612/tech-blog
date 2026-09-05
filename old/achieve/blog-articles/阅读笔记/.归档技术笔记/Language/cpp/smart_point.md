# C++ --- Smart Point

It's defined in **<memory>** header file.

- shared ownership, ***shared_ptr***
- exclusive ownership, ***unique_ptr***

## Shared Ownership

Cannot use **assignment(=)** to initialize ***shared_ptr***.

use **make_share()** to create object,
it's faster and safer coz it uses one allocations, not two:

- **object** allocation
- shared data used to **control object**

one shared_ptr contains 2 parts:

- object reference
- control object

if shared_ptr is used for array, define own deleter for array.

use **get()** to get support for full pointer semantics.

### weak_ptr

Cases

- cyclic reference
- share but not own object

**weak_ptr only a constructor taking a shared_ptr.**

when assign shared_ptr to weak_ptr, reference count won't increase.

shared_ptr is not existed for weak_ptr:

- expired(), true
- shared_ptr(const std::weak_ptr), throw bad_weak_ptr
- use_count(), 0

---

Make **this** as shared_ptr:

1. class should inherit from **std::enable_shared_from_this<?>**
2. invoke **shared_from_this()** to create shared_ptr for this,
it can't use in constructor.

---

```
shared_ptr<A> a1(new A(10));
shared_ptr<A> a2(new A(11));

a2 = move(a1);
```

move is used to transfer ownership,
it will raised below actions:

- decrease related obj's ref count of a2
- get related obj's ownership from a1 to a2
- reset a1

### Alias constructor

make shared_ptr for inner variable of object.

```
shared_ptr<T> sp(sp2, sp2_ref_obj_val_ptr)

/*
 * sp2_ref_obj_val_ptr: ptr point to variable of ref object in sp2.
 */
```

**cause**: don't assign new object for alias constructor, it won't be deleted.

**cause**: shared_ptr is not thread safe.

## Exclusive Ownership

---

**unique_ptr** get related object:

- get(), won't lose ownership
- release(), it will lose ownership

clean unique_ptr:

- assign nullptr
- reset()
