BEGIN;
-- Seller-controlled parameters for PRELIMINARY carrier quote only. Not a TTN nor an order total.
CREATE TABLE IF NOT EXISTS shifttime_shipping_quote_profiles (
  store_id text PRIMARY KEY REFERENCES platform_stores(id) ON DELETE CASCADE,
  sender_city_ref text NOT NULL,
  sender_city_name text NOT NULL,
  sample_parcel_weight_kg numeric(10,3) NOT NULL CHECK (sample_parcel_weight_kg > 0 AND sample_parcel_weight_kg <= 1000),
  sample_seats integer NOT NULL CHECK (sample_seats BETWEEN 1 AND 100),
  enabled boolean NOT NULL DEFAULT true,
  updated_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
