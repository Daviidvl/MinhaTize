-- Defesa em profundidade: os papéis do cliente (anon, authenticated) não tocam
-- nas tabelas do app.
--
-- O app só acessa o banco pelo servidor, com a service_role — que ignora RLS e
-- não é afetada por este arquivo. Hoje a única barreira para a anon key (pública
-- por definição no Supabase) é o RLS ligado sem nenhuma policy. Este arquivo:
--   1. garante o RLS ligado nas três tabelas (idempotente);
--   2. retira os privilégios que o Supabase concede por padrão a anon e
--      authenticated. Se um dia o RLS for desligado ou uma policy permissiva for
--      criada por engano, tokens de acesso, e-mails de compradores e registros
--      de consentimento continuam fora do alcance da anon key.
--
-- Ordem de deploy: qualquer uma. Nada no código usa anon nem authenticated.
-- Reverter: grant select, insert, update, delete on public.<tabela> to anon, authenticated;

alter table public.tokens             enable row level security;
alter table public.consents           enable row level security;
alter table public.push_subscriptions enable row level security;

revoke all on table public.tokens             from anon, authenticated;
revoke all on table public.consents           from anon, authenticated;
revoke all on table public.push_subscriptions from anon, authenticated;

-- ── Conferência (rode depois) ────────────────────────────────────────────────
-- 1. RLS ligado — as três linhas com rowsecurity = true:
--      select tablename, rowsecurity from pg_tables
--       where schemaname = 'public' and tablename in ('tokens', 'consents', 'push_subscriptions');
--
-- 2. Nenhum privilégio para os papéis do cliente — deve voltar vazio:
--      select grantee, table_name, privilege_type from information_schema.role_table_grants
--       where table_schema = 'public' and table_name in ('tokens', 'consents', 'push_subscriptions')
--         and grantee in ('anon', 'authenticated');
--
-- 3. Nenhuma policy nessas tabelas — deve voltar vazio:
--      select tablename, policyname, roles, cmd from pg_policies
--       where tablename in ('tokens', 'consents', 'push_subscriptions');
