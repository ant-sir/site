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
                '<div class="icon"> <span class="mega-octicon octicon-mark-github"></span>',
                  '<div class="avatar">',
                    '<img src="https://avatars3.githubusercontent.com/' + user + '?v=4">',
                  '</div>',
                '</div>',
                '<div class="content">',
                  '<h3 class="user"><a href="https://github.com/' + user + '" target="_blank" class="user-link">'+ user + '</a></h3>',
                  '<h3 class="repo"><a href="https://github.com/' + user + '/' + repo + '" target="_blank" class="repo-link">' + repo + '</a></h3>',
                '</div>',
              '</div>'
  ];

  console.log(items);
  item = items.shift().split(' ');

  info = [    '<div class="info">',
                '<div class="icon">',
                  '<div class="circle"></div> <span class="octicon octicon-history"></span>',
                '</div>',
                '<div class="status">',
                  '<span>' + item[0] + ' </span><a href="https://github.com/' + user + '/' + repo + '/commit/' + item[1] + '" target="_blank" class="commit-link" title="' + item[2] + '">' + item[1] + '</a> <span>: ' + item[2] + '</span>',
                '</div>',
              '</div>'
  ];

  log_start = [
              '<div class="commits">',
                '<div class="line"></div>',
                  '<div class="entry">'
  ];

  items.forEach(element => {
    item = element.split(' ');
    log = log.concat([
                    '<div class="item commit-before">',
                      '<div class="icon">',
                          '<div class="circle"></div> <span class="octicon octicon-code"></span>',
                      '</div>',
                      '<div class="text">',
                        '<span>' + item[0] + ' </span><a href="https://github.com/' + user + '/' + repo + '/commit/' + item[1] + '" target="_blank" class="commit-link" title="' + item[2] + '">' + item[1] + '</a> <span>: ' + item[2] + '</span>',
                    '</div>']);
  });

  log_end = [
                  '</div>',
                '</div>',
              '</div>'
  ];

  badge_end = [
            '</div>',
          '</div>'
  ];

  result = badge.join('') + header.join('') + info.join('') + log_start.join('') + log.join('') + log_end.join('') + badge_end.join('');
  
  return result;
}, true);