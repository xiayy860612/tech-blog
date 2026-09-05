# MySQL Programming

介绍C#中如何使用MySQL Connect和MySQL进行交互
<!--more-->

## Connection Management
Use **MySqlConnection** for connection with MySQL,
it requires [Connect String][Connection String] to establish connection.

When connection raised error, it will raise **MySqlException**

Connection Models:
- Continual Model, connect/close manually, Use MySqlCommand to operate MySQL.
    + ExecuteReader, **must to be closed after used**
    + ExecuteNonQuery
    + ExecuteScalar
- Decoupled Model, connect/close automatically when necessary.
    + DataSet
    + MySqlDataAdapter
    + MySqlCommandBuilder

Connection Pooling is ennabled by default and configured in connect string.

Use [Prepared Statements][Prepared Statements] to improve performance of statement execution.

Use [Trace Source][MySQL Connector/Net Trace Source] Check trace info
to improve performance of MySQL operations.

---
[MySQL Connector/Net Developer Guide]: https://dev.mysql.com/doc/connector-net/en/
[Connection String]: https://dev.mysql.com/doc/connector-net/en/connector-net-connection-options.html
[MySQL Connector/Net Trace Source]: https://dev.mysql.com/doc/connector-net/en/connector-net-programming-tracing.html
[Prepared Statements]: https://dev.mysql.com/doc/connector-net/en/connector-net-programming-prepared.html
