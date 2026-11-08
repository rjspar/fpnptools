-- FP&P Tools: LinkedIn-versterker
-- Plak dit in Supabase → SQL Editor → New query → Run (na setup.sql). Veilig opnieuw te draaien.

-- Laag van de ingelogde gebruiker, voor gebruik in regels.
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.members where email = lower(auth.jwt() ->> 'email');
$$;
grant execute on function public.my_role() to authenticated;

-- Wie reageert op welke post, met de klaargezette tekst.
create table if not exists public.linkedin_signups (
  post_key    text not null,           -- datum van de post, bv. 2026-11-10 (of 2026-11-10-2 bij twee posts op één dag)
  email       text not null,
  name        text not null,
  comment     text not null default '',
  notified_at timestamptz,             -- wanneer de mail met tekst + link is verstuurd
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (post_key, email)
);

alter table public.linkedin_signups enable row level security;

-- Grasmaaiers en partners zien wie waar ingetekend staat.
drop policy if exists "grasmaaiers lezen" on public.linkedin_signups;
create policy "grasmaaiers lezen" on public.linkedin_signups
  for select to authenticated
  using (public.my_role() in ('grasmaaier', 'partner'));

-- Iedereen beheert alleen zijn eigen intekening.
drop policy if exists "eigen intekening" on public.linkedin_signups;
create policy "eigen intekening" on public.linkedin_signups
  for all to authenticated
  using (email = lower(auth.jwt() ->> 'email'))
  with check (
    email = lower(auth.jwt() ->> 'email')
    and public.my_role() in ('grasmaaier', 'partner')
  );

grant select, insert, update, delete on public.linkedin_signups to authenticated;
revoke all on public.linkedin_signups from anon;
