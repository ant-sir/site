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
头指针使用`.git/HEAD`保存，头指针文件内部只保存一个分支的引用（如，master分支的引用`ref: refs/heads/master`），如果头指针内部保存的是提交ID，则处理分离头指针模式。
```bash
$ cat .git/HEAD
ref: refs/heads/master
```

分支引用内部存储的即为该分支的最新提交。`master`分支使用`.git/refs/heads`下对应的分支名master的文件来保存。
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
重置命令的一个用途就是修改引用（如master）的游标。体现为分支“游标”的变更。通过移动这个来实现分支的前进和后退。

`git reset`命令有两种用法：
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

### 修补提交
修补提交`git commit –amend`相当于下面两条命令：
```bash
$ git reset --soft HEAD^
$ git commit -e -F .git/COMMIT_EDITMSG
```
文件`.git/COMMIT_EDITMSG`保存了上次的提交日志。


### git checkout检出
如果HEAD的内容不能改变而一直都指向master分支，那么Git如此精妙的分支设计岂不浪费？如果HEAD要改变该如何改变呢？本章将学习检出命令（git checkout），该命令的实质就是修改HEAD本身的指向，该命令不会影响分支“游标”（如master）。

HEAD可以理解为“头指针”，是当前工作区的“基础版本”，当执行提交时，HEAD指向的提交将作为新提交的父提交。HEAD应该指向一个分支的引用。如果HEAD头指针指向了一个具体的提交ID，而不是一个引用（分支），就是处于“分离头指针”状态。

```bash
用法一： git checkout [-q] [<commit>] [--] <paths>...
用法二： git checkout [<branch>]
用法三： git checkout [-m] [[-b|--orphan] <new_branch>] [<start_point>]
```
- 上面列出的第一种用法和第二种用法的区别在于，第一种用法在命令中包含路径<paths>。为了避免路径和引用（或者提交ID）同名而冲突，可以在<paths>前用两个连续的短线（减号）作为分隔。
- 第一种用法的<commit>是可选项，如果省略则相当于从暂存区（index）进行检出。这和上一章的重置命令大不相同：重置的默认值是 HEAD，而检出的默认值是暂存区。因此重置一般用于重置暂存区（除非使用--hard参数，否则不重置工作区），而检出命令主要是覆盖工作区（如果<commit>不省略，也会替换暂存区中相应的文件）。
- 第一种用法（包含了路径<paths>的用法）不会改变HEAD头指针，主要是用于指定版本的文件覆盖工作区中对应的文件。如果省略<commit>，会拿暂存区的文件覆盖工作区的文件，否则用指定提交中的文件覆盖暂存区和工作区中对应的文件。
- 第二种用法（不使用路径<paths>的用法）则会改变HEAD头指针。之所以后面的参数写作<branch>，是因为只有HEAD切换到一个分支才可以对提交进行跟踪，否则仍然会进入“分离头指针”的状态。在“分离头指针”状态下的提交不能被引用关联到而可能会丢失。所以用法二最主要的作用就是切换到分支。如果省略<branch>则相当于对工作区进行状态检查（注意，第一种用法中的<paths>是不可省略的，省略时只可能是后两种用法）。
- 第三种用法主要是创建和切换到新的分支（<new_branch>），新的分支从<start_point>指定的提交开始创建。新分支和我们熟悉的master分支没有什么实质的不同，都是在refs/heads命名空间下的引用。关于分支和git checkout命令的这个用法会在后面的章节做具体的介绍。

比较特殊的命令`git checkout`什么也不加时，汇总显示工作区、暂存区与HEAD的差异。

### 恢复已提交删除的文件
执行删除并提交了之后，只是在最新的提交中删除了文件，历史提交中文件仍然保留，可以从历史提交中提取文件。

执行下面的命令可以从历史（前一次提交）中恢复已删除的文件到工作区。
```bash
$ git cat-file -p HEAD~1:welcome.txt > welcome.txt
```

使用`git checkout`命令可以从某个提交中检出已文件到暂存区和工作区：
```bash
$ git checkout HEAD~1 -- welcome.txt
```

使用`git reset`命令可以从某个提交中重置文件到暂存区：
```bash
$ git reset HEAD~1 -- welcome.txt
```

### 版本表示法：git rev-parse
命令`git rev-parse`是Git的一个底层命令，其功能非常丰富（或者说杂乱），很多Git脚本或工具都会用到这条命令。

1. 可以显示Git版本库的位置（`--git-dir`），当前工作区目录的深度（`--show-cdup`），甚至可以用于被Git无关应用用于解析命令行参数（`--parseopt`）。

