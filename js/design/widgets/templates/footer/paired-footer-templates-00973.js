// 00973-FOOTER-UNIVERSAL-BATCH-01
// Footer 01–25 remain on the stable 00972 authored family compositions.
// Footer 26–55 are now authored as a second universal batch with explicit family composition variants.
// Canonical JSON remains the only authored layout source for Preview and Applied Site.
// No runtime normalizer, rescue, MutationObserver, timer repair or per-template CSS patching.

import {
  getHeaderFooterStylePairs00965,
  createPairAreaStyleProfile00965
} from '../style-pairs/header-footer-style-pairs-00965.js?v=00966';
import { getHeaderFooterVisualRecipeByNo00969 } from '../style-pairs/header-footer-visual-recipes-00969.js?v=00969';

const MODEL_VERSION_00973 = 'st-hf-json-v1';
const AUTHORED_VERSION_00973 = '00973';

const FAMILY_SPECS_00973 = Object.freeze([
  {id:'F01',slug:'classic-corporate',name:'Classic Corporate',composition:'classic-four-column',character:'neutral-sans · restrained · line-led'},
  {id:'F02',slug:'big-cta-top',name:'Big CTA Top',composition:'hero-cta-over-columns',character:'display-cta · compact-supporting-grid'},
  {id:'F03',slug:'split-40-60',name:'Split 40 / 60',composition:'brand-rail-content-grid',character:'oversized-brand · asymmetric-split'},
  {id:'F04',slug:'centered-premium',name:'Centered Premium',composition:'centered-brand-nav-social',character:'premium-whitespace · centered-type'},
  {id:'F05',slug:'card-grid',name:'Card Grid',composition:'asymmetric-card-grid',character:'surface-led · mixed-card-sizes'},
  {id:'F06',slug:'bento',name:'Bento',composition:'bento-brand-contact-menu-social',character:'asymmetric-bento · modular'},
  {id:'F07',slug:'editorial',name:'Editorial',composition:'editorial-columns-display-heading',character:'serif-display · rules · editorial-rhythm'},
  {id:'F08',slug:'image-split',name:'Image Split',composition:'image-40-content-60',character:'photo-led · split-layout'},
  {id:'F09',slug:'full-image-background',name:'Full Image Background',composition:'full-image-overlay-glass',character:'photo-overlay · contrast-first'},
  {id:'F10',slug:'glass-future',name:'Glass Future',composition:'glass-brand-navigation-contact',character:'glass · glow · thin-border'},
  {id:'F11',slug:'minimal-line',name:'Minimal Line',composition:'line-separated-columns',character:'borderless · rules · typography'},
  {id:'F12',slug:'contact-first',name:'Contact First',composition:'large-contact-secondary-nav',character:'contact-dominant · large-phone'},
  {id:'F13',slug:'newsletter-first',name:'Newsletter First',composition:'newsletter-lead-supporting-grid',character:'lead-form · editorial-support'},
  {id:'F14',slug:'mega-footer',name:'Mega Footer',composition:'six-group-mega-navigation',character:'information-dense · controlled'},
  {id:'F15',slug:'art-direction',name:'Art Direction',composition:'offset-art-type-grid',character:'oversized-number · abstract-svg · offset'},
  {id:'F16',slug:'floating-cta',name:'Floating CTA',composition:'floating-cta-over-main',character:'elevated-cta · grounded-footer'},
  {id:'F17',slug:'stacked-panels',name:'Stacked Panels',composition:'cta-brand-nav-legal-layers',character:'layered-surfaces · horizontal-rhythm'},
  {id:'F18',slug:'dark-cinematic',name:'Dark Cinematic',composition:'cinematic-image-display-contact',character:'cinematic-image · huge-type · restrained-accent'},
  {id:'F19',slug:'soft-organic',name:'Soft Organic',composition:'organic-brand-cards',character:'soft-radius · calm-space · organic-shape'},
  {id:'F20',slug:'brutalist',name:'Brutalist',composition:'hard-grid-bold-labels',character:'square-border · heavy-type · no-shadow'}
]);

const FAMILY_ASSIGNMENTS_00973 = Object.freeze({
  '01':{familyId:'F01',variant:'A'},
  '02':{familyId:'F06',variant:'A'},
  '03':{familyId:'F03',variant:'A'},
  '04':{familyId:'F10',variant:'A'},
  '05':{familyId:'F05',variant:'A'},
  '06':{familyId:'F08',variant:'A'},
  '07':{familyId:'F02',variant:'A'},
  '08':{familyId:'F11',variant:'A'},
  '09':{familyId:'F04',variant:'A'},
  '10':{familyId:'F14',variant:'A'},
  '11':{familyId:'F07',variant:'A'},
  '12':{familyId:'F12',variant:'A'},
  '13':{familyId:'F16',variant:'A'},
  '14':{familyId:'F19',variant:'A'},
  '15':{familyId:'F15',variant:'A'},
  '16':{familyId:'F09',variant:'A'},
  '17':{familyId:'F17',variant:'A'},
  '18':{familyId:'F20',variant:'A'},
  '19':{familyId:'F13',variant:'A'},
  '20':{familyId:'F18',variant:'A'},
  '21':{familyId:'F06',variant:'B'},
  '22':{familyId:'F03',variant:'B'},
  '23':{familyId:'F10',variant:'B'},
  '24':{familyId:'F05',variant:'B'},
  '25':{familyId:'F16',variant:'B'},
  '26':{familyId:'F01',variant:'B2',builderKey:'F01-B2',compositionId:'classic-two-tier-brand-utility'},
  '27':{familyId:'F02',variant:'B2',builderKey:'F02-B2',compositionId:'cta-side-stage-navigation-dock'},
  '28':{familyId:'F03',variant:'B2',builderKey:'F03-B2',compositionId:'split-editorial-mast-contact-rail'},
  '29':{familyId:'F04',variant:'B2',builderKey:'F04-B2',compositionId:'premium-centered-orbit-contact-bar'},
  '30':{familyId:'F05',variant:'B2',builderKey:'F05-B2',compositionId:'mosaic-brand-tall-contact-wide-cta'},
  '31':{familyId:'F06',variant:'B2',builderKey:'F06-B2',compositionId:'bento-horizontal-brand-newsletter-contact'},
  '32':{familyId:'F07',variant:'B2',builderKey:'F07-B2',compositionId:'editorial-newspaper-masthead-three-columns'},
  '33':{familyId:'F08',variant:'B2',builderKey:'F08-B2',compositionId:'image-band-over-utility-grid'},
  '34':{familyId:'F09',variant:'B2',builderKey:'F09-B2',compositionId:'full-image-bottom-dock-panels'},
  '35':{familyId:'F10',variant:'B2',builderKey:'F10-B2',compositionId:'glass-side-rail-floating-utility'},
  '36':{familyId:'F11',variant:'B2',builderKey:'F11-B2',compositionId:'minimal-large-wordmark-rule-columns'},
  '37':{familyId:'F12',variant:'B2',builderKey:'F12-B2',compositionId:'contact-marquee-with-secondary-index'},
  '38':{familyId:'F13',variant:'B2',builderKey:'F13-B2',compositionId:'newsletter-left-stage-brand-right-stack'},
  '39':{familyId:'F14',variant:'B2',builderKey:'F14-B2',compositionId:'mega-footer-three-navigation-bands'},
  '40':{familyId:'F15',variant:'B2',builderKey:'F15-B2',compositionId:'art-poster-number-menu-contact-strip'},
  '41':{familyId:'F16',variant:'B2',builderKey:'F16-B2',compositionId:'floating-contact-card-over-brand-grid'},
  '42':{familyId:'F17',variant:'B2',builderKey:'F17-B2',compositionId:'stacked-panels-navigation-first-cta-last'},
  '43':{familyId:'F18',variant:'B2',builderKey:'F18-B2',compositionId:'cinematic-centered-title-side-contact'},
  '44':{familyId:'F19',variant:'B2',builderKey:'F19-B2',compositionId:'organic-pill-navigation-soft-split'},
  '45':{familyId:'F20',variant:'B2',builderKey:'F20-B2',compositionId:'brutalist-offset-brand-hard-grid'},
  '46':{familyId:'F01',variant:'C2',builderKey:'F01-C2',compositionId:'corporate-brand-band-three-service-columns'},
  '47':{familyId:'F02',variant:'C2',builderKey:'F02-C2',compositionId:'cta-left-rail-right-directory'},
  '48':{familyId:'F03',variant:'C2',builderKey:'F03-C2',compositionId:'vertical-brand-mast-directory-contact'},
  '49':{familyId:'F04',variant:'C2',builderKey:'F04-C2',compositionId:'premium-split-logo-center-links-sides'},
  '50':{familyId:'F05',variant:'C2',builderKey:'F05-C2',compositionId:'dashboard-card-row-feature-bottom'},
  '51':{familyId:'F06',variant:'C2',builderKey:'F06-C2',compositionId:'bento-newsletter-large-menu-mini-cards'},
  '52':{familyId:'F07',variant:'C2',builderKey:'F07-C2',compositionId:'editorial-issue-index-serif-contact'},
  '53':{familyId:'F08',variant:'C2',builderKey:'F08-C2',compositionId:'image-top-masthead-content-below'},
  '54':{familyId:'F09',variant:'C2',builderKey:'F09-C2',compositionId:'image-canvas-side-glass-card'},
  '55':{familyId:'F10',variant:'C2',builderKey:'F10-C2',compositionId:'glass-ticker-top-three-panel-bottom'}
});

export const FOOTER_FAMILY_REGISTRY_00973 = Object.freeze(FAMILY_SPECS_00973.map(Object.freeze));

function clone00973_(value){ return JSON.parse(JSON.stringify(value)); }
function styleText00973_(style){ return Object.entries(style || {}).map(([k,v]) => `${k}:${v};`).join(''); }

function alphaSurface00973_(dark, strong=false){
  return dark
    ? (strong ? 'rgba(2,6,23,.86)' : 'rgba(15,23,42,.62)')
    : (strong ? 'rgba(255,255,255,.96)' : 'rgba(255,255,255,.82)');
}
function softAlt00973_(dark){ return dark ? 'rgba(255,255,255,.055)' : 'rgba(248,250,252,.86)'; }
function textForSurface00973_(dark){ return dark ? '#f8fafc' : '#111827'; }
function serifStack00973_(){ return 'Georgia, "Times New Roman", serif'; }
function groteskStack00973_(){ return '"Arial Black", "Helvetica Neue", Arial, sans-serif'; }

function makeContext00973_(pair,family,variant='A',compositionId=''){
  const recipe=getHeaderFooterVisualRecipeByNo00969(pair.no);
  if(!recipe) throw new Error(`00973 visual recipe missing for pair ${pair.no}`);
  const t=pair.theme;
  const ctx={
    pair,t,recipe,family,variant,compositionId:compositionId||family?.composition||'unknown',
    counters:{section:0,level:0,container:0,block:0},
    brand:pair.brandTitle||pair.shortName||'North Studio',
    subtitle:pair.brandSubtitle||'Digital products',
    cta:pair.ctaLabel||'Дізнатися більше',
    text:recipe.rootColor||t.colors.text,
    muted:t.colors.muted,
    border:t.colors.border,
    accent:t.colors.accent,
    primary:t.colors.primary,
    dark:!!pair.dark
  };
  return ctx;
}
function nextId00973_(ctx,kind){
  ctx.counters[kind]=(ctx.counters[kind]||0)+1;
  return `hf${ctx.pair.no}_footer_${kind}_${String(ctx.counters[kind]).padStart(3,'0')}`;
}

function node00973_(ctx,type,tag,id,attrs={},style={},children=[]){
  const node={type,tag,...(id?{id}:{}),attrs:{...attrs},style:{...style},styleText:styleText00973_(style),children};
  if(id && ['section','level','container','block'].includes(type)){
    node.attrs['data-node-id']=id;
    node.attrs['data-hf-node-type']=type;
    node.attrs['data-hf-template-id']=ctx.pair.footerTemplateId;
    node.attrs['data-hf-authored-template']=AUTHORED_VERSION_00973;
  }
  if(type==='section'){
    node.attrs['data-hf-json-template']='1';
    node.attrs['data-hf-style-pair-id']=ctx.pair.pairId;
    node.attrs['data-hf-style-pair-no']=ctx.pair.no;
    node.attrs['data-footer-family-id']=ctx.family?.id||'F00';
    node.attrs['data-footer-family-name']=ctx.family?.name||'Unknown';
    node.attrs['data-footer-composition-id']=ctx.compositionId||ctx.family?.composition||'unknown';
    node.attrs['data-footer-family-variant']=ctx.variant||'A';
  }
  return node;
}
function text00973_(value){ return {type:'text',text:String(value??'')}; }
function editable00973_(ctx,value,className,style={},attrs={}){
  return node00973_(ctx,'element','span','',{class:className,contenteditable:'true',draggable:'true',spellcheck:'false','data-st-text-target':'1',...attrs},style,[text00973_(value)]);
}
function svgClone00973_(raw){ return raw ? clone00973_(raw) : null; }

