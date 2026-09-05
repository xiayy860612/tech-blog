# C# Generic

[Generics]: https://msdn.microsoft.com/en-us/library/512aeb7t.aspx
---

Official Site [C# Generic][Generics]
<!--more-->

Generic Namespace

- System.Collections.Generic

## Benefits
- type-safe at compile-time, won't cast types to and from Object class.
- performance

## Constraints
- struct
- class
- new()
- base class
- interface

## default keyword
assign default value to a parameterized type T.
- reference type, return null
- numeric value type, return 0
- struct type,  return each member of struct initialized
to zero or null depending on member type
