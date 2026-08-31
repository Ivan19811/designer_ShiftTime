// 00978-HEADER-UNIVERSAL-DESIGN-PAIRS
// 55 paired Header templates rebuilt as authored canonical JSON design families.
// Each header keeps pairId/pairNo/templateId/pairedFooterTemplateId and shares the design DNA
// of its paired Footer family while using an independent Header composition.
// Preview and Applied Site render this canonical model directly. No runtime repair/normalizer.

import {
  getHeaderFooterStylePairs00965,
  createPairAreaStyleProfile00965
} from '../style-pairs/header-footer-style-pairs-00965.js?v=00978';
import { getHeaderFooterVisualRecipeByNo00969 } from '../style-pairs/header-footer-visual-recipes-00969.js?v=00978';

const MODEL_VERSION_00978='st-hf-json-v1';
const AUTHORED_VERSION_00978='00978';

const FAMILY_SPECS_00978=Object.freeze([
  {id:'F01',name:'Minimal Luxe',slug:'minimal-luxe',character:'apple-like calm · premium whitespace'},
  {id:'F02',name:'SaaS Conversion',slug:'saas-conversion',character:'stripe-like CTA clarity'},
  {id:'F03',name:'Cosmic Split',slug:'cosmic-split',character:'futuristic asymmetry · bold brand split'},
  {id:'F04',name:'Centered Premium',slug:'centered-premium',character:'centered luxury · refined spacing'},
  {id:'F05',name:'Marketplace Mega',slug:'marketplace-mega',character:'shopify-like commerce nav'},
  {id:'F06',name:'Bento Utility',slug:'bento-utility',character:'modular commerce tools · compact panels'},
  {id:'F07',name:'Editorial Serif',slug:'editorial-serif',character:'notion/editorial blend · serif rhythm'},
  {id:'F08',name:'Search Dock',slug:'search-dock',character:'airbnb-like search focus'},
  {id:'F09',name:'Outdoor / Fishing Pro',slug:'outdoor-fishing-pro',character:'patagonia-like outdoor commerce'},
  {id:'F10',name:'Glass Future',slug:'glass-future',character:'framer-like glass capsules'},
  {id:'F11',name:'Medical Clean',slug:'medical-clean',character:'clean trust-first healthcare'},
  {id:'F12',name:'Education Smart',slug:'education-smart',character:'structured learning / school header'},
  {id:'F13',name:'Food Commerce',slug:'food-commerce',character:'delivery-led action header'},
  {id:'F14',name:'Commerce Directory',slug:'commerce-directory',character:'category strip · marketplace utility'},
  {id:'F15',name:'Atelier Brand',slug:'atelier-brand',character:'boutique / studio art direction'},
  {id:'F16',name:'Floating CTA',slug:'floating-cta',character:'conversion-first floating action'},
  {id:'F17',name:'Utility Stacked',slug:'utility-stacked',character:'layered bars · practical utilities'},
  {id:'F18',name:'Dark Cinematic',slug:'dark-cinematic',character:'cinematic high-contrast luxury'},
  {id:'F19',name:'Soft Organic',slug:'soft-organic',character:'rounded organic surfaces'},
  {id:'F20',name:'Brutalist Modern',slug:'brutalist-modern',character:'hard grid with modern polish'}
]);
export const HEADER_FAMILY_REGISTRY_00978=FAMILY_SPECS_00978;

const ASSIGNMENTS_00978=Object.freeze({
 '01':['F01','A'],'26':['F01','B'],'46':['F01','C'],
 '07':['F02','A'],'27':['F02','B'],'47':['F02','C'],
 '03':['F03','A'],'22':['F03','B'],'28':['F03','C'],'48':['F03','D'],
 '09':['F04','A'],'29':['F04','B'],'49':['F04','C'],
 '05':['F05','A'],'24':['F05','B'],'30':['F05','C'],'50':['F05','D'],
 '02':['F06','A'],'21':['F06','B'],'31':['F06','C'],'51':['F06','D'],
 '11':['F07','A'],'32':['F07','B'],'52':['F07','C'],
 '06':['F08','A'],'33':['F08','B'],'53':['F08','C'],
 '16':['F09','A'],'34':['F09','B'],'54':['F09','C'],
 '04':['F10','A'],'23':['F10','B'],'35':['F10','C'],'55':['F10','D'],
 '08':['F11','A'],'36':['F11','B'],
 '12':['F12','A'],'37':['F12','B'],
 '19':['F13','A'],'38':['F13','B'],
 '10':['F14','A'],'39':['F14','B'],
 '15':['F15','A'],'40':['F15','B'],
 '13':['F16','A'],'25':['F16','B'],'41':['F16','C'],
 '17':['F17','A'],'42':['F17','B'],
 '20':['F18','A'],'43':['F18','B'],
 '14':['F19','A'],'44':['F19','B'],
 '18':['F20','A'],'45':['F20','B']
});

function clone00978_(v){return JSON.parse(JSON.stringify(v));}
function styleText00978_(style){return Object.entries(style||{}).map(([k,v])=>`${k}:${v};`).join('');}
function family00978_(id){return FAMILY_SPECS_00978.find(x=>x.id===id);}
function soft00978_(ctx,a=.08){return ctx.pair.dark?`rgba(255,255,255,${a})`:`rgba(15,23,42,${a})`;}
function panel00978_(ctx){return ctx.recipe.panelBackground||soft00978_(ctx,.07);}
function panelText00978_(ctx){return ctx.recipe.panelColor||ctx.text;}
function featureText00978_(ctx){return ctx.recipe.featureColor||ctx.t.colors.onPrimary||'#fff';}
function serif00978_(){return 'Georgia, "Times New Roman", serif';}
function grotesk00978_(){return '"Arial Black", "Helvetica Neue", Arial, sans-serif';}
function detectTheme00978_(pair,family){
 const raw=`${pair.brandTitle||''} ${pair.name||''} ${pair.shortName||''}`.toLowerCase();
 let archetype='premium'; let topic='premium';
 if(/market|mall|store|shop|catalog|delivery|supermarket|buybox|cosmetics|beauty|kids store|parts|electronics|mega/.test(raw)) {archetype='market'; topic='marketplace';}
 else if(/estate|home decor|search|harbor|skyway/.test(raw)) {archetype='search'; topic='catalog';}
 else if(/med|pharmacy|hopefund/.test(raw)) {archetype='medical'; topic='medical';}
 else if(/cloud|desk|pocketpay|orion|nova|sync|neuro|flow/.test(raw)) {archetype='saas'; topic='tech';}
 else if(/grill|coffee|food|terra/.test(raw)) {archetype='food'; topic='food';}
 else if(/skill|school|daily form/.test(raw)) {archetype='education'; topic='education';}
 else if(/aurelia|maison|lumiere|atelier|olena|frame|aurum/.test(raw)) {archetype='luxury'; topic='atelier';}
 else if(/cargo|build|tool|drive part|auto/.test(raw)) {archetype='industrial'; topic='industrial';}
 else if(/pixel|forge/.test(raw)) {archetype='creative'; topic='creative';}
 if(['F05','F06','F14'].includes(family.id)) { archetype='market'; topic='marketplace'; }
 if(['F08'].includes(family.id)) { archetype='search'; topic='search'; }
 if(['F10','F18'].includes(family.id) || /orion|nova/.test(raw)) { archetype='cosmic'; topic='cosmos'; }
 if(['F09'].includes(family.id)) { archetype='outdoor'; topic='outdoor'; }
 if(['F11'].includes(family.id)) { archetype='medical'; topic='medical'; }
 if(['F12'].includes(family.id)) { archetype='education'; topic='education'; }
 if(['F13'].includes(family.id)) { archetype='food'; topic='food'; }
 return {archetype,topic};
}
function titleFont00978_(ctx){
 if(['luxury','editorial'].includes(ctx.archetype) || ['F07','F15','F18'].includes(ctx.family.id)) return serif00978_();
 if(['cosmic','saas'].includes(ctx.archetype)) return grotesk00978_();
 return ctx.t.typography.textFont;
}
function markRadius00978_(ctx){
 if(ctx.archetype==='cosmic') return '18px';
 if(ctx.archetype==='market') return '14px';
 if(ctx.archetype==='luxury') return '999px';
 if(ctx.family.id==='F20') return '0';
 if(ctx.family.id==='F19') return '20px 10px 20px 10px';
 return ctx.t.icons.logoRadius||ctx.t.radius.md;
}
function topicBadge00978_(ctx){
 const map={market:'Marketplace',search:'Search & Catalog',medical:'Clinic / Care',saas:'Digital Platform',cosmic:'Space / Future',food:'Delivery / Order',education:'Learning / School',luxury:'Atelier / Premium',industrial:'Tools / Parts',creative:'Creative Studio',outdoor:'Outdoor / Fishing',premium:'Premium Brand'};
 return map[ctx.archetype]||'Premium Brand';
}
function defaultMenuItems00978_(ctx){
 const map={
  market:[['Каталог','#'],['Новинки','#'],['Бренди','#'],['Акції','#'],['Доставка','#'],['Контакти','#']],
  search:[['Напрямки','#'],['Пошук','#'],['Каталог','#'],['Переваги','#'],['Контакти','#']],
  medical:[['Послуги','#'],['Лікарі','#'],['Запис','#'],['Відгуки','#'],['Контакти','#']],
  saas:[['Можливості','#'],['Рішення','#'],['Тарифи','#'],['Демо','#'],['Контакти','#']],
  cosmic:[['Продукт','#'],['Технології','#'],['Можливості','#'],['Демо','#'],['Контакти','#']],
  food:[['Меню','#'],['Доставка','#'],['Акції','#'],['Відгуки','#'],['Контакти','#']],
  education:[['Програми','#'],['Курси','#'],['Викладачі','#'],['Відгуки','#'],['Контакти','#']],
  luxury:[['Колекції','#'],['Про бренд','#'],['Lookbook','#'],['Сервіс','#'],['Контакти','#']],
  industrial:[['Каталог','#'],['Рішення','#'],['Доставка','#'],['Партнерам','#'],['Контакти','#']],
  creative:[['Про студію','#'],['Проєкти','#'],['Послуги','#'],['Журнал','#'],['Контакти','#']],
  outdoor:[['Снасті','#'],['Одяг','#'],['Новинки','#'],['Поради','#'],['Контакти','#']],
  premium:[['Головна','#'],['Послуги','#'],['Про нас','#'],['Переваги','#'],['Контакти','#']]
 };
 return map[ctx.archetype]||map.premium;
}
function defaultButtonLabel00978_(ctx){
 const map={market:'До каталогу',search:'Почати пошук',medical:'Записатися',saas:'Почати зараз',cosmic:'Launch now',food:'Замовити',education:'Обрати курс',luxury:'Discover',industrial:'Отримати прайс',creative:'Переглянути кейси',outdoor:'До магазину',premium:'Зв’язатися'};
 return map[ctx.archetype]||'Зв’язатися';
}
function searchPlaceholder00978_(ctx){
 const map={market:'Пошук товарів',search:'Куди прямуємо?',medical:'Знайти послугу',saas:'Пошук можливостей',cosmic:'Пошук рішень',food:'Що замовимо?',education:'Знайти програму',luxury:'Пошук колекцій',industrial:'Пошук інструментів',creative:'Пошук проєктів',outdoor:'Пошук снастей',premium:'Пошук'};
 return map[ctx.archetype]||'Пошук';
}

