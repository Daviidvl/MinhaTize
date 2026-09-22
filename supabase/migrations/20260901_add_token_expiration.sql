-- SEC-006 — capacidade de expiração opcional para tokens de acesso.
--
-- Esta migration é 100% aditiva e retrocompatível:
--   - Adiciona uma coluna nullable. Nenhum token existente é alterado.
--   - expires_at = NULL continua significando "sem expiração" (comportamento
--     atual, preservado). Nada expira automaticamente por causa desta migration.
--   - Setar expires_at manualmente em um token específico passa a fazer
--     `isActiveToken()` (api/_lib/auth.ts) rejeitá-lo após a data informada.
--
-- IMPORTANTE — ordem de deploy:
--   Rode esta migration ANTES de publicar a versão do código que faz
--   `select('id, expires_at')` em api/_lib/auth.ts. Se o código for para
--   produção antes da coluna existir, toda validação de token passa a falhar
--   (a query retorna erro "column tokens.expires_at does not exist" e
--   isActiveToken() responde `false` para todo mundo).

alter table public.tokens
  add column if not exists expires_at timestamptz;

comment on column public.tokens.expires_at is
  'Expiração opcional do token de acesso. NULL = sem expiração (padrão). Setar manualmente para revogar automaticamente um acesso a partir de uma data.';
