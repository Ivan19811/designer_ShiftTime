// js/design/ai-design/ai-design-tokens.js
// [AI-SITE-GENERATOR-2026][Етап 2.2]
// Професійні дизайн-токени для локального AI Design Engine.
// Файл не залежить від ручного panel-design.js і може безпечно використовуватись тільки AI-панеллю.

export const AI_DESIGN_PRESETS = Object.freeze({
  modern: Object.freeze({
    id: 'modern',
    label: 'Сучасний clean',
    description: 'Світла, чиста SaaS/agency естетика з чіткими CTA і мʼякими тінями.',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#f8fafc,#eef2ff)',
      sectionBg: 'linear-gradient(180deg,#f8fafc,#eef2ff)',
      panel: '#ffffff',
      panelSoft: 'rgba(255,255,255,.82)',
      soft: '#e0f2fe',
      accent: '#2563eb',
      accent2: '#7c3aed',
      heading: '#0f172a',
      text: '#475569',
      muted: '#64748b',
      border: 'rgba(15,23,42,.10)',
      overlay: 'linear-gradient(180deg,rgba(15,23,42,.18),rgba(15,23,42,.32))'
    }),
    typography: Object.freeze({
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
    spacing: Object.freeze({
      sectionY: '68px',
      sectionX: '38px',
      rowGap: '22px',
      blockPad: '26px',
      maxWidth: '1240px'
    }),
    surfaces: Object.freeze({
      radius: '26px',
      radiusLarge: '34px',
      buttonRadius: '999px',
      shadow: '0 24px 76px rgba(15,23,42,.12)',
      softShadow: '0 14px 38px rgba(15,23,42,.10)'
    })
  }),

  premium: Object.freeze({
    id: 'premium',
    label: 'Преміальний natural',
    description: 'Дорогий природний стиль: багато повітря, теплі акценти, спокійна зелень.',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fffaf2,#f4efe5)',
      sectionBg: 'linear-gradient(180deg,#fffaf2,#f4efe5)',
      panel: '#ffffff',
      panelSoft: 'rgba(255,255,255,.84)',
      soft: '#eef5e8',
      accent: '#24451f',
      accent2: '#b7791f',
      heading: '#1f3524',
      text: '#5f6f5f',
      muted: '#6b7a6a',
      border: 'rgba(36,69,31,.13)',
      overlay: 'linear-gradient(180deg,rgba(16,34,19,.30),rgba(16,34,19,.46))'
    }),
    typography: Object.freeze({
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
    spacing: Object.freeze({
      sectionY: '78px',
      sectionX: '42px',
      rowGap: '24px',
      blockPad: '28px',
      maxWidth: '1240px'
    }),
    surfaces: Object.freeze({
      radius: '28px',
      radiusLarge: '38px',
      buttonRadius: '999px',
      shadow: '0 28px 86px rgba(30,52,34,.14)',
      softShadow: '0 16px 42px rgba(30,52,34,.10)'
    })
  }),

  warm: Object.freeze({
    id: 'warm',
    label: 'Теплий / природний',
    description: 'Теплий комерційний стиль для сервісів, локального бізнесу й затишних брендів.',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fff7ed,#fffbeb)',
      sectionBg: 'linear-gradient(180deg,#fff7ed,#fffbeb)',
      panel: '#ffffff',
      panelSoft: 'rgba(255,255,255,.86)',
      soft: '#fed7aa',
      accent: '#ea580c',
      accent2: '#ca8a04',
      heading: '#431407',
      text: '#7c2d12',
      muted: '#9a3412',
      border: 'rgba(154,52,18,.15)',
      overlay: 'linear-gradient(180deg,rgba(67,20,7,.25),rgba(67,20,7,.42))'
    }),
    typography: Object.freeze({
      h1: 'clamp(42px,5vw,70px)',
      h2: 'clamp(34px,3.6vw,52px)',
      h3: '24px',
      body: '17px',
      small: '12px',
      letterSpacing: '-.043em',
      lineHeightTight: '1.03',
      lineHeightBody: '1.74',
      weightStrong: '950'
    }),
    spacing: Object.freeze({
      sectionY: '66px',
      sectionX: '36px',
      rowGap: '20px',
      blockPad: '25px',
      maxWidth: '1220px'
    }),
    surfaces: Object.freeze({
      radius: '25px',
      radiusLarge: '34px',
      buttonRadius: '999px',
      shadow: '0 24px 72px rgba(154,52,18,.14)',
      softShadow: '0 14px 34px rgba(154,52,18,.10)'
    })
  }),

  dark: Object.freeze({
    id: 'dark',
    label: 'Темний контрастний',
    description: 'Контрастний dark hero / tech / premium стиль зі світлим текстом.',
    palette: Object.freeze({
      bg: 'linear-gradient(135deg,#020617,#111827)',
      sectionBg: 'linear-gradient(135deg,#020617,#111827)',
      panel: 'rgba(15,23,42,.84)',
      panelSoft: 'rgba(15,23,42,.72)',
      soft: 'rgba(59,130,246,.18)',
      accent: '#60a5fa',
      accent2: '#a78bfa',
      heading: '#f8fafc',
      text: '#cbd5e1',
      muted: '#94a3b8',
      border: 'rgba(255,255,255,.12)',
      overlay: 'linear-gradient(180deg,rgba(2,6,23,.58),rgba(2,6,23,.74))'
    }),
    typography: Object.freeze({
      h1: 'clamp(44px,5.4vw,76px)',
      h2: 'clamp(35px,3.9vw,56px)',
      h3: '24px',
      body: '17px',
      small: '12px',
      letterSpacing: '-.052em',
      lineHeightTight: '1.02',
      lineHeightBody: '1.76',
      weightStrong: '950'
    }),
    spacing: Object.freeze({
      sectionY: '72px',
      sectionX: '40px',
      rowGap: '22px',
      blockPad: '26px',
      maxWidth: '1240px'
    }),
    surfaces: Object.freeze({
      radius: '28px',
      radiusLarge: '38px',
      buttonRadius: '999px',
      shadow: '0 30px 90px rgba(0,0,0,.28)',
      softShadow: '0 16px 44px rgba(0,0,0,.22)'
    })
  }),

  tech: Object.freeze({
    id: 'tech',
    label: 'Tech / AI',
    description: 'Сучасний технологічний стиль з холодним градієнтом і glow-акцентами.',
    palette: Object.freeze({
      bg: 'radial-gradient(circle at 18% 12%,rgba(79,140,255,.22),transparent 32%),linear-gradient(135deg,#070b18,#111827)',
      sectionBg: 'radial-gradient(circle at 18% 12%,rgba(79,140,255,.22),transparent 32%),linear-gradient(135deg,#070b18,#111827)',
      panel: 'rgba(10,18,35,.84)',
      panelSoft: 'rgba(10,18,35,.70)',
      soft: 'rgba(79,140,255,.16)',
      accent: '#4f8cff',
      accent2: '#22d3ee',
      heading: '#f8fbff',
      text: '#cbd5e1',
      muted: '#94a3b8',
      border: 'rgba(125,211,252,.18)',
      overlay: 'linear-gradient(180deg,rgba(3,7,18,.58),rgba(3,7,18,.76))'
    }),
    typography: Object.freeze({
      h1: 'clamp(44px,5.6vw,78px)',
      h2: 'clamp(35px,3.9vw,56px)',
      h3: '24px',
      body: '17px',
      small: '12px',
      letterSpacing: '-.055em',
      lineHeightTight: '1.01',
      lineHeightBody: '1.75',
      weightStrong: '950'
    }),
    spacing: Object.freeze({
      sectionY: '74px',
      sectionX: '40px',
      rowGap: '22px',
      blockPad: '26px',
      maxWidth: '1240px'
    }),
    surfaces: Object.freeze({
      radius: '28px',
      radiusLarge: '40px',
      buttonRadius: '999px',
      shadow: '0 30px 96px rgba(37,99,235,.22)',
      softShadow: '0 16px 44px rgba(34,211,238,.12)'
    })
  }),

  editorial: Object.freeze({
    id: 'editorial',
    label: 'Editorial luxury',
    description: 'Журнальна композиція: великий заголовок, асиметрія, спокійні premium-відступи.',
    palette: Object.freeze({
      bg: 'linear-gradient(180deg,#fbfaf7,#ece8df)',
      sectionBg: 'linear-gradient(180deg,#fbfaf7,#ece8df)',
      panel: '#fffdf8',
      panelSoft: 'rgba(255,253,248,.86)',
      soft: '#eee7d8',
      accent: '#1f2933',
      accent2: '#a16207',
      heading: '#141414',
      text: '#4b5563',
      muted: '#6b7280',
      border: 'rgba(20,20,20,.12)',
      overlay: 'linear-gradient(180deg,rgba(20,20,20,.24),rgba(20,20,20,.44))'
    }),
    typography: Object.freeze({
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
    spacing: Object.freeze({
      sectionY: '86px',
      sectionX: '46px',
      rowGap: '26px',
      blockPad: '30px',
      maxWidth: '1280px'
    }),
    surfaces: Object.freeze({
      radius: '20px',
      radiusLarge: '44px',
      buttonRadius: '999px',
      shadow: '0 34px 96px rgba(20,20,20,.12)',
      softShadow: '0 16px 44px rgba(20,20,20,.09)'
    })
  })
});

export function getAiDesignPreset(style = 'modern') {
  return AI_DESIGN_PRESETS[style] || AI_DESIGN_PRESETS.modern;
}

export function getAiDesignTheme(style = 'modern') {
  const preset = getAiDesignPreset(style);
  const palette = preset.palette;
  const typography = preset.typography;
  const spacing = preset.spacing;
  const surfaces = preset.surfaces;
  return {
    id: preset.id,
    label: preset.label,
    description: preset.description,
    bg: palette.bg,
    sectionBg: palette.sectionBg,
    panel: palette.panel,
    panelSoft: palette.panelSoft,
    soft: palette.soft,
    accent: palette.accent,
    accent2: palette.accent2,
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

export function getAiDesignPresetOptions() {
  return Object.values(AI_DESIGN_PRESETS).map((preset) => ({
    id: preset.id,
    label: preset.label,
    description: preset.description
  }));
}
