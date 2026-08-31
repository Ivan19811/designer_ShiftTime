// js/global-design/style-presets.js
// [00684] Global Design theme presets.
// Дані тем: структура/контент сайту не змінюються, міняються тільки style tokens.

export const ST_GLOBAL_DESIGN_PRESETS = [
  {
    id: 'light-clean',
    name: 'Light Clean',
    group: 'Light',
    description: 'Чистий білий сайт із синім акцентом.',
    colors: { primary: '#2563eb', accent: '#0ea5e9', surface: '#ffffff', surface2: '#f8fafc', text: '#111827', muted: '#64748b', border: '#e2e8f0' },
    radius: { sm: '10px', md: '16px', lg: '24px', pill: '999px' },
    shadow: { soft: '0 14px 34px rgba(15,23,42,.08)', md: '0 22px 60px rgba(15,23,42,.14)' },
    buttons: { fill: 'linear-gradient(135deg,#2563eb,#0ea5e9)', text: '#ffffff', border: '1px solid rgba(255,255,255,.18)' },
    sections: { bg: '#ffffff', altBg: '#f8fafc' },
    blocks: { bg: '#ffffff', border: '1px solid #e2e8f0' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'dark-premium',
    name: 'Dark Premium',
    group: 'Dark',
    description: 'Темна преміальна тема з золотим акцентом.',
    colors: { primary: '#020617', accent: '#f59e0b', surface: '#0f172a', surface2: '#111827', text: '#f8fafc', muted: '#cbd5e1', border: '#334155' },
    radius: { sm: '12px', md: '18px', lg: '28px', pill: '999px' },
    shadow: { soft: '0 18px 44px rgba(0,0,0,.30)', md: '0 30px 80px rgba(0,0,0,.45)' },
    buttons: { fill: 'linear-gradient(135deg,#f59e0b,#f97316)', text: '#111827', border: '1px solid rgba(245,158,11,.36)' },
    sections: { bg: '#0f172a', altBg: '#111827' },
    blocks: { bg: '#111827', border: '1px solid rgba(148,163,184,.22)' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '950', textWeight: '700' }
  },
  {
    id: 'gray-minimal',
    name: 'Gray Minimal',
    group: 'Gray',
    description: 'Сірий мінімалізм без зайвих ефектів.',
    colors: { primary: '#374151', accent: '#111827', surface: '#f9fafb', surface2: '#f3f4f6', text: '#111827', muted: '#6b7280', border: '#d1d5db' },
    radius: { sm: '8px', md: '12px', lg: '18px', pill: '999px' },
    shadow: { soft: '0 8px 22px rgba(17,24,39,.08)', md: '0 18px 44px rgba(17,24,39,.12)' },
    buttons: { fill: '#111827', text: '#ffffff', border: '1px solid #111827' },
    sections: { bg: '#f9fafb', altBg: '#f3f4f6' },
    blocks: { bg: '#ffffff', border: '1px solid #d1d5db' },
    typography: { font: 'Inter, Arial, sans-serif', headingWeight: '850', textWeight: '600' }
  },
  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    group: 'Pastel',
    description: 'М’які світлі кольори для дружніх сайтів.',
    colors: { primary: '#7c3aed', accent: '#fb7185', surface: '#fff7ed', surface2: '#fdf2f8', text: '#312e81', muted: '#7c2d12', border: '#fed7aa' },
    radius: { sm: '14px', md: '22px', lg: '32px', pill: '999px' },
    shadow: { soft: '0 16px 38px rgba(251,113,133,.16)', md: '0 26px 70px rgba(124,58,237,.18)' },
    buttons: { fill: 'linear-gradient(135deg,#7c3aed,#fb7185)', text: '#ffffff', border: '1px solid rgba(255,255,255,.28)' },
    sections: { bg: '#fff7ed', altBg: '#fdf2f8' },
    blocks: { bg: 'rgba(255,255,255,.72)', border: '1px solid rgba(251,113,133,.20)' },
    typography: { font: 'Manrope, Inter, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'business-blue',
    name: 'Business Blue',
    group: 'Business',
    description: 'Ділова синя тема.',
    colors: { primary: '#1d4ed8', accent: '#38bdf8', surface: '#eff6ff', surface2: '#dbeafe', text: '#0f172a', muted: '#475569', border: '#bfdbfe' },
    radius: { sm: '10px', md: '14px', lg: '22px', pill: '999px' },
    shadow: { soft: '0 14px 38px rgba(29,78,216,.14)', md: '0 26px 70px rgba(29,78,216,.20)' },
    buttons: { fill: 'linear-gradient(135deg,#1d4ed8,#38bdf8)', text: '#ffffff', border: '1px solid rgba(255,255,255,.18)' },
    sections: { bg: '#eff6ff', altBg: '#ffffff' },
    blocks: { bg: '#ffffff', border: '1px solid #bfdbfe' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'luxury-gold',
    name: 'Luxury Gold',
    group: 'Premium',
    description: 'Чорний, кремовий і золото.',
    colors: { primary: '#111827', accent: '#d97706', surface: '#fffbeb', surface2: '#fef3c7', text: '#1f2937', muted: '#92400e', border: '#fde68a' },
    radius: { sm: '12px', md: '18px', lg: '30px', pill: '999px' },
    shadow: { soft: '0 18px 42px rgba(217,119,6,.14)', md: '0 28px 80px rgba(17,24,39,.20)' },
    buttons: { fill: 'linear-gradient(135deg,#111827,#d97706)', text: '#ffffff', border: '1px solid rgba(217,119,6,.30)' },
    sections: { bg: '#fffbeb', altBg: '#fef3c7' },
    blocks: { bg: 'rgba(255,255,255,.78)', border: '1px solid #fde68a' },
    typography: { font: 'Manrope, Inter, Arial, sans-serif', headingWeight: '950', textWeight: '700' }
  },
  {
    id: 'nature-green',
    name: 'Nature Green',
    group: 'Nature',
    description: 'Природна зелена тема.',
    colors: { primary: '#166534', accent: '#22c55e', surface: '#f0fdf4', surface2: '#dcfce7', text: '#052e16', muted: '#15803d', border: '#bbf7d0' },
    radius: { sm: '12px', md: '18px', lg: '28px', pill: '999px' },
    shadow: { soft: '0 16px 40px rgba(34,197,94,.14)', md: '0 28px 70px rgba(22,101,52,.20)' },
    buttons: { fill: 'linear-gradient(135deg,#166534,#22c55e)', text: '#ffffff', border: '1px solid rgba(22,101,52,.20)' },
    sections: { bg: '#f0fdf4', altBg: '#dcfce7' },
    blocks: { bg: '#ffffff', border: '1px solid #bbf7d0' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'tech-neon',
    name: 'Tech Neon',
    group: 'Dark',
    description: 'Темний tech із cyan/violet акцентами.',
    colors: { primary: '#020617', accent: '#22d3ee', surface: '#030712', surface2: '#111827', text: '#e0f2fe', muted: '#93c5fd', border: '#164e63' },
    radius: { sm: '10px', md: '16px', lg: '26px', pill: '999px' },
    shadow: { soft: '0 0 34px rgba(34,211,238,.18)', md: '0 0 80px rgba(139,92,246,.24)' },
    buttons: { fill: 'linear-gradient(135deg,#22d3ee,#8b5cf6)', text: '#020617', border: '1px solid rgba(34,211,238,.36)' },
    sections: { bg: '#030712', altBg: '#111827' },
    blocks: { bg: 'rgba(15,23,42,.78)', border: '1px solid rgba(34,211,238,.20)' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '950', textWeight: '700' }
  },
  {
    id: 'elegant-beige',
    name: 'Elegant Beige',
    group: 'Light',
    description: 'Теплий елегантний беж.',
    colors: { primary: '#7c2d12', accent: '#c2410c', surface: '#faf7f0', surface2: '#f5efe3', text: '#292524', muted: '#78716c', border: '#e7dcc8' },
    radius: { sm: '10px', md: '16px', lg: '26px', pill: '999px' },
    shadow: { soft: '0 14px 36px rgba(124,45,18,.10)', md: '0 26px 68px rgba(124,45,18,.16)' },
    buttons: { fill: 'linear-gradient(135deg,#7c2d12,#c2410c)', text: '#fff7ed', border: '1px solid rgba(124,45,18,.20)' },
    sections: { bg: '#faf7f0', altBg: '#f5efe3' },
    blocks: { bg: '#fffaf2', border: '1px solid #e7dcc8' },
    typography: { font: 'Manrope, Inter, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'black-white',
    name: 'Black & White',
    group: 'Minimal',
    description: 'Контрастний монохром.',
    colors: { primary: '#000000', accent: '#ffffff', surface: '#ffffff', surface2: '#f4f4f5', text: '#000000', muted: '#52525b', border: '#d4d4d8' },
    radius: { sm: '4px', md: '8px', lg: '14px', pill: '999px' },
    shadow: { soft: '0 10px 28px rgba(0,0,0,.10)', md: '0 20px 58px rgba(0,0,0,.18)' },
    buttons: { fill: '#000000', text: '#ffffff', border: '1px solid #000000' },
    sections: { bg: '#ffffff', altBg: '#f4f4f5' },
    blocks: { bg: '#ffffff', border: '1px solid #d4d4d8' },
    typography: { font: 'Inter, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'colorful-startup',
    name: 'Colorful Startup',
    group: 'Colorful',
    description: 'Яскравий startup стиль.',
    colors: { primary: '#7c3aed', accent: '#06b6d4', surface: '#ffffff', surface2: '#eef2ff', text: '#111827', muted: '#4b5563', border: '#c7d2fe' },
    radius: { sm: '14px', md: '22px', lg: '34px', pill: '999px' },
    shadow: { soft: '0 18px 45px rgba(124,58,237,.16)', md: '0 30px 88px rgba(6,182,212,.22)' },
    buttons: { fill: 'linear-gradient(135deg,#7c3aed,#06b6d4)', text: '#ffffff', border: '1px solid rgba(255,255,255,.22)' },
    sections: { bg: '#ffffff', altBg: '#eef2ff' },
    blocks: { bg: 'rgba(255,255,255,.84)', border: '1px solid #c7d2fe' },
    typography: { font: 'Manrope, Inter, Arial, sans-serif', headingWeight: '950', textWeight: '700' }
  },
  {
    id: 'restaurant-warm',
    name: 'Restaurant Warm',
    group: 'Warm',
    description: 'Тепла тема для кафе/ресторанів.',
    colors: { primary: '#7f1d1d', accent: '#f97316', surface: '#fff7ed', surface2: '#ffedd5', text: '#431407', muted: '#9a3412', border: '#fed7aa' },
    radius: { sm: '12px', md: '20px', lg: '30px', pill: '999px' },
    shadow: { soft: '0 18px 42px rgba(249,115,22,.16)', md: '0 30px 76px rgba(127,29,29,.20)' },
    buttons: { fill: 'linear-gradient(135deg,#7f1d1d,#f97316)', text: '#ffffff', border: '1px solid rgba(249,115,22,.28)' },
    sections: { bg: '#fff7ed', altBg: '#ffedd5' },
    blocks: { bg: '#ffffff', border: '1px solid #fed7aa' },
    typography: { font: 'Manrope, Inter, Arial, sans-serif', headingWeight: '950', textWeight: '700' }
  },
  {
    id: 'education-soft',
    name: 'Education Soft',
    group: 'Education',
    description: 'М’яка освітня тема.',
    colors: { primary: '#1e40af', accent: '#facc15', surface: '#eff6ff', surface2: '#fefce8', text: '#172554', muted: '#475569', border: '#bfdbfe' },
    radius: { sm: '14px', md: '22px', lg: '32px', pill: '999px' },
    shadow: { soft: '0 16px 42px rgba(30,64,175,.12)', md: '0 30px 76px rgba(250,204,21,.18)' },
    buttons: { fill: 'linear-gradient(135deg,#1e40af,#facc15)', text: '#ffffff', border: '1px solid rgba(30,64,175,.18)' },
    sections: { bg: '#eff6ff', altBg: '#fefce8' },
    blocks: { bg: '#ffffff', border: '1px solid #bfdbfe' },
    typography: { font: 'Manrope, Inter, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'medical-clean',
    name: 'Medical Clean',
    group: 'Medical',
    description: 'Чиста медична тема.',
    colors: { primary: '#0f766e', accent: '#14b8a6', surface: '#f0fdfa', surface2: '#ccfbf1', text: '#134e4a', muted: '#0f766e', border: '#99f6e4' },
    radius: { sm: '10px', md: '16px', lg: '24px', pill: '999px' },
    shadow: { soft: '0 14px 36px rgba(20,184,166,.12)', md: '0 28px 70px rgba(15,118,110,.18)' },
    buttons: { fill: 'linear-gradient(135deg,#0f766e,#14b8a6)', text: '#ffffff', border: '1px solid rgba(20,184,166,.24)' },
    sections: { bg: '#f0fdfa', altBg: '#ffffff' },
    blocks: { bg: '#ffffff', border: '1px solid #99f6e4' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'law-premium',
    name: 'Law Premium',
    group: 'Premium',
    description: 'Юридичний navy/gold стиль.',
    colors: { primary: '#0f172a', accent: '#d97706', surface: '#f8f6f0', surface2: '#ece7dc', text: '#111827', muted: '#57534e', border: '#d6c7aa' },
    radius: { sm: '8px', md: '14px', lg: '22px', pill: '999px' },
    shadow: { soft: '0 18px 42px rgba(15,23,42,.12)', md: '0 30px 80px rgba(15,23,42,.20)' },
    buttons: { fill: 'linear-gradient(135deg,#0f172a,#d97706)', text: '#ffffff', border: '1px solid rgba(217,119,6,.24)' },
    sections: { bg: '#f8f6f0', altBg: '#ece7dc' },
    blocks: { bg: 'rgba(255,255,255,.78)', border: '1px solid #d6c7aa' },
    typography: { font: 'Manrope, Inter, Arial, sans-serif', headingWeight: '950', textWeight: '700' }
  },
  {
    id: 'construction-orange',
    name: 'Construction Orange',
    group: 'Business',
    description: 'Будівельний помаранчевий стиль.',
    colors: { primary: '#1f2937', accent: '#f97316', surface: '#fffbeb', surface2: '#fed7aa', text: '#111827', muted: '#78350f', border: '#fdba74' },
    radius: { sm: '6px', md: '12px', lg: '20px', pill: '999px' },
    shadow: { soft: '0 16px 38px rgba(249,115,22,.16)', md: '0 28px 74px rgba(31,41,55,.18)' },
    buttons: { fill: 'linear-gradient(135deg,#1f2937,#f97316)', text: '#ffffff', border: '1px solid rgba(249,115,22,.24)' },
    sections: { bg: '#fffbeb', altBg: '#fff7ed' },
    blocks: { bg: '#ffffff', border: '1px solid #fdba74' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '950', textWeight: '700' }
  },
  {
    id: 'beauty-pink',
    name: 'Beauty Pink',
    group: 'Pastel',
    description: 'Рожева тема для beauty/portfolio.',
    colors: { primary: '#be185d', accent: '#f472b6', surface: '#fdf2f8', surface2: '#fce7f3', text: '#831843', muted: '#9d174d', border: '#fbcfe8' },
    radius: { sm: '16px', md: '26px', lg: '36px', pill: '999px' },
    shadow: { soft: '0 18px 42px rgba(244,114,182,.18)', md: '0 30px 78px rgba(190,24,93,.20)' },
    buttons: { fill: 'linear-gradient(135deg,#be185d,#f472b6)', text: '#ffffff', border: '1px solid rgba(244,114,182,.28)' },
    sections: { bg: '#fdf2f8', altBg: '#ffffff' },
    blocks: { bg: 'rgba(255,255,255,.80)', border: '1px solid #fbcfe8' },
    typography: { font: 'Manrope, Inter, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'sport-contrast',
    name: 'Sport Contrast',
    group: 'Colorful',
    description: 'Контрастний спортивний стиль.',
    colors: { primary: '#111827', accent: '#84cc16', surface: '#f9fafb', surface2: '#ecfccb', text: '#111827', muted: '#4d7c0f', border: '#bef264' },
    radius: { sm: '6px', md: '12px', lg: '18px', pill: '999px' },
    shadow: { soft: '0 14px 38px rgba(132,204,22,.16)', md: '0 26px 72px rgba(17,24,39,.22)' },
    buttons: { fill: 'linear-gradient(135deg,#111827,#84cc16)', text: '#ffffff', border: '1px solid rgba(132,204,22,.28)' },
    sections: { bg: '#f9fafb', altBg: '#ecfccb' },
    blocks: { bg: '#ffffff', border: '1px solid #bef264' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '950', textWeight: '750' }
  },
  {
    id: 'portfolio-dark',
    name: 'Portfolio Dark',
    group: 'Dark',
    description: 'Темне портфоліо з фіолетовим акцентом.',
    colors: { primary: '#111827', accent: '#a855f7', surface: '#030712', surface2: '#111827', text: '#f9fafb', muted: '#d8b4fe', border: '#3b0764' },
    radius: { sm: '12px', md: '20px', lg: '32px', pill: '999px' },
    shadow: { soft: '0 18px 45px rgba(168,85,247,.16)', md: '0 30px 88px rgba(0,0,0,.42)' },
    buttons: { fill: 'linear-gradient(135deg,#111827,#a855f7)', text: '#ffffff', border: '1px solid rgba(168,85,247,.32)' },
    sections: { bg: '#030712', altBg: '#111827' },
    blocks: { bg: 'rgba(17,24,39,.82)', border: '1px solid rgba(168,85,247,.22)' },
    typography: { font: 'Manrope, Inter, Arial, sans-serif', headingWeight: '950', textWeight: '700' }
  },
  {
    id: 'marketplace-light',
    name: 'Marketplace Light',
    group: 'Light',
    description: 'Світла комерційна тема.',
    colors: { primary: '#0f172a', accent: '#ef4444', surface: '#ffffff', surface2: '#f8fafc', text: '#111827', muted: '#64748b', border: '#e5e7eb' },
    radius: { sm: '10px', md: '16px', lg: '24px', pill: '999px' },
    shadow: { soft: '0 14px 34px rgba(15,23,42,.08)', md: '0 24px 70px rgba(239,68,68,.14)' },
    buttons: { fill: 'linear-gradient(135deg,#0f172a,#ef4444)', text: '#ffffff', border: '1px solid rgba(239,68,68,.22)' },
    sections: { bg: '#ffffff', altBg: '#f8fafc' },
    blocks: { bg: '#ffffff', border: '1px solid #e5e7eb' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'ocean-calm',
    name: 'Ocean Calm',
    group: 'Blue',
    description: 'Спокійна морська тема.',
    colors: { primary: '#0e7490', accent: '#06b6d4', surface: '#ecfeff', surface2: '#cffafe', text: '#164e63', muted: '#0891b2', border: '#a5f3fc' },
    radius: { sm: '14px', md: '22px', lg: '32px', pill: '999px' },
    shadow: { soft: '0 16px 40px rgba(6,182,212,.14)', md: '0 28px 74px rgba(14,116,144,.20)' },
    buttons: { fill: 'linear-gradient(135deg,#0e7490,#06b6d4)', text: '#ffffff', border: '1px solid rgba(6,182,212,.26)' },
    sections: { bg: '#ecfeff', altBg: '#ffffff' },
    blocks: { bg: '#ffffff', border: '1px solid #a5f3fc' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '900', textWeight: '650' }
  },
  {
    id: 'slate-orange',
    name: 'Slate Orange',
    group: 'Dark',
    description: 'Темний slate з помаранчевим акцентом.',
    colors: { primary: '#0f172a', accent: '#f97316', surface: '#111827', surface2: '#1f2937', text: '#f8fafc', muted: '#cbd5e1', border: '#334155' },
    radius: { sm: '12px', md: '18px', lg: '28px', pill: '999px' },
    shadow: { soft: '0 18px 42px rgba(249,115,22,.14)', md: '0 32px 80px rgba(0,0,0,.42)' },
    buttons: { fill: 'linear-gradient(135deg,#0f172a,#f97316)', text: '#ffffff', border: '1px solid rgba(249,115,22,.28)' },
    sections: { bg: '#111827', altBg: '#1f2937' },
    blocks: { bg: '#1f2937', border: '1px solid #334155' },
    typography: { font: 'Inter, Manrope, Arial, sans-serif', headingWeight: '950', textWeight: '700' }
  }
];


// [00698] Готові шаблони типографіки. Це не змінює текст/контент — тільки
// шрифти, розміри, товщини, висоту рядка, відстань між літерами і кольори тексту.
export const ST_GLOBAL_TYPOGRAPHY_PRESETS = [
  { id: 'typo-modern-saas', name: 'Modern SaaS', group: 'Бізнес', description: 'Чітка сучасна типографіка для SaaS/CRM.', typography: { font: 'Inter, Manrope, Arial, sans-serif', headingFont: 'Manrope, Inter, Arial, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '56px', h2Size: '42px', h3Size: '28px', bodySize: '16px', lineHeight: '1.55', letterSpacing: '0px', headingLetterSpacing: '-1px', headingWeight: '900', textWeight: '500' } },
  { id: 'typo-premium-editorial', name: 'Premium Editorial', group: 'Преміум', description: 'Великі заголовки і спокійний текст.', typography: { font: 'Manrope, Inter, Arial, sans-serif', headingFont: 'Georgia, Times New Roman, serif', textFont: 'Inter, Arial, sans-serif', h1Size: '64px', h2Size: '46px', h3Size: '30px', bodySize: '17px', lineHeight: '1.7', letterSpacing: '0px', headingLetterSpacing: '-1.4px', headingWeight: '800', textWeight: '450' } },
  { id: 'typo-clean-minimal', name: 'Clean Minimal', group: 'Мінімальна', description: 'Легка мінімалістична читабельність.', typography: { font: 'Inter, Arial, sans-serif', headingFont: 'Inter, Arial, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '52px', h2Size: '38px', h3Size: '26px', bodySize: '16px', lineHeight: '1.65', letterSpacing: '0px', headingLetterSpacing: '-0.8px', headingWeight: '750', textWeight: '400' } },
  { id: 'typo-bold-startup', name: 'Bold Startup', group: 'Стартап', description: 'Сміливі заголовки для яскравих лендингів.', typography: { font: 'Manrope, Inter, Arial, sans-serif', headingFont: 'Manrope, Inter, Arial, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '68px', h2Size: '48px', h3Size: '31px', bodySize: '17px', lineHeight: '1.5', letterSpacing: '0px', headingLetterSpacing: '-1.8px', headingWeight: '950', textWeight: '600' } },
  { id: 'typo-corporate-trust', name: 'Corporate Trust', group: 'Бізнес', description: 'Стриманий корпоративний стиль.', typography: { font: 'Arial, Inter, sans-serif', headingFont: 'Arial, Inter, sans-serif', textFont: 'Arial, Inter, sans-serif', h1Size: '50px', h2Size: '36px', h3Size: '24px', bodySize: '16px', lineHeight: '1.55', letterSpacing: '0px', headingLetterSpacing: '-0.4px', headingWeight: '800', textWeight: '500' } },
  { id: 'typo-education-soft', name: 'Education Soft', group: 'Освіта', description: 'М’яка дружня типографіка.', typography: { font: 'Manrope, Inter, Arial, sans-serif', headingFont: 'Manrope, Inter, Arial, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '54px', h2Size: '40px', h3Size: '27px', bodySize: '17px', lineHeight: '1.68', letterSpacing: '0px', headingLetterSpacing: '-0.8px', headingWeight: '850', textWeight: '500' } },
  { id: 'typo-medical-clean', name: 'Medical Clean', group: 'Медична', description: 'Спокійна чиста медична читабельність.', typography: { font: 'Inter, Arial, sans-serif', headingFont: 'Inter, Arial, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '48px', h2Size: '36px', h3Size: '24px', bodySize: '16px', lineHeight: '1.72', letterSpacing: '0px', headingLetterSpacing: '-0.4px', headingWeight: '800', textWeight: '450' } },
  { id: 'typo-luxury-serif', name: 'Luxury Serif', group: 'Преміум', description: 'Елегантний serif для преміум-сайтів.', typography: { font: 'Georgia, Times New Roman, serif', headingFont: 'Georgia, Times New Roman, serif', textFont: 'Inter, Arial, sans-serif', h1Size: '66px', h2Size: '48px', h3Size: '30px', bodySize: '17px', lineHeight: '1.75', letterSpacing: '0px', headingLetterSpacing: '-1px', headingWeight: '700', textWeight: '450' } },
  { id: 'typo-tech-compact', name: 'Tech Compact', group: 'Технологічна', description: 'Компактний tech-стиль для панелей і сервісів.', typography: { font: 'Inter, Arial, sans-serif', headingFont: 'Inter, Arial, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '46px', h2Size: '34px', h3Size: '23px', bodySize: '15px', lineHeight: '1.45', letterSpacing: '0px', headingLetterSpacing: '-0.6px', headingWeight: '850', textWeight: '550' } },
  { id: 'typo-creative-agency', name: 'Creative Agency', group: 'Креатив', description: 'Виразна агенційна типографіка.', typography: { font: 'Manrope, Inter, Arial, sans-serif', headingFont: 'Manrope, Inter, Arial, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '72px', h2Size: '52px', h3Size: '32px', bodySize: '17px', lineHeight: '1.52', letterSpacing: '0px', headingLetterSpacing: '-2px', headingWeight: '950', textWeight: '600' } },
  { id: 'typo-restaurant-warm', name: 'Restaurant Warm', group: 'Ресторан', description: 'Теплий стиль для кафе/ресторанів.', typography: { font: 'Manrope, Inter, Arial, sans-serif', headingFont: 'Georgia, Times New Roman, serif', textFont: 'Manrope, Inter, Arial, sans-serif', h1Size: '60px', h2Size: '44px', h3Size: '29px', bodySize: '17px', lineHeight: '1.65', letterSpacing: '0px', headingLetterSpacing: '-0.8px', headingWeight: '800', textWeight: '500' } },
  { id: 'typo-marketplace-clear', name: 'Marketplace Clear', group: 'Маркетплейс', description: 'Чіткий стиль для товарів і каталогів.', typography: { font: 'Inter, Arial, sans-serif', headingFont: 'Inter, Arial, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '48px', h2Size: '34px', h3Size: '22px', bodySize: '15px', lineHeight: '1.5', letterSpacing: '0px', headingLetterSpacing: '-0.4px', headingWeight: '850', textWeight: '500' } },
  { id: 'typo-portfolio-large', name: 'Portfolio Large', group: 'Портфоліо', description: 'Великі заголовки для персонального бренду.', typography: { font: 'Manrope, Inter, Arial, sans-serif', headingFont: 'Manrope, Inter, Arial, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '76px', h2Size: '54px', h3Size: '34px', bodySize: '17px', lineHeight: '1.58', letterSpacing: '0px', headingLetterSpacing: '-2.2px', headingWeight: '950', textWeight: '550' } },
  { id: 'typo-news-readable', name: 'News Readable', group: 'Новини', description: 'Довгі тексти з високою читабельністю.', typography: { font: 'Georgia, Times New Roman, serif', headingFont: 'Georgia, Times New Roman, serif', textFont: 'Georgia, Times New Roman, serif', h1Size: '58px', h2Size: '42px', h3Size: '28px', bodySize: '18px', lineHeight: '1.8', letterSpacing: '0px', headingLetterSpacing: '-0.6px', headingWeight: '700', textWeight: '400' } },
  { id: 'typo-sport-strong', name: 'Sport Strong', group: 'Спорт', description: 'Сильні щільні заголовки.', typography: { font: 'Arial Black, Arial, Inter, sans-serif', headingFont: 'Arial Black, Arial, Inter, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '64px', h2Size: '46px', h3Size: '30px', bodySize: '16px', lineHeight: '1.45', letterSpacing: '0px', headingLetterSpacing: '-1px', headingWeight: '950', textWeight: '650' } },
  { id: 'typo-beauty-elegant', name: 'Beauty Elegant', group: 'Beauty', description: 'М’який елегантний стиль.', typography: { font: 'Manrope, Inter, Arial, sans-serif', headingFont: 'Georgia, Times New Roman, serif', textFont: 'Manrope, Inter, Arial, sans-serif', h1Size: '62px', h2Size: '46px', h3Size: '29px', bodySize: '17px', lineHeight: '1.7', letterSpacing: '0px', headingLetterSpacing: '-0.8px', headingWeight: '750', textWeight: '450' } },
  { id: 'typo-law-serious', name: 'Law Serious', group: 'Юридична', description: 'Серйозна юридична подача.', typography: { font: 'Georgia, Times New Roman, serif', headingFont: 'Georgia, Times New Roman, serif', textFont: 'Arial, Inter, sans-serif', h1Size: '54px', h2Size: '40px', h3Size: '26px', bodySize: '16px', lineHeight: '1.7', letterSpacing: '0px', headingLetterSpacing: '-0.4px', headingWeight: '700', textWeight: '500' } },
  { id: 'typo-construction-solid', name: 'Construction Solid', group: 'Будівництво', description: 'Міцний практичний стиль.', typography: { font: 'Inter, Arial, sans-serif', headingFont: 'Arial Black, Arial, Inter, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '58px', h2Size: '42px', h3Size: '28px', bodySize: '16px', lineHeight: '1.52', letterSpacing: '0px', headingLetterSpacing: '-0.8px', headingWeight: '950', textWeight: '600' } },
  { id: 'typo-soft-human', name: 'Soft Human', group: 'М’яка', description: 'Людяний м’який стиль для сервісів.', typography: { font: 'Manrope, Inter, Arial, sans-serif', headingFont: 'Manrope, Inter, Arial, sans-serif', textFont: 'Manrope, Inter, Arial, sans-serif', h1Size: '52px', h2Size: '38px', h3Size: '26px', bodySize: '17px', lineHeight: '1.75', letterSpacing: '0px', headingLetterSpacing: '-0.7px', headingWeight: '800', textWeight: '450' } },
  { id: 'typo-ultra-compact', name: 'Ultra Compact', group: 'Компактна', description: 'Максимально компактний інтерфейс.', typography: { font: 'Inter, Arial, sans-serif', headingFont: 'Inter, Arial, sans-serif', textFont: 'Inter, Arial, sans-serif', h1Size: '42px', h2Size: '30px', h3Size: '21px', bodySize: '14px', lineHeight: '1.38', letterSpacing: '0px', headingLetterSpacing: '-0.3px', headingWeight: '800', textWeight: '500' } }
];

export function getGlobalTypographyPresetById(id) {
  const key = String(id || '').trim();
  return ST_GLOBAL_TYPOGRAPHY_PRESETS.find((p) => p.id === key) || ST_GLOBAL_TYPOGRAPHY_PRESETS[0] || null;
}


// [00699] Готові пресети глобальної щільності. Це не змінює контент,
// структуру, фото або тексти — тільки відступи та проміжки через StyleStore.
export const ST_GLOBAL_SPACING_PRESETS = [
  {
    id: 'density-compact',
    name: 'Компактно',
    group: 'Щільність',
    description: 'Менше повітря для CRM, панелей, каталогів і щільних інтерфейсів.',
    spacing: { densityPresetId: 'density-compact', sectionPaddingY: '14px', sectionPaddingX: '18px', containerPadding: '0px', blockPaddingY: '7px', blockPaddingX: '10px', levelGap: '8px', containerGap: '8px', blockGap: '6px', menuGap: '6px' }
  },
  {
    id: 'density-standard',
    name: 'Стандартно',
    group: 'Щільність',
    description: 'Базова збалансована щільність для більшості сайтів.',
    spacing: { densityPresetId: 'density-standard', sectionPaddingY: '24px', sectionPaddingX: '24px', containerPadding: '0px', blockPaddingY: '10px', blockPaddingX: '14px', levelGap: '14px', containerGap: '12px', blockGap: '8px', menuGap: '8px' }
  },
  {
    id: 'density-spacious',
    name: 'Просторо',
    group: 'Щільність',
    description: 'Більше повітря для лендингів, сервісів і презентаційних блоків.',
    spacing: { densityPresetId: 'density-spacious', sectionPaddingY: '38px', sectionPaddingX: '34px', containerPadding: '4px', blockPaddingY: '14px', blockPaddingX: '18px', levelGap: '22px', containerGap: '18px', blockGap: '12px', menuGap: '12px' }
  },
  {
    id: 'density-premium',
    name: 'Premium',
    group: 'Щільність',
    description: 'Максимально виразний ритм для преміум-секцій і великих композицій.',
    spacing: { densityPresetId: 'density-premium', sectionPaddingY: '56px', sectionPaddingX: '44px', containerPadding: '6px', blockPaddingY: '18px', blockPaddingX: '24px', levelGap: '30px', containerGap: '24px', blockGap: '16px', menuGap: '14px' }
  }
];

export function getGlobalSpacingPresetById(id) {
  const key = String(id || '').trim();
  return ST_GLOBAL_SPACING_PRESETS.find((p) => p.id === key) || ST_GLOBAL_SPACING_PRESETS[1] || ST_GLOBAL_SPACING_PRESETS[0] || null;
}

export function getGlobalDesignPresetById(id) {
  const key = String(id || '').trim();
  return ST_GLOBAL_DESIGN_PRESETS.find((p) => p.id === key) || ST_GLOBAL_DESIGN_PRESETS[0] || null;
}