function iconSvg00973_(kind){
  const common={type:'element',tag:'svg',attrs:{'aria-hidden':'true',fill:'none',stroke:'currentColor','stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',viewbox:'0 0 24 24'},style:{},styleText:'',children:[]};
  const path=(d)=>({type:'element',tag:'path',attrs:{d},style:{},styleText:'',children:[]});
  const circle=(cx,cy,r)=>({type:'element',tag:'circle',attrs:{cx:String(cx),cy:String(cy),r:String(r)},style:{},styleText:'',children:[]});
  if(kind==='phone') common.children=[path('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z')];
  else if(kind==='mail') common.children=[path('M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'),path('m22 6-10 7L2 6')];
  else if(kind==='map') common.children=[path('M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z'),circle('12','10','3')];
  else if(kind==='instagram') common.children=[{type:'element',tag:'rect',attrs:{x:'2',y:'2',width:'20',height:'20',rx:'5',ry:'5'},style:{},styleText:'',children:[]},path('M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'),path('M17.5 6.5h.01')];
  else if(kind==='facebook') common.children=[path('M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z')];
  else if(kind==='youtube') common.children=[path('M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z'),path('m9.75 15.02 5.75-3.27-5.75-3.27z')];
  else if(kind==='telegram') common.children=[path('M21.5 2.5 2.7 9.7c-1.2.47-1.19 1.15-.22 1.45l4.82 1.5 1.87 6.03c.24.77.12 1.07.95 1.07.65 0 .93-.3 1.29-.65l2.33-2.27 4.84 3.57c.89.49 1.53.24 1.75-.82l3.39-15.99c.33-1.31-.5-1.9-1.5-1.54Z'),path('M7.28 12.42 18.8 5.4'),path('m9.4 18.68 1.49-4.83')];
  else if(kind==='linkedin') common.children=[{type:'element',tag:'rect',attrs:{x:'2',y:'2',width:'20',height:'20',rx:'4',ry:'4'},style:{},styleText:'',children:[]},path('M7 10v7'),path('M7 7h.01'),path('M12 17v-4'),path('M12 13a2 2 0 0 1 4 0v4')];
  else if(kind==='arrow') common.children=[path('M5 12h14'),path('m13 6 6 6-6 6')];
  else if(kind==='shield') common.children=[path('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),path('m9 12 2 2 4-4')];
  else if(kind==='spark') common.children=[path('m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z'),path('m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z')];
  return common;
}

function familyWidth00973_(){ return 'min(1320px,calc(100% - 48px))'; }
function rootStyle00973_(ctx,overrides={}){
  return {
    width:'100%','box-sizing':'border-box',padding:'34px 0 0',margin:'0',
    background:ctx.recipe.rootBackground,
    'background-size':ctx.recipe.rootBackgroundSize||'auto',
    'background-position':ctx.recipe.rootBackgroundPosition||'0% 0%',
    'background-repeat':ctx.recipe.rootBackgroundRepeat||'repeat',
    color:ctx.text,border:'0','border-top':ctx.recipe.rootBorder||`1px solid ${ctx.border}`,
    'border-radius':'0','box-shadow':'none',overflow:'visible',position:'relative',isolation:'isolate',
    'font-family':ctx.t.typography.textFont,container:'hf00973-footer / inline-size',
    '--hf00973-hover-accent':ctx.accent,'--hf00973-root-text':ctx.text,
    ...overrides
  };
}
function makeRoot00973_(ctx,children,styleOverrides={}){
  return node00973_(ctx,'section','footer',nextId00973_(ctx,'section'),{class:`st-section hf00973-footer-section hf00973-family-${ctx.family?.id||'F00'}`,'data-sec-role':'footer',role:'contentinfo'},rootStyle00973_(ctx,styleOverrides),children);
}
function level00973_(ctx,name,children,style={},className=''){
  return node00973_(ctx,'level','div',nextId00973_(ctx,'level'),{
    class:`st-row hf00973-level ${className}`.trim(),'data-st-node':'level','data-layout-mode':'fr','data-layout-orient':'row','data-name':name
  },{width:familyWidth00973_(),margin:'0 auto','box-sizing':'border-box',overflow:'visible',...style},children);
}
function container00973_(ctx,name,children,style={},className=''){
  return node00973_(ctx,'container','div',nextId00973_(ctx,'container'),{
    class:`st-block hf00973-container ${className}`.trim(),'data-st-node':'container','data-layout-mode':'flex','data-layout-orient':'column','data-name':name
  },{width:'100%','min-width':'0','max-width':'100%',display:'flex','flex-direction':'column',gap:'12px',background:'transparent',border:'0',overflow:'visible',padding:'0','box-sizing':'border-box',...style},children);
}
function blockText00973_(ctx,value,role='text',style={},className=''){
  const phoneText=role==='contact-phone';
  return node00973_(ctx,'block','div',nextId00973_(ctx,'block'),{
    class:`hb-elem st-block st-block--text hf00973-text ${role==='heading'?'st-block--heading':''} ${className}`.trim(),
    'data-block-kind':'text','data-block-role':role,'data-name':value,'data-hb-tip':value
  },{width:'100%','min-width':'0','max-width':'100%','min-height':'0',background:'transparent',border:'0',overflow:'visible',padding:'0','box-sizing':'border-box',...style},[
    editable00973_(ctx,value,`st-text-edit hf00973-text__edit ${phoneText?'hf00973-phone-heading__text':''}`.trim(),{
      display:'block',width:phoneText?'max-content':'100%','max-width':'100%','min-width':'0','min-height':'0',height:'auto',padding:'0',border:'0',
      'line-height':'inherit',color:'inherit','font-size':'inherit','font-weight':'inherit','font-family':'inherit','letter-spacing':'inherit',
      'text-transform':'inherit','text-align':'inherit','white-space':phoneText?'nowrap':'normal','word-break':phoneText?'keep-all':'normal','overflow-wrap':phoneText?'normal':'break-word','box-sizing':'border-box'
    })
  ]);
}
function label00973_(ctx,value,color='inherit'){
  return blockText00973_(ctx,value,'eyebrow',{color,opacity:'.78','font-size':'11px','font-weight':'850','line-height':'1.2','letter-spacing':'.12em','text-transform':'uppercase'});
}
function heading00973_(ctx,value,{size='clamp(30px,4vw,58px)',weight='850',font=ctx.t.typography.headingFont,line='1.02',tracking='-.045em',align='left',color='inherit'}={}){
  return blockText00973_(ctx,value,'heading',{color,'font-size':size,'font-weight':weight,'font-family':font,'line-height':line,'letter-spacing':tracking,'text-align':align});
}
function body00973_(ctx,value,{size='14px',weight='600',line='1.6',color='inherit',opacity='.78',align='left',max='680px'}={}){
  return blockText00973_(ctx,value,'text',{color,opacity,'font-size':size,'font-weight':weight,'line-height':line,'text-align':align,'max-width':max});
}
function modernDescription00973_(ctx){
  return `Створюємо зрозумілий цифровий досвід для ${ctx.brand}: головні дії, навігація та контакти без зайвого шуму.`;
}
function splitMenu00973_(items){
  const clean=(items||[]).filter((x)=>Array.isArray(x)&&String(x[0]||'').trim());
  const defaults=[['Про нас','#about'],['Послуги','#services'],['Проєкти','#projects'],['Новини','#news'],['FAQ','#faq'],['Документи','#docs'],['Контакти','#contacts'],['Карта сайту','#sitemap']];
  const all=[...clean,...defaults].slice(0,8);
  return [all.slice(0,4),all.slice(4,8)];
}
function menu00973_(ctx,labelText,items,{showDots=false,textColor=ctx.text,fontSize='14px',fontWeight='700',direction='column',align='flex-start'}={}){
  const list=(items||[]).slice(0,8);
  const lis=list.map(([txt,href])=>node00973_(ctx,'element','li','',{class:'st-menu__item','data-menu-depth':'1'},{width:direction==='row'?'auto':'100%','list-style':'none'},[
    node00973_(ctx,'element','a','',{href:href||'#',class:'st-menu__link st-block st-block--menu-item hf00973-menu__link','data-st-menu-item':'1'},{
      display:'inline-flex','align-items':'center','justify-content':align,gap:'8px',width:direction==='row'?'auto':'100%','min-width':'0','min-height':'30px',
      padding:direction==='row'?'5px 0':'4px 0',background:'transparent',border:'0',color:textColor,'text-decoration':'none',
      'font-size':fontSize,'font-weight':fontWeight,'line-height':'1.25','box-sizing':'border-box','--hf00973-link-hover-color':textColor
    },[
      ...(showDots?[node00973_(ctx,'element','span','',{class:'hf00973-menu-dot','aria-hidden':'true'},{width:'6px',height:'6px','border-radius':'999px',background:ctx.accent,opacity:'.82',flex:'0 0 auto'},[])]:[]),
      node00973_(ctx,'element','span','',{class:'st-menu__text'},{'white-space':'normal','word-break':'normal','overflow-wrap':'break-word'},[text00973_(txt)])
    ])
  ]));
  return node00973_(ctx,'block','div',nextId00973_(ctx,'block'),{
    class:'hb-elem st-block st-block--menu hf00973-menu','data-block-kind':'menu','data-name':labelText,'data-hb-tip':labelText,
    'data-st-menu':'1','data-menu-variant':'footer','data-menu-level1-direction':direction,
    'data-menu-items':JSON.stringify(list.map(([text,href])=>({text,href:href||'#',children:[]})))
  },{width:'100%','min-width':'0','max-width':'100%',display:'flex','align-items':'flex-start',background:'transparent',border:'0',overflow:'visible',padding:'0',color:textColor,'box-sizing':'border-box',
    '--st-menu-link-color':textColor,'--st-menu-link-color-h':textColor,'--st-menu-link-fs':fontSize,'--st-menu-link-fw':fontWeight,
    '--st-menu-l1-color':textColor,'--st-menu-l1-h-color':textColor,'--st-menu-l1-o-color':textColor,'--st-menu-l1-c-color':textColor,
    '--st-menu-l1-fs':fontSize,'--st-menu-l1-h-fs':fontSize,'--st-menu-l1-o-fs':fontSize,'--st-menu-l1-c-fs':fontSize,
    '--st-menu-l1-fw':fontWeight,'--st-menu-l1-h-fw':fontWeight,'--st-menu-l1-o-fw':fontWeight,'--st-menu-l1-c-fw':fontWeight,
    '--st-menu-l1-bg':'transparent','--st-menu-l1-h-bg':'transparent','--st-menu-item-bg':'transparent',
    '--st-menu-l1-bw':'0px','--st-menu-l1-h-bw':'0px','--st-menu-item-bw':'0px',
    '--st-menu-l1-bc':'transparent','--st-menu-l1-h-bc':'transparent','--st-menu-item-bc':'transparent',
    '--st-menu-l1-br':'0px','--st-menu-l1-h-br':'0px','--st-menu-l1-shadow':'none','--st-menu-l1-h-shadow':'none'},[
      node00973_(ctx,'element','nav','',{'aria-label':labelText,class:'st-menu st-menu--footer'},{width:'100%','max-width':'100%','min-width':'0'},[
        node00973_(ctx,'element','ul','',{class:'st-menu__list','data-menu-list-depth':'1'},{margin:'0',padding:'0',width:'100%',display:'flex','flex-direction':direction,'flex-wrap':direction==='row'?'wrap':'nowrap',gap:direction==='row'?'8px 22px':'3px','align-items':align,'list-style':'none','box-sizing':'border-box'},lis)
      ])
    ]);
}
function button00973_(ctx,labelText,href='#',{secondary=false,shape='pill',square=false,outlined=false}={}){
  const b=ctx.t.buttons;
  const baseBg=secondary?b.secondaryBg:b.primaryBg;
  const baseText=secondary?b.secondaryText:b.primaryText;
  const bg=outlined?'transparent':baseBg;
  const bc=outlined?(secondary?b.secondaryBorderColor:ctx.accent):(secondary?b.secondaryBorderColor:b.primaryBorderColor);
  const radius=shape==='square'?'0':shape==='soft'?ctx.t.radius.md:shape==='round'?'50%':b.radius;
  const svg=svgClone00973_(ctx.recipe.ctaIcon)||iconSvg00973_('arrow');
  svg.style={...(svg.style||{}),width:'17px',height:'17px'}; svg.styleText=styleText00973_(svg.style);
  return node00973_(ctx,'block','div',nextId00973_(ctx,'block'),{
    class:`hb-elem st-block st-block--button hf00973-button ${secondary?'is-secondary':'is-primary'}`,'data-block-kind':'button','data-block-role':'button',
    'data-name':labelText,'data-hb-tip':labelText,'data-button-mode':'text','data-button-text':labelText,'data-button-href':href,'data-button-link-mode':'custom',
    'data-button-click-area':'all','data-button-shape':shape,'data-button-fill-mode':outlined?'outline':'solid','data-button-color1':bg
  },{
    width:square?'48px':'auto','max-width':'100%','min-width':'0','min-height':'46px',display:'inline-flex','align-items':'center','justify-content':'center',gap:'9px',
    padding:square?'10px':`${b.paddingY} ${b.paddingX}`,'border-radius':radius,background:bg,color:outlined?(secondary?ctx.text:ctx.accent):baseText,
    border:`${outlined?'1px':(secondary?b.secondaryBorderWidth:b.primaryBorderWidth)} solid ${bc}`,'box-shadow':outlined?'none':(secondary?'none':b.shadow),
    overflow:'visible',flex:'0 1 auto','box-sizing':'border-box'
  },[
    ...(square?[]:[editable00973_(ctx,labelText,'st-text-edit st-button__label',{'font-size':b.fontSize,'font-weight':b.fontWeight,'line-height':'1.2',color:'inherit','white-space':'normal','text-align':'center',width:'auto','min-height':'0',height:'auto',padding:'0',border:'0'})]),
    node00973_(ctx,'element','span','',{class:'hf00973-button__icon','aria-hidden':'true'},{display:'inline-grid','place-items':'center',width:'18px',height:'18px',flex:'0 0 auto'},[svg])
  ]);
}
function logo00973_(ctx,{large=false,center=false,minimal=false}={}){
  const src=ctx.recipe.logoIconShellStyle||{};
  const icon=svgClone00973_(ctx.recipe.logoIcon)||iconSvg00973_('spark');
  icon.style={...(icon.style||{}),width:large?'26px':'20px',height:large?'26px':'20px'}; icon.styleText=styleText00973_(icon.style);
  const mark=node00973_(ctx,'element','span','',{class:'hf00973-logo-mark','aria-hidden':'true'},{
    width:large?'58px':'44px',height:large?'58px':'44px',display:'inline-grid','place-items':'center','border-radius':minimal?'0':(src['border-radius']||ctx.t.icons.logoRadius),
    background:minimal?'transparent':(src.background||ctx.t.icons.logoBg),color:src.color||ctx.accent,border:minimal?'0':(src.border||`1px solid ${ctx.border}`),
    flex:'0 0 auto','box-sizing':'border-box'
  },[icon]);
  return node00973_(ctx,'block','div',nextId00973_(ctx,'block'),{
    class:'hb-elem st-block st-block--text st-block--logo hf00973-logo','data-block-kind':'text','data-block-role':'logo','data-name':'Лого','data-hb-tip':'Лого',
    'data-logo-mode':'logo-text-subtitle','data-logo-source':'icon','data-logo-pos':'left','data-logo-click-area':'all','data-logo-fit':'contain'
  },{width:'100%','min-width':'0',display:'flex','align-items':'center','justify-content':center?'center':'flex-start',gap:large?'15px':'11px',background:'transparent',border:'0',overflow:'visible',padding:'0',color:'inherit','box-sizing':'border-box'},[
    mark,
    node00973_(ctx,'element','div','',{class:'hf00973-logo-copy'},{display:'flex','flex-direction':'column',gap:'3px','min-width':'0','text-align':center?'center':'left'},[
      editable00973_(ctx,ctx.brand,'st-text-edit st-logo__title',{'font-size':large?'30px':ctx.t.typography.logoTitleSize,'font-weight':large?'900':ctx.t.typography.logoTitleWeight,'line-height':'1.05','letter-spacing':large?'-.04em':ctx.t.typography.logoTitleLetterSpacing,color:'inherit','white-space':'normal','overflow-wrap':'break-word'}),
      editable00973_(ctx,ctx.subtitle,'st-text-edit st-logo__subtitle',{'font-size':'11px','font-weight':'700','line-height':'1.2','letter-spacing':'.10em',color:'inherit',opacity:'.72','text-transform':'uppercase','white-space':'normal','overflow-wrap':'break-word'})
    ])
  ]);
}
function infoLink00973_(ctx,labelText,href,kind,{compact=false,large=false,iconBox=true,textColor='inherit'}={}){
  const svg=iconSvg00973_(kind); svg.style={width:large?'20px':'16px',height:large?'20px':'16px'}; svg.styleText=styleText00973_(svg.style);
  return node00973_(ctx,'block','div',nextId00973_(ctx,'block'),{
    class:'hb-elem st-block st-block--text st-block--link hf00973-info-link','data-block-kind':'text','data-block-role':'link','data-name':labelText,'data-hb-tip':labelText
  },{width:'100%','min-width':'0','max-width':'100%','min-height':compact?'28px':'36px',display:'flex','align-items':'center',background:'transparent',border:'0',overflow:'visible',padding:'0',color:textColor,'box-sizing':'border-box'},[
    node00973_(ctx,'element','a','',{href,class:`st-text-edit hf00973-info-link__a ${kind==='phone'?'hf00973-phone-link':''}`.trim(),'data-st-text-target':'1',contenteditable:'true',draggable:'true',spellcheck:'false'},{
      display:'flex','flex-direction':'row','flex-wrap':'nowrap','align-items':'center','justify-content':'flex-start',gap:compact?'7px':'10px',width:'100%','min-width':'0','max-width':'100%',
      'min-height':compact?'28px':'36px',height:'auto',padding:'0',border:'0',background:'transparent',color:'inherit',
      'font-size':large?'clamp(20px,2.2vw,34px)':ctx.t.links.fontSize,'font-weight':large?'850':ctx.t.links.fontWeight,'line-height':'1.25',
      'text-decoration':'none','white-space':kind==='phone'?'nowrap':'normal','word-break':kind==='phone'?'keep-all':'normal','overflow-wrap':kind==='phone'?'normal':'anywhere','box-sizing':'border-box','--hf00973-link-hover-color':textColor
    },[
      ...(iconBox?[node00973_(ctx,'element','span','',{class:'hf00973-mini-icon','aria-hidden':'true'},{
        width:compact?'24px':'32px',height:compact?'24px':'32px',display:'inline-grid','place-items':'center','border-radius':compact?'7px':ctx.t.radius.md,
        background:softAlt00973_(ctx.dark),color:ctx.accent,border:`1px solid ${ctx.border}`,flex:'0 0 auto'
      },[svg])]:[]),
      text00973_(labelText)
    ])
  ]);
}
function socialIcons00973_(ctx,{center=false,square=false,compact=false}={}){
  const size=compact?'36px':'40px';
  const iconSize=compact?'16px':'18px';
  const radius=square?'0':(compact?'12px':ctx.t.icons.radius);
  const items=[
    ['Instagram','instagram'],
    ['Telegram','telegram'],
    ['Facebook','facebook'],
    ['YouTube','youtube']
  ];
  const one=(labelText,kind)=> {
    const svg=iconSvg00973_(kind); svg.style={width:iconSize,height:iconSize}; svg.styleText=styleText00973_(svg.style);
    return node00973_(ctx,'element','a','',{href:`#${kind}`,class:'hf00973-social','aria-label':labelText,title:labelText},{
      width:size,height:size,display:'inline-grid','place-items':'center','border-radius':radius,background:softAlt00973_(ctx.dark),
      color:ctx.text,border:`1px solid ${ctx.border}`,'text-decoration':'none','box-sizing':'border-box',
      '--hf00973-social-hover-bg':ctx.accent,'--hf00973-social-hover-text':ctx.text
    },[svg]);
  };
  return container00973_(ctx,'Соцмережі',items.map(([labelText,kind])=>one(labelText,kind)),{
    display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'center','justify-content':center?'center':'flex-start',gap:compact?'7px':'8px'
  },'hf00973-socials');
}
function socialText00973_(ctx,{center=false}={}){
  return socialIcons00973_(ctx,{center,compact:true});
}
function legal00973_(ctx,{direction='row',textColor='inherit',borderTop=false,compact=true}={}){
  return container00973_(ctx,'Юридичні посилання',[
    infoLink00973_(ctx,'Конфіденційність','#privacy','shield',{compact,iconBox:false,textColor}),
    infoLink00973_(ctx,'Умови','#terms','shield',{compact,iconBox:false,textColor})
  ],{
    display:'flex','flex-direction':direction,'flex-wrap':'wrap','align-items':direction==='row'?'center':'stretch','justify-content':'flex-start',
    gap:direction==='row'?'6px 18px':'2px',padding:borderTop?'10px 0 0':'0',border:borderTop?'0':'0','border-top':borderTop?`1px solid ${ctx.border}`:'0'
  },'hf00973-legal');
}
function contactCard00973_(ctx,{surface=true,legalInside=true,title='Контакти',largePhone=false,compact=false,style={}}={}){
  const children=[
    label00973_(ctx,title),
    infoLink00973_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{large:largePhone,compact}),
    infoLink00973_(ctx,'hello@example.com','mailto:hello@example.com','mail',{compact}),
    infoLink00973_(ctx,'Україна','#contacts','map',{compact}),
    ...(legalInside?[legal00973_(ctx,{direction:'column',borderTop:true,compact:true})]:[])
  ];
  return container00973_(ctx,'Контакти',children,{
    padding:surface?'20px':'0',background:surface?alphaSurface00973_(ctx.dark):'transparent',color:ctx.text,
    border:surface?`1px solid ${ctx.border}`:'0','border-radius':surface?ctx.t.radius.lg:'0','box-shadow':'none',gap:compact?'7px':'10px',...style
  },'hf00973-contact');
}
function navCard00973_(ctx,titleText,items,{surface=true,style={},showDots=false}={}){
  return container00973_(ctx,titleText,[
    label00973_(ctx,titleText),
    menu00973_(ctx,titleText,items,{showDots,textColor:ctx.text})
  ],{
    padding:surface?'20px':'0',background:surface?softAlt00973_(ctx.dark):'transparent',color:ctx.text,
    border:surface?`1px solid ${ctx.border}`:'0','border-radius':surface?ctx.t.radius.lg:'0',gap:'12px',...style
  });
}
function copyright00973_(ctx,{center=false,textColor='inherit'}={}){
  return body00973_(ctx,`© 2026 ${ctx.brand}. Усі права захищені.`,{size:'12px',weight:'650',line:'1.4',color:textColor,opacity:'.68',align:center?'center':'left',max:'100%'});
}
function newsletter00973_(ctx,{darkSurface=false,buttonLabel='Підписатися'}={}){
  const fg=darkSurface?'#f8fafc':ctx.text;
  return container00973_(ctx,'Підписка',[
    label00973_(ctx,'Newsletter',fg),
    heading00973_(ctx,'Новини без зайвого шуму',{size:'clamp(26px,3vw,42px)',weight:'850',color:fg}),
    body00973_(ctx,'Один короткий лист із новими матеріалами та головними оновленнями.',{color:fg,opacity:'.76'}),
    container00973_(ctx,'Форма підписки',[
      node00973_(ctx,'block','div',nextId00973_(ctx,'block'),{'data-block-kind':'text','data-block-role':'input','data-name':'Email','data-hb-tip':'Email',class:'hb-elem st-block hf00973-newsletter-input'},{
        flex:'1 1 260px','min-width':'0','min-height':'46px',display:'flex','align-items':'center',padding:'11px 14px','border-radius':ctx.t.radius.md,
        background:darkSurface?'rgba(255,255,255,.08)':'rgba(255,255,255,.90)',color:fg,border:`1px solid ${darkSurface?'rgba(255,255,255,.18)':ctx.border}`,'box-sizing':'border-box'
      },[editable00973_(ctx,'email@example.com','st-text-edit',{'font-size':'14px','font-weight':'650',color:'inherit',opacity:'.74','white-space':'normal','overflow-wrap':'anywhere'})]),
      button00973_(ctx,buttonLabel,'#subscribe',{shape:'soft'})
    ],{display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'stretch',gap:'8px'})
  ],{gap:'12px'});
}
function imageFigure00973_(ctx,src,alt='Visual'){
  return node00973_(ctx,'container','figure',nextId00973_(ctx,'container'),{
    class:'st-block hf00973-media','data-st-node':'container','data-layout-mode':'flex','data-layout-orient':'column','data-name':'Зображення'
  },{width:'100%','min-width':'0','max-width':'100%','min-height':'300px',margin:'0',padding:'0',overflow:'hidden','border-radius':ctx.t.radius.lg,border:`1px solid ${ctx.border}`,'box-sizing':'border-box'},[
    node00973_(ctx,'element','img','',{src,alt,loading:'lazy',draggable:'false'},{
      display:'block',width:'100%',height:'100%','min-height':'300px','object-fit':'cover','object-position':'center','box-sizing':'border-box'
    },[])
  ]);
}
function abstractSvg00973_(ctx){
  return node00973_(ctx,'element','svg','',{'aria-hidden':'true',viewbox:'0 0 400 220',fill:'none'},{
    width:'100%',height:'100%','min-height':'180px',display:'block'
  },[
    {type:'element',tag:'circle',attrs:{cx:'308',cy:'70',r:'54',fill:'currentColor','fill-opacity':'.16'},style:{},styleText:'',children:[]},
    {type:'element',tag:'circle',attrs:{cx:'250',cy:'150',r:'32',stroke:'currentColor','stroke-width':'3'},style:{},styleText:'',children:[]},
    {type:'element',tag:'path',attrs:{d:'M12 192 188 26l92 92 108-86',stroke:'currentColor','stroke-width':'3'},style:{},styleText:'',children:[]},
    {type:'element',tag:'path',attrs:{d:'M34 34h112v112H34z',stroke:'currentColor','stroke-width':'2','stroke-dasharray':'8 8'},style:{},styleText:'',children:[]}
  ]);
}
function finishModel00973_(ctx,root,sourcePolicy='FOOTER_FAMILY_CANONICAL_MODEL_00973'){
  return {
    version:MODEL_VERSION_00973,schema:'section-level-container-block-dom-v1',scope:'footer',templateId:ctx.pair.footerTemplateId,
    sourcePolicy,renderPolicy:'DOM is rendered from this canonical model; no runtime normalizer/adapter/repair.',
    footerFamilyId:ctx.family?.id||'F00',footerFamilyName:ctx.family?.name||'Unknown',footerCompositionId:ctx.compositionId||ctx.family?.composition||'unknown',
    root
  };
}

function baseColumns00973_(ctx,{surface=false}={}){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  return [
    container00973_(ctx,'Бренд',[logo00973_(ctx),body00973_(ctx,modernDescription00973_(ctx),{size:'13px'}),socialIcons00973_(ctx)],surface?{
      padding:'20px',background:alphaSurface00973_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':ctx.t.radius.lg
    }:{}),
    navCard00973_(ctx,'Навігація',menuA,{surface}),
    navCard00973_(ctx,'Інформація',menuB,{surface}),
    contactCard00973_(ctx,{surface,legalInside:true})
  ];
}

// F01 — Classic Corporate
function buildClassicCorporate00973_(ctx){
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Classic Corporate',baseColumns00973_(ctx,{surface:false}),{
      display:'grid','grid-template-columns':'minmax(260px,1.35fr) repeat(3,minmax(160px,.8fr))',gap:'28px',padding:'34px 0 28px','border-bottom':`1px solid ${ctx.border}`
    },'hf00973-grid hf00973-grid-4'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx),legal00973_(ctx,{direction:'row'})],{
      display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'20px',padding:'18px 0 24px'
    },'hf00973-bottom-row')
  ],{padding:'0'});
  return finishModel00973_(ctx,root);
}

