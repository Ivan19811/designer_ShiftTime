// 01034-STANDARD-PAGE-MAINS-FOLDER-PARITY
// 01033-PARSER-HOTFIX: fixed CTA sectionWrap call so the module is valid ESM in browsers.
// Standard system Main templates for common service pages of the ShiftTime marketplace.
// They reuse the established SiteFrame authoring contract: only real authored blocks,
// editable text wrappers, inline geometry/style, and project-owned assets.

import { SHIFTTIME_MARKETPLACE_02_STYLE_PROFILES_00984 } from '../collections/shifttime-marketplace-02-collection-contract-00984.js?v=00984';

const A = 'assets/collections/shifttime-marketplace-02/';
const P = Object.freeze({
  heroPan:`${A}banner-slider/banner-01-skovoridky.webp`,
  heroKazans:`${A}banner-slider/banner-02-kazany.webp`,
  heroMangal:`${A}banner-slider/banner-03-mangaly.webp`,
  heroSkewers:`${A}banner-slider/banner-04-shampury.webp`,
  heroPourers:`${A}banner-slider/banner-05-nalyvatory.webp`,
  heroAccessories:`${A}banner-slider/banner-06-aksesuary.webp`,
  kazans:`${A}real-products/01-kazany-lineup.webp`,
  kazanTripod:`${A}real-products/02-kazan-tripod.webp`,
  engravedSkewers:`${A}real-products/03-engraved-skewers.webp`,
  panCover:`${A}real-products/04-disc-pan-cover-bag.webp`,
  personalCover:`${A}real-products/05-disc-pan-personal-cover.webp`,
  panGift:`${A}real-products/06-pan-stainless-lid-gift.webp`,
  panBag:`${A}real-products/07-pan-lid-bag.webp`,
  panFamily:`${A}real-products/08-pan-family.webp`,
  panFire:`${A}real-products/09-pan-fire-cooking.webp`,
  mangalCustom:`${A}real-products/10-mangal-custom.webp`,
  engraving:`${A}lower-banner/engraving-print-covers.webp`
});

const THEME = Object.freeze({
  bg:'#fffaf3',
  bgAlt:'#f2ede4',
  panel:'#ffffff',
  panelSoft:'#fbf5ee',
  ink:'#141a17',
  muted:'#59635d',
  line:'#d8d0c4',
  accent:'#9a4308',
  accent2:'#c96a23',
  dark:'#101814',
  success:'#215f44'
});

