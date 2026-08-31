// js/design/ai-design/ai-content-roles.js
// [AI-SITE-GENERATOR-2026][00429]
// Єдиний реєстр ролей секцій/блоків для AI Content.
// Мета: при “Замінити шаблон” міняти дизайн/розкладку, але переносити
// уже відредагований контент у такі самі ролі: hero-title -> hero-title,
// gallery-image-1 -> gallery-image-1 тощо. Це кодовий реєстр, не docs/hotfix.

export const AI_SECTION_ROLE_REGISTRY = Object.freeze({
  hero: Object.freeze({
    label: 'Hero / перший екран',
    sitePurpose: 'головна пропозиція, коротке пояснення, CTA, довірчий visual',
    marketplacePurpose: 'УТП магазину, промо, перехід у каталог',
    textRoles: ['hero-eyebrow', 'hero-title', 'hero-subtitle', 'hero-primary-cta', 'hero-secondary-cta', 'hero-proof-1', 'hero-proof-2', 'hero-proof-3'],
    imageRoles: ['hero-image', 'hero-bg']
  }),
  services: Object.freeze({
    label: 'Послуги / категорії',
    sitePurpose: 'послуги, напрями, етапи роботи',
    marketplacePurpose: 'категорії товарів, популярні групи',
    textRoles: ['services-title', 'services-intro', 'service-card-1', 'service-card-2', 'service-card-3', 'service-card-4', 'service-card-5', 'service-card-6'],
    imageRoles: ['services-image', 'service-card-image-1', 'service-card-image-2', 'service-card-image-3', 'service-card-image-4']
  }),
  features: Object.freeze({
    label: 'Переваги / докази довіри',
    sitePurpose: 'переваги, цифри, гарантії, соціальний доказ',
    marketplacePurpose: 'доставка, оплата, гарантія, повернення, підтримка',
    textRoles: ['features-title', 'features-intro', 'feature-1', 'feature-2', 'feature-3', 'feature-4', 'feature-proof-1', 'feature-proof-2'],
    imageRoles: ['features-image']
  }),
  gallery: Object.freeze({
    label: 'Галерея / приклади',
    sitePurpose: 'кейси, портфоліо, фото робіт, приклади',
    marketplacePurpose: 'товарна вітрина, популярні позиції, добірки',
    textRoles: ['gallery-title', 'gallery-intro', 'gallery-caption-1', 'gallery-caption-2', 'gallery-caption-3', 'gallery-caption-4', 'gallery-caption-5', 'gallery-caption-6'],
    imageRoles: ['gallery-image-1', 'gallery-image-2', 'gallery-image-3', 'gallery-image-4', 'gallery-image-5', 'gallery-image-6', 'gallery-bg']
  }),
  cta: Object.freeze({
    label: 'CTA / заклик до дії',
    sitePurpose: 'коротка дія: заявка, консультація, дзвінок',
    marketplacePurpose: 'акція, купити, перейти в каталог, отримати консультацію',
    textRoles: ['cta-title', 'cta-text', 'cta-primary', 'cta-secondary'],
    imageRoles: ['cta-bg', 'cta-image']
  }),
  faq: Object.freeze({
    label: 'FAQ / питання та відповіді',
    sitePurpose: 'часті питання, заперечення, пояснення процесу',
    marketplacePurpose: 'доставка, оплата, гарантія, повернення, наявність',
    textRoles: ['faq-title', 'faq-intro', 'faq-question-1', 'faq-answer-1', 'faq-question-2', 'faq-answer-2', 'faq-question-3', 'faq-answer-3'],
    imageRoles: []
  }),
  contacts: Object.freeze({
    label: 'Контакти / форма',
    sitePurpose: 'контактні дані, форма, графік, адреса',
    marketplacePurpose: 'консультація продавця, месенджери, умови звʼязку',
    textRoles: ['contacts-title', 'contacts-intro', 'contact-phone', 'contact-email', 'contact-address', 'contact-hours', 'contact-form-title'],
    imageRoles: ['contacts-map-image', 'contacts-bg']
  })
});

export const AI_MARKETPLACE_ROLE_REGISTRY = Object.freeze({
  hero: AI_SECTION_ROLE_REGISTRY.hero,
  categories: AI_SECTION_ROLE_REGISTRY.services,
  benefits: AI_SECTION_ROLE_REGISTRY.features,
  productGrid: AI_SECTION_ROLE_REGISTRY.gallery,
  promo: AI_SECTION_ROLE_REGISTRY.cta,
  contacts: AI_SECTION_ROLE_REGISTRY.contacts
});

export function getAiSectionRoleDefinition(type = 'hero') {
  return AI_SECTION_ROLE_REGISTRY[String(type || 'hero')] || AI_SECTION_ROLE_REGISTRY.hero;
}

export function listAiSectionRoleRegistry() {
  return Object.entries(AI_SECTION_ROLE_REGISTRY).map(([type, def]) => ({
    type,
    label: def.label,
    sitePurpose: def.sitePurpose,
    marketplacePurpose: def.marketplacePurpose,
    textRoles: [...(def.textRoles || [])],
    imageRoles: [...(def.imageRoles || [])]
  }));
}

export function roleAt(def, kind = 'text', index = 0, fallbackPrefix = 'content') {
  const list = kind === 'image' ? (def?.imageRoles || []) : (def?.textRoles || []);
  return list[index] || `${fallbackPrefix}-${kind}-${index + 1}`;
}
