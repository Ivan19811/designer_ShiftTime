// widgets/site-manager/js/site-manager.js
;(function () {
  const LS_KEY_SITES = 'st_sites';
  const LS_KEY_CURRENT = 'st_sites_current';

  // ✅ Галерея шаблонів (джерело істини)
  // Site templates зберігаються у st_templates_store_v1 як items[type="site"].
  const LS_TPL_STORE = 'st_templates_store_v1';
  const SITE_TPL_TYPE = 'site';
  const SITE_TPL_ROOT_FOLDER_ID = 'fld_site';
  const templateSelectEl = document.getElementById('siteTemplateSelect');
  const templateInfoEl = document.getElementById('siteTemplateInfo');

  const applyTemplateBtn = document.getElementById('siteApplyTemplateBtn');






  const rootEl = document.getElementById('siteWidgetRoot');
  const panelEl = document.getElementById('sitePanel');
  const saveBtn = document.getElementById('siteSaveBtn');

  const nameEl = document.getElementById('siteName');
  const slugEl = document.getElementById('siteSlug');
  const descEl = document.getElementById('siteDescription');

  const netlifySiteNameEl = document.getElementById('netlifySiteName');
  const netlifyUrlEl = document.getElementById('netlifyUrl');
  const netlifyPublishDirEl = document.getElementById('netlifyPublishDir');
  const netlifyDeployHookEl = document.getElementById('netlifyDeployHook');

  const idViewEl = document.getElementById('siteIdView');
  const createdViewEl = document.getElementById('siteCreatedAtView');
  const updatedViewEl = document.getElementById('siteUpdatedAtView');

  const createBtn = document.getElementById('smCreateBtn');
  const openBtn = document.getElementById('smOpenBtn');
  const siteListEl = document.getElementById('smSiteList');

  // Сторінки сайту
  const addPageBtn = document.getElementById('siteAddPageBtn');
  const pagesListEl = document.getElementById('sitePagesList');

  // DEBUG-панель
  const debugEl = document.getElementById('siteDebug');
  const debugValueEl = debugEl ? debugEl.querySelector('.site-debug__value') : null;

  if (!rootEl || !panelEl) {
    return;
  }

  // ---------- Helper для подій зовні (конструктор) ----------

  function emitEvent(name, detail) {
    try {
      window.dispatchEvent(
        new CustomEvent(name, {
          detail,
          bubbles: false
        })
      );
    } catch (e) {
      console.warn('[SiteManager] Не вдалося надіслати подію', name, e);
    }
  }

  function updateDebug(site, page) {
    if (!debugValueEl) return;

    if (!site) {
      debugValueEl.textContent = '—';
      return;
    }

    const sitePart = site.slug || site.name || site.id;
    const pagePart = page
      ? page.path || page.name || page.id
      : 'без вибраної сторінки';

    debugValueEl.textContent = sitePart + '   •   ' + pagePart;
  }

  // ---------- Шаблони сайту ----------

  function safeJsonParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  // Нормалізація pages для "Шаблон сайту".
  // Підтримує формати:
  // 1) { pages: { home: {templateId:"..."}, ... } }  (новий)
  // 2) { pages: { home: "tpl_id", ... } }           (старий builder)
  function normalizeSiteTemplatePages_(parsed) {
    const pages = parsed && parsed.pages && typeof parsed.pages === 'object' ? parsed.pages : null;
    if (!pages) return null;

    const out = {};
    for (const [role, v] of Object.entries(pages)) {
      if (!role) continue;
      if (!v) continue;

      if (typeof v === 'string') {
        out[role] = { templateId: v };
        continue;
      }
      if (typeof v === 'object') {
        const tid = v.templateId ? String(v.templateId) : '';
        if (!tid) continue;
        out[role] = { templateId: tid };
        continue;
      }
    }
    return Object.keys(out).length ? out : null;
  }

  function resolveFooterFromPageBundle_(bundle, targetPageId) {
    const result = { mode: 'global', html: '' };
    try {
      if (!bundle || typeof bundle !== 'object') return result;

      const oldPageId = String(bundle?.site?.page?.id || '');
      const newPageId = String(targetPageId || '');
      const footerLS = bundle.footerLS && typeof bundle.footerLS === 'object' ? bundle.footerLS : {};

      // 1) mode: прямий footerMode або fallback із footerLS.
      if (bundle.footerMode === 'page' || bundle.footerMode === 'global') {
        result.mode = bundle.footerMode;
      } else {
        try {
          const rawMap = footerLS['st_footer_mode_pages_v1'];
          const map = rawMap ? JSON.parse(rawMap) : null;
          const m = map && typeof map === 'object' ? (map[oldPageId] || map[newPageId]) : null;
          if (m === 'page' || m === 'global') result.mode = m;
        } catch {}
        try {
          const gm = footerLS['st_footer_mode_global_v1'];
          if ((gm === 'page' || gm === 'global') && result.mode !== 'page') result.mode = gm;
        } catch {}
      }

      // 2) html: прямий footerHTML.
      if (typeof bundle.footerHTML === 'string' && bundle.footerHTML.trim()) {
        result.html = bundle.footerHTML;
        return result;
      }

      // 3) html: новий st_footer_state_v1 зі старого pageId шаблону або global.
      try {
        const stRaw = footerLS['st_footer_state_v1'];
        const st = stRaw ? JSON.parse(stRaw) : null;
        if (st && typeof st === 'object') {
          const pageHtmlOld = oldPageId && st.pages && st.pages[oldPageId] && typeof st.pages[oldPageId].html === 'string'
            ? st.pages[oldPageId].html
            : '';
          const pageHtmlNew = newPageId && st.pages && st.pages[newPageId] && typeof st.pages[newPageId].html === 'string'
            ? st.pages[newPageId].html
            : '';
          const globalHtml = st.global && typeof st.global.html === 'string' ? st.global.html : '';
          result.html = String((result.mode === 'page' && (pageHtmlOld.trim() || pageHtmlNew.trim()))
            ? (pageHtmlOld || pageHtmlNew)
            : (globalHtml || pageHtmlOld || pageHtmlNew || ''));
          if (result.html.trim()) return result;
        }
      } catch {}

      // 4) html: legacy footer globals/pages.
      try {
        const legacyGlobal = footerLS['st_footer_global_v1'] ? JSON.parse(footerLS['st_footer_global_v1']) : null;
        if (legacyGlobal && typeof legacyGlobal.html === 'string' && legacyGlobal.html.trim()) {
          result.html = legacyGlobal.html;
          return result;
        }
      } catch {}

      try {
        const legacyPages = footerLS['st_footer_pages_v1'] ? JSON.parse(footerLS['st_footer_pages_v1']) : null;
        const p1 = oldPageId && legacyPages && legacyPages[oldPageId] ? legacyPages[oldPageId] : null;
        const p2 = newPageId && legacyPages && legacyPages[newPageId] ? legacyPages[newPageId] : null;
        const html = (p1 && typeof p1.html === 'string' && p1.html.trim()) ? p1.html
          : ((p2 && typeof p2.html === 'string' && p2.html.trim()) ? p2.html : '');
        if (html) result.html = html;
      } catch {}
    } catch (e) {
      console.warn('[SiteManager] resolveFooterFromPageBundle_ failed', e);
    }
    return result;
  }


  function loadTemplatesStore_() {
    const raw = localStorage.getItem(LS_TPL_STORE);
    const st = safeJsonParse(raw, null);
    if (!st || typeof st !== 'object') return { folders: {}, items: [] };
    st.items = Array.isArray(st.items) ? st.items : [];
    st.folders = st.folders && typeof st.folders === 'object' ? st.folders : {};
    return st;
  }

  function collectFolderIds_(node, out) {
    if (!node || !node.id) return;
    out.push(node.id);
    const kids = Array.isArray(node.children) ? node.children : [];
    for (const k of kids) collectFolderIds_(k, out);
  }

  function getSiteFolderIds_() {
    const st = loadTemplatesStore_();
    const root = st.folders && st.folders.root;
    const ids = [];
    if (!root) return ids;

    // знаходимо вузол fld_site і беремо всі підпапки
    const stack = [root];
    let siteNode = null;
    while (stack.length) {
      const n = stack.pop();
      if (!n) continue;
      if (n.id === SITE_TPL_ROOT_FOLDER_ID) {
        siteNode = n;
        break;
      }
      const kids = Array.isArray(n.children) ? n.children : [];
      for (const k of kids) stack.push(k);
    }
    if (!siteNode) return [SITE_TPL_ROOT_FOLDER_ID];
    collectFolderIds_(siteNode, ids);
    return ids.length ? ids : [SITE_TPL_ROOT_FOLDER_ID];
  }

  function getSiteTemplatesFromStore() {
    const st = loadTemplatesStore_();
    const allowedFolders = new Set(getSiteFolderIds_());
    return st.items
      .filter((x) => x && x.type === SITE_TPL_TYPE)
      .filter((x) => !x.folderId || allowedFolders.has(x.folderId))
      .map((x) => ({
        id: String(x.id || ''),
        name: String(x.name || 'Без назви'),
        folderId: String(x.folderId || ''),
        meta: x.meta || {},
        html: String(x.html || '')
      }));
  }

  function populateTemplateSelect() {
    if (!templateSelectEl) return;
    const templates = getSiteTemplatesFromStore();
    templateSelectEl.innerHTML = '';

    const optEmpty = document.createElement('option');
    optEmpty.value = '';
    optEmpty.textContent = 'Без шаблону / порожній (сторінки НЕ створюються)';
    templateSelectEl.appendChild(optEmpty);

    for (const tpl of templates) {
      const opt = document.createElement('option');
      opt.value = tpl.id;
      opt.textContent = tpl.name;
      templateSelectEl.appendChild(opt);
    }
  }

  function updateTemplateInfoFromId(templateId) {
    if (!templateInfoEl) return;
    const id = String(templateId || '');
    if (!id) {
      templateInfoEl.textContent =
        'Сайт буде створений порожнім (без сторінок). Додай сторінки тільки через кнопку «Застосувати шаблон».\nШаблон береться з Галереї → папка «Сайт».';
      return;
    }
    const templates = getSiteTemplatesFromStore();
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) {
      templateInfoEl.textContent = 'Обраний шаблон не знайдено у Галереї (папка «Сайт»).';
      return;
    }

    // Підказка: скільки сторінок буде створено
    let count = 0;
    try {
      const parsed = safeJsonParse(tpl.html, null);
      const pages = parsed && parsed.pages && typeof parsed.pages === 'object' ? parsed.pages : null;
      if (pages) {
        for (const k of Object.keys(pages)) {
          const v = pages[k];
          if (v && v.templateId) count++;
        }
      }
    } catch {}
    templateInfoEl.textContent = `Шаблон: ${tpl.name}. Буде створено сторінок: ${count}.`;
  }










  // ---------- LocalStorage helpers ----------

  function loadSites() {
    try {
      const raw = localStorage.getItem(LS_KEY_SITES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[SiteManager] Помилка читання st_sites з localStorage:', e);
      return [];
    }
  }

  function saveSites(sites) {
    try {
      localStorage.setItem(LS_KEY_SITES, JSON.stringify(sites || []));
    } catch (e) {
      console.warn('[SiteManager] Помилка збереження st_sites:', e);
    }
  }

  function getCurrentId() {
    return localStorage.getItem(LS_KEY_CURRENT) || '';
  }

  function setCurrentId(id) {
    if (id) {
      localStorage.setItem(LS_KEY_CURRENT, id);
    } else {
      localStorage.removeItem(LS_KEY_CURRENT);
    }
  }

  // ---------- Модель сайту та сторінок ----------

  function createEmptySite() {
    const now = Date.now();
    return {
      id: 'site_' + now,
      name: '',
      slug: '',
      description: '',
      createdAt: now,
      updatedAt: now,
      netlify: {
        siteName: '',
        url: '',
        publishDir: 'frontend',
        deployHook: ''
      },
      pages: [],
      currentPageId: null
    };
  }

  function createPage(name, path) {
    const now = Date.now();
    return {
      id: 'page_' + now + '_' + Math.floor(Math.random() * 1000),
      name: name || 'Нова сторінка',
      path: path || '/'
    };
  }

  // START-FRESH-PAGE-TEMPLATE-2026
  // ❗ Важливо: сайт створюємо порожнім (без сторінок).
  // Сторінки з'являються ТІЛЬКИ після "Застосувати шаблон".
  // Тому ensureDefaultPage тепер працює лише у forced-режимі (для legacy-операцій).
  function ensureDefaultPage(site, force) {
    if (!site) return;
    if (!force) return;

    if (!Array.isArray(site.pages) || !site.pages.length) {
      const page = createPage('Головна', '/');
      site.pages = [page];
      site.currentPageId = page.id;
    }

    if (!site.currentPageId && site.pages.length) {
      site.currentPageId = site.pages[0].id;
    }
  }

  // ---------- Canvas snapshots (сторінка → snapshot) ----------
  // Ключ той самий, що у js/state/page-canvas-store.js
  const LS_PAGES_SNAPSHOT = 'st_site_pages_state_v1';

  function savePageSnapshot_(siteId, pageId, snapshot) {
    try {
      if (!siteId || !pageId || !snapshot || typeof snapshot !== 'object') return false;
      const raw = localStorage.getItem(LS_PAGES_SNAPSHOT);
      const map = safeJsonParse(raw, {});
      const key = String(siteId) + ':' + String(pageId);
      map[key] = snapshot;
      localStorage.setItem(LS_PAGES_SNAPSHOT, JSON.stringify(map));
      return true;
    } catch (e) {
      console.warn('[SiteManager] Не вдалося зберегти snapshot сторінки', e);
      return false;
    }
  }

  function findSite(sites, id) {
    return sites.find((s) => s.id === id) || null;
  }

  // ---------- Рендер списку сайтів ----------

  function renderSiteList(sites, currentId) {
    if (!siteListEl) return;
    siteListEl.innerHTML = '';

    if (!sites.length) {
      const li = document.createElement('li');
      li.className = 'sm-site-list-empty';
      li.textContent = 'Сайтів ще немає. Створи перший.';
      siteListEl.appendChild(li);
      return;
    }

    for (const site of sites) {
      const li = document.createElement('li');
      li.className = 'sm-site-item';
      if (site.id === currentId) {
        li.classList.add('sm-site-item--active');
      }
      li.dataset.id = site.id;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'sm-site-item__name';
      nameSpan.textContent = site.name || 'Без назви';

      const slugSpan = document.createElement('span');
      slugSpan.className = 'sm-site-item__slug';
      slugSpan.textContent = site.slug || '—';

      li.appendChild(nameSpan);
      li.appendChild(slugSpan);

      li.addEventListener('click', () => {
        try { if (window.ST_SHOW_MAIN_VIEW) window.ST_SHOW_MAIN_VIEW('site'); } catch (e) {}
        selectSite(site.id);
      });

      siteListEl.appendChild(li);
    }
  }

  // ---------- Рендер сторінок сайту ----------

  function renderPages(site) {
    if (!pagesListEl) return;

    pagesListEl.innerHTML = '';

    if (!site || !Array.isArray(site.pages) || !site.pages.length) {
      const li = document.createElement('li');
      li.className = 'site-pages__item';
      li.textContent = 'Сторінок поки немає.';
      pagesListEl.appendChild(li);
      updateDebug(site, null);
      return;
    }

    for (const page of site.pages) {
      const li = document.createElement('li');
      li.className = 'site-pages__item';
      if (page.id === site.currentPageId) {
        li.classList.add('site-pages__item--active');
      }

      const infoWrap = document.createElement('div');
      infoWrap.className = 'site-pages__item-info';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'site-pages__item-name';
      nameSpan.textContent = page.name || 'Без назви';

      const pathSpan = document.createElement('span');
      pathSpan.className = 'site-pages__item-path';
      pathSpan.textContent = page.path || '/';

      infoWrap.appendChild(nameSpan);
      infoWrap.appendChild(pathSpan);

      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'site-pages__item-actions';

      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'site-pages__item-btn site-pages__item-btn--open';
      openBtn.title = 'Відкрити сторінку';
      openBtn.textContent = '↗';
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setActivePage(page.id);
      });

      const renameBtn = document.createElement('button');
      renameBtn.type = 'button';
      renameBtn.className = 'site-pages__item-btn site-pages__item-btn--rename';
      renameBtn.title = 'Перейменувати сторінку';
      renameBtn.textContent = '✎';
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        renamePage(page.id);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'site-pages__item-btn site-pages__item-btn--delete';
      deleteBtn.title = 'Видалити сторінку';
      deleteBtn.textContent = '✕';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deletePage(page.id);
      });

      actionsWrap.appendChild(openBtn);
      actionsWrap.appendChild(renameBtn);
      actionsWrap.appendChild(deleteBtn);

      li.appendChild(infoWrap);
      li.appendChild(actionsWrap);

      li.addEventListener('click', () => {
        setActivePage(page.id);
      });

      pagesListEl.appendChild(li);
    }

    const currentPage =
      site.pages && site.pages.find((p) => p.id === site.currentPageId);
    updateDebug(site, currentPage || null);
  }

  // ---------- Робота з формою ----------

  function clearForm() {
    nameEl.value = '';
    slugEl.value = '';
    descEl.value = '';

    netlifySiteNameEl.value = '';
    netlifyUrlEl.value = '';
    netlifyPublishDirEl.value = 'frontend';
    netlifyDeployHookEl.value = '';

    if (templateSelectEl) {
      templateSelectEl.value = '';
    }
    updateTemplateInfoFromId('');

    idViewEl.textContent = '—';
    createdViewEl.textContent = '—';
    updatedViewEl.textContent = '—';

    if (pagesListEl) {
      pagesListEl.innerHTML = '';
    }
    updateDebug(null, null);
  }


  function fillFormFromSite(site) {
    if (!site) {
      clearForm();
      return;
    }

    nameEl.value = site.name || '';
    slugEl.value = site.slug || '';
    descEl.value = site.description || '';

    netlifySiteNameEl.value = site.netlify?.siteName || '';
    netlifyUrlEl.value = site.netlify?.url || '';
    netlifyPublishDirEl.value = site.netlify?.publishDir || 'frontend';
    netlifyDeployHookEl.value = site.netlify?.deployHook || '';

    if (templateSelectEl) {
      templateSelectEl.value = site.siteTemplateId || '';
    }
    updateTemplateInfoFromId(site.siteTemplateId || '');

    idViewEl.textContent = site.id || '—';
    createdViewEl.textContent = site.createdAt
      ? new Date(site.createdAt).toLocaleString()
      : '—';
    updatedViewEl.textContent = site.updatedAt
      ? new Date(site.updatedAt).toLocaleString()
      : '—';

    renderPages(site);
  }


   function readSiteFromForm(site) {
    const now = Date.now();
    return {
      ...site,
      name: nameEl.value.trim(),
      slug: slugEl.value.trim(),
      description: descEl.value.trim(),
      // шаблон сайту (тип: site) — з Галереї → папка «Сайт»
      siteTemplateId: templateSelectEl
        ? (templateSelectEl.value || '')
        : site && site.siteTemplateId
        ? site.siteTemplateId
        : '',
      updatedAt: now,
      netlify: {
        siteName: netlifySiteNameEl.value.trim(),
        url: netlifyUrlEl.value.trim(),
        publishDir: netlifyPublishDirEl.value.trim() || 'frontend',
        deployHook: netlifyDeployHookEl.value.trim()
      }
    };
  }

  // ---------- Застосувати шаблон сайту (створює сторінки) ----------

  const ROLE_DEFAULTS = [
    { role: 'home', label: 'Головна', path: '/' },
    { role: 'about', label: 'Про нас', path: '/about' },
    { role: 'contacts', label: 'Контакти', path: '/contacts' },
    { role: 'blog', label: 'Блог', path: '/blog' },
    { role: 'shop', label: 'Товари', path: '/shop' },
    { role: 'product', label: 'Сторінка товару', path: '/product' },
    { role: 'cart', label: 'Кошик', path: '/cart' },
    { role: 'checkout', label: 'Оформлення', path: '/checkout' }
  ];

  function getTemplateItemById_(id) {
    const templates = getSiteTemplatesFromStore();
    const hit = templates.find((t) => t.id === String(id || ''));
    if (hit) return hit;

    // Якщо шукаємо не site template (наприклад page template) — беремо прямо зі store
    const st = loadTemplatesStore_();
    const item = (st.items || []).find((x) => String(x.id || '') === String(id || ''));
    if (!item) return null;
    return {
      id: String(item.id || ''),
      name: String(item.name || 'Без назви'),
      type: String(item.type || ''),
      folderId: String(item.folderId || ''),
      meta: item.meta || {},
      html: String(item.html || '')
    };
  }

  function applySiteTemplateToSite_(site, siteTemplateId) {
    if (!site) return { ok: false, msg: 'Сайт не вибрано.' };
    const tplId = String(siteTemplateId || '');
    if (!tplId) return { ok: false, msg: 'Обери шаблон сайту (папка «Сайт»).'};

    const siteTpl = getTemplateItemById_(tplId);
    if (!siteTpl || !siteTpl.html) return { ok: false, msg: 'Шаблон сайту не знайдено.' };

    const parsed = safeJsonParse(siteTpl.html, null);
    const pagesMap = normalizeSiteTemplatePages_(parsed);
    if (!pagesMap) {
      // legacy: якщо це не JSON (наприклад, старий HTML-сніпет) або pages у невірному форматі
      return { ok: false, msg: 'Шаблон сайту пошкоджений або старого формату (немає pages).' };
    }

    // Мапа ролей → стабільні pageId у сайті.
    // Важливо: page-template може містити у bundle.site.page.id будь-який id (pt_*),
    // але для реального сайту нам потрібні передбачувані id, щоб:
    // - перемикання сторінок було стабільним
    // - шапка/футер коректно вмикались у режимі global/page
    const roleToPageId = {
      home: 'page_home',
      about: 'page_about',
      contacts: 'page_contacts',
      blog: 'page_blog',
      shop: 'page_shop',
      product: 'page_product',
      cart: 'page_cart',
      checkout: 'page_checkout'
    };

    const createdPages = [];
    for (const def of ROLE_DEFAULTS) {
      const entry = pagesMap[def.role];
      const pageTplId = entry && entry.templateId ? String(entry.templateId) : '';
      if (!pageTplId) continue; // "Не вибрано"

      const pageTpl = getTemplateItemById_(pageTplId);
      if (!pageTpl || !pageTpl.html) continue;

      // Page template html = JSON(bundle)
      const bundle = safeJsonParse(pageTpl.html, null);
      const siteState = bundle && bundle.site && typeof bundle.site === 'object' ? bundle.site : null;

      // ✅ Стабільний pageId по ролі (щоб не залежати від pt_* у шаблонах)
      const pageId = roleToPageId[def.role] || '';
      if (!pageId) continue;

      // ✅ Збираємо bundle для snapshot'а сторінки так, щоб:
      // - canvas відновився
      // - шапка відновилась ПРАВИЛЬНО:
      //    • Головна: завжди GLOBAL
      //    • Інші: завжди PAGE
      //   (HTML беремо з шаблону, статус форсуємо)
      const forcedHeaderMode = (def.role === 'home') ? 'global' : 'page';

      // Клон siteState і підміна page.id під реальний pageId
      const outSiteState = siteState ? JSON.parse(JSON.stringify(siteState)) : null;
      if (!outSiteState || !outSiteState.page) continue;
      outSiteState.page.id = pageId;

      // У bundle з шаблону можуть бути headerLS/footerLS з іншими id.
      // Щоб не створювати "кашу" у localStorage, беремо мінімальний bundle:
      // headerLS/footerLS = {} і даємо runtime застосувати headerHTML/footerHTML.
      const resolvedFooter = resolveFooterFromPageBundle_(bundle, pageId);

      const outBundle = {
        __st_bundle_v1: true,
        kind: 'page',
        site: outSiteState,
        headerMode: forcedHeaderMode,
        headerHTML: (bundle && typeof bundle.headerHTML === 'string') ? bundle.headerHTML : '',
        headerLS: {},
        // ✅ Футер переносимо як прямий footerHTML + footerMode під новий стабільний pageId.
        // Не тягнемо старий footerLS із pt_* id, бо він застосовується тільки після reload.
        footerMode: resolvedFooter.mode,
        footerHTML: resolvedFooter.html,
        footerLS: {}
      };

      const page = {
        id: pageId,
        name: def.label,
        path: def.path
      };
      createdPages.push({ page, snapshot: outBundle });
    }

    if (!createdPages.length) {
      return { ok: false, msg: 'У цьому шаблоні сайту немає вибраних сторінок. Спочатку вибери хоча б одну сторінку.' };
    }

    // Перезаписуємо сторінки сайту тільки якщо сайт порожній.
    // Якщо вже є сторінки — питаємо підтвердження.
    const hasPages = Array.isArray(site.pages) && site.pages.length;
    if (hasPages) {
      const ok = window.confirm('У цьому сайті вже є сторінки. Перезаписати їх із шаблону?');
      if (!ok) return { ok: false, msg: 'Скасовано.' };
    }

    site.pages = createdPages.map((x) => x.page);
    site.currentPageId = site.pages[0]?.id || null;
    site.updatedAt = Date.now();

    // Зберігаємо snapshots сторінок (bundle: canvas + header/footer)
    for (const x of createdPages) {
      savePageSnapshot_(site.id, x.page.id, x.snapshot);
    }

    return { ok: true, msg: `Сторінки створено: ${createdPages.length}` };
  }


  // ---------- Основні дії з сайтами ----------

  function openSitePanel() {
    panelEl.hidden = false;

    let sites = loadSites();
    let currentId = getCurrentId();
    let current = currentId ? findSite(sites, currentId) : null;

    if (!current) {
      const index = sites.length + 1 || 1;
      const newSite = createEmptySite();
      newSite.name = 'Новий сайт ' + index;
      newSite.slug = 'site-' + index;

      sites.push(newSite);
      saveSites(sites);
      setCurrentId(newSite.id);
      current = newSite;
    }

    renderSiteList(sites, current.id);
    fillFormFromSite(current);
    saveBtn.disabled = false;

    emitEvent('st-site-selected', { site: current });
    const currentPage =
      current.pages && current.pages.find((p) => p.id === current.currentPageId);
    if (currentPage) {
      emitEvent('st-page-selected', { site: current, page: currentPage });
    }
  }

  // Відкрити панель "Налаштування сайту" з ПУСТОЮ формою.
  // Важливо: не видаляємо існуючі сайти; просто знімаємо поточний вибір,
  // щоб "Зберегти" створювало новий сайт з введених даних.
  function openEmptySiteSettings() {
    panelEl.hidden = false;

    // Знімаємо поточний сайт (щоб save створив новий)
    setCurrentId('');

    const sites = loadSites();
    renderSiteList(sites, ''); // без активного
    clearForm();
    if (saveBtn) saveBtn.disabled = false;
  }

  function selectSite(id) {
    let sites = loadSites();
    const site = findSite(sites, id);
    if (!site) return;

    // Сайт може бути порожнім до застосування шаблону
    setCurrentId(site.id);
    saveSites(sites);

    renderSiteList(sites, site.id);
    fillFormFromSite(site);
    saveBtn.disabled = false;

    // ✅ Важливо: клік по сайту у списку = відкриваємо НАЛАШТУВАННЯ сайту,
    // а НЕ перекидаємо у конструктор.
    // Подія st-page-selected тригерить showCanvas() та відкриття "Дизайн" (див. builder-init.js),
    // тому її шлемо ТІЛЬКИ на явну дію "Відкрити сайт".
    emitEvent('st-site-selected', { site });
  }

  function handleCreateClick() {
    let sites = loadSites();

    const newSite = createEmptySite();
    const index = sites.length + 1;
    newSite.name = 'Новий сайт ' + index;
    newSite.slug = 'site-' + index;

    sites.push(newSite);
    saveSites(sites);
    setCurrentId(newSite.id);

    renderSiteList(sites, newSite.id);
    fillFormFromSite(newSite);
    saveBtn.disabled = false;

    // ✅ Створення сайту = показ налаштувань. Не стрибаємо в canvas.
    emitEvent('st-site-selected', { site: newSite });
  }

  function handleOpenClick() {
    // Відкрити АКТИВНИЙ сайт у конструкторі (canvas).
    // Активний сайт = той, який вибраний у списку і відкритий у налаштуваннях.
    let sites = loadSites();
    if (!sites.length) {
      // якщо ще немає сайтів — створимо перший (стара поведінка)
      handleCreateClick();
      sites = loadSites();
      if (!sites.length) return;
    }

    let currentId = getCurrentId();
    let current = currentId ? findSite(sites, currentId) : null;
    if (!current) {
      current = sites[0];
      setCurrentId(current.id);
    }

    saveSites(sites);

    // синхронізуємо UI (список + форма)
    renderSiteList(sites, current.id);
    fillFormFromSite(current);
    if (saveBtn) saveBtn.disabled = false;

    // події для інших модулів
    emitEvent('st-site-selected', { site: current });

    const currentPage =
      current.pages && current.pages.find((p) => p.id === current.currentPageId);

    if (currentPage) {
      // ✅ додаємо pageId для сумісності з Builder listener-ами
      emitEvent('st-page-selected', {
        site: current,
        page: currentPage,
        pageId: currentPage.id,
        title: currentPage.title || currentPage.name || ''
      });
    }

    // ✅ відкриваємо конструктор (canvas)
    try {
      if (window.ST_SHOW_MAIN_VIEW) window.ST_SHOW_MAIN_VIEW('canvas');
    } catch (e) {}
  }

  function handleSaveClick() {
    let sites = loadSites();
    let currentId = getCurrentId();
    let current = currentId ? findSite(sites, currentId) : null;

    if (!current) {
      current = createEmptySite();
      sites.push(current);
      setCurrentId(current.id);
    }

    const updated = readSiteFromForm(current);

    const idx = sites.findIndex((s) => s.id === updated.id);
    if (idx >= 0) {
      sites[idx] = updated;
    } else {
      sites.push(updated);
    }

    saveSites(sites);
    renderSiteList(sites, updated.id);
    fillFormFromSite(updated);

    console.log('[SiteManager] Сайт збережено:', updated);
    emitEvent('st-site-updated', { site: updated });
  }

  function handleApplyTemplateClick() {
    let sites = loadSites();
    let currentId = getCurrentId();
    let site = currentId ? findSite(sites, currentId) : null;
    if (!site) {
      window.alert('Спочатку створіть або відкрийте сайт.');
      return;
    }

    // ✅ НОВА ЛОГІКА (2026): ця кнопка відкриває Галерею шаблонів → вкладка "Сайт".
    // Далі користувач вибирає шаблон у Галереї і натискає "Застосувати".
    // Галерея повертає вибір подією: st:tplPick:siteTemplate.
    try {
      localStorage.setItem(
        'st_tpl_pick_ctx_v1',
        JSON.stringify({ mode: 'site-manager', siteId: site.id })
      );
    } catch {}

    emitEvent('st:open-templates-gallery', { tab: 'site' });
  }

  // ✅ Отримуємо вибір із Галереї і реально застосовуємо шаблон сайту (створюємо сторінки)
  function handleSiteTemplatePicked(ev) {
    const d = ev && ev.detail ? ev.detail : null;
    if (!d || d.mode !== 'site-manager') return;

    let sites = loadSites();
    let currentId = getCurrentId();
    let site = currentId ? findSite(sites, currentId) : null;
    if (!site) return;

    // Якщо ctx містив siteId — перевіряємо, щоб не застосувати не тому сайту
    if (d.siteId && String(d.siteId) !== String(site.id)) {
      return;
    }

    const tplId = String(d.templateId || '');
    if (!tplId) return;

    // В UI — підставляємо вибране значення
    if (templateSelectEl) {
      templateSelectEl.value = tplId;
    }
    updateTemplateInfoFromId(tplId);

    const res = applySiteTemplateToSite_(site, tplId);
    if (!res.ok) {
      if (res.msg) window.alert(res.msg);
      return;
    }

    site.siteTemplateId = tplId;
    saveSites(sites);
    renderSiteList(sites, site.id);
    fillFormFromSite(site);

    if (res.msg) window.alert(res.msg);

    const currentPage = site.pages && site.pages.find((p) => p.id === site.currentPageId);
    if (currentPage) {
      emitEvent('st-page-selected', { site, page: currentPage });
    }
  }

  // ---------- Дії зі сторінками ----------

  function setActivePage(pageId) {
    let sites = loadSites();
    let currentId = getCurrentId();
    let site = currentId ? findSite(sites, currentId) : null;
    if (!site) return;

    ensureDefaultPage(site, true);

    const target = site.pages && site.pages.find((p) => p.id === pageId);
    if (!target) return;

    site.currentPageId = pageId;
    site.updatedAt = Date.now();
    saveSites(sites);

    renderSiteList(sites, site.id);
    renderPages(site);

    emitEvent('st-page-selected', { site, page: target });
    console.log('[SiteManager] Поточна сторінка:', pageId);
  }

  function renamePage(pageId) {
    let sites = loadSites();
    let currentId = getCurrentId();
    let site = currentId ? findSite(sites, currentId) : null;
    if (!site) return;

    ensureDefaultPage(site, true);

    const page = site.pages.find((p) => p.id === pageId);
    if (!page) return;

    const newName = window.prompt('Нова назва сторінки:', page.name || '');
    if (!newName) return;

    page.name = newName.trim() || page.name;
    site.updatedAt = Date.now();

    saveSites(sites);
    renderPages(site);

    if (pageId === site.currentPageId) {
      emitEvent('st-page-selected', { site, page });
    }
  }

  function deletePage(pageId) {
    let sites = loadSites();
    let currentId = getCurrentId();
    let site = currentId ? findSite(sites, currentId) : null;
    if (!site) return;

    ensureDefaultPage(site, true);

    if (!site.pages.some((p) => p.id === pageId)) return;

    if (site.pages.length === 1) {
      window.alert('Повинна залишитись хоча б одна сторінка.');
      return;
    }

    const ok = window.confirm('Видалити цю сторінку? Її структуру буде втрачено.');
    if (!ok) return;

    site.pages = site.pages.filter((p) => p.id !== pageId);

    if (!site.pages.length) {
      ensureDefaultPage(site, true);
    }

    if (!site.pages.some((p) => p.id === site.currentPageId)) {
      site.currentPageId = site.pages[0].id;
    }

    site.updatedAt = Date.now();
    saveSites(sites);
    renderPages(site);

    const currentPage =
      site.pages && site.pages.find((p) => p.id === site.currentPageId);
    if (currentPage) {
      emitEvent('st-page-selected', { site, page: currentPage });
    }
  }

  function handleAddPageClick() {
    let sites = loadSites();
    let currentId = getCurrentId();
    let site = currentId ? findSite(sites, currentId) : null;
    if (!site) return;

    ensureDefaultPage(site, true);

    const name = window.prompt('Назва сторінки:', 'Нова сторінка');
    if (!name) return;

    let path = window.prompt('Шлях сторінки (URL-путь, напр. /about):', '/');
    if (!path) path = '/';
    path = path.trim();
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    const page = createPage(name.trim(), path);
    site.pages = site.pages || [];
    site.pages.push(page);
    site.currentPageId = page.id;
    site.updatedAt = Date.now();

    saveSites(sites);

    renderSiteList(sites, site.id);
    renderPages(site);
    fillFormFromSite(site);

    emitEvent('st-page-selected', { site, page });
  }

  // ---------- Ініціалізація ----------

  function init() {
    saveBtn.disabled = true;

    if (createBtn) createBtn.addEventListener('click', handleCreateClick);
    if (openBtn) openBtn.addEventListener('click', handleOpenClick);
    if (saveBtn) saveBtn.addEventListener('click', handleSaveClick);
    if (addPageBtn) addPageBtn.addEventListener('click', handleAddPageClick);
    // Заповнюємо список шаблонів сайту (з Галереї)
    populateTemplateSelect();

    if (templateSelectEl) {
      templateSelectEl.addEventListener('change', () => {
        updateTemplateInfoFromId(templateSelectEl.value || '');
      });
    }

    if (applyTemplateBtn) {
      applyTemplateBtn.addEventListener('click', handleApplyTemplateClick);
    }

  // ✅ Міст із Галереї шаблонів (щоб не дублювати listener при повторному відкритті SPA)
  if (!window.__ST_SITE_MANAGER_TPL_PICK__) {
    window.__ST_SITE_MANAGER_TPL_PICK__ = true;
    window.addEventListener('st:tplPick:siteTemplate', handleSiteTemplatePicked);
  }




    openSitePanel();
  }

  init();

  // ---------- Експорт у глобал для майбутньої інтеграції ----------

  window.SiteManager = window.SiteManager || {};
  window.SiteManager.openPanel = openSitePanel;
  window.SiteManager.openEmpty = openEmptySiteSettings;
  window.SiteManager.selectSite = selectSite;
  window.SiteManager.getCurrentId = getCurrentId;
  window.SiteManager.loadSites = loadSites;
})();
