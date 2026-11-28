-- Banco de teste que imita o Supabase de produção, antes da migration de
-- pagamentos. Usado só por run-billing-tests.sh, num Postgres descartável.

-- Papéis do Supabase
do $$ begin create role anon nologin;          exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;

grant usage on schema public to anon, authenticated, service_role;

-- Privilégios padrão do Supabase: tudo o que o postgres cria no schema public
-- é concedido a anon/authenticated/service_role. É por isso que a migration
-- precisa revogar — e o teste confere que revogou.
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- public.tokens como em produção (criada pelo painel do Supabase, sem
-- migration no repositório). Sem expires_at e sem o índice único de order_id:
-- o pior caso — as migrations 20260901 e 20261012 podem não ter rodado.
-- id é uuid como em produção (conferido em 26/11/2026)
create table public.tokens (
  id             uuid primary key default gen_random_uuid(),
  token          uuid not null unique,
  email          text,
  customer_name  text,
  order_id       text,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
alter table public.tokens enable row level security;

-- Clientes que já compraram antes da mudança
insert into public.tokens (token, email, customer_name, order_id, active) values
  ('11111111-1111-4111-8111-111111111111', 'antigo@example.com',    'Cliente Antigo',    'tx-old-1', true),
  ('22222222-2222-4222-8222-222222222222', 'hotmart@example.com',   'Cliente Hotmart',   null,       true),
  ('33333333-3333-4333-8333-333333333333', 'estornado@example.com', 'Cliente Estornado', 'tx-old-2', false);

-- Foto dos clientes antigos para comparar depois de tudo
create table public.test_legacy_snapshot as select * from public.tokens;
grant select on public.test_legacy_snapshot to service_role;
