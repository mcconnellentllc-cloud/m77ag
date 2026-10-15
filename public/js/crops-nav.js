// Crops & Grain section tabs. Field Manager, Field Planner, Projections and
// Seed Orders share these tabs. To add a page to the section, add one line
// to PAGES.
(function () {
  'use strict';
  const PAGES = [
    { label: 'Field Manager', href: '/admin/field-manager', match: ['/admin/field-manager'] },
    { label: 'Field Planner', href: '/admin/field-planner', match: ['/admin/field-planner', '/admin/farm-operations'] },
    { label: 'Projections', href: '/admin/farm-projections', match: ['/admin/farm-projections'] },
    { label: 'Seed Orders', href: '/admin/farming/seed-orders', match: ['/admin/farming/seed-orders'] }
  ];
  const CSS = '.crops-nav{display:flex;gap:4px;flex-wrap:wrap;max-width:1400px;margin:0 auto;padding:14px 20px 0}' +
    '.crops-nav .cn-title{font-family:Oswald,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#888;align-self:center;margin-right:10px}' +
    '.crops-nav a{padding:8px 16px;border-radius:5px;font-size:14px;font-weight:600;color:#2d5016;text-decoration:none;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,0.06);transition:all .2s ease}' +
    '.crops-nav a:hover{background:#e8efe1}' +
    '.crops-nav a.active{background:#2d5016;color:#fff}' +
    '.crops-nav a:focus-visible{outline:3px solid #d4a54a;outline-offset:2px}' +
    '@media (max-width:700px){.crops-nav{padding:12px 16px 0}.crops-nav .cn-title{width:100%;margin-bottom:2px}.crops-nav a{padding:8px 12px;font-size:13px}}';
  function render() {
    const host = document.getElementById('cropsNav');
    if (!host) return;
    if (!document.getElementById('crops-nav-css')) {
      const st = document.createElement('style');
      st.id = 'crops-nav-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    host.className = 'crops-nav';
    host.setAttribute('role', 'navigation');
    host.setAttribute('aria-label', 'Crops and Grain');
    host.innerHTML = '<span class="cn-title">Crops &amp; Grain</span>' + PAGES.map(p =>
      '<a href="' + p.href + '"' + (p.match.includes(path) ? ' class="active" aria-current="page"' : '') + '>' + p.label + '</a>').join('');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
