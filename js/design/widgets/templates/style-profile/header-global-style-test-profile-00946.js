// 00946 test fixture for the existing Header "Тест ГЛОБАЛЬНИХ СТИЛІВ" template.

import {
  assertTemplateStyleProfile00945,
  TEMPLATE_STYLE_PROFILE_VERSION_00945
} from './template-style-profile-contract.js';

const profile00946_ = {
  version: TEMPLATE_STYLE_PROFILE_VERSION_00945,
  profileId: 'header-global-style-test-profile-00946',
  collectionId: 'global-style-contract-tests',
  templateId: 'header_test_global_styles_json_v1',
  area: 'header',
  theme: {
    colors: {
      primary: '#111827',
      accent: '#b45309',
      surface: '#ffffff',
      surface2: '#fff7ed',
      text: '#111827',
      muted: '#475569',
      border: '#fed7aa',
      onPrimary: '#ffffff',
      onAccent: '#ffffff',
      onSurface: '#111827',
      onSurface2: '#111827'
    },
    radius: { sm: '8px', md: '14px', lg: '16px', pill: '999px' },
    shadow: {
      soft: '0 14px 34px rgba(15,23,42,.08)',
      md: '0 18px 38px rgba(180,83,9,.20)'
    },
    typography: {
      headingFont: 'Inter, Manrope, Arial, sans-serif',
      textFont: 'Inter, Manrope, Arial, sans-serif',
      h1Size: '36px', h2Size: '32px', h3Size: '28px',
      h4Size: '24px', h5Size: '20px', h6Size: '17px', bodySize: '13px',
      textLineHeight: '1.2', headingLineHeight: '1',
      letterSpacing: '.01em', headingLetterSpacing: '.01em',
      headingWeight: '950', textWeight: '800',
      headingColor: '#9a3412', textColor: '#111827',
      logoTitleSize: '22px', logoSubtitleSize: '11px',
      logoTitleLineHeight: '1.06', logoSubtitleLineHeight: '1.15',
      logoTitleLetterSpacing: '-.03em', logoSubtitleLetterSpacing: '.08em',
      logoTitleWeight: '900', logoSubtitleWeight: '700',
      logoTitleColor: '#111827', logoSubtitleColor: '#9a3412'
    },
    spacing: {
      densityPresetId: 'density-standard',
      sectionPaddingY: '0px', sectionPaddingX: '0px', containerPadding: '0px',
      blockPaddingY: '0px', blockPaddingX: '0px',
      levelGap: '14px', containerGap: '10px', blockGap: '10px', menuGap: '8px'
    },
    sections: {
      bg: '#ffffff', altBg: '#0b0b0c', text: '#111827', altText: '#f8fafc',
      borderWidth: '0px', borderColor: 'transparent',
      radius: '0px', shadow: '0 14px 34px rgba(15,23,42,.08)', overlay: 'none'
    },
    containers: {
      bg: 'transparent', altBg: 'transparent', text: 'inherit', altText: 'inherit',
      borderWidth: '0px', borderColor: 'transparent',
      radius: '0px', shadow: 'none', overlay: 'none'
    },
    blocks: {
      bg: 'transparent', altBg: '#fff7ed', text: 'inherit', altText: '#111827',
      borderWidth: '0px', borderColor: 'transparent',
      radius: '14px', shadow: 'none',
      hoverShadow: '0 18px 38px rgba(180,83,9,.20)', hoverLift: '-2px', overlay: 'none',
      headingBg: 'rgba(249,115,22,.10)', headingText: '#f97316',
      headingBorderWidth: '1px', headingBorderColor: 'rgba(249,115,22,.32)',
      headingRadius: '16px', headingShadow: '0 14px 38px rgba(249,115,22,.18)',
      headingPaddingY: '8px', headingPaddingX: '22px',
      headingFontSize: '28px', headingFontWeight: '950', headingLineHeight: '1',
      headingLetterSpacing: '.12em', headingTextTransform: 'uppercase',
      contactBg: '#b4530912', contactText: '#111827',
      contactBorderWidth: '1px', contactBorderColor: 'rgba(255,255,255,.10)',
      contactRadius: '999px', contactShadow: 'none',
      contactPaddingY: '6px', contactPaddingX: '12px', contactGap: '10px',
      contactFontSize: '14px', contactFontWeight: '800', contactLineHeight: '1.2', contactLetterSpacing: '0px'
    },
    buttons: {
      primaryBg: 'linear-gradient(135deg, #111827, #b45309)', primaryText: '#ffffff', primaryBorderWidth: '1px', primaryBorderColor: 'rgba(255,255,255,.12)',
      primaryHoverBg: 'linear-gradient(135deg,#0b0b0c,#9a3412)', primaryHoverText: '#ffffff', primaryHoverBorderColor: '#9a3412',
      primaryActiveBg: '#7c2d12', primaryActiveText: '#ffffff',
      primaryDisabledBg: '#d6d3d1', primaryDisabledText: '#44403c',
      secondaryBg: '#ffffff', secondaryText: '#9a3412', secondaryBorderWidth: '1px', secondaryBorderColor: '#b45309',
      secondaryHoverBg: '#fff7ed', secondaryHoverText: '#7c2d12', secondaryHoverBorderColor: '#9a3412',
      secondaryActiveBg: '#ffedd5', secondaryActiveText: '#7c2d12',
      ghostBg: '#ffffff', ghostText: '#111827', ghostBorderWidth: '0px', ghostBorderColor: 'transparent',
      ghostHoverBg: '#fff7ed', ghostHoverText: '#9a3412', ghostActiveBg: '#ffedd5', ghostActiveText: '#7c2d12',
      iconBg: '#fff7ed', iconText: '#9a3412', iconBorderWidth: '1px', iconBorderColor: '#fed7aa',
      iconHoverBg: '#b45309', iconHoverText: '#ffffff', iconActiveBg: '#7c2d12', iconActiveText: '#ffffff',
      radius: '999px', iconRadius: '14px',
      shadow: '0 18px 38px #b4530933', hoverShadow: '0 22px 46px rgba(180,83,9,.28)',
      activeShadow: 'inset 0 2px 8px rgba(15,23,42,.22)', disabledOpacity: '.55',
      focusRingColor: '#9a3412', focusRingWidth: '3px', focusRingOffset: '2px',
      fontSize: '16px', fontWeight: '800', lineHeight: '1.1', letterSpacing: '0px',
      paddingY: '10px', paddingX: '16px', gap: '10px'
    },
    menu: {
      text: '#111827', hoverText: '#7c2d12', activeText: '#7c2d12',
      itemBg: '#ffffff', hoverBg: '#fff7ed', activeBg: '#ffedd5',
      itemBorderWidth: '1px', itemBorderColor: '#ffffff', hoverBorderColor: '#fed7aa', activeBorderColor: '#fdba74',
      altText: '#f8fafc', altHoverText: '#ffffff', altActiveText: '#ffffff',
      altItemBg: '#171717', altHoverBg: '#292524', altActiveBg: '#7c2d12',
      altItemBorderColor: '#292929', altHoverBorderColor: '#b45309', altActiveBorderColor: '#fdba74',
      radius: '999px', underlineHeight: '2px', underlineOffset: '5px', indicatorStyle: 'background',
      burgerBg: '#fff7ed', burgerColor: '#111827', burgerRadius: '14px', mobileBg: '#ffffff',
      focusRingColor: '#9a3412', focusRingWidth: '3px', focusRingOffset: '2px',
      fontSize: '14px', fontWeight: '750', lineHeight: '1.1', letterSpacing: '.01em',
      paddingY: '8px', paddingX: '12px'
    },
    links: {
      color: '#9a3412', hoverColor: '#7c2d12', activeColor: '#431407', visitedColor: '#7c2d12',
      underline: 'none', underlineHover: 'underline', underlineActive: 'underline',
      underlineOffset: '3px', underlineThickness: '1px',
      focusRingColor: '#9a3412', focusRingWidth: '3px', focusRingOffset: '2px',
      fontSize: '13px', fontWeight: '800', lineHeight: '1.2', letterSpacing: '.01em'
    },
    icons: {
      color: '#111827', hoverColor: '#ffffff', activeColor: '#ffffff',
      bg: '#b4530912', hoverBg: '#b45309', activeBg: '#7c2d12',
      borderWidth: '1px', borderColor: '#b4530928', radius: '14px', size: '20px',
      focusRingColor: '#9a3412', focusRingWidth: '3px', focusRingOffset: '2px',
      logoColor: '#b45309', logoBg: '#b4530918', logoBorderWidth: '1px',
      logoBorderColor: 'rgba(148,163,184,.22)', logoRadius: '14px'
    },
    media: {
      overlay: 'linear-gradient(180deg,rgba(17,24,39,.02),rgba(180,83,9,.28))',
      hoverOverlay: 'linear-gradient(180deg,rgba(17,24,39,.01),rgba(180,83,9,.18))',
      borderWidth: '0px', borderColor: 'transparent', radius: '20px',
      shadow: '0 18px 38px rgba(15,23,42,.16)'
    }
  }
};

export const HEADER_GLOBAL_STYLE_TEST_PROFILE_00946 = assertTemplateStyleProfile00945(profile00946_, {
  templateId: 'header_test_global_styles_json_v1',
  area: 'header'
});
