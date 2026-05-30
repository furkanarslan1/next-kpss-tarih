create or replace function private.fill_blank_answer_mask(value text)
returns text
language sql
immutable
set search_path = private, public
as $$
  select string_agg(
    case
      when substr(coalesce(value, ''), index, 1) in (' ', '-', '.', '''', '’')
        then substr(coalesce(value, ''), index, 1)
      else '_'
    end,
    ''
    order by index
  )
  from generate_series(1, char_length(coalesce(value, ''))) index;
$$;

drop function if exists public.get_fill_blank_deck(text);

create or replace function public.get_fill_blank_deck(p_slug text)
returns table (
  id uuid,
  topic_id uuid,
  topic_slug text,
  topic_title text,
  period_title text,
  prompt text,
  hint text,
  answer_mask text,
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
    private.fill_blank_answer_mask(pq.correct_answer) as answer_mask,
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

create or replace function public.guess_fill_blank_letter(
  p_question_id uuid,
  p_letter text
)
returns table (
  matches jsonb,
  is_match boolean
)
language sql
stable
security definer
set search_path = public, private
as $$
  with question as (
    select pq.correct_answer
    from public.practice_questions pq
    where pq.id = p_question_id
      and pq.status = 'published'
      and pq.question_type = 'fill_blank'
  ),
  normalized as (
    select lower(left(trim(coalesce(p_letter, '')), 1)) as letter
  ),
  found as (
    select
      index - 1 as position,
      substr(q.correct_answer, index, 1) as character
    from question q
    cross join normalized n
    cross join generate_series(1, char_length(q.correct_answer)) index
    where lower(substr(q.correct_answer, index, 1)) = n.letter
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object('position', position, 'character', character)
        order by position
      ),
      '[]'::jsonb
    ) as matches,
    exists(select 1 from found) as is_match
  from found;
$$;

create or replace function public.reveal_fill_blank_answer(p_question_id uuid)
returns table (
  correct_answer text,
  explanation text
)
language sql
stable
security definer
set search_path = public, private
as $$
  select
    pq.correct_answer,
    pq.explanation
  from public.practice_questions pq
  where pq.id = p_question_id
    and pq.status = 'published'
    and pq.question_type = 'fill_blank';
$$;

grant execute on function public.guess_fill_blank_letter(uuid, text)
  to authenticated;
grant execute on function public.reveal_fill_blank_answer(uuid)
  to authenticated;
