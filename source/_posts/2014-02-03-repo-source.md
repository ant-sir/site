---
title: repo实现学习笔记
date: 2013-02-03
categories: 工具使用
tags: repo
---
通过分析repo的源码实现，更好的了解工具的操作，以及对自己实际项目的针对性修改。
<!--more-->

# REPO的引导文件
前面提到通过`curl`下载的Repo文件仅仅是一个引导脚本（bootstrap），Repo引导脚本的主要工作：
- 加载完整的Repo工具库到当前目录下的`.repo/repo`目录下。
- 启动并将控制权交给工作区的`.repo/repo/main.py`这个刚刚从`repo.git`库克隆来的脚本文件。
- 之后在`main.py`文件中克隆Android的清单库`manifest.git`（这已经不是引导脚本的工作了）。

Repo引导文件所做的事情非常简单，如果第一次执行，下载完整的Repo仓库，之后把工作交给main.py。如果不是第一次执行，则直接把工作交给main.py去执行。

阅读Repo引导文件可以从中获取一些有用的信息，下面对Repo启动脚本作一个分析：

## 入口
repo脚本主入口函数：
``` python
if __name__ == '__main__':
  main(sys.argv[1:])
```
调用main函数，参数为`init -u https://android.googlesource.com/platform/manifest`

## main函数
`main`函数实现如下（删除了一些无关的信息）：
``` python
def main(orig_args):
  repo_main, rel_repo_dir = _FindRepo()
  cmd, opt, args = _ParseArguments(orig_args)

  wrapper_path = os.path.abspath(__file__)
  my_main, my_git = _RunSelf(wrapper_path)

  cwd = os.getcwd()
  if not repo_main:
    if cmd == 'init' or cmd == 'gitc-init':
      if my_git:
        _SetDefaultsTo(my_git)
      try:
        _Init(args, gitc_init=(cmd == 'gitc-init'))
      except CloneFailure:
        shutil.rmtree(os.path.join(repodir, S_repo), ignore_errors=True)
        sys.exit(1)
      repo_main, rel_repo_dir = _FindRepo()
    else:
      _NoCommands(cmd)

  if my_main:
    repo_main = my_main

  ver_str = '.'.join(map(str, VERSION))
  me = [sys.executable, repo_main,
        '--repo-dir=%s' % rel_repo_dir,
        '--wrapper-version=%s' % ver_str,
        '--wrapper-path=%s' % wrapper_path,
        '--']
  me.extend(orig_args)
  me.extend(extra_args)
  try:
    os.execv(sys.executable, me)
  except OSError as e:
    _print("fatal: unable to start %s" % repo_main, file=sys.stderr)
    _print("fatal: %s" % e, file=sys.stderr)
    sys.exit(148)
```

可以看出`main`函数首先查找完整的repo仓库是否存在（`_FindRepo()`函数），如果存在则使用`os.execv`调用`main.py`把控制权直接交给`main.py`。如果repo仓库不存在，则使用本地函数`_Init`创建目录并下载repo仓库。因为此时没有repo仓库，所以完整repo仓库的下载仅能使用Repo引导文件的内部函数，这与后续其它仓库的下载是不一样的。

## 完整的Repo库
`_RunSelf`判断运行Repo脚本所在目录是否存在`main.py`和`.git`目录，如果存在就继续判断是否存在`git_config.py`，`project.py`，`subcmds`目录。从这段代码可以看出，一个完整的Repo仓库需要`main.py`，`.git`，`git_config.py`，`project.py`，`subcmds`这五部分组成。如果这些都存在，就认为本地存在完整的repo仓库。

## 使用bundle文件
`_Init`函数内部使用了`_Clone`函数来克隆代码，实现如下：
``` python
def _Clone(url, local, quiet):
  """Clones a git repository to a new subdirectory of repodir
  """
  try:
    os.mkdir(local)
  except OSError as e:
    _print('fatal: cannot make %s directory: %s' % (local, e.strerror),
           file=sys.stderr)
    raise CloneFailure()

  cmd = [GIT, 'init', '--quiet']
  try:
    proc = subprocess.Popen(cmd, cwd = local)
  except OSError as e:
    ......

  _InitHttp()
  _SetConfig(local, 'remote.origin.url', url)
  _SetConfig(local, 'remote.origin.fetch',
                    '+refs/heads/*:refs/remotes/origin/*')
  if _DownloadBundle(url, local, quiet):
    _ImportBundle(local)
  _Fetch(url, local, 'origin', quiet)
```
为了加速下载，Google为每个仓库都提供了对应的bundle文件，下载时Repo时会先下载repo仓库的bundle文件，如果下载成功则从bundle文件中fetch出库，无论成功与否都会再次通过`git fetch`命令获取仓库。（`git fetch`可以直接从bundle文件提取出库。）

## 使用代理
从`_InitHttp`函数可以看出，repo引导脚本支持两种代理方式：
- 用户目录下的`.netrc`文件
- 直接在终端下指定`http_proxy`环境变量

## Repo仓库地址
Repo仓库的地下可以通过多种方式给出，一种是通过命令行参数`--repo-url=URL`，一种是通过环境变量`REPO_URL`给出，另一种是写死在引导文件代码里。当然，对应的分支亦可以通过这几种方法指定。

## 真正的checkout
`_Checkout`函数实现如下：
``` python
def _Checkout(cwd, branch, rev, quiet):
  """Checkout an upstream branch into the repository and track it.
  """
  cmd = [GIT, 'update-ref', 'refs/heads/default', rev]
  if subprocess.Popen(cmd, cwd = cwd).wait() != 0:
    raise CloneFailure()

  _SetConfig(cwd, 'branch.default.remote', 'origin')
  _SetConfig(cwd, 'branch.default.merge', 'refs/heads/%s' % branch)

  cmd = [GIT, 'symbolic-ref', 'HEAD', 'refs/heads/default']
  if subprocess.Popen(cmd, cwd = cwd).wait() != 0:
    raise CloneFailure()

  cmd = [GIT, 'read-tree', '--reset', '-u']
  if not quiet:
    cmd.append('-v')
  cmd.append('HEAD')
  if subprocess.Popen(cmd, cwd = cwd).wait() != 0:
    raise CloneFailure()
```
`_Checkout`函数先使用`git update-ref`把`refs/heads/default`指向为一个稳定的发布版本。然后使用`git symbolic-ref HEAD refs/heads/default`命令设置HEAD指针使其指向default分支。最后使用`git read-tree --reset -u HEAD`命令检出工作区，`git checkout`就是使用底层命令`read-tree`来实现功能的。

Repo仓库克隆完成之后位于工作区目标下的`.repo/repo`路径下，此时的`.repo`目标下只有Repo工具的仓库：
```bash
[zyl@localhost:.repo]$ ls -a
.  ..  repo
```

Repo仓库的分支情况如下：
```bash
$ git branch -a
* default
  remotes/origin/maint
  remotes/origin/master
  remotes/origin/stable
```

## 调用main.py
接下来把权限交给main.py，它会完成Repo仓库的另外一些操作以及manifests为的克隆。


# main.py
main.py先从`subcmds`包导入`all_commands`列表，该列表由所有子命令对象组成，这些子命令在subcmds目录下，每个子命令对应一个模块文件，文件名就是子命令名，每一个文件都定义了以该文件名命令的类，该类实现了对应命令的功能。这些子命令类都是直接或间接从`Command`类继承。

