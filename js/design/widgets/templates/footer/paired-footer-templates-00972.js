// 00972-FOOTER-UNIVERSAL-DESIGN-FAMILIES
// Footer 01–25 are authored through an explicit family registry and family builders.
// Footer 26–55 stay on the stable 00971 composition for this architecture-first batch.
// Canonical JSON remains the only authored layout source for Preview and Applied Site.
// No runtime normalizer, rescue, MutationObserver, timer repair or per-template CSS patching.

import {
  getHeaderFooterStylePairs00965,
  createPairAreaStyleProfile00965
} from '../style-pairs/header-footer-style-pairs-00965.js?v=00966';
import { getHeaderFooterVisualRecipeByNo00969 } from '../style-pairs/header-footer-visual-recipes-00969.js?v=00969';

const MODEL_VERSION_00972 = 'st-hf-json-v1';
const AUTHORED_VERSION_00972 = '00972';

const FAMILY_SPECS_00972 = Object.freeze([
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

const FAMILY_ASSIGNMENTS_00972 = Object.freeze({
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
  '25':{familyId:'F16',variant:'B'}
});

export const FOOTER_FAMILY_REGISTRY_00972 = Object.freeze(FAMILY_SPECS_00972.map(Object.freeze));

function clone00972_(value){ return JSON.parse(JSON.stringify(value)); }
function styleText00972_(style){ return Object.entries(style || {}).map(([k,v]) => `${k}:${v};`).join(''); }

function alphaSurface00972_(dark, strong=false){
  return dark
    ? (strong ? 'rgba(2,6,23,.86)' : 'rgba(15,23,42,.62)')
    : (strong ? 'rgba(255,255,255,.96)' : 'rgba(255,255,255,.82)');
}
function softAlt00972_(dark){ return dark ? 'rgba(255,255,255,.055)' : 'rgba(248,250,252,.86)'; }
function textForSurface00972_(dark){ return dark ? '#f8fafc' : '#111827'; }
function serifStack00972_(){ return 'Georgia, "Times New Roman", serif'; }
function groteskStack00972_(){ return '"Arial Black", "Helvetica Neue", Arial, sans-serif'; }

function makeContext00972_(pair,family,variant='A'){
  const recipe=getHeaderFooterVisualRecipeByNo00969(pair.no);
  if(!recipe) throw new Error(`00972 visual recipe missing for pair ${pair.no}`);
  const t=pair.theme;
  const ctx={
    pair,t,recipe,family,variant,
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
function nextId00972_(ctx,kind){
  ctx.counters[kind]=(ctx.counters[kind]||0)+1;
  return `hf${ctx.pair.no}_footer_${kind}_${String(ctx.counters[kind]).padStart(3,'0')}`;
}

function node00972_(ctx,type,tag,id,attrs={},style={},children=[]){
  const node={type,tag,...(id?{id}:{}),attrs:{...attrs},style:{...style},styleText:styleText00972_(style),children};
  if(id && ['section','level','container','block'].includes(type)){
    node.attrs['data-node-id']=id;
    node.attrs['data-hf-node-type']=type;
    node.attrs['data-hf-template-id']=ctx.pair.footerTemplateId;
    node.attrs['data-hf-authored-template']=AUTHORED_VERSION_00972;
  }
  if(type==='section'){
    node.attrs['data-hf-json-template']='1';
    node.attrs['data-hf-style-pair-id']=ctx.pair.pairId;
    node.attrs['data-hf-style-pair-no']=ctx.pair.no;
    node.attrs['data-footer-family-id']=ctx.family?.id||'F00';
    node.attrs['data-footer-family-name']=ctx.family?.name||'Stable 00971';
    node.attrs['data-footer-composition-id']=ctx.family?.composition||'stable-00971';
    node.attrs['data-footer-family-variant']=ctx.variant||'A';
  }
  return node;
}
function text00972_(value){ return {type:'text',text:String(value??'')}; }
function editable00972_(ctx,value,className,style={},attrs={}){
  return node00972_(ctx,'element','span','',{class:className,contenteditable:'true',draggable:'true',spellcheck:'false','data-st-text-target':'1',...attrs},style,[text00972_(value)]);
}
function svgClone00972_(raw){ return raw ? clone00972_(raw) : null; }

function iconSvg00972_(kind){
  const common={type:'element',tag:'svg',attrs:{'aria-hidden':'true',fill:'none',stroke:'currentColor','stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',viewbox:'0 0 24 24'},style:{},styleText:'',children:[]};
  const path=(d)=>({type:'element',tag:'path',attrs:{d},style:{},styleText:'',children:[]});
  const circle=(cx,cy,r)=>({type:'element',tag:'circle',attrs:{cx:String(cx),cy:String(cy),r:String(r)},style:{},styleText:'',children:[]});
  if(kind==='phone') common.children=[path('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z')];
  else if(kind==='mail') common.children=[path('M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'),path('m22 6-10 7L2 6')];
  else if(kind==='map') common.children=[path('M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z'),circle('12','10','3')];
  else if(kind==='instagram') common.children=[{type:'element',tag:'rect',attrs:{x:'2',y:'2',width:'20',height:'20',rx:'5',ry:'5'},style:{},styleText:'',children:[]},path('M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'),path('M17.5 6.5h.01')];
  else if(kind==='facebook') common.children=[path('M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z')];
  else if(kind==='youtube') common.children=[path('M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z'),path('m9.75 15.02 5.75-3.27-5.75-3.27z')];
  else if(kind==='arrow') common.children=[path('M5 12h14'),path('m13 6 6 6-6 6')];
  else if(kind==='shield') common.children=[path('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),path('m9 12 2 2 4-4')];
  else if(kind==='spark') common.children=[path('m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z'),path('m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z')];
  return common;
}

function familyWidth00972_(){ return 'min(1320px,calc(100% - 48px))'; }
function rootStyle00972_(ctx,overrides={}){
  return {
    width:'100%','box-sizing':'border-box',padding:'34px 0 0',margin:'0',
    background:ctx.recipe.rootBackground,
    'background-size':ctx.recipe.rootBackgroundSize||'auto',
    'background-position':ctx.recipe.rootBackgroundPosition||'0% 0%',
    'background-repeat':ctx.recipe.rootBackgroundRepeat||'repeat',
    color:ctx.text,border:'0','border-top':ctx.recipe.rootBorder||`1px solid ${ctx.border}`,
    'border-radius':'0','box-shadow':'none',overflow:'visible',position:'relative',isolation:'isolate',
    'font-family':ctx.t.typography.textFont,container:'hf00972-footer / inline-size',
    ...overrides
  };
}
function makeRoot00972_(ctx,children,styleOverrides={}){
  return node00972_(ctx,'section','footer',nextId00972_(ctx,'section'),{class:`st-section hf00972-footer-section hf00972-family-${ctx.family?.id||'F00'}`,'data-sec-role':'footer',role:'contentinfo'},rootStyle00972_(ctx,styleOverrides),children);
}
function level00972_(ctx,name,children,style={},className=''){
  return node00972_(ctx,'level','div',nextId00972_(ctx,'level'),{
    class:`st-row hf00972-level ${className}`.trim(),'data-st-node':'level','data-layout-mode':'fr','data-layout-orient':'row','data-name':name
  },{width:familyWidth00972_(),margin:'0 auto','box-sizing':'border-box',overflow:'visible',...style},children);
}
function container00972_(ctx,name,children,style={},className=''){
  return node00972_(ctx,'container','div',nextId00972_(ctx,'container'),{
    class:`st-block hf00972-container ${className}`.trim(),'data-st-node':'container','data-layout-mode':'flex','data-layout-orient':'column','data-name':name
  },{width:'100%','min-width':'0','max-width':'100%',display:'flex','flex-direction':'column',gap:'12px',background:'transparent',border:'0',overflow:'visible',padding:'0','box-sizing':'border-box',...style},children);
}
function blockText00972_(ctx,value,role='text',style={},className=''){
  return node00972_(ctx,'block','div',nextId00972_(ctx,'block'),{
    class:`hb-elem st-block st-block--text hf00972-text ${role==='heading'?'st-block--heading':''} ${className}`.trim(),
    'data-block-kind':'text','data-block-role':role,'data-name':value,'data-hb-tip':value
  },{width:'100%','min-width':'0','max-width':'100%','min-height':'0',background:'transparent',border:'0',overflow:'visible',padding:'0','box-sizing':'border-box',...style},[
    editable00972_(ctx,value,'st-text-edit hf00972-text__edit',{
      display:'block',width:'100%','max-width':'100%','min-width':'0','min-height':'0',height:'auto',padding:'0',border:'0',
      'line-height':'inherit',color:'inherit','font-size':'inherit','font-weight':'inherit','font-family':'inherit','letter-spacing':'inherit',
      'text-transform':'inherit','text-align':'inherit','white-space':'normal','word-break':'normal','overflow-wrap':'break-word','box-sizing':'border-box'
    })
  ]);
}
function label00972_(ctx,value,color='inherit'){
  return blockText00972_(ctx,value,'eyebrow',{color,opacity:'.78','font-size':'11px','font-weight':'850','line-height':'1.2','letter-spacing':'.12em','text-transform':'uppercase'});
}
function heading00972_(ctx,value,{size='clamp(30px,4vw,58px)',weight='850',font=ctx.t.typography.headingFont,line='1.02',tracking='-.045em',align='left',color='inherit'}={}){
  return blockText00972_(ctx,value,'heading',{color,'font-size':size,'font-weight':weight,'font-family':font,'line-height':line,'letter-spacing':tracking,'text-align':align});
}
function body00972_(ctx,value,{size='14px',weight='600',line='1.6',color='inherit',opacity='.78',align='left',max='680px'}={}){
  return blockText00972_(ctx,value,'text',{color,opacity,'font-size':size,'font-weight':weight,'line-height':line,'text-align':align,'max-width':max});
}
function modernDescription00972_(ctx){
  return `Створюємо зрозумілий цифровий досвід для ${ctx.brand}: головні дії, навігація та контакти без зайвого шуму.`;
}
function splitMenu00972_(items){
  const clean=(items||[]).filter((x)=>Array.isArray(x)&&String(x[0]||'').trim());
  const defaults=[['Про нас','#about'],['Послуги','#services'],['Проєкти','#projects'],['Новини','#news'],['FAQ','#faq'],['Документи','#docs'],['Контакти','#contacts'],['Карта сайту','#sitemap']];
  const all=[...clean,...defaults].slice(0,8);
  return [all.slice(0,4),all.slice(4,8)];
}
function menu00972_(ctx,labelText,items,{showDots=false,textColor=ctx.text,fontSize='14px',fontWeight='700',direction='column',align='flex-start'}={}){
  const list=(items||[]).slice(0,8);
  const lis=list.map(([txt,href])=>node00972_(ctx,'element','li','',{class:'st-menu__item','data-menu-depth':'1'},{width:direction==='row'?'auto':'100%','list-style':'none'},[
    node00972_(ctx,'element','a','',{href:href||'#',class:'st-menu__link st-block st-block--menu-item hf00972-menu__link','data-st-menu-item':'1'},{
      display:'inline-flex','align-items':'center','justify-content':align,gap:'8px',width:direction==='row'?'auto':'100%','min-width':'0','min-height':'30px',
      padding:direction==='row'?'5px 0':'4px 0',background:'transparent',border:'0',color:textColor,'text-decoration':'none',
      'font-size':fontSize,'font-weight':fontWeight,'line-height':'1.25','box-sizing':'border-box'
    },[
      ...(showDots?[node00972_(ctx,'element','span','',{class:'hf00972-menu-dot','aria-hidden':'true'},{width:'6px',height:'6px','border-radius':'999px',background:ctx.accent,opacity:'.82',flex:'0 0 auto'},[])]:[]),
      node00972_(ctx,'element','span','',{class:'st-menu__text'},{'white-space':'normal','word-break':'normal','overflow-wrap':'break-word'},[text00972_(txt)])
    ])
  ]));
  return node00972_(ctx,'block','div',nextId00972_(ctx,'block'),{
    class:'hb-elem st-block st-block--menu hf00972-menu','data-block-kind':'menu','data-name':labelText,'data-hb-tip':labelText,
    'data-st-menu':'1','data-menu-variant':'footer','data-menu-level1-direction':direction,
    'data-menu-items':JSON.stringify(list.map(([text,href])=>({text,href:href||'#',children:[]})))
  },{width:'100%','min-width':'0','max-width':'100%',display:'flex','align-items':'flex-start',background:'transparent',border:'0',overflow:'visible',padding:'0',color:textColor,'box-sizing':'border-box',
    '--st-menu-link-color':textColor,'--st-menu-link-color-h':textColor,'--st-menu-link-fs':fontSize,'--st-menu-link-fw':fontWeight,
    '--st-menu-l1-color':textColor,'--st-menu-l1-h-color':textColor,'--st-menu-l1-o-color':textColor,'--st-menu-l1-c-color':textColor,
    '--st-menu-l1-fs':fontSize,'--st-menu-l1-h-fs':fontSize,'--st-menu-l1-o-fs':fontSize,'--st-menu-l1-c-fs':fontSize,
    '--st-menu-l1-fw':fontWeight,'--st-menu-l1-h-fw':fontWeight,'--st-menu-l1-o-fw':fontWeight,'--st-menu-l1-c-fw':fontWeight},[
      node00972_(ctx,'element','nav','',{'aria-label':labelText,class:'st-menu st-menu--footer'},{width:'100%','max-width':'100%','min-width':'0'},[
        node00972_(ctx,'element','ul','',{class:'st-menu__list','data-menu-list-depth':'1'},{margin:'0',padding:'0',width:'100%',display:'flex','flex-direction':direction,'flex-wrap':direction==='row'?'wrap':'nowrap',gap:direction==='row'?'8px 22px':'3px','align-items':align,'list-style':'none','box-sizing':'border-box'},lis)
      ])
    ]);
}
function button00972_(ctx,labelText,href='#',{secondary=false,shape='pill',square=false,outlined=false}={}){
  const b=ctx.t.buttons;
  const baseBg=secondary?b.secondaryBg:b.primaryBg;
  const baseText=secondary?b.secondaryText:b.primaryText;
  const bg=outlined?'transparent':baseBg;
  const bc=outlined?(secondary?b.secondaryBorderColor:ctx.accent):(secondary?b.secondaryBorderColor:b.primaryBorderColor);
  const radius=shape==='square'?'0':shape==='soft'?ctx.t.radius.md:shape==='round'?'50%':b.radius;
  const svg=svgClone00972_(ctx.recipe.ctaIcon)||iconSvg00972_('arrow');
  svg.style={...(svg.style||{}),width:'17px',height:'17px'}; svg.styleText=styleText00972_(svg.style);
  return node00972_(ctx,'block','div',nextId00972_(ctx,'block'),{
    class:`hb-elem st-block st-block--button hf00972-button ${secondary?'is-secondary':'is-primary'}`,'data-block-kind':'button','data-block-role':'button',
    'data-name':labelText,'data-hb-tip':labelText,'data-button-mode':'text','data-button-text':labelText,'data-button-href':href,'data-button-link-mode':'custom',
    'data-button-click-area':'all','data-button-shape':shape,'data-button-fill-mode':outlined?'outline':'solid','data-button-color1':bg
  },{
    width:square?'48px':'auto','max-width':'100%','min-width':'0','min-height':'46px',display:'inline-flex','align-items':'center','justify-content':'center',gap:'9px',
    padding:square?'10px':`${b.paddingY} ${b.paddingX}`,'border-radius':radius,background:bg,color:outlined?(secondary?ctx.text:ctx.accent):baseText,
    border:`${outlined?'1px':(secondary?b.secondaryBorderWidth:b.primaryBorderWidth)} solid ${bc}`,'box-shadow':outlined?'none':(secondary?'none':b.shadow),
    overflow:'visible',flex:'0 1 auto','box-sizing':'border-box'
  },[
    ...(square?[]:[editable00972_(ctx,labelText,'st-text-edit st-button__label',{'font-size':b.fontSize,'font-weight':b.fontWeight,'line-height':'1.2',color:'inherit','white-space':'normal','text-align':'center',width:'auto','min-height':'0',height:'auto',padding:'0',border:'0'})]),
    node00972_(ctx,'element','span','',{class:'hf00972-button__icon','aria-hidden':'true'},{display:'inline-grid','place-items':'center',width:'18px',height:'18px',flex:'0 0 auto'},[svg])
  ]);
}
function logo00972_(ctx,{large=false,center=false,minimal=false}={}){
  const src=ctx.recipe.logoIconShellStyle||{};
  const icon=svgClone00972_(ctx.recipe.logoIcon)||iconSvg00972_('spark');
  icon.style={...(icon.style||{}),width:large?'26px':'20px',height:large?'26px':'20px'}; icon.styleText=styleText00972_(icon.style);
  const mark=node00972_(ctx,'element','span','',{class:'hf00972-logo-mark','aria-hidden':'true'},{
    width:large?'58px':'44px',height:large?'58px':'44px',display:'inline-grid','place-items':'center','border-radius':minimal?'0':(src['border-radius']||ctx.t.icons.logoRadius),
    background:minimal?'transparent':(src.background||ctx.t.icons.logoBg),color:src.color||ctx.accent,border:minimal?'0':(src.border||`1px solid ${ctx.border}`),
    flex:'0 0 auto','box-sizing':'border-box'
  },[icon]);
  return node00972_(ctx,'block','div',nextId00972_(ctx,'block'),{
    class:'hb-elem st-block st-block--text st-block--logo hf00972-logo','data-block-kind':'text','data-block-role':'logo','data-name':'Лого','data-hb-tip':'Лого',
    'data-logo-mode':'logo-text-subtitle','data-logo-source':'icon','data-logo-pos':'left','data-logo-click-area':'all','data-logo-fit':'contain'
  },{width:'100%','min-width':'0',display:'flex','align-items':'center','justify-content':center?'center':'flex-start',gap:large?'15px':'11px',background:'transparent',border:'0',overflow:'visible',padding:'0',color:'inherit','box-sizing':'border-box'},[
    mark,
    node00972_(ctx,'element','div','',{class:'hf00972-logo-copy'},{display:'flex','flex-direction':'column',gap:'3px','min-width':'0','text-align':center?'center':'left'},[
      editable00972_(ctx,ctx.brand,'st-text-edit st-logo__title',{'font-size':large?'30px':ctx.t.typography.logoTitleSize,'font-weight':large?'900':ctx.t.typography.logoTitleWeight,'line-height':'1.05','letter-spacing':large?'-.04em':ctx.t.typography.logoTitleLetterSpacing,color:'inherit','white-space':'normal','overflow-wrap':'break-word'}),
      editable00972_(ctx,ctx.subtitle,'st-text-edit st-logo__subtitle',{'font-size':'11px','font-weight':'700','line-height':'1.2','letter-spacing':'.10em',color:'inherit',opacity:'.72','text-transform':'uppercase','white-space':'normal','overflow-wrap':'break-word'})
    ])
  ]);
}
function infoLink00972_(ctx,labelText,href,kind,{compact=false,large=false,iconBox=true,textColor='inherit'}={}){
  const svg=iconSvg00972_(kind); svg.style={width:large?'20px':'16px',height:large?'20px':'16px'}; svg.styleText=styleText00972_(svg.style);
  return node00972_(ctx,'block','div',nextId00972_(ctx,'block'),{
    class:'hb-elem st-block st-block--text st-block--link hf00972-info-link','data-block-kind':'text','data-block-role':'link','data-name':labelText,'data-hb-tip':labelText
  },{width:'100%','min-width':'0','max-width':'100%','min-height':compact?'28px':'36px',display:'flex','align-items':'center',background:'transparent',border:'0',overflow:'visible',padding:'0',color:textColor,'box-sizing':'border-box'},[
    node00972_(ctx,'element','a','',{href,class:'st-text-edit hf00972-info-link__a','data-st-text-target':'1',contenteditable:'true',draggable:'true',spellcheck:'false'},{
      display:'flex','flex-direction':'row','flex-wrap':'nowrap','align-items':'center','justify-content':'flex-start',gap:compact?'7px':'10px',width:'100%','min-width':'0','max-width':'100%',
      'min-height':compact?'28px':'36px',height:'auto',padding:'0',border:'0',background:'transparent',color:'inherit',
      'font-size':large?'clamp(20px,2.2vw,34px)':ctx.t.links.fontSize,'font-weight':large?'850':ctx.t.links.fontWeight,'line-height':'1.25',
      'text-decoration':'none','white-space':'normal','word-break':'normal','overflow-wrap':'anywhere','box-sizing':'border-box'
    },[
      ...(iconBox?[node00972_(ctx,'element','span','',{class:'hf00972-mini-icon','aria-hidden':'true'},{
        width:compact?'24px':'32px',height:compact?'24px':'32px',display:'inline-grid','place-items':'center','border-radius':compact?'7px':ctx.t.radius.md,
        background:softAlt00972_(ctx.dark),color:ctx.accent,border:`1px solid ${ctx.border}`,flex:'0 0 auto'
      },[svg])]:[]),
      text00972_(labelText)
    ])
  ]);
}
function socialIcons00972_(ctx,{center=false,square=false}={}){
  const one=(labelText,kind)=> {
    const svg=iconSvg00972_(kind); svg.style={width:'18px',height:'18px'}; svg.styleText=styleText00972_(svg.style);
    return node00972_(ctx,'element','a','',{href:`#${kind}`,class:'hf00972-social','aria-label':labelText,title:labelText},{
      width:'40px',height:'40px',display:'inline-grid','place-items':'center','border-radius':square?'0':ctx.t.icons.radius,background:softAlt00972_(ctx.dark),
      color:ctx.text,border:`1px solid ${ctx.border}`,'text-decoration':'none','box-sizing':'border-box'
    },[svg]);
  };
  return container00972_(ctx,'Соцмережі',[one('Instagram','instagram'),one('Facebook','facebook'),one('YouTube','youtube')],{
    display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'center','justify-content':center?'center':'flex-start',gap:'8px'
  },'hf00972-socials');
}
function socialText00972_(ctx,{center=false}={}){
  const items=[['Instagram','#instagram'],['LinkedIn','#linkedin'],['YouTube','#youtube']];
  return menu00972_(ctx,'Соцмережі',items,{direction:'row',align:center?'center':'flex-start',fontSize:'12px',fontWeight:'800'});
}
function legal00972_(ctx,{direction='row',textColor='inherit',borderTop=false,compact=true}={}){
  return container00972_(ctx,'Юридичні посилання',[
    infoLink00972_(ctx,'Конфіденційність','#privacy','shield',{compact,iconBox:false,textColor}),
    infoLink00972_(ctx,'Умови','#terms','shield',{compact,iconBox:false,textColor})
  ],{
    display:'flex','flex-direction':direction,'flex-wrap':'wrap','align-items':direction==='row'?'center':'stretch','justify-content':'flex-start',
    gap:direction==='row'?'6px 18px':'2px',padding:borderTop?'10px 0 0':'0',border:borderTop?'0':'0','border-top':borderTop?`1px solid ${ctx.border}`:'0'
  },'hf00972-legal');
}
function contactCard00972_(ctx,{surface=true,legalInside=true,title='Контакти',largePhone=false,compact=false,style={}}={}){
  const children=[
    label00972_(ctx,title),
    infoLink00972_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{large:largePhone,compact}),
    infoLink00972_(ctx,'hello@example.com','mailto:hello@example.com','mail',{compact}),
    infoLink00972_(ctx,'Україна','#contacts','map',{compact}),
    ...(legalInside?[legal00972_(ctx,{direction:'column',borderTop:true,compact:true})]:[])
  ];
  return container00972_(ctx,'Контакти',children,{
    padding:surface?'20px':'0',background:surface?alphaSurface00972_(ctx.dark):'transparent',color:ctx.text,
    border:surface?`1px solid ${ctx.border}`:'0','border-radius':surface?ctx.t.radius.lg:'0','box-shadow':'none',gap:compact?'7px':'10px',...style
  },'hf00972-contact');
}
function navCard00972_(ctx,titleText,items,{surface=true,style={},showDots=false}={}){
  return container00972_(ctx,titleText,[
    label00972_(ctx,titleText),
    menu00972_(ctx,titleText,items,{showDots,textColor:ctx.text})
  ],{
    padding:surface?'20px':'0',background:surface?softAlt00972_(ctx.dark):'transparent',color:ctx.text,
    border:surface?`1px solid ${ctx.border}`:'0','border-radius':surface?ctx.t.radius.lg:'0',gap:'12px',...style
  });
}
function copyright00972_(ctx,{center=false,textColor='inherit'}={}){
  return body00972_(ctx,`© 2026 ${ctx.brand}. Усі права захищені.`,{size:'12px',weight:'650',line:'1.4',color:textColor,opacity:'.68',align:center?'center':'left',max:'100%'});
}
function newsletter00972_(ctx,{darkSurface=false,buttonLabel='Підписатися'}={}){
  const fg=darkSurface?'#f8fafc':ctx.text;
  return container00972_(ctx,'Підписка',[
    label00972_(ctx,'Newsletter',fg),
    heading00972_(ctx,'Новини без зайвого шуму',{size:'clamp(26px,3vw,42px)',weight:'850',color:fg}),
    body00972_(ctx,'Один короткий лист із новими матеріалами та головними оновленнями.',{color:fg,opacity:'.76'}),
    container00972_(ctx,'Форма підписки',[
      node00972_(ctx,'block','div',nextId00972_(ctx,'block'),{'data-block-kind':'text','data-block-role':'input','data-name':'Email','data-hb-tip':'Email',class:'hb-elem st-block hf00972-newsletter-input'},{
        flex:'1 1 260px','min-width':'0','min-height':'46px',display:'flex','align-items':'center',padding:'11px 14px','border-radius':ctx.t.radius.md,
        background:darkSurface?'rgba(255,255,255,.08)':'rgba(255,255,255,.90)',color:fg,border:`1px solid ${darkSurface?'rgba(255,255,255,.18)':ctx.border}`,'box-sizing':'border-box'
      },[editable00972_(ctx,'email@example.com','st-text-edit',{'font-size':'14px','font-weight':'650',color:'inherit',opacity:'.74','white-space':'normal','overflow-wrap':'anywhere'})]),
      button00972_(ctx,buttonLabel,'#subscribe',{shape:'soft'})
    ],{display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'stretch',gap:'8px'})
  ],{gap:'12px'});
}
function imageFigure00972_(ctx,src,alt='Visual'){
  return node00972_(ctx,'container','figure',nextId00972_(ctx,'container'),{
    class:'st-block hf00972-media','data-st-node':'container','data-layout-mode':'flex','data-layout-orient':'column','data-name':'Зображення'
  },{width:'100%','min-width':'0','max-width':'100%','min-height':'300px',margin:'0',padding:'0',overflow:'hidden','border-radius':ctx.t.radius.lg,border:`1px solid ${ctx.border}`,'box-sizing':'border-box'},[
    node00972_(ctx,'element','img','',{src,alt,loading:'lazy',draggable:'false'},{
      display:'block',width:'100%',height:'100%','min-height':'300px','object-fit':'cover','object-position':'center','box-sizing':'border-box'
    },[])
  ]);
}
function abstractSvg00972_(ctx){
  return node00972_(ctx,'element','svg','',{'aria-hidden':'true',viewbox:'0 0 400 220',fill:'none'},{
    width:'100%',height:'100%','min-height':'180px',display:'block'
  },[
    {type:'element',tag:'circle',attrs:{cx:'308',cy:'70',r:'54',fill:'currentColor','fill-opacity':'.16'},style:{},styleText:'',children:[]},
    {type:'element',tag:'circle',attrs:{cx:'250',cy:'150',r:'32',stroke:'currentColor','stroke-width':'3'},style:{},styleText:'',children:[]},
    {type:'element',tag:'path',attrs:{d:'M12 192 188 26l92 92 108-86',stroke:'currentColor','stroke-width':'3'},style:{},styleText:'',children:[]},
    {type:'element',tag:'path',attrs:{d:'M34 34h112v112H34z',stroke:'currentColor','stroke-width':'2','stroke-dasharray':'8 8'},style:{},styleText:'',children:[]}
  ]);
}
function finishModel00972_(ctx,root,sourcePolicy='FOOTER_FAMILY_CANONICAL_MODEL_00972'){
  return {
    version:MODEL_VERSION_00972,schema:'section-level-container-block-dom-v1',scope:'footer',templateId:ctx.pair.footerTemplateId,
    sourcePolicy,renderPolicy:'DOM is rendered from this canonical model; no runtime normalizer/adapter/repair.',
    footerFamilyId:ctx.family?.id||'F00',footerFamilyName:ctx.family?.name||'Stable 00971',footerCompositionId:ctx.family?.composition||'stable-00971',
    root
  };
}

function baseColumns00972_(ctx,{surface=false}={}){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  return [
    container00972_(ctx,'Бренд',[logo00972_(ctx),body00972_(ctx,modernDescription00972_(ctx),{size:'13px'}),socialIcons00972_(ctx)],surface?{
      padding:'20px',background:alphaSurface00972_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':ctx.t.radius.lg
    }:{}),
    navCard00972_(ctx,'Навігація',menuA,{surface}),
    navCard00972_(ctx,'Інформація',menuB,{surface}),
    contactCard00972_(ctx,{surface,legalInside:true})
  ];
}

// F01 — Classic Corporate
function buildClassicCorporate00972_(ctx){
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Classic Corporate',baseColumns00972_(ctx,{surface:false}),{
      display:'grid','grid-template-columns':'minmax(260px,1.35fr) repeat(3,minmax(160px,.8fr))',gap:'28px',padding:'34px 0 28px','border-bottom':`1px solid ${ctx.border}`
    },'hf00972-grid hf00972-grid-4'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx),legal00972_(ctx,{direction:'row'})],{
      display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'20px',padding:'18px 0 24px'
    },'hf00972-bottom-row')
  ],{padding:'0'});
  return finishModel00972_(ctx,root);
}

