const { buildTagGraph } = require('../tools/tag-graph.cjs');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assetVersion = crypto.createHash('sha256').update(
  ['css/tag-explorer.css', 'js/tag-graph-motion.js', 'js/tag-explorer.js']
    .map(file => fs.readFileSync(path.join(__dirname, '../source', file))).join('\n')
).digest('hex').slice(0, 10);

const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

hexo.extend.generator.register('tag-explorer', function (locals) {
  const posts = locals.posts.toArray().map(post => ({
    date: post.date.toDate(),
    published: post.published,
    tags: post.tags.toArray().map(tag => ({
      name: tag.name,
      url: this.extend.helper.get('url_for').call(this, tag.path)
    }))
  }));
  const graph = buildTagGraph(posts);
  const json = JSON.stringify(graph).replace(/</g, '\\u003c');
  const cards = graph.nodes.map(tag => `
    <li data-tag-id="${tag.id}"><a class="tg-card" href="${escape(tag.url)}">
      <span class="tg-card-name"><span aria-hidden="true">#</span> ${escape(tag.name)}</span>
      <span class="tg-card-count">${tag.count} 篇文章</span>
      <span class="tg-card-date">最近发布 ${tag.latestLabel}</span>
    </a></li>`).join('');

  return {
    path: 'tags/index.html',
    layout: 'page',
    data: {
      title: '标签', type: 'tag-explorer', top_img: false, comments: false,
      content: `<section class="tag-explorer" id="tag-explorer" aria-labelledby="tg-title">
        <div class="tg-heading"><div><span class="tg-eyebrow">EXPLORE BY TOPIC</span>
          <h1 id="tg-title">让知识，慢慢连成一片。</h1>
          <p class="tg-intro">从一个标签出发，发现文章之间的联系。</p></div>
          <div class="tg-stats"><strong>${graph.nodes.length}</strong><span>个标签</span><i aria-hidden="true"></i><strong>${graph.edges.length}</strong><span>条关联</span></div>
        </div>
        <div class="tg-search-row" data-tg-enhanced hidden>
          <label class="tg-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
            <span class="tg-sr-only">搜索标签</span><input id="tg-query" type="search" placeholder="寻找一个标签…" autocomplete="off" aria-controls="tg-directory tg-graph"></label>
          <span class="tg-result-count" id="tg-result-count" role="status" aria-live="polite">${graph.nodes.length} / ${graph.nodes.length} 个标签</span>
        </div>
        <div class="tg-graph-panel" data-tg-enhanced hidden>
          <div class="tg-graph-heading"><span><i aria-hidden="true"></i> 标签之间的联系</span><span class="tg-legend">节点大小 · 文章数量<span aria-hidden="true"> / </span>连线 · 同篇文章</span></div>
          <div id="tg-viewport" class="tg-viewport" tabindex="0" role="group" aria-label="标签关系图。电脑可拖动、滚轮缩放，方向键平移，加减号缩放，按 0 重置。手机可点击标签并使用下方缩放按钮。">
            <svg id="tg-graph" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="按共同文章连接的标签"><g class="tg-world"><g class="tg-edges"></g><g class="tg-nodes"></g></g></svg>
          </div>
          <div class="tg-graph-footer"><p id="tg-hint">点击标签阅读文章，悬停查看关联。</p>
            <div class="tg-controls" role="group" aria-label="图谱视图控制">
              <button type="button" data-tg-action="out" aria-label="缩小标签图">−</button><output id="tg-zoom" aria-label="当前缩放">100%</output><button type="button" data-tg-action="in" aria-label="放大标签图">＋</button>
              <button type="button" class="tg-reset" data-tg-action="reset" aria-label="重置标签图布局">重置</button>
            </div>
          </div>
          <p class="tg-help"><span class="tg-desktop-help">拖动节点牵引邻居 · 放大显示更多名称 · 悬停高亮关联</span><span class="tg-mobile-help">点击标签阅读 · 用 ＋ / − 放大查看名称 · 空白处可上下滑动页面</span></p>
        </div>
        <div class="tg-directory-heading"><h2 id="tg-directory-title">标签目录</h2>
          <div class="tg-sort" data-tg-enhanced hidden role="group" aria-label="标签排序">
            <button type="button" data-sort="name" aria-pressed="true">名称</button><button type="button" data-sort="newest" aria-pressed="false">最新</button><button type="button" data-sort="oldest" aria-pressed="false">最早</button>
          </div>
        </div>
        <ul class="tg-directory" id="tg-directory" aria-labelledby="tg-directory-title">${cards}</ul>
        <p class="tg-empty" id="tg-empty" ${graph.nodes.length ? 'hidden' : ''}>${graph.nodes.length ? '没有找到匹配的标签，试试其他关键词。' : '还没有标签。给第一篇文章添加标签，它们就会出现在这里。'}</p>
        <p class="tg-data-note">关系来自真实文章中的标签共现，随每次发布自动更新。</p>
        <script type="application/json" id="tg-data">${json}</script>
        <link rel="stylesheet" href="/css/tag-explorer.css?v=${assetVersion}">
        <script src="/js/tag-graph-motion.js?v=${assetVersion}" defer></script>
        <script src="/js/tag-explorer.js?v=${assetVersion}" defer></script>
      </section>`
    }
  };
});
