const str=value=>String(value??'').trim();
const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const required=['title','open','close','greeting','placeholder','send','sending','assistant','customer','productsFound','productsNotFound','genericResponse','error','resultsTitle','found','noResults','noImage','stock','details','pageTitle'];
const optional=['productsFoundWithOffer','discountBadge','basePrice','finalPrice','acceptOffer','acceptingOffer','offerAddedToCart','offerExpired','offerError'];
export const AI_CONSULTANT_PUBLIC_PAGE_STAGE_01414='01414';
export function normalizeAiConsultantPublicI18n01414(value={}){const out={};for(const key of required)out[key]=str(value?.[key]);if(!required.every(key=>out[key]))return null;for(const key of optional)out[key]=str(value?.[key]);if(!out.productsFoundWithOffer)out.productsFoundWithOffer=out.productsFound;return out;}
const dataName=key=>key.replace(/[A-Z]/g,ch=>`-${ch.toLowerCase()}`);
export function buildAiConsultantPublicWidget01414({config={},i18n={}}={}){
  if(!config?.enabled)return '';const t=normalizeAiConsultantPublicI18n01414(i18n);if(!t)return '';
  const attrs=Object.entries(t).map(([key,value])=>` data-text-${dataName(key)}="${esc(value)}"`).join('');
  const displayName=str(config.consultantName)||t.title;
  return `<div data-st-ai-consultant-public="01414"${attrs} hidden><button type="button" class="st-aic-public-open-01414" data-aic-public-open aria-label="${esc(t.open)}" title="${esc(t.open)}"><span aria-hidden="true">✦</span></button><section class="st-aic-public-panel-01414" data-aic-public-panel hidden><header class="st-aic-public-head-01414"><strong data-aic-public-name>${esc(displayName)}</strong><button type="button" class="st-aic-public-close-01414" data-aic-public-close aria-label="${esc(t.close)}" title="${esc(t.close)}">×</button></header><div class="st-aic-public-messages-01414" data-aic-public-messages></div><div class="st-aic-public-compose-01414"><form data-aic-public-form><input data-aic-public-input maxlength="1200" autocomplete="off" placeholder="${esc(t.placeholder)}" aria-label="${esc(t.placeholder)}"><button type="submit" data-aic-public-send>${esc(t.send)}</button></form><div class="st-aic-public-status-01414" data-aic-public-status aria-live="polite"></div></div></section></div>`;
}
export function injectAiConsultantPublicRuntime01414(html,{config={},i18n={}}={}){
  const widget=buildAiConsultantPublicWidget01414({config,i18n});if(!widget)return String(html||'');let source=String(html||'');
  const script='<!-- ai-consultant-public-runtime-01414.js compatibility marker --><script type="module" src="/js/ai-consultant/ai-consultant-public-runtime-01416.js"></script>';
  if(!source.includes('ai-consultant-public-runtime-01416.js'))source=/<\/body\s*>/i.test(source)?source.replace(/<\/body\s*>/i,`${widget}${script}</body>`):`${source}${widget}${script}`;
  return source;
}
export function buildAiConsultantResultsPage01414({siteName='',config={},i18n={},canonicalBaseUrl=''}={}){
  const t=normalizeAiConsultantPublicI18n01414(i18n);if(!config?.enabled||!t)return '';const root=str(canonicalBaseUrl).replace(/\/+$/,'');const canonical=`${root}/ai-results/`;const widget=buildAiConsultantPublicWidget01414({config,i18n});
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(t.pageTitle)}${siteName?` · ${esc(siteName)}`:''}</title><link rel="canonical" href="${esc(canonical)}"><link rel="stylesheet" href="/css/site-public-01154.css"><link rel="stylesheet" href="/css/ai-consultant-public-01414.css"><link rel="stylesheet" href="/css/ai-consultant-offer-01416.css"></head><body data-st-published="01414" data-page-mode="ai-results"><main class="st-aic-public-results-page-01414" data-st-ai-results-page="01414"><header class="st-aic-public-results-head-01414"><h1>${esc(t.resultsTitle)}</h1><div class="st-aic-public-results-answer-01414" data-aic-results-answer></div><div class="st-aic-public-results-summary-01414" data-aic-results-summary></div></header><section class="st-aic-public-results-grid-01414" data-aic-results-grid></section></main>${widget}<!-- ai-consultant-public-runtime-01414.js compatibility marker --><script type="module" src="/js/ai-consultant/ai-consultant-public-runtime-01416.js"></script></body></html>`;
}
