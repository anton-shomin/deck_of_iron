-- Workout history for the DECK OF IRON Android app (android/app/.../data/history).
-- The app signs users in anonymously, so enable it first:
--   Dashboard -> Authentication -> Sign In / Providers -> "Allow anonymous sign-ins".
-- Anonymous users get the `authenticated` role, and every policy below scopes rows to auth.uid().

create table if not exists public.workout_history (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  finished_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  mode text not null check (mode in ('BODY', 'KETTLEBELL', 'CUSTOM')),
  beast boolean not null default false,
  total_cards integer not null check (total_cards between 0 and 54),
  completed_cards integer not null check (completed_cards >= 0 and completed_cards <= total_cards),
  total_reps integer not null check (total_reps >= 0),
  -- {"S": 95, "H": 95, "D": 95, "C": 95}
  suit_reps jsonb not null default '{}'::jsonb
    check (jsonb_typeof(suit_reps) = 'object' and pg_column_size(suit_reps) < 256),
  total_tonnage_kg integer not null default 0 check (total_tonnage_kg >= 0),
  jokers_completed integer not null default 0 check (jokers_completed between 0 and 2),
  created_at timestamptz not null default now()
);

create index if not exists workout_history_user_finished_idx
  on public.workout_history (user_id, finished_at desc);

alter table public.workout_history enable row level security;

create policy "Users read their own workouts"
  on public.workout_history for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert their own workouts"
  on public.workout_history for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own workouts"
  on public.workout_history for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own workouts"
  on public.workout_history for delete
  to authenticated
  using ((select auth.uid()) = user_id);
