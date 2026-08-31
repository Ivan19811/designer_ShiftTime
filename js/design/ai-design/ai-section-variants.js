// js/design/ai-design/ai-section-variants.js
// [AI-SITE-GENERATOR-2026][Етап 2.3]
// Професійні варіанти секцій для локального AI Design Engine.
// Це не зовнішній AI API: модуль лише описує безпечні локальні композиційні варіанти.

const COMMON_AUTO = Object.freeze({
  id: 'auto',
  label: 'Авто',
  description: 'Система сама підбирає найдоречніший варіант під тип секції, стиль і рецепт.',
  recipeHint: 'auto'
});

export const AI_SECTION_VARIANTS = Object.freeze({
  hero: Object.freeze([
    COMMON_AUTO,
    Object.freeze({ id: 'hero-split-visual', label: 'Split visual', description: 'Сильний заголовок зліва і великий візуальний блок справа.', recipeHint: 'split' }),
    Object.freeze({ id: 'hero-overlay-focus', label: 'Overlay focus', description: 'Текст поверх атмосферного фонового зображення з читабельним скляним блоком.', recipeHint: 'overlay' }),
    Object.freeze({ id: 'hero-editorial-statement', label: 'Editorial statement', description: 'Журнальна асиметрія, великий заголовок і преміальний візуал.', recipeHint: 'editorial' }),
    Object.freeze({ id: 'hero-stats-proof', label: 'Hero + цифри', description: 'Hero з CTA та блоком довіри/цифрами під основним текстом.', recipeHint: 'split' }),
    Object.freeze({ id: 'hero-mosaic', label: 'Mosaic hero', description: 'Hero з акцентом на портфоліо: текст + великий visual з декількома підписами.', recipeHint: 'split' })
  ]),

  services: Object.freeze([
    COMMON_AUTO,
    Object.freeze({ id: 'services-card-grid', label: '3 картки', description: 'Класична комерційна сітка з трьох послуг.', recipeHint: 'cards' }),
    Object.freeze({ id: 'services-bento-spotlight', label: 'Bento spotlight', description: 'Одна головна послуга більша, поруч додаткові послуги.', recipeHint: 'bento' }),
    Object.freeze({ id: 'services-media-list', label: 'Фото + список', description: 'Зліва візуальний акцент, справа перелік послуг.', recipeHint: 'split' }),
    Object.freeze({ id: 'services-process-steps', label: 'Процес 1-2-3-4', description: 'Послуги як зрозумілий покроковий процес.', recipeHint: 'cards' }),
    Object.freeze({ id: 'services-compact-tiles', label: 'Компактні tiles', description: 'Щільна 2×2 структура для коротких пропозицій.', recipeHint: 'cards' })
  ]),

  features: Object.freeze([
    COMMON_AUTO,
    Object.freeze({ id: 'features-icon-cards', label: 'Іконки + картки', description: 'Три зрозумілі переваги з простими іконками.', recipeHint: 'cards' }),
    Object.freeze({ id: 'features-bento-proof', label: 'Bento proof', description: 'Преміальна сітка доказів: головна перевага + підтримуючі.', recipeHint: 'bento' }),
    Object.freeze({ id: 'features-stats-row', label: 'Переваги + цифри', description: 'Переваги з метриками, які підсилюють довіру.', recipeHint: 'cards' }),
    Object.freeze({ id: 'features-split-benefits', label: 'Split benefits', description: 'Текстовий intro + список переваг у другій колонці.', recipeHint: 'split' }),
    Object.freeze({ id: 'features-editorial-list', label: 'Editorial list', description: 'Журнальний список переваг з великим номером.', recipeHint: 'editorial' })
  ]),

  gallery: Object.freeze([
    COMMON_AUTO,
    Object.freeze({ id: 'gallery-clean-grid', label: 'Clean grid', description: 'Чиста рівна сітка фото для робіт/портфоліо.', recipeHint: 'cards' }),
    Object.freeze({ id: 'gallery-bento-showcase', label: 'Bento showcase', description: 'Один великий кадр і кілька менших для premium-ефекту.', recipeHint: 'bento' }),
    Object.freeze({ id: 'gallery-editorial-showcase', label: 'Editorial showcase', description: 'Журнальний блок з великим заголовком і фото.', recipeHint: 'editorial' }),
    Object.freeze({ id: 'gallery-masonry-soft', label: 'Masonry soft', description: 'Імітація masonry за рахунок різної висоти блоків.', recipeHint: 'bento' }),
    Object.freeze({ id: 'gallery-split-preview', label: 'Split preview', description: 'Опис галереї + велике фото і додаткові кадри.', recipeHint: 'split' })
  ]),

  cta: Object.freeze([
    COMMON_AUTO,
    Object.freeze({ id: 'cta-centered', label: 'Centered CTA', description: 'Великий центрований заклик до дії.', recipeHint: 'compact' }),
    Object.freeze({ id: 'cta-split-offer', label: 'Split offer', description: 'Пропозиція зліва, дія/контакт справа.', recipeHint: 'compact' }),
    Object.freeze({ id: 'cta-banner', label: 'Sticky-like banner', description: 'Компактний банер із кнопкою.', recipeHint: 'compact' }),
    Object.freeze({ id: 'cta-overlay', label: 'Overlay CTA', description: 'CTA поверх фонового зображення.', recipeHint: 'overlay' }),
    Object.freeze({ id: 'cta-minimal', label: 'Minimal CTA', description: 'Мінімалістичний заклик без зайвих декоративних елементів.', recipeHint: 'compact' })
  ]),

  faq: Object.freeze([
    COMMON_AUTO,
    Object.freeze({ id: 'faq-split', label: 'Split FAQ', description: 'Зліва intro, справа питання.', recipeHint: 'split' }),
    Object.freeze({ id: 'faq-cards', label: 'FAQ cards', description: 'Питання окремими картками.', recipeHint: 'cards' }),
    Object.freeze({ id: 'faq-compact', label: 'Compact FAQ', description: 'Стисла структура для коротких відповідей.', recipeHint: 'compact' }),
    Object.freeze({ id: 'faq-support', label: 'FAQ + підтримка', description: 'Питання плюс окремий блок звʼязку.', recipeHint: 'split' }),
    Object.freeze({ id: 'faq-editorial', label: 'Editorial FAQ', description: 'Питання у журнальному стилі з великим заголовком.', recipeHint: 'editorial' })
  ]),

  contacts: Object.freeze([
    COMMON_AUTO,
    Object.freeze({ id: 'contacts-split-form', label: 'Контакти + форма', description: 'Зліва контакти, справа форма заявки.', recipeHint: 'split' }),
    Object.freeze({ id: 'contacts-card', label: 'Contact card', description: 'Преміальна контактна картка з усіма даними.', recipeHint: 'compact' }),
    Object.freeze({ id: 'contacts-map-visual', label: 'Map visual', description: 'Візуальний блок мапи/локації + контакти.', recipeHint: 'split' }),
    Object.freeze({ id: 'contacts-form-focus', label: 'Form focus', description: 'Основний акцент на формі заявки.', recipeHint: 'split' }),
    Object.freeze({ id: 'contacts-compact', label: 'Compact contacts', description: 'Компактна контактна секція для низу сторінки.', recipeHint: 'compact' })
  ])
});