2. 此命令可以显示当前版本库中的引用:
    - 显示分支
    ```bash
    $ git rev-parse --symbolic --branches
    ```
    - 显示里程碑
    ```bash
    $ git rev-parse --symbolic --tags
    A
    B
    C
    D
    E
    F
    G
    H
    I
    J
    ```
    - 显示定义的所有引用
    ```bash
    $ git rev-parse --symbolic --glob=refs/*
    refs/heads/master
    refs/remotes/origin/HEAD
    refs/remotes/origin/master
    refs/tags/A
    refs/tags/B
    refs/tags/C
    refs/tags/D
    refs/tags/E
    refs/tags/F
    refs/tags/G
    refs/tags/H
    refs/tags/I
    refs/tags/J
    ```
3. 命令`git rev-parse`另外一个重要的功能就是将一个Git对象表达式表示为对应的SHA1哈希值。
    - 显示HEAD对应的SHA1哈希值
    ```bash
    $ git rev-parse  HEAD
    6652a0dce6a5067732c00ef0a220810a7230655e
    ```
    - 命令`git describe`的输出也可以显示为SHA1哈希值
    ```bash
    $ git describe
    A-1-g6652a0d
    $ git rev-parse A-1-g6652a0d
    6652a0dce6a5067732c00ef0a220810a7230655e
    ```
    - 可以同时显示多个表达式的SHA1哈希值  
    下面的操作可以看出`master`和`refs/heads/master`都可以用于指代master分支。
    ```bash
    $ git rev-parse  master  refs/heads/master
    6652a0dce6a5067732c00ef0a220810a7230655e
    6652a0dce6a5067732c00ef0a220810a7230655e
    ```
    - 可以用哈希值的前几位指代整个哈希值
    ```bash
    $ git rev-parse  6652  6652a0d
    6652a0dce6a5067732c00ef0a220810a7230655e
    6652a0dce6a5067732c00ef0a220810a7230655e
    ```
    - 里程碑的两种表示法均指向相同的对象  
    里程碑对象不一定是提交，有可能是一个Tag对象。Tag对象包含说明或者签名，还包括到对应提交的指向。
    ```bash
    $ git rev-parse  A  refs/tags/A
    c9b03a208288aebdbfe8d84aeb984952a16da3f2
    c9b03a208288aebdbfe8d84aeb984952a16da3f2
    ```
    - 里程碑A指向了一个Tag对象而非提交的时候，用下面的三个表示法都可以指向里程碑对应的提交  
    实际上下面的语法也可以直接作用于轻量级里程碑（直接指向提交的里程碑）或者作用于提交本身。
    ```bash
    $ git rev-parse  A^{}  A^0  A^{commit}
    81993234fc12a325d303eccea20f6fd629412712
    81993234fc12a325d303eccea20f6fd629412712
    81993234fc12a325d303eccea20f6fd629412712
    ```
    - A的第一个父提交就是B所指向的提交  
    回忆之前的介绍，`^`操作符代表着父提交。当一个提交有多个父提交时，可以通过在符号`^`后面跟上一个数字表示第几个父提交。`A^` 就相当于 `A^1`。而`B^0`代表了B所指向的一个Commit对象（因为B是Tag对象）。
    ```bash
    $ git rev-parse  A^  A^1  B^0
    776c5c9da9dcbb7e463c061d965ea47e73853b6e
    776c5c9da9dcbb7e463c061d965ea47e73853b6e
    776c5c9da9dcbb7e463c061d965ea47e73853b6e
    ```
    - 更为复杂的表示法  
    连续的`^`符号依次沿着父提交进行定位至某一祖先提交。`^`后面的数字代表该提交的第几个父提交。
    ```bash
    $ git rev-parse  A^^3^2  F^2  J^{}
    3252fcce40949a4a622a1ac012cb120d6b340ac8
    3252fcce40949a4a622a1ac012cb120d6b340ac8
    3252fcce40949a4a622a1ac012cb120d6b340ac8
    ```
    - 记号`~<n>`就相当于连续`<n>`个符号`^`
    ```bash
    $ git rev-parse  A~3  A^^^  G^0
    e80aa7481beda65ae00e35afc4bc4b171f9b0ebf
    e80aa7481beda65ae00e35afc4bc4b171f9b0ebf
    e80aa7481beda65ae00e35afc4bc4b171f9b0ebf
    ```
    - 显示里程碑A对应的目录树。下面两种写法都可以
    ```bash
    $ git rev-parse  A^{tree}  A:
    95ab9e7db14ca113d5548dc20a4872950e8e08c0
    95ab9e7db14ca113d5548dc20a4872950e8e08c0
    ```
    - 显示树里面的文件，下面两种表示法均可
    ```bash
    $ git rev-parse  A^{tree}:src/Makefile  A:src/Makefile
    96554c5d4590dbde28183e9a6a3199d526eeb925
    96554c5d4590dbde28183e9a6a3199d526eeb925
    ```
    - 暂存区里的文件和HEAD中的文件相同
    ```bash
    $ git rev-parse  :gitg.png  HEAD:gitg.png
    fc58966ccc1e5af24c2c9746196550241bc01c50
    fc58966ccc1e5af24c2c9746196550241bc01c50
    ```
    - 还可以通过在提交日志中查找字串的方式显示提交
    ```bash
    $ git rev-parse :/"Commit A"
    81993234fc12a325d303eccea20f6fd629412712
    ```
    - reflog相关的语法
    ```bash
    $ git rev-parse HEAD@{0} master@{0}
    6652a0dce6a5067732c00ef0a220810a7230655e
    6652a0dce6a5067732c00ef0a220810a7230655e
    ```

