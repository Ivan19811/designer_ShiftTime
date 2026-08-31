// js/design/widgets/templates/site/site-template-builder-widget.js
// Конструктор "Шаблон Сайта" (MVP)
// Ідея: зібрати шаблон сайту з шаблонів сторінок (8 базових сторінок).
// Важливо: НЕ ліземо у логіку "Сторінки". Тут лише формування мапи {pageRole -> pageTemplateId}.

import { getTemplateById, addTemplate } from '../store/templates-store.js';

// [00374][TEMPLATE GALLERY][AUTO OPEN BRIDGE]
// Відкриття галереї йде через bridge, який сам чекає lazy-import і дорендерює перше відкриття.
function openTemplatesGalleryManager(tab) {
  import('../templates-gallery-open-bridge.js')
    .then((mod) => {
      const fn = mod.openTemplatesGalleryManager || mod.openTemplatesGalleryWithBridge;
      if (typeof fn === 'function') fn(tab || 'site');
    })
    .catch((err) => console.warn('[00374][gallery bridge] lazy templates gallery failed:', err));
}


const DRAFT_KEY = 'st_site_template_builder_draft_v1';
const PICK_CTX_KEY = 'st_tpl_pick_ctx_v1';

// 8 основних сторінок (можна буде розширювати пізніше)
const BASE_PAGES = [
  { role: 'home',     title: 'Головна' },
  { role: 'about',    title: 'Про нас' },
  { role: 'contacts', title: 'Контакти' },
  { role: 'blog',     title: 'Блог' },
  { role: 'products', title: 'Товари' },
  { role: 'product',  title: 'Сторінка товару' },
  { role: 'cart',     title: 'Кошик' },
  { role: 'checkout', title: 'Оформлення' },
];


const SITE_CATEGORIES = [
  { id: '',              title: 'Без категорії' },
  { id: 'shop',          title: 'Магазин' },
  { id: 'blog',          title: 'Блог' },
  { id: 'education',     title: 'Навчання' },
  { id: 'medicine',      title: 'Медицина' },
  { id: 'games',         title: 'Ігри' },
  { id: 'society',       title: 'Суспільство' },
  { id: 'fishing',       title: 'Рибалка' },
  { id: 'other',         title: 'Інше' }
];

function categoryToFolderId(catId) {
  const id = String(catId || '').trim();
  // 'Без категорії' та 'Інше' — це одне і те саме: зберігаємо у папку 'Інше'
  if (!id || id === 'none') return 'fld_site_other';
  switch (id) {
    case 'shop': return 'fld_site_shop';
    case 'blog': return 'fld_site_blog';
    case 'education': return 'fld_site_education';
    case 'medicine': return 'fld_site_medicine';
    case 'games': return 'fld_site_games';
    case 'society': return 'fld_site_society';
    case 'fishing': return 'fld_site_fishing';
    case 'other': return 'fld_site_other';
    default: return 'fld_site_other';
  }
}


function safeJsonParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function loadDraft() {
  const st = safeJsonParse(localStorage.getItem(DRAFT_KEY), null);
  if (!st || typeof st !== 'object') {
    return {
      name: 'Шаблон сайта 1',
      pages: Object.fromEntries(BASE_PAGES.map(p => [p.role, null]))
    };
  }
  // гарантуємо ключі
  st.pages = st.pages && typeof st.pages === 'object' ? st.pages : {};
  for (const p of BASE_PAGES) if (!(p.role in st.pages)) st.pages[p.role] = null;
  if (!st.name) st.name = 'Шаблон сайта 1';
  return st;
}

function saveDraft(st) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(st || {})); } catch {}
}

function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function tplLabel(id) {
  if (!id) return 'Шаблон не вибрано';
  const tpl = getTemplateById(id);
  if (!tpl) return 'Шаблон не знайдено';
  return tpl.name || id;
}

function setPickContext(ctx) {
  try { localStorage.setItem(PICK_CTX_KEY, JSON.stringify(ctx || {})); } catch {}
}

