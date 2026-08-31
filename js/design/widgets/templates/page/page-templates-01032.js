// 01032-STANDARD-PAGE-RECIPES
// Page templates remain lightweight composition recipes that reference existing
// Header/Main/Footer templates instead of duplicating heavy HTML payloads.

export const PAGE_RECIPE_VERSION_01032 = 'st-page-recipe-v1-01028';

function recipe01032({ headerTemplateId, mainTemplateId, footerTemplateId }) {
  return Object.freeze({
    version: PAGE_RECIPE_VERSION_01032,
    composition: 'header-main-footer-reference',
    header: Object.freeze({ templateId: String(headerTemplateId || '') }),
    main: Object.freeze({ templateId: String(mainTemplateId || '') }),
    footer: Object.freeze({ templateId: String(footerTemplateId || '') })
  });
}

function page01032({ id, folderId, name, description, category, headerTemplateId, mainTemplateId, footerTemplateId }) {
  const pageRecipe = recipe01032({ headerTemplateId, mainTemplateId, footerTemplateId });
  return Object.freeze({
    id,
    type: 'page',
    folderId,
    name,
    description,
    preview: `page-recipe-${id}`,
    pageRecipe,
    html: JSON.stringify({
      __st_page_recipe_v1: true,
      version: PAGE_RECIPE_VERSION_01032,
      pageRecipe
    }),
    meta: Object.freeze({
      source: 'system',
      category,
      pageRecipe: true,
      referenceOnly: true,
      noAreaHtmlDuplication: true,
      applyBehavior: 'create-new-page-tab',
      stage: '01039'
    })
  });
}

const H = 'shifttime-marketplace-02-header';
const F = 'shifttime-marketplace-02-footer';

export const PAGE_TEMPLATES_01032 = Object.freeze([
  page01032({
    id: 'page-clean-shifttime-01039',
    folderId: 'fld_page_system_clean_shop',
    name: '00 · Чиста сторінка · ShiftTime',
    description: 'Чиста сторінка для роботи з нуля: стандартний Header/Footer ShiftTime і порожній canonical Main 01039. Main не дублюється — сторінка зберігає лише reference.',
    category: 'clean',
    headerTemplateId: H,
    mainTemplateId: 'main-clean-canvas-01039',
    footerTemplateId: F
  }),
  page01032({
    id: 'page-shifttime-about-01032',
    folderId: 'fld_page_system_about_shop',
    name: 'ShiftTime · Про нас',
    description: 'Готова сторінка “Про нас”: Header 02 + Main “Про нас” + Footer 02.',
    category: 'about',
    headerTemplateId: H,
    mainTemplateId: 'shifttime-standard-about-main',
    footerTemplateId: F
  }),
  page01032({
    id: 'page-shifttime-contacts-01032',
    folderId: 'fld_page_system_contacts_shop',
    name: 'ShiftTime · Контакти',
    description: 'Готова сторінка “Контакти”: Header 02 + Main “Контакти” + Footer 02.',
    category: 'contacts',
    headerTemplateId: H,
    mainTemplateId: 'shifttime-standard-contacts-main',
    footerTemplateId: F
  }),
  page01032({
    id: 'page-shifttime-delivery-01032',
    folderId: 'fld_page_system_delivery_shop',
    name: 'ShiftTime · Оплата і доставка',
    description: 'Готова сторінка “Оплата і доставка”: Header 02 + Main сервісної сторінки + Footer 02.',
    category: 'delivery',
    headerTemplateId: H,
    mainTemplateId: 'shifttime-standard-delivery-main',
    footerTemplateId: F
  }),
  page01032({
    id: 'page-shifttime-warranty-01032',
    folderId: 'fld_page_system_legal_shop',
    name: 'ShiftTime · Гарантія та повернення',
    description: 'Готова сторінка “Гарантія та повернення”: Header 02 + Main гарантії + Footer 02.',
    category: 'legal',
    headerTemplateId: H,
    mainTemplateId: 'shifttime-standard-warranty-main',
    footerTemplateId: F
  }),
  page01032({
    id: 'page-shifttime-faq-01032',
    folderId: 'fld_page_system_faq_shop',
    name: 'ShiftTime · FAQ',
    description: 'Готова FAQ-сторінка: Header 02 + Main FAQ + Footer 02.',
    category: 'faq',
    headerTemplateId: H,
    mainTemplateId: 'shifttime-standard-faq-main',
    footerTemplateId: F
  }),
  page01032({
    id: 'page-shifttime-engraving-01032',
    folderId: 'fld_page_system_services_shop',
    name: 'ShiftTime · Гравіювання та персоналізація',
    description: 'Готова сторінка послуги персоналізації: Header 02 + Main послуги + Footer 02.',
    category: 'services',
    headerTemplateId: H,
    mainTemplateId: 'shifttime-standard-engraving-main',
    footerTemplateId: F
  }),
  page01032({
    id: 'page-shifttime-wholesale-01032',
    folderId: 'fld_page_system_pricing_shop',
    name: 'ShiftTime · Оптовим клієнтам',
    description: 'Готова B2B/wholesale сторінка: Header 02 + Main для співпраці + Footer 02.',
    category: 'pricing',
    headerTemplateId: H,
    mainTemplateId: 'shifttime-standard-wholesale-main',
    footerTemplateId: F
  }),
  page01032({
    id: 'page-shifttime-blog-01032',
    folderId: 'fld_page_system_blog_shop',
    name: 'ShiftTime · Блог',
    description: 'Готова сторінка блогу: Header 02 + Main списку статей + Footer 02.',
    category: 'blog',
    headerTemplateId: H,
    mainTemplateId: 'shifttime-standard-blog-main',
    footerTemplateId: F
  }),
  page01032({
    id: 'page-shifttime-article-01032',
    folderId: 'fld_page_system_article_shop',
    name: 'ShiftTime · Стаття / Гайд',
    description: 'Готова сторінка статті: Header 02 + Main article-page + Footer 02.',
    category: 'article',
    headerTemplateId: H,
    mainTemplateId: 'shifttime-standard-article-main',
    footerTemplateId: F
  }),
  page01032({
    id: 'page-shifttime-legal-01032',
    folderId: 'fld_page_system_legal_shop',
    name: 'ShiftTime · Політики та умови',
    description: 'Готова legal/policy сторінка: Header 02 + Main policy page + Footer 02.',
    category: 'legal',
    headerTemplateId: H,
    mainTemplateId: 'shifttime-standard-legal-main',
    footerTemplateId: F
  })
]);

export function getPageTemplatesDemo01032() {
  return PAGE_TEMPLATES_01032.slice();
}

export function readPageRecipe01032(template) {
  if (!template) return null;
  if (template.pageRecipe?.version === PAGE_RECIPE_VERSION_01032) return template.pageRecipe;
  try {
    const raw = JSON.parse(String(template.html || ''));
    const recipe = raw?.pageRecipe || raw?.recipe || null;
    if (raw?.__st_page_recipe_v1 === true && recipe?.version === PAGE_RECIPE_VERSION_01032) return recipe;
  } catch {}
  return null;
}