function makeContext00978_(pair){
 const a=ASSIGNMENTS_00978[pair.no]; if(!a) throw new Error(`00978 assignment missing ${pair.no}`);
 const family=family00978_(a[0]); const recipe=getHeaderFooterVisualRecipeByNo00969(pair.no);
 if(!family||!recipe) throw new Error(`00978 family/recipe missing ${pair.no}`);
 const t=pair.theme; const theme=detectTheme00978_(pair,family);
 return {pair,family,variant:a[1],recipe,t,counters:{section:0,level:0,container:0,block:0},
  text:recipe.rootColor||t.colors.text,muted:t.colors.muted||t.colors.text,accent:t.colors.accent,primary:t.colors.primary,
  compositionId:`header-${family.slug}-${a[1].toLowerCase()}-${pair.no}`,archetype:theme.archetype,topic:theme.topic};
}
function nextId00978_(ctx,k){ctx.counters[k]=(ctx.counters[k]||0)+1;return `hf${ctx.pair.no}_header_${k}_${String(ctx.counters[k]).padStart(3,'0')}`;}
function n00978_(ctx,type,tag,id,attrs={},style={},children=[]){
 const a={...attrs};
 if(id&&['section','level','container','block'].includes(type)){
  a['data-node-id']=id;a['data-hf-node-type']=type;a['data-hf-template-id']=ctx.pair.headerTemplateId;a['data-hf-authored-template']=AUTHORED_VERSION_00978;
 }
 return {type,tag,...(id?{id}:{}),attrs:a,style:{...style},styleText:styleText00978_(style),children};
}
function txt00978_(s){return {type:'text',text:String(s??'')};}
function editable00978_(ctx,s,cls='st-text-edit',style={}){return n00978_(ctx,'element','span','',{class:cls,contenteditable:'true',draggable:'true',spellcheck:'false','data-st-text-target':'1'},style,[txt00978_(s)]);}
function root00978_(ctx,children,style={}){return n00978_(ctx,'section','section',nextId00978_(ctx,'section'),{
 class:`st-section hf00978-header hf00978-family-${ctx.family.id} hf00978-variant-${ctx.variant}`,'data-sec-role':'header',role:'banner','data-hf-json-template':'1',
 'data-hf-style-pair-id':ctx.pair.pairId,'data-hf-style-pair-no':ctx.pair.no,'data-hf-header-family':ctx.family.id,'data-hf-header-composition':ctx.compositionId
 },{width:'100%','box-sizing':'border-box',margin:'0',padding:'10px 14px',background:ctx.recipe.rootBackground,color:ctx.text,border:ctx.recipe.rootBorder||`1px solid ${ctx.t.colors.border}`,
 'border-radius':ctx.recipe.rootRadius||ctx.t.radius.lg,'box-shadow':ctx.recipe.rootShadow||ctx.t.shadow.soft,'backdrop-filter':ctx.recipe.rootBackdropFilter||'none',overflow:'visible',position:'relative',isolation:'isolate',
 'font-family':ctx.t.typography.textFont,container:'hf00978-header / inline-size','--hf00978-text':ctx.text,'--hf00978-muted':ctx.muted,'--hf00978-accent':ctx.accent,
 '--hf00978-panel':panel00978_(ctx),'--hf00978-panel-text':panelText00978_(ctx),'--hf00978-border':ctx.t.colors.border,'--hf00978-menu-hover-bg':ctx.t.menu.hoverBg,'--hf00978-menu-hover-text':ctx.t.menu.hoverText,
 '--hf00978-btn-hover-bg':ctx.t.buttons.primaryHoverBg,'--hf00978-btn-hover-text':ctx.t.buttons.primaryHoverText,'--hf00978-icon-hover-bg':ctx.t.icons.hoverBg,'--hf00978-icon-hover-text':ctx.t.icons.hoverColor,...style},children);}
function level00978_(ctx,name,children,style={},cls=''){return n00978_(ctx,'level','div',nextId00978_(ctx,'level'),{class:`st-row hf00978-level ${cls}`.trim(),'data-st-node':'level','data-layout-mode':'fr','data-layout-orient':'row','data-name':name},{width:'100%','min-width':'0','max-width':'100%',margin:'0 auto','box-sizing':'border-box',...style},children);}
function box00978_(ctx,name,children,style={},cls=''){return n00978_(ctx,'container','div',nextId00978_(ctx,'container'),{class:`st-block hf00978-box ${cls}`.trim(),'data-st-node':'container','data-layout-mode':'flex','data-layout-orient':style['flex-direction']==='column'?'column':'row','data-name':name},{width:'100%','min-width':'0','max-width':'100%',display:'flex','align-items':'center',gap:'10px',background:'transparent',border:'0',padding:'0','box-sizing':'border-box',...style},children);}
function block00978_(ctx,name,role,children,style={},cls=''){return n00978_(ctx,'block','div',nextId00978_(ctx,'block'),{class:`hb-elem st-block ${cls}`.trim(),'data-block-kind':role,'data-block-role':role,'data-name':name,'data-hb-tip':name},{min:'0',width:'auto','min-width':'0','max-width':'100%',background:'transparent',border:'0',padding:'0','box-sizing':'border-box',...style},children);}
function iconSvg00978_(kind){
 const n=(tag,attrs,children=[])=>({type:'element',tag,attrs,style:{},styleText:'',children}); const p=(d)=>n('path',{d}); const c=(cx,cy,r)=>n('circle',{cx:String(cx),cy:String(cy),r:String(r)});
 const s=n('svg',{'aria-hidden':'true',fill:'none',stroke:'currentColor','stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',viewbox:'0 0 24 24'});
 if(kind==='phone')s.children=[p('M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 22 16.92z')];
 else if(kind==='search')s.children=[c(11,11,7),p('m20 20-3.5-3.5')];
 else if(kind==='user')s.children=[p('M20 21a8 8 0 0 0-16 0'),c(12,7,4)];
 else if(kind==='cart')s.children=[p('M3 3h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 6H6'),c(10,20,1),c(18,20,1)];
 else if(kind==='menu')s.children=[p('M4 7h16'),p('M4 12h16'),p('M4 17h16')];
 else if(kind==='arrow')s.children=[p('M5 12h14'),p('m13 6 6 6-6 6')];
 else if(kind==='spark')s.children=[p('m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z')];
 else if(kind==='pin')s.children=[p('M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z'),c(12,10,3)];
 else s.children=[p('M5 12h14')];
 return s;
}
function logo00978_(ctx,{compact=false,center=false,wordmark=false}={}){
 const fallbackIcon=(ctx.archetype==='market')?'cart':(ctx.archetype==='medical')?'spark':(ctx.archetype==='search')?'search':(ctx.archetype==='cosmic')?'spark':'spark';
 const icon=clone00978_(ctx.recipe.logoIcon||iconSvg00978_(fallbackIcon)); icon.style={...(icon.style||{}),width:compact?'18px':'22px',height:compact?'18px':'22px'};icon.styleText=styleText00978_(icon.style);
 const markBg=ctx.archetype==='cosmic' ? `linear-gradient(135deg, ${ctx.accent}, ${soft00978_(ctx,.18)})` : (ctx.t.icons.logoBg||soft00978_(ctx,.08));
 const mark=n00978_(ctx,'element','span','',{class:'hf00978-logo-mark','aria-hidden':'true'},{width:compact?'38px':'46px',height:compact?'38px':'46px',display:wordmark?'none':'grid','place-items':'center','border-radius':markRadius00978_(ctx),background:markBg,color:ctx.archetype==='cosmic'?'#fff':ctx.accent,border:`${ctx.t.icons.logoBorderWidth||'1px'} solid ${ctx.t.icons.logoBorderColor||ctx.t.colors.border}`,flex:'0 0 auto','box-shadow':ctx.family.id==='F18'||ctx.family.id==='F10'?ctx.t.shadow.soft:'none'},[icon]);
 return block00978_(ctx,'Лого','text',[mark,n00978_(ctx,'element','div','',{class:'hf00978-logo-copy'},{display:'flex','flex-direction':'column',gap:'3px','min-width':'0','text-align':center?'center':'left'},[
  editable00978_(ctx,ctx.pair.brandTitle||ctx.pair.shortName,'st-text-edit st-logo__title',{display:'block',color:'inherit','font-size':compact?'20px':ctx.t.typography.logoTitleSize,'font-family':titleFont00978_(ctx),'font-weight':ctx.archetype==='luxury'?'700':ctx.t.typography.logoTitleWeight,'line-height':'1.02','letter-spacing':ctx.archetype==='luxury'?'-.02em':ctx.t.typography.logoTitleLetterSpacing,'white-space':'nowrap'}),
  editable00978_(ctx,compact?(ctx.pair.shortName||topicBadge00978_(ctx)):(ctx.pair.brandSubtitle||topicBadge00978_(ctx)),'st-text-edit st-logo__subtitle',{display:'block',color:ctx.accent,'font-size':'10px','font-weight':'800','line-height':'1.15','letter-spacing':'.10em','text-transform':'uppercase','white-space':'nowrap'})
 ])],{display:'flex','align-items':'center','justify-content':center?'center':'flex-start',gap:'10px',color:'inherit'},'st-block--text st-block--logo hf00978-logo');
}