// F02 — Big CTA Top
function buildBigCtaTop00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const ctaSurface=ctx.recipe.featureBackground||ctx.primary;
  const ctaColor=ctx.recipe.featureColor||ctx.t.colors.onPrimary;
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Big CTA',[
      container00972_(ctx,'CTA текст',[
        label00972_(ctx,'Start here',ctaColor),
        heading00972_(ctx,`Готові рухатися далі з ${ctx.brand}?`,{size:'clamp(34px,5vw,68px)',weight:'900',color:ctaColor}),
        body00972_(ctx,modernDescription00972_(ctx),{size:'15px',color:ctaColor,opacity:'.90'})
      ],{gap:'12px'}),
      container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'soft'}),button00972_(ctx,'Контакти','#contacts',{secondary:true,outlined:true,shape:'soft'})],{
        display:'flex','flex-direction':'row','flex-wrap':'wrap','justify-content':'flex-end','align-items':'center',gap:'10px'
      })
    ],{display:'grid','grid-template-columns':'minmax(0,1.4fr) auto','align-items':'end',gap:'28px',padding:'42px',background:ctaSurface,color:ctaColor,'border-radius':ctx.t.radius.lg,'box-shadow':ctx.t.shadow.md},'hf00972-cta-row hf00972-feature-panel'),
    level00972_(ctx,'Supporting',[container00972_(ctx,'Бренд',[logo00972_(ctx),socialText00972_(ctx)],{}),navCard00972_(ctx,'Навігація',menuA,{surface:false}),navCard00972_(ctx,'Інформація',menuB,{surface:false}),contactCard00972_(ctx,{surface:false,legalInside:true})],{
      display:'grid','grid-template-columns':'1.2fr .8fr .8fr 1fr',gap:'26px',padding:'30px 0 18px'
    },'hf00972-grid hf00972-grid-4'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'15px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00972-bottom-row')
  ]);
  return finishModel00972_(ctx,root);
}

