// 00946 Style Profile for the existing Main "Маїн · Дві картки" template.

import {
  assertTemplateStyleProfile00945,
  TEMPLATE_STYLE_PROFILE_VERSION_00945
} from './template-style-profile-contract.js';

const profile00946_ = {
  version: TEMPLATE_STYLE_PROFILE_VERSION_00945,
  profileId: 'main-selection-cards-profile-00946',
  collectionId: 'global-style-contract-tests',
  templateId: 'main_selection_cards_00888',
  area: 'main',
  theme: {
    colors: {
      primary: '#312e81',
      accent: '#0f766e',
      surface: '#ffffff',
      surface2: '#eef2ff',
      text: '#0f172a',
      muted: '#475569',
      border: '#cbd5e1',
      onPrimary: '#ffffff',
      onAccent: '#ffffff',
      onSurface: '#0f172a',
      onSurface2: '#0f172a'
    },
    radius: { sm: '8px', md: '14px', lg: '18px', pill: '999px' },
    shadow: {
      soft: '0 14px 34px rgba(49,46,129,.12)',
      md: '0 20px 46px rgba(15,118,110,.18)'
    },
    typography: {
      headingFont: 'Inter, Manrope, Arial, sans-serif',
      textFont: 'Inter, Manrope, Arial, sans-serif',
      h1Size: '36px', h2Size: '30px', h3Size: '22px',
      h4Size: '20px', h5Size: '18px', h6Size: '16px', bodySize: '14px',
      textLineHeight: '1.55', headingLineHeight: '1.15',
      letterSpacing: '0px', headingLetterSpacing: '0px',
      headingWeight: '800', textWeight: '650',
      headingColor: '#312e81', textColor: '#475569',
      logoTitleSize: '22px', logoSubtitleSize: '11px',
      logoTitleLineHeight: '1.06', logoSubtitleLineHeight: '1.15',
      logoTitleLetterSpacing: '-.03em', logoSubtitleLetterSpacing: '.08em',
      logoTitleWeight: '900', logoSubtitleWeight: '700',
      logoTitleColor: '#0f172a', logoSubtitleColor: '#0f766e'
    },
    spacing: {
      densityPresetId: 'density-standard',
      sectionPaddingY: '32px', sectionPaddingX: '32px', containerPadding: '24px',
      blockPaddingY: '0px', blockPaddingX: '0px',
      levelGap: '20px', containerGap: '20px', blockGap: '10px', menuGap: '8px'
    },
    sections: {
      bg: 'linear-gradient(135deg,#f8fafc,#eef2ff)', altBg: '#312e81',
      text: '#0f172a', altText: '#ffffff',
      borderWidth: '1px', borderColor: 'rgba(99,102,241,.18)',
      radius: '18px', shadow: 'none', overlay: 'none'
    },
    containers: {
      bg: '#ffffff', altBg: '#eef2ff', text: '#0f172a', altText: '#0f172a',
      borderWidth: '1px', borderColor: 'rgba(148,163,184,.35)',
      radius: '14px', shadow: 'none', overlay: 'none'
    },
    blocks: {
      bg: 'transparent', altBg: '#eef2ff', text: 'inherit', altText: '#0f172a',
      borderWidth: '0px', borderColor: 'transparent', radius: '0px', shadow: 'none',
      hoverShadow: '0 20px 46px rgba(49,46,129,.16)', hoverLift: '-2px', overlay: 'none',
      headingBg: 'transparent', headingText: '#312e81',
      headingBorderWidth: '0px', headingBorderColor: 'transparent',
      headingRadius: '0px', headingShadow: 'none',
      headingPaddingY: '0px', headingPaddingX: '0px',
      headingFontSize: '22px', headingFontWeight: '800', headingLineHeight: '1.15',
      headingLetterSpacing: '0px', headingTextTransform: 'none',
      contactBg: '#eef2ff', contactText: '#0f172a',
      contactBorderWidth: '1px', contactBorderColor: '#c7d2fe',
      contactRadius: '999px', contactShadow: 'none',
      contactPaddingY: '8px', contactPaddingX: '12px', contactGap: '9px',
      contactFontSize: '14px', contactFontWeight: '700', contactLineHeight: '1.2', contactLetterSpacing: '0px'
    },
    buttons: {
      primaryBg: 'linear-gradient(135deg,#312e81,#0f766e)', primaryText: '#ffffff', primaryBorderWidth: '1px', primaryBorderColor: '#312e81',
      primaryHoverBg: '#0f766e', primaryHoverText: '#ffffff', primaryHoverBorderColor: '#0f766e',
      primaryActiveBg: '#134e4a', primaryActiveText: '#ffffff',
      primaryDisabledBg: '#cbd5e1', primaryDisabledText: '#334155',
      secondaryBg: '#ffffff', secondaryText: '#312e81', secondaryBorderWidth: '1px', secondaryBorderColor: '#6366f1',
      secondaryHoverBg: '#eef2ff', secondaryHoverText: '#312e81', secondaryHoverBorderColor: '#4f46e5',
      secondaryActiveBg: '#e0e7ff', secondaryActiveText: '#312e81',
      ghostBg: '#ffffff', ghostText: '#312e81', ghostBorderWidth: '0px', ghostBorderColor: 'transparent',
      ghostHoverBg: '#eef2ff', ghostHoverText: '#312e81', ghostActiveBg: '#ccfbf1', ghostActiveText: '#134e4a',
      iconBg: '#eef2ff', iconText: '#312e81', iconBorderWidth: '1px', iconBorderColor: '#c7d2fe',
      iconHoverBg: '#0f766e', iconHoverText: '#ffffff', iconActiveBg: '#312e81', iconActiveText: '#ffffff',
      radius: '14px', iconRadius: '14px',
      shadow: '0 14px 34px rgba(49,46,129,.14)', hoverShadow: '0 20px 46px rgba(15,118,110,.20)',
      activeShadow: 'inset 0 2px 8px rgba(15,23,42,.22)', disabledOpacity: '.55',
      focusRingColor: '#0f766e', focusRingWidth: '3px', focusRingOffset: '2px',
      fontSize: '14px', fontWeight: '800', lineHeight: '1.1', letterSpacing: '0px',
      paddingY: '10px', paddingX: '16px', gap: '9px'
    },
    menu: {
      text: '#312e81', hoverText: '#115e59', activeText: '#ffffff',
      itemBg: '#ffffff', hoverBg: '#ccfbf1', activeBg: '#312e81',
      itemBorderWidth: '1px', itemBorderColor: '#c7d2fe', hoverBorderColor: '#5eead4', activeBorderColor: '#312e81',
      altText: '#ffffff', altHoverText: '#ffffff', altActiveText: '#ffffff',
      altItemBg: '#312e81', altHoverBg: '#0f766e', altActiveBg: '#134e4a',
      altItemBorderColor: '#6366f1', altHoverBorderColor: '#5eead4', altActiveBorderColor: '#2dd4bf',
      radius: '14px', underlineHeight: '2px', underlineOffset: '5px', indicatorStyle: 'background',
      burgerBg: '#eef2ff', burgerColor: '#312e81', burgerRadius: '14px', mobileBg: '#ffffff',
      focusRingColor: '#0f766e', focusRingWidth: '3px', focusRingOffset: '2px',
      fontSize: '14px', fontWeight: '750', lineHeight: '1.2', letterSpacing: '0px',
      paddingY: '8px', paddingX: '12px'
    },
    links: {
      color: '#312e81', hoverColor: '#0f766e', activeColor: '#134e4a', visitedColor: '#4338ca',
      underline: 'none', underlineHover: 'underline', underlineActive: 'underline',
      underlineOffset: '3px', underlineThickness: '1px',
      focusRingColor: '#0f766e', focusRingWidth: '3px', focusRingOffset: '2px',
      fontSize: '14px', fontWeight: '700', lineHeight: '1.55', letterSpacing: '0px'
    },
    icons: {
      color: '#312e81', hoverColor: '#ffffff', activeColor: '#ffffff',
      bg: '#eef2ff', hoverBg: '#0f766e', activeBg: '#312e81',
      borderWidth: '1px', borderColor: '#c7d2fe', radius: '14px', size: '20px',
      focusRingColor: '#0f766e', focusRingWidth: '3px', focusRingOffset: '2px',
      logoColor: '#0f766e', logoBg: '#ccfbf1', logoBorderWidth: '1px',
      logoBorderColor: '#99f6e4', logoRadius: '14px'
    },
    media: {
      overlay: 'linear-gradient(180deg,rgba(49,46,129,.02),rgba(15,118,110,.24))',
      hoverOverlay: 'linear-gradient(180deg,rgba(49,46,129,.01),rgba(15,118,110,.16))',
      borderWidth: '0px', borderColor: 'transparent', radius: '14px',
      shadow: '0 20px 46px rgba(49,46,129,.18)'
    }
  }
};

export const MAIN_SELECTION_CARDS_PROFILE_00946 = assertTemplateStyleProfile00945(profile00946_, {
  templateId: 'main_selection_cards_00888',
  area: 'main'
});
