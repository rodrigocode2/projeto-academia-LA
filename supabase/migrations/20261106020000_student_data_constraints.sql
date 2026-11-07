do $$
begin
  if exists (
    select 1
    from public.la_student_payments
    group by aluno_id, competencia
    having count(*) > 1
  ) then
    raise exception
      'Duplicate student payments exist for aluno_id and competencia. Resolve them before applying this migration.';
  end if;

  if exists (
    select 1
    from public.la_student_charges
    group by aluno_id, competencia
    having count(*) > 1
  ) then
    raise exception
      'Duplicate student charges exist for aluno_id and competencia. Resolve them before applying this migration.';
  end if;
end;
$$;

create unique index if not exists la_student_payments_aluno_competencia_uidx
  on public.la_student_payments (aluno_id, competencia);

create unique index if not exists la_student_charges_aluno_competencia_uidx
  on public.la_student_charges (aluno_id, competencia);

alter table public.la_alunos
  drop constraint if exists la_alunos_auth_user_id_fkey;

alter table public.la_alunos
  add constraint la_alunos_auth_user_id_fkey
  foreign key (auth_user_id)
  references auth.users (id)
  on delete set null;
