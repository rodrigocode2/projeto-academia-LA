create table if not exists public.la_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.la_alunos
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

alter table public.la_alunos
  alter column senha drop not null;

do $$
begin
  if exists (
    select 1
    from public.la_alunos
    where cpf is not null and regexp_replace(cpf, '\D', '', 'g') <> ''
    group by regexp_replace(cpf, '\D', '', 'g')
    having count(*) > 1
  ) then
    raise exception 'Duplicate CPF values exist in la_alunos. Resolve them before applying this migration.';
  end if;

  if exists (
    select 1 from public.la_alunos
    where email is not null and email <> ''
    group by lower(email)
    having count(*) > 1
  ) then
    raise exception 'Duplicate e-mail values exist in la_alunos. Resolve them before applying this migration.';
  end if;

  if exists (
    select 1 from public.la_alunos
    where matricula is not null and matricula <> ''
    group by matricula
    having count(*) > 1
  ) then
    raise exception 'Duplicate enrollment values exist in la_alunos. Resolve them before applying this migration.';
  end if;
end;
$$;

update public.la_alunos
set cpf = regexp_replace(cpf, '\D', '', 'g')
where cpf is not null;

update public.la_alunos
set senha = null
where senha is not null;

create unique index if not exists la_alunos_auth_user_id_uidx
  on public.la_alunos (auth_user_id)
  where auth_user_id is not null;

create unique index if not exists la_alunos_cpf_uidx
  on public.la_alunos (cpf)
  where cpf is not null and cpf <> '';

create unique index if not exists la_alunos_email_lower_uidx
  on public.la_alunos (lower(email))
  where email is not null and email <> '';

create unique index if not exists la_alunos_matricula_uidx
  on public.la_alunos (matricula)
  where matricula is not null and matricula <> '';

create table if not exists public.la_matriculas_ano (
  ano integer primary key,
  ultimo integer not null check (ultimo > 0)
);

insert into public.la_matriculas_ano (ano, ultimo)
select
  substring(matricula from '^LA-([0-9]{4})-')::integer,
  max(substring(matricula from '^LA-[0-9]{4}-([0-9]+)$')::integer)
from public.la_alunos
where matricula ~ '^LA-[0-9]{4}-[0-9]+$'
group by substring(matricula from '^LA-([0-9]{4})-')::integer
on conflict (ano) do update
set ultimo = greatest(public.la_matriculas_ano.ultimo, excluded.ultimo);

create or replace function public.la_proxima_matricula()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ano_atual integer := extract(year from now())::integer;
  proximo integer;
begin
  insert into public.la_matriculas_ano (ano, ultimo)
  values (ano_atual, 1)
  on conflict (ano) do update
    set ultimo = public.la_matriculas_ano.ultimo + 1
  returning ultimo into proximo;

  return 'LA-' || ano_atual || '-' ||
    lpad(proximo::text, greatest(4, length(proximo::text)), '0');
end;
$$;

revoke all on function public.la_proxima_matricula() from public, anon, authenticated;
grant execute on function public.la_proxima_matricula() to service_role;

alter table public.la_admins enable row level security;
alter table public.la_alunos enable row level security;
alter table public.la_matriculas_ano enable row level security;

do $$
declare
  politica record;
begin
  for politica in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('la_admins', 'la_alunos', 'la_matriculas_ano')
  loop
    execute format('drop policy if exists %I on %I.%I',
      politica.policyname, politica.schemaname, politica.tablename);
  end loop;
end;
$$;

revoke all on public.la_admins, public.la_alunos, public.la_matriculas_ano from anon;
grant select on public.la_admins to authenticated;
grant select, insert, update, delete on public.la_alunos to authenticated;
revoke all on public.la_matriculas_ano from anon, authenticated;

create policy la_admins_read_own
  on public.la_admins
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy la_alunos_admin_all
  on public.la_alunos
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.la_admins
      where la_admins.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.la_admins
      where la_admins.user_id = (select auth.uid())
    )
  );

create policy la_alunos_student_read_own
  on public.la_alunos
  for select
  to authenticated
  using (auth_user_id = (select auth.uid()));
