---
title: MyBatis 快速使用指南
date: 2024-09-21 08:47:19
categories:
- quick-guide
tags:
- db
- mybatis
---

快速掌握 MaBatis Mapper 的定义

<!--more-->

## Mapper

采用 JDK 动态代理的方式来实现。

```xml
<?xml version="1.0" encoding＝"UTF-8" ?>
< !DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >

<mapper namespace ＝"tk.mybatis.simple.mapper.CountryMapper">
    <select id="selectAll" resultType="Country">
        select id, countryname, countrycode from country
    </select>
</mapper> 
```

- namespace，指定对应接口的全路径

所有的 mapper 文件都需要导入到 `mybatis-config.xml` 配置文件中才能生效。

```xml
<mappers>
  <!-- 优先使用 package 导入其下所有的 mapper -->
  <package name="tk.mybatis.simple.mapper" />

  <!-- 其他额外的 mapper 可以单独导入 -->
  <mapper resource="tk/mybatis/ext/mapper/CountryMapper.xml">
  ...
</mappers>
```

### ResultMap

resultMap 定义 Entity 与 DB Table 的映射关系，包括表名以及字段名。

```xml
...
<resultMap id="userMap" type="tk.mybatis.simple.model.SysUser">
  <id property="id" column="id"/>
  <result property="userName" column="user_name" />
  ...
</resultMap>
...
```

- id，resultMap 的唯一 id，用于指定 DML 操作的返回类型
- type, 指定对应类型的全路径
- `<id>`，指定 Entity 的唯一键
- `<result>`, 定义 entity 的属性与 table 字段的映射关系

#### 复杂类型的映射

自动映射，默认需要保证返回的列名和类型中的属性名一致。
可以通过别名(alias)，保证返回的列名 column 和类型中的属性名 property 一致

- 通过在 resultMap 中手动配置列名和类型属性名之间的映射
- 通过 `extends` 继承其他 resultMap 的配置

```java
class SysRole {
  private int id;
  private String roleName;
}

class SysUser {
  private int id;
  private String userName;
  ...

  private SysRole role;
}
```

```xml
<resultMap id="userMap" type="tk.mybatis.simple.model.SysUser">
  <id property="id" column="id"/>
  <result property="userName" column="user_name" />
  ...
</resultMap>
```

##### 通过 `extends` 继承其他 resultMap 的配置, 然后添加额外的映射

适合简单类型的嵌套对象的扩展。

要保证 SQL 列名 column 和 Java Type 的 property 一一对应起来。

```xml
<resultMap id="userRoleMap" extends="userMap" type="tk.mybatis.simple.model.SysUser">
  <result property="role.id" column="role_id"/>
  <result property="role.roleName" column="role_name" />
  <result property="role.enabled" co lumn="enabled" />
  <resul t property="role.createBy" column="create_by"/>
  <result property="role.createTime" column="role_create_time" dbcType="TIMESTAMP" />
</resultMap>

<select id="selectUserAndRoleByid" resultMap="userRoleMap" >
  select
    u.*
    r.id role_id,
    r.role_name role_name,
    r.enabled enabled,
    r.create_by create_by,
    r.create_time role_create_time
  from sys_user u
    inner sys_user_role ur on u.id = ur.user_id
    inner join sys_role r on ur.role_id= r.id
  where u.id = #{id}
</select>
```

##### [推荐] 使用 `association` 映射复杂类型

通过 association 映射对应的 `resultMap`，并保证 SQL 中的对应的列名 column 符合 `columnPrefix + column` 的格式。

```xml
<resultMap id="roleMap" type="tk.mybatis.smple.model.SysRole">
  <id property="id" column="id"/>
  <result property="roleName" column="role_name" />
  <result property="enabled" column="enabled" />
  <result property="createBy" column= "create_by" />
  <result property="createTime" column="create_time" jdbcType="TIMESTAMP" />
</resultMap> 

<!-- 通过 join 一次 SQL 获取嵌套类型相关的数据 -->
<resultMap id="userRoleMap" extends="userMap" type="tk.mybatis.simple.model.SysUser">
  <association property="role" columnPrefix="role_" resultMap="roleMap" />
</resultMap>

<select id="selectUserAndRoleByid" resultMap="userRoleMap" >
  select
    u.*
    r.id role_id,
    r.role_name role_role_name,
    r.enabled role_enabled,
    r.create_by role_create_by,
    r.create_time role_create_time
  from sys_user u
    inner join sys_user_role ur on u.id = ur.user_id
    inner join sys_role r on ur.role_id= r.id
  where u.id = #{id}
</select>
```

