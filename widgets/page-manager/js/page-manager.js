// widgets/page-manager/js/page-manager.js
// Віджет "Сторінки": керування списком сторінок для поточного сайту.
// Дані беруться з localStorage так само, як у віджеті "Сайт" (ключі st_sites, st_sites_current).

;(function () {
  const LS_KEY_SITES = 'st_sites';
  const LS_KEY_CURRENT = 'st_sites_current';

  const rootEl = document.getElementById('pageWidgetRoot');
  const panelEl = document.getElementById('pagePanel');
  const siteNameEl = document.getElementById('pmSiteName');
  const pageListEl = document.getElementById('pmPageList');
  const emptyStateEl = document.getElementById('pmEmptyState');
  const createBtn = document.getElementById('pmCreatePageBtn');
  const openTemplatesBtn = document.getElementById('pmOpenPageTemplatesBtn');

  

  // Відкрити Галерею шаблонів -> вкладка "Сторінка"
  if (openTemplatesBtn) {
    openTemplatesBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('st:open-templates-gallery', { detail: { tab: 'page' } }));
    });
  }
// ---------- Акордеон для секцій у сайтбарі віджета "Сторінки" ----------
  const SIDE_SECTIONS_STATE_KEY = 'st_page_widget_side_sections_v1';
  const sidePanelEl = document.getElementById('pmSidePanel');

  console.log('[PageManager] init', {
    rootEl,
    panelEl,
    sidePanelEl,
  });

  if (sidePanelEl) {
    initSideSectionsAccordion(sidePanelEl);
  }

  if (!rootEl || !panelEl) {
    return;
  }

  function initSideSectionsAccordion(host) {
    if (!host) return;

    function loadState() {
      try {
        const raw = window.localStorage.getItem(SIDE_SECTIONS_STATE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (e) {
        console.warn('[PageManager] Не вдалося прочитати стан секцій сайдбара', e);
        return {};
      }
    }

    function saveState(nextState) {
      try {
        window.localStorage.setItem(SIDE_SECTIONS_STATE_KEY, JSON.stringify(nextState || {}));
      } catch (e) {
        console.warn('[PageManager] Не вдалося зберегти стан секцій сайдбара', e);
      }
    }

    let state = loadState();
    const isFirstRun = !Object.keys(state).length;

    const sections = Array.from(host.querySelectorAll('.pm-side__section'));
    console.log('[PageManager] initSideSectionsAccordion: знайдено секцій', sections.length, sections);

    if (!sections.length) return;

    // Призначаємо стабільні id
    sections.forEach((sec, index) => {
      if (!sec.dataset.sectionId) {
        sec.dataset.sectionId = `pm-side-sec-${index + 1}`;
      }
    });

    // Перебудовуємо структуру: header + body (тільки один раз)
    sections.forEach(sec => {
      if (sec.querySelector('.pm-side__section-header')) return;

      const children = Array.from(sec.children);
      const titleEl = sec.querySelector('.pm-side__section-title');
      const subtitleEl = sec.querySelector('.pm-side__section-subtitle');

      const headerBtn = document.createElement('button');
      headerBtn.type = 'button';
      headerBtn.className = 'pm-side__section-header';

      const textWrap = document.createElement('div');
      textWrap.className = 'pm-side__section-header-text';
      if (titleEl) textWrap.appendChild(titleEl);
      if (subtitleEl) textWrap.appendChild(subtitleEl);

      const chev = document.createElement('span');
      chev.className = 'pm-side__chevron';
      chev.textContent = '▶';

      headerBtn.appendChild(textWrap);
      headerBtn.appendChild(chev);

      const body = document.createElement('div');
      body.className = 'pm-side__section-body';
      children.forEach(node => {
        if (node !== titleEl && node !== subtitleEl) {
          body.appendChild(node);
        }
      });

      sec.innerHTML = '';
      sec.appendChild(headerBtn);
      sec.appendChild(body);
    });

    // Відновлюємо стан відкритих/закритих секцій
    state = loadState();

    sections.forEach(sec => {
      const id = sec.dataset.sectionId;
      const stored = Object.prototype.hasOwnProperty.call(state, id)
        ? !!state[id]
        : false;

      if (stored) {
        sec.classList.add('is-open');
      } else {
        sec.classList.remove('is-open');
      }

      const header = sec.querySelector('.pm-side__section-header');
      if (header && !header.dataset.sectionsStateBound) {
        header.dataset.sectionsStateBound = '1';
        header.addEventListener('click', () => {
          const currentlyOpen = sec.classList.contains('is-open');
          const nextOpen = !currentlyOpen;
          sec.classList.toggle('is-open', nextOpen);

          const currentState = loadState();
          currentState[id] = nextOpen;
          saveState(currentState);

          console.log('[PageManager] toggle section', {
            id,
            nextOpen,
            currentState,
          });
        });
      }
    });

    // Якщо це перший запуск — фіксуємо базовий стан
    if (isFirstRun) {
      const baseState = {};
      sections.forEach(sec => {
        const id = sec.dataset.sectionId;
        baseState[id] = sec.classList.contains('is-open');
      });
      saveState(baseState);
    }
  }

  // ---------- helpers для localStorage ----------

  function loadSites() {
    try {
      const raw = localStorage.getItem(LS_KEY_SITES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveSites(sites) {
    try {
      localStorage.setItem(LS_KEY_SITES, JSON.stringify(sites));
    } catch (e) {
      // ignore
    }
  }

  function getCurrentSiteId() {
    // FACT: у цьому проєкті LS_KEY_CURRENT інколи зберігається як простий рядок "site_...",
    // а інколи (у майбутньому) може бути JSON. Тому підтримуємо обидва формати.
    const raw = localStorage.getItem(LS_KEY_CURRENT);
    if (!raw) return null;

    // Якщо це не JSON (наприклад "site_1766...") — просто повертаємо як є.
    const t = (raw + '').trim();
    const looksLikeJson = (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
    if (!looksLikeJson) return t;

    try {
      const parsed = JSON.parse(t);
      if (parsed && typeof parsed === 'object') {
        return parsed.id || parsed.siteId || null;
      }
      if (typeof parsed === 'string') return parsed;
      return null;
    } catch (e) {
      // Якщо JSON зіпсований — не ламаємо UI.
      return null;
    }
  }

  function findSiteById(sites, id) {
    if (!id) return null;
    return sites.find((s) => s && (s.id === id || s.slug === id)) || null;
  }

  // ---------- модель сторінки ----------

  function createPage(name, path, opts) {
    opts = opts || {};
    const now = Date.now();
    return {
      id: 'page_' + now + '_' + Math.floor(Math.random() * 1000),
      name: name || 'Нова сторінка',
      path: normalisePath(path || '/'),
      // додаткові поля
      seoTitle: '',
      seoDescription: '',
      indexing: 'index', // index | noindex
      showInMenu: true,
      headerVariant: 'default', // default | custom | none
      footerVariant: 'default', // default | custom | none
      sidebarVariant: 'default', // default | custom | none
      status: (opts.status || 'published') // draft | published | private
    };
  }

  function ensureDefaultPage(site) {
    if (!site) return;

    if (!Array.isArray(site.pages) || !site.pages.length) {
      const page = createPage('Головна', '/');
      site.pages = [page];
      site.currentPageId = page.id;
    }

    if (!site.currentPageId && site.pages.length) {
      site.currentPageId = site.pages[0].id;
    }
  }

  function normalisePath(path) {
    if (!path) return '/';
    let p = String(path).trim();
    if (!p.startsWith('/')) p = '/' + p;
    p = p.replace(/\s+/g, '-');
    return p;
  }


  // Транслітерація (UA/RU кирилиця -> латиниця) для формування URL
  // ВАЖЛИВО: використовується тільки для автозаповнення шляху; користувач може відредагувати вручну.
  function translitToLatin(input) {
    const s = String(input || '');
    const map = {
      'а':'a','б':'b','в':'v','г':'g','ґ':'g','д':'d','е':'e','є':'ye','ж':'zh','з':'z','и':'i','і':'i','ї':'yi','й':'y',
      'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch',
      'ш':'sh','щ':'shch','ь':'','ю':'yu','я':'ya','ъ':'','ы':'y','э':'e','ё':'yo'
    };
    let out = '';
    for (const ch of s) {
      const low = ch.toLowerCase();
      if (map.hasOwnProperty(low)) out += map[low];
      else out += ch;
    }
    return out;
  }

  function slugifyLatin(input) {
    const latin = translitToLatin(input)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
    return latin || 'page';
  }

  function getSiteDisplayName(site) {
    return site.name || site.title || site.slug || 'Без назви';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }



  // ===== Move tooltip (3s hover) =====
  let __pmMoveTipEl = null;
  let __pmMoveTipTimer = null;
  let __pmMoveTipLock = false;

  function __pmRemoveMoveTip() {
    if (__pmMoveTipTimer) {
      clearTimeout(__pmMoveTipTimer);
      __pmMoveTipTimer = null;
    }
    __pmMoveTipLock = false;
    if (__pmMoveTipEl) {
      __pmMoveTipEl.remove();
      __pmMoveTipEl = null;
    }
  }

  function __pmShowMoveTipNear(btnEl) {
    __pmRemoveMoveTip();

    const tip = document.createElement('div');
    tip.className = 'pm-move-tip';
    tip.innerHTML = `
      <div class="pm-move-tip__title">Як переміщати сторінку</div>
      <ol class="pm-move-tip__list">
        <li>Натисни ☰, щоб увімкнути режим переміщення</li>
        <li>Наведи на іншу сторінку — побачиш місце вставки</li>
        <li>Клікни по сторінці-цілі, щоб перемістити</li>
        <li><kbd>Esc</kbd> — скасувати режим</li>
      </ol>
      <div class="pm-move-tip__note">Переміщення працює тільки всередині цього списку.</div>
    `;

    tip.addEventListener('mouseenter', () => { __pmMoveTipLock = true; });
    tip.addEventListener('mouseleave', () => { __pmMoveTipLock = false; __pmRemoveMoveTip(); });

    document.body.appendChild(tip);
    __pmMoveTipEl = tip;

    const r = btnEl.getBoundingClientRect();
    const margin = 10;

    let left = r.right + margin;
    let top = r.top - 4;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tr = tip.getBoundingClientRect();

    if (left + tr.width > vw - 10) left = Math.max(10, r.left - tr.width - margin);
    if (top + tr.height > vh - 10) top = Math.max(10, vh - tr.height - 10);
    if (top < 10) top = 10;

    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('mousedown', onDown, true);
        __pmRemoveMoveTip();
      }
    };

    const onDown = (e) => {
      if (!__pmMoveTipEl) return;
      if (e.target === btnEl || btnEl.contains(e.target)) return;
      if (__pmMoveTipEl.contains(e.target)) return;
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onDown, true);
      __pmRemoveMoveTip();
    };

    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDown, true);
  }

  function __pmBindMoveTip(btnEl) {
    if (!btnEl) return;

    btnEl.addEventListener('mouseenter', () => {
      if (__pmMoveTipTimer) clearTimeout(__pmMoveTipTimer);
      __pmMoveTipTimer = setTimeout(() => {
        __pmShowMoveTipNear(btnEl);
      }, 3000);
    });

    btnEl.addEventListener('mouseleave', () => {
      if (__pmMoveTipTimer) {
        clearTimeout(__pmMoveTipTimer);
        __pmMoveTipTimer = null;
      }
      setTimeout(() => {
        if (!__pmMoveTipLock) __pmRemoveMoveTip();
      }, 50);
    });
  }


  // ---------- state у віджеті ----------

  let sites = loadSites();
  let currentSite = null;
  let expandedIds = new Set();
  let dragState = {
    draggedId: null,
    overId: null
  };

  function selectCurrentSite(initialSite) {
    const allSites = sites.length ? sites : loadSites();
    sites = allSites;

    if (initialSite) {
      currentSite = initialSite;
      return;
    }

    const currentId = getCurrentSiteId();
    if (currentId) {
      const byId = findSiteById(sites, currentId);
      if (byId) {
        currentSite = byId;
        return;
      }
    }

    currentSite = null; // якщо сайт не відкритий (LS_KEY_CURRENT порожній) — сторінки не показуємо
  }

  selectCurrentSite(null);

  if (currentSite) {
    ensureDefaultPage(currentSite);
  }

  // ---------- render ----------

  function render() {
    // якщо немає жодного сайту
    if (!currentSite) {
      siteNameEl.textContent = '—';
      emptyStateEl.hidden = false;
      pageListEl.innerHTML = '';
      if (createBtn) createBtn.disabled = true;
      return;
    }

    if (createBtn) createBtn.disabled = false;
    emptyStateEl.hidden = true;

    siteNameEl.textContent = getSiteDisplayName(currentSite);

    const pages = Array.isArray(currentSite.pages) ? currentSite.pages : [];
    const activePageId = currentSite.currentPageId || (pages[0] && pages[0].id);

    pageListEl.innerHTML = '';

    pages.forEach((page) => {
      const card = document.createElement('article');
      card.className = 'pm-page-card';
      card.dataset.pageId = page.id;
      card.draggable = true;

      if (page.id === activePageId) {
        card.classList.add('pm-page-card--active');
      }      if (expandedIds.has(page.id)) {
        // подробиці відкриємо після вставки в DOM
      }

      const name = page.name || 'Без назви';
      const path = page.path || '/';

      const seoTitle = page.seoTitle || '';
      const seoDescription = page.seoDescription || '';
      const indexing = page.indexing || 'index';
      const showInMenu = page.showInMenu !== false;
      const headerVariant = page.headerVariant || 'default';
      const footerVariant = page.footerVariant || 'default';
      const sidebarVariant = page.sidebarVariant || 'default';
      const status = page.status || 'published';
      // Неопубліковані/неактивні сторінки (чернетки/приватні) підсвічуємо
      if (status !== 'published') {
        card.classList.add('pm-page-card--inactive');
      }
      const isHome = currentSite.homePageId === page.id;

      card.innerHTML = `
        <div class="pm-page-card__header">
          <div class="pm-page-card__title-wrap">
            <span class="pm-page-card__badge">СТОРІНКА</span>
            <button class="pm-page-card__title-btn" type="button" data-action="rename">
              <span class="pm-page-card__title-text">${escapeHtml(name)}</span>
            </button>
            <span class="pm-page-card__slug">${escapeHtml(path)}</span>
            ${
              isHome
                ? '<span class="pm-page-card__slug" style="background:rgba(22,163,74,0.2);border-color:rgba(34,197,94,0.8);color:#bbf7d0;">Домашня</span>'
                : ''
            }
          </div>
          <div class="pm-page-card__actions">
            <button type="button" class="pm-icon-btn pm-icon-btn--primary" data-action="open-design" title="Відкрити в дизайні">
              🎨
            </button>
            <button type="button"
              class="pm-icon-btn pm-icon-btn--publish ${status !== 'published' ? 'pm-icon-btn--publish-active' : ''}"
              data-action="publish"
              title="Опублікувати"
              ${status === 'published' ? 'disabled' : ''}>
              ⬆
            </button>
            <button type="button"
              class="pm-icon-btn pm-icon-btn--draft ${status !== 'draft' ? 'pm-icon-btn--draft-active' : ''}"
              data-action="to-draft"
              title="В чернетки"
              ${status === 'draft' ? 'disabled' : ''}>
              📝
            </button>
            <button type="button" class="pm-icon-btn" data-action="duplicate" title="Дублювати">
              ⧉
            </button>
            <button type="button" class="pm-icon-btn" data-action="save" title="Зберегти">
              💾
            </button>
            <button type="button" class="pm-icon-btn" data-action="delete" title="Видалити">
              🗑
            </button>
            <button type="button" class="pm-icon-btn pm-icon-btn--drag" data-action="drag-handle" title="Перемістити">
              ☰
            </button>
          </div>
        </div>

        <button type="button" class="pm-page-card__more-toggle" data-action="toggle-details">
          Додаткові налаштування
          <span>▼</span>
        </button>

        <div class="pm-page-card__details" data-role="details">
          <div class="pm-page-grid">
            <div class="pm-field">
              <div class="pm-field__label">URL (slug)</div>
              <div class="pm-field__description">Шлях сторінки, використовується при публікації.</div>
              <input class="pm-input" type="text" data-field="path" value="${escapeHtml(path)}" />
            </div>

            <div class="pm-field">
              <div class="pm-field__label">Заголовок (title)</div>
              <div class="pm-field__description">SEO-заголовок сторінки у вкладці браузера.</div>
              <input class="pm-input" type="text" data-field="seoTitle" value="${escapeHtml(seoTitle)}" />
            </div>

            <div class="pm-field">
              <div class="pm-field__label">Опис (description)</div>
              <div class="pm-field__description">Короткий опис для пошукових систем.</div>
              <input class="pm-input" type="text" data-field="seoDescription" value="${escapeHtml(
                seoDescription
              )}" />
            </div>

            <div class="pm-field">
              <div class="pm-field__label">Індексація</div>
              <div class="pm-field__description">Чи можна індексувати сторінку пошуковими системами.</div>
              <select class="pm-select" data-field="indexing">
                <option value="index" ${indexing === 'index' ? 'selected' : ''}>Дозволити (index)</option>
                <option value="noindex" ${indexing === 'noindex' ? 'selected' : ''}>Заборонити (noindex)</option>
              </select>
            </div>

            <div class="pm-field">
              <div class="pm-field__label">Шапка</div>
              <div class="pm-field__description">Використати стандартну шапку чи окрему для цієї сторінки.</div>
              <select class="pm-select" data-field="headerVariant">
                <option value="default" ${headerVariant === 'default' ? 'selected' : ''}>Стандартна</option>
                <option value="custom" ${headerVariant === 'custom' ? 'selected' : ''}>Окрема для сторінки</option>
                <option value="none" ${headerVariant === 'none' ? 'selected' : ''}>Без шапки</option>
              </select>
            </div>

            <div class="pm-field">
              <div class="pm-field__label">Футер</div>
              <div class="pm-field__description">Стандартний футер чи окремий для сторінки.</div>
              <select class="pm-select" data-field="footerVariant">
                <option value="default" ${footerVariant === 'default' ? 'selected' : ''}>Стандартний</option>
                <option value="custom" ${footerVariant === 'custom' ? 'selected' : ''}>Окремий</option>
                <option value="none" ${footerVariant === 'none' ? 'selected' : ''}>Без футера</option>
              </select>
            </div>

            <div class="pm-field">
              <div class="pm-field__label">Сайдбар</div>
              <div class="pm-field__description">Стандартний, окремий або вимкнений для цієї сторінки.</div>
              <select class="pm-select" data-field="sidebarVariant">
                <option value="default" ${sidebarVariant === 'default' ? 'selected' : ''}>Стандартний</option>
                <option value="custom" ${sidebarVariant === 'custom' ? 'selected' : ''}>Окремий</option>
                <option value="none" ${sidebarVariant === 'none' ? 'selected' : ''}>Без сайдбара</option>
              </select>
            </div>

            <div class="pm-field">
              <div class="pm-field__label">Статус сторінки</div>
              <div class="pm-field__description">Чернетка, опублікована чи доступна лише за посиланням.</div>
              <select class="pm-select" data-field="status">
                <option value="draft" ${status === 'draft' ? 'selected' : ''}>Чернетка</option>
                <option value="published" ${status === 'published' ? 'selected' : ''}>Опублікована</option>
                <option value="private" ${status === 'private' ? 'selected' : ''}>Тільки за посиланням</option>
              </select>
            </div>

            <div class="pm-page-grid--full">
              <label class="pm-switch">
                <input type="checkbox" data-field="showInMenu" ${showInMenu ? 'checked' : ''} />
                <div>
                  <div class="pm-switch__label">Показувати в меню</div>
                  <div class="pm-switch__hint">Якщо вимкнути — сторінка не відображається у навігації сайту.</div>
                </div>
              </label>
            </div>

            <div class="pm-page-grid--full">
              <label class="pm-switch">
                <input type="checkbox" data-field="isHome" ${isHome ? 'checked' : ''} />
                <div>
                  <div class="pm-switch__label">Домашня сторінка</div>
                  <div class="pm-switch__hint">
                    Зробити цю сторінку головною (домашньою). Поточний сайт може мати тільки одну домашню сторінку.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      `;

      pageListEl.appendChild(card);

      // tooltip for move button (☰)
      __pmBindMoveTip(card.querySelector('[data-action="drag-handle"]'));

      // відкрити блок деталей, якщо він був розгорнутий
      if (expandedIds.has(page.id)) {
        const detailsEl = card.querySelector('[data-role="details"]');
        const toggleBtn = card.querySelector('[data-action="toggle-details"]');
        if (detailsEl) detailsEl.classList.add('is-open');
        if (toggleBtn && toggleBtn.querySelector('span')) {
          toggleBtn.querySelector('span').textContent = '▲';
        }
      }
    });

    // Після переміщення — підсвітити переміщену сторінку і прокрутити до неї
    if (lastMovedId) {
      const movedId = lastMovedId;
      lastMovedId = null;
      requestAnimationFrame(() => {
        const el = pageListEl.querySelector(`.pm-page-card[data-page-id="${CSS.escape(movedId)}"]`);
        if (!el) return;
        el.classList.add('pm-page-card--just-moved');
        try {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } catch {}
        setTimeout(() => {
          el.classList.remove('pm-page-card--just-moved');
        }, 650);
      });
    }
  }

  // ---------- оновлення сторінки в site-обʼєкті ----------

  function updatePage(pageId, updater) {
    if (!currentSite || !Array.isArray(currentSite.pages)) return;

    const pages = currentSite.pages;
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx === -1) return;

    const page = pages[idx];
    const next = updater(page) || page;
    pages[idx] = next;

    saveSites(sites);
    render();
  }

  function reorderPages(draggedId, overId) {
    if (!currentSite || !Array.isArray(currentSite.pages)) return;
    if (!draggedId || !overId || draggedId === overId) return;

    const pages = currentSite.pages;
    const fromIdx = pages.findIndex((p) => p.id === draggedId);
    const toIdx = pages.findIndex((p) => p.id === overId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const [moved] = pages.splice(fromIdx, 1);
    pages.splice(toIdx, 0, moved);

    saveSites(sites);
    render();
  }

  // Переміщення сторінки у "режимі переміщення" (клік по кнопці ☰)
  // placeAfter = true -> вставити ПІСЛЯ цільової; false -> вставити ПЕРЕД
  function movePageRelative(draggedId, targetId, placeAfter) {
    if (!currentSite || !Array.isArray(currentSite.pages)) return;
    if (!draggedId || !targetId || draggedId === targetId) return;

    const pages = currentSite.pages;
    const fromIdx = pages.findIndex((p) => p.id === draggedId);
    if (fromIdx === -1) return;

    // Забираємо елемент
    const [moved] = pages.splice(fromIdx, 1);

    // Знаходимо індекс цілі ПІСЛЯ видалення (щоб не зʼїжджали індекси)
    const targetIdx = pages.findIndex((p) => p.id === targetId);
    if (targetIdx === -1) {
      // якщо ціль зникла — повертаємо назад
      pages.splice(fromIdx, 0, moved);
      return;
    }

    const insertIdx = placeAfter ? targetIdx + 1 : targetIdx;
    pages.splice(insertIdx, 0, moved);

    // Візуальний фідбек після render()
    lastMovedId = moved.id;

    saveSites(sites);
    render();
  }

  
  // state: move-by-click mode (used by ☰ button)
  let moveMode = null; // { pageId: string }
  let lastMovedId = null; // для анімації після переміщення
// ---------- події: кліки у списку ----------

  pageListEl.addEventListener('click', (e) => {
    // 1) Клік по картці сторінки = вибір сторінки (підсвітка + currentPageId)
    const card = e.target.closest('.pm-page-card');
    if (!card) return;

    const pageId = card.dataset.pageId;
    if (!pageId) return;

    const btn = e.target.closest('button');
    const action = btn ? btn.dataset.action : null;

    // Особливий кейс: назва сторінки (кнопка) — один клік = select, double click = rename
    if (btn && action === 'rename' && btn.classList.contains('pm-page-card__title-btn')) {
      if (e.detail >= 2) {
        // allow rename flow below
      } else {
        // select only
        const page = (currentSite.pages || []).find((p) => p.id === pageId);
        if (!page) return;

        currentSite.currentPageId = page.id;
        saveSites(sites);

        try {
          window.dispatchEvent(
            new CustomEvent('st-page-selected', {
              detail: { site: currentSite, page, silent: true, source: 'page-manager' },
              bubbles: false
            })
          );
        } catch (e2) {
          // ignore
        }

        render();
        return;
      }
    }

    // Якщо клік не по кнопці — це select
    if (!btn) {
      const page = (currentSite.pages || []).find((p) => p.id === pageId);
      if (!page) return;

      currentSite.currentPageId = page.id;
      saveSites(sites);

      try {
        window.dispatchEvent(
          new CustomEvent('st-page-selected', {
            detail: { site: currentSite, page, silent: true, source: 'page-manager' },
            bubbles: false
          })
        );
      } catch (e2) {
        // ignore
      }

      render();
      return;
    }

    // 2) Клік по кнопці дії — як і було (rename/open-design/duplicate/delete/...)
    if (!action) return;

    switch (action) {
      case 'drag-handle': {
        // Клік по ☰ вмикає "режим переміщення":
        // 1) підсвічуємо джерело
        // 2) курсором/ховером підсвічуємо місце вставки
        // 3) клік по іншій карточці вставляє ДО/ПІСЛЯ

        // toggle: якщо вже активний цей же pageId — вихід
        if (moveMode && moveMode.pageId === pageId) {
          exitMoveMode();
          return;
        }

        enterMoveMode(pageId);
        break;
      }
      case 'rename': {
        const page = (currentSite.pages || []).find((p) => p.id === pageId);
        if (!page) return;
        const currentName = page.name || 'Без назви';
        const nextName = window.prompt('Нова назва сторінки:', currentName);
        if (!nextName || !nextName.trim()) return;

        updatePage(pageId, (p) => {
          p.name = nextName.trim();
          return p;
        });
        break;
      }

      case 'publish': {
        updatePage(pageId, (p) => {
          p.status = 'published';
          return p;
        });
        break;
      }

      case 'to-draft': {
        updatePage(pageId, (p) => {
          p.status = 'draft';
          return p;
        });
        break;
      }

      case 'duplicate': {
        const page = (currentSite.pages || []).find((p) => p.id === pageId);
        if (!page) return;

        const clone = {
          ...page,
          id: 'page_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          name: (page.name || 'Сторінка') + ' — копія',
          path: normalisePath((page.path || '/') + '-copy')
        };

        currentSite.pages = currentSite.pages || [];
        currentSite.pages.push(clone);
        currentSite.currentPageId = clone.id;

        saveSites(sites);
        render();
        break;
      }

      case 'delete': {
        if (!window.confirm('Видалити цю сторінку? Дію не можна скасувати.')) return;

        const pages = currentSite.pages || [];
        if (pages.length <= 1) {
          window.alert('Сайт повинен мати принаймні одну сторінку.');
          return;
        }

        const idx = pages.findIndex((p) => p.id === pageId);
        if (idx === -1) return;

        const removed = pages.splice(idx, 1)[0];

        if (currentSite.currentPageId === removed.id) {
          const next = pages[idx] || pages[idx - 1] || pages[0];
          currentSite.currentPageId = next ? next.id : null;
        }
        if (currentSite.homePageId === removed.id) {
          currentSite.homePageId = null;
        }

        saveSites(sites);
        render();
        break;
      }

      case 'save': {
        saveSites(sites);
        // [START-FRESH-PAGE-TEMPLATE-2026][Draft Mode]
        // "Зберегти сторінку" — явний сигнал для Builder:
        // якщо відкрито шаблон як чернетку, то саме тут його треба комітити.
        try {
          window.dispatchEvent(new CustomEvent('st:page-save-request', { detail: { pageId } }));
        } catch {}
        // невеликий візуальний фідбек
        btn.style.opacity = '0.6';
        setTimeout(() => {
          btn.style.opacity = '';
        }, 180);
        break;
      }

      case 'toggle-details': {
        const detailsEl = card.querySelector('[data-role="details"]');
        const iconSpan = btn.querySelector('span');
        if (!detailsEl) return;

        const isOpen = detailsEl.classList.toggle('is-open');
        if (iconSpan) iconSpan.textContent = isOpen ? '▲' : '▼';

        if (isOpen) {
          expandedIds.add(pageId);
        } else {
          expandedIds.delete(pageId);
        }
        break;
      }

      case 'open-design': {
        const page = (currentSite.pages || []).find((p) => p.id === pageId);
        if (!page) return;

        currentSite.currentPageId = page.id;
        saveSites(sites);

        // шлемо подію для конструктора: відкрити цю сторінку в дизайні / canvas
        try {
          window.dispatchEvent(
            new CustomEvent('st-page-selected', {
              detail: {
                site: currentSite,
                page,
                silent: false,
                source: 'page-manager'
              },
              bubbles: false
            })
          );
        } catch (e) {
          // ignore
        }
        break;
      }

      default:
        break;
    }
  });

  // ---------- "режим переміщення" (клік по кнопці ☰) ----------


  function exitMoveMode() {
    moveMode = null;
    pageListEl.classList.remove('pm-move-mode');
    pageListEl.querySelectorAll('.pm-page-card--move-source').forEach((el) => el.classList.remove('pm-page-card--move-source'));
    pageListEl.querySelectorAll('[data-action="drag-handle"].is-active').forEach((el) => el.classList.remove('is-active'));
    pageListEl
      .querySelectorAll('.pm-page-card--move-target, .pm-page-card--move-before, .pm-page-card--move-after')
      .forEach((el) => el.classList.remove('pm-page-card--move-target', 'pm-page-card--move-before', 'pm-page-card--move-after'));
  }

  function enterMoveMode(pageId) {
    exitMoveMode();
    moveMode = { pageId };
    pageListEl.classList.add('pm-move-mode');
    const sourceCard = pageListEl.querySelector(`.pm-page-card[data-page-id="${CSS.escape(pageId)}"]`);
    if (sourceCard) {
      sourceCard.classList.add('pm-page-card--move-source');
      const handleBtn = sourceCard.querySelector('[data-action="drag-handle"]');
      if (handleBtn) handleBtn.classList.add('is-active');
    }
  }

  // Hover підсвітка місця вставки
  pageListEl.addEventListener('mousemove', (e) => {
    if (!moveMode) return;
    const card = e.target.closest('.pm-page-card');
    if (!card) return;
    const targetId = card.dataset.pageId;
    if (!targetId || targetId === moveMode.pageId) return;

    const rect = card.getBoundingClientRect();
    const placeAfter = e.clientY > rect.top + rect.height / 2;

    // очистити попереднє
    pageListEl
      .querySelectorAll('.pm-page-card--move-target, .pm-page-card--move-before, .pm-page-card--move-after')
      .forEach((el) => el.classList.remove('pm-page-card--move-target', 'pm-page-card--move-before', 'pm-page-card--move-after'));

    card.classList.add('pm-page-card--move-target');
    card.classList.add(placeAfter ? 'pm-page-card--move-after' : 'pm-page-card--move-before');
  });

  // Коли курсор виходить зі списку — прибрати підсвітку цілі
  pageListEl.addEventListener('mouseleave', () => {
    if (!moveMode) return;
    pageListEl
      .querySelectorAll('.pm-page-card--move-target, .pm-page-card--move-before, .pm-page-card--move-after')
      .forEach((el) => el.classList.remove('pm-page-card--move-target', 'pm-page-card--move-before', 'pm-page-card--move-after'));
  });

  // Клік по цілі у moveMode — вставити
  // NOTE: у режимі переміщення ми перехоплюємо клік майже по всій карточці (включно з заголовком/кнопками),
  // щоб переміщення працювало передбачувано. Єдиний виняток — повторний клік по ☰ на джерелі (вихід з режиму).
  pageListEl.addEventListener('click', (e) => {
    if (!moveMode) return;
    const card = e.target.closest('.pm-page-card');
    if (!card) return;

    const targetId = card.dataset.pageId;
    if (!targetId) return;

    // Якщо клікнули по ☰ на джерелі — це cancel/toggle
    const btn = e.target.closest('button');
    const action = btn ? btn.dataset.action : null;
    if (btn && action === 'drag-handle' && targetId === moveMode.pageId) {
      e.preventDefault();
      e.stopPropagation();
      exitMoveMode();
      return;
    }

    // Забороняємо інші дії кнопок під час moveMode: будь-який клік на цільовій карточці = вставка
    if (targetId === moveMode.pageId) {
      // не можна вставляти в себе
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const rect = card.getBoundingClientRect();
    const placeAfter = e.clientY > rect.top + rect.height / 2;

    e.preventDefault();
    e.stopPropagation();

    movePageRelative(moveMode.pageId, targetId, placeAfter);
    exitMoveMode();
  }, true);

  // Esc — вихід з moveMode
  window.addEventListener('keydown', (e) => {
    if (!moveMode) return;
    if (e.key === 'Escape') {
      exitMoveMode();
    }
  });

  // ---------- події: зміни інпутів у додаткових налаштуваннях ----

  pageListEl.addEventListener('change', (e) => {
    const target = e.target;
    if (!target.dataset || !target.dataset.field) return;

    const card = target.closest('.pm-page-card');
    if (!card) return;

    const pageId = card.dataset.pageId;
    const field = target.dataset.field;

    updatePage(pageId, (p) => {
      if (field === 'showInMenu') {
        p.showInMenu = !!target.checked;
      } else if (field === 'isHome') {
        if (target.checked) {
          currentSite.homePageId = p.id;
        } else if (currentSite.homePageId === p.id) {
          currentSite.homePageId = null;
        }
      } else if (field === 'path') {
        p.path = normalisePath(target.value);
      } else {
        p[field] = target.value;
      }
      return p;
    });
  });

  // ---------- drag & drop для сортування сторінок ---------------

  pageListEl.addEventListener('dragstart', (e) => {
    // Якщо увімкнений режим переміщення (клік по ☰) — вимикаємо native drag,
    // щоб не було конфлікту між двома режимами.
    if (moveMode) {
      e.preventDefault();
      return;
    }
    const card = e.target.closest('.pm-page-card');
    if (!card) return;
    const handle = e.target.closest('[data-action="drag-handle"]');
    // дозволяємо drag тільки за "ручку"
    if (!handle) {
      e.preventDefault();
      return;
    }

    dragState.draggedId = card.dataset.pageId || null;
    dragState.overId = null;
    card.classList.add('pm-page-card--dragging');

    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragState.draggedId || '');
    } catch (e2) {
      // ignore
    }
  });

  pageListEl.addEventListener('dragend', (e) => {
    const card = e.target.closest('.pm-page-card');
    if (card) {
      card.classList.remove('pm-page-card--dragging');
    }
    const cards = pageListEl.querySelectorAll('.pm-page-card');
    cards.forEach((c) => c.classList.remove('pm-page-card--drag-over'));

    dragState.draggedId = null;
    dragState.overId = null;
  });

  pageListEl.addEventListener('dragover', (e) => {
    const card = e.target.closest('.pm-page-card');
    if (!card) return;

    e.preventDefault();

    const overId = card.dataset.pageId;
    if (!overId || overId === dragState.overId) return;

    dragState.overId = overId;

    const cards = pageListEl.querySelectorAll('.pm-page-card');
    cards.forEach((c) => {
      if (c.dataset.pageId === overId) {
        c.classList.add('pm-page-card--drag-over');
      } else {
        c.classList.remove('pm-page-card--drag-over');
      }
    });
  });

  pageListEl.addEventListener('drop', (e) => {
    e.preventDefault();
    const card = e.target.closest('.pm-page-card');
    if (!card) return;

    const overId = card.dataset.pageId || null;
    const draggedId = dragState.draggedId;

    if (draggedId && overId) {
      reorderPages(draggedId, overId);
    }

    dragState.draggedId = null;
    dragState.overId = null;
  });

  // ---------- кнопка "Створити сторінку" ------------------------

  if (createBtn) {
    createBtn.addEventListener('click', () => {
      if (!currentSite) return;

      const name = window.prompt('Назва нової сторінки:', 'Нова сторінка');
      if (!name || !name.trim()) return;

      const safeName = name.trim();
      const pathBase = slugifyLatin(safeName);

      const existingPaths = (currentSite.pages || []).map((p) => p.path || '/');
      
      const suggested = '/' + pathBase;
      const edited = window.prompt('Шлях (URL) нової сторінки:', suggested);
      const editedBase = slugifyLatin((edited || suggested).replace(/^\//,''));

      let candidate = '/' + editedBase;
      let counter = 2;
      while (existingPaths.includes(candidate)) {
        candidate = '/' + editedBase + '-' + counter++;
      }

      const page = createPage(safeName, candidate, { status: 'draft' });
      currentSite.pages = currentSite.pages || [];
      currentSite.pages.push(page);
      currentSite.currentPageId = page.id;

      saveSites(sites);

      // Тихо вибираємо нову сторінку: підсвітка + шапка, але без автопереходу в дизайн
      window.dispatchEvent(new CustomEvent('st-page-selected', { detail: { site: currentSite, page: page, silent: true, source: 'page-manager' } }));
      render();
    });
  }

  // ---------- слухачі подій від "Сайту" (інтеграція) ------------

  function handleSiteEvent(e) {
    const d = e.detail || {};
    const site = d.site || d.currentSite || d.siteData || null;

    if (site) {
      sites = loadSites();
      const freshSite = findSiteById(sites, site.id || site.slug || site.name) || site;
      currentSite = freshSite;
      ensureDefaultPage(currentSite);
      render();
    }
  }

  ['st-site-selected', 'st-site-open'].forEach((evtName) => {
    window.addEventListener(evtName, handleSiteEvent);
  });

  // ---------- стартовий render ---------------------------------

  render();

  // ---------- експорт у глобал для конструктора ----------------

  window.PageManager = window.PageManager || {};
  window.PageManager.openPanel = function () {
    // FACT: користувач може перейти в інші віджети/оверлеї (галерея/конструктор шаблону)
    // і повернутися на "Сторінки" без перезавантаження. Тому тут завжди робимо
    // швидке оновлення стану з localStorage і перерендер.
    try {
      sites = loadSites();
      selectCurrentSite(null);
      if (currentSite) ensureDefaultPage(currentSite);
      render();
      console.log('[PageManager] openPanel -> refreshed', {
        currentSiteId: getCurrentSiteId(),
        hasCurrentSite: !!currentSite,
        pagesCount: currentSite && Array.isArray(currentSite.pages) ? currentSite.pages.length : 0,
      });
    } catch (e) {
      console.warn('[PageManager] openPanel refresh failed', e);
    }

    try {
      panelEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {}
  };
  window.PageManager.loadSites = loadSites;
})();
