// js/core/auth-role.js
// Єдине джерело істини для ролі користувача в конструкторі.
// На етапі розробки роль зберігаємо в localStorage.
// У майбутньому тут легко підмінити на авторизацію (JWT/бекенд),
// не чіпаючи UI і перевірки доступів у віджетах.

const ROLE_KEY = 'st_user_role'; // 'admin' | 'user'

export function getUserRole() {
  try {
    const v = String(localStorage.getItem(ROLE_KEY) || '').trim();
    if (v === 'admin' || v === 'user') return v;
    return 'user';
  } catch {
    return 'user';
  }
}

export function isAdmin() {
  return getUserRole() === 'admin';
}

export function setUserRole(role) {
  const r = (role === 'admin') ? 'admin' : 'user';
  try {
    localStorage.setItem(ROLE_KEY, r);
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent('st:role-changed', { detail: { role: r } }));
  } catch {}
}
