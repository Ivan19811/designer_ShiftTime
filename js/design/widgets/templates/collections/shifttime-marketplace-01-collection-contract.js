// 00981-SHIFTTIME-MARKETPLACE-01-COLLECTION-CONTRACT
// Complete Header/Main/Footer collection for the ShiftTime outdoor + home marketplace.

import {
  assertTemplateStyleProfile00945,
  TEMPLATE_STYLE_PROFILE_VERSION_00945
} from '../style-profile/template-style-profile-contract.js';

export const SHIFTTIME_MARKETPLACE_01_COLLECTION_ID_00981 = 'shifttime-marketplace-01';
export const SHIFTTIME_MARKETPLACE_01_TEMPLATE_IDS_00981 = Object.freeze({
  header: 'shifttime-marketplace-01-header',
  main: 'shifttime-marketplace-01-main',
  footer: 'shifttime-marketplace-01-footer'
});

const clone00981_ = (v) => JSON.parse(JSON.stringify(v));
function freeze00981_(v){ if(!v||typeof v!=='object'||Object.isFrozen(v)) return v; Object.freeze(v); Object.values(v).forEach(freeze00981_); return v; }

export const SHIFTTIME_MARKETPLACE_01_SHARED_THEME_00981 = freeze00981_({
  colors: {
    primary:'#101814', accent:'#9a4308', surface:'#fffaf3', surface2:'#f2ede4', text:'#141a17', muted:'#59635d', border:'#d8d0c4',
    onPrimary:'#ffffff', onAccent:'#ffffff', onSurface:'#141a17', onSurface2:'#141a17'
  },
  radius:{sm:'8px',md:'14px',lg:'24px',pill:'999px'},
  shadow:{soft:'0 14px 34px rgba(16,24,20,.10)',md:'0 28px 70px rgba(16,24,20,.18)'},
  typography:{
    headingFont:'Manrope, Inter, Arial, sans-serif', textFont:'Manrope, Inter, Arial, sans-serif',
    h1Size:'58px',h2Size:'40px',h3Size:'30px',h4Size:'24px',h5Size:'20px',h6Size:'17px',bodySize:'16px',
    textLineHeight:'1.6',headingLineHeight:'1.08',letterSpacing:'0em',headingLetterSpacing:'-.03em',headingWeight:'900',textWeight:'500',
    headingColor:'#141a17',textColor:'#141a17',logoTitleSize:'28px',logoSubtitleSize:'10px',logoTitleLineHeight:'1',logoSubtitleLineHeight:'1.2',
    logoTitleLetterSpacing:'-.025em',logoSubtitleLetterSpacing:'.11em',logoTitleWeight:'900',logoSubtitleWeight:'800',logoTitleColor:'#141a17',logoSubtitleColor:'#7c3608'
  },
  spacing:{densityPresetId:'density-comfortable',sectionPaddingY:'72px',sectionPaddingX:'24px',containerPadding:'24px',blockPaddingY:'16px',blockPaddingX:'18px',levelGap:'24px',containerGap:'20px',blockGap:'16px',menuGap:'8px'},
  sections:{bg:'#fffaf3',altBg:'#101814',text:'#141a17',altText:'#ffffff',borderWidth:'1px',borderColor:'#d8d0c4',radius:'0px',shadow:'none',overlay:'linear-gradient(180deg,rgba(16,24,20,.02),rgba(16,24,20,.08))'},
  containers:{bg:'transparent',altBg:'transparent',text:'inherit',altText:'inherit',borderWidth:'0px',borderColor:'transparent',radius:'24px',shadow:'none',overlay:'none'},
  blocks:{
    bg:'#ffffff',altBg:'#f2ede4',text:'#141a17',altText:'#141a17',borderWidth:'1px',borderColor:'#d8d0c4',radius:'14px',shadow:'0 14px 34px rgba(16,24,20,.10)',hoverShadow:'0 22px 54px rgba(16,24,20,.16)',hoverLift:'-3px',overlay:'none',
    headingBg:'#f3e3d3',headingText:'#141a17',headingBorderWidth:'1px',headingBorderColor:'#cfae8c',headingRadius:'999px',headingShadow:'none',headingPaddingY:'8px',headingPaddingX:'14px',headingFontSize:'13px',headingFontWeight:'850',headingLineHeight:'1.2',headingLetterSpacing:'.08em',headingTextTransform:'uppercase',
    contactBg:'#f2ede4',contactText:'#141a17',contactBorderWidth:'1px',contactBorderColor:'#d8d0c4',contactRadius:'14px',contactShadow:'none',contactPaddingY:'10px',contactPaddingX:'14px',contactGap:'10px',contactFontSize:'14px',contactFontWeight:'700',contactLineHeight:'1.35',contactLetterSpacing:'0em'
  },
  buttons:{
    primaryBg:'#9a4308',primaryText:'#ffffff',primaryBorderWidth:'1px',primaryBorderColor:'#9a4308',primaryHoverBg:'#743005',primaryHoverText:'#ffffff',primaryHoverBorderColor:'#743005',primaryActiveBg:'#5d2604',primaryActiveText:'#ffffff',primaryDisabledBg:'#c8c1b7',primaryDisabledText:'#3f4742',
    secondaryBg:'#101814',secondaryText:'#ffffff',secondaryBorderWidth:'1px',secondaryBorderColor:'#101814',secondaryHoverBg:'#29332e',secondaryHoverText:'#ffffff',secondaryHoverBorderColor:'#29332e',secondaryActiveBg:'#39443e',secondaryActiveText:'#ffffff',
    ghostBg:'#fffaf3',ghostText:'#141a17',ghostBorderWidth:'1px',ghostBorderColor:'#d8d0c4',ghostHoverBg:'#f2ede4',ghostHoverText:'#141a17',ghostActiveBg:'#e6ded2',ghostActiveText:'#141a17',
    iconBg:'#f2ede4',iconText:'#141a17',iconBorderWidth:'1px',iconBorderColor:'#d8d0c4',iconHoverBg:'#101814',iconHoverText:'#ffffff',iconActiveBg:'#9a4308',iconActiveText:'#ffffff',
    radius:'12px',iconRadius:'12px',shadow:'0 12px 28px rgba(154,67,8,.18)',hoverShadow:'0 18px 38px rgba(154,67,8,.24)',activeShadow:'inset 0 2px 8px rgba(16,24,20,.25)',disabledOpacity:'.55',focusRingColor:'#9a4308',focusRingWidth:'3px',focusRingOffset:'2px',fontSize:'14px',fontWeight:'850',lineHeight:'1.2',letterSpacing:'0em',paddingY:'12px',paddingX:'18px',gap:'9px'
  },
  menu:{
    text:'#141a17',hoverText:'#ffffff',activeText:'#ffffff',itemBg:'#fffaf3',hoverBg:'#101814',activeBg:'#9a4308',itemBorderWidth:'1px',itemBorderColor:'#fffaf3',hoverBorderColor:'#101814',activeBorderColor:'#9a4308',
    altText:'#ffffff',altHoverText:'#141a17',altActiveText:'#ffffff',altItemBg:'#101814',altHoverBg:'#f2ede4',altActiveBg:'#9a4308',altItemBorderColor:'#29332e',altHoverBorderColor:'#d8d0c4',altActiveBorderColor:'#9a4308',
    radius:'10px',underlineHeight:'2px',underlineOffset:'5px',indicatorStyle:'background',burgerBg:'#f2ede4',burgerColor:'#141a17',burgerRadius:'12px',mobileBg:'#fffaf3',focusRingColor:'#9a4308',focusRingWidth:'3px',focusRingOffset:'2px',fontSize:'13px',fontWeight:'750',lineHeight:'1.2',letterSpacing:'0em',paddingY:'8px',paddingX:'10px'
  },
  links:{color:'#7c3608',hoverColor:'#141a17',activeColor:'#5d2604',visitedColor:'#683006',underline:'none',underlineHover:'underline',underlineActive:'underline',underlineOffset:'3px',underlineThickness:'1px',focusRingColor:'#9a4308',focusRingWidth:'3px',focusRingOffset:'2px',fontSize:'14px',fontWeight:'700',lineHeight:'1.4',letterSpacing:'0em'},
  icons:{color:'#141a17',hoverColor:'#ffffff',activeColor:'#ffffff',bg:'#f2ede4',hoverBg:'#101814',activeBg:'#9a4308',borderWidth:'1px',borderColor:'#d8d0c4',radius:'12px',size:'20px',focusRingColor:'#9a4308',focusRingWidth:'3px',focusRingOffset:'2px',logoColor:'#9a4308',logoBg:'#f3e3d3',logoBorderWidth:'1px',logoBorderColor:'#cfae8c',logoRadius:'14px'},
  media:{overlay:'linear-gradient(90deg,rgba(6,10,8,.82),rgba(6,10,8,.22))',hoverOverlay:'linear-gradient(90deg,rgba(6,10,8,.72),rgba(6,10,8,.14))',borderWidth:'1px',borderColor:'#d8d0c4',radius:'24px',shadow:'0 24px 64px rgba(16,24,20,.18)'}
});

