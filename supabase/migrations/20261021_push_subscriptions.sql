-- Notificações push (lembretes com o app fechado).
--
-- Uma linha por aparelho inscrito. `schedule` guarda só os avisos dos próximos
-- dias que o próprio app calculou: [{ id, at, title, body, url }]. Nenhum dado
-- de saúde (peso, dose, sintomas) é gravado aqui — ver api/_lib/pushSchedule.ts.
--
-- Ordem de deploy: rode ANTES de publicar o código que usa /api/push. Sem a
-- tabela, a inscrição responde 500 e o app tenta de novo na próxima abertura
-- (nada quebra para o usuário).

create table if not exists public.push_subscriptions (
  id          bigserial primary key,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  -- tokens.id em texto: o disparo (api/push-cron.ts) para de enviar quando o
  -- acesso é revogado
  token_id    text not null,
  schedule    jsonb not null default '[]'::jsonb,
  next_at     timestamptz,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_next_at_idx
  on public.push_subscriptions (next_at)
  where next_at is not null;

create index if not exists push_subscriptions_token_id_idx
  on public.push_subscriptions (token_id);

-- Mesmo padrão de tokens/consents: só o servidor (service_role) acessa
alter table public.push_subscriptions enable row level security;

comment on table public.push_subscriptions is
  'Inscrições Web Push por aparelho e a agenda de lembretes calculada pelo app. Sem dados de saúde.';
