BEGIN;
-- Store-scoped, seller-authored parcel characteristics. No prices, keys or buyer data.
CREATE TABLE IF NOT EXISTS shifttime_shipping_product_parcels (
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 product_id text NOT NULL,
 variant_id text NOT NULL DEFAULT '',
 shipping_required boolean NOT NULL DEFAULT true,
 weight_kg numeric(10,3),
 length_cm numeric(8,1),
 width_cm numeric(8,1),
 height_cm numeric(8,1),
 updated_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(store_id,product_id,variant_id),
 CHECK ((shipping_required = false AND weight_kg IS NULL) OR (shipping_required = true AND weight_kg > 0 AND weight_kg <= 1000)),
 CHECK ((length_cm IS NULL AND width_cm IS NULL AND height_cm IS NULL) OR (length_cm > 0 AND length_cm <= 300 AND width_cm > 0 AND width_cm <= 300 AND height_cm > 0 AND height_cm <= 300))
);
COMMIT;