function menu00978_(ctx,{align='center',compact=false,underline=false}={}){
 const items=((ctx.recipe.menuItems&&ctx.recipe.menuItems.length)?ctx.recipe.menuItems:defaultMenuItems00978_(ctx)).slice(0,6);
 const pillMode=!underline && ['market','cosmic','luxury','outdoor'].includes(ctx.archetype);
 const minimalMode=underline || ['medical','education','premium'].includes(ctx.archetype);
 const lis=items.map(([label,href],idx)=>n00978_(ctx,'element','li','',{class:'st-menu__item','data-menu-depth':'1'},{flex:'0 0 auto'},[
  n00978_(ctx,'element','a','',{class:'st-menu__link st-block st-block--menu-item hf00978-menu-link','data-st-menu-item':'1',href:href||'#'},{display:'inline-flex','align-items':'center','justify-content':'center','min-height':compact?'30px':'36px',padding:minimalMode?(compact?'5px 3px':'7px 4px'):(compact?'6px 10px':'8px 12px'),'border-radius':minimalMode?'0':(pillMode?'999px':ctx.t.menu.radius),background:minimalMode?'transparent':(idx===0&&ctx.archetype==='market'?soft00978_(ctx,.14):ctx.t.menu.itemBg),color:ctx.t.menu.text,border:minimalMode?'0':`${ctx.t.menu.itemBorderWidth} solid ${ctx.t.menu.itemBorderColor}`,'border-bottom':minimalMode?`2px solid transparent`:'','font-size':compact?'12px':ctx.t.menu.fontSize,'font-weight':ctx.archetype==='luxury'?'700':ctx.t.menu.fontWeight,'line-height':'1.1','text-decoration':'none','white-space':'nowrap','--hf00978-local-hover-bg':minimalMode?'transparent':ctx.t.menu.hoverBg,'--hf00978-local-hover-text':ctx.t.menu.hoverText},[editable00978_(ctx,label,'st-menu__text',{'white-space':'nowrap',color:'inherit','font':'inherit'})])
 ]));
 return block00978_(ctx,'Меню','menu',[n00978_(ctx,'element','nav','',{'aria-label':'Main navigation',class:'st-menu st-menu--big'},{width:'100%','min-width':'0'},[n00978_(ctx,'element','ul','',{class:'st-menu__list','data-menu-list-depth':'1'},{display:'flex','align-items':'center','justify-content':align,gap:compact?'6px':ctx.t.spacing.menuGap,'flex-wrap':'wrap','list-style':'none',margin:'0',padding:'0'},lis)])],{width:'100%',display:'flex','justify-content':align,color:ctx.t.menu.text,'--st-menu-link-color':ctx.t.menu.text,'--st-menu-link-color-h':ctx.t.menu.hoverText,'--st-menu-l1-color':ctx.t.menu.text,'--st-menu-l1-h-color':ctx.t.menu.hoverText,'--st-menu-l1-bg':ctx.t.menu.itemBg,'--st-menu-l1-h-bg':ctx.t.menu.hoverBg},'st-block--menu hf00978-menu');
}

function phone00978_(ctx,{large=false,label=false,invert=false}={}){
 const color=invert?featureText00978_(ctx):ctx.t.blocks.contactText||ctx.text; const bg=invert?ctx.recipe.featureBackground:ctx.t.blocks.contactBg;
 const svg=iconSvg00978_('phone');svg.style={width:large?'19px':'16px',height:large?'19px':'16px'};svg.styleText=styleText00978_(svg.style);
 const prefix=label?((ctx.archetype==='medical')?'Call center · ':'Support · '):'';
 return block00978_(ctx,'Телефон','link',[n00978_(ctx,'element','a','',{href:'tel:+380000000000',class:'hf00978-phone','aria-label':'Телефон'},{display:'inline-flex','align-items':'center',gap:'8px',width:'auto','max-width':'100%','min-height':large?'44px':'36px',padding:large?'9px 14px':'7px 11px',background:bg,color,border:`${ctx.t.blocks.contactBorderWidth||'1px'} solid ${ctx.t.blocks.contactBorderColor||ctx.t.colors.border}`,'border-radius':ctx.t.blocks.contactRadius||ctx.t.radius.pill,'text-decoration':'none','font-size':large?'clamp(15px,1.6vw,22px)':ctx.t.blocks.contactFontSize,'font-weight':'850','line-height':'1','white-space':'nowrap','word-break':'normal','overflow-wrap':'normal','box-sizing':'border-box'},[svg,txt00978_(prefix),txt00978_('+38 000 000 00 00')])],{display:'flex','align-items':'center',width:'auto',flex:'0 0 auto'},'st-block--link hf00978-phone-block');
}

function button00978_(ctx,label=ctx.pair.ctaLabel||defaultButtonLabel00978_(ctx),{secondary=false,square=false}={}){
 const b=ctx.t.buttons;const bg=secondary?b.secondaryBg:b.primaryBg;const fg=secondary?b.secondaryText:b.primaryText;const svg=iconSvg00978_('arrow');svg.style={width:'17px',height:'17px'};svg.styleText=styleText00978_(svg.style);
 return block00978_(ctx,label,'button',[n00978_(ctx,'element','a','',{href:'#contact',class:'hf00978-button'},{display:'inline-flex','align-items':'center','justify-content':'center',gap:'8px','min-height':'42px',padding:`${b.paddingY} ${b.paddingX}`,background:bg,color:fg,border:`${secondary?b.secondaryBorderWidth:b.primaryBorderWidth} solid ${secondary?b.secondaryBorderColor:b.primaryBorderColor}`,'border-radius':square?'0':(['luxury','market'].includes(ctx.archetype)?'999px':b.radius),'box-shadow':secondary?'none':b.shadow,'font-size':b.fontSize,'font-weight':b.fontWeight,'line-height':'1','text-decoration':'none','white-space':'nowrap','--hf00978-local-btn-hover-bg':secondary?b.secondaryHoverBg:b.primaryHoverBg,'--hf00978-local-btn-hover-text':secondary?b.secondaryHoverText:b.primaryHoverText},[editable00978_(ctx,label,'st-text-edit st-button__label',{'white-space':'nowrap',color:'inherit'}),svg])],{display:'flex',width:'auto',flex:'0 0 auto'},'st-block--button');
}

