// 00991-RESPONSIVE-EDIT-SCOPE
// One explicit viewport-range contract for adaptive editing. Physical screen inches
// are labels only; browser layout is selected by CSS-pixel width ranges.

export const RESPONSIVE_EDIT_SCOPE_VERSION_00991 = '00991-responsive-edit-scope';
export const RESPONSIVE_VIEWPORT_STORAGE_KEY_00991 = 'st_builder_responsive_viewport_v1';

export const RESPONSIVE_EDIT_PROFILES_00991 = Object.freeze([
  Object.freeze({ id: 'screen-32', label: 'Великий екран 32″', minWidth: 2240, maxWidth: 2560 }),
  Object.freeze({ id: 'screen-27', label: 'Великий екран 27″', minWidth: 1920, maxWidth: 2239 }),
  Object.freeze({ id: 'screen-23', label: 'Стандартний екран 23″', minWidth: 1600, maxWidth: 1919 }),
  Object.freeze({ id: 'laptop-17', label: 'Ноутбук 17″', minWidth: 1366, maxWidth: 1599 }),
  Object.freeze({ id: 'laptop-compact', label: 'Компактний ноутбук', minWidth: 1180, maxWidth: 1365 }),
  Object.freeze({ id: 'tablet-wide', label: 'Планшет широкий', minWidth: 900, maxWidth: 1179 }),
  Object.freeze({ id: 'tablet', label: 'Планшет', minWidth: 700, maxWidth: 899 }),
  Object.freeze({ id: 'phone-large', label: 'Великий телефон', minWidth: 390, maxWidth: 699 }),
  Object.freeze({ id: 'phone-small', label: 'Малий телефон', minWidth: 280, maxWidth: 389 }),
]);

function cloneValue00991(value) {
  if (value == null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value));
}

function mergeObjects00991(base, override) {
  const out = { ...(base && typeof base === 'object' ? base : {}) };
  for (const [key, value] of Object.entries(override && typeof override === 'object' ? override : {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
      out[key] = mergeObjects00991(out[key], value);
    } else out[key] = cloneValue00991(value);
  }
  return out;
}

export function resolveResponsiveProfile00991(width) {
  const number = Math.round(Number(width));
  if (!Number.isFinite(number)) return RESPONSIVE_EDIT_PROFILES_00991.find(profile => profile.id === 'laptop-17') || RESPONSIVE_EDIT_PROFILES_00991[0];
  return RESPONSIVE_EDIT_PROFILES_00991.find(profile => number >= profile.minWidth && number <= profile.maxWidth)
    || (number < RESPONSIVE_EDIT_PROFILES_00991[RESPONSIVE_EDIT_PROFILES_00991.length - 1].minWidth
      ? RESPONSIVE_EDIT_PROFILES_00991[RESPONSIVE_EDIT_PROFILES_00991.length - 1]
      : RESPONSIVE_EDIT_PROFILES_00991[0]);
}

export function readResponsiveViewportState00991() {
  try {
    const api = globalThis.window?.ST_RESPONSIVE_VIEWPORT_00991 || globalThis.window?.ST_RESPONSIVE_VIEWPORT_00958;
    const apiState = api?.getState?.();
    if (apiState && typeof apiState === 'object') return apiState;
  } catch (_) {}
  try {
    const raw = globalThis.localStorage?.getItem?.(RESPONSIVE_VIEWPORT_STORAGE_KEY_00991);
    const state = raw ? JSON.parse(raw) : null;
    if (state && typeof state === 'object') return state;
  } catch (_) {}
  return { enabled: false, width: 1440, height: 900, mode: 'laptop', presetId: '' };
}

export function getResponsiveEditScope00991(stateInput = null) {
  const state = stateInput && typeof stateInput === 'object' ? stateInput : readResponsiveViewportState00991();
  if (state.enabled !== true) {
    return Object.freeze({ scoped: false, profileId: '', label: 'Базовий стиль', minWidth: null, maxWidth: null, width: Number(state.width) || null });
  }
  const profile = resolveResponsiveProfile00991(state.width);
  return Object.freeze({
    scoped: true,
    profileId: profile.id,
    label: profile.label,
    minWidth: profile.minWidth,
    maxWidth: profile.maxWidth,
    width: Math.round(Number(state.width) || profile.minWidth),
  });
}

export function getNodeResponsiveOverride00991(node, scopeInput = null) {
  const scope = scopeInput || getResponsiveEditScope00991();
  if (!scope.scoped || !node || typeof node !== 'object') return null;
  const entry = node.responsive && typeof node.responsive === 'object' ? node.responsive[scope.profileId] : null;
  return entry && typeof entry === 'object' ? entry : null;
}

export function getEffectiveResponsiveNode00991(node, scopeInput = null) {
  if (!node || typeof node !== 'object') return node;
  const scope = scopeInput || getResponsiveEditScope00991();
  const override = getNodeResponsiveOverride00991(node, scope);
  if (!override) return node;
  return {
    ...node,
    box: mergeObjects00991(node.box, override.box),
    layout: mergeObjects00991(node.layout, override.layout),
    constraints: mergeObjects00991(node.constraints, override.constraints),
    style: mergeObjects00991(node.style, override.style),
    meta: mergeObjects00991(node.meta, override.meta),
  };
}

function applyDomainDelta00991(baseDomain, currentOverrideDomain, desiredDomain) {
  const base = baseDomain && typeof baseDomain === 'object' ? baseDomain : {};
  const next = { ...(currentOverrideDomain && typeof currentOverrideDomain === 'object' ? currentOverrideDomain : {}) };
  for (const [key, value] of Object.entries(desiredDomain && typeof desiredDomain === 'object' ? desiredDomain : {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = applyDomainDelta00991(base[key], next[key], value);
      if (Object.keys(nested).length) next[key] = nested;
      else delete next[key];
      continue;
    }
    const baseValue = base[key];
    if (JSON.stringify(baseValue) === JSON.stringify(value)) delete next[key];
    else next[key] = cloneValue00991(value);
  }
  return next;
}

function cleanEmpty00991(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      const nested = cleanEmpty00991(child);
      if (Object.keys(nested).length) out[key] = nested;
    } else if (child !== undefined) out[key] = child;
  }
  return out;
}