下面来看一张子命令的类图：

[![command](/img/class-command.png)](/img/class-command.png)

从图中可以清晰的看到子类”重载“基类的`Execute`函数以完成自己的工作。而基类的`Execute`是一个“纯虚函数”，子类必须实现。

Python使用如下方法达到纯虚函数的目的：
```python
def Execute(self, opt, args):
  """Perform the action, after option parsing is complete.
  """
  raise NotImplementedError
```

那么main.py是如何执行命令指定命令的操作呢？main.py的主函数使用一个`_Repo`类的对象`repo`来表示Repo工具。该类主要实现了`_Run`函数，`_Repo`类对象就是用该函数来实现命令框架的。

`_Run`函数首先根据命令行参数获取所要执行的命令名字，根据该名字从`all_commands`列表中取出对应该命令的对象。然后调用它的`Execute`函数执行子命令实现的功能。但是执行该命令所需的信息从哪里来呢（如manifest仓库在哪，仓库放置地址，用户信息等）？

阅读源码我们看到`_Run`函数为每个子命令对象创建了一个`XmlManifest`对象，该对象包含两个`MetaProject`对象，一个描述repo仓库，另一个描述manifest仓库。那么项目对象存储在哪里呢？我们可以想到的一种可能是项目对象也存储在XmlManifest对象中（也确实是这样）。

其实并不是所有的命令都需要知道项目仓库信息的，比如`init`命令。init命令仅仅下载一个manifest仓库，在manifest仓库下载下来之前，它也不可能有项目相关的对象。

一个需要使用项目仓库信息的命令是`sync`，它要下载所有的项目到本地，自然需要每一个项目的所有信息。XmlManifest对象有一个属性装饰器函数，它会在你获取XmlManifest对象时从清单文件里解析并创建出所有的项目对象并存储在一个列表中。

知道了所有所需要的信息之后`Cmd`对象就调用它自己实现的`Execute`函数来完成具体的工作。

下看我们来看以上这些分析的源代码。

## 导入all_commands
``` python
from subcmds import all_commands
```

该导入操作会调用`subcmds`包的初始化脚本`__init__.py`，该脚本实现如下：

``` python
all_commands = {}

my_dir = os.path.dirname(__file__)
for py in os.listdir(my_dir):
  if py == '__init__.py':
    continue

  if py.endswith('.py'):
    name = py[:-3]

    clsn = name.capitalize()
    while clsn.find('_') > 0:
      h = clsn.index('_')
      clsn = clsn[0:h] + clsn[h + 1:].capitalize()

    mod = __import__(__name__,
                     globals(),
                     locals(),
                     ['%s' % name])
    mod = getattr(mod, name)
    try:
      cmd = getattr(mod, clsn)()
    except AttributeError:
      raise SyntaxError('%s/%s does not define class %s' % (
                         __name__, py, clsn))

    name = name.replace('_', '-')
    cmd.NAME = name
    all_commands[name] = cmd

if 'help' in all_commands:
  all_commands['help'].commands = all_commands
```

首先定义一个空的`all_commands`列表，获取`__init__.py`文件所在目录下的所有文件，除`__init__.py`文件外，针对其它每个文件名name，去除文件名后缀，使用`__import__`导入该模块，这样每个子命令模块的类对象就创建成功了。

继续使用该文件名name，使首字母大写，使以`'_'`分隔的单词首字母大写得到该文件名对应的类名，然后使用`getattr`函数取得子命令模块，再取得之前导入时创建的对应的类对象。把该类对象添加到以名文件名为索引的`all_commands`列表中，其中文件名中的`'_'`要替换为`'-'`。这样就得到了所有子命令的类对象列表。如果要添加子命令，只需继承自`Command`类，并实现其`Execute`纯虚函数即可。

## _Main函数
main.py文件入口调用`_Main`函数。该函数实现如下：
``` python
def _Main(argv):
  result = 0

  opt, argv = opt.parse_args(argv)

  repo = _Repo(opt.repodir)
  try:
    try:
      result = repo._Run(argv) or 0
    finally:
      close_ssh()
  except KeyboardInterrupt:
    ......
```

main函数首先实例化一个`_Repo`对象，初始化ssh，http，然后直接调用`_Repo`实例的`_Run`函数。

## _Repo类
`_Repo`类主要实现了`_Run`函数，实现如下：

``` python
class _Repo(object):
  def __init__(self, repodir):
    self.repodir = repodir
    self.commands = all_commands
    # add 'branch' as an alias for 'branches'
    all_commands['branch'] = all_commands['branches']

  def _Run(self, argv):

    ......

    try:
      cmd = self.commands[name]
    except KeyError:
      print("repo: '%s' is not a repo command.  See 'repo help'." % name,
            file=sys.stderr)
      return 1

    cmd.repodir = self.repodir
    cmd.manifest = XmlManifest(cmd.repodir)
    
    ......
    
    try:
      result = cmd.Execute(copts, cargs)
    except (DownloadError, ManifestInvalidRevisionError,
        NoManifestException) as e:
    
    ......
```

`_Run`函数从`all_commands`列表中取得对应 __子命令__ 对象（`cmd = self.commands[name]`）。设置该子命令对象的repo仓库地址，同时为该子命令对象创建一个manifest对象（`cmd.repodir = self.repodir`， `cmd.manifest = XmlManifest(cmd.repodir)`），repodir是我们前面创建的`.repo`目录（即整个AOSP的`.repo`库），XmlManifest对象又会创建两个`MetaProject`对象来管理repo仓库和manifest仓库，同时XmlManifest对象会通过自己的装饰器函数获取后续操作所需的大部分信息（如用户名，邮箱等等）。

最后调用 __子命令__ 的`Execute`函数，执行该子命令的相应操作。所有的子命令都实现了`Execute`函数，使用该函数完成相应功能的操作。

## XmlManifest类
`XmlManifest`类在每个子命令类对象中描述该子命令操作所需要的基础信息，如.repo地址及所在目录，manifest文件路径，repo和manifest仓库对象以及所有要管理的项目对象。

我们摘取`XmlManifest`类的几个方法来看：
``` python
class XmlManifest(object):
  """manages the repo configuration file"""
  
  def __init__(self, repodir):

    self.repoProject = MetaProject(self, 'repo',
      gitdir   = os.path.join(repodir, 'repo/.git'),
      worktree = os.path.join(repodir, 'repo'))

    self.manifestProject = MetaProject(self, 'manifests',
      gitdir   = os.path.join(repodir, 'manifests.git'),
      worktree = os.path.join(repodir, 'manifests'))

    self._Unload()
  
  ...

  @property
  def projects(self):
    self._Load()
    return list(self._paths.values())

```
先来看看初始化函数，`XmlManifest`类在初始化的时候会创建两个`MetaProject`类对象，一个对象是用来描述repo仓库，另一个用来描述manifest仓库。该`MetaProject`类派生自`Project`类，其实整个AOSP中的除了repo和manifest其它所有项目对象都是`Project`类型。

由于Repo和Manifest也是Git仓库，所以我们也需要创建一个Project对象来描述它们，不过，由于它们是比较特殊的Git仓库（用来描述AOSP子项目元信息的Git仓库），所以我们就使用另外一个类型为`MetaProject`的对象来描述它们。