function iconActions00978_(ctx,{count=2,square=false}={}){
 const baseKinds=ctx.archetype==='market' ? ['search','user','cart'] : ['search','user','cart'];
 const kinds=baseKinds.slice(0,Math.max(count,ctx.archetype==='market'?3:count));
 return box00978_(ctx,'Іконки',kinds.map(kind=>{const svg=iconSvg00978_(kind);svg.style={width:'18px',height:'18px'};svg.styleText=styleText00978_(svg.style);const badge=(kind==='cart'&&ctx.archetype==='market')?n00978_(ctx,'element','span','',{'aria-hidden':'true'},{position:'absolute',top:'-4px',right:'-4px',display:'grid','place-items':'center',width:'18px',height:'18px','border-radius':'999px',background:ctx.accent,color:'#fff','font-size':'10px','font-weight':'800',border:`1px solid ${ctx.t.colors.border}`},[txt00978_('2')]):null;return n00978_(ctx,'element','button','',{type:'button',class:'hf00978-icon-button','aria-label':kind},{position:'relative',width:'40px',height:'40px',display:'grid','place-items':'center',padding:'0',background:ctx.t.icons.bg,color:ctx.t.icons.color,border:`${ctx.t.icons.borderWidth} solid ${ctx.t.icons.borderColor}`,'border-radius':square?'0':(['market','cosmic','luxury'].includes(ctx.archetype)?'999px':ctx.t.icons.radius),'box-sizing':'border-box'},badge?[svg,badge]:[svg]);}),{display:'flex',width:'auto',flex:'0 0 auto','flex-wrap':'nowrap'},'hf00978-actions');
}

function textLine00978_(ctx,text,{small=false,serif=false,center=false,color='inherit',upper=false}={}){return block00978_(ctx,text,'text',[editable00978_(ctx,text,'st-text-edit',{color:'inherit','white-space':'normal'})],{width:'100%',color,'font-size':small?'11px':'14px','font-weight':small?'800':'700','line-height':'1.25','letter-spacing':small?'.08em':'0','text-transform':upper?'uppercase':'none','font-family':serif?serif00978_():'inherit','text-align':center?'center':'left'},'st-block--text hf00978-copy');}
function title00978_(ctx,text,{size='28px',serif=false,center=false,color='inherit',upper=false}={}){return block00978_(ctx,text,'text',[editable00978_(ctx,text,'st-text-edit',{color:'inherit','white-space':'normal'})],{width:'100%',color,'font-size':size,'font-weight':serif?'650':'900','line-height':'.98','letter-spacing':'-.04em','font-family':serif?serif00978_():'inherit','text-align':center?'center':'left','text-transform':upper?'uppercase':'none'},'st-block--text st-block--heading hf00978-title');}
function announcement00978_(ctx,text,{accent=false}={}){return level00978_(ctx,'Announcement',[textLine00978_(ctx,text,{small:true,center:true,color:accent?featureText00978_(ctx):'inherit',upper:true})],{padding:'8px 14px',background:accent?ctx.recipe.featureBackground:panel00978_(ctx),color:accent?featureText00978_(ctx):panelText00978_(ctx),'border-radius':ctx.t.radius.md},'hf00978-announcement');}
function search00978_(ctx,{wide=false}={}){const svg=iconSvg00978_('search');svg.style={width:'17px',height:'17px'};svg.styleText=styleText00978_(svg.style);const chip=(ctx.archetype==='market')?n00978_(ctx,'element','span','',{'aria-hidden':'true'},{display:'inline-flex','align-items':'center','justify-content':'center',padding:'5px 9px','border-radius':'999px',background:soft00978_(ctx,.12),color:panelText00978_(ctx),'font-size':'11px','font-weight':'700','white-space':'nowrap'},[txt00978_('Всі категорії')]):null;return block00978_(ctx,'Пошук','search',[n00978_(ctx,'element','div','',{class:'hf00978-search','aria-label':'Пошук'},{display:'flex','align-items':'center',gap:'8px',width:wide?'100%':'min(360px,100%)','min-height':'42px',padding:'8px 12px',background:panel00978_(ctx),color:panelText00978_(ctx),border:`1px solid ${ctx.t.colors.border}`,'border-radius':'999px','box-sizing':'border-box'},chip?[chip,svg,txt00978_(searchPlaceholder00978_(ctx))]:[svg,txt00978_(searchPlaceholder00978_(ctx))])],{width:wide?'100%':'auto',display:'flex','justify-content':'center'},'hf00978-search-block');}

function deco00978_(ctx,shape='line'){if(shape==='dot')return n00978_(ctx,'element','span','',{'aria-hidden':'true',class:'hf00978-deco-dot'},{width:'10px',height:'10px','border-radius':'50%',background:ctx.accent,display:'block'},[]);if(shape==='square')return n00978_(ctx,'element','span','',{'aria-hidden':'true',class:'hf00978-deco-square'},{width:'18px',height:'18px',border:`2px solid ${ctx.accent}`,display:'block'},[]);return n00978_(ctx,'element','span','',{'aria-hidden':'true',class:'hf00978-deco-line'},{width:'100%',height:'1px',background:ctx.t.colors.border,display:'block'},[]);}
function visualPanel00978_(ctx,{height='74px',round=true}={}){return box00978_(ctx,'Visual',[deco00978_(ctx,'dot'),textLine00978_(ctx,ctx.pair.shortName,{small:true,upper:true})],{width:'160px','min-height':height,display:'flex','flex-direction':'column','align-items':'flex-start','justify-content':'space-between',padding:'14px',background:ctx.recipe.rootBackground,'background-size':'cover','background-position':'center',color:ctx.text,border:`1px solid ${ctx.t.colors.border}`,'border-radius':round?ctx.t.radius.lg:'0',flex:'0 0 auto'},'hf00978-visual');}

