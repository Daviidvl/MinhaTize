-- consents passa a referenciar o acesso pelo id (tokens.id), não pelo token.
--
-- Antes, cada consentimento guardava uma cópia do token de acesso: um vazamento
-- desta tabela entregaria credenciais válidas. api/register-consent.ts agora
-- grava só token_id.
--
-- Ordem de deploy:
--   1. Rode este arquivo inteiro ANTES de publicar o código (o código novo grava
--      token_id e falha sem a coluna — o app não bloqueia o usuário, mas o
--      registro do consentimento se perde).
--   2. DEPOIS do deploy, rode de novo só o bloco "Apagar as cópias do token":
--      consentimentos registrados pela versão antiga no intervalo ainda trazem
--      o token. O bloco é idempotente.

alter table public.consents add column if not exists token_id text;

-- Preenche token_id dos registros existentes. tokens.token é uuid e
-- consents.token é text: compara como texto, em minúsculas (forma canônica do uuid).
update public.consents c
   set token_id = t.id::text
  from public.tokens t
 where c.token_id is null
   and lower(c.token) = t.token::text;

-- A coluna antiga deixa de ser obrigatória (o código novo não a preenche)
alter table public.consents alter column token drop not null;

create index if not exists consents_token_id_version_idx
  on public.consents (token_id, version);

-- ── Apagar as cópias do token ────────────────────────────────────────────────
update public.consents c
   set token_id = t.id::text
  from public.tokens t
 where c.token_id is null
   and lower(c.token) = t.token::text;

update public.consents set token = null where token is not null;

-- Opcional, numa próxima janela (quando nada mais ler a coluna):
--   alter table public.consents drop column token;
