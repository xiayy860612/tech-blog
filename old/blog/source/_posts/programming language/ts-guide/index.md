---
title: TypeScript 快速入门
date: 2024-06-15 20:47:19
categories:
- quick-guide
tags:
- TypeScript
- TS
---

TS 是**强类型**语言，**只涉及类型，不涉及值**，所有和值相关的处理，都是由 JS 完成。通过**编译**，会将 TS 转为 JS 代码。

- **类型**相关计算由 TS 负责
- **值**相关的计算由 JS 负责

<!--more-->

## 类型系统

### 基础类型

- 原始类型，它的值是最基本的，不可再分的。
  - boolean
  - string
  - number
  - bigint
  - symbol, 通过 `Symbol()` 函数来生成，它的每个值都是独一无二的。
- object，包括对象，数组，函数。
- undefined，表示**未定义**，只有一个值 `undefined`
- null，表示**空**，只有一个值 `null`

特殊类型:

- any，类型不确定，可能是任意类型，可以赋予任意类型的值，并可以赋值给其他任何类型，导致类型**污染**，不安全，不推荐使用
- unknown，严格版 any，一般只有经过 type narrowing 之后才能使用
- never，表示不包含任何值，一般用于表达式运算的完整性。

```ts
function fn(x: string | number) {
    if (typeof x === 'string') {}
    else if (typeof x === 'number') {}
    else {
        // 此时 x 的类型为 never
        x;
    }
}
```

在关闭编译设置 `noImplicitAny` 和 `strictNullChecks` 时，被赋值为 `undefined` 或 `null` 的变量，会被类型推断为 `any`; 若开启，则是 `undefined` 或 `null` 类型。

#### 字面量

指**直接使用的固定值**，而 ​字面量类型（Literal Types）则是对这些固定值的类型约束，用于限制变量或属性只能取特定的字面量值。

- 字符串字面量
- 数字字面量
- 布尔字面量
- 对象字面量

```ts
// 字符串字面量
type Direction = "up" | "down" | "left" | "right";
let move: Direction = "up"; // 合法
move = "jump";              // 报错

// 对象字面量
type User = {
  name: "Alice";
  age: 25;
};
const user: User = { name: "Alice", age: 25 }; // 合法
const user2: User = { name: "Bob", age: 30 };  // 报错
```

#### Function

函数参数：

- 可选参数用 `<variable>?: <type>` 来表示，它的类型为 `<type | undefined>`, 可选参数只能放在末尾处。
- 默认值
- rest 剩余参数， `...<variable>: <array/tuple>`

对同一个函数参数，可选参数和默认值不能同时使用。

##### 高阶函数 higher-order function

返回值是一个函数，用于对某个功能进行扩展和包装

##### 构造函数

需要通过 `new` 命令来调用。

```ts
class Animal {}

type AnimalConstructor = new () => Animal;

const a = new AnimalConstructor();
```

#### Object

**在 JS 中只有对象才有方法**，而原始类型的值本身没有方法，需要通过对应的包装对象才能调用方法。而每一个原始类型都有对应的包装类，会在需要的时候自动转为**包装对象**。包装对象的类型为 `object`. **一般情况下建议使用原始类型**。

Object vs object:

- object 类型的值只包括对象，数组，函数。
- 只要能转成 object 类型的值，都是 Object 类型，包括原始类型的值和 object 的值，除了 undefined 和 null。常用空对象 `{}` 来表示 Object 类型。

对象解构，直接从对象中提取属性, 在对象解构里使用冒号 `:` 来对变量进行别名。

```ts
type ObjType = {
    name: string
    age: number
}

const obj = {
    name: "test",
    age: 11
}
// 对象解构, 
const {name, age： objAge} = obj
```

##### 索引类型

用于不确定属性的多少的场景，可以用于以下的场景

- 属性名的索引类型
- 数组的索引类型
- symbol的索引类型

```ts
// 属性名的索引类型
type MyObj = {
    [prop: string]: string
}

const obj: MyObj = {
    foo: 'a',
    bar: 'b',
    ...
}

// 组的索引类型
type MyArr = {
    [i: number]: string
}
const arr: MyArr = ["1", "2"]
```

在 JS 中，如果存在字符串索引，要求其他索引类型不能与其冲突，并且单个属性的声明也必须符合索引类型的定义，否则会报错。所以建议谨慎使用索引类型。

```ts
type MyObj = {
    [prop: string]: string
    [x: number]: boolean // error
    foo: boolean // error
}
```

##### 结构类型原则 structural typing

