// js/design/widgets/menu-builder/menu-builder-accordion-widget.js
// Акордеон в інспекторі (в самому низу): "Конструктор меню".
//
// Важливо:
// - НІЧОГО не ламаємо і не чіпаємо існуючі віджети.
// - Лише додаємо секцію + кнопки "Вибрати дизайн" та "Редагувати в конструкторі".
// - Переходи реалізовані через існуючу Галерею шаблонів + нову сторінку Menu Builder.

import { openMenuBuilderForMenuElement } from './menu-builder-runtime.js';

// [00374][TEMPLATE GALLERY][AUTO OPEN BRIDGE]
// Відкриття галереї йде через bridge, який сам чекає lazy-import і дорендерює перше відкриття.
function openTemplatesGalleryManager(tab) {
  import('../templates/templates-gallery-open-bridge.js')
    .then((mod) => {
      const fn = mod.openTemplatesGalleryManager || mod.openTemplatesGalleryWithBridge;
      if (typeof fn === 'function') fn(tab || 'site');
    })
    .catch((err) => console.warn('[00374][gallery bridge] lazy templates gallery failed:', err));
}

const SEC_ID = 'st-menu-builder-accordion';

function isHeaderMode() { return document.body.classList.contains('st-header-builder-on'); }
function isFooterMode() { return document.body.classList.contains('st-footer-builder-on'); }

function getScopeFromMode() {
  if (isHeaderMode()) return 'header';
  if (isFooterMode()) return 'footer';
  return 'unknown';
}

function getMenuFolderIdByScope(scope) {
  if (scope === 'header') return 'fld_menu_header';
  if (scope === 'footer') return 'fld_menu_footer';
  if (scope === 'sidebar') return 'fld_menu_sidebar';
  if (scope === 'main') return 'fld_menu_main';
  return null;
}

function detectMenuContextFromSelection(getSelection) {
  const sel = typeof getSelection === 'function' ? getSelection() : null;
  const el = sel?.elements?.[0] || null;
  if (!el) return null;

  // Підтримка існуючого меню (Header/Footer): .st-block--menu / [data-st-menu]
  const menuBlock = el.closest?.('.st-block--menu') || el.closest?.('[data-st-menu]') || null;
  if (menuBlock) {
    const scope = getScopeFromMode();
    const variant = (menuBlock.dataset?.menuVariant === 'burger') ? 'Burger Menu' : 'Big Menu';
    return {
      kind: 'hf-menu',
      scope,
      variant,
      element: menuBlock,
    };
  }

  // На майбутнє: instance меню (header/sidebar/footer/main) як окремий компонент — підʼєднаємо тут.
  return null;
}