const DEFAULT_BY_TYPE = Object.freeze({
  hero: Object.freeze({ modern: 'hero-split-visual', premium: 'hero-mosaic', warm: 'hero-stats-proof', dark: 'hero-overlay-focus', tech: 'hero-overlay-focus', editorial: 'hero-editorial-statement' }),
  services: Object.freeze({ modern: 'services-card-grid', premium: 'services-bento-spotlight', warm: 'services-process-steps', dark: 'services-bento-spotlight', tech: 'services-bento-spotlight', editorial: 'services-media-list' }),
  features: Object.freeze({ modern: 'features-icon-cards', premium: 'features-bento-proof', warm: 'features-stats-row', dark: 'features-bento-proof', tech: 'features-stats-row', editorial: 'features-editorial-list' }),
  gallery: Object.freeze({ modern: 'gallery-clean-grid', premium: 'gallery-bento-showcase', warm: 'gallery-masonry-soft', dark: 'gallery-bento-showcase', tech: 'gallery-bento-showcase', editorial: 'gallery-editorial-showcase' }),
  cta: Object.freeze({ modern: 'cta-split-offer', premium: 'cta-centered', warm: 'cta-banner', dark: 'cta-overlay', tech: 'cta-overlay', editorial: 'cta-minimal' }),
  faq: Object.freeze({ modern: 'faq-split', premium: 'faq-support', warm: 'faq-cards', dark: 'faq-split', tech: 'faq-compact', editorial: 'faq-editorial' }),
  contacts: Object.freeze({ modern: 'contacts-split-form', premium: 'contacts-card', warm: 'contacts-split-form', dark: 'contacts-card', tech: 'contacts-form-focus', editorial: 'contacts-compact' })
});

export function getAiSectionVariantOptions(type = 'hero') {
  const cleanType = String(type || 'hero');
  return (AI_SECTION_VARIANTS[cleanType] || AI_SECTION_VARIANTS.hero).map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    recipeHint: item.recipeHint || 'auto'
  }));
}

export function getAiSectionVariantGroups() {
  return Object.entries(AI_SECTION_VARIANTS).map(([type, items]) => ({
    type,
    options: items.map((item) => ({ id: item.id, label: item.label, description: item.description }))
  }));
}

export function resolveAiSectionVariant({ type = 'hero', style = 'modern', requested = 'auto' } = {}) {
  const cleanType = String(type || 'hero');
  const list = AI_SECTION_VARIANTS[cleanType] || AI_SECTION_VARIANTS.hero;
  const cleanRequested = String(requested || 'auto');
  if (cleanRequested !== 'auto') {
    const direct = list.find((item) => item.id === cleanRequested);
    if (direct) return direct;
  }
  const defaults = DEFAULT_BY_TYPE[cleanType] || DEFAULT_BY_TYPE.hero;
  const defaultId = defaults[String(style || 'modern')] || defaults.modern || list[1]?.id || 'auto';
  return list.find((item) => item.id === defaultId) || list[0] || COMMON_AUTO;
}
