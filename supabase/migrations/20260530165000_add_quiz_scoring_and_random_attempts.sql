alter table public.profiles
  add column if not exists total_points integer not null default 0 check (total_points >= 0);

alter table public.quiz_attempts
  alter column topic_id drop not null,
  add column if not exists mode text not null default 'topic' check (mode in ('topic', 'random')),
  add column if not exists elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  add column if not exists correct_count integer not null default 0 check (correct_count >= 0),
  add column if not exists wrong_count integer not null default 0 check (wrong_count >= 0),
  add column if not exists blank_count integer not null default 0 check (blank_count >= 0),
  add column if not exists point_delta integer not null default 0;

create index if not exists profiles_total_points_idx
  on public.profiles (total_points desc, updated_at desc);

create index if not exists quiz_attempts_completed_idx
  on public.quiz_attempts (completed_at desc)
  where completed_at is not null;
