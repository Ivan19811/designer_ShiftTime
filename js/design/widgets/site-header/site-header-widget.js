// js/design/widgets/site-header/site-header-widget.js

import { openHeaderBuilderMode } from "../../../site-frame/site-frame-builder-mode-00989.js";
import { openHelpModal } from "../help/help-modal.js";
import { addTemplate, writeTemplatesBackupToFolder } from "../templates/store/templates-store.js";
import { readActiveTemplate00946 } from "../templates/style-sync/template-style-sync-state.js";

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


const WID = "st-design-header-widget";

const LS_HIDDEN = "st_header_hidden_v1";                 // "1" | "0"

// ✅ quick apply target (для галереї)
const LS_QUICK_TARGET = "st_header_apply_quick_target";
const LS_POS = "st_header_position_v1";  // "global" | "page"

function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function readHeaderAppliedState(pageId) {
  const pid = pageId ? String(pageId) : '';
  return {
    global: readActiveTemplate00946('header', { mode: 'global', pageId: pid }),
    page: pid ? readActiveTemplate00946('header', { mode: 'page', pageId: pid }) : null
  };
}

function readHiddenFlag() { try { return localStorage.getItem(LS_HIDDEN) === "1"; } catch { return false; } }
function writeHiddenFlag(isHidden) { try { localStorage.setItem(LS_HIDDEN, isHidden ? "1" : "0"); } catch {} }
function openHeaderPosHelp(activeKey = 'normal') {
  openHelpModal({
    title: 'Позиціонування шапки',
    intro:
      'Тут обирається поведінка шапки відносно прокрутки всередині canvas. ' +
      'У конструкторі скрол відбувається в .canvas__scroll, тому "Sticky/Fixed" працюють в межах цього скролу.\n\n' +
      'Підказки винесені в окреме вікно, щоб віджет був чистим і коротким.',
    activeKey,
    items: [
      { group: 'Режими', key: 'normal', label: 'Normal', desc:
        'Звичайна шапка.\n\n' +
        '• Шапка займає місце в потоці документа (layout)\n' +
        '• При прокрутці canvas шапка їде разом із контентом\n\n' +
        '✔ Найпростіший та найбезпечніший режим\n' +
        '✔ Підходить, коли шапка не повинна "липнути" зверху' },

      { key: 'sticky', label: 'Sticky', desc:
        'Прилипає при скролі canvas.\n\n' +
        '• Шапка поводиться як sticky-елемент\n' +
        '• Коли ти скролиш всередині canvas, шапка "прилипає" до верху видимої області\n' +
        '• Режим працює саме в межах внутрішнього скролу (.canvas__scroll), а не всього браузера\n\n' +
        '✔ Добре для довгих сторінок\n' +
        '✔ Шапка завжди під рукою' },

      { key: 'fixed', label: 'Fixed', desc:
        'Як Sticky (фіксація в межах скролу).\n\n' +
        '• Шапка фіксується зверху відносно області canvas\n' +
        '• Не "стрибaє" разом із контентом\n' +
        '• Поведінка максимально схожа на Sticky, але реалізована як фіксація в межах скролера\n\n' +
        '✔ Коли потрібна максимально стабільна шапка\n' +
        '⚠️ Важливо правильно підібрати Z-index, щоб шапка не ховалась під контент' },

      { group: 'Параметри', key: 'top', label: 'Top (px)', desc:
        'Top (px) задає вертикальний відступ шапки зверху (CSS top).\n\n' +
        '1) Якщо режим = Sticky або Fixed:\n' +
        '• Top впливає на відступ зверху шапки в межах canvas-scroll (.canvas__scroll)\n' +
        '• Тягнеш повзунок → шапка їде вниз/вгору (у межах дозволеного)\n\n' +
        '2) Якщо режим = Normal:\n' +
        '• Шапка в потоці (position: static/relative), тому top не має сенсу або не дає очікуваного ефекту\n' +
        '• Це нормально, якщо в Normal «нічого не відбувається»\n\n' +
        'Порада: хочеш керувати Top — обирай Sticky або Fixed.' },

      { key: 'z', label: 'Z-index', desc:
        'Z-index — порядок накладання (CSS z-index).\n\n' +
        'Коли працює:\n' +
        '• Z-index має ефект тільки коли шапка позиціонована (Sticky/Fixed/Absolute/Relative)\n\n' +
        'Sticky/Fixed:\n' +
        '• Більше значення → шапка вище за інші елементи\n' +
        '• Якщо контент перекриває шапку — підніми Z-index\n\n' +
        'Normal:\n' +
        '• У режимі Normal Z-index може не мати ефекту — це очікувано\n\n' +
        'Порада: якщо щось перекриває шапку — збільш Z-index (наприклад 200–400).' },
    ],
  });
}


