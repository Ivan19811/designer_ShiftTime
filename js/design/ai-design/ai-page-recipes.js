// js/design/ai-design/ai-page-recipes.js
// [AI-SITE-GENERATOR-2026][00408]
// Професійні сценарії сторінок для локального AI Page Generator.
// Мета: сторінка має збиратися не просто з набору секцій, а за конкретною логікою:
// conversion / showcase / catalog / story / portfolio / contact flow.

const AUTO_RECIPE = Object.freeze({
  id: 'auto',
  label: 'Авто',
  description: 'Система сама підбере сценарій сторінки під тип і стиль.',
  focus: 'Автоматичний підбір',
  sections: Object.freeze([])
});

function freezeSections_(sections) {
  return Object.freeze((sections || []).map((item) => Object.freeze({
    type: item.type || 'hero',
    label: item.label || '',
    purpose: item.purpose || '',
    recipeId: item.recipeId || 'auto',
    variantId: item.variantId || 'auto',
    imageMode: item.imageMode || 'auto'
  })));
}

function recipe_(data) {
  return Object.freeze({
    id: data.id,
    label: data.label,
    description: data.description || '',
    focus: data.focus || '',
    sections: freezeSections_(data.sections || [])
  });
}

export const AI_PAGE_RECIPES = Object.freeze({
  home: Object.freeze([
    AUTO_RECIPE,
    recipe_({
      id: 'home-balanced-business',
      label: 'Головна · balanced business',
      description: 'Універсальна головна: пропозиція, послуги, переваги, приклади, CTA, контакти.',
      focus: 'Зрозуміло пояснити бізнес і привести до заявки.',
      sections: [
        { type: 'hero', recipeId: 'split', variantId: 'hero-split-visual', purpose: 'перший екран із цінністю і CTA' },
        { type: 'services', recipeId: 'cards', variantId: 'services-card-grid', purpose: 'показати основні послуги' },
        { type: 'features', recipeId: 'cards', variantId: 'features-icon-cards', purpose: 'пояснити переваги' },
        { type: 'gallery', recipeId: 'bento', variantId: 'gallery-bento-showcase', purpose: 'дати візуальний доказ' },
        { type: 'cta', recipeId: 'compact', variantId: 'cta-split-offer', purpose: 'заклик до заявки' },
        { type: 'contacts', recipeId: 'split', variantId: 'contacts-split-form', purpose: 'швидкий контакт' }
      ]
    }),
    recipe_({
      id: 'home-premium-showcase',
      label: 'Головна · premium showcase',
      description: 'Дорога презентаційна головна з великою візуальною подачею, bento і довірою.',
      focus: 'Створити преміальне перше враження.',
      sections: [
        { type: 'hero', recipeId: 'split', variantId: 'hero-mosaic', purpose: 'преміальна hero-композиція' },
        { type: 'gallery', recipeId: 'bento', variantId: 'gallery-bento-showcase', purpose: 'портфоліо/візуальний showcase' },
        { type: 'features', recipeId: 'bento', variantId: 'features-bento-proof', purpose: 'докази якості' },
        { type: 'services', recipeId: 'bento', variantId: 'services-bento-spotlight', purpose: 'послуги як premium-пропозиції' },
        { type: 'faq', recipeId: 'split', variantId: 'faq-support', purpose: 'зняти сумніви' },
        { type: 'cta', recipeId: 'overlay', variantId: 'cta-overlay', purpose: 'сильний фінальний CTA' },
        { type: 'contacts', recipeId: 'compact', variantId: 'contacts-card', purpose: 'короткий контактний блок' }
      ]
    }),
    recipe_({
      id: 'home-conversion-lead',
      label: 'Головна · conversion lead',
      description: 'Головна для заявок: hero, вигоди, послуги, FAQ і повторні CTA.',
      focus: 'Максимально швидко довести клієнта до дії.',
      sections: [
        { type: 'hero', recipeId: 'overlay', variantId: 'hero-overlay-focus', purpose: 'сильний оффер і CTA' },
        { type: 'features', recipeId: 'cards', variantId: 'features-stats-row', purpose: 'вигоди + цифри' },
        { type: 'services', recipeId: 'cards', variantId: 'services-process-steps', purpose: 'показати процес/рішення' },
        { type: 'cta', recipeId: 'compact', variantId: 'cta-banner', purpose: 'проміжний CTA' },
        { type: 'faq', recipeId: 'cards', variantId: 'faq-cards', purpose: 'відповіді на заперечення' },
        { type: 'contacts', recipeId: 'split', variantId: 'contacts-form-focus', purpose: 'форма заявки' }
      ]
    })
  ]),

  landing: Object.freeze([
    AUTO_RECIPE,
    recipe_({
      id: 'landing-conversion-classic',
      label: 'Лендінг · conversion classic',
      description: 'Класичний продаючий лендінг: оффер, вигоди, послуги, докази, FAQ, CTA.',
      focus: 'Продати одну конкретну пропозицію.',
      sections: [
        { type: 'hero', recipeId: 'overlay', variantId: 'hero-overlay-focus', purpose: 'сильний перший екран' },
        { type: 'features', recipeId: 'cards', variantId: 'features-stats-row', purpose: 'швидкі вигоди' },
        { type: 'services', recipeId: 'cards', variantId: 'services-process-steps', purpose: 'як це працює' },
        { type: 'gallery', recipeId: 'bento', variantId: 'gallery-split-preview', purpose: 'показати приклад результату' },
        { type: 'faq', recipeId: 'split', variantId: 'faq-split', purpose: 'зняти сумніви' },
        { type: 'cta', recipeId: 'compact', variantId: 'cta-centered', purpose: 'фінальний CTA' },
        { type: 'contacts', recipeId: 'split', variantId: 'contacts-form-focus', purpose: 'форма' }
      ]
    }),
    recipe_({
      id: 'landing-product-launch',
      label: 'Лендінг · product launch',
      description: 'Старт продукту/послуги з emphasis на hero, proof, features і заявку.',
      focus: 'Запустити нову пропозицію ефектно і зрозуміло.',
      sections: [
        { type: 'hero', recipeId: 'split', variantId: 'hero-stats-proof', purpose: 'офер + цифри' },
        { type: 'features', recipeId: 'bento', variantId: 'features-bento-proof', purpose: 'докази/можливості' },
        { type: 'services', recipeId: 'bento', variantId: 'services-bento-spotlight', purpose: 'пакети або частини продукту' },
        { type: 'gallery', recipeId: 'editorial', variantId: 'gallery-editorial-showcase', purpose: 'візуальна демонстрація' },
        { type: 'cta', recipeId: 'overlay', variantId: 'cta-overlay', purpose: 'емоційний CTA' },
        { type: 'faq', recipeId: 'compact', variantId: 'faq-compact', purpose: 'короткі відповіді' },
        { type: 'contacts', recipeId: 'compact', variantId: 'contacts-card', purpose: 'простий контакт' }
      ]
    })
  ]),

  services: Object.freeze([
    AUTO_RECIPE,
    recipe_({
      id: 'services-catalog-trust',
      label: 'Послуги · catalog trust',
      description: 'Каталог послуг із перевагами, FAQ і контактною формою.',
      focus: 'Показати перелік послуг і сформувати довіру.',
      sections: [
        { type: 'hero', recipeId: 'split', variantId: 'hero-split-visual', purpose: 'вступ у послуги' },
        { type: 'services', recipeId: 'cards', variantId: 'services-card-grid', purpose: 'каталог послуг' },
        { type: 'features', recipeId: 'split', variantId: 'features-split-benefits', purpose: 'чому обирають нас' },
        { type: 'faq', recipeId: 'cards', variantId: 'faq-cards', purpose: 'відповіді перед заявкою' },
        { type: 'cta', recipeId: 'compact', variantId: 'cta-split-offer', purpose: 'CTA' },
        { type: 'contacts', recipeId: 'split', variantId: 'contacts-form-focus', purpose: 'заявка' }
      ]
    }),
    recipe_({
      id: 'services-premium-process',
      label: 'Послуги · premium process',
      description: 'Преміальна сторінка послуг із процесом, візуалом і доказами.',
      focus: 'Показати експертність і процес роботи.',
      sections: [
        { type: 'hero', recipeId: 'editorial', variantId: 'hero-editorial-statement', purpose: 'експертний вступ' },
        { type: 'services', recipeId: 'split', variantId: 'services-media-list', purpose: 'послуги з візуальним блоком' },
        { type: 'services', recipeId: 'cards', variantId: 'services-process-steps', purpose: 'етапи роботи' },
        { type: 'features', recipeId: 'bento', variantId: 'features-bento-proof', purpose: 'докази' },
        { type: 'gallery', recipeId: 'bento', variantId: 'gallery-bento-showcase', purpose: 'приклади' },
        { type: 'contacts', recipeId: 'compact', variantId: 'contacts-card', purpose: 'контакти' }
      ]
    })
  ]),

  about: Object.freeze([
    AUTO_RECIPE,
    recipe_({
      id: 'about-story-proof',
      label: 'Про нас · story proof',
      description: 'Іміджева сторінка: історія, цінності, приклади, довіра, контакт.',
      focus: 'Пояснити хто ми і чому нам можна довіряти.',
      sections: [
        { type: 'hero', recipeId: 'editorial', variantId: 'hero-editorial-statement', purpose: 'історія/позиціонування' },
        { type: 'features', recipeId: 'editorial', variantId: 'features-editorial-list', purpose: 'цінності' },
        { type: 'gallery', recipeId: 'editorial', variantId: 'gallery-editorial-showcase', purpose: 'візуальна історія' },
        { type: 'features', recipeId: 'cards', variantId: 'features-stats-row', purpose: 'цифри/докази' },
        { type: 'faq', recipeId: 'split', variantId: 'faq-support', purpose: 'підтримка/питання' },
        { type: 'contacts', recipeId: 'compact', variantId: 'contacts-card', purpose: 'звʼязок' }
      ]
    }),
    recipe_({
      id: 'about-premium-brand',
      label: 'Про нас · premium brand',
      description: 'Преміальна брендова сторінка з візуалом і bento-доказами.',
      focus: 'Створити відчуття сильного бренду.',
      sections: [
        { type: 'hero', recipeId: 'split', variantId: 'hero-mosaic', purpose: 'брендовий перший екран' },
        { type: 'features', recipeId: 'bento', variantId: 'features-bento-proof', purpose: 'брендові переваги' },
        { type: 'gallery', recipeId: 'bento', variantId: 'gallery-bento-showcase', purpose: 'візуальна довіра' },
        { type: 'cta', recipeId: 'compact', variantId: 'cta-minimal', purpose: 'мʼякий CTA' },
        { type: 'contacts', recipeId: 'split', variantId: 'contacts-split-form', purpose: 'контакт' }
      ]
    })
  ]),

  gallery: Object.freeze([
    AUTO_RECIPE,
    recipe_({
      id: 'gallery-portfolio-showcase',
      label: 'Портфоліо · showcase',
      description: 'Сторінка робіт із сильним hero, bento-галереєю і CTA.',
      focus: 'Максимально красиво показати роботи.',
      sections: [
        { type: 'hero', recipeId: 'split', variantId: 'hero-mosaic', purpose: 'вступ у портфоліо' },
        { type: 'gallery', recipeId: 'bento', variantId: 'gallery-bento-showcase', purpose: 'головний showcase' },
        { type: 'features', recipeId: 'cards', variantId: 'features-stats-row', purpose: 'докази/цифри' },
        { type: 'services', recipeId: 'split', variantId: 'services-media-list', purpose: 'що можна замовити' },
        { type: 'cta', recipeId: 'overlay', variantId: 'cta-overlay', purpose: 'замовити схожий результат' },
        { type: 'contacts', recipeId: 'compact', variantId: 'contacts-card', purpose: 'контакт' }
      ]
    }),
    recipe_({
      id: 'gallery-editorial-casebook',
      label: 'Портфоліо · editorial casebook',
      description: 'Журнальна подача портфоліо з великими кадрами і поясненням цінності.',
      focus: 'Показати роботи як історію/кейси.',
      sections: [
        { type: 'hero', recipeId: 'editorial', variantId: 'hero-editorial-statement', purpose: 'журнальний вступ' },
        { type: 'gallery', recipeId: 'editorial', variantId: 'gallery-editorial-showcase', purpose: 'головний кейс' },
        { type: 'gallery', recipeId: 'bento', variantId: 'gallery-masonry-soft', purpose: 'додаткові роботи' },
        { type: 'features', recipeId: 'split', variantId: 'features-split-benefits', purpose: 'переваги процесу' },
        { type: 'contacts', recipeId: 'split', variantId: 'contacts-form-focus', purpose: 'заявка' }
      ]
    })
  ]),

  contacts: Object.freeze([
    AUTO_RECIPE,
    recipe_({
      id: 'contacts-direct-form',
      label: 'Контакти · direct form',
      description: 'Коротка контактна сторінка з hero, формою, FAQ і CTA.',
      focus: 'Швидко дати всі способи звʼязку.',
      sections: [
        { type: 'hero', recipeId: 'compact', variantId: 'hero-stats-proof', purpose: 'коротке пояснення' },
        { type: 'contacts', recipeId: 'split', variantId: 'contacts-split-form', purpose: 'контакти + форма' },
        { type: 'faq', recipeId: 'compact', variantId: 'faq-compact', purpose: 'часті питання' },
        { type: 'cta', recipeId: 'compact', variantId: 'cta-banner', purpose: 'додатковий CTA' }
      ]
    }),
    recipe_({
      id: 'contacts-premium-card',
      label: 'Контакти · premium card',
      description: 'Преміальна контактна сторінка з візуальною карткою і підтримкою.',
      focus: 'Зробити контактний блок солідним і простим.',
      sections: [
        { type: 'hero', recipeId: 'split', variantId: 'hero-split-visual', purpose: 'вступ' },
        { type: 'contacts', recipeId: 'compact', variantId: 'contacts-card', purpose: 'преміальна картка контактів' },
        { type: 'faq', recipeId: 'split', variantId: 'faq-support', purpose: 'питання + підтримка' },
        { type: 'cta', recipeId: 'compact', variantId: 'cta-minimal', purpose: 'мʼякий CTA' }
      ]
    })
  ])
});

