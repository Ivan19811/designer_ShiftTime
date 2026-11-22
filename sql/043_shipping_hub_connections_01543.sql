BEGIN;
-- Store-scoped, envelope-encrypted carrier credentials. The encryption key exists in Render only.
CREATE TABLE IF NOT EXISTS shifttime_shipping_connections (
  store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('nova-poshta')),
  encrypted_api_key text NOT NULL,
  key_fingerprint text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(store_id,provider)
);
COMMIT;
