function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function normalizeSelectedElements(source) {
  const raw = asArray(source)
    .flatMap((item) => asArray(item))
    .filter(Boolean)
    .map((item, index) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return { id: String(item), type: 'unknown', label: String(item), index };
      }
      return {
        id: String(item.id ?? item.elementId ?? item.uid ?? index),
        type: String(item.type ?? item.target ?? 'unknown'),
        label: String(item.label ?? item.name ?? item.id ?? item.elementId ?? `selected_${index + 1}`),
        raw: item,
        index,
      };
    });
  return uniqueBy(raw, (item) => `${item.id}:${item.type}`);
}

async function resolveSelectionContext(context = {}) {
  const fromGetter = typeof context.getSelectedElements === 'function'
    ? await context.getSelectedElements()
    : null;
  const selectedElements = normalizeSelectedElements(
    fromGetter ?? context.selectedElements ?? context.selectedElement ?? [],
  );
  return {
    selectedElements,
    selectedCount: selectedElements.length,
  };
}

function normalizeRuntimeTargetScopeLevels(scope) {
  const raw = scope && Array.isArray(scope.levels)
    ? scope.levels
    : (Array.isArray(scope) ? scope : []);
  const levels = raw
    .map((item) => Number.parseInt(String(item).trim(), 10))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 3);
  return Array.from(new Set(levels)).sort((a, b) => a - b);
}

function getRuntimeTargetScope(operation, contract, context = {}) {
  const scope = operation?.targetScope
    || operation?.payload?.targetScope
    || contract?.targetScope
    || context?.targetScope
    || null;
  const levels = normalizeRuntimeTargetScopeLevels(scope);
  if (!levels.length) return null;
  return {
    mode: 'selected_tree_levels',
    levels,
    maxDepth: 3,
  };
}

function isAiRuntimeTreeElement(node) {
  if (!node || node.nodeType !== 1) return false;
  try {
    if (node.classList?.contains('st-section')) return true;
    if (node.classList?.contains('st-row')) return true;
    if (node.classList?.contains('st-container')) return true;
    if (node.classList?.contains('st-block')) return true;
    if (node.dataset && (node.dataset.elementId || node.dataset.nodeId || node.dataset.stId || node.dataset.uid || node.dataset.hbRef)) return true;
  } catch {}
  return false;
}

function inferScopedTargetTypeFromNode(node) {
  if (!node || !node.classList) return 'element';
  if (node.classList.contains('st-block--menu')) return 'menu_block';
  if (node.classList.contains('st-block--button')) return 'button_block';
  if (node.classList.contains('st-block--text')) return 'text_block';
  if (node.classList.contains('st-block--heading')) return 'text_block';
  if (node.classList.contains('st-block--article')) return 'text_block';
  if (node.classList.contains('st-block--icon')) return 'icon_block';
  if (node.classList.contains('st-section')) return 'section';
  if (node.classList.contains('st-row')) return 'row';
  if (node.classList.contains('st-block')) return 'container';
  return String(node.dataset?.blockRole || node.dataset?.blockKind || 'element');
}

function scopedElementId(node, fallback = '') {
  if (!node) return fallback || '';
  try {
    return String(
      node.dataset?.elementId
      || node.dataset?.nodeId
      || node.dataset?.stId
      || node.dataset?.uid
      || node.dataset?.hbRef
      || node.id
      || fallback
      || ''
    );
  } catch {
    return fallback || '';
  }
}

function makeScopedTargetRef(node, sourceRef, level, index) {
  const fallback = `${sourceRef?.id || 'selected'}_scope_${level}_${index + 1}`;
  const id = scopedElementId(node, fallback);
  return {
    id,
    type: inferScopedTargetTypeFromNode(node),
    label: node?.dataset?.label || node?.dataset?.name || id || `level_${level}_${index + 1}`,
    element: node,
    raw: { element: node, scopeSource: sourceRef || null, scopeLevel: level },
    index,
    scopeLevel: level,
    scopeSourceId: sourceRef?.id || null,
  };
}

function collectDirectRuntimeTreeChildren(root) {
  const direct = [];
  const seen = new Set();
  const visit = (parent) => {
    if (!parent || !parent.children) return;
    for (const child of Array.from(parent.children)) {
      if (!child || child.nodeType !== 1) continue;
      if (isAiRuntimeTreeElement(child)) {
        if (!seen.has(child)) {
          seen.add(child);
          direct.push(child);
        }
        continue;
      }
      visit(child);
    }
  };
  visit(root);
  return direct;
}

function collectRuntimeTreeNodesByLevels(root, levels, sourceRef) {
  const out = [];
  const queue = collectDirectRuntimeTreeChildren(root).map((node) => ({ node, level: 1 }));
  const wanted = new Set(levels);
  let index = 0;
  while (queue.length) {
    const item = queue.shift();
    if (!item || !item.node || item.level > 3) continue;
    if (wanted.has(item.level)) {
      out.push(makeScopedTargetRef(item.node, sourceRef, item.level, index));
      index += 1;
    }
    if (item.level < 3) {
      for (const child of collectDirectRuntimeTreeChildren(item.node)) {
        queue.push({ node: child, level: item.level + 1 });
      }
    }
  }
  return out;
}

function uniqueScopedTargets(targets) {
  const seenKeys = new Set();
  const seenNodes = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
  const out = [];
  for (const target of targets || []) {
    const node = target?.raw?.element || target?.element || null;
    if (node && typeof node === 'object') {
      if (seenNodes) {
        if (seenNodes.has(node)) continue;
        seenNodes.add(node);
        out.push(target);
        continue;
      }
      if (!target.__aiRuntimeScopeUid) {
        try {
          Object.defineProperty(target, '__aiRuntimeScopeUid', {
            value: `scope_node_${seenKeys.size + 1}`,
            enumerable: false,
          });
        } catch {}
      }
    }
    const key = node && target.__aiRuntimeScopeUid
      ? `node:${target.__aiRuntimeScopeUid}`
      : `${target?.id || ''}:${target?.type || ''}:${target?.scopeLevel ?? 0}:${target?.scopeSourceId || ''}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    out.push(target);
  }
  return out;
}

function expandTargetsByScope(baseTargets, scope, context) {
  if (!scope || !Array.isArray(scope.levels) || !scope.levels.length) return baseTargets;
  const out = [];
  for (const target of baseTargets || []) {
    const root = resolveDomElement(target, context);
    if (scope.levels.includes(0)) out.push(target);
    if (root) out.push(...collectRuntimeTreeNodesByLevels(root, scope.levels.filter((level) => level > 0), target));
  }
  return uniqueScopedTargets(out);
}

function resolveOperationTargets(operation, contract, selectionContext, context = {}) {
  const selected = selectionContext.selectedElements || [];
  const applyTo = operation?.applyTo || contract?.applyTo || 'single_selected';
  const selectionMode = operation?.selectionMode || contract?.selectionMode || 'selection_fallback';
  const targetScope = getRuntimeTargetScope(operation, contract, context);

  let baseTargets;
  if (selectionMode === 'current_selection' && selected.length > 0) {
    baseTargets = applyTo === 'all_selected_if_multiple' ? selected : [selected[0]];
  } else {
    baseTargets = [{
      id: String(operation?.target || contract?.target || 'selected_element'),
      type: 'semantic_target',
      label: String(operation?.target || contract?.target || 'selected_element'),
    }];
  }

  return expandTargetsByScope(baseTargets, targetScope, context);
}

function hasStyleApi(node) {
  return !!(node && typeof node === 'object' && node.style && typeof node.style.setProperty === 'function');
}

function isDomElement(node) {
  return !!(node && typeof node === 'object' && (node.nodeType === 1 || hasStyleApi(node)));
}

function safeGetDocument(context = {}) {
  return context.document || (typeof document !== 'undefined' ? document : null);
}

function escapeAttrValue(value) {
  return String(value || '').replace(/"/g, '\\"');
}

function resolveDomElement(targetRef, context = {}) {
  if (typeof context.resolveElement === 'function') {
    const resolved = context.resolveElement(targetRef);
    if (resolved) return resolved;
  }
  if (typeof context.getDomElement === 'function') {
    const resolved = context.getDomElement(targetRef);
    if (resolved) return resolved;
  }
  const raw = targetRef?.raw || null;
  const direct = raw?.element || raw?.el || raw?.dom || raw?.node || targetRef?.element || null;
  if (isDomElement(direct)) return direct;
  const doc = safeGetDocument(context);
  if (!doc) return null;
  const id = String(targetRef?.id || '').trim();
  if (!id) return null;
  const cssApi = globalThis.CSS || null;
  const selectors = [
    `#${cssApi?.escape ? cssApi.escape(id) : id}`,
    `[data-element-id="${escapeAttrValue(id)}"]`,
    `[data-node-id="${escapeAttrValue(id)}"]`,
    `[data-st-id="${escapeAttrValue(id)}"]`,
    `[data-uid="${escapeAttrValue(id)}"]`,
    `[data-id="${escapeAttrValue(id)}"]`,
  ];
  for (const selector of selectors) {
    try {
      const found = doc.querySelector(selector);
      if (found) return found;
    } catch {}
  }
  return null;
}

function readCssVar(source, name, fallback = '') {
  if (!source) return fallback;
  try {
    if (typeof source.getPropertyValue === 'function') {
      const value = source.getPropertyValue(name);
      if (value != null && String(value).trim()) return String(value).trim();
    }
  } catch {}
  return fallback;
}

function readThemeTokens(context = {}) {
  const explicit = context.siteTheme || context.themeTokens || null;
  if (explicit && typeof explicit === 'object') {
    return {
      bg: explicit.bg || explicit.surface || '#0f172a',
      panel: explicit.panel || explicit.surface2 || '#111827',
      text: explicit.text || explicit.textContent || '#e5e7eb',
      textSoft: explicit.textSoft || '#cbd5e1',
      accent: explicit.accent || '#38bdf8',
      accentSoft: explicit.accentSoft || 'rgba(56,189,248,0.14)',
      border: explicit.border || 'rgba(148,163,184,0.35)',
      shadow: explicit.shadow || '0 10px 26px rgba(2,6,23,0.28)',
      radius: explicit.radius || '12px',
    };
  }
  const doc = safeGetDocument(context);
  const root = doc?.documentElement || null;
  const cs = root && typeof getComputedStyle === 'function' ? getComputedStyle(root) : null;
  return {
    bg: readCssVar(cs, '--st-ink-2', '#0f172a'),
    panel: readCssVar(cs, '--st-ink-3', '#111827'),
    text: readCssVar(cs, '--st-text-main', '#e5e7eb'),
    textSoft: readCssVar(cs, '--st-text-soft', '#cbd5e1'),
    accent: readCssVar(cs, '--st-accent', '#38bdf8'),
    accentSoft: readCssVar(cs, '--st-accent-soft', 'rgba(56,189,248,0.14)'),
    border: readCssVar(cs, '--st-border', 'rgba(148,163,184,0.35)').replace(/^1px\s+solid\s+/i, ''),
    shadow: readCssVar(cs, '--st-shadow-soft', '0 10px 26px rgba(2,6,23,0.28)'),
    radius: readCssVar(cs, '--st-radius-md', '12px'),
  };
}

function setStyleValue(node, prop, value) {
  if (!hasStyleApi(node)) return false;
  try {
    node.style.setProperty(prop, value);
    return true;
  } catch {
    return false;
  }
}

function setInlineStyle(node, prop, value) {
  if (!hasStyleApi(node)) return false;
  try {
    node.style[prop] = value;
    return true;
  } catch {
    return false;
  }
}


function setInlineStyleImportant(node, cssProp, value) {
  if (!hasStyleApi(node)) return false;
  try {
    node.style.setProperty(cssProp, value, 'important');
    return true;
  } catch {
    return false;
  }
}

function setDatasetValue(node, key, value) {
  if (!node || !node.dataset) return false;
  try {
    node.dataset[key] = String(value);
    return true;
  } catch {
    return false;
  }
}

function hexToRgb(hex) {
  const raw = String(hex || '').trim();
  const match = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  const value = match[1].length === 3
    ? match[1].split('').map((c) => c + c).join('')
    : match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function parseColorToRgb(value) {
  if (!value) return null;
  const hex = hexToRgb(value);
  if (hex) return hex;
  const rgba = String(value).match(/rgba?\(([^)]+)\)/i);
  if (!rgba) return null;
  const nums = rgba[1].split(',').map((part) => Number.parseFloat(part.trim()));
  if (nums.length < 3 || nums.some((n) => Number.isNaN(n))) return null;
  return { r: nums[0], g: nums[1], b: nums[2] };
}

