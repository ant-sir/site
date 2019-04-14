---
title: repo工具学习笔记
date: 2013-07-03
categories:
  - 工具使用
tags:
  - repo
---
repo是Google用来管理Android源代码的工具，但是它具休非常好的通用性，只要创建自己的manifest文件，即可用来管理自己的项目。
<!--more-->

# Android项目库的组成
先来分析一下Android项目库的组成，来学习repo是如何管理android项目的。

## AOSP的组成
AOSP主要由三种类型的仓库组成，repo库，manifest库，android项目子库。

`repo`库提供Repo工具的实现脚本，`manifest`库里面的xml清单文件描述了所有项目库的信息，Repo工具使用`manifest`库的描述文件管理各种Git库。Android子项目库即为Android项目的子功能模块的Git库。

获取项目时，最初使用curl获取repo的启动文件。该文件并非完整的repo库，只是一个获取完整repo库的前导文件。

## repo库
`repo`库不仅提供了Repo引导文件，还包含完整的Repo工具源代码。该源码库即是AOSP的管理工具，又是AOSP库的一部分，并具有自管理能力。

## manifest库
`manifest`库是在`repo init`命令初始化项目时下载下来的，里面的XML清单文件定义了整个AOSP包含的项目以及所有的管理信息。在使用repo引导脚本进行初始化的时候，必须通过`-u`参数指定清单库的地址。

当执行完毕`repo init`之后，工作目录内只有一个.repo目录。在该目录下除了`repo`库外，就是manifest库，以及一个链接到manifest库中清单库中的default.xml符号链接。该库管理着实际的所有AOSP项目库。
``` bash
$ ls -l
总用量 24
drwxrwxr-x.  3 zyl zyl 4096 4月  22 23:52 manifests
drwxrwxr-x. 10 zyl zyl 4096 4月  23 00:01 manifests.git
lrwxrwxrwx.  1 zyl zyl   21 4月  22 23:52 manifest.xml -> manifests/default.xml
drwxrwxr-x.  7 zyl zyl 4096 4月  23 00:01 repo
```

打开清单文件：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<manifest>
  <remote  name="aosp"
           fetch=".."
           review="https://android-review.googlesource.com/" />
  <default revision="master"
           remote="aosp"
           sync-j="4" />
  <project path="build/make" name="platform/build" groups="pdk" >
    <copyfile src="core/root.mk" dest="Makefile" />
    <linkfile src="CleanSpec.mk" dest="build/CleanSpec.mk" />
    <linkfile src="buildspec.mk.default" dest="build/buildspec.mk.default" />
    <linkfile src="core" dest="build/core" />
    <linkfile src="envsetup.sh" dest="build/envsetup.sh" />
    <linkfile src="target" dest="build/target" />
    <linkfile src="tools" dest="build/tools" />
  </project>
  ...