function buildSection() {
  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.id = SEC_ID;

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button" aria-expanded="false">
      <div class="design-section__header-title"><span>Конструктор меню</span></div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body">
      <div class="st-mb-card">
        <div class="st-mb-title" data-st-mb-title>Виберіть меню</div>
        <div class="st-mb-note" data-st-mb-note>
          Клікни по меню на полотні, щоб увімкнути редагування.
        </div>
        <div class="st-mb-actions">
          <button class="st-btn" type="button" data-st-mb-design disabled>Вибрати дизайн</button>
          <button class="st-btn" type="button" data-st-mb-edit disabled>Редагувати в конструкторі</button>
        </div>
      </div>
    </div>

    <style>
      #${SEC_ID} .st-mb-card{
        border:1px solid rgba(148,163,184,0.20);
        border-radius:12px;
        padding:12px;
        background:rgba(15,23,42,0.04);
      }
      #${SEC_ID} .st-mb-title{ font-weight:700; font-size:13px; line-height:1.2; }
      #${SEC_ID} .st-mb-note{ margin-top:8px; font-size:12px; opacity:.9; }
      #${SEC_ID} .st-mb-actions{ margin-top:10px; display:flex; flex-direction:column; gap:8px; }
      #${SEC_ID} .st-btn{
        width:100%;
        border:1px solid rgba(148,163,184,0.28);
        background:rgba(255,255,255,0.65);
        border-radius:10px;
        padding:10px 10px;
        font-weight:600;
        font-size:12px;
        cursor:pointer;
      }
      #${SEC_ID} .st-btn:hover{ background:rgba(255,255,255,0.80); }
      #${SEC_ID} .st-btn[disabled]{ opacity:.5; cursor:not-allowed; }
    </style>
  `.trim();

  return sectionEl;
}

function openMenuFolderInGallery(menuFolderId) {
  // 1) Відкриваємо вкладку "Меню"
  openTemplatesGalleryManager('menu');

  // 2) Після рендера — клікаємо потрібну папку (Меню шапки / футера / ...)
  try {
    const tryClick = () => {
      const view = document.getElementById('templatesGalleryManagerView');
      if (!view) return false;
      if (!menuFolderId) return true;

      const btn = view.querySelector(`[data-act="folder"][data-folder="${CSS.escape(menuFolderId)}"]`);
      if (btn) { btn.click(); return true; }
      return false;
    };

    if (tryClick()) return;

    // повторимо пару разів, якщо DOM ще не встиг
    let n = 0;
    const t = setInterval(() => {
      n++;
      if (tryClick() || n > 10) clearInterval(t);
    }, 50);
  } catch {}
}

export function initMenuBuilderAccordionWidget(host, getSelection) {
  if (!host) return;
  if (host.querySelector(`#${CSS.escape(SEC_ID)}`)) return;

  const sectionEl = buildSection();
  host.appendChild(sectionEl);

  const titleEl  = sectionEl.querySelector('[data-st-mb-title]');
  const noteEl   = sectionEl.querySelector('[data-st-mb-note]');
  const designBtn= sectionEl.querySelector('[data-st-mb-design]');
  const editBtn  = sectionEl.querySelector('[data-st-mb-edit]');

  function render() {
    const ctx = detectMenuContextFromSelection(getSelection);

    if (!ctx) {
      if (titleEl) titleEl.textContent = 'Виберіть меню';
      if (noteEl)  noteEl.textContent  = 'Клікни по меню на полотні, щоб увімкнути редагування.';
      if (designBtn) { designBtn.disabled = true; designBtn.dataset.menuScope = ''; }
      if (editBtn)   { editBtn.disabled = true; editBtn.dataset.menuScope = ''; }
      return;
    }

    const scopeLabel =
      ctx.scope === 'header' ? 'Меню шапки' :
      ctx.scope === 'footer' ? 'Меню футера' :
      ctx.scope === 'sidebar'? 'Меню сайтбара' :
      ctx.scope === 'main'   ? 'Меню МАІН' :
      'Меню';

    if (titleEl) titleEl.textContent = scopeLabel;
    if (noteEl)  noteEl.textContent  = ctx.variant ? `Тип: ${ctx.variant}` : 'Меню вибране.';

    if (designBtn) {
      designBtn.disabled = false;
      designBtn.dataset.menuScope = ctx.scope || '';
    }
    if (editBtn) {
      editBtn.disabled = false;
      editBtn.dataset.menuScope = ctx.scope || '';
    }
  }

  const onAnyChange = () => render();
  window.addEventListener('click', onAnyChange, true);
  window.addEventListener('st:selection-changed', onAnyChange);

  designBtn?.addEventListener('click', () => {
    const ctx = detectMenuContextFromSelection(getSelection);
    if (!ctx) return;
    const folderId = getMenuFolderIdByScope(ctx.scope);
    openMenuFolderInGallery(folderId);
  });

  editBtn?.addEventListener('click', () => {
    const ctx = detectMenuContextFromSelection(getSelection);
    if (!ctx) return;
    // ✅ One-to-one preview: reuse Header Builder Mode rendering (no clones).
    openMenuBuilderForMenuElement(ctx.element || null);
  });
// NOTE: не диспатчимо подію вдруге, щоб не відкривати Builder двічі (і не губити element).


  render();
}
