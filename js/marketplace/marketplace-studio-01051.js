import { getMarketplaceStudioPreferences01052 } from './data/marketplace-studio-preferences-01052.js?v=01052';
// 01051 · Marketplace Studio shell / navigation / safe placeholders.
// No product persistence yet. This stage establishes one stable admin workspace contract.

const MP_STAGE = '01051';
const preferences=getMarketplaceStudioPreferences01052();

const GROUPS = Object.freeze([
  { label:'Старт', items:[
    ['overview','⌂','Огляд','Dashboard, готовність каталогу',['Відкрити Dashboard','Перевірити готовність']],
  ]},
  { label:'Каталог', items:[
    ['products','▣','Товари','Каталог, картки, масові дії',['+ Додати товар','Імпорт товарів','Масові дії']],
    ['categories','◫','Категорії','Дерево категорій і SEO',['+ Додати категорію','Імпорт категорій','Порядок категорій']],
    ['collections','◆','Колекції','Новинки, акції, ручні добірки',['+ Створити колекцію','Правила колекцій']],
    ['attributes','⚙','Характеристики','Типи полів і словники значень',['+ Характеристика','Групи атрибутів','Одиниці вимірювання']],
    ['variants','◈','Варіації','Розміри, кольори, комбінації',['+ Набір варіацій','Генератор комбінацій']],
    ['media','▧','Медіатека','Фото, відео, ALT, оптимізація',['Завантажити медіа','Перевірити ALT','Дублікати']],
    ['inventory','▤','Запаси','Залишки, склади, резерви',['Склади','Корекція залишків','Низький запас']],
    ['pricing','₴','Ціни й акції','Ціни, знижки, промокоди',['Правила цін','Акції','Промокоди']],
  ]},
  { label:'Discovery', items:[
    ['filters','≡','Фільтри','Facets, swatches, діапазони',['+ Фільтр','Порядок фільтрів','SEO фільтрів']],
    ['search','⌕','Пошук','Синоніми, boosts, запити',['Синоніми','Search boosts','Запити без результатів']],
    ['recommendations','✦','Рекомендації','Схожі, доповнення, хіти',['+ Правило','Ручні рекомендації','Пріоритети']],
    ['reviews','★','Відгуки','Рейтинг, модерація, Q&A',['Модерація','Імпорт відгуків','Питання й відповіді']],
  ]},
  { label:'Дані та канали', items:[
    ['import-export','⇅','Імпорт / Експорт','XML, CSV, XLSX, URL feeds',['Імпорт XML','Імпорт CSV/XLSX','Експорт','Історія імпортів']],
    ['feeds','⌁','XML / Feeds','Mapping, validation, schedules',['+ Новий feed','Mapping полів','Validator','Розклад оновлень']],
    ['channels','◉','Канали продажу','Google, Meta, Prom, Rozetka',['Google Merchant','Meta Catalog','Prom','Rozetka']],
    ['presets','⚡','Пресети','Швидкі схеми категорій і даних',['+ Пресет','Застосувати пресет','Експорт пресета']],
  ]},
  { label:'Пошукові системи та ріст', items:[
    ['seo','◎','SEO Center','Meta, sitemap, canonical, health',['SEO аудит','Meta шаблони','Sitemap','Canonical rules']],
    ['structured-data','{}','Structured Data','Product, Offer, Breadcrumbs',['Product schema','Variants schema','Shipping/Returns schema']],
    ['analytics','⌁','Аналітика','Події, конверсії, feed health',['Події ecommerce','Конверсії','UTM правила','Звіти']],
  ]},
  { label:'Операції', items:[
    ['shipping','▱','Доставка','Зони, тарифи, габарити',['Способи доставки','Зони','Правила безкоштовної доставки']],
    ['payments','◒','Оплата','Методи та умови оплати',['Методи оплати','Післяплата','Статуси платежів']],
    ['taxes','%','Податки','Податкові класи та правила',['Податкові класи','Ціни з ПДВ','Регіональні правила']],
    ['localization','文','Локалізація','Мови, валюти, одиниці',['Мови','Валюти','Формати','Переклади']],
    ['automation','↻','Автоматизація','Правила, тригери, jobs',['+ Автоматизація','Розклад задач','Логи виконання']],
    ['settings','⚙','Налаштування','MarketplaceStore та поведінка',['Основні','ID/SKU правила','Чернетки','Безпека даних']],
    ['diagnostics','✓','Діагностика','Помилки, contracts, readiness',['Запустити перевірку','Feed diagnostics','Binding diagnostics']],
  ]},
]);

const PAGE_ALIASES = Object.freeze({
  collections:'products', media:'products', inventory:'products', pricing:'products',
  reviews:'recommendations', structuredData:'seo', 'structured-data':'seo', analytics:'seo',
  shipping:'settings', payments:'settings', taxes:'settings', localization:'settings', automation:'settings', diagnostics:'settings'
});

