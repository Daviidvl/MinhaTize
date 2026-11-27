-- Idempotência dos pagamentos (Fase 1 — sem mudança comercial).
--
-- O webhook da Wiven (api/webhook.ts) passa a aplicar cada evento numa única
-- transação do banco, pelas funções abaixo:
--   * billing_events       — um registro por evento recebido, UNIQUE (gateway, event_key).
--                            Reentrega do mesmo evento não repete nenhum efeito.
--   * billing_transactions — um registro por transação da Wiven. O status só
--                            avança (paid → revoked): um pagamento que chega
--                            depois do estorno não libera acesso.
--   * email_outbox         — um e-mail de acesso por token (UNIQUE business_key),
--                            enviado ao Resend com uma chave de idempotência
--                            gerada uma única vez.
--
-- 100% ADITIVA. Nenhuma linha de public.tokens é alterada por este arquivo:
-- clientes que já compraram continuam exatamente como estão. As funções só
-- inserem tokens novos (como o webhook já faz) e desativam o token de uma
-- transação estornada (como o webhook já faz).
--
-- Não depende de tokens.expires_at nem do índice tokens_order_id_key: funciona
-- com ou sem as migrations 20260901 e 20261012.
--
-- Idempotente: pode rodar mais de uma vez.
--
-- Ordem de deploy: rode ANTES de publicar o código. Sem as funções, o webhook
-- novo responde 500 a toda venda (a Wiven reentrega; ninguém recebe token até
-- a migration rodar). O código antigo continua funcionando com ela aplicada.
--
-- Testes contra um Postgres real: supabase/tests/run-billing-tests.sh

begin;

-- ── 1. Eventos recebidos ──────────────────────────────────────────────────────
create table if not exists public.billing_events (
  id            bigserial primary key,
  gateway       text not null,
  -- Chave do evento: "<evento>:<transaction.id>", ou "<evento>:sha256:<hash do
  -- payload sem o segredo>" quando a Wiven não manda id (ver api/_lib/wivenEvents.ts)
  event_key     text not null,
  event_type    text not null,
  -- received/processing ficam dentro da transação; o que persiste é
  -- processed, ignored ou failed
  status        text not null default 'received'
                check (status in ('received', 'processed', 'ignored', 'failed')),
  attempts      integer not null default 0,
  -- Evento já normalizado (sem CPF, telefone nem o segredo do webhook): é o
  -- que o cron usa para reprocessar um evento que falhou
  payload       jsonb not null,
  result        jsonb,
  last_error    text,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  constraint billing_events_gateway_event_key_key unique (gateway, event_key)
);

create index if not exists billing_events_retry_idx
  on public.billing_events (received_at)
  where status in ('received', 'failed');

comment on table public.billing_events is
  'Eventos de pagamento recebidos (webhook). UNIQUE (gateway, event_key) impede processar duas vezes.';

-- ── 2. Transações ─────────────────────────────────────────────────────────────
create table if not exists public.billing_transactions (
  id                      bigserial primary key,
  gateway                 text not null,
  gateway_transaction_id  text not null,
  kind                    text not null default 'one_time'
                          check (kind in ('one_time', 'subscription')),
  -- Só avança: paid → revoked. 'revoked' cobre os eventos de WIVEN_REVOKE_EVENTS
  -- (reembolso, chargeback, cancelamento).
  status                  text not null check (status in ('paid', 'revoked')),
  token_id                text,          -- tokens.id em texto (mesmo padrão de push_subscriptions)
  paid_event_key          text,
  revoked_event_type      text,
  paid_at                 timestamptz,   -- quando o servidor registrou o pagamento
  revoked_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint billing_transactions_gateway_tx_key unique (gateway, gateway_transaction_id)
);

comment on table public.billing_transactions is
  'Uma linha por transação do gateway. O efeito "liberar acesso da transação X" acontece uma vez.';

-- ── 3. Fila de e-mails ────────────────────────────────────────────────────────
create table if not exists public.email_outbox (
  id                   bigserial primary key,
  business_key         text not null,   -- 'access_email:token:<tokens.id>'
  -- UUID v4 gerado uma vez por e-mail e reenviado ao Resend (Idempotency-Key)
  -- em toda nova tentativa
  idempotency_key      uuid not null default gen_random_uuid(),
  template             text not null,
  token_id             text not null,   -- o token e o e-mail são lidos de tokens na hora do envio
  status               text not null default 'pending'
                       check (status in ('pending', 'sending', 'sent', 'failed', 'canceled')),
  attempts             integer not null default 0,
  claimed_at           timestamptz,
  sent_at              timestamptz,
  provider_message_id  text,
  last_error           text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint email_outbox_business_key_key unique (business_key)
);