只要对象 B 满足对象 A 的结构特征，TS 则认为对象 B 兼容对象 A 的类型，可以将 B 赋值给 A。

**TS 检查某个值是否符合指定类型时，并不是检查这个值的类型（名义类型），而是检查这个值的结构是否符合要求，即结构类型是否符合。**

如果对象直接使用字面量来表示，则会触发 TS 的**严格字面量检查(strict object literal checking)**。如果字面量的结构和类型定义不完全一样，则会报错。

```ts
// 直接使用对象字面量
const A: {x: number} = {
    x: 1,
    y: 2 // error
}

const B = {
    x: 1,
    y: 2
}
// 不直接使用字面量
const A: {x: number} = B // correct
```

**最小可选属性规则**：如果某个类型的所有属性都是可选的，那么该类型的对象必须至少存在一个可选属性，不能都不存在。

```ts
type Options {
    a?: number
}

const opts = {d: 123}
const obj: Options = opts // error
```

可以通过扩展操作符 `...` 展开对象，用于合成新的对象。

```ts
const p1 = {x:3}
const p2 = {y:4}
const p3 = {
    ...p1,
    ...p2
}
```

#### interface && type



### 数组类型

- array 数组，使用 `<type>[]` 表示
- tuple 元组，使用 `[type1, type2, ...]` 表示, 用于表示成员类型不同的数组，必须**明确给出类型声明**，否则类型推断为联合类型的数组。可选参数(用 `?` 表示)只能用于尾部的成员，即只能放最后。

若数组**没有声明类型并且初始值为空数组 `[]`** 时，则 TS 会在每次赋值时，自动更新类型推断，否则不会自动更新类型推断。

使用扩展运算符 `...` 来表示不限成员数量的元组。

```ts
type NamedNumsType = [string, ...number[]]
const n1: NamedNumsType = ['A', 1, 2]
const n2: NamedNumsType = ['A', 1, 2, 3]
```

只读数组 `readonly <type>[]`，对数组成员的新增，修改，删除都会报错

### 特殊类型

- 值类型，单个值也可以作为一种类型，表示这个类型只有一个值，就是它本身。常见的情况是使用 const 声明变量时没有指定类型，则该变量的类型就是赋给它值的值类型。
- 联合类型，使用 `|` 分割的多个类型组成的新类型，它的值只需要属于其中任一一个类型即可。当需要它的值进行使用时，需要进行 `type narrowing`。
- 交叉类型，使用 `&` 分割的多个类型组成的新类型，它的值要符合所有类型才可以，若多个类型之间存在冲突，则类型为 `never`， 因为不存在这样类型的值。交叉类型主要用于**对象的合成**。

### 类型声明

类型声明的格式： `<let/const> <variable/function>:<type> = <value>`

```ts
// 常量
const foo: string = "hello";

// 可修改
let x: number = 1;
x = 2;

function toString(num: number): string {
    ...
}
```

在不声明类型时，TS 会根据值进行**类型推断**, 如果无法推断出来，则类型为 `any`。

```ts
// foo: string
const foo = "hello";

// t: any
let t;
```

type，用来对类型进行别名，使类型的名字更有意义，增加代码可读性

typeof 的参数必须是**编译时**决定的值，有两种使用场景：

- 值运算，结果**当作值**来使用，在 JS 中使用 typeof 获取值的类型，只能返回 **8 种基础类型**的**字符串**。
- 类型运算，结果**作为类型**来使用，是 TS 扩展的功能，返回 TS 中的类型。

### 类型缩小 Type Narrowing


## 运算

### 常用的运算技巧

#### Falsy value

falsy values 指在 `boolean` 上下文中会被自动转换为 false 的值。

- `false`
- `0`
- 空字符串， `""` 或者 `''`
- `null`
- `undefined`
- `NaN`

`boolean` 上下文：

- 条件判断
- 逻辑或 `||`, 用于提供默认值
- 逻辑与 `&&`, 用于条件执行
- 空值合并运算符 `??`, 只用于判断非 `null/undefined`

```ts
// 空值合并运算符 `??`
// 下面 2 种写法是一样的作用，建议使用 ??
const name = name === undefined ? "default name" : name;
const name = name ?? "default name";
```

#### 双重否定 `!!`

**双重否定**常用来将变量强制转换为 Boolean 来判断真假 `!!<variable>`,

```ts
const a = 0 // falsy value
const result = !!a
console.log(result) // false
```

## Reference

- [TypeScript 教程](https://wangdoc.com/typescript/)