// Diverts visual/editable domains to the active adaptive profile while leaving
// structural/persistence metadata global. This is called only by explicit edit actions.
export function scopeVisualPatch00991(node, desiredPatch = {}, scopeInput = null) {
  const scope = scopeInput || getResponsiveEditScope00991();
  if (!scope.scoped || !node || typeof node !== 'object') return cloneValue00991(desiredPatch);

  const responsive = cloneValue00991(node.responsive && typeof node.responsive === 'object' ? node.responsive : {}) || {};
  const current = cloneValue00991(responsive[scope.profileId] && typeof responsive[scope.profileId] === 'object' ? responsive[scope.profileId] : {}) || {};
  const next = { ...current };
  const baseMeta = node.meta && typeof node.meta === 'object' ? node.meta : {};

  for (const domain of ['box', 'layout', 'constraints', 'style']) {
    if (!Object.prototype.hasOwnProperty.call(desiredPatch, domain)) continue;
    const delta = applyDomainDelta00991(node[domain], current[domain], desiredPatch[domain]);
    if (Object.keys(delta).length) next[domain] = delta;
    else delete next[domain];
  }

  if (desiredPatch.meta && typeof desiredPatch.meta === 'object') {
    const visualMeta = {};
    const globalMeta = {};
    for (const [key, value] of Object.entries(desiredPatch.meta)) {
      // Geometry, editable typography and visual widget state can vary by profile.
      if (['geometry', 'textEditableStyle', 'typographyControls', 'fill', 'radius', 'border', 'shadow', 'spacing', 'layers'].includes(key)) visualMeta[key] = value;
      else globalMeta[key] = value;
    }
    if (Object.keys(visualMeta).length) {
      const delta = applyDomainDelta00991(baseMeta, current.meta, visualMeta);
      if (Object.keys(delta).length) next.meta = delta;
      else delete next.meta;
    }
    if (Object.keys(globalMeta).length) desiredPatch = { ...desiredPatch, meta: globalMeta };
    else { desiredPatch = { ...desiredPatch }; delete desiredPatch.meta; }
  }

  const cleaned = cleanEmpty00991(next);
  if (Object.keys(cleaned).length) responsive[scope.profileId] = cleaned;
  else delete responsive[scope.profileId];

  const globalPatch = { ...desiredPatch };
  delete globalPatch.box;
  delete globalPatch.layout;
  delete globalPatch.constraints;
  delete globalPatch.style;
  if (globalPatch.meta && !Object.keys(globalPatch.meta).length) delete globalPatch.meta;
  return { ...globalPatch, responsive };
}

export function responsiveProfileDescription00991(scopeInput = null) {
  const scope = scopeInput || getResponsiveEditScope00991();
  return scope.scoped ? `${scope.label} · ${scope.minWidth}–${scope.maxWidth}px` : 'Базовий стиль · усі екрани без адаптивного режиму';
}
