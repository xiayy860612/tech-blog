# C# Regex Expression

C#使用Regex类来进行正则处理, 来自**System.Text.RegularExpressions**
<!--more-->

## Regular Expression Engine
- By calling the static methods of the Regex class,
it will cach regular expressions, good performance for same regular expression
- By instantiating a Regex object with regular expression,
immutable  object, won't be cached.

## Operation

### Match
Search for matched substring follow regex express in Input data.

Use **Match** object to extract matched substring.

Use **Match.Success** to check if find matched substring.

Use **Match.Groups** for substring match capturing groups in regular expression pattern.

### Replace
Replace all matched substring in input data.

### Split
Split inpu data by matched substring following pattern into array.

---
[.NET Framework Regular Expressions]: https://msdn.microsoft.com/en-us/library/hs600312(v=vs.110).aspx
