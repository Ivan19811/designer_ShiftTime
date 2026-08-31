// js/builder-header-toggle.js
// Hide/show main builder header
// - Click "hide header" button toggles header
// - ESC restores header (if hidden)
// - Saves state in localStorage

const LS_KEY = "st_builder_header_hidden_v1";

export function initBuilderHeaderToggle() {
  const root = document.getElementById("builder-root");
  const hideBtn = document.getElementById("builder-hide-header-btn");

  if (!root || !hideBtn) {
    console.warn("[builder-header-toggle] root or #builder-hide-header-btn not found");
    return;
  }

  function setHidden(hidden) {
    root.classList.toggle("builder--header-hidden", !!hidden);
    try { localStorage.setItem(LS_KEY, hidden ? "1" : "0"); } catch {}
  }

  function isHidden() {
    return root.classList.contains("builder--header-hidden");
  }

  // Toggle by click
  hideBtn.addEventListener("click", () => {
    setHidden(!isHidden());
  });

  // Restore from storage
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "1") setHidden(true);
  } catch {}

  // ESC -> show header if hidden
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isHidden()) {
      e.preventDefault();
      setHidden(false);
    }
  }, true);

  // API for other modules
  window.ST_SHOW_BUILDER_HEADER = () => setHidden(false);
  window.ST_HIDE_BUILDER_HEADER = () => setHidden(true);
  window.ST_IS_BUILDER_HEADER_HIDDEN = () => isHidden();
}
