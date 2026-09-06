-- Realistic fictional seed data (spec §39-40).
-- Run manually after creating your account: `psql "$DATABASE_URL" -f supabase/seed.sql`
-- (not wired into `supabase db reset` because it needs a real auth.users row
-- to own the data — sign up once first).

create temporary table _seed_owner as
select id as owner_id from auth.users order by created_at asc limit 1;

do $$
begin
  if not exists (select 1 from _seed_owner) then
    raise exception 'No auth.users row found. Sign up in the app once, then re-run this seed.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Lookups
-- ---------------------------------------------------------------------------

insert into public.idea_sources (owner_id, name)
select owner_id, s from _seed_owner, unnest(array[
  'Reddit', 'Google', 'App Store', 'Google Play', 'Product Hunt',
  'Customer request', 'Personal experience', 'Competitor review',
  'Industry knowledge', 'AI research', 'Other'
]) as s;

insert into public.categories (owner_id, name)
select owner_id, c from _seed_owner, unnest(array[
  'Productivity', 'Finance', 'Logistics', 'Fitness', 'Travel',
  'Business', 'AI tools', 'Consumer utilities'
]) as c;

insert into public.scoring_rules (owner_id, factor_key, label, weight)
select owner_id, f.k, f.l, 1.0
from _seed_owner, (values
  ('pain', 'Pain'),
  ('frequency', 'Frequency'),
  ('willingness_to_pay', 'Willingness to Pay'),
  ('search_intent', 'Search Intent'),
  ('buildability', 'Buildability'),
  ('distribution_potential', 'Distribution Potential')
) as f(k, l);

-- ---------------------------------------------------------------------------
-- Ideas
-- ---------------------------------------------------------------------------

insert into public.ideas (
  owner_id, name, description, category_id, target_customer, problem, solution,
  source_id, source_url, founder_notes,
  main_competitor, competitor_url, competitor_pricing, market_size_estimate, evidence_of_demand,
  mvp_complexity, estimated_build_hours, monetization_model, expected_price_cents,
  score_pain, score_frequency, score_willingness_to_pay, score_search_intent, score_buildability, score_distribution,
  evidence_confidence, status
)
select owner_id, 'Simple Habit Counter',
  'Lightweight habit/day counter, home-screen-friendly, no account required.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Consumer utilities'),
  'People building one daily habit who find habit-tracker apps too heavy',
  'Most habit trackers demand signup, streak-shaming, and a subscription for one counter.',
  'A single-purpose counter you can add to your home screen in 10 seconds. One-time price, no account.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Personal experience'),
  null, 'Built this for myself first — using it daily since March.',
  'Streaks, Habitica', 'https://example.com/streaks', '$4.99/mo', 'Niche but evergreen; thousands of "simple habit tracker" searches/mo',
  'A few people in a habit-building Discord asked where I got mine',
  'low', 18, 'one_time', 999,
  3, 4, 2, 3, 5, 3, 1, 'MEASURING'
from _seed_owner
union all
select owner_id, 'QuickReceipt',
  'Snap a photo of a paper receipt, get a categorized expense line synced to a spreadsheet.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Finance'),
  'Freelancers and small-business owners doing their own bookkeeping',
  'Manually typing receipts into a spreadsheet at tax time is miserable and error-prone.',
  'Phone camera + OCR extracts vendor/date/amount, appends a row to a Google Sheet.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Google Play'),
  null, 'Validated via a 3-week landing page test before building.',
  'Expensify, Wave', 'https://example.com/expensify', '$5/user/mo', 'Large market, crowded with heavier tools',
  '41 signups on landing page, 6 paid within first week of launch',
  'medium', 34, 'subscription', 700,
  4, 4, 4, 4, 3, 3, 3, 'MEASURING'
from _seed_owner
union all
select owner_id, 'Invoice Nudge',
  'Automatic polite follow-up emails for overdue invoices, plugs into Stripe Invoicing.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Business'),
  'Solo consultants and small agencies who hate chasing late payers',
  'Chasing late invoices is awkward and gets forgotten; cash flow suffers.',
  'Connect Stripe, set a nudge schedule, done — reminders send themselves.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Customer request'),
  null, 'A client explicitly asked "does something like this exist?" — that is where this came from.',
  'Chaser, Bonsai', 'https://example.com/chaser', '$25-49/mo', 'Proven category, underserved at the solo-consultant price point',
  '12 paying customers, $412 MRR and growing month over month',
  'medium', 40, 'subscription', 1900,
  4, 5, 5, 4, 3, 4, 5, 'WINNER'
