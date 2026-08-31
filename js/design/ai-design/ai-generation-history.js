// js/design/ai-design/ai-generation-history.js
// [AI-SITE-GENERATOR-2026][00406]
// Локальна історія AI-генерацій для панелі "AI Дизайн".
// Зберігає підготовлені секції як відновлювані snapshots, але не змішується зі звичайними шаблонами.

export const AI_GENERATION_HISTORY_KEY = 'st_ai_design_generation_history_v1';
export const AI_GENERATION_HISTORY_MAX = 20;

function safeParse_(raw, fallback) {
  try {
    const parsed = JSON.parse(raw || '');
    return parsed ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function cleanText_(value, max = 160) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function uid_(prefix = 'ai_hist') {
  try {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
  } catch (_) {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function firstHeadingFromHtml_(html) {
  try {
    if (typeof document === 'undefined') return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = String(html || '');
    const node = tmp.querySelector('h1,h2,h3,.st-text-edit');
    return cleanText_(node?.textContent || '', 96);
  } catch (_) {
    return '';
  }
}

function normalizeHistoryItem_(item) {
  if (!item || typeof item !== 'object') return null;
  const id = String(item.id || '').trim() || uid_();
  const now = new Date().toISOString();
  const meta = item.meta && typeof item.meta === 'object' ? item.meta : {};
  const quality = item.quality && typeof item.quality === 'object' ? item.quality : {};
  const images = Array.isArray(meta.images) ? meta.images : [];
  const title = cleanText_(
    item.title ||
    meta.title ||
    meta.label ||
    meta?.variant?.label ||
    firstHeadingFromHtml_(item.html) ||
    'AI секція',
    110
  );
  return {
    id,
    kind: item.kind || 'section',
    status: item.status || 'prepared',
    title,
    html: String(item.html || ''),
    plan: String(item.plan || ''),
    meta,
    quality,
    templateId: item.templateId || '',
    appliedAt: item.appliedAt || '',
    savedAt: item.savedAt || '',
    createdAt: item.createdAt || meta.preparedAt || now,
    updatedAt: item.updatedAt || now,
    summary: cleanText_(item.summary || meta.prompt || firstHeadingFromHtml_(item.html), 150),
    imageCount: Number.isFinite(Number(item.imageCount)) ? Number(item.imageCount) : images.length
  };
}

export function loadAiGenerationHistory() {
  let list = [];
  try {
    const parsed = safeParse_(localStorage.getItem(AI_GENERATION_HISTORY_KEY), []);
    list = Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    list = [];
  }
  return list
    .map(normalizeHistoryItem_)
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
    .slice(0, AI_GENERATION_HISTORY_MAX);
}

export function saveAiGenerationHistory(list) {
  const normalized = (Array.isArray(list) ? list : [])
    .map(normalizeHistoryItem_)
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
    .slice(0, AI_GENERATION_HISTORY_MAX);
  try { localStorage.setItem(AI_GENERATION_HISTORY_KEY, JSON.stringify(normalized)); } catch (_) {}
  return normalized;
}

export function pushAiGenerationHistory({ html = '', meta = {}, quality = {}, plan = '', title = '', status = 'prepared' } = {}) {
  const cleanHtml = String(html || '').trim();
  if (!cleanHtml) return null;
  const now = new Date().toISOString();
  const item = normalizeHistoryItem_({
    id: uid_(),
    kind: 'section',
    status,
    title,
    html: cleanHtml,
    meta: { ...(meta || {}) },
    quality: { ...(quality || {}) },
    plan: String(plan || ''),
    createdAt: now,
    updatedAt: now,
    summary: meta?.prompt || firstHeadingFromHtml_(cleanHtml)
  });
  const next = [item, ...loadAiGenerationHistory().filter((old) => old.id !== item.id)];
  saveAiGenerationHistory(next);
  return item;
}

export function markAiGenerationHistoryItem(id, patch = {}) {
  const itemId = String(id || '').trim();
  if (!itemId) return null;
  const now = new Date().toISOString();
  let updated = null;
  const next = loadAiGenerationHistory().map((item) => {
    if (item.id !== itemId) return item;
    updated = normalizeHistoryItem_({ ...item, ...patch, updatedAt: now });
    return updated;
  });
  saveAiGenerationHistory(next);
  return updated;
}

export function restoreAiGenerationHistoryItem(id) {
  const itemId = String(id || '').trim();
  if (!itemId) return null;
  return loadAiGenerationHistory().find((item) => item.id === itemId) || null;
}

export function deleteAiGenerationHistoryItem(id) {
  const itemId = String(id || '').trim();
  if (!itemId) return loadAiGenerationHistory();
  return saveAiGenerationHistory(loadAiGenerationHistory().filter((item) => item.id !== itemId));
}

export function clearAiGenerationHistory() {
  try { localStorage.removeItem(AI_GENERATION_HISTORY_KEY); } catch (_) {}
  return [];
}

export function compactAiHistoryLabel(item) {
  const safe = normalizeHistoryItem_(item);
  if (!safe) return 'AI секція';
  const parts = [
    safe.meta?.label || safe.meta?.type || 'AI секція',
    safe.meta?.variant?.label || safe.meta?.variantId || '',
    Number.isFinite(Number(safe.quality?.score)) ? `Q${safe.quality.score}` : ''
  ].filter(Boolean);
  return cleanText_(parts.join(' · '), 120);
}