### 版本范围表示法：git rev-list
有的Git命令可以使用一个版本范围作为参数，命令`git rev-list`可以帮助研究Git的各种版本范围语法。
![commit-tree-with-id](/img/commit-tree-with-id.png)

- 一个提交ID实际上就可以代表一个版本列表。含义是：该版本开始的所有历史提交。
    ```bash
    $ git rev-list --oneline  A
    8199323 Commit A: merge B with C.
    0cd7f2e commit C.
    776c5c9 Commit B: merge D with E and F
    beb30ca Commit F: merge I with J
    212efce Commit D: merge G with H
    634836c commit I.
    3252fcc commit J.
    83be369 commit E.
    2ab52ad commit H.
    e80aa74 commit G.
    ```
- 两个或多个版本，相当于每个版本单独使用时指代的列表的并集。
    ```bash
    $ git rev-list --oneline  D  F
    beb30ca Commit F: merge I with J
    212efce Commit D: merge G with H
    634836c commit I.
    3252fcc commit J.
    2ab52ad commit H.
    e80aa74 commit G.
    ```
- 在一个版本前面加上符号（`^`）含义是取反，即排除这个版本及其历史版本。
    ```bash
    $ git rev-list --oneline  ^G D
    212efce Commit D: merge G with H
    2ab52ad commit H.
    ```
- 和上面等价的“点点”表示法。使用两个点连接两个版本，如`G..D`，就相当于`^G D`。
    ```bash
    $ git rev-list --oneline  G..D
    212efce Commit D: merge G with H
    2ab52ad commit H.
    ```
- 版本取反，参数的顺序不重要，但是“点点”表示法前后的版本顺序很重要。
    + 语法：`^B C`
    ```bash
    $ git rev-list --oneline  ^B C
    0cd7f2e commit C.
    ```
    + 语法：`C ^B`
    ```bash
    $ git rev-list --oneline  C ^B
    0cd7f2e commit C.
    ```
    + 语法：`B..C`相当于`^B C`
    ```bash
    $ git rev-list --oneline  B..C
    0cd7f2e commit C.
    ```
    + 语法：`C..B`相当于`^C B`
    ```bash
    $ git rev-list --oneline  C..B
    776c5c9 Commit B: merge D with E and F
    212efce Commit D: merge G with H
    83be369 commit E.
    2ab52ad commit H.
    e80aa74 commit G.
    ```
- 三点表示法的含义是两个版本共同能够访问到的除外。  
    B和C共同能够访问到的F、I、J排除在外。
    ```bash
    $ git rev-list --oneline  B...C
    0cd7f2e commit C.
    776c5c9 Commit B: merge D with E and F
    212efce Commit D: merge G with H
    83be369 commit E.
    2ab52ad commit H.
    e80aa74 commit G.
    ```
- 三点表示法，两个版本的前后顺序没有关系。  
    实际上`r1...r2`相当于`r1 r2 --not $(git merge-base --all r1 r2)`，和顺序无关。
    ```bash
    $ git rev-list --oneline  C...B
    0cd7f2e commit C.
    776c5c9 Commit B: merge D with E and F
    212efce Commit D: merge G with H
    83be369 commit E.
    2ab52ad commit H.
    e80aa74 commit G.
    ```
- 某提交的历史提交，自身除外，用语法`r1^@`表示。
    ```bash
    $ git rev-list --oneline  B^@
    beb30ca Commit F: merge I with J
    212efce Commit D: merge G with H
    634836c commit I.
    3252fcc commit J.
    83be369 commit E.
    2ab52ad commit H.
    e80aa74 commit G.
    ```
- 提交本身不包括其历史提交，用语法`r1^!`表示。
    ```bash
    $ git rev-list --oneline  B^!
    776c5c9 Commit B: merge D with E and F

    $ git rev-list --oneline  F^! D
    beb30ca Commit F: merge I with J
    212efce Commit D: merge G with H
    2ab52ad commit H.
    ```












