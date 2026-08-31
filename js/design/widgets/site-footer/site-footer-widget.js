// js/design/widgets/site-footer/site-footer-widget.js

import { openFooterBuilderMode } from "../../../site-frame/site-frame-builder-mode-00989.js";
import { openHelpModal } from "../help/help-modal.js";
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


const WID = "st-design-footer-widget";

const LS_HIDDEN = "st_footer_hidden_v1";                 // "1" | "0"

// ✅ quick apply target (для галереї)
const LS_QUICK_TARGET = "st_footer_apply_quick_target";
const LS_POSMODE_UI = "st_footer_positioning_mode_v1"; // [00849] static only
const LS_POS = "st_footer_position_v1";  // "global" | "page"

function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function readFooterAppliedState(pageId) {
  const pid = pageId ? String(pageId) : '';
  return {
    global: readActiveTemplate00946('footer', { mode: 'global', pageId: pid }),
    page: pid ? readActiveTemplate00946('footer', { mode: 'page', pageId: pid }) : null
  };
}

function readHiddenFlag() { try { return localStorage.getItem(LS_HIDDEN) === "1"; } catch { return false; } }
function writeHiddenFlag(isHidden) { try { localStorage.setItem(LS_HIDDEN, isHidden ? "1" : "0"); } catch {} }


function readFooterPosition() {
  return { mode: "normal", bottom: 0, z: 10 };
}

function applyFooterPositionUI(rootEl, pos) {
  const btns = rootEl.querySelectorAll('button[data-act="pos"][data-pos]');
  btns.forEach(b => b.classList.toggle("is-active", b.dataset.pos === pos.mode));

  const topR = rootEl.querySelector('input[data-act="pos-bottom"]');
  const zR   = rootEl.querySelector('input[data-act="pos-z"]');
  const tv   = rootEl.querySelector('[data-pos-bottomval]');
  const zv   = rootEl.querySelector('[data-pos-zval]');

  if (topR) topR.value = String(pos.bottom);
  if (zR) zR.value = String(pos.z);
  if (tv) tv.textContent = String(pos.bottom);
  if (zv) zv.textContent = String(pos.z);
}

