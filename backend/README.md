# ShiftTime Tables + Commerce Backend · 01094

Production boundary remains:

`Marketplace Studio -> MarketplaceStore -> ApiMarketplaceRepository -> HTTPS -> Commerce Backend -> PostgreSQL`

The browser may request a `storeId`, but the server resolves Account/Workspace/Store through the authenticated Membership. Browser-supplied tenant/account identity is never treated as authorization.

## Local start

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. `npm install`
3. `npm run db:preflight`
4. `npm run db:migrate`
5. `npm run db:seed-dev`
6. `npm run dev`

Default API: `http://127.0.0.1:8787/api/v1`.

`CORS_ORIGIN=*`, `DEV_PAYMENT_SIMULATION=true`, `DEV_INVENTORY_SIMULATION=true`, and `DEV_SHIPPING_SIMULATION=true` are development settings. Production must use explicit origins, real auth/session, provider webhooks, and disable direct simulation transitions.

## Marketplace Network · 01072

Store Products remain private source-of-truth records inside the authorized commerce snapshot. Publishing creates/updates separate `MarketplaceListing`, `SellerOffer`, and `CatalogProduct` rows. New backend publications enter moderation; seller UI cannot self-approve them in production.

## Global Marketplace Search · 01073

Anonymous `GET /api/v1/public/marketplace/search` reads only `published + approved` listings. In 01077 the returned SellerOffer stock is **available stock**, not raw physical stock: active unexpired reservations are subtracted server-side.

## Multi-Seller Cart · 01074

Anonymous cart routes live under `/api/v1/public/marketplace/cart` and use opaque `x-st-cart-id` capability identity. The backend resolves price, seller and stock from live SellerOffer/Listings; it does not trust product payloads from the browser.

## Marketplace Orders · 01075

`POST /api/v1/public/marketplace/orders` creates one MarketplaceOrder and one SellerOrder per seller. OrderItem price/title/SKU/media identity is snapshotted at checkout and remains immutable when the source Product later changes.

## Payments / Commission / Payout · 01076

Payment foundation is provider-neutral. LOCAL DEV and backend DEV simulation can transition payment state, allocate ShiftTime commission, seller net, refunds and payout ledger entries. No production provider money movement is implied by this stage.

## Inventory Reservation / Stock Commit · 01077

Migration `sql/007_marketplace_inventory_reservation.sql` adds:

- `marketplace_inventory_reservations`
- `marketplace_inventory_reservation_items`
- `marketplace_inventory_ledger`

Inventory contract:

`availableStock = physical SellerOffer stock - active unexpired reservations`

Checkout locks relevant SellerOffer rows with PostgreSQL `FOR UPDATE`, expires stale reservations, recomputes available stock, and rejects overselling. Browser stock is never authoritative.

Payment behavior:

- `card` / `bank-transfer`: create an active reservation. `paid` commits stock; `failed` / `cancelled` releases it. Default TTL is 15 minutes (`INVENTORY_RESERVATION_MINUTES`).
- `cod`: reservation is created and committed immediately after the MarketplaceOrder is successfully created.
- `preorder`: does not consume physical stock reservation.
- SellerOrder cancellation before payment releases the active order reservation immediately; after a committed sale it restores only the cancelled SellerOrder quantity once.

A stock commit updates both the public SellerOffer/Listings projection and the private source Product inside `commerce_store_snapshots`, preventing a later marketplace sync from restoring already sold stock.

Authenticated seller inventory routes:

- `GET /api/v1/network/inventory`
- `GET /api/v1/network/inventory/reservations`
- `POST /api/v1/network/inventory/expire`
- `PATCH /api/v1/network/inventory/reservations/:id` — DEV direct commit/release only when `DEV_INVENTORY_SIMULATION=true`

`npm run db:seed-dev` safely merges a deterministic DEV fixture: 5 products, 2 categories, 2 sellers, including last-unit / low-stock offers. Existing non-DEMO products are not deleted.

## Delivery / Shipping Foundation · 01078

