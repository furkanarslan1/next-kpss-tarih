create table if not exists public.practice_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  question_type text not null default 'fill_blank'
    check (question_type in ('fill_blank', 'true_false')),
  prompt text not null,
  correct_answer text not null,
  accepted_answers text[] not null default '{}',
  hint text,
  explanation text,
  time_limit_seconds integer not null default 45
    check (time_limit_seconds between 10 and 300),
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists practice_questions_topic_type_status_order_idx
  on public.practice_questions (topic_id, question_type, status, sort_order);

create trigger practice_questions_touch_updated_at
  before update on public.practice_questions
  for each row execute function public.touch_updated_at();

alter table public.practice_questions enable row level security;

create policy "published practice questions are public"
  on public.practice_questions for select
  to anon, authenticated
  using (status = 'published' or private.is_admin(auth.uid()));

create policy "admins manage practice questions"
  on public.practice_questions for all
  to authenticated
  using (private.is_admin(auth.uid()))
  with check (private.is_admin(auth.uid()));