`def projects(self)`有一个属性装饰器，它会在你访问该属性或它所属对象时自动运行。它使用内部函数`_Load()`读取并解析manifest清单文件，并对每个项目创建`Project`类对象。就像后面会分析的一样，在创建每个项目对象时会分别指定它们的仓库地址与工作区地址，以达到工作区和仓库分离的目标。

## MetaProject类
`MetaProject`类继承自`Project`类，它的构造函数直接调用其基类的构造函数，实现如下：
``` python
class MetaProject(Project):

  def __init__(self, manifest, name, gitdir, worktree):
    Project.__init__(self,
                     manifest=manifest,
                     name=name,
                     gitdir=gitdir,
                     objdir=gitdir,
                     worktree=worktree,
                     remote=RemoteSpec('origin'),
                     relpath='.repo/%s' % name,
                     revisionExpr='refs/heads/master',
                     revisionId=None,
                     groups=None)
```

在创建`repoProject`对象时传入的为repo仓库相关的参数（`[manifest='repo', gitdir='.repo/repo/.git',  worktree='.repo/repo']`），在创建`manifestProject`对象时传入manifest仓库相关的参数（`[manifest='manifests', gitdir='.repo/manifests.git', worktree='.repo/manifests']`）。

重点记住下面三个参数，后面会再说明：
- gitdir Git仓库存(.git)的放位置
- objdir Git仓库对象文件存放位置
- worktree 工作区位置

这里传给基类的gitdir与objdir相同，这就使得repo和manifest仓库的仓库与对象存储在相同的位置。我们后面会看到在创建项目对象时，传入的gitdir与objdir是不相同的。

另外比较repo仓库与manifest仓库在创建时传入的参数，我们发现repo仓库的Git库和工作区是在同一个目录，而manifest仓库的Git库与工作区不是一个目录。为什么要不同呢？

先来看看下载完成后的带工作区的manifest仓库：
```bash
$ pwd
~/WORKING_DIRECTORY/.repo/manifests/.git
$ ll
总用量 8
lrwxrwxrwx. 1 zyl zyl  26 4月  22 23:52 config -> ../../manifests.git/config
lrwxrwxrwx. 1 zyl zyl  31 4月  22 23:52 description -> ../../manifests.git/description
-rw-rw-r--. 1 zyl zyl  24 4月  22 23:52 HEAD
lrwxrwxrwx. 1 zyl zyl  25 4月  22 23:52 hooks -> ../../manifests.git/hooks
-rw-rw-r--. 1 zyl zyl 145 4月  22 23:52 index
lrwxrwxrwx. 1 zyl zyl  24 4月  22 23:52 info -> ../../manifests.git/info
lrwxrwxrwx. 1 zyl zyl  24 4月  22 23:52 logs -> ../../manifests.git/logs
lrwxrwxrwx. 1 zyl zyl  27 4月  22 23:52 objects -> ../../manifests.git/objects
lrwxrwxrwx. 1 zyl zyl  31 4月  22 23:52 packed-refs -> ../../manifests.git/packed-refs
lrwxrwxrwx. 1 zyl zyl  24 4月  22 23:52 refs -> ../../manifests.git/refs
lrwxrwxrwx. 1 zyl zyl  28 4月  22 23:52 rr-cache -> ../../manifests.git/rr-cache
lrwxrwxrwx. 1 zyl zyl  23 4月  22 23:52 svn -> ../../manifests.git/svn
```

我们知道，repo仓库是前面通过引导文件下载的，最终是通过类似`git clone`的方式下载下来的，工作区和仓库是同一个目录。因此在创建管理repo仓库的对象时要传入相同的gitdir与worktree，而manifest仓库是由完整的Repo仓库的main.py模块下载的，它的下载与后面项目的下载类似，是仓库与工作区分开的。

为什么要创建一个`MetaProject`类，直接使用`Project`类不行吗？

我们来看看这两个类的区别，`MetaProject`类继承自`Project`类，但额外实现了两个函数，`PreSync`与`MetaBranchSwitch`。这两个函数配合主要是为了实现检出分支或更新仓库时使用已有的分支，而不是使用manifest文件里revision属性指定的分支。再者这两个库是为了管理项目的，并不是越新越好，而是要检出稳定的版本，这些都和项目类不同。

下面来看它的基类`Project`类的`__init__`函数。

## Project类的__init__函数
`Project`类对象用来描述一个AOSP子项目的各项信息，以及封装对git的基本操作，其`__init__`函数实现如下：
``` python
class Project(object):
  # These objects can be shared between several working trees.
  shareable_files = ['description', 'info']
  shareable_dirs = ['hooks', 'objects', 'rr-cache', 'svn']
  # These objects can only be used by a single working tree.
  working_tree_files = ['config', 'packed-refs', 'shallow']
  working_tree_dirs = ['logs', 'refs']

  def __init__(self,
               manifest,
               name,
               remote,
               gitdir,
               objdir,
               worktree,
               relpath,
               revisionExpr,
               revisionId,
               rebase=True,
               groups=None,
               sync_c=False,
               sync_s=False,
               clone_depth=None,
               upstream=None,
               parent=None,
               is_derived=False,
               dest_branch=None,
               optimized_fetch=False,
               old_revision=None):
    self.manifest = manifest
    self.name = name
    self.remote = remote
    self.gitdir = gitdir.replace('\\', '/')
    self.objdir = objdir.replace('\\', '/')
    if worktree:
      self.worktree = worktree.replace('\\', '/')
    else:
      self.worktree = None
    self.relpath = relpath
    self.revisionExpr = revisionExpr

    if   revisionId is None \
     and revisionExpr \
     and IsId(revisionExpr):
      self.revisionId = revisionExpr
    else:
      self.revisionId = revisionId

    self.rebase = rebase
    self.groups = groups
    self.sync_c = sync_c
    self.sync_s = sync_s
    self.clone_depth = clone_depth
    self.upstream = upstream
    self.parent = parent
    self.is_derived = is_derived
    self.optimized_fetch = optimized_fetch
    self.subprojects = []

    self.snapshots = {}
    self.copyfiles = []
    self.linkfiles = []
    self.annotations = []
    self.config = GitConfig.ForRepository(
                    gitdir=self.gitdir,
                    defaults=self.manifest.globalConfig)

    if self.worktree:
      self.work_git = self._GitGetByExec(self, bare=False, gitdir=gitdir)
    else:
      self.work_git = None
    self.bare_git = self._GitGetByExec(self, bare=True, gitdir=gitdir)
    self.bare_ref = GitRefs(gitdir)
    self.bare_objdir = self._GitGetByExec(self, bare=True, gitdir=objdir)
    self.dest_branch = dest_branch
    self.old_revision = old_revision

    # This will be filled in if a project is later identified to be the
    # project containing repo hooks.
    self.enabled_repo_hooks = []
```
该函数各参数的意义注释中有详细的说明：