export function initSiteTemplateBuilderWidget(host) {
  if (!host) return;
  if (host.__stSiteTplBuilderInited) return;
  host.__stSiteTplBuilderInited = true;

  let state = loadDraft();

  const root = document.createElement('div');
  root.className = 'st-site-tpl-builder';

  const render = () => {
    root.innerHTML = `
      <div class="st-site-tpl-builder__top">
        <button class="sttpl-btn sttpl-btn--primary" type="button" data-act="create-site-template">
          Створити Шаблон Сайта
        </button>
        <div class="st-site-tpl-builder__hint">
          Вибери шаблони сторінок для ключових сторінок. Можна лишити "Не вибрано".
        </div>
      </div>

      <div class="st-site-tpl-builder__panel" style="display:none" data-panel>
        <div class="st-site-tpl-builder__row">
          <div class="st-site-tpl-builder__label">Назва шаблону сайту</div>
          <input class="st-site-tpl-builder__input" data-name value="${esc(state.name)}" placeholder="Напр. Мій сайт 1" />
          <select class="st-site-tpl-builder__select" data-category>
            ${SITE_CATEGORIES.map(c => `
              <option value="${esc(c.id)}" ${String(state.category||'')===String(c.id) ? 'selected' : ''}>${esc(c.title)}</option>
            `).join('')}
          </select>

          <button class="sttpl-btn" type="button" data-act="save-site-template">Зберегти</button>
          <button class="sttpl-btn" type="button" data-act="close-panel">Закрити</button>
        </div>

        <div class="st-site-tpl-builder__list">
          ${BASE_PAGES.map(p => {
            const id = state.pages[p.role] || '';
            return `
              <div class="st-site-tpl-builder__item" data-role="${esc(p.role)}">
                <div class="st-site-tpl-builder__itemTitle">${esc(p.title)}</div>
                <div class="st-site-tpl-builder__itemVal" title="${esc(tplLabel(id))}">${esc(tplLabel(id))}</div>
                <div class="st-site-tpl-builder__itemBtns">
                  <button class="sttpl-btn" type="button" data-act="pick-page-template" data-role="${esc(p.role)}">Вибрати</button>
                  <button class="sttpl-btn" type="button" data-act="clear-page-template" data-role="${esc(p.role)}">Очистити</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  };

  render();
  host.appendChild(root);

  // Expose API for moving this UI between sidebar and workspace view (without duplicating logic)
  const sidebarHost = host;

  window.STSiteTemplateBuilder = window.STSiteTemplateBuilder || {};
  window.STSiteTemplateBuilder.attachTo = (mountEl) => {
    if (!mountEl) return;
    try {
      if (root.parentElement !== mountEl) {
        mountEl.appendChild(root);
      }
      // show panel when moved to main
      const p = panel();
      if (p) p.style.display = '';
    } catch (e) {
      console.warn('[SiteTemplateBuilder] attachTo failed', e);
    }
  };
  window.STSiteTemplateBuilder.detachToSidebar = () => {
    try {
      if (root.parentElement !== sidebarHost) {
        sidebarHost.appendChild(root);
      }
      // ✅ У сайдбарі завжди показуємо тільки кнопку "Створити Шаблон Сайта".
      // Панель з назвою/переліком сторінок не повинна "застрягати" після натиснення "Назад".
      const p = panel();
      if (p) p.style.display = 'none';
    } catch (e) {
      console.warn('[SiteTemplateBuilder] detachToSidebar failed', e);
    }
  };


  const panel = () => root.querySelector('[data-panel]');
  const openPanel = () => { const p = panel(); if (p) p.style.display = ''; };
  const closePanel = () => { const p = panel(); if (p) p.style.display = 'none'; };

  // Делегування кліків
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;

    const act = btn.dataset.act;

    if (act === 'create-site-template') {
      // Відкриваємо конструктор у Content (ховаємо canvas)
      document.dispatchEvent(new CustomEvent('st:open-site-template-builder'));

      state = loadDraft();
      render();
      openPanel();
      return;
    }

    if (act === 'close-panel') {
      // Назад у canvas
      // ✅ Ховаємо панель відразу, щоб у сайдбарі не з'являвся "старий блок" з переліком сторінок.
      closePanel();
      document.dispatchEvent(new CustomEvent('st:close-site-template-builder'));
      return;
    }

    if (act === 'pick-page-template') {
      const role = btn.dataset.role || '';
      if (!role) return;

      // контекст: ми відкриваємо галерею в режимі "вибору" для конструктора сайту
      setPickContext({
        mode: 'site-template-builder',
        role,
        ts: Date.now()
      });

      // відкриваємо менеджер шаблонів на вкладці Сторінка
      openTemplatesGalleryManager('page');

      // пробуємо переключити вкладку на 'page'
      if (typeof window.stTplGalleryManagerSetTab === 'function') {
        window.stTplGalleryManagerSetTab('page');
      } else {
        document.dispatchEvent(new CustomEvent('st:tplGallery:setTab', { detail: { tab: 'page' } }));
      }
      return;
    }

    if (act === 'clear-page-template') {
      const role = btn.dataset.role || '';
      if (!role) return;
      state.pages[role] = null;
      saveDraft(state);
      render();
      openPanel();
      return;
    }

    if (act === 'save-site-template') {
      const nameEl = root.querySelector('[data-name]');
      const name = (nameEl && nameEl.value || '').trim();
      if (!name) {
        alert('Вкажи назву шаблону сайту');
        return;
      }
      state.name = name;
      const catEl = root.querySelector('[data-category]');
      const catId = (catEl && catEl.value || '').trim();
      state.category = catId;
      saveDraft(state);

      // зберігаємо як type=site, kind=site
      const pagesMap = {};
      for (const [role, tplId] of Object.entries(state.pages || {})) {
        if (!role) continue;
        const id = String(tplId || '');
        if (!id) continue;
        pagesMap[role] = { templateId: id };
      }

      const payload = {
        kind: 'site',
        category: state.category || '',
        pages: pagesMap,
        version: 2,
        createdAt: new Date().toISOString()
      };

      addTemplate({
        type: 'site',
        folderId: categoryToFolderId(state.category),
        kind: 'site',
        name: state.name,
        html: JSON.stringify(payload),
        meta: {
          source: 'user',
          category: state.category || '',
          pages: pagesMap
        }
      });

      try {
        if (typeof window.stAlert === 'function') {
          window.stAlert({ title: 'Збережено', message: `Шаблон сайту “${state.name}” збережено ✅` });
        } else {
          alert(`Шаблон сайту “${state.name}” збережено ✅`);
        }
      } catch {}

      return;
    }
  });

  // Вибір шаблону сторінки з Галереї (пікер)
  if (!window.__stSiteTplPickBound) {
    window.__stSiteTplPickBound = true;
    window.addEventListener('st:tplPick:pageTemplate', (e) => {
      const d = e?.detail || {};
      if (d.mode !== 'site-template-builder') return;
      const role = d.role;
      const templateId = d.templateId;
      if (!role || !templateId) return;

      // обновляємо драфт
      state = loadDraft();
      state.pages[role] = templateId;
      saveDraft(state);

      // якщо панель відкритта — перемалюємо
      render();
      openPanel();
    });
  }
}
