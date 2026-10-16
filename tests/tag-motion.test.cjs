const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldShowLabel, createSpringSystem } = require('../source/js/tag-graph-motion.js');

test('dragging pulls connected nodes in both directions and leaves unrelated nodes in place', () => {
  const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 350, y: 200 }];
  const system = createSpringSystem(points, [{ source: 0, target: 1, count: 1 }]);
  points[0].x = 65; points[0].y = 40;
  for (let i = 0; i < 90; i++) system.step(0);
  assert.deepEqual(points[0], { x: 65, y: 40 });
  assert.ok(Math.abs(points[1].x - 165) < 1);
  assert.ok(Math.abs(points[1].y - 40) < 1);
  assert.deepEqual(points[2], { x: 350, y: 200 });
  let moving;
  for (let i = 0; i < 200; i++) moving = system.step();
  assert.equal(moving, false);
  assert.ok(points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
});

test('movement propagates along a chain, with a fixed dragged point', () => {
  const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }];
  const system = createSpringSystem(points, [{ source: 0, target: 1 }, { source: 1, target: 2 }]);
  points[0].y = 70;
  for (let i = 0; i < 150; i++) system.step(0);
  assert.ok(points[1].y > 65 && points[2].y > 65);
  assert.equal(points[0].y, 70);
});

test('single-article labels appear at 150%, while tiny screen sizes stay hidden', () => {
  assert.equal(shouldShowLabel(1, 10, 1.12), false);
  assert.equal(shouldShowLabel(1, 10, 1.49), false);
  assert.equal(shouldShowLabel(1, 10, 1.5), true);
  assert.equal(shouldShowLabel(20, 17, 1), true);
  assert.equal(shouldShowLabel(20, 17, .4), false);
  assert.equal(shouldShowLabel(1, 10, .3, true), true);
  assert.equal(shouldShowLabel(1, 10, .3, false, true), true);
});
