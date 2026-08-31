import { retargetHfTemplateForGlobalStyles00690 } from '../shared/hf-global-style-adapter.js';
import { FOOTER_GLOBAL_STYLE_TEST_PROFILE_00946 } from '../style-profile/footer-global-style-test-profile-00946.js';
import { SCHOOL_01_FOOTER_TEMPLATE_00962 } from './school-01-footer-template-00962.js?v=00965';
import { SHIFTTIME_MARKETPLACE_01_FOOTER_TEMPLATE_00981 } from './shifttime-marketplace-01-footer-template-00981.js?v=00981';
import { SHIFTTIME_MARKETPLACE_02_FOOTER_TEMPLATE_00984 } from './shifttime-marketplace-02-footer-template-00984.js?v=00984';
import { PAIRED_FOOTER_TEMPLATES_00973 } from './paired-footer-templates-00973.js?v=00976';
import { STANDALONE_CANONICAL_FOOTER_TEMPLATES_00974 } from './standalone-canonical-footer-templates-00974.js?v=00976';
// js/design/widgets/templates/footer/footer-templates.js
// =======================================================
// [00545]
// Test template 00 is authored as JSON model first.
// Existing template gallery still receives html, but for template 00 that html is rendered from model.
// This is the test bridge for the future Header/Footer JSON engine under the existing builder UI.
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


