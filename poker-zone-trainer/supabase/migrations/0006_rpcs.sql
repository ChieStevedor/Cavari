-- record_attempt: the ONLY way an answer is judged and progress updated. Correctness
-- and the adaptive-difficulty level-up check both happen here, in Postgres — never
-- in client code (Rule 2). Excludes 'borderline' scenarios from official accuracy
-- (Rule 1) and from the last-20 level-up window.
create or replace function public.record_attempt(p_scenario_id text, p_chosen_action text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scenario record;
  v_is_correct boolean;
  v_last20_total integer;
  v_last20_correct integer;
  v_last20_accuracy numeric;
  v_did_level_up boolean := false;
  v_progress record;
begin
  select * into v_scenario from public.scenario_bank where id = p_scenario_id;
  if not found then
    raise exception 'Unknown scenario_id: %', p_scenario_id;
  end if;

  v_is_correct := (p_chosen_action = v_scenario.correct_action);

  insert into public.decision_history
    (user_id, scenario_id, module, chosen_action, correct_action, is_correct, confidence)
  values
    (auth.uid(), p_scenario_id, v_scenario.module, p_chosen_action, v_scenario.correct_action, v_is_correct, v_scenario.confidence);

  insert into public.progress (user_id, module)
  values (auth.uid(), v_scenario.module)
  on conflict (user_id, module) do nothing;

  select * into v_progress from public.progress where user_id = auth.uid() and module = v_scenario.module;

  -- Rolling last-20 window over 'verified' attempts only (Rule 1: borderline
  -- scenarios never count toward official accuracy or level-up decisions).
  select count(*), count(*) filter (where is_correct)
    into v_last20_total, v_last20_correct
  from (
    select is_correct
    from public.decision_history
    where user_id = auth.uid() and module = v_scenario.module and confidence = 'verified'
    order by created_at desc
    limit 20
  ) recent;

  v_last20_accuracy := case when v_last20_total > 0 then v_last20_correct::numeric / v_last20_total else null end;

  -- Threshold from the spec: 80% correct over the last 20 verified attempts unlocks
  -- the next level.
  if v_last20_total >= 20 and v_last20_accuracy >= 0.8 then
    v_did_level_up := true;
  end if;

  update public.progress
  set
    accuracy_last_20 = v_last20_accuracy,
    attempts_overall = attempts_overall + case when v_scenario.confidence = 'verified' then 1 else 0 end,
    correct_overall = correct_overall + case when v_scenario.confidence = 'verified' and v_is_correct then 1 else 0 end,
    level = level + case when v_did_level_up then 1 else 0 end,
    updated_at = now()
  where user_id = auth.uid() and module = v_scenario.module
  returning * into v_progress;

  update public.progress
  set accuracy_overall = case when attempts_overall > 0 then correct_overall::numeric / attempts_overall else null end
  where user_id = auth.uid() and module = v_scenario.module
  returning * into v_progress;

  return jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_action', v_scenario.correct_action,
    'confidence', v_scenario.confidence,
    'did_level_up', v_did_level_up,
    'level', v_progress.level,
    'accuracy_last_20', v_progress.accuracy_last_20,
    'accuracy_overall', v_progress.accuracy_overall
  );
end;
$$;

grant execute on function public.record_attempt(text, text) to authenticated;

-- start_module_session: server-side gate on paid-module access. Free trial is a
-- placeholder count (5 sessions, per the build spec) checked against
-- module_trial_usage, OR an active RevenueCat entitlement mirrored in
-- public.subscriptions. The free 'ranges' module always returns allowed = true.
create or replace function public.start_module_session(p_module text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial_limit constant integer := 5; -- placeholder, see BUILD_PROMPT.md
  v_entitled boolean;
  v_used integer;
begin
  if p_module = 'ranges' then
    return jsonb_build_object('allowed', true, 'trial_remaining', null);
  end if;

  select coalesce(entitlement_active, false) into v_entitled
  from public.subscriptions where user_id = auth.uid();

  if v_entitled then
    return jsonb_build_object('allowed', true, 'trial_remaining', null);
  end if;

  insert into public.module_trial_usage (user_id, module)
  values (auth.uid(), p_module)
  on conflict (user_id, module) do nothing;

  select sessions_used into v_used
  from public.module_trial_usage where user_id = auth.uid() and module = p_module;

  if v_used >= v_trial_limit then
    return jsonb_build_object('allowed', false, 'trial_remaining', 0);
  end if;

  update public.module_trial_usage
  set sessions_used = sessions_used + 1, updated_at = now()
  where user_id = auth.uid() and module = p_module;

  return jsonb_build_object('allowed', true, 'trial_remaining', v_trial_limit - (v_used + 1));
end;
$$;

grant execute on function public.start_module_session(text) to authenticated;

-- delete_own_account: self-service account deletion (App Store guideline 5.1.1v).
-- Deletes the caller's own auth.users row; ON DELETE CASCADE on every table above
-- takes care of profiles/progress/decision_history/feedback_flags/etc.
-- NOTE: per Supabase's documented self-deletion pattern, this function must be
-- owned by a role with privileges on the auth schema (e.g. supabase_auth_admin) —
-- confirm this in your actual Supabase project, since it cannot be verified from
-- this repo alone.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