from _seed_owner
union all
select owner_id, 'ReplyRadar',
  'Aggregates App Store + Play Store reviews across competitor apps into one weekly digest.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Business'),
  'Indie app developers tracking what competitors'' users complain about',
  'Manually checking five competitor app-store pages every week doesn''t happen.',
  'Weekly email digest of new reviews across a watchlist of competitor apps.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'App Store'),
  null, 'Killed after distribution attempts produced visits but no signal of real demand.',
  'AppFollow', 'https://example.com/appfollow', '$55+/mo', 'Real market but dominated by enterprise-priced tools',
  '184 qualified visitors, 3 signups, 0 activated users, $0 revenue after 6 weeks',
  'low', 22, 'subscription', 900,
  3, 3, 2, 2, 4, 2, 2, 'KILLED'
from _seed_owner
union all
select owner_id, 'Warranty Vault',
  'Photograph receipts and warranty cards, get reminded before coverage expires.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Consumer utilities'),
  'Households who buy appliances/electronics and lose track of warranties',
  'Warranty cards get lost in a drawer; people miss the window to claim.',
  'Photo + auto-detected expiry date, one push notification before it lapses.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Reddit'),
  null, 'Built and launched; usage never materialized past the first week.',
  'None direct — closest is generic note-taking apps', null, null, 'Hard to size; anecdotal only',
  'A handful of upvotes on a r/LifeProTips thread, nothing more',
  'low', 26, 'one_time', 499,
  2, 2, 1, 2, 4, 2, 1, 'KILLED'
from _seed_owner
union all
select owner_id, 'StandupBot Lite',
  'Async daily standup bot for Slack — post your update, teammates react, no meeting.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Business'),
  'Small remote teams tired of synchronous standup meetings',
  'A 15-minute daily standup call is a poor use of a distributed team''s time.',
  'Slack bot DMs a prompt at a set time, compiles answers into one channel post.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Personal experience'),
  null, 'Building nights/weekends; targeting a 2-week build.',
  'Geekbot, Standuply', 'https://example.com/geekbot', '$2.50/user/mo', 'Established category, room for a cheaper/simpler entrant',
  'Two former coworkers said they''d switch if it were simpler and cheaper',
  'medium', 30, 'subscription', 500,
  3, 4, 3, 3, 4, 3, 2, 'BUILDING'
from _seed_owner
union all
select owner_id, 'ShelfLife Label Maker',
  'Print freezer/pantry labels with auto-calculated use-by dates from a phone.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Consumer utilities'),
  'Home cooks who meal-prep and batch-freeze',
  'Guessing how long something has been in the freezer leads to waste.',
  'Pick a food type, app calculates the use-by date, prints/sends a label.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Reddit'),
  null, 'Small but enthusiastic niche on r/MealPrepSunday.',
  'None direct', null, null, 'Small but recurring: meal-prep is a weekly habit for the target user',
  '30+ upvotes and several "I need this" comments on a meal-prep thread',
  'low', 20, 'one_time', 699,
  3, 4, 2, 2, 5, 2, 2, 'BUILDING'
from _seed_owner
union all
select owner_id, 'PantryPing',
  'Tracks pantry items and pings you before they expire, scan-to-add via barcode.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Consumer utilities'),
  'Households trying to cut food waste',
  'Food quietly expires in the back of the pantry/fridge unnoticed.',
  'Barcode scan to log an item with a typical shelf life; notified a few days before it turns.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Reddit'),
  null, 'Currently running a landing-page + waitlist test.',
  'NoWaste, Fridgely', 'https://example.com/nowaste', '$3.99/mo', 'Recurring pain, but past entrants have struggled with retention',
  '2 competitor apps exist with modest but real review counts',
  'medium', 45, 'subscription', 400,
  4, 5, 2, 3, 3, 2, 2, 'VALIDATING'
from _seed_owner
union all
select owner_id, 'FreelanceRateCheck',
  'Benchmarks your freelance day rate against others in your skill + region.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Finance'),
  'New freelancers unsure what to charge',
  'Underpricing is common and hard to fix once a client relationship starts.',
  'Anonymous rate-input pool; enter your skill/region, see the distribution.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Google'),
  null, 'Running a $9.99 pre-order test on the landing page.',
  'Payscale (generic, not freelance-specific)', null, null, 'High search volume for "freelance rates by [skill]"',
  '"what should I charge" threads are extremely common in freelance subreddits',
  'medium', 28, 'one_time', 999,
  3, 3, 3, 5, 3, 3, 3, 'VALIDATING'
from _seed_owner
union all
select owner_id, 'LocalGigBoard',
  'Hyperlocal job board for one-off gigs (moving help, yard work) in a single town.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Business'),
  'Small-town residents needing quick one-off help',
  'Craigslist is national/noisy; Nextdoor buries gig posts under everything else.',
  'A single-town board, gig posts only, no resumes or applications.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Product Hunt'),
  null, 'Scored, not yet validating — need to pick a pilot town.',
  'Nextdoor, Craigslist', null, 'free', 'Hard to size; hyperlocal by design',
  'Anecdotal only so far — this is an assumption, not evidence',
  'medium', 35, 'commission', 0,
  3, 3, 2, 2, 3, 2, 1, 'SCORED'