参数 | 描述
--- | ---
`manifest` | XmlManifest对象
`name` | 项目名称
`remote` | 项目对应的远程仓库信息
`gitdir` | Git仓库绝对路径
`objdir` | Git仓库对象存储的绝对路径
`worktree` | 工作目录的绝对路径
`relpath` | 工作目录相对于AOS根目录的相对路径
`revisionExpr` | manifest.xml中关于该项目的`revision`属性
`revisionId` | checkout out时的commit id
`rebase` | manifest.xml中关于该项目的`rebase`属性
`groups` | manifest.xml中关于该项目的`groups`属性
`sync_c` | manifest.xml中关于该项目的`sync_c`属性
`sync_s` | manifest.xml中关于该项目的`sync_s`属性
`upstream` | manifest.xml中关于该项目的`upstream`属性
`parent` | 当前项目的父项目
`is_derived` | 如果一个项目含有子模块（也是一个Git仓库），那么这些子模块也会用一个`Project`对象来描述，这些`Project`的`is_derived`属性会设置为true
`dest_branch` | 默认的codereview分支，如果不指定则会取`revision`属性作为默认的codereview分支。

前面已经提到，在项目属性中分别指定gitdir，objdir，worktree是因为在AOSP中，每一个子项目的存储对象、git仓库以及工作区目录是分开的。AOSP中项目的工作目录位于AOSP根目录下，Git仓库位于`.repo/repo/projects`目录下，而存储对象放在`.repo/repo/project-objects`目录下。

此外，每一个AOSP子项目的工作目录也有一个.git目录，不过这个.git目录下的大部分文件都是一个符号链接，指向`.repo/repo/projects`目录下对应的项目的Git目录（像manifest仓库那样）下的文件。这样，我们就可以在AOSP子项目的工作目录下执行Git命令，就像它的仓库就在本地一样，也可以在其Git仓库下执行Git命令。一般来说，要访问到工作目录的命令（例如`git status`）需要在工作目录下执行，而不需要访问工作目录（例如`git log`）可以在Git目录下执行。

下面来看这两个成员变量`work_git`和`bare_git`，它们指向的都是一个`_GitGetByExec`对象，该对象调用GitCommand类中的命令的执行Git操作。其中，前者在执行Git命令的时候，会将当前目录设置为项目的工作目录，而后者在执行的时候，不会设置当前目录，但是会将环境变量`GIT_DIR`的值设置为项目的Git目录，也就是`.repo/projects`目录下面的那些目录。这就是Repo能将仓库和工作区分开存储的真正原因。通过这种方式，子命令对象可以在工作区还没有创建.git时执行Git命令。

还是前面的问题，为什么要把这三个目录分开存放呢？通过Project类开头的注释可以看出这样设计可以在多个不同的工作区里共离一些东西。同时把对象存储在一起也可以更方便的管理与存储。

我们看一个项目的目录结构：
```bash
# GIT_OBJECT_DIRECTORY目录下
$ pwd
.repo/project-objects/site.git
$ ll
总用量 40
drwxrwxr-x.   2 zyl zyl 4096 4月  23 00:01 branches
-rw-rw-r--.   1 zyl zyl   66 4月  23 00:01 config
-rw-rw-r--.   1 zyl zyl   73 4月  23 00:01 description
-rw-rw-r--.   1 zyl zyl   23 4月  23 00:01 HEAD
drwxrwxr-x.   2 zyl zyl 4096 4月  23 00:01 hooks
drwxrwxr-x.   2 zyl zyl 4096 4月  23 00:01 info
drwxrwxr-x. 223 zyl zyl 4096 5月  23 19:27 objects
drwxrwxr-x.   4 zyl zyl 4096 4月  23 00:01 refs
drwxrwxr-x.   2 zyl zyl 4096 4月  23 00:01 rr-cache
drwxrwxr-x.   2 zyl zyl 4096 4月  23 00:01 svn

# GIT_DIR目录下
$ pwd
.repo/projects/site.git
$ ll
总用量 28
drwxrwxr-x. 2 zyl zyl 4096 4月  23 00:01 branches
-rw-rw-r--. 1 zyl zyl  337 4月  30 22:24 config
lrwxrwxrwx. 1 zyl zyl   42 4月  23 00:01 description -> ../../project-objects/site.git/description
-rw-rw-r--. 1 zyl zyl  453 5月  12 21:08 FETCH_HEAD
-rw-rw-r--. 1 zyl zyl   23 4月  23 00:01 HEAD
lrwxrwxrwx. 1 zyl zyl   36 4月  23 00:01 hooks -> ../../project-objects/site.git/hooks
lrwxrwxrwx. 1 zyl zyl   35 4月  23 00:01 info -> ../../project-objects/site.git/info
drwxrwxr-x. 3 zyl zyl 4096 4月  23 12:33 logs
lrwxrwxrwx. 1 zyl zyl   38 4月  23 00:01 objects -> ../../project-objects/site.git/objects
-rw-rw-r--. 1 zyl zyl   39 4月  23 00:02 packed-refs
drwxrwxr-x. 5 zyl zyl 4096 4月  23 00:16 refs
lrwxrwxrwx. 1 zyl zyl   39 4月  23 00:01 rr-cache -> ../../project-objects/site.git/rr-cache
lrwxrwxrwx. 1 zyl zyl   34 4月  23 00:01 svn -> ../../project-objects/site.git/svn

# 工作区下的.git
$ pwd
site/.git
$ ll
总用量 28
-rw-rw-r--. 1 zyl zyl    59 5月  15 23:17 COMMIT_EDITMSG
lrwxrwxrwx. 1 zyl zyl    36 4月  23 00:16 config -> ../../.repo/projects/site.git/config
lrwxrwxrwx. 1 zyl zyl    48 4月  23 00:16 description -> ../../.repo/project-objects/site.git/description
-rw-rw-r--. 1 zyl zyl    85 5月  23 21:06 FETCH_HEAD
-rw-rw-r--. 1 zyl zyl    23 4月  30 22:24 HEAD
lrwxrwxrwx. 1 zyl zyl    42 4月  23 00:16 hooks -> ../../.repo/project-objects/site.git/hooks
-rw-rw-r--. 1 zyl zyl 11733 5月  23 19:30 index
lrwxrwxrwx. 1 zyl zyl    41 4月  23 00:16 info -> ../../.repo/project-objects/site.git/info
lrwxrwxrwx. 1 zyl zyl    34 4月  23 00:16 logs -> ../../.repo/projects/site.git/logs
-rw-rw-r--. 1 zyl zyl     0 5月  15 23:17 MERGE_RR
lrwxrwxrwx. 1 zyl zyl    44 4月  23 00:16 objects -> ../../.repo/project-objects/site.git/objects
-rw-rw-r--. 1 zyl zyl    41 5月  23 19:27 ORIG_HEAD
lrwxrwxrwx. 1 zyl zyl    41 4月  23 00:16 packed-refs -> ../../.repo/projects/site.git/packed-refs
lrwxrwxrwx. 1 zyl zyl    34 4月  23 00:16 refs -> ../../.repo/projects/site.git/refs
lrwxrwxrwx. 1 zyl zyl    45 4月  23 00:16 rr-cache -> ../../.repo/project-objects/site.git/rr-cache
lrwxrwxrwx. 1 zyl zyl    40 4月  23 00:16 svn -> ../../.repo/project-objects/site.git/svn
```

## 远程仓库的路径
项目仓库的地址是如何得到的呢，Repo使用如下地址作为项目的fetch地址：
```bash
${remote_fetch}/${project_name}.git
```
其中remote_fetch就是manifest.xml文件中remote元素的fetch属性，该属性支持两种路径格式--绝对路径与相对路径。
- 绝对路径： 如果指定绝对路径，则项目的地址就是上面格式的组合。
- 相对路径： 如果指定相对路径，则该路径为相对于命令行参数`-u`的路径，即相对于manifest仓库的路径。

