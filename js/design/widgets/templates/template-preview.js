// js/design/widgets/templates/template-preview.js
// =========================================================
// [TEMPLATES][PREVIEW] Повноекранний перегляд шаблону
// - open({ title, html }) показує overlay на весь екран
// - ESC закриває і повертає в реальний режим
// - [00366] Universal preview navigation API:
//   onPrev/onNext/onApply + wheel/ArrowUp/ArrowDown/Enter.
//   Підключається вибірково з gallery-view для потрібних типів шаблонів.
// - [00368] Help popup у preview став інтерактивним floating layer:
//   не обрізається, не зникає при переході курсора на підказку, має свій scroll.
// =========================================================

const PID = "st-templates-preview";

const previewState = {
  isOpen: false,
  currentId: null,
  navEnabled: false,
  dblClickToClose: false,
  onPrev: null,
  onNext: null,
  onApply: null,
  helpKind: null,
  lastWheelAt: 0,
  helpTimer: null,
  helpHideTimer: null,
  helpAnchorHover: false,
  helpPopupHover: false,
  helpAnchor: null,
  kind: null,
  allowContentScroll: false,
  scrollObserver: null,
  scrollUpdateTimer: null,
  pendingClickNavTimer: null,
};

function isFn_(value) {
  return typeof value === "function";
}

function runNav_(dir) {
  if (!previewState.isOpen || !previewState.navEnabled) return false;
  const cb = dir < 0 ? previewState.onPrev : previewState.onNext;
  if (!isFn_(cb)) return false;
  try { cb(); } catch (err) { console.warn("[template-preview] navigation callback failed", err); }
  return true;
}

function runApply_() {
  if (!previewState.isOpen || !previewState.navEnabled || !isFn_(previewState.onApply)) return false;
  try { previewState.onApply(); } catch (err) { console.warn("[template-preview] apply callback failed", err); }
  return true;
}


function getPreviewHelpContent_(kind) {
  const k = String(kind || '').toLowerCase();

  if (k === 'header' || k === 'footer') {
    const isHeader = k === 'header';
    const subject = isHeader ? 'ШАПКИ' : 'ФУТЕРА';
    const label = isHeader ? 'шапки' : 'футера';
    const globalText = isHeader
      ? 'Глобал застосовує шапку для всього сайту. Вона буде однакова на всіх сторінках, поки для конкретної сторінки не задано Page-варіант.'
      : 'Глобал застосовує футер для всього сайту. Він буде однаковий на всіх сторінках, поки для конкретної сторінки не задано Page-варіант.';
    const pageText = isHeader
      ? 'Page застосовує шапку тільки для поточної сторінки. Це потрібно для сторінок, які мають мати власну шапку.'
      : 'Page застосовує футер тільки для поточної сторінки. Це потрібно для сторінок, які мають мати власний футер.';
    const wheelText = isHeader
      ? '<b>Колесо мишки</b> також перемикає шаблони: вгору — попередній, вниз — наступний.'
      : '<b>Колесо мишки</b> прокручує футер, якщо він вищий за вікно. Якщо внутрішнього скролу немає — колесо перемикає шаблони.';

    return {
      badge: 'ПІДКАЗКА ДЛЯ ПЕРЕГЛЯДУ',
      title: `КЕРУВАННЯ ПЕРЕГЛЯДОМ ${subject}`,
      html: `
        <div>Це велике вікно перегляду ${label}. Тут можна швидко переглядати шаблони без закриття вікна.</div>
        <div><b>Стрілки ↑ / ↓ справа у шапці</b> перемикають шаблони: вгору — попередній, вниз — наступний.</div>
        <div>${wheelText}</div>
        <div><b>Клавіатура:</b> ArrowUp / ArrowDown перемикають шаблони, <b>Enter</b> застосовує активний шаблон, <b>ESC</b> закриває перегляд.</div>
        <div><b>Подвійний клік</b> у вікні перегляду закриває його.</div>
        <div><b>Глобал:</b> ${globalText}</div>
        <div><b>Page:</b> ${pageText}</div>
        <div class="stpv-helpPopup__keys">
          <div class="stpv-helpPopup__key"><strong>↑ / ↓</strong>Перемкнути шаблон без закриття перегляду.</div>
          <div class="stpv-helpPopup__key"><strong>Колесо мишки</strong>Швидко гортати шаблони вгору/вниз.</div>
          <div class="stpv-helpPopup__key"><strong>Enter</strong>Застосувати шаблон, який зараз відкритий.</div>
          <div class="stpv-helpPopup__key"><strong>Global / Page</strong>Обрати, куди саме застосовувати шапку або футер.</div>
        </div>
      `
    };
  }

  if (k === 'main' || k === 'sections') {
    const isMain = k === 'main';
    const subject = isMain ? 'МАЇН' : 'СЕКЦІЙ';
    const label = isMain ? 'шаблону Маїн' : 'шаблону секції';
    return {
      badge: 'ПІДКАЗКА ДЛЯ ПЕРЕГЛЯДУ',
      title: `КЕРУВАННЯ ПЕРЕГЛЯДОМ ${subject}`,
      html: `
        <div>Це велике вікно перегляду ${label}. Воно використовує той самий preview-механізм, що й шапка та футер.</div>
        <div><b>Стрілки ↑ / ↓ справа у шапці</b>, клавіші <b>ArrowUp / ArrowDown</b> і колесо мишки перемикають шаблони без закриття вікна.</div>
        <div>Коли шаблон вищий за екран, колесо прокручує його. ЛКМ по шаблону відкриває наступний, ПКМ — попередній.</div>
        <div><b>Подвійний клік</b> у вікні перегляду закриває його. <b>ESC</b> також повертає назад.</div>
        <div>${isMain ? '<b>Застосувати / Enter:</b> відкриває підтвердження з кнопками <b>ДОДАТИ</b> та <b>ЗАМІНИТИ</b>. ДОДАТИ активна за замовчуванням.' : '<b>Застосувати / Enter:</b> вставляє відкритий шаблон у робочу область конструктора.'}</div>
        <div class="stpv-helpPopup__keys">
          <div class="stpv-helpPopup__key"><strong>↑ / ↓</strong>Попередній або наступний шаблон.</div>
          <div class="stpv-helpPopup__key"><strong>Enter</strong>${isMain ? 'Відкрити вибір ДОДАТИ / ЗАМІНИТИ.' : 'Застосувати відкритий шаблон.'}</div>
          <div class="stpv-helpPopup__key"><strong>Колесо</strong>Перемикання або прокрутка шаблону.</div>
          <div class="stpv-helpPopup__key"><strong>ЛКМ / ПКМ</strong>Для шаблону зі скролом: наступний / попередній.</div>
          <div class="stpv-helpPopup__key"><strong>ESC</strong>Закрити підказку або вікно перегляду.</div>
        </div>
      `
    };
  }

  if (k === 'photo-gallery') {
    return {
      badge: 'ПІДКАЗКА ДЛЯ ПЕРЕГЛЯДУ',
      title: 'КЕРУВАННЯ ПЕРЕГЛЯДОМ ФОТОГАЛЕРЕЇ',
      html: `
        <div>Це велике вікно перегляду шаблону фотогалереї. Воно займає майже всю висоту екрана, щоб сітку, меню категорій і preview-блоки було видно без зайвого скролу.</div>
        <div><b>Стрілки ↑ / ↓ справа у шапці</b> перемикають шаблони фотогалереї без закриття вікна.</div>
        <div><b>Клавіатура ArrowUp / ArrowDown</b> також перемикає шаблони, <b>Enter</b> застосовує активну фотогалерею, <b>ESC</b> закриває перегляд.</div>
        <div><b>Колесо мишки</b> перемикає фотогалереї тільки тоді, коли відкрита секція повністю поміщається у вікно. Якщо у фотогалереї є внутрішній скрол — колесо прокручує тільки її.</div>
        <div><b>Для фотогалереї зі скролом:</b> один клік лівою кнопкою миші по області шаблону відкриває наступну фотогалерею, а клік правою кнопкою миші — попередню.</div>
        <div><b>Подвійний клік</b> у вікні перегляду закриває його. Подвійний клік по превʼю в галереї відкриває перегляд.</div>
        <div><b>Застосувати / Enter:</b> вставляє відкриту фотогалерею в Content як окрему секцію без ручного повторного вибору.</div>
        <div class="stpv-helpPopup__keys">
          <div class="stpv-helpPopup__key"><strong>↑ / ↓</strong>Попередня або наступна фотогалерея.</div>
          <div class="stpv-helpPopup__key"><strong>Enter</strong>Застосувати відкритий шаблон.</div>
          <div class="stpv-helpPopup__key"><strong>Колесо</strong>Перемикання без скролу. Якщо є скрол — прокрутка шаблону.</div>
          <div class="stpv-helpPopup__key"><strong>ЛКМ / ПКМ</strong>Для фотогалереї зі скролом: наступна / попередня.</div>
          <div class="stpv-helpPopup__key"><strong>ESC</strong>Закрити підказку або вікно перегляду.</div>
        </div>
      `
    };
  }

  if (k === 'menu') {
    return {
      badge: 'ПІДКАЗКА ДЛЯ ПЕРЕГЛЯДУ',
      title: 'КЕРУВАННЯ ПЕРЕГЛЯДОМ МЕНЮ',
      html: `
        <div>Це велике вікно перегляду дизайну меню. Шаблон змінює тільки стиль, а тексти пунктів і посилання вибраного меню залишаються.</div>
        <div><b>Стрілки ↑ / ↓</b> у шапці вікна або на клавіатурі перемикають дизайни меню без закриття preview.</div>
        <div><b>Колесо мишки</b> також перемикає меню: вгору — попередній дизайн, вниз — наступний.</div>
        <div><b>Enter</b> або кнопка <b>Застосувати</b> переносить дизайн на активне меню.</div>
        <div><b>Горизонтальні меню</b> використовуй для шапки, <b>вертикальні</b> — для сайтбара.</div>
        <div><b>Заливка</b> редагує фон і рамку самого блока меню. Пункти/кнопки меню редагуються окремо через віджет “Меню”.</div>
        <div class="stpv-helpPopup__keys">
          <div class="stpv-helpPopup__key"><strong>↑ / ↓</strong>Попередній або наступний дизайн.</div>
          <div class="stpv-helpPopup__key"><strong>Колесо</strong>Швидко гортати дизайни меню.</div>
          <div class="stpv-helpPopup__key"><strong>Enter</strong>Застосувати дизайн до вибраного меню.</div>
          <div class="stpv-helpPopup__key"><strong>ESC</strong>Закрити підказку або preview.</div>
        </div>
      `
    };
  }

  return null;
}