Migration `sql/008_marketplace_shipping_foundation.sql` adds one operational Delivery entity per SellerOrder plus a shipping event ledger:

- `marketplace_seller_order_deliveries`
- `marketplace_shipping_events`

A buyer-level delivery choice remains an intent snapshot on MarketplaceOrder, while every SellerOrder receives its own authoritative Delivery identity with:

`shippingMethod / shippingPrice / recipient / city / warehouse/address / trackingNumber / deliveryStatus / estimatedDelivery / carrier / providerReference`

Supported method identities are provider-neutral: `nova-poshta`, `ukrposhta`, `courier`, `pickup`, and `custom`. Commerce core does not call carrier SDKs directly. Provider adapters implement the `ShippingProvider01078` contract: `getCapabilities`, `quote`, `createShipment`, `getShipmentStatus`, `cancelShipment`.

01079 still ships only the `manual-dev` executable adapter. It can quote, generate DEV tracking numbers and simulate the delivery lifecycle. Real Nova Poshta/Ukrposhta adapters plug into the same provider-neutral boundary later.

Authenticated seller routes:

- `GET /api/v1/network/shipping`
- `GET /api/v1/network/shipping/providers`
- `PATCH /api/v1/network/shipping/:deliveryId`
- `POST /api/v1/network/shipping/:deliveryId/simulate` — DEV only when `DEV_SHIPPING_SIMULATION=true`

## Checkout Price + Shipping Totals · 01079

Migration `sql/009_marketplace_checkout_price_shipping_totals.sql` adds authoritative discount columns and rebuilds order totals from immutable OrderItem snapshots plus each SellerOrder Delivery price.

Checkout now computes a server-side shipping quote for each seller group before the financial order snapshot is finalized. Browser input may choose a delivery method/address, but it never supplies trusted item prices, shipping prices, discounts, SellerOrder totals, or MarketplaceOrder totals. Direct `shippingPrice` edits are rejected; changing quote inputs triggers a ShippingProvider re-quote before Payment.

SellerOrder formula:

`itemsSubtotal + shippingTotal - discountTotal = grossTotal`

MarketplaceOrder formula:

`itemsTotal + shippingTotal - discountTotal = grandTotal`

No coupon/discount engine exists yet, therefore `discountTotal` is authoritatively `0` in this stage. The field is explicit so a later discount engine can attach without changing Order/Payment contracts.

Payment creation recalculates the order snapshot first. Payment amount is the MarketplaceOrder `grandTotal`; each seller allocation and marketplace commission use the corresponding SellerOrder `grossTotal`. Once a Payment row exists, delivery status/tracking may still change, but a change to the financial `shippingPrice` is rejected so payment allocations cannot silently desynchronize.

`npm run db:seed-dev` safely inserts `MP-DEMO-01079` with two SellerOrders and two independent Delivery records: items `5580 UAH`, shipping `85 + 70 = 155 UAH`, discount `0`, grand total `5735 UAH`. Existing orders/products are not deleted.

## ShiftTime Tables · 01094

Migration `014_shifttime_tables_foundation.sql` adds the storage-neutral Tables core: tables, fields, JSONB records, views, table permissions and reusable templates. Tables support `personal`, `account`, `workspace` and `store` scope. Every `/api/v1/tables*` request is authorized through the current session, Membership and server-resolved scope; browser-supplied IDs are never treated as proof of access.

Migration `015_shifttime_tables_null_default_repair.sql` repairs the 01092 null-serialization defect: legacy empty-object field defaults and record cells become JSON `null`. New fields now store real JSON null values, so optional Email and other typed columns no longer block creation of a new row. Existing tables are repaired automatically during deploy; deleting or recreating them is not required.

`Tables Studio → TableStore → TableRepository → HTTPS API → PostgreSQL` is the production path. LocalTableRepository remains DEV/demo only. The field engine validates typed values on both browser and backend boundaries and reserves strict typed cell drag-and-drop contracts for the 01095 interaction engine.


## Real PostgreSQL Deployment / Migration · 01080

