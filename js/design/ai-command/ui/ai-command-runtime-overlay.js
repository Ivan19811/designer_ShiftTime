import { initAiCommandDebugPanel } from './ai-command-debug-panel.js';

function ensureStyles(){
  if (document.getElementById('st-ai-runtime-overlay-style')) return;
  const style = document.createElement('style');
  style.id = 'st-ai-runtime-overlay-style';
  style.textContent = `
    .st-ai-runtime-overlay{position:fixed;inset:0;z-index:10050;display:none;align-items:stretch;justify-content:flex-end;background:rgba(2,6,23,.45);backdrop-filter:blur(2px)}
    .st-ai-runtime-overlay.is-open{display:flex}
    .st-ai-runtime-overlay__panel{width:min(720px,92vw);height:100%;background:#020617;border-left:1px solid rgba(255,255,255,.08);box-shadow:-20px 0 60px rgba(2,6,23,.45);display:grid;grid-template-rows:auto 1fr}
    .st-ai-runtime-overlay__head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.08);color:#e5e7eb}
    .st-ai-runtime-overlay__title{font-size:18px;font-weight:900}
    .st-ai-runtime-overlay__sub{font-size:12px;opacity:.72;margin-top:4px;max-width:520px}
    .st-ai-runtime-overlay__close{border:0;border-radius:10px;background:#111827;color:#fff;padding:10px 12px;font-weight:800;cursor:pointer}
    .st-ai-runtime-overlay__body{padding:18px;overflow:auto}
  `;
  document.head.appendChild(style);
}

function createOverlay(){
  ensureStyles();
  const root = document.createElement('div');
  root.className = 'st-ai-runtime-overlay';
  root.innerHTML = `
    <div class="st-ai-runtime-overlay__panel" role="dialog" aria-modal="true" aria-label="AI Runtime">
      <div class="st-ai-runtime-overlay__head">
        <div>
          <div class="st-ai-runtime-overlay__title">AI Runtime</div>
          <div class="st-ai-runtime-overlay__sub">Команда парситься і одразу може запускати Apply по поточному виділенню в конструкторі, з повторною синхронізацією selection та інспектора після мутацій.</div>
        </div>
        <button class="st-ai-runtime-overlay__close" type="button">Закрити</button>
      </div>
      <div class="st-ai-runtime-overlay__body"><div data-ai-runtime-host></div></div>
    </div>
  `;
  document.body.appendChild(root);
  return root;
}

export function initAiCommandRuntimeOverlay(options = {}){
  const root = createOverlay();
  const host = root.querySelector('[data-ai-runtime-host]');
  const closeBtn = root.querySelector('.st-ai-runtime-overlay__close');
  const panel = initAiCommandDebugPanel(host, {
    initialText: options.initialText || 'зроби це меню красивіше і акуратніше',
    runtimeEnabled: true,
    parserOptions: options.parserOptions || {},
    dryRun: false,
    audit: true,
  });

  function open(){
    root.classList.add('is-open');
  }
  function close(){
    root.classList.remove('is-open');
  }
  root.addEventListener('click', (ev) => {
    if (ev.target === root) close();
  });
  closeBtn.addEventListener('click', close);
  window.addEventListener('st:open-ai-runtime', open);
  const navBtn = document.getElementById('navAiRuntime');
  navBtn?.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    open();
  });

  return { root, panel, open, close };
}