from _seed_owner
union all
select owner_id, 'AI Resume Roaster',
  'Upload a resume, get blunt AI feedback in the voice of a skeptical hiring manager.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'AI tools'),
  'Job seekers who want direct feedback, not generic tips',
  'Generic "resume tips" content is everywhere; specific, harsh feedback is not.',
  'Upload PDF, get a line-by-line roast plus concrete fixes.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'AI research'),
  null, 'Scored based on search volume alone — needs real research before validating.',
  'Kickresume, Teal', 'https://example.com/kickresume', '$19-29/mo', 'High search volume around "resume feedback"',
  'Search volume estimate only — no direct user contact yet',
  'low', 15, 'freemium', 500,
  2, 3, 2, 4, 5, 3, 0, 'SCORED'
from _seed_owner
union all
select owner_id, 'CommuteSplit',
  'Splits recurring carpool costs automatically based on a shared calendar.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Travel'),
  'Regular carpool groups (commute or school run)',
  'Carpool cost-splitting is done with mental math or an awkward group chat.',
  'Connect a shared calendar; the app tallies who drove and settles up monthly.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Personal experience'),
  null, 'Researched lightly; evidence is thin so far — flagged as weak before sinking more time in.',
  'Splitwise (generic, not carpool-specific)', 'https://example.com/splitwise', 'free', 'Small, very specific niche',
  'Two neighbors mentioned doing this by hand — that is the entire evidence base',
  'medium', 25, 'one_time', 299,
  2, 3, 1, 1, 3, 1, 0, 'RESEARCHING'
from _seed_owner
union all
select owner_id, 'Micro-Retreat Finder',
  'Finds same-week discounted openings at small boutique retreats within driving distance.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Travel'),
  'Burned-out professionals who want a last-minute short retreat',
  'Boutique retreats have empty-room inventory close to their dates that never surfaces to search.',
  'Aggregate last-minute openings from a handful of retreat operators.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Industry knowledge'),
  null, 'Raw idea — not yet researched.',
  null, null, null, null, null,
  null, null, null, null,
  null, null, null, null, null, null,
  null, 'IDEA'
from _seed_owner
union all
select owner_id, 'Subscription Sweep',
  'Scans bank statements for forgotten recurring subscriptions and drafts cancel emails.',
  (select id from public.categories where owner_id = _seed_owner.owner_id and name = 'Finance'),
  'Anyone with subscription creep on their card statement',
  'People keep paying for things they forgot they signed up for.',
  'Import a statement, flag likely subscriptions, draft a cancellation email.',
  (select id from public.idea_sources where owner_id = _seed_owner.owner_id and name = 'Competitor review'),
  null, 'Raw idea, spun off from reading Rocket Money reviews complaining about their cut of savings.',
  'Rocket Money', 'https://example.com/rocketmoney', '40% of savings found', null, null,
  null, null, null, null,
  null, null, null, null, null, null,
  null, 'IDEA'
from _seed_owner;

-- ---------------------------------------------------------------------------
-- Research items (evidence) for the 3 "researched" ideas + the 2 validating ones
-- ---------------------------------------------------------------------------

insert into public.research_items (owner_id, idea_id, type, url, title, notes, evidence_strength)
select o.owner_id, i.id, r.type, r.url, r.title, r.notes, r.strength
from _seed_owner o
join public.ideas i on i.owner_id = o.owner_id
cross join lateral (values
  ('LocalGigBoard', 'product_hunt', 'https://example.com/ph/gigboard', 'Similar launch got 200 upvotes',
   'A near-identical concept launched on PH 18mo ago, decent reception then went quiet.', 2),
  ('AI Resume Roaster', 'google_search', 'https://example.com/trends/resume-feedback', 'Search trend snapshot',
   '"resume feedback ai" search volume trending up over the last 12 months.', 1),
  ('CommuteSplit', 'note', null, 'Neighbor conversation',
   'Two separate neighbors independently mentioned splitting carpool gas costs by hand.', 1),
  ('PantryPing', 'reddit', 'https://example.com/r/ZeroWaste/pantryping', 'r/ZeroWaste thread on food waste tracking',
   '40+ comments, several people asking "does an app for this exist"', 3),
  ('PantryPing', 'app_store', 'https://example.com/appstore/nowaste', 'Competitor: NoWaste app store page',
   '4.3 stars, 1200+ ratings, many reviews mention wanting simpler barcode scanning.', 3),
  ('FreelanceRateCheck', 'google_search', 'https://example.com/trends/freelance-rates', 'Search volume for rate-benchmarking queries',
   'Consistent monthly volume for "[skill] freelance rate" queries.', 2),
  ('FreelanceRateCheck', 'forum', 'https://example.com/forum/freelance-rates-thread', 'r/freelance rate-check megathread',
   'Recurring weekly thread, hundreds of comments over time asking what to charge.', 3)
) as r(idea_name, type, url, title, notes, strength)
where i.name = r.idea_name;

