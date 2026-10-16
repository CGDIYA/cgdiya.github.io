(() => {
  'use strict';
  const nav = document.getElementById('mobile-nav');
  if (!nav) return;
  const pathname = window.location.pathname;
  for (const link of nav.querySelectorAll('a')) {
    const route = link.getAttribute('href');
    const active = route === '/' ? pathname === '/' || /^\/page\/\d+\/?$/.test(pathname) : pathname.startsWith(route);
    if (active) link.setAttribute('aria-current', 'page');
  }

  // Keep the theme's existing search and menu actions accessible by keyboard.
  for (const [selector, label] of [['#search-button .site-page', '搜索文章'], ['#toggle-menu .site-page', '打开导航菜单']]) {
    const control = document.querySelector(selector);
    if (!control) continue;
    control.setAttribute('role', 'button');
    control.setAttribute('aria-label', label);
    control.tabIndex = 0;
    control.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        control.click();
      }
    });
  }
})();