function readHeaderPosition() {
  try {
    const raw = localStorage.getItem(LS_POS);
    if (!raw) return { mode: "normal", top: 0, z: 200 };
    const obj = JSON.parse(raw);
    const mode = (obj?.mode === "sticky" || obj?.mode === "fixed" || obj?.mode === "normal") ? obj.mode : "normal";
    const top = Number.isFinite(+obj?.top) ? Math.max(0, Math.min(200, +obj.top)) : 0;
    const z = Number.isFinite(+obj?.z) ? Math.max(1, Math.min(1000, +obj.z)) : 200;
    return { mode, top, z };
  } catch {
    return { mode: "normal", top: 0, z: 200 };
  }
}

function applyHeaderPositionUI(rootEl, pos) {
  const btns = rootEl.querySelectorAll('button[data-act="pos"][data-pos]');
  btns.forEach(b => b.classList.toggle("is-active", b.dataset.pos === pos.mode));

  const topR = rootEl.querySelector('input[data-act="pos-top"]');
  const zR   = rootEl.querySelector('input[data-act="pos-z"]');
  const tv   = rootEl.querySelector('[data-pos-topval]');
  const zv   = rootEl.querySelector('[data-pos-zval]');

  if (topR) topR.value = String(pos.top);
  if (zR) zR.value = String(pos.z);
  if (tv) tv.textContent = String(pos.top);
  if (zv) zv.textContent = String(pos.z);
}

function setHeaderPositionViaRuntime(pos) {
  const rt = getRuntime();
  if (rt && typeof rt.setPosition === "function") {
    rt.setPosition(pos);
  } else {
    // fallback: тільки LS, без sync (але runtime зазвичай є)
    localStorage.setItem(LS_POS, JSON.stringify(pos));
    if (rt && typeof rt.sync === "function") rt.sync();
  }
}

function getCurrentPageIdBestEffort() {
  const root = document.getElementById("site-root");
  const pid = root?.dataset?.pageId;
  if (pid) return String(pid);

  const maybe = window?.ST_PAGES?.getActiveId?.();
  if (maybe && typeof maybe === "string") return maybe;

  const h = (location.hash || "").replace("#", "").trim();
  if (h) return `page:${h}`;

  return "page:default";
}

function getRuntime() { return window.SiteHeaderRuntime || null; }
function getHeaderState() { return window.ST_HEADER_STATE || null; }

function readCurrentMode(pageId) {
  const globalMode = (localStorage.getItem("st_header_mode_global_v1") === "page") ? "page" : "global";
  if (!pageId) return globalMode;

  let map = {};
  try { map = JSON.parse(localStorage.getItem("st_header_mode_pages_v1") || "{}"); } catch {}
  const m = map[String(pageId)];
  return (m === "page" || m === "global") ? m : globalMode;
}

function renderModeLabel(mode, pageId) {
  if (mode === "page") return pageId ? `Окрема для сторінки: ${pageId}` : `Окрема для сторінки (pageId не знайдено)`;
  return "Глобальна шапка";
}

function findHeaderAccordionMount() {
  const clickables = $all("button, a, [role='button'], .st-btn, .pill");
  let anchor = null;

  for (const el of clickables) {
    const t = (el.textContent || "").trim().toLowerCase();
    if (t.includes("шаблони") && t.includes("шапки")) { anchor = el; break; }
  }
  if (!anchor) return null;

  const candidates = [
    anchor.closest(".accordion__body"),
    anchor.closest(".accordion__item"),
    anchor.closest(".st-accordion__body"),
    anchor.closest(".st-accordion__item"),
    anchor.parentElement
  ].filter(Boolean);

  const mountRoot = candidates[0] || anchor.parentElement;
  return { mountRoot, anchor };
}

