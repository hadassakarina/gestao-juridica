create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 160),
  email text check (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  telefone text check (length(btrim(telefone)) between 1 and 40),
  unique (escritorio_id, id)
);

create index clientes_escritorio_nome_idx on public.clientes (escritorio_id, nome, id);

alter table public.clientes enable row level security;
revoke all on public.clientes from public, anon, authenticated;
grant select on public.clientes to authenticated;
grant insert (escritorio_id, nome, email, telefone) on public.clientes to authenticated;
grant update (nome, email, telefone) on public.clientes to authenticated;

create policy clientes_visiveis on public.clientes for select to authenticated
using (public.papel_no_escritorio(escritorio_id) is not null);

create policy clientes_criaveis on public.clientes for insert to authenticated
with check (public.papel_no_escritorio(escritorio_id) is not null);

create policy clientes_editaveis on public.clientes for update to authenticated
using (public.papel_no_escritorio(escritorio_id) is not null)
with check (public.papel_no_escritorio(escritorio_id) is not null);

alter table public.processos
  add column cliente_id uuid,
  add constraint processos_cliente_fk foreign key (escritorio_id, cliente_id)
    references public.clientes (escritorio_id, id) on delete set null (cliente_id);

create index processos_cliente_idx on public.processos (escritorio_id, cliente_id);
grant update (cliente_id) on public.processos to authenticated;