const DEFAULT_BY_TYPE_AND_STYLE = Object.freeze({
  home: Object.freeze({ modern: 'home-balanced-business', premium: 'home-premium-showcase', warm: 'home-balanced-business', dark: 'home-conversion-lead', tech: 'home-conversion-lead', editorial: 'home-premium-showcase' }),
  landing: Object.freeze({ modern: 'landing-conversion-classic', premium: 'landing-product-launch', warm: 'landing-conversion-classic', dark: 'landing-product-launch', tech: 'landing-product-launch', editorial: 'landing-product-launch' }),
  services: Object.freeze({ modern: 'services-catalog-trust', premium: 'services-premium-process', warm: 'services-catalog-trust', dark: 'services-premium-process', tech: 'services-premium-process', editorial: 'services-premium-process' }),
  about: Object.freeze({ modern: 'about-story-proof', premium: 'about-premium-brand', warm: 'about-story-proof', dark: 'about-premium-brand', tech: 'about-premium-brand', editorial: 'about-story-proof' }),
  gallery: Object.freeze({ modern: 'gallery-portfolio-showcase', premium: 'gallery-portfolio-showcase', warm: 'gallery-portfolio-showcase', dark: 'gallery-editorial-casebook', tech: 'gallery-editorial-casebook', editorial: 'gallery-editorial-casebook' }),
  contacts: Object.freeze({ modern: 'contacts-direct-form', premium: 'contacts-premium-card', warm: 'contacts-direct-form', dark: 'contacts-premium-card', tech: 'contacts-premium-card', editorial: 'contacts-premium-card' })
});