-- ---------------------------------------------------------------------------
-- Validation experiments + daily metrics
-- ---------------------------------------------------------------------------

insert into public.validation_experiments (
  owner_id, idea_id, name, hypothesis, target_customer_who, target_customer_problem,
  current_solution, dissatisfaction_reason, purchase_trigger, reach_channel,
  channel, start_date, end_date, budget_cents, time_budget_hours,
  traffic_target, signup_target, revenue_target_cents, status
)
select o.owner_id, i.id, 'PantryPing waitlist + pre-order test',
  'Households who buy groceries weekly will pre-order a $4.99/mo pantry expiry tracker before it exists.',
  'Home cooks age 28-45 who grocery shop weekly for a household of 2+',
  'Food quietly expires and gets thrown out without anyone noticing until it smells',
  'Sticky notes on the fridge, or nothing at all',
  'Existing apps require too much manual data entry to keep up',
  'Throwing away visibly spoiled food they forgot about',
  'r/ZeroWaste and r/MealPrepSunday communities',
  'reddit_organic', current_date - interval '18 days', current_date + interval '10 days',
  0, 12, 400, 60, 15000, 'RUNNING'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'PantryPing'
union all
select o.owner_id, i.id, 'FreelanceRateCheck $9.99 pre-order test',
  'Freelancers uncertain about pricing will pay $9.99 up front for a rate-benchmark report before it exists.',
  'Freelancers in their first 1-2 years, mainly design/dev/writing',
  'No confident answer to "what should I charge for this"',
  'Asking in a subreddit or guessing based on a friend''s rate',
  'Guesses from forums feel unreliable and not specific to their skill/region',
  'Losing a negotiation or realizing they undercharged a past client',
  'Freelance subreddits + a Twitter/X thread',
  'organic_social', current_date - interval '25 days', current_date - interval '4 days',
  5000, 20, 600, 80, 20000, 'COMPLETED'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'FreelanceRateCheck';

-- PantryPing: 6 days of ramping-but-thin metrics (still running)
insert into public.validation_metrics (owner_id, experiment_id, date, visitors, signups, activated_users, returning_users, checkout_starts, purchases, revenue_cents, cost_cents, hours)
select o.owner_id, e.id, d.day, d.visitors, d.signups, d.activated, d.ret, d.checkout, d.purchases, d.revenue, 0, d.hours
from _seed_owner o
join public.validation_experiments e on e.owner_id = o.owner_id and e.name = 'PantryPing waitlist + pre-order test'
cross join lateral (values
  (current_date - interval '5 days', 41, 6, 2, 0, 1, 0, 0, 1.5),
  (current_date - interval '4 days', 38, 5, 3, 1, 1, 0, 0, 1.0),
  (current_date - interval '3 days', 52, 9, 4, 1, 2, 1, 499, 2.0),
  (current_date - interval '2 days', 47, 7, 3, 2, 1, 0, 0, 1.0),
  (current_date - interval '1 days', 60, 11, 5, 2, 3, 1, 499, 1.5),
  (current_date, 55, 8, 4, 3, 2, 1, 499, 1.0)
) as d(day, visitors, signups, activated, ret, checkout, purchases, revenue, hours);

-- FreelanceRateCheck: full completed run, weak-to-moderate result
insert into public.validation_metrics (owner_id, experiment_id, date, visitors, signups, activated_users, returning_users, checkout_starts, purchases, revenue_cents, cost_cents, hours)
select o.owner_id, e.id, d.day, d.visitors, d.signups, d.activated, d.ret, d.checkout, d.purchases, d.revenue, d.cost, d.hours
from _seed_owner o
join public.validation_experiments e on e.owner_id = o.owner_id and e.name = 'FreelanceRateCheck $9.99 pre-order test'
cross join lateral (values
  (current_date - interval '24 days', 80, 10, 4, 0, 1, 0, 0, 1500, 2.0),
  (current_date - interval '20 days', 95, 14, 6, 3, 2, 1, 999, 1500, 2.0),
  (current_date - interval '16 days', 110, 12, 5, 4, 1, 0, 0, 500, 2.5),
  (current_date - interval '12 days', 130, 18, 8, 5, 3, 2, 1998, 500, 3.0),
  (current_date - interval '8 days', 90, 9, 4, 4, 1, 1, 999, 0, 2.0),
  (current_date - interval '4 days', 70, 7, 3, 3, 1, 0, 0, 0, 1.5)
) as d(day, visitors, signups, activated, ret, checkout, purchases, revenue, cost, hours);

