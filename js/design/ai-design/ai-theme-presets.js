// js/design/ai-design/ai-theme-presets.js
// [AI-SITE-GENERATOR-2026][Етап 3.7]
// Бібліотека професійних AI Theme Presets.
// Пресети не замінюють ручний віджет “Дизайн”: вони дають AI-генератору готові theme tokens
// для автономного створення сайтів/сторінок/секцій з можливістю майбутнього глобального перемикання теми.

const TYPOGRAPHY = Object.freeze({
  clean: Object.freeze({
    h1: 'clamp(42px,5.2vw,72px)',
    h2: 'clamp(34px,3.7vw,54px)',
    h3: '24px',
    body: '17px',
    small: '12px',
    letterSpacing: '-.045em',
    lineHeightTight: '1.02',
    lineHeightBody: '1.75',
    weightStrong: '950'
  }),
  premium: Object.freeze({
    h1: 'clamp(46px,5.8vw,78px)',
    h2: 'clamp(36px,4vw,58px)',
    h3: '25px',
    body: '17px',
    small: '12px',
    letterSpacing: '-.055em',
    lineHeightTight: '1.01',
    lineHeightBody: '1.78',
    weightStrong: '950'
  }),
  editorial: Object.freeze({
    h1: 'clamp(52px,7vw,92px)',
    h2: 'clamp(40px,5vw,68px)',
    h3: '25px',
    body: '17px',
    small: '12px',
    letterSpacing: '-.07em',
    lineHeightTight: '.98',
    lineHeightBody: '1.78',
    weightStrong: '950'
  }),
  compact: Object.freeze({
    h1: 'clamp(36px,4.4vw,62px)',
    h2: 'clamp(30px,3.2vw,46px)',
    h3: '22px',
    body: '16px',
    small: '12px',
    letterSpacing: '-.035em',
    lineHeightTight: '1.06',
    lineHeightBody: '1.68',
    weightStrong: '900'
  })
});

const SPACING = Object.freeze({
  compact: Object.freeze({ sectionY: '58px', sectionX: '30px', rowGap: '18px', blockPad: '22px', maxWidth: '1180px' }),
  balanced: Object.freeze({ sectionY: '68px', sectionX: '38px', rowGap: '22px', blockPad: '26px', maxWidth: '1240px' }),
  premium: Object.freeze({ sectionY: '82px', sectionX: '44px', rowGap: '26px', blockPad: '30px', maxWidth: '1280px' }),
  editorial: Object.freeze({ sectionY: '90px', sectionX: '48px', rowGap: '28px', blockPad: '32px', maxWidth: '1320px' })
});

const SURFACES = Object.freeze({
  sharp: Object.freeze({ radius: '10px', radiusLarge: '18px', buttonRadius: '8px', shadow: '0 20px 58px rgba(15,23,42,.10)', softShadow: '0 10px 30px rgba(15,23,42,.08)' }),
  soft: Object.freeze({ radius: '24px', radiusLarge: '34px', buttonRadius: '999px', shadow: '0 24px 76px rgba(15,23,42,.12)', softShadow: '0 14px 38px rgba(15,23,42,.10)' }),
  premium: Object.freeze({ radius: '30px', radiusLarge: '42px', buttonRadius: '999px', shadow: '0 32px 96px rgba(15,23,42,.16)', softShadow: '0 18px 48px rgba(15,23,42,.11)' }),
  darkGlow: Object.freeze({ radius: '28px', radiusLarge: '40px', buttonRadius: '999px', shadow: '0 30px 96px rgba(37,99,235,.22)', softShadow: '0 16px 44px rgba(34,211,238,.12)' })
});

export const AI_THEME_PRESET_GROUPS = Object.freeze([
  Object.freeze({ id: 'foundation', label: 'Базові універсальні теми' }),
  Object.freeze({ id: 'business', label: 'Бізнес / послуги' }),
  Object.freeze({ id: 'industry', label: 'Галузеві сайти' }),
  Object.freeze({ id: 'marketplace', label: 'Маркетплейс / продажі' }),
  Object.freeze({ id: 'creative', label: 'Креатив / медіа' })
]);

