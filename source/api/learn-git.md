title: Git学习笔记
---
Git是开源社区送给每一个人的宝贝。使用Git多年了，但每次翻看Git相关的书籍都有新的收获，也正验证了那名－－好记性不如烂笔头，何况自已的记性似乎不好。所以笔记是个好东西。
<!--more-->

## 《GotGit权威指南》笔记
感谢蒋鑫老师的写出这么好的作品

### 将从v1开始的历次提交逐一导出为补丁文件
```bash
$ git format-patch v1..HEAD
0001-Fix-typo-help-to-help.patch
0002-Add-I18N-support.patch
0003-Translate-for-Chinese.patch
```

### 几个常用的简单命令
执行`git add -u`命令可以将所有修改过的文件加入暂存区。

执行`git add -A`命令可以将本地删除文件和新增文件都登记到提交暂存区。

执行`git add -p`命令可以对一个文件内的修改进行有选择性的添加。

显示版本库.git目录所在的位置
```bash
git rev-parse --git-dir
```

显示工作区根目录
```bash
git rev-parse --show-toplevel
```

相对于工作区根目录的相对目录
```bash
git rev-parse --show-prefix
```

从当前目录（cd）后退（up）到工作区的根的深度
```bash
git rev-parse --show-cdup
```

`git config`命令操作任何其他的INI文件
```bash
GIT_CONFIG=test.ini git config a.b.c.d "hello, world"
```

命令查看存储库对象的内容或类型和大小信息:
- `git cat-file -t` 显示由`<object>`标识的对象类型
- `git cat-file -s` 显示由`<object>`标识的对象大小
- `git cat-file -p` 基于其类型，打印`<object>`的内容

`git ls-tree` 查看树对象的内容

### 头指针HEAD和分支master的本质
头指针使用`.git/HEAD`保存
```bash
$ cat .git/HEAD
ref: refs/heads/master
```

`master`分支使用`.git/refs/heads`下对应的分支名master的文件来保存
```bash
$ cat .git/refs/heads/master
6fa67542c5fc78c89f896edce01cc76428d57e81
```

远程分支目录`.git/refs`是保存引用的命名空间，其中`.git/refs/heads`目录下的引用又称为分支。对于分支既可以使用正规的长格式的表示法，如`refs/heads/master`，也可以去掉前面的两级目录用`master`来表示。Git 有一个底层命令`git rev-parse`可以用于显示引用对应的提交ID。

### 对象的访问
1. 符号`^`可以用于指代父提交。
- `HEAD^`代表版本库中上一次提交，即最近一次提交的父提交。
- `HEAD^^`则代表`HEAD^`的父提交。

2. 对于一个提交有多个父提交，可以在符号`^`后面用数字表示是第几个父提交。
- `a573106^2`含义是提交a573106的多个父提交中的第二个父提交。
- `HEAD^1`相当于`HEAD^`含义是HEAD多个父提交中的第一个。
- `HEAD^^2`含义是`HEAD^`（HEAD父提交）的多个父提交中的第二个。

3. 符号`~<n>`也可以用于指代祖先提交。
下面两个表达式效果等同：
```bash
a573106~5
a573106^^^^^
```

4. 提交所对应的树对象，可以用类似如下的语法访问。
```bash
a573106^{tree}
```

5. 某一此提交对应的文件对象，可以用如下的语法访问。
```bash
a573106:path/to/file
```

6. 暂存区中的文件对象，可以用如下的语法访问。
```bash
:path/to/file
```

### git reset的使用
用法一：
```bash
git reset [-q] [<commit>] [--] <paths>...
```
用法二：
```bash
git reset [--soft | --mixed | --hard | --merge | --keep] [-q] [<commit>]
```

- 上面列出了两个用法，其中 `<commit>` 都是可选项，可以使用引用或者提交ID，如果省略 `<commit>` 则相当于使用了HEAD的指向作为提交ID。

- 上面列出的两种用法的区别在于，第一种用法在命令中包含路径`<paths>`。为了避免路径和引用（或者提交ID）同名而冲突，可以在`<paths>`前用两个连续的短线（减号）作为分隔。

- 第一种用法（包含了路径`<paths>`的用法）不会重置引用，更不会改变工作区，而是用指定提交状态（`<commit>`）下的文件（`<paths>`）替换掉暂存区中的文件。

- 第二种用法（不使用路径`<paths>`的用法）则会重置引用。根据不同的选项，可以对暂存区或者工作区进行重置。

- 两种用法的参数不能混合使用，即带路径参数`--`或`<paths>`时不能再跟`soft/mixed/hard/merge/keep`任意一种。

- `git reset`什么都不加时，仅用HEAD指向的目录树重置暂存区，工作区不会受到影响，相当于将之前用git add命令更新到暂存区的内容撤出暂存区。引用也未改变，因为引用重置到HEAD相当于没有重置。