const DEMO_IMG = 'assets/collections/shifttime-marketplace-02/real-products/06-pan-stainless-lid-gift.webp';
const DEMO_IMG_2 = 'assets/collections/shifttime-marketplace-02/real-products/01-kazany-lineup.webp';
const DEMO_IMG_3 = 'assets/collections/shifttime-marketplace-02/real-products/10-mangal-custom.webp';

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function btn(label, cls=''){return `<button type="button" class="mp-btn ${cls}" data-mp-action="${esc(label)}">${esc(label)}</button>`;}
function chip(label, cls=''){return `<span class="mp-chip ${cls}">${esc(label)}</span>`;}

function loadOpen(){return new Set(preferences.getOpenAccordions());}
function saveOpen(set){preferences.setOpenAccordions(set);}
function loadPage(){return preferences.getLastPage();}
function savePage(id){preferences.setLastPage(id);}

function inspectorHtml(openSet){
  return `<div class="mp-inspector-01051" data-mp-inspector="${MP_STAGE}">
    <section class="mp-inspector__hero">
      <div class="mp-inspector__eyebrow">MARKETPLACE STUDIO · ${MP_STAGE}</div>
      <div class="mp-inspector__title">Керування магазином</div>
      <p class="mp-inspector__subtitle">Окремий режим каталогу, даних, каналів продажу, пошуку та SEO. Дизайн сайту залишається у Builder.</p>
      <div class="mp-inspector__mode"><span>Каркас системи</span><b class="mp-live-dot">ГОТОВИЙ</b></div>
    </section>
    <div class="mp-inspector__quick">
      <button type="button" class="is-primary" data-mp-page="products">＋ Товар</button>
      <button type="button" data-mp-page="categories">＋ Категорія</button>
      <button type="button" data-mp-page="import-export">⇧ Імпорт</button>
      <button type="button" data-mp-page="diagnostics">✓ Перевірка</button>
    </div>
    ${GROUPS.map(g=>`<div class="mp-side-group">${esc(g.label)}</div>${g.items.map(item=>accordionHtml(item,openSet)).join('')}`).join('')}
  </div>`;
}

function accordionHtml(item,openSet){
  const [id,icon,name,meta,actions]=item;
  const open=openSet.has(id);
  return `<section class="mp-accordion ${open?'is-open':''}" data-mp-accordion="${esc(id)}">
    <button class="mp-accordion__head" type="button" data-mp-accordion-head="${esc(id)}">
      <span class="mp-accordion__icon">${esc(icon)}</span><span><span class="mp-accordion__name">${esc(name)}</span><span class="mp-accordion__meta">${esc(meta)}</span></span><span class="mp-accordion__chev">⌄</span>
    </button>
    <div class="mp-accordion__body"><div class="mp-accordion__grid">
      ${actions.map((a,i)=>`<button type="button" class="mp-side-action ${actions.length%2===1&&i===actions.length-1?'is-wide':''}" data-mp-action="${esc(name+' · '+a)}">${esc(a)} <span class="mp-stub">STUB</span></button>`).join('')}
    </div><div class="mp-side-status"><span>Модуль</span><b>Каркас ${MP_STAGE}</b></div></div>
  </section>`;
}

function topBarHtml(){
  return `<header class="mp-topbar">
    <div class="mp-brand"><div class="mp-brand__mark">🛒</div><div><div class="mp-brand__title">Marketplace Studio</div><div class="mp-brand__sub">Commerce control center</div></div></div>
    <nav class="mp-topnav" aria-label="Marketplace Studio">
      <button data-mp-page="overview">Огляд</button><button data-mp-page="products">Каталог</button><button data-mp-page="categories">Категорії</button><button data-mp-page="attributes">Дані</button><button data-mp-page="filters">Discovery</button><button data-mp-page="feeds">Канали</button><button data-mp-page="seo">SEO</button>
    </nav>
    <div class="mp-top-actions"><button class="mp-icon-btn mp-main-ui-settings-01054" type="button" data-st-main-ui-settings="1" title="Налаштування головного вікна" aria-label="Налаштування головного вікна">⚙</button><button class="mp-btn mp-btn--small" data-mp-exit="1">← Конструктор</button><button class="mp-icon-btn" data-mp-action="Marketplace notifications" title="Сповіщення">🔔</button><button class="mp-icon-btn" data-mp-action="Marketplace help" title="Допомога">?</button><div class="mp-avatar">ST</div></div>
  </header>`;
}

function workspaceHtml(){
  return `<div class="mp-studio-01051" data-mp-studio="${MP_STAGE}"><div class="mp-shell">${topBarHtml()}<div class="mp-workarea"><main class="mp-content">
    ${overviewPage()}
    ${productsPage()}
    ${categoriesPage()}
    ${attributesPage()}
    ${variantsPage()}
    ${filtersPage()}
    ${importExportPage()}
    ${feedsPage()}
    ${channelsPage()}
    ${presetsPage()}
    ${recommendationsPage()}
    ${searchPage()}
    ${seoPage()}
    ${settingsPage()}
  </main>${contextHtml()}</div></div></div>`;
}

