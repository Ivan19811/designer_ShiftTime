// 00966-PAIRED-MODERN-FOOTER-LIBRARY
// 55 authored Footers built from the exact visual language of their paired canonical Headers.
// Carries Header background image/gradient treatment, glass/surface recipe, exact logo SVG,
// exact Header CTA SVG when available, plus modern contact/social iconography.
// Static model -> HTML. No DOM normalizer, observer, fallback or runtime repair.

import {
  getHeaderFooterStylePairs00965,
  createPairAreaStyleProfile00965
} from '../style-pairs/header-footer-style-pairs-00965.js?v=00966';
import { getHeaderFooterVisualRecipeByNo00966 } from '../style-pairs/header-footer-visual-recipes-00966.js?v=00966';

const MODEL_VERSION_00966 = 'st-hf-json-v1';
const AUTHORED_VERSION_00966 = '00966';

function clone00966_(value){ return JSON.parse(JSON.stringify(value)); }
function styleText00966_(style){ return Object.entries(style || {}).map(([k,v]) => `${k}:${v};`).join(''); }

function node00966_(pair,type,tag,id,attrs={},style={},children=[]){
  const node={type,tag,...(id?{id}:{}),attrs:{...attrs},style:{...style},styleText:styleText00966_(style),children};
  if(id && ['section','level','container','block'].includes(type)){
    node.attrs['data-node-id']=id;
    node.attrs['data-hf-node-type']=type;
    node.attrs['data-hf-template-id']=pair.footerTemplateId;
    node.attrs['data-hf-authored-template']=AUTHORED_VERSION_00966;
  }
  if(type==='section'){
    node.attrs['data-hf-json-template']='1';
    node.attrs['data-hf-style-pair-id']=pair.pairId;
    node.attrs['data-hf-style-pair-no']=pair.no;
    node.attrs['data-hf-visual-recipe']='header-parity-00966';
  }
  return node;
}
function text00966_(value){ return {type:'text',text:String(value??'')}; }
function editable00966_(pair,value,className,style={},attrs={}){
  return node00966_(pair,'element','span','',{class:className,contenteditable:'true',draggable:'true',spellcheck:'false','data-st-text-target':'1',...attrs},style,[text00966_(value)]);
}
function svgNode00966_(raw){ return raw ? clone00966_(raw) : null; }

function iconSvg00966_(kind){
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
  return common;
}

function iconShell00966_(pair,icon,theme,extraStyle={}){
  const i=svgNode00966_(icon) || iconSvg00966_('arrow');
  i.style={...(i.style||{}),width:'20px',height:'20px',display:'block'};
  i.styleText=styleText00966_(i.style);
  return node00966_(pair,'element','span','',{class:'hf00966-icon-shell','aria-hidden':'true'},
    {width:'40px',height:'40px',display:'inline-grid','place-items':'center','border-radius':theme.icons.logoRadius,background:theme.icons.logoBg,color:theme.icons.logoColor,border:`${theme.icons.logoBorderWidth} solid ${theme.icons.logoBorderColor}`,'box-shadow':theme.shadow.soft,flex:'0 0 auto','box-sizing':'border-box',...extraStyle},[i]);
}

function blockText00966_(pair,id,value,role,style={},className=''){
  return node00966_(pair,'block','div',id,{class:`hb-elem st-block st-block--text hf00966-text ${className}`.trim(),'data-block-kind':'text','data-block-role':role,'data-name':value,'data-hb-tip':value},
    {width:'100%','min-width':'0','max-width':'100%','min-height':'0',background:'transparent',border:'0',overflow:'visible',padding:'0','box-sizing':'border-box',...style},
    [editable00966_(pair,value,'st-text-edit hf00966-text__edit',{display:'block',width:'100%','max-width':'100%','min-width':'0','min-height':'0',height:'auto',padding:'0',border:'0','line-height':'inherit',color:'inherit','font-size':'inherit','font-weight':'inherit','letter-spacing':'inherit','white-space':'normal','word-break':'normal','overflow-wrap':'break-word','box-sizing':'border-box'})]);
}