例如，如果在`repo init`时给的`-u`命令参数为`https://android.googlesource.com/platform/manifest`，并指定remote的fetch属性如下：
```xml
<remote  name="aosp"
         fetch=".."
         review="https://android-review.googlesource.com/" />
```
则项目的路径为：`https://android.googlesource.com/platform/<project_name>.git`。


# REPO INIT
前面提到每个子命令都实现了`Execute`函数，用该函数来实现功能。前面引导加载的过程都相似，下面介绍`Init`类的`Execute`函数。`repo init`使用该部分同步manifest仓库。

## Init类的Execute函数

`init`命令的`Execute`实现如下，该函数主要使用两个内部函数`_SyncManifest`和`_LinkManifest`来完成功能：
``` python
class Init(InteractiveCommand, MirrorSafeCommand):  
  ......
  def Execute(self, opt, args):
    git_require(MIN_GIT_VERSION, fail=True)

    ......

    self._SyncManifest(opt)
    self._LinkManifest(opt.manifest_name)

    ......
```

`_SyncManifest`函数同步manifest仓库，`_LinkManifest`函数创建默认的manifest链接。下面具体分析。

## Init类的_SyncManifest函数
``` python
  def _SyncManifest(self, opt):
    m = self.manifest.manifestProject
    is_new = not m.Exists

    if is_new:
      
      ......
      
      mirrored_manifest_git = None
      
      ......

      m._InitGitDir(mirror_git=mirrored_manifest_git)

      if opt.manifest_branch:
        m.revisionExpr = opt.manifest_branch
      else:
        m.revisionExpr = 'refs/heads/master'
    else:
      if opt.manifest_branch:
        m.revisionExpr = opt.manifest_branch
      else:
        m.PreSync()

    if opt.manifest_url:
      r = m.GetRemote(m.remote.name)
      r.url = opt.manifest_url
      r.ResetFetch()
      r.Save()

    ......

    if not m.Sync_NetworkHalf(is_new=is_new):
      ......

    if opt.manifest_branch:
      m.MetaBranchSwitch()

    syncbuf = SyncBuffer(m.config)
    m.Sync_LocalHalf(syncbuf)
    syncbuf.Finish()

    if is_new or m.CurrentBranch is None:
      if not m.StartBranch('default'):
        print('fatal: cannot create default in manifest', file=sys.stderr)
        sys.exit(1)
```
- 首先设置前面创建的`MetaProject`类型的实例`manifestProject`对象为`m`，调用`m`的`_InitGitDir`函数创建仓库与对象目录，实际调用的是基类的`Project`类中的`_InitGitDir`函数。
- 设置`revisionExpr`变量指定需要获取的manifest仓库的分支。如果没有用`-b`指定则取默认的`master`分支。
- 使用`GetRemote`函数获取（创建）名字为`m.remote.name`的一个Remote远程仓库对象（第一次获取时该对象不存在，则创建该对象），配置该远程仓库对象的url，设置它的引用并保存配置。
- 使用`Sync_NetworkHalf`同步manifest仓库。
- 使用`Sync_LocalHalf`捡出指定的分支。

## Project类图
下图主列出了Project类的与库的下载与检出相关的两个函数，命令`init`和`sync`就是使用这两个函数来完成项目的下载与检出的。
![project](/img/class-project.png)
其中repo的Git仓库对象repoProject和manifest的Git仓库对象manifestProject从MetaProject类产生，其它项目对象都是直接从Project类产生。

下面重点看`Sync_NetworkHalf`与`Sync_LocalHalf`函数。

## Project类的Sync_NetworkHalf函数
`Sync_NetworkHalf`函数首先调用`_InitGitDir`函数创建目录，然后调用`_ApplyCloneBundle`函数获取clone.bundle文件，而`_ApplyCloneBundle`函数通过调用`_FetchBundle`获取文件。这些步骤与前面获取repo仓库的bundle文件时差不多。

`Sync_NetworkHalf`函数实现如下：
``` python
  def Sync_NetworkHalf(self,
      quiet=False,
      is_new=None,
      current_branch_only=False,
      force_sync=False,
      clone_bundle=True,
      no_tags=False,
      archive=False,
      optimized_fetch=False,
      prune=False):
    """Perform only the network IO portion of the sync process.
       Local working directory/branch state is not affected.
    """

    ......

    if is_new:
      self._InitGitDir(force_sync=force_sync)
    else:
      self._UpdateHooks()
    self._InitRemote()

    ......

    if clone_bundle \
    and alt_dir is None \
    and self._ApplyCloneBundle(initial=is_new, quiet=quiet):
      is_new = False

    ......

    need_to_fetch = not (optimized_fetch and \
      (ID_RE.match(self.revisionExpr) and self._CheckForSha1()))
    if (need_to_fetch
        and not self._RemoteFetch(initial=is_new, quiet=quiet, alt_dir=alt_dir,
                                  current_branch_only=current_branch_only,
                                  no_tags=no_tags, prune=prune)):
      return False

    if self.worktree:
      self._InitMRef()
    else:
      self._InitMirrorHead()
      try:
        os.remove(os.path.join(self.gitdir, 'FETCH_HEAD'))
      except OSError:
        pass
    return True
```
`Sync_NetworkHalf`函数主要完成库对象的下载，工作区和分支状态不受影响。如果调用时`is_new`置为`true`表示一个新的仓库，会调用`_InitGitDir`来创建仓库的相关信息。否则调用`_UpdateHooks`更新引用。

## Project类的_InitGitDir函数

``` python
  def _InitGitDir(self, mirror_git=None, force_sync=False):
    init_git_dir = not os.path.exists(self.gitdir)
    init_obj_dir = not os.path.exists(self.objdir)
    try:
      # Initialize the bare repository, which contains all of the objects.
      if init_obj_dir:
        os.makedirs(self.objdir)
        self.bare_objdir.init()

      # If we have a separate directory to hold refs, initialize it as well.
      if self.objdir != self.gitdir:
        if init_git_dir:
          os.makedirs(self.gitdir)

        if init_obj_dir or init_git_dir:
          self._ReferenceGitDir(self.objdir, self.gitdir, share_refs=False,
                                copy_all=True)
       ......

      if init_git_dir:
        mp = self.manifest.manifestProject
        
        ......

        self._UpdateHooks()

        m = self.manifest.manifestProject.config
        for key in ['user.name', 'user.email']:
          if m.Has(key, include_defaults=False):
            self.config.SetString(key, m.GetString(key))
        if self.manifest.IsMirror:
          self.config.SetString('core.bare', 'true')
        else:
          self.config.SetString('core.bare', None)
```

`_InitGitDir`函数首先判断当前项目的gitdir和objdir是否存在，如果objdir不存在，则创建objdir目录。manifest仓库的对象存储位置与仓库是同一目录，gitdir与objdir可以不同，如果objdir与gitdir不同，则创建gitdir目录，并创建引用，以便仓库可以找到对象的存储位置。然后调用`_UpdateHooks()`函数创建hooks目录并创建`commit-msg -> ../../repo/hooks/commit-msg`，`pre-auto-gc -> ../../repo/hooks/pre-auto-gc`两个连接连接向repo仓库下面hooks目录下的对应文件，这两个勾子文件是在commit msg中生成ChangeId的。然后设置用户名与用户邮件地址，设置该仓库是否是一个bare仓库。

