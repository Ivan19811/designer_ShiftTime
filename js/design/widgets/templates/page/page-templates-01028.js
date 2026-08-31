// 01030-PAGE-TREE-INHERITED-VIEW-FILL-IMAGE-SYNC
// A page template is a lightweight composition recipe. It references existing
// Header/Main/Footer templates and never embeds/copies their large HTML payloads.

export const PAGE_RECIPE_VERSION_01028 = 'st-page-recipe-v1-01028';

function recipe01028({ headerTemplateId, mainTemplateId, footerTemplateId }) {
  return Object.freeze({
    version: PAGE_RECIPE_VERSION_01028,
    composition: 'header-main-footer-reference',
    header: Object.freeze({ templateId: String(headerTemplateId || '') }),
    main: Object.freeze({ templateId: String(mainTemplateId || '') }),
    footer: Object.freeze({ templateId: String(footerTemplateId || '') })
  });
}

function page01028({ id, folderId, name, description, category, headerTemplateId, mainTemplateId, footerTemplateId }) {
  const pageRecipe = recipe01028({ headerTemplateId, mainTemplateId, footerTemplateId });
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
      version: PAGE_RECIPE_VERSION_01028,
      pageRecipe
    }),
    meta: Object.freeze({
      source: 'system',
      category,
      pageRecipe: true,
      referenceOnly: true,
      noAreaHtmlDuplication: true,
      applyBehavior: 'create-new-page-tab',
      stage: '01030'
    })
  });
}

export const PAGE_TEMPLATES_01028 = Object.freeze([
  page01028({
    id: 'page-school-01-01028',
    folderId: 'fld_page_system_home_education',
    name: 'Освіта · Школа 01',
    description: 'Готова освітня сторінка, зібрана з існуючих School Header + Main + Footer.',
    category: 'education',
    headerTemplateId: 'school-01-header',
    mainTemplateId: 'school-01-main',
    footerTemplateId: 'school-01-footer'
  }),
  page01028({
    id: 'page-marketplace-01-01028',
    folderId: 'fld_page_system_home_shop',
    name: 'Marketplace · ShiftTime 01',
    description: 'Торгова сторінка ShiftTime Marketplace 01 без дублювання Header/Main/Footer.',
    category: 'marketplace',
    headerTemplateId: 'shifttime-marketplace-01-header',
    mainTemplateId: 'shifttime-marketplace-01-main',
    footerTemplateId: 'shifttime-marketplace-01-footer'
  }),
  page01028({
    id: 'page-marketplace-02-01028',
    folderId: 'fld_page_system_home_shop',
    name: 'Marketplace · ShiftTime 02 · Головна продавальна',
    description: 'Поточна преміальна сторінка Marketplace 02: Header 02 + Main 02 + Footer 02.',
    category: 'marketplace',
    headerTemplateId: 'shifttime-marketplace-02-header',
    mainTemplateId: 'shifttime-marketplace-02-main',
    footerTemplateId: 'shifttime-marketplace-02-footer'
  })
]);

export function getPageTemplatesDemo01028() {
  return PAGE_TEMPLATES_01028.slice();
}

export function readPageRecipe01028(template) {
  if (!template) return null;
  if (template.pageRecipe?.version === PAGE_RECIPE_VERSION_01028) return template.pageRecipe;
  try {
    const raw = JSON.parse(String(template.html || ''));
    const recipe = raw?.pageRecipe || raw?.recipe || null;
    if (raw?.__st_page_recipe_v1 === true && recipe?.version === PAGE_RECIPE_VERSION_01028) return recipe;
  } catch {}
  return null;
}