function familyF01_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Corporate row',[logo00978_(ctx),menu00978_(ctx,{underline:true}),phone00978_(ctx),button00978_(ctx)],{display:'grid','grid-template-columns':'minmax(180px,.8fr) minmax(300px,1.5fr) auto auto','align-items':'center',gap:'16px'},'hf00978-grid')]);
 if(ctx.variant==='B')return root00978_(ctx,[announcement00978_(ctx,'Працюємо по всій Україні'),level00978_(ctx,'Corporate main',[logo00978_(ctx,{compact:true}),menu00978_(ctx,{compact:true}),box00978_(ctx,'Right',[phone00978_(ctx),iconActions00978_(ctx,{count:1})],{width:'auto'} )],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'18px',padding:'8px 0'},'hf00978-grid')]);
 return root00978_(ctx,[level00978_(ctx,'Brand utility',[logo00978_(ctx),box00978_(ctx,'Utility',[textLine00978_(ctx,'B2B · Strategy · Support',{small:true,upper:true}),phone00978_(ctx)],{width:'auto','justify-content':'flex-end'})],{display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'20px',padding:'4px 0 10px'},'hf00978-grid'),level00978_(ctx,'Nav rail',[menu00978_(ctx,{align:'flex-start',underline:true}),button00978_(ctx)],{display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'18px',padding:'10px 0 2px','border-top':`1px solid ${ctx.t.colors.border}`},'hf00978-grid')]);
}
function familyF02_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[announcement00978_(ctx,'Новий проєкт · старт цього місяця',{accent:true}),level00978_(ctx,'CTA header',[logo00978_(ctx),menu00978_(ctx),button00978_(ctx,'Почати')],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'20px',padding:'8px 0'},'hf00978-grid')]);
 if(ctx.variant==='B')return root00978_(ctx,[level00978_(ctx,'Action stage',[box00978_(ctx,'Pitch',[textLine00978_(ctx,'READY TO BUILD?',{small:true,upper:true}),title00978_(ctx,'Let’s start.',{size:'32px'})],{'flex-direction':'column','align-items':'flex-start',gap:'4px'}),button00978_(ctx)],{display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'20px',padding:'14px 16px',background:ctx.recipe.featureBackground,color:featureText00978_(ctx),'border-radius':ctx.t.radius.lg},'hf00978-grid'),level00978_(ctx,'Nav dock',[logo00978_(ctx,{compact:true}),menu00978_(ctx,{compact:true}),phone00978_(ctx)],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'18px',padding:'9px 0 0'},'hf00978-grid')]);
 return root00978_(ctx,[level00978_(ctx,'Left action',[box00978_(ctx,'CTA',[title00978_(ctx,'Talk to us',{size:'26px'}),button00978_(ctx,'Запит')],{'flex-direction':'column','align-items':'flex-start',gap:'8px',padding:'14px',background:ctx.recipe.featureBackground,color:featureText00978_(ctx),'border-radius':ctx.t.radius.lg}),box00978_(ctx,'Directory',[logo00978_(ctx,{compact:true}),menu00978_(ctx,{align:'flex-start',compact:true})],{'flex-direction':'column','align-items':'stretch',gap:'8px'}),iconActions00978_(ctx,{count:2})],{display:'grid','grid-template-columns':'.55fr 1.35fr auto','align-items':'center',gap:'16px'},'hf00978-grid')]);
}
function familyF03_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Split',[box00978_(ctx,'Brand panel',[logo00978_(ctx),textLine00978_(ctx,'Independent digital studio',{small:true})],{'flex-direction':'column','align-items':'flex-start',padding:'13px 16px',background:ctx.recipe.featureBackground,color:featureText00978_(ctx),'border-radius':ctx.t.radius.lg}),box00978_(ctx,'Content',[menu00978_(ctx,{align:'flex-end'}),box00978_(ctx,'Actions',[phone00978_(ctx),button00978_(ctx)],{width:'auto','justify-content':'flex-end'})],{'flex-direction':'column','align-items':'stretch',gap:'8px'})],{display:'grid','grid-template-columns':'.42fr .58fr',gap:'14px'},'hf00978-grid')]);
 if(ctx.variant==='B')return root00978_(ctx,[level00978_(ctx,'Reverse split',[box00978_(ctx,'Main',[logo00978_(ctx,{compact:true}),menu00978_(ctx,{align:'flex-start',underline:true})],{'flex-direction':'column','align-items':'stretch',gap:'8px',padding:'10px 14px'}),box00978_(ctx,'Contact rail',[phone00978_(ctx,{large:true}),iconActions00978_(ctx,{count:2})],{'flex-direction':'column','align-items':'stretch',padding:'12px',background:panel00978_(ctx),color:panelText00978_(ctx),'border-radius':ctx.t.radius.lg})],{display:'grid','grid-template-columns':'1.35fr .65fr',gap:'12px'},'hf00978-grid')]);
 if(ctx.variant==='C')return root00978_(ctx,[level00978_(ctx,'Editorial split',[box00978_(ctx,'Mast',[textLine00978_(ctx,'28 / DIRECTORY',{small:true,upper:true}),title00978_(ctx,ctx.pair.brandTitle,{size:'34px',serif:true})],{'flex-direction':'column','align-items':'flex-start'}),menu00978_(ctx,{align:'center',compact:true}),box00978_(ctx,'Contact',[phone00978_(ctx),button00978_(ctx,'Open')],{width:'auto','justify-content':'flex-end'})],{display:'grid','grid-template-columns':'.8fr 1.3fr auto','align-items':'center',gap:'18px'},'hf00978-grid')]);
 return root00978_(ctx,[level00978_(ctx,'Vertical mast',[visualPanel00978_(ctx,{height:'96px',round:false}),box00978_(ctx,'Directory',[logo00978_(ctx,{wordmark:true}),menu00978_(ctx,{align:'flex-start',compact:true}),textLine00978_(ctx,'DESIGN / CONTACT / WORK',{small:true,upper:true})],{'flex-direction':'column','align-items':'stretch',gap:'7px'}),phone00978_(ctx,{large:true})],{display:'grid','grid-template-columns':'160px 1fr auto','align-items':'center',gap:'18px'},'hf00978-grid')]);
}
function familyF04_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Premium center',[box00978_(ctx,'Center',[logo00978_(ctx,{center:true,wordmark:true}),menu00978_(ctx,{align:'center',underline:true}),iconActions00978_(ctx,{count:2})],{'flex-direction':'column','align-items':'center',gap:'9px'})],{padding:'6px 0'},'hf00978-center')]);
 if(ctx.variant==='B')return root00978_(ctx,[level00978_(ctx,'Orbit',[textLine00978_(ctx,'EST. 2026',{small:true,upper:true}),box00978_(ctx,'Center',[logo00978_(ctx,{center:true}),menu00978_(ctx,{align:'center',compact:true})],{'flex-direction':'column','align-items':'center',gap:'6px'}),phone00978_(ctx)],{display:'grid','grid-template-columns':'1fr 1.4fr 1fr','align-items':'center',gap:'16px'},'hf00978-grid')]);
 return root00978_(ctx,[level00978_(ctx,'Premium triptych',[menu00978_(ctx,{align:'flex-start',compact:true,underline:true}),logo00978_(ctx,{center:true,wordmark:true}),box00978_(ctx,'Right',[phone00978_(ctx),button00978_(ctx,'Contact')],{width:'auto','justify-content':'flex-end'})],{display:'grid','grid-template-columns':'1fr auto 1fr','align-items':'center',gap:'24px',padding:'8px 0'},'hf00978-grid')]);
}
function familyF05_(ctx){
 const card=(name,children,style={})=>box00978_(ctx,name,children,{padding:'10px 12px',background:panel00978_(ctx),color:panelText00978_(ctx),border:`1px solid ${ctx.t.colors.border}`,'border-radius':ctx.t.radius.lg,...style},'hf00978-card');
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Cards',[card('Brand',[logo00978_(ctx,{compact:true})]),card('Menu',[menu00978_(ctx,{compact:true})],{'grid-column':'span 2'}),card('Action',[button00978_(ctx)])],{display:'grid','grid-template-columns':'.8fr 1fr 1fr auto',gap:'10px'},'hf00978-grid')]);
 if(ctx.variant==='B')return root00978_(ctx,[level00978_(ctx,'Cards staggered',[card('Brand',[logo00978_(ctx)]),card('Search',[search00978_(ctx,{wide:true})]),card('Contact',[phone00978_(ctx)]),card('Menu',[menu00978_(ctx,{align:'flex-start',compact:true})],{'grid-column':'2 / span 2'})],{display:'grid','grid-template-columns':'1fr 1fr 1fr',gap:'9px'},'hf00978-grid')]);
 if(ctx.variant==='C')return root00978_(ctx,[level00978_(ctx,'Mosaic',[card('Logo',[logo00978_(ctx,{compact:true})],{'grid-row':'span 2'}),card('Menu',[menu00978_(ctx,{compact:true})],{'grid-column':'span 2'}),card('Phone',[phone00978_(ctx)]),card('Icons',[iconActions00978_(ctx,{count:3})]),card('CTA',[button00978_(ctx,'Explore')])],{display:'grid','grid-template-columns':'.8fr 1.2fr .8fr auto',gap:'8px'},'hf00978-grid')]);
 return root00978_(ctx,[level00978_(ctx,'Dashboard cards',[card('Wordmark',[logo00978_(ctx,{wordmark:true})]),card('Index',[textLine00978_(ctx,'01 / 02 / 03',{small:true,upper:true})]),card('Tools',[iconActions00978_(ctx,{count:2})])],{display:'grid','grid-template-columns':'1fr auto auto',gap:'10px',padding:'0 0 8px'},'hf00978-grid'),level00978_(ctx,'Feature card',[card('Navigation',[menu00978_(ctx,{align:'flex-start'}),phone00978_(ctx),button00978_(ctx)],{display:'grid','grid-template-columns':'1fr auto auto','align-items':'center',gap:'14px'})],{},'hf00978-feature')]);
}
function familyF06_(ctx){
 const b=(name,children,style={})=>box00978_(ctx,name,children,{padding:'10px',background:panel00978_(ctx),color:panelText00978_(ctx),border:`1px solid ${ctx.t.colors.border}`,'border-radius':ctx.t.radius.lg,...style},'hf00978-bento');
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Bento',[b('Brand',[logo00978_(ctx)],{'grid-column':'span 2'}),b('Phone',[phone00978_(ctx)]),b('Menu',[menu00978_(ctx,{compact:true})],{'grid-column':'span 2'}),b('Social',[iconActions00978_(ctx,{count:2})])],{display:'grid','grid-template-columns':'1fr 1fr auto',gap:'8px'},'hf00978-grid')]);
 if(ctx.variant==='B')return root00978_(ctx,[level00978_(ctx,'Bento cross',[b('Logo',[logo00978_(ctx,{compact:true})]),b('Menu',[menu00978_(ctx,{compact:true})],{'grid-column':'span 2'}),b('Search',[search00978_(ctx,{wide:true})],{'grid-column':'span 2'}),b('Action',[button00978_(ctx)])],{display:'grid','grid-template-columns':'auto 1fr auto',gap:'8px'},'hf00978-grid')]);
 if(ctx.variant==='C')return root00978_(ctx,[level00978_(ctx,'Horizontal bento',[b('Wide brand',[logo00978_(ctx),textLine00978_(ctx,'Build · Launch · Improve',{small:true})],{'grid-column':'span 2'}),b('Contact',[phone00978_(ctx)]),b('Menu',[menu00978_(ctx,{align:'flex-start',compact:true})],{'grid-column':'span 2'}),b('Tools',[iconActions00978_(ctx,{count:3})])],{display:'grid','grid-template-columns':'1fr 1fr auto',gap:'9px'},'hf00978-grid')]);
 return root00978_(ctx,[level00978_(ctx,'Bento newsletter',[b('Lead',[title00978_(ctx,'Stay close',{size:'24px'}),button00978_(ctx,'Subscribe')],{'grid-row':'span 2'}),b('Brand',[logo00978_(ctx,{compact:true})]),b('Tools',[iconActions00978_(ctx,{count:2})]),b('Menu',[menu00978_(ctx,{compact:true})],{'grid-column':'span 2'})],{display:'grid','grid-template-columns':'.8fr 1.2fr auto',gap:'8px'},'hf00978-grid')]);
}
function familyF07_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Editorial mast',[textLine00978_(ctx,'VOL. 01',{small:true,upper:true}),title00978_(ctx,ctx.pair.brandTitle,{size:'42px',serif:true,center:true}),phone00978_(ctx)],{display:'grid','grid-template-columns':'1fr 1.4fr 1fr','align-items':'end',gap:'20px',padding:'2px 0 9px','border-bottom':`1px solid ${ctx.t.colors.border}`},'hf00978-grid'),level00978_(ctx,'Editorial index',[menu00978_(ctx,{align:'center',compact:true,underline:true})],{padding:'7px 0 0'})]);
 if(ctx.variant==='B')return root00978_(ctx,[level00978_(ctx,'Newspaper',[box00978_(ctx,'Issue',[textLine00978_(ctx,'ISSUE 32',{small:true,upper:true}),title00978_(ctx,'THE HEADER',{size:'28px',serif:true})],{'flex-direction':'column','align-items':'flex-start',gap:'2px'}),menu00978_(ctx,{align:'center',underline:true}),box00978_(ctx,'Meta',[textLine00978_(ctx,'Studio · Kyiv',{small:true,upper:true}),iconActions00978_(ctx,{count:1})],{width:'auto','justify-content':'flex-end'})],{display:'grid','grid-template-columns':'.7fr 1.5fr .7fr','align-items':'center',gap:'20px','border-top':`2px solid ${ctx.text}`,'border-bottom':`1px solid ${ctx.text}`,padding:'8px 0'},'hf00978-grid')]);
 return root00978_(ctx,[level00978_(ctx,'Issue index',[textLine00978_(ctx,'INDEX / 2026',{small:true,upper:true}),deco00978_(ctx),logo00978_(ctx,{wordmark:true}),deco00978_(ctx),phone00978_(ctx)],{display:'grid','grid-template-columns':'auto 1fr auto 1fr auto','align-items':'center',gap:'14px'},'hf00978-grid'),level00978_(ctx,'Issue nav',[menu00978_(ctx,{align:'flex-start',compact:true,underline:true}),button00978_(ctx,'Read')],{display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'16px',padding:'8px 0 0'},'hf00978-grid')]);
}
function familyF08_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Image split',[visualPanel00978_(ctx,{height:'78px'}),box00978_(ctx,'Content',[logo00978_(ctx,{compact:true}),menu00978_(ctx,{align:'flex-start',compact:true})],{'flex-direction':'column','align-items':'stretch',gap:'6px'}),button00978_(ctx)],{display:'grid','grid-template-columns':'180px 1fr auto','align-items':'center',gap:'16px'},'hf00978-grid')]);
 if(ctx.variant==='B')return root00978_(ctx,[level00978_(ctx,'Image band',[box00978_(ctx,'Image band',[logo00978_(ctx,{compact:true,wordmark:true})],{padding:'12px 18px',background:ctx.recipe.rootBackground,'background-size':'cover','background-position':'center',color:ctx.text,'border-radius':ctx.t.radius.lg}),menu00978_(ctx,{compact:true}),phone00978_(ctx)],{display:'grid','grid-template-columns':'.8fr 1.5fr auto','align-items':'center',gap:'14px'},'hf00978-grid')]);
 return root00978_(ctx,[level00978_(ctx,'Image top',[visualPanel00978_(ctx,{height:'66px',round:false}),box00978_(ctx,'Center',[title00978_(ctx,ctx.pair.brandTitle,{size:'26px'}),menu00978_(ctx,{align:'flex-start',compact:true,underline:true})],{'flex-direction':'column','align-items':'stretch',gap:'5px'}),iconActions00978_(ctx,{count:2})],{display:'grid','grid-template-columns':'150px 1fr auto','align-items':'center',gap:'14px'},'hf00978-grid')]);
}
function familyF09_(ctx){
 const overlay={'background-image':`linear-gradient(90deg,rgba(2,6,23,.78),rgba(2,6,23,.28)),${ctx.recipe.rootBackground}`,'background-size':'cover','background-position':'center',color:'#f8fafc',border:'1px solid rgba(255,255,255,.18)'};
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Image overlay',[logo00978_(ctx),menu00978_(ctx,{compact:true}),button00978_(ctx)],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'18px',padding:'14px',...overlay,'border-radius':ctx.t.radius.lg},'hf00978-grid')],{background:'#0b1220'});
 if(ctx.variant==='B')return root00978_(ctx,[level00978_(ctx,'Image dock',[box00978_(ctx,'Brand',[logo00978_(ctx,{compact:true}),textLine00978_(ctx,'STORY / IMAGE',{small:true,upper:true})],{'flex-direction':'column','align-items':'flex-start',padding:'12px',...overlay,'border-radius':ctx.t.radius.lg}),box00978_(ctx,'Glass',[menu00978_(ctx,{compact:true}),phone00978_(ctx)],{padding:'10px',background:'rgba(2,6,23,.54)',color:'#f8fafc',border:'1px solid rgba(255,255,255,.16)','border-radius':ctx.t.radius.lg,'backdrop-filter':'blur(10px)'})],{display:'grid','grid-template-columns':'.65fr 1.35fr',gap:'10px'},'hf00978-grid')],{background:'#050816'});
 return root00978_(ctx,[level00978_(ctx,'Image canvas',[box00978_(ctx,'Canvas',[title00978_(ctx,ctx.pair.brandTitle,{size:'32px',color:'#f8fafc'}),menu00978_(ctx,{align:'flex-start',compact:true})],{'flex-direction':'column','align-items':'stretch',gap:'8px',padding:'14px',...overlay,'border-radius':'0'}),box00978_(ctx,'Side card',[phone00978_(ctx),button00978_(ctx),iconActions00978_(ctx,{count:2})],{'flex-direction':'column','align-items':'stretch',padding:'12px',background:'rgba(255,255,255,.10)',color:'#f8fafc',border:'1px solid rgba(255,255,255,.16)','border-radius':ctx.t.radius.lg})],{display:'grid','grid-template-columns':'1fr auto',gap:'10px'},'hf00978-grid')],{background:'#050816'});
}
function familyF10_(ctx){
 const glass={background:ctx.pair.dark?'rgba(15,23,42,.62)':'rgba(255,255,255,.72)',border:`1px solid ${ctx.t.colors.border}`,'backdrop-filter':'blur(16px)','box-shadow':ctx.t.shadow.soft};
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Glass rail',[logo00978_(ctx),menu00978_(ctx,{compact:true}),iconActions00978_(ctx,{count:2}),button00978_(ctx)],{display:'grid','grid-template-columns':'auto 1fr auto auto','align-items':'center',gap:'14px',padding:'9px 12px',...glass,'border-radius':ctx.t.radius.pill},'hf00978-grid')],{background:'transparent',border:'0','box-shadow':'none'});
 if(ctx.variant==='B')return root00978_(ctx,[level00978_(ctx,'Glass double',[box00978_(ctx,'Brand glass',[logo00978_(ctx,{compact:true})],{padding:'9px 11px',...glass,'border-radius':ctx.t.radius.lg}),box00978_(ctx,'Menu glass',[menu00978_(ctx,{compact:true}),phone00978_(ctx)],{padding:'8px 10px',...glass,'border-radius':ctx.t.radius.lg}),iconActions00978_(ctx,{count:1})],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'9px'},'hf00978-grid')],{background:'transparent',border:'0','box-shadow':'none'});
 if(ctx.variant==='C')return root00978_(ctx,[announcement00978_(ctx,'SYSTEM ONLINE',{accent:false}),level00978_(ctx,'Glass side',[logo00978_(ctx),box00978_(ctx,'Rail',[search00978_(ctx,{wide:true}),menu00978_(ctx,{compact:true})],{'flex-direction':'column','align-items':'stretch',gap:'6px',padding:'8px 10px',...glass,'border-radius':ctx.t.radius.lg}),button00978_(ctx)],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'10px',padding:'8px 0 0'},'hf00978-grid')],{background:'transparent',border:'0','box-shadow':'none'});
 return root00978_(ctx,[level00978_(ctx,'Glass ticker',[textLine00978_(ctx,'DESIGN SYSTEM · FAST · CLEAR',{small:true,upper:true,center:true})],{padding:'6px 12px',...glass,'border-radius':ctx.t.radius.pill}),level00978_(ctx,'Glass panels',[box00978_(ctx,'Brand',[logo00978_(ctx,{compact:true})],{padding:'8px',...glass,'border-radius':ctx.t.radius.lg}),box00978_(ctx,'Nav',[menu00978_(ctx,{compact:true})],{padding:'8px',...glass,'border-radius':ctx.t.radius.lg}),box00978_(ctx,'Action',[phone00978_(ctx)],{padding:'8px',...glass,'border-radius':ctx.t.radius.lg})],{display:'grid','grid-template-columns':'auto 1fr auto',gap:'8px',padding:'8px 0 0'},'hf00978-grid')],{background:'transparent',border:'0','box-shadow':'none'});
}
function familyF11_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Minimal line',[logo00978_(ctx,{wordmark:true}),menu00978_(ctx,{underline:true}),phone00978_(ctx)],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'20px',padding:'4px 0 10px','border-bottom':`1px solid ${ctx.t.colors.border}`},'hf00978-grid')],{'border-radius':'0','box-shadow':'none',padding:'10px 18px'});
 return root00978_(ctx,[level00978_(ctx,'Wordmark',[title00978_(ctx,ctx.pair.brandTitle,{size:'34px'}),box00978_(ctx,'Meta',[textLine00978_(ctx,'36 / MINIMAL',{small:true,upper:true}),iconActions00978_(ctx,{count:1})],{width:'auto','justify-content':'flex-end'})],{display:'grid','grid-template-columns':'1fr auto','align-items':'end',gap:'18px',padding:'0 0 8px','border-bottom':`2px solid ${ctx.text}`},'hf00978-grid'),level00978_(ctx,'Line nav',[menu00978_(ctx,{align:'flex-start',compact:true,underline:true}),phone00978_(ctx)],{display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'18px',padding:'7px 0 0'},'hf00978-grid')],{'border-radius':'0','box-shadow':'none'});
}
function familyF12_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Contact first',[box00978_(ctx,'Call',[textLine00978_(ctx,'CALL US',{small:true,upper:true}),phone00978_(ctx,{large:true})],{'flex-direction':'column','align-items':'flex-start',gap:'4px'}),menu00978_(ctx,{align:'center',compact:true}),logo00978_(ctx,{compact:true})],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'22px'},'hf00978-grid')]);
 return root00978_(ctx,[level00978_(ctx,'Contact marquee',[phone00978_(ctx,{large:true,invert:true}),box00978_(ctx,'Identity',[logo00978_(ctx,{compact:true,wordmark:true}),textLine00978_(ctx,'Direct response studio',{small:true})],{'flex-direction':'column','align-items':'flex-start',gap:'3px'}),iconActions00978_(ctx,{count:2})],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'20px',padding:'10px 12px',background:ctx.recipe.featureBackground,color:featureText00978_(ctx),'border-radius':ctx.t.radius.lg},'hf00978-grid'),level00978_(ctx,'Secondary index',[menu00978_(ctx,{align:'flex-start',compact:true,underline:true})],{padding:'7px 0 0'})]);
}
function familyF13_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Lead header',[logo00978_(ctx),search00978_(ctx,{wide:true}),button00978_(ctx,'Підписатися'),iconActions00978_(ctx,{count:1})],{display:'grid','grid-template-columns':'auto minmax(240px,1fr) auto auto','align-items':'center',gap:'12px'},'hf00978-grid'),level00978_(ctx,'Lead nav',[menu00978_(ctx,{align:'center',compact:true,underline:true})],{padding:'6px 0 0'})]);
 return root00978_(ctx,[level00978_(ctx,'Newsletter stage',[box00978_(ctx,'Lead',[textLine00978_(ctx,'GET NEWS',{small:true,upper:true}),search00978_(ctx,{wide:true})],{'flex-direction':'column','align-items':'stretch',gap:'5px',padding:'10px',background:panel00978_(ctx),color:panelText00978_(ctx),'border-radius':ctx.t.radius.lg}),box00978_(ctx,'Brand nav',[logo00978_(ctx,{compact:true}),menu00978_(ctx,{align:'flex-start',compact:true})],{'flex-direction':'column','align-items':'stretch',gap:'6px'}),button00978_(ctx,'Join')],{display:'grid','grid-template-columns':'1fr 1fr auto','align-items':'center',gap:'12px'},'hf00978-grid')]);
}
function familyF14_(ctx){
 const groups=(ctx.recipe.menuItems||[]).slice(0,5);
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Mega top',[logo00978_(ctx),search00978_(ctx,{wide:true}),phone00978_(ctx),iconActions00978_(ctx,{count:2})],{display:'grid','grid-template-columns':'auto 1fr auto auto','align-items':'center',gap:'14px',padding:'0 0 7px'},'hf00978-grid'),level00978_(ctx,'Mega categories',[menu00978_(ctx,{align:'flex-start',compact:true})],{padding:'7px 0 0','border-top':`1px solid ${ctx.t.colors.border}`})]);
 return root00978_(ctx,[level00978_(ctx,'Mega directory',[box00978_(ctx,'Brand',[logo00978_(ctx,{compact:true}),textLine00978_(ctx,'CATALOG / SUPPORT',{small:true,upper:true})],{'flex-direction':'column','align-items':'flex-start',gap:'2px'}),box00978_(ctx,'Groups',groups.map(([x])=>textLine00978_(ctx,x,{small:true,upper:true})),{display:'grid','grid-template-columns':'repeat(3,minmax(0,1fr))',gap:'8px 16px'}),button00978_(ctx,'Catalog')],{display:'grid','grid-template-columns':'.65fr 1.4fr auto','align-items':'center',gap:'18px',padding:'10px 12px',background:panel00978_(ctx),color:panelText00978_(ctx),'border-radius':ctx.t.radius.lg},'hf00978-grid'),level00978_(ctx,'Mega nav',[menu00978_(ctx,{align:'center',compact:true,underline:true}),phone00978_(ctx)],{display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'14px',padding:'7px 0 0'},'hf00978-grid')]);
}
function familyF15_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Art direction',[box00978_(ctx,'Number',[title00978_(ctx,'15',{size:'54px',color:featureText00978_(ctx)}),textLine00978_(ctx,'ART / DIRECTION',{small:true,upper:true,color:featureText00978_(ctx)})],{'flex-direction':'column','align-items':'flex-start',padding:'8px 14px',background:ctx.recipe.featureBackground,color:featureText00978_(ctx)}),box00978_(ctx,'Poster',[logo00978_(ctx,{wordmark:true}),menu00978_(ctx,{align:'flex-start',compact:true,underline:true})],{'flex-direction':'column','align-items':'stretch',gap:'4px'}),iconActions00978_(ctx,{count:2,square:true})],{display:'grid','grid-template-columns':'110px 1fr auto','align-items':'center',gap:'16px'},'hf00978-grid')],{'border-radius':'0'});
 return root00978_(ctx,[level00978_(ctx,'Offset poster',[box00978_(ctx,'Vertical',[textLine00978_(ctx,'CREATE / 40',{small:true,upper:true}),deco00978_(ctx,'square')],{'flex-direction':'column','align-items':'center',width:'64px',padding:'8px',border:`2px solid ${ctx.text}`}),title00978_(ctx,ctx.pair.brandTitle,{size:'34px',upper:true}),menu00978_(ctx,{align:'flex-end',compact:true}),button00978_(ctx,'Open',{square:true})],{display:'grid','grid-template-columns':'64px .8fr 1.2fr auto','align-items':'center',gap:'14px'},'hf00978-grid')],{'border-radius':'0','box-shadow':'none'});
}
function familyF16_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Grounded nav',[logo00978_(ctx),menu00978_(ctx,{compact:true}),phone00978_(ctx)],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'18px',padding:'6px 0 8px'},'hf00978-grid'),level00978_(ctx,'Floating action',[button00978_(ctx,'Start now')],{display:'flex','justify-content':'center',margin:'0 0 -30px',position:'relative','z-index':'3'})],{padding:'10px 14px 30px'});
 if(ctx.variant==='B')return root00978_(ctx,[level00978_(ctx,'Float side',[logo00978_(ctx,{compact:true}),menu00978_(ctx,{align:'flex-start',underline:true}),box00978_(ctx,'Float',[button00978_(ctx,'Request')],{width:'auto',padding:'6px',background:panel00978_(ctx),color:panelText00978_(ctx),border:`1px solid ${ctx.t.colors.border}`,'border-radius':ctx.t.radius.pill,'box-shadow':ctx.t.shadow.soft})],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'16px'},'hf00978-grid')]);
 return root00978_(ctx,[level00978_(ctx,'Floating contact',[box00978_(ctx,'Contact float',[phone00978_(ctx,{large:true}),button00978_(ctx,'Book')],{width:'auto',padding:'8px',background:panel00978_(ctx),color:panelText00978_(ctx),border:`1px solid ${ctx.t.colors.border}`,'border-radius':ctx.t.radius.lg,'box-shadow':ctx.t.shadow.md}),box00978_(ctx,'Brand grid',[logo00978_(ctx),menu00978_(ctx,{align:'flex-end',compact:true})],{'flex-direction':'column','align-items':'stretch',gap:'6px'})],{display:'grid','grid-template-columns':'auto 1fr','align-items':'center',gap:'18px'},'hf00978-grid')]);
}
function familyF17_(ctx){
 if(ctx.variant==='A')return root00978_(ctx,[announcement00978_(ctx,'Free consultation · 2026',{accent:true}),level00978_(ctx,'Brand contact',[logo00978_(ctx),phone00978_(ctx),button00978_(ctx)],{display:'grid','grid-template-columns':'1fr auto auto','align-items':'center',gap:'14px',padding:'8px 0'},'hf00978-grid'),level00978_(ctx,'Navigation',[menu00978_(ctx,{align:'center',compact:true})],{padding:'7px 0 0','border-top':`1px solid ${ctx.t.colors.border}`})]);
 return root00978_(ctx,[level00978_(ctx,'Navigation first',[menu00978_(ctx,{align:'flex-start',compact:true,underline:true}),iconActions00978_(ctx,{count:2})],{display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'16px',padding:'0 0 7px'},'hf00978-grid'),level00978_(ctx,'Brand layer',[logo00978_(ctx),phone00978_(ctx)],{display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'18px',padding:'8px 0','border-top':`1px solid ${ctx.t.colors.border}`},'hf00978-grid'),level00978_(ctx,'CTA layer',[button00978_(ctx,'Start project')],{display:'flex','justify-content':'flex-end',padding:'7px 0 0','border-top':`1px solid ${ctx.t.colors.border}`})]);
}
function familyF18_(ctx){
 const dark={'background-image':`linear-gradient(90deg,rgba(0,0,0,.82),rgba(0,0,0,.28)),${ctx.recipe.rootBackground}`,'background-size':'cover','background-position':'center',color:'#fff'};
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Cinematic',[box00978_(ctx,'Brand',[textLine00978_(ctx,'18 / CINEMA',{small:true,upper:true,color:'#fff'}),title00978_(ctx,ctx.pair.brandTitle,{size:'36px',color:'#fff'})],{'flex-direction':'column','align-items':'flex-start',gap:'3px'}),menu00978_(ctx,{compact:true}),button00978_(ctx)],{display:'grid','grid-template-columns':'.8fr 1.3fr auto','align-items':'center',gap:'18px',padding:'18px',...dark,'border-radius':ctx.t.radius.lg},'hf00978-grid')],{background:'#050505',border:'0'});
 return root00978_(ctx,[level00978_(ctx,'Cinema centered',[box00978_(ctx,'Title',[textLine00978_(ctx,'FRAME / 43',{small:true,upper:true,color:'#fff'}),title00978_(ctx,ctx.pair.brandTitle,{size:'38px',center:true,color:'#fff'}),menu00978_(ctx,{align:'center',compact:true})],{'flex-direction':'column','align-items':'center',gap:'7px'}),box00978_(ctx,'Side',[phone00978_(ctx),iconActions00978_(ctx,{count:2})],{'flex-direction':'column','align-items':'stretch',width:'auto'})],{display:'grid','grid-template-columns':'1fr auto','align-items':'center',gap:'20px',padding:'16px 18px',...dark,'border-radius':ctx.t.radius.lg},'hf00978-grid')],{background:'#050505',border:'0'});
}
function familyF19_(ctx){
 const organic={background:panel00978_(ctx),color:panelText00978_(ctx),border:`1px solid ${ctx.t.colors.border}`,'border-radius':'28px 12px 28px 12px'};
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Organic',[box00978_(ctx,'Brand',[logo00978_(ctx),textLine00978_(ctx,'Calm products · clear paths',{small:true})],{'flex-direction':'column','align-items':'flex-start',gap:'3px',padding:'10px 14px',...organic}),menu00978_(ctx,{compact:true}),button00978_(ctx)],{display:'grid','grid-template-columns':'.8fr 1.4fr auto','align-items':'center',gap:'14px'},'hf00978-grid')],{'border-radius':'34px'});
 return root00978_(ctx,[level00978_(ctx,'Organic pills',[box00978_(ctx,'Identity',[logo00978_(ctx,{compact:true})],{width:'auto',padding:'8px 12px',...organic,'border-radius':'999px'}),box00978_(ctx,'Navigation',[menu00978_(ctx,{compact:true})],{padding:'6px 10px',...organic,'border-radius':'999px'}),box00978_(ctx,'Contact',[phone00978_(ctx)],{width:'auto',padding:'6px',...organic,'border-radius':'999px'})],{display:'grid','grid-template-columns':'auto 1fr auto','align-items':'center',gap:'10px'},'hf00978-grid')],{'border-radius':'40px'});
}
function familyF20_(ctx){
 const hard={border:`2px solid ${ctx.text}`,'border-radius':'0',background:'transparent','box-shadow':'none'};
 if(ctx.variant==='A')return root00978_(ctx,[level00978_(ctx,'Hard grid',[box00978_(ctx,'Brand',[logo00978_(ctx,{wordmark:true})],{padding:'10px',...hard}),box00978_(ctx,'Menu',[menu00978_(ctx,{compact:true,underline:true})],{padding:'10px',...hard}),box00978_(ctx,'Action',[button00978_(ctx,'START',{square:true})],{width:'auto',padding:'10px',...hard})],{display:'grid','grid-template-columns':'.7fr 1.5fr auto',gap:'0'},'hf00978-grid')],{'border-radius':'0','box-shadow':'none',border:`3px solid ${ctx.text}`});
 return root00978_(ctx,[level00978_(ctx,'Brutalist offset',[box00978_(ctx,'Label',[title00978_(ctx,'45',{size:'42px',upper:true}),textLine00978_(ctx,'HARD GRID',{small:true,upper:true})],{'flex-direction':'column','align-items':'flex-start',padding:'8px',...hard}),box00978_(ctx,'Brand',[logo00978_(ctx,{compact:true,wordmark:true}),phone00978_(ctx)],{'flex-direction':'column','align-items':'flex-start',gap:'6px',padding:'10px',...hard}),box00978_(ctx,'Menu',[menu00978_(ctx,{align:'flex-start',compact:true,underline:true})],{padding:'10px',...hard}),iconActions00978_(ctx,{count:2,square:true})],{display:'grid','grid-template-columns':'90px .8fr 1.2fr auto','align-items':'stretch',gap:'0'},'hf00978-grid')],{'border-radius':'0','box-shadow':'none',border:`3px solid ${ctx.text}`});
}

