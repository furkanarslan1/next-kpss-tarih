create schema if not exists private;

grant usage on schema private to anon, authenticated;

alter function public.touch_updated_at()
  set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter function public.has_role(uuid, public.app_role) set schema private;
alter function public.is_admin(uuid) set schema private;

grant execute on function private.has_role(uuid, public.app_role) to anon, authenticated;
grant execute on function private.is_admin(uuid) to anon, authenticated;

create or replace function private.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select private.has_role(check_user_id, 'admin');
$$;
