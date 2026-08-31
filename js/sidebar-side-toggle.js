// js/sidebar-side-toggle.js
// =========================================================
// ПЕРЕМІЩЕННЯ ГОЛОВНОГО САЙДБАРА ЛІВО/ПРАВО
// - Клік по кнопці з:
//   • data-toggle-sidebar-side
//   • data-action="toggle-side"
//   • data-action="toggle-sidebar-side"
// - Перемикаємо класи на #builder-root
// - Стан зберігаємо в localStorage
// - Лістенер вішаємо 1 раз (захист від дублювання)
// =========================================================

const LS_KEY = "st_sidebar_side_v2";
const BIND_GUARD = "__stSidebarSideToggleBound_v2";

function getRoot() {
  return document.getElementById("builder-root");
}

// 🔎 Перевірка: чи клікнули по нашій кнопці
function findToggleBtn(target) {
  if (!target) return null;

  return (
    target.closest("[data-toggle-sidebar-side]") ||
    target.closest('button[data-action="toggle-side"]') ||
    target.closest('button[data-action="toggle-sidebar-side"]') ||
    null
  );
}

// ✅ Визначаємо поточний бік по можливих класах на root
function detectSide(root) {
  if (!root) return "left";

  const rightClasses = [
    "builder--side-right",
    "builder--sidebar-right",
    "builder--right-sidebar",
    "builder--sidebar-on-right",
  ];

  for (const c of rightClasses) {
    if (root.classList.contains(c)) return "right";
  }
  return "left";
}

// ✅ Ставимо бік (оновлюємо всі сумісні класи)
function applySide(root, side) {
  if (!root) return;

  const isRight = side === "right";

  // --- базові класи (нові) ---
  root.classList.toggle("builder--side-right", isRight);
  root.classList.toggle("builder--side-left", !isRight);

  // --- сумісність зі старими/іншими назвами ---
  root.classList.toggle("builder--sidebar-right", isRight);
  root.classList.toggle("builder--right-sidebar", isRight);
  root.classList.toggle("builder--sidebar-on-right", isRight);

  // ✅ persist
  try {
    localStorage.setItem(LS_KEY, isRight ? "right" : "left");
  } catch (_) {}
}

// 🔁 Перемикаємо
function toggleSide(root) {
  const cur = detectSide(root);
  applySide(root, cur === "left" ? "right" : "left");
}

// 🚀 Ініціалізація
export function initSidebarSideToggle() {
  const root = getRoot();
  if (!root) {
    console.warn("[sidebar-side-toggle] ❌ #builder-root не знайдено");
    return;
  }

  // ✅ Відновлюємо з localStorage
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "right" || saved === "left") {
      applySide(root, saved);
    }
  } catch (_) {}

  // ✅ Захист від повторного навішування
  if (window[BIND_GUARD]) return;
  window[BIND_GUARD] = true;

  // ✅ Делегування кліку (1 раз на документ)
  document.addEventListener("click", (e) => {
    const btn = findToggleBtn(e.target);
    if (!btn) return;

    // Якщо кнопка раптом всередині форми — не даємо сабмітнути
    e.preventDefault();

    console.log("[sidebar-side-toggle] ✅ click -> toggle");
    toggleSide(root);
  });
}
