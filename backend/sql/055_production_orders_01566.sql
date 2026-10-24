-- 01566 · Transactional store-scoped production orders. No payment, stock, TTN or CRM side-effects.
BEGIN;
CREATE SEQUENCE IF NOT EXISTS shifttime_production_order_number_seq_01566;
CREATE TABLE IF NOT EXISTS shifttime_production_orders_01566 (
 id uuid PRIMARY KEY,
 order_number text NOT NULL UNIQUE,
 account_id text NOT NULL REFERENCES platform_accounts(id),
 workspace_id text NOT NULL REFERENCES platform_workspaces(id),
 store_id text NOT NULL REFERENCES platform_stores(id),
 site_id text NOT NULL,
 source_draft_id text NOT NULL,
 source_offer_id uuid NOT NULL,
 source_cart_id text NOT NULL,
 created_by_manager_id text NOT NULL REFERENCES platform_users(id),
 request_id uuid NOT NULL,
 buyer_acknowledged_at timestamptz NOT NULL,
 email_possession_verified boolean NOT NULL DEFAULT false,
 currency text NOT NULL DEFAULT 'UAH' CHECK(currency='UAH'),
 cart_fingerprint char(64) NOT NULL,
 packing_fingerprint char(64) NOT NULL,
 items jsonb NOT NULL CHECK(jsonb_typeof(items)='array' AND jsonb_array_length(items)>0),
 packages jsonb NOT NULL CHECK(jsonb_typeof(packages)='array' AND jsonb_array_length(packages)>0),
 number_of_packages integer NOT NULL CHECK(number_of_packages BETWEEN 1 AND 100),
 total_weight_grams integer NOT NULL CHECK(total_weight_grams>0),
 recipient_city_ref text NOT NULL,
 recipient_warehouse_ref text NOT NULL,
 subtotal_cents bigint NOT NULL CHECK(subtotal_cents>0),
 delivery_cents bigint NOT NULL CHECK(delivery_cents>0),
 total_cents bigint NOT NULL CHECK(total_cents=subtotal_cents+delivery_cents),
 delivery_price_kind text NOT NULL DEFAULT 'store_offer_based_on_carrier_estimate' CHECK(delivery_price_kind='store_offer_based_on_carrier_estimate'),
 order_status text NOT NULL DEFAULT 'received' CHECK(order_status='received'),
 shipping_status text NOT NULL DEFAULT 'pending_manual_confirmation' CHECK(shipping_status='pending_manual_confirmation'),
 payment_status text NOT NULL DEFAULT 'not_started' CHECK(payment_status='not_started'),
 inventory_status text NOT NULL DEFAULT 'not_reserved' CHECK(inventory_status='not_reserved'),
 crm_status text NOT NULL DEFAULT 'not_sent' CHECK(crm_status='not_sent'),
 waybill_status text NOT NULL DEFAULT 'not_created' CHECK(waybill_status='not_created'),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(store_id,source_draft_id),
 UNIQUE(store_id,source_offer_id),
 UNIQUE(store_id,request_id)
);
CREATE INDEX IF NOT EXISTS idx_production_orders_store_01566 ON shifttime_production_orders_01566(store_id,created_at DESC);
CREATE TABLE IF NOT EXISTS shifttime_production_order_contacts_01566 (
 order_id uuid PRIMARY KEY REFERENCES shifttime_production_orders_01566(id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id),
 source_draft_id text NOT NULL,
 iv_b64 text NOT NULL,
 ciphertext_b64 text NOT NULL,
 tag_b64 text NOT NULL,
 contacts_digest char(64) NOT NULL,
 copied_at timestamptz NOT NULL DEFAULT now(),
 CHECK(length(iv_b64)=16),CHECK(length(tag_b64)=24),CHECK(length(ciphertext_b64)>20)
);
CREATE TABLE IF NOT EXISTS shifttime_production_order_events_01566 (
 id bigserial PRIMARY KEY,
 order_id uuid NOT NULL REFERENCES shifttime_production_orders_01566(id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id),
 actor_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 event_type text NOT NULL CHECK(event_type='order_created'),
 details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(details)='object'),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_production_order_events_01566 ON shifttime_production_order_events_01566(store_id,order_id,id DESC);
COMMIT;