function logoBlock00966_(pair,id,recipe,theme){
  const src=recipe.logoIconShellStyle||{};
  const markStyle={width:'46px',height:'46px',...(src.background?{background:src.background}:{}),...(src.color?{color:src.color}:{}),...(src.border?{border:src.border}:{}),...(src['border-radius']?{'border-radius':src['border-radius']}:{}),...(src['box-shadow']?{'box-shadow':src['box-shadow']}:{}),...(src.padding?{padding:src.padding}:{} )};
  const mark=recipe.logoIcon ? iconShell00966_(pair,recipe.logoIcon,theme,markStyle) : null;
  const kids=[];
  if(mark) kids.push(mark);
  kids.push(node00966_(pair,'element','div','',{class:'hf00966-logo-copy'},
    {display:'flex','flex-direction':'column',gap:'3px','min-width':'0'},[
      editable00966_(pair,pair.brandTitle||pair.shortName||'BRAND','st-text-edit st-logo__title',{'font-size':theme.typography.logoTitleSize,'font-weight':theme.typography.logoTitleWeight,'line-height':theme.typography.logoTitleLineHeight,'letter-spacing':theme.typography.logoTitleLetterSpacing,color:'inherit','white-space':'normal','overflow-wrap':'break-word'},{'data-logo-title':'1'}),
      editable00966_(pair,pair.brandSubtitle||'Сучасний простір','st-text-edit st-logo__subtitle',{'font-size':theme.typography.logoSubtitleSize,'font-weight':theme.typography.logoSubtitleWeight,'line-height':theme.typography.logoSubtitleLineHeight,'letter-spacing':theme.typography.logoSubtitleLetterSpacing,color:'inherit',opacity:'.76','text-transform':'uppercase','white-space':'normal','overflow-wrap':'break-word'},{'data-logo-subtitle':'1'})
    ]));
  return node00966_(pair,'block','div',id,{class:'hb-elem st-block st-block--text st-block--logo hf00966-logo','data-block-kind':'text','data-block-role':'logo','data-name':'Лого','data-hb-tip':'Лого','data-logo-mode':'logo-text-subtitle','data-logo-source':'icon','data-logo-pos':'left','data-logo-click-area':'all','data-logo-fit':'contain','data-logo-title-size':String(theme.typography.logoTitleSize).replace('px',''),'data-logo-subtitle-size':String(theme.typography.logoSubtitleSize).replace('px','')},
    {width:'100%','min-width':'0',display:'flex','align-items':'center',gap:'12px',background:'transparent',border:'0',overflow:'visible',padding:'0',color:recipe.rootColor,'box-sizing':'border-box'},kids);
}

function button00966_(pair,id,label,href,theme,recipe,secondary=false){
  const b=theme.buttons;
  const bg=secondary?b.secondaryBg:b.primaryBg, fg=secondary?b.secondaryText:b.primaryText;
  const bc=secondary?b.secondaryBorderColor:b.primaryBorderColor;
  const icon=secondary?iconSvg00966_('arrow'):(recipe.ctaIcon||iconSvg00966_('arrow'));
  const svg=svgNode00966_(icon); svg.style={...(svg.style||{}),width:'17px',height:'17px'}; svg.styleText=styleText00966_(svg.style);
  const exactPrimary=(!secondary && recipe.ctaButtonStyle)?recipe.ctaButtonStyle:{};
  return node00966_(pair,'block','div',id,{class:`hb-elem st-block st-block--button hf00966-button ${secondary?'is-secondary':'is-primary'}`,'data-block-kind':'button','data-block-role':'button','data-name':label,'data-hb-tip':label,'data-button-mode':'text','data-button-text':label,'data-button-href':href,'data-button-link-mode':'custom','data-button-click-area':'all','data-button-shape':'pill','data-button-fill-mode':'solid','data-button-color1':bg},
    {width:'auto','min-width':'max-content','min-height':'46px',display:'inline-flex','align-items':'center','justify-content':'center',gap:b.gap,padding:`${b.paddingY} ${b.paddingX}`,'border-radius':b.radius,background:bg,color:fg,border:`${secondary?b.secondaryBorderWidth:b.primaryBorderWidth} solid ${bc}`,'box-shadow':secondary?'none':b.shadow,overflow:'visible',flex:'0 0 auto','box-sizing':'border-box',...exactPrimary},[
      editable00966_(pair,label,'st-text-edit st-button__label',{'font-size':b.fontSize,'font-weight':b.fontWeight,'line-height':b.lineHeight,color:'inherit','white-space':'nowrap',width:'auto','min-height':'0',height:'auto',padding:'0',border:'0'}),
      node00966_(pair,'element','span','',{class:'hf00966-button__icon','aria-hidden':'true'},{display:'inline-grid','place-items':'center',width:'18px',height:'18px'},[svg])
    ]);
}

