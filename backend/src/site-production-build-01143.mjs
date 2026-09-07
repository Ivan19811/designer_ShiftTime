const clean=value=>String(value??'').trim();
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

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
  const header=sanitizeProductionHtml01143(page?.html?.header);
  const main=sanitizeProductionHtml01143(page?.html?.main);
  const footer=sanitizeProductionHtml01143(page?.html?.footer);
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

export function buildProductionFiles01143(pkg,{canonicalBaseUrl='',apiProxyTarget=''}={}){
  if(!pkg||typeof pkg!=='object')throw Object.assign(new Error('Publish package is required'),{statusCode:400});
  if(!clean(pkg?.site?.id))throw Object.assign(new Error('Builder site id is required'),{statusCode:400});
  const pages=Array.isArray(pkg.pages)?pkg.pages:[];if(!pages.length)throw Object.assign(new Error('At least one page is required'),{statusCode:400});
  const files=new Map();
  for(const asset of normalizeAssets(pkg.assets))files.set(asset.path,asset.content);
  for(const page of pages){const path=outputPathForRoute01143(page?.path||'/');if(files.has(path))throw Object.assign(new Error(`Duplicate published route: ${page?.path||'/'}`),{statusCode:400});files.set(path,Buffer.from(renderPage(pkg,page,{canonicalBaseUrl}),'utf8'));}
  const target=clean(apiProxyTarget).replace(/\/+$/,'');if(target)files.set('_redirects',Buffer.from(`/api/* ${target}/api/:splat 200\n`,'utf8'));
  return files;
}
