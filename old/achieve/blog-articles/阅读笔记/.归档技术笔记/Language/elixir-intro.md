# Elixir Introduction

Elixir 是一个基于Erlang虚拟机的函数式、面向并行的通用编程语言。
Elixir 以 Erlang 为基础，支持分布式、高容错、实时应用程序的开发，
同时亦对其进行扩展使之借助宏实现元编程，并通过协议支持多态。

More Details on [Introduction](http://elixir-lang.org/getting-started/introduction.html)
<!--more-->

# Basic
## Type
- format string
        "#{param}"
- tuple
        {} // {:ok, "hello"}
- key list
        [{:a, 1}, {:b, 2}], [a: 1, b: 2]
- map
        %{} // %{:a => 1, 2 => :b}
- anonymous function
        fn params -> body end

## Module && Function
Common Project Structure:
        root
          |-- ebin, contains the compiled bytecode
          |-- lib, contains elixir code (usually .ex files)
          |-- test, contains tests (usually .exs files)

.ex files are meant to be compiled and generate bytecode file 
while .exs files are used for scripting, without the need for compilation.

### Function Access
- public: def
- private: defp

Function declarations support guards and multiple clauses.
        def zero?(x) when is_integer(x) do
            false
        end

### Reduce && map
**Enum module** are eager.
**Stream module** support lazy operations.

### Pipe operator
"|>" takes the output from the expression on its left side and passes it as the first argument to the function call on its right side. 

## Process module
- spawn
- spawn_link
- Task

# Code Style


# Build Progression



# Mix and OTP


# Reference
---


---
[Elixir]: http://elixir-lang.org/