// ✅ відкрити інфо-модалку (та сама ℹ у галереї) для конкретного tplId
function openInfoPopupForTemplate(tplId) {
  if (!tplId) return;
  openTemplatesGalleryManager("header");

  // дочекатись рендера галереї і натиснути ℹ
  requestAnimationFrame(() => {
    setTimeout(() => {
      const view = document.getElementById("templatesGalleryManagerView");
      if (!view) return;

      const infoBtn = view.querySelector(`.sttpl-infoBtn[data-act="info-template"][data-tpl-id="${CSS.escape(String(tplId))}"]`);
      if (infoBtn) infoBtn.click();
    }, 0);
  });
}

// =========================================================
// ШАПКА → ЗБЕРЕГТИ ТІЛЬКИ ПОТОЧНУ ШАПКУ ЯК СИСТЕМНИЙ ШАБЛОН
// Важливо: це НЕ шаблон сторінки. Зберігаємо тільки HTML шапки.
// =========================================================
function stripHeaderTransientState_(root) {
  if (!root) return;
  const transientClasses = [
    'is-active', 'is-selected', 'is-hover', 'is-dragging', 'is-resizing',
    'is-drop-target', 'st-drop-target', 'st-selected', 'st-active',
    'st-outline', 'st-hover-outline', 'st-sec-drop-target'
  ];
  const transientAttrs = [
    'data-st-selected', 'data-st-active', 'data-st-hover', 'data-st-dragging',
    'data-st-resizing', 'data-drop-target', 'data-st-drop-target',
    'aria-selected'
  ];

  root.querySelectorAll('*').forEach((el) => {
    try { el.classList.remove(...transientClasses); } catch {}
    transientAttrs.forEach((attr) => {
      try { el.removeAttribute(attr); } catch {}
    });
  });
}

function normalizeHeaderTemplateHtml_(html) {
  const src = String(html || '').trim();
  if (!src) return '';

  const tmp = document.createElement('div');
  tmp.innerHTML = src;

  // Якщо у слоті випадково є runtime-wrapper — у шаблон кладемо тільки саму шапку.
  const runtimeWrap = tmp.querySelector('[data-st-role="site-header"]');
  const host = runtimeWrap || tmp;
  stripHeaderTransientState_(host);

  return (runtimeWrap ? runtimeWrap.innerHTML : tmp.innerHTML).trim();
}

function getCurrentHeaderHtmlForTemplate_() {
  // 1) Головне джерело — те, що реально зараз показане у слоті шапки.
  const slot = document.getElementById('st-site-header-slot');
  let html = slot?.innerHTML ? String(slot.innerHTML).trim() : '';
  if (html) return normalizeHeaderTemplateHtml_(html);

  // 2) Fallback: беремо активний режим із runtime/state.
  try {
    const state = window.ST_HEADER_STATE?.getState?.();
    const pageId = window.SiteHeaderRuntime?.getPageId?.() || getCurrentPageIdBestEffort();
    const mode = window.SiteHeaderRuntime?.getMode?.(pageId) || readCurrentMode(pageId) || 'global';
    if (mode === 'page' && pageId && state?.pages?.[String(pageId)]?.html) {
      html = String(state.pages[String(pageId)].html || '').trim();
    }
    if (!html && state?.global?.html) html = String(state.global.html || '').trim();
  } catch {}

  return normalizeHeaderTemplateHtml_(html);
}

