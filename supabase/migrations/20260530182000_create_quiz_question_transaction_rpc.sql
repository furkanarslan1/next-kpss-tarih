create or replace function public.create_quiz_question_with_options(
  p_topic_id uuid,
  p_quiz_set_id uuid,
  p_prompt text,
  p_explanation text,
  p_status public.content_status,
  p_options jsonb,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question_id uuid;
  v_next_sort_order integer;
  v_correct_count integer;
  v_option jsonb;
  v_option_index integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin yetkisi gerekiyor.';
  end if;

  if not exists (
    select 1
    from public.quiz_sets qs
    where qs.id = p_quiz_set_id
      and qs.topic_id = p_topic_id
  ) then
    raise exception 'Secilen test bu konuya ait degil.';
  end if;

  select count(*)
  into v_correct_count
  from jsonb_array_elements(p_options) option_row
  where coalesce((option_row ->> 'is_correct')::boolean, false) = true;

  if v_correct_count <> 1 then
    raise exception 'Bir soruda tam olarak bir dogru secenek olmali.';
  end if;

  select coalesce(max(sort_order), -1) + 1
  into v_next_sort_order
  from public.quiz_questions
  where quiz_set_id = p_quiz_set_id;

  insert into public.quiz_questions (
    topic_id,
    quiz_set_id,
    prompt,
    explanation,
    difficulty,
    sort_order,
    status,
    created_by,
    updated_by
  )
  values (
    p_topic_id,
    p_quiz_set_id,
    p_prompt,
    nullif(p_explanation, ''),
    'medium',
    v_next_sort_order,
    p_status,
    p_user_id,
    p_user_id
  )
  returning id into v_question_id;

  for v_option in
    select value
    from jsonb_array_elements(p_options)
  loop
    insert into public.quiz_options (
      question_id,
      option_text,
      is_correct,
      sort_order
    )
    values (
      v_question_id,
      v_option ->> 'option_text',
      coalesce((v_option ->> 'is_correct')::boolean, false),
      v_option_index
    );

    v_option_index := v_option_index + 1;
  end loop;

  return v_question_id;
end;
$$;
