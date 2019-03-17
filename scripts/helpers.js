/* global hexo */

'use strict';

var pathFn = require('path');
var _ = require('lodash');
var cheerio = require('cheerio');


function startsWith(str, start) {
  return str.substring(0, start.length) === start;
}

hexo.extend.helper.register('page_nav', function() {
  var path = this.url_for(pathFn.dirname(this.path) + '/');
  var list = {};
  var self = this;
  var prefix = '';
  
  _.each(this.site.pages.data, function(page) {
    if (pathFn.dirname(page.path) === 'categories') {
      list[self.url_for(pathFn.dirname(page.path) + '/')] = page.title;
    }
  });

  _.each(this.site.posts.data, function(post){
    list[self.url_for(post.path)] = post.title;
  });

  var keys = Object.keys(list);
  var index = keys.indexOf(path);
  var result = '';

  if (index > 0) {
    result += '<a href="' + keys[index - 1] + '" class="article-footer-prev" title="' + this.__(prefix + list[keys[index - 1]]) + '">'
      + '<i class="fa fa-chevron-left"></i><span>' + this.__('page.prev') + '</span></a>';
  }

  if (index < keys.length - 1) {
    result += '<a href="' + keys[index + 1] + '" class="article-footer-next" title="' + this.__(prefix + list[keys[index + 1]]) + '">'
      + '<span>' + this.__('page.next') + '</span><i class="fa fa-chevron-right"></i></a>';
  }

  return result;
});

hexo.extend.helper.register('categories_sidebar', function(className) {
  var path = pathFn.dirname(this.path);
  var result = '';
  var self = this;
  var categories = new Map();
  var path_r = this.page.path;

  _.each(this.site.pages.data, function(page) {
    if (pathFn.dirname(page.path) === 'categories') {
      var welcome = '<strong class="' + className + '-title">' + page.title + '</strong>';
      if (pathFn.dirname(path_r) === path) {
        welcome += '<a href="' + '/categories' + '" class="' + className + '-link' + ' current' + '">' + page.title + '</a>';
      }
      else {
        welcome += '<a href="' + '/categories' + '" class="' + className + '-link' + '">' + page.title + '</a>';
      }
      categories.set(page.title, welcome);
    }
  });

  _.each(this.site.categories.data, function(categorie){
    categories.set(categorie.name, '<strong class="' + className + '-title">' + categorie.name + '</strong>');
  });

  _.each(this.site.posts.data, function(post){
    var itemClass = className + '-link';
    if (post.path.slice(0, -1) === path) itemClass += ' current';

    _.each(post.categories.data, function(categorie){
      var value = categories.get(categorie.name);
      value += '<a href="' + self.url_for(post.path) + '" class="' + itemClass + '">' + post.title + '</a>';
      categories.set(categorie.name, value);
    });
  });

  for (var categorie of categories.values()) {
    result += categorie;
  }
  
  return result;
});

hexo.extend.helper.register('header_menu', function(className) {
  var menu = this.site.data.menu;
  var result = '';
  var self = this;
  var lang = this.page.lang;
  var isChinese = lang === 'zh-cn';

  _.each(menu, function(path, title) {
    if (!isChinese) path = lang + path;

    result += '<a href="' + self.url_for(path) + '" class="' + className + '-link">' + self.__('menu.' + title) + '</a>';
  });

  return result;
});

hexo.extend.helper.register('canonical_url', function(lang) {
  var path = this.page.canonical_path;
  if (lang && lang !== 'zh-cn') path = lang + '/' + path;

  return this.config.url + '/' + path;
});

hexo.extend.helper.register('url_for_lang', function(path) {
  var lang = this.page.lang;
  var url = this.url_for(path);

  if (lang !== 'zh-cn' && url[0] === '/') url = '/' + lang + url;

  return url;
});

hexo.extend.helper.register('raw_link', function(path) {
  return 'https://github.com/ant-sir/site/edit/master/source/' + path;
});

hexo.extend.helper.register('page_anchor', function(str) {
  var $ = cheerio.load(str, {decodeEntities: false});
  var headings = $('h1, h2, h3, h4, h5, h6');

  if (!headings.length) return str;

  headings.each(function() {
    var id = $(this).attr('id');

    $(this)
      .addClass('article-heading')
      .append('<a class="article-anchor" href="#' + id + '" aria-hidden="true"></a>');
  });

  return $.html();
});

hexo.extend.helper.register('canonical_path_for_nav', function() {
  var path = this.page.canonical_path;

  return '';

});

hexo.extend.helper.register('lang_name', function(lang) {
  var data = this.site.data.languages[lang];
  return data.name || data;
});

hexo.extend.helper.register('disqus_lang', function() {
  var lang = this.page.lang;
  var data = this.site.data.languages[lang];

  return data.disqus_lang || lang;
});

hexo.extend.helper.register('hexo_version', function() {
  return this.env.version;
});

