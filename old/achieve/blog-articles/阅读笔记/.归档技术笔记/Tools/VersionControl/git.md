# Git

<!--more-->

## 版本管理
- [语义化版本](http://semver.org/lang/zh-CN/)

## 分支管理
可参考：[A successful Git branching model][]

- master, production-ready, 可运行版本, 该版本始终是可運行的、符合專案需求的、
設計良好的、穩定的、可維護的、可擴展的及已文件化的。用于生产环境.
- dev, 开发分支, 包含下个阶段要发布的新功能. 用于测试环境.
- feature, 功能分支,用于开发新功能. 从dev分支checkout, 最后merge到dev分支.
- release, 发布测试分支, 从dev分支checkout, 用来测试即将发布的新版本中的新功能
以及相关bug的修复, 是发布版本合并到master之前的过渡阶段.
当确认新功能没有任何问题后, merge到master和dev分支,并在master分支上打版本tag.
用于交付前的测试.
- hotfix, 修复分支, 用于急需在短時間內修復并且無法等到下一次發佈時才修復的bug.
从master分支checkout, 修复后merge到master和dev/release,并在master分支上打版本tag.

![Git branching model](git-branch-model.png)

## Subtree/Submodule
- [Git submodule 还是 Git Subtree](http://blog.zlxstar.me/blog/2014/07/18/git-submodule-vs-git-subtree/)
- [Git Submodule使用完整教程](http://www.kafeitu.me/git/2012/03/27/git-submodule.html)
- [使用GIT SUBTREE集成项目到子目录](http://aoxuis.me/post/2013-08-06-git-subtree)

---
[A successful Git branching model]: http://nvie.com/posts/a-successful-git-branching-model/