function menu00966_(pair,id,label,items,theme){
  const list=(items||[]).slice(0,6);
  const lis=list.map(([txt,href])=>node00966_(pair,'element','li','',{class:'st-menu__item','data-menu-depth':'1'},{width:'100%','list-style':'none'},[
    node00966_(pair,'element','a','',{href:href||'#',class:'st-menu__link st-block st-block--menu-item hf00966-menu__link','data-st-menu-item':'1'},
      {display:'inline-flex','align-items':'center','justify-content':'flex-start',gap:'8px',width:'100%','min-width':'0','min-height':'34px',padding:'5px 0',background:'transparent',border:'0',color:theme.menu.text,'text-decoration':'none','font-size':theme.menu.fontSize,'font-weight':theme.menu.fontWeight,'line-height':theme.menu.lineHeight,'box-sizing':'border-box'},[
        node00966_(pair,'element','span','',{class:'hf00966-menu-dot','aria-hidden':'true'},{width:'6px',height:'6px','border-radius':'999px',background:theme.colors.accent,opacity:'.72',flex:'0 0 auto'},[]),
        node00966_(pair,'element','span','',{class:'st-menu__text'},{'white-space':'normal','word-break':'normal','overflow-wrap':'break-word'},[text00966_(txt)])
      ])
  ]));
  return node00966_(pair,'block','div',id,{class:'hb-elem st-block st-block--menu hf00966-menu','data-block-kind':'menu','data-name':label,'data-hb-tip':label,'data-st-menu':'1','data-menu-variant':'footer','data-menu-level1-direction':'column','data-menu-items':JSON.stringify(list.map(([text,href])=>({text,href:href||'#',children:[]})))},
    {width:'100%','min-width':'0','max-width':'100%',display:'flex','align-items':'flex-start',background:'transparent',border:'0',overflow:'visible',padding:'0',color:theme.menu.text,'box-sizing':'border-box'},[
      node00966_(pair,'element','nav','',{'aria-label':label,class:'st-menu st-menu--footer'},{width:'100%','max-width':'100%','min-width':'0'},[
        node00966_(pair,'element','ul','',{class:'st-menu__list','data-menu-list-depth':'1'},{margin:'0',padding:'0',width:'100%',display:'flex','flex-direction':'column',gap:'3px','list-style':'none','box-sizing':'border-box'},lis)
      ])
    ]);
}

function container00966_(pair,id,name,children,style={}){
  return node00966_(pair,'container','div',id,{class:'st-block hf00966-container','data-st-node':'container','data-layout-mode':'flex','data-layout-orient':'column','data-name':name},
    {width:'100%','min-width':'0','max-width':'100%',display:'flex','flex-direction':'column',gap:'12px',background:'transparent',border:'0',overflow:'visible',padding:'0','box-sizing':'border-box',...style},children);
}

function infoLink00966_(pair,id,label,href,theme,iconKind){
  const svg=iconSvg00966_(iconKind); svg.style={width:'16px',height:'16px'}; svg.styleText=styleText00966_(svg.style);
  return node00966_(pair,'block','div',id,{class:'hb-elem st-block st-block--text st-block--link hf00966-info-link','data-block-kind':'text','data-block-role':'link','data-name':label,'data-hb-tip':label},
    {width:'100%','min-width':'0','max-width':'100%','min-height':'38px',display:'flex','align-items':'center',background:'transparent',border:'0',overflow:'visible',padding:'0',color:theme.links.color,'box-sizing':'border-box'},[
      node00966_(pair,'element','a','',{href,class:'st-text-edit hf00966-info-link__a','data-st-text-target':'1',contenteditable:'true',draggable:'true',spellcheck:'false'},
        {display:'inline-flex','align-items':'center',gap:'9px','min-height':'38px',color:'inherit','font-size':theme.links.fontSize,'font-weight':theme.links.fontWeight,'line-height':theme.links.lineHeight,'text-decoration':'none','white-space':'normal','overflow-wrap':'break-word','box-sizing':'border-box'},[
          node00966_(pair,'element','span','',{class:'hf00966-mini-icon','aria-hidden':'true'},{width:'30px',height:'30px',display:'inline-grid','place-items':'center','border-radius':theme.radius.md,background:theme.icons.bg,color:theme.icons.color,border:`${theme.icons.borderWidth} solid ${theme.icons.borderColor}`,flex:'0 0 auto'},[svg]),
          text00966_(label)
        ])
    ]);
}