async function saveCurrentHeaderAsSystemTemplateFromHeaderWidget_(rootEl) {
  const input = rootEl?.querySelector?.('input[data-act="header-system-template-name"]');
  const name = String(input?.value || '').trim();

  if (!name) {
    try { alert('Введи назву системного шаблону шапки.'); } catch {}
    try { input?.focus?.(); } catch {}
    return { ok: false, reason: 'empty-name' };
  }

  const html = getCurrentHeaderHtmlForTemplate_();
  if (!html) {
    try { alert('Не знайдено активну шапку для збереження. Спочатку створи або застосуй шапку.'); } catch {}
    return { ok: false, reason: 'empty-header' };
  }

  const id = `header_system_saved_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const item = addTemplate({
    id,
    type: 'header',
    folderId: 'fld_header',
    name,
    html,
    previewHtml: html,
    description: 'Збережено з поточної шапки через віджет «Шапка».',
    meta: {
      source: 'system',
      userSavedSystem: true,
      savedFrom: 'site-header-widget',
      savedScope: 'header-only',
      tools: ['header', 'section', 'row', 'container', 'menu', 'text', 'button'],
    }
  });

  // Якщо користувач уже вибрав backup-папку у віджеті «Шаблони», одразу оновлюємо portable backup.
  let backupInfo = '';
  try {
    const res = await writeTemplatesBackupToFolder();
    if (res?.ok) backupInfo = `\nBackup також оновлено: ${res.filename || ''}`;
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent('st:templates-store-updated', {
      detail: { type: 'header', templateId: item.id, source: 'site-header-widget' }
    }));
  } catch {}

  try { alert(`Шапку збережено як системний шаблон ✅\n\nНазва: ${item.name}${backupInfo}`); } catch {}
  return { ok: true, item };
}

function buildUI() {
  const wrap = document.createElement("div");
  wrap.id = WID;
  wrap.className = "st-ui-card st-ui-card--header";

  wrap.innerHTML = `
    <style>
      #${WID}.st-ui-card--header .st-btn{

        appearance:none; border:1px solid rgba(148,163,184,.22);
        background:linear-gradient(180deg, rgba(30,41,59,.72), rgba(15,23,42,.72));
        color:rgba(226,232,240,.95);
        font-weight:600; font-size:12px; letter-spacing:.2px;
        padding:8px 10px; border-radius:10px;
        box-shadow:0 6px 16px rgba(0,0,0,.22);
        transition:transform .08s ease, border-color .12s ease, background .12s ease, opacity .12s ease;
        cursor:pointer;
      }
      #${WID}.st-ui-card--header .st-btn:hover{
        border-color:rgba(56,189,248,.35);
        background:linear-gradient(180deg, rgba(30,41,59,.82), rgba(15,23,42,.82));
      }
      #${WID}.st-ui-card--header .st-btn:active{ transform:translateY(1px); opacity:.95; }
      #${WID}.st-ui-card--header .st-btn--wide{ width:100%; display:block; }

#${WID}.st-ui-card--header .st-btn--sm{ padding:6px 8px; border-radius:10px; font-size:12px; }
      #${WID}.st-ui-card--header .st-input{
        width:100%; box-sizing:border-box; margin-top:6px; padding:8px 10px; border-radius:10px;
        border:1px solid rgba(148,163,184,.22); background:rgba(15,23,42,.62); color:rgba(226,232,240,.96);
        font-size:12px; outline:none;
      }
      #${WID}.st-ui-card--header .st-input:focus{ border-color:rgba(56,189,248,.55); box-shadow:0 0 0 1px rgba(56,189,248,.18) inset; }
      #${WID}.st-ui-card--header .st-hint{ margin-top:6px; color:rgba(203,213,225,.72); font-size:11px; line-height:1.35; }