// F03 — Split 40 / 60
function buildSplit406000972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const reverse=ctx.variant==='B';
  const left=container00972_(ctx,'Brand Rail',[
    label00972_(ctx,reverse?'Studio / 25':'Independent / 03'),
    logo00972_(ctx,{large:true}),
    heading00972_(ctx,ctx.brand,{size:'clamp(42px,6vw,82px)',weight:'900'}),
    body00972_(ctx,modernDescription00972_(ctx),{size:'15px'}),
    socialText00972_(ctx)
  ],{padding:'34px',background:alphaSurface00972_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':ctx.t.radius.lg,gap:'18px'});
  const right=container00972_(ctx,'Content',[
    container00972_(ctx,'Navigation Row',[navCard00972_(ctx,'Навігація',menuA,{surface:false}),navCard00972_(ctx,'Інформація',menuB,{surface:false})],{
      display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'24px'
    },'hf00972-grid hf00972-grid-2'),
    contactCard00972_(ctx,{surface:true,legalInside:true,style:{'border-radius':ctx.t.radius.md}}),
    container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'soft'}),button00972_(ctx,'Написати','#contacts',{secondary:true,outlined:true,shape:'soft'})],{
      display:'flex','flex-direction':'row','flex-wrap':'wrap',gap:'8px'
    })
  ],{gap:'22px',padding:'18px 0'});
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Split 40 / 60',reverse?[right,left]:[left,right],{
      display:'grid','grid-template-columns':reverse?'minmax(0,1.55fr) minmax(300px,.85fr)':'minmax(300px,.85fr) minmax(0,1.55fr)',gap:'24px',padding:'20px 0 28px'
    },'hf00972-split'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'16px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00972-bottom-row')
  ]);
  return finishModel00972_(ctx,root);
}

