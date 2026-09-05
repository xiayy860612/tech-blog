# Yaml

[Yaml](http://yaml.org/) for configuration
<!--more-->

## Basic

Use **---** to separate YAML Documents in one yaml file.

Use **\*\*\*** to declare the end of file.

Use **#** for annotation

It use indent and left-align to orgnize data in file.

There are 2 kinds of format: **block format** and **inline format**.

### Array

    // Array block format
    - ...
    - ...
    - ...

    // Array inline format
    [..., ..., ...]

### Hashtable

    // block format
    // key: value
    name: XYY
    age: 33

    // inline format
    // {key: value, ...}
    {name: XYY, age: 33}

### String

It's not necessary to use quotes(**"**) for string.

Multi-line strings
- |, keep \n
- >, collapse words

## Advance

### Reuse

Use **&** to mark a reference of data that could be reused in somewhere by **\***.

### Merge hashtable

Use **<<:** to merge values of another hashtable into current hashtable.

## Type conversion


## Reference
- [YAML 语言教程](http://www.ruanyifeng.com/blog/2016/07/yaml.html)
- [YAML Wiki](https://zh.wikipedia.org/wiki/YAML)
- [YAML 速成](https://learnxinyminutes.com/docs/zh-cn/yaml-cn/)