```xml
<!-- [推荐] 通过多次 SQL 获取嵌套类型相关的数据 -->
<resultMap id="userRoleMap" extends="userMap" type="tk.mybatis.simple.model.SysUser">
  <!-- 嵌套对象的 SQL 查询, 一般使用 lazy 按需加载，id 为 selectRoleByid 的参数名，role_id 为 column -->
  <association property="role" fetchType="lazy" column="{id=role_id}" select="tk.mybatis.simple.mapper.RoleMapper.selectRoleByid" />
</resultMap>

<select id="selectUserAndRoleByid" resultMap="userRoleMap" >
  select
    u.*
    ur.role_id
  from sys_user u
    inner sys_user_role ur on u.id = ur.user_id
  where u.id = #{id}
</select>
```

##### 数组类型的映射

使用 `collection` 进行映射。

```java
class SysUser {
  private int id;
  private String userName;
  ...

  private List<SysRole> roleList;
}
```

```xml
<!-- 通过 join 一次 SQL 获取嵌套类型相关的数据 -->
<resultMap id="userRoleListMap" extends="userMap" type="tk.mybatis.simple.model.SysUser">
  <collection property="roleList" columnPrefix="role_" resultMap="roleMap" />
</resultMap>

<select id="selectAllUserAndRolesSelect”" resultMap="userRoleListMap" >
  select
    u.*
    r.id role_id,
    r.role_name role_role_name,
    r.enabled role_enabled,
    r.create_by role_create_by,
    r.create_time role_create_time
  from sys_user u
    inner join sys_user_role ur on u.id = ur.user_id
    inner join sys_role r on ur.role_id= r.id
  where u.id = #{id}
</select>
```

```xml
<!-- [推荐] 通过多次 SQL 获取嵌套类型相关的数据 -->
<resultMap id="userRoleListMap" extends="userMap" type="tk.mybatis.simple.model.SysUser">
  <!-- 嵌套对象的 SQL 查询 -->
  <collection property="roleList" fetchType="lazy" column="{userId=id}" select="tk.mybatis.simple.mapper.RoleMapper.selectRoleByUserId" />
</resultMap>

<select id="selectAllUserAndRolesSelect”" resultMap="userRoleListMap" >
  select
    u.id,
    u.user_name,
    u.user_password,
    u.user_email,
    u.user_info,
    u.head_img,
    u.create_time
  from sys_user u
  where u.id = #{id}
</select>
```

### DML相关的接口

- 若只有一个参数时，可以直接在 SQL 中使用该参数中的属性名作为传入参数
- 当使用多个参数时，请为每个参数加上 `@Param` 注解，然后在 SQL 中使用

#### select

- **显式**列出所需的列名，禁止使用 `*` 来代替。
- 如果返回值只有 0 个或者 1 个时，可以指定返回类型为 `T`，否则应该使用`数组 T[]` 或者 `列表 List<T>`
- 如果返回和 entity 类型完全匹配则可以使用 resultType，需要指定全路径
- 如果返回和 entity 类型需要自定义映射，则可以使用 resultMap，使用 resultMap 的 id

```java
SysUser selectByid(Long id);

List<SysRole> selectRolesByUserAndRole(@Param("user") SysUser user, @Param("role") role);
```

```xml
<select id="selectByid" resultMap="userMap" >
  select * from sys_user where id = #{id}
</select>

<select id="selectByid" resultType="tk.mybatis.simple.model.SysUser" >
  select * from sys_user where id = #{id}
</select>
```

#### insert

```java
// 返回 SysUser id
int insert(SysUser sysUser) ; 
```

生成主键的方式：

