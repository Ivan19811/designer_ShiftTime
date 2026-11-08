-- 01619B · One-time acceptance and itemized approval audit.
-- Do not modify a previously applied migration. This new migration is additive.
BEGIN;
CREATE TABLE IF NOT EXISTS shifttime_site_test_change_ledger_01619b (
 site_id text NOT NULL REFERENCES shifttime_builder_sites(id) ON DELETE CASCADE,
 test_id text NOT NULL,
 revision_id text NOT NULL,
 change_id text NOT NULL,
 batch_id text NOT NULL REFERENCES shifttime_site_test_change_batches_01618(id) ON DELETE CASCADE,
 actor_user_id text NOT NULL REFERENCES platform_users(id),
 page_id text NOT NULL,
 node_id text NOT NULL,
 field text NOT NULL,
 match_method text NOT NULL,
 before_preview text NOT NULL DEFAULT '',
 after_preview text NOT NULL DEFAULT '',
 before_field_sha text NOT NULL,
 after_field_sha text NOT NULL,
 original_revision_after bigint NOT NULL,
 status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','rolled_back')),
 applied_at timestamptz NOT NULL DEFAULT now(),
 rolled_back_at timestamptz,
 PRIMARY KEY (site_id,revision_id,change_id)
);
CREATE INDEX IF NOT EXISTS idx_st_change_ledger_batch_01619b ON shifttime_site_test_change_ledger_01619b(batch_id);
CREATE INDEX IF NOT EXISTS idx_st_change_ledger_site_time_01619b ON shifttime_site_test_change_ledger_01619b(site_id,applied_at DESC);
-- Backfill verifiably unchanged legacy 01618 decisions. Older batch rows did
-- not store a submission revision ID or per-field content; never guess a later
-- manager revision. We only attach to a branch not updated since that batch.
-- The display explicitly identifies these as legacy-only audit entries.
INSERT INTO shifttime_site_test_change_ledger_01619b
 (site_id,test_id,revision_id,change_id,batch_id,actor_user_id,page_id,node_id,field,match_method,
  before_preview,after_preview,before_field_sha,after_field_sha,original_revision_after,status,applied_at,rolled_back_at)
SELECT b.site_id,choice->>'testId',br.revision_id,choice->>'changeId',b.id,b.actor_user_id,
 'legacy','legacy','legacy','legacy-01618',
 '[історичне рішення 01618 — попереднє значення недоступне]',
 '[історичне рішення 01618 — нове значення недоступне]',
 b.before_sha,b.after_sha,b.original_revision_after,b.status,b.created_at,b.rolled_back_at
FROM shifttime_site_test_change_batches_01618 b
CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(b.choices_json)='array'
 THEN b.choices_json ELSE '[]'::jsonb END) AS legacy_choice(choice)
JOIN shifttime_site_test_branches_01613d br ON br.site_id=b.site_id
 AND br.id=(choice->>'testId')
WHERE choice->>'decision'='accept' AND length(choice->>'changeId')>0
 AND br.updated_at<=b.created_at
ON CONFLICT (site_id,revision_id,change_id) DO NOTHING;
COMMIT;
