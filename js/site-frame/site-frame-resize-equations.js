// js/site-frame/site-frame-resize-equations.js
// 00898: pure shared resize equations for Header/Main/Footer.
// No DOM access, no area-specific branches and no post-resize normalization.

export const SITE_FRAME_RESIZE_EQUATIONS_VERSION = '00898-site-frame-adjacent-pair-canvas-width-invariant';

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveInteger(value, fallback = 1) {
  return Math.max(1, Math.round(finiteNumber(value, fallback)));
}

function clampInteger(value, min, max) {
  const safeMin = Math.ceil(finiteNumber(min, 0));
  const safeMax = Math.max(safeMin, Math.floor(finiteNumber(max, safeMin)));
  return Math.max(safeMin, Math.min(safeMax, Math.round(finiteNumber(value, safeMin))));
}

/**
 * Convert measured fractional tracks to integer pixels while preserving the
 * rounded total exactly. The largest fractional remainders receive the spare
 * pixels, so there is no cumulative row-width drift.
 */
export function normalizeMeasuredWidths(rawWidths = []) {
  if (!Array.isArray(rawWidths) || rawWidths.length === 0) return Object.freeze([]);
  const measured = rawWidths.map((value) => Math.max(1, finiteNumber(value, 1)));
  const targetTotal = Math.max(measured.length, Math.round(measured.reduce((sum, value) => sum + value, 0)));
  const widths = measured.map((value) => Math.max(1, Math.floor(value)));
  let remaining = targetTotal - widths.reduce((sum, value) => sum + value, 0);

  const order = measured
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  let cursor = 0;
  while (remaining > 0 && order.length) {
    widths[order[cursor % order.length].index] += 1;
    remaining -= 1;
    cursor += 1;
  }

  while (remaining < 0) {
    const candidate = widths.findIndex((value) => value > 1);
    if (candidate < 0) break;
    widths[candidate] -= 1;
    remaining += 1;
  }

  return Object.freeze(widths);
}

/**
 * If an existing container is already narrower than its intrinsic minimum,
 * its current width becomes the temporary floor. This prevents further
 * damage without forcing a jump before the user moves the pointer.
 */
export function effectivePairMinimum(startWidth, intrinsicMinimum) {
  const start = positiveInteger(startWidth);
  const intrinsic = positiveInteger(intrinsicMinimum);
  return Math.min(start, intrinsic);
}

/**
 * Solve one adjacent pair. Only the active container and its direct neighbour
 * participate. Their integer pixel sum is invariant:
 *
 *   nextActive + nextAdjacent = startActive + startAdjacent
 */
export function solveAdjacentPair(options = {}) {
  const startActive = positiveInteger(options.startActiveWidth);
  const startAdjacent = positiveInteger(options.startAdjacentWidth);
  const pairTotal = startActive + startAdjacent;

  const activeMinimum = effectivePairMinimum(startActive, options.minActiveWidth);
  const adjacentMinimum = effectivePairMinimum(startAdjacent, options.minAdjacentWidth);
  const lowerActive = activeMinimum;
  const upperActive = pairTotal - adjacentMinimum;
  const requestedDelta = Math.round(finiteNumber(options.rawDelta, 0));
  const requestedActive = startActive + requestedDelta;
  const activeWidth = clampInteger(requestedActive, lowerActive, upperActive);
  const adjacentWidth = pairTotal - activeWidth;
  const appliedDelta = activeWidth - startActive;
  const conservationError = activeWidth + adjacentWidth - pairTotal;

  return Object.freeze({
    startActiveWidth: startActive,
    startAdjacentWidth: startAdjacent,
    pairTotal,
    requestedDelta,
    appliedDelta,
    activeMinimum,
    adjacentMinimum,
    activeWidth,
    adjacentWidth,
    conservationError,
    conserved: conservationError === 0,
    activeAtMinimum: activeWidth === activeMinimum,
    adjacentAtMinimum: adjacentWidth === adjacentMinimum,
  });
}
