-- P2.10 remediation. Confirmed bug: updateIdeaStatus() flipped the idea's
-- status to BUILDING, then created the product row, then created its
-- checklist — three separate statements with no shared transaction. If the
-- product insert failed after the status write had already committed, the
-- idea was left permanently in BUILDING with no product and no automatic
-- recovery path.
--
-- security invoker (the default — stated explicitly here) means this runs
-- as the calling user, so the existing RLS policies on ideas/products/
-- launch_checklist_items still apply exactly as if the caller had run
-- these statements directly; nothing here bypasses row-level security.
create or replace function public.create_product_for_idea(p_idea_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_idea record;
  v_existing_id uuid;
  v_product_id uuid;
  v_label text;
  v_sort int := 0;
begin
  select id, name, category_id, owner_id into v_idea
  from public.ideas
  where id = p_idea_id;

  if not found then
    raise exception 'Idea % not found or not visible to the current user', p_idea_id;
  end if;

  -- Idempotent: if a product already exists for this idea (e.g. a retried
  -- call after an earlier partial failure under the old two-step code),
  -- just make sure the idea's status reflects it and return that product.
  select id into v_existing_id from public.products where idea_id = p_idea_id;
  if v_existing_id is not null then
    update public.ideas set status = 'BUILDING' where id = p_idea_id;
    return v_existing_id;
  end if;

  update public.ideas set status = 'BUILDING' where id = p_idea_id;

  insert into public.products (
    owner_id, idea_id, name, category_id, status, maturity, dev_start_date
  ) values (
    v_idea.owner_id, p_idea_id, v_idea.name, v_idea.category_id, 'BUILDING', 2, current_date
  )
  returning id into v_product_id;

  foreach v_label in array array[
    'MVP works', 'Mobile responsive', 'Error handling', 'Analytics installed',
    'Payment system configured', 'Landing page', 'Pricing', 'Privacy policy',
    'Terms', 'SEO metadata', 'OG image', 'Favicon', 'Domain',
    'Production deployment', 'Test payment', 'Test onboarding',
    'First distribution channel', 'First marketing experiment'
  ]
  loop
    insert into public.launch_checklist_items (owner_id, product_id, label, is_default, sort_order)
    values (v_idea.owner_id, v_product_id, v_label, true, v_sort);
    v_sort := v_sort + 1;
  end loop;

  return v_product_id;
end;
$$;