// F04 — Centered Premium
function buildCenteredPremium00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const merged=[...menuA,...menuB].slice(0,6);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Centered Premium',[
      container00972_(ctx,'Centered Brand',[
        logo00972_(ctx,{large:true,center:true,minimal:true}),
        heading00972_(ctx,ctx.brand,{size:'clamp(38px,5.6vw,74px)',font:serifStack00972_(),weight:'700',tracking:'-.035em',align:'center'}),
        body00972_(ctx,'Точність у деталях, спокійна типографіка та простір навколо головного.',{size:'15px',align:'center',max:'720px'}),
        menu00972_(ctx,'Навігація',merged,{direction:'row',align:'center',fontSize:'13px',fontWeight:'750'}),
        container00972_(ctx,'Контакти',[
          infoLink00972_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{compact:true,iconBox:false}),
          infoLink00972_(ctx,'hello@example.com','mailto:hello@example.com','mail',{compact:true,iconBox:false}),
          infoLink00972_(ctx,'Україна','#contacts','map',{compact:true,iconBox:false})
        ],{display:'grid','grid-template-columns':'repeat(3,minmax(0,auto))','justify-content':'center',gap:'8px 24px'},'hf00972-inline-contact hf00972-contact'),
        socialIcons00972_(ctx,{center:true}),
        container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'soft'})],{display:'flex','align-items':'center'})
      ],{'align-items':'center',gap:'22px',padding:'54px 0 42px'})
    ],{display:'block','text-align':'center'}),
    level00972_(ctx,'Bottom',[copyright00972_(ctx,{center:true}),legal00972_(ctx,{direction:'row'})],{
      display:'flex','flex-direction':'column','align-items':'center',gap:'8px',padding:'18px 0 26px','border-top':`1px solid ${ctx.border}`
    },'hf00972-bottom-row')
  ],{padding:'0'});
  return finishModel00972_(ctx,root);
}

