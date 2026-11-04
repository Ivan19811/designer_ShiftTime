-- 01613C4: independent, owner-managed module privileges for site-only collaborators.
-- Nothing is enabled by default. All values are store-scoped, not platform-wide.
BEGIN;
CREATE TABLE IF NOT EXISTS platform_delegated_module_grants_01613c4 (
 account_id text NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
 store_id text NOT NULL REFERENCES platform_stores(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
 marketplace_tier text NOT NULL DEFAULT 'none' CHECK(marketplace_tier IN ('none','view','edit')),
 messenger_tier text NOT NULL DEFAULT 'none' CHECK(messenger_tier IN ('none','view','reply')),
 updated_by_user_id text REFERENCES platform_users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(account_id,store_id,user_id)
);
COMMIT;
