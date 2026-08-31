export { parseAiCommand } from './core/command-parser.js';
export { initAiCommandDebugPanel } from './ui/ai-command-debug-panel.js';
export { initAiCommandTestWidget } from './ui/ai-command-test-widget.js';
export { initAiCommandDebugReportWidget } from './ui/ai-command-debug-report-widget.js';
export { runParserExpectedCases, loadParserTestPack } from './tests/parser-test-runner.js';
export { initAiCommandAuditWidget } from './ui/ai-command-audit-widget.js';
export {
  appendAuditEntry,
  listAuditEntries,
  clearAuditEntries,
  buildAuditReport,
  buildRegressionDraft,
  buildRegressionDraftReport,
  evaluateAuditResult,
  updateAuditReplay,
  getAuditStats,
  removeAuditEntry,
  removeAuditEntries,
  removeResolvedAuditEntries,
  saveRegressionDraft,
  loadRegressionDraft,
} from './runtime/ai-command-audit-store.js';

export {
  createAiRuntimeExecutor,
  createDefaultRuntimeHandlerMap,
  executeApplyContract,
  executeParsedAiCommand,
} from './runtime/ai-command-runtime-executor.js';

export {
  createBuilderRuntimeContext,
  getSelectionSnapshot as getAiRuntimeSelectionSnapshot,
} from './runtime/ai-command-runtime-context.js';

export { initAiCommandRuntimeOverlay } from './ui/ai-command-runtime-overlay.js';
export { initAiRuntimeRehydrationIntegration } from './runtime/ai-command-runtime-rehydration.js';

export {
  loadPersistedAiRuntimeState,
  savePersistedAiRuntimeState,
  persistAiRuntimeExecution,
  applyPersistedStateToElement,
  rehydrateAiRuntimeState,
} from './runtime/ai-command-runtime-persistence.js';

export {
  appendAiRuntimeDebugReport,
  listAiRuntimeDebugReports,
  removeAiRuntimeDebugReport,
  removeAiRuntimeDebugReports,
  clearAiRuntimeDebugReports,
  getAiRuntimeDebugStats,
  buildAiRuntimeDebugReport,
  buildAiRuntimeDebugReportsBundle,
  isAiRuntimeDebugEnabled,
  setAiRuntimeDebugEnabled,
} from './runtime/ai-command-debug-store.js';