function socialButton00966_(pair,label,href,kind,theme){
  const svg=iconSvg00966_(kind); svg.style={width:'18px',height:'18px'}; svg.styleText=styleText00966_(svg.style);
  return node00966_(pair,'element','a','',{href,class:'hf00966-social','aria-label':label,title:label},
    {width:'38px',height:'38px',display:'inline-grid','place-items':'center','border-radius':theme.icons.radius,background:theme.icons.bg,color:theme.icons.color,border:`${theme.icons.borderWidth} solid ${theme.icons.borderColor}`,'text-decoration':'none','box-shadow':'none'},[svg]);
}

function modernDescription00966_(pair){
  const name=String(pair.name||'').toLowerCase();
  if(/restaurant|cafe|food/.test(name)) return 'Меню, бронювання, події та контакти — усе, що потрібно гостю, в одному зрозумілому місці.';
  if(/shop|store|market|pharmacy|cosmetics|jewelry|books|tools|electronics|auto parts|kids/.test(name)) return 'Каталог, доставка, підтримка та швидкі дії — зручно для покупця на будь-якому пристрої.';
  if(/clinic|beauty/.test(name)) return 'Послуги, контакти, запис і корисна інформація — швидкий шлях від знайомства до дії.';
  if(/education/.test(name)) return 'Навчання, програми, контакти та ключова інформація — структуровано для учнів і батьків.';
  return 'Навігація, контакти та головні дії — у сучасному футері, що продовжує дизайн шапки.';
}

function splitMenu00966_(items){
  const clean=(items||[]).filter((x)=>Array.isArray(x)&&String(x[0]||'').trim());
  const left=clean.slice(0,4);
  const right=clean.slice(4,8);
  if(!left.length) left.push(['Головна','/'],['Про нас','#about'],['Послуги','#services'],['Контакти','#contacts']);
  if(!right.length) right.push(['Новини','#news'],['FAQ','#faq'],['Документи','#documents'],['Карта сайту','#sitemap']);
  return [left,right];
}

