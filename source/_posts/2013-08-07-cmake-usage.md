---
title: CMAKE使用
date: 2013-08-07
categories:
  - 工具使用
tags:
  - cmake
---
使用CMake很简单，通过在每个目录下创建一个或多个CMakeLists文件来编译进程处理整个项目。CMakeLists文件包含CMake语言对项目的描述，CMake语言由一系列的命令组成。
<!--more-->

这些命令的形式如下：
```cmake
command (args...)
```
其中`command`是命令的名字，`args`是使用空格或分号分隔的参数列表。CMake命令从2.2开始是不区分大小写，因此你可以使用`COMMAND`来代替`command`，或者使用`Command`。

CMake有非常详细的说明[文档](https://cmake.org/cmake/help/latest/)，如果你想了解哪条命令的详细信息，可以直接查看官方文档。

## CMake变量
CMake的变量可以赋字符串或者字符串列表，变量是通过`${VAR}`方式引用的。使用set命令可以给变量赋值，多个空格分隔的参数被当做一个列表被赋给变量，如：`set(Foo a b c)`将会把`a b c`赋给Foo，并且如果Foo作为另一个命令的参数`command(${Foo})`它等效于`command(a b c)`。如果你想传一个列表给命令作为一个单独的参数，你需要用双引号括起来。如`command("${Foo}")`，将会被解引用为只有一个字符串参数`set("Foo a b c")`。

系统环境变量和Windows注册值都能在CMake中访问到。访问环境变量使用`$ENV{VAR}`，后面再介绍。

## Hello World
先来看我们万年不变的`Hello World`程序的CMakeLists文件。

新建一个目录t1，在该目录下创建hello.c文件：
```c
#include<stdio.h>

int main(int argc, char* argv[])
{
    printf("Hello World\n");

    return 0;
}
```

再创建一个名为CMakeLists.txt文件，内容如下：
```cmake
project(Hello)
add_executable(Hello hello.c)
```

当前目录内文件如下：
```bash
$ tree
.
├── CMakeLists.txt
└── hello.c

0 directories, 2 files
```

在t1目录下执行`cmake .`，之后便会在当前目录下生成Makefile文件，使用make来编译出helo可执行文件。
```bash
$ make
Scanning dependencies of target Hello
[ 50%] Building C object CMakeFiles/Hello.dir/hello.c.o
[100%] Linking C executable Hello
[100%] Built target Hello
$ ls
CMakeCache.txt  CMakeFiles  CMakeLists.txt  Hello  Makefile  cmake_install.cmake  hello.c
$ ./Hello 
Hello World
```

`project`命令声明项目的名字，`add_executable`命令指明要生成一个可执行文件。这就是一个简单的项目所需要的一切，如果你的简单项目还包含一个其它的源文件，只需要修改`add_executable`行即可：
```cmake
add_executable(Hello hello.c file1.c file2.c file3.c)
```

上面的例子基本不具有什么实用价值，如果你的源文件很少，完全可以直接写Makefile文件来搞定。看下面这个稍微完整一点的例子：
```cmake
cmake_minimum_required(2.6)
project(HELLO)

set(HELLO_SRC hello.c file1.c file2.c file3.c)

if (WIN32)
    set(HELLO_SRC ${HELLO_SRC}, WinSupport.c)
else ()
    set(HELLO_SRC ${HELLO_SRC}, UnixSupport.c)
endif ()

add_executable(Hello ${HELLO_SRC})

# look fo TCL library
find_library (TCL_LIBRARY
    NAMES tcl tcl83 tcl84
    PATHS /usr/lib /usr/local/lib
    )

if (TCL_LIBRARY)
    target_link_libraries(Hello ${TCL_LIBRARY})
endif ()
```
使用`set`命令把所有的源文件放在一个变量中，使用`if`判断添加特定系统环境的源文件，最后使用`add_executable`命令从`HELLO_SRC`源文件列表中创建一个可执行文件。使用`find_library`在 PATHS 指定的路径查找 NAMES 指定的库，找到后把库的路径存放在`TCL_LIBRARY`变量中，最后如果`TCL_LIBRARY`变量不为空，就链接需要的库。`#`开始的行表示注释。这个例子中使用到的语法后面会讲到。下面先来了解一下CMkae的总体结构。

## 总体结构
在你开始使用CMake工作之前先来认识一下相关的一些概念，如目标（target）、生成器（generator）和命令（commands）。在CMake中这些概念是使用C++类实现的，了解这些概念可以帮助你更好的理解CMake的工作方法。如下图：

![cmake-structure](/img/cmake-structure.png)

CMake的执行是通过创建`CMkae`类的一个实例并，这个实例管理所有的配置过程并存储全局信息。该实例做的第一件事情就是基于用户的选择与系统环境创建一个全局生成器，之后把控制权转交给全局生成器。

全局生成器负责管理所有CMakeLists文件的配置和生成工作，实际上，大部分的工作是在全局生成器创建的本地生成器里完成的，在全局生成器处理每一个目录时都会为其创建一个本地生成器。

本地生成器是类`cmMakefile`的一个实例，cmMakefile文件是存放解析CMakeLists文件结果的地方。特别的，项目中的每个目录都有一个cmMakefile实例与其一一对应。这个实例保存从对应目录下的CMakefileLists文件解析出来的所有信息。一种理解cmMakefile类的方法是把它看成这样一种结构，它从它的父目录初始化一些变量，然后在处理它的子目录过程中不断对它进行填充。

## 一个好一点的 Hello World
```cmake
cmake_minimum_required(VERSION 2.6)
project(HELLO)
set(SRC_LIST main.c)
add_executable(hello ${SRC_LIST})
```

### cmake_minimum_required
`cmake_minimum_required`指定当前CMakeLists文件需要的最底CMake版本。

### project
`project`命令设定整个项目的名字，版本，语言，语法如下：
```cmake
project(<PROJECT-NAME> [LANGUAGES] [<language-name>...])
project(<PROJECT-NAME>
        [VERSION <major>[.<minor>[.<patch>[.<tweak>]]]]
        [LANGUAGES <language-name>...])
```
设定项目的名字并存储在`PROJECT_NAME`变量中，同时定义以下变量：
- `PROJECT_SOURCE_DIR, <PROJECT-NAME>_SOURCE_DIR`
- `PROJECT_BINARY_DIR, <PROJECT-NAME>_BINARY_DIR`
`PROJECT_SOURCE_DIR, <PROJECT-NAME>_SOURCE_DIR`指工程的源文件路径，`PROJECT_BINARY_DIR, <PROJECT-NAME>_BINARY_DIR`指工程的编译路径。

如果指定了VERSION，则后面的各项值必须是非负整数。如果没有指定版本，则默认的版本为空字串。`project`同时产生下面与版本相关的变量：
- `PROJECT_VERSION, <PROJECT-NAME>_VERSION`
- `PROJECT_VERSION_MAJOR, <PROJECT-NAME>_VERSION_MAJOR`
- `PROJECT_VERSION_MINOR, <PROJECT-NAME>_VERSION_MINOR`
- `PROJECT_VERSION_PATCH, <PROJECT-NAME>_VERSION_PATCH`
- `PROJECT_VERSION_TWEAK, <PROJECT-NAME>_VERSION_TWEAK`

你可以指定你的工程支持何种语言，如果不指定则默认支持所有语言。工程顶层目录的CMakeLists文件必须包含`project`命令。

### set
`set`命令设置普通，缓存，环境变量为指定的值，在当前函数或者目录域内。

- 设置 __普通__ 变量命令格式如下：
    ```cmake
    set(<variable> <value>... [PARENT_SCOPE])
    ```
    `<value>...`期待零个或多个参数，多个参数实际上被当作一个列表。零个参数会导致普通变量被`unset`。如果指定了`PARENT_SCOPE` 选项，该操作对当前域及以上产生作用。如上面的设置`SRC_LIST`为`main.c`。如果有多个源文件则可以如下方式指定：
    ```cmake
    SET(SRC_LIST main.c t1.c t2.c)
    ```

- 设置 __缓存__ 变量命令格式如下：
    ```cmake
    set(<variable> <value>... CACHE <type> <docstring> [FORCE])
    ```
    设置给定的缓存`<variable>`（缓存条目）。由于缓存条目旨在提供用户可设置的值，因此默认情况下不会覆盖现有的缓存条目。使用FORCE选项可以覆盖现有条目。
    `<type>`可以是以下之一：
    - BOOL: 布尔值ON/OFF
    - FILEPATH: 文件的路径
    - PATH: 目录路径
    - STRING: 字符串
    - INTERNAL: 字符串，它们可以用于在运行中永久存储变量

  `<docstring>`必须被指定以快速摘要呈现一行文本。

  如果缓存条目在调用之前不存在，或者FORCE给出该选项，则缓存条目将被设置为给定值。高速缓存条目有可能在调用之前存在，如果在其上创建了类型，则不会再设置类型。 由用户通过命令行`-D<var>=<value>`选项而不指定类型指定的变量，在这种情况下，set命令将添加类型。此外，如果<type>是PATH或FILEPATH与<value>所提供的命令行中是相对路径，则该set命令将把路径相对于当前的工作目录并将其转换为绝对路径。

- 设置 __环境__ 变量命令格式如下：
    ```cmake
    set(ENV{<variable>} <value>...)
    ```
    设置当前处理程序的环境变量为指定的值。

### add_executable
`add_executable`命令使用给定的源文件列表为创建一个可执行文件。该命令格式如下：
```cmake
add_executable(<name> [WIN32] [MACOSX_BUNDLE]
            [EXCLUDE_FROM_ALL]
            source1 [source2 ...])
```
`<name>`对应逻辑目标名称，且必须是项目唯一的。真正的文件名称是平台依赖的（如在Windows系统中为`<name>.exe`）。

默认情况下，将在与调用命令的源树目录相对应的构建树目录中创建可执行文件（即如果目标添加在`${PROJECT_SOURCE_DIR}/src/`目标下，则会在`${PROJECT_BINARY_DIR}/src/`下生成目标文件）。

可以修改`RUNTIME_OUTPUT_DIRECTORY`目标属性更改此位置。可以使用`OUTPUT_NAME`目标属性来指定`<name>`的最终文件名。如：
```cmake

```

`EXCLUDE_FROM_ALL`参数的意思是这个库不会被默认构建,除非有其他的组件依赖或者手工构建。

## 内部构建与外部构建
前面我们构建的时候在当前目录里生成了很多中间文件，这些中间文件主要是一些缓存文件。这种方式就是内部构建。内部构建时`PROJECT_SOURCE_DIR, <PROJECT-NAME>_SOURCE_DIR`与`PROJECT_BINARY_DIR, <PROJECT-NAME>_BINARY_DIR`指向相同的路径。内部构建在源文件较少时还可以接受，但如果源文件很多就根本区分不了哪些是源文件哪些是中间文件。还好CMake支持一种更优雅的方式－－外部构建。

下面我们来看外部构建：
我们在工程根目录下创建build目录，进入build目录，在build目录里面运行`cmake ..`
```bash
[zyl@localhost:t2]$ tree
.
├── CMakeLists.txt
└── func_lib.c

$ pwd
/home/zyl/WORKING_DIRECTORY/cmake/t2
$ mkdir build
$ cd build
$ cmake ..
-- The C compiler identification is GNU 7.1.1
-- The CXX compiler identification is GNU 7.1.1
-- Check for working C compiler: /usr/bin/cc
-- Check for working C compiler: /usr/bin/cc -- works
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Detecting C compile features
-- Detecting C compile features - done
-- Check for working CXX compiler: /usr/bin/c++
-- Check for working CXX compiler: /usr/bin/c++ -- works
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- Configuring done
-- Generating done
-- Build files have been written to: /home/zyl/WORKING_DIRECTORY/cmake/t2/build
$ make
...
```
构建完成之后所有的中间文件及目标输出都在build目录，这样工程目录就非常干净。我们完全可以任意指定编译目录，如工程目录以外的目录。外部构建时`PROJECT_SOURCE_DIR, <PROJECT-NAME>_SOURCE_DIR`还是指向工程的源文件路径，而`PROJECT_BINARY_DIR, <PROJECT-NAME>_BINARY_DIR`则指向刚刚我们创建的编译目录。

## 更好一点的 Hello World
看下面目录结构：
```bash
$ tree
.
├── CMakeLists.txt
└── src
    ├── CMakeLists.txt
    └── hello.c

1 directory, 3 files
```

根目录下的CMakeLists文件：
```cmake
cmake_minimum_required(VERSION 2.6)
project(Hello)
add_subdirectory(src)
```

src子目录下的CMakeLists文件：
```cmake
set(SRC_LIST hello.c)
add_executable(Hello ${SRC_LIST})
```

### add_subdirectory
`add_subdirectory`向工程添加一个要编译的目录。格式如下：
```cmake
add_subdirectory(source_dir [binary_dir]
                 [EXCLUDE_FROM_ALL])
```
- `source_dir`指定源CMakeLists.txt和代码文件所在的目录。如果它是相对路径，它将针对当前目录进行处理（典型用法），但也可以是绝对路径。
- `binary_dir`指定输出文件的放置位置。如果它是相对路径，它将针对当前的输出目录(由`PROJECT_BINARY_DIR, <PROJECT-NAME>_BINARY_DIR`指定)进行展开，但也可以是绝对路径。如果`binary_dir`未指定，输出将以`source_dir`指定的名称进行相对展开（典型用法）。
- 指定的源目录中的CMakeLists.txt文件将在处理当前文件中其它命令之前由CMake立即处理。
- `EXCLUDE_FROM_ALL`参数默认情况下将子目录中的目标从父目录的目标中排除，并将从整个项目文件中排除，除非目标被其它目标依赖，或者用户在子目录中显式构建目标。

不论`add_subdirectory`命令是否指定编译输出目录，我们都可以通过 SET 指令重新定义`EXECUTABLE_OUTPUT_PATH`和`LIBRARY_OUTPUT_PATH`变量来指定最终的目标二进制的位置(指最终生成的 hello 或者最终的共享库,不包含编译生成的中间文件)。
```cmake
set(EXECUTABLE_OUTPUT_PATH ${PROJECT_BINARY_DIR}/bin)
set(LIBRARY_OUTPUT_PATH ${PROJECT_BINARY_DIR}/lib)
```

## 静态库与动态库
工程上我们经常需要创建静态库或者动态库，看下面结构：
```bash
$ tree
.
├── CMakeLists.txt
├── include
│   └── fun.h
└── src
    ├── CMakeLists.txt
    └── fun.c

2 directories, 4 files
```

顶层CMakeLists.txt文件内容：
```cmake
cmake_minimum_required(VERSION 2.6)
project(hello_lib)
add_subdirectory(src)
```

src目录下的CMakeLists.txt文件内容：
```cmake
set(SRC_LIST fun.c)
include_directories(${PROJECT_SOURCE_DIR}/include)
add_library(mymath SHARED ${SRC_LIST})
add_library(mymath STATIC ${SRC_LIST})
```

源代码如下：
```c
//fun.h

extern int add(int, int);

//fun.c
#include "fun.h"

int add(int num1, int num2)
{
	return num1 + num2;
}
```

### include_directories
`include_directories`命令格式如下：
```cmake
include_directories([AFTER|BEFORE] [SYSTEM] dir1 [dir2 ...])
```
这条指令可以用来向工程添加多个特定的头文件搜索路径。相对路径被解释为相对于当前源目录。路径之间用空格分割,如果路径中包含了空格,可以使用双引号将它括起来,默认的行为是追加到当前的头文件搜索路径的后面,你可以通过两种方式来进行控制搜索路径添加的方式:
- 可以通过设置`CMAKE_INCLUDE_DIRECTORIES_BEFORE`到ON来更改此默认行为以将添加的头文件搜索路径放在已有路径的前面。
- 通过使用AFTER或BEFORE显式参数指定放前还是放后。

include目录被添加到当前CMakeLists文件的`INCLUDE_DIRECTORIES`目录属性。同时他们也被添加到了下级的每个CMakeLists的目标属性中。

SYSTEM选项指明这些目录是平台上的系统包含目录，编译器在搜索系统目录查找头文件时会搜索它们。

### add_library
`add_library`命令，对于普通形式的库格式如下：
```cmake
add_library(<name> [STATIC | SHARED | MODULE]
            [EXCLUDE_FROM_ALL]
            source1 [source2 ...])
```
- `<name>`从命令列出的源文件为工程添加一个库目标。`<name>`为目标对应的逻辑目标名称，且必须在项目中全局唯一。构建出的库的实际文件名是平台相关的（例如`lib<name>.a`或`<name>.lib`）。
- `STATIC, SHARED`或者`MODULE`指定要创建的库的类型。STATIC为静态库。 SHARED为动态库。 MODULE库是不连接到其他目标的插件，但可以使用类似dlopen的功能在运行时动态加载。如果没有明确给出类型，则该类型是`STATIC`或者`SHARED`要基于`BUILD_SHARED_LIBS`变量的当前值是ON还是OFF。
- 默认情况下，库文件将在与调用命令的源树目录相对应的构建树目录中创建。可以通过修改`ARCHIVE_OUTPUT_DIRECTORY`，`LIBRARY_OUTPUT_DIRECTORY`和`RUNTIME_OUTPUT_DIRECTORY`目标属性来更改此位置。以及使用`OUTPUT_NAME`目标属性来更改`<name>`最终文件名。
- `EXCLUDE_FROM_ALL`与上面几个命令的`EXCLUDE_FROM_ALL`含义相同。

在src目录下的CMakeLists.txt文件中我们指定了两条下面我们使用两条`add_library`，我们期望即生成静态库也生成动态库。下面使用外部构建的方法来构建它：
```bash
$ mkdir build
$ cd build
$ cmake ..
-- The C compiler identification is GNU 4.3.4
-- The CXX compiler identification is GNU 4.3.4
-- Check for working C compiler: /usr/bin/cc
-- Check for working C compiler: /usr/bin/cc -- works
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Detecting C compile features
-- Detecting C compile features - done
-- Check for working CXX compiler: /usr/bin/c++
-- Check for working CXX compiler: /usr/bin/c++ -- works
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Detecting CXX compile features
-- Detecting CXX compile features - done
CMake Error at src/CMakeLists.txt:3 (add_library):
  add_library cannot create target "mymath" because another target with the
  same name already exists.  The existing target is a shared library created
  in source directory "/home/zhuyanlei/cmake/t3/src".  See documentation for
  policy CMP0002 for more details.

-- Configuring incomplete, errors occurred!
See also "/home/zhuyanlei/cmake/t3/build/CMakeFiles/CMakeOutput.log".
```

报错了，说是目标已存在，不能重复定义。我们想同时生成一个库的多种形式，如同时生成静态库和动态库，侧需要使用一种策略（CMP0002），先添加一个不同的目标名称，然后使用目标属性`OUTPUT_NAME`来修改最终输出的目标名称。下面来看修改后的CMakeLists.txt文件：
```cmake
set(SRC_LIST fun.c)
include_directories(${PROJECT_SOURCE_DIR}/include)
add_library(mymath SHARED ${SRC_LIST})
add_library(mymath_static STATIC ${SRC_LIST})
set_target_properties(mymath_static PROPERTIES OUTPUT_NAME "mymath")
```

### set_target_properties
同时我们学习一下 `set_target_properties`命令：
```cmake
set_target_properties(target1 target2 ...
                      PROPERTIES prop1 value1
                      prop2 value2 ...)
```
设置指定目标的属性，可以指定多个目标，多组属性。可以使用`get_target_property(VAR target property)`对属性进行取值。关于目标的属性可以查看[target-properties](https://cmake.org/cmake/help/latest/manual/cmake-properties.7.html#target-properties)。

清除中间文件再进行一次构建，这一次成功生成了`libmath.so`与`libmath.a`。

## 使用库文件
创建新的工程目录并添加测试文件，其中的头文件和库取自上一个工程：
```bash
$ tree
.
├── CMakeLists.txt
├── include
│   └── fun.h
├── lib
│   ├── libmymath.a
│   └── libmymath.so
└── src
    ├── CMakeLists.txt
    └── test.c

3 directories, 6 files
```

顶层CMakeLists文件内容如下：
```cmake
cmake_minimum_required(VERSION 3.8)
project (Test)
add_subdirectory(src)
```

src目录下的CMakeLists文件内容如下：
```cmake
set(SRC_LIST test.c)
include_directories(${PROJECT_SOURCE_DIR}/include)
link_directories(${PROJECT_SOURCE_DIR}/lib)
add_executable(Test ${SRC_LIST})
target_link_libraries(Test mymath)
```

源文件代码如下：
```c
#include <stdio.h>
#include "fun.h"

int main(int argc, char* argv[])
{
    printf("3 + 2 = %d\n", add(3, 2));

    return 0;
}
```

### link_directories
`link_directories`命令格式如下：
```cmake
link_directories(directory1 directory2 ...)
```
添加额外的链接器搜索路径。该命令必须在目标创建之前指定否则没有效果。可以给出相对路径也可以给出绝对路径。路径之间使用空格隔开。

注意，很多时候其实可以不使用该命令，因为使用`find_package()`与`find_library()`他们会返回找到目标的绝对路，这些目标地址可以直接使用在`target_link_libraries()`命令中。

### target_link_libraries
`target_link_libraries`命令可以指定目标的链接和依赖，它有多种形式，通用格式如下：
```cmake
target_link_libraries(<target> ... <item>... ...)
```
`<target>`必须是在当前目录下使用`add_executable()`或`add_library()`创建的目标，多个目标会被依次按序追加到调用列表中。

每个`<item>`可能是以下中的一个：
- 库目标名称：前面使用`add_library()`创建的库目标，或者一个`IMPORTED library`。如果库文件更改，链接系统会重新链接目标文件。
- 库文件的完整路径：生成的链接行通常将保留文件的完整路径。如`/usr/lib/libfoo.so`。如果库文件更改，链接系统会重新链接目标文件。
- 一个简化的库名称：一个简单的库逻辑名称，需要链接器搜索库。如`foo`变为`-lfoo`。
- 一个链接标志：以`-`开始的一个链接标志，但不能是`-l`或`-framework`。这些标志被视作同其它库一样的依赖被添加到目标链接时。这样的标志不会传播到其它目标，可以将它看做是私有的。

编译输出：
```bash
$ cmake ..
-- The C compiler identification is GNU 7.1.1
-- The CXX compiler identification is GNU 7.1.1
-- Check for working C compiler: /usr/bin/cc
-- Check for working C compiler: /usr/bin/cc -- works
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Detecting C compile features
-- Detecting C compile features - done
-- Check for working CXX compiler: /usr/bin/c++
-- Check for working CXX compiler: /usr/bin/c++ -- works
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- Configuring done
-- Generating done
-- Build files have been written to: /home/zyl/WORKING_DIRECTORY/cmake/t3/build
$ make
Scanning dependencies of target Test
[ 50%] Building C object src/CMakeFiles/Test.dir/test.c.o
[100%] Linking C executable Test
[100%] Built target Test
$ cd src
$ export LD_LIBRARY_PATH=../../lib
$ ./Test 
3 + 2 = 5
```

CMake默认先查找动态库，因此构建的可执行程序使用了动态链接方式。由于我们的动态库不在系统动态链接器的搜索路径中，所以如果直接运行Test会报“无法找到动态库”的错误，这里我们使用环境变量`LD_LIBRARY_PATH`指定动态库搜索的附加路径。可以使用ldd使用来查看库的链接情况：
```bash
$ cd build
$ ldd src/Test 
linux-vdso.so.1 =>  (0x00007ffff05ff000)
libmymath.so => /home/zhuyanlei/cmake/t4/lib/libmymath.so (0x00007f15d468a000)
libc.so.6 => /lib64/libc.so.6 (0x00007f15d42e3000)
/lib64/ld-linux-x86-64.so.2 (0x00007f15d488d000)
```

CMake默认情况下链接的是动态链接库，可以给出静态库的全名或者仅仅加一个`.a`（或者`.lib`）后缀即可使其查找静态库，也可以使用上面说的把静态链接标志`-static`做为一个`<item>`选项。

修改src目录下的CMakeLists文件：
```cmake
target_link_libraries(Test mymath.a)
```
或者：
```cmake
target_link_libraries(Test mymath "-static")
```
重新构建生成，这时就生成了静态链接的可执行文件。

## 变量的作用域
CMake中变量的作用域跟其它语言有点不太一样，当你设置一个变量后，它对当前CMakeLists文件或者当前函数，宏可见，同时也对任何子目录的CMakeLists文件，函数，宏或任何包含的其它文件可见。当处理一个新的子目录时或函数调用时，一个新的变量作用域被创建，并使用它的父作用域的值初始化。任何子作用域内变量的修改都不影响它的父作用域。

看下面一个例子：
```cmake
function(foo)
    message(${test}) # 这里test是1
    set(test 2)
    message(${test}) # 这里test是2
endfunction()

set(test 1)
foo()
message(${test}) # test还是1
```

有时候你可能希望在函数或者子目录作用域修改的变量对它的父作用域产生影响，这也是一种从函数返回值的方法。你需要在使用`set`命令时使用PARENT_SCOPE选项。看下面的例子：
```cmake
function(foo)
    message(${test}) # 这里test是1
    set(test 2 PARENT_SCOPE)
    message(${test}) # 这里test是2
endfunction()

set(test 1)
foo()
message(${test}) # test在这里已经变成2了
```

## 库的查找
前面工程在链接库文件时通过向链接器添加一个非标准的库搜索路径，之后链接器就能找到库文件了。下面使用另外一个方式，直接在指定目录中搜索库，如果找到就链接到目标文件中。还是前面的工程，我们稍做修改。

把src目录下的CMakeLists文件内容修改如下：
```cmake
set(SRC_LIST test.c)
include_directories(${PROJECT_SOURCE_DIR}/include)
add_executable(Test ${SRC_LIST})

find_library (MYMATH_LIBRARY
    NAMES mymath
    PATHS ${PROJECT_SOURCE_DIR}/lib
    )

if (MYMATH_LIBRARY)
    target_link_libraries(Test ${MYMATH_LIBRARY})
endif ()
```

如果想要以静态链接的方式生成可执行文件NAMES项必须指定全名，只添加`.a`后面会提示找不到文件，如：
```cmake
set(SRC_LIST test.c)
include_directories(${PROJECT_SOURCE_DIR}/include)
add_executable(Test ${SRC_LIST})

find_library (MYMATH_LIBRARY
    NAMES libmymath.a
    PATHS ${PROJECT_SOURCE_DIR}/lib
    )

if (MYMATH_LIBRARY)
    target_link_libraries(Test ${MYMATH_LIBRARY})
endif ()
```

