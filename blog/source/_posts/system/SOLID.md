---
title: SOLID Pattern
date: 2023-07-13 20:00:19
categories:
- system
tags:
- Design Pattern
---

SOLID Pattern是开发clean code的一个基本的理论指导，
它可以帮助开发人员实现具有较高可读性，可维护性以及鲁棒性的代码，
是每一个开发人员应该掌握的知识。

<!--more-->

## ***S***ingle Responsibility Principle(单一功能原则)

```txt
A class should have one and only one reason to change, 
meaning that a class should have only one responsibility.
```

一个模块(方法，类，组件等)应该只有一个职能，
避免因为多职能间的耦合， 比如状态的耦合，职能实现的耦合等，
导致一个职能发生修改时，其他的职能受到影响。

单一功能原则可能是里面最重要的一个原则，它帮助定义模块的职能边界，
需要注意以下几个方面:

- 基于现有的业务进行分析，**明确模块职能的边界**，尽量保证一个模块只有一个职能
- 避免职能的耦合
- 避免过度设计，基于现有的业务进行设计，
  当业务变更时，原本的设计无法满足时，再对设计进行优化

```java
// bad code
/**
 * 一个类里有2个职能，计算总额和打印
 */
class ShoppingCart {
    private List<Item> items = new LinkedList<>();

    public void addItem(Item item) {
        items.add(item);
    }

    public BigDecimal getTotalPrice() {
        BigDecimal total = BigDecimal.ZERO;
        for (Item item : items) {
            total = total.add(item.getPrice());
        }
        return total;
    }

    public String print() {
        String list = items.stream()
                .map(Item::toString)
                .collect(Collectors.joining("\n"));
        String total = "Total: " + getTotalPrice();
        return String.join("\n", list, total);
    }
}
```

优化方案:

1. 对职能进行分离，提取到不同的类中
2. 通过组合不同职能的类来实现业务逻辑

```puml
class ShoppingCart

class ShoppingCartPrinter {
public String print(ShoppingCart cart);
}
```

## ***O***pen-Closed Principle(开闭原则)

```txt
Objects or entities should be open for extension but closed for modification.
```

对相同职能进行扩展时，不应该修改到原有的职能，否则就有可能引入新的bug。

开闭原则主要针对具有相同职能，但不同实现的场景，为了避免因为切换不同实现到引发新的bug。

如何实现开闭原则：

1. 对职能进行分析，**确定分类**并**提取共有职能**，抽象出相关的接口
2. 每个种类实现对应的接口
3. 业务逻辑**基于接口**来实现职能
4. 当有新的种类时，只需要针对新的种类实现相应的接口即可，而不用不修改原有的业务逻辑

```java
/**
 * 当添加新形状时，需要修改getSum方法
 */
public class AreaCalculator {

    public Long getArea(Object obj) {
        if (obj instanceof Rectangle) {
            Rectangle rectangle = (Rectangle) obj;
            return rectangle.getLength() * rectangle.getWidth();
        }

        if (obj instanceof Square) {
            Square square = (Square) obj;
            return square.getLength() * square.getLength();
        }

        throw new RuntimeException("Invalid Param");
    }
}
```

优化方案:

1. 提取共同的职能---计算面积，抽象出相关的接口
2. 每个形状实现各自的职能接口
3. 业务逻辑基于职能接口进行实现

```puml
interface Area {
    Long getArea();
}

class Rectangle implements Area
class Square implements Area
```

## ***L***iskov Substitution Principle(里氏替换原则)

```txt
Functions that use pointers or references to base classes 
must be able to use objects of derived classes without knowing it
```

子类必须遵循父类的**行为**和**约束**。

尤其是要注意约束，只有完全满足下面这些约束才能进行替换：

- 入参的约束, 包括作用域，格式，类型等
- 出参的约束，包括值域，格式，类型等
- 异常的约束，包括类型，数量等
- 行为逻辑的约束，指该行为应该要实现怎样的职能

如何实现里氏替换原则：

