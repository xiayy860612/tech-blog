# Type System

[Type System](https://msdn.microsoft.com/en-us/library/zcx1eb1e.aspx) in C#
<!--more-->

## Types in the .NET Framework
2 kinds of types in .net framework
- value types
- reference types

If an instance of a value type is assigned to a variable, that variable is given a fresh copy of the value.
all value types cannot directly inherit from any type. and they are also sealed.

If a reference type is assigned to a variable, that variable references (points to) the original value. No copy is made.

Underlying type of Enumeration should be one of the built-in signed or unsigned integer types (such as Byte, Int32, or UInt64).

Use [**FlagsAttribute**](https://msdn.microsoft.com/en-us/library/system.flagsattribute.aspx) attribute on Enumeration
declares a special kind of enumeration called a bit field, 
so that bitwise operators can be used on bit fields not on traditional enumerations.

## Type Accessibility

- public
- protected
- internal
- protected internal = protected + internal
- private