update public.validation_experiments set
  result = '31 signups, 3 purchases ($2996) against a $15,000 target — real willingness to pay exists but far below the bar to justify the full build yet.',
  learnings = 'Price point held ($9.99 didn''t suppress purchases), but reach was the bottleneck: organic social alone could not hit the traffic target. Worth a second, paid-traffic round before deciding.'
from _seed_owner o
where public.validation_experiments.owner_id = o.owner_id
  and public.validation_experiments.name = 'FreelanceRateCheck $9.99 pre-order test';

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

insert into public.products (
  owner_id, idea_id, name, url, category_id, status, maturity, launch_date, pricing_model, price_cents,
  mvp_core_problem, mvp_core_feature, mvp_must_have, mvp_should_have, mvp_not_now, mvp_future,
  dev_start_date, dev_target_launch, dev_actual_launch, dev_estimated_hours, dev_actual_hours, dev_tools_used
)
select o.owner_id, i.id, 'Simple Habit Counter', 'https://example.com/habitcounter',
  i.category_id, 'MEASURING', 3, current_date - interval '90 days', 'one_time', 999,
  'Track one daily habit without any account or subscription friction',
  'Tap to increment today''s count; see a simple streak',
  array['Home-screen install', 'Tap-to-count', 'Local streak history'],
  array['Multiple counters', 'iCloud backup'],
  array['Social sharing', 'Habit suggestions', 'Reminders'],
  array['Apple Watch complication'],
  current_date - interval '110 days', current_date - interval '92 days', current_date - interval '90 days',
  18, 22, 'Claude Code, Xcode'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'Simple Habit Counter'
union all
select o.owner_id, i.id, 'QuickReceipt', 'https://example.com/quickreceipt',
  i.category_id, 'MEASURING', 4, current_date - interval '75 days', 'subscription', 700,
  'Get a receipt off a desk and into a spreadsheet in under 10 seconds',
  'Photo to OCR to categorized spreadsheet row',
  array['Photo capture', 'OCR extraction', 'Google Sheets sync'],
  array['Multiple sheet destinations', 'Monthly export'],
  array['Mileage tracking', 'Team accounts', 'QuickBooks integration'],
  array['QuickBooks integration'],
  current_date - interval '110 days', current_date - interval '78 days', current_date - interval '75 days',
  34, 39, 'Claude Code, React Native'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'QuickReceipt'
union all
select o.owner_id, i.id, 'Invoice Nudge', 'https://example.com/invoicenudge',
  i.category_id, 'WINNER', 5, current_date - interval '150 days', 'subscription', 1900,
  'Get overdue invoices paid without an awkward manual follow-up',
  'Automatic scheduled nudge emails tied to Stripe invoice status',
  array['Stripe connect', 'Configurable nudge schedule', 'Delivery + open tracking'],
  array['SMS nudges', 'Custom email templates'],
  array['Multi-currency dunning', 'QuickBooks/Xero support'],
  array['Multi-currency dunning'],
  current_date - interval '180 days', current_date - interval '152 days', current_date - interval '150 days',
  40, 46, 'Claude Code, Next.js, Stripe'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'Invoice Nudge'
union all
select o.owner_id, i.id, 'ReplyRadar', 'https://example.com/replyradar',
  i.category_id, 'KILLED', 3, current_date - interval '80 days', 'subscription', 900,
  'Surface what competitor app users are complaining about without manual checking',
  'Weekly digest email of new reviews across a watchlist',
  array['Watchlist config', 'Weekly digest email'],
  array['Sentiment tagging'],
  array['Slack integration', 'Historical trend charts'],
  array['Slack integration'],
  current_date - interval '100 days', current_date - interval '82 days', current_date - interval '80 days',
  22, 25, 'Claude Code'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'ReplyRadar'
union all
select o.owner_id, i.id, 'Warranty Vault', 'https://example.com/warrantyvault',
  i.category_id, 'KILLED', 3, current_date - interval '60 days', 'one_time', 499,
  'Never miss a warranty claim window again',
  'Photo receipt, auto-detect expiry, one reminder notification',
  array['Photo capture', 'Expiry detection', 'Push reminder'],
  array['Manual date override'],
  array['Shared household accounts', 'Warranty claim templates'],
  array['Shared household accounts'],
  current_date - interval '75 days', current_date - interval '62 days', current_date - interval '60 days',
  26, 29, 'Claude Code'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'Warranty Vault'
union all
select o.owner_id, i.id, 'StandupBot Lite', null,
  i.category_id, 'BUILDING', 2, null, 'subscription', 500,
  'Replace a synchronous daily standup call with an async Slack thread',
  'Scheduled DM prompt that compiles answers into a channel digest',
  array['Scheduled DM prompt', 'Channel digest post'],
  array['Custom question sets'],
  array['Analytics on response time', 'Multi-workspace billing'],
  array['Analytics on response time'],
  current_date - interval '10 days', current_date + interval '4 days', null,
  30, 14, 'Claude Code, Slack Bolt'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'StandupBot Lite'