const FOOTER_00_TEST_PORTFOLIO_ARTIST_MODEL = {
  "version": "st-hf-json-v1",
  "schema": "section-level-container-block-dom-v1",
  "scope": "footer",
  "templateId": "footer_00_test_portfolio_artist_json_v1",
  "sourcePolicy": "JSON_MODEL_IS_SOURCE_OF_TRUTH_FOR_TEST_TEMPLATE_00",
  "renderPolicy": "DOM is rendered from this model; existing UI/widgets must edit model nodes by data-node-id.",
  "root": {
    "type": "section",
    "tag": "section",
    "attrs": {
      "class": "st-section",
      "data-sec-role": "footer",
      "data-hf-json-template": "1",
      "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1",
      "data-node-id": "footer_00_section_001",
      "data-hf-node-type": "section"
    },
    "id": "footer_00_section_001",
    "styleText": "width:100%;box-sizing:border-box;padding:30px 32px;border-radius:32px;margin-top:24px;background:linear-gradient(180deg,#ffffff,#f5f3ff);border:1px solid rgba(124,58,237,.18);box-shadow:0 32px 90px rgba(15,23,42,.26);color:#111827;overflow:hidden;;overflow:visible;",
    "style": {
      "width": "100%",
      "box-sizing": "border-box",
      "padding": "30px 32px",
      "border-radius": "32px",
      "margin-top": "24px",
      "background": "linear-gradient(180deg,#ffffff,#f5f3ff)",
      "border": "1px solid rgba(124,58,237,.18)",
      "box-shadow": "0 32px 90px rgba(15,23,42,.26)",
      "color": "#111827",
      "overflow": "visible"
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
          "data-node-id": "footer_00_level_001",
          "data-hf-node-type": "level",
          "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
        },
        "id": "footer_00_level_001",
        "styleText": "display:grid;grid-template-columns:1fr;align-items:center;gap:12px;width:100%;min-height:56px;box-sizing:border-box;overflow:visible;padding:8px 0;margin:0;",
        "style": {
          "display": "grid",
          "grid-template-columns": "1fr",
          "align-items": "center",
          "gap": "12px",
          "width": "100%",
          "min-height": "56px",
          "box-sizing": "border-box",
          "overflow": "visible",
          "padding": "8px 0",
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
              "data-name": "00 · TEST container",
              "data-st-node": "container",
              "data-hf-test-container": "00",
              "data-node-id": "footer_00_container_001",
              "data-hf-node-type": "container",
              "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
            },
            "id": "footer_00_container_001",
            "styleText": "min-height:50px;width:100%;max-width:100%;min-width:0;flex:1 1 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:center;gap:10px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "50px",
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
                  "data-node-id": "footer_00_block_001",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_001",
                "styleText": "width:auto;min-width:max-content;max-width:100%;min-height:44px;display:flex;align-items:center;justify-content:center;background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.34);border-radius:18px;overflow:visible;color:#a855f7;padding:9px 24px;box-sizing:border-box;font-size:28px;font-weight:950;letter-spacing:.12em;line-height:1;text-transform:uppercase;box-shadow:0 16px 42px rgba(168,85,247,.18);",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "max-width": "100%",
                  "min-height": "44px",
                  "display": "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "background": "rgba(168,85,247,.12)",
                  "border": "1px solid rgba(168,85,247,.34)",
                  "border-radius": "18px",
                  "overflow": "visible",
                  "color": "#a855f7",
                  "padding": "9px 24px",
                  "box-sizing": "border-box",
                  "font-size": "28px",
                  "font-weight": "950",
                  "letter-spacing": ".12em",
                  "line-height": "1",
                  "text-transform": "uppercase",
                  "box-shadow": "0 16px 42px rgba(168,85,247,.18)"
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
                        "text": "ТЕСТ"
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
          "data-layout-mode": "flex",
          "data-layout-orient": "row",
          "data-st-footer-no-wrap-resize00458": "1",
          "data-st-node": "level",
          "data-node-id": "footer_00_level_002",
          "data-hf-node-type": "level",
          "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
        },
        "id": "footer_00_level_002",
        "styleText": "display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:nowrap;width:100%;max-width:100%;min-width:0;min-height:46px;box-sizing:border-box;overflow:visible;padding-bottom:14px;border-bottom:1px solid rgba(124,58,237,.18);",
        "style": {
          "display": "flex",
          "align-items": "center",
          "justify-content": "space-between",
          "gap": "14px",
          "flex-wrap": "nowrap",
          "width": "100%",
          "max-width": "100%",
          "min-width": "0",
          "min-height": "46px",
          "box-sizing": "border-box",
          "overflow": "visible",
          "padding-bottom": "14px",
          "border-bottom": "1px solid rgba(124,58,237,.18)"
        },
        "children": [
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-hf-template-container": "1",
              "data-layout-mode": "flex",
              "data-layout-orient": "column",
              "data-name": "Контейнер · Текст",
              "data-st-node": "container",
              "data-node-id": "footer_00_container_002",
              "data-hf-node-type": "container",
              "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
            },
            "id": "footer_00_container_002",
            "styleText": "min-height:1px;width:0;max-width:100%;min-width:0;flex:1 1 0;display:flex;flex-direction:column;flex-wrap:nowrap;align-items:flex-start;justify-content:center;gap:8px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "1px",
              "width": "0",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1 1 0",
              "display": "flex",
              "flex-direction": "column",
              "flex-wrap": "nowrap",
              "align-items": "flex-start",
              "justify-content": "center",
              "gap": "8px",
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
                  "data-node-id": "footer_00_block_002",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_002",
                "styleText": "min-height:28px;background:transparent;border:0;overflow:visible;box-sizing:border-box;color:#111827;font-size:13px;font-weight:850;letter-spacing:.04em;text-transform:uppercase;opacity:.88;",
                "style": {
                  "min-height": "28px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "box-sizing": "border-box",
                  "color": "#111827",
                  "font-size": "13px",
                  "font-weight": "850",
                  "letter-spacing": ".04em",
                  "text-transform": "uppercase",
                  "opacity": ".88"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit",
                      "contenteditable": "true",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "display:block;width:auto;max-width:100%;min-width:0;min-height:0;height:auto;padding:0;border:0;word-break:normal;overflow-wrap:break-word;line-height:inherit;box-sizing:border-box;",
                    "style": {
                      "display": "block",
                      "width": "auto",
                      "max-width": "100%",
                      "min-width": "0",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0",
                      "word-break": "normal",
                      "overflow-wrap": "break-word",
                      "line-height": "inherit",
                      "box-sizing": "border-box"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Design · Photo · Art"
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
              "data-hf-template-container": "1",
              "data-layout-mode": "flex",
              "data-layout-orient": "column",
              "data-name": "Контейнер · Меню",
              "data-st-node": "container",
              "data-node-id": "footer_00_container_003",
              "data-hf-node-type": "container",
              "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
            },
            "id": "footer_00_container_003",
            "styleText": "min-height:1px;width:0;max-width:100%;min-width:0;flex:1 1 0;display:flex;flex-direction:column;flex-wrap:nowrap;align-items:flex-start;justify-content:center;gap:8px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "1px",
              "width": "0",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1 1 0",
              "display": "flex",
              "flex-direction": "column",
              "flex-wrap": "nowrap",
              "align-items": "flex-start",
              "justify-content": "center",
              "gap": "8px",
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
                  "data-hb-tip": "Меню",
                  "data-menu-icon-pos": "before",
                  "data-menu-icon-svg": "",
                  "data-menu-items": "[{\"text\":\"Work\",\"href\":\"/\"},{\"text\":\"About\",\"href\":\"/about\"},{\"text\":\"Contact\",\"href\":\"/contact\"}]",
                  "data-menu-level1-direction": "row",
                  "data-menu-variant": "footer",
                  "data-name": "Меню",
                  "data-st-menu": "1",
                  "data-node-id": "footer_00_block_003",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_003",
                "styleText": "min-height:32px;display:flex;align-items:flex-start;background:transparent;border:0;overflow:visible;color:#111827;box-sizing:border-box;--st-menu-gap:8px;--st-menu-root-gap:8px;--st-menu-link-color:#111827;--st-menu-link-fs:14px;--st-menu-radius:12px;--st-menu-item-bg:rgba(255,255,255,.06);--st-menu-item-bc:rgba(255,255,255,.10);--st-menu-item-bw:1px;--st-menu-item-shadow:none;--st-menu-item-bg:#7c3aed12;--st-menu-item-bc:#7c3aed24;",
                "style": {
                  "min-height": "32px",
                  "display": "flex",
                  "align-items": "flex-start",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "color": "#111827",
                  "box-sizing": "border-box",
                  "--st-menu-gap": "8px",
                  "--st-menu-root-gap": "8px",
                  "--st-menu-link-color": "#111827",
                  "--st-menu-link-fs": "14px",
                  "--st-menu-radius": "12px",
                  "--st-menu-item-bg": "#7c3aed12",
                  "--st-menu-item-bc": "#7c3aed24",
                  "--st-menu-item-bw": "1px",
                  "--st-menu-item-shadow": "none"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "nav",
                    "attrs": {
                      "aria-label": "Footer menu",
                      "class": "st-menu st-menu--footer"
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
                        "styleText": "list-style:none;margin:0;padding:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;",
                        "style": {
                          "list-style": "none",
                          "margin": "0",
                          "padding": "0",
                          "display": "flex",
                          "align-items": "center",
                          "gap": "8px",
                          "flex-wrap": "wrap"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:7px 11px;border-radius:12px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "7px 11px",
                                  "border-radius": "12px",
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
                                      "class": "st-menu__text"
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
                                        "text": "Work"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:7px 11px;border-radius:12px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "7px 11px",
                                  "border-radius": "12px",
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
                                      "class": "st-menu__text"
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
                                        "text": "About"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:7px 11px;border-radius:12px;background:var(--st-menu-item-bg,rgba(255,255,255,.06));border:var(--st-menu-item-bw,1px) solid var(--st-menu-item-bc,rgba(255,255,255,.10));color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "7px 11px",
                                  "border-radius": "12px",
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
                                      "class": "st-menu__text"
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
                                        "text": "Contact"
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
              "data-hf-template-container": "1",
              "data-layout-mode": "flex",
              "data-layout-orient": "column",
              "data-name": "Контейнер · Телефон",
              "data-st-node": "container",
              "data-node-id": "footer_00_container_004",
              "data-hf-node-type": "container",
              "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
            },
            "id": "footer_00_container_004",
            "styleText": "min-height:1px;width:0;max-width:100%;min-width:0;flex:1 1 0;display:flex;flex-direction:column;flex-wrap:nowrap;align-items:flex-start;justify-content:center;gap:8px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "1px",
              "width": "0",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1 1 0",
              "display": "flex",
              "flex-direction": "column",
              "flex-wrap": "nowrap",
              "align-items": "flex-start",
              "justify-content": "center",
              "gap": "8px",
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
                  "class": "hb-elem st-block st-block--phone",
                  "data-block-kind": "phone",
                  "data-hb-tip": "Телефон",
                  "data-name": "Телефон",
                  "data-phone-icon-pos": "left",
                  "data-phone-value": "+38 093 000 00 00",
                  "data-node-id": "footer_00_block_004",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_004",
                "styleText": "min-height:38px;display:inline-flex;align-items:center;gap:9px;padding:8px 11px;border-radius:999px;background:#7c3aed12;border:1px solid rgba(255,255,255,.12);overflow:visible;color:#111827;box-sizing:border-box;--st-icon-size:16px;",
                "style": {
                  "min-height": "38px",
                  "display": "inline-flex",
                  "align-items": "center",
                  "gap": "9px",
                  "padding": "8px 11px",
                  "border-radius": "999px",
                  "background": "#7c3aed12",
                  "border": "1px solid rgba(255,255,255,.12)",
                  "overflow": "visible",
                  "color": "#111827",
                  "box-sizing": "border-box",
                  "--st-icon-size": "16px"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "span",
                    "attrs": {
                      "aria-hidden": "true",
                      "class": "st-phone__icon"
                    },
                    "styleText": "display:inline-flex;color:#7c3aed;",
                    "style": {
                      "display": "inline-flex",
                      "color": "#7c3aed"
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
                  },
                  {
                    "type": "element",
                    "tag": "span",
                    "attrs": {
                      "class": "st-text-edit st-phone__text",
                      "contenteditable": "true",
                      "data-st-text-target": "1",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "font-size:14px;font-weight:800;line-height:1;white-space:nowrap;color:inherit;",
                    "style": {
                      "font-size": "14px",
                      "font-weight": "800",
                      "line-height": "1",
                      "white-space": "nowrap",
                      "color": "inherit"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "+38 093 000 00 00"
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
          "data-layout-mode": "flex",
          "data-layout-orient": "row",
          "data-st-footer-no-wrap-resize00458": "1",
          "data-st-node": "level",
          "data-node-id": "footer_00_level_003",
          "data-hf-node-type": "level",
          "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
        },
        "id": "footer_00_level_003",
        "styleText": "display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:nowrap;width:100%;max-width:100%;min-width:0;min-height:190px;box-sizing:border-box;overflow:visible;",
        "style": {
          "display": "flex",
          "align-items": "flex-start",
          "justify-content": "space-between",
          "gap": "24px",
          "flex-wrap": "nowrap",
          "width": "100%",
          "max-width": "100%",
          "min-width": "0",
          "min-height": "190px",
          "box-sizing": "border-box",
          "overflow": "visible"
        },
        "children": [
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-layout-mode": "flex",
              "data-layout-orient": "column",
              "data-name": "Бренд",
              "data-st-node": "container",
              "data-node-id": "footer_00_container_005",
              "data-hf-node-type": "container",
              "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
            },
            "id": "footer_00_container_005",
            "styleText": "min-height:46px;width:auto;max-width:100%;min-width:0;flex:1.28 1 280px;display:flex;flex-direction:column;flex-wrap:nowrap;align-items:flex-start;justify-content:flex-start;gap:11px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "46px",
              "width": "auto",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1.28 1 280px",
              "display": "flex",
              "flex-direction": "column",
              "flex-wrap": "nowrap",
              "align-items": "flex-start",
              "justify-content": "flex-start",
              "gap": "11px",
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
                  "data-logo-icon-color": "#7c3aed",
                  "data-logo-image-name": "",
                  "data-logo-image-url": "",
                  "data-logo-link-mode": "home",
                  "data-logo-mark-height": "42",
                  "data-logo-mark-width": "42",
                  "data-logo-mode": "logo-text-subtitle",
                  "data-logo-pos": "left",
                  "data-logo-source": "icon",
                  "data-logo-subtitle-size": "11",
                  "data-logo-title-size": "21",
                  "data-name": "Лого",
                  "data-node-id": "footer_00_block_005",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_005",
                "styleText": "width:auto;min-width:max-content;min-height:44px;display:grid;grid-template-columns:auto auto;grid-template-rows:auto auto;align-items:center;column-gap:11px;row-gap:2px;background:transparent;border:0;overflow:visible;color:#111827;--st-logo-mark-w:42px;--st-logo-mark-h:42px;--st-logo-gap:11px;--st-logo-icon-size-local:22px;--st-icon-bg:#7c3aed14;--st-icon-radius:14px;--st-icon-pad-y:9px;--st-icon-pad-x:9px;--st-icon-shadow:0 0 28px #7c3aed42;",
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
                  "--st-icon-bg": "#7c3aed14",
                  "--st-icon-radius": "14px",
                  "--st-icon-pad-y": "9px",
                  "--st-icon-pad-x": "9px",
                  "--st-icon-shadow": "0 0 28px #7c3aed42"
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
                    "styleText": "grid-column:1;grid-row:1 / span 2;width:42px;height:42px;display:grid;place-items:center;border-radius:14px;border:1px solid rgba(148,163,184,.22);background:#7c3aed14;overflow:hidden;position:relative;",
                    "style": {
                      "grid-column": "1",
                      "grid-row": "1 / span 2",
                      "width": "42px",
                      "height": "42px",
                      "display": "grid",
                      "place-items": "center",
                      "border-radius": "14px",
                      "border": "1px solid rgba(148,163,184,.22)",
                      "background": "#7c3aed14",
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
                    "styleText": "grid-column:1;grid-row:1 / span 2;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border:1px solid rgba(148,163,184,.22);border-radius:14px;background:#7c3aed14;color:#7c3aed;padding:9px;",
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
                      "background": "#7c3aed14",
                      "color": "#7c3aed",
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
                                "tag": "path",
                                "attrs": {
                                  "d": "M13 2 3 14h8l-1 8 11-14h-8l0-6z"
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
                      "data-st-text-target": "1",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "grid-column:2;grid-row:1;font-size:21px;line-height:1.06;font-weight:900;letter-spacing:-.03em;color:#111827;white-space:nowrap;",
                    "style": {
                      "grid-column": "2",
                      "grid-row": "1",
                      "font-size": "21px",
                      "line-height": "1.06",
                      "font-weight": "900",
                      "letter-spacing": "-.03em",
                      "color": "#111827",
                      "white-space": "nowrap"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Mira Studio"
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
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "grid-column:2;grid-row:2;font-size:11px;line-height:1.15;font-weight:750;color:#7c3aed;opacity:.92;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;",
                    "style": {
                      "grid-column": "2",
                      "grid-row": "2",
                      "font-size": "11px",
                      "line-height": "1.15",
                      "font-weight": "750",
                      "color": "#7c3aed",
                      "opacity": ".92",
                      "letter-spacing": ".08em",
                      "text-transform": "uppercase",
                      "white-space": "nowrap"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Portfolio"
                      }
                    ]
                  }
                ]
              },
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--text",
                  "data-block-kind": "text",
                  "data-hb-tip": "Текст",
                  "data-name": "Текст",
                  "data-node-id": "footer_00_block_006",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_006",
                "styleText": "width:auto;min-width:0;max-width:100%;min-height:28px;background:transparent;border:0;overflow:visible;box-sizing:border-box;max-width:315px;color:#4b5563;font-size:14px;line-height:1.48;font-weight:650;opacity:.88;",
                "style": {
                  "width": "auto",
                  "min-width": "0",
                  "max-width": "315px",
                  "min-height": "28px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "box-sizing": "border-box",
                  "color": "#4b5563",
                  "font-size": "14px",
                  "line-height": "1.48",
                  "font-weight": "650",
                  "opacity": ".88"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit",
                      "contenteditable": "true",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "display:block;width:auto;max-width:100%;min-width:0;min-height:0;height:auto;padding:0;border:0;word-break:normal;overflow-wrap:break-word;line-height:inherit;box-sizing:border-box;",
                    "style": {
                      "display": "block",
                      "width": "auto",
                      "max-width": "100%",
                      "min-width": "0",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0",
                      "word-break": "normal",
                      "overflow-wrap": "break-word",
                      "line-height": "inherit",
                      "box-sizing": "border-box"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Стильний футер для дизайнера, фотографа або персонального сайту: роботи, контакти, соцмережі."
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
                  "data-name": "Соцмережі",
                  "data-st-node": "container",
                  "data-st-social-group": "1",
                  "data-node-id": "footer_00_container_006",
                  "data-hf-node-type": "container",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_container_006",
                "styleText": "min-height:46px;width:auto;max-width:100%;min-width:0;flex:0 1 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:8px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
                "style": {
                  "min-height": "46px",
                  "width": "auto",
                  "max-width": "100%",
                  "min-width": "0",
                  "flex": "0 1 auto",
                  "display": "flex",
                  "flex-direction": "row",
                  "flex-wrap": "nowrap",
                  "align-items": "center",
                  "justify-content": "flex-start",
                  "gap": "8px",
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
                      "class": "hb-elem st-block st-block--icon",
                      "data-block-kind": "icon",
                      "data-hb-tip": "Viber",
                      "data-name": "Viber",
                      "data-node-id": "footer_00_block_007",
                      "data-hf-node-type": "block",
                      "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                    },
                    "id": "footer_00_block_007",
                    "styleText": "width:38px;min-width:38px;min-height:38px;display:flex;align-items:center;justify-content:center;background:transparent;border:0;overflow:visible;color:#7360F2;flex:0 0 38px;box-sizing:border-box;--st-icon-size:19px;--st-icon-bg:rgba(115,96,242,.12);--st-icon-bw:1px;--st-icon-bc:rgba(115,96,242,.30);--st-icon-radius:14px;--st-icon-pad-y:9px;--st-icon-pad-x:9px;--st-icon-shadow:0 0 22px rgba(115,96,242,.22);",
                    "style": {
                      "width": "38px",
                      "min-width": "38px",
                      "min-height": "38px",
                      "display": "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "background": "transparent",
                      "border": "0",
                      "overflow": "visible",
                      "color": "#7360F2",
                      "flex": "0 0 38px",
                      "box-sizing": "border-box",
                      "--st-icon-size": "19px",
                      "--st-icon-bg": "rgba(115,96,242,.12)",
                      "--st-icon-bw": "1px",
                      "--st-icon-bc": "rgba(115,96,242,.30)",
                      "--st-icon-radius": "14px",
                      "--st-icon-pad-y": "9px",
                      "--st-icon-pad-x": "9px",
                      "--st-icon-shadow": "0 0 22px rgba(115,96,242,.22)"
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
                        "styleText": "display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border:1px solid rgba(115,96,242,.30);border-radius:14px;background:rgba(115,96,242,.12);box-shadow:0 0 22px rgba(115,96,242,.22);color:#7360F2;padding:9px;",
                        "style": {
                          "display": "inline-flex",
                          "align-items": "center",
                          "justify-content": "center",
                          "width": "38px",
                          "height": "38px",
                          "border": "1px solid rgba(115,96,242,.30)",
                          "border-radius": "14px",
                          "background": "rgba(115,96,242,.12)",
                          "box-shadow": "0 0 22px rgba(115,96,242,.22)",
                          "color": "#7360F2",
                          "padding": "9px"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "span",
                            "attrs": {
                              "class": "st-icon-svg"
                            },
                            "styleText": "display:inline-flex;align-items:center;justify-content:center;width:var(--st-icon-size, 19px);height:var(--st-icon-size, 19px);min-width:var(--st-icon-size, 19px);min-height:var(--st-icon-size, 19px);line-height:0;color:inherit;",
                            "style": {
                              "display": "inline-flex",
                              "align-items": "center",
                              "justify-content": "center",
                              "width": "var(--st-icon-size, 19px)",
                              "height": "var(--st-icon-size, 19px)",
                              "min-width": "var(--st-icon-size, 19px)",
                              "min-height": "var(--st-icon-size, 19px)",
                              "line-height": "0",
                              "color": "inherit"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "svg",
                                "attrs": {
                                  "aria-hidden": "true",
                                  "fill": "currentColor",
                                  "viewbox": "0 0 24 24",
                                  "xmlns": "http://www.w3.org/2000/svg"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "path",
                                    "attrs": {
                                      "d": "M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.326 6.812-.416 7.15-.525.776-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546-.596-.55-3.006-2.3-8.375-2.323 0 0-.395-.025-1.037-.017zm.058 1.693c.545-.004.88.017.88.017 4.542.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v.002c-.604 4.878-4.174 5.184-4.832 5.395-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.12.12-.26.167-.352.144-.13-.033-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.292-4.43-8.895.054-2.604.543-4.738 1.996-6.173 1.96-1.773 5.474-2.018 7.11-2.03zm.38 2.602c-.167 0-.303.135-.304.302 0 .167.133.303.3.305 1.624.01 2.946.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334.002.167.14.3.307.3.166-.002.3-.138.3-.304-.014-1.984-.618-3.596-1.816-4.764-1.19-1.16-2.692-1.753-4.447-1.765zm-3.96.695c-.19-.032-.4.005-.616.117l-.01.002c-.43.247-.816.562-1.146.932-.002.004-.006.004-.008.008-.267.323-.42.638-.46.948-.008.046-.01.093-.007.14 0 .136.022.27.065.4l.013.01c.135.48.473 1.276 1.205 2.604.42.768.903 1.5 1.446 2.186.27.344.56.673.87.984l.132.132c.31.308.64.6.984.87.686.543 1.418 1.027 2.186 1.447 1.328.733 2.126 1.07 2.604 1.206l.01.014c.13.042.265.064.402.063.046.002.092 0 .138-.008.31-.036.627-.19.948-.46.004 0 .003-.002.008-.005.37-.33.683-.72.93-1.148l.003-.01c.225-.432.15-.842-.18-1.12-.004 0-.698-.58-1.037-.83-.36-.255-.73-.492-1.113-.71-.51-.285-1.032-.106-1.248.174l-.447.564c-.23.283-.657.246-.657.246-3.12-.796-3.955-3.955-3.955-3.955s-.037-.426.248-.656l.563-.448c.277-.215.456-.737.17-1.248-.217-.383-.454-.756-.71-1.115-.25-.34-.826-1.033-.83-1.035-.137-.165-.31-.265-.502-.297zm4.49.88c-.158.002-.29.124-.3.282-.01.167.115.312.282.324 1.16.085 2.017.466 2.645 1.15.63.688.93 1.524.906 2.57-.002.168.13.306.3.31.166.003.305-.13.31-.297.025-1.175-.334-2.193-1.067-2.994-.74-.81-1.777-1.253-3.05-1.346h-.024zm.463 1.63c-.16.002-.29.127-.3.287-.008.167.12.31.288.32.523.028.875.175 1.113.422.24.245.388.62.416 1.164.01.167.15.295.318.287.167-.008.295-.15.287-.317-.03-.644-.215-1.178-.58-1.557-.367-.378-.893-.574-1.52-.607h-.018z"
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
                      "class": "hb-elem st-block st-block--icon",
                      "data-block-kind": "icon",
                      "data-hb-tip": "Telegram",
                      "data-name": "Telegram",
                      "data-node-id": "footer_00_block_008",
                      "data-hf-node-type": "block",
                      "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                    },
                    "id": "footer_00_block_008",
                    "styleText": "width:38px;min-width:38px;min-height:38px;display:flex;align-items:center;justify-content:center;background:transparent;border:0;overflow:visible;color:#229ED9;flex:0 0 38px;box-sizing:border-box;--st-icon-size:19px;--st-icon-bg:rgba(34,158,217,.12);--st-icon-bw:1px;--st-icon-bc:rgba(34,158,217,.30);--st-icon-radius:14px;--st-icon-pad-y:9px;--st-icon-pad-x:9px;--st-icon-shadow:0 0 22px rgba(34,158,217,.22);",
                    "style": {
                      "width": "38px",
                      "min-width": "38px",
                      "min-height": "38px",
                      "display": "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "background": "transparent",
                      "border": "0",
                      "overflow": "visible",
                      "color": "#229ED9",
                      "flex": "0 0 38px",
                      "box-sizing": "border-box",
                      "--st-icon-size": "19px",
                      "--st-icon-bg": "rgba(34,158,217,.12)",
                      "--st-icon-bw": "1px",
                      "--st-icon-bc": "rgba(34,158,217,.30)",
                      "--st-icon-radius": "14px",
                      "--st-icon-pad-y": "9px",
                      "--st-icon-pad-x": "9px",
                      "--st-icon-shadow": "0 0 22px rgba(34,158,217,.22)"
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
                        "styleText": "display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border:1px solid rgba(34,158,217,.30);border-radius:14px;background:rgba(34,158,217,.12);box-shadow:0 0 22px rgba(34,158,217,.22);color:#229ED9;padding:9px;",
                        "style": {
                          "display": "inline-flex",
                          "align-items": "center",
                          "justify-content": "center",
                          "width": "38px",
                          "height": "38px",
                          "border": "1px solid rgba(34,158,217,.30)",
                          "border-radius": "14px",
                          "background": "rgba(34,158,217,.12)",
                          "box-shadow": "0 0 22px rgba(34,158,217,.22)",
                          "color": "#229ED9",
                          "padding": "9px"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "span",
                            "attrs": {
                              "class": "st-icon-svg"
                            },
                            "styleText": "display:inline-flex;align-items:center;justify-content:center;width:var(--st-icon-size, 19px);height:var(--st-icon-size, 19px);min-width:var(--st-icon-size, 19px);min-height:var(--st-icon-size, 19px);line-height:0;color:inherit;",
                            "style": {
                              "display": "inline-flex",
                              "align-items": "center",
                              "justify-content": "center",
                              "width": "var(--st-icon-size, 19px)",
                              "height": "var(--st-icon-size, 19px)",
                              "min-width": "var(--st-icon-size, 19px)",
                              "min-height": "var(--st-icon-size, 19px)",
                              "line-height": "0",
                              "color": "inherit"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "svg",
                                "attrs": {
                                  "aria-hidden": "true",
                                  "fill": "currentColor",
                                  "viewbox": "0 0 24 24",
                                  "xmlns": "http://www.w3.org/2000/svg"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "path",
                                    "attrs": {
                                      "d": "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
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
                      "class": "hb-elem st-block st-block--icon",
                      "data-block-kind": "icon",
                      "data-hb-tip": "Instagram",
                      "data-name": "Instagram",
                      "data-node-id": "footer_00_block_009",
                      "data-hf-node-type": "block",
                      "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                    },
                    "id": "footer_00_block_009",
                    "styleText": "width:38px;min-width:38px;min-height:38px;display:flex;align-items:center;justify-content:center;background:transparent;border:0;overflow:visible;color:#E4405F;flex:0 0 38px;box-sizing:border-box;--st-icon-size:19px;--st-icon-bg:rgba(228,64,95,.12);--st-icon-bw:1px;--st-icon-bc:rgba(228,64,95,.30);--st-icon-radius:14px;--st-icon-pad-y:9px;--st-icon-pad-x:9px;--st-icon-shadow:0 0 22px rgba(228,64,95,.22);",
                    "style": {
                      "width": "38px",
                      "min-width": "38px",
                      "min-height": "38px",
                      "display": "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "background": "transparent",
                      "border": "0",
                      "overflow": "visible",
                      "color": "#E4405F",
                      "flex": "0 0 38px",
                      "box-sizing": "border-box",
                      "--st-icon-size": "19px",
                      "--st-icon-bg": "rgba(228,64,95,.12)",
                      "--st-icon-bw": "1px",
                      "--st-icon-bc": "rgba(228,64,95,.30)",
                      "--st-icon-radius": "14px",
                      "--st-icon-pad-y": "9px",
                      "--st-icon-pad-x": "9px",
                      "--st-icon-shadow": "0 0 22px rgba(228,64,95,.22)"
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
                        "styleText": "display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border:1px solid rgba(228,64,95,.30);border-radius:14px;background:rgba(228,64,95,.12);box-shadow:0 0 22px rgba(228,64,95,.22);color:#E4405F;padding:9px;",
                        "style": {
                          "display": "inline-flex",
                          "align-items": "center",
                          "justify-content": "center",
                          "width": "38px",
                          "height": "38px",
                          "border": "1px solid rgba(228,64,95,.30)",
                          "border-radius": "14px",
                          "background": "rgba(228,64,95,.12)",
                          "box-shadow": "0 0 22px rgba(228,64,95,.22)",
                          "color": "#E4405F",
                          "padding": "9px"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "span",
                            "attrs": {
                              "class": "st-icon-svg"
                            },
                            "styleText": "display:inline-flex;align-items:center;justify-content:center;width:var(--st-icon-size, 19px);height:var(--st-icon-size, 19px);min-width:var(--st-icon-size, 19px);min-height:var(--st-icon-size, 19px);line-height:0;color:inherit;",
                            "style": {
                              "display": "inline-flex",
                              "align-items": "center",
                              "justify-content": "center",
                              "width": "var(--st-icon-size, 19px)",
                              "height": "var(--st-icon-size, 19px)",
                              "min-width": "var(--st-icon-size, 19px)",
                              "min-height": "var(--st-icon-size, 19px)",
                              "line-height": "0",
                              "color": "inherit"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "svg",
                                "attrs": {
                                  "aria-hidden": "true",
                                  "fill": "currentColor",
                                  "viewbox": "0 0 24 24",
                                  "xmlns": "http://www.w3.org/2000/svg"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "path",
                                    "attrs": {
                                      "d": "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"
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
                      "class": "hb-elem st-block st-block--icon",
                      "data-block-kind": "icon",
                      "data-hb-tip": "Facebook",
                      "data-name": "Facebook",
                      "data-node-id": "footer_00_block_010",
                      "data-hf-node-type": "block",
                      "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                    },
                    "id": "footer_00_block_010",
                    "styleText": "width:38px;min-width:38px;min-height:38px;display:flex;align-items:center;justify-content:center;background:transparent;border:0;overflow:visible;color:#1877F2;flex:0 0 38px;box-sizing:border-box;--st-icon-size:19px;--st-icon-bg:rgba(24,119,242,.12);--st-icon-bw:1px;--st-icon-bc:rgba(24,119,242,.30);--st-icon-radius:14px;--st-icon-pad-y:9px;--st-icon-pad-x:9px;--st-icon-shadow:0 0 22px rgba(24,119,242,.22);",
                    "style": {
                      "width": "38px",
                      "min-width": "38px",
                      "min-height": "38px",
                      "display": "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "background": "transparent",
                      "border": "0",
                      "overflow": "visible",
                      "color": "#1877F2",
                      "flex": "0 0 38px",
                      "box-sizing": "border-box",
                      "--st-icon-size": "19px",
                      "--st-icon-bg": "rgba(24,119,242,.12)",
                      "--st-icon-bw": "1px",
                      "--st-icon-bc": "rgba(24,119,242,.30)",
                      "--st-icon-radius": "14px",
                      "--st-icon-pad-y": "9px",
                      "--st-icon-pad-x": "9px",
                      "--st-icon-shadow": "0 0 22px rgba(24,119,242,.22)"
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
                        "styleText": "display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border:1px solid rgba(24,119,242,.30);border-radius:14px;background:rgba(24,119,242,.12);box-shadow:0 0 22px rgba(24,119,242,.22);color:#1877F2;padding:9px;",
                        "style": {
                          "display": "inline-flex",
                          "align-items": "center",
                          "justify-content": "center",
                          "width": "38px",
                          "height": "38px",
                          "border": "1px solid rgba(24,119,242,.30)",
                          "border-radius": "14px",
                          "background": "rgba(24,119,242,.12)",
                          "box-shadow": "0 0 22px rgba(24,119,242,.22)",
                          "color": "#1877F2",
                          "padding": "9px"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "span",
                            "attrs": {
                              "class": "st-icon-svg"
                            },
                            "styleText": "display:inline-flex;align-items:center;justify-content:center;width:var(--st-icon-size, 19px);height:var(--st-icon-size, 19px);min-width:var(--st-icon-size, 19px);min-height:var(--st-icon-size, 19px);line-height:0;color:inherit;",
                            "style": {
                              "display": "inline-flex",
                              "align-items": "center",
                              "justify-content": "center",
                              "width": "var(--st-icon-size, 19px)",
                              "height": "var(--st-icon-size, 19px)",
                              "min-width": "var(--st-icon-size, 19px)",
                              "min-height": "var(--st-icon-size, 19px)",
                              "line-height": "0",
                              "color": "inherit"
                            },
                            "children": [
                              {
                                "type": "element",
                                "tag": "svg",
                                "attrs": {
                                  "aria-hidden": "true",
                                  "fill": "currentColor",
                                  "viewbox": "0 0 24 24",
                                  "xmlns": "http://www.w3.org/2000/svg"
                                },
                                "children": [
                                  {
                                    "type": "element",
                                    "tag": "path",
                                    "attrs": {
                                      "d": "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
                                    }
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
              "data-layout-orient": "column",
              "data-name": "Роботи",
              "data-st-node": "container",
              "data-node-id": "footer_00_container_007",
              "data-hf-node-type": "container",
              "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
            },
            "id": "footer_00_container_007",
            "styleText": "min-height:46px;width:auto;max-width:100%;min-width:0;flex:1 1 175px;display:flex;flex-direction:column;flex-wrap:nowrap;align-items:flex-start;justify-content:flex-start;gap:8px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "46px",
              "width": "auto",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1 1 175px",
              "display": "flex",
              "flex-direction": "column",
              "flex-wrap": "nowrap",
              "align-items": "flex-start",
              "justify-content": "flex-start",
              "gap": "8px",
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
                  "data-hb-tip": "Заголовок",
                  "data-heading-level": "3",
                  "data-name": "Заголовок",
                  "data-node-id": "footer_00_block_011",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_011",
                "styleText": "width:auto;min-width:max-content;max-width:100%;min-height:32px;background:transparent;border:0;overflow:visible;flex:0 0 auto;box-sizing:border-box;color:#111827;font-size:17px;font-weight:950;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "max-width": "100%",
                  "min-height": "32px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "color": "#111827",
                  "font-size": "17px",
                  "font-weight": "950"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "aria-level": "3",
                      "class": "st-text-edit st-text-edit--heading",
                      "contenteditable": "true",
                      "data-st-heading": "1",
                      "draggable": "true",
                      "role": "heading",
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
                        "text": "Роботи"
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
                  "data-hb-tip": "Меню",
                  "data-menu-icon-pos": "before",
                  "data-menu-icon-svg": "",
                  "data-menu-items": "[{\"text\":\"Проєкти\",\"href\":\"/\"},{\"text\":\"Галерея\",\"href\":\"/галерея\"},{\"text\":\"Кейси\",\"href\":\"/кейси\"},{\"text\":\"Процес\",\"href\":\"/процес\"}]",
                  "data-menu-level1-direction": "column",
                  "data-menu-variant": "footer",
                  "data-name": "Меню",
                  "data-st-menu": "1",
                  "data-node-id": "footer_00_block_012",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_012",
                "styleText": "width:auto;min-width:0;max-width:100%;min-height:32px;display:flex;align-items:flex-start;background:transparent;border:0;overflow:visible;color:#4b5563;box-sizing:border-box;--st-menu-gap:8px;--st-menu-root-gap:8px;--st-menu-link-color:#4b5563;--st-menu-link-fs:14px;--st-menu-radius:12px;--st-menu-item-bg:rgba(255,255,255,.06);--st-menu-item-bc:rgba(255,255,255,.10);--st-menu-item-bw:1px;--st-menu-item-shadow:none;--st-menu-link-color:#4b5563;--st-menu-item-bg:transparent;--st-menu-item-bc:#7c3aed26;",
                "style": {
                  "width": "auto",
                  "min-width": "0",
                  "max-width": "100%",
                  "min-height": "32px",
                  "display": "flex",
                  "align-items": "flex-start",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "color": "#4b5563",
                  "box-sizing": "border-box",
                  "--st-menu-gap": "8px",
                  "--st-menu-root-gap": "8px",
                  "--st-menu-link-color": "#4b5563",
                  "--st-menu-link-fs": "14px",
                  "--st-menu-radius": "12px",
                  "--st-menu-item-bg": "transparent",
                  "--st-menu-item-bc": "#7c3aed26",
                  "--st-menu-item-bw": "1px",
                  "--st-menu-item-shadow": "none"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "nav",
                    "attrs": {
                      "aria-label": "Footer menu",
                      "class": "st-menu st-menu--footer"
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
                        "styleText": "list-style:none;margin:0;padding:0;display:flex;flex-direction:column;align-items:flex-start;gap:7px;",
                        "style": {
                          "list-style": "none",
                          "margin": "0",
                          "padding": "0",
                          "display": "flex",
                          "flex-direction": "column",
                          "align-items": "flex-start",
                          "gap": "7px"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:4px 0;border-radius:12px;background:transparent;border:0;color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "4px 0",
                                  "border-radius": "12px",
                                  "background": "transparent",
                                  "border": "0",
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
                                      "class": "st-menu__text"
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
                                        "text": "Проєкти"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:4px 0;border-radius:12px;background:transparent;border:0;color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "4px 0",
                                  "border-radius": "12px",
                                  "background": "transparent",
                                  "border": "0",
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
                                      "class": "st-menu__text"
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
                                        "text": "Галерея"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:4px 0;border-radius:12px;background:transparent;border:0;color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "4px 0",
                                  "border-radius": "12px",
                                  "background": "transparent",
                                  "border": "0",
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
                                      "class": "st-menu__text"
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
                                        "text": "Кейси"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:4px 0;border-radius:12px;background:transparent;border:0;color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "4px 0",
                                  "border-radius": "12px",
                                  "background": "transparent",
                                  "border": "0",
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
                                      "class": "st-menu__text"
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
                                        "text": "Процес"
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
              "data-layout-orient": "column",
              "data-name": "Про мене",
              "data-st-node": "container",
              "data-node-id": "footer_00_container_008",
              "data-hf-node-type": "container",
              "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
            },
            "id": "footer_00_container_008",
            "styleText": "min-height:46px;width:auto;max-width:100%;min-width:0;flex:1 1 175px;display:flex;flex-direction:column;flex-wrap:nowrap;align-items:flex-start;justify-content:flex-start;gap:8px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "46px",
              "width": "auto",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1 1 175px",
              "display": "flex",
              "flex-direction": "column",
              "flex-wrap": "nowrap",
              "align-items": "flex-start",
              "justify-content": "flex-start",
              "gap": "8px",
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
                  "data-hb-tip": "Заголовок",
                  "data-heading-level": "3",
                  "data-name": "Заголовок",
                  "data-node-id": "footer_00_block_013",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_013",
                "styleText": "width:auto;min-width:max-content;max-width:100%;min-height:32px;background:transparent;border:0;overflow:visible;flex:0 0 auto;box-sizing:border-box;color:#111827;font-size:17px;font-weight:950;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "max-width": "100%",
                  "min-height": "32px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "color": "#111827",
                  "font-size": "17px",
                  "font-weight": "950"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "aria-level": "3",
                      "class": "st-text-edit st-text-edit--heading",
                      "contenteditable": "true",
                      "data-st-heading": "1",
                      "draggable": "true",
                      "role": "heading",
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
                        "text": "Про мене"
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
                  "data-hb-tip": "Меню",
                  "data-menu-icon-pos": "before",
                  "data-menu-icon-svg": "",
                  "data-menu-items": "[{\"text\":\"Біографія\",\"href\":\"/\"},{\"text\":\"Послуги\",\"href\":\"/послуги\"},{\"text\":\"Відгуки\",\"href\":\"/відгуки\"},{\"text\":\"Контакт\",\"href\":\"/контакт\"}]",
                  "data-menu-level1-direction": "column",
                  "data-menu-variant": "footer",
                  "data-name": "Меню",
                  "data-st-menu": "1",
                  "data-node-id": "footer_00_block_014",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_014",
                "styleText": "width:auto;min-width:0;max-width:100%;min-height:32px;display:flex;align-items:flex-start;background:transparent;border:0;overflow:visible;color:#4b5563;box-sizing:border-box;--st-menu-gap:8px;--st-menu-root-gap:8px;--st-menu-link-color:#4b5563;--st-menu-link-fs:14px;--st-menu-radius:12px;--st-menu-item-bg:rgba(255,255,255,.06);--st-menu-item-bc:rgba(255,255,255,.10);--st-menu-item-bw:1px;--st-menu-item-shadow:none;--st-menu-link-color:#4b5563;--st-menu-item-bg:transparent;--st-menu-item-bc:#7c3aed26;",
                "style": {
                  "width": "auto",
                  "min-width": "0",
                  "max-width": "100%",
                  "min-height": "32px",
                  "display": "flex",
                  "align-items": "flex-start",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "color": "#4b5563",
                  "box-sizing": "border-box",
                  "--st-menu-gap": "8px",
                  "--st-menu-root-gap": "8px",
                  "--st-menu-link-color": "#4b5563",
                  "--st-menu-link-fs": "14px",
                  "--st-menu-radius": "12px",
                  "--st-menu-item-bg": "transparent",
                  "--st-menu-item-bc": "#7c3aed26",
                  "--st-menu-item-bw": "1px",
                  "--st-menu-item-shadow": "none"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "nav",
                    "attrs": {
                      "aria-label": "Footer menu",
                      "class": "st-menu st-menu--footer"
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
                        "styleText": "list-style:none;margin:0;padding:0;display:flex;flex-direction:column;align-items:flex-start;gap:7px;",
                        "style": {
                          "list-style": "none",
                          "margin": "0",
                          "padding": "0",
                          "display": "flex",
                          "flex-direction": "column",
                          "align-items": "flex-start",
                          "gap": "7px"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:4px 0;border-radius:12px;background:transparent;border:0;color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "4px 0",
                                  "border-radius": "12px",
                                  "background": "transparent",
                                  "border": "0",
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
                                      "class": "st-menu__text"
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
                                        "text": "Біографія"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:4px 0;border-radius:12px;background:transparent;border:0;color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "4px 0",
                                  "border-radius": "12px",
                                  "background": "transparent",
                                  "border": "0",
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
                                      "class": "st-menu__text"
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
                                        "text": "Послуги"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:4px 0;border-radius:12px;background:transparent;border:0;color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "4px 0",
                                  "border-radius": "12px",
                                  "background": "transparent",
                                  "border": "0",
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
                                      "class": "st-menu__text"
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
                                        "text": "Відгуки"
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
                                "styleText": "display:inline-flex;align-items:center;justify-content:flex-start;min-height:24px;width:auto;min-width:max-content;padding:4px 0;border-radius:12px;background:transparent;border:0;color:var(--st-menu-link-color,currentColor);text-decoration:none;font-size:var(--st-menu-link-fs,14px);font-weight:750;white-space:nowrap;box-sizing:border-box;",
                                "style": {
                                  "display": "inline-flex",
                                  "align-items": "center",
                                  "justify-content": "flex-start",
                                  "min-height": "24px",
                                  "width": "auto",
                                  "min-width": "max-content",
                                  "padding": "4px 0",
                                  "border-radius": "12px",
                                  "background": "transparent",
                                  "border": "0",
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
                                      "class": "st-menu__text"
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
                                        "text": "Контакт"
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
              "data-layout-orient": "column",
              "data-name": "Контакти",
              "data-st-node": "container",
              "data-node-id": "footer_00_container_009",
              "data-hf-node-type": "container",
              "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
            },
            "id": "footer_00_container_009",
            "styleText": "min-height:46px;width:auto;max-width:100%;min-width:0;flex:1.15 1 240px;display:flex;flex-direction:column;flex-wrap:nowrap;align-items:flex-start;justify-content:flex-start;gap:10px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "46px",
              "width": "auto",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1.15 1 240px",
              "display": "flex",
              "flex-direction": "column",
              "flex-wrap": "nowrap",
              "align-items": "flex-start",
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
                  "class": "hb-elem st-block st-block--text st-block--heading",
                  "data-block-kind": "text",
                  "data-block-role": "heading",
                  "data-hb-tip": "Заголовок",
                  "data-heading-level": "3",
                  "data-name": "Заголовок",
                  "data-node-id": "footer_00_block_015",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_015",
                "styleText": "width:auto;min-width:max-content;max-width:100%;min-height:32px;background:transparent;border:0;overflow:visible;flex:0 0 auto;box-sizing:border-box;color:#111827;font-size:17px;font-weight:950;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "max-width": "100%",
                  "min-height": "32px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "color": "#111827",
                  "font-size": "17px",
                  "font-weight": "950"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "aria-level": "3",
                      "class": "st-text-edit st-text-edit--heading",
                      "contenteditable": "true",
                      "data-st-heading": "1",
                      "draggable": "true",
                      "role": "heading",
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
                        "text": "Контакти"
                      }
                    ]
                  }
                ]
              },
              {
                "type": "block",
                "tag": "div",
                "attrs": {
                  "class": "hb-elem st-block st-block--phone",
                  "data-block-kind": "phone",
                  "data-hb-tip": "Телефон",
                  "data-name": "Телефон",
                  "data-phone-icon-pos": "left",
                  "data-phone-value": "+38 093 000 00 00",
                  "data-node-id": "footer_00_block_016",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_016",
                "styleText": "width:auto;min-width:max-content;min-height:38px;display:inline-flex;align-items:center;gap:9px;padding:8px 11px;border-radius:999px;background:#7c3aed14;border:1px solid rgba(255,255,255,.12);overflow:visible;color:#111827;flex:0 0 auto;box-sizing:border-box;--st-icon-size:16px;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "min-height": "38px",
                  "display": "inline-flex",
                  "align-items": "center",
                  "gap": "9px",
                  "padding": "8px 11px",
                  "border-radius": "999px",
                  "background": "#7c3aed14",
                  "border": "1px solid rgba(255,255,255,.12)",
                  "overflow": "visible",
                  "color": "#111827",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "--st-icon-size": "16px"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "span",
                    "attrs": {
                      "aria-hidden": "true",
                      "class": "st-phone__icon"
                    },
                    "styleText": "display:inline-flex;color:#7c3aed;",
                    "style": {
                      "display": "inline-flex",
                      "color": "#7c3aed"
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
                  },
                  {
                    "type": "element",
                    "tag": "span",
                    "attrs": {
                      "class": "st-text-edit st-phone__text",
                      "contenteditable": "true",
                      "data-st-text-target": "1",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "font-size:14px;font-weight:800;line-height:1;white-space:nowrap;color:inherit;",
                    "style": {
                      "font-size": "14px",
                      "font-weight": "800",
                      "line-height": "1",
                      "white-space": "nowrap",
                      "color": "inherit"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "+38 093 000 00 00"
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
                  "data-name": "Email",
                  "data-st-node": "container",
                  "data-node-id": "footer_00_container_010",
                  "data-hf-node-type": "container",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_container_010",
                "styleText": "min-height:46px;width:auto;max-width:100%;min-width:0;flex:0 1 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:8px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
                "style": {
                  "min-height": "46px",
                  "width": "auto",
                  "max-width": "100%",
                  "min-width": "0",
                  "flex": "0 1 auto",
                  "display": "flex",
                  "flex-direction": "row",
                  "flex-wrap": "nowrap",
                  "align-items": "center",
                  "justify-content": "flex-start",
                  "gap": "8px",
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
                      "class": "hb-elem st-block st-block--icon",
                      "data-block-kind": "icon",
                      "data-hb-tip": "Email",
                      "data-name": "Email",
                      "data-node-id": "footer_00_block_017",
                      "data-hf-node-type": "block",
                      "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                    },
                    "id": "footer_00_block_017",
                    "styleText": "width:36px;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center;background:transparent;border:0;overflow:visible;color:#7c3aed;flex:0 0 36px;box-sizing:border-box;--st-icon-size:19px;--st-icon-bg:#7c3aed12;--st-icon-bw:1px;--st-icon-bc:#7c3aed34;--st-icon-radius:14px;--st-icon-pad-y:9px;--st-icon-pad-x:9px;--st-icon-shadow:none;",
                    "style": {
                      "width": "36px",
                      "min-width": "36px",
                      "min-height": "36px",
                      "display": "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "background": "transparent",
                      "border": "0",
                      "overflow": "visible",
                      "color": "#7c3aed",
                      "flex": "0 0 36px",
                      "box-sizing": "border-box",
                      "--st-icon-size": "19px",
                      "--st-icon-bg": "#7c3aed12",
                      "--st-icon-bw": "1px",
                      "--st-icon-bc": "#7c3aed34",
                      "--st-icon-radius": "14px",
                      "--st-icon-pad-y": "9px",
                      "--st-icon-pad-x": "9px",
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
                        "styleText": "display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid #7c3aed34;border-radius:14px;background:#7c3aed12;box-shadow:none;color:#7c3aed;padding:9px;",
                        "style": {
                          "display": "inline-flex",
                          "align-items": "center",
                          "justify-content": "center",
                          "width": "36px",
                          "height": "36px",
                          "border": "1px solid #7c3aed34",
                          "border-radius": "14px",
                          "background": "#7c3aed12",
                          "box-shadow": "none",
                          "color": "#7c3aed",
                          "padding": "9px"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "span",
                            "attrs": {
                              "class": "st-icon-svg"
                            },
                            "styleText": "display:inline-flex;align-items:center;justify-content:center;width:var(--st-icon-size, 19px);height:var(--st-icon-size, 19px);min-width:var(--st-icon-size, 19px);min-height:var(--st-icon-size, 19px);line-height:0;color:inherit;",
                            "style": {
                              "display": "inline-flex",
                              "align-items": "center",
                              "justify-content": "center",
                              "width": "var(--st-icon-size, 19px)",
                              "height": "var(--st-icon-size, 19px)",
                              "min-width": "var(--st-icon-size, 19px)",
                              "min-height": "var(--st-icon-size, 19px)",
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
                                    "tag": "rect",
                                    "attrs": {
                                      "height": "16",
                                      "rx": "2",
                                      "width": "20",
                                      "x": "2",
                                      "y": "4"
                                    }
                                  },
                                  {
                                    "type": "element",
                                    "tag": "path",
                                    "attrs": {
                                      "d": "m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7"
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
                      "class": "hb-elem st-block st-block--text",
                      "data-block-kind": "text",
                      "data-hb-tip": "Текст",
                      "data-name": "Текст",
                      "data-node-id": "footer_00_block_018",
                      "data-hf-node-type": "block",
                      "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                    },
                    "id": "footer_00_block_018",
                    "styleText": "width:auto;min-width:0;max-width:100%;min-height:28px;background:transparent;border:0;overflow:visible;box-sizing:border-box;color:#4b5563;font-size:14px;font-weight:750;",
                    "style": {
                      "width": "auto",
                      "min-width": "0",
                      "max-width": "100%",
                      "min-height": "28px",
                      "background": "transparent",
                      "border": "0",
                      "overflow": "visible",
                      "box-sizing": "border-box",
                      "color": "#4b5563",
                      "font-size": "14px",
                      "font-weight": "750"
                    },
                    "children": [
                      {
                        "type": "element",
                        "tag": "div",
                        "attrs": {
                          "class": "st-text-edit",
                          "contenteditable": "true",
                          "draggable": "true",
                          "spellcheck": "false"
                        },
                        "styleText": "display:block;width:auto;max-width:100%;min-width:0;min-height:0;height:auto;padding:0;border:0;word-break:normal;overflow-wrap:break-word;line-height:inherit;box-sizing:border-box;",
                        "style": {
                          "display": "block",
                          "width": "auto",
                          "max-width": "100%",
                          "min-width": "0",
                          "min-height": "0",
                          "height": "auto",
                          "padding": "0",
                          "border": "0",
                          "word-break": "normal",
                          "overflow-wrap": "break-word",
                          "line-height": "inherit",
                          "box-sizing": "border-box"
                        },
                        "children": [
                          {
                            "type": "text",
                            "text": "mira@studio.ua"
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
                  "data-name": "Адреса",
                  "data-st-node": "container",
                  "data-node-id": "footer_00_container_011",
                  "data-hf-node-type": "container",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_container_011",
                "styleText": "min-height:46px;width:auto;max-width:100%;min-width:0;flex:0 1 auto;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:8px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
                "style": {
                  "min-height": "46px",
                  "width": "auto",
                  "max-width": "100%",
                  "min-width": "0",
                  "flex": "0 1 auto",
                  "display": "flex",
                  "flex-direction": "row",
                  "flex-wrap": "nowrap",
                  "align-items": "center",
                  "justify-content": "flex-start",
                  "gap": "8px",
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
                      "class": "hb-elem st-block st-block--icon",
                      "data-block-kind": "icon",
                      "data-hb-tip": "Адреса",
                      "data-name": "Адреса",
                      "data-node-id": "footer_00_block_019",
                      "data-hf-node-type": "block",
                      "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                    },
                    "id": "footer_00_block_019",
                    "styleText": "width:36px;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center;background:transparent;border:0;overflow:visible;color:#7c3aed;flex:0 0 36px;box-sizing:border-box;--st-icon-size:19px;--st-icon-bg:#7c3aed12;--st-icon-bw:1px;--st-icon-bc:#7c3aed34;--st-icon-radius:14px;--st-icon-pad-y:9px;--st-icon-pad-x:9px;--st-icon-shadow:none;",
                    "style": {
                      "width": "36px",
                      "min-width": "36px",
                      "min-height": "36px",
                      "display": "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "background": "transparent",
                      "border": "0",
                      "overflow": "visible",
                      "color": "#7c3aed",
                      "flex": "0 0 36px",
                      "box-sizing": "border-box",
                      "--st-icon-size": "19px",
                      "--st-icon-bg": "#7c3aed12",
                      "--st-icon-bw": "1px",
                      "--st-icon-bc": "#7c3aed34",
                      "--st-icon-radius": "14px",
                      "--st-icon-pad-y": "9px",
                      "--st-icon-pad-x": "9px",
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
                        "styleText": "display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid #7c3aed34;border-radius:14px;background:#7c3aed12;box-shadow:none;color:#7c3aed;padding:9px;",
                        "style": {
                          "display": "inline-flex",
                          "align-items": "center",
                          "justify-content": "center",
                          "width": "36px",
                          "height": "36px",
                          "border": "1px solid #7c3aed34",
                          "border-radius": "14px",
                          "background": "#7c3aed12",
                          "box-shadow": "none",
                          "color": "#7c3aed",
                          "padding": "9px"
                        },
                        "children": [
                          {
                            "type": "element",
                            "tag": "span",
                            "attrs": {
                              "class": "st-icon-svg"
                            },
                            "styleText": "display:inline-flex;align-items:center;justify-content:center;width:var(--st-icon-size, 19px);height:var(--st-icon-size, 19px);min-width:var(--st-icon-size, 19px);min-height:var(--st-icon-size, 19px);line-height:0;color:inherit;",
                            "style": {
                              "display": "inline-flex",
                              "align-items": "center",
                              "justify-content": "center",
                              "width": "var(--st-icon-size, 19px)",
                              "height": "var(--st-icon-size, 19px)",
                              "min-width": "var(--st-icon-size, 19px)",
                              "min-height": "var(--st-icon-size, 19px)",
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
                                    "tag": "path",
                                    "attrs": {
                                      "d": "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
                                    }
                                  },
                                  {
                                    "type": "element",
                                    "tag": "circle",
                                    "attrs": {
                                      "cx": "12",
                                      "cy": "10",
                                      "r": "3"
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
                      "class": "hb-elem st-block st-block--text",
                      "data-block-kind": "text",
                      "data-hb-tip": "Текст",
                      "data-name": "Текст",
                      "data-node-id": "footer_00_block_020",
                      "data-hf-node-type": "block",
                      "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                    },
                    "id": "footer_00_block_020",
                    "styleText": "width:auto;min-width:0;max-width:100%;min-height:28px;background:transparent;border:0;overflow:visible;box-sizing:border-box;color:#4b5563;font-size:14px;font-weight:750;",
                    "style": {
                      "width": "auto",
                      "min-width": "0",
                      "max-width": "100%",
                      "min-height": "28px",
                      "background": "transparent",
                      "border": "0",
                      "overflow": "visible",
                      "box-sizing": "border-box",
                      "color": "#4b5563",
                      "font-size": "14px",
                      "font-weight": "750"
                    },
                    "children": [
                      {
                        "type": "element",
                        "tag": "div",
                        "attrs": {
                          "class": "st-text-edit",
                          "contenteditable": "true",
                          "draggable": "true",
                          "spellcheck": "false"
                        },
                        "styleText": "display:block;width:auto;max-width:100%;min-width:0;min-height:0;height:auto;padding:0;border:0;word-break:normal;overflow-wrap:break-word;line-height:inherit;box-sizing:border-box;",
                        "style": {
                          "display": "block",
                          "width": "auto",
                          "max-width": "100%",
                          "min-width": "0",
                          "min-height": "0",
                          "height": "auto",
                          "padding": "0",
                          "border": "0",
                          "word-break": "normal",
                          "overflow-wrap": "break-word",
                          "line-height": "inherit",
                          "box-sizing": "border-box"
                        },
                        "children": [
                          {
                            "type": "text",
                            "text": "Львів · Україна"
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
                  "class": "hb-elem st-block st-block--button",
                  "data-block-kind": "button",
                  "data-button-click-area": "all",
                  "data-button-color1": "#7c3aed",
                  "data-button-color2": "#0ea5e9",
                  "data-button-extra-preset": "cta",
                  "data-button-fill-mode": "gradient",
                  "data-button-gradient-angle": "135",
                  "data-button-href": "#",
                  "data-button-icon-color": "#ffffff",
                  "data-button-icon-pos": "right",
                  "data-button-icon-svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5 12h14\"></path><path d=\"m12 5 7 7-7 7\"></path></svg>",
                  "data-button-link-mode": "custom",
                  "data-button-mode": "text-icon",
                  "data-button-shape": "pill",
                  "data-button-text": "Замовити",
                  "data-hb-tip": "Кнопка",
                  "data-name": "Кнопка",
                  "data-node-id": "footer_00_block_021",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_021",
                "styleText": "width:auto;min-width:max-content;min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:10px 15px;border-radius:999px;background:linear-gradient(135deg, #7c3aed, #0ea5e9);color:#ffffff;border:1px solid rgba(255,255,255,.12);box-shadow:0 18px 34px #7c3aed30;overflow:visible;flex:0 0 auto;box-sizing:border-box;--st-button-fill:linear-gradient(135deg, #7c3aed, #0ea5e9);--st-button-fg:#ffffff;--st-button-border:1px solid rgba(255,255,255,.12);--st-button-radius:999px;--st-button-shadow:0 18px 34px #7c3aed30;--st-icon-size:16px;",
                "style": {
                  "width": "auto",
                  "min-width": "max-content",
                  "min-height": "40px",
                  "display": "inline-flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "gap": "9px",
                  "padding": "10px 15px",
                  "border-radius": "999px",
                  "background": "linear-gradient(135deg, #7c3aed, #0ea5e9)",
                  "color": "#ffffff",
                  "border": "1px solid rgba(255,255,255,.12)",
                  "box-shadow": "0 18px 34px #7c3aed30",
                  "overflow": "visible",
                  "flex": "0 0 auto",
                  "box-sizing": "border-box",
                  "--st-button-fill": "linear-gradient(135deg, #7c3aed, #0ea5e9)",
                  "--st-button-fg": "#ffffff",
                  "--st-button-border": "1px solid rgba(255,255,255,.12)",
                  "--st-button-radius": "999px",
                  "--st-button-shadow": "0 18px 34px #7c3aed30",
                  "--st-icon-size": "16px"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit st-button__label",
                      "contenteditable": "true",
                      "data-st-text-target": "1",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "font-size:15px;font-weight:850;line-height:1.1;color:inherit;white-space:nowrap;word-break:normal;overflow-wrap:normal;display:block;width:auto;min-height:0;height:auto;padding:0;border:0;",
                    "style": {
                      "font-size": "15px",
                      "font-weight": "850",
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
                        "text": "Замовити"
                      }
                    ]
                  },
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
          "data-layout-mode": "flex",
          "data-layout-orient": "row",
          "data-st-footer-no-wrap-resize00458": "1",
          "data-st-node": "level",
          "data-node-id": "footer_00_level_004",
          "data-hf-node-type": "level",
          "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
        },
        "id": "footer_00_level_004",
        "styleText": "display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:nowrap;width:100%;max-width:100%;min-width:0;min-height:38px;box-sizing:border-box;overflow:visible;padding-top:12px;border-top:1px solid rgba(124,58,237,.18);",
        "style": {
          "display": "flex",
          "align-items": "center",
          "justify-content": "space-between",
          "gap": "12px",
          "flex-wrap": "nowrap",
          "width": "100%",
          "max-width": "100%",
          "min-width": "0",
          "min-height": "38px",
          "box-sizing": "border-box",
          "overflow": "visible",
          "padding-top": "12px",
          "border-top": "1px solid rgba(124,58,237,.18)"
        },
        "children": [
          {
            "type": "container",
            "tag": "div",
            "attrs": {
              "class": "st-block",
              "data-hf-template-container": "1",
              "data-layout-mode": "flex",
              "data-layout-orient": "column",
              "data-name": "Контейнер · Текст",
              "data-st-node": "container",
              "data-node-id": "footer_00_container_012",
              "data-hf-node-type": "container",
              "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
            },
            "id": "footer_00_container_012",
            "styleText": "min-height:1px;width:0;max-width:100%;min-width:0;flex:1 1 0;display:flex;flex-direction:column;flex-wrap:nowrap;align-items:flex-start;justify-content:center;gap:8px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "1px",
              "width": "0",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1 1 0",
              "display": "flex",
              "flex-direction": "column",
              "flex-wrap": "nowrap",
              "align-items": "flex-start",
              "justify-content": "center",
              "gap": "8px",
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
                  "data-node-id": "footer_00_block_022",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_022",
                "styleText": "min-height:28px;background:transparent;border:0;overflow:visible;box-sizing:border-box;font-size:12px;font-weight:700;opacity:.72;color:inherit;color:#4b5563;",
                "style": {
                  "min-height": "28px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "box-sizing": "border-box",
                  "font-size": "12px",
                  "font-weight": "700",
                  "opacity": ".72",
                  "color": "#4b5563"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit",
                      "contenteditable": "true",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "display:block;width:auto;max-width:100%;min-width:0;min-height:0;height:auto;padding:0;border:0;word-break:normal;overflow-wrap:break-word;line-height:inherit;box-sizing:border-box;",
                    "style": {
                      "display": "block",
                      "width": "auto",
                      "max-width": "100%",
                      "min-width": "0",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0",
                      "word-break": "normal",
                      "overflow-wrap": "break-word",
                      "line-height": "inherit",
                      "box-sizing": "border-box"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "© 2026 Mira Studio. Усі права захищені."
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
              "data-hf-template-container": "1",
              "data-layout-mode": "flex",
              "data-layout-orient": "column",
              "data-name": "Контейнер · Текст",
              "data-st-node": "container",
              "data-node-id": "footer_00_container_013",
              "data-hf-node-type": "container",
              "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
            },
            "id": "footer_00_container_013",
            "styleText": "min-height:1px;width:0;max-width:100%;min-width:0;flex:1 1 0;display:flex;flex-direction:column;flex-wrap:nowrap;align-items:flex-start;justify-content:center;gap:8px;background:transparent;border:0;overflow:visible;padding:0;box-sizing:border-box;",
            "style": {
              "min-height": "1px",
              "width": "0",
              "max-width": "100%",
              "min-width": "0",
              "flex": "1 1 0",
              "display": "flex",
              "flex-direction": "column",
              "flex-wrap": "nowrap",
              "align-items": "flex-start",
              "justify-content": "center",
              "gap": "8px",
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
                  "data-node-id": "footer_00_block_023",
                  "data-hf-node-type": "block",
                  "data-hf-template-id": "footer_00_test_portfolio_artist_json_v1"
                },
                "id": "footer_00_block_023",
                "styleText": "min-height:28px;background:transparent;border:0;overflow:visible;box-sizing:border-box;color:#7c3aed;font-size:12px;font-weight:950;letter-spacing:.07em;text-transform:uppercase;",
                "style": {
                  "min-height": "28px",
                  "background": "transparent",
                  "border": "0",
                  "overflow": "visible",
                  "box-sizing": "border-box",
                  "color": "#7c3aed",
                  "font-size": "12px",
                  "font-weight": "950",
                  "letter-spacing": ".07em",
                  "text-transform": "uppercase"
                },
                "children": [
                  {
                    "type": "element",
                    "tag": "div",
                    "attrs": {
                      "class": "st-text-edit",
                      "contenteditable": "true",
                      "draggable": "true",
                      "spellcheck": "false"
                    },
                    "styleText": "display:block;width:auto;max-width:100%;min-width:0;min-height:0;height:auto;padding:0;border:0;word-break:normal;overflow-wrap:break-word;line-height:inherit;box-sizing:border-box;",
                    "style": {
                      "display": "block",
                      "width": "auto",
                      "max-width": "100%",
                      "min-width": "0",
                      "min-height": "0",
                      "height": "auto",
                      "padding": "0",
                      "border": "0",
                      "word-break": "normal",
                      "overflow-wrap": "break-word",
                      "line-height": "inherit",
                      "box-sizing": "border-box"
                    },
                    "children": [
                      {
                        "type": "text",
                        "text": "Portfolio Artist — персональний бренд · Footer Template"
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

const FOOTER_00_TEST_PORTFOLIO_ARTIST_TEMPLATE = {
  id: "footer_00_test_portfolio_artist_json_v1",
  type: "footer",
  folderId: "fld_footer",
  name: "00 · TEST — Portfolio Artist JSON model",
  preview: "00-test-portfolio-artist-json",
  description: "Тестова копія шаблону 24 Portfolio Artist. Джерело істини — JSON model; HTML генерується з model. Додано окремий контейнер із заголовком ТЕСТ.",
  meta: {
  "source": "system",
  "palette": "portfolio violet white",
  "footerSize": "premium",
  "tools": [
    "section",
    "row",
    "container",
    "logo",
    "heading",
    "menu",
    "text",
    "phone",
    "icon",
    "button",
    "png",
    "gradient"
  ],
  "testTemplate": "00",
  "sourceTemplateId": "footer_premium_portfolio_artist_v1",
  "sourceTemplateName": "24 · Portfolio Artist — персональний бренд",
  "jsonModel": "st-hf-json-v1",
  "singleSourceOfTruth": "model"
},
  modelVersion: "st-hf-json-v1",
  model: FOOTER_00_TEST_PORTFOLIO_ARTIST_MODEL,
  html: renderHfTemplateModelToHtml00545_(FOOTER_00_TEST_PORTFOLIO_ARTIST_MODEL)
};



// =======================================================
// [00690] Тестовий футер для Глобальних стилів.
// Активна структура береться з існуючої JSON-моделі FOOTER 00,
// а стиль проходить через той самий shared adapter, що й тестова шапка.
// Це не дублює StyleStore/Theme API: Header і Footer читають одні CSS tokens.
// =======================================================
// [00711] Повернення початкового світлого вигляду тестового футера.
// Причина: після 00700/00701 цей тестовий шаблон почав повністю слухати
// section/container/block tokens і міг ставати темним разом із глобальною темою.
// Тут лишаємо JSON-структуру/ID/label для Global Design test, але стилі беремо
// з початкового FOOTER_00_TEST_PORTFOLIO_ARTIST_MODEL без перефарбування adapter-ом.
const FOOTER_TEST_GLOBAL_STYLES_MODEL = retargetHfTemplateForGlobalStyles00690(FOOTER_00_TEST_PORTFOLIO_ARTIST_MODEL, {
  scope: 'footer',
  oldTemplateId: 'footer_00_test_portfolio_artist_json_v1',
  newTemplateId: 'footer_test_global_styles_json_v1',
  oldPrefix: 'footer_00_',
  newPrefix: 'footer_gd_',
  labelText: 'Тест ГЛОБАЛЬНИХ СТИЛІВ · ФУТЕР'
});

const FOOTER_TEST_GLOBAL_STYLES_TEMPLATE = {
  id: "footer_test_global_styles_json_v1",
  type: "footer",
  folderId: "fld_footer",
  name: "Тест ГЛОБАЛЬНИХ СТИЛІВ · Футер",
  preview: "test-global-styles-footer-json-00690",
  description: "Дублікат робочого тестового JSON-футера для перевірки спільного StyleStore з шапкою. Контент і структура не змінюються, стилі беруться через ті самі CSS variables.",
  meta: {
    "source": "system",
    "palette": "global-style-tokens",
    "footerSize": "premium",
    "tools": ["section", "row", "container", "logo", "heading", "menu", "text", "phone", "icon", "button", "gradient"],
    "testTemplate": "global-styles-00690",
    "sourceTemplateId": "footer_00_test_portfolio_artist_json_v1",
    "sourceTemplateName": "00 · TEST — Portfolio Artist JSON model",
    "jsonModel": "st-hf-json-v1",
    "singleSourceOfTruth": "model",
    "globalStyleTest": true,
    "styleStore": "st_global_style_store_v1",
    "sharedAdapter": "hf-global-style-adapter-00690"
  },
  styleProfile: FOOTER_GLOBAL_STYLE_TEST_PROFILE_00946,
  modelVersion: "st-hf-json-v1",
  model: FOOTER_TEST_GLOBAL_STYLES_MODEL,
  html: renderHfTemplateModelToHtml00545_(FOOTER_TEST_GLOBAL_STYLES_MODEL)
};

const FOOTER_TEMPLATES = [FOOTER_00_TEST_PORTFOLIO_ARTIST_TEMPLATE, FOOTER_TEST_GLOBAL_STYLES_TEMPLATE];

FOOTER_TEMPLATES.unshift(...STANDALONE_CANONICAL_FOOTER_TEMPLATES_00974);
FOOTER_TEMPLATES.unshift(...PAIRED_FOOTER_TEMPLATES_00973);
FOOTER_TEMPLATES.unshift(SCHOOL_01_FOOTER_TEMPLATE_00962);
FOOTER_TEMPLATES.unshift(SHIFTTIME_MARKETPLACE_01_FOOTER_TEMPLATE_00981);
FOOTER_TEMPLATES.unshift(SHIFTTIME_MARKETPLACE_02_FOOTER_TEMPLATE_00984);

let __CACHE = null;

function cloneTemplate_(tpl) {
  try { return JSON.parse(JSON.stringify(tpl)); } catch (_) { return { ...tpl }; }
}

export function getFooterTemplatesDemo() {
  if (!__CACHE) __CACHE = FOOTER_TEMPLATES;
  return __CACHE.map(cloneTemplate_);
}
