alter table public.processos add unique (escritorio_id, id);

create table public.prazos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null,
  processo_id uuid not null,
  responsavel_id uuid,
  titulo text not null check (length(btrim(titulo)) between 1 and 200),
  vencimento date not null check (vencimento between date '0001-01-01' and date '9999-12-31'),
  situacao text not null default 'pendente' check (situacao in ('pendente', 'concluido')),
  foreign key (escritorio_id, processo_id) references public.processos (escritorio_id, id) on delete cascade,
  foreign key (escritorio_id, responsavel_id)
    references public.escritorio_membros (escritorio_id, usuario_id) on delete set null (responsavel_id)
);

create index prazos_escritorio_vencimento_idx on public.prazos (escritorio_id, vencimento, id);
create index prazos_processo_idx on public.prazos (escritorio_id, processo_id);
create index prazos_responsavel_idx on public.prazos (escritorio_id, responsavel_id);

alter table public.prazos enable row level security;
revoke all on public.prazos from public, anon, authenticated;
grant select on public.prazos to authenticated;
grant insert (escritorio_id, processo_id, responsavel_id, titulo, vencimento, situacao) on public.prazos to authenticated;
grant update (processo_id, responsavel_id, titulo, vencimento, situacao) on public.prazos to authenticated;

create policy prazos_visiveis on public.prazos for select to authenticated
using (public.papel_no_escritorio(escritorio_id) is not null);

create policy prazos_criaveis on public.prazos for insert to authenticated
with check (public.papel_no_escritorio(escritorio_id) is not null);

create policy prazos_editaveis on public.prazos for update to authenticated
using (public.papel_no_escritorio(escritorio_id) is not null)
with check (public.papel_no_escritorio(escritorio_id) is not null);

create function public.responsaveis_do_escritorio(p_escritorio uuid)
returns table (id uuid, email text)
language sql stable security definer set search_path = ''
as $$
  select membro.usuario_id, membro.email
  from public.escritorio_membros membro
  where membro.escritorio_id = p_escritorio
    and public.papel_no_escritorio(p_escritorio) is not null
  order by membro.email, membro.usuario_id;
$$;

revoke execute on function public.responsaveis_do_escritorio(uuid) from public, anon, authenticated;
grant execute on function public.responsaveis_do_escritorio(uuid) to authenticated;
