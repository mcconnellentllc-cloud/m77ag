// Admin area sign-in. Loaded first on every page under /admin (except the
// login page). Sends the signed-in user's token with every request to this
// site's /api, and returns to the login page when there is no valid session.
(function () {
  'use strict';
  const LOGIN = '/admin/login';
  const KEY = 'adminToken';
  let token = null;
  try { token = localStorage.getItem(KEY); } catch (e) { token = null; }

  // Expiry from the token itself; an unreadable token counts as expired.
  function expired(t) {
    try {
      const part = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const body = JSON.parse(atob(part + '==='.slice((part.length + 3) % 4)));
      return typeof body.exp === 'number' && body.exp * 1000 <= Date.now();
    } catch (e) { return true; }
  }

  function toLogin() {
    try { localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ }
    const back = encodeURIComponent(location.pathname + location.search);
    location.replace(LOGIN + '?next=' + back);
  }

  if (!token || expired(token)) { toLogin(); return; }

  const origFetch = window.fetch.bind(window);
  const isOwnApi = url => {
    try {
      const u = new URL(url, location.href);
      return u.origin === location.origin && u.pathname.startsWith('/api/');
    } catch (e) { return false; }
  };

  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    if (!isOwnApi(url)) return origFetch(input, init);
    init = init || {};
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    const current = headers.get('Authorization') || '';
    // Fill in a missing or empty bearer (pages that read another storage key send "Bearer null").
    if (!current || /^Bearer\s*(null|undefined)?\s*$/i.test(current)) headers.set('Authorization', 'Bearer ' + token);
    return origFetch(input, Object.assign({}, init, { headers })).then(res => {
      // 401: the session is gone (expired, signed out, account disabled).
      if (res.status === 401) toLogin();
      return res;
    });
  };
})();
