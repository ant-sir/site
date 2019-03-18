/* global hexo */

'use strict';

hexo.extend.tag.register('note', function(args, content) {
  var className = args.shift();
  var header = '';
  var result = '';

  if (args.length) {
    header += '<strong class="note-title">' + args.join(' ') + '</strong>';
  }

  result += '<blockquote class="note ' + className + '">' + header;
  result += hexo.render.renderSync({text: content, engine: 'markdown'});
  result += '</blockquote>';

  return result;
}, true);


hexo.extend.tag.register('github', function(args) {
  // var className = args.shift();
  var badge = [];
  var badge_end = [];
  var header = [];
  var info = [];
  var log = [];
  var result = '<div id="badge-container-ant-sir-site-213329" class="hexo-github" style="width: 100%"><div class="github-badge"><div class="header"><div class="icon">  <span class="mega-octicon octicon-mark-github"></span>  <div class="avatar"><img src="https://avatars3.githubusercontent.com/u/7426281?v=4"></div></div><div class="content">  <h3 class="user"><a href="https://github.com/ant-sir" target="_blank" class="user-link">ant-sir</a></h3>  <h3 class="repo"><a href="https://github.com/ant-sir/site" target="_blank" class="repo-link">site</a></h3></div></div><div class="info"><div class="icon">  <div class="circle"></div>  <span class="octicon octicon-history"></span></div><div class="status"><a href="https://github.com/ant-sir/site/commit/213329eb2c7e171e63b463ef22ed4df421f2764e" target="_blank" class="commit-link" title="修改“关于”页面">213329</a>  <span>, 1 commits behind</span></div></div><div class="commits"><div class="line"></div><div class="entry"><div class="item commit-before">  <div class="icon">    <div class="circle"></div>    <span class="octicon octicon-code"></span>  </div>  <div class="text"><span class="commits-count-before">98</span> commits</div></div><div class="item commit-current">  <div class="icon">    <div class="circle active"></div>    <span class="octicon octicon-pencil"></span>  </div>  <div class="text active"><a href="https://github.com/ant-sir/site/commit/213329eb2c7e171e63b463ef22ed4df421f2764e" target="_blank" class="commit-link" title="修改“关于”页面">213329</a>, referenced in this article</div></div><div class="item commit-after" style="display: none;">  <div class="icon">    <div class="circle"></div>    <span class="octicon octicon-code"></span>  </div>  <div class="text"><span class="commits-count-after">0</span> commits</div></div><div class="item commit-latest" style="display: block;">  <div class="icon">    <div class="circle"></div>    <span class="octicon octicon-clock"></span>  </div>  <div class="text"><a href="https://github.com/ant-sir/site/commit/b98e9ae4826482e9d2ddac5a3215fe13527dc7c3" target="_blank" class="commit-link" title="修改分类主页">b98e9a</a>, latest</div></div><div class="item commit-up-to-date" style="display: none;">  <div class="icon">    <div class="circle"></div>    <span class="octicon octicon-check"></span>  </div>  <div class="text">Up-to-date</div></div></div></div></div></div>';

  badge = ['<div id="badge-container" class="hexo-github" style="width: 100%">',
            '<div class="github-badge">'];
  header = [  '<div class="header">',
                '<div class="icon"> <span class="mega-octicon octicon-mark-github"></span>',
                  '<div class="avatar">',
                    '<img src="https://avatars3.githubusercontent.com/u/7426281?v=4">',
                  '</div>',
                '</div>',
                '<div class="content">',
                  '<h3 class="user"><a href="https://github.com/ant-sir" target="_blank" class="user-link">ant-sir</a></h3>',
                  '<h3 class="repo"><a href="https://github.com/ant-sir/site" target="_blank" class="repo-link">site</a></h3>',
                '</div>',
              '</div>'];
  info = [    '<div class="info">',
                '<div class="icon">',
                  '<div class="circle"></div> <span class="octicon octicon-history"></span>',
                '</div>',
                '<div class="status">',
                  '<a href="https://github.com/ant-sir/site/commit/213329eb2c7e171e63b463ef22ed4df421f2764e" target="_blank" class="commit-link" title="修改“关于”页面">213329</a> <span>, 1 commits behind</span>',
                '</div>',
              '</div>'];
  log = [];



  badge_end = [   '</div>',
                '</div>'];

  return result;
}, true);