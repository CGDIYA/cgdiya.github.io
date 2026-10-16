const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTagGraph } = require('../tools/tag-graph.cjs');
const tag = name => ({ name, url: `/tags/${encodeURIComponent(name)}/` });
const now = Date.parse('2026-10-16T12:00:00Z');

test('counts genuine co-occurrence once per article and keeps separate topics unconnected', () => {
  const graph = buildTagGraph([
    { date: '2026-10-10', tags: [tag('A'), tag('B'), tag('A')] },
    { date: '2026-10-12', tags: [tag('A'), tag('B')] },
    { date: '2026-10-11', tags: [tag('C')] }
  ], now);
  assert.deepEqual(graph.nodes.map(n => [n.name, n.count]), [['A', 2], ['B', 2], ['C', 1]]);
  assert.deepEqual(graph.edges, [{ source: 0, target: 1, count: 2 }]);
  assert.equal(graph.taggedPosts, 3);
  assert.equal(graph.nodes[0].latest, Date.parse('2026-10-12'));
});

test('drafts, future and invalid dates never disclose their tags', () => {
  const graph = buildTagGraph([
    { date: '2026-10-10', tags: [tag('公开')] },
    { date: '2026-10-10', published: false, tags: [tag('私密草稿')] },
    { date: '2027-01-01', tags: [tag('未来文章')] },
    { date: 'invalid', tags: [tag('无效')] }
  ], now);
  assert.deepEqual(graph.nodes.map(n => n.name), ['公开']);
  assert.equal(graph.taggedPosts, 1);
});

test('empty posts and names containing punctuation remain valid without invented nodes', () => {
  assert.deepEqual(buildTagGraph([], now), { nodes: [], edges: [], taggedPosts: 0 });
  const graph = buildTagGraph([{ date: '2026-10-10', tags: [tag('C++'), tag('</script>"&')] }], now);
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.edges.length, 1);
  assert.ok(graph.nodes.find(n => n.name === 'C++'));
});