01080 turns the PostgreSQL boundary from a schema prototype into an explicit deployment workflow. `DATABASE_URL` remains backend-only. The browser receives an HTTPS API URL and an authenticated session; it never receives database credentials.

Production workflow:

1. Provision a managed PostgreSQL database and set its connection string as backend `DATABASE_URL`. If the backend and database provider expose a private/internal connection URL in the same region/network, prefer that URL; external URLs should use the provider-required TLS settings. `DATABASE_SSL=auto` preserves `sslmode` from the URL, while `require` can explicitly force TLS.
2. Set `NODE_ENV=production`, explicit `CORS_ORIGIN`, and production database pool/timeouts.
3. Create a logical backup or provider recovery point before schema/data migration. `npm run db:backup` wraps `pg_dump -Fc` and verifies the dump with `pg_restore --list` when PostgreSQL client tools are installed. The default backup directory is outside the project under the OS temp directory; use `BACKUP_DIR` for retained backups.
4. Run `npm run db:preflight`. It checks connectivity, writeability, active SSL session when forced, production guardrails, and produces a migration plan.
5. Run `npm run db:migrate:plan`, then `npm run db:migrate`. The runner uses a PostgreSQL advisory lock plus `shifttime_schema_migrations` with SHA-256 checksums. Previously applied migration files cannot silently change: checksum drift fails the migration. Existing pre-01080 databases can safely run 001…009 again because those migrations are written idempotently; the journal is then populated.
6. For the temporary pre-01082 authorization bridge, set `BOOTSTRAP_OWNER_ENABLED=true`, owner/account/workspace/store values, and a generated `BOOTSTRAP_SESSION_TOKEN` of at least 32 characters, then run `npm run db:bootstrap-owner`. The token value is never logged and the session expires within 24 hours. Disable `BOOTSTRAP_OWNER_ENABLED` immediately after the one-time command. Real registration/session auth replaces this bridge in 01082.
7. Run `npm run db:verify`. It validates migration checksums/pending state, required tables, commerce snapshot schema, Store→Workspace→Account integrity, Seller→Store integrity, SellerOrder scope, and deployment stage.
8. In Marketplace Studio open `Production PostgreSQL` and run `Перевірити PostgreSQL`. Then use `Local → PostgreSQL`. The migration reads the source directly from the scoped LocalRepository, verifies server-authorized Store identity, blocks accidental overwrite of a different non-empty PostgreSQL Store, uploads the canonical 01052 snapshot, and imports the active Store operational LOCAL data: Marketplace seller/listings/offers, SellerOrders + immutable OrderItems, Payment allocations/events, Inventory reservation/ledger and per-SellerOrder Delivery. New listings coming from LOCAL DEV auto-approval are deliberately imported as `pending/pending` so migration cannot bypass production moderation. The snapshot is read back and compared with a canonical SHA-256 content hash; operational row counts are verified before MarketplaceStore switches to the API repository. The LocalRepository data remains intact as fallback/test storage.

Alternative CLI import for a JSON snapshot:

`npm run db:import-store -- /path/store.json --store=store_default --confirm=store_default`

In production `--confirm` must exactly match the target Store ID. Every successful snapshot replacement is written to `commerce_store_imports` with source kind, revisions, canonical SHA-256, entity counts, Store scope and importing user when available.

Migration `sql/010_production_postgresql_deployment.sql` adds:

- `platform_deployment_state`
- `commerce_store_imports`

The migration runner itself owns `shifttime_schema_migrations`.

Important stage boundary: `db:seed-dev` remains a DEV fixture only and is not required for production. Existing five-product/two-category/two-seller fixtures are preserved for local/manual tests. 01081 adds the cloud media boundary described below; the 01080 PostgreSQL deployment workflow remains intact.


## 01081 media cloud

Binary media is stored in R2/S3-compatible object storage through backend-generated presigned URLs. PostgreSQL stores only metadata in `media_cloud_assets`, derivative jobs and audit events. See `MEDIA-CLOUD-01081.md`.
