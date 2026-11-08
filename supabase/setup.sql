-- FP&P Tools: database-setup
-- Plak dit in Supabase → SQL Editor → New query → Run. Je kunt het veilig opnieuw draaien.

-- 1. Leden en hun laag ------------------------------------------------------
-- Rollen stapelen: een partner ziet alles van grasmaaiers, een grasmaaier alles van de fellowship.
create table if not exists public.members (
  email      text primary key check (email = lower(email)),
  name       text not null,
  role       text not null check (role in ('partner', 'grasmaaier', 'fellowship')),
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;

-- Iedereen leest alleen zijn eigen regel. Beheerders (Spar, Robin) lezen en beheren alles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where email = lower(auth.jwt() ->> 'email') and is_admin
  );
$$;

drop policy if exists "eigen regel lezen" on public.members;
create policy "eigen regel lezen" on public.members
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email') or public.is_admin());

drop policy if exists "beheerders beheren" on public.members;
create policy "beheerders beheren" on public.members
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- "Automatically expose new tables" staat uit, dus rechten geven we hier expliciet.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.members to authenticated;
revoke all on public.members from anon;

-- 2. Mag dit adres inloggen? ------------------------------------------------
-- Wordt vóór het inloggen aangeroepen. Geeft alleen ja/nee terug, geen gegevens.
create or replace function public.is_member(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.members where email = lower(trim(p_email)));
$$;

revoke all on function public.is_member(text) from public;
grant execute on function public.is_member(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- 3. Huidige leden ----------------------------------------------------------
insert into public.members (email, name, role, is_admin) values
  ('sparreboom@fpnp.nl', 'Spar',                        'partner',    true),
  ('robin@fpnp.nl',      'Robin Beker',                 'partner',    true),
  ('robertjan@fpnp.nl',  'Robert Jan Steinmetz',        'partner',    false),
  ('hugo@fpnp.nl',       'Hugo Crul',                   'partner',    false),
  ('frits@fpnp.nl',      'Frits Wilmsen',               'partner',    false),
  ('chantal@fpnp.nl',    'Chantal Runne',               'partner',    false),
  ('jorien@fpnp.nl',     'Jorien Weerdenburg',          'partner',    false),
  ('annelies@fpnp.nl',   'Annelies Bossenbroek',        'grasmaaier', false),
  ('david@fpnp.nl',      'David Charles van der Griend', 'grasmaaier', false),
  ('donja@fpnp.nl',      'Donja Zwambach',              'grasmaaier', false),
  ('eline@fpnp.nl',      'Eline Boon',                  'grasmaaier', false),
  ('frederike@fpnp.nl',  'Frederike Hof',               'grasmaaier', false),
  ('olivier@fpnp.nl',    'Olivier Noorduyn',            'grasmaaier', false),
  ('raymond@fpnp.nl',    'Raymond Vromans',             'grasmaaier', false),
  ('wilbert@fpnp.nl',    'Wilbert Hartman',             'grasmaaier', false)
on conflict (email) do update
  set name = excluded.name, role = excluded.role, is_admin = excluded.is_admin;