function pageHead(id,title,sub,actions=[]){return `<div class="mp-page-head"><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class="mp-page-actions">${actions.map(a=>btn(a,a.startsWith('+')?'mp-btn--primary':'')).join('')}</div></div>`;}

function overviewPage(){return `<section class="mp-page" data-mp-page-view="overview">${pageHead('overview','Огляд маркетплейсу','Єдиний центр стану каталогу, каналів, пошуку та SEO. Дані нижче демонстраційні — реальний MarketplaceStore підключимо наступним етапом.',['+ Додати товар','Імпорт','Перевірити каталог'])}
  <div class="mp-stat-grid">
    <div class="mp-stat"><div class="mp-stat__icon">▣</div><div class="mp-stat__value">184</div><div class="mp-stat__label">Товарів у каталозі</div><div class="mp-stat__trend">165 готові до публікації</div></div>
    <div class="mp-stat"><div class="mp-stat__icon">◫</div><div class="mp-stat__value">18</div><div class="mp-stat__label">Категорій</div><div class="mp-stat__trend">6 головних · 12 дочірніх</div></div>
    <div class="mp-stat"><div class="mp-stat__icon">⌁</div><div class="mp-stat__value">4</div><div class="mp-stat__label">Каналів продажу</div><div class="mp-stat__trend">3 готові · 1 потребує mapping</div></div>
    <div class="mp-stat"><div class="mp-stat__icon">⚠</div><div class="mp-stat__value">17</div><div class="mp-stat__label">Потребують уваги</div><div class="mp-stat__trend is-warn">ALT · SKU · feed fields</div></div>
  </div>
  <div class="mp-grid-2">
    <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Готовність магазину</div><div class="mp-card__hint">Системний checklist</div></div>${btn('Повний аудит','mp-btn--small')}</div><div class="mp-card__body"><div class="mp-health"><div class="mp-health__score"><span>92%</span></div><div class="mp-check-list"><div class="mp-check"><span>Каталог і категорії</span><b>Готово</b></div><div class="mp-check"><span>Product data</span><b>96%</b></div><div class="mp-check"><span>SEO / Structured Data</span><b>91%</b></div><div class="mp-check"><span>Google / Meta feeds</span><b class="warn">Перевірити 4 поля</b></div><div class="mp-progress"><i style="--p:92%"></i></div></div></div></div></section>
    <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Швидкі дії</div><div class="mp-card__hint">Найчастіші операції</div></div></div><div class="mp-card__body"><div class="mp-form-grid">${['+ Новий товар','+ Нова категорія','XML Import','CSV/XLSX','Feed Validator','SEO Audit','Фільтри','Рекомендації'].map(x=>btn(x,x.startsWith('+')?'mp-btn--primary':'')).join('')}</div></div></section>
  </div>
  <div class="mp-grid-equal" style="margin-top:12px">
    <section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Останні операції</div><span class="mp-badge is-gray">DEMO</span></div><div class="mp-card__body"><div class="mp-check-list"><div class="mp-check"><span>XML feed · 184 товари</span><b>12:41</b></div><div class="mp-check"><span>SEO scan · 17 warning</span><b>11:08</b></div><div class="mp-check"><span>Категорії · перерахунок</span><b>Вчора</b></div></div></div></section>
    <section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Discovery health</div><span class="mp-badge">OK</span></div><div class="mp-card__body"><div class="mp-chip-row">${['12 фільтрів','18 синонімів','7 recommendation rules','4 price ranges'].map((x,i)=>chip(x,i===0?'is-green':'' )).join('')}</div></div></section>
  </div>
</section>`;}

