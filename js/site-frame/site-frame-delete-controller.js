// js/site-frame/site-frame-delete-controller.js
// 00892: one explicit toolbar Delete action for Header / Main / Footer.
// The selected SiteFrame node is removed through SiteFrameStore authority.

const VERSION = '00892-site-frame-toolbar-delete-controller';
const BUTTON_ID = 'delete-btn';
let installed = false;

function log(event, detail = {}, level = 'info') {
  const payload = { v: VERSION, ...detail };
  try { window.__ST_ALL_LOG__?.push?.(`site-frame-delete:${event}`, payload, level); } catch {}
  try { window.__ST_PERF_DIAG__?.push?.(`site-frame-delete:${event}`, payload, level); } catch {}
}

function areaFromElement(element) {
  if (!(element instanceof HTMLElement)) return '';
  if (element.closest('#st-site-main-slot')) return 'main';
  if (element.closest('#st-site-footer-slot')) return 'footer';
  if (element.closest('#st-site-header-slot')) return 'header';
  return '';
}

function selectedFrameElement() {
  const exact = document.querySelector(
    '#st-site-header-slot .sf-selection-current[data-sf-id], ' +
    '#st-site-main-slot .sf-selection-current[data-sf-id], ' +
    '#st-site-footer-slot .sf-selection-current[data-sf-id]'
  );
  if (exact instanceof HTMLElement) return exact;

  // Fallback only for a selection published before the 00887 frame class was
  // painted. It still requires a real SiteFrame id and exact area slot.
  const active = document.querySelector(
    '#st-site-main-slot [data-sf-id].is-selected.is-active, ' +
    '#st-site-header-slot [data-sf-id].is-selected.is-active, ' +
    '#st-site-footer-slot [data-sf-id].is-selected.is-active'
  );
  return active instanceof HTMLElement ? active : null;
}

function kindLabel(element) {
  const kind = String(element?.dataset?.sfKind || element?.dataset?.hfNodeType || '').toLowerCase();
  if (kind === 'section') return 'секцію';
  if (kind === 'level' || kind === 'row') return 'рівень';
  if (kind === 'container') return 'контейнер';
  return 'блок';
}

function areaLabel(area) {
  if (area === 'header') return 'шапки';
  if (area === 'footer') return 'футера';
  return 'Main';
}

function clearPublishedSelection() {
  try { window.__ST_LAYOUT_ACTIVE_EL_00453 = null; } catch {}
  try { window.__ST_DESIGN_ACTIVE_EL_00453 = null; } catch {}
  try { window.__ST_SITE_FRAME_MAIN_ACTIVE_00887 = null; } catch {}
  try { document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: null })); } catch {}
  try { window.dispatchEvent(new CustomEvent('st:clearPageTreeSelection')); } catch {}
}

function removeSelectedNode() {
  const element = selectedFrameElement();
  if (!(element instanceof HTMLElement)) {
    log('no-selection', { buttonId: BUTTON_ID }, 'warn');
    window.alert?.('Спочатку виберіть секцію, рівень, контейнер або блок на сайті.');
    return false;
  }

  const id = String(element.dataset.sfId || element.dataset.stNodeId || element.dataset.nodeId || '').trim();
  const area = areaFromElement(element);
  if (!id || !area) {
    log('invalid-selection', { id, area, cls: String(element.className || '') }, 'error');
    return false;
  }

  const label = kindLabel(element);
  const approved = window.confirm?.(`Видалити ${label} ${areaLabel(area)} та всі вкладені елементи?`);
  if (approved === false) {
    log('cancelled', { id, area, kind: String(element.dataset.sfKind || '') });
    return false;
  }

  const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
  if (!authority?.removeNode) {
    log('authority-missing', { id, area }, 'error');
    return false;
  }

  const result = authority.removeNode(id);
  if (!result?.ok) {
    log('remove-rejected', { id, area, reason: String(result?.reason || '') }, 'error');
    window.alert?.(`Не вдалося видалити елемент: ${String(result?.reason || 'невідома причина')}`);
    return false;
  }

  clearPublishedSelection();
  log('removed', {
    id,
    area,
    kind: String(result.kind || element.dataset.sfKind || ''),
    parentId: String(result.parentId || ''),
  });
  return true;
}

function install() {
  if (installed) return true;
  const button = document.getElementById(BUTTON_ID);
  if (!(button instanceof HTMLButtonElement)) return false;

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    removeSelectedNode();
  }, true);

  button.dataset.siteFrameDeleteController = '00892';
  installed = true;
  log('installed', {
    buttonId: BUTTON_ID,
    storeAuthority: true,
    areas: ['header', 'main', 'footer'],
    deleteLastMainSection: true,
  });
  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', install, { once: true });
} else {
  install();
}

export const SITE_FRAME_DELETE_CONTROLLER_00892 = Object.freeze({
  version: VERSION,
  install,
  removeSelectedNode,
});

try { window.ST_SITE_FRAME_DELETE_CONTROLLER_00892 = SITE_FRAME_DELETE_CONTROLLER_00892; } catch {}
