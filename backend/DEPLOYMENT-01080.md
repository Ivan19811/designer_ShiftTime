# 01080 Production PostgreSQL Runbook

This runbook is intentionally provider-neutral. It assumes the Commerce backend can receive a backend-only PostgreSQL connection string in `DATABASE_URL`.

## Before migration

- Provision PostgreSQL.
- Keep the database and backend in the same private region/network when your provider supports it.
- Configure backend environment variables from `.env.example`.
- Use an explicit production `CORS_ORIGIN`.
- Keep `DATABASE_URL` out of frontend code, Netlify variables exposed to browser bundles, logs, screenshots and committed files.
- Create a provider recovery point or a verified `pg_dump` backup.

## Database sequence

```bash
npm install
npm run db:preflight
npm run db:migrate:plan
npm run db:migrate
npm run db:migrate:status
```

Expected migration chain: `001` through `010`, all `APPLIED`, no checksum drift.

## Temporary owner bootstrap before 01082 Auth

Set `BOOTSTRAP_OWNER_ENABLED=true`, owner/scope variables and a generated `BOOTSTRAP_SESSION_TOKEN` >= 32 characters. Then run:

```bash
npm run db:bootstrap-owner
```

Immediately set `BOOTSTRAP_OWNER_ENABLED=false` after the command. The bootstrap creates no products, orders or DEMO commerce data.

## Verify database

```bash
npm run db:verify
```

Do not switch the Studio to API mode if this command fails.

## Migrate the active Local Store

Preferred path: Marketplace Studio → `Production PostgreSQL` → `Local → PostgreSQL`. This bulk migration requires an `owner` or `admin` Store role on both the Studio preflight and the backend API.

The Studio refuses a silent overwrite when the target PostgreSQL Store already contains different non-empty canonical commerce data. It uploads the scoped LocalRepository snapshot and then imports Store-scoped LOCAL operational records (seller/listings/offers, SellerOrders/OrderItems, Payment allocations/events, Inventory reservations/ledger and Delivery). LOCAL auto-approved listings become production `pending/pending`. The Studio reads the PostgreSQL snapshot back, compares canonical content SHA-256, verifies operational counts, then activates the API repository only after verification succeeds.

CLI fallback for an exported JSON snapshot:

```bash
npm run db:import-store -- /path/store.json --store=store_default --confirm=store_default
```

## Backup

If `pg_dump` and `pg_restore` are installed:

```bash
BACKUP_DIR=/secure/path npm run db:backup
```

The command creates a custom-format dump and validates its catalog with `pg_restore --list`. No backup binary is placed in this project ZIP.

## Rollback strategy

- Do not delete LocalRepository data after migration.
- If API/PostgreSQL verification fails, remain on LocalRepository.
- If a production DB migration causes problems, restore from the provider recovery point or verified database dump to a separate database first, validate it, then repoint the backend `DATABASE_URL`.
- Do not edit already-journaled SQL migration files. Add a new sequential migration instead.

## Stage boundary

01080 covers PostgreSQL deployment, schema journal, Store data import and repository switch. It does not implement real registration/login (01082), real payment providers (01083), or R2/S3 media binary storage (01081).