</manifest>
```

- `remote`：定义一个远程仓库，通过该属性指定远程仓库的名称、地址和review的址。可以定义多个`remote`元素，但不能重复定义。
- `default`：定义默认的分支、远程仓库和同步线程数。只能有一个`default`元素。
- `project`：定义一个项目。`path`指定本址存放路径，`name`指定仓库的相对地址，`groups`指定所属组。不能出现重复的`project`定义（`name`属性不能相同），但是可以通过`remove-project`元素将缺省清单中定义的`project`删除再重新定义。
- `copyfile`：定义一个文件拷贝的动作。
- `linkfile`：定义一个文件链接的动作。

关于`manfests`文件的详细信息可以看`manfests`的[文档](https://github.com/ant-sir/git-repo/blob/master/docs/manifest-format.txt)。

Repo支持通过本地清单，对缺省的清单文件进行补充以及覆盖。可以在`.repo`目录下创建`local_manifest.xml`文件，在Repo工具读取清单信息时其内容会和`.repo/manifest.xml`文件的内容进行合并。可以在本地的`local_manifest.xml`中使用`remove-project`元素对某个或某些项目取反。这样在`repo sync`时就不会同步或删除本地的项目目录。

## 安装Repo
Repo是一个Python开发的工具，底层使用Git操作，使用Repo可以使工作更简单。更多的信息请看[Repo分析](/repo-about.html)章节。
安装Repo：
1. 首先确保一个本的的目录如~/.bin在环境变量当中。
    ```bash
    $ mkdir ~/.bin
    $ PATH=~/.bin:$PATH
    ```
2. 下载Repo工具到上面创建的目录当中。
    ``` bash
    $curl https://storage.googleapis.com/git-repo-downloads/repo > ~/.bin/repo
    $chmod a+x ~/.bin/repo
    ```

## 初始化Repo客户端
安装Repo后，需要设置你的本地目录以便访问Android源码仓库。
1. 创建一个新的空目录作为Android项目的工作目录。
    ```bash
    $ mkdir WORKING_DIRECTORY
    $ cd WORKING_DIRECTORY
    ```
2. 配置你的Git的用户名和邮件地址，如果你需要使用Gerrit的code-review功能，你需要设置你的邮件地址为你的Google account的邮件地址。
    ```bash
    $ git config --global user.name "Your Name"
    $ git config --global user.email "you@example.com"
    ```
3. 运行`repo init`命令来下载完整的Repo仓库。必须指定manifest仓库的URL，它提供了那些你需要获取到本地目录的仓库的信息。
    ```bash
    $ repo init -u https://android.googlesource.com/platform/manifest
    ```
    你也可以指定具体的分支，使用`-b`参数指定具体要获取哪个分支。
    ```bash
    $ repo init -u https://android.googlesource.com/platform/manifest -b android-4.0.1_r1
    ```
    成功初始化之后你的目录里面只有一个.repo的目录，该目录下有：
    ``` bash
    $ ls -l
    总用量 24
    drwxrwxr-x.  3 zyl zyl 4096 4月  22 23:52 manifests
    drwxrwxr-x. 10 zyl zyl 4096 4月  23 00:01 manifests.git
    lrwxrwxrwx.  1 zyl zyl   21 4月  22 23:52 manifest.xml -> manifests/default.xml
    drwxrwxr-x.  7 zyl zyl 4096 4月  23 00:01 repo
    ```

## 下载Android源码树
跟据默认的manifest文件拉取源代码树到你的工作目录。
```bash
$ repo sync
```
这样Android源码就会以项目的名子为目录位于你的工作目录下面。

## 网络问题
如果你需要通过代理来下载源码，你需要提供以下环境变更给Repo。
```bash
$ export HTTP_PROXY=http://<proxy_user_id>:<proxy_password>@<proxy_server>:<proxy_port>
$ export HTTPS_PROXY=https://<proxy_user_id>:<proxy_password>@<proxy_server>:<proxy_port>
```

## 制作地本镜像库
当你有多个客户端都需要拉取源代码时很容易遇到带宽问题，因些做一个本地的镜像是很有必要的。下面把/usr/local/aosp/mirror目录做为镜像目录。在该目录下面初始化和同步。
```bash
$ mkdir -p /usr/local/aosp/mirror
$ cd /usr/local/aosp/mirror
$ repo init -u https://android.googlesource.com/platform/manifest --mirror
$ repo sync
```

{% note tip 注意 %}
`--mirror`参数只能在初始化一个新的仓库时使用一次，在已初始化的仓库下再次使用会报错。
{% endnote %}

一旦同步完成，新的客户端就可以从这个镜像拉取。该镜像需要再次同步以保持与上游镜像同步，客户端也需要再次同步以保持最新。

## 校验Git Tags
加载以下公钥到你的GnuPG key数据库中，这个公钥用以签名那些未发行的标签。Repo默认只使用已稳定发布的版本（可以使用`git tag`查看已发行版本），除非使用`--no-repo-verify`参数指明不校验签名，才可以使用Repo库的任一分支。
```bash
$ gpg --import
```
拷贝并粘贴以下key到你的终端，以EOF(CTRL-D)结尾。
```bash
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v1.4.2.2 (GNU/Linux)

