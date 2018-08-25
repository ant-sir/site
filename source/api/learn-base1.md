title: 《程序员的自我休养》笔记
---
《程序员的自我休养》正如周星驰电影中的《演员的自我休养》一样，每个合格的程序员都应该认真的阅读至少二遍。
<!--more-->

gcc -E 预处理
gcc -S 编译
gcc -c 汇编

objdump使用：
-h 打印段的基本信息
-x 打出所有段信息，打印更多
-d 把所有包含指令的段反汇编
-s 把所有段的内容以十六进制方式打印出来

```bash
[zyl@localhost:test]$ objdump -h simple_section.o

simple_section.o:     file format elf64-x86-64

Sections:
Idx Name          Size      VMA               LMA               File off  Algn
  0 .text         00000055  0000000000000000  0000000000000000  00000040  2**0
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, CODE
  1 .data         00000008  0000000000000000  0000000000000000  00000098  2**2
                  CONTENTS, ALLOC, LOAD, DATA
  2 .bss          00000004  0000000000000000  0000000000000000  000000a0  2**2
                  ALLOC
  3 .rodata       00000004  0000000000000000  0000000000000000  000000a0  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  4 .comment      0000002d  0000000000000000  0000000000000000  000000a4  2**0
                  CONTENTS, READONLY
  5 .note.GNU-stack 00000000  0000000000000000  0000000000000000  000000d1  2**0
                  CONTENTS, READONLY
  6 .eh_frame     00000058  0000000000000000  0000000000000000  000000d8  2**3
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, DATA

[zyl@localhost:test]$ objdump -s -d simple_section.o

simple_section.o:     file format elf64-x86-64

Contents of section .text:
 0000 554889e5 4883ec10 897dfc8b 45fc89c6  UH..H....}..E...
 0010 bf000000 00b80000 0000e800 00000090  ................
 0020 c9c35548 89e54883 ec10c745 fc010000  ..UH..H....E....
 0030 008b1500 0000008b 05000000 0001c28b  ................
 0040 45fc01c2 8b45f801 d089c7e8 00000000  E....E..........
 0050 8b45fcc9 c3                          .E...
Contents of section .data:
 0000 30000000 55000000                    0...U...
Contents of section .rodata:
 0000 25640a00                             %d..
Contents of section .comment:
 0000 00474343 3a202847 4e552920 382e312e  .GCC: (GNU) 8.1.
 0010 31203230 31383037 31322028 52656420  1 20180712 (Red
 0020 48617420 382e312e 312d3529 00        Hat 8.1.1-5).
Contents of section .eh_frame:
 0000 14000000 00000000 017a5200 01781001  .........zR..x..
 0010 1b0c0708 90010000 1c000000 1c000000  ................
 0020 00000000 22000000 00410e10 8602430d  ...."....A....C.
 0030 065d0c07 08000000 1c000000 3c000000  .]..........<...
 0040 00000000 33000000 00410e10 8602430d  ....3....A....C.
 0050 066e0c07 08000000                    .n......

Disassembly of section .text:

0000000000000000 <func1>:
   0:   55                      push   %rbp
   1:   48 89 e5                mov    %rsp,%rbp
   4:   48 83 ec 10             sub    $0x10,%rsp
   8:   89 7d fc                mov    %edi,-0x4(%rbp)
   b:   8b 45 fc                mov    -0x4(%rbp),%eax
   e:   89 c6                   mov    %eax,%esi
  10:   bf 00 00 00 00          mov    $0x0,%edi
  15:   b8 00 00 00 00          mov    $0x0,%eax
  1a:   e8 00 00 00 00          callq  1f <func1+0x1f>
  1f:   90                      nop
  20:   c9                      leaveq
  21:   c3                      retq

0000000000000022 <main>:
  22:   55                      push   %rbp
  23:   48 89 e5                mov    %rsp,%rbp
  26:   48 83 ec 10             sub    $0x10,%rsp
  2a:   c7 45 fc 01 00 00 00    movl   $0x1,-0x4(%rbp)
  31:   8b 15 00 00 00 00       mov    0x0(%rip),%edx        # 37 <main+0x15>
  37:   8b 05 00 00 00 00       mov    0x0(%rip),%eax        # 3d <main+0x1b>
  3d:   01 c2                   add    %eax,%edx
  3f:   8b 45 fc                mov    -0x4(%rbp),%eax
  42:   01 c2                   add    %eax,%edx
  44:   8b 45 f8                mov    -0x8(%rbp),%eax
  47:   01 d0                   add    %edx,%eax
  49:   89 c7                   mov    %eax,%edi
  4b:   e8 00 00 00 00          callq  50 <main+0x2e>
  50:   8b 45 fc                mov    -0x4(%rbp),%eax
  53:   c9                      leaveq
  54:   c3                      retq

[zyl@localhost:test]$ objdump -x -s -d simple_section.o

simple_section.o：     文件格式 elf64-x86-64
simple_section.o
体系结构：i386:x86-64，标志 0x00000011：
HAS_RELOC, HAS_SYMS
起始地址 0x0000000000000000

节：
Idx Name          Size      VMA               LMA               File off  Algn
  0 .text         00000055  0000000000000000  0000000000000000  00000040  2**0
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, CODE
  1 .data         00000008  0000000000000000  0000000000000000  00000098  2**2
                  CONTENTS, ALLOC, LOAD, DATA
  2 .bss          00000004  0000000000000000  0000000000000000  000000a0  2**2
                  ALLOC
  3 .rodata       00000004  0000000000000000  0000000000000000  000000a0  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  4 .comment      0000002d  0000000000000000  0000000000000000  000000a4  2**0
                  CONTENTS, READONLY
  5 .note.GNU-stack 00000000  0000000000000000  0000000000000000  000000d1  2**0
                  CONTENTS, READONLY
  6 .eh_frame     00000058  0000000000000000  0000000000000000  000000d8  2**3
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, DATA
SYMBOL TABLE:
0000000000000000 l    df *ABS*	0000000000000000 simple_section.c
0000000000000000 l    d  .text	0000000000000000 .text
0000000000000000 l    d  .data	0000000000000000 .data
0000000000000000 l    d  .bss	0000000000000000 .bss
0000000000000000 l    d  .rodata	0000000000000000 .rodata
0000000000000004 l     O .data	0000000000000004 static_var.1965
0000000000000000 l     O .bss	0000000000000004 static_var2.1966
0000000000000000 l    d  .note.GNU-stack	0000000000000000 .note.GNU-stack
0000000000000000 l    d  .eh_frame	0000000000000000 .eh_frame
0000000000000000 l    d  .comment	0000000000000000 .comment
0000000000000000 g     O .data	0000000000000004 global_init_var
0000000000000004       O *COM*	0000000000000004 global_uninit_var
0000000000000000 g     F .text	0000000000000022 func1
0000000000000000         *UND*	0000000000000000 printf
0000000000000022 g     F .text	0000000000000033 main


Contents of section .text:
 0000 554889e5 4883ec10 897dfc8b 45fc89c6  UH..H....}..E...
 0010 bf000000 00b80000 0000e800 00000090  ................
 0020 c9c35548 89e54883 ec10c745 fc010000  ..UH..H....E....
 0030 008b1500 0000008b 05000000 0001c28b  ................
 0040 45fc01c2 8b45f801 d089c7e8 00000000  E....E..........
 0050 8b45fcc9 c3                          .E...           
Contents of section .data:
 0000 30000000 55000000                    0...U...        
Contents of section .rodata:
 0000 25640a00                             %d..            
Contents of section .comment:
 0000 00474343 3a202847 4e552920 382e312e  .GCC: (GNU) 8.1.
 0010 31203230 31383037 31322028 52656420  1 20180712 (Red 
 0020 48617420 382e312e 312d3529 00        Hat 8.1.1-5).   
Contents of section .eh_frame:
 0000 14000000 00000000 017a5200 01781001  .........zR..x..
 0010 1b0c0708 90010000 1c000000 1c000000  ................
 0020 00000000 22000000 00410e10 8602430d  ...."....A....C.
 0030 065d0c07 08000000 1c000000 3c000000  .]..........<...
 0040 00000000 33000000 00410e10 8602430d  ....3....A....C.
 0050 066e0c07 08000000                    .n......        

Disassembly of section .text:

0000000000000000 <func1>:
   0:	55                   	push   %rbp
   1:	48 89 e5             	mov    %rsp,%rbp
   4:	48 83 ec 10          	sub    $0x10,%rsp
   8:	89 7d fc             	mov    %edi,-0x4(%rbp)
   b:	8b 45 fc             	mov    -0x4(%rbp),%eax
   e:	89 c6                	mov    %eax,%esi
  10:	bf 00 00 00 00       	mov    $0x0,%edi
			11: R_X86_64_32	.rodata
  15:	b8 00 00 00 00       	mov    $0x0,%eax
  1a:	e8 00 00 00 00       	callq  1f <func1+0x1f>
			1b: R_X86_64_PC32	printf-0x4
  1f:	90                   	nop
  20:	c9                   	leaveq 
  21:	c3                   	retq   

0000000000000022 <main>:
  22:	55                   	push   %rbp
  23:	48 89 e5             	mov    %rsp,%rbp
  26:	48 83 ec 10          	sub    $0x10,%rsp
  2a:	c7 45 fc 01 00 00 00 	movl   $0x1,-0x4(%rbp)
  31:	8b 15 00 00 00 00    	mov    0x0(%rip),%edx        # 37 <main+0x15>
			33: R_X86_64_PC32	.data
  37:	8b 05 00 00 00 00    	mov    0x0(%rip),%eax        # 3d <main+0x1b>
			39: R_X86_64_PC32	.bss-0x4
  3d:	01 c2                	add    %eax,%edx
  3f:	8b 45 fc             	mov    -0x4(%rbp),%eax
  42:	01 c2                	add    %eax,%edx
  44:	8b 45 f8             	mov    -0x8(%rbp),%eax
  47:	01 d0                	add    %edx,%eax
  49:	89 c7                	mov    %eax,%edi
  4b:	e8 00 00 00 00       	callq  50 <main+0x2e>
			4c: R_X86_64_PC32	func1-0x4
  50:	8b 45 fc             	mov    -0x4(%rbp),%eax
  53:	c9                   	leaveq 
  54:	c3                   	retq 

```

```bash
[zyl@localhost:~]$ readelf --help
用法：readelf <选项> elf-文件
 显示关于 ELF 格式文件内容的信息
 Options are:
  -a --all               Equivalent to: -h -l -S -s -r -d -V -A -I
  -h --file-header       Display the ELF file header
  -l --program-headers   Display the program headers
     --segments          An alias for --program-headers
  -S --section-headers   Display the sections' header
     --sections          An alias for --section-headers
```

弱符号强符号
强弱符号是针对定义来说的。
编译器默认函数和初始化了的全局变量为强符号，未初始化的全局变量为弱符号。
使用 `__attribute__((weak))` 可以指定一个符号为弱符号。

弱引用强引用
对外部目标文件中符号的引用在目标文件最终被链接成可执行文件时，它们必须被正确决议。如果没有找到就报链接错误。这种被称为强引用。
与之相对应的还有一种弱引用，在处理弱引用时，如果该符号有定义则链接时决议该符号，如果该符号未定义，则链接时不报错。
使用 `__attribute__((weakref))` 声明一个弱引用。

