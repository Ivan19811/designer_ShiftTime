// Canonical ShiftTime CRM SSO strings: use keys, no new hardcoded UI literals in logic.
const uk={
 'role.owner':'Власник','role.admin':'Адміністратор','role.manager':'Менеджер','role.user':'Користувач',
 'auth.required':'Для входу вкажіть email і пароль','auth.invalid':'Не вдалося увійти','auth.registerFields':'Вкажіть ім’я, email і пароль (від 10 символів)',
 'auth.disabledMock':'Тестовий Google-вхід вимкнений з міркувань безпеки','auth.login':'Увійти','auth.logout':'Вийти',
 'auth.ssoUnavailable':'Єдиний вхід наразі недоступний. Скористайтесь email і паролем.',
 'auth.loginRequired':'Потрібен вхід у ShiftTime ID', 'auth.unknown':'Користувач',
 'auth.openBuilder':'Відкрити конструктор', 'auth.openCrm':'Відкрити CRM',
 'auth.noAccess':'Немає доступу до жодного магазину', 'auth.registration':'Реєстрація через ShiftTime ID',
 'auth.ssoError':'Помилка перевірки єдиного входу',
};
export const t01581=(key)=>uk[key]||key;
