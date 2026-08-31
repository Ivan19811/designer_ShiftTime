// js/site-delete.js
// Мінімальна логіка видалення сайту.
// Не втручається у перемикання сторінок/рендер (st-page-selected), тільки прибирає дані сайту з localStorage.

(function () {
  const LS_KEY_SITES = 'st_sites';
  const LS_KEY_CURRENT = 'st_sites_current';

  // Canvas snapshots: map {"siteId:pageId": snapshot}
  const LS_PAGES_SNAPSHOT = 'st_site_pages_state_v1';

  // Header/Footer stores (page-specific)
  const LS_HEADER_STATE = 'st_header_state_v1';
  const LS_HEADER_MODE_PAGES = 'st_header_mode_pages_v1';
  const LS_FOOTER_STATE = 'st_footer_state_v1';
  const LS_FOOTER_MODE_PAGES = 'st_footer_mode_pages_v1';

  function safeParse(str, fallback) {
    try {
      if (str == null || str === '') return fallback;
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  function loadSites() {
    const raw = localStorage.getItem(LS_KEY_SITES);
    const data = safeParse(raw, []);
    return Array.isArray(data) ? data : [];
  }

  function saveSites(sites) {
    try {
      localStorage.setItem(LS_KEY_SITES, JSON.stringify(sites || []));
    } catch (e) {}
  }

  function getCurrentId() {
    try {
      return String(localStorage.getItem(LS_KEY_CURRENT) || '');
    } catch (e) {
      return '';
    }
  }

  function setCurrentId(id) {
    try {
      localStorage.setItem(LS_KEY_CURRENT, String(id || ''));
    } catch (e) {}
  }

  function cleanupSiteArtifacts_(site) {
    try {
      if (!site || !site.id) return;
      const siteId = String(site.id);
      const pageIds = Array.isArray(site.pages)
        ? site.pages.map((p) => String((p && p.id) || '')).filter(Boolean)
        : [];

      // 1) Snapshots st_site_pages_state_v1: remove keys "siteId:*"
      try {
        const raw = localStorage.getItem(LS_PAGES_SNAPSHOT);
        const map = safeParse(raw, {});
        if (map && typeof map === 'object') {
          const prefix = siteId + ':';
          for (const k of Object.keys(map)) {
            if (String(k).startsWith(prefix)) delete map[k];
          }
          localStorage.setItem(LS_PAGES_SNAPSHOT, JSON.stringify(map));
        }
      } catch (e) {}

      // 2) Header state: remove per-page entries
      try {
        const hs = safeParse(localStorage.getItem(LS_HEADER_STATE), null);
        if (hs && typeof hs === 'object' && hs.pages && typeof hs.pages === 'object') {
          for (const pid of pageIds) delete hs.pages[pid];
          localStorage.setItem(LS_HEADER_STATE, JSON.stringify(hs));
        }
      } catch (e) {}

      try {
        const hm = safeParse(localStorage.getItem(LS_HEADER_MODE_PAGES), {});
        if (hm && typeof hm === 'object') {
          for (const pid of pageIds) delete hm[pid];
          localStorage.setItem(LS_HEADER_MODE_PAGES, JSON.stringify(hm));
        }
      } catch (e) {}

      // 3) Footer state: remove per-page entries
      try {
        const fs = safeParse(localStorage.getItem(LS_FOOTER_STATE), null);
        if (fs && typeof fs === 'object' && fs.pages && typeof fs.pages === 'object') {
          for (const pid of pageIds) delete fs.pages[pid];
          localStorage.setItem(LS_FOOTER_STATE, JSON.stringify(fs));
        }
      } catch (e) {}

      try {
        const fm = safeParse(localStorage.getItem(LS_FOOTER_MODE_PAGES), {});
        if (fm && typeof fm === 'object') {
          for (const pid of pageIds) delete fm[pid];
          localStorage.setItem(LS_FOOTER_MODE_PAGES, JSON.stringify(fm));
        }
      } catch (e) {}
    } catch (e) {
      console.warn('[site-delete] cleanup error', e);
    }
  }

  function findSiteById(sites, id) {
    const sid = String(id || '');
    return sites.find((s) => s && String(s.id) === sid) || null;
  }

  function bind() {
    const btn = document.getElementById('smDeleteBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const sites = loadSites();
      if (!sites.length) {
        window.alert('Немає сайтів для видалення.');
        return;
      }

      const currentId = getCurrentId();
      const current = currentId ? findSiteById(sites, currentId) : null;
      if (!current) {
        window.alert('Спочатку вибери сайт у списку.');
        return;
      }

      const label = current.name || current.slug || current.id;
      const ok = window.confirm(
        'Видалити сайт "' + label + '"?\n\n' +
          'Будуть видалені: сторінки, snapshots сторінок, page-шапки і page-футери цього сайту.\n\n' +
          'Цю дію неможливо скасувати.'
      );
      if (!ok) return;

      cleanupSiteArtifacts_(current);

      const nextSites = sites.filter((s) => s && String(s.id) !== String(current.id));
      saveSites(nextSites);

      const next = nextSites.length ? nextSites[0] : null;
      setCurrentId(next ? next.id : '');

      // Мінімально надійний спосіб без втручання в існуючі рендери:
      // перезавантажуємо UI, щоб всі віджети підтягнули оновлений localStorage.
      window.location.reload();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
