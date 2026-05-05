revoke execute on function public.has_active_subscription(uuid, text) from public, anon, authenticated;

create or replace function public.current_user_is_pro(check_env text default 'live')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = auth.uid()
      and environment = check_env
      and (
        (status in ('active','trialing') and (current_period_end is null or current_period_end > now()))
        or (status = 'canceled' and current_period_end > now())
      )
  );
$$;

revoke execute on function public.current_user_is_pro(text) from public, anon;
grant execute on function public.current_user_is_pro(text) to authenticated;