// F02 — Big CTA Top
function buildBigCtaTop00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const ctaSurface=ctx.recipe.featureBackground||ctx.primary;
  const ctaColor=ctx.recipe.featureColor||ctx.t.colors.onPrimary;
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Big CTA',[
      container00973_(ctx,'CTA текст',[
        label00973_(ctx,'Start here',ctaColor),
        heading00973_(ctx,`Готові рухатися далі з ${ctx.brand}?`,{size:'clamp(34px,5vw,68px)',weight:'900',color:ctaColor}),
        body00973_(ctx,modernDescription00973_(ctx),{size:'15px',color:ctaColor,opacity:'.90'})
      ],{gap:'12px'}),
      container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'}),button00973_(ctx,'Контакти','#contacts',{secondary:true,outlined:true,shape:'soft'})],{
        display:'flex','flex-direction':'row','flex-wrap':'wrap','justify-content':'flex-end','align-items':'center',gap:'10px'
      })
    ],{display:'grid','grid-template-columns':'minmax(0,1.4fr) auto','align-items':'end',gap:'28px',padding:'42px',background:ctaSurface,color:ctaColor,'border-radius':ctx.t.radius.lg,'box-shadow':ctx.t.shadow.md},'hf00973-cta-row hf00973-feature-panel'),
    level00973_(ctx,'Supporting',[container00973_(ctx,'Бренд',[logo00973_(ctx),socialText00973_(ctx)],{}),navCard00973_(ctx,'Навігація',menuA,{surface:false}),navCard00973_(ctx,'Інформація',menuB,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true})],{
      display:'grid','grid-template-columns':'1.2fr .8fr .8fr 1fr',gap:'26px',padding:'30px 0 18px'
    },'hf00973-grid hf00973-grid-4'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'15px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]);
  return finishModel00973_(ctx,root);
}

// F03 — Split 40 / 60
function buildSplit406000973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const reverse=ctx.variant==='B';
  const left=container00973_(ctx,'Brand Rail',[
    label00973_(ctx,reverse?'Studio / 25':'Independent / 03'),
    logo00973_(ctx,{large:true}),
    heading00973_(ctx,ctx.brand,{size:'clamp(42px,6vw,82px)',weight:'900'}),
    body00973_(ctx,modernDescription00973_(ctx),{size:'15px'}),
    socialText00973_(ctx)
  ],{padding:'34px',background:alphaSurface00973_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':ctx.t.radius.lg,gap:'18px'});
  const right=container00973_(ctx,'Content',[
    container00973_(ctx,'Navigation Row',[navCard00973_(ctx,'Навігація',menuA,{surface:false}),navCard00973_(ctx,'Інформація',menuB,{surface:false})],{
      display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'24px'
    },'hf00973-grid hf00973-grid-2'),
    contactCard00973_(ctx,{surface:true,legalInside:true,style:{'border-radius':ctx.t.radius.md}}),
    container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'}),button00973_(ctx,'Написати','#contacts',{secondary:true,outlined:true,shape:'soft'})],{
      display:'flex','flex-direction':'row','flex-wrap':'wrap',gap:'8px'
    })
  ],{gap:'22px',padding:'18px 0'});
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Split 40 / 60',reverse?[right,left]:[left,right],{
      display:'grid','grid-template-columns':reverse?'minmax(0,1.55fr) minmax(300px,.85fr)':'minmax(300px,.85fr) minmax(0,1.55fr)',gap:'24px',padding:'20px 0 28px'
    },'hf00973-split'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'16px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]);
  return finishModel00973_(ctx,root);
}