function productsPage(){
  const rows=[
    [DEMO_IMG,'Сковорода з диска борони 50 см','SK-50','Сковорідки','1 450 грн','24','Активний'],
    [DEMO_IMG_2,'Казан чавунний 8 л','KZ-08','Казани','2 690 грн','12','Активний'],
    [DEMO_IMG_3,'Мангал розбірний 80 см','MG-80','Мангали','3 590 грн','7','Чернетка'],
  ];
  return `<section class="mp-page" data-mp-page-view="products">${pageHead('products','Товари','Єдина таблиця каталогу. Тут пізніше працюватимуть додавання, редагування, дублювання, архів, bulk edit та імпорт.',['Імпорт','Експорт','+ Додати товар'])}
    <div class="mp-toolbar"><label class="mp-search">⌕<input placeholder="Пошук за назвою, SKU, штрихкодом…"></label><select class="mp-select"><option>Усі категорії</option><option>Сковорідки</option><option>Казани</option></select><select class="mp-select"><option>Усі статуси</option><option>Активні</option><option>Чернетки</option></select><select class="mp-select"><option>Наявність</option><option>В наявності</option><option>Немає</option></select>${btn('Масові дії','mp-btn--small')}</div>
    <div class="mp-table-wrap"><table class="mp-table"><thead><tr><th>☐</th><th>Товар</th><th>SKU</th><th>Категорія</th><th>Ціна</th><th>Залишок</th><th>Статус</th><th>SEO</th><th>⋮</th></tr></thead><tbody>${rows.map(r=>`<tr><td>☐</td><td><div class="mp-product-cell"><img class="mp-product-thumb" src="${r[0]}" alt=""><div><div class="mp-product-name">${esc(r[1])}</div><div class="mp-product-sub">2 фото · 4 характеристики</div></div></div></td><td>${r[2]}</td><td>${r[3]}</td><td><b>${r[4]}</b></td><td>${r[5]}</td><td><span class="mp-badge ${r[6]==='Чернетка'?'is-warn':''}">${r[6]}</span></td><td><span class="mp-badge is-blue">92</span></td><td>${btn('Редагувати','mp-btn--small')}</td></tr>`).join('')}</tbody></table></div>
    <div class="mp-grid-equal" style="margin-top:12px"><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Product Editor · майбутній workspace</div></div><div class="mp-card__body"><div class="mp-form-grid"><div class="mp-field is-wide"><label>Назва товару</label><input placeholder="Сковорода з диска борони 50 см"></div><div class="mp-field"><label>SKU</label><input placeholder="SK-50"></div><div class="mp-field"><label>Категорія</label><select><option>Сковорідки</option></select></div><div class="mp-field"><label>Ціна</label><input placeholder="1450"></div><div class="mp-field"><label>Стара ціна</label><input placeholder="1650"></div></div></div></section><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Готовність товару</div></div><div class="mp-card__body"><div class="mp-check-list"><div class="mp-check"><span>Основні дані</span><b>✓</b></div><div class="mp-check"><span>Фото / ALT</span><b class="warn">1 warning</b></div><div class="mp-check"><span>Google fields</span><b>✓</b></div><div class="mp-check"><span>SEO</span><b>92/100</b></div></div></div></section></div>
  </section>`;
}

function categoriesPage(){return `<section class="mp-page" data-mp-page-view="categories">${pageHead('categories','Категорії','Ієрархія категорій, зображення, SEO, автоматична ціна від/до та характеристики для наших Category Card.',['Імпорт','Порядок','+ Додати категорію'])}
  <div class="mp-grid-2"><section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Дерево категорій</div><div class="mp-card__hint">Drag & drop закладено на наступний етап</div></div>${btn('Розгорнути всі','mp-btn--small')}</div><div class="mp-card__body"><div class="mp-category-tree">
    <div class="mp-tree-row"><span>⋮⋮</span><img class="mp-tree-thumb" src="${DEMO_IMG}"><div><div class="mp-tree-name">Сковорідки</div><div class="mp-tree-meta">38 товарів · 800–1700 грн · 30–80 см</div></div>${btn('Редагувати','mp-btn--small')}</div>
    <div class="mp-tree-row is-child"><span>⋮⋮</span><img class="mp-tree-thumb" src="${DEMO_IMG}"><div><div class="mp-tree-name">Комплекти</div><div class="mp-tree-meta">12 товарів</div></div>${btn('Редагувати','mp-btn--small')}</div>
    <div class="mp-tree-row"><span>⋮⋮</span><img class="mp-tree-thumb" src="${DEMO_IMG_2}"><div><div class="mp-tree-name">Казани</div><div class="mp-tree-meta">24 товари · від 1 300 грн · 6–12 л</div></div>${btn('Редагувати','mp-btn--small')}</div>
    <div class="mp-tree-row"><span>⋮⋮</span><img class="mp-tree-thumb" src="${DEMO_IMG_3}"><div><div class="mp-tree-name">Мангали</div><div class="mp-tree-meta">16 товарів</div></div>${btn('Редагувати','mp-btn--small')}</div>
  </div></div></section><section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Редактор категорії</div><div class="mp-card__hint">Майбутній data binding</div></div></div><div class="mp-card__body"><div class="mp-form-grid"><div class="mp-field is-wide"><label>Назва</label><input value="Сковорідки"></div><div class="mp-field"><label>Slug</label><input value="skovoridky"></div><div class="mp-field"><label>Батьківська</label><select><option>— Коренева —</option></select></div><div class="mp-field"><label>Ключ основної характеристики</label><input value="category.attributes.diameter"></div><div class="mp-field"><label>Шаблон Category Card</label><select><option>01 · Classic</option><option>02 · Overlay</option></select></div><div class="mp-field is-wide"><label>SEO опис</label><textarea placeholder="SEO опис категорії…"></textarea></div></div></div></section></div>
</section>`;}

