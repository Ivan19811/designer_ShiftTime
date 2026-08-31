const LS_KEY = 'st_ai_runtime_style_state_v1';
const MAX_HISTORY = 80;

function safeNow() {
  try { return new Date().toISOString(); } catch { return String(Date.now()); }
}

function safeStorage(context = {}) {
  try {
    return context.storage || context.localStorage || globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function readJson(storage, key) {
  if (!storage || typeof storage.getItem !== 'function') return null;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(storage, key, value) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function ensureStateShape(state) {
  const safe = state && typeof state === 'object' ? state : {};
  if (!safe.version) safe.version = 1;
  if (!safe.elements || typeof safe.elements !== 'object') safe.elements = {};
  if (!Array.isArray(safe.history)) safe.history = [];
  if (!safe.meta || typeof safe.meta !== 'object') safe.meta = {};
  return safe;
}

function mergeRecordPatch(record, patch = {}) {
  const next = { ...record };
  next.targetId = patch.targetId || record.targetId || null;
  next.targetType = patch.targetType || record.targetType || null;
  next.lastAppliedAt = patch.appliedAt || safeNow();
  next.lastRuntime = patch.runtime || record.lastRuntime || null;
  next.lastSummary = patch.summary || record.lastSummary || null;
  next.inlineStyles = { ...(record.inlineStyles || {}), ...(patch.inlineStyles || {}) };
  next.cssVars = { ...(record.cssVars || {}), ...(patch.cssVars || {}) };
  next.dataset = { ...(record.dataset || {}), ...(patch.dataset || {}) };
  next.meta = { ...(record.meta || {}), ...(patch.meta || {}) };
  return next;
}

function stringValue(input, fallback = '') {
  if (input == null) return fallback;
  return String(input);
}

function lengthValue(value, fallback = '0px') {
  if (value == null) return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (typeof value.raw === 'string' && value.raw) return value.raw;
    if (typeof value.value === 'number' && Number.isFinite(value.value)) return `${value.value}${value.unit || 'px'}`;
  }
  return fallback;
}

function opacityValue(value, fallback = '1') {
  if (value == null) return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return value > 1 ? String(value / 100) : String(value);
  if (typeof value === 'object' && typeof value.value === 'number' && Number.isFinite(value.value)) {
    return value.value > 1 ? String(value.value / 100) : String(value.value);
  }
  return fallback;
}

function inferMenu(targetType = '') {
  return /menu/i.test(String(targetType || ''));
}

function inferTextTarget(targetType = '') {
  return /(text|heading|article)/i.test(String(targetType || ''));
}


const DIMENSION_INLINE_STYLE_PROPS = new Set(['width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'boxSizing']);
const DIMENSION_CSS_VAR_PROPS = new Set(['--st-block-min-h', '--st-header-block-min-h', '--st-footer-block-min-h']);
const DIMENSION_DATASET_KEYS = new Set(['stSizeMode', 'sizeMode', 'aiRuntimeUnlockedSize', 'aiWidthApplied', 'aiHeightApplied']);

function hasDimensionPayload(record = {}) {
  if (!record || typeof record !== 'object') return false;
  if (record.lastRuntime === 'applyDimensionValue') return true;
  const inline = record.inlineStyles || {};
  for (const key of Object.keys(inline)) {
    if (DIMENSION_INLINE_STYLE_PROPS.has(key)) return true;
  }
  const vars = record.cssVars || {};
  for (const key of Object.keys(vars)) {
    if (DIMENSION_CSS_VAR_PROPS.has(key)) return true;
  }
  return false;
}

function shouldSkipPersistedInlineStyle(prop, record = {}) {
  if (!DIMENSION_INLINE_STYLE_PROPS.has(prop)) return false;
  return hasDimensionPayload(record);
}

function shouldSkipPersistedCssVar(prop, record = {}) {
  if (!DIMENSION_CSS_VAR_PROPS.has(prop)) return false;
  return hasDimensionPayload(record);
}

function shouldSkipPersistedDataset(key, record = {}) {
  if (!DIMENSION_DATASET_KEYS.has(key)) return false;
  return hasDimensionPayload(record);
}

function patchForOperationResult(opResult = {}) {
  const runtime = stringValue(opResult.runtime);
  const targetId = opResult?.targetRef?.id ? String(opResult.targetRef.id) : null;
  if (!targetId) return null;
  const targetType = stringValue(opResult?.targetRef?.type);
  const payload = opResult?.result?.payload || {};
  const isMenu = inferMenu(targetType);
  const patch = {
    targetId,
    targetType,
    runtime,
    summary: opResult?.result?.summary || runtime,
    appliedAt: safeNow(),
    inlineStyles: {},
    cssVars: {},
    dataset: {},
    meta: {},
  };

  if (runtime === 'applyPalettePolicy') {
    if (isMenu) {
      patch.cssVars['--st-menu-link-color'] = payload.text || '#e5e7eb';
      patch.cssVars['--st-menu-link-color-h'] = '#ffffff';
      patch.cssVars['--st-menu-item-bg'] = 'transparent';
      patch.cssVars['--st-menu-item-bg-h'] = payload.accentSoft || 'rgba(56,189,248,0.14)';
      patch.cssVars['--st-menu-item-bc'] = 'transparent';
      patch.cssVars['--st-menu-item-bc-h'] = payload.accent || '#38bdf8';
      patch.dataset.aiPalettePolicy = payload.mode || 'harmonize_with_site_theme';
    } else {
      patch.inlineStyles.backgroundColor = payload.bg || '#111827';
      patch.inlineStyles.color = payload.text || '#e5e7eb';
      if (payload.border) patch.inlineStyles.borderColor = payload.border;
      patch.dataset.aiPalettePolicy = payload.mode || 'harmonize_with_site_theme';
    }
  }

  if (runtime === 'applyContrastPolicy') {
    if (isMenu) {
      patch.cssVars['--st-menu-link-color'] = payload.text || '#e5e7eb';
      patch.cssVars['--st-menu-link-color-h'] = '#ffffff';
    } else {
      patch.inlineStyles.color = payload.text || '#e5e7eb';
    }
    patch.dataset.aiContrastPolicy = payload.mode || 'normalize';
  }

  if (runtime === 'applySpacingScale') {
    if (isMenu) {
      patch.cssVars['--st-menu-gap'] = payload.gap || '14px';
      patch.cssVars['--st-menu-pad-y'] = payload.py || '8px';
      patch.cssVars['--st-menu-pad-x'] = payload.px || '10px';
    } else {
      patch.inlineStyles.gap = payload.gap || '14px';
      patch.inlineStyles.padding = `${payload.py || '8px'} ${payload.px || '10px'}`;
    }
  }

  if (runtime === 'applyAlignmentPolicy') {
    patch.dataset.aiAlignmentPolicy = payload.mode || 'grid';
    if (!isMenu) patch.inlineStyles.textAlign = 'left';
  }

  if (runtime === 'applyShadowPreset') {
    const shadow = payload.shadow || '0 10px 26px rgba(2,6,23,0.28)';
    if (isMenu) {
      patch.cssVars['--st-menu-item-shadow'] = shadow;
      patch.cssVars['--st-menu-item-shadow-h'] = shadow;
    } else {
      patch.inlineStyles.boxShadow = shadow;
    }
  }

  if (runtime === 'applyBorderPreset') {
    if (isMenu) {
      patch.cssVars['--st-menu-item-bc'] = payload.color || 'rgba(148,163,184,0.35)';
      patch.cssVars['--st-menu-item-bc-h'] = payload.color || 'rgba(148,163,184,0.35)';
      patch.cssVars['--st-menu-item-bw'] = payload.width || '1px';
      patch.cssVars['--st-menu-item-bs'] = payload.style || 'solid';
    } else {
      patch.inlineStyles.borderColor = payload.color || 'rgba(148,163,184,0.35)';
      patch.inlineStyles.borderWidth = payload.width || '1px';
      patch.inlineStyles.borderStyle = payload.style || 'solid';
    }
  }

  if (runtime === 'applyRadiusPreset') {
    const radius = payload.radius || '12px';
    if (isMenu) {
      patch.cssVars['--st-menu-radius'] = radius;
      patch.cssVars['--st-menu-item-rtl'] = radius;
      patch.cssVars['--st-menu-item-rtr'] = radius;
      patch.cssVars['--st-menu-item-rbr'] = radius;
      patch.cssVars['--st-menu-item-rbl'] = radius;
    } else {
      patch.inlineStyles.borderRadius = radius;
    }
  }

  if (runtime === 'applyHoverPreset') {
    patch.dataset.aiHoverPreset = payload.preset || 'keep_hover_subtle';
    if (isMenu) {
      if (payload.bg) patch.cssVars['--st-menu-item-bg-h'] = payload.bg;
      if (payload.text) patch.cssVars['--st-menu-link-color-h'] = payload.text;
      if (payload.transition) patch.inlineStyles.transition = payload.transition;
    } else {
      if (payload.transition) patch.inlineStyles.transition = payload.transition;
      if (payload.bg) patch.dataset.aiHoverBg = payload.bg;
      if (payload.text) patch.dataset.aiHoverText = payload.text;
    }
  }

  if (runtime === 'selectNextPreset') {
    patch.dataset.aiSelectedPreset = payload.preset || 'clean_modern';
  }

  if (runtime === 'varyStyleAxis') {
    patch.dataset.aiVaryAxis = payload.axis || 'style_axis';
  }

  const direct = opResult?.operation?.payload || payload;
  if (runtime === 'applyBackgroundValue') {
    const color = direct?.value?.hex || direct?.value?.raw || 'transparent';
    if (isMenu) patch.cssVars[direct?.state === 'hover' ? '--st-menu-item-bg-h' : '--st-menu-item-bg'] = color;
    else {
      patch.inlineStyles.backgroundColor = color;
      if (/button/i.test(targetType)) {
        patch.cssVars['--st-button-fill'] = color;
        patch.dataset.buttonFillMode = 'solid';
        patch.dataset.buttonColor1 = color;
        patch.dataset.buttonColor2 = color;
      }
    }
  }
  if (runtime === 'applyGradientValue') {
    const gradient = payload.gradientCss || 'linear-gradient(180deg, #2563eb, #22c55e)';
    if (isMenu) patch.cssVars[direct?.state === 'hover' ? '--st-menu-item-bg-h' : '--st-menu-item-bg'] = gradient;
    else patch.inlineStyles.backgroundImage = gradient;
  }
  if (runtime === 'applyTextColorValue') {
    const color = direct?.value?.hex || direct?.value?.raw || '#e5e7eb';
    if (isMenu) patch.cssVars[direct?.state === 'hover' ? '--st-menu-link-color-h' : '--st-menu-link-color'] = color;
    else {
      patch.inlineStyles.color = color;
      if (/button/i.test(targetType)) patch.cssVars['--st-button-fg'] = color;
    }
    const descendantPatches = payload?.textColorPropagation?.descendantPatches;
    if (Array.isArray(descendantPatches) && descendantPatches.length) {
      patch.meta.textColorDescendantPatches = descendantPatches;
      patch.meta.textColorDescendantCount = descendantPatches.length;
    }
  }
  if (runtime === 'applyIconColorValue') {
    patch.inlineStyles.color = direct?.value?.hex || direct?.value?.raw || '#e5e7eb';
    patch.meta.applySvgCurrentColor = true;
  }
  if (runtime === 'applyBorderColorValue') {
    const color = direct?.value?.hex || direct?.value?.raw || 'rgba(148,163,184,0.35)';
    if (isMenu) patch.cssVars[direct?.state === 'hover' ? '--st-menu-item-bc-h' : '--st-menu-item-bc'] = color;
    else patch.inlineStyles.borderColor = color;
  }
  if (runtime === 'applyBorderWidthValue') {
    patch.inlineStyles.borderWidth = payload?.borderWidthIncrement?.nextWidth || lengthValue(direct?.value, '1px');
    patch.inlineStyles.borderStyle = patch.inlineStyles.borderStyle || 'solid';
  }
  if (runtime === 'applyBorderStyleValue') {
    patch.inlineStyles.borderStyle = direct?.value?.style || direct?.value?.raw || 'solid';
  }
  if (runtime === 'applyRadiusValue') {
    patch.inlineStyles.borderRadius = payload?.radiusIncrement?.nextRadius || lengthValue(direct?.value, '12px');
  }
  if (runtime === 'applyShadowValue') {
    const wantsRemoveShadow = direct?.value?.remove === true || direct?.value?.mode === 'remove_shadow' || direct?.value?.incrementMode === 'remove_shadow' || payload?.shadowIncrement?.mode === 'remove_shadow' || payload?.shadowCss === 'none';
    patch.inlineStyles.boxShadow = wantsRemoveShadow ? 'none' : (payload.shadowCss || payload.shadow || direct?.value?.raw || '0 10px 26px rgba(2,6,23,0.28)');
  }
  if (runtime === 'applyTextShadowValue') {
    patch.inlineStyles.textShadow = payload.shadowCss || direct?.value?.raw || '0 2px 8px rgba(2,6,23,0.25)';
  }
  if (runtime === 'applyTextStrokeValue') {
    patch.inlineStyles.webkitTextStroke = payload.strokeCss || direct?.value?.raw || '1px currentColor';
  }
  if (runtime === 'applyOpacityValue') {
    patch.inlineStyles.opacity = opacityValue(direct?.value, '1');
  }
  if (runtime === 'applyBlurValue') {
    if ((direct?.value?.mode || payload.mode) === 'backdrop') patch.inlineStyles.backdropFilter = `blur(${lengthValue(direct?.value, '8px')})`;
    else patch.inlineStyles.filter = `blur(${lengthValue(direct?.value, '8px')})`;
  }
  if (runtime === 'applySpacingValue') {
    const resolved = payload?.spacingResolved || {};
    const len = resolved.nextValue || resolved.length || lengthValue(direct?.value, '12px');
    const side = direct?.value?.side || payload?.value?.side || resolved.side || null;
    const rawProperty = String(direct?.property || payload?.property || resolved.property || 'padding');
    const propBase = rawProperty.includes('gap') ? 'gap' : (rawProperty.includes('margin') ? 'margin' : 'padding');
    if (propBase === 'gap') {
      patch.inlineStyles.gap = len;
      patch.cssVars['--site-gap'] = len;
      patch.cssVars['--site-gap-x'] = len;
      patch.cssVars['--site-gap-y'] = len;
      patch.dataset.aiGapApplied = len;
      patch.dataset.siteGap = len;
    }
    else if (side === 'top') patch.inlineStyles[`${propBase}Top`] = len;
    else if (side === 'bottom') patch.inlineStyles[`${propBase}Bottom`] = len;
    else if (side === 'left') patch.inlineStyles[`${propBase}Left`] = len;
    else if (side === 'right') patch.inlineStyles[`${propBase}Right`] = len;
    else patch.inlineStyles[propBase] = len;
  }
  if (runtime === 'applyDimensionValue') {
    // SIZE is persisted in the canonical builder/header/footer state, not in the
    // AI rehydration store. Keeping width/height here caused a double source of
    // truth: page rendered the old canonical size, then AI rehydration overwrote it
    // a moment later. We keep only diagnostics metadata for debug reports.
    const prop = direct?.property || payload?.property || 'width';
    const nextValue = payload?.dimensionIncrement?.nextValue || lengthValue(direct?.value, '0px');
    patch.meta.dimensionCanonicalState = true;
    patch.meta.dimensionProperty = prop;
    patch.meta.dimensionValue = nextValue;
    patch.meta.dimensionConstraint = payload?.dimensionIncrement?.constraint || null;
  }
  if (runtime === 'adjustNumericStyle') {
    const prop = payload?.styleProp || direct?.property || 'width';
    patch.meta.numericAdjustment = {
      property: prop,
      delta: payload?.delta || direct?.delta || 0,
      direction: payload?.direction || null,
      nextValue: payload?.nextValue || null,
    };
    if (prop === 'opacity' && payload?.nextValue != null) {
      patch.inlineStyles.opacity = String(payload.nextValue);
    }
    if (prop === 'border_opacity' && payload?.nextBorderColor) {
      patch.inlineStyles.borderColor = String(payload.nextBorderColor);
    }
  }
  if (runtime === 'applyTextAlignValue') {
    patch.inlineStyles.textAlign = direct?.value?.keyword || payload?.value?.keyword || 'left';
  }
  if (runtime === 'applyAlignmentValue') {
    patch.inlineStyles.justifyContent = payload?.justifyContent || 'center';
    if (payload?.alignItems) patch.inlineStyles.alignItems = payload.alignItems;
  }
  if (runtime === 'applyFontWeightValue') {
    patch.inlineStyles.fontWeight = payload?.weight || direct?.value?.keyword || '700';
  }
  if (runtime === 'applyTextCaseValue') {
    patch.inlineStyles.textTransform = payload?.transform || 'uppercase';
  }
  if (runtime === 'applyVisibilityValue') {
    const visible = payload?.visible !== false;
    patch.inlineStyles.display = visible ? '' : 'none';
    patch.inlineStyles.visibility = visible ? 'visible' : 'hidden';
  }

  if (!Object.keys(patch.inlineStyles).length) delete patch.inlineStyles;
  if (!Object.keys(patch.cssVars).length) delete patch.cssVars;
  if (!Object.keys(patch.dataset).length) delete patch.dataset;
  if (!Object.keys(patch.meta).length) delete patch.meta;
  return patch;
}

export function loadPersistedAiRuntimeState(context = {}) {
  const storage = safeStorage(context);
  return ensureStateShape(readJson(storage, LS_KEY) || { version: 1, elements: {}, history: [], meta: {} });
}

export function savePersistedAiRuntimeState(state, context = {}) {
  const storage = safeStorage(context);
  const safe = ensureStateShape(state);
  safe.meta.updatedAt = safeNow();
  return writeJson(storage, LS_KEY, safe);
}

export function persistAiRuntimeExecution(executionResult, context = {}) {
  const state = loadPersistedAiRuntimeState(context);
  const patches = [];
  const ops = Array.isArray(executionResult?.operations) ? executionResult.operations : [];
  for (const op of ops) {
    if (!op || !op.applied || op.ok === false) continue;
    const patch = patchForOperationResult(op);
    if (!patch || !patch.targetId) continue;
    patches.push(patch);
    state.elements[patch.targetId] = mergeRecordPatch(state.elements[patch.targetId] || {}, patch);
    const propagated = Array.isArray(patch?.meta?.textColorDescendantPatches) ? patch.meta.textColorDescendantPatches : [];
    for (const childPatchRaw of propagated) {
      if (!childPatchRaw || !childPatchRaw.targetId) continue;
      const childPatch = {
        targetId: String(childPatchRaw.targetId),
        targetType: childPatchRaw.targetType || 'text_descendant',
        runtime: childPatchRaw.runtime || patch.runtime,
        summary: childPatchRaw.summary || 'text color applied to descendant',
        appliedAt: childPatchRaw.appliedAt || patch.appliedAt || safeNow(),
        inlineStyles: childPatchRaw.inlineStyles || {},
        cssVars: childPatchRaw.cssVars || {},
        dataset: childPatchRaw.dataset || {},
        meta: childPatchRaw.meta || { propagatedTextColor: true },
      };
      patches.push(childPatch);
      state.elements[childPatch.targetId] = mergeRecordPatch(state.elements[childPatch.targetId] || {}, childPatch);
    }
  }
  if (patches.length) {
    state.history.unshift({
      at: safeNow(),
      contractKind: executionResult?.contractKind || null,
      selectedCount: executionResult?.summary?.selectedCount || 0,
      patches: patches.map((item) => ({ targetId: item.targetId, runtime: item.runtime, summary: item.summary })),
    });
    state.history = state.history.slice(0, MAX_HISTORY);
    state.meta.lastPersistedAt = safeNow();
    state.meta.lastPersistedCount = patches.length;
    savePersistedAiRuntimeState(state, context);
  }

  try {
    if (typeof context.persistRuntimeState === 'function') {
      context.persistRuntimeState({ patches, state, executionResult });
    }
  } catch {}
  try {
    if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function') {
      globalThis.dispatchEvent(new CustomEvent('st:ai-runtime-state-persisted', {
        detail: {
          source: 'ai-runtime',
          patchCount: patches.length,
          elementCount: Object.keys(state.elements || {}).length,
        },
      }));
    }
  } catch {}

  return {
    ok: true,
    kind: 'ai_runtime_persistence_result',
    patchCount: patches.length,
    patches,
    elementCount: Object.keys(state.elements || {}).length,
    updatedAt: state.meta.lastPersistedAt || null,
  };
}

export function applyPersistedStateToElement(element, persistedRecord = {}) {
  if (!element || !persistedRecord || typeof persistedRecord !== 'object') return false;
  try {
    const inlineStyles = persistedRecord.inlineStyles || {};
    for (const [prop, value] of Object.entries(inlineStyles)) {
      try {
        if (shouldSkipPersistedInlineStyle(prop, persistedRecord)) continue;
        element.style[prop] = value;
      } catch {}
    }
    const cssVars = persistedRecord.cssVars || {};
    for (const [prop, value] of Object.entries(cssVars)) {
      try {
        if (shouldSkipPersistedCssVar(prop, persistedRecord)) continue;
        element.style.setProperty(prop, value);
      } catch {}
    }
    const dataset = persistedRecord.dataset || {};
    for (const [key, value] of Object.entries(dataset)) {
      try {
        if (shouldSkipPersistedDataset(key, persistedRecord)) continue;
        element.dataset[key] = String(value);
      } catch {}
    }
    return true;
  } catch {
    return false;
  }
}

export function rehydrateAiRuntimeState(context = {}) {
  const state = loadPersistedAiRuntimeState(context);
  const doc = context.document || (typeof document !== 'undefined' ? document : null);
  if (!doc) return { ok: false, restored: 0, reason: 'missing_document' };
  let restored = 0;
  for (const [targetId, record] of Object.entries(state.elements || {})) {
    const selectors = [
      `[data-element-id="${String(targetId).replace(/"/g, '\\"')}"]`,
      `[data-node-id="${String(targetId).replace(/"/g, '\\"')}"]`,
      `[data-st-id="${String(targetId).replace(/"/g, '\\"')}"]`,
      `[data-uid="${String(targetId).replace(/"/g, '\\"')}"]`,
      `[data-hb-ref="${String(targetId).replace(/"/g, '\\"')}"]`,
      `#${String(targetId).replace(/"/g, '\\"')}`,
    ];
    let el = null;
    for (const sel of selectors) {
      try { el = doc.querySelector(sel); } catch {}
      if (el) break;
    }
    if (!el) continue;
    if (applyPersistedStateToElement(el, record)) restored += 1;
  }
  return { ok: true, restored, elementCount: Object.keys(state.elements || {}).length };
}


if (typeof globalThis !== 'undefined') {
  const existing = globalThis.ST_AI_RUNTIME_STATE || {};
  globalThis.ST_AI_RUNTIME_STATE = {
    ...existing,
    load: (context = {}) => loadPersistedAiRuntimeState(context),
    save: (state, context = {}) => savePersistedAiRuntimeState(state, context),
    persist: ({ executionResult, context = {} } = {}) => persistAiRuntimeExecution(executionResult, context),
    rehydrate: (context = {}) => rehydrateAiRuntimeState(context),
    applyPersistedStateToElement,
  };
}