// F04 — Centered Premium
function buildCenteredPremium00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const merged=[...menuA,...menuB].slice(0,6);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Centered Premium',[
      container00973_(ctx,'Centered Brand',[
        logo00973_(ctx,{large:true,center:true,minimal:true}),
        heading00973_(ctx,ctx.brand,{size:'clamp(38px,5.6vw,74px)',font:serifStack00973_(),weight:'700',tracking:'-.035em',align:'center'}),
        body00973_(ctx,'Точність у деталях, спокійна типографіка та простір навколо головного.',{size:'15px',align:'center',max:'720px'}),
        menu00973_(ctx,'Навігація',merged,{direction:'row',align:'center',fontSize:'13px',fontWeight:'750'}),
        container00973_(ctx,'Контакти',[
          infoLink00973_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{compact:true,iconBox:false}),
          infoLink00973_(ctx,'hello@example.com','mailto:hello@example.com','mail',{compact:true,iconBox:false}),
          infoLink00973_(ctx,'Україна','#contacts','map',{compact:true,iconBox:false})
        ],{display:'grid','grid-template-columns':'repeat(3,minmax(0,auto))','justify-content':'center',gap:'8px 24px'},'hf00973-inline-contact hf00973-contact'),
        socialIcons00973_(ctx,{center:true}),
        container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{display:'flex','align-items':'center'})
      ],{'align-items':'center',gap:'22px',padding:'54px 0 42px'})
    ],{display:'block','text-align':'center'}),
    level00973_(ctx,'Bottom',[copyright00973_(ctx,{center:true}),legal00973_(ctx,{direction:'row'})],{
      display:'flex','flex-direction':'column','align-items':'center',gap:'8px',padding:'18px 0 26px','border-top':`1px solid ${ctx.border}`
    },'hf00973-bottom-row')
  ],{padding:'0'});
  return finishModel00973_(ctx,root);
}

// F05 — Card Grid
function buildCardGrid00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const card={padding:'24px',border:`1px solid ${ctx.border}`,'border-radius':ctx.variant==='B'?'8px':'24px',background:alphaSurface00973_(ctx.dark),gap:'14px'};
  const brand=container00973_(ctx,'Brand Card',[logo00973_(ctx,{large:true}),heading00973_(ctx,'Створюємо простір для наступної дії',{size:'clamp(28px,3.5vw,46px)'}),body00973_(ctx,modernDescription00973_(ctx))],{...card,'grid-column':'span 2'});
  const contact=contactCard00973_(ctx,{surface:false,legalInside:true,style:{...card}});
  const menu=container00973_(ctx,'Menu Card',[label00973_(ctx,'Menu'),menu00973_(ctx,'Навігація',menuA,{showDots:true})],card);
  const cta=container00973_(ctx,'CTA Card',[label00973_(ctx,'Next step'),heading00973_(ctx,ctx.cta,{size:'clamp(26px,3vw,42px)'}),button00973_(ctx,'Відкрити','#',{shape:'soft'})],{...card,background:ctx.recipe.featureBackground||ctx.primary,color:ctx.recipe.featureColor||ctx.t.colors.onPrimary,'grid-column':'span 2'});
  const info=container00973_(ctx,'Info Card',[label00973_(ctx,'Info'),menu00973_(ctx,'Інформація',menuB)],card);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Card Grid',[brand,contact,menu,info,cta],{
      display:'grid','grid-template-columns':'repeat(4,minmax(0,1fr))',gap:'14px',padding:'18px 0 20px'
    },'hf00973-card-grid'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'16px 0 24px'},'hf00973-bottom-row')
  ]);
  return finishModel00973_(ctx,root);
}

// F06 — Bento
function buildBento00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const bento={padding:'22px',background:alphaSurface00973_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':ctx.variant==='B'?'14px':'28px'};
  const brand=container00973_(ctx,'Bento Brand',[logo00973_(ctx,{large:true}),heading00973_(ctx,ctx.variant==='B'?'Build. Launch. Improve.':'Один бренд — один зрозумілий шлях.',{size:'clamp(32px,4vw,54px)'}),body00973_(ctx,modernDescription00973_(ctx)),socialText00973_(ctx)],{...bento,'grid-row':'span 2',gap:'16px'});
  const phone=container00973_(ctx,'Контакти',[label00973_(ctx,'Call us'),infoLink00973_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{large:true,iconBox:false})],bento,'hf00973-contact');
  const social=container00973_(ctx,'Social',[label00973_(ctx,'Social'),socialIcons00973_(ctx,{square:ctx.variant==='B'})],bento);
  const menu=container00973_(ctx,'Navigation',[label00973_(ctx,'Explore'),menu00973_(ctx,'Навігація',menuA,{showDots:true})],bento);
  const final=ctx.variant==='B'
    ? newsletter00973_(ctx)
    : container00973_(ctx,'Information',[label00973_(ctx,'Information'),menu00973_(ctx,'Інформація',menuB),legal00973_(ctx,{direction:'column',borderTop:true})],bento);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Bento',[brand,phone,social,menu,final],{
      display:'grid','grid-template-columns':ctx.variant==='B'?'1.15fr .85fr 1fr':'1.2fr .8fr .8fr','grid-auto-rows':'minmax(150px,auto)',gap:'14px',padding:'18px 0 22px'
    },'hf00973-bento'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px'},'hf00973-bottom-row')
  ]);
  return finishModel00973_(ctx,root);
}

// F07 — Editorial
function buildEditorial00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Editorial Heading',[
      container00973_(ctx,'Editorial Lead',[
        label00973_(ctx,'Edition 2026'),
        heading00973_(ctx,'Ideas that move from page to product.',{size:'clamp(42px,7vw,94px)',font:serifStack00973_(),weight:'600',line:'.96',tracking:'-.055em'}),
        body00973_(ctx,'Побудовано навколо типографіки, ритму колонок і тонких ліній — без набору однакових карток.',{size:'16px',max:'760px'})
      ],{gap:'18px',padding:'30px 0'})
    ],{'border-top':`1px solid ${ctx.border}`,'border-bottom':`1px solid ${ctx.border}`}),
    level00973_(ctx,'Editorial Columns',[
      navCard00973_(ctx,'Index',menuA,{surface:false}),
      navCard00973_(ctx,'Archive',menuB,{surface:false}),
      contactCard00973_(ctx,{surface:false,legalInside:false}),
      container00973_(ctx,'About',[label00973_(ctx,'About'),body00973_(ctx,modernDescription00973_(ctx),{size:'13px'}),socialText00973_(ctx)],{})
    ],{display:'grid','grid-template-columns':'repeat(4,minmax(0,1fr))',gap:'30px',padding:'28px 0'},'hf00973-grid hf00973-grid-4'),
    level00973_(ctx,'Editorial Bottom',[copyright00973_(ctx),legal00973_(ctx,{direction:'row'})],{
      display:'grid','grid-template-columns':'1fr auto',gap:'20px',padding:'18px 0 26px','border-top':`1px solid ${ctx.border}`
    },'hf00973-bottom-row')
  ],{padding:'0'});
  return finishModel00973_(ctx,root);
}

// F08 — Image Split
function buildImageSplit00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Image Split',[
      imageFigure00973_(ctx,'assets/system/backgrounds/business/bg-021.jpg','Abstract business background'),
      container00973_(ctx,'Image Split Content',[
        logo00973_(ctx),
        heading00973_(ctx,'Візуальна пауза перед останньою дією.',{size:'clamp(32px,4vw,54px)'}),
        body00973_(ctx,modernDescription00973_(ctx),{size:'15px'}),
        container00973_(ctx,'Split Navigation',[navCard00973_(ctx,'Навігація',menuA,{surface:false}),navCard00973_(ctx,'Інформація',menuB,{surface:false})],{
          display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'18px'
        },'hf00973-grid hf00973-grid-2'),
        contactCard00973_(ctx,{surface:false,legalInside:true,compact:true}),
        container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{display:'flex','flex-direction':'row','flex-wrap':'wrap'})
      ],{padding:'26px 10px 26px 18px',gap:'18px'})
    ],{display:'grid','grid-template-columns':'minmax(300px,.85fr) minmax(0,1.35fr)',gap:'26px',padding:'18px 0 22px'},'hf00973-image-split'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]);
  return finishModel00973_(ctx,root);
}

// F09 — Full Image Background
function buildFullImageBackground00973_(ctx){
  const localText='#f8fafc';
  ctx.text=localText;
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Image Overlay',[
      container00973_(ctx,'Image Lead',[
        label00973_(ctx,'A clear final frame',localText),
        heading00973_(ctx,'Завершуйте сторінку сильною, але читабельною сценою.',{size:'clamp(36px,5vw,70px)',weight:'900',color:localText}),
        body00973_(ctx,modernDescription00973_(ctx),{size:'15px',color:localText,opacity:'.90'}),
        container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'}),button00973_(ctx,'Контакти','#contacts',{secondary:true,outlined:true,shape:'soft'})],{
          display:'flex','flex-direction':'row','flex-wrap':'wrap',gap:'9px'
        })
      ],{padding:'30px',background:'rgba(2,6,23,.70)',color:localText,border:'1px solid rgba(255,255,255,.16)','border-radius':'18px','backdrop-filter':'blur(8px)',gap:'14px'}),
      container00973_(ctx,'Image Links',[
        navCard00973_(ctx,'Навігація',menuA,{surface:false}),
        navCard00973_(ctx,'Інформація',menuB,{surface:false}),
        contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})
      ],{padding:'24px',background:'rgba(2,6,23,.70)',color:localText,border:'1px solid rgba(255,255,255,.16)','border-radius':'18px','backdrop-filter':'blur(8px)',gap:'18px'})
    ],{display:'grid','grid-template-columns':'minmax(0,1.35fr) minmax(290px,.65fr)',gap:'18px',padding:'52px 0 28px'},'hf00973-image-overlay'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx,{textColor:localText})],{padding:'16px 0 24px','border-top':'1px solid rgba(255,255,255,.18)'},'hf00973-bottom-row')
  ],{
    background:"linear-gradient(90deg,rgba(2,6,23,.92),rgba(2,6,23,.64)),url('assets/system/backgrounds/business/bg-008.jpg') center/cover no-repeat",
    'background-size':'cover','background-position':'center','background-repeat':'no-repeat',
    color:localText,'border-top':'0'
  });
  return finishModel00973_(ctx,root);
}

// F10 — Glass Future
function buildGlassFuture00973_(ctx){
  const reverse=ctx.variant==='B';
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const glass={background:'rgba(15,23,42,.48)',color:'#f8fafc',border:'1px solid rgba(255,255,255,.14)','border-radius':reverse?'12px':'24px','backdrop-filter':'blur(18px)','box-shadow':'0 24px 70px rgba(2,6,23,.24)'};
  ctx.text='#f8fafc';
  const brand=container00973_(ctx,'Glass Brand',[logo00973_(ctx,{large:true}),heading00973_(ctx,reverse?'Build the next interface.':'Design systems for the next screen.',{size:'clamp(32px,4.2vw,58px)',color:'#f8fafc'}),body00973_(ctx,modernDescription00973_(ctx),{color:'#f8fafc',opacity:'.78'}),socialIcons00973_(ctx)],{...glass,padding:'28px',gap:'16px'});
  const links=container00973_(ctx,'Glass Links',[navCard00973_(ctx,'Навігація',menuA,{surface:false}),navCard00973_(ctx,'Інформація',menuB,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{...glass,padding:'24px',display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'20px'});
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Glass Future',reverse?[links,brand]:[brand,links],{
      display:'grid','grid-template-columns':reverse?'1.3fr .9fr':'.9fr 1.3fr',gap:'16px',padding:'26px 0 18px'
    },'hf00973-glass-grid'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx,{textColor:'#f8fafc'})],{padding:'15px 0 24px'},'hf00973-bottom-row')
  ],{
    background:"radial-gradient(circle at 15% 20%,rgba(34,211,238,.25),transparent 30%),radial-gradient(circle at 85% 70%,rgba(124,58,237,.30),transparent 35%),linear-gradient(135deg,#020617,#0f172a 60%,#111827)",
    color:'#f8fafc','border-top':'1px solid rgba(255,255,255,.10)'
  });
  return finishModel00973_(ctx,root);
}

// F11 — Minimal Line
function buildMinimalLine00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Minimal Brand',[logo00973_(ctx,{minimal:true}),heading00973_(ctx,'Less surface. More structure.',{size:'clamp(34px,4.8vw,64px)'})],{
      display:'grid','grid-template-columns':'minmax(220px,.55fr) minmax(0,1.45fr)','align-items':'end',gap:'28px',padding:'26px 0 22px','border-bottom':`1px solid ${ctx.border}`
    },'hf00973-minimal-head'),
    level00973_(ctx,'Minimal Columns',[navCard00973_(ctx,'Menu',menuA,{surface:false}),navCard00973_(ctx,'Services',menuB,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:false}),container00973_(ctx,'Social',[label00973_(ctx,'Social'),socialText00973_(ctx)],{})],{
      display:'grid','grid-template-columns':'repeat(4,minmax(0,1fr))',gap:'26px',padding:'24px 0'
    },'hf00973-grid hf00973-grid-4'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx),legal00973_(ctx,{direction:'row'})],{
      display:'grid','grid-template-columns':'1fr auto',gap:'18px',padding:'16px 0 24px','border-top':`1px solid ${ctx.border}`
    },'hf00973-bottom-row')
  ],{padding:'0'});
  return finishModel00973_(ctx,root);
}

// F12 — Contact First
function buildContactFirst00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Contact First',[
      container00973_(ctx,'Контакти',[
        label00973_(ctx,'Let’s talk'),
        heading00973_(ctx,'Телефонуйте нам',{size:'clamp(32px,4vw,52px)'}),
        infoLink00973_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{large:true,iconBox:false}),
        infoLink00973_(ctx,'hello@example.com','mailto:hello@example.com','mail',{iconBox:false}),
        body00973_(ctx,'Україна · Пн–Пт 09:00–18:00',{size:'13px'}),
        container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'}),button00973_(ctx,'Написати','#contacts',{secondary:true,outlined:true,shape:'soft'})],{display:'flex','flex-direction':'row','flex-wrap':'wrap',gap:'8px'})
      ],{padding:'32px',background:ctx.recipe.featureBackground||ctx.primary,color:ctx.recipe.featureColor||ctx.t.colors.onPrimary,'border-radius':ctx.t.radius.lg,gap:'13px'},'hf00973-contact'),
      container00973_(ctx,'Secondary',[
        logo00973_(ctx),
        container00973_(ctx,'Navigation',[navCard00973_(ctx,'Навігація',menuA,{surface:false}),navCard00973_(ctx,'Інформація',menuB,{surface:false})],{
          display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'18px'
        },'hf00973-grid hf00973-grid-2'),
        socialText00973_(ctx),
        legal00973_(ctx,{direction:'row',borderTop:true})
      ],{padding:'18px 0 10px',gap:'20px'})
    ],{display:'grid','grid-template-columns':'minmax(0,1.1fr) minmax(320px,.9fr)',gap:'28px',padding:'18px 0 24px'},'hf00973-contact-first'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]);
  return finishModel00973_(ctx,root);
}