function clearHelpTimer_() {
  if (previewState.helpTimer) {
    clearTimeout(previewState.helpTimer);
    previewState.helpTimer = null;
  }
}

function clearHelpHideTimer_() {
  if (previewState.helpHideTimer) {
    clearTimeout(previewState.helpHideTimer);
    previewState.helpHideTimer = null;
  }
}

function isPreviewHelpOpen_() {
  const popup = document.getElementById('stpvHelpPopup');
  return !!popup && popup.classList.contains('is-open') && popup.style.display !== 'none';
}

function hidePreviewHelp_() {
  clearHelpTimer_();
  clearHelpHideTimer_();
  previewState.helpAnchorHover = false;
  previewState.helpPopupHover = false;
  previewState.helpAnchor = null;
  const popup = document.getElementById('stpvHelpPopup');
  if (popup) {
    popup.classList.remove('is-open');
    popup.style.display = 'none';
  }
}

function requestHidePreviewHelp_() {
  clearHelpTimer_();
  clearHelpHideTimer_();
  previewState.helpHideTimer = setTimeout(() => {
    previewState.helpHideTimer = null;
    if (previewState.helpAnchorHover || previewState.helpPopupHover) return;
    const popup = document.getElementById('stpvHelpPopup');
    if (popup) {
      popup.classList.remove('is-open');
      popup.style.display = 'none';
    }
  }, 650);
}

function bindPreviewHelpPopup_(popup) {
  if (!popup || popup.__stpvHelpBound) return;
  popup.__stpvHelpBound = true;

  popup.addEventListener('mouseenter', () => {
    previewState.helpPopupHover = true;
    clearHelpHideTimer_();
  });

  popup.addEventListener('mouseleave', () => {
    previewState.helpPopupHover = false;
    requestHidePreviewHelp_();
  });

  popup.addEventListener('wheel', (e) => {
    // Якщо у підказці колись зʼявиться scroll, колесо має скролити саме підказку,
    // а не перемикати шаблони у preview-вікні під нею.
    const canScroll = popup.scrollHeight > popup.clientHeight + 2;
    if (canScroll) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
  }, { passive: true });
}

function positionPreviewHelp_(popup, anchor) {
  if (!popup || !anchor || !anchor.getBoundingClientRect) return;
  const rect = anchor.getBoundingClientRect();
  const margin = 14;
  const gap = 12;
  const vw = window.innerWidth || document.documentElement.clientWidth || 1200;
  const vh = window.innerHeight || document.documentElement.clientHeight || 800;

  popup.style.display = 'block';
  popup.style.visibility = 'hidden';
  popup.style.left = '0px';
  popup.style.top = '0px';
  popup.style.width = `${Math.min(840, Math.max(340, vw - margin * 2))}px`;
  popup.style.maxHeight = `${Math.max(260, vh - margin * 2)}px`;

  const width = popup.offsetWidth || Math.min(840, Math.max(340, vw - margin * 2));
  const naturalH = popup.scrollHeight || popup.offsetHeight || 520;

  let left = rect.right - width;
  if (left < margin) left = margin;
  if (left + width + margin > vw) left = Math.max(margin, vw - width - margin);

  const belowTop = rect.bottom + gap;
  const aboveSpace = Math.max(0, rect.top - margin - gap);
  const belowSpace = Math.max(0, vh - belowTop - margin);
  const minGoodSpace = Math.min(520, Math.max(320, naturalH));
  const placeBelow = belowSpace >= minGoodSpace || belowSpace >= aboveSpace;

  let top;
  let maxH;
  if (placeBelow) {
    top = belowTop;
    maxH = Math.max(260, belowSpace);
  } else {
    maxH = Math.max(260, aboveSpace);
    top = Math.max(margin, rect.top - gap - Math.min(naturalH, maxH));
  }

  // Остання страховка: якщо через великий текст низ все одно виходить за екран,
  // зменшуємо max-height і лишаємо внутрішній scroll.
  if (top + maxH + margin > vh) {
    maxH = Math.max(220, vh - top - margin);
  }

  popup.style.left = `${Math.round(left)}px`;
  popup.style.top = `${Math.round(top)}px`;
  popup.style.maxHeight = `${Math.round(maxH)}px`;
  popup.style.visibility = 'visible';
}

function showPreviewHelp_(anchor) {
  const content = getPreviewHelpContent_(previewState.helpKind);
  if (!content || !anchor) return;
  let popup = document.getElementById('stpvHelpPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'stpvHelpPopup';
    popup.className = 'stpv-helpPopup';
    popup.setAttribute('role', 'tooltip');
    document.body.appendChild(popup);
    bindPreviewHelpPopup_(popup);
  } else {
    bindPreviewHelpPopup_(popup);
  }
  popup.innerHTML = `
    <div class="stpv-helpPopup__badge">${content.badge}</div>
    <div class="stpv-helpPopup__title">${content.title}</div>
    <div class="stpv-helpPopup__text">${content.html}</div>
  `;
  previewState.helpAnchor = anchor;
  popup.classList.add('is-open');
  positionPreviewHelp_(popup, anchor);
}

function schedulePreviewHelp_(anchor) {
  clearHelpTimer_();
  clearHelpHideTimer_();
  if (!previewState.isOpen || !previewState.navEnabled || !getPreviewHelpContent_(previewState.helpKind)) return;
  previewState.helpAnchor = anchor || null;
  previewState.helpTimer = setTimeout(() => {
    previewState.helpTimer = null;
    if (!previewState.isOpen || !anchor || !document.body.contains(anchor)) return;
    if (!previewState.helpAnchorHover && !previewState.helpPopupHover) return;
    showPreviewHelp_(anchor);
  }, 3000);
}

