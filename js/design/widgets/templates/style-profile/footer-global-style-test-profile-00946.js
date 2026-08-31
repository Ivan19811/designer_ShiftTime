// 00946 Style Profile for the existing Footer "Тест ГЛОБАЛЬНИХ СТИЛІВ · Футер" template.

import {
  assertTemplateStyleProfile00945,
  TEMPLATE_STYLE_PROFILE_VERSION_00945
} from './template-style-profile-contract.js';

const profile00946_ = {
  version: TEMPLATE_STYLE_PROFILE_VERSION_00945,
  profileId: 'footer-global-style-test-profile-00946',
  collectionId: 'global-style-contract-tests',
  templateId: 'footer_test_global_styles_json_v1',
  area: 'footer',
  theme: {
    colors: {
      primary: '#7c3aed',
      accent: '#0369a1',
      surface: '#ffffff',
      surface2: '#f5f3ff',
      text: '#111827',
      muted: '#4b5563',
      border: '#ddd6fe',
      onPrimary: '#ffffff',
      onAccent: '#ffffff',
      onSurface: '#111827',
      onSurface2: '#111827'
    },
    radius: { sm: '12px', md: '14px', lg: '32px', pill: '999px' },
    shadow: {
      soft: '0 32px 90px rgba(15,23,42,.26)',
      md: '0 22px 52px rgba(124,58,237,.22)'
    },
    typography: {
      headingFont: 'Inter, Manrope, Arial, sans-serif',
      textFont: 'Inter, Manrope, Arial, sans-serif',
      h1Size: '36px', h2Size: '30px', h3Size: '28px',
      h4Size: '22px', h5Size: '19px', h6Size: '17px', bodySize: '14px',
      textLineHeight: '1.48', headingLineHeight: '1',
      letterSpacing: '0px', headingLetterSpacing: '0px',
      headingWeight: '950', textWeight: '650',
      headingColor: '#6d28d9', textColor: '#4b5563',
      logoTitleSize: '21px', logoSubtitleSize: '11px',
      logoTitleLineHeight: '1.06', logoSubtitleLineHeight: '1.15',
      logoTitleLetterSpacing: '-.03em', logoSubtitleLetterSpacing: '.08em',
      logoTitleWeight: '900', logoSubtitleWeight: '750',
      logoTitleColor: '#111827', logoSubtitleColor: '#6d28d9'
    },
    spacing: {
      densityPresetId: 'density-standard',
      sectionPaddingY: '30px', sectionPaddingX: '32px', containerPadding: '0px',
      blockPaddingY: '0px', blockPaddingX: '0px',
      levelGap: '14px', containerGap: '10px', blockGap: '8px', menuGap: '8px'
    },
    sections: {
      bg: 'linear-gradient(180deg,#ffffff,#f5f3ff)', altBg: '#4c1d95',
      text: '#111827', altText: '#ffffff',
      borderWidth: '1px', borderColor: 'rgba(124,58,237,.18)',
      radius: '32px', shadow: '0 32px 90px rgba(15,23,42,.26)', overlay: 'none'
    },
    containers: {
      bg: 'transparent', altBg: 'transparent', text: 'inherit', altText: 'inherit',
      borderWidth: '0px', borderColor: 'transparent',
      radius: '0px', shadow: 'none', overlay: 'none'
    },
    blocks: {
      bg: 'transparent', altBg: '#f5f3ff', text: 'inherit', altText: '#111827',
      borderWidth: '0px', borderColor: 'transparent', radius: '14px', shadow: 'none',
      hoverShadow: '0 22px 52px rgba(124,58,237,.20)', hoverLift: '-2px', overlay: 'none',
      headingBg: 'rgba(168,85,247,.12)', headingText: '#a855f7',
      headingBorderWidth: '1px', headingBorderColor: 'rgba(168,85,247,.34)',
      headingRadius: '18px', headingShadow: '0 16px 42px rgba(168,85,247,.18)',
      headingPaddingY: '9px', headingPaddingX: '24px',
      headingFontSize: '28px', headingFontWeight: '950', headingLineHeight: '1',
      headingLetterSpacing: '.12em', headingTextTransform: 'uppercase',
      contactBg: '#7c3aed14', contactText: '#111827',
      contactBorderWidth: '1px', contactBorderColor: 'rgba(255,255,255,.12)',
      contactRadius: '999px', contactShadow: 'none',
      contactPaddingY: '8px', contactPaddingX: '11px', contactGap: '9px',
      contactFontSize: '14px', contactFontWeight: '800', contactLineHeight: '1', contactLetterSpacing: '0px'
    },
    buttons: {
      primaryBg: 'linear-gradient(135deg,#7c3aed,#0369a1)', primaryText: '#ffffff', primaryBorderWidth: '1px', primaryBorderColor: 'rgba(255,255,255,.12)',
      primaryHoverBg: 'linear-gradient(135deg,#6d28d9,#075985)', primaryHoverText: '#ffffff', primaryHoverBorderColor: '#a78bfa',
      primaryActiveBg: '#5b21b6', primaryActiveText: '#ffffff',
      primaryDisabledBg: '#d1d5db', primaryDisabledText: '#374151',
      secondaryBg: '#ffffff', secondaryText: '#6d28d9', secondaryBorderWidth: '1px', secondaryBorderColor: '#8b5cf6',
      secondaryHoverBg: '#f5f3ff', secondaryHoverText: '#5b21b6', secondaryHoverBorderColor: '#7c3aed',
      secondaryActiveBg: '#ede9fe', secondaryActiveText: '#4c1d95',
      ghostBg: '#ffffff', ghostText: '#6d28d9', ghostBorderWidth: '0px', ghostBorderColor: 'transparent',
      ghostHoverBg: '#f5f3ff', ghostHoverText: '#5b21b6', ghostActiveBg: '#ede9fe', ghostActiveText: '#4c1d95',
      iconBg: '#f5f3ff', iconText: '#6d28d9', iconBorderWidth: '1px', iconBorderColor: '#ddd6fe',
      iconHoverBg: '#7c3aed', iconHoverText: '#ffffff', iconActiveBg: '#5b21b6', iconActiveText: '#ffffff',
      radius: '999px', iconRadius: '14px',
      shadow: '0 18px 34px #7c3aed30', hoverShadow: '0 24px 52px rgba(124,58,237,.28)',
      activeShadow: 'inset 0 2px 8px rgba(15,23,42,.22)', disabledOpacity: '.55',
      focusRingColor: '#6d28d9', focusRingWidth: '3px', focusRingOffset: '2px',
      fontSize: '15px', fontWeight: '850', lineHeight: '1.1', letterSpacing: '0px',
      paddingY: '10px', paddingX: '15px', gap: '9px'
    },
    menu: {
      text: '#111827', hoverText: '#5b21b6', activeText: '#ffffff',
      itemBg: '#f5f3ff', hoverBg: '#ede9fe', activeBg: '#6d28d9',
      itemBorderWidth: '1px', itemBorderColor: '#ddd6fe', hoverBorderColor: '#c4b5fd', activeBorderColor: '#6d28d9',
      altText: '#ffffff', altHoverText: '#ffffff', altActiveText: '#ffffff',
      altItemBg: '#4c1d95', altHoverBg: '#6d28d9', altActiveBg: '#075985',
      altItemBorderColor: '#7c3aed', altHoverBorderColor: '#a78bfa', altActiveBorderColor: '#38bdf8',
      radius: '12px', underlineHeight: '2px', underlineOffset: '5px', indicatorStyle: 'background',
      burgerBg: '#f5f3ff', burgerColor: '#6d28d9', burgerRadius: '14px', mobileBg: '#ffffff',
      focusRingColor: '#6d28d9', focusRingWidth: '3px', focusRingOffset: '2px',
      fontSize: '14px', fontWeight: '750', lineHeight: '1.2', letterSpacing: '0px',
      paddingY: '7px', paddingX: '11px'
    },
    links: {
      color: '#6d28d9', hoverColor: '#5b21b6', activeColor: '#4c1d95', visitedColor: '#7e22ce',
      underline: 'none', underlineHover: 'underline', underlineActive: 'underline',
      underlineOffset: '3px', underlineThickness: '1px',
      focusRingColor: '#6d28d9', focusRingWidth: '3px', focusRingOffset: '2px',
      fontSize: '14px', fontWeight: '750', lineHeight: '1.48', letterSpacing: '0px'
    },
    icons: {
      color: '#6d28d9', hoverColor: '#ffffff', activeColor: '#ffffff',
      bg: '#f5f3ff', hoverBg: '#7c3aed', activeBg: '#5b21b6',
      borderWidth: '1px', borderColor: '#ddd6fe', radius: '14px', size: '19px',
      focusRingColor: '#6d28d9', focusRingWidth: '3px', focusRingOffset: '2px',
      logoColor: '#6d28d9', logoBg: '#7c3aed14', logoBorderWidth: '1px',
      logoBorderColor: '#ddd6fe', logoRadius: '14px'
    },
    media: {
      overlay: 'linear-gradient(180deg,rgba(124,58,237,.02),rgba(3,105,161,.24))',
      hoverOverlay: 'linear-gradient(180deg,rgba(124,58,237,.01),rgba(3,105,161,.16))',
      borderWidth: '0px', borderColor: 'transparent', radius: '18px',
      shadow: '0 22px 52px rgba(124,58,237,.18)'
    }
  }
};

export const FOOTER_GLOBAL_STYLE_TEST_PROFILE_00946 = assertTemplateStyleProfile00945(profile00946_, {
  templateId: 'footer_test_global_styles_json_v1',
  area: 'footer'
});