union all
select o.owner_id, i.id, 'ShelfLife Label Maker', null,
  i.category_id, 'BUILDING', 2, null, 'one_time', 699,
  'Stop guessing how long something has been in the freezer',
  'Pick a food type, get an auto-calculated use-by label to print or save',
  array['Food-type picker', 'Use-by calculation', 'Printable label'],
  array['Barcode-based food lookup'],
  array['Pantry inventory tracking', 'Recipe suggestions'],
  array['Pantry inventory tracking'],
  current_date - interval '6 days', current_date + interval '9 days', null,
  20, 8, 'Claude Code'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'ShelfLife Label Maker';

-- ---------------------------------------------------------------------------
-- Daily metrics for launched products (last 14 days, illustrative)
-- ---------------------------------------------------------------------------

insert into public.metrics (owner_id, product_id, date, visitors, users, activated_users, returning_users, checkout_starts, purchases, revenue_cents, refunds_cents)
select o.owner_id, p.id, gs.day,
  (20 + (random() * 15)::int),
  (8 + (random() * 6)::int),
  (5 + (random() * 4)::int),
  (10 + (random() * 8)::int),
  (2 + (random() * 3)::int),
  (1 + (random() * 2)::int),
  ((1 + (random() * 2)::int) * 999),
  0
from _seed_owner o
join public.products p on p.owner_id = o.owner_id and p.name = 'Simple Habit Counter'
cross join lateral generate_series(current_date - interval '13 days', current_date, interval '1 day') as gs(day)
union all
select o.owner_id, p.id, gs.day,
  (35 + (random() * 20)::int),
  (14 + (random() * 8)::int),
  (9 + (random() * 5)::int),
  (18 + (random() * 10)::int),
  (4 + (random() * 4)::int),
  (2 + (random() * 3)::int),
  ((2 + (random() * 3)::int) * 700),
  0
from _seed_owner o
join public.products p on p.owner_id = o.owner_id and p.name = 'QuickReceipt'
cross join lateral generate_series(current_date - interval '13 days', current_date, interval '1 day') as gs(day)
union all
select o.owner_id, p.id, gs.day,
  (60 + (random() * 30)::int),
  (25 + (random() * 10)::int),
  (20 + (random() * 8)::int),
  (55 + (random() * 20)::int),
  (8 + (random() * 4)::int),
  (5 + (random() * 3)::int),
  ((5 + (random() * 3)::int) * 1900),
  0
from _seed_owner o
join public.products p on p.owner_id = o.owner_id and p.name = 'Invoice Nudge'
cross join lateral generate_series(current_date - interval '13 days', current_date, interval '1 day') as gs(day);

-- ReplyRadar: the exact numbers from the spec's own KILL example (§18)
insert into public.metrics (owner_id, product_id, date, visitors, users, activated_users, returning_users, checkout_starts, purchases, revenue_cents, refunds_cents)
select o.owner_id, p.id, current_date - interval '70 days', 184, 3, 0, 0, 0, 0, 0, 0
from _seed_owner o join public.products p on p.owner_id = o.owner_id and p.name = 'ReplyRadar';

-- Warranty Vault: some traffic, activation happened, but nobody returned or paid again
insert into public.metrics (owner_id, product_id, date, visitors, users, activated_users, returning_users, checkout_starts, purchases, revenue_cents, refunds_cents)
select o.owner_id, p.id, d.day, d.visitors, d.users, d.activated, d.ret, d.checkout, d.purchases, d.revenue, d.refunds
from _seed_owner o
join public.products p on p.owner_id = o.owner_id and p.name = 'Warranty Vault'
cross join lateral (values
  (current_date - interval '58 days', 65, 22, 9, 1, 4, 4, 1996, 0),
  (current_date - interval '50 days', 12, 3, 0, 1, 0, 0, 0, 0),
  (current_date - interval '40 days', 6, 1, 0, 0, 0, 0, 0, 0),
  (current_date - interval '30 days', 3, 0, 0, 0, 0, 0, 0, 0)
) as d(day, visitors, users, activated, ret, checkout, purchases, revenue, refunds);

-- ---------------------------------------------------------------------------
-- Expenses + time entries
-- ---------------------------------------------------------------------------

insert into public.expenses (owner_id, product_id, date, category, amount_cents, description)
select o.owner_id, p.id, e.d, e.cat, e.amt, e.note
from _seed_owner o
join public.products p on p.owner_id = o.owner_id
cross join lateral (values
  ('Simple Habit Counter', current_date - interval '85 days', 'hosting', 500, 'Static hosting'),
  ('QuickReceipt', current_date - interval '70 days', 'apis', 1200, 'OCR API usage'),
  ('QuickReceipt', current_date - interval '40 days', 'ai_usage', 800, 'Claude API for categorization'),
  ('Invoice Nudge', current_date - interval '140 days', 'saas', 2900, 'Stripe + email provider'),
  ('Invoice Nudge', current_date - interval '60 days', 'advertising', 15000, 'Small Google Ads test'),
  ('ReplyRadar', current_date - interval '75 days', 'hosting', 1000, 'Server + scraping infra'),
  ('Warranty Vault', current_date - interval '55 days', 'hosting', 600, 'Backend hosting')
) as e(name, d, cat, amt, note)
where p.name = e.name;