function relativeLuminance(color) {
  const rgb = parseColorToRgb(color);
  if (!rgb) return 0;
  const conv = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = conv(rgb.r);
  const g = conv(rgb.g);
  const b = conv(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function pickReadableTextColor(bg, preferred, fallbackLight = '#f8fafc', fallbackDark = '#0f172a') {
  if (preferred && contrastRatio(bg, preferred) >= 4.5) return preferred;
  const lightRatio = contrastRatio(bg, fallbackLight);
  const darkRatio = contrastRatio(bg, fallbackDark);
  return lightRatio >= darkRatio ? fallbackLight : fallbackDark;
}

function computeSpacingPreset(payload = {}) {
  const density = String(payload.density || 'balanced');
  if (density === 'compact') return { gap: '10px', py: '6px', px: '8px' };
  if (density === 'airy') return { gap: '18px', py: '10px', px: '14px' };
  return { gap: '14px', py: '8px', px: '10px' };
}

function computeRadiusPreset(payload = {}, tokens = {}) {
  const preset = String(payload.preset || 'keep_consistent_radius');
  if (preset === 'modernize_radius') return '14px';
  if (preset === 'refine_radius') return '10px';
  if (preset === 'keep_consistent_radius') return tokens.radius || '12px';
  return tokens.radius || '12px';
}

function computeBorderPreset(payload = {}, tokens = {}) {
  const preset = String(payload.preset || 'clean_border');
  if (preset === 'increase_surface_separation') return { color: tokens.border || 'rgba(148,163,184,0.45)', width: '1px', style: 'solid' };
  if (preset === 'simplify_border') return { color: 'transparent', width: '1px', style: 'solid' };
  return { color: tokens.border || 'rgba(148,163,184,0.35)', width: '1px', style: 'solid' };
}

function computeShadowPreset(payload = {}, tokens = {}) {
  const preset = String(payload.preset || 'subtle_elevation');
  if (preset === 'soften_shadow') return '0 6px 18px rgba(2,6,23,0.18)';
  if (preset === 'refine_shadow') return '0 8px 22px rgba(2,6,23,0.22)';
  return tokens.shadow || '0 10px 26px rgba(2,6,23,0.28)';
}

function computeHoverPreset(payload = {}, tokens = {}) {
  const preset = String(payload.preset || 'keep_hover_subtle');
  if (preset === 'enhance_hover_feedback') {
    return {
      bg: tokens.accentSoft || 'rgba(56,189,248,0.14)',
      text: pickReadableTextColor(tokens.accentSoft || '#0f172a', tokens.text, '#ffffff', '#0f172a'),
      transition: 'background-color .18s ease, box-shadow .18s ease, color .18s ease',
    };
  }
  return {
    bg: 'rgba(255,255,255,0.04)',
    text: tokens.text || '#e5e7eb',
    transition: 'background-color .18s ease, box-shadow .18s ease, color .18s ease',
  };
}

function inferElementKind(node, targetRef) {
  const type = String(targetRef?.type || '').toLowerCase();
  if (type.includes('menu')) return 'menu';
  if (type.includes('text') || type.includes('heading') || type.includes('article')) return 'text';
  if (node?.classList?.contains('st-block--menu')) return 'menu';
  if (node?.classList?.contains('st-block--text')) return 'text';
  if (node?.classList?.contains('st-block--button')) return 'button';
  return 'generic';
}

function recordMutation(context, entry) {
  try {
    // 00084: createBuilderRuntimeContext exposes both recordMutation and onMutation,
    // and both push into the same mutationLog array. Calling both duplicated every
    // runtime mutation in debug reports (mutationCount 2 for one shadow operation).
    // Prefer recordMutation because it also dispatches the runtime mutation event;
    // fall back to onMutation only for older/minimal test contexts.
    if (typeof context.recordMutation === 'function') context.recordMutation(entry);
    else if (typeof context.onMutation === 'function') context.onMutation(entry);
  } catch {}
}

function buildResult(runtime, targetRef, dryRun, applied, summary, extra = {}) {
  return {
    ok: true,
    applied,
    dryRun: !!dryRun,
    runtime,
    targetId: targetRef?.id ?? null,
    targetType: targetRef?.type ?? null,
    summary,
    ...extra,
  };
}

function buildMissingElementResult(runtime, targetRef, dryRun) {
  return buildResult(runtime, targetRef, dryRun, false, dryRun
    ? `dry-run: ${runtime}`
    : `target element not found for ${runtime}`, {
    nextStep: 'Provide context.resolveElement(...) or selected element DOM refs.',
  });
}


function normalizeLengthValue(value, fallback = '0px') {
  if (value == null) return fallback;
  if (typeof value === 'number') return `${value}px`;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.raw && typeof value.raw === 'string') return value.raw;
    if (typeof value.value === 'number') return `${value.value}${value.unit || 'px'}`;
  }
  return fallback;
}

function normalizeNumberValue(value, fallback = 1) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value.value === 'number' && Number.isFinite(value.value)) return value.value;
  return fallback;
}


function clampRuntimeNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function parseCssPxValue(value, fallback = 0) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === 'none' || raw === 'initial' || raw === 'unset' || raw === 'medium') return fallback;
  const match = raw.match(/(-?\d+(?:\.\d+)?)\s*px/i);
  if (match) {
    const n = Number.parseFloat(match[1]);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function readCurrentBorderWidthPx(node) {
  if (!node) return 0;
  const candidates = [];
  try { candidates.push(node.style?.getPropertyValue?.('border-width')); } catch {}
  try { candidates.push(node.style?.borderWidth); } catch {}
  try { candidates.push(node.style?.getPropertyValue?.('border-top-width')); } catch {}
  try { candidates.push(node.style?.borderTopWidth); } catch {}
  try { candidates.push(node.dataset?.aiBorderWidthApplied); } catch {}
  try {
    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(node) : null;
    candidates.push(cs?.getPropertyValue?.('border-top-width'));
    candidates.push(cs?.borderTopWidth);
    candidates.push(cs?.getPropertyValue?.('border-width'));
    candidates.push(cs?.borderWidth);
  } catch {}
  for (const item of candidates) {
    const raw = String(item ?? '').trim();
    if (!raw || raw === 'none' || raw === 'initial' || raw === 'unset') continue;
    const value = parseCssPxValue(raw, NaN);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}


function readCurrentRadiusPx(node) {
  if (!node) return 0;
  const candidates = [];
  try { candidates.push(node.style?.getPropertyValue?.('border-radius')); } catch {}
  try { candidates.push(node.style?.borderRadius); } catch {}
  try { candidates.push(node.style?.getPropertyValue?.('--st-menu-radius')); } catch {}
  try { candidates.push(node.dataset?.aiRadiusApplied); } catch {}
  try {
    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(node) : null;
    candidates.push(cs?.getPropertyValue?.('border-radius'));
    candidates.push(cs?.borderRadius);
    candidates.push(cs?.getPropertyValue?.('border-top-left-radius'));
    candidates.push(cs?.borderTopLeftRadius);
    candidates.push(cs?.getPropertyValue?.('--st-menu-radius'));
  } catch {}
  for (const item of candidates) {
    const raw = String(item ?? '').trim();
    if (!raw || raw === 'none' || raw === 'initial' || raw === 'unset') continue;
    const value = parseCssPxValue(raw, NaN);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function buildRadiusCssFromPayload(value, node) {
  if (value && typeof value === 'object' && (value.type === 'length_delta' || value.mode === 'relative_radius')) {
    const current = readCurrentRadiusPx(node);
    const delta = Number(value.delta);
    const next = clampRuntimeNumber(current + (Number.isFinite(delta) ? delta : 0), 0, 120);
    return {
      radius: `${Math.round(next * 100) / 100}px`,
      meta: {
        mode: 'incremental_radius',
        previousRadius: `${Math.round(current * 100) / 100}px`,
        delta: Number.isFinite(delta) ? delta : 0,
        nextRadius: `${Math.round(next * 100) / 100}px`,
        reason: value.reason || null,
      },
    };
  }
  if (value && typeof value === 'object' && value.raw === 'increase radius') {
    const current = readCurrentRadiusPx(node);
    const next = clampRuntimeNumber(current + 2, 0, 120);
    return {
      radius: `${Math.round(next * 100) / 100}px`,
      meta: {
        mode: 'incremental_radius',
        previousRadius: `${Math.round(current * 100) / 100}px`,
        delta: 2,
        nextRadius: `${Math.round(next * 100) / 100}px`,
        reason: 'legacy_increase_radius',
      },
    };
  }
  const radius = normalizeLengthValue(value, '12px');
  return {
    radius,
    meta: {
      mode: 'set_radius',
      previousRadius: node ? `${Math.round(readCurrentRadiusPx(node) * 100) / 100}px` : null,
      nextRadius: radius,
      reason: value?.reason || null,
    },
  };
}

function buildBorderWidthCssFromPayload(value, node) {
  if (value && typeof value === 'object' && (value.type === 'length_delta' || value.mode === 'relative_border_width')) {
    const current = readCurrentBorderWidthPx(node);
    const delta = Number(value.delta);
    const next = clampRuntimeNumber(current + (Number.isFinite(delta) ? delta : 0), 0, 40);
    return {
      width: `${Math.round(next * 100) / 100}px`,
      meta: {
        mode: 'incremental_border_width',
        previousWidth: `${Math.round(current * 100) / 100}px`,
        delta: Number.isFinite(delta) ? delta : 0,
        nextWidth: `${Math.round(next * 100) / 100}px`,
        reason: value.reason || null,
      }
    };
  }
  const width = normalizeLengthValue(value, '1px');
  return {
    width,
    meta: {
      mode: 'set_border_width',
      previousWidth: node ? `${Math.round(readCurrentBorderWidthPx(node) * 100) / 100}px` : null,
      nextWidth: width,
      reason: value?.reason || null,
    }
  };
}


function readCurrentDimensionPx(node, property = 'width') {
  if (!node) return 0;
  const prop = property === 'height' ? 'height' : 'width';
  const cssProp = prop === 'height' ? 'height' : 'width';
  const datasetKey = prop === 'height' ? 'aiHeightApplied' : 'aiWidthApplied';
  const candidates = [];
  try { candidates.push(node.dataset?.[datasetKey]); } catch {}
  try { candidates.push(node.style?.getPropertyValue?.(cssProp)); } catch {}
  try { candidates.push(node.style?.[cssProp]); } catch {}
  try {
    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(node) : null;
    candidates.push(cs?.getPropertyValue?.(cssProp));
    candidates.push(cs?.[cssProp]);
  } catch {}
  try {
    const rect = typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : null;
    if (rect) candidates.push(prop === 'height' ? rect.height : rect.width);
  } catch {}
  for (const item of candidates) {
    if (typeof item === 'number' && Number.isFinite(item) && item > 0) return item;
    const raw = String(item ?? '').trim();
    if (!raw || raw === 'none' || raw === 'initial' || raw === 'unset' || raw === 'auto') continue;
    const value = parseCssPxValue(raw, NaN);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return 0;
}

function isIgnorableDimensionChild(el) {
  if (!el || el.nodeType !== 1) return true;
  const tag = String(el.tagName || '').toLowerCase();
  if (tag === 'script' || tag === 'style' || tag === 'template') return true;
  const cls = String(el.className || '');
  if (/selection|resize|handle|outline|toolbar|popover|tooltip|debug/i.test(cls)) return true;
  try { const ds = el.dataset || {}; if (ds.stSelection || ds.selectionHandle || ds.resizeHandle) return true; } catch {}
  return false;
}
function measureBuilderChildRowPx(row, prop = 'height') {
  if (!row || !row.children) return 0;
  const kids = Array.from(row.children || []).filter((child) => {
    if (isIgnorableDimensionChild(child)) return false;
    try { return !!(child.matches && child.matches('.st-block, .st-section')); } catch { return false; }
  });
  if (!kids.length) return 0;
  let totalWidth = 0;
  let maxHeight = 0;
  try {
    for (const child of kids) {
      const rect = typeof child.getBoundingClientRect === 'function' ? child.getBoundingClientRect() : null;
      const w = rect ? rect.width : 0;
      const h = rect ? rect.height : 0;
      if (Number.isFinite(w) && w > 0) totalWidth += w;
      if (Number.isFinite(h) && h > maxHeight) maxHeight = h;
    }
    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(row) : null;
    const gap = cs ? (parseCssPxValue(cs.columnGap, 0) || parseCssPxValue(cs.gap, 0) || 0) : 0;
    if (prop === 'width' && kids.length > 1) totalWidth += gap * (kids.length - 1);
    if (cs) {
      if (prop === 'width') totalWidth += parseCssPxValue(cs.paddingLeft, 0) + parseCssPxValue(cs.paddingRight, 0);
      else maxHeight += parseCssPxValue(cs.paddingTop, 0) + parseCssPxValue(cs.paddingBottom, 0);
    }
  } catch {}
  return prop === 'height' ? maxHeight : totalWidth;
}

function isContentProtectedDimensionElement(node) {
  if (!node || node.nodeType !== 1) return false;
  const cls = String(node.className || '');
  const kind = String(node.dataset?.blockKind || node.dataset?.kind || node.dataset?.type || '').toLowerCase();
  if (/st-block--(button|text|icon|logo|image|article)/i.test(cls)) return true;
  if (/button|text|icon|logo|image|article/.test(kind)) return true;
  try {
    const role = String(node.getAttribute?.('role') || '').toLowerCase();
    if (role === 'button') return true;
  } catch {}
  return false;
}

function measureContentBoxPx(node, prop = 'height') {
  if (!node || !isContentProtectedDimensionElement(node)) return 0;
  try {
    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(node) : null;
    const padX = cs ? parseCssPxValue(cs.paddingLeft, 0) + parseCssPxValue(cs.paddingRight, 0) : 0;
    const padY = cs ? parseCssPxValue(cs.paddingTop, 0) + parseCssPxValue(cs.paddingBottom, 0) : 0;
    const borderX = cs ? parseCssPxValue(cs.borderLeftWidth, 0) + parseCssPxValue(cs.borderRightWidth, 0) : 0;
    const borderY = cs ? parseCssPxValue(cs.borderTopWidth, 0) + parseCssPxValue(cs.borderBottomWidth, 0) : 0;
    const gap = cs ? (parseCssPxValue(cs.columnGap, 0) || parseCssPxValue(cs.gap, 0) || 0) : 0;
    const visibleKids = Array.from(node.children || []).filter((child) => !isIgnorableDimensionChild(child));
    let contentW = 0;
    let contentH = 0;
    if (visibleKids.length) {
      const isFlex = cs && /flex|inline-flex/.test(String(cs.display || ''));
      const isColumn = isFlex && String(cs.flexDirection || '').indexOf('column') !== -1;
      for (const child of visibleKids) {
        const rect = typeof child.getBoundingClientRect === 'function' ? child.getBoundingClientRect() : null;
        const w = rect ? rect.width : 0;
        const h = rect ? rect.height : 0;
        if (!Number.isFinite(w) || !Number.isFinite(h)) continue;
        if (isColumn) {
          contentW = Math.max(contentW, w);
          contentH += h;
        } else if (isFlex || visibleKids.length > 1) {
          contentW += w;
          contentH = Math.max(contentH, h);
        } else {
          contentW = Math.max(contentW, w);
          contentH = Math.max(contentH, h);
        }
      }
      if ((isFlex || visibleKids.length > 1) && !isColumn) contentW += gap * Math.max(0, visibleKids.length - 1);
      if (isColumn) contentH += gap * Math.max(0, visibleKids.length - 1);
    } else {
      try {
        const doc = node.ownerDocument || (typeof document !== 'undefined' ? document : null);
        const range = doc?.createRange?.();
        if (range) {
          range.selectNodeContents(node);
          const rect = range.getBoundingClientRect();
          contentW = Number.isFinite(rect?.width) ? rect.width : 0;
          contentH = Number.isFinite(rect?.height) ? rect.height : 0;
          try { range.detach?.(); } catch {}
        }
      } catch {}
    }
    const measured = prop === 'width' ? contentW + padX + borderX : contentH + padY + borderY;
    return Number.isFinite(measured) && measured > 0 ? Math.ceil(measured) : 0;
  } catch {
    return 0;
  }
}

function measureLargestChildPx(node, prop = 'height') {
  if (!node || !node.children) return 0;
  let max = 0;
  const contentBox = measureContentBoxPx(node, prop);
  if (Number.isFinite(contentBox) && contentBox > max) max = contentBox;
  try {
    for (const child of Array.from(node.children || [])) {
      if (isIgnorableDimensionChild(child)) continue;
      let value = 0;
      try {
        if (child.matches && child.matches('.st-row')) {
          value = measureBuilderChildRowPx(child, prop);
        } else if (child.matches && child.matches('.st-block, .st-section')) {
          const rect = typeof child.getBoundingClientRect === 'function' ? child.getBoundingClientRect() : null;
          value = rect ? (prop === 'height' ? rect.height : rect.width) : 0;
        } else {
          value = 0;
        }
      } catch { value = 0; }
      if (Number.isFinite(value) && value > max) max = value;
    }
  } catch {}
  return max;
}
function measureParentInnerPx(node, prop = 'width') {
  const parent = node?.parentElement || null; if (!parent) return 0;
  try { const rect = typeof parent.getBoundingClientRect === 'function' ? parent.getBoundingClientRect() : null; if (!rect) return 0; let value = prop === 'height' ? rect.height : rect.width; const cs = typeof getComputedStyle === 'function' ? getComputedStyle(parent) : null; if (cs) { if (prop === 'height') value -= parseCssPxValue(cs.paddingTop, 0) + parseCssPxValue(cs.paddingBottom, 0); else value -= parseCssPxValue(cs.paddingLeft, 0) + parseCssPxValue(cs.paddingRight, 0); } return Number.isFinite(value) && value > 0 ? value : 0; } catch { return 0; }
}
function detectDimensionConstraint(node, prop, current, requested, delta) {
  if (!node || !Number.isFinite(requested)) return { next: requested, constraint: null };
  const safeRequested = Math.max(1, requested);
  const direction = Number.isFinite(delta) ? Math.sign(delta) : Math.sign(safeRequested - current);
  if (direction < 0) { const childSize = measureLargestChildPx(node, prop); if (childSize > 0 && safeRequested < childSize) { const next = Math.max(1, Math.round(childSize * 100) / 100); return { next, constraint: { code: 'child_block', message: 'Обмежено дочірнім блоком', property: prop, requestedValue: (Math.round(safeRequested * 100) / 100) + 'px', limitValue: next + 'px', childMaxValue: (Math.round(childSize * 100) / 100) + 'px' } }; } return { next: safeRequested, constraint: null }; }
  if (direction > 0) { const parentSize = measureParentInnerPx(node, prop); if (parentSize > 0 && safeRequested > parentSize) { const next = Math.max(1, Math.round(parentSize * 100) / 100); return { next, constraint: { code: 'parent_block', message: 'Обмежено батьківським блоком', property: prop, requestedValue: (Math.round(safeRequested * 100) / 100) + 'px', limitValue: next + 'px', parentInnerValue: (Math.round(parentSize * 100) / 100) + 'px' } }; } }
  return { next: safeRequested, constraint: null };
}

function getDraftAwareSiteStateStorageKey() {
  try {
    const active = !!(globalThis.window?.ST_PAGE_DRAFT_MODE
      && typeof globalThis.window.ST_PAGE_DRAFT_MODE.isActive === 'function'
      && globalThis.window.ST_PAGE_DRAFT_MODE.isActive());
    return active ? 'st_site_state_draft_v1' : 'st_site_state_v1';
  } catch {
    return 'st_site_state_v1';
  }
}

function normalizePxNumber(value) {
  const n = parseCssPxValue(value, NaN);
  return Number.isFinite(n) ? Math.max(1, Math.round(n * 100) / 100) : null;
}

function findDimensionBlockNode(node) {
  if (!node || typeof node.closest !== 'function') return node || null;
  try {
    return node.matches?.('.st-block') ? node : (node.closest('.st-block') || node);
  } catch {
    return node || null;
  }
}

function safeParseDimensionJson(raw, fallback = null) {
  try { return raw ? JSON.parse(String(raw)) : fallback; } catch { return fallback; }
}

function updateGeometryObjectDimension(geom, property, numeric) {
  if (!geom || typeof geom !== 'object') geom = { w: null, h: null, r: { tl: null, tr: null, br: null, bl: null } };
  if (!geom.r || typeof geom.r !== 'object') geom.r = { tl: null, tr: null, br: null, bl: null };
  if (property === 'width') geom.w = numeric;
  if (property === 'height') geom.h = numeric;
  return geom;
}

function setDimensionDatasetForUnifiedSource(node, property, numeric, cssValue) {
  if (!node || !property || !Number.isFinite(numeric)) return;
  try {
    node.dataset.stSizeMode = 'custom';
    node.dataset.sizeMode = 'custom';
    node.dataset.aiRuntimeUnlockedSize = '1';
    if (property === 'width') {
      node.dataset.stCustomW = cssValue;
      node.dataset.aiWidthApplied = cssValue;
    } else if (property === 'height') {
      node.dataset.stCustomH = cssValue;
      node.dataset.aiHeightApplied = cssValue;
    }
  } catch {}
}

function updateHbGeometryHint(node, property, cssValue) {
  try {
    const block = findDimensionBlockNode(node);
    const hb = block?.dataset?.hbRef ? block : (node?.dataset?.hbRef ? node : node?.closest?.('[data-hb-ref]'));
    if (!hb) return false;
    const numeric = normalizePxNumber(cssValue);
    if (numeric == null) return false;
    const geom = updateGeometryObjectDimension(safeParseDimensionJson(hb.dataset?.hbGeom || '', null), property, numeric);
    hb.dataset.hbGeom = JSON.stringify(geom);
    return true;
  } catch {
    return false;
  }
}

function persistHeaderStructureDimension(node, property, cssValue) {
  const block = findDimensionBlockNode(node);
  const hbRef = String(block?.dataset?.hbRef || node?.dataset?.hbRef || '').trim();
  const numeric = normalizePxNumber(cssValue);
  if (!hbRef || numeric == null) return false;
  try {
    const win = globalThis.window || null;
    const raw = win?.localStorage?.getItem?.('ST_HEADER_STRUCTURE') || '';
    const state = safeParseDimensionJson(raw, null);
    if (!state || !Array.isArray(state.sections)) return false;
    let changed = false;
    const touch = (obj) => {
      if (!obj || String(obj.id || '') !== hbRef) return;
      obj.geometry = updateGeometryObjectDimension(obj.geometry, property, numeric);
      changed = true;
    };
    for (const sec of state.sections || []) {
      touch(sec);
      for (const lvl of sec.levels || []) {
        touch(lvl);
        for (const c of lvl.containers || []) {
          touch(c);
          for (const b of c.blocks || []) touch(b);
        }
      }
    }
    if (!changed) return false;
    win.localStorage?.setItem?.('ST_HEADER_STRUCTURE', JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function cleanHeaderHtmlForUnifiedSave(slot) {
  if (!slot || typeof slot.cloneNode !== 'function') return '';
  try {
    const clone = slot.cloneNode(true);
    clone.querySelectorAll?.('.hb-panel')?.forEach?.((el) => el.remove());
    clone.querySelectorAll?.('.is-active, .is-selected, .hb-dom-active, .hb-dom-hover, .hb-dom-soft, .hb-ctor-hover')?.forEach?.((el) => {
      try { el.classList.remove('is-active', 'is-selected', 'hb-dom-active', 'hb-dom-hover', 'hb-dom-soft', 'hb-ctor-hover'); } catch {}
    });
    clone.querySelectorAll?.('[data-hb-ref], [data-hb-geom]')?.forEach?.((el) => {
      try { el.removeAttribute('data-hb-ref'); } catch {}
      try { el.removeAttribute('data-hb-geom'); } catch {}
    });
    return String(clone.innerHTML || '');
  } catch {
    return '';
  }
}

function getCurrentHeaderSaveModeForUnifiedSource(win) {
  try {
    const pageId = win?.ST_HEADER_STATE?.getCurrentPageIdFallback?.() || 'page:default';
    const globalModeRaw = win?.localStorage?.getItem?.('st_header_mode_global_v1');
    const globalMode = (globalModeRaw === 'page' || globalModeRaw === 'global') ? globalModeRaw : 'global';
    const mapRaw = win?.localStorage?.getItem?.('st_header_mode_pages_v1') || '';
    const map = safeParseDimensionJson(mapRaw, {}) || {};
    const perPage = map?.[String(pageId)];
    const mode = (perPage === 'page' || perPage === 'global') ? perPage : globalMode;
    return { pageId, mode };
  } catch {
    return { pageId: 'page:default', mode: 'global' };
  }
}

function persistCurrentHeaderHtmlToHeaderState(win, html) {
  if (!win || !html) return false;
  const { pageId, mode } = getCurrentHeaderSaveModeForUnifiedSource(win);
  try {
    const HS = win.ST_HEADER_STATE;
    if (HS && typeof HS.setGlobalHTML === 'function' && typeof HS.setPageHTML === 'function') {
      if (mode === 'page') HS.setPageHTML(pageId, html);
      else HS.setGlobalHTML(html);
      return true;
    }
  } catch {}
  try {
    const raw = win.localStorage?.getItem?.('st_header_state_v1') || '';
    const st = safeParseDimensionJson(raw, null) || { v: 1, global: { html: '' }, pages: {} };
    if (!st.global || typeof st.global !== 'object') st.global = { html: '' };
    if (!st.pages || typeof st.pages !== 'object') st.pages = {};
    if (mode === 'page') {
      const pid = String(pageId || 'page:default');
      st.pages[pid] = st.pages[pid] || { html: '' };
      st.pages[pid].html = html;
    } else {
      st.global.html = html;
    }
    st.v = 1;
    win.localStorage?.setItem?.('st_header_state_v1', JSON.stringify(st));
    return true;
  } catch {
    return false;
  }
}

function persistHeaderHtmlDimensionSource(node) {
  try {
    const doc = node?.ownerDocument || globalThis.document || null;
    const win = doc?.defaultView || globalThis.window || null;
    if (!doc || !win) return false;
    const block = findDimensionBlockNode(node);
    const slot = block?.closest?.('#st-site-header-slot') || null;
    if (!slot || !block || !slot.contains(block)) return false;
    const html = cleanHeaderHtmlForUnifiedSave(slot);
    if (!html || !html.trim()) return false;
    return persistCurrentHeaderHtmlToHeaderState(win, html);
  } catch {
    return false;
  }
}

function persistDimensionToBuilderSiteState(node, property, cssValue) {
  if (!node || !property || !cssValue) return false;
  const block = findDimensionBlockNode(node);
  const numeric = normalizePxNumber(cssValue);
  if (numeric == null) return false;
  const normalizedCss = `${numeric}px`;
  let saved = false;

  setDimensionDatasetForUnifiedSource(block || node, property, numeric, normalizedCss);
  try { if (updateHbGeometryHint(block || node, property, normalizedCss)) saved = true; } catch {}
  try { if (persistHeaderStructureDimension(block || node, property, normalizedCss)) saved = true; } catch {}

  try {
    const uid = String(block?.dataset?.uid || '').trim();
    if (block && uid) {
      const win = globalThis.window || null;
      const state = win?.siteState || null;
      if (state && state.blocks) {
        const record = state.blocks[uid] || (state.blocks[uid] = { id: uid, type: 'block', childrenRow: null, height: null, kind: 'block' });
        if (property === 'height') record.height = numeric;
        if (property === 'width') record.width = numeric;
        record.stSizeMode = 'custom';
        record.sizeMode = 'custom';
        record.aiRuntimeUnlockedSize = true;
        try {
          const key = getDraftAwareSiteStateStorageKey();
          win.localStorage?.setItem?.(key, JSON.stringify(state));
        } catch {}
        saved = true;
      }
    }
  } catch {}

  try {
    if (persistHeaderHtmlDimensionSource(block || node)) saved = true;
  } catch {}
  try {
    const win = globalThis.window || null;
    if ((block || node).closest?.('#st-site-footer-slot')) {
      win?.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.('footer', 'ai-runtime-explicit-commit');
      saved = true;
    }
  } catch {}
  try {
    const doc = (block || node)?.ownerDocument || globalThis.document || null;
    doc?.dispatchEvent?.(new CustomEvent('st:ai-runtime-unified-dimension-persisted', {
      detail: { property, value: normalizedCss, saved }
    }));
  } catch {}
  return saved;
}


function getDirectFrResizeRowForBlock(node) {
  const block = findDimensionBlockNode(node);
  if (!block || !block.classList || !block.classList.contains('st-block')) return null;
  const row = block.parentElement && block.parentElement.classList?.contains('st-row') ? block.parentElement : null;
  if (!row) return null;
  try { if (row.closest?.('.hb-panel')) return null; } catch {}
  const orient = String(row.dataset?.layoutOrient || 'row').toLowerCase();
  if (orient === 'column') return null;
  const mode = String(row.dataset?.layoutMode || 'fr').toLowerCase();
  // Mouse resize uses FR redistribution for default/grid rows. Flex/free rows keep pixel width.
  if (mode === 'flex' || mode === 'free') return null;
  const blocks = Array.from(row.querySelectorAll(':scope > .st-block')).filter((el) => el && !el.closest?.('.hb-panel'));
  if (blocks.length <= 1) return null;
  const index = blocks.indexOf(block);
  if (index < 0) return null;
  return { row, block, blocks, index };
}

function normalizeFrArray(values, count) {
  const list = Array.from({ length: count }, (_, i) => {
    const n = Number(values?.[i]);
    return Number.isFinite(n) && n > 0 ? n : 0;
  });
  const sum = list.reduce((a, b) => a + b, 0);
  if (!sum) {
    const eq = 1 / Math.max(1, count);
    return Array.from({ length: count }, () => eq);
  }
  return list.map((v) => v / sum);
}

function parseInlineFrColumns(value, count) {
  const raw = String(value || '').trim();
  if (!raw || !/fr\b/i.test(raw)) return null;
  const nums = raw.split(/\s+/).map((part) => {
    const m = String(part || '').match(/^(-?\d+(?:\.\d+)?)fr$/i);
    return m ? Number(m[1]) : NaN;
  });
  if (nums.length !== count || nums.some((n) => !Number.isFinite(n) || n <= 0)) return null;
  return normalizeFrArray(nums, count);
}

function readAiRowFrs(row, blocks) {
  const count = blocks.length;
  const byDataset = blocks.map((b) => Number.parseFloat(String(b?.dataset?.fr || '')));
  if (byDataset.length === count && byDataset.every((n) => Number.isFinite(n) && n > 0)) return normalizeFrArray(byDataset, count);
  const inline = parseInlineFrColumns(row?.style?.gridTemplateColumns, count);
  if (inline) return inline;
  try {
    const widths = blocks.map((b) => {
      const r = b?.getBoundingClientRect?.();
      return r && Number.isFinite(r.width) && r.width > 0 ? r.width : 0;
    });
    if (widths.every((n) => n > 0)) return normalizeFrArray(widths, count);
  } catch {}
  const eq = 1 / Math.max(1, count);
  return Array.from({ length: count }, () => eq);
}

function writeAiRowFrs(row, blocks, frs) {
  const safe = normalizeFrArray(frs, blocks.length);
  try { row.style.gridTemplateColumns = safe.map((f) => `${f.toFixed(4)}fr`).join(' '); } catch {}
  blocks.forEach((block, index) => {
    const fr = safe[index];
    try { block.dataset.fr = String(fr); } catch {}
    // In FR rows, width must live on row columns, not as per-block inline width.
    try { block.style.width = ''; } catch {}
    try { block.style.maxWidth = ''; } catch {}
  });
  return safe;
}

function getAiRowWidthPx(row) {
  try {
    const r = row?.getBoundingClientRect?.();
    if (r && Number.isFinite(r.width) && r.width > 0) return r.width;
  } catch {}
  return 0;
}

function getAiBlockMinWidthForFr(block, rowWidth) {
  let min = 1;
  try {
    const child = measureLargestChildPx(block, 'width');
    if (Number.isFinite(child) && child > min) min = child;
  } catch {}
  return Math.max(1, Math.min(Math.max(1, rowWidth || 1), Math.ceil(min)));
}

function saveAiRowFrsToCanonicalState(row, blocks, frs) {
  let saved = false;
  const win = row?.ownerDocument?.defaultView || globalThis.window || null;
  try {
    const state = win?.siteState || null;
    const rowId = String(row?.dataset?.uid || '').trim();
    if (state && rowId && state.rows) {
      const rowState = state.rows[rowId] || (state.rows[rowId] = { id: rowId, children: [] });
      rowState.columns = frs.slice();
      rowState.children = blocks.map((block) => String(block?.dataset?.uid || '')).filter(Boolean);
      if (state.blocks) {
        for (const block of blocks) {
          const bid = String(block?.dataset?.uid || '').trim();
          if (!bid) continue;
          const rec = state.blocks[bid] || (state.blocks[bid] = { id: bid, type: 'block', childrenRow: null, height: null, kind: 'block' });
          // Width for FR siblings is canonical on row.columns. Remove stale per-block widths from older AI fixes.
          rec.width = null;
          delete rec.aiRuntimeWidth;
        }
      }
      try {
        const key = getDraftAwareSiteStateStorageKey();
        win?.localStorage?.setItem?.(key, JSON.stringify(state));
      } catch {}
      saved = true;
    }
  } catch {}
  try {
    if (persistHeaderHtmlDimensionSource(row)) saved = true;
  } catch {}
  try {
    if (row?.closest?.('#st-site-header-slot')) {
      win?.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.('header', 'ai-runtime-explicit-commit');
      saved = true;
    }
  } catch {}
  try {
    if (row?.closest?.('#st-site-footer-slot')) {
      win?.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.('footer', 'ai-runtime-explicit-commit');
      saved = true;
    }
  } catch {}
  try {
    const doc = row?.ownerDocument || globalThis.document || null;
    doc?.dispatchEvent?.(new CustomEvent('st:ai-runtime-row-fr-dimension-persisted', { detail: { saved, frs: frs.slice() } }));
  } catch {}
  return saved;
}

function applyFrRowWidthDimensionIfNeeded(node, property, computed = {}) {
  if (property !== 'width') return null;
  const ctx = getDirectFrResizeRowForBlock(node);
  if (!ctx) return null;
  const { row, blocks, index } = ctx;
  const rowW = getAiRowWidthPx(row);
  if (!Number.isFinite(rowW) || rowW <= 1) return null;
  const requestedPx = parseCssPxValue(computed.value, NaN);
  if (!Number.isFinite(requestedPx)) return null;

  const currentFrs = readAiRowFrs(row, blocks);
  const minPxs = blocks.map((b) => getAiBlockMinWidthForFr(b, rowW));
  const minFrs = minPxs.map((px) => Math.max(1 / rowW, px / rowW));
  const minHere = minFrs[index] || (1 / rowW);
  const minOthersSum = minFrs.reduce((sum, fr, i) => i === index ? sum : sum + fr, 0);
  const maxHere = Math.max(minHere, 1 - minOthersSum);

  const rawTargetFr = requestedPx / rowW;
  const nextHere = clampRuntimeNumber(rawTargetFr, minHere, maxHere);
  const requestedRounded = `${Math.round(Math.max(1, requestedPx) * 100) / 100}px`;
  const nextPx = Math.max(1, nextHere * rowW);

  let constraint = null;
  if (requestedPx < minPxs[index]) {
    constraint = {
      code: 'child_block',
      message: 'Обмежено дочірнім блоком',
      property: 'width',
      requestedValue: requestedRounded,
      limitValue: `${Math.round(minPxs[index] * 100) / 100}px`,
      childMaxValue: `${Math.round(minPxs[index] * 100) / 100}px`,
    };
  } else if (requestedPx > maxHere * rowW) {
    constraint = {
      code: 'parent_block',
      message: 'Обмежено батьківським блоком',
      property: 'width',
      requestedValue: requestedRounded,
      limitValue: `${Math.round((maxHere * rowW) * 100) / 100}px`,
      parentInnerValue: `${Math.round(rowW * 100) / 100}px`,
    };
  }

  const othersIdx = blocks.map((_, i) => i).filter((i) => i !== index);
  const remain = Math.max(0, 1 - nextHere);
  const minSum = othersIdx.reduce((sum, i) => sum + (minFrs[i] || 0), 0);
  const freeRemain = Math.max(0, remain - minSum);
  const weights = othersIdx.map((i) => Math.max(0, (currentFrs[i] || 0) - (minFrs[i] || 0)));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const nextFrs = currentFrs.slice();
  nextFrs[index] = nextHere;
  othersIdx.forEach((i, idx) => {
    const base = minFrs[i] || 0;
    const add = weightSum > 0 ? freeRemain * (weights[idx] / weightSum) : (othersIdx.length ? freeRemain / othersIdx.length : 0);
    nextFrs[i] = base + add;
  });

  const normalized = writeAiRowFrs(row, blocks, nextFrs);
  const saved = saveAiRowFrsToCanonicalState(row, blocks, normalized);
  const finalValue = `${Math.round(nextPx * 100) / 100}px`;
  return {
    applied: true,
    saved,
    value: finalValue,
    meta: {
      ...(computed.meta || {}),
      mode: 'row_fr_dimension',
      property: 'width',
      nextValue: finalValue,
      requestedValue: constraint ? constraint.requestedValue : requestedRounded,
      constraint,
      rowFrs: normalized.slice(),
      rowWidth: `${Math.round(rowW * 100) / 100}px`,
      source: 'same_algorithm_as_mouse_width_resize',
    },
  };
}

function buildDimensionCssFromPayload(value, node, property = 'width') {
  const prop = property === 'height' ? 'height' : 'width';
  if (value && typeof value === 'object' && (value.type === 'length_delta' || value.mode === 'relative_dimension' || value.mode === 'relative_dimension_percent')) {
    const current = readCurrentDimensionPx(node, prop);
    const delta = Number(value.delta);
    let next = current;
    let mode = 'incremental_dimension';
    if (value.unit === '%' || value.mode === 'relative_dimension_percent') {
      mode = 'incremental_dimension_percent';
      next = current > 0
        ? current * (1 + (Number.isFinite(delta) ? delta : 0) / 100)
        : Math.max(0, Number.isFinite(delta) ? delta : 0);
    } else {
      next = current + (Number.isFinite(delta) ? delta : 0);
    }
    next = clampRuntimeNumber(next, 1, 10000);
    const limited = detectDimensionConstraint(node, prop, current, next, Number.isFinite(delta) ? delta : (next - current));
    next = clampRuntimeNumber(limited.next, 1, 10000);
    const rendered = (Math.round(next * 100) / 100) + 'px';
    return {
      value: rendered,
      meta: {
        mode,
        property: prop,
        previousValue: (Math.round(current * 100) / 100) + 'px',
        delta: Number.isFinite(delta) ? delta : 0,
        unit: value.unit || 'px',
        nextValue: rendered,
        requestedValue: limited.constraint ? limited.constraint.requestedValue : rendered,
        constraint: limited.constraint,
        reason: value.reason || null,
      },
    };
  }
  let rendered = value?.keyword === 'full_width'
    ? '100%'
    : value?.keyword === 'full_height'
      ? '100%'
      : value?.keyword === 'auto'
        ? 'auto'
        : normalizeLengthValue(value, prop === 'width' ? '100%' : 'auto');
  const current = node ? readCurrentDimensionPx(node, prop) : 0;
  let constraint = null;
  if (rendered !== 'auto' && rendered !== '100%') {
    const requested = parseCssPxValue(rendered, NaN);
    if (Number.isFinite(requested)) {
      const limited = detectDimensionConstraint(node, prop, current, requested, requested - current);
      constraint = limited.constraint;
      rendered = (Math.round(clampRuntimeNumber(limited.next, 1, 10000) * 100) / 100) + 'px';
    }
  }
  return {
    value: rendered,
    meta: {
      mode: 'set_dimension',
      property: prop,
      previousValue: node ? ((Math.round(current * 100) / 100) + 'px') : null,
      nextValue: rendered,
      constraint,
      reason: value?.reason || null,
    },
  };
}

function shouldStageOnly(payload = {}) {
  const state = String(payload?.state || 'default');
  const responsive = String(payload?.responsive || 'all');
  return state !== 'default' || responsive !== 'all';
}

function stageDeferredMutation(node, payload = {}) {
  if (!node) return;
  setDatasetValue(node, 'aiPendingState', payload?.state || 'default');
  setDatasetValue(node, 'aiPendingResponsive', payload?.responsive || 'all');
}

function getMenuColorVar(kind = 'text', hover = false) {
  if (kind === 'text') return hover ? '--st-menu-link-color-h' : '--st-menu-link-color';
  if (kind === 'bg') return hover ? '--st-menu-item-bg-h' : '--st-menu-item-bg';
  if (kind === 'border') return hover ? '--st-menu-item-bc-h' : '--st-menu-item-bc';
  if (kind === 'shadow') return hover ? '--st-menu-item-shadow-h' : '--st-menu-item-shadow';
  return '--st-menu-link-color';
}

function computeGradientCss(value = {}) {
  const angle = Number.isFinite(value?.angle) ? value.angle : 180;
  const stops = Array.isArray(value?.stops) && value.stops.length ? value.stops : Array.isArray(value?.colors) ? value.colors : [];
  const fallback = ['#2563eb', '#22c55e'];
  const pieces = (stops.length ? stops : fallback).map((item) => String(item));
  return `linear-gradient(${angle}deg, ${pieces.join(', ')})`;
}

function hexToRgba(hex, alpha = 1) {
  const raw = String(hex || '').trim();
  const normalized = raw.startsWith('#') ? raw.slice(1) : raw;
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) return null;
  const full = normalized.length === 3 ? normalized.split('').map((ch) => ch + ch).join('') : normalized;
  const int = Number.parseInt(full, 16);
  if (!Number.isFinite(int)) return null;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const safeAlpha = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  return `rgba(${r},${g},${b},${safeAlpha})`;
}

function computeShadowCss(value = {}, tokens = {}) {
  const style = String(value?.style || 'shadow');
  const adjustment = String(value?.adjustment || '');
  const colorHex = value?.color?.hex || value?.hex || null;
  const baseColor = colorHex || tokens.accent || '#38bdf8';
  const softColor = hexToRgba(baseColor, style === 'neon_shadow' || style === 'soft_neon_shadow' ? 0.26 : 0.24) || tokens.accentSoft || 'rgba(56,189,248,0.22)';
  const strongColor = hexToRgba(baseColor, style === 'neon_shadow' || style === 'soft_neon_shadow' ? 0.36 : 0.34) || tokens.accentSoft || 'rgba(56,189,248,0.28)';

  if (value?.type === 'shadow') {
    if (style === 'soft_neon_shadow') return `0 0 0 1px ${hexToRgba(baseColor, 0.18) || baseColor}, 0 8px 24px ${softColor}`;
    if (style === 'neon_shadow') return `0 0 0 1px ${baseColor}, 0 10px 28px ${strongColor}`;
    if (style === 'soft_shadow') return `0 6px 18px ${hexToRgba(baseColor, 0.18) || softColor}`;
    if (adjustment === 'stronger') return `0 12px 30px ${hexToRgba(baseColor, 0.34) || strongColor}`;
    if (adjustment === 'softer' || adjustment === 'weaker') return `0 6px 18px ${hexToRgba(baseColor, 0.18) || softColor}`;
    return `0 8px 24px ${hexToRgba(baseColor, 0.24) || softColor}`;
  }

  return tokens.shadow || '0 10px 26px rgba(2,6,23,0.28)';
}


function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function roundShadowNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

const AI_RUNTIME_STYLE_STATE_KEY = 'st_ai_runtime_style_state_v1';

function normalizeShadowCandidate(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === 'none' || raw === 'initial' || raw === 'unset') return '';
  return raw;
}

function readCurrentShadowCss(node) {
  if (!node) return '';
  const candidates = [];
  try { candidates.push(node.style?.getPropertyValue?.('box-shadow')); } catch {}
  try { candidates.push(node.style?.boxShadow); } catch {}
  try { candidates.push(node.style?.getPropertyValue?.('--st-button-shadow')); } catch {}
  try { candidates.push(node.dataset?.aiShadowApplied); } catch {}
  try {
    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(node) : null;
    candidates.push(cs?.getPropertyValue?.('box-shadow'));
    candidates.push(cs?.boxShadow);
    candidates.push(cs?.getPropertyValue?.('--st-button-shadow'));
  } catch {}
  return normalizeShadowCandidate(candidates.find((item) => normalizeShadowCandidate(item)) || '');
}

function safeRuntimeStorage(context = {}) {
  try { return context.storage || context.localStorage || globalThis.localStorage || null; } catch { return null; }
}

function readPersistedShadowCss(targetRef = {}, context = {}) {
  const storage = safeRuntimeStorage(context);
  if (!storage || typeof storage.getItem !== 'function') return '';
  const ids = [
    targetRef?.id,
    targetRef?.elementId,
    targetRef?.raw?.id,
    targetRef?.raw?.elementId,
    targetRef?.raw?.element?.dataset?.elementId,
    targetRef?.raw?.element?.dataset?.nodeId,
    targetRef?.raw?.element?.id,
  ].map((item) => String(item || '').trim()).filter(Boolean);
  if (!ids.length) return '';
  try {
    const state = JSON.parse(storage.getItem(AI_RUNTIME_STYLE_STATE_KEY) || '{}');
    const elements = state && typeof state === 'object' ? state.elements || {} : {};
    for (const id of ids) {
      const record = elements[id];
      const inline = record?.inlineStyles || {};
      const cssVars = record?.cssVars || {};
      const dataset = record?.dataset || {};
      const shadow = normalizeShadowCandidate(
        inline.boxShadow
        || inline['box-shadow']
        || cssVars['--st-button-shadow']
        || cssVars['--st-menu-item-shadow']
        || cssVars['--st-menu-shadow']
        || dataset.aiShadowApplied
      );
      if (shadow) return shadow;
    }
  } catch {}
  return '';
}

function readEffectiveShadowCss(node, targetRef = {}, context = {}) {
  return readCurrentShadowCss(node) || readPersistedShadowCss(targetRef, context);
}

function parseShadowColorAlpha(colorText) {
  const raw = String(colorText || '').trim();
  const rgba = raw.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const parts = rgba[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      return { r: parts[0], g: parts[1], b: parts[2], alpha: Number.isFinite(parts[3]) ? parts[3] : 1 };
    }
  }
  const rgb = parseColorToRgb(raw);
  if (rgb) return { ...rgb, alpha: 1 };
  return null;
}

function splitShadowCssLayers(css = '') {
  const raw = String(css || '').replace(/!important/gi, '').trim();
  const layers = [];
  let current = '';
  let depth = 0;
  for (const ch of raw) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      if (current.trim()) layers.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) layers.push(current.trim());
  return layers;
}

function parseShadowLayerCss(layer = '') {
  const raw = String(layer || '')
    .replace(/!important/gi, '')
    .replace(/\binset\b/gi, '')
    .trim();
  if (!raw || raw === 'none') return null;

  const colorMatch = raw.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
  const colorText = colorMatch ? colorMatch[0] : '';
  const withoutColor = colorText ? raw.replace(colorText, ' ') : raw;
  const nums = withoutColor.match(/-?\d+(?:\.\d+)?(?:px)?/g) || [];
  if (nums.length < 2) return null;

  const readNum = (value, fallback = 0) => {
    const n = Number.parseFloat(String(value || '').replace(/px$/i, ''));
    return Number.isFinite(n) ? n : fallback;
  };

  const color = colorText ? parseShadowColorAlpha(colorText) : null;
  return {
    x: readNum(nums[0], 0),
    y: readNum(nums[1], 0),
    blur: readNum(nums[2], 0),
    spread: nums[3] == null ? null : readNum(nums[3], 0),
    colorText,
    alpha: color?.alpha ?? 0.24
  };
}

function parseLastShadowLayer(css = '') {
  const raw = String(css || '').trim();
  if (!raw || raw === 'none') return null;

  // Browsers often return computed box-shadow in COLOR-FIRST order:
  //   rgba(34, 197, 94, 0.34) 0px 12px 30px 0px
  // while our generated value is LENGTH-FIRST:
  //   0 12px 30px rgba(34,197,94,0.34)
  // Parse both forms and choose the last valid layer.
  const layers = splitShadowCssLayers(raw);
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    const parsed = parseShadowLayerCss(layers[i]);
    if (parsed) return parsed;
  }
  return parseShadowLayerCss(raw);
}

function shadowColorToRgba(value = {}, alpha = 0.24, fallback = '#38bdf8') {
  const baseColor = value?.color?.hex || value?.hex || fallback;
  return hexToRgba(baseColor, alpha) || hexToRgba(fallback, alpha) || String(value?.color?.hex || fallback);
}


function isRemoveShadowValue(value = {}) {
  const mode = String(value?.mode || value?.incrementMode || '').toLowerCase();
  const raw = String(value?.raw || '').toLowerCase();
  return value?.remove === true || mode === 'remove_shadow' || mode === 'none' || raw === 'none' || raw === 'no-shadow' || raw === 'no shadow';
}

function computeIncrementalShadowCss(value = {}, tokens = {}, node = null, currentShadowInput = '') {
  const currentShadow = normalizeShadowCandidate(currentShadowInput || readCurrentShadowCss(node));
  if (isRemoveShadowValue(value)) {
    return { shadow: 'none', meta: { mode: 'remove_shadow', incrementPercent: 0, baseShadow: 'none', previousShadow: currentShadow || null, removed: true } };
  }
  const base = computeShadowCss(value, tokens);
  const incrementPercent = Number(value?.incrementPercent || 0);
  if (!incrementPercent) return { shadow: base, meta: { mode: 'set_shadow', incrementPercent: 0, baseShadow: base, previousShadow: currentShadow || null } };
  const current = parseLastShadowLayer(currentShadow);
  const baseLayer = parseLastShadowLayer(base);
  if (!current) return { shadow: base, meta: { mode: 'initial_shadow', incrementPercent, baseShadow: base, previousShadow: null, readSource: currentShadowInput ? 'provided_but_unparsed' : 'empty' } };
  const source = current || baseLayer || { x: 0, y: 8, blur: 24, spread: null, alpha: 0.24 };
  const sign = incrementPercent > 0 ? 1 : -1;
  const magnitude = Math.abs(incrementPercent);
  const ratio = magnitude / 100;
  const yDelta = magnitude >= 10 ? 2 : 1;
  const blurDelta = magnitude >= 10 ? 4 : 2;
  const nextY = clampNumber(source.y + sign * yDelta, 0, 80);
  const nextBlur = clampNumber(source.blur + sign * blurDelta, 0, 160);
  const nextSpread = source.spread == null ? null : clampNumber(source.spread + sign * Math.max(1, Math.round(blurDelta / 2)), -40, 80);
  const nextAlpha = clampNumber((source.alpha ?? baseLayer?.alpha ?? 0.24) + sign * ratio, 0.05, 0.92);
  const color = shadowColorToRgba(value, nextAlpha, tokens.accent || '#38bdf8');
  const spreadPart = nextSpread == null ? '' : ` ${roundShadowNumber(nextSpread)}px`;
  const shadow = `${roundShadowNumber(source.x)}px ${roundShadowNumber(nextY)}px ${roundShadowNumber(nextBlur)}px${spreadPart} ${color}`;
  return { shadow, meta: { mode: 'incremental_shadow_strength', incrementPercent, previousShadow: currentShadow || null, previous: { y: source.y, blur: source.blur, spread: source.spread, alpha: source.alpha }, next: { y: nextY, blur: nextBlur, spread: nextSpread, alpha: nextAlpha }, baseShadow: base } };
}

function currentStyleNumber(node, prop, fallback = 0) {
  if (!node) return fallback;
  try {
    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(node) : null;
    const raw = cs ? cs[prop] || cs.getPropertyValue?.(prop) : node.style?.[prop];
    const num = Number.parseFloat(String(raw || '').replace(',', '.'));
    return Number.isFinite(num) ? num : fallback;
  } catch {
    return fallback;
  }
}

function applyGenericColor(node, cssProp, value) {
  if (!node) return false;
  return setInlineStyle(node, cssProp, value);
}

function applySvgCurrentColor(node, value) {
  if (!node || typeof node.querySelectorAll !== 'function') return 0;
  let changed = 0;
  for (const el of node.querySelectorAll('svg, svg *')) {
    if (setInlineStyle(el, 'color', value)) changed += 1;
    if (setInlineStyle(el, 'fill', value)) changed += 1;
    if (setInlineStyle(el, 'stroke', value)) changed += 1;
  }
  return changed;
}

function stableElementId(node, fallback = '') {
  if (!node) return fallback || '';
  try {
    return String(
      node.dataset?.elementId
      || node.dataset?.nodeId
      || node.dataset?.stId
      || node.dataset?.uid
      || node.dataset?.hbRef
      || node.id
      || fallback
      || ''
    );
  } catch {
    return fallback || '';
  }
}

function textTargetTypeFromNode(node) {
  if (!node || !node.classList) return 'text_descendant';
  if (node.classList.contains('st-block--button')) return 'button_block';
  if (node.classList.contains('st-button__label')) return 'button_label';
  if (node.classList.contains('st-block--heading')) return 'heading_block';
  if (node.classList.contains('st-block--text')) return 'text_block';
  if (node.classList.contains('st-block--article')) return 'article_block';
  if (node.classList.contains('st-block--menu')) return 'menu_block';
  if (/^(H1|H2|H3|H4|H5|H6|P|SPAN|A|LABEL|BUTTON)$/i.test(String(node.tagName || ''))) return String(node.tagName || '').toLowerCase();
  return 'text_descendant';
}

function isTextBearingElement(node) {
  if (!node || node.nodeType !== 1) return false;
  try {
    if (node.classList?.contains('st-block--button')) return true;
    if (node.classList?.contains('st-button__label')) return true;
    if (node.classList?.contains('st-block--text')) return true;
    if (node.classList?.contains('st-block--heading')) return true;
    if (node.classList?.contains('st-block--article')) return true;
    if (node.matches?.('[data-text], [data-st-text], [contenteditable="true"]')) return true;
    if (/^(H1|H2|H3|H4|H5|H6|P|SPAN|A|LABEL|BUTTON)$/i.test(String(node.tagName || ''))) {
      return String(node.textContent || '').trim().length > 0;
    }
  } catch {}
  return false;
}

function collectTextColorTargets(root) {
  const targets = [];
  const push = (node) => {
    if (!node || !isDomElement(node)) return;
    if (!isTextBearingElement(node)) return;
    if (targets.includes(node)) return;
    targets.push(node);
  };
  push(root);
  if (root && typeof root.querySelectorAll === 'function') {
    const selector = [
      '.st-block--button',
      '.st-button__label',
      '.st-block--text',
      '.st-block--heading',
      '.st-block--article',
      '[data-text]',
      '[data-st-text]',
      '[contenteditable="true"]',
      'h1','h2','h3','h4','h5','h6','p','span','a','label','button'
    ].join(',');
    try { root.querySelectorAll(selector).forEach(push); } catch {}
  }
  return targets;
}

function applyTextColorToSingleNode(node, color) {
  if (!node) return false;
  let changed = false;
  const kind = textTargetTypeFromNode(node);
  if (kind === 'button_block') {
    changed = setStyleValue(node, '--st-button-fg', color) || changed;
    changed = setInlineStyle(node, 'color', color) || changed;
    try {
      const label = node.querySelector?.(':scope > .st-button__label');
      if (label) changed = setInlineStyle(label, 'color', color) || changed;
    } catch {}
    return changed;
  }
  if (kind === 'button_label') {
    changed = setInlineStyle(node, 'color', color) || changed;
    try {
      const button = node.closest?.('.st-block--button');
      if (button) changed = setStyleValue(button, '--st-button-fg', color) || changed;
    } catch {}
    return changed;
  }
  return applyGenericColor(node, 'color', color);
}

function buildTextColorDescendantPatch(node, color) {
  const id = stableElementId(node);
  if (!id) return null;
  const type = textTargetTypeFromNode(node);
  const patch = {
    targetId: id,
    targetType: type,
    runtime: 'applyTextColorValue',
    summary: 'text color applied to descendant',
    inlineStyles: {},
    cssVars: {},
    dataset: {},
    meta: { propagatedTextColor: true },
  };
  if (type === 'button_block') {
    patch.cssVars['--st-button-fg'] = color;
    patch.inlineStyles.color = color;
  } else {
    patch.inlineStyles.color = color;
  }
  if (!Object.keys(patch.inlineStyles).length) delete patch.inlineStyles;
  if (!Object.keys(patch.cssVars).length) delete patch.cssVars;
  if (!Object.keys(patch.dataset).length) delete patch.dataset;
  return patch;
}

function applyTextColorToNodeAndDescendants(root, color) {
  const targets = collectTextColorTargets(root);
  let changed = 0;
  const descendantPatches = [];
  for (const item of targets) {
    if (applyTextColorToSingleNode(item, color)) changed += 1;
    const patch = buildTextColorDescendantPatch(item, color);
    if (patch) descendantPatches.push(patch);
  }
  return { changed, descendantPatches };
}

function applyPendingAwareMutation(node, payload, mutateFn) {
  const stagedOnly = shouldStageOnly(payload);
  if (stagedOnly) stageDeferredMutation(node, payload);
  if (stagedOnly) return { stagedOnly: true };
  mutateFn();
  return { stagedOnly: false };
}

async function applyPalettePolicyHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyPalettePolicy', targetRef, dryRun);
  const tokens = readThemeTokens(context);
  const bg = tokens.panel || tokens.bg;
  const text = pickReadableTextColor(bg, tokens.text, '#f8fafc', '#0f172a');
  const accent = tokens.accent || '#38bdf8';
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    if (kind === 'menu') {
      setStyleValue(node, '--st-menu-link-color', text);
      setStyleValue(node, '--st-menu-link-color-h', '#ffffff');
      setStyleValue(node, '--st-menu-item-bg', 'transparent');
      setStyleValue(node, '--st-menu-item-bg-h', tokens.accentSoft || 'rgba(56,189,248,0.14)');
      setStyleValue(node, '--st-menu-item-bc', 'transparent');
      setStyleValue(node, '--st-menu-item-bc-h', accent);
      setStyleValue(node, '--st-menu-lc-bg', 'transparent');
      setStyleValue(node, '--st-menu-lc-bc', 'transparent');
      setStyleValue(node, '--st-menu-bg-h', tokens.accentSoft || 'rgba(56,189,248,0.14)');
    } else {
      setInlineStyle(node, 'backgroundColor', bg);
      setInlineStyle(node, 'color', text);
      setInlineStyle(node, 'borderColor', tokens.border || 'rgba(148,163,184,0.35)');
    }
    setDatasetValue(node, 'aiPalettePolicy', operation?.payload?.mode || 'harmonize_with_site_theme');
    recordMutation(context, { runtime: 'applyPalettePolicy', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('applyPalettePolicy', targetRef, dryRun, true, 'palette policy applied', {
    payload: { bg, text, accent },
  });
}

async function applyContrastPolicyHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyContrastPolicy', targetRef, dryRun);
  const tokens = readThemeTokens(context);
  const bg = hasStyleApi(node) && !dryRun ? (node.style.backgroundColor || tokens.panel || tokens.bg) : (tokens.panel || tokens.bg);
  const text = pickReadableTextColor(bg, tokens.text, '#f8fafc', '#0f172a');
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    if (kind === 'menu') {
      setStyleValue(node, '--st-menu-link-color', text);
      setStyleValue(node, '--st-menu-link-color-h', '#ffffff');
    } else {
      setInlineStyle(node, 'color', text);
    }
    setDatasetValue(node, 'aiContrastPolicy', operation?.payload?.mode || 'normalize');
    recordMutation(context, { runtime: 'applyContrastPolicy', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('applyContrastPolicy', targetRef, dryRun, true, 'contrast policy applied', {
    payload: { text, minBody: operation?.payload?.minBody || '4.5:1' },
  });
}

async function applySpacingScaleHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applySpacingScale', targetRef, dryRun);
  const preset = computeSpacingPreset(operation?.payload || {});
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    if (kind === 'menu') {
      setStyleValue(node, '--st-menu-gap', preset.gap);
      setStyleValue(node, '--st-menu-pad-y', preset.py);
      setStyleValue(node, '--st-menu-pad-x', preset.px);
    } else {
      setInlineStyle(node, 'gap', preset.gap);
      setInlineStyle(node, 'padding', `${preset.py} ${preset.px}`);
    }
    setDatasetValue(node, 'aiSpacingDensity', operation?.payload?.density || 'balanced');
    recordMutation(context, { runtime: 'applySpacingScale', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('applySpacingScale', targetRef, dryRun, true, 'spacing scale applied', { payload: preset });
}

async function applyAlignmentPolicyHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyAlignmentPolicy', targetRef, dryRun);
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    if (kind === 'menu') {
      setStyleValue(node, '--st-menu-lc-bg', 'transparent');
      setDatasetValue(node, 'aiAlignmentPolicy', operation?.payload?.mode || 'grid');
    } else {
      setInlineStyle(node, 'textAlign', 'left');
      setDatasetValue(node, 'aiAlignmentPolicy', operation?.payload?.mode || 'grid');
    }
    recordMutation(context, { runtime: 'applyAlignmentPolicy', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('applyAlignmentPolicy', targetRef, dryRun, true, 'alignment policy applied', {
    payload: { mode: operation?.payload?.mode || 'grid' },
  });
}

async function applyShadowPresetHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyShadowPreset', targetRef, dryRun);
  const tokens = readThemeTokens(context);
  const shadow = computeShadowPreset(operation?.payload || {}, tokens);
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    if (kind === 'menu') {
      setStyleValue(node, '--st-menu-item-shadow', shadow);
      setStyleValue(node, '--st-menu-item-shadow-h', shadow);
    } else {
      setInlineStyle(node, 'boxShadow', shadow);
    }
    setDatasetValue(node, 'aiShadowPreset', operation?.payload?.preset || 'subtle_elevation');
    recordMutation(context, { runtime: 'applyShadowPreset', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('applyShadowPreset', targetRef, dryRun, true, 'shadow preset applied', { payload: { shadow } });
}

async function applyBorderPresetHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyBorderPreset', targetRef, dryRun);
  const tokens = readThemeTokens(context);
  const border = computeBorderPreset(operation?.payload || {}, tokens);
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    if (kind === 'menu') {
      setStyleValue(node, '--st-menu-item-bc', border.color);
      setStyleValue(node, '--st-menu-item-bc-h', border.color);
      setStyleValue(node, '--st-menu-item-bw', border.width);
      setStyleValue(node, '--st-menu-item-bs', border.style);
    } else {
      setInlineStyle(node, 'borderStyle', border.style);
      setInlineStyle(node, 'borderWidth', border.width);
      setInlineStyle(node, 'borderColor', border.color);
    }
    setDatasetValue(node, 'aiBorderPreset', operation?.payload?.preset || 'clean_border');
    recordMutation(context, { runtime: 'applyBorderPreset', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('applyBorderPreset', targetRef, dryRun, true, 'border preset applied', { payload: border });
}

async function applyRadiusPresetHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyRadiusPreset', targetRef, dryRun);
  const tokens = readThemeTokens(context);
  const radius = computeRadiusPreset(operation?.payload || {}, tokens);
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    if (kind === 'menu') {
      setStyleValue(node, '--st-menu-radius', radius);
      setStyleValue(node, '--st-menu-item-rtl', radius);
      setStyleValue(node, '--st-menu-item-rtr', radius);
      setStyleValue(node, '--st-menu-item-rbr', radius);
      setStyleValue(node, '--st-menu-item-rbl', radius);
    } else {
      setInlineStyle(node, 'borderRadius', radius);
    }
    setDatasetValue(node, 'aiRadiusPreset', operation?.payload?.preset || 'keep_consistent_radius');
    recordMutation(context, { runtime: 'applyRadiusPreset', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('applyRadiusPreset', targetRef, dryRun, true, 'radius preset applied', { payload: { radius } });
}

async function applyHoverPresetHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyHoverPreset', targetRef, dryRun);
  const tokens = readThemeTokens(context);
  const hover = computeHoverPreset(operation?.payload || {}, tokens);
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    if (kind === 'menu') {
      setStyleValue(node, '--st-menu-item-bg-h', hover.bg);
      setStyleValue(node, '--st-menu-link-color-h', hover.text);
      setStyleValue(node, '--st-menu-item-shadow-h', computeShadowPreset({ preset: 'soften_shadow' }, tokens));
    } else {
      setInlineStyle(node, 'transition', hover.transition);
      setDatasetValue(node, 'aiHoverBg', hover.bg);
      setDatasetValue(node, 'aiHoverText', hover.text);
    }
    setDatasetValue(node, 'aiHoverPreset', operation?.payload?.preset || 'keep_hover_subtle');
    recordMutation(context, { runtime: 'applyHoverPreset', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('applyHoverPreset', targetRef, dryRun, true, 'hover preset applied', { payload: hover });
}

async function selectNextPresetHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  const preset = operation?.payload?.preset || 'clean_modern';
  if (!dryRun && node) {
    setDatasetValue(node, 'aiSelectedPreset', preset);
    recordMutation(context, { runtime: 'selectNextPreset', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('selectNextPreset', targetRef, dryRun, true, `selected preset ${preset}`, {
    payload: { preset, strategy: operation?.payload?.strategy || 'pick_next_distinct_preset' },
  });
}

async function varyStyleAxisHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  const axis = operation?.payload?.axis || 'style_axis';
  if (!dryRun && node) {
    setDatasetValue(node, 'aiVaryAxis', axis);
    recordMutation(context, { runtime: 'varyStyleAxis', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('varyStyleAxis', targetRef, dryRun, true, `varied style axis ${axis}`, {
    payload: { axis, mode: operation?.payload?.mode || 'vary' },
  });
}

async function applyStyleStrategyHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyStyleStrategy', targetRef, dryRun);
  if (!dryRun && node) {
    setDatasetValue(node, 'aiStyleStrategy', operation?.payload?.action || 'apply_style_strategy');
    recordMutation(context, { runtime: 'applyStyleStrategy', targetId: targetRef?.id || null, payload: operation?.payload || null });
  }
  return buildResult('applyStyleStrategy', targetRef, dryRun, true, 'generic style strategy applied', {
    payload: operation?.payload || null,
  });
}


async function applyBackgroundValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyBackgroundValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const color = payload?.value?.hex || payload?.value?.raw || payload?.value?.colorId || null;
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    const staged = applyPendingAwareMutation(node, payload, () => {
      if (kind === 'menu') {
        setStyleValue(node, getMenuColorVar('bg', payload?.state === 'hover'), color || 'transparent');
      } else if (kind === 'button') {
        const nextColor = color || 'transparent';
        setStyleValue(node, '--st-button-fill', nextColor);
        setInlineStyle(node, 'backgroundColor', nextColor);
        try {
          if (node.dataset) {
            node.dataset.buttonFillMode = 'solid';
            node.dataset.buttonColor1 = nextColor;
            node.dataset.buttonColor2 = nextColor;
          }
        } catch {}
      } else {
        applyGenericColor(node, 'backgroundColor', color || 'transparent');
      }
    });
    recordMutation(context, { runtime: 'applyBackgroundValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyBackgroundValue', targetRef, dryRun, true, 'background value applied', { payload });
}

async function applyGradientValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyGradientValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const gradientCss = computeGradientCss(payload?.value || {});
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    const staged = applyPendingAwareMutation(node, payload, () => {
      if (kind === 'menu') setStyleValue(node, getMenuColorVar('bg', payload?.state === 'hover'), gradientCss);
      else setInlineStyle(node, 'backgroundImage', gradientCss);
    });
    recordMutation(context, { runtime: 'applyGradientValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyGradientValue', targetRef, dryRun, true, 'gradient value applied', { payload: { gradientCss } });
}

async function applyTextColorValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyTextColorValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const color = payload?.value?.hex || payload?.value?.raw || '#e5e7eb';
  let descendantPatches = [];
  let changedCount = 0;
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    const scopedLevels = normalizeRuntimeTargetScopeLevels(payload?.targetScope);
    const staged = applyPendingAwareMutation(node, payload, () => {
      if (kind === 'menu') {
        if (setStyleValue(node, getMenuColorVar('text', payload?.state === 'hover'), color)) changedCount += 1;
      } else if (scopedLevels.length) {
        if (applyTextColorToSingleNode(node, color)) changedCount += 1;
        else if (setInlineStyle(node, 'color', color)) changedCount += 1;
      } else {
        if (setInlineStyle(node, 'color', color)) changedCount += 1;
        const propagated = applyTextColorToNodeAndDescendants(node, color);
        changedCount += propagated.changed;
        descendantPatches = propagated.descendantPatches;
      }
    });
    const payloadWithPropagation = { ...payload, textColorPropagation: { mode: scopedLevels.length ? 'selected_tree_levels' : 'selected_and_text_descendants', levels: scopedLevels, changedCount, descendantPatches } };
    recordMutation(context, { runtime: 'applyTextColorValue', targetId: targetRef?.id || null, payload: payloadWithPropagation, stagedOnly: staged.stagedOnly });
    return buildResult('applyTextColorValue', targetRef, dryRun, true, 'text color applied', { payload: payloadWithPropagation });
  }
  return buildResult('applyTextColorValue', targetRef, dryRun, true, 'text color applied', { payload });
}

async function applyIconColorValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyIconColorValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const color = payload?.value?.hex || payload?.value?.raw || '#e5e7eb';
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => {
      applyGenericColor(node, 'color', color);
      applySvgCurrentColor(node, color);
    });
    recordMutation(context, { runtime: 'applyIconColorValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyIconColorValue', targetRef, dryRun, true, 'icon color applied', { payload });
}

async function applyBorderColorValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyBorderColorValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const color = payload?.value?.hex || payload?.value?.raw || 'rgba(148,163,184,0.35)';
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    const staged = applyPendingAwareMutation(node, payload, () => {
      if (kind === 'menu') setStyleValue(node, getMenuColorVar('border', payload?.state === 'hover'), color);
      else applyGenericColor(node, 'borderColor', color);
      if (!node.style.borderStyle || node.style.borderStyle === 'none') setInlineStyle(node, 'borderStyle', 'solid');
      if (!node.style.borderWidth || node.style.borderWidth === '0px' || node.style.borderWidth === '0') setInlineStyle(node, 'borderWidth', '1px');
    });
    recordMutation(context, { runtime: 'applyBorderColorValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyBorderColorValue', targetRef, dryRun, true, 'border color applied', { payload });
}

async function applyBorderWidthValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyBorderWidthValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const computed = buildBorderWidthCssFromPayload(payload?.value, node);
  const width = computed.width;
  const payloadWithMeta = { ...payload, borderWidthIncrement: computed.meta };
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payloadWithMeta, () => {
      setInlineStyle(node, 'borderWidth', width);
      setDatasetValue(node, 'aiBorderWidthApplied', width);
      if (!node.style.borderStyle || node.style.borderStyle === 'none') setInlineStyle(node, 'borderStyle', 'solid');
    });
    recordMutation(context, { runtime: 'applyBorderWidthValue', targetId: targetRef?.id || null, payload: payloadWithMeta, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyBorderWidthValue', targetRef, dryRun, true, 'border width applied', { payload: { width, borderWidthIncrement: computed.meta } });
}

async function applyBorderStyleValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyBorderStyleValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const styleValue = payload?.value?.style || payload?.value?.raw || 'solid';
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => {
      setInlineStyle(node, 'borderStyle', styleValue);
      if (!node.style.borderWidth) setInlineStyle(node, 'borderWidth', '1px');
    });
    recordMutation(context, { runtime: 'applyBorderStyleValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyBorderStyleValue', targetRef, dryRun, true, 'border style applied', { payload: { style: styleValue } });
}

async function applyRadiusValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyRadiusValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const computed = buildRadiusCssFromPayload(payload?.value, node);
  const radius = computed.radius;
  const payloadWithMeta = { ...payload, radiusIncrement: computed.meta };
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    const staged = applyPendingAwareMutation(node, payloadWithMeta, () => {
      if (kind === 'menu') setStyleValue(node, '--st-menu-radius', radius);
      else setInlineStyle(node, 'borderRadius', radius);
      setDatasetValue(node, 'aiRadiusApplied', radius);
    });
    recordMutation(context, { runtime: 'applyRadiusValue', targetId: targetRef?.id || null, payload: payloadWithMeta, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyRadiusValue', targetRef, dryRun, true, 'radius applied', { payload: { radius, radiusIncrement: computed.meta } });
}

async function applyShadowValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyShadowValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const tokens = readThemeTokens(context);
  const previousShadow = readEffectiveShadowCss(node, targetRef, context);
  const shadowResult = computeIncrementalShadowCss(payload?.value || {}, tokens, node, previousShadow);
  const shadow = shadowResult.shadow;
  shadowResult.meta.previousShadowSource = previousShadow ? (readCurrentShadowCss(node) ? 'dom' : 'persisted_state') : 'none';
  payload.shadowCss = shadow;
  payload.shadowIncrement = shadowResult.meta;
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    const staged = applyPendingAwareMutation(node, payload, () => {
      if (kind === 'menu') setStyleValue(node, getMenuColorVar('shadow', payload?.state === 'hover'), shadow);
      else if (kind === 'button') {
        setInlineStyleImportant(node, 'box-shadow', shadow);
        setInlineStyleImportant(node, '--st-button-shadow', shadow);
        setDatasetValue(node, 'aiShadowApplied', shadow);
      } else {
        setInlineStyle(node, 'boxShadow', shadow);
        setDatasetValue(node, 'aiShadowApplied', shadow);
      }
    });
    recordMutation(context, { runtime: 'applyShadowValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyShadowValue', targetRef, dryRun, true, 'shadow applied', { payload: { shadow } });
}

async function applyTextShadowValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyTextShadowValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const mode = payload?.mode || 'set';
  const tokens = readThemeTokens(context);
  const shadow = mode === 'remove' ? 'none' : computeShadowCss(payload?.value || {}, tokens).replace('0 8px 24px', '0 2px 6px').replace('0 10px 26px', '0 2px 6px');
  payload.shadowCss = shadow;
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => applyGenericColor(node, 'textShadow', shadow));
    recordMutation(context, { runtime: 'applyTextShadowValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyTextShadowValue', targetRef, dryRun, true, 'text shadow applied', { payload: { shadow, mode } });
}

async function applyTextStrokeValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyTextStrokeValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const width = normalizeLengthValue(payload?.value, '1px');
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => {
      setInlineStyle(node, '-webkit-text-stroke-width', width);
      setInlineStyle(node, '-webkit-text-stroke-color', 'currentColor');
    });
    recordMutation(context, { runtime: 'applyTextStrokeValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyTextStrokeValue', targetRef, dryRun, true, 'text stroke applied', { payload: { width } });
}

async function applyOpacityValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyOpacityValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  let opacity = normalizeNumberValue(payload?.value, 100);
  if (String(payload?.value?.unit || '') === '%') opacity = opacity / 100;
  if (opacity > 1) opacity = opacity / 100;
  opacity = Math.max(0, Math.min(1, opacity));
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => setInlineStyle(node, 'opacity', String(opacity)));
    recordMutation(context, { runtime: 'applyOpacityValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyOpacityValue', targetRef, dryRun, true, 'opacity applied', { payload: { opacity } });
}

async function applyBlurValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyBlurValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const blur = normalizeLengthValue(payload?.value, '4px');
  const mode = payload?.value?.mode || 'element';
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => {
      if (mode === 'backdrop') setInlineStyle(node, 'backdropFilter', `blur(${blur})`);
      else setInlineStyle(node, 'filter', `blur(${blur})`);
    });
    recordMutation(context, { runtime: 'applyBlurValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyBlurValue', targetRef, dryRun, true, 'blur applied', { payload: { blur, mode } });
}


function spacingStylePropertyName(property, side){
  const prop = String(property || 'padding');
  const safeSide = side || null;
  if (prop === 'gap') return 'gap';
  const base = prop === 'margin' ? 'margin' : 'padding';
  if (!safeSide) return base;
  return base + safeSide[0].toUpperCase() + safeSide.slice(1);
}

function parseRuntimeCssLengthPx(value, fallback = 0){
  const raw = String(value || '').trim();
  if (!raw || raw === 'normal' || raw === 'auto' || raw === 'none') return fallback;
  const n = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function getCurrentSpacingPx(node, property, side){
  if (!node || typeof window === 'undefined' || !window.getComputedStyle) return 0;
  const cssProp = spacingStylePropertyName(property, side);
  try {
    const computed = window.getComputedStyle(node);
    const raw = computed.getPropertyValue(cssProp.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())) || computed[cssProp] || '';
    return parseRuntimeCssLengthPx(raw, 0);
  } catch(e) {
    return 0;
  }
}

function formatRuntimePx(value){
  const n = Math.max(0, Number(value) || 0);
  const fixed = Math.round(n * 1000) / 1000;
  return String(fixed).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1') + 'px';
}

function buildSpacingCssFromPayload(spacing, node, property, side){
  const value = spacing || {};
  if (value && value.type === 'spacing_delta') {
    const current = getCurrentSpacingPx(node, property, side);
    const delta = Number(value.delta) || 0;
    let next = current;
    if (value.mode === 'relative_spacing_percent' || value.unit === '%') {
      const base = current > 0 ? current : 8;
      next = current + (base * delta / 100);
    } else {
      next = current + delta;
    }
    const length = formatRuntimePx(next);
    return {
      length,
      meta: {
        mode: value.mode || 'relative_spacing',
        property,
        side: side || null,
        previousValue: formatRuntimePx(current),
        delta,
        unit: value.unit || 'px',
        nextValue: length,
        reason: value.reason || 'spacing_delta',
      }
    };
  }
  const length = normalizeLengthValue(value, '8px');
  return {
    length,
    meta: {
      mode: 'set_spacing',
      property,
      side: side || null,
      nextValue: length,
      reason: value?.reason || 'set_spacing',
    }
  };
}

async function applySpacingValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applySpacingValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const property = String(payload?.property || 'padding');
  const spacing = payload?.value || {};
  const side = spacing?.side || null;
  const computedSpacing = buildSpacingCssFromPayload(spacing, node, property, side);
  const length = computedSpacing.length;
  payload.spacingResolved = computedSpacing.meta;
  if (!dryRun && node) {
    const kind = inferElementKind(node, targetRef);
    const staged = applyPendingAwareMutation(node, payload, () => {
      if (kind === 'menu') {
        if (property === 'gap') setStyleValue(node, '--st-menu-gap', length);
        else if (property === 'padding') {
          if (!side || side === 'left' || side === 'right') setStyleValue(node, '--st-menu-pad-x', length);
          if (!side || side === 'top' || side === 'bottom') setStyleValue(node, '--st-menu-pad-y', length);
        }
      } else if (property === 'gap') {
        // HOTFIX 00079:
        // Keep gap in every layout source that can be used during header/footer redraw.
        // Previously only inline gap was written; selection/inspector sync could briefly
        // redraw from the old canonical layout vars, so buttons jumped back for a split second.
        setInlineStyle(node, 'gap', length);
        setStyleValue(node, '--site-gap', length);
        setStyleValue(node, '--site-gap-x', length);
        setStyleValue(node, '--site-gap-y', length);
        try {
          if (node.dataset) {
            node.dataset.aiGapApplied = length;
            node.dataset.siteGap = length;
          }
        } catch {}
      } else if (property === 'margin') {
        const prop = side ? `margin${side[0].toUpperCase()}${side.slice(1)}` : 'margin';
        setInlineStyle(node, prop, length);
      } else {
        const prop = side ? `padding${side[0].toUpperCase()}${side.slice(1)}` : 'padding';
        setInlineStyle(node, prop, length);
      }
    });
    try {
      // Save the current header/footer HTML immediately after spacing mutation, before
      // inspector/selection sync can trigger a redraw from stale canonical state.
      if (property === 'gap' || property === 'padding' || property === 'margin') {
        persistHeaderHtmlDimensionSource(node);
        const win = node?.ownerDocument?.defaultView || globalThis.window || null;
        if (node.closest?.('#st-site-footer-slot')) win?.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.('footer', 'ai-runtime-explicit-commit');
      }
    } catch {}
    recordMutation(context, { runtime: 'applySpacingValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applySpacingValue', targetRef, dryRun, true, 'spacing applied', { payload: { property, side, length, spacingResolved: computedSpacing.meta } });
}

async function applyDimensionValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyDimensionValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const property = String(payload?.property || 'width') === 'height' ? 'height' : 'width';
  const computed = buildDimensionCssFromPayload(payload?.value, node, property);
  let value = computed.value;
  let meta = computed.meta;

  if (!dryRun && node && property === 'width') {
    const rowFrResult = applyFrRowWidthDimensionIfNeeded(node, property, computed);
    if (rowFrResult?.applied) {
      value = rowFrResult.value || value;
      meta = rowFrResult.meta || meta;
      const payloadWithMeta = { ...payload, dimensionIncrement: meta };
      recordMutation(context, { runtime: 'applyDimensionValue', targetId: targetRef?.id || null, payload: payloadWithMeta, stagedOnly: false });
      return buildResult('applyDimensionValue', targetRef, dryRun, true, 'dimension applied via row fr redistribution', { payload: { property, value, dimensionIncrement: meta } });
    }
  }

  const payloadWithMeta = { ...payload, dimensionIncrement: meta };
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payloadWithMeta, () => {
      setDatasetValue(node, 'stSizeMode', 'custom');
      setDatasetValue(node, 'sizeMode', 'custom');
      setDatasetValue(node, 'aiRuntimeUnlockedSize', '1');
      setInlineStyleImportant(node, '--st-block-min-h', '0px');
      setInlineStyleImportant(node, '--st-header-block-min-h', '0px');
      setInlineStyleImportant(node, '--st-footer-block-min-h', '0px');
      if (property === 'height') {
        setInlineStyle(node, 'minHeight', '0px');
        setInlineStyle(node, 'maxHeight', 'none');
      } else {
        setInlineStyle(node, 'minWidth', '0px');
        setInlineStyle(node, 'maxWidth', 'none');
      }
      setInlineStyle(node, 'boxSizing', 'border-box');
      setInlineStyle(node, property, value);
      setDatasetValue(node, property === 'height' ? 'aiHeightApplied' : 'aiWidthApplied', value);
      persistDimensionToBuilderSiteState(node, property, value);
    });
    recordMutation(context, { runtime: 'applyDimensionValue', targetId: targetRef?.id || null, payload: payloadWithMeta, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyDimensionValue', targetRef, dryRun, true, 'dimension applied', { payload: { property, value, dimensionIncrement: meta } });
}

function readCurrentBorderColorParts(node) {
  const candidates = [];
  try { candidates.push(node?.style?.getPropertyValue?.('border-color')); } catch {}
  try { candidates.push(node?.style?.borderColor); } catch {}
  try {
    const cs = typeof getComputedStyle === 'function' && node ? getComputedStyle(node) : null;
    if (cs) {
      candidates.push(cs.borderColor);
      candidates.push(cs.getPropertyValue?.('border-color'));
    }
  } catch {}
  for (const item of candidates) {
    const parsed = parseShadowColorAlpha(item);
    if (parsed) return parsed;
  }
  return { r: 148, g: 163, b: 184, alpha: 1 };
}

function buildRgbaColorFromParts(parts = {}, alpha = 1) {
  const clampChannel = (value) => Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
  const safeAlpha = Math.max(0, Math.min(1, Number.isFinite(Number(alpha)) ? Number(alpha) : 1));
  return 'rgba(' + clampChannel(parts.r) + ',' + clampChannel(parts.g) + ',' + clampChannel(parts.b) + ',' + safeAlpha + ')';
}

async function adjustNumericStyleHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('adjustNumericStyle', targetRef, dryRun);
  const payload = operation?.payload || {};
  const property = String(payload?.property || 'style_value');
  const mode = String(payload?.value?.mode || 'increase');
  const direction = mode === 'decrease' ? -1 : 1;
  const defaults = { width: 20, height: 20, font_size: 2, line_height: 4, letter_spacing: 1, padding: 4, margin: 4, gap: 4, radius: 2, opacity: 0.1, border_opacity: 0.1 };
  const cssPropMap = { width: 'width', height: 'height', font_size: 'fontSize', line_height: 'lineHeight', letter_spacing: 'letterSpacing', padding: 'padding', margin: 'margin', gap: 'gap', radius: 'borderRadius', opacity: 'opacity', border_opacity: 'borderColor' };
  const cssProp = cssPropMap[property] || 'width';
  const delta = typeof payload?.value?.value === 'number' ? payload.value.value : defaults[property] || 2;

  if (property === 'border_opacity') {
    const parts = readCurrentBorderColorParts(node);
    const current = Math.max(0, Math.min(1, Number.isFinite(Number(parts.alpha)) ? Number(parts.alpha) : 1));
    const next = Math.max(0, Math.min(1, current + direction * delta));
    const rendered = buildRgbaColorFromParts(parts, next);
    const payloadWithMeta = {
      ...payload,
      styleProp: property,
      cssProp,
      direction,
      delta,
      previousValue: String(current),
      nextValue: String(next),
      nextBorderColor: rendered,
    };
    if (!dryRun && node) {
      const staged = applyPendingAwareMutation(node, payloadWithMeta, () => setInlineStyle(node, 'borderColor', rendered));
      recordMutation(context, { runtime: 'adjustNumericStyle', targetId: targetRef?.id || null, payload: payloadWithMeta, stagedOnly: staged.stagedOnly });
    }
    return buildResult('adjustNumericStyle', targetRef, dryRun, true, 'border opacity adjusted', { payload: { property, mode, next: String(next), borderColor: rendered, direction, delta } });
  }

  const current = currentStyleNumber(node, cssProp, property === 'opacity' ? 1 : 0);
  const next = property === 'opacity'
    ? Math.max(0, Math.min(1, current + direction * delta))
    : Math.max(0, current + direction * delta);
  const rendered = property === 'opacity' ? String(next) : `${next}${payload?.value?.unit || 'px'}`;
  const payloadWithMeta = {
    ...payload,
    styleProp: property,
    cssProp,
    direction,
    delta,
    nextValue: rendered,
  };
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payloadWithMeta, () => setInlineStyle(node, cssProp, rendered));
    recordMutation(context, { runtime: 'adjustNumericStyle', targetId: targetRef?.id || null, payload: payloadWithMeta, stagedOnly: staged.stagedOnly });
  }
  return buildResult('adjustNumericStyle', targetRef, dryRun, true, 'numeric style adjusted', { payload: { property, mode, next: rendered, direction, delta } });
}

async function applyTextAlignValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyTextAlignValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const align = payload?.value?.keyword || payload?.value?.raw || 'left';
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => setInlineStyle(node, 'textAlign', align));
    recordMutation(context, { runtime: 'applyTextAlignValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyTextAlignValue', targetRef, dryRun, true, 'text align applied', { payload: { align } });
}

async function applyAlignmentValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyAlignmentValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const property = String(payload?.property || 'align_x');
  const align = payload?.value?.keyword || payload?.value?.raw || 'center';
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => {
      if (property === 'align_y') setInlineStyle(node, 'alignItems', align === 'top' ? 'flex-start' : align === 'bottom' ? 'flex-end' : 'center');
      else setInlineStyle(node, 'justifyContent', align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center');
    });
    recordMutation(context, { runtime: 'applyAlignmentValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyAlignmentValue', targetRef, dryRun, true, 'alignment value applied', { payload: { property, align } });
}

async function applyFontWeightValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyFontWeightValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const keyword = payload?.value?.keyword || 'bold';
  const weight = keyword === 'thin' ? '300' : keyword === 'normal' ? '400' : '700';
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => setInlineStyle(node, 'fontWeight', weight));
    recordMutation(context, { runtime: 'applyFontWeightValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyFontWeightValue', targetRef, dryRun, true, 'font weight applied', { payload: { weight } });
}

async function applyTextCaseValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyTextCaseValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const keyword = payload?.value?.keyword || 'uppercase';
  const transform = keyword === 'lowercase' ? 'lowercase' : keyword === 'capitalize' ? 'capitalize' : 'uppercase';
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => setInlineStyle(node, 'textTransform', transform));
    recordMutation(context, { runtime: 'applyTextCaseValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyTextCaseValue', targetRef, dryRun, true, 'text case applied', { payload: { transform } });
}

async function applyVisibilityValueHandler({ operation, targetRef, context, dryRun }) {
  const node = resolveDomElement(targetRef, context);
  if (!node && !dryRun) return buildMissingElementResult('applyVisibilityValue', targetRef, dryRun);
  const payload = operation?.payload || {};
  const visible = payload?.value?.visible !== false;
  if (!dryRun && node) {
    const staged = applyPendingAwareMutation(node, payload, () => {
      setInlineStyle(node, 'display', visible ? '' : 'none');
      setInlineStyle(node, 'visibility', visible ? 'visible' : 'hidden');
    });
    recordMutation(context, { runtime: 'applyVisibilityValue', targetId: targetRef?.id || null, payload, stagedOnly: staged.stagedOnly });
  }
  return buildResult('applyVisibilityValue', targetRef, dryRun, true, 'visibility applied', { payload: { visible } });
}

function createNoopHandler(runtimeName) {
  return async ({ operation, targetRef, dryRun }) => ({
    ok: true,
    applied: false,
    dryRun: !!dryRun,
    runtime: runtimeName,
    targetId: targetRef?.id ?? null,
    targetType: targetRef?.type ?? null,
    summary: dryRun
      ? `dry-run: ${runtimeName}`
      : `runtime handler ${runtimeName} not wired yet`,
    payload: operation?.payload ?? null,
    nextStep: `Wire ${runtimeName} to real builder/runtime style mutation function.`,
  });
}

export function createDefaultRuntimeHandlerMap() {
  const handlers = new Map();
  handlers.set('applyPalettePolicy', applyPalettePolicyHandler);
  handlers.set('applyContrastPolicy', applyContrastPolicyHandler);
  handlers.set('applySpacingScale', applySpacingScaleHandler);
  handlers.set('applyAlignmentPolicy', applyAlignmentPolicyHandler);
  handlers.set('applyShadowPreset', applyShadowPresetHandler);
  handlers.set('applyBorderPreset', applyBorderPresetHandler);
  handlers.set('applyRadiusPreset', applyRadiusPresetHandler);
  handlers.set('applyHoverPreset', applyHoverPresetHandler);
  handlers.set('selectNextPreset', selectNextPresetHandler);
  handlers.set('varyStyleAxis', varyStyleAxisHandler);
  handlers.set('applyStyleStrategy', applyStyleStrategyHandler);
  handlers.set('applyBackgroundValue', applyBackgroundValueHandler);
  handlers.set('applyGradientValue', applyGradientValueHandler);
  handlers.set('applyTextColorValue', applyTextColorValueHandler);
  handlers.set('applyIconColorValue', applyIconColorValueHandler);
  handlers.set('applyBorderColorValue', applyBorderColorValueHandler);
  handlers.set('applyBorderWidthValue', applyBorderWidthValueHandler);
  handlers.set('applyBorderStyleValue', applyBorderStyleValueHandler);
  handlers.set('applyRadiusValue', applyRadiusValueHandler);
  handlers.set('applyShadowValue', applyShadowValueHandler);
  handlers.set('applyTextShadowValue', applyTextShadowValueHandler);
  handlers.set('applyTextStrokeValue', applyTextStrokeValueHandler);
  handlers.set('applyOpacityValue', applyOpacityValueHandler);
  handlers.set('applyBlurValue', applyBlurValueHandler);
  handlers.set('applySpacingValue', applySpacingValueHandler);
  handlers.set('applyDimensionValue', applyDimensionValueHandler);
  handlers.set('adjustNumericStyle', adjustNumericStyleHandler);
  handlers.set('applyTextAlignValue', applyTextAlignValueHandler);
  handlers.set('applyAlignmentValue', applyAlignmentValueHandler);
  handlers.set('applyFontWeightValue', applyFontWeightValueHandler);
  handlers.set('applyTextCaseValue', applyTextCaseValueHandler);
  handlers.set('applyVisibilityValue', applyVisibilityValueHandler);
  return handlers;
}

export function createAiRuntimeExecutor(options = {}) {
  const handlers = createDefaultRuntimeHandlerMap();
  for (const [runtimeName, handler] of Object.entries(options.handlers || {})) {
    if (typeof handler === 'function') handlers.set(runtimeName, handler);
  }

  return {
    register(runtimeName, handler) {
      if (!runtimeName || typeof handler !== 'function') return false;
      handlers.set(runtimeName, handler);
      return true;
    },
    unregister(runtimeName) {
      return handlers.delete(runtimeName);
    },
    has(runtimeName) {
      return handlers.has(runtimeName);
    },
    get(runtimeName) {
      return handlers.get(runtimeName) || null;
    },
    list() {
      return Array.from(handlers.keys());
    },
    async execute(applyContract, context = {}, executeOptions = {}) {
      return executeApplyContract(applyContract, {
        context,
        dryRun: executeOptions.dryRun,
        handlers,
      });
    },
  };
}

export async function executeApplyContract(applyContract, options = {}) {
  const contract = applyContract && typeof applyContract === 'object' ? applyContract : null;
  if (!contract || !Array.isArray(contract.operations)) {
    return {
      ok: false,
      kind: 'runtime_execution_result',
      reason: 'missing_apply_contract',
      operations: [],
      summary: {
        total: 0,
        ok: 0,
        failed: 0,
        applied: 0,
        skipped: 0,
      },
    };
  }

  const dryRun = options.dryRun !== false;
  const handlerMap = options.handlers instanceof Map
    ? options.handlers
    : createDefaultRuntimeHandlerMap();
  const runtimeContext = options.context || {};
  const selectionContext = await resolveSelectionContext(runtimeContext);
  const operationResults = [];

  try {
    if (typeof runtimeContext.beforeApplyContract === 'function') {
      await runtimeContext.beforeApplyContract({
        contract,
        selectionContext,
        dryRun,
      });
    }
  } catch {}

  for (const [operationIndex, operation] of contract.operations.entries()) {
    const runtimeName = String(operation?.runtime || 'applyStyleStrategy');
    const handler = handlerMap.get(runtimeName) || createNoopHandler(runtimeName);
    const targets = resolveOperationTargets(operation, contract, selectionContext, runtimeContext);

    for (const [targetIndex, targetRef] of targets.entries()) {
      try {
        const result = await handler({
          operation,
          targetRef,
          contract,
          context: options.context || {},
          dryRun,
          selectionContext,
        });
        operationResults.push({
          operationIndex,
          targetIndex,
          runtime: runtimeName,
          targetRef,
          ok: result?.ok !== false,
          applied: !!result?.applied,
          dryRun: result?.dryRun ?? dryRun,
          result: result || null,
        });
      } catch (error) {
        operationResults.push({
          operationIndex,
          targetIndex,
          runtime: runtimeName,
          targetRef,
          ok: false,
          applied: false,
          dryRun,
          error: {
            message: error?.message || String(error),
            stack: error?.stack || null,
          },
        });
      }
    }
  }

  const summary = {
    total: operationResults.length,
    ok: operationResults.filter((item) => item.ok).length,
    failed: operationResults.filter((item) => !item.ok).length,
    applied: operationResults.filter((item) => item.applied).length,
    skipped: operationResults.filter((item) => !item.applied).length,
    selectedCount: selectionContext.selectedCount,
    dryRun,
  };

  const executionResult = {
    ok: summary.failed === 0,
    kind: 'runtime_execution_result',
    contractKind: contract.kind || null,
    target: contract.target || null,
    selectionMode: contract.selectionMode || null,
    applyTo: contract.applyTo || null,
    summary,
    operations: operationResults,
  };

  try {
    if (typeof runtimeContext.afterApplyContract === 'function') {
      const sync = await runtimeContext.afterApplyContract({
        contract,
        selectionContext,
        result: executionResult,
        dryRun,
      });
      if (sync) executionResult.sync = sync;
    }
  } catch {}

  return executionResult;
}

export async function executeParsedAiCommand(parsedResult, options = {}) {
  const commands = Array.isArray(parsedResult?.commands) ? parsedResult.commands : [];
  const results = [];
  const executor = options.executor || createAiRuntimeExecutor({ handlers: options.handlers || {} });

  for (const [index, command] of commands.entries()) {
    if (!command?.applyContract) {
      results.push({
        commandIndex: index,
        action: command?.action || null,
        skipped: true,
        reason: 'missing_apply_contract',
      });
      continue;
    }
    const execution = await executor.execute(command.applyContract, options.context || {}, {
      dryRun: options.dryRun,
    });
    results.push({
      commandIndex: index,
      action: command?.action || null,
      execution,
    });
  }

  return {
    ok: results.every((item) => item.skipped || item.execution?.ok !== false),
    kind: 'parsed_command_execution_bundle',
    totalCommands: commands.length,
    executedCommands: results.filter((item) => !item.skipped).length,
    skippedCommands: results.filter((item) => item.skipped).length,
    results,
  };
}
