create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios on delete cascade,
  processo_id uuid,
  responsavel_id uuid,
  titulo text not null check (length(btrim(titulo)) between 1 and 200),
  vencimento date check (vencimento between date '0001-01-01' and date '9999-12-31'),
  situacao text not null default 'pendente' check (situacao in ('pendente', 'concluida')),
  criado_em timestamptz not null default now(),
  foreign key (escritorio_id, processo_id) references public.processos (escritorio_id, id) on delete set null (processo_id),
  foreign key (escritorio_id, responsavel_id) references public.escritorio_membros (escritorio_id, usuario_id) on delete set null (responsavel_id)
);

create index tarefas_escritorio_situacao_idx on public.tarefas (escritorio_id, situacao, vencimento, id);
create index tarefas_processo_idx on public.tarefas (escritorio_id, processo_id);
create index tarefas_responsavel_idx on public.tarefas (escritorio_id, responsavel_id);

alter table public.tarefas enable row level security;
revoke all on public.tarefas from public, anon, authenticated;
grant select on public.tarefas to authenticated;
grant insert (escritorio_id, processo_id, responsavel_id, titulo, vencimento, situacao) on public.tarefas to authenticated;
grant update (processo_id, responsavel_id, titulo, vencimento, situacao) on public.tarefas to authenticated;

create policy tarefas_visiveis on public.tarefas for select to authenticated
using (public.papel_no_escritorio(escritorio_id) is not null);

create policy tarefas_criaveis on public.tarefas for insert to authenticated
with check (public.papel_no_escritorio(escritorio_id) is not null);

create policy tarefas_editaveis on public.tarefas for update to authenticated
using (public.papel_no_escritorio(escritorio_id) is not null)
with check (public.papel_no_escritorio(escritorio_id) is not null);

grant update (nome) on public.escritorios to authenticated;
create policy escritorios_renomeaveis on public.escritorios for update to authenticated
using (public.papel_no_escritorio(id) = 'admin')
with check (public.papel_no_escritorio(id) = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos-processos', 'documentos-processos', false, 4194304, array['application/pdf']);

create policy documentos_processos_visiveis on storage.objects for select to authenticated
using (
  bucket_id = 'documentos-processos' and exists (
    select 1 from public.processos p
    where p.escritorio_id::text = split_part(name, '/', 1)
      and p.id::text = split_part(name, '/', 2)
      and public.papel_no_escritorio(p.escritorio_id) is not null
  )
);

create policy documentos_processos_enviaveis on storage.objects for insert to authenticated
with check (
  bucket_id = 'documentos-processos'
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}__[A-Za-z0-9_-]{1,80}\.pdf$'
  and exists (
    select 1 from public.processos p
    where p.escritorio_id::text = split_part(name, '/', 1)
      and p.id::text = split_part(name, '/', 2)
      and public.papel_no_escritorio(p.escritorio_id) is not null
  )
);