// F13 — Newsletter First
function buildNewsletterFirst00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Newsletter Lead',[
      newsletter00973_(ctx),
      container00973_(ctx,'Newsletter Aside',[label00973_(ctx,'Direct contact'),infoLink00973_(ctx,'hello@example.com','mailto:hello@example.com','mail',{large:true,iconBox:false}),body00973_(ctx,'Запитання, партнерство або новий проєкт — напишіть напряму.',{size:'13px'})],{padding:'24px',background:alphaSurface00973_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':ctx.t.radius.lg,gap:'12px'})
    ],{display:'grid','grid-template-columns':'minmax(0,1.4fr) minmax(280px,.6fr)',gap:'18px',padding:'22px 0 28px','border-bottom':`1px solid ${ctx.border}`},'hf00973-newsletter-lead'),
    level00973_(ctx,'Supporting',[container00973_(ctx,'Бренд',[logo00973_(ctx),socialText00973_(ctx)],{}),navCard00973_(ctx,'Навігація',menuA,{surface:false}),navCard00973_(ctx,'Інформація',menuB,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{
      display:'grid','grid-template-columns':'1.1fr .8fr .8fr 1fr',gap:'24px',padding:'26px 0 18px'
    },'hf00973-grid hf00973-grid-4'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px'},'hf00973-bottom-row')
  ],{padding:'0'});
  return finishModel00973_(ctx,root);
}

// F14 — Mega Footer
function buildMegaFooter00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const groups=[
    ['Каталог',menuA],['Покупцям',menuB],['Компанія',[['Про нас','#about'],['Карʼєра','#career'],['Новини','#news']]],
    ['Допомога',[['FAQ','#faq'],['Доставка','#delivery'],['Підтримка','#support']]],['Бізнес',[['Партнерам','#partners'],['Документи','#docs'],['B2B','#b2b']]]
  ];
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Mega Brand',[container00973_(ctx,'Mega Brand',[logo00973_(ctx,{large:true}),heading00973_(ctx,'Усе важливе — в одному зрозумілому фіналі сторінки.',{size:'clamp(30px,4vw,52px)'}),body00973_(ctx,modernDescription00973_(ctx),{size:'14px'})],{gap:'14px'}),container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{display:'flex','align-items':'flex-end'})],{
      display:'grid','grid-template-columns':'1fr auto','align-items':'end',gap:'26px',padding:'22px 0 24px','border-bottom':`1px solid ${ctx.border}`
    },'hf00973-mega-head'),
    level00973_(ctx,'Mega Navigation',[
      ...groups.map(([name,items])=>navCard00973_(ctx,name,items,{surface:false})),
      contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})
    ],{display:'grid','grid-template-columns':'repeat(6,minmax(0,1fr))',gap:'22px',padding:'28px 0 20px'},'hf00973-mega-grid'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx),socialText00973_(ctx)],{
      display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'18px',padding:'16px 0 24px','border-top':`1px solid ${ctx.border}`
    },'hf00973-bottom-row')
  ],{padding:'0'});
  return finishModel00973_(ctx,root);
}

// F15 — Art Direction
function buildArtDirection00973_(ctx){
  const [menuA]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Art Direction',[
      container00973_(ctx,'Art Lead',[
        label00973_(ctx,'No. 15 / Direction'),
        heading00973_(ctx,'15',{size:'clamp(86px,12vw,170px)',font:groteskStack00973_(),weight:'900',line:'.78',tracking:'-.08em'}),
        heading00973_(ctx,'Make the ending part of the composition.',{size:'clamp(32px,4.4vw,62px)',weight:'900'}),
        body00973_(ctx,modernDescription00973_(ctx),{size:'14px'})
      ],{gap:'12px'}),
      container00973_(ctx,'Art Graphic',[abstractSvg00973_(ctx)],{color:ctx.accent,'align-items':'stretch','justify-content':'center'}),
      container00973_(ctx,'Art Utility',[navCard00973_(ctx,'Index',menuA,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true}),socialText00973_(ctx)],{
        padding:'22px','border-left':`2px solid ${ctx.accent}`,gap:'18px'
      })
    ],{display:'grid','grid-template-columns':'minmax(0,1.2fr) minmax(220px,.7fr) minmax(260px,.7fr)',gap:'24px',padding:'28px 0 26px'},'hf00973-art-grid'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'15px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]);
  return finishModel00973_(ctx,root);
}

// F16 — Floating CTA
function buildFloatingCta00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const compact=ctx.variant==='B';
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Floating CTA',[
      container00973_(ctx,'CTA текст',[label00973_(ctx,'Next step'),heading00973_(ctx,compact?'Почнемо з одного повідомлення.':`Готові зробити наступний крок з ${ctx.brand}?`,{size:compact?'clamp(26px,3.4vw,44px)':'clamp(30px,4vw,52px)'}),body00973_(ctx,modernDescription00973_(ctx),{size:'14px'})],{gap:'10px'}),
      container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'}),button00973_(ctx,'Контакти','#contacts',{secondary:true,outlined:true,shape:'soft'})],{display:'flex','flex-direction':'row','flex-wrap':'wrap','justify-content':'flex-end',gap:'8px'})
    ],{display:'grid','grid-template-columns':'minmax(0,1.25fr) auto','align-items':'center',gap:'24px',padding:compact?'24px 28px':'30px 34px',background:alphaSurface00973_(ctx.dark,true),border:`1px solid ${ctx.border}`,'border-radius':compact?'16px':'28px','box-shadow':ctx.t.shadow.md,position:'relative','z-index':'2','margin-bottom':'-34px'},'hf00973-cta-row hf00973-floating-cta'),
    level00973_(ctx,'Main Footer',[container00973_(ctx,'Бренд',[logo00973_(ctx),socialIcons00973_(ctx)],{}),navCard00973_(ctx,'Навігація',menuA,{surface:false}),navCard00973_(ctx,'Інформація',menuB,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{
      display:'grid','grid-template-columns':'1.15fr .8fr .8fr 1fr',gap:'24px',padding:'74px 0 24px'
    },'hf00973-grid hf00973-grid-4'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'15px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]);
  return finishModel00973_(ctx,root);
}

// F17 — Stacked Panels
function buildStackedPanels00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const layer=(name,children,bg)=>level00973_(ctx,name,children,{display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'24px',padding:'24px 28px',background:bg,border:`1px solid ${ctx.border}`,'border-radius':ctx.t.radius.md,margin:'0 auto 10px'},'hf00973-stacked-layer');
  const root=makeRoot00973_(ctx,[
    layer('Layer CTA',[container00973_(ctx,'CTA текст',[label00973_(ctx,'Layer 01'),heading00973_(ctx,'Завершення сторінки теж має ієрархію.',{size:'clamp(28px,3.6vw,48px)'})],{}),container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{display:'flex','align-items':'flex-end','justify-content':'flex-end'})],ctx.recipe.featureBackground||alphaSurface00973_(ctx.dark,true)),
    layer('Layer Brand + Contact',[container00973_(ctx,'Бренд',[logo00973_(ctx),body00973_(ctx,modernDescription00973_(ctx),{size:'13px'})],{}),contactCard00973_(ctx,{surface:false,legalInside:false,compact:true})],alphaSurface00973_(ctx.dark)),
    layer('Layer Navigation',[navCard00973_(ctx,'Навігація',menuA,{surface:false}),navCard00973_(ctx,'Інформація',menuB,{surface:false})],softAlt00973_(ctx.dark)),
    level00973_(ctx,'Layer Legal',[copyright00973_(ctx),legal00973_(ctx,{direction:'row'})],{display:'grid','grid-template-columns':'1fr auto',gap:'18px',padding:'16px 0 24px'},'hf00973-bottom-row')
  ],{padding:'18px 0 0'});
  return finishModel00973_(ctx,root);
}

// F18 — Dark Cinematic
function buildDarkCinematic00973_(ctx){
  ctx.text='#f8fafc';
  const [menuA]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Cinematic',[
      container00973_(ctx,'Cinematic Lead',[
        label00973_(ctx,'Final scene','#f8fafc'),
        heading00973_(ctx,'Make the last frame memorable.',{size:'clamp(48px,8vw,110px)',font:serifStack00973_(),weight:'600',line:'.92',tracking:'-.055em',color:'#f8fafc'}),
        body00973_(ctx,'Велике зображення, затемнений шар і одна сильна дія — без зайвого декоративного шуму.',{size:'16px',color:'#f8fafc',opacity:'.86',max:'720px'}),
        container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{display:'flex','flex-direction':'row'})
      ],{gap:'18px',padding:'56px 0 44px'}),
      container00973_(ctx,'Cinematic Utility',[navCard00973_(ctx,'Навігація',menuA,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true}),socialText00973_(ctx)],{
        padding:'24px',background:'rgba(2,6,23,.62)',color:'#f8fafc',border:'1px solid rgba(255,255,255,.14)','border-radius':'4px','backdrop-filter':'blur(6px)',gap:'18px'
      })
    ],{display:'grid','grid-template-columns':'minmax(0,1.5fr) minmax(300px,.5fr)',gap:'28px',padding:'0'},'hf00973-cinematic'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx,{textColor:'#f8fafc'})],{padding:'16px 0 24px','border-top':'1px solid rgba(255,255,255,.18)'},'hf00973-bottom-row')
  ],{
    padding:'26px 0 0',
    background:"linear-gradient(90deg,rgba(2,6,23,.94),rgba(2,6,23,.58)),url('assets/system/backgrounds/future/bg-011.jpg') center/cover no-repeat",
    'background-size':'cover','background-position':'center','background-repeat':'no-repeat',
    color:'#f8fafc','border-top':'0'
  });
  return finishModel00973_(ctx,root);
}

// F19 — Soft Organic
function buildSoftOrganic00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const surface=ctx.dark?'rgba(15,23,42,.76)':'rgba(255,255,255,.76)';
  const root=makeRoot00973_(ctx,[
    node00973_(ctx,'element','div','',{'aria-hidden':'true',class:'hf00973-organic-blob'},{position:'absolute',right:'4%',top:'18px',width:'220px',height:'220px','border-radius':'44% 56% 62% 38% / 46% 40% 60% 54%',background:ctx.accent,opacity:'.10','pointer-events':'none'},[]),
    level00973_(ctx,'Soft Organic',[
      container00973_(ctx,'Organic Brand',[logo00973_(ctx,{large:true}),heading00973_(ctx,'Спокійний ритм, м’які форми, чіткі дії.',{size:'clamp(32px,4.4vw,58px)'}),body00973_(ctx,modernDescription00973_(ctx),{size:'15px'}),button00973_(ctx,ctx.cta,'#',{shape:'pill'})],{padding:'30px',background:surface,border:`1px solid ${ctx.border}`,'border-radius':'48px 20px 48px 20px',gap:'16px'}),
      container00973_(ctx,'Organic Utility',[
        container00973_(ctx,'Organic Navigation',[navCard00973_(ctx,'Навігація',menuA,{surface:false}),navCard00973_(ctx,'Інформація',menuB,{surface:false})],{display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'18px'},'hf00973-grid hf00973-grid-2'),
        contactCard00973_(ctx,{surface:true,legalInside:true,compact:true,style:{'border-radius':'18px 40px 18px 40px',background:surface}}),
        socialText00973_(ctx)
      ],{gap:'18px',padding:'14px 0'})
    ],{display:'grid','grid-template-columns':'minmax(0,1fr) minmax(320px,.9fr)',gap:'28px',padding:'28px 0 24px'},'hf00973-organic-grid'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'15px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ],{position:'relative'});
  return finishModel00973_(ctx,root);
}

// F20 — Brutalist
function buildBrutalist00973_(ctx){
  const [menuA,menuB]=splitMenu00973_(ctx.recipe.menuItems);
  const cell={padding:'22px',border:`3px solid ${ctx.text}`,'border-radius':'0',background:'transparent',color:ctx.text,'box-shadow':'none'};
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Brutalist Header',[
      container00973_(ctx,'Brutalist Brand',[label00973_(ctx,'FOOTER / 20'),heading00973_(ctx,ctx.brand.toUpperCase(),{size:'clamp(48px,7vw,96px)',font:groteskStack00973_(),weight:'900',line:'.9',tracking:'-.06em'})],{...cell}),
      container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'square'}),button00973_(ctx,'CONTACT','#contacts',{secondary:true,outlined:true,shape:'square'})],{...cell,display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'center','justify-content':'flex-end',gap:'8px'})
    ],{display:'grid','grid-template-columns':'1.4fr .6fr',gap:'0',padding:'20px 0 0'},'hf00973-brutalist-head'),
    level00973_(ctx,'Brutalist Grid',[
      navCard00973_(ctx,'MENU',menuA,{surface:false,style:cell}),
      navCard00973_(ctx,'INFO',menuB,{surface:false,style:cell}),
      contactCard00973_(ctx,{surface:false,legalInside:true,compact:true,style:cell}),
      container00973_(ctx,'SOCIAL',[label00973_(ctx,'SOCIAL'),socialText00973_(ctx)],cell)
    ],{display:'grid','grid-template-columns':'repeat(4,minmax(0,1fr))',gap:'0',padding:'0'},'hf00973-brutalist-grid'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'16px 0 24px','border-top':`3px solid ${ctx.text}`},'hf00973-bottom-row')
  ],{padding:'0','font-family':'Arial, Helvetica, sans-serif'});
  return finishModel00973_(ctx,root);
}

