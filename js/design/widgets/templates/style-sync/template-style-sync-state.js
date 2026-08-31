// 00954-TEMPLATE-STYLE-LIVE-LINK
// Active template identity and applied sync settings live only in SiteFrameStore metadata.

export const TEMPLATE_STYLE_SYNC_STATE_VERSION_00946 = 'st-template-style-sync-state-v1-00946';
export const TEMPLATE_STYLE_SYNC_AREAS_00946 = Object.freeze(['header', 'main', 'footer']);
export const SECTION_STYLE_SELECTION_VERSION_00953 = 'st-section-style-selection-v3-00953';
export const SECTION_STYLE_SELECTION_VERSION_00954 = 'st-section-style-selection-v4-00954';
export const TEMPLATE_STYLE_LIVE_LINK_VERSION_00954 = 'st-template-style-live-link-v1-00954';
export const TEMPLATE_STYLE_SYNC_MODES_00954 = Object.freeze(['once', 'live-link']);

function authority00946_() {
  return typeof window !== 'undefined' ? window.ST_SITE_FRAME_STORE_AUTHORITY_00876 : null;
}

function clone00946_(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function currentPageId00946_() {
  const headerRuntime = window.SiteHeaderRuntime;
  const footerRuntime = window.SiteFooterRuntime;
  return String(
    headerRuntime?.getPageId?.()
    || footerRuntime?.getPageId?.()
    || document.querySelector('#site-root')?.dataset?.pageId
    || 'page:default'
  );
}

function currentMode00946_(area, pageId) {
  if (area === 'main') return 'current';
  const runtime = area === 'header' ? window.SiteHeaderRuntime : window.SiteFooterRuntime;
  return runtime?.getMode?.(pageId) === 'page' ? 'page' : 'global';
}

function descriptorFromTemplate00946_(area, template) {
  const profile = template?.styleProfile && typeof template.styleProfile === 'object'
    ? template.styleProfile
    : null;
  return {
    area,
    templateId: String(template?.id || ''),
    templateName: String(template?.name || template?.id || ''),
    profileId: String(profile?.profileId || ''),
    collectionId: String(profile?.collectionId || ''),
    recordedAt: Date.now()
  };
}

function readAreaSelection00946_(area) {
  const store = authority00946_()?.store;
  const areaNode = store?.findArea?.(area);
  const selection = areaNode?.meta?.templateSelection00946;
  return selection && typeof selection === 'object' ? clone00946_(selection) : {};
}

function deriveMainTemplateFromStore00946_() {
  const store = authority00946_()?.store;
  const areaNode = store?.findArea?.('main');
  const children = Array.isArray(areaNode?.children) ? areaNode.children : [];
  for (let index = children.length - 1; index >= 0; index -= 1) {
    const section = store?.maybeGet?.(children[index]);
    const templateId = String(section?.meta?.templateId || '');
    if (templateId) {
      return {
        area: 'main',
        templateId,
        templateName: templateId,
        profileId: '',
        collectionId: '',
        recordedAt: Number(section?.meta?.createdAt || 0)
      };
    }
  }
  return null;
}

export function recordActiveTemplate00946({ area, mode = '', pageId = '', template = null } = {}) {
  const targetArea = String(area || '').trim();
  if (!TEMPLATE_STYLE_SYNC_AREAS_00946.includes(targetArea)) {
    return Object.freeze({ ok: false, reason: 'invalid-area', area: targetArea });
  }
  if (!template?.id) return Object.freeze({ ok: false, reason: 'template-id-required', area: targetArea });

  const authority = authority00946_();
  const store = authority?.store;
  const areaNode = store?.findArea?.(targetArea);
  if (!store || !areaNode || store.hasActiveTransaction?.()) {
    return Object.freeze({ ok: false, reason: 'site-frame-store-unavailable-or-busy', area: targetArea });
  }

  const descriptor = descriptorFromTemplate00946_(targetArea, template);
  const selection = readAreaSelection00946_(targetArea);
  if (targetArea === 'main') {
    selection.current = descriptor;
  } else {
    const resolvedPageId = String(pageId || currentPageId00946_());
    const resolvedMode = mode === 'page' ? 'page' : 'global';
    selection.pages = selection.pages && typeof selection.pages === 'object' ? selection.pages : {};
    if (resolvedMode === 'page') selection.pages[resolvedPageId] = descriptor;
    else selection.global = descriptor;
  }

  const meta = {
    ...(areaNode.meta || {}),
    templateSelection00946: {
      version: TEMPLATE_STYLE_SYNC_STATE_VERSION_00946,
      ...selection
    }
  };
  store.updateNode(areaNode.id, { meta });
  authority.persistStore?.(`active-template-${targetArea}-00946`);
  try {
    window.dispatchEvent(new CustomEvent('st:active-template-changed-00946', {
      detail: { area: targetArea, descriptor: clone00946_(descriptor) }
    }));
  } catch (_) {}
  return Object.freeze({ ok: true, area: targetArea, descriptor: clone00946_(descriptor) });
}

export function clearActiveTemplate00946({ area, mode = '', pageId = '', templateId = '' } = {}) {
  const targetArea = String(area || '').trim();
  const expectedId = String(templateId || '').trim();
  if (!TEMPLATE_STYLE_SYNC_AREAS_00946.includes(targetArea)) {
    return Object.freeze({ ok: false, reason: 'invalid-area', area: targetArea });
  }
  const authority = authority00946_();
  const store = authority?.store;
  const areaNode = store?.findArea?.(targetArea);
  if (!store || !areaNode || store.hasActiveTransaction?.()) {
    return Object.freeze({ ok: false, reason: 'site-frame-store-unavailable-or-busy', area: targetArea });
  }
  const selection = readAreaSelection00946_(targetArea);
  let cleared = false;
  if (targetArea === 'main') {
    if (!expectedId || selection.current?.templateId === expectedId) {
      selection.current = null;
      cleared = true;
    }
  } else {
    const resolvedPageId = String(pageId || currentPageId00946_());
    const resolvedMode = mode === 'page' ? 'page' : 'global';
    selection.pages = selection.pages && typeof selection.pages === 'object' ? selection.pages : {};
    if (resolvedMode === 'page') {
      if (!expectedId || selection.pages?.[resolvedPageId]?.templateId === expectedId) {
        selection.pages[resolvedPageId] = null;
        cleared = true;
      }
    } else if (!expectedId || selection.global?.templateId === expectedId) {
      selection.global = null;
      cleared = true;
    }
  }
  if (!cleared) return Object.freeze({ ok: true, area: targetArea, cleared: false });
  store.updateNode(areaNode.id, {
    meta: {
      ...(areaNode.meta || {}),
      templateSelection00946: {
        version: TEMPLATE_STYLE_SYNC_STATE_VERSION_00946,
        ...selection
      }
    }
  });
  authority.persistStore?.(`active-template-clear-${targetArea}-00946`);
  try { window.dispatchEvent(new CustomEvent('st:active-template-changed-00946', { detail: { area: targetArea, descriptor: null } })); } catch (_) {}
  return Object.freeze({ ok: true, area: targetArea, cleared: true });
}

export function readActiveTemplate00946(area, options = {}) {
  const targetArea = String(area || '').trim();
  if (!TEMPLATE_STYLE_SYNC_AREAS_00946.includes(targetArea)) return null;
  const selection = readAreaSelection00946_(targetArea);
  if (targetArea === 'main') return clone00946_(selection.current || deriveMainTemplateFromStore00946_());
  const pageId = String(options.pageId || currentPageId00946_());
  const mode = options.mode === 'page' || options.mode === 'global'
    ? options.mode
    : currentMode00946_(targetArea, pageId);
  return clone00946_(mode === 'page' ? selection.pages?.[pageId] : selection.global) || null;
}

export function readActiveTemplates00946() {
  const pageId = currentPageId00946_();
  return Object.freeze({
    pageId,
    header: readActiveTemplate00946('header', { pageId }),
    main: readActiveTemplate00946('main'),
    footer: readActiveTemplate00946('footer', { pageId })
  });
}

export function readAppliedTemplateStyleSync00953() {
  const store = authority00946_()?.store;
  const root = store?.maybeGet?.(store.rootId || 'sf_site_root');
  const state = root?.meta?.templateStyleSync00954 || root?.meta?.templateStyleSync00953 || root?.meta?.templateStyleSync00951 || root?.meta?.templateStyleSync00946;
  return state && typeof state === 'object' ? clone00946_(state) : null;
}

export function readAppliedTemplateStyleSync00954() {
  return readAppliedTemplateStyleSync00953();
}

export function readSelectedSectionStyles00953() {
  const store = authority00946_()?.store;
  const root = store?.maybeGet?.(store.rootId || 'sf_site_root');
  const state = root?.meta?.sectionStyleSelections00954 || root?.meta?.sectionStyleSelections00953 || root?.meta?.sectionStyleSelections00951 || root?.meta?.sectionStyleSelections00950;
  const selectedByArea = state?.selectedByArea && typeof state.selectedByArea === 'object'
    ? state.selectedByArea
    : {};
  return Object.freeze({
    version: state?.version || SECTION_STYLE_SELECTION_VERSION_00953,
    selectedByArea: Object.freeze(Object.fromEntries(
      TEMPLATE_STYLE_SYNC_AREAS_00946.map((area) => [area, clone00946_(selectedByArea[area] || null)])
    ))
  });
}

export function readSelectedSectionStyles00954() {
  return readSelectedSectionStyles00953();
}

export function readTemplateStyleLiveLink00954() {
  const store = authority00946_()?.store;
  const root = store?.maybeGet?.(store.rootId || 'sf_site_root');
  const state = root?.meta?.templateStyleLiveLink00954;
  if (!state || typeof state !== 'object') {
    return Object.freeze({
      version: TEMPLATE_STYLE_LIVE_LINK_VERSION_00954,
      mode: 'once',
      enabled: false,
      masterArea: '',
      linkedAreas: Object.freeze([]),
      areaModes: Object.freeze({ header: 'own', main: 'own', footer: 'own' })
    });
  }
  const masterArea = TEMPLATE_STYLE_SYNC_AREAS_00946.includes(String(state.masterArea || ''))
    ? String(state.masterArea)
    : '';
  const linkedAreas = Array.from(new Set(
    (Array.isArray(state.linkedAreas) ? state.linkedAreas : [])
      .map((area) => String(area || ''))
      .filter((area) => TEMPLATE_STYLE_SYNC_AREAS_00946.includes(area) && area !== masterArea)
  ));
  const enabled = state.enabled === true && state.mode === 'live-link' && !!masterArea && linkedAreas.length > 0;
  const areaModes = Object.fromEntries(TEMPLATE_STYLE_SYNC_AREAS_00946.map((area) => [
    area,
    enabled && linkedAreas.includes(area) ? 'master' : 'own'
  ]));
  return Object.freeze({
    version: TEMPLATE_STYLE_LIVE_LINK_VERSION_00954,
    mode: enabled ? 'live-link' : 'once',
    enabled,
    masterArea,
    linkedAreas: Object.freeze(linkedAreas),
    areaModes: Object.freeze(areaModes),
    savedAt: Number(state.savedAt || 0)
  });
}

export function createSectionStyleReference00953(area, style = null, selectedAt = Date.now()) {
  const targetArea = String(area || '').trim();
  if (!TEMPLATE_STYLE_SYNC_AREAS_00946.includes(targetArea)) return null;
  const styleId = String(style?.styleId || style?.id || '').trim();
  const profileId = String(style?.profileId || style?.styleProfile?.profileId || '').trim();
  if (!styleId || !profileId) return null;
  return Object.freeze({
    area: targetArea,
    styleId,
    styleName: String(style?.name || style?.styleName || styleId),
    profileId,
    collectionId: String(style?.collectionId || style?.styleProfile?.collectionId || ''),
    sourceArea: String(style?.sourceArea || style?.styleProfile?.area || ''),
    sourceTemplateId: String(style?.templateId || style?.styleProfile?.templateId || ''),
    selectedAt: Number(selectedAt || Date.now())
  });
}

export function createSectionStyleSelectionState00953(selectedByArea = {}) {
  return {
    version: SECTION_STYLE_SELECTION_VERSION_00953,
    selectedByArea: Object.fromEntries(
      TEMPLATE_STYLE_SYNC_AREAS_00946.map((area) => [area, clone00946_(selectedByArea?.[area] || null)])
    )
  };
}

export function createSectionStyleSelectionState00954(selectedByArea = {}) {
  return {
    version: SECTION_STYLE_SELECTION_VERSION_00954,
    selectedByArea: Object.fromEntries(
      TEMPLATE_STYLE_SYNC_AREAS_00946.map((area) => [area, clone00946_(selectedByArea?.[area] || null)])
    )
  };
}

export function createTemplateStyleLiveLinkState00954({ mode = 'once', masterArea = '', areaModes = {}, savedAt = Date.now() } = {}) {
  const normalizedMaster = TEMPLATE_STYLE_SYNC_AREAS_00946.includes(String(masterArea || ''))
    ? String(masterArea)
    : '';
  const normalizedMode = mode === 'live-link' ? 'live-link' : 'once';
  const linkedAreas = normalizedMode === 'live-link' && normalizedMaster
    ? TEMPLATE_STYLE_SYNC_AREAS_00946.filter((area) => area !== normalizedMaster && areaModes?.[area] === 'master')
    : [];
  const enabled = normalizedMode === 'live-link' && linkedAreas.length > 0;
  return {
    version: TEMPLATE_STYLE_LIVE_LINK_VERSION_00954,
    mode: enabled ? 'live-link' : 'once',
    enabled,
    masterArea: normalizedMaster,
    linkedAreas,
    areaModes: Object.fromEntries(TEMPLATE_STYLE_SYNC_AREAS_00946.map((area) => [
      area,
      enabled && linkedAreas.includes(area) ? 'master' : 'own'
    ])),
    savedAt: Number(savedAt || Date.now())
  };
}
