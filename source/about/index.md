---
layout: page
title: 关于本站
date: 2013-05-07
---

该网站是从[Tommy Chen](https://zespia.tw/)的[Hexo.io](https://hexo.io)修改而来。

## 什么是 Hexo？

Hexo 是一个快速、简洁且高效的博客框架。Hexo 使用 [Markdown](http://daringfireball.net/projects/markdown/)（或其他渲染引擎）解析文章，在几秒内，即可利用靓丽的主题生成静态网页。

## 该站来源

该网站主要是从Hexo项目网站在github上的源代码项目Fork出来的，删除了源网站的内容，但保留了源网站的风格及布局。也添加了一些自已喜欢的特性。同时修改它使其更符合一个博客网站，而非一个文档网站。后面有对源站的具体修改。感谢Hexo的作者及所有的贡献者。

## 修改内容

在原来[Hexo.io](https://hexo.io)的基础上修改了以下几个特性：
- 删除了多余的语言，只保留了简体中文。
- 保留了[DISQUS](https://disqus.com/)留言系统和[DocSearch](https://community.algolia.com/docsearch/)搜索，其中DocSearch是一个非常棒的系统，你可以在上面的搜索框内通过关键字来搜索所有文章的任何内容。
  HEXO使用的是algolia的开源DocSearch，数据和搜索配置文件都由algolia管理。由于个人博客系统的流量可能比较小，经常会被algolia确认是否占用了资源，所以本站使用algolia的开源爬虫和自定义配置文件由自己生成index以供检索。
  感谢algolia，不仅为我们提供开源抓虫，还提供免费的存储资源以供检索。真是一个非常棒的服务。
- 修改了主页面，使其更像一个个人主页，而非一个文档说明页。
- 修改了手机显示页面的Header部分，把它固定在顶部。
- 更换了图标。
- 更改了主页显示，添加时间线。
- 添加了主页按钮。
- 添加github大图标。
- 由于写博客时都是正常的post，因此修改了post生成模板，使用categories来分类文章，使其类似HEXO的文档有左侧边栏。考虑到把tags和categories做在同一个页面会使同一个文章标题显示两次，怪怪的。所以暂未实现tags分类功能。
  所有文章可以添加分类（categories），生成时分类及文章会自动添加到侧边栏。

## 本站用途

主要用来记录自己平时工作学习中的笔记。分享一些自己业余时间做的一些小工具。目前内容还不多，但重在一点一滴的积累。

## 收获

初次写JavaScript代码，依靠猜想与手册实现的功能，终归还是实现了自己想要的功能。感觉JS确实简洁强大。