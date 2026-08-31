// js/design/widgets/gallery-widget/gallery-widget.js
import {
  galEnsureSeed,
  galListFolders,
  galCreateFolder,
  galRenameFolder,
  galDeleteFolder,
  galListItems,
  galAddFiles,
  galDeleteItem,
  galRenameItem,
  galUpdateItemMeta,
  galIsSystemFolder,
  galGetSystemFolderMeta,
  galMakeObjectUrl,
  galLoadStaticSystemManifest,
  galScoreAiAsset
} from './gallery-db.js?v=00956';

const CAT_LABEL = { images: 'Картинки', logos: 'Логотип', icons: 'Іконки' };
const GALLERY_AI_BRIDGE_LS_KEY = 'st_gallery_ai_bridge_v1';
let galleryAiBridgeBound_ = false;

// --- built-in pack: Lucide (static SVG) ---
// Файли лежать у: assets/icons/lucide/
// Індекс: assets/icons/lucide/index.json
let _lucideIndexCache = null;
async function loadLucideIndex_() {
  if (_lucideIndexCache) return _lucideIndexCache;
  try {
    const res = await fetch('assets/icons/lucide/index.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    _lucideIndexCache = Array.isArray(json) ? json : [];
  } catch (e) {
    _lucideIndexCache = [];
  }
  return _lucideIndexCache;
}

function isLucideFolder_(folderId) {
  return String(folderId || '').startsWith('lucide_');
}

async function listBuiltinLucideItems_(folderId) {
  const key = String(folderId || '').replace(/^lucide_/, '');
  const index = await loadLucideIndex_();
  const out = index
    .filter(x => x && x.category === key)
    .map(x => ({
      id: `lucide:${x.name}`,
      cat: 'icons',
      folderId,
      name: x.name,
      mime: 'image/svg+xml',
      size: 0,
      createdAt: 0,
      url: `assets/icons/lucide/${x.file}`,
      _builtin: true
    }));
  return out;
}

let modalEl = null;
let overlayEl = null;

let state = {
  isOpen: false,
  cat: 'images',
  folderId: 'root_images',
  view: 'big', // small | big | huge | list
  selectedFolderId: null,
   selectedItemIds: [],   // multi-select
  lastSelectedIndex: -1, // для shift-діапазону
   foldersCache: [],
  itemsCache: [],
  filteredItemsCache: [],
  staticManifestCache: null,
  systemFilter: {
    query: '',
    theme: '',
    usage: '',
    status: ''
  },
  aiRank: {
    enabled: false,
    theme: '',
    usage: 'hero',
    style: '',
    mood: '',
    color: '',
    textMode: 'dark',
    preferClean: true
  },
  aiBest: {
    selectedId: '',
    selectedAt: '',
    score: null
  },

  // icons preview theme (affects how SVG icons are rendered in gallery)
  // 'dark'  => white icons on dark tiles (invert)
  // 'light' => black icons on light tiles
  iconTheme: (function(){
    try { return localStorage.getItem('st_gallery_icon_theme_v1') || 'dark'; } catch(e) { return 'dark'; }
  })(),


  pickerMode: false,
  onPick: null
};

function setIconTheme_(theme) {
  const t = (theme === 'light') ? 'light' : 'dark';
  state.iconTheme = t;
  try { localStorage.setItem('st_gallery_icon_theme_v1', t); } catch (e) {}

  if (modalEl) {
    modalEl.classList.toggle('stg-icon-theme-dark', t === 'dark');
    modalEl.classList.toggle('stg-icon-theme-light', t === 'light');
  }

  // toggle active pill buttons
  qa('[data-stg-icon-theme] [data-icon-theme]').forEach(b => {
    b.classList.toggle('is-active', b.dataset.iconTheme === t);
  });

  // re-render items so SVG preview updates (invert filter)
  if (state.isOpen) renderItems_(state.itemsCache || []);
}


function q(sel, root = modalEl) { return root ? root.querySelector(sel) : null; }
function qa(sel, root = modalEl) { return root ? Array.from(root.querySelectorAll(sel)) : []; }

function loadGalleryAiBridgeState_() {
  try {
    const raw = localStorage.getItem(GALLERY_AI_BRIDGE_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
}

function saveGalleryAiBridgeState_(payload) {
  try {
    localStorage.setItem(GALLERY_AI_BRIDGE_LS_KEY, JSON.stringify(payload || null));
  } catch (e) {}
}

function galleryAiPromptText_(value) {
  return String(value || '').toLowerCase().replace(/[ґ]/g, 'г').replace(/\s+/g, ' ').trim();
}

function galleryAiHasAny_(text, list) {
  const src = galleryAiPromptText_(text);
  return (list || []).some(token => src.includes(galleryAiPromptText_(token)));
}

function galleryAiPickColor_(text) {
  const map = [
    ['green', ['green','зелений','зелена','зеленим','зеленого','зелень','трав','lime']],
    ['blue', ['blue','синій','синя','синім','синього','голубий','блакитний','cyan']],
    ['yellow', ['yellow','жовтий','жовта','жовтим','жовтого','gold','golden']],
    ['red', ['red','червоний','червона','червоним','червоного']],
    ['orange', ['orange','помаранчевий','помаранчева']],
    ['purple', ['purple','фіолетовий','фіолетова']],
    ['pink', ['pink','рожевий','рожева']],
    ['black', ['black','чорний','чорна','чорним']],
    ['white', ['white','білий','біла','білим']],
    ['gray', ['gray','grey','сірий','сіра','сірим','срібний']],
    ['brown', ['brown','коричневий','коричнева','дерев']],
    ['beige', ['beige','бежевий','бежева']],
  ];
  for (const [color, words] of map) {
    if (galleryAiHasAny_(text, words)) return color;
  }
  return '';
}

function galleryAiExtractTerms_(text, dict) {
  const found = [];
  for (const [value, words] of Object.entries(dict || {})) {
    if (galleryAiHasAny_(text, words)) found.push(value);
  }
  return uniq_(found);
}

function extractGalleryAiBriefFromPrompt_(prompt) {
  const raw = String(prompt || '');
  const text = galleryAiPromptText_(raw);
  if (!text) return null;

  const hasPlacementIntent = galleryAiHasAny_(text, ['фон','background','бекграунд','картин','зображен','фото','лого','логотип','іконк','icon','hero','header','шапк','банер','banner','section','секці','footer','футер','page background','сторінк','сайт']);

  const role = galleryAiHasAny_(text, ['логотип','лого']) ? 'logo'
    : galleryAiHasAny_(text, ['іконк','icon']) ? 'icon'
    : galleryAiHasAny_(text, ['фон','background','hero background','бекграунд']) ? 'background'
    : 'image';

  const folderMap = {
    background: { cat: 'images', folderId: 'static_sys_backgrounds' },
    image: { cat: 'images', folderId: 'static_sys_images' },
    logo: { cat: 'logos', folderId: 'static_sys_logos' },
    icon: { cat: 'icons', folderId: 'static_sys_icons' },
  };

  const themeDict = {
    education: ['education','освіт','навчан','університет','курс','академ'],
    science: ['science','наук','лаборатор','дослідж'],
    school: ['school','школ','клас','вчител','учн'],
    business: ['business','бізнес','компан','офіс','корпорат'],
    technology: ['technology','технолог','техно','digital','it ','айті','software','сервіс'],
    future: ['future','майбутн','футур'],
    space: ['space','космос','галактик','зор','планет','астро'],
    nature: ['nature','природ','трава','ліс','еко','зелень','квіт','дерев'],
    medical: ['medical','мед','клінік','лікар','health'],
    finance: ['finance','фінанс','банк','інвест','крипт','грош'],
    sport: ['sport','спорт','футбол','баскет','fitness','трен'],
    legal: ['legal','юрид','law','адвокат'],
    construction: ['construction','будів','ремонт','архітект'],
    restaurant: ['restaurant','рестор','кафе','їжа','food','menu'],
    travel: ['travel','подорож','тур','готель','hotel'],
    beauty: ['beauty','краса','салон','spa','космет'],
    fashion: ['fashion','мода','одяг','boutique'],
    portfolio: ['portfolio','портфоліо','кейс'],
    ecommerce: ['ecommerce','shop','store','магазин','товар'],
    kids: ['kids','діт','дитяч','малюк'],
    ai: [' ai','штучн','ai ','нейромереж','gpt'],
    startup: ['startup','стартап'],
    industrial: ['industrial','виробниц','завод','промисл'],
    agriculture: ['agriculture','агро','сільськ','ферм'],
  };

  const styleDict = {
    modern: ['modern','сучасн'],
    classic: ['classic','класичн'],
    elegant: ['elegant','елегант'],
    luxury: ['luxury','преміум','розкіш'],
    minimal: ['minimal','мінімал'],
    corporate: ['corporate','корпорат'],
    clean: ['clean','чист'],
    futuristic: ['futuristic','футурист'],
    creative: ['creative','креатив'],
    artistic: ['artistic','арт','худож'],
    playful: ['playful','ігров','весел'],
    technical: ['technical','техніч'],
    soft: ['soft','мякий','ніжн','спокійн'],
    bold: ['bold','смілив','яскрав'],
    formal: ['formal','офіційн'],
    informal: ['informal','неформ'],
  };

  const moodDict = {
    calm: ['calm','спокійн'],
    energetic: ['energetic','енергійн','динаміч'],
    inspiring: ['inspiring','надих'],
    serious: ['serious','серйозн'],
    friendly: ['friendly','дружн','привітн'],
    warm: ['warm','тепл'],
    cold: ['cold','холодн'],
    premium: ['premium','преміум'],
    trustworthy: ['trustworthy','надійн','довір'],
    smart: ['smart','розумн','інтелект'],
    safe: ['safe','безпеч'],
    optimistic: ['optimistic','оптиміст'],
    professional: ['professional','професійн'],
    emotional: ['emotional','емоційн'],
  };

  const themes = galleryAiExtractTerms_(text, themeDict);
  const styles = galleryAiExtractTerms_(text, styleDict);
  const moods = galleryAiExtractTerms_(text, moodDict);
  const color = galleryAiPickColor_(text);
  if (!hasPlacementIntent && role === 'image' && !themes.length) return null;

  const usage = galleryAiHasAny_(text, ['header','шапк','меню']) ? 'header'
    : galleryAiHasAny_(text, ['footer','футер']) ? 'footer'
    : galleryAiHasAny_(text, ['banner','банер']) ? 'banner'
    : galleryAiHasAny_(text, ['page background','фон сторінки','фон сайта','фон сайту']) ? 'page-background'
    : galleryAiHasAny_(text, ['section','секці']) ? 'section-background'
    : galleryAiHasAny_(text, ['hero','головний екран','перший екран']) ? 'hero'
    : role === 'logo' ? 'logo-area'
    : role === 'icon' ? 'icon'
    : 'hero';

  const textMode = galleryAiHasAny_(text, ['білий текст','світлий текст','white text']) ? 'light'
    : galleryAiHasAny_(text, ['чорний текст','темний текст','dark text']) ? 'dark'
    : '';

  const folder = folderMap[role] || folderMap.image;
  return {
    source: 'ai-chat',
    prompt: raw,
    at: new Date().toISOString(),
    role,
    cat: folder.cat,
    folderId: folder.folderId,
    theme: themes.join(', '),
    usage,
    style: styles.join(', '),
    mood: moods.join(', '),
    color,
    textMode,
  };
}

async function applyGalleryAiBrief_(brief, { ensureRefresh = true, autoBest = false } = {}) {
  if (!brief || typeof brief !== 'object') return false;
  if (brief.cat) state.cat = String(brief.cat);
  if (brief.folderId) {
    state.folderId = String(brief.folderId);
    state.selectedFolderId = state.folderId;
  }
  state.aiRank = {
    ...(state.aiRank || {}),
    enabled: true,
    theme: String(brief.theme || ''),
    usage: String(brief.usage || 'hero'),
    style: String(brief.style || ''),
    mood: String(brief.mood || ''),
    color: String(brief.color || ''),
    textMode: String(brief.textMode || ''),
    preferClean: true,
  };
  state.aiBest = { selectedId: '', selectedAt: '', score: null };
  state.systemFilter = { ...(state.systemFilter || {}), query: '', status: state.systemFilter?.status || '', theme: '', usage: '' };
  if (!modalEl || !state.isOpen) return true;
  qa('[data-stg-tabs] .stg-tab').forEach(t => t.classList.toggle('is-active', t.dataset.cat === state.cat));
  if (state.cat !== 'icons' && state.view === 'icons') setView_('big');
  if (ensureRefresh) await refresh_();
  if (autoBest) selectAiBestAsset_({ alertIfEmpty: false });
  return true;
}

function bindGalleryAiBridge_() {
  if (galleryAiBridgeBound_) return;
  galleryAiBridgeBound_ = true;
  window.addEventListener('st:gallery-ai-brief', async (ev) => {
    const detail = ev && ev.detail && typeof ev.detail === 'object' ? ev.detail : {};
    const prompt = String(detail.prompt || detail.text || '');
    const brief = detail.brief && typeof detail.brief === 'object' ? detail.brief : extractGalleryAiBriefFromPrompt_(prompt);
    if (!brief) return;
    const payload = { ...brief, prompt: prompt || brief.prompt || '', at: brief.at || new Date().toISOString(), autoBest: detail.autoBest !== false };
    saveGalleryAiBridgeState_(payload);
    await applyGalleryAiBrief_(payload, { ensureRefresh: state.isOpen, autoBest: !!payload.autoBest });
  });
}

function mountOnce_() {
  if (modalEl) return;

  overlayEl = document.createElement('div');
  overlayEl.className = 'stg-overlay';
  overlayEl.addEventListener('click', () => close());

  modalEl = document.createElement('div');
  modalEl.className = 'stg-modal stg-view-big';

  modalEl.innerHTML = `
    <div class="stg-head" data-stg-drag>
      <div class="stg-title">
        <strong>Галерея</strong>
        <span class="stg-sub" style="color:rgba(148,163,184,0.9);font-size:12px;">— вибір та імпорт</span>
      </div>

      <div class="stg-tabs" data-stg-tabs>
        <button class="stg-tab" data-cat="images">Картинки</button>
        <button class="stg-tab" data-cat="logos">Логотип</button>
        <button class="stg-tab" data-cat="icons">Іконки</button>
      </div>

      <div class="stg-actions">
       <button class="stg-btn" data-act="addFolder">Додати папку</button>
        <button class="stg-btn" data-act="renameFolder">Редагувати папку</button>
        <button class="stg-btn" data-act="renameFile">Редагувати файл</button>
        <button class="stg-btn" data-act="editMeta" title="AI-опис і теги для системної бібліотеки">Опис / AI</button>
        <button class="stg-btn" data-act="delete">Видалити</button>
        <button class="stg-btn" data-act="addFile">Додати файл</button>
      </div>
    </div>

    <div class="stg-body">
      <div class="stg-left">
        <div class="stg-tree" data-stg-tree></div>
        <div class="stg-drop-hint" data-stg-dropzone>
          Перетягни файли сюди або прямо на папку. Якщо це системна папка ⭐ — файл отримає AI-опис і системну роль.
        </div>
      </div>

      <div class="stg-right">
        <div class="stg-sizes" data-stg-views>
          <span style="font-size:12px;color:rgba(148,163,184,0.9);margin-right:6px;">Вигляд:</span>
          <button class="stg-pill" data-view="small">Малі</button>
          <button class="stg-pill" data-view="big">Великі</button>
          <button class="stg-pill" data-view="huge">Дуже великі</button>
          <button class="stg-pill" data-view="list">Список</button>
          <button class="stg-pill" data-view="icons" data-stg-icons-view style="display:none;">Іконки</button>

          <span class="stg-sep" data-stg-icon-theme style="display:none;align-items:center;gap:6px;margin-left:10px;">
            <span style="font-size:12px;color:rgba(148,163,184,0.9);">Іконки:</span>
            <button class="stg-pill" data-icon-theme="dark" title="Білі іконки на темному фоні">Білі</button>
            <button class="stg-pill" data-icon-theme="light" title="Чорні іконки на світлому фоні">Чорні</button>
          </span>

          <span style="flex:1"></span>
          <button class="stg-btn" data-act="insert" title="Вставити (для режиму вибору)">Вставити</button>
        </div>

        <div class="stg-system-filter" data-stg-system-filter style="display:none;">
          <div class="stg-system-filter__top">
            <strong>Фільтр системної бібліотеки проєкту</strong>
            <span data-stg-system-count>0</span>
          </div>
          <div class="stg-system-filter__controls">
            <input class="stg-input" data-stg-filter-query placeholder="Пошук: назва, опис, тег..." />
            <select class="stg-select" data-stg-filter-theme>
              <option value="">Усі теми</option>
            </select>
            <select class="stg-select" data-stg-filter-usage>
              <option value="">Усе застосування</option>
            </select>
            <select class="stg-select" data-stg-filter-status>
              <option value="">Усі</option>
              <option value="analyzed">Проаналізовані</option>
              <option value="not-analyzed">Без аналізу</option>
            </select>
            <button class="stg-btn" data-act="clearSystemFilters">Очистити</button>
          </div>

          <div class="stg-system-ai-rank" data-stg-ai-rank-panel>
            <div class="stg-system-ai-rank__title">
              <strong>AI-підбір ассетів</strong>
              <span data-stg-ai-rank-info>ранжування вимкнено</span>
            </div>
            <div class="stg-system-ai-rank__controls">
              <input class="stg-input" data-stg-ai-theme placeholder="Тема: education, nature..." />
              <input class="stg-input" data-stg-ai-style placeholder="Стиль: soft, clean..." />
              <input class="stg-input" data-stg-ai-mood placeholder="Настрій: calm, friendly..." />
              <input class="stg-input" data-stg-ai-color placeholder="Колір: green, blue..." />
              <select class="stg-select" data-stg-ai-usage>
                <option value="hero">hero</option>
                <option value="header">header</option>
                <option value="section-background">section-background</option>
                <option value="page-background">page-background</option>
                <option value="banner">banner</option>
              </select>
              <select class="stg-select" data-stg-ai-text>
                <option value="dark">темний текст</option>
                <option value="light">світлий текст</option>
                <option value="">без тексту</option>
              </select>
              <button class="stg-btn" data-act="pullAiChatBrief" title="Взяти останню команду з AI чату">З AI чату</button>
              <button class="stg-btn stg-btn--ai-rank" data-act="rankSystemAssets">AI оцінити</button>
              <button class="stg-btn stg-btn--ai-best" data-act="selectBestAiAsset" title="Оцінити і вибрати найкращий ассет у поточній папці">AI найкращий</button>
              <button class="stg-btn stg-btn--asset-apply" data-act="applySelectedAssetToActive" title="Застосувати вибраний фон/картинку до активного елемента через віджет Заливка">Застосувати до активного</button>
              <button class="stg-btn" data-act="clearAiRank">Скинути AI</button>
            </div>
          </div>
        </div>

        <div class="stg-grid" data-stg-grid></div>
        <div class="stg-asset-details" data-stg-asset-details></div>

        <div class="stg-resizer" data-stg-resize></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlayEl);
  document.body.appendChild(modalEl);

  bindGalleryAiBridge_();
  bindHeaderActions_();
  bindTabs_();
  bindViews_();
  bindIconTheme_();
  bindSystemFilters_();
  bindDragDrop_();
  bindKeyboard_();


  makeDraggable_(modalEl, q('[data-stg-drag]'));
  makeResizable_(modalEl, q('[data-stg-resize]'));

  // init icon theme classes
  setIconTheme_(state.iconTheme);
}

function setView_(view) {
  state.view = view;
  modalEl.classList.remove('stg-view-small','stg-view-big','stg-view-huge','stg-view-list','stg-view-icons');
  modalEl.classList.add(view === 'small' ? 'stg-view-small' :
                    view === 'huge'  ? 'stg-view-huge'  :
                    view === 'list'  ? 'stg-view-list'  :
                    view === 'icons' ? 'stg-view-icons' : 'stg-view-big');
  qa('[data-stg-views] .stg-pill').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
}

function setCat_(cat) {
  state.cat = cat;
  state.folderId = `root_${cat}`;
  state.selectedFolderId = state.folderId;
   state.selectedItemIds = [];
  state.lastSelectedIndex = -1;

  qa('[data-stg-tabs] .stg-tab').forEach(t => t.classList.toggle('is-active', t.dataset.cat === cat));

  // icons-only view button ("Іконки" like lucide.dev tiles)
  const iconsViewBtn = q('[data-stg-icons-view]');
  if (iconsViewBtn) iconsViewBtn.style.display = (cat === 'icons') ? 'inline-flex' : 'none';

  // if we leave icons category while in icons view — fallback to big
  if (cat !== 'icons' && state.view === 'icons') {
    setView_('big');
  }

  refresh_();
}


function isProjectSystemFolder_(folderId = state.folderId) {
  return String(folderId || '').startsWith('static_sys_');
}

function isPhotoGalleryRootFolder_(folderId = state.folderId) {
  return String(folderId || '') === 'sys_photo_gallery';
}

function isPhotoGalleryChildFolder_(folderId = state.folderId) {
  const id = String(folderId || '');
  const f = (state.foldersCache || []).find(x => String(x.id || '') === id);
  return String(f?.parentId || '') === 'sys_photo_gallery';
}

function getNewFolderParentId_() {
  // [00353][PHOTO GALLERY] Якщо користувач вибрав папку "Фото-галерея" або її категорію,
  // нова папка створюється всередині "Фото-галерея" і стає категорією галереї.
  if (state.cat === 'images' && (isPhotoGalleryRootFolder_() || isPhotoGalleryChildFolder_())) return 'sys_photo_gallery';
  return `root_${state.cat}`;
}

function arr_(value) {
  if (Array.isArray(value)) return value.map(x => String(x || '').trim()).filter(Boolean);
  if (value == null) return [];
  return String(value).split(',').map(x => x.trim()).filter(Boolean);
}

function uniq_(arr) {
  return Array.from(new Set((arr || []).map(x => String(x || '').trim()).filter(Boolean)));
}

function bestScorePairs_(scores, limit = 3) {
  if (!scores || typeof scores !== 'object') return [];
  return Object.entries(scores)
    .map(([key, value]) => [key, Number(value || 0)])
    .filter(([key, value]) => key && Number.isFinite(value) && value > 0)
    .sort((a,b) => b[1] - a[1])
    .slice(0, limit);
}

function assetSearchText_(it) {
  const chunks = [
    it.name, it.title, it.description, it.primaryTheme,
    ...arr_(it.themes), ...arr_(it.tags), ...arr_(it.usage), ...arr_(it.reusableThemes),
    ...Object.keys(it.themeScores || {}),
    ...Object.keys(it.styleScores || {}),
    ...Object.keys(it.moodScores || {}),
    ...Object.keys(it.colorScores || {}),
    ...Object.keys(it.usageScores || {})
  ];
  return chunks.join(' ').toLowerCase();
}


function terms_(value) {
  return Array.from(new Set(String(value || '')
    .split(/[,+;|]/)
    .map(x => x.trim().toLowerCase())
    .filter(Boolean)));
}

function projectFolderRole_() {
  const id = String(state.folderId || '');
  if (id.includes('background')) return 'background';
  if (id.includes('logo')) return 'logo';
  if (id.includes('icon')) return 'icon';
  return 'image';
}

function aiRankCriteria_() {
  const rank = state.aiRank || {};
  return {
    role: projectFolderRole_(),
    theme: terms_(rank.theme || state.systemFilter.theme),
    usage: terms_(rank.usage || state.systemFilter.usage),
    style: terms_(rank.style),
    mood: terms_(rank.mood),
    color: terms_(rank.color),
    textMode: rank.textMode || '',
    preferClean: rank.preferClean !== false
  };
}

function applyAiRank_(items) {
  const rank = state.aiRank || {};
  if (!rank.enabled) return items || [];
  const criteria = aiRankCriteria_();
  return (items || [])
    .map((it) => ({ ...it, _aiMatch: galScoreAiAsset(it, criteria) }))
    .sort((a, b) => {
      const sa = Number(a._aiMatch?.score || 0);
      const sb = Number(b._aiMatch?.score || 0);
      if (sb !== sa) return sb - sa;
      const pa = Number(a.priority || 0);
      const pb = Number(b.priority || 0);
      if (pb !== pa) return pb - pa;
      return (a.name || '').localeCompare(b.name || '', 'uk');
    });
}

function rerenderProjectItems_() {
  state.filteredItemsCache = isProjectSystemFolder_() ? filterProjectSystemItems_(state.itemsCache) : state.itemsCache;
  renderItems_(state.filteredItemsCache);
  updateSystemFilterUi_(state.itemsCache);
}

function filterProjectSystemItems_(items) {
  const f = state.systemFilter || {};
  const query = String(f.query || '').trim().toLowerCase();
  const theme = String(f.theme || '').trim();
  const usage = String(f.usage || '').trim();
  const status = String(f.status || '').trim();

  const filtered = (items || []).filter(it => {
    if (query && !assetSearchText_(it).includes(query)) return false;
    if (theme) {
      const themes = new Set([...arr_(it.themes), it.primaryTheme, ...Object.keys(it.themeScores || {})].filter(Boolean));
      if (!themes.has(theme)) return false;
    }
    if (usage) {
      const usages = new Set([...arr_(it.usage), ...Object.keys(it.usageScores || {})].filter(Boolean));
      if (!usages.has(usage)) return false;
    }
    if (status === 'analyzed' && !it.analyzed) return false;
    if (status === 'not-analyzed' && it.analyzed) return false;
    return true;
  });

  return applyAiRank_(filtered);
}

function fillSelect_(sel, values, current, placeholder) {
  if (!sel) return;
  const old = String(current || '');
  sel.innerHTML = '';
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = placeholder;
  sel.appendChild(opt0);
  uniq_(values).sort((a,b)=>a.localeCompare(b, 'uk')).forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
  sel.value = old;
}

async function updateSystemFilterUi_(items = []) {
  const wrap = q('[data-stg-system-filter]');
  if (!wrap) return;
  const isProject = isProjectSystemFolder_();
  wrap.style.display = isProject ? 'block' : 'none';
  if (!isProject) {
    renderAssetDetails_(null);
    return;
  }

  let manifest = state.staticManifestCache;
  if (!manifest) {
    manifest = await galLoadStaticSystemManifest();
    state.staticManifestCache = manifest;
  }

  const themeCatalog = Array.isArray(manifest?.themeCatalog) ? manifest.themeCatalog : [];
  const usageCatalog = Array.isArray(manifest?.usageCatalog) ? manifest.usageCatalog : [];
  const itemThemes = [];
  const itemUsages = [];
  (items || []).forEach(it => {
    itemThemes.push(...arr_(it.themes), it.primaryTheme, ...Object.keys(it.themeScores || {}));
    itemUsages.push(...arr_(it.usage), ...Object.keys(it.usageScores || {}));
  });

  const qInput = q('[data-stg-filter-query]');
  const themeSel = q('[data-stg-filter-theme]');
  const usageSel = q('[data-stg-filter-usage]');
  const statusSel = q('[data-stg-filter-status]');
  if (qInput && qInput.value !== state.systemFilter.query) qInput.value = state.systemFilter.query || '';
  fillSelect_(themeSel, [...themeCatalog, ...itemThemes], state.systemFilter.theme, 'Усі теми');
  fillSelect_(usageSel, [...usageCatalog, ...itemUsages], state.systemFilter.usage, 'Усе застосування');
  if (statusSel) statusSel.value = state.systemFilter.status || '';

  const aiTheme = q('[data-stg-ai-theme]');
  const aiStyle = q('[data-stg-ai-style]');
  const aiMood = q('[data-stg-ai-mood]');
  const aiColor = q('[data-stg-ai-color]');
  const aiUsage = q('[data-stg-ai-usage]');
  const aiText = q('[data-stg-ai-text]');
  if (aiTheme && aiTheme.value !== state.aiRank.theme) aiTheme.value = state.aiRank.theme || '';
  if (aiStyle && aiStyle.value !== state.aiRank.style) aiStyle.value = state.aiRank.style || '';
  if (aiMood && aiMood.value !== state.aiRank.mood) aiMood.value = state.aiRank.mood || '';
  if (aiColor && aiColor.value !== state.aiRank.color) aiColor.value = state.aiRank.color || '';
  if (aiUsage) aiUsage.value = state.aiRank.usage || 'hero';
  if (aiText) aiText.value = state.aiRank.textMode || '';

  const count = q('[data-stg-system-count]');
  if (count) count.textContent = `показано ${state.filteredItemsCache.length} з ${items.length}`;

  const aiInfo = q('[data-stg-ai-rank-info]');
  if (aiInfo) {
    if (state.aiRank.enabled) {
      const bestItem = (state.filteredItemsCache || [])[0];
      const best = bestItem?._aiMatch;
      const bestName = bestItem?.title || bestItem?.name || '';
      aiInfo.textContent = best
        ? `AI рейтинг увімкнено · найкращий ${best.score}/100${bestName ? ' · ' + bestName : ''}`
        : 'AI рейтинг увімкнено';
    } else {
      aiInfo.textContent = 'ранжування вимкнено';
    }
  }
}

function renderAssetDetails_(item = null) {
  const box = q('[data-stg-asset-details]');
  if (!box) return;
  if (!item || !String(item.id || '').startsWith('static:')) {
    box.innerHTML = '';
    box.style.display = 'none';
    return;
  }

  const themeTop = bestScorePairs_(item.themeScores, 5);
  const usageTop = bestScorePairs_(item.usageScores, 5);
  const styleTop = bestScorePairs_(item.styleScores, 5);
  const moodTop = bestScorePairs_(item.moodScores, 5);
  const colorTop = bestScorePairs_(item.colorScores, 5);
  const read = item.textReadability || {};
  const visual = item.visualScores || {};
  const aiMatch = item._aiMatch || null;
  const reusableThemes = arr_(item.reusableThemes);

  const chips = (list, cls='') => arr_(list).slice(0, 16).map(v => `<span class="stg-chip ${cls}">${escapeHtml_(v)}</span>`).join('');
  const scores = (pairs) => pairs.map(([k,v]) => `<span class="stg-score"><b>${escapeHtml_(k)}</b> ${v}/10</span>`).join('');

  box.style.display = 'block';
  box.innerHTML = `
    <div class="stg-asset-details__head">
      <strong>${escapeHtml_(item.title || item.name || 'Системний asset')}</strong>
      <span>${Number(item.rating || 0) > 0 ? `★ ${Number(item.rating).toFixed(1)}/10 · ` : ''}${escapeHtml_(item.assetRole || item.type || '')}</span>
    </div>
    <div class="stg-asset-details__path">${escapeHtml_(item.path || item.url || '')}</div>
    ${item.description ? `<div class="stg-asset-details__desc">${escapeHtml_(item.description)}</div>` : ''}
    ${aiMatch ? `
      <div class="stg-ai-match-details ${state.aiBest?.selectedId === item.id ? 'is-picked-best' : ''}">
        <strong>${state.aiBest?.selectedId === item.id ? 'AI обрав цей ассет: ' : 'AI-відповідність: '}${Number(aiMatch.score || 0)}/100</strong>
        <div>${(aiMatch.topReasons || []).map(x => `<span class="stg-score">${escapeHtml_(x)}</span>`).join('') || 'Підібрано за загальним пріоритетом.'}</div>
      </div>
    ` : ''}
    <div class="stg-asset-details__grid">
      <div><b>Теми</b><div class="stg-chip-row">${chips(item.themes)}</div></div>
      <div><b>Теги</b><div class="stg-chip-row">${chips(item.tags)}</div></div>
      <div><b>Повторне використання</b><div class="stg-chip-row">${item.reusable ? chips(reusableThemes, 'stg-chip--system') : 'лише ця колекція'}</div><div class="stg-score-row">${item.reusable ? 'дозволено для сумісних тем' : 'не дозволено'}${item.reusePolicy ? ` · ${escapeHtml_(item.reusePolicy)}` : ''}</div></div>
      <div><b>Теми / бали</b><div class="stg-score-row">${scores(themeTop) || '—'}</div></div>
      <div><b>Застосування</b><div class="stg-score-row">${scores(usageTop) || chips(item.usage) || '—'}</div></div>
      <div><b>Стиль</b><div class="stg-score-row">${scores(styleTop) || '—'}</div></div>
      <div><b>Настрій</b><div class="stg-score-row">${scores(moodTop) || '—'}</div></div>
      <div><b>Кольори</b><div class="stg-score-row">${scores(colorTop) || '—'}</div></div>
      <div><b>Текст</b><div class="stg-score-row">світлий: ${Number(read.lightText || 0)}/10 · темний: ${Number(read.darkText || 0)}/10 · overlay: ${read.needsOverlay ? 'так' : 'ні'} · зона: ${escapeHtml_(read.bestTextZone || '—')}</div></div>
      <div><b>Візуально</b><div class="stg-score-row">чистота: ${Number(visual.cleanliness || 0)}/10 · складність: ${Number(visual.complexity || 0)}/10 · шум: ${Number(visual.noise || 0)}/10</div></div>
      <div><b>Аналіз</b><div class="stg-score-row">${item.analyzed ? 'проаналізовано' : 'без аналізу'} · v${escapeHtml_(item.analysisVersion || '—')} · priority ${Number(item.priority || 0)}/10</div></div>
    </div>
  `;
}

async function refresh_() {
  await galEnsureSeed();
  const folders = await galListFolders(state.cat);
  renderFolders_(folders);
state.foldersCache = folders || [];



  // ensure current folder exists
  const existing = folders.find(f => f.id === state.folderId);
  if (!existing) state.folderId = `root_${state.cat}`;

  let items = [];
  if (state.cat === 'icons' && isLucideFolder_(state.folderId)) {
    items = await listBuiltinLucideItems_(state.folderId);
  } else {
    items = await galListItems(state.cat, state.folderId);
  }
  state.itemsCache = items || [];
  state.filteredItemsCache = isProjectSystemFolder_() ? filterProjectSystemItems_(state.itemsCache) : state.itemsCache;
  await updateSystemFilterUi_(state.itemsCache);
  renderItems_(state.filteredItemsCache);


  // header title
  const title = q('.stg-title strong');
  if (title) title.textContent = `Галерея — ${CAT_LABEL[state.cat] || 'Категорія'}`;

  // show insert button only in picker mode
  const insBtn = q('[data-act="insert"]');
  if (insBtn) insBtn.style.display = state.pickerMode ? 'inline-flex' : 'none';

  // icons preview theme controls only for "Іконки"
  const themeWrap = q('[data-stg-icon-theme]');
  if (themeWrap) themeWrap.style.display = (state.cat === 'icons') ? 'inline-flex' : 'none';

  if (state.cat === 'icons') {
    // ensure modal classes + active pills are in sync
    setIconTheme_(state.iconTheme);
  }
}

function renderFolders_(folders) {
  const tree = q('[data-stg-tree]');
  if (!tree) return;
  tree.innerHTML = '';

  // [00956] One-level collection folders are rendered directly after their parent.
  // This covers both photo categories and manifest-backed template asset packs.
  const rawList = folders.filter(f => f.cat === state.cat);
  const folderIds = new Set(rawList.map(f => String(f.id || '')));
  const nestedChildren = rawList.filter(f => {
    const parentId = String(f.parentId || '');
    return parentId && !parentId.startsWith('root_') && folderIds.has(parentId);
  });
  const list = [];
  rawList.forEach((f) => {
    if (nestedChildren.includes(f)) return;
    list.push(f);
    list.push(...nestedChildren.filter(child => String(child.parentId || '') === String(f.id || '')));
  });

  list.forEach(f => {
    const row = document.createElement('div');
    const isSystem = !!(f.systemFolder || galIsSystemFolder(f.id));
    const isNestedChild = nestedChildren.includes(f);
    row.className = 'stg-folder';
    row.classList.toggle('is-system', isSystem);
    row.classList.toggle('is-photo-gallery-child', isNestedChild);
    row.style.paddingLeft = isNestedChild ? '18px' : '';
    row.dataset.folderId = f.id;
    row.innerHTML = `
      <span class="stg-folder-name">${isNestedChild ? '↳ ' : '📁 '}${escapeHtml_(f.name)}</span>
      <span class="stg-folder-badge">${f.id.startsWith('root_') ? 'root' : (isNestedChild ? (f.collectionId ? 'колекція' : 'категорія') : (isSystem ? 'system' : ''))}</span>
    `;
    row.classList.toggle('is-active', f.id === state.folderId);
    row.addEventListener('click', () => {
      state.folderId = f.id;
      state.selectedFolderId = f.id;
       state.selectedItemIds = [];
  state.lastSelectedIndex = -1;
      refresh_();
    });

    // drop files onto folder
    row.addEventListener('dragover', (e) => {
      if (!e.dataTransfer) return;
      e.preventDefault();
      row.style.borderColor = 'rgba(34,197,94,0.7)';
    });
    row.addEventListener('dragleave', () => {
      row.style.borderColor = '';
    });
    row.addEventListener('drop', async (e) => {
      e.preventDefault();
      row.style.borderColor = '';
      const files = Array.from(e.dataTransfer?.files || []).filter(Boolean);
      if (!files.length) return;
      await galAddFiles({ cat: state.cat, folderId: f.id, files });
      state.folderId = f.id;
      refresh_();
    });

    tree.appendChild(row);
  });
}

function isSelected_(id) {
  return state.selectedItemIds.includes(id);
}

function setSelectedSingle_(id, idx) {
  state.selectedItemIds = [id];
  state.lastSelectedIndex = typeof idx === 'number' ? idx : -1;
}

function toggleSelected_(id, idx) {
  const has = isSelected_(id);
  state.selectedItemIds = has
    ? state.selectedItemIds.filter(x => x !== id)
    : [...state.selectedItemIds, id];
  state.lastSelectedIndex = typeof idx === 'number' ? idx : state.lastSelectedIndex;
}

function setSelectedRange_(items, fromIdx, toIdx) {
  const a = Math.min(fromIdx, toIdx);
  const b = Math.max(fromIdx, toIdx);
  const ids = items.slice(a, b + 1).map(x => x.id);
  // робимо унікальним (на всяк випадок)
  state.selectedItemIds = Array.from(new Set(ids));
}


function readAiRankControls_() {
  const theme = q('[data-stg-ai-theme]');
  const style = q('[data-stg-ai-style]');
  const mood = q('[data-stg-ai-mood]');
  const color = q('[data-stg-ai-color]');
  const usage = q('[data-stg-ai-usage]');
  const text = q('[data-stg-ai-text]');
  return {
    ...(state.aiRank || {}),
    enabled: true,
    theme: theme?.value || state.systemFilter.theme || '',
    style: style?.value || '',
    mood: mood?.value || '',
    color: color?.value || '',
    usage: usage?.value || state.systemFilter.usage || 'hero',
    textMode: text?.value || '',
    preferClean: true
  };
}


function getSelectedGalleryAsset_() {
  const selectedId = (Array.isArray(state.selectedItemIds) && state.selectedItemIds[0]) ? String(state.selectedItemIds[0]) : '';
  if (selectedId) {
    const item = (state.filteredItemsCache || state.itemsCache || []).find(x => String(x.id) === selectedId)
      || (state.itemsCache || []).find(x => String(x.id) === selectedId);
    if (item) return item;
  }
  if (state.aiBest?.selectedId) {
    const bestId = String(state.aiBest.selectedId);
    const item = (state.filteredItemsCache || state.itemsCache || []).find(x => String(x.id) === bestId)
      || (state.itemsCache || []).find(x => String(x.id) === bestId);
    if (item) return item;
  }
  return (state.filteredItemsCache || [])[0] || null;
}

function normalizeGalleryAssetUrl_(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^(blob:|data:|https?:|file:)/i.test(raw)) return raw;
  try { return new URL(raw.replace(/^\.\//, ''), window.location.href).href; }
  catch(e) { return raw; }
}

function applySelectedAssetToActive_() {
  const item = getSelectedGalleryAsset_();
  if (!item) {
    alert('Вибери фон/картинку або натисни “AI найкращий”.');
    return false;
  }
  const url = normalizeGalleryAssetUrl_(galMakeObjectUrl(item) || item.url || item.path || '');
  if (!url) {
    alert('У вибраного файла немає URL/path для застосування.');
    return false;
  }
  const role = item.assetRole || item.type || projectFolderRole_();
  if (role !== 'background' && role !== 'image') {
    alert('Застосування до активного елемента зараз увімкнене тільки для фонів і картинок. Лого/іконки підключимо окремим етапом.');
    return false;
  }
  const detail = {
    source: 'gallery-ai-selected-asset',
    itemId: item.id,
    cat: item.cat || state.cat || 'images',
    folderId: item.folderId || state.folderId || '',
    name: item.name || item.title || '',
    title: item.title || item.name || '',
    path: item.path || item.url || '',
    url,
    mime: item.mime || '',
    assetRole: role,
    aiMatch: item._aiMatch || null,
    fit: 'cover',
    position: 'center center',
    opacity: 1,
    gray: 0,
  };
  try {
    const status = q('[data-stg-ai-rank-info]');
    let result = null;

    // ✅ Основний шлях: прямий API віджета Заливка. Так ми одразу знаємо, чи реально застосувалось.
    if (window.ST_FILL_WIDGET && typeof window.ST_FILL_WIDGET.applyGalleryAssetToActive === 'function') {
      result = window.ST_FILL_WIDGET.applyGalleryAssetToActive(detail);
      if (result && result.ok) {
        if (status) status.textContent = `Застосовано до активного: ${detail.title || detail.name || 'asset'} · targets: ${result.targetCount || 1}`;
        return true;
      }
      if (status) status.textContent = result?.message || 'Заливка не застосувалась.';
      return false;
    }

    // Fallback: подія, якщо прямий API ще недоступний.
    window.dispatchEvent(new CustomEvent('st:gallery-asset:apply-active-fill', { detail }));
    if (status) status.textContent = `Передано в Заливку: ${detail.title || detail.name || 'asset'}`;
    return true;
  } catch (e) {
    console.error('[gallery] applySelectedAssetToActive failed', e);
    alert('Не вдалося передати файл у віджет Заливка. Перевір консоль.');
    return false;
  }
}

function selectAiBestAsset_({ alertIfEmpty = true } = {}) {
  if (!isProjectSystemFolder_()) {
    if (alertIfEmpty) alert('AI-підбір працює тільки у папках “📦 Проєкт: системні ...”.');
    return null;
  }

  state.aiRank = readAiRankControls_();
  state.filteredItemsCache = filterProjectSystemItems_(state.itemsCache);
  const best = (state.filteredItemsCache || [])[0] || null;
  if (!best) {
    state.aiBest = { selectedId: '', selectedAt: '', score: null };
    renderItems_(state.filteredItemsCache || []);
    updateSystemFilterUi_(state.itemsCache);
    if (alertIfEmpty) alert('Немає ассетів, які проходять поточні фільтри. Очисти фільтри або додай файл у manifest.json.');
    return null;
  }

  state.selectedItemIds = [best.id];
  state.lastSelectedIndex = 0;
  state.aiBest = {
    selectedId: best.id,
    selectedAt: new Date().toISOString(),
    score: Number(best._aiMatch?.score || 0)
  };
  renderItems_(state.filteredItemsCache);
  renderAssetDetails_(best);
  updateSystemFilterUi_(state.itemsCache);

  const grid = q('[data-stg-grid]');
  const node = grid?.querySelector(`[data-item-id="${CSS.escape(String(best.id))}"]`);
  if (node) node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  return best;
}




function renderItems_(items) {
  const grid = q('[data-stg-grid]');
  if (!grid) return;
  grid.innerHTML = '';

  items.forEach((it, idx) => {
    const card = document.createElement('div');
    card.className = 'stg-item';
    card.dataset.itemId = it.id;
    card.classList.toggle('is-selected', isSelected_(it.id));
    card.classList.toggle('has-ai-score', !!it._aiMatch);
    card.classList.toggle('is-ai-best', !!it._aiMatch && idx === 0 && !!state.aiRank?.enabled);
    const thumb = document.createElement('div');
    thumb.className = 'stg-thumb';

    // thumbnail for images only
    if (it.mime.startsWith('image/')) {
      const img = document.createElement('img');
      img.className = 'stg-img';
      if (it.mime === 'image/svg+xml') img.classList.add('stg-svg');
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      img.alt = it.name;
      const url = galMakeObjectUrl(it);
      img.src = url;
      img.onload = () => {
        // revoke only for blob: URLs
        if (String(url || '').startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      };
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = `<span style="color:rgba(148,163,184,0.95);font-size:12px;">${escapeHtml_(it.mime)}</span>`;
    }

    const name = document.createElement('div');
    name.className = 'stg-name';
    name.textContent = it.name;

    const meta = document.createElement('div');
    meta.className = 'stg-meta';
    const isSystemAsset = !!(it.systemAsset || galIsSystemFolder(it.folderId));
    const role = it.assetRole || galGetSystemFolderMeta(it.folderId)?.role || '';
    const desc = String(it.description || '').trim();
    const tags = Array.isArray(it.tags) ? it.tags : [];
    const aiScore = it._aiMatch ? Number(it._aiMatch.score || 0) : null;
    const aiTitle = it._aiMatch?.topReasons?.length ? it._aiMatch.topReasons.join('\n') : '';
    const rating = Number(it.rating || 0);
    meta.innerHTML = `
      ${typeof aiScore === 'number' ? `<span class="stg-chip stg-chip--ai-score" title="${escapeHtml_(aiTitle)}">AI ${aiScore}/100</span>` : ''}
      ${idx === 0 && typeof aiScore === 'number' && state.aiRank?.enabled ? `<span class="stg-chip stg-chip--ai-best">найкращий</span>` : ''}
      ${rating > 0 ? `<span class="stg-chip stg-chip--ai-score" title="Редакційний рейтинг зображення">★ ${rating.toFixed(1)}/10</span>` : ''}
      ${isSystemAsset ? `<span class="stg-chip stg-chip--system">system</span>` : ''}
      ${role ? `<span class="stg-chip">${escapeHtml_(role)}</span>` : ''}
      ${desc ? `<span class="stg-desc" title="${escapeHtml_(desc)}">${escapeHtml_(desc)}</span>` : ''}
      ${tags.length ? `<span class="stg-tags">#${escapeHtml_(tags.slice(0, 4).join(' #'))}</span>` : ''}
    `;

    card.appendChild(thumb);
    card.appendChild(name);
    card.appendChild(meta);

   card.addEventListener('click', (e) => {
  const ctrl = e.ctrlKey || e.metaKey; // Windows/Linux CTRL, Mac CMD
  const shift = e.shiftKey;

  if (shift && state.lastSelectedIndex >= 0) {
    // shift range selection
    setSelectedRange_(items, state.lastSelectedIndex, idx);
  } else if (ctrl) {
    // toggle single
    toggleSelected_(it.id, idx);
  } else {
    // single select
    setSelectedSingle_(it.id, idx);
  }

  // apply UI
  qa('.stg-item').forEach(n => n.classList.toggle('is-selected', isSelected_(n.dataset.itemId)));
  renderAssetDetails_(state.selectedItemIds.length === 1 ? items.find(x => String(x.id) === String(state.selectedItemIds[0])) : null);
});

   card.addEventListener('dblclick', () => {
  // dblclick робимо як single select (щоб було прогнозовано)
  setSelectedSingle_(it.id, idx);
  qa('.stg-item').forEach(n => n.classList.toggle('is-selected', isSelected_(n.dataset.itemId)));
  renderAssetDetails_(it);
  if (state.pickerMode) doInsert_();
});


    grid.appendChild(card);
  });
}


function normalizeName_(s) {
  return String(s || '').trim().toLowerCase();
}

function folderNameExists_(name, exceptId = null) {
  const n = normalizeName_(name);
  return (state.foldersCache || []).some(f =>
    f.id !== exceptId &&
    normalizeName_(f.name) === n
  );
}

function fileNameExistsInFolder_(name, exceptIds = []) {
  const n = normalizeName_(name);
  const except = new Set(exceptIds);
  return (state.itemsCache || []).some(it =>
    !except.has(it.id) &&
    normalizeName_(it.name) === n
  );
}




function bindHeaderActions_() {
  modalEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;

    const act = btn.dataset.act;

    if (act === 'close') return close();

    if (act === 'clearSystemFilters') {
      state.systemFilter = { query: '', theme: '', usage: '', status: '' };
      await refresh_();
      return;
    }

    if (act === 'pullAiChatBrief') {
      const brief = loadGalleryAiBridgeState_();
      if (!brief) {
        alert('У AI чаті ще немає згенерованої команди для підбору ассетів.');
        return;
      }
      await applyGalleryAiBrief_(brief, { ensureRefresh: true, autoBest: false });
      return;
    }

    if (act === 'rankSystemAssets') {
      state.aiRank = readAiRankControls_();
      state.aiBest = { selectedId: '', selectedAt: '', score: null };
      rerenderProjectItems_();
      return;
    }

    if (act === 'selectBestAiAsset') {
      selectAiBestAsset_();
      return;
    }

    if (act === 'applySelectedAssetToActive') {
      applySelectedAssetToActive_();
      return;
    }

    if (act === 'clearAiRank') {
      state.aiRank = {
        enabled: false,
        theme: '',
        usage: 'hero',
        style: '',
        mood: '',
        color: '',
        textMode: 'dark',
        preferClean: true
      };
      state.aiBest = { selectedId: '', selectedAt: '', score: null };
      rerenderProjectItems_();
      return;
    }

    if (act === 'addFolder') {
      const name = prompt('Назва папки:', 'Нова папка');
      if (!name) return;
      await galCreateFolder({ cat: state.cat, parentId: getNewFolderParentId_(), name });
      await refresh_();
      return;
    }

    // --- RENAME FOLDER (з підстановкою поточної назви) ---
    if (act === 'renameFolder') {
  const fid = state.selectedFolderId || state.folderId;
  if (!fid) return;
  if (fid.startsWith('root_')) return alert('Root папку не перейменовуємо.');
  if (galIsSystemFolder(fid)) return alert('Системну папку не перейменовуємо. Її назва потрібна для AI та конструктора.');
  if (fid.startsWith('lucide_')) return alert('Вбудовані папки Lucide не перейменовуємо.');

  const f = (state.foldersCache || []).find(x => x.id === fid);
  const current = f?.name || '';
  const name = prompt('Нова назва папки:', current);
  if (!name) return;

  if (folderNameExists_(name, fid)) {
    alert('Папка з таким іменем уже існує. Виберіть інше імʼя.');
    return;
  }

  await galRenameFolder(fid, name);
  await refresh_();
  return;
}

    // --- RENAME FILE(S) (single або multi з _1 _2 ...) ---
    if (act === 'renameFile') {
      const ids = Array.isArray(state.selectedItemIds) ? state.selectedItemIds : [];
      if (!ids.length) return alert('Вибери файл(и) для перейменування.');

      if (ids.some(id => String(id).startsWith('lucide:') || String(id).startsWith('static:'))) {
        return alert('Вбудовані/проєктні системні файли не перейменовуємо з галереї. Для проєктних файлів редагуй назву в папці проєкту і онови assets/system/manifest.json.');
      }

      const map = new Map((state.itemsCache || []).map(it => [it.id, it]));
      const first = map.get(ids[0]);
      const firstName = first?.name || '';

      const split_ = (n) => {
        const s = String(n || '');
        const i = s.lastIndexOf('.');
        if (i > 0 && i < s.length - 1) return { base: s.slice(0, i), ext: s.slice(i) };
        return { base: s, ext: '' };
      };

      if (ids.length === 1) {
        const { ext } = split_(firstName);
        const next = prompt('Нова назва файлу:', firstName);
        if (!next) return;

        const trimmed = next.trim();

        // якщо ввели без розширення — залишаємо старе
        const nextHasExt = trimmed.includes('.') && trimmed.lastIndexOf('.') > 0;
        const finalName = nextHasExt ? trimmed : (trimmed + ext);

        
        
        
       if (fileNameExistsInFolder_(finalName, ids)) {
  alert('Файл з таким іменем уже існує в цій папці. Виберіть інше імʼя.');
  return;
}

await galRenameItem(ids[0], finalName);
await refresh_();
return;
      }

      // multi: просимо базову назву
      const basePrompt = prompt('Нова базова назва (для групи):', split_(firstName).base || '');
      if (!basePrompt) return;
      const baseNew = basePrompt.trim();
      if (!baseNew) return;

      // якщо хочеш, щоб нумерація була стабільна — можна сортувати ids по createdAt із map
      // але поки залишаємо порядок selection
      
      
     // перевіряємо всі майбутні імена наперед
let k = 1;
for (const id of ids) {
  const it = map.get(id);
  const { ext } = split_(it?.name || '');
  const testName = `${baseNew}_${k}${ext}`;

  if (fileNameExistsInFolder_(testName, ids)) {
    alert(`Файл з іменем "${testName}" уже існує. Виберіть іншу базову назву.`);
    return;
  }
  k++;
}

// якщо все ок — перейменовуємо
k = 1;
for (const id of ids) {
  const it = map.get(id);
  const { ext } = split_(it?.name || '');
  const finalName = `${baseNew}_${k}${ext}`;
  await galRenameItem(id, finalName);
  k++;
}

await refresh_();
return;








      await refresh_();
      return;
    }

    // --- AI DESCRIPTION / TAGS ---
    if (act === 'editMeta') {
      const ids = Array.isArray(state.selectedItemIds) ? state.selectedItemIds : [];
      if (!ids.length) return alert('Вибери один файл для AI-опису.');
      if (ids.length > 1) return alert('Для точного AI-опису поки вибери тільки один файл.');

      const id = ids[0];
      if (String(id).startsWith('lucide:')) {
        return alert('Вбудовані Lucide-іконки мають системний каталог. Опис для них поки не редагуємо.');
      }
      if (String(id).startsWith('static:')) {
        return alert('Проєктні системні файли описуємо в assets/system/manifest.json. Цей файл їде разом із ZIP, тому метадані треба зберігати саме там.');
      }

      const item = (state.itemsCache || []).find(x => String(x.id) === String(id));
      if (!item) return alert('Файл не знайдено в поточній папці.');

      const desc = prompt('AI-опис файлу: де і для чого його використовувати?', item.description || '');
      if (desc === null) return;

      const tagsInitial = Array.isArray(item.tags) ? item.tags.join(', ') : '';
      const tags = prompt('Теги через кому (наприклад: hero, dark, logo, wood, restaurant):', tagsInitial);
      if (tags === null) return;

      await galUpdateItemMeta(id, {
        description: desc,
        tags
      });
      await refresh_();
      return;
    }

    // --- DELETE (multi items first, else folder) ---
    if (act === 'delete') {
      if (state.selectedItemIds && state.selectedItemIds.length) {
        const idsAll = [...state.selectedItemIds];
        const idsDb = idsAll.filter(id => !String(id).startsWith('lucide:') && !String(id).startsWith('static:'));
        const idsBuiltin = idsAll.filter(id => String(id).startsWith('lucide:'));
        const idsStatic = idsAll.filter(id => String(id).startsWith('static:'));

        if (idsDb.length === 0) {
          return alert('Вбудовані/проєктні системні файли не видаляємо з галереї. Проєктні файли видаляй з папки assets/system і manifest.json.');
        }

        const mapItems = new Map((state.itemsCache || []).map(it => [String(it.id), it]));
        const sysCount = idsDb.filter(id => {
          const it = mapItems.get(String(id));
          return !!(it?.systemAsset || galIsSystemFolder(it?.folderId));
        }).length;

        const ok = confirm(
          `Видалити файли (${idsDb.length} шт.)?` +
          (sysCount ? `\nУвага: серед них системні файли (${sysCount} шт.). Вони зникнуть із системної бібліотеки.` : '') +
          (idsBuiltin.length ? `\n(Іконки Lucide пропущено: ${idsBuiltin.length} шт.)` : '')
        );
        if (!ok) return;

        for (const id of idsDb) {
          await galDeleteItem(id);
        }

        state.selectedItemIds = [];
        state.lastSelectedIndex = -1;
        await refresh_();
        return;
      }

      const fid = state.selectedFolderId || state.folderId;
      if (!fid || fid.startsWith('root_')) return alert('Root папку не видаляємо.');
      if (galIsSystemFolder(fid)) return alert('Системну папку не видаляємо. Вона потрібна для AI та конструктора.');
      if (fid.startsWith('lucide_')) return alert('Вбудовані папки Lucide не видаляємо.');

      const ok = confirm('Видалити папку і всі файли в ній?');
      if (!ok) return;

      await galDeleteFolder(fid);
      state.folderId = `root_${state.cat}`;
      state.selectedFolderId = state.folderId;
      await refresh_();
      return;
    }

    // --- ADD FILE ---
    if (act === 'addFile') {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      input.onchange = async () => {
        const files = Array.from(input.files || []);
        if (!files.length) return;
        await galAddFiles({ cat: state.cat, folderId: state.folderId, files });
        await refresh_();
      };
      input.click();
      return;
    }

    // --- INSERT (picker mode) ---
    if (act === 'insert') {
      doInsert_();
      return;
    }
  });
}










function bindTabs_() {
  qa('[data-stg-tabs] .stg-tab').forEach(tab => {
    tab.addEventListener('click', () => setCat_(tab.dataset.cat));
  });
}

function bindViews_() {
  qa('[data-stg-views] .stg-pill').forEach(p => {
    p.addEventListener('click', () => {
      setView_(p.dataset.view);
    });
  });
}

function bindIconTheme_() {
  const wrap = q('[data-stg-icon-theme]');
  if (!wrap) return;
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-icon-theme]');
    if (!btn) return;
    setIconTheme_(btn.dataset.iconTheme);
  });
}


function bindSystemFilters_() {
  modalEl.addEventListener('input', (e) => {
    const input = e.target.closest('[data-stg-filter-query]');
    const aiTheme = e.target.closest('[data-stg-ai-theme]');
    const aiStyle = e.target.closest('[data-stg-ai-style]');
    const aiMood = e.target.closest('[data-stg-ai-mood]');
    const aiColor = e.target.closest('[data-stg-ai-color]');

    if (input) {
      state.systemFilter.query = input.value || '';
      rerenderProjectItems_();
      return;
    }

    if (aiTheme || aiStyle || aiMood || aiColor) {
      if (aiTheme) state.aiRank.theme = aiTheme.value || '';
      if (aiStyle) state.aiRank.style = aiStyle.value || '';
      if (aiMood) state.aiRank.mood = aiMood.value || '';
      if (aiColor) state.aiRank.color = aiColor.value || '';
      if (state.aiRank.enabled) rerenderProjectItems_();
      return;
    }
  });

  modalEl.addEventListener('change', (e) => {
    const theme = e.target.closest('[data-stg-filter-theme]');
    const usage = e.target.closest('[data-stg-filter-usage]');
    const status = e.target.closest('[data-stg-filter-status]');
    const aiUsage = e.target.closest('[data-stg-ai-usage]');
    const aiText = e.target.closest('[data-stg-ai-text]');
    if (!theme && !usage && !status && !aiUsage && !aiText) return;
    if (theme) state.systemFilter.theme = theme.value || '';
    if (usage) state.systemFilter.usage = usage.value || '';
    if (status) state.systemFilter.status = status.value || '';
    if (aiUsage) state.aiRank.usage = aiUsage.value || '';
    if (aiText) state.aiRank.textMode = aiText.value || '';
    rerenderProjectItems_();
  });
}

function bindDragDrop_() {
  const dz = q('[data-stg-dropzone]');
  if (!dz) return;

  dz.addEventListener('dragover', (e) => {
    if (!e.dataTransfer) return;
    e.preventDefault();
    dz.style.borderColor = 'rgba(34,197,94,0.7)';
  });
  dz.addEventListener('dragleave', () => {
    dz.style.borderColor = '';
  });
  dz.addEventListener('drop', async (e) => {
    e.preventDefault();
    dz.style.borderColor = '';
    const files = Array.from(e.dataTransfer?.files || []).filter(Boolean);
    if (!files.length) return;
    await galAddFiles({ cat: state.cat, folderId: state.folderId, files });
    refresh_();
  });

     // ---- DROP прямо в активну папку (права область "вміст") ----
  const grid = q('[data-stg-grid]');
  if (grid) {
    grid.addEventListener('dragover', (e) => {
      if (!e.dataTransfer) return;
      e.preventDefault();
      grid.classList.add('is-drop-target');
    });

    grid.addEventListener('dragleave', (e) => {
      // коли виходимо за межі гріда — прибрати підсвітку
      const to = e.relatedTarget;
      if (to && grid.contains(to)) return;
      grid.classList.remove('is-drop-target');
    });

    grid.addEventListener('drop', async (e) => {
      e.preventDefault();
      grid.classList.remove('is-drop-target');

      const files = Array.from(e.dataTransfer?.files || []).filter(Boolean);
      if (!files.length) return;

      // ✅ саме активна папка (відкрита)
      await galAddFiles({ cat: state.cat, folderId: state.folderId, files });
      await refresh_();
    });
  }
}

function bindKeyboard_() {
  window.addEventListener('keydown', async (e) => {
    // працюємо тільки коли модалка реально відкрита
    if (!state.isOpen) return;

    // якщо фокус в полі вводу — не чіпаємо
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    const key = (e.key || '').toLowerCase();
    const isCtrl = e.ctrlKey || e.metaKey;

    // ESC — скинути виділення файлів
    if (key === 'escape') {
      if (state.selectedItemIds?.length) {
        e.preventDefault();
        state.selectedItemIds = [];
        state.lastSelectedIndex = -1;
        qa('.stg-item').forEach(n => n.classList.remove('is-selected'));
      }
      return;
    }

    // CTRL+A — виділити всі файли в папці
    if (isCtrl && key === 'a') {
      e.preventDefault();
      const all = (state.itemsCache || []).map(it => it.id);
      state.selectedItemIds = all;
      state.lastSelectedIndex = all.length ? 0 : -1;
      qa('.stg-item').forEach(n => n.classList.toggle('is-selected', state.selectedItemIds.includes(n.dataset.itemId)));
      return;
    }

    // DELETE / BACKSPACE — видалити
    if (key === 'delete' || key === 'backspace') {
      e.preventDefault();
      // симулюємо клік на кнопку delete (щоб не дублювати логіку)
      const delBtn = q('[data-act="delete"]');
      if (delBtn) delBtn.click();
      return;
    }

    // F2 — перейменувати (файл або папку)
    if (e.key === 'F2') {
      e.preventDefault();

      if (state.selectedItemIds && state.selectedItemIds.length) {
        const b = q('[data-act="renameFile"]');
        if (b) b.click();
        return;
      }

      // якщо файлів нема — перейменовуємо папку (якщо не root)
      const fid = state.selectedFolderId || state.folderId;
      if (!fid || String(fid).startsWith('root_')) return;

      const b = q('[data-act="renameFolder"]');
      if (b) b.click();
      return;
    }
  });
}






function doInsert_() {
  if (!state.pickerMode) return;

  const ids = Array.isArray(state.selectedItemIds) ? state.selectedItemIds.map(String).filter(Boolean) : [];
  const first = ids[0] || null;
  if (!first) return alert('Вибери файл.');

  const makePayload = (id) => {
    const payload = { cat: state.cat, folderId: state.folderId, itemId: id };
    try {
      const it = (state.itemsCache || []).find(x => String(x.id) === String(id));
      const realFolderId = String(it?.folderId || state.folderId || '');
      const folder = (state.foldersCache || []).find(x => String(x.id || '') === realFolderId) || null;
      payload.folderId = realFolderId || state.folderId;
      payload.folderName = folder?.name || '';
      payload.parentFolderId = folder?.parentId || '';
      payload.isPhotoGalleryCategory = String(folder?.parentId || '') === 'sys_photo_gallery';
      if (it) {
        const fallbackUrl = (it && String(it.mime || '').startsWith('image/')) ? (galMakeObjectUrl(it) || '') : '';
        payload.url = it.url || fallbackUrl || '';
        payload.name = it.name || '';
        payload.mime = it.mime || '';
        payload._builtin = !!it._builtin;
      }
    } catch (e) {}
    if (state.cat === 'icons') {
      payload.iconTheme = state.iconTheme;
      payload.defaultColor = (state.iconTheme === 'light') ? '#000000' : '#ffffff';
    }
    return payload;
  };

  const items = ids.map(makePayload);
  const payload = Object.assign({}, items[0], { items, selectedItems: items });

  const cb = state.onPick;
  close();
  if (typeof cb === 'function') cb(payload);
}

export async function openGalleryModal(opts = {}) {
  mountOnce_();
  await galEnsureSeed();

  state.pickerMode = !!opts.pickerMode;
  state.onPick = typeof opts.onPick === 'function' ? opts.onPick : null;

  const pendingAiBrief = !state.pickerMode ? loadGalleryAiBridgeState_() : null;

  // open with desired cat
  const cat = opts.cat || 'images';
  setCat_(cat);
  if (opts.folderId) {
    state.folderId = String(opts.folderId);
    state.selectedFolderId = state.folderId;
  }

  // set default view
  setView_(opts.view || 'big');

  overlayEl.classList.add('is-open');
  modalEl.classList.add('is-open');
  state.isOpen = true;

  await refresh_();
  if (pendingAiBrief && !opts.folderId) await applyGalleryAiBrief_(pendingAiBrief, { ensureRefresh: true, autoBest: false });
}

export function close() {
  if (!modalEl) return;
  overlayEl.classList.remove('is-open');
  modalEl.classList.remove('is-open');
  state.isOpen = false;
  state.pickerMode = false;
  state.onPick = null;
}

function makeDraggable_(panel, handle) {
  if (!panel || !handle) return;
  let dragging = false;
  let sx=0, sy=0, px=0, py=0;

  handle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    handle.style.cursor = 'grabbing';
    sx = e.clientX; sy = e.clientY;

    const r = panel.getBoundingClientRect();
    px = r.left; py = r.top;

    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    panel.style.left = `${Math.max(10, px + dx)}px`;
    panel.style.top  = `${Math.max(10, py + dy)}px`;
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.style.cursor = 'grab';
  });
}

function makeResizable_(panel, handle) {
  if (!panel || !handle) return;
  let resizing = false;
  let sx=0, sy=0, w=0, h=0;

  handle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    resizing = true;
    sx = e.clientX; sy = e.clientY;
    const r = panel.getBoundingClientRect();
    w = r.width; h = r.height;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!resizing) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    panel.style.width  = `${Math.max(720, w + dx)}px`;
    panel.style.height = `${Math.max(420, h + dy)}px`;
  });

  window.addEventListener('mouseup', () => {
    resizing = false;
  });
}

function escapeHtml_(s) {
  return String(s||'')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}


// --- Design panel widget (accordion section) ---
// panel-design.js очікує named export initGalleryWidget(host)
// Вона додає секцію "Галерея" в панель Дизайн і відкриває нашу модалку openGalleryModal().
export function initGalleryWidget(host) {
  if (!host) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Галерея</span>
      </div>
      <span class="design-section__chevron">▶</span>
    </button>

    <div class="design-section__body">
      <div class="design-field">
        <div class="design-field__label">Категорії</div>

        <div class="design-field__row" style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="design-pill" type="button" data-gal-open="images">Картинки</button>
          <button class="design-pill" type="button" data-gal-open="images" data-gal-folder="sys_photo_gallery">📁 Фото-галерея</button>
          <button class="design-pill" type="button" data-gal-open="images" data-gal-folder="static_sys_images_school_01">🏫 Школа — 01</button>
          <button class="design-pill" type="button" data-gal-open="images" data-gal-folder="sys_backgrounds">⭐ Фони</button>
          <button class="design-pill" type="button" data-gal-open="logos" data-gal-folder="sys_logos">⭐ Лого</button>
          <button class="design-pill" type="button" data-gal-open="icons" data-gal-folder="sys_icons">⭐ Іконки</button>
          <button class="design-pill" type="button" data-gal-open="logos">Логотип</button>
          <button class="design-pill" type="button" data-gal-open="icons">Іконки</button>
        </div>

        <div style="margin-top:8px;color:rgba(148,163,184,0.9);font-size:12px;">
          Звичайні папки — для роботи сайту. Папки ⭐ — системна бібліотека: фони, картинки, лого й іконки для майбутніх AI-команд. Перетягни файл на ⭐ папку, потім натисни «Опис / AI».
        </div>
      </div>
    </div>
  `;

  host.appendChild(sectionEl);

  // акордеон
  const header = sectionEl.querySelector('.design-section__header');
  if (header) {
    header.addEventListener('click', () => {
      sectionEl.classList.toggle('is-open');
    });
  }

  // кнопки відкриття
  sectionEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-gal-open]');
    if (!btn) return;

    const cat = btn.dataset.galOpen || 'images';
    const folderId = btn.dataset.galFolder || null;
    openGalleryModal({ cat, folderId, pickerMode: false, view: 'big' });
  });
}