`Project`类定义哪些引用是所有工作树共享的，哪些引用是工作区私有的。对于所有工作区共享的引用实际上是`.repo/projects/<PROJECT_NAME>.git`目录到`.repo/project-objects/<PROJECT_NAME>.git`的链接。
```python
  # These objects can be shared between several working trees.
  shareable_files = ['description', 'info']
  shareable_dirs = ['hooks', 'objects', 'rr-cache', 'svn']
  # These objects can only be used by a single working tree.
  working_tree_files = ['config', 'packed-refs', 'shallow']
  working_tree_dirs = ['logs', 'refs']
```

下面看一个例子：
```bash
drwxrwxr-x. 2 zyl zyl 4096 4月  23 00:01 branches
-rw-rw-r--. 1 zyl zyl  337 4月  26 21:24 config
lrwxrwxrwx. 1 zyl zyl   42 4月  23 00:01 description -> ../../project-objects/site.git/description
-rw-rw-r--. 1 zyl zyl  453 4月  29 14:40 FETCH_HEAD
-rw-rw-r--. 1 zyl zyl   23 4月  23 00:01 HEAD
lrwxrwxrwx. 1 zyl zyl   36 4月  23 00:01 hooks -> ../../project-objects/site.git/hooks
lrwxrwxrwx. 1 zyl zyl   35 4月  23 00:01 info -> ../../project-objects/site.git/info
drwxrwxr-x. 3 zyl zyl 4096 4月  23 12:33 logs
lrwxrwxrwx. 1 zyl zyl   38 4月  23 00:01 objects -> ../../project-objects/site.git/objects
-rw-rw-r--. 1 zyl zyl   39 4月  23 00:02 packed-refs
drwxrwxr-x. 5 zyl zyl 4096 4月  23 00:16 refs
lrwxrwxrwx. 1 zyl zyl   39 4月  23 00:01 rr-cache -> ../../project-objects/site.git/rr-cache
lrwxrwxrwx. 1 zyl zyl   34 4月  23 00:01 svn -> ../../project-objects/site.git/svn
```

## _ApplyCloneBundle函数实现
`_ApplyCloneBundle`函数实现如下：
``` python
  def _ApplyCloneBundle(self, initial=False, quiet=False):
    if initial and (self.manifest.manifestProject.config.GetString('repo.depth') or self.clone_depth):
      return False

    remote = self.GetRemote(self.remote.name)
    bundle_url = remote.url + '/clone.bundle'
    bundle_url = GitConfig.ForUser().UrlInsteadOf(bundle_url)
    if GetSchemeFromUrl(bundle_url) not in (
        'http', 'https', 'persistent-http', 'persistent-https'):
      return False

    bundle_dst = os.path.join(self.gitdir, 'clone.bundle')
    bundle_tmp = os.path.join(self.gitdir, 'clone.bundle.tmp')

    exist_dst = os.path.exists(bundle_dst)
    exist_tmp = os.path.exists(bundle_tmp)

    if not initial and not exist_dst and not exist_tmp:
      return False

    if not exist_dst:
      exist_dst = self._FetchBundle(bundle_url, bundle_tmp, bundle_dst, quiet)
    if not exist_dst:
      return False

    cmd = ['fetch']
    if quiet:
      cmd.append('--quiet')
    if not self.worktree:
      cmd.append('--update-head-ok')
    cmd.append(bundle_dst)
    for f in remote.fetch:
      cmd.append(str(f))
    cmd.append('refs/tags/*:refs/tags/*')

    ok = GitCommand(self, cmd, bare=True).Wait() == 0
    if os.path.exists(bundle_dst):
      os.remove(bundle_dst)
    if os.path.exists(bundle_tmp):
      os.remove(bundle_tmp)
    return ok
```
`_FetchBundle`函数检查有无代理，然后下载bundle文件，从`_FetchBundle`函数可以看出，只需要在环境变量中设置`http_proxy`变量指定代理地址就可以了。

## Sync_LocalHalf函数实现
```python
  def Sync_LocalHalf(self, syncbuf, force_sync=False):
    """Perform only the local IO portion of the sync process.
       Network access is not required.
    """
    self._InitWorkTree(force_sync=force_sync)
    all_refs = self.bare_ref.all
    self.CleanPublishedCache(all_refs)
    revid = self.GetRevisionId(all_refs)

    def _doff():
      self._FastForward(revid)
      self._CopyAndLinkFiles()

    head = self.work_git.GetHead()
    if head.startswith(R_HEADS):
      branch = head[len(R_HEADS):]
      try:
        head = all_refs[head]
      except KeyError:
        head = None
    else:
      branch = None

    if branch is None or syncbuf.detach_head:
      # Currently on a detached HEAD.  The user is assumed to
      # not have any local modifications worth worrying about.
      #
      if self.IsRebaseInProgress():
        syncbuf.fail(self, _PriorSyncFailedError())
        return

      if head == revid:
        # No changes; don't do anything further.
        # Except if the head needs to be detached
        #
        if not syncbuf.detach_head:
          # The copy/linkfile config may have changed.
          self._CopyAndLinkFiles()
          return
      else:
        lost = self._revlist(not_rev(revid), HEAD)
        if lost:
          syncbuf.info(self, "discarding %d commits", len(lost))

      try:
        self._Checkout(revid, quiet=True)
      except GitError as e:
        syncbuf.fail(self, e)
        return
      self._CopyAndLinkFiles()
      return

    if head == revid:
      # No changes; don't do anything further.
      #
      # The copy/linkfile config may have changed.
      self._CopyAndLinkFiles()
      return

    branch = self.GetBranch(branch)

    if not branch.LocalMerge:
      # The current branch has no tracking configuration.
      # Jump off it to a detached HEAD.
      #
      syncbuf.info(self,
                   "leaving %s; does not track upstream",
                   branch.name)
      try:
        self._Checkout(revid, quiet=True)
      except GitError as e:
        syncbuf.fail(self, e)
        return
      self._CopyAndLinkFiles()
      return

    upstream_gain = self._revlist(not_rev(HEAD), revid)
    pub = self.WasPublished(branch.name, all_refs)
    if pub:
      not_merged = self._revlist(not_rev(revid), pub)
      if not_merged:
        if upstream_gain:
          # The user has published this branch and some of those
          # commits are not yet merged upstream.  We do not want
          # to rewrite the published commits so we punt.
          #
          syncbuf.fail(self,
                       "branch %s is published (but not merged) and is now "
                       "%d commits behind" % (branch.name, len(upstream_gain)))
        return
      elif pub == head:
        # All published commits are merged, and thus we are a
        # strict subset.  We can fast-forward safely.
        #
        syncbuf.later1(self, _doff)
        return

    # Examine the local commits not in the remote.  Find the
    # last one attributed to this user, if any.
    #
    local_changes = self._revlist(not_rev(revid), HEAD, format='%H %ce')
    last_mine = None
    cnt_mine = 0
    for commit in local_changes:
      commit_id, committer_email = commit.decode('utf-8').split(' ', 1)
      if committer_email == self.UserEmail:
        last_mine = commit_id
        cnt_mine += 1

    if not upstream_gain and cnt_mine == len(local_changes):
      return

    if self.IsDirty(consider_untracked=False):
      syncbuf.fail(self, _DirtyError())
      return

    # If the upstream switched on us, warn the user.
    #
    if branch.merge != self.revisionExpr:
      if branch.merge and self.revisionExpr:
        syncbuf.info(self,
                     'manifest switched %s...%s',
                     branch.merge,
                     self.revisionExpr)
      elif branch.merge:
        syncbuf.info(self,
                     'manifest no longer tracks %s',
                     branch.merge)

    if cnt_mine < len(local_changes):
      # Upstream rebased.  Not everything in HEAD
      # was created by this user.
      #
      syncbuf.info(self,
                   "discarding %d commits removed from upstream",
                   len(local_changes) - cnt_mine)

    branch.remote = self.GetRemote(self.remote.name)
    if not ID_RE.match(self.revisionExpr):
      # in case of manifest sync the revisionExpr might be a SHA1
      branch.merge = self.revisionExpr
      if not branch.merge.startswith('refs/'):
        branch.merge = R_HEADS + branch.merge
    branch.Save()

    if cnt_mine > 0 and self.rebase:
      def _dorebase():
        self._Rebase(upstream='%s^1' % last_mine, onto=revid)
        self._CopyAndLinkFiles()
      syncbuf.later2(self, _dorebase)
    elif local_changes:
      try:
        self._ResetHard(revid)
        self._CopyAndLinkFiles()
      except GitError as e:
        syncbuf.fail(self, e)
        return
    else:
      syncbuf.later1(self, _doff)
```

