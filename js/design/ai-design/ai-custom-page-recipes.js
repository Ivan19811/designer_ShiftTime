// js/design/ai-design/ai-custom-page-recipes.js
// [AI-SITE-GENERATOR-2026][00411]
// Локальні користувацькі Page Recipes для AI Дизайн.
// Зберігаємо НЕ готовий HTML, а сценарій генерації: pageType/style/sourceRecipe + порядок секцій + recipe/variant/imageMode.

export const AI_CUSTOM_PAGE_RECIPES_KEY = 'st_ai_design_custom_page_recipes_v1';

const MAX_CUSTOM_PAGE_RECIPES = 40;

function safeParse_(raw, fallback) {
  try {
    const parsed = JSON.parse(raw || '');
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function readStore_() {
  try {
    const parsed = safeParse_(localStorage.getItem(AI_CUSTOM_PAGE_RECIPES_KEY), { version: 1, items: [] });
    return {
      version: 1,
      items: Array.isArray(parsed.items) ? parsed.items : []
    };
  } catch (_) {
    return { version: 1, items: [] };
  }
}

function writeStore_(store) {
  try {
    const items = Array.isArray(store?.items) ? store.items.slice(0, MAX_CUSTOM_PAGE_RECIPES) : [];
    localStorage.setItem(AI_CUSTOM_PAGE_RECIPES_KEY, JSON.stringify({ version: 1, items }));
  } catch (_) {}
}

function uid_(prefix = 'custom_page_recipe') {
  try {
    if (crypto?.randomUUID) return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  } catch (_) {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clean_(value, max = 180) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function normalizeSection_(item, index = 0) {
  const type = String(item?.type || 'hero').trim() || 'hero';
  return {
    id: String(item?.id || `custom_${index + 1}_${type}`).trim(),
    enabled: item?.enabled !== false,
    order: index,
    type,
    label: clean_(item?.label || type, 60),
    recipeId: String(item?.recipeId || 'auto').trim() || 'auto',
    variantId: String(item?.variantId || 'auto').trim() || 'auto',
    imageMode: String(item?.imageMode || 'auto').trim() || 'auto',
    purpose: clean_(item?.purpose || '', 140)
  };
}

function normalizeRecipe_(item) {
  if (!item || typeof item !== 'object') return null;
  const id = String(item.id || '').trim();
  const sections = Array.isArray(item.sections)
    ? item.sections.map(normalizeSection_).filter((section) => section && section.type)
    : [];
  if (!id || !sections.length) return null;
  const createdAt = item.createdAt || new Date().toISOString();
  const updatedAt = item.updatedAt || createdAt;
  return {
    id,
    name: clean_(item.name || 'Власний AI-сценарій', 90),
    pageType: String(item.pageType || 'home').trim() || 'home',
    pageTypeLabel: clean_(item.pageTypeLabel || '', 80),
    style: String(item.style || 'modern').trim() || 'modern',
    styleLabel: clean_(item.styleLabel || '', 80),
    pageRecipeId: String(item.pageRecipeId || 'auto').trim() || 'auto',
    pageRecipeLabel: clean_(item.pageRecipeLabel || '', 100),
    pageRecipeFocus: clean_(item.pageRecipeFocus || '', 180),
    prompt: clean_(item.prompt || '', 260),
    imageMode: String(item.imageMode || 'auto').trim() || 'auto',
    sections,
    createdAt,
    updatedAt
  };
}

export function listCustomAiPageRecipes() {
  return readStore_().items
    .map(normalizeRecipe_)
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

export function getCustomAiPageRecipe(id) {
  const cleanId = String(id || '').trim();
  if (!cleanId) return null;
  return listCustomAiPageRecipes().find((item) => item.id === cleanId) || null;
}

export function buildCustomAiPageRecipeName({ pageTypeLabel = '', styleLabel = '', pageRecipeLabel = '', sections = [] } = {}) {
  const enabled = (Array.isArray(sections) ? sections : []).filter((item) => item?.enabled !== false).length;
  const parts = [pageTypeLabel || 'AI сторінка', styleLabel, pageRecipeLabel].filter(Boolean);
  const base = parts.join(' · ') || 'Власний AI-сценарій';
  return `${base}${enabled ? ` · ${enabled} секцій` : ''}`;
}

export function saveCustomAiPageRecipe({ id = '', name = '', pageType = 'home', pageTypeLabel = '', style = 'modern', styleLabel = '', pageRecipeId = 'auto', pageRecipeLabel = '', pageRecipeFocus = '', prompt = '', imageMode = 'auto', sections = [] } = {}) {
  const normalizedSections = (Array.isArray(sections) ? sections : [])
    .map(normalizeSection_)
    .filter((item) => item && item.type);
  if (!normalizedSections.length) {
    return { ok: false, message: 'Немає секцій для збереження власного Page Recipe.' };
  }

  const now = new Date().toISOString();
  const cleanId = String(id || '').trim() || uid_();
  const cleanName = clean_(name, 90) || buildCustomAiPageRecipeName({ pageTypeLabel, styleLabel, pageRecipeLabel, sections: normalizedSections });
  const store = readStore_();
  const old = store.items.find((item) => item?.id === cleanId) || null;
  const recipe = normalizeRecipe_({
    id: cleanId,
    name: cleanName,
    pageType,
    pageTypeLabel,
    style,
    styleLabel,
    pageRecipeId,
    pageRecipeLabel,
    pageRecipeFocus,
    prompt,
    imageMode,
    sections: normalizedSections,
    createdAt: old?.createdAt || now,
    updatedAt: now
  });

  const nextItems = [recipe, ...store.items.filter((item) => item?.id !== cleanId)]
    .map(normalizeRecipe_)
    .filter(Boolean)
    .slice(0, MAX_CUSTOM_PAGE_RECIPES);
  writeStore_({ version: 1, items: nextItems });
  return { ok: true, message: `Власний Page Recipe збережено: ${recipe.name}`, item: recipe };
}

export function deleteCustomAiPageRecipe(id) {
  const cleanId = String(id || '').trim();
  if (!cleanId) return { ok: false, message: 'Не вибрано власний Page Recipe для видалення.' };
  const store = readStore_();
  const old = store.items.find((item) => item?.id === cleanId) || null;
  const nextItems = store.items.filter((item) => item?.id !== cleanId);
  writeStore_({ version: 1, items: nextItems });
  return old
    ? { ok: true, message: `Власний Page Recipe видалено: ${old.name || cleanId}` }
    : { ok: false, message: 'Власний Page Recipe не знайдено.' };
}

export function clearCustomAiPageRecipes() {
  writeStore_({ version: 1, items: [] });
  return { ok: true, message: 'Усі власні Page Recipes очищено.' };
}