function profile00981_(area){
  const templateId=SHIFTTIME_MARKETPLACE_01_TEMPLATE_IDS_00981[area];
  return assertTemplateStyleProfile00945({version:TEMPLATE_STYLE_PROFILE_VERSION_00945,profileId:`${templateId}-style`,collectionId:SHIFTTIME_MARKETPLACE_01_COLLECTION_ID_00981,templateId,area,theme:clone00981_(SHIFTTIME_MARKETPLACE_01_SHARED_THEME_00981)},{templateId,area});
}
export const SHIFTTIME_MARKETPLACE_01_STYLE_PROFILES_00981=freeze00981_({header:profile00981_('header'),main:profile00981_('main'),footer:profile00981_('footer')});

export const SHIFTTIME_MARKETPLACE_01_ASSETS_00981=freeze00981_([
  ['01-hero-disc-pan-fire.webp','hero-slider','Диск-боронова сковорода зі стейками, овочами та часником над відкритим вогнем.'],
  ['02-hero-family-outdoor.webp','hero-slider','Родина готує біля багаття: сковорода, казан, тепле світло й атмосфера відпочинку.'],
  ['03-hero-home-comfort.webp','hero-slider','Преміальний чорний посуд на дерев’яному столі біля каміна — тема дому та затишку.'],
  ['04-lids-collection.webp','collection','Чорна, нержавіюча та декоративна гравійована кришки на темному дереві.'],
  ['05-engraving-premium.webp','engraving','Макрофото декоративного гравіювання на металевій кришці у вогняно-подарунковому оточенні.'],
  ['06-gift-pourers.webp','gifts','Подарунковий набір металевих наливаторів на дерев’яній підставці поруч із подарунковими коробками.'],
  ['07-cauldron-plov.webp','outdoor','Казан із пловом, м’ясом та овочами безпосередньо над жаром і полум’ям.'],
  ['08-mangal-skewers-stove.webp','outdoor','Мангал із шампурами та м’ясом, багаття й туристична пічка біля води на заході сонця.'],
  ['09-assortment-flatlay.webp','assortment','Flat-lay асортименту: сковорода, кришки, решітка, шампури, казан та аксесуари.'],
  ['10-brand-craft-workshop.webp','brand','Реміснича композиція зі сковородами, інструментами, деревом, травами та вогнем.']
].map(([fileName,role,brief],i)=>({id:`shifttime-marketplace-01-${String(i+1).padStart(2,'0')}`,path:`assets/collections/shifttime-marketplace-01/${fileName}`,fileName,role,brief,status:'ready',license:'project-owned-generated',metadataAuthority:'assets/system/manifest.json'})));

