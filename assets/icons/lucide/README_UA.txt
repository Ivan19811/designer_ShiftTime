ShiftTime — Lucide Icons (Core Pack)

Що це:
- Відібраний набір SVG-іконок Lucide (однокольорові stroke-іконки) для конструктора/CRM.
- Всі іконки розкладені по папках-категоріях.
- Є index.json для швидкого пошуку (name/category/tags + шлях до файлу).

Як використовувати в проєкті (рекомендовано):
1) Копіюй папку `icons/` у свій проєкт, напр.:
   frontend/assets/icons/lucide/

2) Для зміни кольору:
   - Найкраще вставляти SVG "inline" (в HTML як <svg>...</svg>).
   - Lucide використовує stroke="currentColor", тому колір керується CSS властивістю `color`.

   Приклад:
   <div class="st-icon" style="color:#22c55e">
     <!-- inline svg -->
   </div>

3) Для зміни розміру:
   - Задавай width/height у CSS або атрибутах SVG.
   - Наприклад: .st-icon svg { width: 24px; height: 24px; }

4) Для товщини лінії:
   - Використовуй атрибут stroke-width (або міняй його в SVG при вставці).

Файли:
- icons/            — іконки по категоріях
- index.json        — індекс (для галереї/пошуку)
- META.json         — інформація про пак

Примітка:
- Якщо тобі потрібні ВСІ іконки Lucide — бери повний репозиторій.
- Цей пак — "ядро" (найчастіше потрібні для UI/Builder/CRM).
