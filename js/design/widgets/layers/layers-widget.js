// js/design/widgets/layers/layers-widget.js
// 00918 — Віджет "Слої / Межі" працює через спільний SiteFrameStore-контракт для Main.
// Мета: керувати z-index, overflow та поведінкою дитини відносно батьківського блока.

const SEC_ID = 'st-layers-widget-section';

function ensureCssOnce() {
  if (document.getElementById('st-layers-widget-css')) return;
  const style = document.createElement('style');
  style.id = 'st-layers-widget-css';
  style.textContent = `
    #${SEC_ID} .stlw-wrap{display:flex;flex-direction:column;gap:10px;}
    #${SEC_ID} .stlw-note{font-size:12px;line-height:1.45;color:rgba(226,232,240,.72);padding:9px 10px;border-radius:12px;background:rgba(15,23,42,.38);border:1px solid rgba(148,163,184,.18);}
    #${SEC_ID} .stlw-box{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:14px;background:rgba(15,23,42,.28);border:1px solid rgba(148,163,184,.18);}
    #${SEC_ID} .stlw-title{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#bae6fd;}
    #${SEC_ID} .stlw-row{display:flex;align-items:center;gap:8px;min-width:0;}
    #${SEC_ID} .stlw-row--wrap{flex-wrap:wrap;}
    #${SEC_ID} .stlw-row label{font-size:12px;color:#e5e7eb;}
    #${SEC_ID} .stlw-input,#${SEC_ID} .stlw-select{height:32px;min-width:0;border-radius:10px;border:1px solid rgba(148,163,184,.32);background:#ffffff;color:#0f172a;padding:0 9px;font-weight:800;}
    #${SEC_ID} .stlw-input{width:86px;}
    #${SEC_ID} .stlw-select{flex:1;}
    #${SEC_ID} .stlw-btn{height:32px;border:0;border-radius:10px;padding:0 10px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:white;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 8px 22px rgba(37,99,235,.18);}
    #${SEC_ID} .stlw-btn:hover{filter:brightness(1.08);}
    #${SEC_ID} .stlw-btn.is-active{background:linear-gradient(135deg,#22c55e,#16a34a);color:#052e16;border:1px solid rgba(187,247,208,.95);box-shadow:0 0 0 2px rgba(34,197,94,.22),0 10px 26px rgba(34,197,94,.22);}
    #${SEC_ID} .stlw-btn--ghost{background:rgba(148,163,184,.16);box-shadow:none;color:#e5e7eb;border:1px solid rgba(148,163,184,.22);}
    #${SEC_ID} .stlw-btn--danger{background:linear-gradient(135deg,#ef4444,#b91c1c);}
    #${SEC_ID} .stlw-check{display:flex;align-items:flex-start;gap:8px;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.16);}
    #${SEC_ID} .stlw-check input{margin-top:2px;accent-color:#22c55e;}
    #${SEC_ID} .stlw-check b{display:block;font-size:12px;color:#f8fafc;}
    #${SEC_ID} .stlw-check span{display:block;margin-top:2px;font-size:11px;line-height:1.35;color:rgba(226,232,240,.68);}
    #${SEC_ID} .stlw-status{font-size:12px;color:#a7f3d0;min-height:18px;}
  `;
  document.head.appendChild(style);
}

function num(v, fallback = 0) {
  const n = parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

function getKind(el) {
  if (!el) return 'елемент';
  if (el.classList?.contains('st-section')) return 'секція';
  if (el.classList?.contains('st-row')) return 'рівень';
  if (el.classList?.contains('st-block')) return 'блок';
  return (el.tagName || 'елемент').toLowerCase();
}

function isStaticPosition(el) {
  try { return getComputedStyle(el).position === 'static'; } catch (_) { return true; }
}

function ensurePositionForZ(el) {
  if (!el) return;
  if (isStaticPosition(el)) el.style.position = 'relative';
}

function persist(reason = 'layers-widget', targets = []) {
  const cleanTargets = [...new Set((targets || []).filter((el) => el instanceof HTMLElement && el.isConnected))];
  const mainTargets = cleanTargets.filter((el) => el.closest?.('#st-site-main-slot'));
  const legacyTargets = cleanTargets.filter((el) => !el.closest?.('#st-site-main-slot'));
  if (mainTargets.length) {
    try {
      window.dispatchEvent(new CustomEvent('st:layers-widget:applied', {
        detail: { reason, targets: mainTargets, target: mainTargets[0] || null, commit: true }
      }));
    } catch (_) {}
  }
  if (!legacyTargets.length) {
    try { document.dispatchEvent(new Event('st:selection-changed')); } catch (_) {}
    return;
  }
  try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason }); } catch (_) {}
  try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason } })); } catch (_) {}
  try { document.dispatchEvent(new Event('st:selection-changed')); } catch (_) {}
}

