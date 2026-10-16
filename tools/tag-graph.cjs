const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });

function buildTagGraph(posts, now = Date.now()) {
  const tags = new Map();
  const pairs = new Map();
  let taggedPosts = 0;

  for (const post of posts) {
    const date = Number(new Date(post.date));
    if (post.published === false || !Number.isFinite(date) || date > now) continue;
    const unique = [...new Map((post.tags || []).map(tag => [tag.name, tag])).values()];
    if (unique.length) taggedPosts++;
    for (const tag of unique) {
      const current = tags.get(tag.name) || { name: tag.name, url: tag.url, count: 0, latest: 0 };
      current.count++;
      current.latest = Math.max(current.latest, date);
      tags.set(tag.name, current);
    }
    const names = unique.map(tag => tag.name).sort(collator.compare);
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const key = JSON.stringify([names[i], names[j]]);
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  }

  const nodes = [...tags.values()].sort((a, b) => collator.compare(a.name, b.name))
    .map((tag, id) => ({
      ...tag, id,
      latestLabel: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(tag.latest)
    }));
  const ids = new Map(nodes.map(node => [node.name, node.id]));
  const edges = [...pairs].map(([key, count]) => {
    const [a, b] = JSON.parse(key);
    return { source: ids.get(a), target: ids.get(b), count };
  });
  return { nodes, edges, taggedPosts };
}

module.exports = { buildTagGraph };
