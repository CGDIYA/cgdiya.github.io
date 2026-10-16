const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const version = crypto.createHash('sha256').update(
  ['css/mobile.css', 'js/mobile-ui.js']
    .map(file => fs.readFileSync(path.join(__dirname, '../source', file))).join('\n')
).digest('hex').slice(0, 10);

const items = [
  ['/', '首页', 'M3 10.5 12 3l9 7.5M5 9v12h5v-7h4v7h5V9'],
  ['/tags/', '标签', 'M3 3h8l10 10-8 8L3 11V3ZM7 7h.01'],
  ['/archives/', '归档', 'M4 3h16v5H4zM5 8v13h14V8M9 12h6'],
  ['/about/', '关于', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2']
];
const links = items.map(([url, label, icon]) => `<a href="${url}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icon}"/></svg><span>${label}</span></a>`).join('');

hexo.extend.injector.register('head_end', `<link rel="stylesheet" href="/css/mobile.css?v=${version}">`);
hexo.extend.injector.register('body_end', `<nav id="mobile-nav" aria-label="手机主导航">${links}</nav><script src="/js/mobile-ui.js?v=${version}" defer></script>`);
