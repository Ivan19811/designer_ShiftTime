const clean=value=>String(value??'').trim();
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));


const ROUTE_TITLE_ALIASES_01146=Object.freeze({
  'головна':['home','main'],
  'про-нас':['about','about-us'],
  'контакти':['contact','contacts'],
  'доставка-і-оплата':['delivery','shipping','shipping-and-payment'],
  'доставка-та-оплата':['delivery','shipping','shipping-and-payment'],
  'гарантія-і-повернення':['warranty','returns','warranty-and-returns'],
  'гарантія-та-повернення':['warranty','returns','warranty-and-returns'],
  'блог':['blog'],
  'каталог':['catalog'],
  'товари':['products','shop'],
  'послуги':['services'],
  'новини':['news'],
  'акції':['sale','promotions'],
  'гравіювання':['engraving'],
});

function routeKey01146(value){
  return clean(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’'`]/g,'').replace(/[^a-z0-9а-яіїєґ]+/giu,'-').replace(/^-+|-+$/g,'').replace(/-+/g,'-');
}
function normalizedRoute01146(value){let v=clean(value)||'/';if(!v.startsWith('/'))v='/'+v;v=v.split('#')[0].split('?')[0].replace(/\/{2,}/g,'/');return v==='/'?'/':v.replace(/\/+$/,'');}
function stripTags01146(value){return String(value||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&#39;|&apos;/gi,"'").replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim();}
function buildRouteIndex01146(pages){
  const byAlias=new Map(),byTitle=new Map(),routes=new Set();
  for(const page of Array.isArray(pages)?pages:[]){
    const route=normalizedRoute01146(page?.path||'/');routes.add(route);
    const titleKey=routeKey01146(page?.title||page?.name);if(titleKey){byTitle.set(titleKey,route);byAlias.set(titleKey,route);}
    const pathKey=routeKey01146(route.replace(/^\/+/,''));if(pathKey)byAlias.set(pathKey,route);
    if(route==='/'){byAlias.set('home',route);byAlias.set('main',route);byAlias.set('головна',route);}
    for(const alias of ROUTE_TITLE_ALIASES_01146[titleKey]||[])byAlias.set(routeKey01146(alias),route);
  }
  return {byAlias,byTitle,routes};
}
function resolvePublishedHref01146(href,label,index){
  const raw=clean(href);if(!raw)return raw;
  if(/^(?:https?:|mailto:|tel:|javascript:|data:|blob:|\/\/)/i.test(raw))return raw;
  const labelRoute=index.byTitle.get(routeKey01146(label));
  if(raw==='#')return labelRoute||raw;
  if(raw.startsWith('#')){const route=index.byAlias.get(routeKey01146(raw.slice(1)));return route||labelRoute||raw;}
  if(raw.startsWith('/')){const normalized=normalizedRoute01146(raw);if(index.routes.has(normalized))return normalized;const route=index.byAlias.get(routeKey01146(normalized.replace(/^\/+/,'')));return route||raw;}
  const route=index.byAlias.get(routeKey01146(raw));return route||raw;
}
export function rewritePublishedNavigation01146(html,pages){
  const index=buildRouteIndex01146(pages);
  return String(html||'').replace(/<a\b([^>]*?\bhref\s*=\s*)(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi,(match,before,quote,href,after,inner)=>{
    const next=resolvePublishedHref01146(href,stripTags01146(inner),index);if(next===href)return match;return `<a${before}${quote}${next}${quote}${after}>${inner}</a>`;
  });
}

export function outputPathForRoute01143(route){
  let value=clean(route)||'/';
  value=value.split('#')[0].split('?')[0].replace(/\\/g,'/');
  if(!value.startsWith('/'))value='/'+value;
  value=value.replace(/\/{2,}/g,'/');
  const parts=value.split('/').filter(Boolean).map(part=>encodeURIComponent(decodeURIComponent(part)));
  return parts.length?`${parts.join('/')}/index.html`:'index.html';
}

function canonicalForRoute(base,route){
  const root=clean(base).replace(/\/+$/,'');
  let path=clean(route)||'/';
  path=path.split('#')[0].split('?')[0];if(!path.startsWith('/'))path='/'+path;
  return `${root}${path==='/'?'/':path.replace(/\/+$/,'')}`;
}

function removeMarkedElement(html,markerPattern){
  const paired=new RegExp(`<([a-z][\\w:-]*)\\b(?=[^>]*${markerPattern})[^>]*>[\\s\\S]*?<\\/\\1\\s*>`,'gi');
  const single=new RegExp(`<([a-z][\\w:-]*)\\b(?=[^>]*${markerPattern})[^>]*\\/?>`,'gi');
  return String(html||'').replace(paired,'').replace(single,'');
}

export function sanitizeProductionHtml01143(raw){
  let html=String(raw||'');
  const markers=[
    `class=["'][^"']*(?:st-selection-ui|st-resize(?:-[\\w-]+)?|st-resize-handle|st-section-handle|st-block-handle|st-drag-handle|st-drag-marker|st-drop-marker|st-col-resizer|st-sec-resizer|hb-panel|fb-panel|builder__)[^"']*["']`,
    `(?:id=["'](?:st-header-builder-toolbar|st-footer-builder-toolbar)["']|data-st-table-section-design-edge(?:=[^\\s>]+)?|data-st-fx-runtime=["']?1["']?)`,
  ];
  for(const marker of markers)html=removeMarkedElement(html,marker);
  html=html.replace(/\s(?:contenteditable|draggable|aria-grabbed)(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi,'');
  html=html.replace(/class=(['"])(.*?)\1/gi,(match,quote,value)=>{
    const removed=new Set(['is-selected','hb-dom-active','hb-dom-selected','sf-selection-current','sf-edit-selected','sf-main-drag-source','sf-main-drag-target','is-drop-target']);
    const tokens=String(value).split(/\s+/).filter(Boolean).filter(token=>!removed.has(token)&&!token.startsWith('builder__'));
    return tokens.length?`class=${quote}${tokens.join(' ')}${quote}`:'';
  });
  return html.trim();
}

function normalizeAssets(assets){
  const out=[];for(const asset of Array.isArray(assets)?assets:[]){const path=clean(asset?.path).replace(/^\/+/, '');if(!path)continue;let content;if(Buffer.isBuffer(asset.content))content=asset.content;else if(clean(asset?.encoding).toLowerCase()==='base64')content=Buffer.from(String(asset?.content??''),'base64');else content=Buffer.from(String(asset?.content??''));out.push({path,content});}
  return out;
}

function renderPage(pkg,page,{canonicalBaseUrl}){
  const cssPaths=normalizeAssets(pkg.assets).map(x=>x.path).filter(path=>path.endsWith('.css'));
  const runtime=normalizeAssets(pkg.assets).some(x=>x.path==='assets/site-runtime-01143.js');
  const title=clean(page?.title||page?.name||pkg?.site?.name)||'ShiftTime Site';
  const description=clean(page?.description||pkg?.site?.description);
  const canonical=canonicalForRoute(canonicalBaseUrl,page?.path||'/');
  const header=rewritePublishedNavigation01146(sanitizeProductionHtml01143(page?.html?.header),pkg?.pages);
  const main=rewritePublishedNavigation01146(sanitizeProductionHtml01143(page?.html?.main),pkg?.pages);
  const footer=rewritePublishedNavigation01146(sanitizeProductionHtml01143(page?.html?.footer),pkg?.pages);
  const styles=cssPaths.map(path=>`  <link rel="stylesheet" href="/${esc(path)}">`).join('\n');
  return `<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  ${description?`<meta name="description" content="${esc(description)}">`:''}
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:title" content="${esc(title)}">
  ${description?`<meta property="og:description" content="${esc(description)}">`:''}
  <meta property="og:url" content="${esc(canonical)}">
${styles}
</head>
<body data-st-published="01143" data-site-id="${esc(pkg?.site?.id||'')}" data-page-id="${esc(page?.id||'')}" data-page-mode="${esc(page?.pageMode||'standard')}">
  <div id="site-root" class="site-root" data-page-id="${esc(page?.id||'')}" data-site-id="${esc(pkg?.site?.id||'')}">
    <div id="st-site-header-slot" class="st-site-header-slot" data-site-frame-area="header">${header}</div>
    <main id="st-site-main-slot" class="st-site-main-slot" data-site-frame-area="main">${main}</main>
    <div id="st-site-footer-slot" class="st-site-footer-slot" data-site-frame-area="footer">${footer}</div>
  </div>
  ${runtime?'<script type="module" src="/assets/site-runtime-01143.js"></script>':''}
</body>
</html>`;
}


const CANONICAL_BASE_TOKEN_01151='__ST_CANONICAL_BASE_01151__';

export function materializeOfflineProductionFiles01151(pkg,{canonicalBaseUrl='',apiProxyTarget=''}={}){
  const files=new Map();
  const root=clean(canonicalBaseUrl).replace(/\/+$/,'');
  for(const raw of Array.isArray(pkg?.files)?pkg.files:[]){
    const path=clean(raw?.path).replace(/^\/+/, '');
    if(!path)continue;
    if(files.has(path))throw Object.assign(new Error(`Duplicate production file: ${path}`),{statusCode:400,code:'ST_PUBLISH_FILE_COLLISION'});
    const encoding=clean(raw?.encoding).toLowerCase()==='base64'?'base64':'utf8';
    if(encoding==='base64')files.set(path,Buffer.from(String(raw?.content??''),'base64'));
    else{
      let text=String(raw?.content??'');
      if(path.endsWith('.html'))text=text.split(CANONICAL_BASE_TOKEN_01151).join(root);
      files.set(path,Buffer.from(text,'utf8'));
    }
  }
  const target=clean(apiProxyTarget).replace(/\/+$/,'');
  if(target)files.set('_redirects',Buffer.from(`/api/* ${target}/api/:splat 200\n`,'utf8'));
  return files;
}

export function buildProductionFiles01143(pkg,{canonicalBaseUrl='',apiProxyTarget=''}={}){
  if(clean(pkg?.exporterVersion)==='01151')return materializeOfflineProductionFiles01151(pkg,{canonicalBaseUrl,apiProxyTarget});
  if(!pkg||typeof pkg!=='object')throw Object.assign(new Error('Publish package is required'),{statusCode:400});
  if(!clean(pkg?.site?.id))throw Object.assign(new Error('Builder site id is required'),{statusCode:400});
  const pages=Array.isArray(pkg.pages)?pkg.pages:[];if(!pages.length)throw Object.assign(new Error('At least one page is required'),{statusCode:400});
  const files=new Map();
  for(const asset of normalizeAssets(pkg.assets))files.set(asset.path,asset.content);
  for(const page of pages){const path=outputPathForRoute01143(page?.path||'/');if(files.has(path))throw Object.assign(new Error(`Duplicate published route: ${page?.path||'/'}`),{statusCode:400});files.set(path,Buffer.from(renderPage(pkg,page,{canonicalBaseUrl}),'utf8'));}
  const target=clean(apiProxyTarget).replace(/\/+$/,'');if(target)files.set('_redirects',Buffer.from(`/api/* ${target}/api/:splat 200\n`,'utf8'));
  return files;
}
