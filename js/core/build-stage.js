// Single visible build-stage authority for cross-module UI labels.
export const SHIFTTIME_BUILD_STAGE='01090';
export function buildStageLabel(prefix='BUILD'){return `${String(prefix||'BUILD').trim()} · ${SHIFTTIME_BUILD_STAGE}`;}
