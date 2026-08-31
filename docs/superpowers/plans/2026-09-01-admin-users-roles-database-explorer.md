# 01087 Admin Users, Roles, Access & Database Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure account administration, invitations, role/permission management, a read-only tenant-safe PostgreSQL explorer, and a reusable Data Grid foundation to ShiftTime Builder.

**Architecture:** Backend remains authorization authority and exposes account-scoped Admin APIs plus safe schema/data introspection. Frontend adds a dedicated Admin Workspace/Inspector using a source-agnostic Data Grid, while Real Auth 01084 supplies identity and tokens.

**Tech Stack:** Node.js ESM, PostgreSQL/pg, browser ES modules, HTML/CSS, existing ShiftTime Builder runtime.

**Spec:** `docs/superpowers/specs/2026-09-01-admin-users-roles-database-explorer-design.md`

## Global Constraints

- Preserve the complete 01086 project and existing multi-tenant isolation.
- Do not expose `DATABASE_URL`, password hashes, session token hashes or arbitrary SQL execution.
- Admin authorization must be enforced on backend, not only by UI hiding.
- Keep existing legacy roles `catalog-manager` and `order-manager` valid.
- Do not implement the 01088 dynamic user-table data model in this stage.
- Do not add standalone debug/contract HTML files to the project archive.

---

### Task 1: Admin schema migration and access matrix

**Files:**
- Create: `backend/sql/013_admin_users_roles_database_explorer.sql`
- Create: `backend/src/admin-access-01087.mjs`
- Create: `backend/tests/admin-access-01087.test.mjs`
- Modify: `backend/package.json`

**Interfaces:**
- Produces: `ADMIN_ROLES_01087`, `ROLE_CAPABILITIES_01087`, `getEffectiveCapabilities01087(scope)`, `assertCapability01087(scope, capability)`, `assertOwnerActor01087(scope)`.

- [ ] Write failing tests for owner/admin/manager/editor/viewer defaults and explicit permissions.
- [ ] Run `node --test backend/tests/admin-access-01087.test.mjs` and confirm failure before implementation.
- [ ] Add migration 013 with `manager`, invitations and admin audit log.
- [ ] Implement admin access helpers.
- [ ] Re-run the test and confirm pass.

### Task 2: Account member and invitation backend

**Files:**
- Create: `backend/src/admin-service-01087.mjs`
- Create: `backend/tests/admin-service-01087.test.mjs`
- Modify: `backend/src/auth-service-01084.mjs`

**Interfaces:**
- Produces: `getAdminOverview01087`, `listMembers01087`, `updateMembership01087`, `listInvitations01087`, `createInvitation01087`, `revokeInvitation01087`, `inspectInvitation01087`, `loadInvitationForRegistration01087`, `acceptInvitationForUser01087`.

- [ ] Write failing tests for role mutation invariants and invitation token helpers using exported pure validators/helpers.
- [ ] Run test and confirm failure.
- [ ] Implement account-scoped member/invitation service and audit writes.
- [ ] Integrate optional `inviteToken` in registration; invited registration joins the invited tenant instead of creating another tenant.
- [ ] Re-run tests and confirm pass.

### Task 3: Database Explorer backend

**Files:**
- Create: `backend/src/database-explorer-service-01087.mjs`
- Create: `backend/tests/database-explorer-01087.test.mjs`

**Interfaces:**
- Produces: `getDatabaseOverview01087`, `listDatabaseTables01087`, `getDatabaseTableSchema01087`, `getDatabaseTableRows01087`, `listDatabaseMigrations01087`.

- [ ] Write failing tests for identifier validation, sensitive-column redaction and row-scope strategy.
- [ ] Run test and confirm failure.
- [ ] Implement metadata queries and allowlisted tenant-scoped row browser.
- [ ] Re-run tests and confirm pass.

### Task 4: Wire 01087 HTTP routes

**Files:**
- Modify: `backend/src/server.mjs`
- Modify: `backend/src/config.mjs`
- Modify: `backend/.env.example`
- Modify: `backend/package.json`

**Interfaces:**
- Consumes Task 1-3 services.
- Produces `/api/v1/admin/*` routes and public invite inspection route.

- [ ] Add imports and public invitation inspection before authenticated routing.
- [ ] Add admin overview/roles/members/invitations/database routes after authenticated scope resolution.
- [ ] Ensure every admin route asserts capabilities server-side.
- [ ] Update backend stage labels to 01087 where touched and include new files in `npm run check`.
- [ ] Run `npm run check` and all backend node tests.

### Task 5: Shared Data Grid foundation

**Files:**
- Create: `js/data-grid/data-grid-core-01087.js`
- Create: `tests/data-grid-core-01087.test.mjs`

**Interfaces:**
- Produces: `normalizeDataGridModel01087(input)`, `renderDataGridHtml01087(model, options)`.

- [ ] Write failing tests for column normalization, HTML escaping, empty state and row rendering.
- [ ] Run test and confirm failure.
- [ ] Implement generic grid model/renderer with no backend coupling.
- [ ] Re-run test and confirm pass.

### Task 6: Admin API client and view model

**Files:**
- Create: `js/admin/admin-api-01087.js`
- Create: `js/admin/admin-view-model-01087.js`
- Create: `tests/admin-view-model-01087.test.mjs`

**Interfaces:**
- Produces authenticated API methods and role/permission labels/view state used by Admin Studio.

- [ ] Write failing view-model tests for admin visibility and role labels.
- [ ] Implement API client using Real Auth token and scope.
- [ ] Implement pure view-model helpers.
- [ ] Run tests and confirm pass.

### Task 7: Dedicated Admin Workspace and Inspector

**Files:**
- Create: `js/admin/admin-studio-01087.js`
- Create: `css/admin-studio-01087.css`
- Modify: `index.html`
- Modify: `js/builder.js`
- Modify: `js/builder-init.js`
- Modify: `js/account/account-studio-01085.js`

**Interfaces:**
- Consumes Tasks 5-6 and Real Auth 01084.
- Produces `initAdminStudio01087()` and separate `admin` workspace/panel ownership.

- [ ] Add Admin mount points/sidebar button with visibility controlled by Admin Studio.
- [ ] Add `admin` to builder main-view routing.
- [ ] Implement Overview, Users, Roles, Invitations and Database Explorer screens.
- [ ] Add invite-aware registration copy/hidden token handling in Account Studio.
- [ ] Add responsive styling and loading/error/empty states.
- [ ] Run syntax checks for all touched frontend modules.

### Task 8: 01087 stage wrapper, docs and full verification

**Files:**
- Create: `js/marketplace/marketplace-studio-01087.js`
- Modify: `js/builder-init.js`
- Modify: `index.html`
- Keep: spec and plan documents above.

**Interfaces:**
- Produces complete 01087 boot chain over 01086.

- [ ] Add 01087 Marketplace stage wrapper and cache-busting.
- [ ] Run all frontend node tests.
- [ ] Run all backend node tests and `npm run check`.
- [ ] Run `node --check` for modified frontend modules.
- [ ] Verify migration 013 is discovered by migration loader/dry-run without changing prior migrations.
- [ ] Compare 01087 file tree against 01086: no base files removed.
- [ ] Build full `01087-ADMIN-USERS-ROLES-ACCESS-DATABASE-EXPLORER.zip`.
- [ ] Build `01087-GITHUB-DEPLOY-<N>-FILES.zip` containing only changed/new files.
- [ ] Run `unzip -t` on both archives and report exact file counts/sizes.
