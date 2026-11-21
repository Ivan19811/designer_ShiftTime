BEGIN;

-- 01092 encoded null defaults as an empty JSON object. Empty objects are not
-- valid values for any current Tables field type, so repair them to JSON null.
UPDATE shifttime_table_fields
SET default_value = 'null'::jsonb,
    updated_at = now()
WHERE default_value = '{}'::jsonb;

WITH repaired AS (
  SELECT
    r.id,
    jsonb_object_agg(
      entry.key,
      CASE WHEN entry.value = '{}'::jsonb THEN 'null'::jsonb ELSE entry.value END
    ) AS next_values
  FROM shifttime_table_records r
  CROSS JOIN LATERAL jsonb_each(r.values) AS entry
  WHERE EXISTS (
    SELECT 1
    FROM jsonb_each(r.values) AS current_entry
    WHERE current_entry.value = '{}'::jsonb
  )
  GROUP BY r.id
)
UPDATE shifttime_table_records AS target
SET values = repaired.next_values,
    updated_at = now()
FROM repaired
WHERE target.id = repaired.id;

COMMIT;