export const SHIFTTIME_MARKETPLACE_01_COLLECTION_CONTRACT_00981=freeze00981_({
  version:'st-template-collection-contract-v1-00981',collectionId:SHIFTTIME_MARKETPLACE_01_COLLECTION_ID_00981,name:'ShiftTime Marketplace — 01',category:'marketplace-outdoor-home',locale:'uk-UA',
  brand:{name:'ShiftTime',descriptor:'Товари для відпочинку, вогню та дому',fictional:false},
  lifecycle:{status:'collection-ready',visibleInGallery:true,templatesReady:true,assetsReady:true,templateReadiness:{header:true,main:true,footer:true},areaGalleryVisibility:{header:true,main:true,footer:true}},
  authority:{collectionMetadata:'this-contract',assetMetadata:'assets/system/manifest.json',styleApplication:'SiteFrameStore',runtimeAdapters:false,geometryIncluded:{header:true,main:true,footer:true}},
  templateIds:clone00981_(SHIFTTIME_MARKETPLACE_01_TEMPLATE_IDS_00981),styleProfiles:clone00981_(SHIFTTIME_MARKETPLACE_01_STYLE_PROFILES_00981),assets:clone00981_(SHIFTTIME_MARKETPLACE_01_ASSETS_00981),
  contentBlueprint:{
    header:{utility:['Графік','Безкоштовна доставка','Гарантія','Мова','Допомога','Відстежити замовлення'],search:true,commerce:['Акаунт','Обране','Порівняння','Кошик'],navigation:['Головна','Каталог','Категорії','Новинки','Акції','Подарунки','Для відпочинку','Для дому','Гравіювання','Доставка і оплата','Відгуки','Блог','Контакти']},
    main:{sections:['Hero slider','Переваги','Тематичні напрями','Промо та подарунки','Гравіювання','Для відпочинку','Для дому','Про ShiftTime','Відгуки','Блог та ідеї','Фінальний CTA']},
    footer:{columns:['Каталог','Покупцям','Про нас','Контакти','Доставка і оплата','Підписка'],socials:['Facebook','Instagram','YouTube','TikTok','Telegram']}
  }
});
