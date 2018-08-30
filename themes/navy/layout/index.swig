<header id="banner" class="wrapper">
  <div class="inner">
    <div id="banner-start">
      <a href="https://github.com/ant-sir">
      <img id="banner-start-img" src="https://avatars3.githubusercontent.com/ant-sir?v=3&s=230">
      </a>
    </div>
    <div id="banner-share">{{ partial('partial/share') }}</div>
  </div>
</header>
<div id="content-wrap">
  <div class="wrapper">
    <div class="inner">
      <div id="cd-timeline">
        {% for page in site.pages.toArray() %}
          {% if page.layout == 'page' %}
          <div class="cd-timeline-block">
            <div class="cd-timeline-img cd-picture">
            </div>
            <div class="cd-timeline-content">
            <h2>{{page.title}}</h2>
            <p>{{page.excerpt}}</p>
            <a href="{{ url_for(page.path) }}" class="cd-read-more" target="_blank">阅读全文</a>
            <span class="cd-date">{{page.updated.format('MMMM Do YYYY, h:mm:ss a')}}</span>
            </div>
          </div>
          {% endif %}
        {% endfor %}
      </div>
    </div>
  </div>
</div>

