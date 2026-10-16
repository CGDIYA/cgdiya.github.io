(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TagGraphMotion = factory();
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  function shouldShowLabel(count, radius, zoom, emphasized = false, matched = false) {
    if (emphasized || matched) return true;
    if (radius * zoom < 12) return false;
    return zoom >= (count <= 1 ? 1.5 : count <= 3 ? 1.2 : .85);
  }

  function createSpringSystem(points, edges) {
    const velocities = points.map(() => ({ x: 0, y: 0 }));
    const degree = points.map(() => 0);
    edges.forEach(edge => { degree[edge.source]++; degree[edge.target]++; });
    const links = edges.map(edge => ({
      ...edge,
      x: points[edge.target].x - points[edge.source].x,
      y: points[edge.target].y - points[edge.source].y,
      strength: .065 * Math.min(1.6, Math.sqrt(edge.count || 1))
    }));

    function step(pinned = null) {
      const forces = points.map(() => ({ x: 0, y: 0 }));
      for (const link of links) {
        const a = points[link.source], b = points[link.target];
        const x = (b.x - a.x - link.x) * link.strength;
        const y = (b.y - a.y - link.y) * link.strength;
        forces[link.source].x += x; forces[link.source].y += y;
        forces[link.target].x -= x; forces[link.target].y -= y;
      }
      let energy = 0;
      points.forEach((point, id) => {
        const speed = velocities[id];
        if (id === pinned) { speed.x = speed.y = 0; return; }
        const mass = Math.max(1, degree[id]);
        speed.x = Math.max(-14, Math.min(14, (speed.x + forces[id].x / mass) * .79));
        speed.y = Math.max(-14, Math.min(14, (speed.y + forces[id].y / mass) * .79));
        point.x += speed.x; point.y += speed.y;
        energy = Math.max(energy, Math.abs(speed.x), Math.abs(speed.y), Math.abs(forces[id].x), Math.abs(forces[id].y));
      });
      return energy > .015;
    }

    return { step };
  }

  return { shouldShowLabel, createSpringSystem };
});
