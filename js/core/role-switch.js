// js/core/role-switch.js
// UI-перемикач ролі у головній шапці конструктора.
// Працює через auth-role.js, щоб потім легко замінити на авторизацію.

import { getUserRole, setUserRole } from './auth-role.js';

export function initRoleSwitch() {
  const toggle = document.getElementById('stRoleToggle');
  const label = document.getElementById('stRoleLabel');
  if (!toggle || !label) return;

  const sync = () => {
    const role = getUserRole();
    toggle.checked = role === 'admin';
    label.textContent = role === 'admin' ? 'Адмін' : 'Користувач';
  };

  toggle.addEventListener('change', () => {
    setUserRole(toggle.checked ? 'admin' : 'user');
  });

  window.addEventListener('st:role-changed', sync);
  sync();
}