create index if not exists email_outbox_due_idx
  on public.email_outbox (created_at)
  where status in ('pending', 'sending', 'failed');

comment on table public.email_outbox is
  'E-mails transacionais. UNIQUE business_key: cada e-mail de negócio é enfileirado uma vez.';

-- ── 4. Aplicar um evento (uma transação) ──────────────────────────────────────
-- p_event: { gateway, event_key, event_type, action: 'grant'|'revoke',
--            transaction_id, email, name }
-- Devolve { outcome, duplicate, token_id?, email_key?, tokens_revoked? }.
-- Qualquer erro desfaz tudo — inclusive o registro do evento, que nunca fica
-- marcado como processado sem que os efeitos tenham sido gravados.
create or replace function public.billing_apply_event(p_event jsonb)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_gateway   text := nullif(p_event->>'gateway', '');
  v_key       text := nullif(p_event->>'event_key', '');
  v_type      text := nullif(p_event->>'event_type', '');
  v_action    text := coalesce(p_event->>'action', '');
  v_tx        text := nullif(p_event->>'transaction_id', '');
  v_email     text := nullif(p_event->>'email', '');
  v_name      text := coalesce(p_event->>'name', '');
  v_event     public.billing_events%rowtype;
  v_txrow     public.billing_transactions%rowtype;
  v_token_id  text;
  v_active    boolean;
  v_count     integer;
  v_status    text := 'processed';
  v_result    jsonb;
begin
  if v_gateway is null or v_key is null or v_type is null
     or v_action not in ('grant', 'revoke') then
    raise exception 'billing_apply_event: evento incompleto' using errcode = '22023';
  end if;

  -- 1. Registra o evento. Uma segunda entrega simultânea da mesma chave fica
  --    parada no índice único até esta transação terminar; depois encontra o
  --    evento já processado.
  insert into public.billing_events (gateway, event_key, event_type, payload)
  values (v_gateway, v_key, v_type, p_event)
  on conflict (gateway, event_key) do nothing;

  select * into v_event
    from public.billing_events
   where gateway = v_gateway and event_key = v_key
     for update;

  if v_event.status in ('processed', 'ignored') then
    return coalesce(v_event.result, '{}'::jsonb) || jsonb_build_object('duplicate', true);
  end if;

  -- 2. Efeitos
  if v_action = 'grant' then
    if v_email is null then
      raise exception 'billing_apply_event: pagamento sem e-mail' using errcode = '22023';
    end if;

    if v_tx is not null then
      insert into public.billing_transactions
        (gateway, gateway_transaction_id, status, paid_event_key, paid_at)
      values (v_gateway, v_tx, 'paid', v_key, now())
      on conflict (gateway, gateway_transaction_id) do nothing;

      -- Trava a transação: pagamento e estorno da mesma venda não correm juntos
      select * into v_txrow
        from public.billing_transactions
       where gateway = v_gateway and gateway_transaction_id = v_tx
         for update;

      if v_txrow.status = 'revoked' then
        -- O estorno chegou antes do pagamento: não libera acesso
        v_status := 'ignored';
        v_result := jsonb_build_object('outcome', 'already_revoked');
      else
        -- Token deste pedido: emitido antes desta migration ou por esta função
        select t.id::text, coalesce(t.active, false)
          into v_token_id, v_active
          from public.tokens t
         where t.order_id = v_tx
         order by t.id
         limit 1;

        if v_token_id is null then
          insert into public.tokens (token, email, customer_name, order_id, active)
          values (gen_random_uuid(), v_email, v_name, v_tx, true)
          returning id::text into v_token_id;
          v_active := true;
          v_result := jsonb_build_object('outcome', 'token_created');
        else
          v_result := jsonb_build_object('outcome', 'token_exists');
        end if;

        update public.billing_transactions
           set token_id = v_token_id, updated_at = now()
         where id = v_txrow.id and token_id is distinct from v_token_id;
      end if;
    else
      -- Sem transaction.id: a única proteção é a chave do evento (hash do payload)
      insert into public.tokens (token, email, customer_name, order_id, active)
      values (gen_random_uuid(), v_email, v_name, null, true)
      returning id::text into v_token_id;
      v_active := true;
      v_result := jsonb_build_object('outcome', 'token_created');
    end if;

    if v_token_id is not null then
      v_result := v_result || jsonb_build_object('token_id', v_token_id);
      if v_active then
        -- Um e-mail de acesso por token, nunca dois
        insert into public.email_outbox (business_key, template, token_id)
        values ('access_email:token:' || v_token_id, 'access_granted', v_token_id)
        on conflict (business_key) do nothing;
        v_result := v_result || jsonb_build_object('email_key', 'access_email:token:' || v_token_id);
      else
        v_result := v_result || jsonb_build_object('token_active', false);
      end if;
    end if;

  else -- revoke
    if v_tx is null then
      raise exception 'billing_apply_event: revogação sem transaction_id' using errcode = '22023';
    end if;

    insert into public.billing_transactions
      (gateway, gateway_transaction_id, status, revoked_event_type, revoked_at)
    values (v_gateway, v_tx, 'revoked', v_type, now())
    on conflict (gateway, gateway_transaction_id) do update
      set status             = 'revoked',
          revoked_event_type = coalesce(billing_transactions.revoked_event_type, excluded.revoked_event_type),
          revoked_at         = coalesce(billing_transactions.revoked_at, excluded.revoked_at),
          updated_at         = now();

    -- Mesmo efeito do webhook anterior
    update public.tokens set active = false where order_id = v_tx and active;
    get diagnostics v_count = row_count;

    -- E-mail de acesso ainda não enviado deixa de sair
    update public.email_outbox
       set status = 'canceled', updated_at = now()
     where status in ('pending', 'failed')
       and token_id in (select t.id::text from public.tokens t where t.order_id = v_tx);

    v_result := jsonb_build_object('outcome', 'revoked', 'tokens_revoked', v_count);
  end if;

  -- 3. Só agora, com os efeitos gravados na mesma transação, o evento é concluído
  update public.billing_events
     set status       = v_status,
         result       = v_result,
         attempts     = attempts + 1,
         last_error   = null,
         processed_at = now(),
         updated_at   = now()
   where id = v_event.id;

  return v_result || jsonb_build_object('duplicate', false);