// F05 — Card Grid
function buildCardGrid00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const card={padding:'24px',border:`1px solid ${ctx.border}`,'border-radius':ctx.variant==='B'?'8px':'24px',background:alphaSurface00972_(ctx.dark),gap:'14px'};
  const brand=container00972_(ctx,'Brand Card',[logo00972_(ctx,{large:true}),heading00972_(ctx,'Створюємо простір для наступної дії',{size:'clamp(28px,3.5vw,46px)'}),body00972_(ctx,modernDescription00972_(ctx))],{...card,'grid-column':'span 2'});
  const contact=contactCard00972_(ctx,{surface:false,legalInside:true,style:{...card}});
  const menu=container00972_(ctx,'Menu Card',[label00972_(ctx,'Menu'),menu00972_(ctx,'Навігація',menuA,{showDots:true})],card);
  const cta=container00972_(ctx,'CTA Card',[label00972_(ctx,'Next step'),heading00972_(ctx,ctx.cta,{size:'clamp(26px,3vw,42px)'}),button00972_(ctx,'Відкрити','#',{shape:'soft'})],{...card,background:ctx.recipe.featureBackground||ctx.primary,color:ctx.recipe.featureColor||ctx.t.colors.onPrimary,'grid-column':'span 2'});
  const info=container00972_(ctx,'Info Card',[label00972_(ctx,'Info'),menu00972_(ctx,'Інформація',menuB)],card);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Card Grid',[brand,contact,menu,info,cta],{
      display:'grid','grid-template-columns':'repeat(4,minmax(0,1fr))',gap:'14px',padding:'18px 0 20px'
    },'hf00972-card-grid'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'16px 0 24px'},'hf00972-bottom-row')
  ]);
  return finishModel00972_(ctx,root);
}

// F06 — Bento
function buildBento00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const bento={padding:'22px',background:alphaSurface00972_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':ctx.variant==='B'?'14px':'28px'};
  const brand=container00972_(ctx,'Bento Brand',[logo00972_(ctx,{large:true}),heading00972_(ctx,ctx.variant==='B'?'Build. Launch. Improve.':'Один бренд — один зрозумілий шлях.',{size:'clamp(32px,4vw,54px)'}),body00972_(ctx,modernDescription00972_(ctx)),socialText00972_(ctx)],{...bento,'grid-row':'span 2',gap:'16px'});
  const phone=container00972_(ctx,'Контакти',[label00972_(ctx,'Call us'),infoLink00972_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{large:true,iconBox:false})],bento,'hf00972-contact');
  const social=container00972_(ctx,'Social',[label00972_(ctx,'Social'),socialIcons00972_(ctx,{square:ctx.variant==='B'})],bento);
  const menu=container00972_(ctx,'Navigation',[label00972_(ctx,'Explore'),menu00972_(ctx,'Навігація',menuA,{showDots:true})],bento);
  const final=ctx.variant==='B'
    ? newsletter00972_(ctx)
    : container00972_(ctx,'Information',[label00972_(ctx,'Information'),menu00972_(ctx,'Інформація',menuB),legal00972_(ctx,{direction:'column',borderTop:true})],bento);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Bento',[brand,phone,social,menu,final],{
      display:'grid','grid-template-columns':ctx.variant==='B'?'1.15fr .85fr 1fr':'1.2fr .8fr .8fr','grid-auto-rows':'minmax(150px,auto)',gap:'14px',padding:'18px 0 22px'
    },'hf00972-bento'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'14px 0 24px'},'hf00972-bottom-row')
  ]);
  return finishModel00972_(ctx,root);
}

// F07 — Editorial
function buildEditorial00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Editorial Heading',[
      container00972_(ctx,'Editorial Lead',[
        label00972_(ctx,'Edition 2026'),
        heading00972_(ctx,'Ideas that move from page to product.',{size:'clamp(42px,7vw,94px)',font:serifStack00972_(),weight:'600',line:'.96',tracking:'-.055em'}),
        body00972_(ctx,'Побудовано навколо типографіки, ритму колонок і тонких ліній — без набору однакових карток.',{size:'16px',max:'760px'})
      ],{gap:'18px',padding:'30px 0'})
    ],{'border-top':`1px solid ${ctx.border}`,'border-bottom':`1px solid ${ctx.border}`}),
    level00972_(ctx,'Editorial Columns',[
      navCard00972_(ctx,'Index',menuA,{surface:false}),
      navCard00972_(ctx,'Archive',menuB,{surface:false}),
      contactCard00972_(ctx,{surface:false,legalInside:false}),
      container00972_(ctx,'About',[label00972_(ctx,'About'),body00972_(ctx,modernDescription00972_(ctx),{size:'13px'}),socialText00972_(ctx)],{})
    ],{display:'grid','grid-template-columns':'repeat(4,minmax(0,1fr))',gap:'30px',padding:'28px 0'},'hf00972-grid hf00972-grid-4'),
    level00972_(ctx,'Editorial Bottom',[copyright00972_(ctx),legal00972_(ctx,{direction:'row'})],{
      display:'grid','grid-template-columns':'1fr auto',gap:'20px',padding:'18px 0 26px','border-top':`1px solid ${ctx.border}`
    },'hf00972-bottom-row')
  ],{padding:'0'});
  return finishModel00972_(ctx,root);
}

// F08 — Image Split
function buildImageSplit00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Image Split',[
      imageFigure00972_(ctx,'assets/system/backgrounds/business/bg-021.jpg','Abstract business background'),
      container00972_(ctx,'Image Split Content',[
        logo00972_(ctx),
        heading00972_(ctx,'Візуальна пауза перед останньою дією.',{size:'clamp(32px,4vw,54px)'}),
        body00972_(ctx,modernDescription00972_(ctx),{size:'15px'}),
        container00972_(ctx,'Split Navigation',[navCard00972_(ctx,'Навігація',menuA,{surface:false}),navCard00972_(ctx,'Інформація',menuB,{surface:false})],{
          display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'18px'
        },'hf00972-grid hf00972-grid-2'),
        contactCard00972_(ctx,{surface:false,legalInside:true,compact:true}),
        container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'soft'})],{display:'flex','flex-direction':'row','flex-wrap':'wrap'})
      ],{padding:'26px 10px 26px 18px',gap:'18px'})
    ],{display:'grid','grid-template-columns':'minmax(300px,.85fr) minmax(0,1.35fr)',gap:'26px',padding:'18px 0 22px'},'hf00972-image-split'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00972-bottom-row')
  ]);
  return finishModel00972_(ctx,root);
}

// F09 — Full Image Background
function buildFullImageBackground00972_(ctx){
  const localText='#f8fafc';
  ctx.text=localText;
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Image Overlay',[
      container00972_(ctx,'Image Lead',[
        label00972_(ctx,'A clear final frame',localText),
        heading00972_(ctx,'Завершуйте сторінку сильною, але читабельною сценою.',{size:'clamp(36px,5vw,70px)',weight:'900',color:localText}),
        body00972_(ctx,modernDescription00972_(ctx),{size:'15px',color:localText,opacity:'.90'}),
        container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'soft'}),button00972_(ctx,'Контакти','#contacts',{secondary:true,outlined:true,shape:'soft'})],{
          display:'flex','flex-direction':'row','flex-wrap':'wrap',gap:'9px'
        })
      ],{padding:'30px',background:'rgba(2,6,23,.70)',color:localText,border:'1px solid rgba(255,255,255,.16)','border-radius':'18px','backdrop-filter':'blur(8px)',gap:'14px'}),
      container00972_(ctx,'Image Links',[
        navCard00972_(ctx,'Навігація',menuA,{surface:false}),
        navCard00972_(ctx,'Інформація',menuB,{surface:false}),
        contactCard00972_(ctx,{surface:false,legalInside:true,compact:true})
      ],{padding:'24px',background:'rgba(2,6,23,.70)',color:localText,border:'1px solid rgba(255,255,255,.16)','border-radius':'18px','backdrop-filter':'blur(8px)',gap:'18px'})
    ],{display:'grid','grid-template-columns':'minmax(0,1.35fr) minmax(290px,.65fr)',gap:'18px',padding:'52px 0 28px'},'hf00972-image-overlay'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx,{textColor:localText})],{padding:'16px 0 24px','border-top':'1px solid rgba(255,255,255,.18)'},'hf00972-bottom-row')
  ],{
    background:"linear-gradient(90deg,rgba(2,6,23,.92),rgba(2,6,23,.64)),url('assets/system/backgrounds/business/bg-008.jpg') center/cover no-repeat",
    'background-size':'cover','background-position':'center','background-repeat':'no-repeat',
    color:localText,'border-top':'0'
  });
  return finishModel00972_(ctx,root);
}