mQGiBEnnWD4RBACt9/h4v9xnnGDou13y3dvOx6/t43LPPIxeJ8eX9WB+8LLuROSV
lFhpHawsVAcFlmi7f7jdSRF+OvtZL9ShPKdLfwBJMNkU66/TZmPewS4m782ndtw7
8tR1cXb197Ob8kOfQB3A9yk2XZ4ei4ZC3i6wVdqHLRxABdncwu5hOF9KXwCgkxMD
u4PVgChaAJzTYJ1EG+UYBIUEAJmfearb0qRAN7dEoff0FeXsEaUA6U90sEoVks0Z
wNj96SA8BL+a1OoEUUfpMhiHyLuQSftxisJxTh+2QclzDviDyaTrkANjdYY7p2cq
/HMdOY7LJlHaqtXmZxXjjtw5Uc2QG8UY8aziU3IE9nTjSwCXeJnuyvoizl9/I1S5
jU5SA/9WwIps4SC84ielIXiGWEqq6i6/sk4I9q1YemZF2XVVKnmI1F4iCMtNKsR4
MGSa1gA8s4iQbsKNWPgp7M3a51JCVCu6l/8zTpA+uUGapw4tWCp4o0dpIvDPBEa9
b/aF/ygcR8mh5hgUfpF9IpXdknOsbKCvM9lSSfRciETykZc4wrRCVGhlIEFuZHJv
aWQgT3BlbiBTb3VyY2UgUHJvamVjdCA8aW5pdGlhbC1jb250cmlidXRpb25AYW5k
cm9pZC5jb20+iGAEExECACAFAknnWD4CGwMGCwkIBwMCBBUCCAMEFgIDAQIeAQIX
gAAKCRDorT+BmrEOeNr+AJ42Xy6tEW7r3KzrJxnRX8mij9z8tgCdFfQYiHpYngkI
2t09Ed+9Bm4gmEO5Ag0ESedYRBAIAKVW1JcMBWvV/0Bo9WiByJ9WJ5swMN36/vAl
QN4mWRhfzDOk/Rosdb0csAO/l8Kz0gKQPOfObtyYjvI8JMC3rmi+LIvSUT9806Up
hisyEmmHv6U8gUb/xHLIanXGxwhYzjgeuAXVCsv+EvoPIHbY4L/KvP5x+oCJIDbk
C2b1TvVk9PryzmE4BPIQL/NtgR1oLWm/uWR9zRUFtBnE411aMAN3qnAHBBMZzKMX
LWBGWE0znfRrnczI5p49i2YZJAjyX1P2WzmScK49CV82dzLo71MnrF6fj+Udtb5+
OgTg7Cow+8PRaTkJEW5Y2JIZpnRUq0CYxAmHYX79EMKHDSThf/8AAwUIAJPWsB/M
pK+KMs/s3r6nJrnYLTfdZhtmQXimpoDMJg1zxmL8UfNUKiQZ6esoAWtDgpqt7Y7s
KZ8laHRARonte394hidZzM5nb6hQvpPjt2OlPRsyqVxw4c/KsjADtAuKW9/d8phb
N8bTyOJo856qg4oOEzKG9eeF7oaZTYBy33BTL0408sEBxiMior6b8LrZrAhkqDjA
vUXRwm/fFKgpsOysxC6xi553CxBUCH2omNV6Ka1LNMwzSp9ILz8jEGqmUtkBszwo
G1S8fXgE0Lq3cdDM/GJ4QXP/p6LiwNF99faDMTV3+2SAOGvytOX6KjKVzKOSsfJQ
hN0DlsIw8hqJc0WISQQYEQIACQUCSedYRAIbDAAKCRDorT+BmrEOeCUOAJ9qmR0l
EXzeoxcdoafxqf6gZlJZlACgkWF7wi2YLW3Oa+jv2QSTlrx4KLM=
=Wi5D
-----END PGP PUBLIC KEY BLOCK-----
```
导入key之后就可以校验和打标签
```bash
$ git tag -v TAG_NAME
```

# REPO的使用
Repo的命令有如下格式：
```bash
repo <COMMAND> <OPTIONS>
```
带[ ]的是可选参数。例如，很多的命令需要一个项目列表做为参数，你可以提供项目的名字列表或项目的相对路径列表：
```bash
repo sync [<PROJECT0> <PROJECT1> ... <PROJECTN>]
repo sync [</PATH/TO/PROJECT0> ... </PATH/TO/PROJECTN>]
```

## help
一旦你安装了Repo，你可以通过以下命令查找最新的带所有命令预览的文档。
```bash
repo help
```
你可以指定具体命令以获取更详细的信息。
```bash
repo help <COMMAND>
```
例如，以下命令会列出init命令的描述和参数列表。
```bash
repo help init
```

## init
```bash
repo init -u <URL> [<OPTIONS>]
```
安装Repo到当前目录。该命令会创建一个`.repo/`目录，它包含Repo的完整Git仓库和标准Android manifest文件。`.repo/`目录下也会包含一个`manifest.xml`文件，它是`.repo/manifest/`目录下选定manifest文件的符号链接。

选项：
- `-u | --manifest-url=URL`: 指定manifest仓库的URL。
- `-m | --manifest-name=NAME.xml`: 指定使用哪个xml文件，manifest仓库里面可以有多个管理仓库的xml文件，如果不指定默认使用default.xml。
- `-b | --manifest-branch=REVISION`: 指定所使用的manifest仓库的哪个分支
- `--mirror`: 指定以建立和上游Android的版本库一模一样的镜像。
- `--no-clone-bundle`: 指定在克隆仓库时不使用bundle文件。bundle文件是一种库的压缩文件，可以提高库的下载效率。可以查看`git bundle`了解更多。
- `--repo-url=URL`: 指定repo仓库的地址，如果不指定，则使用repo文件内指定的地址。
- `--repo-branch=REVISION`: 指定要使用的repo仓库的分支，如果不指定，则使用repo文件内指定的stable。
- `--no-repo-verify`: 指定不校验repo仓库的签名，Repo默认使用已签名的发行版本（即打了tag的），如果想使用最新的（未签名）的版本，则必须使用该参数。如果不指定该参数，默认会忽略stable分支，使用最新的发行版本。

{% note tip 注意 %}
除`init`外的其它命令都需要在工作目录（即`.repo/`的父目录）或其子目录下执行。
{% endnote %}

## sync
```bash
repo sync [<PROJECT_LIST>]
```
下载最新的变更并更新本地工作区文件。如果运行`repo sync`不带任何参数它将同步所有项目。

当你运行`repo sync`时，发生了什么：
- 如果你的项目从来没有被同步过，`repo sync`等同于`git clone`。所有在远程仓库分支都会被克隆到本地。
- 如果你的项目已经同步过了，`repo sync`等同于以下两条命令：
    ```bash
    git remote update
    git rebase origin/<BRANCH>
    ```
    上面的`<BRANCH>`为当前已经检出的分支。如果本地分支没有跟踪任何的远程分支，则`rebase`不会进行。
- 如查`git rebase`操作冲突了，你需要使用Git命令来处理冲突。

成功执行`repo sync`命令后，命令行指定的或所有的项目都和远程仓库保持一致。

选项：
- `-d`: 将指定的项目切换回manifest文件指定的分支，如果项目当前处于特性分支上，这是非常有用的。
- `-s`: 同步到一个在清单文件中指明的已知的编译编译成功版本。
- `-f`: 继续同步其他项目即使有的项目同步失败。

## start
```bash
repo start <BRANCH_NAME> [--all | <PROJECT_LIST>]
```
对于指定或所有(指定`--all`时)项目，如果清单文件中项目存在`dest_branch`属性，则使用`dest_branch`属性作为默认的merge分支（即远程跟踪分支），否则使用清单文件中默认的`revision`作为远程跟踪分支。

## status
对指定的项目比较工作区(working tree)、暂存区(index)和最近一次提交(HEAD)。针对每个文件对于三者中任意两者有不同的显示一个概览。

如果只是想看当前分支的三方比较，可以远行`repo status .`。

该命令实际上是对git diff-index、git diff-files命令的封装，同时显示暂存区的状态和本地文件修改的状态。

- 每个小节的首行显示项目名称，以及所在分支名称。
- 之后显示该项目中文件变更状态。头两个字母显示变更状态，后面显示文件名或者其他变更信息。
- 第一个字母表示暂存区的文件修改状态。
    其实是`git-diff-index`命令输出中的状态标识，并用大写显示。

字符 | 含义 | 描述
--- | --- | ---
`-` | 没有改变 | 没有改变
`A` | 添加 | 不在HEAD中，在暂存区
`M` | 修改 | 在HEAD中，在暂存区，内容不同
`R` | 重命名 | 不在HEAD中，在暂存区，路径修改
`C` | 拷贝 | 不在HEAD中，在暂存区，从其他文件拷贝
`T` | 状态改变 | 在HEAD中，在暂存区，内容相同
`U` | 未合并 | 需要冲突解决
`D` | 删除 | 在HEAD中，不在暂存区

- 第二个字母表示工作区文件的更改状态。
    其实是`git-diff-files`命令输出中的状态标识，并用小写显示。

字符 | 含义 | 描述
--- | --- | ---
`-` | 新/未知 | 不在暂存区，在工作区
`m` | 修改 | 在暂存区，在工作区，被修改
`d` | 删除 | 在暂存区，不在工作区
- 两个表示状态的字母后面，显示文件名信息。如果有文件重命名还会显示改变前后的文件名以及文件的相似度。

## checkout
```bash
repo checkout <branchname> [<project>...]
```
`checkout`命令实际上是对`git checkout`命令的封装。检出之前由`repo start`创建的分支。

## branches
```bash
repo branches [<project>...]
```
{% note tip 注意 %}
是`branches`而不是Git的命令`branch`。
{% endnote %}

读取各个项目的分支列表并汇总显示。该命令实际上是通过直接读取.git/refs目录下的引用来获取分支列表，以及分支的发布状态等。

输出格式：
```bash
   develop                   | in site