function esc(v){ return String(v ?? '')
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;'); }

function textBlock(text, style='') {
  return `<div class="hb-elem st-block st-block--text" data-block-kind="text" style="${style}"><div class="st-text-edit" contenteditable="true" data-st-text-target="1">${esc(text)}</div></div>`;
}
function headingBlock(text, style='', level=2) {
  return `<div class="hb-elem st-block st-block--heading" data-block-kind="heading" data-heading-level="${level}" style="${style}"><div class="st-text-edit st-text-edit--heading" contenteditable="true" data-st-text-target="1" role="heading" aria-level="${level}">${esc(text)}</div></div>`;
}
function buttonBlock(text, variant='primary') {
  const map = {
    primary:`display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:12px 18px;border-radius:14px;background:${THEME.accent};color:#fff;border:1px solid ${THEME.accent};font-size:14px;font-weight:850;line-height:1.15;box-shadow:0 14px 30px rgba(154,67,8,.18);`,
    secondary:`display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:12px 18px;border-radius:14px;background:${THEME.dark};color:#fff;border:1px solid ${THEME.dark};font-size:14px;font-weight:850;line-height:1.15;`,
    ghost:`display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:12px 18px;border-radius:14px;background:${THEME.panel};color:${THEME.ink};border:1px solid ${THEME.line};font-size:14px;font-weight:850;line-height:1.15;`
  };
  return `<div class="hb-elem st-block st-block--button" data-block-kind="button" style="${map[variant] || map.primary}"><div class="st-text-edit" contenteditable="true" data-st-text-target="1">${esc(text)}</div></div>`;
}
function imageBlock(src, alt, style='') {
  return `<div class="hb-elem st-block st-block--image" data-block-kind="image" style="${style}"><img src="${src}" alt="${esc(alt)}" loading="eager" decoding="async" style="display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit;"></div>`;
}
function eyebrow(text){ return textBlock(text, `font-size:11px;font-weight:900;letter-spacing:.14em;color:${THEME.accent};text-transform:uppercase;`); }
function body(text, max='720px'){ return textBlock(text, `font-size:15px;line-height:1.65;color:${THEME.muted};max-width:${max};`); }
function sectionWrap(name, inner, bg=THEME.bg, pad='82px 0') {
  return `<section class="st-section shifttime-standard-page-main" data-name="${esc(name)}" style="width:100%;padding:${pad};background:${bg};color:${THEME.ink};box-sizing:border-box;overflow:hidden;">${inner}</section>`;
}
function level(inner, style='') {
  return `<div class="st-row" data-st-node="level" style="width:min(1280px,calc(100% - 48px));margin:0 auto;${style}">${inner}</div>`;
}
function container(inner, style='') {
  return `<div class="st-block" data-st-node="container" style="${style}">${inner}</div>`;
}
function card(inner, style='') {
  return `<div class="st-block" data-st-node="container" style="display:flex;flex-direction:column;gap:12px;padding:22px;background:${THEME.panel};border:1px solid ${THEME.line};border-radius:22px;box-shadow:0 16px 36px rgba(16,24,20,.08);${style}">${inner}</div>`;
}
function iconPill(icon){ return `<div class="hb-elem st-block st-block--icon" data-block-kind="icon" style="width:46px;height:46px;display:grid;place-items:center;border-radius:14px;background:#f3e3d3;border:1px solid #cfae8c;color:${THEME.accent};font-size:22px;">${icon}</div>`; }
function metricCard(value, label){ return card(`${headingBlock(value, `font-size:34px;font-weight:950;line-height:1;color:${THEME.ink};`, 3)}${textBlock(label, `font-size:13px;line-height:1.5;color:${THEME.muted};`)}`, 'align-items:flex-start;justify-content:space-between;min-height:142px;'); }
function featureCard(icon, title, desc){ return card(`${iconPill(icon)}${headingBlock(title, `font-size:22px;font-weight:900;line-height:1.12;color:${THEME.ink};`, 3)}${textBlock(desc, `font-size:14px;line-height:1.62;color:${THEME.muted};`)}`); }
function stepCard(num, title, desc){
  const badge = `<div class="hb-elem st-block st-block--text" data-block-kind="text" style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:linear-gradient(180deg,${THEME.accent2} 0%,${THEME.accent} 100%);color:#fff;font-size:18px;font-weight:950;box-shadow:0 16px 34px rgba(154,67,8,.22);"><div class="st-text-edit" contenteditable="true" data-st-text-target="1">${esc(num)}</div></div>`;
  return card(`${badge}${headingBlock(title, `font-size:20px;font-weight:900;line-height:1.15;color:${THEME.ink};`, 3)}${textBlock(desc, `font-size:14px;line-height:1.62;color:${THEME.muted};`)}`);
}
function qaCard(question, answer){ return card(`${headingBlock(question, `font-size:18px;font-weight:900;line-height:1.22;color:${THEME.ink};`, 3)}${textBlock(answer, `font-size:14px;line-height:1.66;color:${THEME.muted};`)}`, 'min-height:200px;'); }
function articleCard(src, tag, title, desc){
  return `<div class="st-block" data-st-node="container" style="display:flex;flex-direction:column;gap:0;background:${THEME.panel};border:1px solid ${THEME.line};border-radius:22px;overflow:hidden;box-shadow:0 16px 36px rgba(16,24,20,.08);">${imageBlock(src, title, 'width:100%;height:228px;border-radius:0;')}${container(`${textBlock(tag, `font-size:11px;font-weight:900;letter-spacing:.12em;color:${THEME.accent};text-transform:uppercase;`)}${headingBlock(title, `font-size:22px;font-weight:900;line-height:1.18;color:${THEME.ink};`, 3)}${textBlock(desc, `font-size:14px;line-height:1.62;color:${THEME.muted};`)}${textBlock('Читати далі →', `font-size:14px;font-weight:800;color:${THEME.accent};`)}`, 'display:flex;flex-direction:column;gap:12px;padding:20px;') }</div>`;
}
function heroSection(cfg){
  const media = cfg.media ? imageBlock(cfg.media.src, cfg.media.alt || cfg.title, 'width:100%;min-height:420px;height:100%;border-radius:26px;box-shadow:0 28px 70px rgba(16,24,20,.18);') : '';
  const actions = (cfg.actions || []).map((a,i)=>buttonBlock(a, i===0 ? 'primary' : 'ghost')).join('');
  const right = cfg.sideCard ? card(`${eyebrow(cfg.sideCard.eyebrow || 'SHIFTIME')}${headingBlock(cfg.sideCard.title || '', `font-size:28px;font-weight:930;line-height:1.05;color:${THEME.ink};`, 3)}${textBlock(cfg.sideCard.text || '', `font-size:14px;line-height:1.6;color:${THEME.muted};`)}${(cfg.sideCard.items||[]).map(item=>textBlock(`• ${item}`, `font-size:13px;font-weight:650;line-height:1.55;color:${THEME.ink};`)).join('')}`, `height:100%;justify-content:center;background:${THEME.panelSoft};`) : media;
  const columns = cfg.media || cfg.sideCard ? `display:grid;grid-template-columns:minmax(0,1.08fr) minmax(340px,.92fr);gap:28px;align-items:stretch;` : `display:block;`;
  return sectionWrap(cfg.name || 'Hero', level(`${container(`${eyebrow(cfg.eyebrow || 'SHIFTIME · СТОРІНКА')}${headingBlock(cfg.title, `font-size:clamp(36px,5vw,64px);font-weight:950;line-height:1.02;letter-spacing:-.04em;color:${THEME.ink};max-width:780px;`, 1)}${textBlock(cfg.desc, `font-size:16px;line-height:1.72;color:${THEME.muted};max-width:740px;`)}${actions ? container(actions, 'display:flex;flex-wrap:wrap;gap:10px;padding:8px 0 0;background:transparent;border:0;') : ''}`,'display:flex;flex-direction:column;gap:18px;justify-content:center;')}${right ? container(right,'') : ''}`, columns), cfg.bg || THEME.bg, cfg.pad || '72px 0 44px');
}
function sectionTitle(ey, title, desc='') {
  return level(container(`${ey ? eyebrow(ey) : ''}${headingBlock(title, `font-size:clamp(30px,4vw,48px);font-weight:930;line-height:1.05;letter-spacing:-.035em;color:${THEME.ink};`, 2)}${desc ? textBlock(desc, `font-size:15px;line-height:1.65;color:${THEME.muted};max-width:780px;`) : ''}`, 'display:flex;flex-direction:column;gap:12px;'), '');
}

function grid(items, cols=3, gap='16px') {
  return level(items.join(''), `display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${gap};padding-top:26px;`);
}
function ctaSection(title, desc, buttons, bgImage) {
  const bg = bgImage ? `linear-gradient(90deg,rgba(16,24,20,.82),rgba(16,24,20,.42)),url('${bgImage}') center/cover no-repeat` : THEME.dark;
  return sectionWrap('Фінальний заклик', level(container(`${eyebrow('SHIFTIME')}${headingBlock(title, `font-size:clamp(30px,4vw,50px);font-weight:940;line-height:1.04;color:#fff;max-width:780px;`, 2)}${textBlock(desc, `font-size:15px;line-height:1.65;color:rgba(255,255,255,.78);max-width:720px;`)}${container((buttons||[]).map((b,i)=>buttonBlock(b, i===0 ? 'primary' : 'ghost')).join(''), 'display:flex;flex-wrap:wrap;gap:10px;background:transparent;border:0;padding-top:8px;')}`, 'display:flex;flex-direction:column;gap:14px;padding:56px 0;')), bg, '0');
}

function buildAboutHtml(){
  return [
    heroSection({
      name:'About hero',
      eyebrow:'ПРО SHIFTIME',
      title:'Створюємо речі для вогню, відпочинку і дому',
      desc:'ShiftTime — це підбірка практичних товарів, які приємно дарувати, використовувати вдома та брати із собою на природу. Ми об’єднуємо власне виробництво, уважний відбір металу, персоналізацію та сервіс без зайвої бюрократії.',
      actions:['Перейти в каталог','Поставити запитання'],
      media:{src:P.panFire, alt:'Про ShiftTime'}
    }),
    sectionWrap('Історія', sectionTitle('НАША ІСТОРІЯ','Чому нас обирають для подарунків, відпочинку і кухні','Сторінка побудована за логікою сильних About pages: історія бренду, цінності, докази якості та чіткий наступний крок.') + level(`${container(imageBlock(P.panFamily,'Асортимент ShiftTime','width:100%;min-height:430px;height:100%;border-radius:26px;'),'')}${container(`${headingBlock('Ми не просто продаємо металеві вироби — ми збираємо готові рішення для життя.', `font-size:28px;font-weight:930;line-height:1.1;color:${THEME.ink};`, 3)}${textBlock('У нашому асортименті — сковороди з диска борони, казани, шампури, мангали, кришки, аксесуари та подарункові позиції. Для частини виробів доступне гравіювання та друк на чохлах, тому звичайний товар легко перетворюється на особистий подарунок.', `font-size:15px;line-height:1.68;color:${THEME.muted};`)}${textBlock('Ми тримаємо фокус на матеріалі, зручності в роботі, зрозумілій комплектації й комунікації без “загублених” замовлень. Покупець має одразу розуміти, що входить у набір, як відправляємо, як оплатити та як швидко отримає товар.', `font-size:15px;line-height:1.68;color:${THEME.muted};`)}${container(`${buttonBlock('Подивитися хіти продажу','primary')}${buttonBlock('Доставка і оплата','ghost')}`,'display:flex;flex-wrap:wrap;gap:10px;background:transparent;border:0;padding-top:6px;')}`,'display:flex;flex-direction:column;gap:14px;justify-content:center;')}`, 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:center;padding-top:24px;'), THEME.bg, '24px 0 82px'),
    sectionWrap('Цінності', sectionTitle('ЩО ДЛЯ НАС ВАЖЛИВО','4 принципи, на яких тримається магазин','Короткі і зрозумілі блоки — одна з найсильніших практик для сторінки “Про нас”.') + grid([
      featureCard('⚒','Власне виробництво','Контролюємо підготовку металу, обробку, збірку та фінальну перевірку виробів.'),
      featureCard('🎁','Персоналізація','Імена, дати, логотипи та гравіювання допомагають зробити подарунок справді особистим.'),
      featureCard('🚚','Прозора доставка','Пояснюємо строки, способи доставки та оплату без прихованих нюансів.'),
      featureCard('🤝','Допомога з вибором','Підкажемо розмір сковороди, об’єм казана, комплектацію подарункового набору чи шампурів.')
    ],4), THEME.bgAlt, '82px 0'),
    sectionWrap('Цифри', sectionTitle('У ЦИФРАХ','Зрозумілі орієнтири для покупця') + grid([
      metricCard('10+','основних товарних напрямів'),
      metricCard('01','магазин із єдиною стилістикою та сервісом'),
      metricCard('Україна','доставка Новою поштою та Укрпоштою'),
      metricCard('14 днів','стандартний строк на повернення')
    ],4), THEME.bg, '82px 0'),
    ctaSection('Хочеш підібрати товар під конкретний сценарій?','Напиши, для чого тобі виріб: подарунок, дача, виїзд на природу чи домашня кухня — і ми підкажемо найкращий варіант без зайвих переплат.',['Поставити запитання','Відкрити контакти'], P.heroAccessories)
  ].join('');
}

function buildContactsHtml(){
  return [
    heroSection({
      name:'Contacts hero',
      eyebrow:'КОНТАКТИ SHIFTIME',
      title:'Зв’яжіться з нами зручним способом',
      desc:'Найкращі Contact pages дають кілька простих каналів зв’язку, час відповіді та короткі відповіді на типові питання. Саме так ми й побудували цей шаблон.',
      actions:['Написати нам','Переглянути FAQ'],
      sideCard:{eyebrow:'ВІДПОВІДАЄМО ШВИДКО',title:'Підкажемо товар, строк відправки та оплату',text:'Для більшості запитів достатньо одного повідомлення: який товар потрібен, у якому розмірі та чи потрібне гравіювання.',items:['Підтримка замовлень','Допомога з підбором','Опт / подарунки / брендування']}
    }),
    sectionWrap('Канали', sectionTitle('ЯК З НАМИ ЗВ’ЯЗАТИСЯ','Усі основні контакти в одному місці') + grid([
      featureCard('📞','Телефон','+38 (0XX) XXX-XX-XX · зручний для швидкого підбору та уточнення замовлень.'),
      featureCard('✉️','E-mail','hello@shifttime.com.ua · для питань щодо замовлень, співпраці та документів.'),
      featureCard('💬','Месенджери','Instagram / Telegram / Viber — коли зручно надіслати фото, логотип чи приклад гравіювання.'),
      featureCard('📍','Самовивіз / локація','Уточнюйте наявність самовивозу та графік перед приїздом, якщо це доступно у вашому місті.')
    ],4), THEME.bgAlt, '82px 0'),
    sectionWrap('Основний блок', sectionTitle('НАПИШІТЬ НАМ','Зручний шаблон контакту: коротка форма + блок із графіком, відповідями й фото') + level(`${container(card(`${eyebrow('ФОРМА ЗВОРОТНОГО ЗВ’ЯЗКУ')}${headingBlock('Коротко опишіть, що саме вас цікавить', `font-size:28px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('Наприклад: “Потрібна сковорода 50 см з кришкою”, “Хочу гравіювання логотипа”, “Підкажіть оптові умови”.', `font-size:14px;line-height:1.65;color:${THEME.muted};`)}${card(`${textBlock('Ім’я', `font-size:12px;font-weight:800;letter-spacing:.08em;color:${THEME.muted};text-transform:uppercase;`)}${textBlock('Телефон або e-mail', `font-size:12px;font-weight:800;letter-spacing:.08em;color:${THEME.muted};text-transform:uppercase;`)}${textBlock('Ваше повідомлення', `font-size:12px;font-weight:800;letter-spacing:.08em;color:${THEME.muted};text-transform:uppercase;`)}${buttonBlock('Надіслати запит','primary')}`, `background:${THEME.panelSoft};box-shadow:none;` )}`, 'min-height:100%;') , 'display:flex;')}${container(card(`${eyebrow('ШВИДКІ ВІДПОВІДІ')}${headingBlock('Що варто знати до звернення', `font-size:28px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('• Вкажіть модель або бажаний розмір виробу.<br>• Якщо потрібне гравіювання — одразу додайте текст чи логотип.<br>• Для опту коротко опишіть формат співпраці.', `font-size:14px;line-height:1.72;color:${THEME.ink};`)}${textBlock('Зазвичай ми відповідаємо в робочий час і швидко підкажемо наявність, строки виготовлення та відправки.', `font-size:14px;line-height:1.6;color:${THEME.muted};`)}${imageBlock(P.personalCover,'Контакти і персоналізація','width:100%;height:240px;border-radius:18px;')}`, `background:${THEME.panelSoft};min-height:100%;justify-content:space-between;`),'display:flex;')}`, 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;padding-top:24px;'), THEME.bg, '82px 0'),
    sectionWrap('FAQ links', sectionTitle('ЧАСТІ ПИТАННЯ ДО ПІДТРИМКИ','Сильні Contact pages зазвичай знімають частину звернень уже на етапі сторінки.') + grid([
      qaCard('Чи можна оплатити при отриманні?','Так, для стандартних позицій доступна оплата при отриманні без зайвого ризику для покупця.'),
      qaCard('Які строки доставки?','По Україні найчастіше відправляємо Новою поштою, орієнтовний строк залежить від наявності та регіону.'),
      qaCard('Чи доступне гравіювання?','Так, для окремих виробів і чохлів доступні друк та гравіювання імені, дати або логотипа.')
    ],3), THEME.bgAlt, '82px 0'),
    ctaSection('Потрібна швидка допомога з вибором?','Напишіть, який товар шукаєте, для скількох людей і чи потрібна персоналізація — допоможемо підібрати комплект під ваш сценарій.',['Написати в месенджер','Перейти в каталог'], P.heroSkewers)
  ].join('');
}

function buildDeliveryHtml(){
  return [
    heroSection({name:'Delivery hero',eyebrow:'ОПЛАТА І ДОСТАВКА',title:'Прості правила отримання вашого замовлення',desc:'На сторінці ми поєднали те, що найчастіше шукають покупці: кроки обробки, способи доставки, варіанти оплати, строки та важливі уточнення.',actions:['Оформити замовлення','Поставити запитання'],media:{src:P.kazans, alt:'Оплата і доставка'}}),
    sectionWrap('Процес', sectionTitle('ЯК ВІДБУВАЄТЬСЯ ЗАМОВЛЕННЯ','Покроковий сценарій зменшує тривогу покупця та підвищує довіру.') + grid([
      stepCard('01','Оформлення','Залишаєте замовлення на сайті або пишете нам у повідомлення.'),
      stepCard('02','Підтвердження','Уточнюємо модель, розмір, персоналізацію та спосіб доставки.'),
      stepCard('03','Відправка','Пакуємо замовлення, передаємо перевізнику та надсилаємо реквізити/ТТН.'),
      stepCard('04','Отримання','Ви перевіряєте замовлення та, за потреби, оплачуєте при отриманні.')
    ],4), THEME.bgAlt, '82px 0'),
    sectionWrap('Доставка і оплата', sectionTitle('СПОСОБИ ДОСТАВКИ ТА ОПЛАТИ','Універсальний дизайн для сервісної сторінки: окремі блоки доставки і окремі блоки оплати.') + level(`${container(`${headingBlock('Доставка', `font-size:28px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${grid([
      featureCard('🚚','Нова пошта','Основний спосіб доставки по Україні: відділення або поштомат залежно від населеного пункту.'),
      featureCard('📮','Укрпошта','Доступна для частини замовлень — зручно для невеликих міст і селищ.'),
      featureCard('📦','Самовивіз / інші варіанти','За домовленістю можна погодити окремі сценарії отримання, якщо це актуально.')
    ],3).replace('width:min(1280px,calc(100% - 48px));margin:0 auto;','width:100%;margin:0;')}`,'display:flex;flex-direction:column;gap:18px;')}${container(`${headingBlock('Оплата', `font-size:28px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${grid([
      featureCard('💵','Оплата при отриманні','Для стандартних позицій доступна післяплата — без зайвого ризику для покупця.'),
      featureCard('💳','Оплата карткою / онлайн','Підходить для швидкого підтвердження замовлення або подарункового сценарію.'),
      featureCard('🏦','Переказ на рахунок','Зручно для оптових, корпоративних або документальних замовлень.')
    ],3).replace('width:min(1280px,calc(100% - 48px));margin:0 auto;','width:100%;margin:0;')}`,'display:flex;flex-direction:column;gap:18px;padding-top:28px;')}`, 'display:block;padding-top:8px;'), THEME.bg, '82px 0'),
    sectionWrap('Нотатки', sectionTitle('ВАЖЛИВІ УТОЧНЕННЯ','Заздалегідь відповідаємо на питання, які часто виникають перед покупкою.') + grid([
      qaCard('Скільки часу триває відправка?','Залежить від наявності та типу замовлення. Індивідуальні вироби з гравіюванням можуть потребувати додаткового часу.'),
      qaCard('Чи можна змінити замовлення після оформлення?','Так, поки замовлення не відправлене, уточнення зазвичай можна внести через менеджера.'),
      qaCard('Що робити, якщо товар пошкоджений?','Зв’яжіться з нами якнайшвидше, зафіксуйте стан посилки та збережіть упаковку — допоможемо розв’язати питання.')
    ],3), THEME.bgAlt, '82px 0'),
    ctaSection('Потрібно підказати найкращий спосіб доставки?','Напишіть, куди саме потрібно відправити замовлення і який товар вас цікавить — порадимо найзручніший варіант.',['Отримати консультацію','Подивитися FAQ'], P.heroKazans)
  ].join('');
}

function buildWarrantyHtml(){
  return [
    heroSection({name:'Warranty hero',eyebrow:'ГАРАНТІЯ ТА ПОВЕРНЕННЯ',title:'Чесні правила після покупки',desc:'Сильна сервісна сторінка має не лякати, а заспокоювати покупця: пояснити, що входить у гарантію, як працює повернення та з ким зв’язатися у разі питання.',actions:['Поставити запитання','Контакти підтримки'],media:{src:P.panBag, alt:'Гарантія та повернення'}}),
    sectionWrap('Гарантія', sectionTitle('ЩО МИ ГАРАНТУЄМО','Пояснюємо умови простими словами') + grid([
      featureCard('🛡','Якість матеріалів','Перед відправкою ми перевіряємо виріб, комплектність і стан поверхні.'),
      featureCard('🔁','Стандартне повернення','На стандартні замовлення діє базовий строк повернення згідно з умовами магазину.'),
      featureCard('📋','Прозорі правила','Окремо вказуємо, які вироби персоналізовані та що це означає для повернення.'),
      featureCard('🤝','Живий сервіс','Не ховаємося за сухими правилами — спершу розбираємо ситуацію й пропонуємо рішення.')
    ],4), THEME.bgAlt, '82px 0'),
    sectionWrap('Умови', sectionTitle('ЩО ВХОДИТЬ І ЩО НЕ ВХОДИТЬ','Два чіткі блоки допомагають прибрати плутанину.') + level(`${container(card(`${headingBlock('Покривається сервісом', `font-size:26px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('• Виробничі недоліки.<br>• Пошкодження, виявлені одразу після отримання.<br>• Невідповідність комплектації замовленню.<br>• Помилки у стандартному оформленні.', `font-size:14px;line-height:1.72;color:${THEME.ink};`)}`, `background:${THEME.panelSoft};min-height:100%;`),'display:flex;')}${container(card(`${headingBlock('Не покривається / потребує окремого розгляду', `font-size:26px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('• Природні сліди експлуатації після тривалого використання.<br>• Пошкодження через неправильний догляд чи зберігання.<br>• Індивідуальні замовлення з погодженим персональним текстом, якщо помилки з боку магазину немає.', `font-size:14px;line-height:1.72;color:${THEME.ink};`)}`, `background:${THEME.panelSoft};min-height:100%;`),'display:flex;')}`, 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;padding-top:24px;'), THEME.bg, '82px 0'),
    sectionWrap('Повернення', sectionTitle('ЯК ОФОРМИТИ ПОВЕРНЕННЯ','Покрокова структура дає відчуття контролю.') + grid([
      stepCard('01','Зв’яжіться з нами','Опишіть ситуацію та, за можливості, додайте фото або коротке відео.'),
      stepCard('02','Уточнюємо деталі','Менеджер перевіряє замовлення, умови та підказує подальші дії.'),
      stepCard('03','Відправка назад','Якщо повернення погоджене, надсилаємо інструкцію щодо пакування та адреси.'),
      stepCard('04','Рішення','Після перевірки товару погоджуємо обмін, повернення коштів або інший формат вирішення.')
    ],4), THEME.bgAlt, '82px 0'),
    ctaSection('Є питання до вашого конкретного замовлення?','Напишіть номер замовлення або коротко опишіть ситуацію — ми допоможемо пройти процес без зайвої плутанини.',['Звернутися в підтримку','Подивитися доставку'], P.heroPan)
  ].join('');
}

function buildFaqHtml(){
  return [
    heroSection({name:'FAQ hero',eyebrow:'FAQ · ЧАСТІ ПИТАННЯ',title:'Швидкі відповіді без очікування менеджера',desc:'На сильних FAQ сторінках питання групують за категоріями, а відповіді роблять короткими й практичними. Саме так влаштований цей шаблон.',actions:['Написати нам','Перейти в каталог'],sideCard:{eyebrow:'НАЙЧАСТІШЕ',title:'Оплата, доставка, розміри, гравіювання',text:'Це чотири теми, які найчастіше цікавлять покупців перед оформленням замовлення.',items:['Який розмір обрати?','Чи є оплата при отриманні?','Скільки триває відправка?','Чи можна додати ім’я або логотип?']}}),
    sectionWrap('Категорії', sectionTitle('КАТЕГОРІЇ ПИТАНЬ','Допомагають швидше зорієнтуватися.') + grid([
      featureCard('📏','Розміри та комплектація','Сковороди, казани, шампури, кришки, набори.'),
      featureCard('💵','Оплата','Післяплата, картка, переказ, опт.'),
      featureCard('🚚','Доставка','Строки, перевізники, пакування.'),
      featureCard('🎨','Персоналізація','Гравіювання, друк, логотипи, підготовка макета.')
    ],4), THEME.bgAlt, '82px 0'),
    sectionWrap('Питання', sectionTitle('ПОПУЛЯРНІ ПИТАННЯ','Можна використовувати як готовий FAQ або як основу для ваших реальних відповідей.') + grid([
      qaCard('Яку сковороду обрати — 40, 50 чи 60 см?','Все залежить від кількості людей і сценарію використання. Для сім’ї найчастіше обирають 50 см як універсальний варіант.'),
      qaCard('Чи можна купити казан у комплекті з підставкою?','Так, для частини позицій доступні комплекти або додаткові аксесуари. Уточнюйте актуальну наявність у менеджера.'),
      qaCard('Чи є оплата при отриманні?','Так, стандартні позиції зазвичай можна оплатити при отриманні. Для індивідуальних чи оптових замовлень умови можуть уточнюватися окремо.'),
      qaCard('Скільки триває виготовлення з гравіюванням?','Термін залежить від складності персоналізації та поточного завантаження. Орієнтир повідомляємо перед підтвердженням замовлення.'),
      qaCard('Чи можна нанести логотип компанії?','Так, для частини товарів і чохлів можливий друк або гравіювання логотипів.'),
      qaCard('Що робити після першого використання казана або сковороди?','Дотримуйтесь базових правил догляду: очищення, висушування та правильне зберігання. Для окремих виробів можемо додати коротку інструкцію.')
    ],3), THEME.bg, '82px 0'),
    ctaSection('Не знайшли саме своє питання?','Тоді напишіть нам напряму. Ми відповімо і, за потреби, доповнимо сторінку FAQ новими корисними відповідями.',['Поставити запитання','Відкрити контакти'], P.heroAccessories)
  ].join('');
}

function buildEngravingHtml(){
  return [
    heroSection({name:'Engraving hero',eyebrow:'ГРАВІЮВАННЯ ТА ПЕРСОНАЛІЗАЦІЯ',title:'Перетворіть звичайний виріб на особистий подарунок',desc:'Ця сторінка побудована як сервісна: показує, що саме можна персоналізувати, як працює процес і що потрібно від клієнта для старту.',actions:['Замовити персоналізацію','Подивитися приклади'],media:{src:P.engraving, alt:'Гравіювання та друк на чохлах'}}),
    sectionWrap('Варіанти', sectionTitle('ЩО МОЖНА ЗРОБИТИ','На послугових сторінках добре працюють окремі картки варіантів.') + grid([
      featureCard('✒️','Ім’я або дата','Класичний варіант для подарунка — лаконічно й особисто.'),
      featureCard('🏷','Логотип або фірмовий знак','Підійде для корпоративних подарунків, брендування чи сувенірних комплектів.'),
      featureCard('🎁','Подарунковий сценарій','Персоналізація на чохлі, кришці або в наборі допомагає зробити подарунок завершеним.'),
      featureCard('🧩','Індивідуальний підхід','Якщо потрібен нестандартний текст або поєднання елементів — обговоримо окремо.')
    ],4), THEME.bgAlt, '82px 0'),
    sectionWrap('Процес', sectionTitle('ЯК ПРАЦЮЄ ПРОЦЕС','Щоб клієнту було спокійно, сторінка повинна показувати послідовність дій.') + grid([
      stepCard('01','Пишете ідею','Надсилаєте текст, логотип, побажання або приклад стилю.'),
      stepCard('02','Уточнюємо носій','Погоджуємо, де саме буде персоналізація: чохол, виріб, подарунковий набір.'),
      stepCard('03','Погоджуємо деталі','Орієнтовно обговорюємо розміщення, строки та вартість.'),
      stepCard('04','Виготовляємо й відправляємо','Після погодження запускаємо роботу та відправляємо готовий виріб.')
    ],4), THEME.bg, '82px 0'),
    sectionWrap('Приклади', sectionTitle('ЩО ВАРТО ПІДГОТУВАТИ','Це підвищує якість першого контакту і економить час обом сторонам.') + level(`${container(card(`${headingBlock('Для швидкого старту надішліть', `font-size:26px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('• Який товар вас цікавить.<br>• Текст для гравіювання або файл із логотипом.<br>• Приблизний дедлайн, якщо це подарунок до конкретної дати.<br>• Місто доставки.', `font-size:14px;line-height:1.72;color:${THEME.ink};`)}${buttonBlock('Написати щодо персоналізації','primary')}`, `background:${THEME.panelSoft};justify-content:center;height:100%;`),'display:flex;')}${container(imageBlock(P.personalCover,'Приклад персоналізації','width:100%;min-height:360px;height:100%;border-radius:24px;'),'display:flex;')}`, 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;padding-top:24px;'), THEME.bgAlt, '82px 0'),
    ctaSection('Хочете персоналізований виріб або подарунковий набір?','Надішліть короткий опис і ми підкажемо, що можна зробити саме для вашого сценарію: особистий подарунок, корпоративний комплект чи брендований виріб.',['Замовити консультацію','Перейти в контакти'], P.heroPourers)
  ].join('');
}

function buildWholesaleHtml(){
  return [
    heroSection({name:'Wholesale hero',eyebrow:'ОПТОВИМ КЛІЄНТАМ',title:'Співпраця для магазинів, подарункових проєктів і бізнесу',desc:'Цей шаблон побудований за логікою B2B / wholesale pages: переваги, для кого підходить, як стартуємо та який формат запиту пришвидшує відповідь.',actions:['Надіслати B2B-запит','Подивитися асортимент'],media:{src:P.mangalCustom, alt:'Оптовим клієнтам'}}),
    sectionWrap('Переваги', sectionTitle('ЩО ОТРИМУЄ ПАРТНЕР','Зрозумілі вигоди — ключ до хорошої B2B-сторінки.') + grid([
      featureCard('📦','Асортимент під різні сценарії','Від outdoor і домашніх позицій до подарункових комплектів та персоналізації.'),
      featureCard('🏷','Брендування','Можливість підготувати позиції з логотипом, іменним текстом або корпоративною ідеєю.'),
      featureCard('🧾','Прозора комунікація','Швидко уточнюємо наявність, строки виготовлення та формат співпраці.'),
      featureCard('🤝','Гнучкість','Можемо зібрати пропозицію під магазин, студію подарунків, івент чи корпоративний сценарій.')
    ],4), THEME.bgAlt, '82px 0'),
    sectionWrap('Для кого', sectionTitle('КОМУ ПІДХОДИТЬ','Конкретизація ніш допомагає клієнту впізнати себе.') + grid([
      qaCard('Роздрібні магазини','Магазини подарунків, outdoor та товарів для дому, які хочуть додати впізнавані позиції.'),
      qaCard('Корпоративні подарунки','Компанії, яким потрібні набори з брендуванням або персоналізацією.'),
      qaCard('HoReCa / подієві формати','Локації, тематичні комплекси, гастроподії або партнери, які використовують вироби у власних активностях.')
    ],3), THEME.bg, '82px 0'),
    sectionWrap('Старт співпраці', sectionTitle('ЯК ПОЧАТИ','Чотири прості кроки до першого діалогу.') + grid([
      stepCard('01','Коротко розкажіть про себе','Який у вас формат бізнесу або проєкту.'),
      stepCard('02','Позначте напрямок','Які товари чи подарункові сценарії вас цікавлять.'),
      stepCard('03','Уточніть обсяг і термін','Навіть приблизний орієнтир пришвидшує відповідь.'),
      stepCard('04','Отримайте пропозицію','Ми повернемося з варіантами та наступними кроками.')
    ],4), THEME.bgAlt, '82px 0'),
    ctaSection('Маєте ідею для співпраці або корпоративного подарунка?','Напишіть, який формат вам потрібен, на коли та для кого — ми зберемо пропозицію під ваш сценарій.',['Надіслати оптовий запит','Перейти в контакти'], P.heroAccessories)
  ].join('');
}

function buildBlogHtml(){
  return [
    heroSection({name:'Blog hero',eyebrow:'БЛОГ SHIFTIME',title:'Ідеї, поради та натхнення для вогню, кухні й подарунків',desc:'Структура побудована за логікою сучасних blog-index сторінок: hero, featured material, категорії та сітка корисних публікацій.',actions:['Читати статті','Підписатися'],media:{src:P.panFire, alt:'Блог ShiftTime'}}),
    sectionWrap('Featured', sectionTitle('РЕКОМЕНДОВАНИЙ МАТЕРІАЛ','Великий акцентний блок добре працює для головної статті або сезонної теми.') + level(`${container(imageBlock(P.kazanTripod,'Головна стаття блогу','width:100%;min-height:400px;height:100%;border-radius:26px;'),'')}${container(`${eyebrow('ОБРАНЕ')}${headingBlock('Як обрати казан, сковороду або мангал під свій сценарій', `font-size:34px;font-weight:940;line-height:1.05;color:${THEME.ink};`, 3)}${textBlock('Пояснюємо, як не загубитися між розмірами, комплектаціями, типами металу та реальними сценаріями використання: дача, природа, подарунок чи домашня кухня.', `font-size:15px;line-height:1.68;color:${THEME.muted};`)}${container(`${buttonBlock('Читати статтю','primary')}${buttonBlock('Усі матеріали','ghost')}`,'display:flex;flex-wrap:wrap;gap:10px;background:transparent;border:0;padding-top:6px;')}`,'display:flex;flex-direction:column;gap:14px;justify-content:center;')}`, 'display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:28px;align-items:center;padding-top:24px;'), THEME.bg, '82px 0'),
    sectionWrap('Категорії', sectionTitle('КАТЕГОРІЇ БЛОГУ','Щоб користувач міг легко перейти до цікавої теми.') + grid([
      featureCard('🔥','Рецепти на вогні','Що готувати у сковороді, казані чи на мангалі.'),
      featureCard('🧰','Вибір товару','Як обрати правильний розмір, комплектацію та матеріал.'),
      featureCard('🎁','Подарунки та персоналізація','Ідеї для подарункових сценаріїв і брендування.'),
      featureCard('🧼','Догляд і використання','Поради щодо першого запуску, очищення та зберігання.')
    ],4), THEME.bgAlt, '82px 0'),
    sectionWrap('Сітка статей', sectionTitle('ОСТАННІ МАТЕРІАЛИ','Сітка з карток підходить для блогу майже на будь-яку тему.') + grid([
      articleCard(P.panFire,'РЕЦЕПТИ','5 страв на дисковій сковороді','Підбірка страв, які легко приготувати на відкритому вогні.'),
      articleCard(P.kazans,'ГАЙД','Як підготувати казан до першого використання','Коротко про прожарювання, догляд і зберігання.'),
      articleCard(P.mangalCustom,'ВИБІР','На що дивитися при купівлі мангала','Розбираємо висоту, метал, ширину та комплектацію.'),
      articleCard(P.personalCover,'ПОДАРУНКИ','Ідеї персоналізованих подарунків','Що дарувати тим, хто любить готувати і відпочивати на природі.'),
      articleCard(P.engravedSkewers,'СЕРВІС','Коли варто замовляти гравіювання','Поради для особистих і корпоративних сценаріїв.'),
      articleCard(P.panGift,'ПІДБІРКИ','Що взяти для дачі або заміського будинку','Комплектуємо базовий набір для відпочинку і кухні.')
    ],3), THEME.bg, '82px 0'),
    ctaSection('Хочете отримувати нові матеріали першими?','Підпишіться на оновлення або просто збережіть сторінку блогу як готовий шаблон для вашого магазину.',['Підписатися','Повернутися в каталог'], P.heroAccessories)
  ].join('');
}

function buildArticleHtml(){
  return [
    heroSection({name:'Article hero',eyebrow:'СТАТТЯ / ГАЙД',title:'Як обрати сковороду з диска борони під свій сценарій',desc:'Приклад готової article-page: помітний заголовок, короткий вступ, ключові тези, медіа, змістовні секції та заклик до наступної дії.',actions:['Поставити запитання','Переглянути моделі'],media:{src:P.panCover, alt:'Стаття про вибір сковороди'}}),
    sectionWrap('Ключові тези', sectionTitle('ЩО ГОЛОВНЕ','Швидкі відповіді ще до довгого читання.') + grid([
      metricCard('40–60 см','популярні діаметри для різних компаній'),
      metricCard('4–7 мм','орієнтир по товщині металу залежно від виробу'),
      metricCard('1 сценарій','спершу визначте: дім, дача, природа, подарунок'),
      metricCard('01 питання','чи потрібні кришка, чохол і персоналізація')
    ],4), THEME.bgAlt, '82px 0'),
    sectionWrap('Основний контент', sectionTitle('РОЗБІР ПО СУТІ','Зразок читабельної article-layout з чергуванням тексту та ілюстрацій.') + level(`${container(`${headingBlock('1. Відштовхуйтеся від кількості людей і способу використання', `font-size:28px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('Якщо ви готуєте переважно для сім’ї або невеликої компанії, універсальним варіантом часто стає середній діаметр. Якщо ж у вас виїзди з друзями або велика дача, варто дивитися в бік більших форматів.', `font-size:15px;line-height:1.72;color:${THEME.muted};`)}${headingBlock('2. Подумайте про комплект', `font-size:28px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('Кришка, чохол, підставка чи подарунковий сценарій можуть зробити покупку значно зручнішою. Саме тому сторінка товару або консультація мають показувати не тільки базовий виріб, а й пов’язані елементи.', `font-size:15px;line-height:1.72;color:${THEME.muted};`)}${headingBlock('3. Якщо це подарунок — подумайте про персоналізацію', `font-size:28px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('Ім’я, дата чи короткий напис на чохлі можуть перетворити практичний товар на емоційний подарунок. Для корпоративних сценаріїв доцільно розглядати логотип або фірмові елементи.', `font-size:15px;line-height:1.72;color:${THEME.muted};`)}`, 'display:flex;flex-direction:column;gap:14px;')}${container(imageBlock(P.personalCover,'Поради щодо вибору та персоналізації','width:100%;min-height:460px;height:100%;border-radius:24px;'),'display:flex;')}`, 'display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:28px;align-items:start;padding-top:24px;'), THEME.bg, '82px 0'),
    sectionWrap('Поради', sectionTitle('КОРОТКІ ПОРАДИ','Картки-підсумки роблять статтю більш “сканованою”.') + grid([
      featureCard('✅','Спочатку сценарій','Для дачі, природи, дому чи подарунка — це головне стартове питання.'),
      featureCard('✅','Далі розмір','Після сценарію найпростіше визначитися з діаметром і комплектацією.'),
      featureCard('✅','Потім аксесуари','Кришка, чохол, шампури, набір або гравіювання доповнюють покупку.')
    ],3), THEME.bgAlt, '82px 0'),
    ctaSection('Після статті хочете живу підказку?','Напишіть, що саме плануєте готувати і для скількох людей — ми підкажемо модель швидше, ніж ви встигнете перечитати ще десять сторінок.',['Отримати консультацію','Відкрити блог'], P.heroPan)
  ].join('');
}

function buildLegalHtml(){
  return [
    heroSection({name:'Legal hero',eyebrow:'ПОЛІТИКИ ТА УМОВИ',title:'Важлива інформація для покупця без юридичного перевантаження',desc:'Навіть policy / legal page може виглядати охайно: короткий вступ, тематичні блоки, основні правила й зрозумілий перехід до контактів або підтримки.',actions:['Поставити запитання','Зв’язатися з підтримкою'],sideCard:{eyebrow:'ЩО ТУТ Є',title:'Публічна оферта, конфіденційність, обробка замовлень',text:'Це шаблон для сторінок, де потрібно подати важливу інформацію у зручному, людяному вигляді.',items:['Умови оформлення замовлення','Базові правила повернення','Робота з персональними даними']}}),
    sectionWrap('Навігація', sectionTitle('ОСНОВНІ РОЗДІЛИ','Навігаційні картки допомагають користувачу швидко знайти потрібне.') + grid([
      featureCard('📘','Публічна оферта','Умови покупки, оформлення, оплати та доставки.'),
      featureCard('🔒','Конфіденційність','Як ми працюємо з контактними даними та замовленнями.'),
      featureCard('↩️','Повернення','Куди звертатися та як виглядає базовий процес повернення.'),
      featureCard('📞','Підтримка','Куди писати, якщо залишилися питання або потрібне уточнення.')
    ],4), THEME.bgAlt, '82px 0'),
    sectionWrap('Зміст', sectionTitle('КЛЮЧОВІ ПОЛОЖЕННЯ','Можна замінити реальними юридичними текстами або використати як структурну основу.') + level(`${container(card(`${headingBlock('Публічна оферта', `font-size:24px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('Опишіть, як оформлюється замовлення, які способи оплати доступні, коли вважається укладеним договір та як передається товар покупцю.', `font-size:14px;line-height:1.72;color:${THEME.muted};`)}`, `min-height:100%;background:${THEME.panelSoft};`),'display:flex;')}${container(card(`${headingBlock('Політика конфіденційності', `font-size:24px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('Поясніть, які дані збираються при оформленні замовлення, навіщо вони потрібні та як користувач може зв’язатися з вами щодо обробки даних.', `font-size:14px;font-size:14px;line-height:1.72;color:${THEME.muted};`)}`, `min-height:100%;background:${THEME.panelSoft};`),'display:flex;')}${container(card(`${headingBlock('Повернення та сервіс', `font-size:24px;font-weight:930;line-height:1.08;color:${THEME.ink};`, 3)}${textBlock('Укажіть базові строки, винятки для індивідуальних замовлень та формат звернення для сервісних питань. Так покупець відчує прозорість ще до покупки.', `font-size:14px;line-height:1.72;color:${THEME.muted};`)}`, `min-height:100%;background:${THEME.panelSoft};`),'display:flex;')}`, 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;padding-top:24px;'), THEME.bg, '82px 0'),
    ctaSection('Потрібно уточнити умови саме для вашого замовлення?','Юридична сторінка не замінює живу підтримку. Якщо залишилися питання — краще одразу напишіть нам і ми пояснимо людською мовою.',['Поставити запитання','Перейти в контакти'], P.heroAccessories)
  ].join('');
}

const RAW = [
  {
    id:'shifttime-standard-about-main',
    folderId:'fld_main_about',
    name:'ShiftTime · Про нас',
    description:'Стандартна сторінка “Про нас”: історія бренду, цінності, цифри та сильний заклик до дії.',
    category:'about',
    html:buildAboutHtml()
  },
  {
    id:'shifttime-standard-contacts-main',
    folderId:'fld_main_contacts',
    name:'ShiftTime · Контакти',
    description:'Стандартна сторінка “Контакти”: канали зв’язку, форма-заготовка, швидкі відповіді та сервісний CTA.',
    category:'contacts',
    html:buildContactsHtml()
  },
  {
    id:'shifttime-standard-delivery-main',
    folderId:'fld_main_delivery',
    name:'ShiftTime · Оплата і доставка',
    description:'Стандартна сторінка “Оплата і доставка”: покроковий процес, варіанти оплати, способи доставки та уточнення.',
    category:'delivery',
    html:buildDeliveryHtml()
  },
  {
    id:'shifttime-standard-warranty-main',
    folderId:'fld_main_warranty',
    name:'ShiftTime · Гарантія та повернення',
    description:'Стандартна сторінка “Гарантія та повернення”: правила сервісу, повернення та підтримка.',
    category:'legal',
    html:buildWarrantyHtml()
  },
  {
    id:'shifttime-standard-faq-main',
    folderId:'fld_main_faq',
    name:'ShiftTime · FAQ',
    description:'Стандартна сторінка “FAQ”: категорії питань, сітка відповідей та перехід до контакту.',
    category:'faq',
    html:buildFaqHtml()
  },
  {
    id:'shifttime-standard-engraving-main',
    folderId:'fld_main_services',
    name:'ShiftTime · Гравіювання та персоналізація',
    description:'Стандартна сторінка послуги персоналізації: варіанти, процес, підготовка матеріалів і CTA.',
    category:'services',
    html:buildEngravingHtml()
  },
  {
    id:'shifttime-standard-wholesale-main',
    folderId:'fld_main_wholesale',
    name:'ShiftTime · Оптовим клієнтам',
    description:'B2B / wholesale сторінка для співпраці, корпоративних подарунків і партнерств.',
    category:'pricing',
    html:buildWholesaleHtml()
  },
  {
    id:'shifttime-standard-blog-main',
    folderId:'fld_main_blog',
    name:'ShiftTime · Блог',
    description:'Стандартна сторінка списку статей: hero, featured post, категорії та сітка публікацій.',
    category:'blog',
    html:buildBlogHtml()
  },
  {
    id:'shifttime-standard-article-main',
    folderId:'fld_main_article',
    name:'ShiftTime · Стаття / Гайд',
    description:'Стандартна сторінка статті / гайду з hero, ключовими тезами, основним контентом і CTA.',
    category:'article',
    html:buildArticleHtml()
  },
  {
    id:'shifttime-standard-legal-main',
    folderId:'fld_main_legal',
    name:'ShiftTime · Політики та умови',
    description:'Стандартна legal / policy сторінка у зручному для читання візуальному форматі.',
    category:'legal',
    html:buildLegalHtml()
  }
];

function styleProfileForStandardMain01035_(templateId) {
  const base = SHIFTTIME_MARKETPLACE_02_STYLE_PROFILES_00984.main;
  // 01035: each system template must own a contract-valid Style Profile.
  // Reusing the Marketplace-02 profile object verbatim leaves templateId pointing
  // at `shifttime-marketplace-02-main`; Gallery's 00945 validator then rejects
  // every standard Main before it reaches the grid. Theme tokens are intentionally
  // shared, while profile identity is unique to the authored template.
  return Object.freeze({
    ...base,
    profileId: `${templateId}-style`,
    collectionId: 'shifttime-standard-pages-01035',
    templateId,
    area: 'main'
  });
}

export const STANDARD_PAGE_MAIN_TEMPLATES_01032 = Object.freeze(RAW.map((item, idx) => Object.freeze({
  id:item.id,
  type:'main',
  folderId:item.folderId,
  name:item.name,
  preview:`standard-main-01035-${idx+1}`,
  description:item.description,
  meta:{
    source:'system',
    stage:'01035',
    locale:'uk-UA',
    category:item.category,
    standardPageTemplate:true,
    siteFrameStore:true,
    mainApplyModes:['add','replace'],
    singleSourceOfTruth:'SiteFrameStore-after-apply',
    replaceScope:'main-area',
    styleProfileIdentityParity01035:true
  },
  styleProfile: styleProfileForStandardMain01035_(item.id),
  html:item.html,
  previewHtml:item.html
})));

export function getStandardPageMainTemplates01032(){
  return STANDARD_PAGE_MAIN_TEMPLATES_01032.slice();
}