- 重新定义父类的职能
- 将不符合父类的职能的实现从子类中移出

```java
/**
 * more exception constraints in implements
 */
public class Rectangle implements Shape {
    @Override
    public Double area(Double length, Double width)
            throws InvalidParameterException, NumberFormatException {
        if (length < 0 || width < 0) {
            throw new InvalidParameterException();
        }

        checkFormat(length);
        checkFormat(width);

        return length * width;
    }

    private void checkFormat(Double value) throws NumberFormatException {
        String s = Double.toString(value);
        int index = s.indexOf('.');
        int length = s.substring(index + 1).length();
        if (length > 2) {
            throw new NumberFormatException();
        }
    }
}
```

优化方案：

1. 将不属于Shape定义的职能移到外面去，保证子类完全满足父类的行为和约束

    ```java
    public class GoodPractice {
        public static void main(String[] args) {
            Shape shape = new Rectangle();

            double length = 1.3;
            double width = 2.3;
            checkFormat(length);
            checkFormat(width);
            Double area = shape.area(length, width);
            System.out.println(area);

            double length1 = 1.322;
            double width1 = 2.333;
            checkFormat(length1);
            checkFormat(width1);
            area = shape.area(length1, width1);
            System.out.println(area);
        }

        private static void checkFormat(Double value) throws NumberFormatException {
            String s = Double.toString(value);
            int index = s.indexOf('.');
            int length = s.substring(index + 1).length();
            if (length > 2) {
                throw new NumberFormatException();
            }
        }
    }
    ```

## ***I***nterface Segregation Principle(接口隔离原则)

```text
Clients should not be forced to depend upon interfaces that they do not use.
```

模块所依赖的接口，只应提供模块所需的职能，不应该暴露额外用不到的职能;
如果有暴露额外的职能，则需要对接口进行重新设计。

```java
/**
 * extra functionalities for shape
 */
public interface Shape {
    Integer area();
    void print();
}

public class BadPractice {
    public static void main(String[] args) {
        Shape shape = new Rectangle(1, 2);
        System.out.println(shape.area());
    }
}
```

优化方案：对接口的职能进行拆分

```puml
interface Shape {
    Integer area();
}

interface ShapePrinter {
    void print();
}
```

```java
public class GoodPractice {
    public static void main(String[] args) {
        Rectangle rectangle = new Rectangle(1, 2);
        calculateArea(rectangle);
        printShape(rectangle);
    }

    private static void calculateArea(Shape shape) {
        System.out.println(shape.area());
    }

    private static void printShape(ShapePrinter shape) {
        shape.print();
    }
}
```

## ***D***ependency Inversion Principl(依赖反转原则)

```text
Depend upon abstractions, not concretions
```

高层模块不应依赖下层模块的实现，而应该依赖于下层模块的抽象。

```java
/**
 * when db is changed, code does not word
 */
public class BadPractice {
    public static void main(String[] args) {
        MySQL db = new MySQL();
        db.connect("localhost:3306");
    }
}
```

重构方案：

1. 提取抽象接口
2. 高层模块依赖于抽象接口进行实现

```puml
interface Database {
    void connect(String host);
}

class MySQL implements Database
class Postgre implements Database
```

```java
public class GoodPractice {
    public static void main(String[] args) {
        Database db = DatabaseFactory.INSTANCE.getDb(Db.POSTGRE);
        db.connect("localhost:3306");
    }
}
```

## Reference

- [SOLID](https://en.wikipedia.org/wiki/SOLID)
- [SOLID: The First 5 Principles of Object Oriented Design](https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)
- [使人瘋狂的 SOLID 原則：目錄](https://medium.com/%E7%A8%8B%E5%BC%8F%E6%84%9B%E5%A5%BD%E8%80%85/%E4%BD%BF%E4%BA%BA%E7%98%8B%E7%8B%82%E7%9A%84-solid-%E5%8E%9F%E5%89%87-%E7%9B%AE%E9%8C%84-b33fdfc983ca)