export const AI_THEME_PRESETS = Object.freeze({
  'theme-modern-clean': Object.freeze({
    id: 'theme-modern-clean', group: 'foundation', label: 'Modern Clean',
    description: 'Універсальна світла тема для бізнесу, послуг, SaaS і лендінгів.',
    typography: 'clean', spacing: 'balanced', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#f8fafc,#eef2ff)', sectionBg: 'linear-gradient(180deg,#f8fafc,#eef2ff)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.84)', soft: '#e0f2fe', accent: '#2563eb', accent2: '#7c3aed', heading: '#0f172a', text: '#475569', muted: '#64748b', border: 'rgba(15,23,42,.10)', overlay: 'linear-gradient(180deg,rgba(15,23,42,.18),rgba(15,23,42,.32))'
    })
  }),
  'theme-premium-natural': Object.freeze({
    id: 'theme-premium-natural', group: 'foundation', label: 'Premium Natural',
    description: 'Тепла premium-естетика для природних, сервісних і локальних брендів.',
    typography: 'premium', spacing: 'premium', surfaces: 'premium',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fffaf2,#f4efe5)', sectionBg: 'linear-gradient(180deg,#fffaf2,#f4efe5)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.84)', soft: '#eef5e8', accent: '#24451f', accent2: '#b7791f', heading: '#1f3524', text: '#5f6f5f', muted: '#6b7a6a', border: 'rgba(36,69,31,.13)', overlay: 'linear-gradient(180deg,rgba(16,34,19,.30),rgba(16,34,19,.46))'
    })
  }),
  'theme-dark-tech': Object.freeze({
    id: 'theme-dark-tech', group: 'foundation', label: 'Dark Tech / AI',
    description: 'Темна технологічна тема з glow-акцентами для AI, SaaS, кібербезпеки.',
    typography: 'premium', spacing: 'premium', surfaces: 'darkGlow',
    palette: Object.freeze({
      bg: 'radial-gradient(circle at 18% 12%,rgba(79,140,255,.22),transparent 32%),linear-gradient(135deg,#070b18,#111827)', sectionBg: 'radial-gradient(circle at 18% 12%,rgba(79,140,255,.22),transparent 32%),linear-gradient(135deg,#070b18,#111827)', panel: 'rgba(10,18,35,.84)', panelSoft: 'rgba(10,18,35,.70)', soft: 'rgba(79,140,255,.16)', accent: '#4f8cff', accent2: '#22d3ee', heading: '#f8fbff', text: '#cbd5e1', muted: '#94a3b8', border: 'rgba(125,211,252,.18)', overlay: 'linear-gradient(180deg,rgba(3,7,18,.58),rgba(3,7,18,.76))'
    })
  }),
  'theme-editorial-luxury': Object.freeze({
    id: 'theme-editorial-luxury', group: 'foundation', label: 'Editorial Luxury',
    description: 'Журнальна premium-тема з великими заголовками, спокійним фоном і дорогим акцентом.',
    typography: 'editorial', spacing: 'editorial', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fbfaf7,#ece8df)', sectionBg: 'linear-gradient(180deg,#fbfaf7,#ece8df)', panel: '#fffdf8', panelSoft: 'rgba(255,253,248,.86)', soft: '#eee7d8', accent: '#1f2933', accent2: '#a16207', heading: '#141414', text: '#4b5563', muted: '#6b7280', border: 'rgba(20,20,20,.12)', overlay: 'linear-gradient(180deg,rgba(20,20,20,.24),rgba(20,20,20,.44))'
    })
  }),

  'business-consulting-blue': Object.freeze({
    id: 'business-consulting-blue', group: 'business', label: 'Consulting Trust Blue',
    description: 'Довіра, B2B, консалтинг, фінансові та юридичні послуги.',
    typography: 'clean', spacing: 'balanced', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#f8fbff,#eef5ff)', sectionBg: 'linear-gradient(180deg,#f8fbff,#eef5ff)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.88)', soft: '#dbeafe', accent: '#1d4ed8', accent2: '#0f766e', heading: '#0f1f3d', text: '#334155', muted: '#64748b', border: 'rgba(29,78,216,.13)', overlay: 'linear-gradient(180deg,rgba(15,31,61,.28),rgba(15,31,61,.48))'
    })
  }),
  'law-premium-navy-gold': Object.freeze({
    id: 'law-premium-navy-gold', group: 'business', label: 'Law Navy Gold',
    description: 'Преміальний стиль для адвокатів, нотаріусів, юридичних і держпослуг.',
    typography: 'premium', spacing: 'premium', surfaces: 'premium',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#f8f6f0,#ece7dc)', sectionBg: 'linear-gradient(180deg,#f8f6f0,#ece7dc)', panel: '#fffdf7', panelSoft: 'rgba(255,253,247,.86)', soft: '#e8ddc8', accent: '#0f2942', accent2: '#b08d45', heading: '#0b1726', text: '#475569', muted: '#64748b', border: 'rgba(15,41,66,.14)', overlay: 'linear-gradient(180deg,rgba(11,23,38,.42),rgba(11,23,38,.62))'
    })
  }),
  'finance-emerald-premium': Object.freeze({
    id: 'finance-emerald-premium', group: 'business', label: 'Finance Emerald Premium',
    description: 'Фінанси, страхування, інвестиції, бухгалтерія, банки.',
    typography: 'clean', spacing: 'balanced', surfaces: 'premium',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#f7fdf9,#ecfdf5)', sectionBg: 'linear-gradient(180deg,#f7fdf9,#ecfdf5)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.88)', soft: '#d1fae5', accent: '#047857', accent2: '#0f766e', heading: '#082f2a', text: '#475569', muted: '#64748b', border: 'rgba(4,120,87,.14)', overlay: 'linear-gradient(180deg,rgba(6,78,59,.32),rgba(6,78,59,.52))'
    })
  }),
  'agency-electric-purple': Object.freeze({
    id: 'agency-electric-purple', group: 'business', label: 'Agency Electric Purple',
    description: 'Маркетинг, SMM, дизайн-студія, веб-студія, креативні послуги.',
    typography: 'premium', spacing: 'balanced', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'radial-gradient(circle at 10% 10%,rgba(168,85,247,.18),transparent 30%),linear-gradient(180deg,#faf5ff,#eef2ff)', sectionBg: 'radial-gradient(circle at 10% 10%,rgba(168,85,247,.18),transparent 30%),linear-gradient(180deg,#faf5ff,#eef2ff)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.84)', soft: '#ede9fe', accent: '#7c3aed', accent2: '#db2777', heading: '#1e1b4b', text: '#4c1d95', muted: '#6d28d9', border: 'rgba(124,58,237,.16)', overlay: 'linear-gradient(180deg,rgba(30,27,75,.32),rgba(30,27,75,.54))'
    })
  }),

  'medicine-clean-blue': Object.freeze({
    id: 'medicine-clean-blue', group: 'industry', label: 'Medicine Clean Blue',
    description: 'Клініки, стоматології, діагностика, реабілітація, медичні центри.',
    typography: 'clean', spacing: 'balanced', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#f8fdff,#eaf7fb)', sectionBg: 'linear-gradient(180deg,#f8fdff,#eaf7fb)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.88)', soft: '#cffafe', accent: '#0284c7', accent2: '#14b8a6', heading: '#083344', text: '#334155', muted: '#64748b', border: 'rgba(2,132,199,.14)', overlay: 'linear-gradient(180deg,rgba(8,51,68,.28),rgba(8,51,68,.48))'
    })
  }),
  'education-warm-indigo': Object.freeze({
    id: 'education-warm-indigo', group: 'industry', label: 'Education Warm Indigo',
    description: 'Школи, курси, університети, освітні платформи, репетитори.',
    typography: 'clean', spacing: 'balanced', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fff7ed,#eef2ff)', sectionBg: 'linear-gradient(180deg,#fff7ed,#eef2ff)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.88)', soft: '#ddd6fe', accent: '#4f46e5', accent2: '#f97316', heading: '#1e1b4b', text: '#475569', muted: '#64748b', border: 'rgba(79,70,229,.15)', overlay: 'linear-gradient(180deg,rgba(30,27,75,.30),rgba(30,27,75,.50))'
    })
  }),
  'education-academy-blue-gold': Object.freeze({
    id: 'education-academy-blue-gold', group: 'industry', label: 'Education Academy Blue Gold',
    description: 'Професійна тема для шкіл, курсів, університетів і освітніх платформ: довіра, вступ, програми, викладачі, події.',
    typography: 'premium', spacing: 'premium', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'radial-gradient(circle at 10% 8%,rgba(79,70,229,.14),transparent 28%),linear-gradient(180deg,#fffaf2,#eef2ff)', sectionBg: 'linear-gradient(180deg,#fffaf2,#eef2ff)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.90)', soft: '#e0e7ff', accent: '#3730a3', accent2: '#f59e0b', heading: '#172554', text: '#475569', muted: '#64748b', border: 'rgba(55,48,163,.16)', overlay: 'linear-gradient(180deg,rgba(23,37,84,.34),rgba(23,37,84,.56))'
    })
  }),
  'education-pro-campus-editorial': Object.freeze({
    id: 'education-pro-campus-editorial', group: 'industry', label: 'Education Pro Campus Editorial',
    description: 'Професійний освітній дизайн: magazine hero, academy cards, bento-довіра, викладачі, admissions CTA.',
    typography: 'editorial', spacing: 'editorial', surfaces: 'premium',
    palette: Object.freeze({
      bg: 'radial-gradient(circle at 8% 6%,rgba(245,158,11,.18),transparent 24%),radial-gradient(circle at 88% 2%,rgba(79,70,229,.18),transparent 30%),linear-gradient(180deg,#fff9ed,#edf2ff)',
      sectionBg: 'radial-gradient(circle at 8% 6%,rgba(245,158,11,.18),transparent 24%),radial-gradient(circle at 88% 2%,rgba(79,70,229,.18),transparent 30%),linear-gradient(180deg,#fff9ed,#edf2ff)',
      panel: '#ffffff', panelSoft: 'rgba(255,255,255,.90)', soft: '#e0e7ff', accent: '#1e3a8a', accent2: '#f59e0b', heading: '#0f172a', text: '#475569', muted: '#64748b', border: 'rgba(30,58,138,.15)', overlay: 'linear-gradient(180deg,rgba(15,23,42,.38),rgba(15,23,42,.62))'
    })
  }),

  'restaurant-warm-amber': Object.freeze({
    id: 'restaurant-warm-amber', group: 'industry', label: 'Restaurant Warm Amber',
    description: 'Ресторани, кафе, пекарні, доставка їжі, локальна гастрономія.',
    typography: 'premium', spacing: 'premium', surfaces: 'premium',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fff7ed,#451a03)', sectionBg: 'linear-gradient(180deg,#fff7ed,#ffedd5)', panel: '#fffaf2', panelSoft: 'rgba(255,250,242,.86)', soft: '#fed7aa', accent: '#9a3412', accent2: '#f59e0b', heading: '#431407', text: '#7c2d12', muted: '#9a3412', border: 'rgba(154,52,18,.16)', overlay: 'linear-gradient(180deg,rgba(67,20,7,.34),rgba(67,20,7,.58))'
    })
  }),
  'beauty-soft-rose': Object.freeze({
    id: 'beauty-soft-rose', group: 'industry', label: 'Beauty Soft Rose',
    description: 'Краса, косметологія, SPA, салони, перукарні, барбершопи.',
    typography: 'premium', spacing: 'premium', surfaces: 'premium',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fff1f2,#fff7ed)', sectionBg: 'linear-gradient(180deg,#fff1f2,#fff7ed)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.86)', soft: '#ffe4e6', accent: '#be123c', accent2: '#d97706', heading: '#4c0519', text: '#7f1d1d', muted: '#9f1239', border: 'rgba(190,18,60,.14)', overlay: 'linear-gradient(180deg,rgba(76,5,25,.28),rgba(76,5,25,.48))'
    })
  }),
  'construction-graphite-orange': Object.freeze({
    id: 'construction-graphite-orange', group: 'industry', label: 'Construction Graphite Orange',
    description: 'Будівництво, ремонт, інструмент, виробництво, промислові компанії.',
    typography: 'clean', spacing: 'balanced', surfaces: 'sharp',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#f8fafc,#e5e7eb)', sectionBg: 'linear-gradient(180deg,#f8fafc,#e5e7eb)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.86)', soft: '#fed7aa', accent: '#ea580c', accent2: '#111827', heading: '#111827', text: '#4b5563', muted: '#6b7280', border: 'rgba(17,24,39,.14)', overlay: 'linear-gradient(180deg,rgba(17,24,39,.38),rgba(17,24,39,.62))'
    })
  }),
  'auto-steel-red': Object.freeze({
    id: 'auto-steel-red', group: 'industry', label: 'Auto Steel Red',
    description: 'Автосервіс, детейлінг, запчастини, автоелектроніка, технічні послуги.',
    typography: 'clean', spacing: 'balanced', surfaces: 'sharp',
    palette: Object.freeze({
      bg: 'linear-gradient(135deg,#111827,#020617)', sectionBg: 'linear-gradient(135deg,#111827,#020617)', panel: 'rgba(17,24,39,.86)', panelSoft: 'rgba(17,24,39,.74)', soft: 'rgba(239,68,68,.15)', accent: '#ef4444', accent2: '#f97316', heading: '#f8fafc', text: '#cbd5e1', muted: '#94a3b8', border: 'rgba(248,250,252,.14)', overlay: 'linear-gradient(180deg,rgba(2,6,23,.58),rgba(2,6,23,.78))'
    })
  }),
  'real-estate-sand-navy': Object.freeze({
    id: 'real-estate-sand-navy', group: 'industry', label: 'Real Estate Sand Navy',
    description: 'Нерухомість, девелопмент, архітектура, інтерʼєри, оренда.',
    typography: 'editorial', spacing: 'editorial', surfaces: 'premium',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fbf7ef,#e9dfcf)', sectionBg: 'linear-gradient(180deg,#fbf7ef,#e9dfcf)', panel: '#fffdf7', panelSoft: 'rgba(255,253,247,.86)', soft: '#eadfcb', accent: '#102a43', accent2: '#b08968', heading: '#102a43', text: '#495057', muted: '#6c757d', border: 'rgba(16,42,67,.14)', overlay: 'linear-gradient(180deg,rgba(16,42,67,.32),rgba(16,42,67,.54))'
    })
  }),
  'landscape-eco-premium': Object.freeze({
    id: 'landscape-eco-premium', group: 'industry', label: 'Landscape Eco Premium',
    description: 'Ландшафтний дизайн, сад, тераси, озеленення, природні преміальні сайти.',
    typography: 'premium', spacing: 'premium', surfaces: 'premium',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#f7f4eb,#eaf2df)', sectionBg: 'linear-gradient(180deg,#f7f4eb,#eaf2df)', panel: '#fffdf7', panelSoft: 'rgba(255,253,247,.86)', soft: '#e5f0db', accent: '#3f5f31', accent2: '#b88a3b', heading: '#1e351f', text: '#586b55', muted: '#6b7a62', border: 'rgba(63,95,49,.15)', overlay: 'linear-gradient(180deg,rgba(21,46,25,.34),rgba(21,46,25,.56))'
    })
  }),
  'travel-ocean-sun': Object.freeze({
    id: 'travel-ocean-sun', group: 'industry', label: 'Travel Ocean Sun',
    description: 'Туризм, готелі, трансфери, туроператори, подорожі.',
    typography: 'premium', spacing: 'premium', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#ecfeff,#fff7ed)', sectionBg: 'linear-gradient(180deg,#ecfeff,#fff7ed)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.86)', soft: '#bae6fd', accent: '#0284c7', accent2: '#f59e0b', heading: '#083344', text: '#475569', muted: '#64748b', border: 'rgba(2,132,199,.15)', overlay: 'linear-gradient(180deg,rgba(8,51,68,.30),rgba(8,51,68,.50))'
    })
  }),
  'nonprofit-human-warm': Object.freeze({
    id: 'nonprofit-human-warm', group: 'industry', label: 'Nonprofit Human Warm',
    description: 'Благодійність, волонтерство, громадські організації, соціальні проєкти.',
    typography: 'clean', spacing: 'balanced', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fff7ed,#fefce8)', sectionBg: 'linear-gradient(180deg,#fff7ed,#fefce8)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.88)', soft: '#fde68a', accent: '#c2410c', accent2: '#16a34a', heading: '#431407', text: '#713f12', muted: '#92400e', border: 'rgba(194,65,12,.14)', overlay: 'linear-gradient(180deg,rgba(67,20,7,.28),rgba(67,20,7,.48))'
    })
  }),

  'marketplace-orange-deals': Object.freeze({
    id: 'marketplace-orange-deals', group: 'marketplace', label: 'Marketplace Orange Deals',
    description: 'Універсальний маркетплейс, акції, товари для дому, дропшипінг, OLX/Prom стиль.',
    typography: 'clean', spacing: 'compact', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fff7ed,#f8fafc)', sectionBg: 'linear-gradient(180deg,#fff7ed,#f8fafc)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.90)', soft: '#ffedd5', accent: '#f97316', accent2: '#2563eb', heading: '#1f2937', text: '#4b5563', muted: '#6b7280', border: 'rgba(249,115,22,.15)', overlay: 'linear-gradient(180deg,rgba(31,41,55,.26),rgba(31,41,55,.48))'
    })
  }),
  'marketplace-electronics-blue': Object.freeze({
    id: 'marketplace-electronics-blue', group: 'marketplace', label: 'Electronics Blue',
    description: 'Телефони, ноутбуки, техніка, електроніка, гаджети.',
    typography: 'clean', spacing: 'compact', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#eff6ff,#f8fafc)', sectionBg: 'linear-gradient(180deg,#eff6ff,#f8fafc)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.90)', soft: '#dbeafe', accent: '#2563eb', accent2: '#06b6d4', heading: '#0f172a', text: '#475569', muted: '#64748b', border: 'rgba(37,99,235,.14)', overlay: 'linear-gradient(180deg,rgba(15,23,42,.30),rgba(15,23,42,.52))'
    })
  }),
  'marketplace-home-soft': Object.freeze({
    id: 'marketplace-home-soft', group: 'marketplace', label: 'Home Goods Soft',
    description: 'Товари для дому, меблі, декор, текстиль, посуд.',
    typography: 'clean', spacing: 'compact', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#faf7f2,#f1f5f9)', sectionBg: 'linear-gradient(180deg,#faf7f2,#f1f5f9)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.90)', soft: '#e7ddd1', accent: '#8b5e34', accent2: '#475569', heading: '#292524', text: '#57534e', muted: '#78716c', border: 'rgba(139,94,52,.14)', overlay: 'linear-gradient(180deg,rgba(41,37,36,.26),rgba(41,37,36,.46))'
    })
  }),
  'marketplace-outdoor-forest': Object.freeze({
    id: 'marketplace-outdoor-forest', group: 'marketplace', label: 'Outdoor Forest',
    description: 'Мангали, казани, сковороди, туризм, риболовля, відпочинок на природі.',
    typography: 'clean', spacing: 'compact', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#f0fdf4,#fff7ed)', sectionBg: 'linear-gradient(180deg,#f0fdf4,#fff7ed)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.88)', soft: '#dcfce7', accent: '#166534', accent2: '#ea580c', heading: '#052e16', text: '#475569', muted: '#64748b', border: 'rgba(22,101,52,.15)', overlay: 'linear-gradient(180deg,rgba(5,46,22,.34),rgba(5,46,22,.56))'
    })
  }),
  'marketplace-sport-energy': Object.freeze({
    id: 'marketplace-sport-energy', group: 'marketplace', label: 'Sport Energy',
    description: 'Спорт, тренажери, фітнес, велосипеди, активний відпочинок.',
    typography: 'clean', spacing: 'compact', surfaces: 'sharp',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#f8fafc,#ecfccb)', sectionBg: 'linear-gradient(180deg,#f8fafc,#ecfccb)', panel: '#ffffff', panelSoft: 'rgba(255,255,255,.90)', soft: '#d9f99d', accent: '#65a30d', accent2: '#111827', heading: '#1a2e05', text: '#475569', muted: '#64748b', border: 'rgba(101,163,13,.16)', overlay: 'linear-gradient(180deg,rgba(26,46,5,.32),rgba(26,46,5,.54))'
    })
  }),
  'marketplace-books-paper': Object.freeze({
    id: 'marketplace-books-paper', group: 'marketplace', label: 'Books Paper',
    description: 'Книги, канцелярія, освіта, творчість, навчальні матеріали.',
    typography: 'editorial', spacing: 'balanced', surfaces: 'soft',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fffbeb,#f5f5f4)', sectionBg: 'linear-gradient(180deg,#fffbeb,#f5f5f4)', panel: '#fffdf5', panelSoft: 'rgba(255,253,245,.88)', soft: '#fef3c7', accent: '#92400e', accent2: '#1d4ed8', heading: '#1c1917', text: '#57534e', muted: '#78716c', border: 'rgba(146,64,14,.14)', overlay: 'linear-gradient(180deg,rgba(28,25,23,.28),rgba(28,25,23,.48))'
    })
  }),

  'creative-photo-noir': Object.freeze({
    id: 'creative-photo-noir', group: 'creative', label: 'Photo Noir',
    description: 'Фотографи, відеографи, портфоліо, кіно, медіа.',
    typography: 'editorial', spacing: 'editorial', surfaces: 'sharp',
    palette: Object.freeze({
      bg: 'linear-gradient(135deg,#09090b,#18181b)', sectionBg: 'linear-gradient(135deg,#09090b,#18181b)', panel: 'rgba(39,39,42,.82)', panelSoft: 'rgba(39,39,42,.68)', soft: 'rgba(255,255,255,.08)', accent: '#fafafa', accent2: '#d4af37', heading: '#fafafa', text: '#d4d4d8', muted: '#a1a1aa', border: 'rgba(255,255,255,.12)', overlay: 'linear-gradient(180deg,rgba(9,9,11,.54),rgba(9,9,11,.78))'
    })
  }),
  'culture-deep-burgundy': Object.freeze({
    id: 'culture-deep-burgundy', group: 'creative', label: 'Culture Burgundy',
    description: 'Культура, театр, музей, події, література, історичні проєкти.',
    typography: 'editorial', spacing: 'editorial', surfaces: 'premium',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fff7ed,#f3e8e8)', sectionBg: 'linear-gradient(180deg,#fff7ed,#f3e8e8)', panel: '#fffaf5', panelSoft: 'rgba(255,250,245,.86)', soft: '#f5d0c5', accent: '#7f1d1d', accent2: '#b45309', heading: '#3b0a0a', text: '#57534e', muted: '#78716c', border: 'rgba(127,29,29,.15)', overlay: 'linear-gradient(180deg,rgba(59,10,10,.34),rgba(59,10,10,.56))'
    })
  })
});