该函数不需要网络，仅是将前面获取到的更新合入本地工作区。该函数会比较当已检出的引用与仓库的引用的，确认本地仓库比远程仓库超前还是落后，如果远程仓库的引用本地没有，则使用`rebase`方式更新本地引用并合并到工作区。

## Init类的_LinkManifest函数
_LinkManifest函数比较简单，仅仅使用`-m`参数传入的或默认的文件名创建一个链接。
```python
def _LinkManifest(self, name):
    if not name:
      print('fatal: manifest name (-m) is required.', file=sys.stderr)
      sys.exit(1)

    try:
      self.manifest.Link(name)
    except ManifestParseError as e:
      print("fatal: manifest '%s' not available" % name, file=sys.stderr)
      print('fatal: %s' % str(e), file=sys.stderr)
      sys.exit(1)
```
至此`repo init`就结束了它的工作。然后即可使用`repo sync`同步所有项目。


# REPO SYNC
下面来看`sync`命令的`Execute`函数。该函数第一次运行时要根据 manifest 文件下载所有项目，之后再运行则同步所有项目到最新，所以该子命令比较复杂，但这里使用的大部分函数前面都用到过。

## sync命令的Execute函数实现
```python
def Execute(self, opt, args):
  
  ...

  rp = self.manifest.repoProject
  rp.PreSync()

  mp = self.manifest.manifestProject
  mp.PreSync()

  ...

  if not opt.local_only:
    mp.Sync_NetworkHalf(quiet=opt.quiet,
                        current_branch_only=opt.current_branch_only,
                        no_tags=opt.no_tags,
                        optimized_fetch=opt.optimized_fetch)

  ...

  all_projects = self.GetProjects(args,
                                  missing_ok=True,
                                  submodules_ok=opt.fetch_submodules)

  self._fetch_times = _FetchTimes(self.manifest)
  if not opt.local_only:
    to_fetch = []
    now = time.time()
    if _ONE_DAY_S <= (now - rp.LastFetch):
      to_fetch.append(rp)
    to_fetch.extend(all_projects)
    to_fetch.sort(key=self._fetch_times.Get, reverse=True)

    fetched = self._Fetch(to_fetch, opt)
    _PostRepoFetch(rp, opt.no_repo_verify)
    if opt.network_only:
      # bail out now; the rest touches the working tree
      return

    # Iteratively fetch missing and/or nested unregistered submodules
    previously_missing_set = set()
    while True:
      self._ReloadManifest(manifest_name)
      all_projects = self.GetProjects(args,
                                      missing_ok=True,
                                      submodules_ok=opt.fetch_submodules)
      missing = []
      for project in all_projects:
        if project.gitdir not in fetched:
          missing.append(project)
      if not missing:
        break
      # Stop us from non-stopped fetching actually-missing repos: If set of
      # missing repos has not been changed from last fetch, we break.
      missing_set = set(p.name for p in missing)
      if previously_missing_set == missing_set:
        break
      previously_missing_set = missing_set
      fetched.update(self._Fetch(missing, opt))

  ...

  syncbuf = SyncBuffer(mp.config,
                        detach_head = opt.detach_head)
  pm = Progress('Syncing work tree', len(all_projects))
  for project in all_projects:
    pm.update()
    if project.worktree:
      project.Sync_LocalHalf(syncbuf, force_sync=opt.force_sync)
  pm.end()
  print(file=sys.stderr)
  if not syncbuf.Finish():
    sys.exit(1)

  # If there's a notice that's supposed to print at the end of the sync, print
  # it now...
  if self.manifest.notice:
    print(self.manifest.notice)
```

首先取得`repoProject`和`manifestProject`两个对象，对这两个对象调用`PreSync`函数获取当前分支跟踪的远程分支负给`revisionExpr`，后续的`Sync_NetworkHalf`会使用该值来决定是否需要从远程仓库更新对象。前面已经讲过`Sync_NetworkHalf`函数，它使用`_InitGitDir`函数（如果仓库不存大）创建仓库目录并下载对象数据，或使用`_UpdateHooks`函数(仓库存在)创建`commit-msg -> ../../repo/hooks/commit-msg`，`pre-auto-gc -> ../../repo/hooks/pre-auto-gc`两个软链接链接向repo仓库下面hooks目录下的对应文件。该勾子脚本对Repo与Gerrit的协作起着至关重要的作用。这里之所以针对`manifestProject`对象再调用一次主要是为了防止清单库有更新，如果有更新，在同步项目时确保同步的是最新的清单文件指定的项目。

然后从清单文件获取所有的项目列表，使用`_Fetch`函数获取项目全部（第一次）或更新的对象文件到对应的远程分支上，并对照清单文件做一个检查，如果有未下载的再下载一次。之后为每个项目创建一个线程，在线程内部使用`Sync_LocalHalf`函数`rebase`到工作区。

`Sync_LocalHalf`函数主要通过`git rebase`命令来完成工作，主要有以下几种情况：
- 如果工作区当前处理分离头指针状态：直接检出最新的引用ID。
- 如果工作区当前处理本地分支上：直接检出最新的引用ID，使其处理分离头指针状态。
- 如果工作区当前处理本地远程跟踪分支上：如果工作区有未推送的提交则执行`git rebase`合并。


# REPO START
下面来看`start`命令的`Execute`函数。

