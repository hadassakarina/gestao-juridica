create table public.escritorios (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(btrim(nome)) between 1 and 120)
);

create table public.escritorio_membros (
  escritorio_id uuid not null references public.escritorios on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  email text not null,
  papel text not null check (papel in ('admin', 'membro')),
  primary key (escritorio_id, usuario_id)
);

create index escritorio_membros_usuario_idx on public.escritorio_membros (usuario_id);

create table public.escritorio_convites (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios on delete cascade,
  email text not null check (email = lower(btrim(email)) and length(email) between 3 and 254),
  unique (escritorio_id, email)
);

create table public.processos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references public.escritorios on delete cascade,
  numero text not null check (length(btrim(numero)) between 1 and 50),
  titulo text not null check (length(btrim(titulo)) between 1 and 200),
  situacao text not null default 'ativo' check (situacao in ('ativo', 'encerrado')),
  unique (escritorio_id, numero)
);

alter table public.escritorios enable row level security;
alter table public.escritorio_membros enable row level security;
alter table public.escritorio_convites enable row level security;
alter table public.processos enable row level security;

create function public.papel_no_escritorio(p_escritorio uuid)
returns text language sql stable security definer set search_path = ''
as $$
  select papel from public.escritorio_membros
  where escritorio_id = p_escritorio and usuario_id = (select auth.uid());
$$;

create function public.criar_escritorio(p_nome text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_email text;
  v_escritorio uuid;
begin
  select email into v_email from auth.users where id = v_usuario and email_confirmed_at is not null;
  if v_email is null then
    raise exception 'Conta sem e-mail confirmado';
  end if;
  insert into public.escritorios (nome) values (btrim(p_nome)) returning id into v_escritorio;
  insert into public.escritorio_membros (escritorio_id, usuario_id, email, papel)
  values (v_escritorio, v_usuario, lower(v_email), 'admin');
  return v_escritorio;
end;
$$;

create function public.aceitar_convite(p_convite uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_email text;
  v_escritorio uuid;
begin
  select lower(email) into v_email from auth.users where id = v_usuario and email_confirmed_at is not null;
  delete from public.escritorio_convites where id = p_convite and email = v_email
  returning escritorio_id into v_escritorio;
  if v_escritorio is null then
    raise exception 'Convite indisponível para esta conta';
  end if;
  insert into public.escritorio_membros (escritorio_id, usuario_id, email, papel)
  values (v_escritorio, v_usuario, v_email, 'membro')
  on conflict (escritorio_id, usuario_id) do nothing;
  return v_escritorio;
end;
$$;

revoke execute on function public.papel_no_escritorio(uuid), public.criar_escritorio(text),
  public.aceitar_convite(uuid) from public, anon, authenticated;
grant execute on function public.papel_no_escritorio(uuid), public.criar_escritorio(text),
  public.aceitar_convite(uuid) to authenticated;

revoke all on public.escritorios, public.escritorio_membros, public.escritorio_convites,
  public.processos from public, anon, authenticated;
grant select on public.escritorios to authenticated;
grant select, delete on public.escritorio_membros to authenticated;
grant select, insert, delete on public.escritorio_convites to authenticated;
grant select, insert on public.processos to authenticated;
grant update (numero, titulo, situacao) on public.processos to authenticated;

create policy escritorios_visiveis on public.escritorios for select to authenticated
using (
  public.papel_no_escritorio(id) is not null or exists (
    select 1 from public.escritorio_convites where escritorio_id = escritorios.id
      and email = lower((select auth.jwt()) ->> 'email')
  )
);

create policy membros_visiveis on public.escritorio_membros for select to authenticated
using (usuario_id = (select auth.uid()) or public.papel_no_escritorio(escritorio_id) = 'admin');

create policy membros_removiveis on public.escritorio_membros for delete to authenticated
using (papel = 'membro' and public.papel_no_escritorio(escritorio_id) = 'admin');

create policy convites_visiveis on public.escritorio_convites for select to authenticated
using (
  email = lower((select auth.jwt()) ->> 'email') or
  public.papel_no_escritorio(escritorio_id) = 'admin'
);

create policy convites_criaveis on public.escritorio_convites for insert to authenticated
with check (public.papel_no_escritorio(escritorio_id) = 'admin');

create policy convites_cancelaveis on public.escritorio_convites for delete to authenticated
using (public.papel_no_escritorio(escritorio_id) = 'admin');

create policy processos_visiveis on public.processos for select to authenticated
using (public.papel_no_escritorio(escritorio_id) is not null);

create policy processos_criaveis on public.processos for insert to authenticated
with check (public.papel_no_escritorio(escritorio_id) is not null);

create policy processos_editaveis on public.processos for update to authenticated
using (public.papel_no_escritorio(escritorio_id) is not null)
with check (public.papel_no_escritorio(escritorio_id) is not null);