function setFooterPositionViaRuntime(pos) {
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

function getRuntime() { return window.SiteFooterRuntime || null; }
function getFooterState() { return window.ST_FOOTER_STATE || null; }

function readCurrentMode(pageId) {
  const globalMode = (localStorage.getItem("st_footer_mode_global_v1") === "page") ? "page" : "global";
  if (!pageId) return globalMode;

  let map = {};
  try { map = JSON.parse(localStorage.getItem("st_footer_mode_pages_v1") || "{}"); } catch {}
  const m = map[String(pageId)];
  return (m === "page" || m === "global") ? m : globalMode;
}

function renderModeLabel(mode, pageId) {
  if (mode === "page") return pageId ? `Окрема для сторінки: ${pageId}` : `Окрема для сторінки (pageId не знайдено)`;
  return "Глобальний футер";
}

function findFooterAccordionMount() {
  const clickables = $all("button, a, [role='button'], .st-btn, .pill");
  let anchor = null;

  for (const el of clickables) {
    const t = (el.textContent || "").trim().toLowerCase();
    if (t.includes("шаблони") && t.includes("футера")) { anchor = el; break; }
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
  // ВАЖЛИВО: для футера відкриваємо вкладку/галерею футера, а не шапки
  openTemplatesGalleryManager("footer");

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

      #${WID}.st-ui-card--header .st-modeblock{ margin-bottom:10px; }
      #${WID}.st-ui-card--header .st-sel{
        margin-bottom:6px; display:flex; align-items:center; gap:8px;
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

      #${WID}.st-ui-card--header .st-check{ display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:13px;opacity:.95; }
      #${WID}.st-ui-card--header .st-check input{ transform:translateY(1px); }
    </style>

    <div class="st-ui-card__head">
      <div class="st-ui-card__title">Футер (Footer)</div>
      <div class="st-ui-card__sub" data-sub></div>
      <div class="st-ui-card__mono">
        Mode: <span data-mode></span> · PageId: <span data-pageid></span>
      </div>
    </div>

    <div class="st-ui-card__row" style="margin:8px 0 10px">
      <button type="button" class="st-btn st-btn--wide" data-act="configure-footer">Налаштувати</button>
    </div>


    <div class="st-modeblock">
      <button type="button" class="st-btn" data-act="global">Глобальна</button>
      <div class="st-sel">
        <span class="st-dot st-dot--gray" data-dot="global" title="Відкрити шаблони футера (Auto: Global)"></span>
        <span class="st-selname" data-sel="global" title="">Не вибрано</span>
      </div>
    </div>

    <div class="st-modeblock">
      <button type="button" class="st-btn" data-act="page">Для сторінки</button>
      <div class="st-sel">
        <span class="st-dot st-dot--gray" data-dot="page" title="Відкрити шаблони футера (Auto: Page)"></span>
        <span class="st-selname" data-sel="page" title="">Не вибрано</span>
      </div>
    </div>

    
    <div class="st-ui-card__sep"></div>

    <div class="st-modeblock" data-footer-position-static-only="1">
      <div class="st-ui-card__row" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px">
        <div class="st-ui-card__title" style="margin:0">Позиціонування</div>
      </div>
      <div class="st-ui-card__row" style="margin-bottom:0; font-size:12px; line-height:1.35; opacity:.82">
        Static / natural flow. Футер є звичайною частиною сторінки і скролиться разом із шапкою та контентом.
      </div>
    </div>

    <label class="st-check">
      <input type="checkbox" data-act="toggle-hide" />
      <span>Приховати футер</span>
    </label>

    <textarea class="st-textarea" data-act="html"
      placeholder="Встав HTML футера сюди… (потім Застосувати)"></textarea>

    <div class="st-ui-card__row" style="margin-bottom:10px">
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

  const { global, page } = readFooterAppliedState(pageId);
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

  // [00849] Footer positioning is static/natural-flow only.
  try {
    localStorage.setItem(LS_POSMODE_UI, 'static');
    localStorage.setItem(LS_POS, JSON.stringify({ mode: 'normal', bottom: 0, z: 10 }));
  } catch {}

const chk = rootEl.querySelector('input[data-act="toggle-hide"]');
  if (chk) chk.checked = readHiddenFlag();
}

function applyHTML(html, mode, pageId) {
  const HS = getFooterState();
  if (!HS) { console.warn("[footer-widget] ST_FOOTER_STATE not found"); return; }

  if (mode === "page") {
    if (!pageId) { console.warn("[footer-widget] page mode але pageId = null"); return; }
    if (typeof HS.setPageHTML === "function") return HS.setPageHTML(pageId, html);
    if (typeof HS.setPage === "function") return HS.setPage(pageId, html);
    if (typeof HS.setPageFooterHTML === "function") return HS.setPageFooterHTML(pageId, html);
  } else {
    if (typeof HS.setGlobalHTML === "function") return HS.setGlobalHTML(html);
    if (typeof HS.setGlobal === "function") return HS.setGlobal(html);
    if (typeof HS.setGlobalFooterHTML === "function") return HS.setGlobalFooterHTML(html);
  }

  console.warn("[footer-widget] ST_FOOTER_STATE не має методу setGlobalHTML/setPageHTML (або аналога)");
}

function bindUI(rootEl) {
  rootEl.addEventListener("click", (e) => {
    // [00849] Footer positioning help: static/natural-flow only.
    const helpBtn = e.target.closest('button[data-act="pos-help"]');
    if (helpBtn && rootEl.contains(helpBtn)) {
      openHelpModal({
        title: 'Позиціонування футера',
        intro: 'Футер працює як звичайна частина сторінки.',
        activeKey: 'static',
        items: [
          { group: 'Єдиний режим', key: 'static', label: 'Static / natural flow', tag: 'ACTIVE', desc: 'Футер знаходиться після контенту та скролиться разом із шапкою і основною частиною сайту. Старі режими sticky/fixed/reveal вимкнені.' },
        ]
      });
      return;
    }

    // [00849] Stale positioning buttons from older DOM are normalized to static.
    const posBtn = e.target.closest('button[data-act="pos-mode"]');
    if (posBtn && rootEl.contains(posBtn)) {
      try { localStorage.setItem(LS_POSMODE_UI, 'static'); } catch {}
      try { window.SiteFooterRuntime?.setPosition?.({ mode: 'normal', bottom: 0, z: 10 }); } catch (_) {}
      try { window.SiteFooterRuntime?.sync?.(); } catch (_) {}
      refreshUI(rootEl);
      return;
    }


    // ✅ 1) клік по кружечках = quick apply target + open gallery(header)
    const dot = e.target.closest("[data-dot]");
    if (dot && rootEl.contains(dot)) {
      const which = dot.dataset.dot === "global" ? "global" : "page";
      localStorage.setItem(LS_QUICK_TARGET, which);
      // ✅ Для галереї: кружечки задають ціль (global/page) і APPLY має бути без модалки
      try { localStorage.setItem('st_footer_pick_target', which); } catch {}
      // ВАЖЛИВО: сірі "кружечки" у футері мають відкривати шаблони футера
      openTemplatesGalleryManager("footer");
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

    if (act === "configure-footer") {
      openFooterBuilderMode();
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

    if (el.matches('input[data-act="pos-bottom"]')) {
      const cur = readFooterPosition();
      const next = { ...cur, mode: 'normal', bottom: 0 };
      localStorage.setItem(LS_POS, JSON.stringify(next));
      setFooterPositionViaRuntime(next);
      applyFooterPositionUI(rootEl, next);
      return;
    }
    if (el.matches('input[data-act="pos-z"]')) {
      const cur = readFooterPosition();
      const next = { ...cur, mode: 'normal', z: parseInt(el.value || "10", 10) };
      localStorage.setItem(LS_POS, JSON.stringify(next));
      setFooterPositionViaRuntime(next);
      applyFooterPositionUI(rootEl, next);
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

export function initSiteFooterWidget() {
  const found = findFooterAccordionMount();
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
