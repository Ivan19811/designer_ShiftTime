# 01087 Admin Users, Roles, Access & Database Explorer Design

## Goal

Build a dedicated `Адміністрування` module on top of the verified 01086 Real Auth + PostgreSQL multi-tenant foundation. The module must let authorized account owners/admins manage members, roles, permissions and invitations, and inspect the PostgreSQL schema/data safely without exposing database credentials or cross-tenant data.

## Scope

01087 includes:

- A dedicated main-sidebar `АДМІНІСТРУВАННЯ` entry, separate from `МІЙ АКАУНТ` and Marketplace.
- A dedicated Admin Workspace and Inspector context.
- Account-scoped member listing, role/status changes and explicit permission grants.
- Roles shown in the new UI: `owner`, `admin`, `manager`, `editor`, `viewer`; existing `catalog-manager` and `order-manager` remain valid for backward compatibility.
- Invitation creation/list/revoke with one-time opaque invite token. Email delivery is not implemented in 01087; the admin copies the generated invite link manually.
- Invitation-aware registration: a valid invite joins the invited Account/Workspace/Store instead of creating a new tenant. Existing users may accept an invite by supplying their existing password.
- Read-only Database Explorer: overview, tables, columns, keys/indexes, migration history and safe paginated rows.
- A reusable ShiftTime Data Grid rendering/model foundation used by Admin lists and Database Explorer, intentionally separated from the future dynamic user-table data model planned for 01088.

01087 does not include:

- arbitrary SQL execution;
- raw database passwords/connection strings in the browser;
- editing/deleting arbitrary database rows;
- email provider integration;
- dynamic user-created Notion/Airtable-style tables (01088+).

## Authorization model

The backend is authoritative. UI visibility is convenience only.

Role defaults:

- `owner`: full account administration, role management, invitations, database schema and safe data access.
- `admin`: manage non-owner members/invitations, inspect database schema and safe data.
- `manager`: operational commerce access; no Admin Workspace by default.
- `editor`: catalog/content write access; no Admin Workspace by default.
- `viewer`: read-only commerce access; no Admin Workspace by default.
- `catalog-manager` / `order-manager`: preserved legacy specialized roles.

`platform_memberships.permissions` remains a JSON array of explicit grants. Effective capability is the union of role defaults and explicit grants, except owner-sensitive invariants always require actor role `owner`.

Security invariants:

- Non-owners cannot assign, demote, disable or replace an `owner` membership.
- The last active owner of an account cannot be demoted or disabled.
- Admin endpoints always validate the authenticated membership against the current account scope.
- Database row browsing is tenant-scoped and uses an allowlisted query builder; no user-supplied SQL identifiers are interpolated without validation.
- `platform_user_credentials.secret_hash` and `api_sessions.token_hash` are never returned.
- Database connection credentials are never returned.

## Backend architecture

### Migration 013

`backend/sql/013_admin_users_roles_database_explorer.sql`:

- expands `platform_memberships.role` check to include `manager` while keeping legacy roles;
- creates `platform_invitations` with hashed tokens, scope, role, permissions, status, expiry and inviter/acceptor IDs;
- creates `platform_admin_audit_log` for membership/invitation mutations;
- adds indexes for pending invitations and account audit queries.

### Access helper

`backend/src/admin-access-01087.mjs` owns:

- role constants;
- role default capability matrix;
- effective capability calculation;
- `assertAdminView01087`, `assertCapability01087`, owner-only guard helpers.

### Admin service

`backend/src/admin-service-01087.mjs` owns:

- overview counts;
- account-scoped members;
- role/status/permission mutation with last-owner protection;
- invitation create/list/revoke;
- existing-user direct membership join;
- audit log writes;
- invitation inspection and acceptance helpers used by Auth registration.

### Database Explorer service

`backend/src/database-explorer-service-01087.mjs` owns:

- current database diagnostics without secrets;
- public-schema table inventory;
- columns, primary/foreign keys and indexes;
- migration journal readout;
- safe row browser.

Schema metadata can describe application tables globally, but row data is scoped. Sensitive tables expose metadata only or safe projected columns.

### Routes

Authenticated admin routes under `/api/v1/admin/*`:

- `GET /overview`
- `GET /roles`
- `GET /members`
- `PATCH /members/:id`
- `GET /invitations`
- `POST /invitations`
- `POST /invitations/:id/revoke`
- `GET /database/overview`
- `GET /database/tables`
- `GET /database/tables/:table/schema`
- `GET /database/tables/:table/rows?limit=&offset=`
- `GET /database/migrations`

Public invitation inspection:

- `GET /api/v1/auth/invitations/:token`

Existing `POST /api/v1/auth/register` accepts optional `inviteToken`.

## Frontend architecture

### Shared Data Grid foundation

`js/data-grid/data-grid-core-01087.js` is source-agnostic. It normalizes column descriptors, rows, page metadata and renders a safe read-only/admin grid shell. It has no direct knowledge of PostgreSQL, Marketplace or future dynamic tables.

### Admin API client

`js/admin/admin-api-01087.js` reads the Real Auth token and server-authorized Store context from `marketplace-auth-runtime-01084`, and talks only to `/api/v1/admin/*`.

### Admin Studio

`js/admin/admin-studio-01087.js` owns Admin Workspace/Inspector state and renders:

- Overview;
- Users & Access;
- Roles & Permissions;
- Invitations;
- Database Explorer.

The Admin nav item is hidden/disabled unless the authenticated user has `admin.view` capability returned by the backend.

### Builder integration

- `index.html`: Admin stylesheet, sidebar button, inspector mount, workspace mount, 01087 cache-busting.
- `js/builder.js`: `admin` as its own main view/panel owner.
- `js/builder-init.js`: initialize `initAdminStudio01087()` after Auth/Account.
- `css/admin-studio-01087.css`: independent responsive Admin styling.
- `js/marketplace/marketplace-studio-01087.js`: stage wrapper over 01086.

## Future dynamic tables boundary

01087 Database Explorer and Admin tables reuse the Data Grid renderer, but they do not create arbitrary PostgreSQL tables. 01088 will introduce a separate Workspace Data metadata model (`data_tables`, `data_fields`, `data_records`, `data_views`, `data_relations`, `data_permissions`). The 01087 Data Grid accepts generic columns/rows so the future model can plug in without rewriting the grid UI.

## Verification

- Node syntax check for every new/modified JS/MJS file.
- Backend `npm run check` extended to include 01087 services.
- Unit tests for role capability defaults, last-owner invariants, table-name validation/redaction helpers, grid normalization, and invitation token hashing/validation helpers.
- Migration dry-load/checksum discovery includes 013.
- Archive verification: full ZIP contains all 01086 files plus 01087 changes; deploy ZIP contains only changed/new files.