function ensureStyles() {
  if (document.getElementById("st-templates-preview-styles")) return;

  const st = document.createElement("style");
  st.id = "st-templates-preview-styles";
  st.textContent = `
    #${PID}{
      position:fixed; inset:0; z-index:999999;
      background:rgba(0,0,0,.75);
      display:none;
      align-items:center; justify-content:center;
      padding:28px;
    }
    #${PID}.is-open{ display:flex; }
    #${PID} .stpv-box{
      width:min(1200px, 96vw);
      height:min(680px, 92vh);
      background:rgba(10,16,28,.96);
      border:1px solid rgba(255,255,255,.10);
      border-radius:18px;
      box-shadow:0 20px 60px rgba(0,0,0,.45);
      overflow:hidden;
      display:flex;
      flex-direction:column;
    }
    #${PID} .stpv-top{
      display:flex;align-items:center;justify-content:space-between;gap:12px;
      padding:12px 14px;
      border-bottom:1px solid rgba(255,255,255,.08);
    }
    #${PID} .stpv-titleWrap{min-width:0;}
    #${PID} .stpv-title{font-weight:800;font-size:14px;opacity:.95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(720px, 62vw)}
    #${PID} .stpv-hint{font-size:12px;opacity:.70;margin-top:2px;}
    #${PID}.is-content-scrollable .stpv-hint{opacity:1;color:#fde68a;font-weight:800;}
    #${PID}.is-content-scrollable .stpv-body{cursor:pointer;}
    #${PID}.is-content-scrollable .stpv-body:active{cursor:grabbing;}
    #${PID} .stpv-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto;}
    #${PID} .stpv-nav{display:none;align-items:center;gap:6px;}
    #${PID}.has-nav .stpv-nav{display:flex;}
    #${PID} .stpv-navBtn,
    #${PID} .stpv-apply,
    #${PID} .stpv-close{
      border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.06);
      color:inherit;border-radius:10px;
      padding:8px 10px;cursor:pointer;
      min-width:38px;
      font-weight:900;
      line-height:1;
    }
    #${PID} .stpv-apply{
      display:none;
      min-width:auto;
      padding:8px 14px;
      border-color:rgba(96,165,250,.55);
      background:linear-gradient(90deg, rgba(37,99,235,.96), rgba(29,78,216,.96));
      color:#fff;
      box-shadow:0 10px 28px rgba(37,99,235,.24);
    }
    #${PID}.has-nav .stpv-apply{display:inline-flex;align-items:center;justify-content:center;}
    #${PID} .stpv-navBtn:hover,
    #${PID} .stpv-apply:hover,
    #${PID} .stpv-close:hover{
      background:rgba(255,255,255,.12);
      border-color:rgba(255,255,255,.24);
    }
    #${PID} .stpv-apply:hover{
      background:linear-gradient(90deg, rgba(59,130,246,.98), rgba(37,99,235,.98));
      border-color:rgba(147,197,253,.82);
    }
    #${PID} .stpv-navBtn:active,
    #${PID} .stpv-apply:active,
    #${PID} .stpv-close:active{transform:translateY(1px);}
    #${PID} .stpv-close{min-width:auto;padding:8px 10px;}
    #${PID} .stpv-body{
      padding:16px;
      overflow:auto;
    }
    #${PID} .stpv-stage{
      border:1px dashed rgba(255,255,255,.18);
      border-radius:14px;
      padding:18px;
      min-height:140px;
      background:rgba(255,255,255,.03);
    }

    /* [00376/00393/00968] Footer/Content/Sections/Photo-gallery fullscreen preview: майже вся висота екрана.
       [00393] Прибираємо штучний min-height:100% у stage, бо він міг створювати
       внутрішній скрол навіть тоді, коли сама секція фізично влазить у viewport.
       Скрол має зʼявлятись тільки від реальної висоти шаблону. */
    #${PID}.is-tall-template{
      padding:10px;
      align-items:stretch;
      justify-content:center;
    }
    #${PID}.is-tall-template .stpv-box{
      width:min(1480px, calc(100vw - 20px));
      height:calc(100vh - 20px);
      max-height:calc(100vh - 20px);
      border-radius:20px;
    }
    #${PID}.is-tall-template .stpv-top{
      flex:0 0 auto;
    }
    #${PID}.is-tall-template .stpv-body{
      flex:1 1 auto;
      min-height:0;
      padding:12px;
      overflow:auto;
      overscroll-behavior:contain;
    }
    #${PID}.is-tall-template .stpv-stage{
      min-height:0;
      padding:0;
      overflow:visible;
      border-radius:16px;
      background:rgba(255,255,255,.02);
      box-sizing:border-box;
    }
    #${PID}.is-tall-template .stpv-stage > .st-section,
    #${PID}.is-tall-template .stpv-stage > main,
    #${PID}.is-tall-template .stpv-stage > section{
      width:100%;
      max-width:100%;
      box-sizing:border-box;
    }
    #${PID}.is-tall-template .stpv-stage > .st-section:only-child,
    #${PID}.is-tall-template .stpv-stage > section:only-child,
    #${PID}.is-tall-template .stpv-stage > main:only-child{
      margin-top:0 !important;
      margin-bottom:0 !important;
    }

    /* [00369] Header/Footer template layout safety inside preview overlay */
    #${PID} .stpv-stage .st-section[data-sec-role="header"],
    #${PID} .stpv-stage .st-section[data-sec-role="footer"]{
      width:100%;max-width:100%;box-sizing:border-box;overflow:visible;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-row,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-row{
      box-sizing:border-box;overflow:visible;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-row[data-st-footer-no-wrap-resize00458="1"]{
      flex-wrap:nowrap !important;width:100% !important;max-width:100% !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-row[data-st-footer-no-wrap-resize00458="1"] > .st-block{
      min-width:0 !important;box-sizing:border-box !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-block,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-block{
      box-sizing:border-box;
    }


    /* [00460][SOCIAL ICONS IN FULL PREVIEW]
       Fullscreen template preview is also outside the real canvas header/footer slots,
       so it needs the same icon/SVG sizing contract as css/site-canvas.css. */
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-block--icon,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-block--icon{
      display:inline-flex !important;
      align-items:center !important;
      justify-content:center !important;
      overflow:visible !important;
      color:inherit;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-icon-btn,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-icon-btn{
      display:inline-flex !important;
      align-items:center !important;
      justify-content:center !important;
      overflow:hidden !important;
      color:inherit;
      line-height:0 !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-icon-svg,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-icon-svg,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-icon-btn__glyph,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-icon-btn__glyph,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-phone__iconsvg,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-phone__iconsvg,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-button__iconsvg,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-button__iconsvg,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-logo__iconsvg,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-logo__iconsvg{
      display:inline-flex !important;
      align-items:center !important;
      justify-content:center !important;
      width:var(--st-icon-size, 20px) !important;
      height:var(--st-icon-size, 20px) !important;
      min-width:var(--st-icon-size, 20px) !important;
      min-height:var(--st-icon-size, 20px) !important;
      line-height:0 !important;
      color:inherit !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-icon-svg svg,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-icon-svg svg,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-icon-btn__glyph svg,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-icon-btn__glyph svg,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-phone__iconsvg svg,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-phone__iconsvg svg,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-button__iconsvg svg,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-button__iconsvg svg,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-logo__iconsvg svg,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-logo__iconsvg svg{
      width:100% !important;
      height:100% !important;
      display:block !important;
      flex:0 0 auto !important;
      fill:currentColor;
      overflow:visible !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-icon-svg svg[fill="none"],
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-icon-svg svg[fill="none"],
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-icon-btn__glyph svg[fill="none"],
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-icon-btn__glyph svg[fill="none"],
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-phone__iconsvg svg[fill="none"],
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-phone__iconsvg svg[fill="none"],
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-button__iconsvg svg[fill="none"],
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-button__iconsvg svg[fill="none"],
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-logo__iconsvg svg[fill="none"],
    #${PID} .stpv-stage .st-section[data-sec-role="footer"] .st-logo__iconsvg svg[fill="none"]{
      fill:none !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-logo__title,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-logo__subtitle,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-phone__text,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-button__label,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-menu__text,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-menu__link,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-block--heading > .st-text-edit,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"]:not([data-hf-authored-template]) .st-logo__title,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"]:not([data-hf-authored-template]) .st-logo__subtitle,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"]:not([data-hf-authored-template]) .st-phone__text,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"]:not([data-hf-authored-template]) .st-button__label,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"]:not([data-hf-authored-template]) .st-menu__text,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"]:not([data-hf-authored-template]) .st-menu__link,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"]:not([data-hf-authored-template]) .st-block--heading > .st-text-edit{
      white-space:nowrap !important;word-break:normal !important;overflow-wrap:normal !important;
      writing-mode:horizontal-tb !important;text-orientation:mixed !important;
    }

    /* [00969-R2][AUTHORED FOOTER PREVIEW PARITY]
       Authored Footer geometry/text flow is not rewritten by Preview. Legacy safety rules above
       are scoped to non-authored footers; canonical JSON remains the layout authority. */
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-block--heading,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"]:not([data-hf-authored-template]) .st-block--heading{
      width:auto !important;min-width:max-content !important;max-width:none !important;flex:0 0 auto !important;overflow:visible !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-block--heading > .st-text-edit,
    #${PID} .stpv-stage .st-section[data-sec-role="footer"]:not([data-hf-authored-template]) .st-block--heading > .st-text-edit{
      display:inline-block !important;width:max-content !important;min-width:max-content !important;max-width:none !important;overflow:visible !important;text-overflow:clip !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-block--menu-narrow,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-block--menu-narrow .st-menu,
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-block--menu-narrow .st-menu__list{
      width:100% !important;min-width:0 !important;max-width:100% !important;flex-wrap:wrap !important;overflow:visible !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"] .st-block--menu-narrow .st-menu__link{
      min-width:max-content !important;white-space:nowrap !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] > .st-row[data-st-header-row-kind="top-menu"]{
      display:grid !important;grid-auto-flow:unset !important;grid-template-columns:max-content minmax(max-content,1fr) max-content !important;align-items:center !important;overflow:visible !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] > .st-row[data-st-header-row-kind="main"]{
      display:grid !important;grid-auto-flow:unset !important;grid-template-columns:max-content minmax(360px,1fr) max-content !important;align-items:center !important;overflow:visible !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] > .st-row[data-st-header-row-kind="narrow-nav"]{
      display:grid !important;grid-auto-flow:unset !important;grid-template-columns:minmax(0,1fr) !important;overflow:visible !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] [data-st-header-narrow-center="top"]{
      justify-self:center !important;width:auto !important;min-width:max-content !important;max-width:none !important;overflow:visible !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] [data-st-header-narrow-center="main"]{
      justify-self:stretch !important;width:100% !important;min-width:0 !important;max-width:100% !important;overflow:visible !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] [data-st-header-narrow-side]{
      width:auto !important;min-width:max-content !important;max-width:none !important;overflow:visible !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] .st-block--text:not([data-name="Пошук"]),
    #${PID} .stpv-stage .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] .st-block--text:not([data-name="Пошук"]) > .st-text-edit{
      width:auto !important;min-width:max-content !important;max-width:none !important;overflow:visible !important;white-space:nowrap !important;word-break:normal !important;overflow-wrap:normal !important;writing-mode:horizontal-tb !important;text-orientation:mixed !important;
    }
    #${PID} .stpv-stage .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] .st-block--text[data-name="Пошук"]{
      width:100% !important;min-width:220px !important;max-width:100% !important;overflow:hidden !important;
    }

    /* [00393] Regular section preview safety. The fullscreen preview should show
       the real section as wide as the preview window and should not create
       extra scroll/vertical text because of editor-only constraints. */
    #${PID} .stpv-stage .st-section:not([data-sec-role="header"]):not([data-sec-role="footer"]):not([data-gallery-section="photo-gallery"]):not(.st-photo-gallery-section){
      width:100% !important;
      max-width:100% !important;
      box-sizing:border-box !important;
      overflow:visible !important;
    }
    #${PID} .stpv-stage .st-section:not([data-sec-role="header"]):not([data-sec-role="footer"]):not([data-gallery-section="photo-gallery"]):not(.st-photo-gallery-section) .st-row{
      box-sizing:border-box !important;
      max-width:100% !important;
    }

    /* [00431] AI section background parity in fullscreen preview. */
    #${PID} .stpv-stage .st-section[data-st-preview-section-bg-materialized="1"]{
      background:var(--st-preview-section-bg) !important;
      background-size:cover !important;
      background-position:center center !important;
      background-repeat:no-repeat !important;
    }

    /* [00426] Fullscreen preview support for Fill-widget image backgrounds. */
    #${PID} .stpv-stage .st-bgfx{
      position:relative !important;
      overflow:hidden;
    }
    #${PID} .stpv-stage .st-bgfx::before{
      content:"";
      position:absolute;
      inset:0;
      z-index:0;
      pointer-events:none;
      background:var(--st-bgfx-bg, none);
      background-position:var(--st-bgfx-bg-pos, center center);
      background-size:var(--st-bgfx-bg-size, cover);
      background-repeat:var(--st-bgfx-bg-repeat,no-repeat);
      opacity:calc(var(--st-bgfx-bg-opacity, 1) * var(--st-element-fx-opacity,1) * var(--st-block-surface-alpha,1));
      filter:grayscale(var(--st-bgfx-gray, 0)) blur(var(--st-element-fx-blur,0px));
    }
    #${PID} .stpv-stage .st-bgfx::after{
      content:"";
      position:absolute;
      inset:0;
      z-index:0;
      pointer-events:none;
      background:var(--st-bgfx-filter, none);
      opacity:calc(var(--st-bgfx-filter-opacity, 0) * var(--st-element-fx-opacity,1) * var(--st-block-surface-alpha,1));
      filter:blur(var(--st-element-fx-blur,0px));
    }
    #${PID} .stpv-stage .st-bgfx > *{
      position:relative;
      z-index:1;
    }
    #${PID} .stpv-stage .st-element-visualfx > :not(.st-resize):not(.st-resize-handle):not([data-resize-handle]){
      opacity:var(--st-element-fx-opacity,1)!important;
      filter:blur(var(--st-element-fx-blur,0px))!important;
    }
    #${PID} .stpv-stage .st-block-surfacefx{
      -webkit-backdrop-filter:blur(var(--st-block-surface-blur,0px))!important;
      backdrop-filter:blur(var(--st-block-surface-blur,0px))!important;
    }
    #${PID} .stpv-stage .st-block-surfacefx.st-bgfx::before{
      background:var(--st-block-surface-bg,none)!important;
      background-color:var(--st-block-surface-bg-color,transparent)!important;
      background-position:var(--st-block-surface-bg-pos,0% 0%)!important;
      background-size:var(--st-block-surface-bg-size,auto)!important;
      background-repeat:var(--st-block-surface-bg-repeat,repeat)!important;
      opacity:calc(var(--st-block-surface-alpha,1) * var(--st-element-fx-opacity,1))!important;
      filter:blur(var(--st-element-fx-blur,0px))!important;
    }
    #${PID} .stpv-stage .st-block-surfacefx.st-bgfx::after{
      background-image:var(--st-bgfx-filter-image,none),var(--st-bgfx-layer-image,none)!important;
      background-position:center center,var(--st-bgfx-bg-pos,center center)!important;
      background-size:100% 100%,var(--st-bgfx-bg-size,cover)!important;
      background-repeat:no-repeat,var(--st-bgfx-bg-repeat,no-repeat)!important;
      opacity:calc(var(--st-bgfx-bg-opacity,1) * var(--st-element-fx-opacity,1))!important;
      filter:grayscale(var(--st-bgfx-gray,0)) blur(var(--st-element-fx-blur,0px))!important;
    }
    #${PID} .stpv-stage .st-section:not([data-sec-role="header"]):not([data-sec-role="footer"]):not([data-gallery-section="photo-gallery"]):not(.st-photo-gallery-section) .st-button__label,
    #${PID} .stpv-stage .st-section:not([data-sec-role="header"]):not([data-sec-role="footer"]):not([data-gallery-section="photo-gallery"]):not(.st-photo-gallery-section) .st-menu__link,
    #${PID} .stpv-stage .st-section:not([data-sec-role="header"]):not([data-sec-role="footer"]):not([data-gallery-section="photo-gallery"]):not(.st-photo-gallery-section) .st-menu__text{
      white-space:nowrap !important;
      word-break:normal !important;
      overflow-wrap:normal !important;
      writing-mode:horizontal-tb !important;
      text-orientation:mixed !important;
    }

    /* [00377] Photo-gallery preview safety. Global .st-block min-height must not break Masonry/Bento grid cells. */
    #${PID} .stpv-stage .st-photo-gallery-section,
    #${PID} .stpv-stage .st-section[data-gallery-section="photo-gallery"]{
      width:100% !important;
      max-width:100% !important;
      box-sizing:border-box !important;
      overflow:visible !important;
    }
    #${PID} .stpv-stage .st-photo-gallery-section .st-photo-gallery-grid-row,
    #${PID} .stpv-stage .st-section[data-gallery-section="photo-gallery"] .st-row[data-gallery-row="grid"]{
      display:grid !important;
      grid-auto-flow:dense !important;
      align-items:stretch !important;
      overflow:visible !important;
    }
    #${PID} .stpv-stage .st-photo-gallery-section .st-photo-gallery-image-block,
    #${PID} .stpv-stage .st-section[data-gallery-section="photo-gallery"] .st-block[data-gallery-block="image"]{
      min-height:0 !important;
      height:100% !important;
      width:100% !important;
      max-width:100% !important;
      min-width:0 !important;
      overflow:hidden !important;
      align-self:stretch !important;
      justify-self:stretch !important;
    }
    #${PID} .stpv-stage .st-photo-gallery-photo{
      width:100% !important;
      height:100% !important;
      min-height:0 !important;
      box-sizing:border-box !important;
    }
    #${PID} .stpv-stage .st-photo-gallery-caption,
    #${PID} .stpv-stage .st-photo-gallery-preview-caption{
      white-space:normal !important;
      word-break:normal !important;
      overflow-wrap:break-word !important;
    }

    .stpv-helpPopup{
      position:fixed;
      z-index:2147482600;
      display:none;
      width:min(780px, calc(100vw - 32px));
      max-height:calc(100vh - 28px);
      overflow:auto;
      overscroll-behavior:contain;
      border:3px solid rgba(96,165,250,.98);
      border-radius:24px;
      background:linear-gradient(180deg, rgba(7,12,24,.99), rgba(2,6,23,.99));
      box-shadow:0 30px 110px rgba(0,0,0,.74), 0 0 0 1px rgba(255,255,255,.10) inset;
      color:#fff;
      padding:22px 24px 24px;
      pointer-events:auto;
      font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;
    }
    .stpv-helpPopup.is-open{display:block;}
    .stpv-helpPopup__badge{
      display:inline-flex;align-items:center;gap:8px;
      padding:7px 11px;border-radius:999px;
      background:rgba(96,165,250,.16);
      border:1px solid rgba(147,197,253,.42);
      color:#bfdbfe;font-size:13px;font-weight:1000;
      letter-spacing:.09em;text-transform:uppercase;
    }
    .stpv-helpPopup__title{
      margin-top:12px;font-size:30px;line-height:1.08;
      font-weight:1000;color:#fff;letter-spacing:.01em;
    }
    .stpv-helpPopup__text{
      margin-top:16px;display:grid;gap:12px;
      font-size:20px;line-height:1.45;font-weight:850;
      color:rgba(255,255,255,.94);
    }
    .stpv-helpPopup__text b{color:#fde68a;font-weight:1000;}
    .stpv-helpPopup__keys{
      margin-top:18px;display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;
    }
    .stpv-helpPopup__key{
      padding:12px 13px;border-radius:16px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.06);
      font-size:16px;line-height:1.35;font-weight:900;color:#eff6ff;
    }
    .stpv-helpPopup__key strong{display:block;color:#93c5fd;font-size:17px;margin-bottom:3px;}
    .stpv-helpPopup::-webkit-scrollbar{width:12px;}
    .stpv-helpPopup::-webkit-scrollbar-track{background:rgba(255,255,255,.08);border-radius:999px;}
    .stpv-helpPopup::-webkit-scrollbar-thumb{background:rgba(147,197,253,.72);border-radius:999px;border:3px solid rgba(2,6,23,.98);}
    @media (max-width: 760px){
  

    .stpv-helpPopup{padding:18px;width:calc(100vw - 24px);}
      .stpv-helpPopup__title{font-size:24px;}
      .stpv-helpPopup__text{font-size:17px;}
      .stpv-helpPopup__keys{grid-template-columns:1fr;}
    }
  `;
  document.head.appendChild(st);
}

