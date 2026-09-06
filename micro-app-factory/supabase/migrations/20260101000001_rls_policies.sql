-- Row Level Security: every table is private to its owner (spec §34).
-- One uniform policy per table — owner_id = auth.uid() for all four
-- operations — since the app is single-tenant-per-user by design.

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'idea_sources', 'categories', 'scoring_rules', 'tags',
      'ideas', 'idea_tags', 'research_items',
      'validation_experiments', 'validation_metrics',
      'products', 'product_tags', 'metrics', 'expenses', 'time_entries',
      'launch_checklist_items', 'experiments', 'decisions',
      'notifications', 'weekly_reviews'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy %I on public.%I for select using (owner_id = auth.uid())',
      t || '_select_own', t
    );
    execute format(
      'create policy %I on public.%I for insert with check (owner_id = auth.uid())',
      t || '_insert_own', t
    );
    execute format(
      'create policy %I on public.%I for update using (owner_id = auth.uid()) with check (owner_id = auth.uid())',
      t || '_update_own', t
    );
    execute format(
      'create policy %I on public.%I for delete using (owner_id = auth.uid())',
      t || '_delete_own', t
    );
  end loop;
end $$;
