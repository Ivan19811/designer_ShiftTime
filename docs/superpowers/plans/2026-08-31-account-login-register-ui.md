# 01085 Account Login/Register UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a dedicated Account workspace, Account Inspector, login/register UX, and Builder header identity control backed exclusively by Auth Runtime 01084.

**Architecture:** Keep 01084 session/auth logic authoritative and build a separate presentation module. Extend Builder workspace routing with one new `account` owner, while Account UI module owns rendering, form actions, and subscription to auth state.

**Tech Stack:** HTML, CSS, vanilla ES modules, existing ShiftTime Builder shell, Auth Runtime 01084.

**Spec:** `docs/superpowers/specs/2026-08-31-account-login-register-ui-design.md`

## Global Constraints
- Do not mix Account controls into Marketplace Studio, Canvas design controls, or Site/Page managers.
- Do not use DEV token/localStorage as an identity source.
- Do not add external frontend dependencies.
- Do not add standalone debug/contract HTML files to project root.
- Full Admin users/roles management remains 01086.

---

### Task 1: Account view-model contract
**Files:**
- Create: `js/account/account-view-model-01085.js`
- Test externally during implementation: `/mnt/data/01085-account-view-model.test.mjs`

**Interfaces:**
- Consumes: Auth Runtime 01084 state object.
- Produces: `createAccountViewModel01085`, `validateAccountLogin01085`, `validateAccountRegistration01085`, `accountInitials01085`.

- [x] Write failing tests for anonymous/authenticated view-model and validation.
- [x] Run tests and confirm failure because module does not exist.
- [x] Implement the minimal pure helpers.
- [x] Run tests and confirm pass.

### Task 2: Builder routing + static mount points
**Files:**
- Modify: `index.html`
- Modify: `js/builder.js`

**Interfaces:**
- Produces sidebar nav `#navAccount`, Inspector `#account-panel-root`, workspace `#accountStudioView`, workspace key `account`.

- [x] Write a static integration test that requires all mount IDs and builder routing markers.
- [x] Run test and confirm failure.
- [x] Add Account sidebar/header/Inspector/workspace mount points.
- [x] Extend Builder `mainViews`, panel mapping, restoration, classes, capture routing, and safe binding for account.
- [x] Run integration test and confirm pass.

### Task 3: Account UI presentation module
**Files:**
- Create: `js/account/account-studio-01085.js`
- Create: `css/account-studio-01085.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: Auth Runtime 01084 register/login/logout/subscribe/getState.
- Produces: `initAccountStudio01085()` and a synchronized workspace/header/Inspector UI.

- [x] Write a failing static/module contract test for required Auth Runtime imports and exported initializer.
- [x] Run test and confirm failure.
- [x] Implement anonymous login/register rendering, validation, pending/errors, authenticated account rendering, logout, header identity sync, and inspector action sync.
- [x] Add responsive premium styling and hide design-mode bar in Account workspace.
- [x] Run tests and confirm pass.

### Task 4: Boot and stage integration
**Files:**
- Modify: `js/builder-init.js`
- Create: `js/marketplace/marketplace-studio-01085.js`

**Interfaces:**
- Consumes: `initMarketplaceStudio01084`, `initAccountStudio01085`.
- Produces: stage marker `01085` while preserving 01084 real-auth foundation.

- [x] Write failing boot contract test for 01085 imports/init calls.
- [x] Run test and confirm failure.
- [x] Add stage wrapper and initialize Account UI after Auth Runtime is available.
- [x] Run boot test and confirm pass.

### Task 5: Full verification and packaging
**Files:** no production changes unless verification reveals a defect.

- [x] Run all 01085 tests.
- [x] Run `node --check` on every new/modified JS module.
- [x] Run backend `npm run check` to ensure 01084 backend remains clean.
- [x] Compare file inventory against 01084 and verify only intended additions/modifications.
- [x] Build `01085-ACCOUNT-LOGIN-REGISTER-UI.zip` from full project.
- [x] Run `unzip -t` on the final ZIP and record size/file count.