// F10 — Glass Future
function buildGlassFuture00972_(ctx){
  const reverse=ctx.variant==='B';
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const glass={background:'rgba(15,23,42,.48)',color:'#f8fafc',border:'1px solid rgba(255,255,255,.14)','border-radius':reverse?'12px':'24px','backdrop-filter':'blur(18px)','box-shadow':'0 24px 70px rgba(2,6,23,.24)'};
  ctx.text='#f8fafc';
  const brand=container00972_(ctx,'Glass Brand',[logo00972_(ctx,{large:true}),heading00972_(ctx,reverse?'Build the next interface.':'Design systems for the next screen.',{size:'clamp(32px,4.2vw,58px)',color:'#f8fafc'}),body00972_(ctx,modernDescription00972_(ctx),{color:'#f8fafc',opacity:'.78'}),socialIcons00972_(ctx)],{...glass,padding:'28px',gap:'16px'});
  const links=container00972_(ctx,'Glass Links',[navCard00972_(ctx,'Навігація',menuA,{surface:false}),navCard00972_(ctx,'Інформація',menuB,{surface:false}),contactCard00972_(ctx,{surface:false,legalInside:true,compact:true})],{...glass,padding:'24px',display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'20px'});
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Glass Future',reverse?[links,brand]:[brand,links],{
      display:'grid','grid-template-columns':reverse?'1.3fr .9fr':'.9fr 1.3fr',gap:'16px',padding:'26px 0 18px'
    },'hf00972-glass-grid'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx,{textColor:'#f8fafc'})],{padding:'15px 0 24px'},'hf00972-bottom-row')
  ],{
    background:"radial-gradient(circle at 15% 20%,rgba(34,211,238,.25),transparent 30%),radial-gradient(circle at 85% 70%,rgba(124,58,237,.30),transparent 35%),linear-gradient(135deg,#020617,#0f172a 60%,#111827)",
    color:'#f8fafc','border-top':'1px solid rgba(255,255,255,.10)'
  });
  return finishModel00972_(ctx,root);
}

// F11 — Minimal Line
function buildMinimalLine00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Minimal Brand',[logo00972_(ctx,{minimal:true}),heading00972_(ctx,'Less surface. More structure.',{size:'clamp(34px,4.8vw,64px)'})],{
      display:'grid','grid-template-columns':'minmax(220px,.55fr) minmax(0,1.45fr)','align-items':'end',gap:'28px',padding:'26px 0 22px','border-bottom':`1px solid ${ctx.border}`
    },'hf00972-minimal-head'),
    level00972_(ctx,'Minimal Columns',[navCard00972_(ctx,'Menu',menuA,{surface:false}),navCard00972_(ctx,'Services',menuB,{surface:false}),contactCard00972_(ctx,{surface:false,legalInside:false}),container00972_(ctx,'Social',[label00972_(ctx,'Social'),socialText00972_(ctx)],{})],{
      display:'grid','grid-template-columns':'repeat(4,minmax(0,1fr))',gap:'26px',padding:'24px 0'
    },'hf00972-grid hf00972-grid-4'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx),legal00972_(ctx,{direction:'row'})],{
      display:'grid','grid-template-columns':'1fr auto',gap:'18px',padding:'16px 0 24px','border-top':`1px solid ${ctx.border}`
    },'hf00972-bottom-row')
  ],{padding:'0'});
  return finishModel00972_(ctx,root);
}

// F12 — Contact First
function buildContactFirst00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Contact First',[
      container00972_(ctx,'Контакти',[
        label00972_(ctx,'Let’s talk'),
        heading00972_(ctx,'Телефонуйте нам',{size:'clamp(32px,4vw,52px)'}),
        infoLink00972_(ctx,'+38 (000) 000-00-00','tel:+380000000000','phone',{large:true,iconBox:false}),
        infoLink00972_(ctx,'hello@example.com','mailto:hello@example.com','mail',{iconBox:false}),
        body00972_(ctx,'Україна · Пн–Пт 09:00–18:00',{size:'13px'}),
        container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'soft'}),button00972_(ctx,'Написати','#contacts',{secondary:true,outlined:true,shape:'soft'})],{display:'flex','flex-direction':'row','flex-wrap':'wrap',gap:'8px'})
      ],{padding:'32px',background:ctx.recipe.featureBackground||ctx.primary,color:ctx.recipe.featureColor||ctx.t.colors.onPrimary,'border-radius':ctx.t.radius.lg,gap:'13px'},'hf00972-contact'),
      container00972_(ctx,'Secondary',[
        logo00972_(ctx),
        container00972_(ctx,'Navigation',[navCard00972_(ctx,'Навігація',menuA,{surface:false}),navCard00972_(ctx,'Інформація',menuB,{surface:false})],{
          display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'18px'
        },'hf00972-grid hf00972-grid-2'),
        socialText00972_(ctx),
        legal00972_(ctx,{direction:'row',borderTop:true})
      ],{padding:'18px 0 10px',gap:'20px'})
    ],{display:'grid','grid-template-columns':'minmax(0,1.1fr) minmax(320px,.9fr)',gap:'28px',padding:'18px 0 24px'},'hf00972-contact-first'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'14px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00972-bottom-row')
  ]);
  return finishModel00972_(ctx,root);
}

// F13 — Newsletter First
function buildNewsletterFirst00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Newsletter Lead',[
      newsletter00972_(ctx),
      container00972_(ctx,'Newsletter Aside',[label00972_(ctx,'Direct contact'),infoLink00972_(ctx,'hello@example.com','mailto:hello@example.com','mail',{large:true,iconBox:false}),body00972_(ctx,'Запитання, партнерство або новий проєкт — напишіть напряму.',{size:'13px'})],{padding:'24px',background:alphaSurface00972_(ctx.dark),border:`1px solid ${ctx.border}`,'border-radius':ctx.t.radius.lg,gap:'12px'})
    ],{display:'grid','grid-template-columns':'minmax(0,1.4fr) minmax(280px,.6fr)',gap:'18px',padding:'22px 0 28px','border-bottom':`1px solid ${ctx.border}`},'hf00972-newsletter-lead'),
    level00972_(ctx,'Supporting',[container00972_(ctx,'Бренд',[logo00972_(ctx),socialText00972_(ctx)],{}),navCard00972_(ctx,'Навігація',menuA,{surface:false}),navCard00972_(ctx,'Інформація',menuB,{surface:false}),contactCard00972_(ctx,{surface:false,legalInside:true,compact:true})],{
      display:'grid','grid-template-columns':'1.1fr .8fr .8fr 1fr',gap:'24px',padding:'26px 0 18px'
    },'hf00972-grid hf00972-grid-4'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'14px 0 24px'},'hf00972-bottom-row')
  ],{padding:'0'});
  return finishModel00972_(ctx,root);
}

// F14 — Mega Footer
function buildMegaFooter00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const groups=[
    ['Каталог',menuA],['Покупцям',menuB],['Компанія',[['Про нас','#about'],['Карʼєра','#career'],['Новини','#news']]],
    ['Допомога',[['FAQ','#faq'],['Доставка','#delivery'],['Підтримка','#support']]],['Бізнес',[['Партнерам','#partners'],['Документи','#docs'],['B2B','#b2b']]]
  ];
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Mega Brand',[container00972_(ctx,'Mega Brand',[logo00972_(ctx,{large:true}),heading00972_(ctx,'Усе важливе — в одному зрозумілому фіналі сторінки.',{size:'clamp(30px,4vw,52px)'}),body00972_(ctx,modernDescription00972_(ctx),{size:'14px'})],{gap:'14px'}),container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'soft'})],{display:'flex','align-items':'flex-end'})],{
      display:'grid','grid-template-columns':'1fr auto','align-items':'end',gap:'26px',padding:'22px 0 24px','border-bottom':`1px solid ${ctx.border}`
    },'hf00972-mega-head'),
    level00972_(ctx,'Mega Navigation',[
      ...groups.map(([name,items])=>navCard00972_(ctx,name,items,{surface:false})),
      contactCard00972_(ctx,{surface:false,legalInside:true,compact:true})
    ],{display:'grid','grid-template-columns':'repeat(6,minmax(0,1fr))',gap:'22px',padding:'28px 0 20px'},'hf00972-mega-grid'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx),socialText00972_(ctx)],{
      display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'18px',padding:'16px 0 24px','border-top':`1px solid ${ctx.border}`
    },'hf00972-bottom-row')
  ],{padding:'0'});
  return finishModel00972_(ctx,root);
}

