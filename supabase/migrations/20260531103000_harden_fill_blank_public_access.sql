drop policy if exists "published practice questions are public"
  on public.practice_questions;

create or replace function private.normalize_practice_answer(value text)
returns text
language sql
immutable
set search_path = private, public
as $$
  select lower(regexp_replace(trim(coalesce(value, '')), '\s+', ' ', 'g'));
$$;

create or replace function public.list_fill_blank_topics()
returns table (
  topic_id uuid,
  slug text,
  title text,
  summary text,
  period_title text,
  question_count bigint
)
language sql
stable
security definer
set search_path = public, private
as $$
  select
    t.id as topic_id,
    t.slug,
    t.title,
    t.summary,
    coalesce(hp.title, 'KPSS Tarih') as period_title,
    count(pq.id) as question_count
  from public.topics t
  left join public.historical_periods hp on hp.id = t.period_id
  join public.practice_questions pq on pq.topic_id = t.id
  where t.status = 'published'
    and pq.status = 'published'
    and pq.question_type = 'fill_blank'
  group by t.id, t.slug, t.title, t.summary, hp.title, t.display_order
  order by t.display_order asc, t.title asc;
$$;

create or replace function public.get_fill_blank_deck(p_slug text)
returns table (
  id uuid,
  topic_id uuid,
  topic_slug text,
  topic_title text,
  period_title text,
  prompt text,
  hint text,
  time_limit_seconds integer,
  sort_order integer
)
language sql
stable
security definer
set search_path = public, private
as $$
  select
    pq.id,
    t.id as topic_id,
    t.slug as topic_slug,
    t.title as topic_title,
    coalesce(hp.title, 'KPSS Tarih') as period_title,
    pq.prompt,
    pq.hint,
    pq.time_limit_seconds,
    pq.sort_order
  from public.practice_questions pq
  join public.topics t on t.id = pq.topic_id
  left join public.historical_periods hp on hp.id = t.period_id
  where t.slug = p_slug
    and t.status = 'published'
    and pq.status = 'published'
    and pq.question_type = 'fill_blank'
  order by pq.sort_order asc;
$$;

create or replace function public.check_fill_blank_answer(
  p_question_id uuid,
  p_answer text
)
returns table (
  is_correct boolean,
  correct_answer text,
  explanation text
)
language sql
stable
security definer
set search_path = public, private
as $$
  select
    private.normalize_practice_answer(p_answer) = any(
      array(
        select private.normalize_practice_answer(answer)
        from unnest(
          case
            when array_length(pq.accepted_answers, 1) is null
              then array[pq.correct_answer]
            else pq.accepted_answers
          end
        ) answer
      )
    ) as is_correct,
    pq.correct_answer,
    pq.explanation
  from public.practice_questions pq
  where pq.id = p_question_id
    and pq.status = 'published'
    and pq.question_type = 'fill_blank';
$$;

grant execute on function public.list_fill_blank_topics() to anon, authenticated;
grant execute on function public.get_fill_blank_deck(text) to anon, authenticated;
grant execute on function public.check_fill_blank_answer(uuid, text) to authenticated;
