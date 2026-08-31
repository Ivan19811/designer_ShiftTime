// js/design/widgets/animator/animator-accordion-widget.js
// Акордеон в інспекторі "Дизайн": "Анімація" → кнопка "Відкрити в АНІМАТОРІ".
// Важливо: тільки UI-хук. Нічого не ламаємо в існуючій логіці конструктора.

const SEC_ID = 'st-animator-accordion';

function buildSection(){
  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.id = SEC_ID;

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button" aria-expanded="false">
      <div class="design-section__header-title"><span>Анімація</span></div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body">
      <div class="st-anm-card">
        <div class="st-anm-target" data-role="target" hidden>
          <div class="st-anm-target__row"><span class="st-anm-target__label">Тип блоку:</span> <span class="st-anm-target__val" data-role="type">—</span></div>
          <div class="st-anm-target__row"><span class="st-anm-target__label">Назва:</span> <span class="st-anm-target__val" data-role="name">—</span></div>
        </div>
        <button class="st-btn" type="button" data-act="open">Відкрити в АНІМАТОРІ</button>
      </div>
    </div>

    <style>
      #${SEC_ID} .st-anm-card{
        border:1px solid rgba(148,163,184,0.20);
        border-radius:12px;
        padding:12px;
        background:rgba(15,23,42,0.04);
      }
      #${SEC_ID} .st-anm-target{
        margin:0 0 10px 0;
        padding:8px 10px;
        border:1px dashed rgba(148,163,184,0.35);
        border-radius:10px;
        background:rgba(15,23,42,0.03);
        font-size:12px;
        line-height:1.25;
      }
      #${SEC_ID} .st-anm-target__row{ display:flex; gap:6px; margin:2px 0; }
      #${SEC_ID} .st-anm-target__label{ opacity:0.75; white-space:nowrap; }
      #${SEC_ID} .st-anm-target__val{ font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      
      #${SEC_ID} .st-btn{
        width:100%;
        border:1px solid rgba(148,163,184,0.28);
        background:rgba(255,255,255,0.65);
        border-radius:10px;
        padding:10px 10px;
        font-weight:700;
        font-size:12px;
        cursor:pointer;
        letter-spacing: .2px;
      }
      #${SEC_ID} .st-btn:hover{ background:rgba(255,255,255,0.80); }
    </style>
  `.trim();

  return sectionEl;
}

export function initAnimatorAccordionWidget(host){
  if (!host) return;
  if (host.querySelector(`#${CSS.escape(SEC_ID)}`)) return;

  const sectionEl = buildSection();

  // Вставляємо ПІСЛЯ "Конструктор меню" якщо він є, інакше просто в кінець.
  const menuSec = host.querySelector('#st-menu-builder-accordion');
  if (menuSec && menuSec.parentNode === host) {
    menuSec.insertAdjacentElement('afterend', sectionEl);
  } else {
    host.appendChild(sectionEl);
  }

  const openBtn = sectionEl.querySelector('[data-act="open"]');
  if (openBtn){
    openBtn.addEventListener('click', () => {
      try {
        window.dispatchEvent(new CustomEvent('st:open-animator', { detail: { source: 'design-inspector' } }));
      } catch {}
    });
  }

