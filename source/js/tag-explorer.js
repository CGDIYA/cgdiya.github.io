(() => {
  'use strict';
  const root = document.getElementById('tag-explorer');
  if (!root || root.dataset.ready) return;
  const dataElement = root.querySelector('#tg-data');
  if (!dataElement) return;
  const { nodes, edges } = JSON.parse(dataElement.textContent);
  if (!nodes.length) return;
  const { shouldShowLabel, createSpringSystem } = window.TagGraphMotion;

  const svg = root.querySelector('#tg-graph');
  const viewport = root.querySelector('#tg-viewport');
  const world = svg.querySelector('.tg-world');
  const nodeLayer = svg.querySelector('.tg-nodes');
  const edgeLayer = svg.querySelector('.tg-edges');
  const query = root.querySelector('#tg-query');
  const hint = root.querySelector('#tg-hint');
  const directory = root.querySelector('#tg-directory');
  const cards = [...directory.children];
  const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
  const neighborMap = nodes.map(() => new Set());
  edges.forEach(edge => {
    neighborMap[edge.source].add(edge.target);
    neighborMap[edge.target].add(edge.source);
  });

  const ns = 'http://www.w3.org/2000/svg';
  function makeSvg(tag, attributes = {}) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([name, value]) => el.setAttribute(name, value));
    return el;
  }
  const maxCount = Math.max(...nodes.map(node => node.count));
  const minCount = Math.min(...nodes.map(node => node.count));
  const sizes = nodes.map(node => maxCount === minCount ? 10 : 8 + 9 * Math.sqrt((node.count - minCount) / (maxCount - minCount)));
  const nodeElements = nodes.map((node, id) => {
    const a = makeSvg('a', { href: node.url, class: 'tg-node', 'data-node-id': id, tabindex: 0,
      'aria-label': `${node.name}，${node.count} 篇文章，与 ${neighborMap[id].size} 个标签有关联` });
    const title = makeSvg('title');
    title.textContent = `${node.name} · ${node.count} 篇文章 · 点击阅读`;
    const visual = makeSvg('g', { class: 'tg-node-visual' });
    visual.style.animationDelay = `${-id * .83}s`;
    const halo = makeSvg('circle', { class: 'tg-node-halo', r: sizes[id] + 10 });
    const dot = makeSvg('circle', { class: 'tg-node-dot', r: sizes[id] });
    const label = makeSvg('text', { x: sizes[id] + 12, y: 5, 'font-size': 14 + (sizes[id] - 8) * .32 });
    label.textContent = node.name;
    visual.append(halo, dot, label);
    a.append(title, visual);
    nodeLayer.append(a);
    return a;
  });
  const edgeElements = edges.map(edge => {
    const line = makeSvg('line', { class: 'tg-edge', 'stroke-width': Math.min(3.5, .8 + Math.sqrt(edge.count) * .65) });
    const title = makeSvg('title');
    title.textContent = `${nodes[edge.source].name} 与 ${nodes[edge.target].name}：共同 ${edge.count} 篇文章`;
    line.append(title);
    edgeLayer.append(line);
    return line;
  });

  let width = 800, height = 370, zoom = 1, panX = 0, panY = 0;
  let positions = [], matching = new Set(nodes.map(node => node.id));
  let sort = 'name', drag = null, suppressClick = false;
  let activeNode = null, motion = null, motionFrame = null, lastFrame = 0, motionSteps = 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const components = [];
  const visited = new Set();
  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const group = [], queue = [node.id];
    visited.add(node.id);
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      group.push(id);
      for (const other of neighborMap[id]) {
        if (!visited.has(other)) { visited.add(other); queue.push(other); }
      }
    }
    components.push(group);
  }

  function layout() {
    stopMotion();
    const columns = width > 600 ? Math.min(3, components.length) : 1;
    const rows = Math.ceil(components.length / columns);
    const cellWidth = Math.min(340, (width - 90) / columns);
    const cellHeight = Math.max(125, (height - 60) / rows);
    positions = nodes.map(() => ({ x: 0, y: 0 }));
    components.forEach((group, index) => {
      const col = index % columns, row = Math.floor(index / columns);
      const cx = (col - (columns - 1) / 2) * cellWidth - 35;
      const cy = (row - (rows - 1) / 2) * cellHeight;
      const radius = group.length === 1 ? 0 : group.length === 2 ? Math.min(72, cellWidth / 3.1) : 50 + Math.sqrt(group.length) * 25;
      group.forEach((id, member) => {
        const angle = group.length === 2 ? member * Math.PI + .28 : member * Math.PI * 2 / group.length - Math.PI / 2;
        positions[id] = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
      });
    });
    // Relax labels and linked nodes within their component without joining unrelated tags.
    for (let iteration = 0; iteration < 90; iteration++) {
      const delta = positions.map(() => ({ x: 0, y: 0 }));
      components.forEach(group => {
        for (let a = 0; a < group.length; a++) {
          for (let b = a + 1; b < group.length; b++) {
            const i = group[a], j = group[b];
            const dx = positions[j].x - positions[i].x, dy = positions[j].y - positions[i].y;
            const d = Math.max(1, Math.hypot(dx, dy));
            const target = 74 + Math.min(85, Math.max(nodes[i].name.length, nodes[j].name.length) * 5);
            if (d < target) {
              const strength = (target - d) * .035;
              delta[i].x -= dx / d * strength; delta[i].y -= dy / d * strength;
              delta[j].x += dx / d * strength; delta[j].y += dy / d * strength;
            }
          }
        }
      });
      positions.forEach((point, id) => { point.x += delta[id].x; point.y += delta[id].y; });
    }
    motion = createSpringSystem(positions, edges);
    fit();
  }

  function stopMotion() {
    if (motionFrame !== null) cancelAnimationFrame(motionFrame);
    motionFrame = null;
    lastFrame = 0;
    viewport.classList.remove('is-settling');
  }

  function wakeMotion() {
    if (!motion || document.hidden) return;
    motionSteps = 0;
    const pinned = drag && drag.moved ? drag.id : null;
    if (reduceMotion.matches) {
      for (let i = 0; i < 80; i++) { if (!motion.step(pinned)) break; }
      draw();
      return;
    }
    if (motionFrame !== null) return;
    viewport.classList.add('is-settling');
    function tick(time) {
      const steps = lastFrame ? Math.min(3, Math.max(1, Math.round((time - lastFrame) / 16.67))) : 1;
      lastFrame = time;
      let moving = false;
      for (let i = 0; i < steps; i++) moving = motion.step(drag && drag.moved ? drag.id : null) || moving;
      draw();
      motionSteps += steps;
      if (moving && motionSteps < 360) motionFrame = requestAnimationFrame(tick);
      else { motionFrame = null; lastFrame = 0; viewport.classList.remove('is-settling'); }
    }
    motionFrame = requestAnimationFrame(tick);
  }

  function fit() {
    const left = Math.min(...positions.map((p, id) => p.x - sizes[id] - 12));
    const right = Math.max(...positions.map((p, id) => p.x + sizes[id] + 18 + [...nodes[id].name].reduce((n, c) => n + (/[^\x00-\x7F]/.test(c) ? 15 : 8), 0)));
    const top = Math.min(...positions.map(p => p.y - 30));
    const bottom = Math.max(...positions.map(p => p.y + 30));
    zoom = Math.min(1.12, (width - 55) / Math.max(1, right - left), (height - 50) / Math.max(1, bottom - top));
    zoom = Math.max(.2, zoom);
    panX = -(left + right) / 2 * zoom;
    panY = -(top + bottom) / 2 * zoom;
    draw();
  }

  function draw() {
    world.setAttribute('transform', `translate(${width / 2 + panX} ${height / 2 + panY}) scale(${zoom})`);
    nodeElements.forEach((el, id) => el.setAttribute('transform', `translate(${positions[id].x} ${positions[id].y})`));
    edgeElements.forEach((el, id) => {
      const edge = edges[id], a = positions[edge.source], b = positions[edge.target];
      el.setAttribute('x1', a.x); el.setAttribute('y1', a.y);
      el.setAttribute('x2', b.x); el.setAttribute('y2', b.y);
    });
    root.querySelector('#tg-zoom').value = `${Math.round(zoom * 100)}%`;
    root.querySelector('[data-tg-action="out"]').disabled = zoom <= .201;
    root.querySelector('[data-tg-action="in"]').disabled = zoom >= 2.399;
    updateLabels();
  }

  function updateLabels() {
    const searching = query.value.trim().length > 0;
    nodeElements.forEach((el, id) => {
      const highlighted = activeNode !== null && (id === activeNode || neighborMap[activeNode].has(id));
      const show = shouldShowLabel(nodes[id].count, sizes[id], zoom, highlighted, searching && matching.has(id));
      el.classList.toggle('is-label-hidden', !show);
      const fontSize = 14 + (sizes[id] - 8) * .32;
      el.querySelector('text').setAttribute('font-size', fontSize / (show ? Math.min(1, zoom) : 1));
    });
  }

  function zoomAt(factor, x = width / 2, y = height / 2) {
    const next = Math.min(2.4, Math.max(.2, zoom * factor));
    const localX = (x - width / 2 - panX) / zoom;
    const localY = (y - height / 2 - panY) / zoom;
    panX = x - width / 2 - localX * next;
    panY = y - height / 2 - localY * next;
    zoom = next;
    draw();
  }

  function focusNode(id = null) {
    activeNode = id;
    nodeElements.forEach((el, index) => {
      const visible = matching.has(index);
      const related = id === null || index === id || neighborMap[id].has(index);
      el.classList.toggle('is-muted', !visible || !related);
      el.classList.toggle('is-related', visible && id !== null && related);
      el.classList.toggle('is-current', visible && id === index);
      el.setAttribute('tabindex', visible ? '0' : '-1');
      el.setAttribute('aria-hidden', String(!visible));
    });
    edgeElements.forEach((el, index) => {
      const edge = edges[index];
      const related = id === null || edge.source === id || edge.target === id;
      el.classList.toggle('is-muted', !related || !(matching.has(edge.source) && matching.has(edge.target)));
      el.classList.toggle('is-active', id !== null && related);
    });
    hint.textContent = !matching.size ? '没有匹配的标签，请换个关键词。' : id === null ? '点击标签阅读文章，悬停查看关联。' : `${nodes[id].name} · ${nodes[id].count} 篇文章 · 关联 ${neighborMap[id].size} 个标签`;
    updateLabels();
  }
  nodeElements.forEach((el, id) => {
    el.addEventListener('mouseenter', () => { if (!drag) focusNode(id); });
    el.addEventListener('mouseleave', () => { if (!drag) focusNode(); });
    el.addEventListener('focus', () => focusNode(id));
    el.addEventListener('blur', () => focusNode());
  });

  function updateDirectory() {
    const text = query.value.trim().toLocaleLowerCase('zh-CN');
    matching = new Set(nodes.filter(node => node.name.toLocaleLowerCase('zh-CN').includes(text)).map(node => node.id));
    const ordered = [...cards].sort((a, b) => {
      const x = nodes[Number(a.dataset.tagId)], y = nodes[Number(b.dataset.tagId)];
      return (sort === 'name' ? 0 : sort === 'newest' ? y.latest - x.latest : x.latest - y.latest) || collator.compare(x.name, y.name);
    });
    ordered.forEach(card => { card.hidden = !matching.has(Number(card.dataset.tagId)); directory.append(card); });
    root.querySelector('#tg-empty').hidden = matching.size !== 0;
    root.querySelector('#tg-result-count').textContent = `${matching.size} / ${nodes.length} 个标签`;
    focusNode();
  }
  query.addEventListener('input', updateDirectory);
  root.querySelectorAll('[data-sort]').forEach(button => button.addEventListener('click', () => {
    sort = button.dataset.sort;
    root.querySelectorAll('[data-sort]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    updateDirectory();
  }));
  root.querySelectorAll('[data-tg-action]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.tgAction === 'reset') layout();
    else zoomAt(button.dataset.tgAction === 'in' ? 1.2 : 1 / 1.2);
  }));

  viewport.addEventListener('wheel', event => {
    if (matchMedia('(pointer: coarse)').matches || event.ctrlKey) return;
    event.preventDefault();
    const rect = svg.getBoundingClientRect();
    zoomAt(Math.exp(-Math.sign(event.deltaY) * .12), event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const a = event.target.closest('.tg-node');
    const id = a ? Number(a.dataset.nodeId) : null;
    drag = { pointer: event.pointerId, id, x: event.clientX, y: event.clientY, moved: false };
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.pointer !== event.pointerId) return;
    if (!(event.buttons & 1)) { endDrag(event); return; }
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) {
      viewport.setPointerCapture(event.pointerId);
      drag.moved = true;
      viewport.classList.add('is-dragging');
    }
    if (drag.id === null) { panX += dx; panY += dy; }
    else {
      positions[drag.id].x += dx / zoom;
      positions[drag.id].y += dy / zoom;
      focusNode(drag.id);
      wakeMotion();
    }
    drag.x = event.clientX; drag.y = event.clientY;
    draw();
    event.preventDefault();
  });
  function endDrag(event) {
    if (!drag || drag.pointer !== event.pointerId) return;
    const nodeMoved = drag.moved && drag.id !== null;
    suppressClick = drag.moved;
    if (suppressClick) setTimeout(() => { suppressClick = false; }, 0);
    drag = null;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    focusNode();
    if (nodeMoved) wakeMotion();
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  window.addEventListener('blur', () => {
    drag = null;
    viewport.classList.remove('is-dragging');
    focusNode();
    wakeMotion();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMotion();
    else wakeMotion();
  });
  window.addEventListener('pagehide', stopMotion);
  viewport.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
  }, true);
  viewport.addEventListener('dragstart', event => event.preventDefault());
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport) return;
    let handled = true;
    if (event.key === '+' || event.key === '=') zoomAt(1.2);
    else if (event.key === '-') zoomAt(1 / 1.2);
    else if (event.key === '0') layout();
    else if (event.key === 'ArrowLeft') { panX += 25; draw(); }
    else if (event.key === 'ArrowRight') { panX -= 25; draw(); }
    else if (event.key === 'ArrowUp') { panY += 25; draw(); }
    else if (event.key === 'ArrowDown') { panY -= 25; draw(); }
    else if (event.key === 'Escape') focusNode();
    else handled = false;
    if (handled) event.preventDefault();
  });

  const graphDetails = root.querySelector('#tg-graph-details');
  const mobileLayout = matchMedia('(max-width: 768px)');
  function syncGraphDisclosure() {
    graphDetails.open = !mobileLayout.matches;
    if (!graphDetails.open) stopMotion();
  }
  syncGraphDisclosure();
  mobileLayout.addEventListener('change', syncGraphDisclosure);
  graphDetails.addEventListener('toggle', () => {
    if (!graphDetails.open) stopMotion();
  });
  root.querySelectorAll('[data-tg-enhanced]').forEach(el => { el.hidden = false; });
  root.dataset.ready = 'true';
  let previousWidth = 0;
  new ResizeObserver(() => {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || Math.abs(previousWidth - rect.width) < 1) return;
    previousWidth = width = rect.width;
    height = rect.height;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    layout();
  }).observe(viewport);
  updateDirectory();
})();
