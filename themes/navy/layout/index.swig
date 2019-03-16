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
        {% for post in site.posts.sort('date', 'desc') %}
          {% if loop.index <= 5 %}
            <div class="cd-timeline-block">
              <div class="cd-timeline-img cd-picture"></div>
              <div class="cd-timeline-content">
                <a href="{{ url_for(post.path) }}">
                  <h2>{{post.title}}</h2>
                  <p>{{post.excerpt}}</p>
                </a>
                <span class="cd-date">{{time_tag(post.date)}}</span>
              </div>
            </div>
          {% endif %}
        {% endfor %}
      </div>
    </div>
  </div>
</div>

