import { HEADER_GLOBAL_STYLE_TEST_PROFILE_00946 } from '../style-profile/header-global-style-test-profile-00946.js';
import { SCHOOL_01_HEADER_TEMPLATE_00957 } from './school-01-header-template-00957.js?v=00957';
import { SHIFTTIME_MARKETPLACE_01_HEADER_TEMPLATE_00981 } from './shifttime-marketplace-01-header-template-00981.js?v=00981';
import { SHIFTTIME_MARKETPLACE_02_HEADER_TEMPLATE_00984 } from './shifttime-marketplace-02-header-template-00984.js?v=00984';
import { PAIRED_HEADER_TEMPLATES_00978 } from './paired-header-templates-00978.js?v=00980';
import { STANDALONE_PREMIUM_HEADER_TEMPLATES_00979 } from './standalone-premium-header-templates-00979.js?v=00980';
// js/design/widgets/templates/header/header-templates.js
// =======================================================
// [00955]
// Canonical JSON model for the retained Global Design contract template.
// The working template is built directly from this model without retarget adapters.
// =======================================================


function stHfEscapeAttr00545_(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stHfEscapeText00545_(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stHfRenderModelNode00545_(node) {
  if (!node) return '';
  if (node.type === 'text') return stHfEscapeText00545_(node.text || '');
  // [00856] section-group is a technical JSON root for multiple real header sections.
  // It is not rendered as an extra DOM wrapper: only its real .st-section children are rendered.
  if (node.type === 'section-group') {
    return Array.isArray(node.children) ? node.children.map(stHfRenderModelNode00545_).join('') : '';
  }
  const tag = String(node.tag || 'div').toLowerCase();
  const attrs = { ...(node.attrs || {}) };
  if (node.styleText != null) attrs.style = String(node.styleText);
  const attrText = Object.entries(attrs)
    .filter(([key]) => key)
    .map(([key, val]) => {
      if (val === true || val === '') return ` ${key}`;
      return ` ${key}="${stHfEscapeAttr00545_(val)}"`;
    })
    .join('');
  const children = Array.isArray(node.children)
    ? node.children.map(stHfRenderModelNode00545_).join('')
    : '';
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  if (voidTags.has(tag)) return `<${tag}${attrText}>`;
  return `<${tag}${attrText}>${children}</${tag}>`;
}

function renderHfTemplateModelToHtml00545_(model) {
  return stHfRenderModelNode00545_(model?.root);
}


const HEADER_TEST_GLOBAL_STYLES_MODEL_RAW_00955 = {
  "version": "st-hf-json-v1",
  "schema": "section-level-container-block-dom-v1",
  "scope": "header",
  "templateId": "header_test_global_styles_json_v1",
  "sourcePolicy": "JSON_MODEL_IS_SOURCE_OF_TRUTH_FOR_GLOBAL_STYLES_TEST_00955",
  "renderPolicy": "DOM is rendered from this model; existing UI/widgets must edit model nodes by data-node-id.",
  "root": {
    "type": "section",
    "tag": "section",
    "attrs": {
      "class": "st-section",
      "data-sec-role": "header",
      "data-hf-json-template": "1",
      "data-hf-template-id": "header_test_global_styles_json_v1",
      "data-node-id": "header_gd_section_001",
      "data-hf-node-type": "section"
    },
    "id": "header_gd_section_001",
    "styleText": "width:100%;box-sizing:border-box;overflow:visible;padding:0;border-radius:0;margin:0;background:#ffffff;border:0;box-shadow:0 14px 34px rgba(15,23,42,.08);color:#111827;",
    "style": {
      "width": "100%",
      "box-sizing": "border-box",
      "overflow": "visible",
      "padding": "0",
      "border-radius": "0",
      "margin": "0",
      "background": "#ffffff",
      "border": "0",
      "box-shadow": "0 14px 34px rgba(15,23,42,.08)",
      "color": "#111827"
    },
    "children": [
      {
        "type": "level",
        "tag": "div",
        "attrs": {
          "class": "st-row",
          "data-layout-mode": "fr",
          "data-layout-orient": "row",
          "data-st-node": "level",
          "data-hf-test-level": "00",
          "data-node-id": "header_gd_level_001",
          "data-hf-node-type": "level",
          "data-hf-template-id": "header_test_global_styles_json_v1"
        },
        "id": "header_gd_level_001",
        "styleText": "display:grid;grid-template-columns:1fr;align-items:center;gap:12px;width:100%;min-height:54px;box-sizing:border-box;overflow:visible;padding:6px 0;margin:0;",
        "style": {
          "display": "grid",
          "grid-template-columns": "1fr",
          "align-items": "center",
          "gap": "12px",
          "width": "100%",
          "min-height": "54px",
          "box-sizing": "border-box",
          "overflow": "visible",
          "padding": "6px 0",
          "margin": "0"
        },
        "children": [
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-layout-mode": "flex",
              "data-layout-orient": "row",
              "data-name": "Global style source container",
              "data-st-node": "container",
              "data-hf-test-container": "00",
              "data-node-id": "header_gd_container_001",
              "data-hf-node-type": "container",
              "data-hf-template-id": "header_test_global_styles_json_v1"
            },
            "id": "header_gd_container_001",
            "styleText": "min-height:48px;width:100%;max-width:100%;min-width:0;flex:1 1 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:center;gap:10px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "48px",
              "width": "100%",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1 1 auto",
              "display": "flex",
              "flex-direction": "row",
              "flex-wrap": "nowrap",
              "align-items": "center",
              "justify-content": "center",
              "gap": "10px",
              "background": "transparent",
              "border": "0",
              "overflow": "visible",
              "padding": "0",
              "box-sizing": "border-box"
            },
            "children": [
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--text st-block--heading",
                  "data-block-kind": "text",
                  "data-block-role": "heading",
                  "data-hb-tip": "TEST heading",
                  "data-name": "ТЕСТ",
                  "data-hf-test-block": "00",
                  "data-st-text-flow": "nowrap",
                  "data-node-id": "header_gd_block_001",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_001",
                "styleText": "width:auto;min-width:max-content;max-width:100%;min-height:42px;display:flex;align-items:center;justify-content:center;background:rgba(249,115,22,.10);border:1px solid rgba(249,115,22,.32);border-radius:16px;overflow:visible;color:#f97316;padding:8px 22px;box-sizing:border-box;font-size:28px;font-weight:950;letter-spacing:.12em;line-height:1;text-transform:uppercase;box-shadow:0 14px 38px rgba(249,115,22,.18);",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "max-width": "100%",
                  "min-height": "42px",
                  "display": "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "background": "rgba(249,115,22,.10)",
                  "border": "1px solid rgba(249,115,22,.32)",
                  "border-radius": "16px",
                  "overflow": "visible",
                  "color": "#f97316",
                  "padding": "8px 22px",
                  "box-sizing": "border-box",
                  "font-size": "28px",
                  "font-weight": "950",
                  "letter-spacing": ".12em",
                  "line-height": "1",
                  "text-transform": "uppercase",
                  "box-shadow": "0 14px 38px rgba(249,115,22,.18)"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit st-heading__text",
                      "contenteditable": "true",
                      "data-st-text-target": "1",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "display:block;width:auto;max-width:100%;min-width:0;min-height:0;height:auto;padding:0;border:0;line-height:inherit;color:inherit;white-space:nowrap;word-break:normal;overflow-wrap:normal;box-sizing:border-box;",
                    "style": {
                      "display": "block",
                      "width": "auto",
                      "max-width": "100%",
                      "min-width": "0",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0",
                      "line-height": "inherit",
                      "color": "inherit",
                      "white-space": "nowrap",
                      "word-break": "normal",
                      "overflow-wrap": "normal",
                      "box-sizing": "border-box"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Тест ГЛОБАЛЬНИХ СТИЛІВ"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "level",
        "tag": "div",
        "attrs": {
          "class": "st-row",
          "data-layout-mode": "fr",
          "data-layout-orient": "row",
          "data-st-node": "level",
          "data-node-id": "header_gd_level_002",
          "data-hf-node-type": "level",
          "data-hf-template-id": "header_test_global_styles_json_v1"
        },
        "id": "header_gd_level_002",
        "styleText": "display:grid;grid-template-columns:max-content minmax(220px,1fr) max-content;align-items:center;gap:14px;width:100%;min-height:58px;box-sizing:border-box;overflow:visible;min-height:34px;padding:0 18px;background:transparent;border-bottom:1px solid rgba(15,23,42,.08);",
        "style": {
          "display": "grid",
          "grid-template-columns": "max-content minmax(220px,1fr) max-content",
          "align-items": "center",
          "gap": "14px",
          "width": "100%",
          "min-height": "34px",
          "box-sizing": "border-box",
          "overflow": "visible",
          "padding": "0 18px",
          "background": "transparent",
          "border-bottom": "1px solid rgba(15,23,42,.08)"
        },
        "children": [
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-layout-mode": "flex",
              "data-layout-orient": "row",
              "data-name": "Верхні посилання",
              "data-st-node": "container",
              "data-node-id": "header_gd_container_002",
              "data-hf-node-type": "container",
              "data-hf-template-id": "header_test_global_styles_json_v1"
            },
            "id": "header_gd_container_002",
            "styleText": "min-height:58px;width:100%;max-width:100%;min-width:0;flex:0 1 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:10px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "58px",
              "width": "100%",
              "max-width": "100%",
              "min-width": "0",
              "flex": "0 1 auto",
              "display": "flex",
              "flex-direction": "row",
              "flex-wrap": "nowrap",
              "align-items": "center",
              "justify-content": "flex-start",
              "gap": "10px",
              "background": "transparent",
              "border": "0",
              "overflow": "visible",
              "padding": "0",
              "box-sizing": "border-box"
            },
            "children": [
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--text",
                  "data-block-kind": "text",
                  "data-hb-tip": "Текст",
                  "data-name": "Текст",
                  "data-st-text-flow": "nowrap",
                  "data-node-id": "header_gd_block_002",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_002",
                "styleText": "width:auto;min-width:max-content;max-width:100%;min-height:34px;background:transparent;border:0;overflow:visible;flex:0 0 auto;box-sizing:border-box;font-size:13px;font-weight:800;letter-spacing:.01em;line-height:1.2;color:#111827;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "max-width": "100%",
                  "min-height": "34px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "font-size": "13px",
                  "font-weight": "800",
                  "letter-spacing": ".01em",
                  "line-height": "1.2",
                  "color": "#111827"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit",
                      "contenteditable": "true",
                      "data-st-text-flow": "nowrap",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "display:block;width:auto;min-width:0;min-height:0;height:auto;padding:0;border:0;white-space:nowrap;word-break:normal;overflow-wrap:normal;line-height:inherit;box-sizing:border-box;",
                    "style": {
                      "display": "block",
                      "width": "auto",
                      "min-width": "0",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0",
                      "white-space": "nowrap",
                      "word-break": "normal",
                      "overflow-wrap": "normal",
                      "line-height": "inherit",
                      "box-sizing": "border-box"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Про нас · Оплата · Контакти"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-layout-mode": "flex",
              "data-layout-orient": "row",
              "data-name": "Верхній текст",
              "data-st-node": "container",
              "data-node-id": "header_gd_container_003",
              "data-hf-node-type": "container",
              "data-hf-template-id": "header_test_global_styles_json_v1"
            },
            "id": "header_gd_container_003",
            "styleText": "min-height:58px;width:100%;max-width:100%;min-width:0;flex:0 1 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:center;gap:10px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "58px",
              "width": "100%",
              "max-width": "100%",
              "min-width": "0",
              "flex": "0 1 auto",
              "display": "flex",
              "flex-direction": "row",
              "flex-wrap": "nowrap",
              "align-items": "center",
              "justify-content": "center",
              "gap": "10px",
              "background": "transparent",
              "border": "0",
              "overflow": "visible",
              "padding": "0",
              "box-sizing": "border-box"
            },
            "children": [
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--text",
                  "data-block-kind": "text",
                  "data-hb-tip": "Текст",
                  "data-name": "Текст",
                  "data-st-text-flow": "nowrap",
                  "data-node-id": "header_gd_block_003",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_003",
                "styleText": "width:auto;min-width:max-content;max-width:100%;min-height:34px;background:transparent;border:0;overflow:visible;flex:0 0 auto;box-sizing:border-box;font-size:13px;font-weight:800;letter-spacing:.01em;line-height:1.2;color:#111827;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "max-width": "100%",
                  "min-height": "34px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "font-size": "13px",
                  "font-weight": "800",
                  "letter-spacing": ".01em",
                  "line-height": "1.2",
                  "color": "#111827"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit",
                      "contenteditable": "true",
                      "data-st-text-flow": "nowrap",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "display:block;width:auto;min-width:0;min-height:0;height:auto;padding:0;border:0;white-space:nowrap;word-break:normal;overflow-wrap:normal;line-height:inherit;box-sizing:border-box;",
                    "style": {
                      "display": "block",
                      "width": "auto",
                      "min-width": "0",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0",
                      "white-space": "nowrap",
                      "word-break": "normal",
                      "overflow-wrap": "normal",
                      "line-height": "inherit",
                      "box-sizing": "border-box"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Безкоштовна доставка від 2000 ₴"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-layout-mode": "flex",
              "data-layout-orient": "row",
              "data-name": "Акаунт",
              "data-st-node": "container",
              "data-node-id": "header_gd_container_004",
              "data-hf-node-type": "container",
              "data-hf-template-id": "header_test_global_styles_json_v1"
            },
            "id": "header_gd_container_004",
            "styleText": "min-height:58px;width:100%;max-width:100%;min-width:0;flex:0 1 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-end;gap:10px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "58px",
              "width": "100%",
              "max-width": "100%",
              "min-width": "0",
              "flex": "0 1 auto",
              "display": "flex",
              "flex-direction": "row",
              "flex-wrap": "nowrap",
              "align-items": "center",
              "justify-content": "flex-end",
              "gap": "10px",
              "background": "transparent",
              "border": "0",
              "overflow": "visible",
              "padding": "0",
              "box-sizing": "border-box"
            },
            "children": [
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--text",
                  "data-block-kind": "text",
                  "data-hb-tip": "Текст",
                  "data-name": "Текст",
                  "data-st-text-flow": "nowrap",
                  "data-node-id": "header_gd_block_004",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_004",
                "styleText": "width:auto;min-width:max-content;max-width:100%;min-height:34px;background:transparent;border:0;overflow:visible;flex:0 0 auto;box-sizing:border-box;font-size:13px;font-weight:800;letter-spacing:.01em;line-height:1.2;color:#111827;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "max-width": "100%",
                  "min-height": "34px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "font-size": "13px",
                  "font-weight": "800",
                  "letter-spacing": ".01em",
                  "line-height": "1.2",
                  "color": "#111827"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit",
                      "contenteditable": "true",
                      "data-st-text-flow": "nowrap",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "display:block;width:auto;min-width:0;min-height:0;height:auto;padding:0;border:0;white-space:nowrap;word-break:normal;overflow-wrap:normal;line-height:inherit;box-sizing:border-box;",
                    "style": {
                      "display": "block",
                      "width": "auto",
                      "min-width": "0",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0",
                      "white-space": "nowrap",
                      "word-break": "normal",
                      "overflow-wrap": "normal",
                      "line-height": "inherit",
                      "box-sizing": "border-box"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Укр · Вхід / Реєстрація"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "level",
        "tag": "div",
        "attrs": {
          "class": "st-row",
          "data-layout-mode": "fr",
          "data-layout-orient": "row",
          "data-st-node": "level",
          "data-node-id": "header_gd_level_003",
          "data-hf-node-type": "level",
          "data-hf-template-id": "header_test_global_styles_json_v1"
        },
        "id": "header_gd_level_003",
        "styleText": "display:grid;grid-template-columns:minmax(190px,0.20fr) minmax(360px,1fr) max-content;align-items:center;gap:14px;width:100%;min-height:58px;box-sizing:border-box;overflow:visible;min-height:78px;padding:10px 18px;background:#fff;",
        "style": {
          "display": "grid",
          "grid-template-columns": "minmax(190px,0.20fr) minmax(360px,1fr) max-content",
          "align-items": "center",
          "gap": "14px",
          "width": "100%",
          "min-height": "78px",
          "box-sizing": "border-box",
          "overflow": "visible",
          "padding": "10px 18px",
          "background": "#fff"
        },
        "children": [
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-layout-mode": "flex",
              "data-layout-orient": "row",
              "data-name": "Блок Лого",
              "data-st-node": "container",
              "data-node-id": "header_gd_container_005",
              "data-hf-node-type": "container",
              "data-hf-template-id": "header_test_global_styles_json_v1"
            },
            "id": "header_gd_container_005",
            "styleText": "min-height:58px;width:100%;max-width:100%;min-width:0;flex:0 0 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:10px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "58px",
              "width": "100%",
              "max-width": "100%",
              "min-width": "0",
              "flex": "0 0 auto",
              "display": "flex",
              "flex-direction": "row",
              "flex-wrap": "nowrap",
              "align-items": "center",
              "justify-content": "flex-start",
              "gap": "10px",
              "background": "transparent",
              "border": "0",
              "overflow": "visible",
              "padding": "0",
              "box-sizing": "border-box"
            },
            "children": [
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--text st-block--logo",
                  "data-block-kind": "text",
                  "data-block-role": "logo",
                  "data-hb-tip": "Лого",
                  "data-logo-align": "center",
                  "data-logo-click-area": "all",
                  "data-logo-fit": "contain",
                  "data-logo-gap": "11",
                  "data-logo-icon-color": "#b45309",
                  "data-logo-image-name": "",
                  "data-logo-image-url": "",
                  "data-logo-link-mode": "home",
                  "data-logo-mark-height": "42",
                  "data-logo-mark-width": "42",
                  "data-logo-mode": "logo-text-subtitle",
                  "data-logo-pos": "left",
                  "data-logo-source": "icon",
                  "data-logo-subtitle-size": "11",
                  "data-logo-title-size": "22",
                  "data-name": "Лого",
                  "data-st-text-flow": "nowrap",
                  "data-node-id": "header_gd_block_005",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_005",
                "styleText": "width:auto;min-width:max-content;min-height:44px;display:grid;grid-template-columns:auto auto;grid-template-rows:auto auto;align-items:center;column-gap:11px;row-gap:2px;background:transparent;border:0;overflow:visible;color:#111827;--st-logo-mark-w:42px;--st-logo-mark-h:42px;--st-logo-gap:11px;--st-logo-icon-size-local:22px;--st-icon-bg:#b4530918;--st-icon-radius:14px;--st-icon-pad-y:9px;--st-icon-pad-x:9px;--st-icon-shadow:0 0 28px #b4530942;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "min-height": "44px",
                  "display": "grid",
                  "grid-template-columns": "auto auto",
                  "grid-template-rows": "auto auto",
                  "align-items": "center",
                  "column-gap": "11px",
                  "row-gap": "2px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "color": "#111827",
                  "--st-logo-mark-w": "42px",
                  "--st-logo-mark-h": "42px",
                  "--st-logo-gap": "11px",
                  "--st-logo-icon-size-local": "22px",
                  "--st-icon-bg": "#b4530918",
                  "--st-icon-radius": "14px",
                  "--st-icon-pad-y": "9px",
                  "--st-icon-pad-x": "9px",
                  "--st-icon-shadow": "0 0 28px #b4530942"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-logo__mark",
                      "data-logo-mark": "1",
                      "hidden": ""
                    },
                    "styleText": "grid-column:1;grid-row:1 / span 2;width:42px;height:42px;display:grid;place-items:center;border-radius:14px;border:1px solid rgba(148,163,184,.22);background:#b4530918;overflow:hidden;position:relative;",
                    "style": {
                      "grid-column": "1",
                      "grid-row": "1 / span 2",
                      "width": "42px",
                      "height": "42px",
                      "display": "grid",
                      "place-items": "center",
                      "border-radius": "14px",
                      "border": "1px solid rgba(148,163,184,.22)",
                      "background": "#b4530918",
                      "overflow": "hidden",
                      "position": "relative"
                    },
                    "children": [
                      {
                        "type": "element",
                        "tag": "span",
                        "attrs": {
                          "aria-hidden": "true",
                          "class": "st-logo__markimg"
                        },
                        "styleText": "",
                        "style": {}
                      }
                    ]
                  },
                  {
                    "type": "element",
                    "tag": "button",
                    "attrs": {
                      "aria-label": "Logo icon",
                      "class": "st-logo__iconbtn",
                      "type": "button"
                    },
                    "styleText": "grid-column:1;grid-row:1 / span 2;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border:1px solid rgba(148,163,184,.22);border-radius:14px;background:#b4530918;color:#b45309;padding:9px;",
                    "style": {
                      "grid-column": "1",
                      "grid-row": "1 / span 2",
                      "display": "inline-flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "width": "42px",
                      "height": "42px",
                      "border": "1px solid rgba(148,163,184,.22)",
                      "border-radius": "14px",
                      "background": "#b4530918",
                      "color": "#b45309",
                      "padding": "9px"
                    },
                    "children": [
                      {
                        "type": "element",
                        "tag": "span",
                        "attrs": {
                          "class": "st-logo__iconsvg"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "svg",
                            "attrs": {
                              "aria-hidden": "true",
                              "fill": "none",
                              "stroke": "currentColor",
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              "viewbox": "0 0 24 24"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "circle",
                                "attrs": {
                                  "cx": "8",
                                  "cy": "21",
                                  "r": "1"
                                }
                              },
                              {
                                "type": "element",
                                "tag": "circle",
                                "attrs": {
                                  "cx": "19",
                                  "cy": "21",
                                  "r": "1"
                                }
                              },
                              {
                                "type": "element",
                                "tag": "path",
                                "attrs": {
                                  "d": "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h8.78a2 2 0 0 0 2-1.58l1.65-7.43H5.12"
                                }
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit st-logo__title",
                      "contenteditable": "true",
                      "data-logo-title": "1",
                      "data-st-text-flow": "nowrap",
                      "data-st-text-target": "1",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "grid-column:2;grid-row:1;font-size:22px;line-height:1.06;font-weight:900;letter-spacing:-.03em;color:#111827;white-space:nowrap;",
                    "style": {
                      "grid-column": "2",
                      "grid-row": "1",
                      "font-size": "22px",
                      "line-height": "1.06",
                      "font-weight": "900",
                      "letter-spacing": "-.03em",
                      "color": "#111827",
                      "white-space": "nowrap"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "ShiftTime"
                      }
                    ]
                  },
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit st-logo__subtitle",
                      "contenteditable": "true",
                      "data-logo-subtitle": "1",
                      "data-st-text-flow": "nowrap",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "grid-column:2;grid-row:2;font-size:11px;line-height:1.15;font-weight:700;color:#b45309;opacity:.92;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;",
                    "style": {
                      "grid-column": "2",
                      "grid-row": "2",
                      "font-size": "11px",
                      "line-height": "1.15",
                      "font-weight": "700",
                      "color": "#b45309",
                      "opacity": ".92",
                      "letter-spacing": ".08em",
                      "text-transform": "uppercase",
                      "white-space": "nowrap"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Premium shop"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-layout-mode": "flex",
              "data-layout-orient": "row",
              "data-name": "Пошук і меню",
              "data-st-node": "container",
              "data-node-id": "header_gd_container_006",
              "data-hf-node-type": "container",
              "data-hf-template-id": "header_test_global_styles_json_v1"
            },
            "id": "header_gd_container_006",
            "styleText": "min-height:58px;width:100%;max-width:100%;min-width:0;flex:1 1 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:center;gap:10px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "58px",
              "width": "100%",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1 1 auto",
              "display": "flex",
              "flex-direction": "row",
              "flex-wrap": "nowrap",
              "align-items": "center",
              "justify-content": "center",
              "gap": "10px",
              "background": "transparent",
              "border": "0",
              "overflow": "visible",
              "padding": "0",
              "box-sizing": "border-box"
            },
            "children": [
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--text",
                  "data-block-kind": "text",
                  "data-hb-tip": "Пошук",
                  "data-name": "Пошук",
                  "data-node-id": "header_gd_block_006",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_006",
                "styleText": "width:auto;min-width:0;max-width:100%;min-height:42px;display:flex;flex:1 1 280px;align-items:center;border:1px solid rgba(15,23,42,.13);border-radius:999px;padding:10px 16px;background:#fff;color:#94a3b8;box-shadow:inset 0 1px 0 rgba(255,255,255,.65);overflow:hidden;box-sizing:border-box;",
                "style": {
                  "width": "auto",
                  "min-width": "0",
                  "max-width": "100%",
                  "min-height": "42px",
                  "display": "flex",
                  "flex": "1 1 280px",
                  "align-items": "center",
                  "border": "1px solid rgba(15,23,42,.13)",
                  "border-radius": "999px",
                  "padding": "10px 16px",
                  "background": "#fff",
                  "color": "#94a3b8",
                  "box-shadow": "inset 0 1px 0 rgba(255,255,255,.65)",
                  "overflow": "hidden",
                  "box-sizing": "border-box"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit",
                      "contenteditable": "true",
                      "data-st-text-flow": "clip",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "display:block;width:100%;min-width:0;min-height:0;height:auto;padding:0;border:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;word-break:normal;overflow-wrap:normal;line-height:1.2;box-sizing:border-box;",
                    "style": {
                      "display": "block",
                      "width": "100%",
                      "min-width": "0",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0",
                      "white-space": "nowrap",
                      "overflow": "hidden",
                      "text-overflow": "ellipsis",
                      "word-break": "normal",
                      "overflow-wrap": "normal",
                      "line-height": "1.2",
                      "box-sizing": "border-box"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Пошук товарів...        Усі категорії"
                      }
                    ]
                  }
                ]
              },
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--menu",
                  "data-block-kind": "menu",
                  "data-hb-tip": "Big Menu",
                  "data-menu-icon-pos": "before",
                  "data-menu-icon-svg": "",
                  "data-menu-items": "[{\"text\":\"Каталог\",\"href\":\"/\"},{\"text\":\"Оплата\",\"href\":\"/оплата\"},{\"text\":\"Доставка\",\"href\":\"/доставка\"},{\"text\":\"Акції\",\"href\":\"/акції\"}]",
                  "data-menu-level1-direction": "row",
                  "data-menu-variant": "big",
                  "data-name": "Big Menu",
                  "data-st-menu": "1",
                  "data-st-text-flow": "nowrap",
                  "data-node-id": "header_gd_block_007",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_007",
                "styleText": "width:auto;min-width:max-content;max-width:100%;min-height:40px;display:flex;align-items:center;background:transparent;border:0;overflow:visible;color:#111827;flex:0 0 auto;box-sizing:border-box;--st-menu-gap:8px;--st-menu-root-gap:8px;--st-menu-link-color:#111827;--st-menu-link-fs:14px;--st-menu-radius:999px;--st-menu-item-bg:rgba(255,255,255,.06);--st-menu-item-bc:rgba(255,255,255,.10);--st-menu-item-bw:1px;--st-menu-item-shadow:none;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "max-width": "100%",
                  "min-height": "40px",
                  "display": "flex",
                  "align-items": "center",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "color": "#111827",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "--st-menu-gap": "8px",
                  "--st-menu-root-gap": "8px",
                  "--st-menu-link-color": "#111827",
                  "--st-menu-link-fs": "14px",
                  "--st-menu-radius": "999px",
                  "--st-menu-item-bg": "rgba(255,255,255,.06)",
                  "--st-menu-item-bc": "rgba(255,255,255,.10)",
                  "--st-menu-item-bw": "1px",
                  "--st-menu-item-shadow": "none"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "nav",
                    "attrs": {
                      "aria-label": "Menu",
                      "class": "st-menu st-menu--big"
                    },
                    "styleText": "width:auto;max-width:100%;",
                    "style": {
                      "width": "auto",
                      "max-width": "100%"
                    },
                    "children": [
                      {
                        "type": "element",
                        "tag": "ul",
                        "attrs": {
                          "class": "st-menu__list",
                          "data-menu-list-depth": "1"
                        },
                        "styleText": "list-style:none;margin:0;padding:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;",
                        "style": {
                          "list-style": "none",
                          "margin": "0",
                          "padding": "0",
                          "display": "flex",
                          "align-items": "center",
                          "gap": "8px",
                          "flex-wrap": "wrap",
                          "justify-content": "center"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "/"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Каталог"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "#"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Оплата"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "#"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Доставка"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "#"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Акції"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-layout-mode": "flex",
              "data-layout-orient": "row",
              "data-name": "Дія",
              "data-st-node": "container",
              "data-node-id": "header_gd_container_007",
              "data-hf-node-type": "container",
              "data-hf-template-id": "header_test_global_styles_json_v1"
            },
            "id": "header_gd_container_007",
            "styleText": "min-height:58px;width:100%;max-width:100%;min-width:0;flex:0 0 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-end;gap:10px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "58px",
              "width": "100%",
              "max-width": "100%",
              "min-width": "0",
              "flex": "0 0 auto",
              "display": "flex",
              "flex-direction": "row",
              "flex-wrap": "nowrap",
              "align-items": "center",
              "justify-content": "flex-end",
              "gap": "10px",
              "background": "transparent",
              "border": "0",
              "overflow": "visible",
              "padding": "0",
              "box-sizing": "border-box"
            },
            "children": [
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--text st-block--phone",
                  "data-block-kind": "text",
                  "data-block-role": "phone",
                  "data-hb-tip": "Телефон",
                  "data-name": "Телефон",
                  "data-phone-icon-color": "#b45309",
                  "data-phone-icon-pos": "left",
                  "data-phone-icon-svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.61a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.47-1.29a2 2 0 0 1 2.11-.45c.83.3 1.71.51 2.61.63A2 2 0 0 1 22 16.92z\"></path></svg>",
                  "data-st-text-flow": "nowrap",
                  "data-node-id": "header_gd_block_008",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_008",
                "styleText": "width:auto;min-width:max-content;min-height:42px;display:inline-flex;align-items:center;gap:10px;background:#b4530912;border:1px solid rgba(255,255,255,.10);border-radius:999px;overflow:visible;color:#111827;padding:6px 12px;flex:0 0 auto;box-sizing:border-box;--st-icon-size:17px;--st-icon-bg:transparent;--st-icon-radius:999px;--st-icon-pad-y:0px;--st-icon-pad-x:0px;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "min-height": "42px",
                  "display": "inline-flex",
                  "align-items": "center",
                  "gap": "10px",
                  "background": "#b4530912",
                  "border": "1px solid rgba(255,255,255,.10)",
                  "border-radius": "999px",
                  "overflow": "visible",
                  "color": "#111827",
                  "padding": "6px 12px",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "--st-icon-size": "17px",
                  "--st-icon-bg": "transparent",
                  "--st-icon-radius": "999px",
                  "--st-icon-pad-y": "0px",
                  "--st-icon-pad-x": "0px"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "button",
                    "attrs": {
                      "aria-label": "Phone icon",
                      "class": "st-phone__iconbtn",
                      "type": "button"
                    },
                    "styleText": "display:inline-flex;align-items:center;justify-content:center;border:0;background:transparent;color:#b45309;padding:0;",
                    "style": {
                      "display": "inline-flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "border": "0",
                      "background": "transparent",
                      "color": "#b45309",
                      "padding": "0"
                    },
                    "children": [
                      {
                        "type": "element",
                        "tag": "span",
                        "attrs": {
                          "class": "st-phone__iconsvg"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "svg",
                            "attrs": {
                              "aria-hidden": "true",
                              "fill": "none",
                              "stroke": "currentColor",
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              "viewbox": "0 0 24 24"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "path",
                                "attrs": {
                                  "d": "M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.61a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.47-1.29a2 2 0 0 1 2.11-.45c.83.3 1.71.51 2.61.63A2 2 0 0 1 22 16.92z"
                                }
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit st-phone__text",
                      "contenteditable": "true",
                      "data-phone-text": "1",
                      "data-st-text-flow": "nowrap",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "font-size:14px;font-weight:800;white-space:nowrap;word-break:normal;overflow-wrap:normal;display:block;width:auto;min-height:0;height:auto;padding:0;border:0;",
                    "style": {
                      "font-size": "14px",
                      "font-weight": "800",
                      "white-space": "nowrap",
                      "word-break": "normal",
                      "overflow-wrap": "normal",
                      "display": "block",
                      "width": "auto",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "+38 097 247 02 74"
                      }
                    ]
                  }
                ]
              },
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--icon",
                  "data-block-kind": "icon",
                  "data-hb-tip": "Кошик",
                  "data-name": "Кошик",
                  "data-node-id": "header_gd_block_009",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_009",
                "styleText": "width:44px;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;background:transparent;border:0;overflow:visible;color:#111827;flex:0 0 44px;box-sizing:border-box;--st-icon-size:21px;--st-icon-bg:#b4530912;--st-icon-bw:1px;--st-icon-bc:#b4530928;--st-icon-radius:14px;--st-icon-pad-y:10px;--st-icon-pad-x:10px;--st-icon-shadow:none;",
                "style": {
                  "width": "44px",
                  "min-width": "44px",
                  "min-height": "44px",
                  "display": "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "color": "#111827",
                  "flex": "0 0 44px",
                  "box-sizing": "border-box",
                  "--st-icon-size": "21px",
                  "--st-icon-bg": "#b4530912",
                  "--st-icon-bw": "1px",
                  "--st-icon-bc": "#b4530928",
                  "--st-icon-radius": "14px",
                  "--st-icon-pad-y": "10px",
                  "--st-icon-pad-x": "10px",
                  "--st-icon-shadow": "none"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "button",
                    "attrs": {
                      "aria-label": "Icon",
                      "class": "st-icon-btn",
                      "type": "button"
                    },
                    "styleText": "display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border:1px solid #b4530928;border-radius:14px;background:#b4530912;box-shadow:none;color:#111827;padding:10px;",
                    "style": {
                      "display": "inline-flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "width": "42px",
                      "height": "42px",
                      "border": "1px solid #b4530928",
                      "border-radius": "14px",
                      "background": "#b4530912",
                      "box-shadow": "none",
                      "color": "#111827",
                      "padding": "10px"
                    },
                    "children": [
                      {
                        "type": "element",
                        "tag": "span",
                        "attrs": {
                          "class": "st-icon-svg"
                        },
                        "styleText": "display:inline-flex;align-items:center;justify-content:center;width:var(--st-icon-size, 21px);height:var(--st-icon-size, 21px);min-width:var(--st-icon-size, 21px);min-height:var(--st-icon-size, 21px);line-height:0;color:inherit;",
                        "style": {
                          "display": "inline-flex",
                          "align-items": "center",
                          "justify-content": "center",
                          "width": "var(--st-icon-size, 21px)",
                          "height": "var(--st-icon-size, 21px)",
                          "min-width": "var(--st-icon-size, 21px)",
                          "min-height": "var(--st-icon-size, 21px)",
                          "line-height": "0",
                          "color": "inherit"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "svg",
                            "attrs": {
                              "aria-hidden": "true",
                              "fill": "none",
                              "stroke": "currentColor",
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              "viewbox": "0 0 24 24"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "circle",
                                "attrs": {
                                  "cx": "8",
                                  "cy": "21",
                                  "r": "1"
                                }
                              },
                              {
                                "type": "element",
                                "tag": "circle",
                                "attrs": {
                                  "cx": "19",
                                  "cy": "21",
                                  "r": "1"
                                }
                              },
                              {
                                "type": "element",
                                "tag": "path",
                                "attrs": {
                                  "d": "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h8.78a2 2 0 0 0 2-1.58l1.65-7.43H5.12"
                                }
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--text st-block--button",
                  "data-block-kind": "text",
                  "data-block-role": "button",
                  "data-button-click-area": "all",
                  "data-button-color1": "#111827",
                  "data-button-color2": "#b45309",
                  "data-button-extra-preset": "cta",
                  "data-button-fill-mode": "gradient",
                  "data-button-gradient-angle": "135",
                  "data-button-href": "",
                  "data-button-icon-color": "#ffffff",
                  "data-button-icon-pos": "right",
                  "data-button-icon-svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 12h14\"></path><path d=\"m12 5 7 7-7 7\"></path></svg>",
                  "data-button-link-mode": "none",
                  "data-button-mode": "text-icon",
                  "data-button-shape": "pill",
                  "data-button-text": "Купити",
                  "data-hb-tip": "Кнопка",
                  "data-name": "Кнопка",
                  "data-st-text-flow": "nowrap",
                  "data-node-id": "header_gd_block_010",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_010",
                "styleText": "width:auto;min-width:max-content;min-height:42px;display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:10px 16px;border-radius:999px;background:linear-gradient(135deg, #111827, #b45309);color:#ffffff;border:1px solid rgba(255,255,255,.12);box-shadow:0 18px 38px #b4530933;overflow:visible;flex:0 0 auto;box-sizing:border-box;--st-button-fill:linear-gradient(135deg, #111827, #b45309);--st-button-fg:#ffffff;--st-button-border:1px solid rgba(255,255,255,.12);--st-button-radius:999px;--st-button-shadow:0 18px 38px #b4530933;--st-icon-size:17px;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "min-height": "42px",
                  "display": "inline-flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "gap": "10px",
                  "padding": "10px 16px",
                  "border-radius": "999px",
                  "background": "linear-gradient(135deg, #111827, #b45309)",
                  "color": "#ffffff",
                  "border": "1px solid rgba(255,255,255,.12)",
                  "box-shadow": "0 18px 38px #b4530933",
                  "overflow": "visible",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "--st-button-fill": "linear-gradient(135deg, #111827, #b45309)",
                  "--st-button-fg": "#ffffff",
                  "--st-button-border": "1px solid rgba(255,255,255,.12)",
                  "--st-button-radius": "999px",
                  "--st-button-shadow": "0 18px 38px #b4530933",
                  "--st-icon-size": "17px"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "button",
                    "attrs": {
                      "aria-label": "Button icon",
                      "class": "st-icon-btn st-button__iconbtn",
                      "type": "button"
                    },
                    "styleText": "display:inline-flex;align-items:center;justify-content:center;border:0;background:transparent;color:#ffffff;padding:0;",
                    "style": {
                      "display": "inline-flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "border": "0",
                      "background": "transparent",
                      "color": "#ffffff",
                      "padding": "0"
                    },
                    "children": [
                      {
                        "type": "element",
                        "tag": "span",
                        "attrs": {
                          "class": "st-icon-btn__glyph st-button__iconsvg"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "svg",
                            "attrs": {
                              "aria-hidden": "true",
                              "fill": "none",
                              "stroke": "currentColor",
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "stroke-width": "2",
                              "viewbox": "0 0 24 24"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "path",
                                "attrs": {
                                  "d": "M5 12h14"
                                }
                              },
                              {
                                "type": "element",
                                "tag": "path",
                                "attrs": {
                                  "d": "m12 5 7 7-7 7"
                                }
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit st-button__label",
                      "contenteditable": "true",
                      "data-st-text-flow": "nowrap",
                      "data-st-text-target": "1",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "font-size:16px;font-weight:800;line-height:1.1;color:inherit;white-space:nowrap;word-break:normal;overflow-wrap:normal;display:block;width:auto;min-height:0;height:auto;padding:0;border:0;",
                    "style": {
                      "font-size": "16px",
                      "font-weight": "800",
                      "line-height": "1.1",
                      "color": "inherit",
                      "white-space": "nowrap",
                      "word-break": "normal",
                      "overflow-wrap": "normal",
                      "display": "block",
                      "width": "auto",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Купити"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "level",
        "tag": "div",
        "attrs": {
          "class": "st-row",
          "data-layout-mode": "fr",
          "data-layout-orient": "row",
          "data-st-node": "level",
          "data-node-id": "header_gd_level_004",
          "data-hf-node-type": "level",
          "data-hf-template-id": "header_test_global_styles_json_v1"
        },
        "id": "header_gd_level_004",
        "styleText": "display:grid;grid-template-columns:1fr;align-items:center;gap:14px;width:100%;min-height:58px;box-sizing:border-box;overflow:visible;min-height:48px;background:#0b0b0c;border-top:1px solid rgba(255,255,255,.10);border-bottom:1px solid rgba(255,255,255,.10);padding:0 14px;",
        "style": {
          "display": "grid",
          "grid-template-columns": "1fr",
          "align-items": "center",
          "gap": "14px",
          "width": "100%",
          "min-height": "48px",
          "box-sizing": "border-box",
          "overflow": "visible",
          "background": "#0b0b0c",
          "border-top": "1px solid rgba(255,255,255,.10)",
          "border-bottom": "1px solid rgba(255,255,255,.10)",
          "padding": "0 14px"
        },
        "children": [
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-layout-mode": "flex",
              "data-layout-orient": "row",
              "data-name": "Нижнє меню",
              "data-st-node": "container",
              "data-node-id": "header_gd_container_008",
              "data-hf-node-type": "container",
              "data-hf-template-id": "header_test_global_styles_json_v1"
            },
            "id": "header_gd_container_008",
            "styleText": "min-height:58px;width:100%;max-width:100%;min-width:0;flex:1 1 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:center;gap:10px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "58px",
              "width": "100%",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1 1 auto",
              "display": "flex",
              "flex-direction": "row",
              "flex-wrap": "nowrap",
              "align-items": "center",
              "justify-content": "center",
              "gap": "10px",
              "background": "transparent",
              "border": "0",
              "overflow": "visible",
              "padding": "0",
              "box-sizing": "border-box"
            },
            "children": [
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--menu",
                  "data-block-kind": "menu",
                  "data-hb-tip": "Big Menu",
                  "data-menu-icon-pos": "before",
                  "data-menu-icon-svg": "",
                  "data-menu-items": "[{\"text\":\"Усі категорії\",\"href\":\"/\"},{\"text\":\"Сковороди\",\"href\":\"/сковороди\"},{\"text\":\"Казани\",\"href\":\"/казани\"},{\"text\":\"Мангали\",\"href\":\"/мангали\"},{\"text\":\"Шампура\",\"href\":\"/шампура\"},{\"text\":\"Аксесуари\",\"href\":\"/аксесуари\"},{\"text\":\"Гравіювання\",\"href\":\"/гравіювання\"}]",
                  "data-menu-level1-direction": "row",
                  "data-menu-variant": "big",
                  "data-name": "Big Menu",
                  "data-st-menu": "1",
                  "data-st-text-flow": "nowrap",
                  "data-node-id": "header_gd_block_011",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "header_test_global_styles_json_v1"
                },
                "id": "header_gd_block_011",
                "styleText": "width:auto;min-width:max-content;max-width:100%;min-height:40px;display:flex;align-items:center;background:transparent;border:0;overflow:visible;color:#f8fafc;flex:0 0 auto;box-sizing:border-box;--st-menu-gap:8px;--st-menu-root-gap:8px;--st-menu-link-color:#f8fafc;--st-menu-link-fs:14px;--st-menu-radius:999px;--st-menu-item-bg:rgba(255,255,255,.06);--st-menu-item-bc:rgba(255,255,255,.10);--st-menu-item-bw:1px;--st-menu-item-shadow:none;--st-menu-link-color:#f8fafc;--st-menu-item-bg:rgba(255,255,255,.05);--st-menu-item-bc:rgba(255,255,255,.10);--st-menu-radius:8px;--st-menu-link-fs:13px;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "max-width": "100%",
                  "min-height": "40px",
                  "display": "flex",
                  "align-items": "center",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "color": "#f8fafc",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "--st-menu-gap": "8px",
                  "--st-menu-root-gap": "8px",
                  "--st-menu-link-color": "#f8fafc",
                  "--st-menu-link-fs": "13px",
                  "--st-menu-radius": "8px",
                  "--st-menu-item-bg": "rgba(255,255,255,.05)",
                  "--st-menu-item-bc": "rgba(255,255,255,.10)",
                  "--st-menu-item-bw": "1px",
                  "--st-menu-item-shadow": "none"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "nav",
                    "attrs": {
                      "aria-label": "Menu",
                      "class": "st-menu st-menu--big"
                    },
                    "styleText": "width:auto;max-width:100%;",
                    "style": {
                      "width": "auto",
                      "max-width": "100%"
                    },
                    "children": [
                      {
                        "type": "element",
                        "tag": "ul",
                        "attrs": {
                          "class": "st-menu__list",
                          "data-menu-list-depth": "1"
                        },
                        "styleText": "list-style:none;margin:0;padding:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;",
                        "style": {
                          "list-style": "none",
                          "margin": "0",
                          "padding": "0",
                          "display": "flex",
                          "align-items": "center",
                          "gap": "8px",
                          "flex-wrap": "wrap",
                          "justify-content": "center"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "/"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Усі категорії"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "#"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Сковороди"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "#"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Казани"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "#"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Мангали"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "#"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Шампура"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "#"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Аксесуари"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          },
                          {
                            "type": "element",
                            "tag": "li",
                            "attrs": {
                              "class": "st-menu__item",
                              "data-menu-depth": "1"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "a",
                                "attrs": {
                                  "class": "st-menu__link st-block st-block--menu-item",
                                  "data-st-menu-item": "1",
                                  "href": "#"
                                },
                                "styleText": "display:inline-flex;align-items:center;justify-content:center;min-height:34px;width:auto;min-width:max-content;padding:8px 12px;border-radius:999px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "min-height": "34px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "8px 12px",
                                  "border-radius": "999px",
                                  "background": "var(--st-menu-item-bg,rgba(255,255,255,.06))",
                                  "border": "var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10))",
                                  "color": "var(--st-menu-link-color,currentColor)",
                                  "text-decoration": "none",
                                  "font-size": "var(--st-menu-link-fs,14px)",
                                  "font-weight": "750",
                                  "white-space": "nowrap",
                                  "box-sizing": "border-box"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "span",
                                    "attrs": {
                                      "class": "st-menu__text",
                                      "data-st-text-flow": "nowrap"
                                    },
                                    "styleText": "white-space:nowrap;word-break:normal;overflow-wrap:normal;",
                                    "style": {
                                      "white-space": "nowrap",
                                      "word-break": "normal",
                                      "overflow-wrap": "normal"
                                    },
                                    "children": [
                                      {
                                        "type": "text",
                                        "text": "Гравіювання"
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};



// =======================================================
// [00856] Header menu is no longer a pseudo-row inside the white header section.
// The category strip is authored as its own real section:
//   header section 1: service/top/search rows
//   header section 2: black category menu strip
// This removes the white phantom band instead of hiding it with runtime coupling.
// =======================================================
function stHfClone00856_(value) {
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
}

function stHfStyleText00856_(style) {
  if (!style || typeof style !== 'object') return '';
  return Object.entries(style)
    .filter(([k, v]) => k && v != null && String(v) !== '')
    .map(([k, v]) => `${k}:${String(v)}`)
    .join(';');
}

function stHfSetStyle00856_(node, style) {
  if (!node || typeof node !== 'object') return node;
  node.style = { ...(node.style || {}), ...(style || {}) };
  node.styleText = stHfStyleText00856_(node.style);
  return node;
}

function stHfNodeText00856_(node) {
  if (!node) return '';
  let out = '';
  if (node.type === 'text') out += String(node.text || '');
  const attrs = node.attrs || {};
  out += ' ' + String(attrs['data-name'] || '') + ' ' + String(attrs['data-menu-items'] || '');
  if (Array.isArray(node.children)) node.children.forEach((ch) => { out += ' ' + stHfNodeText00856_(ch); });
  return out;
}

function stHfIsShopMenuRow00856_(row) {
  if (!row || row.type !== 'level') return false;
  const id = String(row.id || row.attrs?.['data-node-id'] || '');
  const txt = stHfNodeText00856_(row);
  return /level_004|menu_row|category/i.test(id) || (/Усі категорії/.test(txt) && /Сковороди|Казани|Мангали|Шампура|Аксесуари|Гравіювання/.test(txt));
}

function stHfBuildSeparateMenuSectionHeader00856_(model) {
  const out = stHfClone00856_(model);
  const mainSection = out && out.root;
  if (!mainSection || !Array.isArray(mainSection.children)) return out;

  const rows = mainSection.children;
  const menuIndex = rows.findIndex(stHfIsShopMenuRow00856_);
  if (menuIndex < 0) return out;

  const menuRow = rows.splice(menuIndex, 1)[0];
  const oldTemplateId = String(out.templateId || mainSection.attrs?.['data-hf-template-id'] || 'header_test_global_styles_json_v1');
  const prefix = oldTemplateId === 'header_test_global_styles_json_v1' ? 'header_gd' : 'header_gs';
  const menuSectionId = `${prefix}_menu_section_001`;
  const menuRowId = `${prefix}_menu_level_001`;
  const menuContainerId = `${prefix}_menu_container_001`;

  mainSection.attrs = { ...(mainSection.attrs || {}) };
  mainSection.attrs['data-st-header-part'] = 'main-section';
  mainSection.attrs['data-hf-template-id'] = oldTemplateId;
  mainSection.attrs['data-st-global-style-test'] = '1';
  mainSection.attrs['data-st-global-style-root'] = '1';
  stHfSetStyle00856_(mainSection, {
    padding: '0',
    'padding-bottom': '0',
    margin: '0',
    'margin-bottom': '0',
    overflow: 'visible',
    'box-sizing': 'border-box'
  });

  menuRow.id = menuRowId;
  menuRow.attrs = { ...(menuRow.attrs || {}) };
  menuRow.attrs['data-node-id'] = menuRowId;
  menuRow.attrs['data-hf-node-type'] = 'level';
  menuRow.attrs['data-st-header-row-kind'] = 'category-menu-row';
  menuRow.attrs['data-st-header-menu-row'] = '1';
  menuRow.attrs['data-hf-template-id'] = oldTemplateId;
  stHfSetStyle00856_(menuRow, {
    display: 'grid',
    'grid-template-columns': '1fr',
    'align-items': 'start',
    'align-content': 'start',
    'justify-items': 'stretch',
    gap: '0',
    'row-gap': '0',
    'grid-auto-rows': 'auto',
    width: '100%',
    'min-height': '48px',
    height: 'auto',
    'box-sizing': 'border-box',
    overflow: 'visible',
    background: 'transparent',
    border: '0',
    padding: '0 14px',
    margin: '0'
  });

  const directBlocks = Array.isArray(menuRow.children) ? menuRow.children.filter((ch) => ch && ch.type === 'container') : [];
  const menuContainer = directBlocks[0] || (Array.isArray(menuRow.children) ? menuRow.children[0] : null);
  if (menuContainer) {
    menuContainer.id = menuContainerId;
    menuContainer.attrs = { ...(menuContainer.attrs || {}) };
    menuContainer.attrs['data-node-id'] = menuContainerId;
    menuContainer.attrs['data-hf-node-type'] = 'container';
    menuContainer.attrs['data-name'] = 'Категорійне меню';
    menuContainer.attrs['data-hf-template-id'] = oldTemplateId;
    stHfSetStyle00856_(menuContainer, {
      'min-height': '48px',
      height: 'auto',
      width: '100%',
      'max-width': '100%',
      'min-width': '0',
      display: 'flex',
      'flex-direction': 'row',
      'flex-wrap': 'nowrap',
      'align-items': 'flex-start',
      'justify-content': 'center',
      'align-self': 'start',
      gap: '10px',
      background: 'transparent',
      border: '0',
      overflow: 'visible',
      padding: '0',
      margin: '0',
      'box-sizing': 'border-box'
    });

    const menuBlock = Array.isArray(menuContainer.children) ? menuContainer.children.find((ch) => /st-block--menu|data-st-menu/.test(JSON.stringify(ch.attrs || {}))) : null;
    if (menuBlock) {
      menuBlock.attrs = { ...(menuBlock.attrs || {}) };
      menuBlock.attrs['data-st-header-category-menu'] = '1';
      menuBlock.attrs['data-hf-template-id'] = oldTemplateId;
      stHfSetStyle00856_(menuBlock, {
        width: 'auto',
        'min-width': 'max-content',
        'max-width': '100%',
        'min-height': '40px',
        height: 'auto',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        background: 'transparent',
        border: '0',
        overflow: 'visible',
        color: '#f8fafc',
        flex: '0 0 auto',
        'align-self': 'flex-start',
        margin: '0',
        padding: '0',
        'box-sizing': 'border-box'
      });
    }
  }

  const menuSection = {
    type: 'section',
    tag: 'section',
    id: menuSectionId,
    attrs: {
      class: 'st-section st-section--header-menu-strip',
      'data-sec-role': 'header',
      'data-st-header-part': 'menu-section',
      'data-st-global-style-test': '1',
      'data-st-global-style-root': '1',
      'data-hf-json-template': '1',
      'data-hf-template-id': oldTemplateId,
      'data-node-id': menuSectionId,
      'data-hf-node-type': 'section'
    },
    style: {
      width: '100%',
      'box-sizing': 'border-box',
      overflow: 'visible',
      padding: '0',
      margin: '0',
      'margin-top': '0',
      'margin-bottom': '0',
      'min-height': '48px',
      background: '#0b0b0c',
      border: '0',
      'border-top': '1px solid rgba(255,255,255,.10)',
      'border-bottom': '1px solid rgba(255,255,255,.10)',
      'box-shadow': 'none',
      color: '#f8fafc'
    },
    children: [menuRow]
  };
  menuSection.styleText = stHfStyleText00856_(menuSection.style);

  out.root = {
    type: 'section-group',
    tag: 'div',
    id: `${prefix}_section_group_001`,
    attrs: {
      'data-hf-node-type': 'section-group',
      'data-hf-json-template': '1',
      'data-hf-template-id': oldTemplateId,
      'data-st-global-style-test': '1',
      'data-st-global-style-root': '1',
      'data-node-id': `${prefix}_section_group_001`,
      'data-st-header-structure': 'main-section-plus-menu-section-00857'
    },
    children: [mainSection, menuSection]
  };
  out.structure = 'HEADER_MAIN_SECTION_PLUS_SEPARATE_MENU_SECTION_00857';
  return out;
}

const HEADER_TEST_GLOBAL_STYLES_MODEL_00955 = stHfBuildSeparateMenuSectionHeader00856_(HEADER_TEST_GLOBAL_STYLES_MODEL_RAW_00955);



// =======================================================
// [00955] Робоча шапка для перевірки Глобальних стилів.
// Її модель є прямим source-contract без окремої тестової картки чи retarget adapter-а.
// Структура тепер: section-group -> section(main) + section(menu) -> level -> container -> block, а кольори/радіуси/тіні
// беруться з центрального StyleStore через CSS variables.
// =======================================================
// [00711] Повернення початкового світлого вигляду тестової шапки.
// Причина: після 00700/00701 цей тестовий шаблон почав повністю слухати
// section/container/block tokens і міг ставати темним разом із глобальною темою.
// Тут лишаємо JSON-структуру/ID/label для Global Design test, але стилі беремо
// з початкового HEADER_TEST_GLOBAL_STYLES_MODEL_RAW_00955 без перефарбування adapter-ом.

const HEADER_TEST_GLOBAL_STYLES_TEMPLATE = {
  id: "header_test_global_styles_json_v1",
  type: "header",
  folderId: "fld_header",
  name: "Тест ГЛОБАЛЬНИХ СТИЛІВ",
  preview: "test-global-styles-json-00684",
  description: "Робоча тестова JSON-шапка для перевірки центрального StyleStore: Global / AI / Design. Контент і структура не змінюються, стилі беруться через CSS variables.",
  meta: {
    "source": "system",
    "palette": "global-style-tokens",
    "tools": ["section", "row", "container", "logo", "menu", "text", "phone", "icon", "button"],
    "testTemplate": "global-styles-00684",
    "modelContract": "header-global-style-json-source-00955",
    "jsonModel": "st-hf-json-v1",
    "singleSourceOfTruth": "model",
    "globalStyleTest": true,
    "styleStore": "st_global_style_store_v1"
  },
  styleProfile: HEADER_GLOBAL_STYLE_TEST_PROFILE_00946,
  modelVersion: "st-hf-json-v1",
  model: HEADER_TEST_GLOBAL_STYLES_MODEL_00955,
  html: renderHfTemplateModelToHtml00545_(HEADER_TEST_GLOBAL_STYLES_MODEL_00955)
};

const HEADER_TEMPLATES = [HEADER_TEST_GLOBAL_STYLES_TEMPLATE, ...PAIRED_HEADER_TEMPLATES_00978, ...STANDALONE_PREMIUM_HEADER_TEMPLATES_00979];

HEADER_TEMPLATES.unshift(SCHOOL_01_HEADER_TEMPLATE_00957);
HEADER_TEMPLATES.unshift(SHIFTTIME_MARKETPLACE_01_HEADER_TEMPLATE_00981);
HEADER_TEMPLATES.unshift(SHIFTTIME_MARKETPLACE_02_HEADER_TEMPLATE_00984);

let __CACHE = null;

function cloneTemplate_(tpl) {
  try { return JSON.parse(JSON.stringify(tpl)); } catch (_) { return { ...tpl }; }
}

export function getHeaderTemplatesDemo() {
  if (!__CACHE) __CACHE = HEADER_TEMPLATES;
  return __CACHE.map(cloneTemplate_);
}