// 00973 Batch 01 authored composition helpers. These build canonical JSON directly.
function featureColors00973_(ctx){
  const authoredBg=ctx.recipe.featureBackground||ctx.primary;
  const rgba=String(authoredBg||'').match(/^rgba?\(([^)]+)\)$/i);
  const alpha=rgba&&rgba[1].split(',').length>3?Number(rgba[1].split(',')[3].trim()):1;
  if(Number.isFinite(alpha) && alpha<0.58){
    return {bg:ctx.primary,fg:ctx.t.colors.onPrimary||textForSurface00973_(true)};
  }
  return {bg:authoredBg,fg:ctx.recipe.featureColor||ctx.t.colors.onPrimary||textForSurface00973_(ctx.dark)};
}
function panel00973_(ctx,name,children,{strong=false,radius='',padding='22px',style={}}={}){
  return container00973_(ctx,name,children,{padding,background:alphaSurface00973_(ctx.dark,strong),border:`1px solid ${ctx.border}`,'border-radius':radius||ctx.t.radius.lg,gap:'14px',...style});
}
function inlineContact00973_(ctx,{center=false,large=false,legalInside=false}={}){
  return container00973_(ctx,'Inline Contact',[
    infoLink00973_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{compact:!large,large,iconBox:false}),
    infoLink00973_(ctx,'hello@example.com','mailto:hello@example.com','mail',{compact:true,iconBox:false}),
    infoLink00973_(ctx,'Україна','#contacts','map',{compact:true,iconBox:false}),
    ...(legalInside?[legal00973_(ctx,{direction:'row'})]:[])
  ],{display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'center','justify-content':center?'center':'flex-start',gap:'8px 22px'},'hf00973-inline-contact hf00973-contact');
}
function menuPair00973_(ctx,{surface=false,dots=false}={}){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  return container00973_(ctx,'Menu Pair',[navCard00973_(ctx,'Навігація',a,{surface,showDots:dots}),navCard00973_(ctx,'Інформація',b,{surface,showDots:dots})],{display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'18px'},'hf00973-grid hf00973-grid-2');
}
function rule00973_(ctx){ return node00973_(ctx,'element','div','',{'aria-hidden':'true',class:'hf00973-rule'},{height:'1px',width:'100%',background:ctx.border,opacity:'.95'},[]); }

// F01 B2 — Classic Corporate / two-tier brand utility
function buildF01B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Corporate Brand Band',[container00973_(ctx,'Brand Lead',[logo00973_(ctx,{large:true}),heading00973_(ctx,'Чітка структура для наступного кроку.',{size:'clamp(30px,3.4vw,48px)'})],{}),container00973_(ctx,'Brand Utility',[body00973_(ctx,modernDescription00973_(ctx),{size:'14px'}),socialText00973_(ctx)],{'align-items':'flex-end'})],{display:'grid','grid-template-columns':'1fr 1fr',gap:'34px',padding:'32px 0 24px','border-bottom':`1px solid ${ctx.border}`},'hf00973-batch-split'),
    level00973_(ctx,'Corporate Directory',[navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{display:'grid','grid-template-columns':'repeat(3,minmax(0,1fr))',gap:'28px',padding:'24px 0'},'hf00973-batch-grid3'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ],{padding:'0'}); return finishModel00973_(ctx,root);
}

// F02 B2 — Big CTA / side stage
function buildF02B200973_(ctx){
  const fc=featureColors00973_(ctx); const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'CTA Side Stage',[container00973_(ctx,'CTA Stage',[label00973_(ctx,'Let’s build',fc.fg),heading00973_(ctx,`Наступний крок для ${ctx.brand}`,{size:'clamp(40px,6vw,76px)',color:fc.fg}),body00973_(ctx,modernDescription00973_(ctx),{color:fc.fg,opacity:'.88'}),button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{padding:'42px',background:fc.bg,color:fc.fg,'border-radius':ctx.t.radius.lg,gap:'16px'}),container00973_(ctx,'Directory Dock',[navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{padding:'10px 0',gap:'20px'})],{display:'grid','grid-template-columns':'minmax(0,1.35fr) minmax(280px,.65fr)',gap:'26px',padding:'22px 0 26px'},'hf00973-batch-split'),
    level00973_(ctx,'Bottom',[logo00973_(ctx,{minimal:true}),copyright00973_(ctx)],{display:'grid','grid-template-columns':'auto 1fr','align-items':'center',gap:'20px',padding:'16px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]); return finishModel00973_(ctx,root);
}

// F03 B2 — Split / editorial mast + contact rail
function buildF03B200973_(ctx){
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Editorial Split',[container00973_(ctx,'Mast',[label00973_(ctx,'Directory / 28'),heading00973_(ctx,ctx.brand,{size:'clamp(52px,7vw,96px)',font:serifStack00973_(),weight:'650',line:'.92'}),body00973_(ctx,modernDescription00973_(ctx),{size:'15px'}),socialText00973_(ctx)],{padding:'22px 30px 22px 0'}),menuPair00973_(ctx,{dots:true}),panel00973_(ctx,'Contact Rail',[label00973_(ctx,'Direct'),infoLink00973_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{large:true,iconBox:false}),infoLink00973_(ctx,'hello@example.com','mailto:hello@example.com','mail',{compact:true,iconBox:false}),legal00973_(ctx,{direction:'column',borderTop:true})],{radius:'4px'})],{display:'grid','grid-template-columns':'1.2fr 1fr .72fr',gap:'24px',padding:'28px 0'},'hf00973-batch-grid3'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'16px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]); return finishModel00973_(ctx,root);
}

// F04 B2 — Centered Premium / orbit contact bar
function buildF04B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const merged=[...a,...b].slice(0,7);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Premium Orbit',[container00973_(ctx,'Premium Center',[label00973_(ctx,'Established / 2026'),logo00973_(ctx,{large:true,center:true,minimal:true}),heading00973_(ctx,'Тиха впевненість у кожній деталі.',{size:'clamp(40px,5vw,70px)',font:serifStack00973_(),weight:'600',align:'center'}),menu00973_(ctx,'Навігація',merged,{direction:'row',align:'center',fontSize:'13px'}),socialIcons00973_(ctx,{center:true})],{'align-items':'center',gap:'24px',padding:'48px 0 30px'})],{display:'block'}),
    level00973_(ctx,'Contact Orbit',[inlineContact00973_(ctx,{center:true,legalInside:true})],{padding:'18px 24px',background:softAlt00973_(ctx.dark),'border-radius':'999px',border:`1px solid ${ctx.border}`,margin:'0 auto 22px'},'hf00973-batch-pill'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx,{center:true})],{padding:'12px 0 26px'},'hf00973-bottom-row')
  ],{padding:'0'}); return finishModel00973_(ctx,root);
}

// F05 B2 — Mosaic
function buildF05B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const fc=featureColors00973_(ctx); const card={padding:'22px',border:`1px solid ${ctx.border}`,'border-radius':'10px',background:alphaSurface00973_(ctx.dark)};
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Mosaic',[container00973_(ctx,'Brand Mosaic',[logo00973_(ctx,{large:true}),heading00973_(ctx,'Будуємо зрозумілий фінал сторінки.',{size:'clamp(34px,4vw,58px)'})],{...card,'grid-column':'span 2'}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true,style:{...card,'grid-row':'span 2'}}),navCard00973_(ctx,'Навігація',a,{surface:false,style:card}),navCard00973_(ctx,'Інформація',b,{surface:false,style:card}),container00973_(ctx,'CTA Mosaic',[label00973_(ctx,'Action',fc.fg),heading00973_(ctx,ctx.cta,{size:'clamp(26px,3vw,40px)',color:fc.fg}),button00973_(ctx,'Відкрити','#',{shape:'soft'})],{...card,background:fc.bg,color:fc.fg,'grid-column':'span 2'})],{display:'grid','grid-template-columns':'repeat(4,minmax(0,1fr))','grid-auto-rows':'minmax(130px,auto)',gap:'12px',padding:'20px 0'},'hf00973-batch-mosaic'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px'},'hf00973-bottom-row')
  ]); return finishModel00973_(ctx,root);
}

// F06 B2 — Horizontal Bento
function buildF06B200973_(ctx){
  const [a]=splitMenu00973_(ctx.recipe.menuItems); const box={padding:'20px',background:alphaSurface00973_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':'20px'};
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Horizontal Bento',[container00973_(ctx,'Wide Brand',[logo00973_(ctx,{large:true}),body00973_(ctx,modernDescription00973_(ctx)),socialText00973_(ctx)],{...box,'grid-column':'span 2'}),container00973_(ctx,'Phone',[label00973_(ctx,'Call'),infoLink00973_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{large:true,iconBox:false})],box),container00973_(ctx,'Menu',[label00973_(ctx,'Explore'),menu00973_(ctx,'Навігація',a,{direction:'row',fontSize:'13px'})],{...box,'grid-column':'span 2'}),panel00973_(ctx,'Newsletter',[newsletter00973_(ctx)],{radius:'20px',padding:'20px'}),container00973_(ctx,'Legal',[legal00973_(ctx,{direction:'column'}),copyright00973_(ctx)],box)],{display:'grid','grid-template-columns':'1fr 1fr .8fr',gap:'12px',padding:'20px 0'},'hf00973-batch-bento-horizontal'),
  ]); return finishModel00973_(ctx,root);
}

// F07 B2 — Newspaper editorial
function buildF07B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Newspaper Mast',[label00973_(ctx,'THE DIRECTORY · VOL. 32'),heading00973_(ctx,ctx.brand,{size:'clamp(56px,8vw,106px)',font:serifStack00973_(),weight:'600',line:'.86',align:'center'}),rule00973_(ctx)],{display:'flex','flex-direction':'column','align-items':'center',gap:'14px',padding:'30px 0 18px'}),
    level00973_(ctx,'Newspaper Columns',[container00973_(ctx,'Story',[label00973_(ctx,'About'),body00973_(ctx,modernDescription00973_(ctx),{size:'15px',line:'1.75'}),socialText00973_(ctx)],{}),navCard00973_(ctx,'Index',a,{surface:false}),container00973_(ctx,'Contact + Info',[navCard00973_(ctx,'Info',b,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{gap:'20px'})],{display:'grid','grid-template-columns':'1.15fr .75fr 1fr',gap:'34px',padding:'20px 0 26px'},'hf00973-batch-grid3'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`2px solid ${ctx.text}`},'hf00973-bottom-row')
  ],{padding:'0'}); return finishModel00973_(ctx,root);
}

// F08 B2 — Image band
function buildF08B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Image Band',[imageFigure00973_(ctx,'assets/system/backgrounds/business/bg-021.jpg','Business visual')],{padding:'20px 0 0'},'hf00973-batch-image-band'),
    level00973_(ctx,'Image Band Content',[container00973_(ctx,'Brand',[logo00973_(ctx,{large:true}),heading00973_(ctx,'Візуальний акцент зверху, дія — нижче.',{size:'clamp(28px,3.6vw,50px)'}),body00973_(ctx,modernDescription00973_(ctx))],{}),navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),contactCard00973_(ctx,{surface:true,legalInside:true,compact:true})],{display:'grid','grid-template-columns':'1.35fr .7fr .7fr 1fr',gap:'24px',padding:'24px 0'},'hf00973-grid hf00973-grid-4'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]); return finishModel00973_(ctx,root);
}

// F09 B2 — Full image with bottom dock
function buildF09B200973_(ctx){
  const original=ctx.text; ctx.text='#f8fafc'; const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Image Lead',[container00973_(ctx,'Image Copy',[label00973_(ctx,'End frame','#f8fafc'),heading00973_(ctx,'Завершуйте сторінку сильною дією.',{size:'clamp(46px,7vw,92px)',color:'#f8fafc'}),button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{padding:'58px 0 150px',gap:'18px'})],{display:'block'}),
    level00973_(ctx,'Bottom Dock',[container00973_(ctx,'Dock Brand',[logo00973_(ctx),socialText00973_(ctx)],{}),navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{display:'grid','grid-template-columns':'1.1fr .75fr .75fr 1fr',gap:'22px',padding:'24px',background:'rgba(2,6,23,.72)',color:'#f8fafc',border:'1px solid rgba(255,255,255,.16)','border-radius':'20px',margin:'-110px auto 24px','backdrop-filter':'blur(8px)'},'hf00973-grid hf00973-grid-4 hf00973-batch-image-dock'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx,{textColor:'#f8fafc'})],{padding:'12px 0 24px'},'hf00973-bottom-row')
  ],{padding:'0',background:"linear-gradient(90deg,rgba(2,6,23,.90),rgba(2,6,23,.42)),url('assets/system/backgrounds/business/bg-008.jpg') center/cover no-repeat",color:'#f8fafc','border-top':'0'}); ctx.text=original; return finishModel00973_(ctx,root);
}

// F10 B2 — Glass side rail
function buildF10B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const glass={background:ctx.dark?'rgba(255,255,255,.07)':'rgba(255,255,255,.68)','backdrop-filter':'blur(14px)',border:`1px solid ${ctx.dark?'rgba(255,255,255,.15)':ctx.border}`};
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Glass Side Rail',[container00973_(ctx,'Glass Brand',[logo00973_(ctx,{large:true}),heading00973_(ctx,'Прозорі шари, чітка ієрархія.',{size:'clamp(38px,5vw,68px)'}),body00973_(ctx,modernDescription00973_(ctx)),button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{...glass,padding:'34px','border-radius':'28px'}),container00973_(ctx,'Glass Rail',[navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true}),socialIcons00973_(ctx)],{...glass,padding:'24px','border-radius':'28px',gap:'18px'})],{display:'grid','grid-template-columns':'1.4fr .6fr',gap:'18px',padding:'24px 0'},'hf00973-batch-split'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px'},'hf00973-bottom-row')
  ]); return finishModel00973_(ctx,root);
}