function getPreviewBody_() {
  return document.querySelector(`#${PID} .stpv-body`);
}

function isPreviewBodyScrollable_() {
  const body = getPreviewBody_();
  if (!body) return false;
  return body.scrollHeight > body.clientHeight + 3;
}

function updatePreviewScrollMode_() {
  const el = document.getElementById(PID);
  if (!el || !previewState.isOpen) return false;

  const isScrollable = !!(previewState.allowContentScroll && isPreviewBodyScrollable_());
  el.classList.toggle('is-content-scrollable', isScrollable);

  const hint = el.querySelector('[data-hint]');
  if (hint) {
    if (previewState.navEnabled && isScrollable) {
      hint.textContent = 'Є внутрішній скрол: колесо прокручує шаблон · ЛКМ по шаблону — наступний · ПКМ — попередній · Enter — застосувати · ESC — назад';
    } else if (previewState.navEnabled) {
      hint.textContent = '↑/↓ або колесо — змінити шаблон · Enter/Застосувати — застосувати · подвійний клік — закрити · ESC — назад';
    } else {
      hint.textContent = 'ESC — повернутись назад';
    }
  }

  return isScrollable;
}

function schedulePreviewScrollModeUpdate_(delay = 0) {
  if (previewState.scrollUpdateTimer) {
    clearTimeout(previewState.scrollUpdateTimer);
    previewState.scrollUpdateTimer = null;
  }
  previewState.scrollUpdateTimer = setTimeout(() => {
    previewState.scrollUpdateTimer = null;
    updatePreviewScrollMode_();
  }, Math.max(0, Number(delay) || 0));
}