insert into public.time_entries (owner_id, product_id, date, category, hours, description)
select o.owner_id, p.id, t.d, t.cat, t.hrs, t.note
from _seed_owner o
join public.products p on p.owner_id = o.owner_id
cross join lateral (values
  ('Simple Habit Counter', current_date - interval '108 days', 'design', 3.0, 'Icon + basic UI'),
  ('Simple Habit Counter', current_date - interval '100 days', 'coding', 15.0, 'Core counter + streak logic'),
  ('Simple Habit Counter', current_date - interval '92 days', 'marketing', 4.0, 'Launch post + App Store listing'),
  ('QuickReceipt', current_date - interval '105 days', 'research', 5.0, 'OCR provider comparison'),
  ('QuickReceipt', current_date - interval '95 days', 'coding', 30.0, 'Capture + OCR + sheet sync'),
  ('QuickReceipt', current_date - interval '78 days', 'marketing', 4.0, 'Landing page test'),
  ('Invoice Nudge', current_date - interval '175 days', 'research', 6.0, 'Talked to 5 consultants about invoicing pain'),
  ('Invoice Nudge', current_date - interval '165 days', 'coding', 38.0, 'Stripe integration + nudge scheduler'),
  ('Invoice Nudge', current_date - interval '150 days', 'marketing', 6.0, 'Launch + first outreach round'),
  ('Invoice Nudge', current_date - interval '90 days', 'support', 3.0, 'Onboarding calls with early customers'),
  ('ReplyRadar', current_date - interval '98 days', 'coding', 22.0, 'Scraper + digest email'),
  ('ReplyRadar', current_date - interval '80 days', 'marketing', 3.0, 'Distribution attempts'),
  ('Warranty Vault', current_date - interval '72 days', 'coding', 26.0, 'Photo capture + expiry detection'),
  ('Warranty Vault', current_date - interval '60 days', 'marketing', 3.0, 'Reddit post'),
  ('StandupBot Lite', current_date - interval '9 days', 'coding', 10.0, 'Slack Bolt scaffold + scheduler'),
  ('StandupBot Lite', current_date - interval '3 days', 'coding', 4.0, 'Digest formatting'),
  ('ShelfLife Label Maker', current_date - interval '5 days', 'coding', 6.0, 'Use-by calculation logic'),
  ('ShelfLife Label Maker', current_date - interval '2 days', 'design', 2.0, 'Label layout')
) as t(name, d, cat, hrs, note)
where p.name = t.name;

-- ---------------------------------------------------------------------------
-- Launch checklist (deliberately incomplete on the in-progress MVPs)
-- ---------------------------------------------------------------------------

insert into public.launch_checklist_items (owner_id, product_id, label, is_default, completed, sort_order)
select o.owner_id, p.id, c.label, true, c.completed, c.sort_order
from _seed_owner o
join public.products p on p.owner_id = o.owner_id
cross join lateral (values
  ('MVP works', 0, true), ('Mobile responsive', 1, true), ('Error handling', 2, true),
  ('Analytics installed', 3, true), ('Payment system configured', 4, true),
  ('Landing page', 5, true), ('Pricing', 6, true), ('Privacy policy', 7, true),
  ('Terms', 8, true), ('SEO metadata', 9, true), ('OG image', 10, true),
  ('Favicon', 11, true), ('Domain', 12, true), ('Production deployment', 13, true),
  ('Test payment', 14, true), ('Test onboarding', 15, true),
  ('First distribution channel', 16, true), ('First marketing experiment', 17, true)
) as c(label, sort_order, completed)
where p.name in ('Simple Habit Counter', 'QuickReceipt', 'Invoice Nudge', 'ReplyRadar', 'Warranty Vault')
union all
select o.owner_id, p.id, c.label, true, c.completed, c.sort_order
from _seed_owner o
join public.products p on p.owner_id = o.owner_id
cross join lateral (values
  ('MVP works', 0, true), ('Mobile responsive', 1, true), ('Error handling', 2, false),
  ('Analytics installed', 3, false), ('Payment system configured', 4, false),
  ('Landing page', 5, false), ('Pricing', 6, true), ('Privacy policy', 7, false),
  ('Terms', 8, false), ('SEO metadata', 9, false), ('OG image', 10, false),
  ('Favicon', 11, true), ('Domain', 12, false), ('Production deployment', 13, false),
  ('Test payment', 14, false), ('Test onboarding', 15, false),
  ('First distribution channel', 16, false), ('First marketing experiment', 17, false)
) as c(label, sort_order, completed)
where p.name in ('StandupBot Lite', 'ShelfLife Label Maker');