*P master                    | in site
```
- 第一个字段显示分支的状态：是否是当前分支，分支是否已发布到代码审核服务器上。
    - 第一个字母若显示星号(*)，含义是此分支为当前分支。
    - 第二个字母若为大写字母P，则含义是分支所有提交都发布到代码审核服务器上了。第二个字母若为小写字母p，则含义是只有部分提交被发布到代码审核服务器上。若不显示P或者p，则表明分支尚未发布。
- 第二个字段为分支名。
- 第三个字段为以竖线（|）开始的字符串，表示该分支存在于哪些项目中。
    - `| in all projects`: 该分支处于所有项目中。
    - `| in project1 project2`: 该分支只在特定项目中定义。如：project1、project2。
    - `| not in project1`: 该分支不存在于这些项目中。即除了project1项目外，其他项目都包含此分支。

## diff
```bash
repo diff [<PROJECT_LIST>]
```
实际上是对git diff命令的封装，用以分别显示各个项目工作区下的文件差异。

## stage
```bash
repo stage -i [<project>...]
```
`repo stage`命令实际上是对`git add –interactive`命令的封装，用以对各个项目工作区中的改动（修改、添加等）进行挑选以加入暂存区。

## upload
```bash
repo upload [--re --cc] {[<PROJECT>]... | --replace <PROJECT>}
```
针对指定项目，Repo比较上次同步之后的本地分支与远程分支，Repo会提示你选择一个或多个分支你还没有`upload`的分支去review。

当你选择了一个或多个分支后，所有在所选分支的新的变更被通过HTTP的方式传输到Gerrit，你需要配置好你的Gerrit传输方式。为了减少Review的次数，在`upload`之前你需要尽量合并你的相同特性的提交以便review可以一次通过。

如果你运行`repo upload`时没有带任何参数，Repo会查找所有项目的所有变更去`upload`。

选项：
- `-h, --help`: 显示帮助信息。
- `-t`: 发送本地分支名称到Gerrit代码审核服务器。
- `--replace`: 发送此分支的更新补丁集。注意使用该参数，只能指定一个项目。
- `--re=REVIEWERS, --reviewers=REVIEWERS`: 要求由指定的人员进行审核。
- `--cc=CC`: 同时发送通知到如下邮件地址。

当已经通过`repo upload`命令在代码审查服务器上提交了一个修订集，会得到一个修订号(Review-Id)。关于此次修订的相关讨论会发送到提交者的邮箱中。如果修订集有误没有通过审核，可以重新修改代码，再次向代码审核服务器上传修订集。

一个修订集修改后再次上传，确保修订集的ID不变是非常有用的，因为这样相关的修订集都在代码审核服务器的同一个界面中显示。

在执行`repo upload`时会弹出一个编辑界面，提示在方括号中输入修订集编号，否则会在代码审查服务器上创建新的ID。有两个办法可以不用手工输入修订集，一个是使用`git commit --amend`做一个修补提交，或者使用如下方法加一个`--replace`参数，如下：
```bash
repo upload --replace <PROJECT_NAME>
```

当使用`--replace`参数后，Repo会检查本地版本库名为`refs/published/<PROJECT_NAME>`的特殊引用（上一次提交的修订），获得其对应的提交SHA1哈希值。然后在本地代码审核服务器对应的`refs/changes/`命名空间下的特殊引用中寻找和提交SHA1哈希值匹配的引用，找到匹配的引用，其名称中就包含有变更集ID，直接用此变更集ID作为新的变更集ID提交到代码审核服务器。

## download
```bash
repo download <TARGET> <CHANGE>
```
从Gerrit的代码审核系统下载特定的变更到本地工作区并切换到对应的变更上。
举个例子，如果你收到邮件有一个`platform/build`项目的`change 23823`的变更需要review，你需要下载23823到你的`platform/build`目录上：
```bash
repo download platform/build 23823
```
命令`repo sync`会清除任何的你使用`repo download`命令下载到本地工作区的提交。

## rebase
```bash
repo rebase {[<PROJECT>...] | -i <PROJECT>...}
```
实际上是对git rebase命令的封装，该命令的参数也作为git rebase命令的参数。但 -i 参数仅当对一个项执行时有效。

## prune
```bash
repo prune [<PROJECT>...]
```
实际上是对git branch -d命令的封装，该命令用于扫描项目的各个分支，并删除已经合并的分支。

## abandon
```bash
repo abandon <BRANCH_NAME> [<PROJECT>...]
```
相比repo prune命令，repo abandon命令更具破坏性，因为repo abandon是对git branch -D命令的封装。该命令非常危险，直接删除分支，请慎用。

## forall
```bash
repo forall [<PROJECT_LIST>] -c <COMMAND>
```
针对每一个项目执行给定的shell命令。有以下环境变量在<COMMAND>中是有效的：
- `REPO_PROJECT`: 是项目名字的唯一序列
- `REPO_PATH`： 项目相对根的路径
- `REPO_REMOTE`： 清单文件指定的远程仓库名字
- `REPO_LREV`： 本地远程跟踪分支的名字
- `REPO_RREV`： 清单文件中指定的远程分支的名字

选项：
- `-c`： 执行后面指定的命令通过`/bin/sh`。
- `-p`： 在指定命令输出前显示项目头信息。
- `-v`： 显示错误信息。

## version
显示repo的版本号。

## list
列出所有项目与库的对应列表

## selfupdate
用于repo自身的更新。如果提供`--repo-upgraded`参数，还会更新各个项目的钩子脚本。

## manifest
显示manifest文件内容。

## 官网的cheatsheet
![git-repo-useages](/img/git-repo-useages.png)

## Repo工作流
![repo-workflow](/img/repo-workflow.png)