const BUILDERS_00978=Object.freeze({F01:familyF01_,F02:familyF02_,F03:familyF03_,F04:familyF04_,F05:familyF05_,F06:familyF06_,F07:familyF07_,F08:familyF08_,F09:familyF09_,F10:familyF10_,F11:familyF11_,F12:familyF12_,F13:familyF13_,F14:familyF14_,F15:familyF15_,F16:familyF16_,F17:familyF17_,F18:familyF18_,F19:familyF19_,F20:familyF20_});

function escA00978_(v){return String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escT00978_(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function render00978_(node){if(!node)return'';if(node.type==='text')return escT00978_(node.text||'');const tag=String(node.tag||'div').toLowerCase();const attrs={...(node.attrs||{})};if(node.styleText!=null)attrs.style=String(node.styleText);const at=Object.entries(attrs).filter(([k])=>k).map(([k,v])=>v===true||v===''?` ${k}`:` ${k}="${escA00978_(v)}"`).join('');const kids=(node.children||[]).map(render00978_).join('');if(new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']).has(tag))return`<${tag}${at}>`;return`<${tag}${at}>${kids}</${tag}>`;}

const PAIRS_00978=getHeaderFooterStylePairs00965();
const RAW_00978=PAIRS_00978.map(pair=>{
 const ctx=makeContext00978_(pair); const builder=BUILDERS_00978[ctx.family.id]; if(!builder)throw new Error(`00978 builder missing ${ctx.family.id}`);
 const rootNode=builder(ctx); const styleProfile=createPairAreaStyleProfile00965(pair,'header',pair.headerTemplateId);
 const model={version:MODEL_VERSION_00978,schema:'section-level-container-block-dom-v1',scope:'header',templateId:pair.headerTemplateId,sourcePolicy:'AUTHORED_HEADER_PREMIUM_WEB_INSPIRED_MODEL_IS_SOURCE_OF_TRUTH_00978',renderPolicy:'Preview and Applied Site render this canonical model directly; no repair/adapter.',root:rootNode};
 return {id:pair.headerTemplateId,type:'header',folderId:'fld_header',name:`${pair.no} · ${pair.name} · HEADER`,styleName:`${pair.no} · ${pair.name} · Header`,preview:`paired-header-00978-${pair.no}`,description:`Premium Paired Header ${pair.no}: ${ctx.family.name}, composition ${ctx.variant}; design DNA paired with Footer ${pair.no}.`,
  meta:{source:'system',palette:pair.palette,pairId:pair.pairId,pairNo:pair.no,pairName:pair.name,pairedFooterTemplateId:pair.footerTemplateId,pairContract:'header-footer-style-pair-v1-00978',modelContract:MODEL_VERSION_00978,singleSourceOfTruth:'model',authoredHeader00978:true,compatibleAreas:['header'],headerFamilyId:ctx.family.id,headerFamilyName:ctx.family.name,headerCompositionId:ctx.compositionId,headerCompositionVariant:ctx.variant,pairedDesignFamilyId:ctx.family.id,containerQueryAuthority00978:true,hoverContrastAuthority00978:true,phoneNowrapAuthority00978:true},
  modelVersion:MODEL_VERSION_00978,model,styleProfile,html:render00978_(rootNode)};
});

export const PAIRED_HEADER_TEMPLATES_00978=Object.freeze(RAW_00978.map(Object.freeze));
export function getPairedHeaderTemplates00978(){return PAIRED_HEADER_TEMPLATES_00978.map(clone00978_);}
