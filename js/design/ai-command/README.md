# AI Command Foundation

Ця папка містить початковий каркас для універсальної AI-командної системи.

## Що вже додано
- `data/target-manifest.json` — список елементів і шарів, які AI може розпізнавати.
- `data/action-manifest.json` — глобальний словник дій.
- `data/property-manifest.json` — властивості, які можна змінювати.
- `data/value-manifest.json` — типи значень і правила нормалізації.
- `data/object-capabilities.json` — матриця `елемент -> дії/властивості`.
- `data/scope-rules.json` — правила області застосування.
- `data/clarify-rules.json` — правила уточнень.
- `data/color-manifest.json` — стартовий словник кольорів.
- `data/gradient-rules.json` — правила напрямків, позицій і зміни часток кольорів.

## Що ще не підключено до runtime
Ці файли поки що не ламають існуючу логіку проєкту, бо вони лише додають дані.
Після цього етапу можна окремо будувати:
- normalizer
- parser
- target resolver
- value resolver
- clarifier
- executor

## Language layer (starter pack)

Added starter dictionaries for parser-only stage:
- `data/term-synonyms.json`
- `data/phrase-normalization.json`
- `data/term-wordforms.json`
- `data/common-typos.json`
- `data/noise-words.json`

Purpose:
- normalize user phrases before parsing
- support synonyms in UA/RU/EN
- soften common spelling mistakes and colloquial forms
- prepare parser-only stage without touching runtime/executor

## Parser-only scaffold added
- `core/manifest-loader.js` — кешоване завантаження manifest JSON.
- `core/command-normalizer.js` — нормалізація фраз, шуму, типових помилок і форм слів.
- `core/command-tokenizer.js` — токенізація й побудова phrase windows.
- `core/command-*-resolver.js` — первинний розбір action / target / property / value / scope / state / responsive.
- `core/command-plan-builder.js` — розбиття однієї фрази на серію parser-команд.
- `core/command-parser.js` — головний parser-only orchestrator, повертає JSON-структуру й нічого не застосовує до DOM.
- `ui/ai-command-debug-panel.js` — невелика debug-панель для ручного тесту parser-only етапу.
- `index.js` — re-export для `parseAiCommand` і `initAiCommandDebugPanel`.


## Parser test pack

Added a starter parser-only test pack under `js/design/ai-command/tests/`:
- `parser-test-commands.json` — grouped command inputs
- `parser-expected-results.json` — expected parser intent snapshots
- `manual-test-checklist.md` — human QA checklist

This pack is intended for parser validation before any executor or DOM mutation layer is wired in.

## Test widget
- `initAiCommandTestWidget(host, options)` mounts a visual parser test panel.
- It includes manual command parsing and a runner for expected parser cases.
- Console logging is optional and secondary; the widget is the main test surface.

## Test entry points

- Root test page: `ai-command-test.html`
- Widget test page: `widgets/ai-command-test/index.html`
- Raw demo page: `js/design/ai-command/tests/ai-command-test-demo.html`

Recommended flow:
1. Open `ai-command-test.html`
2. Run the full parser test pack
3. Try live commands in the manual input
4. Use console logging only when you need deeper debugging
