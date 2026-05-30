create table if not exists public.quiz_sets (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  set_order integer not null default 0,
  question_count integer not null default 20 check (question_count > 0),
  unlock_required_correct integer not null default 14 check (unlock_required_correct >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, set_order)
);

alter table public.quiz_questions
  add column if not exists quiz_set_id uuid references public.quiz_sets(id) on delete set null;

alter table public.quiz_attempts
  add column if not exists quiz_set_id uuid references public.quiz_sets(id) on delete set null;

create index if not exists quiz_sets_topic_status_order_idx
  on public.quiz_sets (topic_id, status, set_order);

create index if not exists quiz_questions_set_status_order_idx
  on public.quiz_questions (quiz_set_id, status, sort_order);

create index if not exists quiz_attempts_user_set_idx
  on public.quiz_attempts (user_id, quiz_set_id, created_at desc)
  where quiz_set_id is not null;

drop trigger if exists quiz_sets_touch_updated_at on public.quiz_sets;
create trigger quiz_sets_touch_updated_at
  before update on public.quiz_sets
  for each row execute function public.touch_updated_at();

alter table public.quiz_sets enable row level security;

create policy "published quiz sets are public"
  on public.quiz_sets for select
  to anon, authenticated
  using (status = 'published' or private.is_admin(auth.uid()));

create policy "admins manage quiz sets"
  on public.quiz_sets for all
  to authenticated
  using (private.is_admin(auth.uid()))
  with check (private.is_admin(auth.uid()));
