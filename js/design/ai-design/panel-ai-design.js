// AI content-page panel disabled in CLEAN-BASE-0001.
// Clean base keeps Header/Footer/Global Design only.
export function initAiDesignPanel() {
  try {
    window.__ST_AI_DESIGN_PANEL_READY__ = true;
    window.__ST_AI_DESIGN_PANEL_DISABLED_CLEAN_BASE__ = true;
  } catch (_) {}
  return null;
}
