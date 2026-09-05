# Sublime Text3 环境配置

Sublime Text3 环境配置
<!--more-->

# 包管理工具 [Package Control][]
1. "ctrl + `"打开控制台
2. 输入以下代码并运行

		import urllib.request,os; pf = 'Package Control.sublime-package'; ipp = sublime.installed_packages_path(); urllib.request.install_opener( urllib.request.build_opener( urllib.request.ProxyHandler()) ); open(os.path.join(ipp, pf), 'wb').write(urllib.request.urlopen( 'http://sublime.wbond.net/' + pf.replace(' ','%20')).read())
        
3. 重启sublime text3

# 常用插件包
- [MarkdownEditing](https://github.com/SublimeText-Markdown/MarkdownEditing)
- [Terminal](https://packagecontrol.io/packages/Terminal)
- [SideBarEnhancements](https://github.com/titoBouzout/SideBarEnhancements)，增加右键菜单的功能
- 


# Reference
---
- [如何优雅地使用Sublime Text3](http://www.jianshu.com/p/3cb5c6f2421c)

---
[Package Control]: https://packagecontrol.io/