function attributesPage(){return `<section class="mp-page" data-mp-page-view="attributes">${pageHead('attributes','Характеристики','Глобальний словник даних: діаметр, товщина, колір, матеріал, об’єм, розмір та інші поля.',['Імпорт словника','+ Характеристика'])}
  <div class="mp-toolbar"><label class="mp-search">⌕<input placeholder="Знайти характеристику…"></label><select class="mp-select"><option>Усі типи</option><option>Число + одиниця</option><option>Список</option><option>Колір</option></select>${btn('Групи атрибутів','mp-btn--small')}</div>
  <div class="mp-table-wrap"><table class="mp-table" style="min-width:720px"><thead><tr><th>Назва</th><th>Ключ</th><th>Тип</th><th>Одиниця</th><th>Фільтр</th><th>Варіація</th><th>⋮</th></tr></thead><tbody>${[['Діаметр','diameter','Число + одиниця','см','Так','Ні'],['Товщина','thickness','Число + одиниця','мм','Так','Ні'],['Колір','color','Колір / swatch','—','Так','Так'],['Розмір','size','Список','—','Так','Так'],['Матеріал','material','Список','—','Так','Ні']].map(r=>`<tr><td><b>${r[0]}</b></td><td>category.attributes.${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${chip(r[4],r[4]==='Так'?'is-green':'')}</td><td>${chip(r[5],r[5]==='Так'?'is-purple':'')}</td><td>${btn('Налаштувати','mp-btn--small')}</td></tr>`).join('')}</tbody></table></div>
</section>`;}

function variantsPage(){return `<section class="mp-page" data-mp-page-view="variants">${pageHead('variants','Варіації','Конструктор option sets та комбінацій SKU: розмір, колір, комплектація та будь-які атрибути.',['Пресети варіацій','+ Набір варіацій'])}<div class="mp-grid-2"><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Набір «Розмір + Колір»</div>${btn('Генерувати комбінації','mp-btn--small')}</div><div class="mp-card__body"><div class="mp-field"><label>Розмір</label><div class="mp-chip-row">${['XL','XXL','XXXL'].map(x=>chip(x,'is-green')).join('')}</div></div><div class="mp-field" style="margin-top:12px"><label>Колір</label><div class="mp-chip-row">${['● Чорний','○ Білий','● Синій'].map(x=>chip(x,'is-purple')).join('')}</div></div></div></section><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Комбінації</div><span class="mp-badge">9 SKU</span></div><div class="mp-card__body"><div class="mp-check-list">${['XL / Чорний','XL / Білий','XXL / Чорний','XXXL / Синій'].map(x=>`<div class="mp-check"><span>${x}</span><b>SKU · ціна · залишок</b></div>`).join('')}</div></div></section></div></section>`;}

function filtersPage(){return `<section class="mp-page" data-mp-page-view="filters">${pageHead('filters','Фільтри каталогу','Фільтри будуються з характеристик, а не дублюють дані. Тут же закладаємо SEO-policy для faceted navigation.',['SEO правила','Порядок','+ Фільтр'])}
  <div class="mp-grid-equal"><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Сковорідки · активні фільтри</div></div><div class="mp-card__body"><div class="mp-check-list">${[['Ціна','Range slider'],['Діаметр','30 · 40 · 50 · 60 · 70 · 80'],['Товщина','4 · 5 · 6 · 7 мм'],['Комплектація','Кришка · Чохол · Підставка']].map(r=>`<div class="mp-check"><span><b>${r[0]}</b><br>${r[1]}</span>${btn('⚙','mp-btn--small')}</div>`).join('')}</div></div></section><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">SEO для фільтрів</div><span class="mp-badge is-warn">IMPORTANT</span></div><div class="mp-card__body"><div class="mp-form-grid"><div class="mp-field"><label>SEO URL</label><select><option>Тільки дозволені комбінації</option></select></div><div class="mp-field"><label>Canonical</label><select><option>Auto</option></select></div><div class="mp-field"><label>Noindex dynamic URLs</label><select><option>Увімкнено</option></select></div><div class="mp-field"><label>Crawl policy</label><select><option>Safe</option></select></div></div></div></section></div></section>`;}

function importExportPage(){return `<section class="mp-page" data-mp-page-view="import-export">${pageHead('import-export','Імпорт / Експорт','Wizard для XML, CSV, XLSX та URL Feed. На цьому етапі кнопки безпечно показують заглушки — parser і MarketplaceStore підключимо окремо.',['Історія','Експорт','+ Новий імпорт'])}
  <div class="mp-grid-2"><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Джерело даних</div></div><div class="mp-card__body"><div class="mp-form-grid">${['XML файл','CSV / XLSX','URL Feed','Google Sheet','Копія з каталогу','JSON'].map(x=>btn(x,x==='XML файл'?'mp-btn--primary':'' )).join('')}</div></div></section><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Import flow</div></div><div class="mp-card__body"><div class="mp-check-list"><div class="mp-check"><span>1 · Джерело</span><b>→</b></div><div class="mp-check"><span>2 · Mapping полів</span><b>→</b></div><div class="mp-check"><span>3 · Preview 20 записів</span><b>→</b></div><div class="mp-check"><span>4 · Validation</span><b>→</b></div><div class="mp-check"><span>5 · Import transaction</span><b>✓</b></div></div></div></section></div>
  <section class="mp-card" style="margin-top:12px"><div class="mp-card__head"><div><div class="mp-card__title">Mapping Wizard</div><div class="mp-card__hint">Приклад майбутнього mapping</div></div>${btn('Автовизначення','mp-btn--small')}</div><div class="mp-card__body"><div class="mp-table-wrap"><table class="mp-table" style="min-width:680px"><thead><tr><th>Джерело</th><th>Приклад</th><th>→ Наше поле</th><th>Статус</th></tr></thead><tbody>${[['g:id','SK-50','product.sku','OK'],['g:title','Сковорода 50 см','product.name','OK'],['g:price','1450 UAH','product.price','OK'],['diameter','50','product.attributes.diameter','CHECK'],['thickness','6','product.attributes.thickness','OK']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td><select class="mp-select"><option>${r[2]}</option></select></td><td><span class="mp-badge ${r[3]==='CHECK'?'is-warn':''}">${r[3]}</span></td></tr>`).join('')}</tbody></table></div></div></section>
