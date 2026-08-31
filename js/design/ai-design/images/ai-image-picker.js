// js/design/ai-design/images/ai-image-picker.js
// [AI-SITE-GENERATOR-2026][Етап 2.1]
// Локальний AI Image Picker: підбір існуючих системних зображень без зовнішнього AI API.

const MANIFEST_URL = 'assets/system/manifest.json';
const ASSET_LIBRARY_MANIFEST_URL = 'assets/library/manifest.json';

const BUILTIN_AI_IMAGES = [

  {
    id: 'ai-education-hero-learning-hub',
    type: 'image',
    path: 'assets/system/generated/education-professional/education-hero-learning-hub.svg',
    title: 'Освіта — сучасний навчальний простір',
    description: 'Професійний hero-візуал для освітнього сайту: навчання, програми, запис, довіра.',
    primaryTheme: 'education',
    themes: ['education', 'school', 'university', 'courses', 'business'],
    tags: ['освіта', 'навчання', 'школа', 'курси', 'студенти', 'клас', 'аудиторія', 'запис', 'admissions', 'programs', 'hero'],
    styleScores: { premium: 9, modern: 9, warm: 8, clean: 9, professional: 9 },
    moodScores: { inspiring: 9, trustworthy: 9, friendly: 8, professional: 9 },
    usageScores: { hero: 10, 'content-image': 9, 'section-background': 8, gallery: 7 },
    textReadability: { lightText: 5, darkText: 9, needsOverlay: true, bestTextZone: 'left' },
    priority: 20
  },
  {
    id: 'ai-education-program-cards',
    type: 'image',
    path: 'assets/system/generated/education-professional/education-program-cards.svg',
    title: 'Освіта — програми і напрями навчання',
    description: 'Візуал для секції освітніх програм, курсів, напрямів і карток навчання.',
    primaryTheme: 'education',
    themes: ['education', 'school', 'courses', 'programs', 'business'],
    tags: ['освіта', 'програми', 'курси', 'напрями', 'навчання', 'programs', 'services', 'cards'],
    styleScores: { premium: 8, modern: 9, warm: 9, clean: 9, professional: 8 },
    moodScores: { friendly: 9, clear: 9, inspiring: 8, trustworthy: 8 },
    usageScores: { 'content-image': 10, gallery: 8, hero: 7, 'card-background': 9 },
    textReadability: { lightText: 5, darkText: 9, needsOverlay: false, bestTextZone: 'center' },
    priority: 19
  },
  {
    id: 'ai-education-teachers-mentors',
    type: 'image',
    path: 'assets/system/generated/education-professional/education-teachers-mentors.svg',
    title: 'Освіта — викладачі та ментори',
    description: 'Візуал для секції команди, викладачів, кураторів і менторської підтримки.',
    primaryTheme: 'education',
    themes: ['education', 'school', 'university', 'team', 'business'],
    tags: ['освіта', 'викладачі', 'ментори', 'команда', 'teacher', 'mentor', 'faculty', 'team'],
    styleScores: { premium: 8, modern: 9, warm: 9, clean: 8, professional: 9 },
    moodScores: { trustworthy: 10, friendly: 8, human: 9, professional: 9 },
    usageScores: { 'content-image': 10, gallery: 8, hero: 7, 'card-background': 8 },
    textReadability: { lightText: 5, darkText: 9, needsOverlay: false, bestTextZone: 'center' },
    priority: 18
  },
  {
    id: 'ai-education-campus-gallery',
    type: 'image',
    path: 'assets/system/generated/education-professional/education-campus-gallery.svg',
    title: 'Освіта — галерея навчального життя',
    description: 'Візуал для галереї: кампус, класи, події, активності, студентське життя.',
    primaryTheme: 'education',
    themes: ['education', 'school', 'campus', 'events', 'community'],
    tags: ['освіта', 'кампус', 'галерея', 'події', 'студенти', 'життя школи', 'gallery', 'campus', 'events'],
    styleScores: { premium: 8, modern: 9, warm: 9, clean: 8, professional: 8 },
    moodScores: { inspiring: 9, friendly: 9, community: 10, lively: 8 },
    usageScores: { gallery: 10, 'content-image': 10, 'section-background': 8, hero: 7 },
    textReadability: { lightText: 6, darkText: 8, needsOverlay: true, bestTextZone: 'center' },
    priority: 18
  },
  {
    id: 'ai-education-admissions-desk',
    type: 'image',
    path: 'assets/system/generated/education-professional/education-admissions-desk.svg',
    title: 'Освіта — запис і консультація',
    description: 'Візуал для вступу, заявки, консультації, контактної форми й admissions-блока.',
    primaryTheme: 'education',
    themes: ['education', 'school', 'admissions', 'consultation', 'business'],
    tags: ['освіта', 'вступ', 'запис', 'консультація', 'форма', 'admissions', 'contact', 'cta'],
    styleScores: { premium: 8, modern: 9, warm: 9, clean: 9, professional: 9 },
    moodScores: { trustworthy: 9, friendly: 9, clear: 9, professional: 9 },
    usageScores: { 'content-image': 10, 'section-background': 8, contacts: 9, hero: 7 },
    textReadability: { lightText: 5, darkText: 9, needsOverlay: false, bestTextZone: 'left' },
    priority: 18
  },
  {
    id: 'ai-generated-landscape-hero-terrace-sunset',
    type: 'image',
    path: 'assets/system/generated/landscape-design-v2/hero-terrace-sunset.png',
    title: 'Ландшафтний дизайн — тераса на заході сонця',
    description: 'Сучасна тераса, сад, тепле вечірнє світло, premium natural hero image.',
    primaryTheme: 'nature',
    themes: ['nature', 'landscape', 'architecture', 'garden', 'business', 'construction'],
    tags: ['ландшафт', 'ландшафтний дизайн', 'сад', 'тераса', 'газон', 'озеленення', 'вечір', 'преміум', 'hero', 'природа', 'архітектура'],
    styleScores: { premium: 9, modern: 8, elegant: 8, luxury: 7, warm: 8, natural: 10 },
    moodScores: { warm: 9, premium: 8, calm: 8, inspiring: 8, professional: 7 },
    usageScores: { hero: 10, 'section-background': 9, 'content-image': 9, banner: 8 },
    textReadability: { lightText: 8, darkText: 4, needsOverlay: true, bestTextZone: 'left' },
    priority: 10
  },
  {
    id: 'ai-generated-landscape-garden-path-lighting',
    type: 'image',
    path: 'assets/system/generated/landscape-design-v2/garden-path-lighting.png',
    title: 'Садова доріжка з підсвіткою',
    description: 'Доріжка в саду, архітектурне світло, преміальна зелень, вечірня атмосфера.',
    primaryTheme: 'nature',
    themes: ['nature', 'landscape', 'garden', 'architecture', 'travel'],
    tags: ['сад', 'доріжка', 'підсвітка', 'ландшафт', 'озеленення', 'преміум', 'вечір', 'галерея', 'послуги'],
    styleScores: { premium: 8, modern: 7, elegant: 8, warm: 8, natural: 10 },
    moodScores: { calm: 9, warm: 8, premium: 8, inspiring: 7 },
    usageScores: { hero: 8, 'section-background': 9, 'content-image': 10, gallery: 10, 'card-background': 8 },
    textReadability: { lightText: 7, darkText: 4, needsOverlay: true, bestTextZone: 'center-left' },
    priority: 9
  },
  {
    id: 'ai-generated-landscape-patio-lounge-evening',
    type: 'image',
    path: 'assets/system/generated/landscape-design-v2/patio-lounge-evening.png',
    title: 'Patio lounge — вечірній сад',
    description: 'Зона відпочинку на терасі, дизайнерські меблі, сад, тепле освітлення.',
    primaryTheme: 'nature',
    themes: ['nature', 'landscape', 'garden', 'interior', 'architecture', 'business'],
    tags: ['тераса', 'patio', 'відпочинок', 'сад', 'ландшафт', 'дизайн', 'преміум', 'вечір', 'меблі'],
    styleScores: { premium: 9, modern: 8, elegant: 8, luxury: 8, warm: 8 },
    moodScores: { warm: 9, premium: 8, calm: 8, emotional: 7 },
    usageScores: { hero: 9, 'section-background': 8, 'content-image': 10, gallery: 9 },
    textReadability: { lightText: 8, darkText: 4, needsOverlay: true, bestTextZone: 'left' },
    priority: 9
  },
  {
    id: 'ai-generated-landscape-courtyard-pool-evening',
    type: 'image',
    path: 'assets/system/generated/landscape-design-v2/courtyard-pool-evening.png',
    title: 'Двір із басейном і садом увечері',
    description: 'Сучасний двір, басейн, архітектурний сад, преміальний landscape design.',
    primaryTheme: 'nature',
    themes: ['nature', 'landscape', 'architecture', 'garden', 'travel', 'luxury'],
    tags: ['басейн', 'двір', 'сад', 'ландшафт', 'архітектура', 'преміум', 'вілла', 'галерея'],
    styleScores: { premium: 10, luxury: 9, modern: 8, elegant: 8 },
    moodScores: { premium: 10, inspiring: 8, calm: 7, professional: 7 },
    usageScores: { hero: 9, 'section-background': 8, 'content-image': 10, gallery: 10 },
    textReadability: { lightText: 8, darkText: 3, needsOverlay: true, bestTextZone: 'left' },
    priority: 9
  },
  {
    id: 'ai-generated-landscape-lush-garden-daylight',
    type: 'image',
    path: 'assets/system/generated/landscape-design-v2/lush-garden-daylight.png',
    title: 'Світлий зелений сад удень',
    description: 'Свіжий сад, зелень, денне світло, природний фон для екологічних і garden-сайтів.',
    primaryTheme: 'nature',
    themes: ['nature', 'landscape', 'garden', 'agriculture', 'beauty'],
    tags: ['сад', 'зелень', 'газон', 'ландшафт', 'день', 'природа', 'озеленення', 'світлий'],
    styleScores: { clean: 8, modern: 7, soft: 9, warm: 6, natural: 10 },
    moodScores: { calm: 9, friendly: 8, optimistic: 8, safe: 8 },
    usageScores: { hero: 8, 'section-background': 9, 'content-image': 9, gallery: 9 },
    textReadability: { lightText: 5, darkText: 8, needsOverlay: true, bestTextZone: 'center' },
    priority: 8
  },
  {
    id: 'ai-generated-landscape-design-workspace-plan',
    type: 'image',
    path: 'assets/system/generated/landscape-design-v2/design-workspace-plan.png',
    title: 'Робочий стіл дизайнера з планом саду',
    description: 'Планування ландшафтного дизайну, креслення, робочий процес, архітектурний план.',
    primaryTheme: 'business',
    themes: ['business', 'landscape', 'architecture', 'education', 'construction'],
    tags: ['план', 'креслення', 'дизайн', 'ландшафт', 'проєкт', 'консультація', 'робочий процес'],
    styleScores: { modern: 8, clean: 8, professional: 9, premium: 7 },
    moodScores: { smart: 8, professional: 9, trustworthy: 8, calm: 7 },
    usageScores: { 'content-image': 10, gallery: 8, hero: 7, 'section-background': 6 },
    textReadability: { lightText: 5, darkText: 8, needsOverlay: true, bestTextZone: 'center' },
    priority: 8
  }
];

