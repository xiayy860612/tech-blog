---
title: AWS帐号安全管理
date: 2023-12-22 20:00:00
categories:
- aws
tags:
- aws
- security
---

- root user
- IAM

<!--more-->

## Root User

root user has full privilege to access all resources in aws.

Best Practice: 

- enable MFA(Multi-factor authentication)
- never use access keys
- never share root user
- create IAM users/groups for aws administrative tasks

## IAM

```puml
object "User" as U
object "Group" as G
object "Policy" as P
object "Role" as R

G "1" o-- "*" U
U o--> P
G o--> P
R o--> P

```

Best Practice: 

- use iam user instead of root user
- least privilege
- use role when possible
- remove unused user, group, policy or role

### IAM Role

Role does not have standard long-term credentials 
such as a password or access keys associated with it. 
it provides temporary security credentials for your role session.
use roles to delegate access to users, applications, or services 
that don't normally have access to your AWS resources. 

## Reference

- [Security best practices and use cases in AWS Identity and Access Management][1]
---
[1]: https://docs.aws.amazon.com/IAM/latest/UserGuide/IAMBestPracticesAndUseCases.html