// F11 B2 — Minimal large wordmark
function buildF11B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Minimal Wordmark',[heading00973_(ctx,ctx.brand.toUpperCase(),{size:'clamp(58px,10vw,138px)',weight:'900',line:'.82',tracking:'-.07em'})],{padding:'34px 0 24px','border-bottom':`1px solid ${ctx.text}`}),
    level00973_(ctx,'Minimal Directory',[container00973_(ctx,'Manifesto',[body00973_(ctx,modernDescription00973_(ctx),{size:'15px'}),socialText00973_(ctx)],{}),navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{display:'grid','grid-template-columns':'1.25fr .7fr .7fr 1fr',gap:'28px',padding:'24px 0'},'hf00973-grid hf00973-grid-4'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.text}`},'hf00973-bottom-row')
  ],{padding:'0'}); return finishModel00973_(ctx,root);
}

// F12 B2 — Contact marquee
function buildF12B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Contact Marquee',[label00973_(ctx,'Call / write'),blockText00973_(ctx,'+38 (000) 000-00-00','contact-phone',{'font-size':'clamp(28px,7vw,92px)','font-weight':'900','line-height':'1.02','letter-spacing':'-.045em','white-space':'nowrap','word-break':'keep-all','overflow-wrap':'normal'},'hf00973-phone-heading'),infoLink00973_(ctx,'hello@example.com','mailto:hello@example.com','mail',{large:true,iconBox:false}),rule00973_(ctx)],{display:'flex','flex-direction':'column',gap:'14px',padding:'38px 0 24px'}),
    level00973_(ctx,'Secondary Index',[container00973_(ctx,'Brand',[logo00973_(ctx),body00973_(ctx,modernDescription00973_(ctx),{size:'13px'})],{}),navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),container00973_(ctx,'Legal Social',[socialText00973_(ctx),legal00973_(ctx,{direction:'column'})],{})],{display:'grid','grid-template-columns':'1.2fr .75fr .75fr .8fr',gap:'24px',padding:'20px 0 26px'},'hf00973-grid hf00973-grid-4'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ],{padding:'0'}); return finishModel00973_(ctx,root);
}

// F13 B2 — Newsletter stage left
function buildF13B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Newsletter Stage',[panel00973_(ctx,'Newsletter Feature',[newsletter00973_(ctx,{darkSurface:ctx.dark})],{strong:true,radius:'28px',padding:'34px'}),container00973_(ctx,'Right Stack',[container00973_(ctx,'Brand',[logo00973_(ctx,{large:true}),body00973_(ctx,modernDescription00973_(ctx))],{}),menuPair00973_(ctx),inlineContact00973_(ctx,{legalInside:true})],{gap:'22px',padding:'12px 0'})],{display:'grid','grid-template-columns':'1fr 1fr',gap:'26px',padding:'24px 0'},'hf00973-batch-split'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]); return finishModel00973_(ctx,root);
}

// F14 B2 — Mega footer in bands
function buildF14B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const c=[...a,...b]; const groups=[c.slice(0,2),c.slice(2,4),c.slice(4,6),c.slice(6,8)];
  const row=(name,items)=>level00973_(ctx,name,items.map((g,i)=>navCard00973_(ctx,`${name} ${i+1}`,g,{surface:false})),{display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'26px',padding:'18px 0','border-top':`1px solid ${ctx.border}`},'hf00973-batch-grid2');
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Mega Head',[container00973_(ctx,'Brand',[logo00973_(ctx,{large:true}),heading00973_(ctx,'Велика навігація без відчуття таблиці.',{size:'clamp(30px,3.6vw,50px)'})],{}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{display:'grid','grid-template-columns':'1.4fr .6fr',gap:'30px',padding:'30px 0 18px'},'hf00973-batch-split'),
    row('Band A',groups.slice(0,2)),row('Band B',groups.slice(2,4)),
    level00973_(ctx,'Bottom',[copyright00973_(ctx),socialText00973_(ctx)],{display:'grid','grid-template-columns':'1fr auto',gap:'18px',padding:'16px 0 24px'},'hf00973-bottom-row')
  ],{padding:'0'}); return finishModel00973_(ctx,root);
}

// F15 B2 — Art poster
function buildF15B200973_(ctx){
  const [a]=splitMenu00973_(ctx.recipe.menuItems); const fc=featureColors00973_(ctx);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Art Poster',[container00973_(ctx,'Poster Number',[heading00973_(ctx,'40',{size:'clamp(110px,18vw,260px)',font:groteskStack00973_(),weight:'900',line:'.72',color:fc.fg}),label00973_(ctx,'ART / DIRECTION',fc.fg)],{padding:'28px',background:fc.bg,color:fc.fg,'border-radius':'0'}),container00973_(ctx,'Poster Copy',[logo00973_(ctx,{large:true}),heading00973_(ctx,'Футер як завершальний постер.',{size:'clamp(34px,4.6vw,64px)'}),abstractSvg00973_(ctx)],{padding:'24px'}),container00973_(ctx,'Poster Index',[navCard00973_(ctx,'Index',a,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true}),socialText00973_(ctx)],{padding:'24px','border-left':`2px solid ${ctx.accent}`})],{display:'grid','grid-template-columns':'.6fr 1.1fr .65fr',gap:'0',padding:'20px 0'},'hf00973-batch-art-poster'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]); return finishModel00973_(ctx,root);
}

// F16 B2 — Floating contact card
function buildF16B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Floating Contact',[panel00973_(ctx,'Contact Float',[label00973_(ctx,'Talk to us'),infoLink00973_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{large:true,iconBox:false}),infoLink00973_(ctx,'hello@example.com','mailto:hello@example.com','mail',{compact:true,iconBox:false}),button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{strong:true,radius:'26px',padding:'28px',style:{position:'relative','z-index':'2','margin-bottom':'-50px','box-shadow':ctx.t.shadow.md}})],{display:'grid','grid-template-columns':'minmax(280px,520px)',padding:'20px 0 0','justify-content':'end'},'hf00973-batch-float'),
    level00973_(ctx,'Grounded Main',[container00973_(ctx,'Brand',[logo00973_(ctx,{large:true}),body00973_(ctx,modernDescription00973_(ctx)),socialText00973_(ctx)],{}),navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false})],{display:'grid','grid-template-columns':'1.4fr .8fr .8fr',gap:'26px',padding:'86px 0 28px'},'hf00973-batch-grid3'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx),legal00973_(ctx,{direction:'row'})],{display:'grid','grid-template-columns':'1fr auto',gap:'18px',padding:'15px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')
  ]); return finishModel00973_(ctx,root);
}

// F17 B2 — Stacked navigation first
function buildF17B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const layer=(name,children,bg)=>level00973_(ctx,name,children,{display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'22px',padding:'22px 26px',background:bg,border:`1px solid ${ctx.border}`,margin:'0 auto 10px'},'hf00973-stacked-layer');
  const fc=featureColors00973_(ctx);
  const root=makeRoot00973_(ctx,[layer('Navigation First',[navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false})],softAlt00973_(ctx.dark)),layer('Brand Contact',[container00973_(ctx,'Brand',[logo00973_(ctx,{large:true}),body00973_(ctx,modernDescription00973_(ctx))],{}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],alphaSurface00973_(ctx.dark)),layer('CTA Last',[container00973_(ctx,'CTA',[heading00973_(ctx,'Завершити дією, а не шумом.',{size:'clamp(28px,3.4vw,46px)',color:fc.fg})],{}),container00973_(ctx,'CTA дії',[button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{'align-items':'flex-end'})],fc.bg),level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'12px 0 24px'},'hf00973-bottom-row')],{padding:'20px 0 0'}); return finishModel00973_(ctx,root);
}

// F18 B2 — Cinematic centered
function buildF18B200973_(ctx){
  const original=ctx.text; ctx.text='#f8fafc'; const [a]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[
    level00973_(ctx,'Cinema Center',[container00973_(ctx,'Center Title',[label00973_(ctx,'Final frame','#f8fafc'),heading00973_(ctx,'STAY MEMORABLE',{size:'clamp(58px,10vw,138px)',font:serifStack00973_(),weight:'600',line:'.82',align:'center',color:'#f8fafc'}),body00973_(ctx,'Кінематографічний фінал із контрастним текстом і одним чітким маршрутом.',{size:'16px',align:'center',color:'#f8fafc',opacity:'.86'}),button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{'align-items':'center',gap:'20px',padding:'72px 0 54px'})],{display:'block'}),
    level00973_(ctx,'Cinema Utility',[navCard00973_(ctx,'Навігація',a,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true}),socialText00973_(ctx)],{display:'grid','grid-template-columns':'1fr 1fr auto',gap:'26px',padding:'20px 24px',background:'rgba(2,6,23,.68)',color:'#f8fafc',border:'1px solid rgba(255,255,255,.16)','backdrop-filter':'blur(8px)','border-radius':'4px',margin:'0 auto 24px'},'hf00973-batch-grid3'),
    level00973_(ctx,'Bottom',[copyright00973_(ctx,{center:true,textColor:'#f8fafc'})],{padding:'12px 0 24px'},'hf00973-bottom-row')
  ],{padding:'0',background:"linear-gradient(180deg,rgba(2,6,23,.62),rgba(2,6,23,.92)),url('assets/system/backgrounds/future/bg-011.jpg') center/cover no-repeat",color:'#f8fafc','border-top':'0'}); ctx.text=original; return finishModel00973_(ctx,root);
}

// F19 B2 — Organic pill navigation
function buildF19B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const surface=ctx.dark?'rgba(15,23,42,.76)':'rgba(255,255,255,.82)';
  const root=makeRoot00973_(ctx,[node00973_(ctx,'element','div','',{'aria-hidden':'true',class:'hf00973-organic-blob'},{position:'absolute',left:'3%',bottom:'28px',width:'180px',height:'180px','border-radius':'61% 39% 47% 53% / 42% 60% 40% 58%',background:ctx.accent,opacity:'.10','pointer-events':'none'},[]),level00973_(ctx,'Organic Lead',[container00973_(ctx,'Organic Copy',[logo00973_(ctx,{large:true}),heading00973_(ctx,'М’які форми. Ясна навігація.',{size:'clamp(36px,5vw,66px)'}),body00973_(ctx,modernDescription00973_(ctx)),button00973_(ctx,ctx.cta,'#',{shape:'pill'})],{padding:'34px',background:surface,'border-radius':'54px 20px',border:`1px solid ${ctx.border}`}),container00973_(ctx,'Organic Directory',[navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),contactCard00973_(ctx,{surface:true,legalInside:true,compact:true,style:{background:surface,'border-radius':'20px 48px'}})],{gap:'18px'})],{display:'grid','grid-template-columns':'1fr 1fr',gap:'28px',padding:'26px 0'},'hf00973-batch-split'),level00973_(ctx,'Pill Social',[socialText00973_(ctx,{center:true})],{padding:'12px 22px',background:surface,border:`1px solid ${ctx.border}`,'border-radius':'999px',margin:'0 auto 18px'},'hf00973-batch-pill'),level00973_(ctx,'Bottom',[copyright00973_(ctx,{center:true})],{padding:'12px 0 24px'},'hf00973-bottom-row')],{position:'relative'}); return finishModel00973_(ctx,root);
}

// F20 B2 — Brutalist offset
function buildF20B200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const cell={padding:'20px',border:`3px solid ${ctx.text}`,'border-radius':'0',background:'transparent'};
  const root=makeRoot00973_(ctx,[level00973_(ctx,'Brutal Offset',[container00973_(ctx,'Brand',[label00973_(ctx,'45 / HARD GRID'),heading00973_(ctx,ctx.brand.toUpperCase(),{size:'clamp(48px,7vw,96px)',font:groteskStack00973_(),weight:'900',line:'.86'})],{...cell,'grid-column':'span 2'}),container00973_(ctx,'CTA',[button00973_(ctx,ctx.cta,'#',{shape:'square'}),socialText00973_(ctx)],cell),navCard00973_(ctx,'MENU',a,{surface:false,style:cell}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true,style:{...cell,'grid-column':'span 2'}}),navCard00973_(ctx,'INFO',b,{surface:false,style:cell})],{display:'grid','grid-template-columns':'repeat(3,minmax(0,1fr))',gap:'0',padding:'20px 0'},'hf00973-batch-brutal-offset'),level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`3px solid ${ctx.text}`},'hf00973-bottom-row')],{padding:'0','font-family':'Arial, Helvetica, sans-serif'}); return finishModel00973_(ctx,root);
}

// F01 C2 — Corporate brand band + three columns
function buildF01C200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const fc=featureColors00973_(ctx);
  const root=makeRoot00973_(ctx,[level00973_(ctx,'Corporate Feature',[container00973_(ctx,'Brand',[logo00973_(ctx,{large:true}),body00973_(ctx,modernDescription00973_(ctx),{color:fc.fg,opacity:'.9'})],{}),container00973_(ctx,'Action',[heading00973_(ctx,'Поговорімо про наступний проєкт.',{size:'clamp(28px,3vw,44px)',color:fc.fg}),button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{})],{display:'grid','grid-template-columns':'1fr 1fr',gap:'26px',padding:'30px 34px',background:fc.bg,color:fc.fg},'hf00973-batch-split'),level00973_(ctx,'Corporate Columns',[navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{display:'grid','grid-template-columns':'repeat(3,minmax(0,1fr))',gap:'28px',padding:'26px 0'},'hf00973-batch-grid3'),level00973_(ctx,'Bottom',[copyright00973_(ctx),socialText00973_(ctx)],{display:'grid','grid-template-columns':'1fr auto',gap:'18px',padding:'15px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')],{padding:'0'}); return finishModel00973_(ctx,root);
}

// F02 C2 — CTA left rail / right directory
function buildF02C200973_(ctx){
  const fc=featureColors00973_(ctx); const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[level00973_(ctx,'CTA Rail',[container00973_(ctx,'CTA Rail',[label00973_(ctx,'START',fc.fg),heading00973_(ctx,ctx.cta,{size:'clamp(42px,5vw,70px)',color:fc.fg}),button00973_(ctx,'→','#',{square:true,shape:'square'})],{padding:'34px',background:fc.bg,color:fc.fg,'justify-content':'space-between','min-height':'340px'}),container00973_(ctx,'Right Directory',[logo00973_(ctx,{large:true}),body00973_(ctx,modernDescription00973_(ctx)),menuPair00973_(ctx),inlineContact00973_(ctx,{legalInside:true})],{padding:'20px 0',gap:'22px'})],{display:'grid','grid-template-columns':'minmax(240px,.5fr) minmax(0,1.5fr)',gap:'30px',padding:'24px 0'},'hf00973-batch-split'),level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')]); return finishModel00973_(ctx,root);
}

// F03 C2 — Vertical brand mast
function buildF03C200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[level00973_(ctx,'Vertical Mast',[container00973_(ctx,'Mast',[label00973_(ctx,'48 / SPLIT'),heading00973_(ctx,ctx.brand,{size:'clamp(46px,6vw,84px)',weight:'900'}),socialIcons00973_(ctx)],{padding:'30px',background:softAlt00973_(ctx.dark),border:`1px solid ${ctx.border}`}),container00973_(ctx,'Directory',[navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),body00973_(ctx,modernDescription00973_(ctx),{size:'15px'})],{gap:'24px',padding:'12px'}),contactCard00973_(ctx,{surface:true,legalInside:true,largePhone:true,style:{'border-radius':'0'}})],{display:'grid','grid-template-columns':'.72fr 1fr .9fr',gap:'18px',padding:'24px 0'},'hf00973-batch-grid3'),level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px'},'hf00973-bottom-row')]); return finishModel00973_(ctx,root);
}

// F04 C2 — Premium center with side links
function buildF04C200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[level00973_(ctx,'Premium Triptych',[navCard00973_(ctx,'Навігація',a,{surface:false}),container00973_(ctx,'Center Brand',[logo00973_(ctx,{large:true,center:true,minimal:true}),heading00973_(ctx,ctx.brand,{size:'clamp(40px,5vw,68px)',font:serifStack00973_(),weight:'600',align:'center'}),socialIcons00973_(ctx,{center:true})],{'align-items':'center',gap:'18px'}),navCard00973_(ctx,'Інформація',b,{surface:false})],{display:'grid','grid-template-columns':'.8fr 1.3fr .8fr',gap:'28px',padding:'50px 0 30px','align-items':'center'},'hf00973-batch-grid3'),level00973_(ctx,'Premium Contact',[inlineContact00973_(ctx,{center:true,legalInside:true})],{padding:'18px 0','border-top':`1px solid ${ctx.border}`,'border-bottom':`1px solid ${ctx.border}`}),level00973_(ctx,'Bottom',[copyright00973_(ctx,{center:true})],{padding:'16px 0 26px'},'hf00973-bottom-row')],{padding:'0'}); return finishModel00973_(ctx,root);
}

// F05 C2 — Dashboard cards
function buildF05C200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const fc=featureColors00973_(ctx); const box={padding:'20px',background:alphaSurface00973_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':'18px'};
  const root=makeRoot00973_(ctx,[level00973_(ctx,'Dashboard Row',[container00973_(ctx,'Brand',[logo00973_(ctx,{large:true}),body00973_(ctx,modernDescription00973_(ctx))],box),navCard00973_(ctx,'Навігація',a,{surface:false,style:box}),navCard00973_(ctx,'Інформація',b,{surface:false,style:box}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true,style:box})],{display:'grid','grid-template-columns':'repeat(4,minmax(0,1fr))',gap:'12px',padding:'20px 0 12px'},'hf00973-grid hf00973-grid-4'),level00973_(ctx,'Dashboard Feature',[container00973_(ctx,'Feature',[heading00973_(ctx,'Одна велика дія після чотирьох коротких блоків.',{size:'clamp(30px,4vw,52px)',color:fc.fg}),button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{padding:'28px 30px',background:fc.bg,color:fc.fg,'border-radius':'18px',display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'20px'},'hf00973-batch-feature-row')],{padding:'0 0 18px'}),level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px'},'hf00973-bottom-row')]); return finishModel00973_(ctx,root);
}

// F06 C2 — Bento newsletter large
function buildF06C200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const box={padding:'20px',background:alphaSurface00973_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':'24px'};
  const root=makeRoot00973_(ctx,[level00973_(ctx,'Bento Newsletter',[panel00973_(ctx,'Newsletter Large',[newsletter00973_(ctx)],{strong:true,radius:'24px',padding:'30px',style:{'grid-column':'span 2','grid-row':'span 2'}}),container00973_(ctx,'Brand Mini',[logo00973_(ctx),socialIcons00973_(ctx)],box),navCard00973_(ctx,'Menu',a,{surface:false,style:box}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true,style:{...box,'grid-column':'span 2'}}),navCard00973_(ctx,'Info',b,{surface:false,style:box})],{display:'grid','grid-template-columns':'1fr 1fr 1fr',gap:'12px',padding:'20px 0'},'hf00973-batch-bento-news'),level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px'},'hf00973-bottom-row')]); return finishModel00973_(ctx,root);
}

// F07 C2 — Editorial issue index
function buildF07C200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[level00973_(ctx,'Issue Head',[container00973_(ctx,'Issue Meta',[label00973_(ctx,'ISSUE 52 / 2026'),body00973_(ctx,'Independent directory and contact index.',{size:'12px'})],{}),heading00973_(ctx,ctx.brand,{size:'clamp(48px,7vw,94px)',font:serifStack00973_(),weight:'600',align:'right'})],{display:'grid','grid-template-columns':'.5fr 1.5fr',gap:'28px',padding:'28px 0 20px','border-bottom':`2px solid ${ctx.text}`},'hf00973-batch-split'),level00973_(ctx,'Issue Index',[navCard00973_(ctx,'01 / Navigate',a,{surface:false}),navCard00973_(ctx,'02 / Information',b,{surface:false}),container00973_(ctx,'03 / Contact',[contactCard00973_(ctx,{surface:false,legalInside:true,compact:true}),socialText00973_(ctx)],{})],{display:'grid','grid-template-columns':'repeat(3,minmax(0,1fr))',gap:'34px',padding:'24px 0'},'hf00973-batch-grid3'),level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')],{padding:'0'}); return finishModel00973_(ctx,root);
}

// F08 C2 — Image top masthead
function buildF08C200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[level00973_(ctx,'Image Mast',[container00973_(ctx,'Image Overlay Copy',[label00973_(ctx,'Visual / 53','#f8fafc'),heading00973_(ctx,'IMAGE / STORY',{size:'clamp(44px,7vw,90px)',color:'#f8fafc',weight:'900'})],{position:'absolute',left:'26px',right:'26px',bottom:'24px',width:'auto','max-width':'calc(100% - 52px)','z-index':'2'}),imageFigure00973_(ctx,'assets/system/backgrounds/business/bg-021.jpg','Visual masthead')],{position:'relative',padding:'20px 0 0'},'hf00973-batch-image-mast'),level00973_(ctx,'Below Image',[container00973_(ctx,'Brand',[logo00973_(ctx,{large:true}),body00973_(ctx,modernDescription00973_(ctx))],{}),navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{display:'grid','grid-template-columns':'1.2fr .75fr .75fr 1fr',gap:'24px',padding:'24px 0'},'hf00973-grid hf00973-grid-4'),level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00973-bottom-row')]); return finishModel00973_(ctx,root);
}

// F09 C2 — Image canvas side glass card
function buildF09C200973_(ctx){
  const original=ctx.text; ctx.text='#f8fafc'; const [a,b]=splitMenu00973_(ctx.recipe.menuItems);
  const root=makeRoot00973_(ctx,[level00973_(ctx,'Image Canvas',[container00973_(ctx,'Canvas Copy',[label00973_(ctx,'54 / VISUAL','#f8fafc'),heading00973_(ctx,'A clear ending on a full canvas.',{size:'clamp(46px,7vw,94px)',color:'#f8fafc'}),body00973_(ctx,'Контрастний текст не залежить від світлих ділянок фотографії.',{size:'15px',color:'#f8fafc',opacity:'.88'}),button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{padding:'56px 0',gap:'18px'}),container00973_(ctx,'Side Glass',[logo00973_(ctx),navCard00973_(ctx,'Навігація',a,{surface:false}),navCard00973_(ctx,'Інформація',b,{surface:false}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true})],{padding:'24px',background:'rgba(2,6,23,.68)',color:'#f8fafc',border:'1px solid rgba(255,255,255,.16)','border-radius':'24px','backdrop-filter':'blur(8px)',gap:'18px'})],{display:'grid','grid-template-columns':'1.35fr .65fr',gap:'28px',padding:'24px 0'},'hf00973-batch-split'),level00973_(ctx,'Bottom',[copyright00973_(ctx,{textColor:'#f8fafc'})],{padding:'14px 0 24px'},'hf00973-bottom-row')],{padding:'0',background:"linear-gradient(90deg,rgba(2,6,23,.88),rgba(2,6,23,.48)),url('assets/system/backgrounds/business/bg-008.jpg') center/cover no-repeat",color:'#f8fafc','border-top':'0'}); ctx.text=original; return finishModel00973_(ctx,root);
}

// F10 C2 — Glass ticker + three panels
function buildF10C200973_(ctx){
  const [a,b]=splitMenu00973_(ctx.recipe.menuItems); const glass={background:ctx.dark?'rgba(255,255,255,.07)':'rgba(255,255,255,.70)','backdrop-filter':'blur(14px)',border:`1px solid ${ctx.dark?'rgba(255,255,255,.16)':ctx.border}`,'border-radius':'18px'};
  const root=makeRoot00973_(ctx,[level00973_(ctx,'Glass Ticker',[container00973_(ctx,'Ticker',[label00973_(ctx,'55 / GLASS'),menu00973_(ctx,'Ticker',[...a,...b].slice(0,6),{direction:'row',fontSize:'12px',fontWeight:'800'})],{...glass,padding:'12px 18px',display:'flex','flex-direction':'column','align-items':'stretch',gap:'10px'})],{padding:'20px 0 12px'}),level00973_(ctx,'Glass Panels',[container00973_(ctx,'Brand',[logo00973_(ctx,{large:true}),heading00973_(ctx,'Фінальний шар без втрати читабельності.',{size:'clamp(30px,4vw,52px)'}),button00973_(ctx,ctx.cta,'#',{shape:'soft'})],{...glass,padding:'28px'}),container00973_(ctx,'Directory',[menuPair00973_(ctx)],{...glass,padding:'24px'}),contactCard00973_(ctx,{surface:false,legalInside:true,compact:true,style:{...glass,padding:'24px'}})],{display:'grid','grid-template-columns':'1.15fr 1fr .85fr',gap:'14px',padding:'0 0 20px'},'hf00973-batch-grid3'),level00973_(ctx,'Bottom',[copyright00973_(ctx)],{padding:'14px 0 24px'},'hf00973-bottom-row')]); return finishModel00973_(ctx,root);
}

const BATCH_VARIANT_BUILDERS_00973 = Object.freeze({
  'F01-B2':buildF01B200973_,'F02-B2':buildF02B200973_,'F03-B2':buildF03B200973_,'F04-B2':buildF04B200973_,'F05-B2':buildF05B200973_,
  'F06-B2':buildF06B200973_,'F07-B2':buildF07B200973_,'F08-B2':buildF08B200973_,'F09-B2':buildF09B200973_,'F10-B2':buildF10B200973_,
  'F11-B2':buildF11B200973_,'F12-B2':buildF12B200973_,'F13-B2':buildF13B200973_,'F14-B2':buildF14B200973_,'F15-B2':buildF15B200973_,
  'F16-B2':buildF16B200973_,'F17-B2':buildF17B200973_,'F18-B2':buildF18B200973_,'F19-B2':buildF19B200973_,'F20-B2':buildF20B200973_,
  'F01-C2':buildF01C200973_,'F02-C2':buildF02C200973_,'F03-C2':buildF03C200973_,'F04-C2':buildF04C200973_,'F05-C2':buildF05C200973_,
  'F06-C2':buildF06C200973_,'F07-C2':buildF07C200973_,'F08-C2':buildF08C200973_,'F09-C2':buildF09C200973_,'F10-C2':buildF10C200973_
});

const FAMILY_BUILDERS_00973 = Object.freeze({
  F01:buildClassicCorporate00973_,
  F02:buildBigCtaTop00973_,
  F03:buildSplit406000973_,
  F04:buildCenteredPremium00973_,
  F05:buildCardGrid00973_,
  F06:buildBento00973_,
  F07:buildEditorial00973_,
  F08:buildImageSplit00973_,
  F09:buildFullImageBackground00973_,
  F10:buildGlassFuture00973_,
  F11:buildMinimalLine00973_,
  F12:buildContactFirst00973_,
  F13:buildNewsletterFirst00973_,
  F14:buildMegaFooter00973_,
  F15:buildArtDirection00973_,
  F16:buildFloatingCta00973_,
  F17:buildStackedPanels00973_,
  F18:buildDarkCinematic00973_,
  F19:buildSoftOrganic00973_,
  F20:buildBrutalist00973_
});

function resolveFamily00973_(pair){
  const no=String(pair.no||'').padStart(2,'0');
  const assignment=FAMILY_ASSIGNMENTS_00973[no];
  if(!assignment) throw new Error(`00973 footer pair ${no} has no family assignment`);
  const family=FOOTER_FAMILY_REGISTRY_00973.find((item)=>item.id===assignment.familyId)||null;
  if(!family) throw new Error(`00973 footer family ${assignment.familyId} not registered`);
  const builder=assignment.builderKey ? BATCH_VARIANT_BUILDERS_00973[assignment.builderKey] : FAMILY_BUILDERS_00973[family.id];
  if(typeof builder!=='function') throw new Error(`00973 footer composition ${assignment.builderKey||family.id} has no builder`);
  return {family,variant:assignment.variant||'A',compositionId:assignment.compositionId||family.composition,builder};
}

function buildModel00973_(pair){
  const resolved=resolveFamily00973_(pair);
  const ctx=makeContext00973_(pair,resolved.family,resolved.variant,resolved.compositionId);
  return resolved.builder(ctx);
}

function escAttr00973_(value){ return String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escText00973_(value){ return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function renderNode00973_(node){
  if(!node) return '';
  if(node.type==='text') return escText00973_(node.text||'');
  const tag=String(node.tag||'div').toLowerCase();
  const attrs={...(node.attrs||{})};
  if(node.styleText!=null && node.styleText!=='') attrs.style=String(node.styleText);
  const attrText=Object.entries(attrs).map(([key,val])=>val===true||val===''?` ${key}`:` ${key}="${escAttr00973_(val)}"`).join('');
  const children=Array.isArray(node.children)?node.children.map(renderNode00973_).join(''):'';
  const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  if(voidTags.has(tag)) return `<${tag}${attrText}>`;
  return `<${tag}${attrText}>${children}</${tag}>`;
}

const RAW_00973=getHeaderFooterStylePairs00965().map((pair)=>{
  const resolved=resolveFamily00973_(pair);
  const family=resolved.family;
  const variant=resolved.variant;
  const compositionId=resolved.compositionId;
  const model=buildModel00973_(pair);
  return {
    id:pair.footerTemplateId,type:'footer',folderId:'fld_footer',
    name:`${pair.no} · ${pair.name} · FOOTER`,styleName:`${pair.no} · ${pair.name} · Footer`,preview:`paired-footer-${pair.no}`,
    description:`${family.id} · ${family.name} · ${compositionId} · universal authored Footer composition; paired visual DNA remains tied to Header ${pair.no}.`,
    meta:{
      source:'system',palette:pair.palette,pairId:pair.pairId,pairNo:pair.no,pairName:pair.name,pairedHeaderTemplateId:pair.headerTemplateId,
      pairContract:'header-footer-style-pair-v2-00971',visualRecipeContract:'header-footer-full-visual-recipe-v1-00969',
      modelContract:MODEL_VERSION_00973,singleSourceOfTruth:'model',standardKeys00965:true,authoredFooter00973:true,
      footerFamilyId:family.id,footerFamilyName:family.name,footerFamilySlug:family.slug,footerCompositionId:compositionId,
      footerCompositionVariant:variant,footerDesignCharacter:family.character,
      familyArchitecture00973:true,batch01Universal00973:Number(pair.no)>=26,stable00971Retained00973:false,
      tools:['section','row','container','logo','menu','text','button','link','icon','media']
    },
    modelVersion:MODEL_VERSION_00973,model,
    styleProfile:createPairAreaStyleProfile00965(pair,'footer',pair.footerTemplateId),
    html:renderNode00973_(model.root)
  };
});

export const PAIRED_FOOTER_TEMPLATES_00973=Object.freeze(RAW_00973.map(Object.freeze));
export function getPairedFooterTemplates00973(){ return PAIRED_FOOTER_TEMPLATES_00973.map(clone00973_); }
export function getFooterFamilyRegistry00973(){ return FOOTER_FAMILY_REGISTRY_00973.map(clone00973_); }
