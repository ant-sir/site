<!-- Scripts -->
<!-- Cookie -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.2.0/js.cookie.min.js"></script>
<!-- build:js build/js/main.js -->
{{ js('js/lang_select') }}
{{ js('js/toc') }}
{{ js('js/mobile_nav') }}
<!-- endbuild -->
<!-- Algolia -->
{% if config.algolia[page.lang] %}
<script>document.getElementById('search-input-wrap').classList.add('on');</script>
<script src="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.js"></script>
<script>
  docsearch({
    // Your apiKey and indexName will be given to you once
    // we create your config
    apiKey: '{{ config.algolia[page.lang].api_key }}',
    indexName: '{{ config.algolia[page.lang].index_name }}',
    appId: '{{ config.algolia[page.lang].app_id }}', // Should be only included if you are running DocSearch on your own.
    // Replace inputSelector with a CSS selector
    // matching your search input
    inputSelector: '#search-input',
    // Set debug to true if you want to inspect the dropdown
    debug: false,
  });
</script>
{% endif %}