function buildModel00966_(pair){
  const t=pair.theme, recipe=getHeaderFooterVisualRecipeByNo00966(pair.no);
  if(!recipe) throw new Error(`00966 visual recipe missing for pair ${pair.no}`);
  const [menuA,menuB]=splitMenu00966_(recipe.menuItems);
  const textColor=recipe.rootColor||t.colors.text;
  const muted=t.colors.muted;
  const rootId=`hf${pair.no}_footer_section_001`;
  const brand=pair.brandTitle||pair.shortName||'BRAND';
  const cta=pair.ctaLabel||'Дізнатися більше';
  const panelIsPill=/999|50%/.test(String(recipe.panelRadius||''));
  const panelDuplicatesFeature=String(recipe.panelBackground||'')===String(recipe.featureBackground||'');
  const panelBackground=(panelIsPill||panelDuplicatesFeature)
    ? (pair.dark?'rgba(15,23,42,.58)':'rgba(255,255,255,.86)')
    : recipe.panelBackground;
  const panelBackgroundAlt=pair.dark?'rgba(15,23,42,.38)':'rgba(248,250,252,.82)';
  const panelColor=pair.dark?t.colors.text:t.colors.text;
  const panelBorder=(panelIsPill||panelDuplicatesFeature)?`1px solid ${t.colors.border}`:recipe.panelBorder;
  const panelRadius=panelIsPill?t.radius.lg:recipe.panelRadius;
  const panelShadow=(panelIsPill||panelDuplicatesFeature)?t.shadow.soft:recipe.panelShadow;
  const panelBackdrop=(panelIsPill||panelDuplicatesFeature)?'blur(14px)':recipe.panelBackdropFilter;
  const ctaDuplicatesButton=String(recipe.ctaButtonStyle?.background||'')===String(recipe.featureBackground||'');
  const ctaPanelBackground=ctaDuplicatesButton?panelBackground:recipe.featureBackground;
  const ctaPanelColor=ctaDuplicatesButton?panelColor:(recipe.featureColor||textColor);
  const ctaPanelBorder=ctaDuplicatesButton?panelBorder:recipe.panelBorder;
  const ctaPanelShadow=ctaDuplicatesButton?panelShadow:recipe.panelShadow;
  const ctaPanelBackdrop=ctaDuplicatesButton?panelBackdrop:recipe.panelBackdropFilter;

  const ctaLevel=node00966_(pair,'level','div',`hf${pair.no}_footer_level_001`,{class:'st-row hf00966-cta-row','data-st-node':'level','data-layout-mode':'fr','data-layout-orient':'row'},
    {display:'grid','grid-template-columns':'minmax(0,1.35fr) minmax(280px,.65fr)','align-items':'center',gap:'28px',width:'min(1320px,calc(100% - 48px))',margin:'0 auto',padding:'30px 34px',background:ctaPanelBackground,color:ctaPanelColor,border:ctaPanelBorder,'border-radius':panelRadius,'box-shadow':ctaPanelShadow,'backdrop-filter':ctaPanelBackdrop,overflow:'visible','box-sizing':'border-box',position:'relative'},[
      container00966_(pair,`hf${pair.no}_footer_container_001`,'CTA текст',[
        blockText00966_(pair,`hf${pair.no}_footer_block_001`,`ПАРА ${pair.no} · ${pair.shortName}`,'eyebrow',{color:'inherit',opacity:'.82','font-size':'11px','font-weight':'900','line-height':'1.2','letter-spacing':'.09em','text-transform':'uppercase'}),
        blockText00966_(pair,`hf${pair.no}_footer_block_002`,`Готові зробити наступний крок з ${brand}?`,'heading',{color:'inherit','font-size':'clamp(24px,2.4vw,38px)','font-weight':'900','line-height':'1.08','letter-spacing':'-.035em'},'st-block--heading'),
        blockText00966_(pair,`hf${pair.no}_footer_block_003`,modernDescription00966_(pair),'text',{color:'inherit',opacity:'.76','font-size':'14px','font-weight':'650','line-height':'1.55','max-width':'760px'})
      ],{gap:'10px'}),
      container00966_(pair,`hf${pair.no}_footer_container_002`,'CTA дії',[
        button00966_(pair,`hf${pair.no}_footer_block_004`,cta,'#',t,recipe,false),
        button00966_(pair,`hf${pair.no}_footer_block_005`,'Контакти','#contacts',t,recipe,true)
      ],{display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'center','justify-content':'flex-end',gap:'10px'})
    ]);

  const brandCard=container00966_(pair,`hf${pair.no}_footer_container_003`,'Бренд',[
    logoBlock00966_(pair,`hf${pair.no}_footer_block_006`,recipe,t),
    blockText00966_(pair,`hf${pair.no}_footer_block_007`,modernDescription00966_(pair),'text',{color:textColor,opacity:'.76','font-size':'13px','font-weight':'650','line-height':'1.55'}),
    node00966_(pair,'container','div',`hf${pair.no}_footer_container_004`,{class:'st-block hf00966-socials','data-st-node':'container','data-layout-mode':'flex','data-layout-orient':'row','data-name':'Соцмережі'},
      {width:'100%','min-width':'0',display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'center',gap:'8px',background:'transparent',border:'0',overflow:'visible',padding:'0','box-sizing':'border-box'},[
        socialButton00966_(pair,'Instagram','#instagram','instagram',t),
        socialButton00966_(pair,'Facebook','#facebook','facebook',t),
        socialButton00966_(pair,'YouTube','#youtube','youtube',t)
      ])
  ],{padding:'22px',background:panelBackground,color:panelColor,border:panelBorder,'border-radius':panelRadius,'box-shadow':panelShadow,'backdrop-filter':panelBackdrop,gap:'16px'});

  const navCard=container00966_(pair,`hf${pair.no}_footer_container_005`,'Навігація',[
    blockText00966_(pair,`hf${pair.no}_footer_block_008`,'Навігація','heading',{color:textColor,'font-size':'13px','font-weight':'900','line-height':'1.2','letter-spacing':'.07em','text-transform':'uppercase'},'st-block--heading'),
    menu00966_(pair,`hf${pair.no}_footer_block_009`,'Навігація',menuA,t)
  ],{padding:'22px',background:panelBackgroundAlt,color:textColor,border:panelBorder,'border-radius':panelRadius,gap:'14px'});

  const infoCard=container00966_(pair,`hf${pair.no}_footer_container_006`,'Інформація',[
    blockText00966_(pair,`hf${pair.no}_footer_block_010`,'Інформація','heading',{color:textColor,'font-size':'13px','font-weight':'900','line-height':'1.2','letter-spacing':'.07em','text-transform':'uppercase'},'st-block--heading'),
    menu00966_(pair,`hf${pair.no}_footer_block_011`,'Інформація',menuB,t)
  ],{padding:'22px',background:panelBackgroundAlt,color:textColor,border:panelBorder,'border-radius':panelRadius,gap:'14px'});

  const contactCard=container00966_(pair,`hf${pair.no}_footer_container_007`,'Контакти',[
    blockText00966_(pair,`hf${pair.no}_footer_block_012`,'Контакти','heading',{color:textColor,'font-size':'13px','font-weight':'900','line-height':'1.2','letter-spacing':'.07em','text-transform':'uppercase'},'st-block--heading'),
    infoLink00966_(pair,`hf${pair.no}_footer_block_013`,'+38 (000) 000-00-00','tel:+380000000000',t,'phone'),
    infoLink00966_(pair,`hf${pair.no}_footer_block_014`,'hello@example.com','mailto:hello@example.com',t,'mail'),
    infoLink00966_(pair,`hf${pair.no}_footer_block_015`,'Україна','#contacts',t,'map'),
    blockText00966_(pair,`hf${pair.no}_footer_block_016`,'Відповідаємо у робочий час','text',{color:muted,'font-size':'12px','font-weight':'700','line-height':'1.4'})
  ],{padding:'22px',background:panelBackgroundAlt,color:textColor,border:panelBorder,'border-radius':panelRadius,gap:'10px'});

  const mainLevel=node00966_(pair,'level','div',`hf${pair.no}_footer_level_002`,{class:'st-row hf00966-main-row','data-st-node':'level','data-layout-mode':'fr','data-layout-orient':'row'},
    {display:'grid','grid-template-columns':'minmax(280px,1.35fr) repeat(3,minmax(180px,.8fr))','align-items':'stretch',gap:'16px',width:'min(1320px,calc(100% - 48px))',margin:'18px auto 0',padding:'0','box-sizing':'border-box',overflow:'visible'},[brandCard,navCard,infoCard,contactCard]);

  const bottomLevel=node00966_(pair,'level','div',`hf${pair.no}_footer_level_003`,{class:'st-row hf00966-bottom-row','data-st-node':'level','data-layout-mode':'flex','data-layout-orient':'row'},
    {display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'center','justify-content':'space-between',gap:'14px',width:'min(1320px,calc(100% - 48px))',margin:'18px auto 0',padding:'18px 0 24px',border:'0','border-top':recipe.rootBorder,overflow:'visible','box-sizing':'border-box'},[
      container00966_(pair,`hf${pair.no}_footer_container_008`,'Copyright',[
        blockText00966_(pair,`hf${pair.no}_footer_block_017`,`© 2026 ${brand}. Усі права захищені.`,'text',{color:textColor,opacity:'.72','font-size':'12px','font-weight':'650','line-height':'1.4'})
      ],{width:'auto',flex:'1 1 280px'}),
      node00966_(pair,'container','div',`hf${pair.no}_footer_container_009`,{class:'st-block hf00966-legal','data-st-node':'container','data-layout-mode':'flex','data-layout-orient':'row','data-name':'Юридичні посилання'},
        {width:'auto','min-width':'0',display:'flex','flex-direction':'row','flex-wrap':'wrap','align-items':'center','justify-content':'flex-end',gap:'14px',background:'transparent',border:'0',overflow:'visible',padding:'0','box-sizing':'border-box'},[
          infoLink00966_(pair,`hf${pair.no}_footer_block_018`,'Конфіденційність','#privacy',t,'shield'),
          infoLink00966_(pair,`hf${pair.no}_footer_block_019`,'Умови','#terms',t,'shield')
        ])
    ]);

  const root=node00966_(pair,'section','footer',rootId,{class:'st-section hf00966-footer-section','data-sec-role':'footer',role:'contentinfo'},
    {width:'100%','box-sizing':'border-box',padding:'28px 0 0',margin:'0',background:recipe.rootBackground,'background-size':recipe.rootBackgroundSize,'background-position':recipe.rootBackgroundPosition,'background-repeat':recipe.rootBackgroundRepeat,color:textColor,border:'0','border-top':recipe.rootBorder,'border-radius':'0','box-shadow':'none',overflow:'visible',position:'relative',isolation:'isolate','font-family':t.typography.textFont,container:'hf00966-footer / inline-size'},[ctaLevel,mainLevel,bottomLevel]);

  return {version:MODEL_VERSION_00966,schema:'section-level-container-block-dom-v1',scope:'footer',templateId:pair.footerTemplateId,sourcePolicy:'PAIR_HEADER_VISUAL_RECIPE_IS_SOURCE_OF_TRUTH_00966',renderPolicy:'DOM is rendered from this canonical model; no runtime normalizer/adapter.',root};
}