end;
$$;

-- ── 5. Registrar uma falha (para o cron tentar de novo) ───────────────────────
-- Nunca rebaixa um evento já processado.
create or replace function public.billing_record_failure(p_event jsonb, p_error text)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  insert into public.billing_events
    (gateway, event_key, event_type, payload, status, attempts, last_error)
  values (
    p_event->>'gateway', p_event->>'event_key', coalesce(p_event->>'event_type', '?'),
    p_event, 'failed', 1, left(p_error, 500)
  )
  on conflict (gateway, event_key) do update
    set status     = case when billing_events.status in ('processed', 'ignored')
                          then billing_events.status else 'failed' end,
        attempts   = billing_events.attempts + 1,
        last_error = excluded.last_error,
        updated_at = now();
end;
$$;

-- ── 6. Reservar um e-mail para envio ──────────────────────────────────────────
-- Só um processo consegue a reserva. Uma reserva parada há mais de 2 minutos
-- (função que caiu no meio do envio) pode ser retomada — com a mesma
-- idempotency_key, para o Resend não enviar de novo.
-- outcome: claimed | sent | busy | canceled | exhausted | missing
create or replace function public.email_outbox_claim(p_business_key text)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_row     public.email_outbox%rowtype;
  v_token   text;
  v_email   text;
  v_name    text;
  v_active  boolean;
begin
  update public.email_outbox o
     set status = 'sending', claimed_at = now(), attempts = o.attempts + 1, updated_at = now()
   where o.business_key = p_business_key
     and o.attempts < 8
     and (o.status in ('pending', 'failed')
          or (o.status = 'sending' and o.claimed_at < now() - interval '2 minutes'))
  returning o.* into v_row;

  if not found then
    select * into v_row from public.email_outbox where business_key = p_business_key;
    if not found then
      return jsonb_build_object('outcome', 'missing');
    end if;
    return jsonb_build_object('outcome', case v_row.status
      when 'sent'     then 'sent'
      when 'canceled' then 'canceled'
      when 'sending'  then 'busy'
      else 'exhausted' end);
  end if;

  select t.token::text, t.email, coalesce(t.customer_name, ''), coalesce(t.active, false)
    into v_token, v_email, v_name, v_active
    from public.tokens t
   where t.id::text = v_row.token_id;

  if v_token is null or v_email is null or not v_active then
    update public.email_outbox
       set status = 'canceled', claimed_at = null, updated_at = now(),
           last_error = 'token ausente, inativo ou sem e-mail'
     where id = v_row.id;
    return jsonb_build_object('outcome', 'canceled');
  end if;

  return jsonb_build_object(
    'outcome',         'claimed',
    'outbox_id',       v_row.id,
    'idempotency_key', v_row.idempotency_key,
    'template',        v_row.template,
    'token',           v_token,
    'email',           v_email,
    'name',            v_name
  );
end;
$$;