function targetParentBlock(el) {
  try {
    const row = el?.parentElement?.closest?.('.st-row');
    const parentBlock = row?.closest?.('.st-block');
    return parentBlock && parentBlock !== el ? parentBlock : null;
  } catch (_) { return null; }
}

export function initLayersWidget(host, getSelection) {
  if (!host || host.querySelector(`#${SEC_ID}`)) return;
  ensureCssOnce();

  const section = document.createElement('section');
  section.className = 'design-section';
  section.id = SEC_ID;
  section.dataset.widget = 'layers';
  section.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title"><span>Слої / Межі</span></div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body" hidden>
      <div class="stlw-wrap">
        <div class="stlw-note" data-info>Вибери блок або секцію. Для кількох елементів використовуй Shift / Ctrl.</div>

        <div class="stlw-box">
          <div class="stlw-title">Пріоритет слоя</div>
          <div class="stlw-row">
            <label for="stlw-z">z-index</label>
            <input id="stlw-z" class="stlw-input" data-z type="number" step="1" placeholder="auto">
            <button class="stlw-btn" type="button" data-apply-z>Застосувати</button>
          </div>
          <div class="stlw-row stlw-row--wrap">
            <button class="stlw-btn stlw-btn--ghost" type="button" data-layer="back">Назад</button>
            <button class="stlw-btn stlw-btn--ghost" type="button" data-layer="forward">Вперед</button>
            <button class="stlw-btn stlw-btn--ghost" type="button" data-layer="bottom">В самий низ</button>
            <button class="stlw-btn stlw-btn--ghost" type="button" data-layer="top">В самий верх</button>
          </div>
        </div>

        <div class="stlw-box">
          <div class="stlw-title">Перекриття / обрізання</div>
          <div class="stlw-row">
            <label for="stlw-overflow">Overflow</label>
            <select id="stlw-overflow" class="stlw-select" data-overflow>
              <option value="">Не змінювати</option>
              <option value="visible">Показувати зовні</option>
              <option value="hidden">Обрізати по межах</option>
              <option value="clip">Clip</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <label class="stlw-check">
            <input type="checkbox" data-lock-parent>
            <span><b>Не виходити за батьківський блок</b><span>Якщо увімкнено, при ручному ресайзі дитина підштовхує батьківський блок і той росте разом із нею.</span></span>
          </label>
        </div>

        <div class="stlw-box">
          <div class="stlw-title">Бордер батька</div>
          <div class="stlw-row stlw-row--wrap">
            <button class="stlw-btn stlw-btn--ghost" type="button" data-border-mode="under">Сховати під бордером</button>
            <button class="stlw-btn" type="button" data-border-mode="over">Поверх бордера</button>
          </div>
        </div>

        <div class="stlw-status" data-status></div>
      </div>
    </div>
  `;
  host.appendChild(section);

  const body = section.querySelector('.design-section__body');
  section.querySelector('.design-section__header')?.addEventListener('click', () => {
    const open = !section.classList.contains('is-open');
    section.classList.toggle('is-open', open);
    if (body) body.hidden = !open;
  });

  const ui = {
    info: section.querySelector('[data-info]'),
    z: section.querySelector('[data-z]'),
    overflow: section.querySelector('[data-overflow]'),
    lock: section.querySelector('[data-lock-parent]'),
    status: section.querySelector('[data-status]'),
    borderUnder: section.querySelector('[data-border-mode="under"]'),
    borderOver: section.querySelector('[data-border-mode="over"]'),
  };

  let lastTargets = [];

  const collectTargets = () => {
    const sel = getSelection?.() || window.ST_SELECTION?.get?.() || null;
    const arr = Array.isArray(sel?.elements) ? sel.elements : [];
    return [...new Set(arr.filter((el) => {
      if (!el || el.nodeType !== 1) return false;
      if (el.closest?.('.hb-panel, .fb-panel, #design-panel-root')) return false;
      return el.classList?.contains('st-section') || el.classList?.contains('st-row') || el.classList?.contains('st-block') || el.classList?.contains('st-png__media') || el.classList?.contains('st-logo__mark') || el.classList?.contains('st-button__label') || el.classList?.contains('st-button__iconbtn');
    }))];
  };

  const getTargets = ({ allowCache = false } = {}) => {
    const fresh = collectTargets();
    if (fresh.length) {
      lastTargets = fresh;
      return fresh;
    }
    if (allowCache) {
      lastTargets = lastTargets.filter((el) => el && el.isConnected);
      return lastTargets;
    }
    return [];
  };

  const setStatus = (text) => {
    if (!ui.status) return;
    ui.status.textContent = text || '';
    if (text) window.setTimeout(() => { if (ui.status.textContent === text) ui.status.textContent = ''; }, 2200);
  };

  const syncBorderButtons = (first) => {
    const mode = String(first?.dataset?.stBorderLayerMode || '').trim();
    ui.borderUnder?.classList.toggle('is-active', mode === 'under');
    ui.borderOver?.classList.toggle('is-active', mode === 'over');
  };

  const sync = () => {
    const targets = getTargets();
    const first = targets[0] || null;
    if (ui.info) ui.info.textContent = targets.length
      ? `Вибрано: ${targets.length}. Активний: ${getKind(first)}${first?.dataset?.uid ? ' / ' + first.dataset.uid : ''}`
      : 'Вибери блок або секцію. Для кількох елементів використовуй Shift / Ctrl.';
    if (!first) {
      if (ui.z) ui.z.value = '';
      if (ui.overflow) ui.overflow.value = '';
      if (ui.lock) ui.lock.checked = false;
      syncBorderButtons(null);
      return;
    }
    if (ui.z) ui.z.value = (first.style.zIndex || '').trim();
    if (ui.overflow) ui.overflow.value = (first.style.overflow || '').trim();
    if (ui.lock) ui.lock.checked = String(first.dataset?.stLockToParent || '') === '1';
    syncBorderButtons(first);
  };

  section.addEventListener('click', (ev) => {
    const targets = getTargets({ allowCache: true });
    if (!targets.length) return;

    const layerBtn = ev.target.closest('[data-layer]');
    if (layerBtn) {
      const action = layerBtn.dataset.layer;
      targets.forEach((el) => {
        ensurePositionForZ(el);
        const cur = num(el.style.zIndex, 0);
        if (action === 'forward') el.style.zIndex = String(cur + 1);
        if (action === 'back') el.style.zIndex = String(cur - 1);
        if (action === 'top') el.style.zIndex = '999';
        if (action === 'bottom') el.style.zIndex = '-1';
      });
      persist('layers-z-order-00918', targets);
      setStatus('Слой оновлено');
      sync();
      return;
    }

    const applyZ = ev.target.closest('[data-apply-z]');
    if (applyZ) {
      const value = String(ui.z?.value || '').trim();
      targets.forEach((el) => {
        if (value === '') el.style.zIndex = '';
        else { ensurePositionForZ(el); el.style.zIndex = String(num(value, 0)); }
      });
      persist('layers-z-index-00918', targets);
      setStatus('z-index застосовано');
      sync();
      return;
    }

    const borderMode = ev.target.closest('[data-border-mode]');
    if (borderMode) {
      const mode = borderMode.dataset.borderMode;
      const changed = new Set(targets);
      targets.forEach((el) => {
        const parent = targetParentBlock(el) || el.parentElement?.closest?.('.st-section') || null;
        if (parent) changed.add(parent);
        el.dataset.stBorderLayerMode = mode;
        if (mode === 'under') {
          if (parent) parent.style.overflow = 'hidden';
          ensurePositionForZ(el);
          el.style.zIndex = '0';
        }
        if (mode === 'over') {
          if (parent) parent.style.overflow = 'visible';
          ensurePositionForZ(el);
          el.style.zIndex = '50';
        }
      });
      persist('layers-border-mode-00918', [...changed]);
      setStatus(mode === 'over' ? 'Елемент поверх бордера' : 'Елемент обрізається батьком');
      syncBorderButtons(targets[0] || null);
      return;
    }
  });

  ui.overflow?.addEventListener('change', () => {
    const value = String(ui.overflow.value || '').trim();
    const targets = getTargets({ allowCache: true });
    targets.forEach((el) => { el.style.overflow = value; });
    persist('layers-overflow-00918', targets);
    setStatus('Overflow оновлено');
  });

  ui.lock?.addEventListener('change', () => {
    const checked = !!ui.lock.checked;
    const targets = getTargets({ allowCache: true });
    const changed = new Set(targets);
    targets.forEach((el) => {
      el.dataset.stLockToParent = checked ? '1' : '0';
      if (checked) {
        try {
          const row = el.parentElement?.closest?.('.st-row');
          const parent = row?.closest?.('.st-block');
          if (parent && parent !== el) {
            parent.dataset.stParentAutoGrowFrozen = '0';
            changed.add(parent);
          }
        } catch (_) {}
      }
    });
    persist('layers-lock-parent-00918', [...changed]);
    setStatus(checked ? 'Увімкнено авто-розтягування батька' : 'Авто-розтягування батька вимкнено');
    sync();
  });

  ui.z?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    section.querySelector('[data-apply-z]')?.click();
  });

  document.addEventListener('st:selection-changed', sync);
  sync();
}
