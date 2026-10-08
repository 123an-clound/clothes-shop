-- App-level rate limiting for auth actions. Supabase Auth's own per-IP limits see our server's IP
-- (server actions call Supabase), so they cannot tell attackers from real users.
-- Keys are "<action>:<hex hmac(ip)>"; the HMAC secret lives only on the server, so callers cannot
-- forge another visitor's key.

create table public.cs_rate_events (
  key text not null,
  created_at timestamptz not null default now()
);
comment on table public.cs_rate_events is 'clothes-shop: rate-limit hits (written only by cs_rate_hit)';
create index cs_rate_events_key_created_idx on public.cs_rate_events (key, created_at);
create index cs_rate_events_created_idx on public.cs_rate_events (created_at);
alter table public.cs_rate_events enable row level security;
revoke all on public.cs_rate_events from anon, authenticated;

-- Returns true when the hit is allowed (and records it), false when the limit is reached.
create or replace function public.cs_rate_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if p_key !~ '^[a-z_]{1,20}:[0-9a-f]{64}$' or p_limit not between 1 and 100 or p_window_seconds not between 1 and 86400 then
    raise exception 'INVALID_INPUT';
  end if;

  -- Housekeeping keeps the table small (nothing is useful after a day).
  delete from public.cs_rate_events where created_at < now() - interval '1 day';

  select count(*) into n from public.cs_rate_events
  where key = p_key and created_at > now() - make_interval(secs => p_window_seconds);
  if n >= p_limit then
    return false;
  end if;

  insert into public.cs_rate_events (key) values (p_key);
  return true;
end;
$$;
revoke execute on function public.cs_rate_hit(text, integer, integer) from public;
grant execute on function public.cs_rate_hit(text, integer, integer) to anon, authenticated;
