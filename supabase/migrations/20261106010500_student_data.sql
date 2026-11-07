create table if not exists public.la_training_models (
  id text primary key,
  modalidade text not null,
  nome text not null,
  descricao text not null default '',
  treinos jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.la_student_training (
  aluno_id text primary key references public.la_alunos (id) on delete cascade,
  modelo_id text not null,
  modelo jsonb not null,
  liberado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.la_student_execution (
  aluno_id text not null references public.la_alunos (id) on delete cascade,
  data date not null,
  exercicio text not null,
  registro jsonb not null,
  atualizado_em timestamptz not null default now(),
  primary key (aluno_id, data, exercicio)
);

create table if not exists public.la_student_measurements (
  id text primary key,
  aluno_id text not null references public.la_alunos (id) on delete cascade,
  peso text not null default '',
  cintura text not null default '',
  medido_em timestamptz not null default now()
);

create table if not exists public.la_student_messages (
  id text primary key,
  aluno_id text not null references public.la_alunos (id) on delete cascade,
  remetente text not null check (remetente in ('aluno', 'academia')),
  texto text not null check (length(texto) between 1 and 800),
  lida_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.la_student_payments (
  id text primary key,
  aluno_id text not null references public.la_alunos (id) on delete cascade,
  competencia text not null check (competencia ~ '^[0-9]{4}-[0-9]{2}$'),
  valor numeric(10, 2) not null check (valor >= 0),
  status text not null default 'aguardando' check (status in ('aguardando', 'pago')),
  registrado_em timestamptz not null default now(),
  confirmado_em timestamptz,
  unique (aluno_id, competencia)
);

create table if not exists public.la_student_charges (
  id text primary key,
  aluno_id text not null references public.la_alunos (id) on delete cascade,
  aluno text not null default '',
  competencia text not null check (competencia ~ '^[0-9]{4}-[0-9]{2}$'),
  valor numeric(10, 2) not null check (valor >= 0),
  vencimento date not null,
  status text not null check (status in ('aberta', 'paga', 'atrasada', 'cancelada')),
  criada_em timestamptz not null default now(),
  pago_em timestamptz,
  forma text,
  atualizado_em timestamptz not null default now(),
  unique (aluno_id, competencia)
);

create index if not exists la_student_execution_date_idx
  on public.la_student_execution (aluno_id, data desc);
create index if not exists la_student_measurements_date_idx
  on public.la_student_measurements (aluno_id, medido_em desc);
create index if not exists la_student_messages_date_idx
  on public.la_student_messages (aluno_id, criado_em);
create index if not exists la_student_payments_date_idx
  on public.la_student_payments (aluno_id, competencia desc);
create index if not exists la_student_charges_date_idx
  on public.la_student_charges (aluno_id, competencia desc);

alter table public.la_training_models enable row level security;
alter table public.la_student_training enable row level security;
alter table public.la_student_execution enable row level security;
alter table public.la_student_measurements enable row level security;
alter table public.la_student_messages enable row level security;
alter table public.la_student_payments enable row level security;
alter table public.la_student_charges enable row level security;

revoke all on public.la_training_models, public.la_student_training,
  public.la_student_execution, public.la_student_measurements,
  public.la_student_messages, public.la_student_payments,
  public.la_student_charges from public, anon;

grant select, insert, update, delete on public.la_training_models,
  public.la_student_training, public.la_student_execution,
  public.la_student_measurements, public.la_student_messages,
  public.la_student_payments, public.la_student_charges to authenticated;

drop policy if exists la_training_models_admin_all on public.la_training_models;
drop policy if exists la_student_training_admin_all on public.la_student_training;
drop policy if exists la_student_training_read_own on public.la_student_training;
drop policy if exists la_student_execution_admin_all on public.la_student_execution;
drop policy if exists la_student_execution_own on public.la_student_execution;
drop policy if exists la_student_measurements_admin_all on public.la_student_measurements;
drop policy if exists la_student_measurements_read_own on public.la_student_measurements;
drop policy if exists la_student_measurements_insert_own on public.la_student_measurements;
drop policy if exists la_student_messages_admin_all on public.la_student_messages;
drop policy if exists la_student_messages_read_own on public.la_student_messages;
drop policy if exists la_student_messages_insert_own on public.la_student_messages;
drop policy if exists la_student_messages_mark_read on public.la_student_messages;
drop policy if exists la_student_payments_admin_all on public.la_student_payments;
drop policy if exists la_student_payments_read_own on public.la_student_payments;
drop policy if exists la_student_payments_insert_own on public.la_student_payments;
drop policy if exists la_student_charges_admin_all on public.la_student_charges;
drop policy if exists la_student_charges_read_own on public.la_student_charges;

create policy la_training_models_admin_all on public.la_training_models
  for all to authenticated
  using (exists (select 1 from public.la_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.la_admins where user_id = (select auth.uid())));

create policy la_student_training_admin_all on public.la_student_training
  for all to authenticated
  using (exists (select 1 from public.la_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.la_admins where user_id = (select auth.uid())));
create policy la_student_training_read_own on public.la_student_training
  for select to authenticated
  using (exists (
    select 1 from public.la_alunos
    where la_alunos.id = la_student_training.aluno_id
      and la_alunos.auth_user_id = (select auth.uid())
  ));

create policy la_student_execution_admin_all on public.la_student_execution
  for all to authenticated
  using (exists (select 1 from public.la_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.la_admins where user_id = (select auth.uid())));
create policy la_student_execution_own on public.la_student_execution
  for all to authenticated
  using (exists (
    select 1 from public.la_alunos
    where la_alunos.id = la_student_execution.aluno_id
      and la_alunos.auth_user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.la_alunos
    where la_alunos.id = la_student_execution.aluno_id
      and la_alunos.auth_user_id = (select auth.uid())
  ));

create policy la_student_measurements_admin_all on public.la_student_measurements
  for all to authenticated
  using (exists (select 1 from public.la_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.la_admins where user_id = (select auth.uid())));
create policy la_student_measurements_read_own on public.la_student_measurements
  for select to authenticated
  using (exists (
    select 1 from public.la_alunos
    where la_alunos.id = la_student_measurements.aluno_id
      and la_alunos.auth_user_id = (select auth.uid())
  ));
create policy la_student_measurements_insert_own on public.la_student_measurements
  for insert to authenticated
  with check (exists (
    select 1 from public.la_alunos
    where la_alunos.id = la_student_measurements.aluno_id
      and la_alunos.auth_user_id = (select auth.uid())
  ));

create policy la_student_messages_admin_all on public.la_student_messages
  for all to authenticated
  using (exists (select 1 from public.la_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.la_admins where user_id = (select auth.uid())));
create policy la_student_messages_read_own on public.la_student_messages
  for select to authenticated
  using (exists (
    select 1 from public.la_alunos
    where la_alunos.id = la_student_messages.aluno_id
      and la_alunos.auth_user_id = (select auth.uid())
  ));
create policy la_student_messages_insert_own on public.la_student_messages
  for insert to authenticated
  with check (
    remetente = 'aluno'
    and exists (
      select 1 from public.la_alunos
      where la_alunos.id = la_student_messages.aluno_id
        and la_alunos.auth_user_id = (select auth.uid())
    )
  );
create policy la_student_messages_mark_read on public.la_student_messages
  for update to authenticated
  using (
    remetente = 'academia'
    and exists (
      select 1 from public.la_alunos
      where la_alunos.id = la_student_messages.aluno_id
        and la_alunos.auth_user_id = (select auth.uid())
    )
  )
  with check (
    remetente = 'academia'
    and exists (
      select 1 from public.la_alunos
      where la_alunos.id = la_student_messages.aluno_id
        and la_alunos.auth_user_id = (select auth.uid())
    )
  );
revoke update on public.la_student_messages from authenticated;
grant update (lida_em) on public.la_student_messages to authenticated;

create policy la_student_payments_admin_all on public.la_student_payments
  for all to authenticated
  using (exists (select 1 from public.la_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.la_admins where user_id = (select auth.uid())));
create policy la_student_payments_read_own on public.la_student_payments
  for select to authenticated
  using (exists (
    select 1 from public.la_alunos
    where la_alunos.id = la_student_payments.aluno_id
      and la_alunos.auth_user_id = (select auth.uid())
  ));
create policy la_student_payments_insert_own on public.la_student_payments
  for insert to authenticated
  with check (
    status = 'aguardando'
    and confirmado_em is null
    and exists (
      select 1 from public.la_alunos
      where la_alunos.id = la_student_payments.aluno_id
        and la_alunos.auth_user_id = (select auth.uid())
    )
  );

create policy la_student_charges_admin_all on public.la_student_charges
  for all to authenticated
  using (exists (select 1 from public.la_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.la_admins where user_id = (select auth.uid())));
create policy la_student_charges_read_own on public.la_student_charges
  for select to authenticated
  using (exists (
    select 1 from public.la_alunos
    where la_alunos.id = la_student_charges.aluno_id
      and la_alunos.auth_user_id = (select auth.uid())
  ));
