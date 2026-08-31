// js/site-frame/site-frame-explicit-persistence.js
// 00876: explicit Header/Footer legacy HTML output behind SiteFrameStore authority.
// No MutationObserver, debounce timer, retry loop, autosave, or compatibility alias.

(() => {
  'use strict';

  const VERSION = '00876-site-frame-explicit-persistence-output-sink';
  const AREA_CONFIG = Object.freeze({
    header: Object.freeze({
      hostId: 'st-site-header-slot',
      stateKey: 'ST_HEADER_STATE',
      runtimeKey: 'SiteHeaderRuntime',
    }),
    footer: Object.freeze({
      hostId: 'st-site-footer-slot',
      stateKey: 'ST_FOOTER_STATE',
      runtimeKey: 'SiteFooterRuntime',
    }),
  });

  const TECHNICAL_SELECTORS = [
    '.st-resize',
    '.st-resize-handle',
    '.st-section-handle',
    '.st-block-handle',
    '.st-drag-handle',
    '.st-drag-marker',
    '.st-drop-marker',
    '.st-col-resizer',
    '.st-sec-resizer',
    '.hb-panel',
    '.fb-panel',
    '.st-selection-ui',
  ].join(',');

  const TECHNICAL_CLASSES = Object.freeze([
    'is-active',
    'is-selected',
    'hb-dom-selected',
    'hb-dom-active',
    'fb-dom-selected',
    'fb-dom-active',
    'sf-edit-selected',
    'sf-selection-current',
    'sf-selection-front-path',
    'sf-selection-static-position',
    'sf-main-drag-source',
    'st-header-level-runtime-dragging',
    'st-header-level-runtime-drop-empty',
    'st-header-level-runtime-drop-inside',
    'st-header-level-runtime-drop-after',
    'st-header-level-runtime-drop-before',
    'st-header-container-runtime-dragging',
    'st-header-container-runtime-drop-empty',
    'st-header-container-runtime-drop-inside',
    'st-header-container-runtime-drop-after',
    'st-header-container-runtime-drop-before',
  ]);

  const lastCommittedHTML = new Map();
  const committingAreas = new Set();

  function normalizeArea(area) {
    const value = String(area || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(AREA_CONFIG, value) ? value : '';
  }

  function getHost(area) {
    const key = normalizeArea(area);
    return key ? document.getElementById(AREA_CONFIG[key].hostId) : null;
  }

  function getState(area) {
    const key = normalizeArea(area);
    return key ? (window[AREA_CONFIG[key].stateKey] || null) : null;
  }

  function getRuntime(area) {
    const key = normalizeArea(area);
    return key ? (window[AREA_CONFIG[key].runtimeKey] || null) : null;
  }

  function resolveAreaFromNode(node) {
    if (!(node instanceof Element)) return '';
    if (node.closest('#st-site-header-slot')) return 'header';
    if (node.closest('#st-site-footer-slot')) return 'footer';
    return '';
  }

  function resolveBucket(area) {
    const runtime = getRuntime(area);
    const pageId = runtime?.getPageId?.() || null;
    const mode = runtime?.getMode?.(pageId) === 'page' ? 'page' : 'global';
    return { mode, pageId };
  }


  function readStoredHTML(state, mode, pageId) {
    try {
      const snapshot = state?.getState?.();
      if (!snapshot || typeof snapshot !== 'object') return null;
      if (mode === 'page' && pageId) return String(snapshot?.pages?.[pageId]?.html || '');
      return String(snapshot?.global?.html || '');
    } catch {
      return null;
    }
  }

  function sanitizeHostHTML(host) {
    if (!(host instanceof HTMLElement)) return '';
    const shell = document.createElement('div');
    shell.innerHTML = host.innerHTML || '';

    shell.querySelectorAll(TECHNICAL_SELECTORS).forEach((node) => node.remove());
    shell.querySelectorAll('*').forEach((node) => {
      TECHNICAL_CLASSES.forEach((className) => node.classList.remove(className));
      if (!node.classList.length) node.removeAttribute('class');
      node.removeAttribute('aria-selected');
      node.removeAttribute('data-st-selection-owner');
      node.style?.removeProperty?.('--sf-selection-authored-shadow');
      node.style?.removeProperty?.('--sf-selection-authored-background');
      node.style?.removeProperty?.('--sf-selection-authored-radius');
      if (node.hasAttribute('style') && !String(node.getAttribute('style') || '').trim()) node.removeAttribute('style');
    });

    return shell.innerHTML || '';
  }

  function log(event, detail, level = 'info') {
    const name = `site-frame-persistence:${event}`;
    try { window.__ST_PERF_DIAG__?.push?.(name, { v: VERSION, ...detail }, level); } catch {}
    try { window.__ST_ALL_LOG__?.push?.(name, { v: VERSION, ...detail }, level); } catch {}
  }

  function commitArea(area, reason = 'explicit-action', options = {}) {
    const key = normalizeArea(area);
    if (!key) return Object.freeze({ committed: false, area: '', reason, cause: 'invalid-area' });
    if (committingAreas.has(key)) return Object.freeze({ committed: false, area: key, reason, cause: 'already-committing' });

    try {
      if (window.__ST_DESIGN_DND_ACTIVE__) {
        return Object.freeze({ committed: false, area: key, reason, cause: 'temporary-dnd-active' });
      }
      if (key === 'header' && document.body?.classList?.contains('st-mb-solo-menu')) {
        return Object.freeze({ committed: false, area: key, reason, cause: 'temporary-menu-solo' });
      }
    } catch {}

    let storeCapture = null;
    if (options.skipStoreCapture !== true) {
      try {
        storeCapture = window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.captureAreaFromDOM?.(key, reason) || null;
      } catch (error) {
        return Object.freeze({ committed: false, area: key, reason, cause: 'store-capture-failed', message: String(error?.message || error || '') });
      }
    }

    const host = getHost(key);
    const state = getState(key);
    if (!(host instanceof HTMLElement) || !state) {
      return Object.freeze({ committed: false, area: key, reason, cause: 'host-or-state-missing' });
    }

    const html = sanitizeHostHTML(host);
    const { mode, pageId } = resolveBucket(key);
    const bucketKey = `${key}:${mode}:${pageId || ''}`;
    const storedHTML = readStoredHTML(state, mode, pageId);
    if ((storedHTML !== null && storedHTML === html) || (storedHTML === null && lastCommittedHTML.get(bucketKey) === html)) {
      return Object.freeze({ committed: false, area: key, reason, cause: 'unchanged', mode, pageId: pageId || '', htmlLength: html.length, storeCaptured: storeCapture?.captured === true });
    }

    committingAreas.add(key);
    try {
      if (mode === 'page' && pageId) state.setPageHTML?.(pageId, html);
      else state.setGlobalHTML?.(html);
      lastCommittedHTML.set(bucketKey, html);
      const result = Object.freeze({ committed: true, area: key, reason, mode, pageId: pageId || '', htmlLength: html.length, storeCaptured: options.skipStoreCapture === true || storeCapture?.captured === true });
      log('explicit-commit-00876', result);
      try {
        window.dispatchEvent(new CustomEvent('st:site-frame-persistence-committed', { detail: result }));
      } catch {}
      return result;
    } catch (error) {
      const result = Object.freeze({ committed: false, area: key, reason, cause: 'write-failed', message: String(error?.message || error || '') });
      log('explicit-commit-error-00876', result, 'error');
      return result;
    } finally {
      committingAreas.delete(key);
    }
  }

  function commitNode(node, reason = 'explicit-node-action') {
    const area = resolveAreaFromNode(node);
    return commitArea(area, reason);
  }

  const api = Object.freeze({
    version: VERSION,
    contract: Object.freeze({
      explicitOnly: true,
      observers: 0,
      timers: 0,
      retryLoops: 0,
      globalPointerListeners: 0,
      compatibilityAliases: false,
      transactionBoundary: 'completed-user-action',
      authority: 'site-frame-store-json-primary',
      legacyHtmlOutputOnly: true,
      capturesStoreBeforeOutput: true,
      selectionUiSanitized: true,
    }),
    commitArea,
    commitNode,
    resolveAreaFromNode,
    sanitizeHostHTML,
  });

  window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876 = api;
  log('boot-00876', api.contract);
})();