// --- Selected target info (Section / Container / Block) ---
  const targetBox = sectionEl.querySelector('[data-role="target"]');
  const typeVal = sectionEl.querySelector('[data-role="type"]');
  const nameVal = sectionEl.querySelector('[data-role="name"]');

  function uaTypeLabel(t){
    if (t === 'section') return 'Секція';
    if (t === 'row') return 'Контейнер';
    if (t === 'block') return 'Блок';
    return null;
  }

  function ordinalIn(el, selector){
    const rootEl = document.getElementById('site-root') || document;
    const all = Array.from(rootEl.querySelectorAll(selector));
    const idx = all.indexOf(el);
    return idx >= 0 ? (idx + 1) : null;
  }

  
  function findTreeLabelForSelection(t, el){
    try{
      // Tree in "Налаштування" панелі рендерить рядки з data-row-id / data-block-id
      // (див. panel-page-tree.js). Беремо рівно той підпис, який бачить користувач у дереві.
      const treeRoot = document.getElementById('page-tree-root') || document.body;

      // 1) BLOCK → шукаємо по data-block-id
      if (t === 'block'){
        const bid = (el && el.dataset && el.dataset.uid) ? String(el.dataset.uid) : '';
        if (bid){
          const head = treeRoot.querySelector(`[data-block-id="${CSS.escape(bid)}"]`);
          if (head){
            const left = head.querySelector('span');
            const label = (left ? left.textContent : head.textContent) || '';
            return label.trim() || null;
          }
        }
      }

      // 2) ROW / SECTION → у дереві це "row" нода з data-row-id.
      // Для section беремо головний row всередині секції.
      if (t === 'row' || t === 'section'){
        let rid = '';
        if (t === 'row'){
          rid = (el && el.dataset && el.dataset.uid) ? String(el.dataset.uid) : '';
        } else {
          const mainRow = el && el.querySelector ? el.querySelector(':scope > .st-row') : null;
          rid = (mainRow && mainRow.dataset && mainRow.dataset.uid) ? String(mainRow.dataset.uid) : '';
        }
        if (rid){
          const head = treeRoot.querySelector(`[data-row-id="${CSS.escape(rid)}"]`);
          if (head){
            const left = head.querySelector('span');
            const label = (left ? left.textContent : head.textContent) || '';
            return label.trim() || null;
          }
        }
      }
    } catch {}
    return null;
  }

function computeDisplayName(t, el){
    const treeLabel = findTreeLabelForSelection(t, el);
    if (treeLabel) return treeLabel;

    if (!el) return '—';
    const attr = (k) => (el.getAttribute(k) || '').trim();
    const ds = el.dataset || {};
    const byAttr =
      (ds.name && String(ds.name).trim()) ||
      (ds.title && String(ds.title).trim()) ||
      attr('data-name') ||
      attr('data-title') ||
      attr('aria-label') ||
      (el.id && String(el.id).trim());

    if (byAttr) return byAttr;

    // If it's a text block and has visible text — show short snippet
    const txt = (el.textContent || '').trim().replace(/\s+/g,' ');
    if (t === 'block' && txt) return txt.slice(0, 24) + (txt.length > 24 ? '…' : '');

    if (t === 'section'){
      const n = ordinalIn(el, '.st-section');
      return n ? `Секція ${n}` : 'Секція';
    }
    if (t === 'row'){
      const n = ordinalIn(el, '.st-row');
      return n ? `Контейнер ${n}` : 'Контейнер';
    }
    if (t === 'block'){
      const n = ordinalIn(el, '.st-block');
      return n ? `Блок ${n}` : 'Блок';
    }
    return '—';
  }

  function updateTarget(sel){
    const t = sel && sel.type;
    const label = uaTypeLabel(t);
    let el = sel && sel.elements && sel.elements[0];
    if (!label || !el){
      if (targetBox) targetBox.hidden = true;
      return;
    }
    // Normalize selection to the correct target element.
    // Selection may point to a nested node inside the target.
    if (t === 'section'){
      const maybe = el && el.closest ? el.closest('.st-section') : null;
      if (maybe) el = maybe;
    } else if (t === 'container'){
      const maybe = el && el.closest ? el.closest('.st-row') : null;
      if (maybe) el = maybe;
    } else if (t === 'block'){
      const maybe = el && el.closest ? el.closest('.st-block') : null;
      if (maybe) el = maybe;
    }

    if (typeVal) typeVal.textContent = label;
    if (nameVal) nameVal.textContent = computeDisplayName(t, el);
    if (targetBox) targetBox.hidden = false;
  }

  document.addEventListener('st:selection-changed', (ev) => {
    try { updateTarget(ev.detail); } catch {}
  });

  // initial fill (if already selected)
  try {
    if (window.ST_SELECTION && typeof window.ST_SELECTION.get === 'function'){
      updateTarget(window.ST_SELECTION.get());
    }
  } catch {}

}