// F15 — Art Direction
function buildArtDirection00972_(ctx){
  const [menuA]=splitMenu00972_(ctx.recipe.menuItems);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Art Direction',[
      container00972_(ctx,'Art Lead',[
        label00972_(ctx,'No. 15 / Direction'),
        heading00972_(ctx,'15',{size:'clamp(86px,12vw,170px)',font:groteskStack00972_(),weight:'900',line:'.78',tracking:'-.08em'}),
        heading00972_(ctx,'Make the ending part of the composition.',{size:'clamp(32px,4.4vw,62px)',weight:'900'}),
        body00972_(ctx,modernDescription00972_(ctx),{size:'14px'})
      ],{gap:'12px'}),
      container00972_(ctx,'Art Graphic',[abstractSvg00972_(ctx)],{color:ctx.accent,'align-items':'stretch','justify-content':'center'}),
      container00972_(ctx,'Art Utility',[navCard00972_(ctx,'Index',menuA,{surface:false}),contactCard00972_(ctx,{surface:false,legalInside:true,compact:true}),socialText00972_(ctx)],{
        padding:'22px','border-left':`2px solid ${ctx.accent}`,gap:'18px'
      })
    ],{display:'grid','grid-template-columns':'minmax(0,1.2fr) minmax(220px,.7fr) minmax(260px,.7fr)',gap:'24px',padding:'28px 0 26px'},'hf00972-art-grid'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'15px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00972-bottom-row')
  ]);
  return finishModel00972_(ctx,root);
}

// F16 — Floating CTA
function buildFloatingCta00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const compact=ctx.variant==='B';
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Floating CTA',[
      container00972_(ctx,'CTA текст',[label00972_(ctx,'Next step'),heading00972_(ctx,compact?'Почнемо з одного повідомлення.':`Готові зробити наступний крок з ${ctx.brand}?`,{size:compact?'clamp(26px,3.4vw,44px)':'clamp(30px,4vw,52px)'}),body00972_(ctx,modernDescription00972_(ctx),{size:'14px'})],{gap:'10px'}),
      container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'soft'}),button00972_(ctx,'Контакти','#contacts',{secondary:true,outlined:true,shape:'soft'})],{display:'flex','flex-direction':'row','flex-wrap':'wrap','justify-content':'flex-end',gap:'8px'})
    ],{display:'grid','grid-template-columns':'minmax(0,1.25fr) auto','align-items':'center',gap:'24px',padding:compact?'24px 28px':'30px 34px',background:alphaSurface00972_(ctx.dark,true),border:`1px solid ${ctx.border}`,'border-radius':compact?'16px':'28px','box-shadow':ctx.t.shadow.md,position:'relative','z-index':'2','margin-bottom':'-34px'},'hf00972-cta-row hf00972-floating-cta'),
    level00972_(ctx,'Main Footer',[container00972_(ctx,'Бренд',[logo00972_(ctx),socialIcons00972_(ctx)],{}),navCard00972_(ctx,'Навігація',menuA,{surface:false}),navCard00972_(ctx,'Інформація',menuB,{surface:false}),contactCard00972_(ctx,{surface:false,legalInside:true,compact:true})],{
      display:'grid','grid-template-columns':'1.15fr .8fr .8fr 1fr',gap:'24px',padding:'74px 0 24px'
    },'hf00972-grid hf00972-grid-4'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'15px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00972-bottom-row')
  ]);
  return finishModel00972_(ctx,root);
}

// F17 — Stacked Panels
function buildStackedPanels00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const layer=(name,children,bg)=>level00972_(ctx,name,children,{display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'24px',padding:'24px 28px',background:bg,border:`1px solid ${ctx.border}`,'border-radius':ctx.t.radius.md,margin:'0 auto 10px'},'hf00972-stacked-layer');
  const root=makeRoot00972_(ctx,[
    layer('Layer CTA',[container00972_(ctx,'CTA текст',[label00972_(ctx,'Layer 01'),heading00972_(ctx,'Завершення сторінки теж має ієрархію.',{size:'clamp(28px,3.6vw,48px)'})],{}),container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'soft'})],{display:'flex','align-items':'flex-end','justify-content':'flex-end'})],ctx.recipe.featureBackground||alphaSurface00972_(ctx.dark,true)),
    layer('Layer Brand + Contact',[container00972_(ctx,'Бренд',[logo00972_(ctx),body00972_(ctx,modernDescription00972_(ctx),{size:'13px'})],{}),contactCard00972_(ctx,{surface:false,legalInside:false,compact:true})],alphaSurface00972_(ctx.dark)),
    layer('Layer Navigation',[navCard00972_(ctx,'Навігація',menuA,{surface:false}),navCard00972_(ctx,'Інформація',menuB,{surface:false})],softAlt00972_(ctx.dark)),
    level00972_(ctx,'Layer Legal',[copyright00972_(ctx),legal00972_(ctx,{direction:'row'})],{display:'grid','grid-template-columns':'1fr auto',gap:'18px',padding:'16px 0 24px'},'hf00972-bottom-row')
  ],{padding:'18px 0 0'});
  return finishModel00972_(ctx,root);
}

// F18 — Dark Cinematic
function buildDarkCinematic00972_(ctx){
  ctx.text='#f8fafc';
  const [menuA]=splitMenu00972_(ctx.recipe.menuItems);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Cinematic',[
      container00972_(ctx,'Cinematic Lead',[
        label00972_(ctx,'Final scene','#f8fafc'),
        heading00972_(ctx,'Make the last frame memorable.',{size:'clamp(48px,8vw,110px)',font:serifStack00972_(),weight:'600',line:'.92',tracking:'-.055em',color:'#f8fafc'}),
        body00972_(ctx,'Велике зображення, затемнений шар і одна сильна дія — без зайвого декоративного шуму.',{size:'16px',color:'#f8fafc',opacity:'.86',max:'720px'}),
        container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'soft'})],{display:'flex','flex-direction':'row'})
      ],{gap:'18px',padding:'56px 0 44px'}),
      container00972_(ctx,'Cinematic Utility',[navCard00972_(ctx,'Навігація',menuA,{surface:false}),contactCard00972_(ctx,{surface:false,legalInside:true,compact:true}),socialText00972_(ctx)],{
        padding:'24px',background:'rgba(2,6,23,.62)',color:'#f8fafc',border:'1px solid rgba(255,255,255,.14)','border-radius':'4px','backdrop-filter':'blur(6px)',gap:'18px'
      })
    ],{display:'grid','grid-template-columns':'minmax(0,1.5fr) minmax(300px,.5fr)',gap:'28px',padding:'0'},'hf00972-cinematic'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx,{textColor:'#f8fafc'})],{padding:'16px 0 24px','border-top':'1px solid rgba(255,255,255,.18)'},'hf00972-bottom-row')
  ],{
    padding:'26px 0 0',
    background:"linear-gradient(90deg,rgba(2,6,23,.94),rgba(2,6,23,.58)),url('assets/system/backgrounds/future/bg-011.jpg') center/cover no-repeat",
    'background-size':'cover','background-position':'center','background-repeat':'no-repeat',
    color:'#f8fafc','border-top':'0'
  });
  return finishModel00972_(ctx,root);
}

// F19 — Soft Organic
function buildSoftOrganic00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const surface=ctx.dark?'rgba(15,23,42,.76)':'rgba(255,255,255,.76)';
  const root=makeRoot00972_(ctx,[
    node00972_(ctx,'element','div','',{'aria-hidden':'true',class:'hf00972-organic-blob'},{position:'absolute',right:'4%',top:'18px',width:'220px',height:'220px','border-radius':'44% 56% 62% 38% / 46% 40% 60% 54%',background:ctx.accent,opacity:'.10','pointer-events':'none'},[]),
    level00972_(ctx,'Soft Organic',[
      container00972_(ctx,'Organic Brand',[logo00972_(ctx,{large:true}),heading00972_(ctx,'Спокійний ритм, м’які форми, чіткі дії.',{size:'clamp(32px,4.4vw,58px)'}),body00972_(ctx,modernDescription00972_(ctx),{size:'15px'}),button00972_(ctx,ctx.cta,'#',{shape:'pill'})],{padding:'30px',background:surface,border:`1px solid ${ctx.border}`,'border-radius':'48px 20px 48px 20px',gap:'16px'}),
      container00972_(ctx,'Organic Utility',[
        container00972_(ctx,'Organic Navigation',[navCard00972_(ctx,'Навігація',menuA,{surface:false}),navCard00972_(ctx,'Інформація',menuB,{surface:false})],{display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',gap:'18px'},'hf00972-grid hf00972-grid-2'),
        contactCard00972_(ctx,{surface:true,legalInside:true,compact:true,style:{'border-radius':'18px 40px 18px 40px',background:surface}}),
        socialText00972_(ctx)
      ],{gap:'18px',padding:'14px 0'})
    ],{display:'grid','grid-template-columns':'minmax(0,1fr) minmax(320px,.9fr)',gap:'28px',padding:'28px 0 24px'},'hf00972-organic-grid'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'15px 0 24px','border-top':`1px solid ${ctx.border}`},'hf00972-bottom-row')
  ],{position:'relative'});
  return finishModel00972_(ctx,root);
}