- 使用 DB 自带的自增主键，需要将设置 `useGeneratedKeys="true"`, 它会使用 DB 内部生成的**自增主键**，然后赋值给 `keyProperty` 指定的类型属性.

  ```xml
  <insert id="insert" useGeneratedKeys="true" keyProperty="id">
    insert into sys_user(
      user_name, user_password, user_email,
      user_info, head_img, create_time)
    values(
      #{userName}, #{userPassword}, #{userEmail},
      #{userinfo}, #{headimg, jdbcType=BLOB},
      #{createTime, jdbcType=TIMESTAMP})
  </insert> 
  ```

- 先生成主键 id，然后再插入

  ```xml
  <!-- Oracle -->
  <insert id="insert">
    <selectKey keyColumn='id' resultType='long' keyProperty='id' order='BEFORE'>
      SELECT SEQ ID.nextval from dual
    </selectKey> 

    insert into sys_user(
      id,
      user_name, user_password, user_email,
      user_info, head_img, create_time)
    values(
      #{id},
      #{userName}, #{userPassword}, #{userEmail},
      #{userinfo}, #{headimg, jdbcType=BLOB},
      #{createTime, jdbcType=TIMESTAMP})
  </insert> 
  ```

#### update

```java
int updateById(SysUser user);
```

```xml
<update id="updateByid">
  update sys_user
    set user_name=#{userName},
    user_password=#{userPassword},
    user_email=#{userEmail},
    user_info=#{userinfo},
    head_img=#{headimg, jdbcType=BLOB},
    create_time=#{createTime, jdbcType=TIMESTAMP}
  where id=#{id}
</update> 
```

#### delete

```java
int deleteById(Long id);
```

```xml
<delete id="deleteByid" >
  delete from sys_user where id = #{id}
</delete>
```

### 动态 SQL

MySQL 采用 OGNL(Object-Graph Navigtion Language) 表达式

尽量在 MyBatis 中使用**标签**而非关键字，避免生成非法 SQL。

- `if`, `<if test="userName != null">...</if>`
- `choose...when...otherwise...`, 模拟 `if...elif...else`

  ```xml
  <choose>
    <when test="id != null">
      ...
    </when>
    ...
    <otherwise>
      ...
    </otherwise>
  </choose>
  ```

- trim/where/set

  ```xml
  <!-- <trim prefix="where" prefixOverrides="and | or"> -->
  <where>
    <if test="username != null">
      and username like 'test%'
    </if>
    ...
  </where>

  update sys_user
  <!-- <trim prefix="set" suffixOverrides=","> -->
  <set>
    ...
  </set>
  ```

- foreach, 对数组，map，iterable 进行遍历
  - 若只有一个参数时，默认会将参数命名为 collection，参数被赋给 collection 属性。推荐使用 `@Param` 为参数命名
    - 若该参数类型是 List，则命名为 list。
    - 若该参数类型是 数组，则命名为 array。

  ```xml
  <foreach collection="items" item="item" index="i" open="(" close=")" separator=",">
    #{item.id}, ...
  </foreach>
  ```

- bind, 使用 OGNL 表达式创建一个变量用于 SQL 中

  ```xml
  <if test="username != null">
    <bind name="userNameLike" value="username + '%'">
    and user_name like #{userNameLike}
  </if>
  ```

#### OGNL 表达式

- and/or
- ==/!=
- le/lte/ge/gte
- +/-/*/`/`/%
- !/not
- e.method(args)
- e.prop
- arr[i]
- @class@method(args)
- @class@field

## MyBatis 配置

配置都在 `mybatis-config.xml` 进行设置

```xml
<settings>
  <!-- 自动将以下画线方式命名的数据库列映射到 Java 对象的驼峰式命名属性中, 默认为 false  -->
  <setting name="mapUnderscoreToCamelCase" value="true" />
  <!-- 当该参数设置为 true 时，对任意延迟属性的调用会使带有延迟载属性的对象完整加。反之，每种属性都将按需加载。 -->
  <setting name="aggressiveLazyLoading" value="false" />
  ...
</settings>
```

### TypeHandler

用于处理 Java 类型和数据库类型的转换,可以添加自定义的 TypeHandler，通过实现 `TypeHandler<T>` 接口。

```xml
<typeHandlers>
  <typeHandler javaType="tk.mybatis.simple.type.Enabled" handler="org.apache.ibatis.type.EnumOrdinalTypeHandler" />
</typeHandlers>
```

## Reference

- [MyBatis从入门到精通](https://book.douban.com/subject/27074809/)