function disconnectPreviewScrollObserver_() {
  if (previewState.scrollObserver && typeof previewState.scrollObserver.disconnect === 'function') {
    try { previewState.scrollObserver.disconnect(); } catch (_) {}
  }
  previewState.scrollObserver = null;
  if (previewState.scrollUpdateTimer) {
    clearTimeout(previewState.scrollUpdateTimer);
    previewState.scrollUpdateTimer = null;
  }
}

function clearPendingClickNavigation_() {
  if (previewState.pendingClickNavTimer) {
    clearTimeout(previewState.pendingClickNavTimer);
    previewState.pendingClickNavTimer = null;
  }
}


function bindPreviewScrollObserver_() {
  disconnectPreviewScrollObserver_();
  const body = getPreviewBody_();
  const stage = document.querySelector(`#${PID} .stpv-stage`);
  if (!body || !stage || !previewState.allowContentScroll) {
    updatePreviewScrollMode_();
    return;
  }

  const update = () => schedulePreviewScrollModeUpdate_(30);

  if (typeof ResizeObserver === 'function') {
    try {
      const ro = new ResizeObserver(update);
      ro.observe(body);
      ro.observe(stage);
      previewState.scrollObserver = ro;
    } catch (_) {
      previewState.scrollObserver = null;
    }
  }

  stage.querySelectorAll?.('img,video,iframe').forEach((node) => {
    try { node.addEventListener('load', update, { once: true }); } catch (_) {}
    try { node.addEventListener('loadedmetadata', update, { once: true }); } catch (_) {}
  });

  requestAnimationFrame(updatePreviewScrollMode_);
  setTimeout(updatePreviewScrollMode_, 120);
  setTimeout(updatePreviewScrollMode_, 420);
  setTimeout(updatePreviewScrollMode_, 1100);
}

