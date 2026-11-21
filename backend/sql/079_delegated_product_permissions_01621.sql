-- 01621 · Default deny for each granular product capability.
-- Existing broad marketplace tier remains for navigation; it does not imply write grants.
BEGIN;
ALTER TABLE platform_delegated_module_grants_01613c4
 ADD COLUMN IF NOT EXISTS product_permissions jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE platform_delegated_module_grants_01613c4
 ADD CONSTRAINT delegated_product_permissions_array_01621 CHECK(jsonb_typeof(product_permissions)='array');
COMMIT;