</section>`;}

function feedsPage(){return `<section class="mp-page" data-mp-page-view="feeds">${pageHead('feeds','XML / Feed Manager','Один MarketplaceStore → різні exporters і mapping presets для кожного каналу.',['Validator','Розклад','+ Новий feed'])}<div class="mp-grid-equal">${[['Google Merchant','184 товарів','OK'],['Meta Catalog','184 товарів','OK'],['Prom','180 товарів','4 поля'],['Rozetka','172 товари','Mapping']].map((r,i)=>`<section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">${r[0]}</div><div class="mp-card__hint">${r[1]}</div></div><span class="mp-badge ${i>1?'is-warn':''}">${r[2]}</span></div><div class="mp-card__body"><div class="mp-check-list"><div class="mp-check"><span>Mapping preset</span><b>${i<2?'Ready':'Check'}</b></div><div class="mp-check"><span>Остання перевірка</span><b>Сьогодні</b></div><div class="mp-check"><span>Автооновлення</span><b>Кожні 6 год</b></div></div><div style="margin-top:10px">${btn('Відкрити feed','mp-btn--small')}</div></div></section>`).join('')}</div></section>`;}
function channelsPage(){return `<section class="mp-page" data-mp-page-view="channels">${pageHead('channels','Канали продажу','Публікація одного каталогу у зовнішні канали без дублювання товарних даних.',['+ Підключити канал'])}<div class="mp-stat-grid">${[['Google Merchant','● Ready'],['Meta Catalog','● Ready'],['Prom','⚠ Mapping'],['Rozetka','○ Draft']].map((r,i)=>`<div class="mp-stat"><div class="mp-stat__icon">${['G','M','P','R'][i]}</div><div class="mp-stat__value" style="font-size:16px">${r[0]}</div><div class="mp-stat__label">${r[1]}</div><div class="mp-stat__trend">${i<2?'Синхронізація готова':'Потребує налаштування'}</div></div>`).join('')}</div></section>`;}
function presetsPage(){return `<section class="mp-page" data-mp-page-view="presets">${pageHead('presets','Пресети маркетплейсу','Готові набори attributes, filters, variants і feed mapping для типових категорій.',['Імпорт пресета','+ Новий пресет'])}<div class="mp-grid-equal">${[['Сковорідки','Діаметр · Товщина · Комплектація · Ціна'],['Одяг','Розмір · Колір · Матеріал · Стать'],['Електроніка','Бренд · Пам’ять · Колір · Потужність'],['Казани','Об’єм · Матеріал · Комплектація']].map(r=>`<section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">${r[0]}</div><span class="mp-badge is-gray">PRESET</span></div><div class="mp-card__body"><p class="mp-card__hint">${r[1]}</p><div style="margin-top:10px">${btn('Застосувати','mp-btn--small')} ${btn('Редагувати','mp-btn--small')}</div></div></section>`).join('')}</div></section>`;}
function recommendationsPage(){return `<section class="mp-page" data-mp-page-view="recommendations">${pageHead('recommendations','Рекомендації','Один engine для схожих товарів, разом купують, доповнень, хітів, новинок і недавно переглянутих.',['Пріоритети','+ Правило'])}<div class="mp-grid-2"><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Правила</div></div><div class="mp-card__body"><div class="mp-check-list">${['Схожі · категорія + ціна ±30%','Доповнення · ручні + автоматичні','Хіти · продажі за 30 днів','Новинки · дата створення','Разом купують · поведінкові дані'].map(x=>`<div class="mp-check"><span>${x}</span>${btn('⚙','mp-btn--small')}</div>`).join('')}</div></div></section><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Режим</div></div><div class="mp-card__body"><div class="mp-chip-row">${['Автоматично','Вручну','Правила','Змішаний'].map((x,i)=>chip(x,i===3?'is-green':'' )).join('')}</div></div></section></div></section>`;}
function searchPage(){return `<section class="mp-page" data-mp-page-view="search">${pageHead('search','Пошук і Discovery','Синоніми, boosts, autocomplete, популярні запити та запити без результатів.',['Search analytics','+ Синонім'])}<div class="mp-grid-equal"><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Синоніми</div></div><div class="mp-card__body"><div class="mp-check-list"><div class="mp-check"><span>сковорідка</span><b>пательня</b></div><div class="mp-check"><span>мангал</span><b>барбекю</b></div><div class="mp-check"><span>чохол</span><b>сумка</b></div></div></div></section><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Product boosts</div></div><div class="mp-card__body"><div class="mp-check"><span>“подарунок чоловіку”</span><b>Шампури · Наливатори</b></div></div></section></div></section>`;}
function seoPage(){return `<section class="mp-page" data-mp-page-view="seo">${pageHead('seo','SEO Center','Meta templates, canonical, sitemap, structured data, merchant listing readiness і контроль індексації.',['Sitemap','Meta templates','Запустити SEO аудит'])}<div class="mp-stat-grid"><div class="mp-stat"><div class="mp-stat__value">92</div><div class="mp-stat__label">SEO Health</div><div class="mp-stat__trend">Добрий стан</div></div><div class="mp-stat"><div class="mp-stat__value">184</div><div class="mp-stat__label">Product URLs</div><div class="mp-stat__trend">182 indexable</div></div><div class="mp-stat"><div class="mp-stat__value">17</div><div class="mp-stat__label">Без ALT</div><div class="mp-stat__trend is-warn">Потребують уваги</div></div><div class="mp-stat"><div class="mp-stat__value">0</div><div class="mp-stat__label">Critical errors</div><div class="mp-stat__trend">✓</div></div></div><div class="mp-grid-equal"><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Structured Data</div><span class="mp-badge">SCHEMA</span></div><div class="mp-card__body"><div class="mp-chip-row">${['Product','ProductGroup','Offer','AggregateOffer','BreadcrumbList','Organization','Shipping','Returns'].map(x=>chip(x,'is-green')).join('')}</div></div></section><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Indexing policy</div></div><div class="mp-card__body"><div class="mp-check-list"><div class="mp-check"><span>Product pages</span><b>Index</b></div><div class="mp-check"><span>Categories</span><b>Index</b></div><div class="mp-check"><span>Dynamic filter combinations</span><b class="warn">Noindex</b></div><div class="mp-check"><span>Canonical</span><b>Auto</b></div></div></div></section></div></section>`;}
function settingsPage(){return `<section class="mp-page" data-mp-page-view="settings">${pageHead('settings','Marketplace Settings','Каркас глобальних правил магазину. Реальні значення підключимо разом із MarketplaceStore.',['Перевірити систему','Зберегти налаштування'])}<div class="mp-grid-equal"><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Основні правила</div></div><div class="mp-card__body"><div class="mp-form-grid"><div class="mp-field"><label>Валюта</label><select><option>UAH · грн</option></select></div><div class="mp-field"><label>Locale</label><select><option>uk-UA</option></select></div><div class="mp-field"><label>SKU policy</label><select><option>Unique required</option></select></div><div class="mp-field"><label>Draft policy</label><select><option>Не експортувати</option></select></div></div></div></section><section class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Операційні модулі</div></div><div class="mp-card__body"><div class="mp-chip-row">${['Доставка','Оплата','Податки','Локалізація','Автоматизація','Діагностика'].map(x=>chip(x,'is-purple')).join('')}</div><div style="margin-top:12px">${btn('Marketplace diagnostics','mp-btn--primary')}</div></div></section></div></section>`;}

function contextHtml(){return `<aside class="mp-context"><div class="mp-context__block"><div class="mp-context__eyebrow">Marketplace</div><div class="mp-context__title">Стан системи</div><div class="mp-context__metric"><span>Studio shell</span><b>${MP_STAGE}</b></div><div class="mp-context__metric"><span>MarketplaceStore</span><b>Наступний етап</b></div><div class="mp-context__metric"><span>Product binding</span><b>Підготовлено</b></div><div class="mp-context__metric"><span>Category binding</span><b>Підготовлено</b></div></div><div class="mp-context__block"><div class="mp-context__eyebrow">Architecture</div><div class="mp-context__title">Джерела правди</div><div class="mp-context__notice"><b>SiteFrameStore</b><br>Тільки дизайн сайту.<br><br><b>MarketplaceStore</b><br>Товари, категорії, attributes, variants, feeds, SEO.</div></div><div class="mp-context__block"><div class="mp-context__eyebrow">Безпека етапу</div><div class="mp-context__title">Stub mode</div><div class="mp-context__notice is-warn">Кнопки CRUD/імпорту/експорту зараз не змінюють дані. Вони позначають майбутні точки підключення API.</div></div></aside>`;}

function genericPageFor(id){
  const found=GROUPS.flatMap(g=>g.items).find(x=>x[0]===id);
  if(!found)return null;
  const [_,icon,name,meta,actions]=found;
  return `<section class="mp-page" data-mp-page-view="${esc(id)}">${pageHead(id,`${icon} ${name}`,meta,actions.slice(0,2))}<div class="mp-empty-panel"><div><div class="mp-empty-panel__icon">${esc(icon)}</div><h3>${esc(name)} · каркас готовий</h3><p>Навігація, Inspector і workspace для цього модуля вже зарезервовані. Функціональну модель даних та операції підключимо поетапно після MarketplaceStore.</p>${btn('Відкрити майбутні налаштування','mp-btn--primary')}</div></div></section>`;
}

function ensureGenericPages(studio){
  const content=studio.querySelector('.mp-content');
  if(!content)return;
  GROUPS.flatMap(g=>g.items).forEach(item=>{
    const id=item[0];
    if(content.querySelector(`[data-mp-page-view="${CSS.escape(id)}"]`))return;
    const html=genericPageFor(id);
    if(html)content.insertAdjacentHTML('beforeend',html);
  });
}

function showToast(label){
  let el=document.getElementById('mp-toast-01051');
  if(!el){el=document.createElement('div');el.id='mp-toast-01051';el.className='mp-toast';document.body.appendChild(el);}
  el.innerHTML=`<b>Заглушка Marketplace Studio</b>${esc(label)} — точка інтерфейсу готова. Реальну дію підключимо на відповідному етапі.`;
  el.classList.add('is-show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>el.classList.remove('is-show'),2200);
}

function activatePage(id){
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(!studio)return;
  const actual=id||'overview';
  let page=studio.querySelector(`[data-mp-page-view="${CSS.escape(actual)}"]`);
  if(!page){const alias=PAGE_ALIASES[actual];if(alias)page=studio.querySelector(`[data-mp-page-view="${CSS.escape(alias)}"]`);}
  if(!page)page=studio.querySelector('[data-mp-page-view="overview"]');
  studio.querySelectorAll('.mp-page').forEach(x=>x.classList.toggle('is-active',x===page));
  const activeId=page?.getAttribute('data-mp-page-view')||'overview';
  studio.querySelectorAll('[data-mp-page]').forEach(b=>b.classList.toggle('is-active',b.getAttribute('data-mp-page')===activeId));
  savePage(actual);
  const scroll=document.querySelector('.canvas__scroll--full');
  try{if(scroll)scroll.scrollTop=0;}catch{}
}

function bindInspector(panel){
  const openSet=loadOpen();
  panel.addEventListener('click',e=>{
    const head=e.target.closest('[data-mp-accordion-head]');
    if(head){
      const id=head.getAttribute('data-mp-accordion-head');const acc=head.closest('.mp-accordion');
      acc?.classList.toggle('is-open');
      if(acc?.classList.contains('is-open'))openSet.add(id);else openSet.delete(id);
      saveOpen(openSet);activatePage(id);return;
    }
    const page=e.target.closest('[data-mp-page]');if(page){activatePage(page.getAttribute('data-mp-page'));return;}
    const action=e.target.closest('[data-mp-action]');if(action){showToast(action.getAttribute('data-mp-action'));}
  });
}
function bindStudio(studio){
  studio.addEventListener('click',e=>{
    const exit=e.target.closest('[data-mp-exit]');if(exit){try{document.getElementById('navDesign')?.click();}catch{}return;}
    const page=e.target.closest('[data-mp-page]');if(page){activatePage(page.getAttribute('data-mp-page'));return;}
    const action=e.target.closest('[data-mp-action]');if(action){showToast(action.getAttribute('data-mp-action'));}
  });
}

function syncSettingsHeader(key){
  const title=document.querySelector('#builder-settings-sidebar .builder__settings-title');
  if(!title)return;
  if(key==='marketplace'){
    if(!title.dataset.mpOriginal)title.dataset.mpOriginal=title.textContent||'Налаштування';
    title.textContent='Marketplace';
  } else if(title.dataset.mpOriginal){title.textContent=title.dataset.mpOriginal;}
}

export function initMarketplaceStudio01051(){
  const panel=document.getElementById('marketplace-panel-root');
  const view=document.getElementById('marketplaceStudioView');
  if(!panel||!view)return;
  if(panel.dataset.mpMounted==='1')return;
  panel.dataset.mpMounted='1';
  panel.innerHTML=inspectorHtml(loadOpen());
  view.innerHTML=workspaceHtml();
  const studio=view.querySelector('[data-mp-studio="01051"]');
  ensureGenericPages(studio);
  bindInspector(panel);bindStudio(studio);
  activatePage(loadPage());
  window.addEventListener('st:workspace-view-changed',e=>syncSettingsHeader(e?.detail?.key||''));
  try { if (document.getElementById('builder-root')?.classList.contains('builder--mainview-marketplace')) syncSettingsHeader('marketplace'); } catch {}
  try{window.ST_MARKETPLACE_STUDIO_01051=Object.freeze({stage:MP_STAGE,activatePage,showToast});}catch{}
}