-- ── 7. Concluir o envio ───────────────────────────────────────────────────────
create or replace function public.email_outbox_finish(
  p_id bigint, p_ok boolean, p_provider_id text, p_error text
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  update public.email_outbox
     set status              = case when p_ok then 'sent' else 'failed' end,
         sent_at             = case when p_ok then now() else sent_at end,
         provider_message_id = coalesce(p_provider_id, provider_message_id),
         last_error          = case when p_ok then null else left(p_error, 500) end,
         claimed_at          = null,
         updated_at          = now()
   where id = p_id and status = 'sending';
end;
$$;

-- ── 8. Trabalho pendente para o cron (api/billing-cron.ts) ────────────────────
-- events: payloads de eventos que falharam (até 10 tentativas)
-- emails: business_keys de e-mails pendentes/falhos (até 8 tentativas) ou com
--         reserva parada
-- stuck:  quantos esgotaram as tentativas (precisam de atenção manual)
create or replace function public.billing_due_work(p_limit integer default 20)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'events', coalesce((
      select jsonb_agg(e.payload order by e.received_at)
        from (select payload, received_at
                from public.billing_events
               where status in ('received', 'failed')
                 and attempts < 10
                 and updated_at < now() - interval '1 minute'
               order by received_at
               limit p_limit) e
    ), '[]'::jsonb),
    'emails', coalesce((
      select jsonb_agg(o.business_key order by o.created_at)
        from (select business_key, created_at
                from public.email_outbox
               where attempts < 8
                 and ((status in ('pending', 'failed') and updated_at < now() - interval '1 minute')
                      or (status = 'sending' and claimed_at < now() - interval '2 minutes'))
               order by created_at
               limit p_limit) o
    ), '[]'::jsonb),
    'stuck', jsonb_build_object(
      'events', (select count(*) from public.billing_events
                  where status in ('received', 'failed') and attempts >= 10),
      'emails', (select count(*) from public.email_outbox
                  where status in ('pending', 'sending', 'failed') and attempts >= 8)
    )
  );
$$;

-- ── 9. Segurança: mesmo padrão das outras tabelas ─────────────────────────────
-- Só o servidor (service_role) acessa. O Supabase expõe as funções do schema
-- public pelo PostgREST; sem estes revokes a anon key (pública) poderia
-- chamá-las e emitir tokens.
alter table public.billing_events       enable row level security;
alter table public.billing_transactions enable row level security;
alter table public.email_outbox         enable row level security;

revoke all on table public.billing_events       from anon, authenticated;
revoke all on table public.billing_transactions from anon, authenticated;
revoke all on table public.email_outbox         from anon, authenticated;

revoke all on function public.billing_apply_event(jsonb)                       from public, anon, authenticated;
revoke all on function public.billing_record_failure(jsonb, text)              from public, anon, authenticated;
revoke all on function public.email_outbox_claim(text)                         from public, anon, authenticated;
revoke all on function public.email_outbox_finish(bigint, boolean, text, text) from public, anon, authenticated;
revoke all on function public.billing_due_work(integer)                        from public, anon, authenticated;

grant execute on function public.billing_apply_event(jsonb)                       to service_role;
grant execute on function public.billing_record_failure(jsonb, text)              to service_role;
grant execute on function public.email_outbox_claim(text)                         to service_role;
grant execute on function public.email_outbox_finish(bigint, boolean, text, text) to service_role;
grant execute on function public.billing_due_work(integer)                        to service_role;

commit;

-- O PostgREST passa a enxergar as funções novas
notify pgrst, 'reload schema';

-- ── Conferência (rode ANTES e DEPOIS; os números têm de ser idênticos) ────────
--   select active, count(*) from public.tokens group by 1 order by 1;
--
-- Funções fora do alcance da anon key — deve voltar vazio:
--   select routine_name, grantee from information_schema.routine_privileges
--    where routine_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC')
--      and routine_name in ('billing_apply_event', 'billing_record_failure',
--                           'email_outbox_claim', 'email_outbox_finish', 'billing_due_work');
--
-- ── Reverter (depois de voltar o código anterior na Vercel) ───────────────────
--   drop function if exists public.billing_apply_event(jsonb);
--   drop function if exists public.billing_record_failure(jsonb, text);
--   drop function if exists public.email_outbox_claim(text);
--   drop function if exists public.email_outbox_finish(bigint, boolean, text, text);
--   drop function if exists public.billing_due_work(integer);
--   -- Tabelas: renomear em vez de apagar, para não perder o histórico
--   alter table if exists public.billing_events       rename to billing_events_revertido;
--   alter table if exists public.billing_transactions rename to billing_transactions_revertido;
--   alter table if exists public.email_outbox         rename to email_outbox_revertido;
--   -- Os tokens emitidos pelas funções são linhas normais de tokens: continuam valendo.