let manifestAssets_ = null;
let loadingPromise_ = null;

function normalizeText_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[ʼ’`]/g, '')
    .replace(/[^a-zа-яіїєґ0-9\s\-_/]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniq_(arr) {
  return Array.from(new Set((arr || []).map((x) => String(x || '').trim()).filter(Boolean)));
}

function expandQuery_(query) {
  const raw = normalizeText_(query);
  const tokens = raw.split(/\s+/).filter(Boolean);
  const extra = [];
  const synonymGroups = [
    ['ландшафт', 'ландшафтний', 'сад', 'садовий', 'газон', 'озеленення', 'тераса', 'patio', 'garden', 'landscape'],
    ['архітектура', 'будинок', 'двір', 'фасад', 'інтерєр', 'architecture', 'construction'],
    ['технології', 'технологічний', 'айті', 'it', 'компютер', 'ai', 'штучний', 'інтелект', 'startup', 'saas', 'technology'],
    ['наука', 'освіта', 'лабораторія', 'science', 'education', 'school'],
    ['бізнес', 'послуги', 'компанія', 'офіс', 'business', 'corporate'],
    ['самоврядування', 'громада', 'громади', 'міська', 'міський', 'рада', 'державні', 'держпослуги', 'муніципальний', 'адміністративні', 'public', 'government', 'municipal', 'city', 'community'],
    ['культура', 'театр', 'музей', 'бібліотека', 'події', 'афіша', 'culture', 'museum', 'theater'],
    ['медицина', 'клініка', 'лікар', 'лікарня', 'стоматологія', 'health', 'medical', 'clinic'],
    ['ресторан', 'кафе', 'їжа', 'кухня', 'гостинність', 'restaurant', 'food', 'cafe'],
    ['магазин', 'маркетплейс', 'товари', 'каталог', 'продаж', 'знижки', 'marketplace', 'shop', 'store', 'products'],
    ['природа', 'еко', 'зелений', 'агро', 'nature', 'agriculture'],
    ['спорт', 'football', 'футбол', 'спортзал', 'sport'],
    ['фінанси', 'банк', 'гроші', 'finance'],
    ['преміум', 'дорогий', 'люкс', 'елітний', 'premium', 'luxury', 'elegant'],
    ['теплий', 'природний', 'сонячний', 'warm', 'natural'],
    ['темний', 'чорний', 'контрастний', 'dark', 'black'],
    ['сучасний', 'modern', 'clean', 'minimal']
  ];
  for (const group of synonymGroups) {
    if (group.some((word) => raw.includes(word))) extra.push(...group);
  }
  return uniq_([...tokens, ...extra, raw]);
}

function numberScore_(obj, key) {
  if (!obj || typeof obj !== 'object') return 0;
  const direct = Number(obj[key] || 0);
  if (Number.isFinite(direct)) return direct;
  return 0;
}

const TOPIC_GROUPS = Object.freeze({
  landscape: ['ландшафт','ландшафтний','сад','садовий','газон','озеленення','тераса','patio','garden','landscape','двір','басейн'],
  architecture: ['архітектура','будинок','двір','фасад','інтерєр','construction','architecture','real estate'],
  public: ['самоврядування','громада','громади','рада','міська','міський','державні','держпослуги','муніципальний','адміністративні','public','government','municipal','city','community'],
  medical: ['медицина','клініка','лікар','лікарня','стоматологія','health','medical','clinic'],
  education: ['школа','освіта','університет','наука','курси','ліцей','гімназія','садок','вступ','викладач','студент','учень','програми','education','school','science','university','courses','admissions','faculty','student'],
  food: ['ресторан','кафе','їжа','кухня','кава','food','restaurant','cafe'],
  commerce: ['магазин','маркетплейс','товари','каталог','продаж','знижки','marketplace','shop','store','products'],
  tech: ['технології','айті','it','компютер','ai','штучний','інтелект','startup','saas','technology'],
  culture: ['культура','театр','музей','бібліотека','події','афіша','culture','museum','theater'],
  sport: ['спорт','football','футбол','спортзал','sport'],
  finance: ['фінанси','банк','інвестиції','finance','bank'],
  business: ['бізнес','офіс','офісний','компанія','карта','аналітика','business','corporate','office','company'],
  legal: ['право','юридичний','юридичні','закон','legal','law'],
  city: ['місто','міський','будівля','адміністрація','урбан','city','building','urban'],
  nature: ['природа','еко','листя','гори','ліс','сад','трава','nature','eco','forest','mountain','garden'],
  future: ['майбутнє','футуристичний','future','futuristic']
});

const STYLE_ONLY_GROUPS = new Set(['premium','warm','dark','modern']);

// [00429][AI TOPIC IMAGE FALLBACK]
// У системній бібліотеці поки немає окремих фото для кожної теми
// (наприклад самоврядування/держпослуги). Раніше strict compatibility
// просто повертала 0 фото, тому на canvas AI Content був без зображень,
// а preview міг виглядати інакше через fallback-градієнти.
// Дозволяємо контрольований тематичний fallback: public -> business/legal/city,
// education -> science/technology/nature, але не підставляємо landscape/garden
// у публічні/державні теми як “випадковий сад”.
const TOPIC_FALLBACK_GROUPS = Object.freeze({
  public: ['business', 'legal', 'city', 'finance', 'education', 'tech'],
  education: ['education', 'science', 'technology'],
  tech: ['technology', 'ai', 'business', 'future'],
  finance: ['business', 'technology'],
  commerce: ['business', 'technology', 'fashion_beauty'],
  culture: ['city', 'business', 'education']
});

const TOPIC_BLOCKED_FALLBACK_GROUPS = Object.freeze({
  public: ['landscape', 'garden', 'nature', 'food', 'sport', 'medical'],
  // [00435] Освітні сторінки більше не мають брати landscape/garden/nature
  // картинки лише тому, що старі asset-и містили загальний тег business/education.
  education: ['landscape', 'garden', 'nature', 'luxury', 'travel', 'restaurant', 'food', 'sport', 'medical']
});

function inferTopicGroupsFromText_(value) {
  const hay = normalizeText_(Array.isArray(value) ? value.join(' ') : value);
  const out = new Set();
  Object.entries(TOPIC_GROUPS).forEach(([group, words]) => {
    if ((words || []).some((word) => hay.includes(normalizeText_(word)))) out.add(group);
  });
  return out;
}

function inferAssetTopicGroups_(asset) {
  return inferTopicGroupsFromText_([
    asset.id,
    asset.path,
    asset.title,
    asset.description,
    asset.topic,
    asset.topic,
    asset.primaryTheme,
    ...(asset.themes || []),
    ...(asset.tags || []),
    ...(asset.roles || []),
    ...(asset.reusableTopics || [])
  ].join(' '));
}

function topicCompatibility_(asset, queryText) {
  const queryGroups = inferTopicGroupsFromText_(queryText);
  const assetGroups = inferAssetTopicGroups_(asset);
  if (!queryGroups.size || !assetGroups.size) return { compatible: true, queryGroups: [...queryGroups], assetGroups: [...assetGroups], penalty: 0 };

  // [00430] Hard thematic safety: public/government pages must not inherit
  // random garden/landscape/nature visuals only because an asset also has
  // a generic business/architecture tag.  This is what made previews look
  // unrelated to the generated page.
  for (const group of queryGroups) {
    const blocked = TOPIC_BLOCKED_FALLBACK_GROUPS[group] || [];
    if (blocked.some((blockedGroup) => assetGroups.has(blockedGroup))) {
      return { compatible: false, hardBlocked: true, queryGroups: [...queryGroups], assetGroups: [...assetGroups], overlap: [], penalty: 180 };
    }
  }

  const overlap = [...queryGroups].filter((group) => assetGroups.has(group));
  if (overlap.length) return { compatible: true, queryGroups: [...queryGroups], assetGroups: [...assetGroups], overlap, penalty: 0 };

  for (const group of queryGroups) {
    const allowed = TOPIC_FALLBACK_GROUPS[group] || [];
    const blocked = TOPIC_BLOCKED_FALLBACK_GROUPS[group] || [];
    const hasAllowed = allowed.some((fallbackGroup) => assetGroups.has(fallbackGroup));
    const hasBlocked = blocked.some((blockedGroup) => assetGroups.has(blockedGroup));
    if (hasAllowed && !hasBlocked) {
      return {
        compatible: true,
        fallback: true,
        queryGroups: [...queryGroups],
        assetGroups: [...assetGroups],
        overlap: [],
        fallbackOverlap: allowed.filter((fallbackGroup) => assetGroups.has(fallbackGroup)),
        penalty: 18
      };
    }
  }

  // ВАЖЛИВО: не дозволяємо landscape fallback для тем типу Самоврядування / медицина / маркетплейс.
  return { compatible: false, queryGroups: [...queryGroups], assetGroups: [...assetGroups], overlap: [], penalty: 140 };
}
function normalizeAsset_(asset) {
  if (!asset || typeof asset !== 'object' || !asset.path) return null;
  return {
    id: asset.id || asset.path,
    type: asset.type || 'image',
    path: asset.path,
    title: asset.title || asset.fileName || asset.id || asset.path,
    description: asset.description || '',
    topic: asset.topic || '',
    primaryTheme: asset.primaryTheme || asset.topic || '',
    themes: Array.isArray(asset.themes) ? asset.themes : [],
    tags: Array.isArray(asset.tags) ? asset.tags : [],
    styleScores: asset.styleScores || {},
    moodScores: asset.moodScores || {},
    usageScores: asset.usageScores || {},
    colorScores: asset.colorScores || {},
    textReadability: asset.textReadability || {},
    aiUsageHints: asset.aiUsageHints || {},
    roles: Array.isArray(asset.roles) ? asset.roles : [],
    reusableTopics: Array.isArray(asset.reusableTopics) ? asset.reusableTopics : [],
    priority: Number(asset.priority || 0),
    source: asset.source || 'system-manifest'
  };
}

async function fetchManifestList_(url) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res || !res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.assets) ? json.assets : [];
  } catch (_) {
    return [];
  }
}

async function loadManifestAssets_() {
  if (manifestAssets_) return manifestAssets_;
  if (loadingPromise_) return loadingPromise_;
  loadingPromise_ = Promise.all([
    fetchManifestList_(MANIFEST_URL),
    fetchManifestList_(ASSET_LIBRARY_MANIFEST_URL)
  ])
    .then(([systemList, libraryList]) => {
      const systemAssets = (systemList || []).map((asset) => ({ ...asset, source: asset?.source || 'system-manifest' }));
      const libraryAssets = (libraryList || []).map((asset) => ({ ...asset, source: asset?.source || 'asset-library' }));
      manifestAssets_ = [...systemAssets, ...libraryAssets].map(normalizeAsset_).filter(Boolean);
      return manifestAssets_;
    })
    .catch(() => {
      manifestAssets_ = [];
      return manifestAssets_;
    });
  return loadingPromise_;
}

export function warmAiImageCatalog() {
  try { return loadManifestAssets_(); } catch (_) { return Promise.resolve([]); }
}

export function getAiImageCatalogSync() {
  const normalizedBuiltins = BUILTIN_AI_IMAGES.map((asset) => normalizeAsset_({ ...asset, source: 'ai-generated' })).filter(Boolean);
  const loaded = Array.isArray(manifestAssets_) ? manifestAssets_ : [];
  const map = new Map();
  [...normalizedBuiltins, ...loaded].forEach((asset) => {
    if (!asset?.path) return;
    const prev = map.get(asset.path);
    if (!prev || Number(asset.priority || 0) >= Number(prev.priority || 0)) map.set(asset.path, asset);
  });
  return Array.from(map.values());
}

function scoreAsset_(asset, queryTokens, options = {}) {
  const usage = options.usage || 'section-background';
  const style = options.style || 'modern';
  const wantedType = options.type || '';
  const queryText = options.queryText || (queryTokens || []).join(' ');
  const hay = normalizeText_([
    asset.id,
    asset.path,
    asset.title,
    asset.description,
    asset.topic,
    asset.primaryTheme,
    ...(asset.themes || []),
    ...(asset.tags || []),
    ...(asset.roles || []),
    ...(asset.reusableTopics || []),
    ...(asset.aiUsageHints?.bestFor || [])
  ].join(' '));

  let score = Number(asset.priority || 0);
  score += numberScore_(asset.usageScores, usage) * 2.2;
  if (usage === 'hero') score += numberScore_(asset.usageScores, 'section-background') * 0.75;
  if (usage === 'content-image') score += numberScore_(asset.usageScores, 'hero') * 0.35;
  const styleAliases = {
    tech: ['modern', 'dark', 'clean', 'professional'],
    editorial: ['premium', 'elegant', 'luxury'],
    premium: ['premium', 'elegant', 'luxury'],
    warm: ['warm', 'natural'],
    dark: ['dark', 'modern']
  };
  score += numberScore_(asset.styleScores, style) * 1.2;
  (styleAliases[style] || []).forEach((alias, index) => {
    score += numberScore_(asset.styleScores, alias) * (index === 0 ? 0.75 : 0.42);
    score += numberScore_(asset.moodScores, alias) * (index === 0 ? 0.45 : 0.25);
  });
  score += numberScore_(asset.styleScores, 'modern') * 0.25;
  score += numberScore_(asset.moodScores, style) * 0.6;
  score += numberScore_(asset.moodScores, 'premium') * (style === 'premium' || style === 'editorial' ? 1.4 : 0.3);
  score += numberScore_(asset.moodScores, 'warm') * (style === 'warm' ? 1.3 : 0.2);

  queryTokens.forEach((token) => {
    if (!token || token.length < 2) return;
    if (hay.includes(token)) score += token.length > 5 ? 5 : 3;
  });

  if (wantedType && hay.includes(normalizeText_(wantedType))) score += 8;
  if (String(asset.type || '').includes('background') && usage.includes('background')) score += 6;
  if (String(asset.type || '').includes('image') && usage === 'content-image') score += 4;

  const readability = asset.textReadability || {};
  if (usage === 'hero' || usage === 'section-background') {
    if (readability.needsOverlay) score += 1;
    if (style === 'dark') score += Number(readability.lightText || 0) * 0.55;
    else score += Math.max(Number(readability.darkText || 0), Number(readability.lightText || 0)) * 0.25;
  }

  const queryGroups = inferTopicGroupsFromText_(queryText);
  if (queryGroups.has('education')) {
    const isEducationAsset = inferAssetTopicGroups_(asset).has('education');
    if (isEducationAsset) score += 55;
    if (String(asset.source || '') === 'asset-library') score += 22;
    if (String(asset.path || '').includes('/topics/education/')) score += 35;
  }

  const compatibility = topicCompatibility_(asset, queryText);
  if (!compatibility.compatible) score -= compatibility.penalty;
  else if (compatibility.fallback) score -= Number(compatibility.penalty || 0);
  return score;
}

export function findBestAiImages({ query = '', usage = 'section-background', style = 'modern', type = '', limit = 6, excludePaths = [] } = {}) {
  const rawQuery = query || `${type} ${style} ${usage}`;
  const tokens = expandQuery_(rawQuery);
  const excluded = new Set((excludePaths || []).map(String));
  const catalog = getAiImageCatalogSync();
  const scored = catalog
    .filter((asset) => asset?.path && !excluded.has(asset.path))
    .map((asset) => {
      const score = scoreAsset_(asset, tokens, { usage, style, type, queryText: rawQuery });
      const compatibility = topicCompatibility_(asset, rawQuery);
      return { ...asset, score, topicCompatible: compatibility.compatible, topicGroups: compatibility.queryGroups, assetTopicGroups: compatibility.assetGroups };
    })
    .sort((a, b) => b.score - a.score || Number(b.priority || 0) - Number(a.priority || 0));

  const queryGroups = inferTopicGroupsFromText_(rawQuery);
  const minScore = queryGroups.size ? 12 : -9999;
  const results = scored.filter((asset) => asset.topicCompatible !== false && Number(asset.score || 0) >= minScore);
  return results.slice(0, Math.max(1, Number(limit) || 6));
}

export function getBestAiImage(options = {}) {
  return findBestAiImages({ ...options, limit: 1 })[0] || null;
}

export function imageCssUrl(path) {
  return `url("${String(path || '').replace(/"/g, '%22')}")`;
}
