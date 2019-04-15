---
title: Python学习笔记
date: 2014-01-07
categories: 学习笔记
tags: python
---
主要记录一些Python的读书笔记，以及在使用Python中的一些经验总结。记录一下，以方便忘记的时候查阅。
<!--more-->

## UNIX env查找
在类UNIX系统上写脚本时，一般脚本的“hash bang”可以使用env来加载解释器，这样就可以提高脚本的通用性。

## 可变与不可变
Python的所有基本数据类型都区分可变与不可变，区分这一点很重要，因为Python里很多类型都需要索引，只有不可变类型才是可Hash的，才能做为键或者值。

## 关键定参数与默认值参数
`name=vlane`的形式在定义和调用中是不同的。在定义时表示定义的参数带默认值，在调用时表示以关键字参数进行传参。

## keywork-only参数
Python3.0之后可以指定keywork-only参数，keywork-only参数出现在`*args`或`*`之后，在调用中必须使用关键字语法来进行传递。如果只使用一个`*`，表示一个函数不会接受一个变量长度的参数列表，而只是期望跟在`*`后面的参数成为关键字参数。注意，仍然可以对关键字参数使用默认值。在调用时，没有指定默认值的关键字参数必须以关键字参数形式传参。在一个函数头部，keywork-only参数必须编写在`**args`__任意关键字形式__之前，且在`*args`__任意位置形式__之后。

## 完整的迭代协议
完整的迭代协议基于两个对象，通过两步被迭代工具使用：
- 通过`iter`调用`__iter__`产生迭代所需要的可迭代对象（迭代器）。
- 由迭代器对象在迭代过程中产生实际的值，每次通过调用迭代器对象的`next`方法（`next`方法实际调用`__next__`）产生下一个值，并在结尾时产生`StopIterationwhen`异常。

迭代工具在大多数情况下使用上面的两个步骤，但在迭代有些对象时第一个步骤被省略，因为这些对象是它们自身的迭代器（如文件对象）。

## 新的可迭代对象
Python3.0中更强调迭代，除了文件、字典等内置类型相关的迭代，字典的方法keys, values, items都是可迭代的。另外内置函数range, map, zip, filter也都是可迭代的。

## lambda表达式
lambda表达式的一般形式：
```python
lambda argument1, argument2, ... argumentN :expression using arguments
```
lambda表达式与def函数的区别：
- lambda是一个表达式，而不是一个语句。
- lambda的主体是一个单个的表达式，而不是一个代码块。

## 在序列上映射函数 map
map函数对序列对象上的每一个元素应用被传入的函数，并且返回了一个包含所有函数调用结果的一个列表。

## 静态方法与类方法
- 在Python2.6中，从一个类获取一个方法会产生一个__未绑定方法__，没有手动传递一个实例就不让调用它。
- 在Python3.0中，从一个类获取一个方法会产生一个 __简单函数__ ，没有给出实例也可以调用它。
换句话说，Python2.6类方法总是要求传入一个实例，不管是通过一个实例或类调用它。相反Python3.0中，只有当一个方法期待实例的时候，我们才给它传入一个实例。结果是：
- 在Python2.6中，我们必须总是把方法声明为静态的，从而不带一个实例去调用它，不管是通过一个实例或者一个类去调用它。
- 在Python3.0中，如果方法只通过一个类调用的话，我们不需要将这样的方法声明为静态的，但是要通过实例来调用它，侧必须声明为静态的。

## 字符串变化
### Python3.0的字符串类型变化
Python 2.X有一种通用的字符串类型str来表示二进制数据和像ASCII这样的8位文本，还有一种特定的类型用来表示多字节Unicode文本：
- str表示8位文本和二进制数据
- unicode用来表示宽字符Unicode文本

Python 3.X的字符默认使用Unicode字符，它用一种str表示所有的文本类型（ASCII也是一种Unicode字符），使用bytes与byteyarray表示二进制数据：
- str表示Unicode文本（8位的和更宽的）
- bytes表示二进制数据
- bytearray，是一种可变的bytes类型

### 编码与解码
Python2.X中的str与Unicode可以自由混合，但Python3.X引入了一个更鲜明的区分——str和bytes类型对象不能在表达式中自动地混合，并且当传递给函数的时候不会自动地相互转换。期待一个str对象作为参数的函数，通常不能接受一个bytes；反之亦然。

因此，Python3.X基本上要求遵守一种类型或另一种类型，或者手动执行显式转换：
- `str.encode()`和`bytes(S, encoding)`把一个字符串转换为其raw bytes形式，并且在此过程中根据一个str创建一个bytes。
- `bytes.decode()`和`str(B, encoding)`把raw bytes转换为其字符串形式，并且在此过程中根据一个bytes创建一个str。
encode和decode方法针对你的平台使用一个默认编码，或者一个显式传入的编码名。

注意：
在使用bytes编码一个字符串时，它的第二个参数（encoding）不是可选的，在编码一个字符串时你必须手动指定编码格式。
但使用str解码一个raw bytes串时，它的第二个参数（encoding）就可选的，但省略该参数并不意味着取平台默认值。相反，不带编码的str调用返回对象的打印字符串，而不是其解码后的形式，这并不是我们想要的。

### 源文件字符集编码声明
Python默认地使用UTF-8编码，但是，它允许我们通过包含一个注释来指明想要的编码，从而将默认值修改为支持任意的字符集。这个注释必须拥有如下的形式，并且在Python 2.6或Python 3.0中必须作为脚本的第一行或第二行出现：
```python
# -*- coding: latin-1 -*-
```

