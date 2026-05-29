create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('admin', 'editor', 'member');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.entity_type as enum ('state', 'empire', 'tribe', 'person', 'place', 'army', 'treaty', 'other');
create type public.map_layer_kind as enum ('points', 'regions', 'routes', 'battlefronts');
create type public.timeline_event_type as enum ('battle', 'migration', 'treaty', 'capital', 'political', 'cultural', 'religious', 'economic', 'other');
create type public.question_difficulty as enum ('easy', 'medium', 'hard');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-z0-9_]{3,32}$')
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'member')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.has_role(check_user_id uuid, check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id
      and role = check_role
  );
$$;

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(check_user_id, 'admin');
$$;

create table public.historical_periods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  starts_at_year integer,
  ends_at_year integer,
  display_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.historical_periods(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  map_center jsonb not null default '{"lat": 39.0, "lng": 35.0, "zoom": 5}'::jsonb,
  display_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_id, slug)
);

create table public.historical_entities (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  entity_type public.entity_type not null,
  slug text not null,
  name text not null,
  summary text,
  body text,
  starts_at_year integer,
  ends_at_year integer,
  color text,
  metadata jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, slug)
);

create table public.map_layers (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  layer_kind public.map_layer_kind not null,
  geojson jsonb not null,
  valid_from_year integer,
  valid_to_year integer,
  style jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  entity_id uuid references public.historical_entities(id) on delete set null,
  event_type public.timeline_event_type not null default 'other',
  title text not null,
  summary text,
  body text,
  occurred_on date,
  starts_at_year integer,
  ends_at_year integer,
  importance smallint not null default 3 check (importance between 1 and 5),
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_locations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.timeline_events(id) on delete cascade,
  title text not null,
  place_name text,
  lat numeric(9,6),
  lng numeric(9,6),
  geojson jsonb,
  modal_title text,
  modal_body text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint event_location_has_geometry check (
    (lat is not null and lng is not null) or geojson is not null
  )
);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  front text not null,
  back text not null,
  hint text,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  prompt text not null,
  explanation text,
  difficulty public.question_difficulty not null default 'medium',
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0
);

create unique index quiz_options_one_correct
  on public.quiz_options (question_id)
  where is_correct;

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  score integer not null default 0,
  total_questions integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.quiz_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_option_id uuid references public.quiz_options(id) on delete set null,
  is_correct boolean not null default false,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.user_flashcard_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  confidence smallint not null check (confidence between 1 and 5),
  reviewed_at timestamptz not null default now(),
  primary key (user_id, flashcard_id)
);

create index historical_periods_status_order_idx on public.historical_periods (status, display_order);
create index topics_period_status_order_idx on public.topics (period_id, status, display_order);
create index map_layers_topic_status_idx on public.map_layers (topic_id, status);
create index timeline_events_topic_status_year_idx on public.timeline_events (topic_id, status, starts_at_year, ends_at_year);
create index event_locations_event_sort_idx on public.event_locations (event_id, sort_order);
create index flashcards_topic_status_order_idx on public.flashcards (topic_id, status, sort_order);
create index quiz_questions_topic_status_order_idx on public.quiz_questions (topic_id, status, sort_order);
create index quiz_attempts_user_topic_idx on public.quiz_attempts (user_id, topic_id, created_at desc);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger historical_periods_touch_updated_at
  before update on public.historical_periods
  for each row execute function public.touch_updated_at();

create trigger topics_touch_updated_at
  before update on public.topics
  for each row execute function public.touch_updated_at();

create trigger historical_entities_touch_updated_at
  before update on public.historical_entities
  for each row execute function public.touch_updated_at();

create trigger map_layers_touch_updated_at
  before update on public.map_layers
  for each row execute function public.touch_updated_at();

create trigger timeline_events_touch_updated_at
  before update on public.timeline_events
  for each row execute function public.touch_updated_at();

create trigger flashcards_touch_updated_at
  before update on public.flashcards
  for each row execute function public.touch_updated_at();

create trigger quiz_questions_touch_updated_at
  before update on public.quiz_questions
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.historical_periods enable row level security;
alter table public.topics enable row level security;
alter table public.historical_entities enable row level security;
alter table public.map_layers enable row level security;
alter table public.timeline_events enable row level security;
alter table public.event_locations enable row level security;
alter table public.flashcards enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;
alter table public.user_flashcard_reviews enable row level security;

create policy "profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admins manage profiles"
  on public.profiles for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "users view own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "admins manage roles"
  on public.user_roles for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "published periods are public"
  on public.historical_periods for select
  to anon, authenticated
  using (status = 'published' or public.is_admin(auth.uid()));

create policy "published topics are public"
  on public.topics for select
  to anon, authenticated
  using (status = 'published' or public.is_admin(auth.uid()));

create policy "published entities are public"
  on public.historical_entities for select
  to anon, authenticated
  using (status = 'published' or public.is_admin(auth.uid()));

create policy "published map layers are public"
  on public.map_layers for select
  to anon, authenticated
  using (status = 'published' or public.is_admin(auth.uid()));

create policy "published events are public"
  on public.timeline_events for select
  to anon, authenticated
  using (status = 'published' or public.is_admin(auth.uid()));

create policy "locations follow event visibility"
  on public.event_locations for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.timeline_events e
      where e.id = event_id
        and (e.status = 'published' or public.is_admin(auth.uid()))
    )
  );

create policy "published flashcards are public"
  on public.flashcards for select
  to anon, authenticated
  using (status = 'published' or public.is_admin(auth.uid()));

create policy "published questions are public"
  on public.quiz_questions for select
  to anon, authenticated
  using (status = 'published' or public.is_admin(auth.uid()));

create policy "options follow question visibility"
  on public.quiz_options for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.quiz_questions q
      where q.id = question_id
        and (q.status = 'published' or public.is_admin(auth.uid()))
    )
  );

create policy "admins manage periods"
  on public.historical_periods for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins manage topics"
  on public.topics for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins manage entities"
  on public.historical_entities for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins manage map layers"
  on public.map_layers for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins manage events"
  on public.timeline_events for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins manage locations"
  on public.event_locations for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins manage flashcards"
  on public.flashcards for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins manage questions"
  on public.quiz_questions for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins manage options"
  on public.quiz_options for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "users manage own attempts"
  on public.quiz_attempts for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "attempt answers follow owned attempt"
  on public.quiz_attempt_answers for all
  to authenticated
  using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

create policy "users manage own flashcard reviews"
  on public.user_flashcard_reviews for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