## start命令的Execute函数实现
``` python
class Start(Command):
  common = True
  helpSummary = "Start a new branch for development"
  helpUsage = """
%prog <newbranchname> [--all | <project>...]
"""
  helpDescription = """
'%prog' begins a new branch of development, starting from the
revision specified in the manifest.
"""

  def _Options(self, p):
    p.add_option('--all',
                 dest='all', action='store_true',
                 help='begin branch in all projects')

  def Execute(self, opt, args):
    if not args:
      self.Usage()

    nb = args[0]
    if not git.check_ref_format('heads/%s' % nb):
      print("error: '%s' is not a valid name" % nb, file=sys.stderr)
      sys.exit(1)

    err = []
    projects = []
    if not opt.all:
      projects = args[1:]
      if len(projects) < 1:
        projects = ['.',]  # start it in the local project by default

    all_projects = self.GetProjects(projects,
                                    missing_ok=bool(self.gitc_manifest))

    # This must happen after we find all_projects, since GetProjects may need
    # the local directory, which will disappear once we save the GITC manifest.
    if self.gitc_manifest:
      gitc_projects = self.GetProjects(projects, manifest=self.gitc_manifest,
                                       missing_ok=True)
      for project in gitc_projects:
        if project.old_revision:
          project.already_synced = True
        else:
          project.already_synced = False
          project.old_revision = project.revisionExpr
        project.revisionExpr = None
      # Save the GITC manifest.
      gitc_utils.save_manifest(self.gitc_manifest)

      # Make sure we have a valid CWD
      if not os.path.exists(os.getcwd()):
        os.chdir(self.manifest.topdir)

    pm = Progress('Starting %s' % nb, len(all_projects))
    for project in all_projects:
      pm.update()

      if self.gitc_manifest:
        gitc_project = self.gitc_manifest.paths[project.relpath]
        # Sync projects that have not been opened.
        if not gitc_project.already_synced:
          proj_localdir = os.path.join(self.gitc_manifest.gitc_client_dir,
                                       project.relpath)
          project.worktree = proj_localdir
          if not os.path.exists(proj_localdir):
            os.makedirs(proj_localdir)
          project.Sync_NetworkHalf()
          sync_buf = SyncBuffer(self.manifest.manifestProject.config)
          project.Sync_LocalHalf(sync_buf)
          project.revisionId = gitc_project.old_revision

      # If the current revision is a specific SHA1 then we can't push back
      # to it; so substitute with dest_branch if defined, or with manifest
      # default revision instead.
      branch_merge = ''
      if IsId(project.revisionExpr):
        if project.dest_branch:
          branch_merge = project.dest_branch
        else:
          branch_merge = self.manifest.default.revisionExpr

      if not project.StartBranch(nb, branch_merge=branch_merge):
        err.append(project)
    pm.end()

    if err:
      for p in err:
        print("error: %s/: cannot start %s" % (p.relpath, nb),
              file=sys.stderr)
      sys.exit(1)
```

从源代码中也可以看到`start`命令的使用方法：
```bash
repo start <newbranchname> [--all | <project>...]
```

如果没有提供`--all`参数，则取后面指定的`<project>`列表作为操作对象，如果`<project>`为空，则取当前目录所在的项目作为操作项目。

为每一个项目创建一个线程来处理。该线程首先检查当前分支所处的状态，如果处于“分离头指针”（即处于具体的 SHA1 上）状态，则判断是否定义默认的codereview分支（`dest_branch`默认codereview分支由清单文件的`dest-branch`属性指定），如果有则使用清单文件指定的默认的codereview分支作为`branch_merge`的值，如果没有则使用manifest.xml中指定的关于该项目的revision属性作为`branch_merge`的值。接下来使用新的分支名`<newbranchname>`和`branch_merge`作参数调用`project`类的`StartBranch`创建新分支。

如果项目刚同步下来第一次调用`repo start`此时项目处理分离头指针状态，且默认的manifest文件没有指定`dest-branch`属性，所以`dest_branch`取manifest.xml中关于该项目的`revision`属性。如果项目已处理某个分支之上，则`dest_branch`为空。后面会看到如果入参`dest_branch`为空，会取项目当前所处的分支。

## project类的StartBranch函数
``` python
  def StartBranch(self, name, branch_merge=''):
    """Create a new branch off the manifest's revision.
    """
    if not branch_merge:
      branch_merge = self.revisionExpr
    head = self.work_git.GetHead()
    if head == (R_HEADS + name):
      return True

    all_refs = self.bare_ref.all
    if R_HEADS + name in all_refs:
      return GitCommand(self,
                        ['checkout', name, '--'],
                        capture_stdout=True,
                        capture_stderr=True).Wait() == 0

    branch = self.GetBranch(name)
    branch.remote = self.GetRemote(self.remote.name)
    branch.merge = branch_merge
    if not branch.merge.startswith('refs/') and not ID_RE.match(branch_merge):
      branch.merge = R_HEADS + branch_merge
    revid = self.GetRevisionId(all_refs)

    if head.startswith(R_HEADS):
      try:
        head = all_refs[head]
      except KeyError:
        head = None
    if revid and head and revid == head:
      ref = os.path.join(self.gitdir, R_HEADS + name)
      try:
        os.makedirs(os.path.dirname(ref))
      except OSError:
        pass
      _lwrite(ref, '%s\n' % revid)
      _lwrite(os.path.join(self.worktree, '.git', HEAD),
              'ref: %s%s\n' % (R_HEADS, name))
      branch.Save()
      return True

    if GitCommand(self,
                  ['checkout', '-b', branch.name, revid],
                  capture_stdout=True,
                  capture_stderr=True).Wait() == 0:
      branch.Save()
      return True
    return False
```

在project.py文件的`project`类中`StartBranch`以及之后的`CheckoutBranch`、`AbandonBranch`、`PruneHeads`几个函数主要是用作分支管理的。后续的`repo checkout`、`repo abandon`、`repo prune`就是使用它们来完成工作的。在这里只分支`StartBranch`函数，其它的函数后续遇到的时候再分析。

检查当前分支是不是要创建的分支，如果是就什么也不做，如果不是再检查要创建的分支是否已存在，如果存在就检出该分支。

# REPO UPLOAD
在执行upload时，如果指定了项目则从指定项目中查找，如果没有指定则遍历所有项目。

Repo工具为每一个项目添加一个`refs/published/<branch_name>`引用文件来记录该分支的最新upload引用。

对于一个项目的所有topic分支，获取未upload的变更的过程如下：
1. 首行比较它的`refs/heads/<branch_name>`与对应的`refs/published/<branch_name>`，如果两个引用的ref_id相同，就认为所有提交都已提交Review。
2. 否则就获取该分支的未推送变更，如果没有未推送变更，则认为所有提交都已提交Review。
3. 否则就列出未推送的变更等待upload。

## Review路径的获取
默认情况下Repo要与Gerrit通过两次网络交互才能将变更推送上去，第一个只通过http协议获取一个推送的地址。

Repo会向manifest文件中review属性指定的url发送一个地址为`http://$url/ssh_info`的http请求，Gerrit会返回提交变更使用的真正ssh地址及端口号。默认的端口号为29418。

## 推送变更到Gerrit
Repo使用以下命令格式推送变更：
```bash
git push --receive-pack='gerrit receive-pack --reviewer=<reviewer_email> --cc=<cc_user_email>' \
         ssh://username@{前面http请求返回的url地址}:{前面返回的端口号}/<project_name> <review_branch>:refs/for/<dest_branch>
```
把变更推送到Gerrit后，Repo会更新本地topic分支的`refs/published/<branch_name>`引用。

其实我们也可以使用手动的方式来推送变更到Gerrit，但是不能自动更新pushlished下的引用，因此再使用`repo upload`命令时会发现变更会再次让你upload，但其实他们已经推送到Gerrit了，你必须手动更新`refs/published/<branch_name>`到你的HEAD。