## 管理属性
- `__getattr__`和`__setattr__`方法，把未定义的属性获取和所有的属性赋值指向通用的处理器方法。
- `__getattribute__`方法，把所有属性获取都指向Python 2.6的新式类和Python 3.0的所有类中的一个泛型处理器方法。
- `property`内置函数，把特定属性访问定位到get和set处理器函数，也叫做特性（Property）。
- 描述符协议，把特定属性访问定位到具有任意get和set处理器方法的类的实例。

可以通过把一个内置函数的结果赋给一个__类属性__来创建一个特性：
```python
attribute = property(fget, fset, fdel, doc)
```
property对象有getter、setter和deleter方法，这些方法指定相应的特性访问器方法赋值并且返回特性自身的一个副本。我们也可以使用这些方法，通过装饰常规方法来指定特性的组成部分。如果没有指定对应的方法则表示不支持该方法对应的操作。

描述符作为独立的类创建，并且它们就像方法函数一样分配给__类属性__。和任何其他的类属性一样，它们可以通过子类和实例继承：
```python
class Descriptor:
"docstring goes here"
def __get__(self, instance, owner): ...   # Return attr value
def __set__(self, instance, value): ...   # Return nothing (None)
def __delete__(self, instance): ...   # Return nothing (None)
```
带有任何这些方法的类都可以看作是描述符，并且当它们的一个实例分配给另一个类的属性的时候，它们的这些方法是特殊的——当访问属性的时候，会自动调用它们。如果这些方法中的任何一个空缺，通常意味着不支持相应类型的访问。然而，和特性不同，省略一个`__set__`意味着允许这个名字在一个实例中重新定义，因此，隐藏了描述符——要使得一个属性是只读的，我们必须定义`__set__`来捕获赋值并引发一个异常。

属性获取拦截表现为两种形式，可用两个不同的方法来编写：
- `__getattr__`针对未定义的属性运行——也就是说，属性没有存储在实例上，或者没有从其类之一继承。
- `__getattribute__`针对每个属性，因此，当使用它的时候，必须小心避免通过把属性访问传递给超类而导致递归循环。

这两个方法是一组属性拦截方法的代表，这些方法还包括`__setattr__`和`__delattr__`。由于这些方法具有相同的作用，注意，`__setattr__`和`__delattr__`对所有的属性产生作用，而不像`__getattr__`只拦截未定义的属性。

这些方法通常都容易使用，它们唯一复杂的部分就是潜在的循环（即递归）。由于`__getattr__`仅针对未定义的属性调用，所以它可以在自己的代码中自由地获取其他属性。然而，由于`__getattribute__`和`__setattr__`针对所有的属性运行，因此，它们的代码要注意在访问其他属性的时候避免再次调用自己并触发一次递归循环。

例如，在一个`__getattribute__`方法代码内部的另一次属性获取，将会再次触发`__getattribute__`，并且代码将会循环直到内存耗尽：
```python
def __getattribute__(self, name):
    x = self.other         # LOOPS!
```
要解决这个问题，把获取指向一个更高的超类，而不是跳过这个层级的版本——object类总是一个超类，并且它在这里可以很好地起作用:
```python
def __getattribute__(self, name):
    x = object.__getattribute__(self, 'other')    # Force higher to avoid me
```
对于`__setattr__`，情况是类似的。在这个方法内赋值任何属性，都会再次触发`__setattr__`并创建一个类似的循环：
```python
def __setattr__(self, name, value):
    self.other = value         # LOOPS!
```
要解决这个问题，把属性作为实例的`__dict__`命名空间字典中的一个键赋值。这样就避免了直接的属性赋值：
```python
def __setattr__(self, name, value):
    self.__dict__['other'] = value       # Use atttr dict to avoid me
```
尽管这种方法比较少用到，但`__setattr__`也可以把自己的属性赋值传递给一个更高的超类而避免循环，就像`__getattribute__`一样：
```python
def __setattr__(self, name, value):
    object.__setattr__(self, 'other', value)     # Force higher to avoid me
```
相反，我们不能使用`__dict__`技巧在`__getattribute__`中避免循环：
```python
def __getattribute__(self, name):
    x = self.__dict__['other']       # LOOPS!
```
获取`__dict__`属性本身会再次触发`__getattribute__`，导致一个递归循环。很奇怪，但确实如此。

### 拦截内置操作属性
在介绍`__getattr__`和`__getattribute__`的时候，我说它们分别拦截未定义的以及所有的属性获取，这使得它们很适合用于基于委托的编码模式。尽管对于常规命名的属性来说是这样，但它们的行为需要一些额外的澄清：对于隐式地使用内置操作获取的方法名属性，这些方法可能根本不会运行。

例如，针对`__str__`、`__add__`和`__getitem__`方法的属性获取分别通过打印、+表达式和索引隐式地运行，而不会指向Python 3.0中的类属性拦截方法。特别是：
- 在Python 3.0中，`__getattr__`和`__getattribute__`都不会针对这样的属性而运行。
- 在Python 2.6中，如果属性在类中未定义的话，`__getattr__`会针对这样的属性运行。
- 在Python 2.6中，`__getattribute__`只对于新式类可用，并且在Python 3.0中也可以使用。

换句话说，在Python 3.0的类中（以及Python 2.6的新式类中），没有直接的方法来通用地拦截像打印和加法这样的内置操作。在Python 2.X中，这样的操作调用的方法在运行时从实例中查找，就像所有其他属性一样；在Python 3.0中，这样的方法在类中查找。

