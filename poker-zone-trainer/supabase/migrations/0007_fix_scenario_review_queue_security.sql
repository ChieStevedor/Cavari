-- Fixes a real finding from Supabase's Security Advisor (splinter linter):
-- scenario_review_queue (added in 0005) was created without security_invoker,
-- so it ran with the view owner's privileges and could bypass feedback_flags'
-- RLS policies for any client able to query it. This migration is only needed
-- for databases that already applied 0005 before this fix existed — 0005 itself
-- now creates the view correctly, so a fresh database never needs this file.
create or replace view public.scenario_review_queue
with (security_invoker = true) as
select scenario_id, count(*) as down_votes
from public.feedback_flags
where vote = 'down'
group by scenario_id
having count(*) >= 3;