// F20 — Brutalist
function buildBrutalist00972_(ctx){
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const cell={padding:'22px',border:`3px solid ${ctx.text}`,'border-radius':'0',background:'transparent',color:ctx.text,'box-shadow':'none'};
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'Brutalist Header',[
      container00972_(ctx,'Brutalist Brand',[label00972_(ctx,'FOOTER / 20'),heading00972_(ctx,ctx.brand.toUpperCase(),{size:'clamp(48px,7vw,96px)',font:groteskStack00972_(),weight:'900',line:'.9',tracking:'-.06em'})],{...cell}),
      container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#',{shape:'square'}),button00972_(ctx,'CONTACT','#contacts',{secondary:true,outlined:true,shape:'square'})],{...cell,display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'center','justify-content':'flex-end',gap:'8px'})
    ],{display:'grid','grid-template-columns':'1.4fr .6fr',gap:'0',padding:'20px 0 0'},'hf00972-brutalist-head'),
    level00972_(ctx,'Brutalist Grid',[
      navCard00972_(ctx,'MENU',menuA,{surface:false,style:cell}),
      navCard00972_(ctx,'INFO',menuB,{surface:false,style:cell}),
      contactCard00972_(ctx,{surface:false,legalInside:true,compact:true,style:cell}),
      container00972_(ctx,'SOCIAL',[label00972_(ctx,'SOCIAL'),socialText00972_(ctx)],cell)
    ],{display:'grid','grid-template-columns':'repeat(4,minmax(0,1fr))',gap:'0',padding:'0'},'hf00972-brutalist-grid'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'16px 0 24px','border-top':`3px solid ${ctx.text}`},'hf00972-bottom-row')
  ],{padding:'0','font-family':'Arial, Helvetica, sans-serif'});
  return finishModel00972_(ctx,root);
}

const FAMILY_BUILDERS_00972 = Object.freeze({
  F01:buildClassicCorporate00972_,
  F02:buildBigCtaTop00972_,
  F03:buildSplit406000972_,
  F04:buildCenteredPremium00972_,
  F05:buildCardGrid00972_,
  F06:buildBento00972_,
  F07:buildEditorial00972_,
  F08:buildImageSplit00972_,
  F09:buildFullImageBackground00972_,
  F10:buildGlassFuture00972_,
  F11:buildMinimalLine00972_,
  F12:buildContactFirst00972_,
  F13:buildNewsletterFirst00972_,
  F14:buildMegaFooter00972_,
  F15:buildArtDirection00972_,
  F16:buildFloatingCta00972_,
  F17:buildStackedPanels00972_,
  F18:buildDarkCinematic00972_,
  F19:buildSoftOrganic00972_,
  F20:buildBrutalist00972_
});

function resolveFamily00972_(pair){
  const assignment=FAMILY_ASSIGNMENTS_00972[String(pair.no||'').padStart(2,'0')]||null;
  if(!assignment) return null;
  const family=FOOTER_FAMILY_REGISTRY_00972.find((item)=>item.id===assignment.familyId)||null;
  if(!family) throw new Error(`00972 footer family ${assignment.familyId} not registered`);
  const builder=FAMILY_BUILDERS_00972[family.id];
  if(typeof builder!=='function') throw new Error(`00972 footer family ${family.id} has no builder`);
  return {family,variant:assignment.variant||'A',builder};
}

// Stable authored 00971 composition retained only for Footer 26–55 during this first batch.
function buildStable00971Composition00972_(pair){
  const family={id:'F00',name:'Stable 00971',slug:'stable-00971',composition:'cta-four-cards-bottom'};
  const ctx=makeContext00972_(pair,family,'A');
  const [menuA,menuB]=splitMenu00972_(ctx.recipe.menuItems);
  const panel=alphaSurface00972_(ctx.dark);
  const root=makeRoot00972_(ctx,[
    level00972_(ctx,'CTA',[
      container00972_(ctx,'CTA текст',[label00972_(ctx,`ПАРА ${pair.no}`),heading00972_(ctx,`Готові зробити наступний крок з ${ctx.brand}?`,{size:'clamp(24px,2.4vw,38px)'}),body00972_(ctx,modernDescription00972_(ctx),{size:'14px'})],{gap:'10px'}),
      container00972_(ctx,'CTA дії',[button00972_(ctx,ctx.cta,'#'),button00972_(ctx,'Контакти','#contacts',{secondary:true})],{display:'flex','flex-direction':'row','flex-wrap':'wrap','justify-content':'flex-end',gap:'10px'})
    ],{display:'grid','grid-template-columns':'minmax(0,1.35fr) minmax(280px,.65fr)','align-items':'center',gap:'28px',padding:'30px 34px',background:ctx.recipe.featureBackground||panel,color:ctx.recipe.featureColor||ctx.text,border:`1px solid ${ctx.border}`,'border-radius':ctx.t.radius.lg},'hf00972-cta-row'),
    level00972_(ctx,'Main',[
      container00972_(ctx,'Бренд',[logo00972_(ctx),body00972_(ctx,modernDescription00972_(ctx),{size:'13px'}),socialIcons00972_(ctx)],{padding:'20px',background:panel,border:`1px solid ${ctx.border}`,'border-radius':ctx.t.radius.lg}),
      navCard00972_(ctx,'Навігація',menuA,{surface:true}),
      navCard00972_(ctx,'Інформація',menuB,{surface:true}),
      contactCard00972_(ctx,{surface:true,legalInside:true,compact:true})
    ],{display:'grid','grid-template-columns':'minmax(280px,1.35fr) repeat(3,minmax(180px,.8fr))',gap:'16px',padding:'18px 0 0'},'hf00972-grid hf00972-grid-4'),
    level00972_(ctx,'Bottom',[copyright00972_(ctx)],{padding:'18px 0 24px','border-top':ctx.recipe.rootBorder||`1px solid ${ctx.border}`,'margin-top':'18px'},'hf00972-bottom-row')
  ]);
  return finishModel00972_(ctx,root,'STABLE_00971_CANONICAL_COMPOSITION_RETAINED_DURING_00972_BATCH');
}

function buildModel00972_(pair){
  const resolved=resolveFamily00972_(pair);
  if(!resolved) return buildStable00971Composition00972_(pair);
  const ctx=makeContext00972_(pair,resolved.family,resolved.variant);
  return resolved.builder(ctx);
}

function escAttr00972_(value){ return String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escText00972_(value){ return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function renderNode00972_(node){
  if(!node) return '';
  if(node.type==='text') return escText00972_(node.text||'');
  const tag=String(node.tag||'div').toLowerCase();
  const attrs={...(node.attrs||{})};
  if(node.styleText!=null && node.styleText!=='') attrs.style=String(node.styleText);
  const attrText=Object.entries(attrs).map(([key,val])=>val===true||val===''?` ${key}`:` ${key}="${escAttr00972_(val)}"`).join('');
  const children=Array.isArray(node.children)?node.children.map(renderNode00972_).join(''):'';
  const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  if(voidTags.has(tag)) return `<${tag}${attrText}>`;
  return `<${tag}${attrText}>${children}</${tag}>`;
}

const RAW_00972=getHeaderFooterStylePairs00965().map((pair)=>{
  const resolved=resolveFamily00972_(pair);
  const family=resolved?.family||{id:'F00',name:'Stable 00971',slug:'stable-00971',composition:'cta-four-cards-bottom',character:'stable-authored-composition'};
  const variant=resolved?.variant||'A';
  const model=buildModel00972_(pair);
  return {
    id:pair.footerTemplateId,type:'footer',folderId:'fld_footer',
    name:`${pair.no} · ${pair.name} · FOOTER`,styleName:`${pair.no} · ${pair.name} · Footer`,preview:`paired-footer-${pair.no}`,
    description:resolved
      ? `${family.id} · ${family.name} · universal authored Footer family; paired visual DNA remains tied to Header ${pair.no}.`
      : `Stable 00971 Footer retained during the 00972 architecture batch; paired visual DNA remains tied to Header ${pair.no}.`,
    meta:{
      source:'system',palette:pair.palette,pairId:pair.pairId,pairNo:pair.no,pairName:pair.name,pairedHeaderTemplateId:pair.headerTemplateId,
      pairContract:'header-footer-style-pair-v2-00971',visualRecipeContract:'header-footer-full-visual-recipe-v1-00969',
      modelContract:MODEL_VERSION_00972,singleSourceOfTruth:'model',standardKeys00965:true,authoredFooter00972:true,
      footerFamilyId:family.id,footerFamilyName:family.name,footerFamilySlug:family.slug,footerCompositionId:family.composition,
      footerCompositionVariant:variant,footerDesignCharacter:family.character,
      familyArchitecture00972:!!resolved,stable00971Retained00972:!resolved,
      tools:['section','row','container','logo','menu','text','button','link','icon','media']
    },
    modelVersion:MODEL_VERSION_00972,model,
    styleProfile:createPairAreaStyleProfile00965(pair,'footer',pair.footerTemplateId),
    html:renderNode00972_(model.root)
  };
});

export const PAIRED_FOOTER_TEMPLATES_00972=Object.freeze(RAW_00972.map(Object.freeze));
export function getPairedFooterTemplates00972(){ return PAIRED_FOOTER_TEMPLATES_00972.map(clone00972_); }
export function getFooterFamilyRegistry00972(){ return FOOTER_FAMILY_REGISTRY_00972.map(clone00972_); }