function pick_(collection, key, fallback) {
  return collection[key] || collection[fallback];
}

function normalizePreset_(preset) {
  const typography = pick_(TYPOGRAPHY, preset.typography, 'clean');
  const spacing = pick_(SPACING, preset.spacing, 'balanced');
  const surfaces = pick_(SURFACES, preset.surfaces, 'soft');
  const palette = preset.palette || {};
  return {
    id: preset.id,
    label: preset.label,
    description: preset.description,
    group: preset.group,
    groupLabel: AI_THEME_PRESET_GROUPS.find((group) => group.id === preset.group)?.label || preset.group || '',
    bg: palette.bg,
    sectionBg: palette.sectionBg || palette.bg,
    panel: palette.panel,
    panelSoft: palette.panelSoft || palette.panel,
    soft: palette.soft || palette.panelSoft || palette.panel,
    accent: palette.accent,
    accent2: palette.accent2 || palette.accent,
    heading: palette.heading,
    text: palette.text,
    muted: palette.muted,
    border: palette.border,
    overlay: palette.overlay,
    h1: typography.h1,
    h2: typography.h2,
    h3: typography.h3,
    bodySize: typography.body,
    smallSize: typography.small,
    letterSpacing: typography.letterSpacing,
    lineHeightTight: typography.lineHeightTight,
    lineHeightBody: typography.lineHeightBody,
    weightStrong: typography.weightStrong,
    sectionY: spacing.sectionY,
    sectionX: spacing.sectionX,
    rowGap: spacing.rowGap,
    blockPad: spacing.blockPad,
    maxWidth: spacing.maxWidth,
    radius: surfaces.radius,
    radiusLarge: surfaces.radiusLarge,
    buttonRadius: surfaces.buttonRadius,
    shadow: surfaces.shadow,
    softShadow: surfaces.softShadow
  };
}

export function hasAiProfessionalThemePreset(id) {
  return !!AI_THEME_PRESETS[String(id || '').trim()];
}

export function getAiProfessionalThemePreset(id, fallbackId = 'theme-modern-clean') {
  const key = String(id || '').trim();
  return normalizePreset_(AI_THEME_PRESETS[key] || AI_THEME_PRESETS[fallbackId] || AI_THEME_PRESETS['theme-modern-clean']);
}

export function getAiProfessionalThemePresetOptions() {
  return Object.values(AI_THEME_PRESETS).map((preset) => ({
    id: preset.id,
    label: preset.label,
    description: preset.description,
    group: preset.group,
    groupLabel: AI_THEME_PRESET_GROUPS.find((item) => item.id === preset.group)?.label || preset.group || ''
  }));
}

export function getAiProfessionalThemePresetGroups() {
  const options = getAiProfessionalThemePresetOptions();
  return AI_THEME_PRESET_GROUPS.map((group) => ({
    ...group,
    options: options.filter((item) => item.group === group.id)
  })).filter((group) => group.options.length > 0);
}

export function getAiProfessionalThemePresetCount() {
  return Object.keys(AI_THEME_PRESETS).length;
}
