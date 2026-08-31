// js/selection/selection-manager.js
// ЄДИНЕ джерело правди для selection/active.
// HEADER-ONE-INSTANCE-2025

export function initSelectionManager() {
  if (window.ST_SELECTION) return window.ST_SELECTION;

  const STAGE4_SELECTION_VERSION = '00922';
  function logSelectionStage4_(event, detail = {}, level = 'info') {
    try { window.__ST_PERF_DIAG__?.push?.(event, Object.assign({ v: STAGE4_SELECTION_VERSION, manager: 'selection-clean-base' }, detail || {}), level); } catch (_) {}
    try { window.__ST_AI_DEBUG_LOG__?.perf?.(event, Object.assign({ v: STAGE4_SELECTION_VERSION }, detail || {}), level); } catch (_) {}
  }

  // ✅ У дизайні при кліку підсвічуємо ТІЛЬКИ елемент під курсором,
  // без предків (section/container/etc). Це прибирає ефект "фарбується все дерево".
  function clearAncestorsSelection_(el) {
    let p = el && el.parentElement;
    while (p) {
      if (
        p.classList &&
        (p.classList.contains('st-block') ||
          p.classList.contains('st-section') ||
          p.classList.contains('st-row'))
      ) {
        p.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
      }
      p = p.parentElement;
    }
  }


  function scopeOfElement00453_(el) {
    try {
      if (el?.closest?.('#st-site-footer-slot, .st-site-footer-slot')) return 'footer';
      if (el?.closest?.('#st-site-header-slot, .st-site-header-slot')) return 'header';
      if (el?.closest?.('#st-site-main-slot, .st-site-main-slot')) return 'main';
    } catch (_) {}
    return '';
  }

  function clearOppositeComponentSelection00453_(scope) {
    try {
      const ids = ['st-site-header-slot', 'st-site-main-slot', 'st-site-footer-slot']
        .filter((id) => id !== `st-site-${scope}-slot`);
      ids.forEach((otherId) => {
        const slot = document.getElementById(otherId);
        if (!slot) return;
        slot.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
        slot.querySelectorAll('.is-selected,.is-active,.hb-dom-selected,.hb-dom-active')
          .forEach((n) => { if (!n.closest?.('.hb-panel,.fb-panel')) n.classList.remove('is-selected','is-active','hb-dom-selected','hb-dom-active'); });
      });
    } catch (_) {}
  }

  function publishSelectionTarget00453_(el) {
    try {
      const scope = scopeOfElement00453_(el);
      if (!scope) return;
      window.__ST_LAYOUT_ACTIVE_SCOPE_00451 = scope;
      window.__ST_DESIGN_ACTIVE_SCOPE_00453 = scope;
      window.__ST_LAYOUT_ACTIVE_EL_00453 = el;
      window.__ST_DESIGN_ACTIVE_EL_00453 = el;
      clearOppositeComponentSelection00453_(scope);
    } catch (_) {}
  }

  const api = {
    get() {
      const root = document.getElementById('site-root');
      const headerSlot = document.getElementById('st-site-header-slot');
      const footerSlot = document.getElementById('st-site-footer-slot');
      if (!root && !headerSlot && !footerSlot) return null;

      // [00453] Header/Footer selection must follow the real active component.
      // Раніше Header перевірявся першим, тому stale .is-active у Header міг
      // перехопити всі дизайн-віджети під час редагування Footer.
      function makeScopedSelection00453_(type, el, slotKey, slot) {
        if (!el) return null;
        const out = { type, element: el, el, elements: [el] };
        if (slotKey && slot) out[slotKey] = slot;
        return out;
      }

      function resolveHeaderFooterSelection00453_(scopeName) {
        const isFooter = scopeName === 'footer';
        const slot = isFooter ? footerSlot : headerSlot;
        if (!slot) return null;
        const innerType = isFooter ? 'footer-inner' : 'header-inner';
        const rootType = isFooter ? 'footer' : 'header';
        const slotKey = isFooter ? 'footerSlot' : 'headerSlot';
        const panelSel = '.hb-panel,.fb-panel';

        try {
          const forced = window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453;
          if (forced instanceof HTMLElement && slot.contains(forced) && !forced.closest(panelSel)) {
            return makeScopedSelection00453_(innerType, forced, slotKey, slot);
          }
        } catch (_) {}

        const rootEl = slot.querySelector(isFooter ? 'section.st-section[data-sec-role="footer"]' : 'section.st-section[data-sec-role="header"]')
          || Array.from(slot.children).find(ch => ch && ch.tagName === 'SECTION')
          || null;

        const innerActive = Array.from(slot.querySelectorAll('.is-active,.hb-dom-active'))
          .filter(el => !el.closest(panelSel))[0] || null;
        if (innerActive) return makeScopedSelection00453_(innerType, innerActive, slotKey, slot);

        const innerSelected = Array.from(slot.querySelectorAll('.is-selected,.hb-dom-selected'))
          .filter(el => !el.closest(panelSel));
        if (innerSelected.length) return makeScopedSelection00453_(innerType, innerSelected[0], slotKey, slot);

        if (slot.classList.contains('is-active') || slot.classList.contains('is-selected')) {
          return makeScopedSelection00453_(rootType, rootEl || slot, slotKey, slot);
        }
        return null;
      }

      const preferredScope00453 = (() => {
        try {
          if (document.body.classList.contains('st-footer-builder-on')) return 'footer';
          if (document.body.classList.contains('st-header-builder-on')) return 'header';
        } catch (_) {}
        try {
          const s = String(window.__ST_DESIGN_ACTIVE_SCOPE_00453 || window.__ST_LAYOUT_ACTIVE_SCOPE_00451 || '');
          if (s === 'footer' || s === 'header' || s === 'main') return s;
        } catch (_) {}
        return '';
      })();

      function makeRemovedContentSelectionStage4_() { return null; }


      if (preferredScope00453 === 'main') {
        const forced = window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453;
        if (forced instanceof HTMLElement && forced.isConnected && scopeOfElement00453_(forced) === 'main') {
          return { type: 'main-inner', element: forced, el: forced, elements: [forced] };
        }
      }
      if (preferredScope00453 === 'footer') {
        const fs = resolveHeaderFooterSelection00453_('footer');
        if (fs) return fs;
        const hs = resolveHeaderFooterSelection00453_('header');
        if (hs) return hs;
      }
      if (preferredScope00453 === 'header') {
        const hs = resolveHeaderFooterSelection00453_('header');
        if (hs) return hs;
        const fs = resolveHeaderFooterSelection00453_('footer');
        if (fs) return fs;
      }

      // ---- HEADER ----
      // ✅ Слот — лише контейнер. Повертаємо реальну header-секцію/елемент всередині,
      // щоб не було подвійних шарів (slot + section) з різними радіусами/фонами.
      if (headerSlot) {
        const headerRoot = headerSlot.querySelector('section.st-section[data-sec-role="header"]')
          || Array.from(headerSlot.children).find(ch => ch && ch.tagName === 'SECTION')
          || null;

        const innerActive = Array.from(headerSlot.querySelectorAll('.is-active'))
          .filter(el => !el.closest('.hb-panel'))[0] || null;
        // 00225: active element must be the source of truth.
        // If an old selected ancestor/child remains in header, Layout must not edit it instead
        // of the element the user is currently editing.
        if (innerActive) return { type: 'header-inner', elements: [innerActive] };

        const innerSelected = Array.from(headerSlot.querySelectorAll('.is-selected'))
          .filter(el => !el.closest('.hb-panel'));
        if (innerSelected.length) return { type: 'header-inner', elements: innerSelected };

        if (headerSlot.classList.contains('is-active') || headerSlot.classList.contains('is-selected')) {
          if (headerRoot) return { type: 'header', elements: [headerRoot] };
          // fallback
          return { type: 'header', elements: [headerSlot] };
        }
      }


      // ---- FOOTER ----
      // ✅ Слот — лише контейнер. Повертаємо реальну footer-секцію/елемент всередині,
      // щоб не було подвійних шарів (slot + section) з різними радіусами/фонами.
      if (footerSlot) {
        const footerRoot = footerSlot.querySelector('section.st-section[data-sec-role="footer"]')
          || Array.from(footerSlot.children).find(ch => ch && ch.tagName === 'SECTION')
          || null;

        const innerActive = Array.from(footerSlot.querySelectorAll('.is-active'))
          .filter(el => !el.closest('.hb-panel') && !el.closest('.fb-panel'))[0] || null;
        // 00225: active element must be the source of truth for footer too.
        if (innerActive) return { type: 'footer-inner', elements: [innerActive] };

        const innerSelected = Array.from(footerSlot.querySelectorAll('.is-selected'))
          .filter(el => !el.closest('.hb-panel') && !el.closest('.fb-panel'));
        if (innerSelected.length) return { type: 'footer-inner', elements: innerSelected };

        if (footerSlot.classList.contains('is-active') || footerSlot.classList.contains('is-selected')) {
          if (footerRoot) return { type: 'footer', elements: [footerRoot] };
          // fallback
          return { type: 'footer', elements: [footerSlot] };
        }
      }

      if (!root) return null;

      // ---- CANVAS ----
      const blocks = Array.from(root.querySelectorAll('.st-block.is-selected'));
      const sections = Array.from(root.querySelectorAll('.st-section.is-selected'));
      const rows = Array.from(root.querySelectorAll('.st-row.is-selected'));

      if (blocks.length) return { type: 'block', elements: blocks };
      if (sections.length) return { type: 'section', elements: sections };
      if (rows.length) return { type: 'row', elements: rows };

      const activeBlock = root.querySelector('.st-block.is-active');
      if (activeBlock) return { type: 'block', elements: [activeBlock] };
      const activeRow = root.querySelector('.st-row.is-active');
      if (activeRow) return { type: 'row', elements: [activeRow] };
      const activeSection = root.querySelector('.st-section.is-active');
      if (activeSection) return { type: 'section', elements: [activeSection] };

      return null;
    },

    clear({ keepHeader = false, keepFooter = false } = {}) {
      const root = document.getElementById('site-root');
      if (root) {
        root.querySelectorAll('.st-block.is-selected, .st-section.is-selected, .st-row.is-selected, .hb-dom-selected')
          .forEach(el => el.classList.remove('is-selected', 'hb-dom-selected'));
        root.querySelectorAll('.st-block.is-active, .st-section.is-active, .st-row.is-active, .hb-dom-active')
          .forEach(el => el.classList.remove('is-active', 'hb-dom-active'));
      }

      if (!keepHeader) {
        const headerSlot = document.getElementById('st-site-header-slot');
      const footerSlot = document.getElementById('st-site-footer-slot');
        if (headerSlot) {
          headerSlot.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
          headerSlot.querySelectorAll('.is-selected, .is-active, .hb-dom-selected, .hb-dom-active')
            .forEach(el => {
              if (!el.closest('.hb-panel')) {
                el.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
              }
            });
        }
      }

      if (!keepFooter) {
        const footerSlot = document.getElementById('st-site-footer-slot');
        if (footerSlot) {
          footerSlot.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
          footerSlot.querySelectorAll('.is-selected, .is-active, .hb-dom-selected, .hb-dom-active')
            .forEach(el => {
              if (!el.closest('.hb-panel') && !el.closest('.fb-panel')) {
                el.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
              }
            });
        }
      }

    },

    setSingle(el, { type = 'auto', headerSlot = null, footerSlot = null } = {}) {
      this.clear();
      if (!el) return this.emit();

      // ❗ Службові обгортки не можуть бути selection-таргетами.
      if (el.id === 'st-site-header-slot' || el.classList?.contains('st-site-header-slot')) {
        const headerRoot = el.querySelector?.('section.st-section') || el.firstElementChild;
        if (headerRoot) el = headerRoot;
        else return this.emit();
      }
      if (el.id === 'st-site-footer-slot' || el.classList?.contains('st-site-footer-slot')) {
        const footerRoot = el.querySelector?.('section.st-section') || el.firstElementChild;
        if (footerRoot) el = footerRoot;
        else return this.emit();
      }
      if (el.closest?.('.hb-panel') || el.closest?.('.fb-panel')) return this.emit();

      publishSelectionTarget00453_(el);
      el.classList.add('is-selected', 'is-active', 'hb-dom-selected', 'hb-dom-active');
      // ✅ Важливо: прибираємо активність/виділення у предків.
      clearAncestorsSelection_(el);
      if (headerSlot) headerSlot.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
      if (footerSlot) footerSlot.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
      return this.emit(type, [el]);
    },

    setMany(elements = [], { type = 'auto' } = {}) {
      this.clear();
      const safe = Array.from(elements || []).filter((el) => {
        if (!el) return false;
        if (el.id === 'st-site-header-slot' || el.classList?.contains('st-site-header-slot')) return false;
        if (el.id === 'st-site-footer-slot' || el.classList?.contains('st-site-footer-slot')) return false;
        if (el.closest?.('.hb-panel') || el.closest?.('.fb-panel')) return false;
        return true;
      });

      safe.forEach((el, index) => {
        el.classList.add('is-selected', 'hb-dom-selected');
        if (index === 0) {
          el.classList.add('is-active', 'hb-dom-active');
        } else {
          el.classList.remove('is-active', 'hb-dom-active');
        }
        clearAncestorsSelection_(el);
      });

      const headerSlot = document.getElementById('st-site-header-slot');
      const footerSlot = document.getElementById('st-site-footer-slot');
      if (headerSlot) headerSlot.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
      if (footerSlot) footerSlot.classList.remove('is-selected', 'is-active', 'hb-dom-active', 'hb-dom-selected');
      if (safe[0]) publishSelectionTarget00453_(safe[0]);
      return this.emit(type, safe);
    },

    toggleMulti(el) {
      if (!el) return this.emit();
      const selected = el.classList.contains('is-selected');
      if (selected) {
        el.classList.remove('is-selected', 'hb-dom-selected');
        el.classList.remove('is-active', 'hb-dom-active');
      } else {
        document.querySelectorAll(
          '#st-site-header-slot .is-active, #st-site-header-slot .hb-dom-active,' +
          '#st-site-main-slot .is-active, #st-site-main-slot .hb-dom-active,' +
          '#st-site-footer-slot .is-active, #st-site-footer-slot .hb-dom-active'
        ).forEach((node) => node.classList.remove('is-active', 'hb-dom-active'));
        el.classList.add('is-selected', 'hb-dom-selected');
        el.classList.add('is-active', 'hb-dom-active');
        // ✅ І у multi теж не підсвічуємо предків.
        clearAncestorsSelection_(el);
        publishSelectionTarget00453_(el);
      }
      return this.emit();
    },

    emit(type = null, elements = null) {
      const sel = elements ? { type: type || 'custom', elements } : this.get();
      try {
        const first = Array.isArray(sel?.elements) ? sel.elements[0] : null;
        let scope = '';
        if (first?.closest?.('#st-site-footer-slot, .st-site-footer-slot')) scope = 'footer';
        else if (first?.closest?.('#st-site-header-slot, .st-site-header-slot')) scope = 'header';
        else if (first?.closest?.('#site-root')) scope = 'main';
        if (scope) {
          window.__ST_LAYOUT_ACTIVE_SCOPE_00451 = scope;
          window.__ST_DESIGN_ACTIVE_SCOPE_00453 = scope;
          window.__ST_LAYOUT_ACTIVE_EL_00453 = first || null;
          window.__ST_DESIGN_ACTIVE_EL_00453 = first || null;
        } else if (!first) {
          window.__ST_LAYOUT_ACTIVE_EL_00453 = null;
          window.__ST_DESIGN_ACTIVE_EL_00453 = null;
        }
      } catch (_) {}
      document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: sel }));
      return sel;
    },
  };

  window.ST_SELECTION = api;
  return api;
}
