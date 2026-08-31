// js/design/widgets/templates/site/templates-view.js
// РЕЖИМ ШАБЛОНІВ (MVP): ховає canvas header + site-root і показує gallery view
// Кнопки Apply/Edit/SaveAs/Back — у верхній шапці Templates View

import {
  listTemplatesByType,
  getTemplateById,
  addTemplate,
  upsertSystemTemplatesOnce
} from "../store/templates-store.js";

const TYPE = "site";

function qs(sel) { return document.querySelector(sel); }

function getCanvasHeader() { return qs(".canvas__header"); }
function getSiteRoot() { return document.getElementById("site-root"); }
function getCanvasScroll() { return qs(".canvas__scroll"); }

function ensureSystemTemplates() {
  const demo = [
    {
      id: "site_demo_minimal_v1",
      type: TYPE,
      name: "Minimal — 3 blocks",
      html: `
        <section class="st-section">
          <div class="st-row">
            <div class="st-block"></div>
            <div class="st-block"></div>
            <div class="st-block"></div>
          </div>
        </section>
      `
    },
    {
      id: "site_demo_hero_cards_v1",
      type: TYPE,
      name: "Hero + Cards",
      html: `
        <section class="st-section">
          <div class="st-row">
            <div class="st-block">
              <div style="padding:18px">
                <div style="font-weight:800;font-size:22px;margin-bottom:6px">Hero Title</div>
                <div style="opacity:.85">Subtitle text for your landing page.</div>
              </div>
            </div>
          </div>
        </section>
        <section class="st-section">
          <div class="st-row">
            <div class="st-block"></div>
            <div class="st-block"></div>
            <div class="st-block"></div>
          </div>
        </section>
      `
    }
  ];
  upsertSystemTemplatesOnce(demo);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* =========================
   Режим шаблонів: enter/exit
   ========================= */

function enterTemplatesMode() {
  const header = getCanvasHeader();
  const root = getSiteRoot();

  if (header) header.style.display = "none";
  if (root) root.style.display = "none";
}

function exitTemplatesMode() {
  const header = getCanvasHeader();
  const root = getSiteRoot();

  if (header) header.style.display = "";
  if (root) root.style.display = "";
}

function getOrCreateView() {
  const scroll = getCanvasScroll();
  if (!scroll) return null;

  let view = document.getElementById("templatesGalleryView");
  if (!view) {
    view = document.createElement("div");
    view.id = "templatesGalleryView";
    view.className = "sttpl-view";
    scroll.prepend(view);
  }
  return view;
}

// глобальний стан selection (який шаблон вибраний)
let selectedTemplateId = null;

function renderGallery(view) {
  const list = listTemplatesByType(TYPE);

  if (!selectedTemplateId && list[0]) selectedTemplateId = list[0].id;
  const selected = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;

  view.innerHTML = `
    <div class="sttpl-view__bar">
      <div class="sttpl-view__title">
        Шаблони → Сайт
        <span class="sttpl-view__sub">
          ${selected ? " | " + escapeHtml(selected.name) : ""}
        </span>
      </div>

      <div class="sttpl-view__right">
        <button class="sttpl-btn" data-act="back">← Назад</button>
        <button class="sttpl-btn sttpl-btn--primary" data-act="apply" ${selected ? "" : "disabled"}>Застосувати</button>
        <button class="sttpl-btn" data-act="edit" ${selected ? "" : "disabled"}>Редагувати</button>
        <button class="sttpl-btn" data-act="saveas">Зберегти як</button>
      </div>
    </div>

    <div class="sttpl-view__grid">
      ${list.map(t => `
        <div class="sttpl-card ${t.id === selectedTemplateId ? "is-selected" : ""}" data-tpl-id="${t.id}">
          <div class="sttpl-card__preview">
            <div class="sttpl-card__preview-inner">Preview</div>
          </div>
          <div class="sttpl-card__meta">
            <div class="sttpl-card__name">${escapeHtml(t.name)}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

export function openSiteTemplatesGallery() {
  ensureSystemTemplates();

  const view = getOrCreateView();
  if (!view) {
    console.warn("[templates-view] templatesGalleryView cannot be created");
    return;
  }

  enterTemplatesMode();
  view.style.display = "";
  renderGallery(view);
}

export function closeTemplatesGallery() {
  const view = document.getElementById("templatesGalleryView");
  if (view) view.style.display = "none";
  exitTemplatesMode();
}

/* =========================
   Делегування кліків у view
   ========================= */

export function handleTemplatesGalleryClick(e) {
  const view = document.getElementById("templatesGalleryView");
  if (!view || view.style.display === "none") return;

  // Вибір картки
  const card = e.target.closest(".sttpl-card[data-tpl-id]");
  if (card) {
    selectedTemplateId = card.dataset.tplId || null;
    renderGallery(view);
    return;
  }

  // Кнопки в шапці view
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;

  const act = btn.dataset.act;

  if (act === "back") {
    closeTemplatesGallery();
    return;
  }

  if (act === "apply") {
    const tpl = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;
    const root = getSiteRoot();
    if (tpl && root) root.innerHTML = tpl.html;

    // ✅ повертаємось у конструктор
    closeTemplatesGallery();
    return;
  }

  if (act === "edit") {
    const tpl = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;
    const root = getSiteRoot();
    if (tpl && root) root.innerHTML = tpl.html;

    // ✅ повертаємось у конструктор (режим шаблонів вимикаємо)
    closeTemplatesGallery();
    return;
  }

  if (act === "saveas") {
    const root = getSiteRoot();
    if (!root) return;

    const name = prompt("Назва нового шаблону (Сайт):", "Мій шаблон");
    if (!name) return;

    addTemplate({ type: TYPE, name, html: root.innerHTML });

    // залишаємося в режимі шаблонів і оновлюємо список
    renderGallery(view);
    return;
  }
}