function shouldLockWheelToPreviewContent_(event) {
  if (!previewState.allowContentScroll) return false;
  const body = event?.target?.closest?.(`#${PID} .stpv-body`);
  if (!body) return false;
  return isPreviewBodyScrollable_();
}

function shouldUseScrollableClickNavigation_(event) {
  if (!previewState.isOpen || !previewState.navEnabled || !previewState.allowContentScroll) return false;
  if (!isPreviewBodyScrollable_()) return false;
  const body = event?.target?.closest?.(`#${PID} .stpv-body`);
  if (!body) return false;
  if (event?.target?.closest?.('button,input,textarea,select,a,label,[contenteditable],.stpv-helpPopup')) return false;
  return true;
}

function ensureDom() {
  let el = document.getElementById(PID);
  if (el) return el;

  el = document.createElement("div");
  el.id = PID;
  el.innerHTML = `
    <div class="stpv-box">
      <div class="stpv-top" data-preview-help-target="top">
        <div class="stpv-titleWrap">
          <div class="stpv-title" data-title>Перегляд</div>
          <div class="stpv-hint" data-hint>ESC — повернутись назад</div>
        </div>
        <div class="stpv-actions">
          <div class="stpv-nav" data-nav-wrap>
            <button class="stpv-navBtn" type="button" data-nav-prev title="Попередній шаблон (↑ або колесо вгору)">↑</button>
            <button class="stpv-navBtn" type="button" data-nav-next title="Наступний шаблон (↓ або колесо вниз)">↓</button>
          </div>
          <button class="stpv-apply" type="button" data-apply title="Застосувати відкритий шаблон (Enter)">Застосувати</button>
          <button class="stpv-close" type="button" data-close>Закрити</button>
        </div>
      </div>
      <div class="stpv-body" data-body>
        <div class="stpv-stage" data-stage></div>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-nav-prev]")) {
      e.preventDefault();
      e.stopPropagation();
      runNav_(-1);
      return;
    }
    if (e.target.closest("[data-nav-next]")) {
      e.preventDefault();
      e.stopPropagation();
      runNav_(1);
      return;
    }
    if (e.target.closest("[data-apply]")) {
      e.preventDefault();
      e.stopPropagation();
      runApply_();
      return;
    }
    if (e.target.closest("[data-close]")) {
      close();
      return;
    }
    if (e.target === el) close(); // клік по фону
  });

  el.addEventListener("dblclick", (e) => {
    if (!previewState.isOpen || !previewState.dblClickToClose) return;
    if (e.target.closest("button,input,textarea,select,a,[contenteditable]")) return;
    e.preventDefault();
    e.stopPropagation();
    clearPendingClickNavigation_();
    close();
  }, true);

  const previewTop = el.querySelector('[data-preview-help-target="top"]');
  if (previewTop && !previewTop.__stpvHelpBound) {
    previewTop.__stpvHelpBound = true;
    previewTop.addEventListener('mouseenter', () => {
      previewState.helpAnchorHover = true;
      schedulePreviewHelp_(previewTop);
    });
    previewTop.addEventListener('mouseleave', () => {
      previewState.helpAnchorHover = false;
      requestHidePreviewHelp_();
    });
    previewTop.addEventListener('focusin', () => {
      previewState.helpAnchorHover = true;
      schedulePreviewHelp_(previewTop);
    });
    previewTop.addEventListener('focusout', () => {
      previewState.helpAnchorHover = false;
      requestHidePreviewHelp_();
    });
  }

  el.addEventListener("wheel", (e) => {
    if (!previewState.isOpen || !previewState.navEnabled) return;

    // [00378] Якщо відкритий шаблон має внутрішній scroll, колесо мишки
    // завжди прокручує сам шаблон і більше не перескакує на інший шаблон навіть на краю.
    // Перемикання для таких шаблонів: ЛКМ по області шаблону = наступний, ПКМ = попередній.
    if (shouldLockWheelToPreviewContent_(e)) {
      updatePreviewScrollMode_();
      return;
    }

    const now = Date.now();
    if (now - previewState.lastWheelAt < 160) {
      e.preventDefault();
      return;
    }
    previewState.lastWheelAt = now;
    e.preventDefault();
    e.stopPropagation();
    const dy = Number(e.deltaY || 0);
    runNav_(dy < 0 ? -1 : 1);
  }, { passive: false });

  el.addEventListener('click', (e) => {
    if (!shouldUseScrollableClickNavigation_(e)) return;
    if (e.button !== 0) return;
    if (Number(e.detail || 1) > 1) return;
    e.preventDefault();
    e.stopPropagation();
    clearPendingClickNavigation_();
    // Невелика затримка потрібна, щоб подвійний клік по preview не встиг
    // спочатку переключити шаблон, а потім закрити вже інший.
    previewState.pendingClickNavTimer = setTimeout(() => {
      previewState.pendingClickNavTimer = null;
      if (!previewState.isOpen || !isPreviewBodyScrollable_()) return;
      runNav_(1);
    }, 170);
  }, true);

  el.addEventListener('contextmenu', (e) => {
    if (!shouldUseScrollableClickNavigation_(e)) return;
    e.preventDefault();
    e.stopPropagation();
    clearPendingClickNavigation_();
    runNav_(-1);
  }, true);

  window.addEventListener("keydown", (e) => {
    if (!previewState.isOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (isPreviewHelpOpen_()) {
        hidePreviewHelp_();
        return;
      }
      close();
      return;
    }

    if (!previewState.navEnabled) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      runNav_(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      runNav_(1);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      runApply_();
    }
  }, true);

  window.addEventListener('resize', () => {
    const popup = document.getElementById('stpvHelpPopup');
    if (!popup || !popup.classList.contains('is-open') || !previewState.helpAnchor) return;
    if (!document.body.contains(previewState.helpAnchor)) return;
    positionPreviewHelp_(popup, previewState.helpAnchor);
  }, { passive: true });

  return el;
}

function pushPreviewDiagnostic00969_(event, payload, level='info') {
  try { console.info(event, payload); } catch (_) {}
  try { window.__ST_ALL_LOG__?.push?.(event, payload, level); } catch (_) {}
}

function logFooterPreviewParity00968_(phase='manual') {
  if (!previewState.isOpen || previewState.kind !== 'footer') return;
  const el = document.getElementById(PID);
  const stage = el?.querySelector?.('[data-stage]');
  const body = el?.querySelector?.('[data-body]');
  const root = stage?.querySelector?.('.st-section[data-sec-role="footer"]');
  if (!stage || !root) return;
  const rect = (node) => {
    try { const r = node?.getBoundingClientRect?.(); return r ? {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),right:Math.round(r.right),bottom:Math.round(r.bottom)} : null; } catch (_) { return null; }
  };
  const cta = root.querySelector('.hf00972-cta-row,.hf00966-cta-row');
  const main = root.querySelector('.hf00966-main-row');
  const heading = cta?.querySelector('.st-block--heading > .st-text-edit');
  const actions = cta?.querySelector('[data-name="CTA дії"]');
  const hr = rect(heading), ar = rect(actions);
  const overlap = !!(hr && ar && hr.left < ar.right && hr.right > ar.left && hr.top < ar.bottom && hr.bottom > ar.top);
  const authored = !!root.hasAttribute('data-hf-authored-template');
  pushPreviewDiagnostic00969_('template-preview:footer-parity-00968', {
    version:'00972-footer-universal-family-parity',
    phase,
    authored,
    tallMode:!!el?.classList?.contains('is-tall-template'),
    contentScrollEnabled:previewState.allowContentScroll,
    bodyScrollable:!!body && body.scrollHeight > body.clientHeight + 3,
    stage:rect(stage),
    footer:rect(root),
    ctaGrid:cta ? getComputedStyle(cta).gridTemplateColumns : '',
    mainGrid:main ? getComputedStyle(main).gridTemplateColumns : '',
    headingWhiteSpace:heading ? getComputedStyle(heading).whiteSpace : '',
    heading:hr,
    actions:ar,
    ctaTextActionOverlap:overlap,
    ok:!overlap && (!authored || !heading || getComputedStyle(heading).whiteSpace !== 'nowrap')
  });
}


function logFooterQuality00969_(phase='manual') {
  if (!previewState.isOpen || previewState.kind !== 'footer') return;
  const el = document.getElementById(PID);
  const stage = el?.querySelector?.('[data-stage]');
  const root = stage?.querySelector?.('.st-section[data-sec-role="footer"]');
  if (!stage || !root) return;

  const round = (value) => Number.isFinite(Number(value)) ? Math.round(Number(value) * 10) / 10 : 0;
  const rect = (node) => {
    try {
      const r = node?.getBoundingClientRect?.();
      return r ? { x:round(r.x), y:round(r.y), w:round(r.width), h:round(r.height), right:round(r.right), bottom:round(r.bottom) } : null;
    } catch (_) { return null; }
  };
  const intersects = (a,b) => !!(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);

  const parseRgb = (value) => {
    const m = String(value || '').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i);
    if (!m) return null;
    return { r:Number(m[1]), g:Number(m[2]), b:Number(m[3]), a:m[4] == null ? 1 : Number(m[4]) };
  };
  const parseCssColor = (value) => {
    const rgb = parseRgb(value);
    if (rgb) return rgb;
    const hex = String(value || '').trim().match(/^#([0-9a-f]{3,8})$/i);
    if (!hex) return null;
    let h=hex[1];
    if (h.length===3 || h.length===4) h=h.split('').map((c)=>c+c).join('');
    if (h.length!==6 && h.length!==8) return null;
    return { r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16), a:h.length===8?parseInt(h.slice(6,8),16)/255:1 };
  };
  const sameColor = (a,b) => {
    const x=parseCssColor(a), y=parseCssColor(b);
    return !!(x&&y&&Math.abs(x.r-y.r)<1&&Math.abs(x.g-y.g)<1&&Math.abs(x.b-y.b)<1&&Math.abs((x.a??1)-(y.a??1))<.01);
  };
  const blend = (fg,bg) => {
    const a = Number.isFinite(fg?.a) ? fg.a : 1;
    return { r:fg.r*a + bg.r*(1-a), g:fg.g*a + bg.g*(1-a), b:fg.b*a + bg.b*(1-a), a:1 };
  };
  const luminance = (rgb) => {
    const xs = [rgb.r,rgb.g,rgb.b].map((x) => {
      const v = Math.max(0,Math.min(255,Number(x))) / 255;
      return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
    });
    return .2126*xs[0] + .7152*xs[1] + .0722*xs[2];
  };
  const contrast = (a,b) => {
    const l1 = luminance(a), l2 = luminance(b);
    return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
  };
  const effectiveBackground = (node) => {
    const chain = [];
    let cur = node;
    while (cur && cur.nodeType === 1) { chain.push(cur); cur = cur.parentElement; }
    let bg = { r:255,g:255,b:255,a:1 };
    let complex = false;
    for (let i = chain.length - 1; i >= 0; i -= 1) {
      const cs = getComputedStyle(chain[i]);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') complex = true;
      const c = parseRgb(cs.backgroundColor);
      if (c && c.a > 0) {
        bg = blend(c,bg);
        // An authored near-opaque descendant surface (card/panel) visually replaces
        // an ancestor image for contrast purposes; do not skip its text as "complex".
        if (c.a >= .80) complex = false;
      }
    }
    return { bg, complex };
  };

  const rootRect = root.getBoundingClientRect();
  const overflowNodes = new Set();
  let horizontalOverflowCount = 0;
  let verticalOverflowCount = 0;
  const structuralNodes = Array.from(root.querySelectorAll('[data-hf-node-type]'));
  structuralNodes.forEach((node) => {
    const r = node.getBoundingClientRect?.();
    if (!r || r.width <= 0 || r.height <= 0) return;
    let hit = false;
    if (r.left < rootRect.left - 2 || r.right > rootRect.right + 2) {
      horizontalOverflowCount += 1; hit = true;
    }
    if (r.top < rootRect.top - 2 || r.bottom > rootRect.bottom + 2) {
      verticalOverflowCount += 1; hit = true;
    }
    if (hit) overflowNodes.add(node);
  });

  const textSelectors = [
    '.st-text-edit',
    '.st-menu__text',
    '.st-menu__link',
    '.st-phone__text',
    '.st-button__label',
    '.st-logo__title',
    '.st-logo__subtitle'
  ].join(',');
  let lowContrastCount = 0;
  let complexBackgroundTextCount = 0;
  const lowContrastSamples = [];
  Array.from(root.querySelectorAll(textSelectors)).forEach((node) => {
    const value = String(node.textContent || '').trim();
    if (!value) return;
    const cs = getComputedStyle(node);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return;
    const fg = parseRgb(cs.color);
    if (!fg) return;
    const back = effectiveBackground(node);
    if (back.complex) {
      complexBackgroundTextCount += 1;
      return;
    }
    const ratio = contrast(fg,back.bg);
    if (ratio < 3.5) {
      lowContrastCount += 1;
      if (lowContrastSamples.length < 8) {
        lowContrastSamples.push({
          text:value.slice(0,80),
          ratio:round(ratio),
          color:cs.color,
          background:`rgb(${Math.round(back.bg.r)}, ${Math.round(back.bg.g)}, ${Math.round(back.bg.b)})`
        });
      }
    }
  });

  let headingsClipped = 0;
  Array.from(root.querySelectorAll('.st-block--heading > .st-text-edit,[data-block-role="heading"] .st-text-edit')).forEach((node) => {
    if (node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2) headingsClipped += 1;
  });

  let buttonsOutside = 0;
  Array.from(root.querySelectorAll('.st-block--button,button,a.st-button')).forEach((node) => {
    const r = node.getBoundingClientRect?.();
    if (!r) return;
    if (r.left < rootRect.left - 2 || r.right > rootRect.right + 2 || r.top < rootRect.top - 2 || r.bottom > rootRect.bottom + 2) {
      buttonsOutside += 1;
    }
  });

  const contactCandidates = Array.from(root.querySelectorAll('[data-name]'));
  const contact = contactCandidates.find((node) => (
    node.getAttribute('data-hf-node-type') === 'container'
    && /контакт/i.test(String(node.getAttribute('data-name') || ''))
  )) || null;
  let contactCard = null;
  if (contact) {
    const cr = contact.getBoundingClientRect();
    const items = Array.from(contact.children || []).filter((node) => node.nodeType === 1);
    let contentBottom = cr.top;
    items.forEach((node) => {
      const r = node.getBoundingClientRect?.();
      if (r) contentBottom = Math.max(contentBottom,r.bottom);
    });
    contactCard = {
      rect:rect(contact),
      contentBottom:round(contentBottom),
      overflowBottom:round(Math.max(0,contentBottom - cr.bottom)),
      itemCount:items.length
    };
  }

  const cta = root.querySelector('.hf00972-cta-row,.hf00966-cta-row,.hf00969-cta-row');
  const ctaText = cta?.querySelector?.('.st-block--heading > .st-text-edit');
  const ctaActions = cta?.querySelector?.('[data-name="CTA дії"]');
  const ctaTextRect = ctaText?.getBoundingClientRect?.() || null;
  const ctaActionRect = ctaActions?.getBoundingClientRect?.() || null;
  const ctaOverlap = intersects(ctaTextRect,ctaActionRect);

  const inside = (childRect,parentRect,tol=2) => !!(childRect && parentRect
    && childRect.left >= parentRect.left - tol && childRect.right <= parentRect.right + tol
    && childRect.top >= parentRect.top - tol && childRect.bottom <= parentRect.bottom + tol);

  let menuAuthoredMismatchCount = 0;
  let menuLinkOutsideCardCount = 0;
  const menuStyleAuthority = Array.from(root.querySelectorAll('.st-block--menu')).slice(0,12).map((menuBlock) => {
    const card = menuBlock.closest('[data-hf-node-type="container"]') || menuBlock.parentElement;
    const cardRect = card?.getBoundingClientRect?.() || null;
    const mcs = getComputedStyle(menuBlock);
    const links = Array.from(menuBlock.querySelectorAll('.st-menu__item[data-menu-depth="1"] > .st-menu__link')).slice(0,8);
    const linkSamples = links.map((link) => {
      const lcs = getComputedStyle(link);
      const lr = link.getBoundingClientRect?.() || null;
      const inlineColor = String(link.style?.color || '');
      const computedColor = String(lcs.color || '');
      const authoredMismatch = !!inlineColor && !sameColor(inlineColor,computedColor);
      if (authoredMismatch) menuAuthoredMismatchCount += 1;
      const outside = !inside(lr,cardRect);
      if (outside) menuLinkOutsideCardCount += 1;
      return {
        text:String(link.textContent||'').trim().slice(0,60),
        inlineColor,
        computedColor,
        authoredMismatch,
        display:lcs.display,
        whiteSpace:lcs.whiteSpace,
        fontSize:lcs.fontSize,
        fontWeight:lcs.fontWeight,
        rect:rect(link),
        outsideCard:outside
      };
    });
    return {
      blockId:menuBlock.getAttribute('data-node-id') || menuBlock.id || '',
      cardId:card?.getAttribute?.('data-node-id') || '',
      cardRect:rect(card),
      menuRect:rect(menuBlock),
      scrollWidth:menuBlock.scrollWidth,
      clientWidth:menuBlock.clientWidth,
      vars:{
        linkColor:mcs.getPropertyValue('--st-menu-link-color').trim(),
        l1Color:mcs.getPropertyValue('--st-menu-l1-color').trim(),
        l1HoverColor:mcs.getPropertyValue('--st-menu-l1-h-color').trim(),
        l1OpenColor:mcs.getPropertyValue('--st-menu-l1-o-color').trim(),
        l1CurrentColor:mcs.getPropertyValue('--st-menu-l1-c-color').trim()
      },
      links:linkSamples
    };
  });

  const legal = root.querySelector('.hf00972-legal,.hf00966-legal,[data-name="Юридичні посилання"]');
  const legalRectRaw = legal?.getBoundingClientRect?.() || null;
  let legalOutsideCount = 0;
  const legalItems = legal ? Array.from(legal.children || []).filter((n)=>n.nodeType===1).map((node) => {
    const nr=node.getBoundingClientRect?.() || null;
    const outside=!inside(nr,legalRectRaw);
    if(outside) legalOutsideCount += 1;
    return { id:node.getAttribute?.('data-node-id')||'', rect:rect(node), width:getComputedStyle(node).width, flex:getComputedStyle(node).flex, outside };
  }) : [];

  const overflowCount = overflowNodes.size;
  const ok = (
    lowContrastCount === 0
    && overflowCount === 0
    && headingsClipped === 0
    && buttonsOutside === 0
    && menuAuthoredMismatchCount === 0
    && menuLinkOutsideCardCount === 0
    && legalOutsideCount === 0
    && !ctaOverlap
    && (!contactCard || contactCard.overflowBottom <= 2)
  );

  pushPreviewDiagnostic00969_('template-preview:footer-quality-00972', {
    version:'00972-footer-universal-design-families',
    phase,
    templateId:previewState.currentId || root.getAttribute('data-hf-template-id') || '',
    templateName:el?.querySelector?.('[data-title]')?.textContent || '',
    previewWidth:round(stage.getBoundingClientRect().width),
    lowContrastCount,
    complexBackgroundTextCount,
    lowContrastSamples,
    overflowCount,
    horizontalOverflowCount,
    verticalOverflowCount,
    menuAuthoredMismatchCount,
    menuLinkOutsideCardCount,
    menuOutside:menuLinkOutsideCardCount,
    menuStyleAuthority,
    legal:{ rect:rect(legal), itemCount:legalItems.length, outsideCount:legalOutsideCount, items:legalItems },
    legalOutside:legalOutsideCount,
    contactCard,
    contactOutside:contactCard ? Number(contactCard.overflowBottom > 2) : 0,
    family:{
      id:root.getAttribute('data-footer-family-id') || '',
      name:root.getAttribute('data-footer-family-name') || '',
      compositionId:root.getAttribute('data-footer-composition-id') || '',
      variant:root.getAttribute('data-footer-family-variant') || ''
    },
    cta:{
      textRect:rect(ctaText),
      actionRect:rect(ctaActions),
      overlap:ctaOverlap
    },
    headingsClipped,
    headingClip:headingsClipped,
    buttonsOutside,
    buttonOutside:buttonsOutside,
    ok
  });
}

export function open({
  id = null,
  title = "Перегляд",
  html = "",
  type = null,
  kind = null,
  navEnabled = false,
  dblClickToClose = false,
  onPrev = null,
  onNext = null,
  onApply = null,
  helpKind = null,
} = {}) {
  ensureStyles();
  const el = ensureDom();

  previewState.isOpen = true;
  previewState.currentId = id || null;
  previewState.navEnabled = !!navEnabled;
  previewState.dblClickToClose = !!dblClickToClose;
  previewState.onPrev = isFn_(onPrev) ? onPrev : null;
  previewState.onNext = isFn_(onNext) ? onNext : null;
  previewState.onApply = isFn_(onApply) ? onApply : null;
  previewState.helpKind = helpKind ? String(helpKind).toLowerCase() : null;
  previewState.kind = String(kind || type || helpKind || '').toLowerCase();
  previewState.allowContentScroll = previewState.kind === 'page' || previewState.kind === 'footer' || previewState.kind === 'main' || previewState.kind === 'sections' || previewState.kind === 'photo-gallery';

  const t = el.querySelector("[data-title]");
  const hint = el.querySelector("[data-hint]");
  const stage = el.querySelector("[data-stage]");
  if (t) t.textContent = title || "Перегляд";
  if (hint) {
    hint.textContent = previewState.navEnabled
      ? "↑/↓ або колесо — змінити шаблон · Enter/Застосувати — застосувати · подвійний клік — закрити · ESC — назад"
      : "ESC — повернутись назад";
  }
  if (stage) stage.innerHTML = html || "";

  bindPreviewScrollObserver_();

  const top = el.querySelector('[data-preview-help-target="top"]');
  if (top) {
    if (previewState.navEnabled && getPreviewHelpContent_(previewState.helpKind)) {
      top.setAttribute('data-preview-help-kind', previewState.helpKind || '');
    } else {
      top.removeAttribute('data-preview-help-kind');
    }
  }

  hidePreviewHelp_();
  el.classList.toggle("has-nav", previewState.navEnabled);
  el.classList.toggle("is-tall-template", previewState.kind === 'page' || previewState.kind === 'footer' || previewState.kind === 'main' || previewState.kind === 'sections' || previewState.kind === 'photo-gallery');
  el.classList.add("is-open");
  if (previewState.kind === 'footer') {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      logFooterPreviewParity00968_('raf2');
      logFooterQuality00969_('raf2');
    }));
    setTimeout(() => {
      logFooterPreviewParity00968_('220ms');
      logFooterQuality00969_('220ms');
    }, 220);
  }
}

export function close() {
  const el = document.getElementById(PID);
  if (!el) return;
  el.classList.remove("is-open");
  el.classList.remove("has-nav");
  el.classList.remove("is-tall-template");
  el.classList.remove("is-content-scrollable");
  previewState.isOpen = false;
  previewState.navEnabled = false;
  previewState.dblClickToClose = false;
  previewState.onPrev = null;
  previewState.onNext = null;
  previewState.onApply = null;
  previewState.helpKind = null;
  previewState.kind = null;
  previewState.allowContentScroll = false;
  disconnectPreviewScrollObserver_();
  clearPendingClickNavigation_();
  hidePreviewHelp_();
}

export function isOpen() {
  return !!previewState.isOpen;
}

export function getCurrentId() {
  return previewState.currentId || null;
}