#${WID}.st-ui-card--header .st-btn.is-active{ border-color:rgba(34,197,94,.45); box-shadow:0 0 0 1px rgba(34,197,94,.18) inset, 0 8px 20px rgba(34,197,94,.12); }
      #${WID}.st-ui-card--header .st-btn.is-active{
        border-color:rgba(56,189,248,.55);
        box-shadow:0 0 0 1px rgba(56,189,248,.18) inset, 0 8px 18px rgba(0,0,0,.28);
      }

      /* ✅ Кружечки більші + hover підсвітка */
      #${WID}.st-ui-card--header .st-dot{
        width:14px;height:14px;border-radius:999px;
        box-shadow:0 0 0 1px rgba(255,255,255,.10) inset;
        flex:0 0 auto;
        cursor:pointer;
        transition:transform .10s ease, filter .12s ease, box-shadow .12s ease;
      }
      #${WID}.st-ui-card--header .st-dot:hover{
        transform:scale(1.12);
        filter:brightness(1.2);
        box-shadow:0 0 0 1px rgba(255,255,255,.18) inset, 0 0 14px rgba(56,189,248,.20);
      }
      #${WID}.st-ui-card--header .st-dot--gray{ background:#64748b; }
      #${WID}.st-ui-card--header .st-dot--green{ background:#22c55e; }
      #${WID}.st-ui-card--header .st-dot--red{ background:#ef4444; }

      #${WID}.st-ui-card--header .st-modeblock{ margin-top:10px; }
      #${WID}.st-ui-card--header .st-sel{
        margin-top:6px; display:flex; align-items:center; gap:8px;
        font-size:12px; opacity:.92;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }

      /* ✅ Назва клікабельна + hover */
      #${WID}.st-ui-card--header .st-selname{
        overflow:hidden; text-overflow:ellipsis;
        cursor:pointer;
        transition:filter .12s ease, opacity .12s ease;
      }
      #${WID}.st-ui-card--header .st-selname:hover{ filter:brightness(1.15); }

      #${WID}.st-ui-card--header .st-check{ display:flex;align-items:center;gap:10px;margin-top:12px;font-size:13px;opacity:.95; }
      #${WID}.st-ui-card--header .st-check input{ transform:translateY(1px); }
    </style>

    <div class="st-ui-card__head">
      <div class="st-ui-card__title">Шапка (Header)</div>
      <div class="st-ui-card__sub" data-sub></div>
      <div class="st-ui-card__mono">
        Mode: <span data-mode></span> · PageId: <span data-pageid></span>
      </div>
    </div>

    <div class="st-ui-card__row" style="margin:8px 0 10px">
      <button type="button" class="st-btn st-btn--wide" data-act="configure-header">Налаштувати</button>
    </div>

    <div class="st-modeblock" data-header-system-save-box>
      <div class="st-ui-card__label">Назва системного шаблону шапки</div>
      <input
        type="text"
        class="st-input"
        data-act="header-system-template-name"
        placeholder="Наприклад: Моя шапка магазин"
      />
      <button
        type="button"
        class="st-btn st-btn--wide"
        data-act="save-header-system-template"
        style="margin-top:8px"
      >Зберегти шапку як Системний шаблон</button>
      <div class="st-hint">Зберігається тільки поточна шапка, не вся сторінка.</div>
    </div>


    <div class="st-modeblock">
      <button type="button" class="st-btn" data-act="global">Глобальна</button>
      <div class="st-sel">
        <span class="st-dot st-dot--gray" data-dot="global" title="Відкрити шаблони шапки (Auto: Global)"></span>
        <span class="st-selname" data-sel="global" title="">Не вибрано</span>
      </div>
    </div>

    <div class="st-modeblock">
      <button type="button" class="st-btn" data-act="page">Для сторінки</button>
      <div class="st-sel">
        <span class="st-dot st-dot--gray" data-dot="page" title="Відкрити шаблони шапки (Auto: Page)"></span>
        <span class="st-selname" data-sel="page" title="">Не вибрано</span>
      </div>
    </div>

    
    <div class="st-ui-card__sep"></div>

    <div class="st-modeblock">
      <div class="st-ui-card__row" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px">
        <div class="st-ui-card__title" style="margin:0">Позиціонування</div>
        <button type="button" class="st-btn st-btn--sm" data-act="pos-help" title="Пояснення позиціонування">?</button>
      </div>

      <div class="st-ui-card__row" style="margin-top:8px">
        <button type="button" class="st-btn st-btn--sm" data-act="pos" data-pos="normal">Normal</button>
        <button type="button" class="st-btn st-btn--sm" data-act="pos" data-pos="sticky">Sticky</button>
        <button type="button" class="st-btn st-btn--sm" data-act="pos" data-pos="fixed">Fixed</button>
      </div>

      <div class="st-ui-card__field" style="margin-top:10px">
        <div class="st-ui-card__label" data-act="pos-help-top" title="Пояснення Top (px)" style="cursor:help">Top (px): <span data-pos-topval>0</span></div>
        <input type="range" min="0" max="200" step="1" value="0" data-act="pos-top" />
      </div>

      <div class="st-ui-card__field" style="margin-top:10px">
        <div class="st-ui-card__label" data-act="pos-help-z" title="Пояснення Z-index" style="cursor:help">Z-index: <span data-pos-zval>200</span></div>
        <input type="range" min="1" max="1000" step="1" value="200" data-act="pos-z" />
      </div>
    </div>

    <label class="st-check">
      <input type="checkbox" data-act="toggle-hide" />
      <span>Приховати шапку</span>
    </label>

    <textarea class="st-textarea" data-act="html"
      placeholder="Встав HTML шапки сюди… (потім Застосувати)"></textarea>

    <div class="st-ui-card__row" style="margin-top:10px">
      <button type="button" class="st-btn" data-act="apply">Застосувати</button>
      <button type="button" class="st-btn" data-act="clear">Очистити</button>
    </div>
  `;

  return wrap;
}

function applyActiveButtons(rootEl, mode) {
  const bG = rootEl.querySelector('[data-act="global"]');
  const bP = rootEl.querySelector('[data-act="page"]');
  if (!bG || !bP) return;
  bG.classList.toggle("is-active", mode === "global");
  bP.classList.toggle("is-active", mode === "page");
}

function refreshUI(rootEl) {
  const pageId = getCurrentPageIdBestEffort();
  const mode = readCurrentMode(pageId);

  applyActiveButtons(rootEl, mode);

  const sub = rootEl.querySelector("[data-sub]");
  const m = rootEl.querySelector("[data-mode]");
  const p = rootEl.querySelector("[data-pageid]");
  if (sub) sub.textContent = renderModeLabel(mode, pageId);
  if (m) m.textContent = mode;
  if (p) p.textContent = pageId ?? "null";

  const { global, page } = readHeaderAppliedState(pageId);
  const globalTplId = global?.templateId || null;
  const pageTplId = page?.templateId || null;
  const gName = global?.templateName || null;
  const pName = page?.templateName || null;

  const gDot = rootEl.querySelector('[data-dot="global"]');
  const pDot = rootEl.querySelector('[data-dot="page"]');
  const gSel = rootEl.querySelector('[data-sel="global"]');
  const pSel = rootEl.querySelector('[data-sel="page"]');

  if (gDot) {
    gDot.classList.remove("st-dot--gray", "st-dot--green");
    gDot.classList.add(globalTplId ? "st-dot--green" : "st-dot--gray");
  }
  if (pDot) {
    pDot.classList.remove("st-dot--gray", "st-dot--red");
    pDot.classList.add(pageTplId ? "st-dot--red" : "st-dot--gray");
  }

  if (gSel) {
    const txt = globalTplId ? `${gName || "Без назви"} · ${globalTplId}` : "Не вибрано";
    gSel.textContent = txt;
    gSel.title = globalTplId ? txt : "Не вибрано";
    gSel.dataset.tplId = globalTplId ? String(globalTplId) : "";
  }
  if (pSel) {
    const txt = pageTplId ? `${pName || "Без назви"} · ${pageTplId}` : "Не вибрано";
    pSel.textContent = txt;
    pSel.title = pageTplId ? txt : "Не вибрано";
    pSel.dataset.tplId = pageTplId ? String(pageTplId) : "";
  }

    const pos = readHeaderPosition();
  applyHeaderPositionUI(rootEl, pos);

const chk = rootEl.querySelector('input[data-act="toggle-hide"]');
  if (chk) chk.checked = readHiddenFlag();
}

function applyHTML(html, mode, pageId) {
  const HS = getHeaderState();
  if (!HS) { console.warn("[header-widget] ST_HEADER_STATE not found"); return; }

  if (mode === "page") {
    if (!pageId) { console.warn("[header-widget] page mode але pageId = null"); return; }
    if (typeof HS.setPageHTML === "function") return HS.setPageHTML(pageId, html);
    if (typeof HS.setPage === "function") return HS.setPage(pageId, html);
    if (typeof HS.setPageHeaderHTML === "function") return HS.setPageHeaderHTML(pageId, html);
  } else {
    if (typeof HS.setGlobalHTML === "function") return HS.setGlobalHTML(html);
    if (typeof HS.setGlobal === "function") return HS.setGlobal(html);
    if (typeof HS.setGlobalHeaderHTML === "function") return HS.setGlobalHeaderHTML(html);
  }

  console.warn("[header-widget] ST_HEADER_STATE не має методу setGlobalHTML/setPageHTML (або аналога)");
}

function bindUI(rootEl) {
  rootEl.addEventListener("click", async (e) => {
    // ✅ Пояснення по позиціонуванню (іконка "?")
    const helpBtn = e.target.closest('button[data-act="pos-help"]');
    if (helpBtn && rootEl.contains(helpBtn)) {
      openHeaderPosHelp('normal');
      return;
    }

    // ✅ Підказки по параметрах (клік по підпису, а не по повзунку — щоб range працював)
    const topHelp = e.target.closest('[data-act="pos-help-top"]');
    if (topHelp && rootEl.contains(topHelp)) {
      openHeaderPosHelp('top');
      return;
    }
    const zHelp = e.target.closest('[data-act="pos-help-z"]');
    if (zHelp && rootEl.contains(zHelp)) {
      openHeaderPosHelp('z');
      return;
    }

    // ✅ 1) клік по кружечках = quick apply target + open gallery(header)
    const dot = e.target.closest("[data-dot]");
    if (dot && rootEl.contains(dot)) {
      const which = dot.dataset.dot === "global" ? "global" : "page";
      // ✅ ВАЖЛИВО: галерея історично читає st_header_pick_target.
      // Щоб не ламати сумісність — пишемо в ОБИДВА ключі.
      try { localStorage.setItem("st_header_pick_target", which); } catch {}
      try { localStorage.setItem(LS_QUICK_TARGET, which); } catch {}
      openTemplatesGalleryManager("header");
      return;
    }


    // ✅ 1.1) Position mode buttons (Normal/Sticky/Fixed)
    const posBtn = e.target.closest('button[data-act="pos"][data-pos]');
    if (posBtn && rootEl.contains(posBtn)) {
      const cur = readHeaderPosition();
      const next = { ...cur, mode: String(posBtn.dataset.pos || "normal") };
      localStorage.setItem(LS_POS, JSON.stringify(next));
      setHeaderPositionViaRuntime(next);
      applyHeaderPositionUI(rootEl, next);
      return;
    }


    // ✅ 2) клік по назві = показати інфо (вже існуюча ℹ-модалка)
    const sel = e.target.closest(".st-selname[data-sel]");
    if (sel && rootEl.contains(sel)) {
      const tplId = sel.dataset.tplId || "";
      if (tplId) openInfoPopupForTemplate(tplId);
      return;
    }

    const btn = e.target.closest("[data-act]");
    if (!btn) return;

    const act = btn.dataset.act;

    if (act === "configure-header") {
      openHeaderBuilderMode();
      return;
    }

    if (act === "save-header-system-template") {
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = "Зберігаю шапку…";
      try {
        await saveCurrentHeaderAsSystemTemplateFromHeaderWidget_(rootEl);
      } finally {
        btn.disabled = false;
        btn.textContent = oldText || "Зберегти шапку як Системний шаблон";
      }
      return;
    }

    const rt = getRuntime();

    const pageId = getCurrentPageIdBestEffort();
    const modeNow = readCurrentMode(pageId);

    if (act === "global") {
      if (rt && typeof rt.setMode === "function") rt.setMode("global", pageId);
      refreshUI(rootEl);
      return;
    }

    if (act === "page") {
      if (rt && typeof rt.setMode === "function") rt.setMode("page", pageId);
      refreshUI(rootEl);
      return;
    }

    if (act === "apply") {
      const ta = rootEl.querySelector('textarea[data-act="html"]');
      const html = (ta?.value || "").trim();
      applyHTML(html, modeNow, pageId);
      if (rt && typeof rt.sync === "function") rt.sync();
      refreshUI(rootEl);
      return;
    }

    if (act === "clear") {
      applyHTML("", modeNow, pageId);
      if (rt && typeof rt.sync === "function") rt.sync();
      refreshUI(rootEl);
      return;
    }
  });

  

  rootEl.addEventListener("input", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;

    if (el.matches('input[data-act="pos-top"]')) {
      const cur = readHeaderPosition();
      const next = { ...cur, top: parseInt(el.value || "0", 10) };
      localStorage.setItem(LS_POS, JSON.stringify(next));
      setHeaderPositionViaRuntime(next);
      applyHeaderPositionUI(rootEl, next);
      return;
    }
    if (el.matches('input[data-act="pos-z"]')) {
      const cur = readHeaderPosition();
      const next = { ...cur, z: parseInt(el.value || "200", 10) };
      localStorage.setItem(LS_POS, JSON.stringify(next));
      setHeaderPositionViaRuntime(next);
      applyHeaderPositionUI(rootEl, next);
      return;
    }
  });

  rootEl.addEventListener("change", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    if (el.matches('input[data-act="toggle-hide"]')) {
      const rt = getRuntime();
      writeHiddenFlag(!!el.checked);
      if (rt && typeof rt.setHidden === "function") rt.setHidden(!!el.checked);
      else if (rt && typeof rt.sync === "function") rt.sync();
      refreshUI(rootEl);
    }
  });
}

export function initSiteHeaderWidget() {
  const found = findHeaderAccordionMount();
  if (!found) return;

  const { mountRoot, anchor } = found;

  const existing = document.getElementById(WID);
  if (existing) { refreshUI(existing); return; }

  const ui = buildUI();

  if (anchor && anchor.parentElement && anchor.parentElement.contains(anchor)) {
    anchor.insertAdjacentElement("afterend", ui);
  } else {
    mountRoot.prepend(ui);
  }

  bindUI(ui);
  refreshUI(ui);
}