-- ---------------------------------------------------------------------------
-- Decisions requiring review
-- ---------------------------------------------------------------------------

insert into public.decisions (owner_id, idea_id, product_id, decision_type, recommendation, reason, evidence, status)
select o.owner_id, null::uuid, p.id, 'kill',
  'KILL',
  'Current evidence does not justify additional development.',
  jsonb_build_object(
    'qualified_visitors', 184, 'signups', 3, 'activated_users', 0,
    'revenue_cents', 0, 'hours_invested', 25, 'trend', 'none'
  ),
  'PENDING'
from _seed_owner o join public.products p on p.owner_id = o.owner_id and p.name = 'ReplyRadar'
union all
select o.owner_id, null::uuid, p.id, 'kill',
  'KILL',
  'Activation happened once at launch but usage never returned; no repeat engagement or revenue since.',
  jsonb_build_object(
    'total_visitors', 86, 'activated_users', 9, 'returning_users', 2,
    'revenue_cents', 1996, 'hours_invested', 29, 'trend', 'declining'
  ),
  'PENDING'
from _seed_owner o join public.products p on p.owner_id = o.owner_id and p.name = 'Warranty Vault'
union all
select o.owner_id, i.id, null::uuid, 'approve_validation',
  'CONTINUE VALIDATING',
  'Opportunity Score is Interesting (15/30) but Evidence Confidence is still 0 — assumption only, no market contact yet.',
  jsonb_build_object('opportunity_score', 15, 'evidence_confidence', 0),
  'PENDING'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'LocalGigBoard'
union all
select o.owner_id, i.id, null::uuid, 'continue_validating',
  'CONTINUE VALIDATING',
  'Pre-order test proved willingness to pay ($2,996 collected) but missed the traffic target — reach was the bottleneck, not price or interest.',
  jsonb_build_object('purchases', 3, 'revenue_cents', 2996, 'revenue_target_cents', 20000, 'traffic_target', 600, 'visitors', 575),
  'PENDING'
from _seed_owner o join public.ideas i on i.owner_id = o.owner_id and i.name = 'FreelanceRateCheck'
union all
select o.owner_id, null::uuid, p.id, 'scale',
  'SCALE',
  'Consistent revenue growth, high retention proxy, and acceptable acquisition cost after the paid test — strong candidate for more distribution investment.',
  jsonb_build_object('mrr_cents', 22800, 'customers', 12, 'trend', 'growing'),
  'PENDING'
from _seed_owner o join public.products p on p.owner_id = o.owner_id and p.name = 'Invoice Nudge';

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

insert into public.notifications (owner_id, type, title, body, related_product_id, is_read)
select o.owner_id, 'kill_review', 'ReplyRadar qualifies for a kill review',
  '184 visitors, 3 signups, 0 activated users, $0 revenue after 6 weeks — no positive trend.',
  p.id, false
from _seed_owner o join public.products p on p.owner_id = o.owner_id and p.name = 'ReplyRadar'
union all
select o.owner_id, 'scale_review', 'Invoice Nudge qualifies for a scale review',
  'Consistent MRR growth and strong retention for 4+ weeks running.',
  p.id, false
from _seed_owner o join public.products p on p.owner_id = o.owner_id and p.name = 'Invoice Nudge'
union all
select o.owner_id, 'mvp_deadline', 'StandupBot Lite target launch is in 4 days',
  'Launch checklist is still mostly incomplete — review scope before the date slips.',
  p.id, false
from _seed_owner o join public.products p on p.owner_id = o.owner_id and p.name = 'StandupBot Lite';

-- ---------------------------------------------------------------------------
-- One completed weekly review
-- ---------------------------------------------------------------------------

insert into public.weekly_reviews (
  owner_id, week_start, week_end, ideas_generated, ideas_researched, ideas_validated,
  mvps_built, products_launched, products_killed, revenue_cents, new_customers,
  what_worked, what_failed, what_we_learned, next_week_changes
)
select owner_id, date_trunc('week', current_date - interval '7 days')::date,
  (date_trunc('week', current_date - interval '7 days') + interval '6 days')::date,
  3, 2, 1, 1, 0, 1, 8400, 4,
  'The FreelanceRateCheck pre-order test proved people will pay before the product exists.',
  'ReplyRadar distribution never found a real channel — Reddit/PH visits didn''t convert to signups.',
  'Reach is now the constraint more often than price sensitivity — validate distribution earlier, not just willingness to pay.',
  'Run one paid-traffic test before killing any idea purely for lack of organic reach.'
from _seed_owner;
