create table public.comunicacoes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null,
  processo_id uuid not null,
  tipo text not null check (tipo in ('publicacao', 'intimacao')),
  titulo text not null check (length(btrim(titulo)) between 1 and 200),
  data_comunicacao date not null check (data_comunicacao between date '0001-01-01' and date '9999-12-31'),
  observacoes text check (length(btrim(observacoes)) between 1 and 4000),
  foreign key (escritorio_id, processo_id) references public.processos (escritorio_id, id) on delete cascade
);

create index comunicacoes_escritorio_tipo_data_idx
  on public.comunicacoes (escritorio_id, tipo, data_comunicacao desc, id desc);
create index comunicacoes_processo_idx on public.comunicacoes (escritorio_id, processo_id);
create index comunicacoes_tipo_data_idx on public.comunicacoes (tipo, data_comunicacao desc, id desc);

alter table public.comunicacoes enable row level security;
revoke all on public.comunicacoes from public, anon, authenticated;
grant select on public.comunicacoes to authenticated;
grant insert (escritorio_id, processo_id, tipo, titulo, data_comunicacao, observacoes) on public.comunicacoes to authenticated;
grant update (processo_id, titulo, data_comunicacao, observacoes) on public.comunicacoes to authenticated;

create policy comunicacoes_visiveis on public.comunicacoes for select to authenticated
using (public.papel_no_escritorio(escritorio_id) is not null);

create policy comunicacoes_criaveis on public.comunicacoes for insert to authenticated
with check (public.papel_no_escritorio(escritorio_id) is not null);

create policy comunicacoes_editaveis on public.comunicacoes for update to authenticated
using (public.papel_no_escritorio(escritorio_id) is not null)
with check (public.papel_no_escritorio(escritorio_id) is not null);
