# 01085 Account Login/Register UI Design

## Goal
Add a first-class **Мій акаунт** surface to ShiftTime Builder on top of the real Auth runtime delivered in 01084.

## Scope
01085 owns only the account/authentication UX. Full **Адміністрування** (users, invitations, roles, permission management) remains 01086.

## Navigation
- Add `Мій акаунт` as its own main-sidebar item (`data-open-panel="account"`).
- Add a compact account control in the Builder header.
- Before authentication the header control shows a user icon and `Увійти`.
- After authentication it shows initials/name and current role/scope summary.
- Both entry points open the same account workspace and account Inspector.

## Workspace ownership
- Add `#accountStudioView` as a mutually exclusive central workspace view.
- `builder.js` becomes aware of workspace key `account` exactly like `marketplace`, `site`, and `pages`.
- Opening Account hides Canvas and its authoring toolbar and activates `builder--mainview-account`.
- No account UI is injected into Marketplace Studio or site Canvas.

## Account Inspector
- Add a dedicated `data-panel-id="account"` Inspector panel.
- Inspector tabs/actions are account-specific only: Overview, Profile/Scope, Security/Session.
- When anonymous it focuses on Login/Register navigation and concise auth status.
- The general Design mode bar is hidden while Account owns the workspace so account controls are not mixed with section/container design tools.

## Auth screens
Anonymous workspace provides two polished modes:
- Login: email, password, submit, switch to registration.
- Register: name, email, password, password confirmation, submit, switch to login.

Validation is client-side for required fields and confirmation, while server errors remain authoritative and are displayed inline without exposing sensitive details.

## Authenticated account
Authenticated workspace shows:
- initials/avatar tile;
- user name and email;
- authenticated status;
- Account / Workspace / Store identifiers from server-authorized scope;
- owner/member role if present;
- session expiration where available;
- Logout action.

01085 does not add profile mutation APIs because 01084 does not expose them yet.

## Auth source of truth
All login/register/logout/session state is consumed through `marketplace-auth-runtime-01084.js`. UI must not read or write the old DEV bearer token and must not infer access rights from localStorage role toggles.

## Legacy role switch
The temporary Builder header role switch remains in the DOM for backward compatibility but is visually suppressed once 01085 account UI is active, avoiding two competing identity controls. Role administration is implemented in 01086.

## Visual direction
Dark premium Builder-native visual language: glass panels, strong contrast, rounded cards, cyan/blue highlights, responsive two-column auth composition, readable inline errors, loading states, and compact mobile/container fallback. No external UI framework or new runtime dependency.

## Acceptance criteria
1. Sidebar `Мій акаунт` opens a dedicated central account view and dedicated Inspector.
2. Header account control opens the exact same view.
3. Login/Register invoke 01084 Auth Runtime, show pending/error state, and rerender after auth state changes.
4. Successful session view uses server user/scope and offers Logout.
5. Marketplace/Canvas/Site/Pages navigation continues to be mutually exclusive.
6. `01083` responsive DOM guard and `01084` Auth foundation remain intact.
7. No standalone debug/contract HTML files are added to the project.
