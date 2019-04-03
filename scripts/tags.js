/* global hexo */

'use strict';

var process = require('child_process');

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


hexo.extend.tag.register('gitlog', function(args) {
  var badge = [];
  var badge_end = [];
  var header = [];
  var info = [];
  var log_start = [];
  var log = [];
  var log_end = [];
  var items = [];
  var item = [];
  var script = [];
  var result = '';
  
  var user = args[0];
  var repo = args[1];
  var format = args[2];
  var autoExpand = args[3];

  var stdout = process.execSync('git log ' + format, function(err, stdout, stderr) {
    if (err) {
      console.log(stderr);
    } else {
      // console.log(stdout.trim().split('\n'));
    }
  });

  items = stdout.toString().trim().split('\n');

  badge = ['<div id="badge-container" class="hexo-github" style="width: 100%">',
            '<div class="github-badge">'
  ];

  header = [  '<div class="header">',
                '<div class="icon">',
                  '<div class="mark"><svg xmlns="http://www.w3.org/2000/svg" class="octicon mark-github" width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg></div>',
                  '<div class="avatar"><img src="https://avatars3.githubusercontent.com/' + user + '?v=4"></div>',
                '</div>',
                '<div class="content">',
                  '<h3 class="user"><a href="https://github.com/' + user + '" target="_blank" class="user-link">'+ user + '</a></h3>',
                  '<h3 class="repo"><a href="https://github.com/' + user + '/' + repo + '" target="_blank" class="repo-link">' + repo + '</a></h3>',
                '</div>',
              '</div>'
  ];

  // console.log(items);
  item = items.shift().split(' ');

  info = [    '<div class="info">',
                '<div class="icon">',
                  '<div class="circle"><svg xmlns="http://www.w3.org/2000/svg" class="octicon history" width="14" height="16" viewBox="0 0 14 16"><path fill-rule="evenodd" d="M8 13H6V6h5v2H8v5zM7 1C4.81 1 2.87 2.02 1.59 3.59L0 2v4h4L2.5 4.5C3.55 3.17 5.17 2.3 7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-.34.03-.67.09-1H.08C.03 7.33 0 7.66 0 8c0 3.86 3.14 7 7 7s7-3.14 7-7-3.14-7-7-7z"/></svg></div>',
                '</div>',
                '<div class="status">',
                  '<span>' + item[0] + '  </span><a href="https://github.com/' + user + '/' + repo + '/commit/' + item[1] + '" target="_blank" class="commit-link" title="' + item[2] + '">' + item[1] + '</a> <span>  ： ' + item[2] + '</span>',
                '</div>',
              '</div>'
  ];

  var commit_style = 'commits';

  if (autoExpand === false) {
    commit_style += '  fold';
  }

  log_start = [
              '<div class="' + commit_style + '">',
                '<div class="line"></div>',
                '<div class="entry">'
  ];

  items.forEach(element => {
    item = element.split(' ');
    log = log.concat([
                  '<div class="item commit-before">',
                    '<div class="icon">',
                        '<div class="circle"><svg xmlns="http://www.w3.org/2000/svg" class="octicon code" width="14" height="16" viewBox="0 0 14 16"><path fill-rule="evenodd" d="M9.5 3L8 4.5 11.5 8 8 11.5 9.5 13 14 8 9.5 3zm-5 0L0 8l4.5 5L6 11.5 2.5 8 6 4.5 4.5 3z"/></svg></div>',
                    '</div>',
                    '<div class="text">',
                      '<span>' + item[0] + '  </span><a href="https://github.com/' + user + '/' + repo + '/commit/' + item[1] + '" target="_blank" class="commit-link" title="' + item[2] + '">' + item[1] + '</a> <span>  ： ' + item[2] + '</span>',
                    '</div>',
                  '</div>']);
  });

  log_end = [
                  '</div>',
                '</div>'
  ];

  badge_end = [
            '</div>',
          '</div>'
  ];

  script = [
    '<script>',
    'var badge = document.getElementById("badge-container");',
    'var user = badge.querySelector(".user");',
    'var info = badge.querySelector(".info");',
    'var items = badge.querySelectorAll(".item.commit-before");',

    'user.addEventListener("mouseover", function() {',
      'var className = badge.querySelector(".avatar").className;',
      'badge.querySelector(".avatar").className = className === "avatar" ? "avatar show" : "avatar";',
      'badge.querySelector(".icon.mark").className = className === "avatar" ? "back" : "none";',
    '});',

    'user.addEventListener("mouseout", function() {',
      'var className = badge.querySelector(".avatar").className;',
      'badge.querySelector(".avatar").className = className === "avatar" ? "avatar show" : "avatar";',
      'badge.querySelector(".icon.mark").className = className === "avatar" ? "back" : "none";',
    '});',

    'info.addEventListener("click", function() {',
    'var commits = badge.querySelector(".commits");',
    'commits.className = commits.className === "commits" ? "commits fold" : "commits";',
    '});',

    'items.forEach(function(item) {',
      'item.addEventListener("mouseover", function() {',
        'var circle = this.querySelector(".circle");',
        'circle.className = circle.className === "circle" ? "circle active" : "circle";',
        'var text = this.querySelector(".text");',
        'text.className = text.className === "text" ? "text active" : "text";',
        'text.style.fontSize = "105%";',
      '});',

      'item.addEventListener("mouseout", function() {',
        'var circle = this.querySelector(".circle");',
        'circle.className = circle.className === "circle" ? "circle active" : "circle";',
        'var text = this.querySelector(".text");',
        'text.className = text.className === "text" ? "text active" : "text";',
        'text.style.fontSize = "100%";',
      '});',
    '});',
    '</script>'
  ];

  result = badge.join('') + header.join('') + info.join('') + log_start.join('') + log.join('') + log_end.join('') + badge_end.join('') + script.join('');
  
  return result;
}, true);