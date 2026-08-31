// 00948: strict Main template Add/Replace operation contract.
// Replace never degrades to Add. The target must be the selected Main section
// captured before the gallery hides the canvas and validated against SiteFrameStore.

import { KIND } from './site-frame-contract.js';

export const MAIN_TEMPLATE_OPERATION_VERSION_00948 = '00987-main-template-operation-scope-parity';
export const MAIN_TEMPLATE_TARGET_VERSION_00952 = '00952-main-template-immediate-target';

function stringId00948_(value) {
  return String(value || '').trim();
}

export function resolveMainSectionFromSelection00948(store, selectedNodeId = '') {
  const area = store?.findArea?.('main') || null;
  let node = stringId00948_(selectedNodeId) ? store?.maybeGet?.(stringId00948_(selectedNodeId)) : null;
  const visited = new Set();
  while (node && !visited.has(node.id)) {
    visited.add(node.id);
    if (node.area === 'main' && node.kind === KIND.SECTION) {
      const replaceIndex = Array.isArray(area?.children) ? area.children.indexOf(node.id) : -1;
      if (area && node.parentId === area.id && replaceIndex >= 0) {
        return Object.freeze({ sectionId: node.id, replaceIndex });
      }
      return Object.freeze({ sectionId: '', replaceIndex: -1 });
    }
    node = node.parentId ? store?.maybeGet?.(node.parentId) : null;
  }
  return Object.freeze({ sectionId: '', replaceIndex: -1 });
}

function directMainSections00952_(store) {
  const area = store?.findArea?.('main') || null;
  const children = Array.isArray(area?.children) ? area.children : [];
  return children
    .map((id, replaceIndex) => ({ node: store?.maybeGet?.(id) || null, replaceIndex }))
    .filter(({ node }) => node?.area === 'main' && node?.kind === KIND.SECTION && node?.parentId === area?.id);
}

export function resolveImmediateMainTemplateTarget00952(store, activeNodeId = '') {
  const explicit = resolveMainSectionFromSelection00948(store, activeNodeId);
  if (explicit.sectionId) {
    return Object.freeze({ ...explicit, source: 'explicit-selection', reason: '' });
  }

  const area = store?.findArea?.('main') || null;
  const directSections = directMainSections00952_(store);
  const storedId = stringId00948_(area?.meta?.mainTemplateTarget00952?.sectionId || '');
  const stored = storedId ? directSections.find(({ node }) => node.id === storedId) : null;
  if (stored) {
    return Object.freeze({ sectionId: stored.node.id, replaceIndex: stored.replaceIndex, source: 'site-frame-store-target', reason: '' });
  }

  const activeTemplateId = stringId00948_(area?.meta?.templateSelection00946?.current?.templateId || '');
  if (activeTemplateId) {
    const matches = directSections.filter(({ node }) => stringId00948_(node?.meta?.templateId) === activeTemplateId);
    if (matches.length === 1) {
      return Object.freeze({ sectionId: matches[0].node.id, replaceIndex: matches[0].replaceIndex, source: 'unique-active-template', reason: '' });
    }
  }

  if (directSections.length === 1) {
    return Object.freeze({ sectionId: directSections[0].node.id, replaceIndex: directSections[0].replaceIndex, source: 'sole-main-section', reason: '' });
  }

  return Object.freeze({
    sectionId: '',
    replaceIndex: -1,
    source: 'none',
    reason: directSections.length > 1 ? 'main-template-target-ambiguous' : 'main-section-missing'
  });
}

export function resolveMainTemplateOperation00948(store, { mode = 'add', targetNodeId = '', replaceScope = 'section' } = {}) {
  const requestedMode = mode === 'replace' ? 'replace' : 'add';
  const normalizedScope00987 = requestedMode === 'replace' && String(replaceScope || '').toLowerCase() === 'main-area' ? 'main-area' : 'section';
  if (requestedMode === 'add') {
    return Object.freeze({
      ok: true,
      requestedMode,
      effectiveMode: 'add',
      selectedId: '',
      replaceIndex: -1,
      replaceScope: 'section',
      replacedRootIds: Object.freeze([]),
      reason: ''
    });
  }

  if (normalizedScope00987 === 'main-area') {
    const directSections = directMainSections00952_(store);
    if (!directSections.length) {
      return Object.freeze({
        ok: false,
        requestedMode,
        effectiveMode: 'none',
        selectedId: '',
        replaceIndex: -1,
        replaceScope: 'main-area',
        replacedRootIds: Object.freeze([]),
        reason: 'main-section-missing'
      });
    }
    return Object.freeze({
      ok: true,
      requestedMode,
      effectiveMode: 'replace',
      selectedId: directSections[0].node.id,
      replaceIndex: 0,
      replaceScope: 'main-area',
      replacedRootIds: Object.freeze(directSections.map(({ node }) => node.id)),
      reason: ''
    });
  }

  const target = resolveMainSectionFromSelection00948(store, targetNodeId);
  if (!target.sectionId) {
    return Object.freeze({
      ok: false,
      requestedMode,
      effectiveMode: 'none',
      selectedId: '',
      replaceIndex: -1,
      replaceScope: 'section',
      replacedRootIds: Object.freeze([]),
      reason: 'main-section-selection-required'
    });
  }

  return Object.freeze({
    ok: true,
    requestedMode,
    effectiveMode: 'replace',
    selectedId: target.sectionId,
    replaceIndex: target.replaceIndex,
    replaceScope: 'section',
    replacedRootIds: Object.freeze([target.sectionId]),
    reason: ''
  });
}
