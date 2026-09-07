-- Remediation P0.3: maturity is now derived from status (see
-- lib/domain/statuses.ts maturityForStatus) instead of being independent,
-- hand-set state that could drift. Backfill existing rows to match.
-- Idempotent — safe to re-run.

update public.products set maturity = 2 where status = 'BUILDING';
update public.products set maturity = 3 where status in ('LAUNCHED', 'MEASURING', 'ITERATING');
update public.products set maturity = 5 where status = 'WINNER';
update public.products set maturity = 6 where status = 'SCALE';
-- KILLED/ARCHIVED intentionally untouched: maturity freezes at whatever
-- value the product had going into that transition.

-- ---------------------------------------------------------------------------
-- Remediation P0.2: one active PENDING decision per subject + decision_type.
-- Two partial unique indexes rather than one, because Postgres treats NULL
-- as distinct from NULL — a single index on (idea_id, product_id,
-- decision_type) would not actually stop two PENDING product-only rows
-- (idea_id NULL in both) from being treated as non-conflicting.
-- ---------------------------------------------------------------------------

create unique index decisions_one_pending_per_idea_type
  on public.decisions (idea_id, decision_type)
  where status = 'PENDING' and idea_id is not null;

create unique index decisions_one_pending_per_product_type
  on public.decisions (product_id, decision_type)
  where status = 'PENDING' and product_id is not null;
