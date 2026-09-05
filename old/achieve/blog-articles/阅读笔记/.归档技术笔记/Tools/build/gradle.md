# Gradle

Study [Gradle](https://gradle.org/)
<!--more-->

Each gradle project has **build.gradle** file.

## Essential Elements
- project
- task
- property

use **ext** for external properties 
or define in **gradle.properties** file in root directory.

    ext.someOtherProp = 567 // set external property
    println project.someOtherProp // access external property



## Java Plugin
Add below code in build.gradle to set up a java project

    apply plugin: 'java'

It makes some contract by default:
- source under **src/main/java**
- build output under **build** directory

use **`gradle build`** command to build java project.

use **`gradle properties`** command to print default settings.

### Use External Libs

Use maven repo

    repositories {
        mavenCentral()
    }

Define dependecies

    dependencies {
        compile group: 'org.apache.commons', name: 'commons-lang3', version: '3.1'
        compile group: 'org.apache.commons:commons-lang3:3.1'
    }

## Multiple Modules

### settings.gradle
used to define structure of project


## Reference
- [Gradle In Action](https://www.gitbook.com/book/lippiouyang/gradle-in-action-cn/details)
- [Gradle User Guide](https://www.gitbook.com/book/dongchuan/gradle-user-guide-/details)
- [gradle新建工程，多项目依赖，聚合工程](http://blog.csdn.net/w8452960/article/details/53415415)