function escAttr00966_(value){ return String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escText00966_(value){ return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function renderNode00966_(node){
  if(!node) return '';
  if(node.type==='text') return escText00966_(node.text||'');
  const tag=String(node.tag||'div').toLowerCase();
  const attrs={...(node.attrs||{})};
  if(node.styleText!=null && node.styleText!=='') attrs.style=String(node.styleText);
  const attrText=Object.entries(attrs).map(([key,val])=>val===true||val===''?` ${key}`:` ${key}="${escAttr00966_(val)}"`).join('');
  const children=Array.isArray(node.children)?node.children.map(renderNode00966_).join(''):'';
  const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  if(voidTags.has(tag)) return `<${tag}${attrText}>`;
  return `<${tag}${attrText}>${children}</${tag}>`;
}

const RAW_00966=getHeaderFooterStylePairs00965().map((pair)=>{
  const recipe=getHeaderFooterVisualRecipeByNo00966(pair.no);
  const model=buildModel00966_(pair);
  return {
    id:pair.footerTemplateId,type:'footer',folderId:'fld_footer',
    name:`${pair.no} · ${pair.name} · FOOTER`,styleName:`${pair.no} · ${pair.name} · Footer`,preview:`paired-footer-${pair.no}`,
    description:`Парний сучасний футер до Header ${pair.no}: той самий фон/градієнт, Header SVG-іконки, surface/glass рецепт і дизайн-токени.`,
    meta:{source:'system',palette:pair.palette,pairId:pair.pairId,pairNo:pair.no,pairName:pair.name,pairedHeaderTemplateId:pair.headerTemplateId,pairContract:'header-footer-style-pair-v2-00966',visualRecipeContract:'header-footer-full-visual-recipe-v1-00966',modelContract:MODEL_VERSION_00966,singleSourceOfTruth:'model',standardKeys00965:true,authoredFooter00966:true,headerVisualParity00966:true,headerIconCount00966:recipe?.headerIconCount||0,headerBackgroundCarried00966:!!recipe?.rootBackground,headerSystemBackgroundCarried00966:!!recipe?.hasSystemBackground,tools:['section','row','container','logo','menu','text','button','link','icon']},
    modelVersion:MODEL_VERSION_00966,model,styleProfile:createPairAreaStyleProfile00965(pair,'footer',pair.footerTemplateId),html:renderNode00966_(model.root)
  };
});

export const PAIRED_FOOTER_TEMPLATES_00966=Object.freeze(RAW_00966.map(Object.freeze));
export function getPairedFooterTemplates00966(){ return PAIRED_FOOTER_TEMPLATES_00966.map(clone00966_); }