function cloneRecipe_(recipe) {
  const source = recipe || AUTO_RECIPE;
  return {
    id: source.id,
    label: source.label,
    description: source.description || '',
    focus: source.focus || '',
    sections: (source.sections || []).map((item) => ({ ...item }))
  };
}

function listForType_(pageType = 'home') {
  return AI_PAGE_RECIPES[String(pageType || 'home')] || AI_PAGE_RECIPES.home;
}

export function getAiPageRecipeOptions(pageType = 'home') {
  return listForType_(pageType).map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    focus: item.focus
  }));
}

export function getAiPageRecipeGroups() {
  return Object.entries(AI_PAGE_RECIPES).map(([pageType, recipes]) => ({
    pageType,
    options: recipes.map((item) => ({ id: item.id, label: item.label, description: item.description, focus: item.focus }))
  }));
}

export function getDefaultAiPageRecipeId({ pageType = 'home', style = 'modern' } = {}) {
  const defaults = DEFAULT_BY_TYPE_AND_STYLE[String(pageType || 'home')] || DEFAULT_BY_TYPE_AND_STYLE.home;
  return defaults[String(style || 'modern')] || defaults.modern || 'home-balanced-business';
}

export function resolveAiPageRecipe({ pageType = 'home', style = 'modern', requested = 'auto' } = {}) {
  const list = listForType_(pageType);
  const cleanRequested = String(requested || 'auto');
  if (cleanRequested !== 'auto') {
    const direct = list.find((item) => item.id === cleanRequested);
    if (direct) return cloneRecipe_(direct);
  }
  const defaultId = getDefaultAiPageRecipeId({ pageType, style });
  const found = list.find((item) => item.id === defaultId) || list.find((item) => item.id !== 'auto') || AUTO_RECIPE;
  return cloneRecipe_(found);
}
