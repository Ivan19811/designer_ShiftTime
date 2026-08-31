// js/design/ai-design/ai-layout-recipes.js
// [AI-SITE-GENERATOR-2026][Етап 2.2]
// Рецепти композиції для локального AI Design Engine.

export const AI_LAYOUT_RECIPES = Object.freeze({
  auto: Object.freeze({ id: 'auto', label: 'Авто', description: 'Система сама підбирає композицію під тип секції та стиль.' }),
  split: Object.freeze({ id: 'split', label: 'Split 60/40', description: 'Текст + сильний візуальний блок.' }),
  overlay: Object.freeze({ id: 'overlay', label: 'Overlay hero', description: 'Текст поверх фонового зображення/градієнта.' }),
  cards: Object.freeze({ id: 'cards', label: 'Cards grid', description: 'Чітка сітка карток для послуг/переваг.' }),
  bento: Object.freeze({ id: 'bento', label: 'Bento premium', description: 'Нерівномірна преміальна сітка з більшим головним блоком.' }),
  editorial: Object.freeze({ id: 'editorial', label: 'Editorial', description: 'Журнальна асиметрія, великі заголовки, багато повітря.' }),
  compact: Object.freeze({ id: 'compact', label: 'Compact CTA', description: 'Стисла горизонтальна композиція для CTA/контактів.' })
});

const TYPE_DEFAULTS = Object.freeze({
  hero: Object.freeze({ modern: 'split', premium: 'split', warm: 'split', dark: 'overlay', tech: 'overlay', editorial: 'editorial' }),
  services: Object.freeze({ modern: 'cards', premium: 'bento', warm: 'cards', dark: 'bento', tech: 'bento', editorial: 'editorial' }),
  features: Object.freeze({ modern: 'cards', premium: 'bento', warm: 'cards', dark: 'bento', tech: 'bento', editorial: 'editorial' }),
  gallery: Object.freeze({ modern: 'bento', premium: 'bento', warm: 'cards', dark: 'bento', tech: 'bento', editorial: 'editorial' }),
  cta: Object.freeze({ modern: 'compact', premium: 'compact', warm: 'compact', dark: 'overlay', tech: 'overlay', editorial: 'compact' }),
  faq: Object.freeze({ modern: 'split', premium: 'split', warm: 'split', dark: 'split', tech: 'split', editorial: 'editorial' }),
  contacts: Object.freeze({ modern: 'split', premium: 'split', warm: 'split', dark: 'split', tech: 'split', editorial: 'compact' })
});

export function getAiLayoutRecipeOptions() {
  return Object.values(AI_LAYOUT_RECIPES).map((recipe) => ({
    id: recipe.id,
    label: recipe.label,
    description: recipe.description
  }));
}

export function resolveAiLayoutRecipe({ type = 'hero', style = 'modern', requested = 'auto' } = {}) {
  const cleanRequested = String(requested || 'auto');
  if (cleanRequested !== 'auto' && AI_LAYOUT_RECIPES[cleanRequested]) return AI_LAYOUT_RECIPES[cleanRequested];
  const byType = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.hero;
  const id = byType[style] || byType.modern || 'split';
  return AI_LAYOUT_RECIPES[id] || AI_LAYOUT_RECIPES.split;
}

export function getRecipeGridMeta(recipeId = 'split', type = 'hero') {
  const id = String(recipeId || 'split');
  if (id === 'bento') {
    return { columns: 3, gapScale: 1.1, maxWidthBoost: 1.02 };
  }
  if (id === 'editorial') {
    return { columns: type === 'hero' ? 2 : 1, gapScale: 1.25, maxWidthBoost: 1.04 };
  }
  if (id === 'compact') {
    return { columns: 2, gapScale: 0.9, maxWidthBoost: 0.98 };
  }
  if (id === 'cards') {
    return { columns: 3, gapScale: 1, maxWidthBoost: 1 };
  }
  return { columns: 2, gapScale: 1, maxWidthBoost: 1 };
}
