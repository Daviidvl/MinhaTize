-- Assinaturas (Fase 2): planos mensal, trimestral e anual pela Wiven.
--
-- Depende de 20261125_billing_idempotency.sql (rode aquela antes).
--
-- CLIENTES ANTIGOS: nenhuma linha de public.tokens é reescrita. A coluna nova
-- access_type tem default constante 'legacy_purchase' (no Postgres 11+ isso é
-- só metadado): TODA linha que existe hoje passa a ler 'legacy_purchase', com
-- expires_at como está (nulo = vitalício). Um trigger impede que qualquer
-- código ou UPDATE manual transforme um cliente antigo em assinante.
--
-- REGRAS DE ACESSO DO ASSINANTE (decididas em 26/11/2026):
--   * cada cobrança paga estende o acesso até a próxima cobrança (nextChargeAt);
--   * renovação que falha: o acesso termina no SUBSCRIPTION_EXPIRED da Wiven
--     (~3 dias depois do vencimento no PIX), sem carência extra;
--   * rede de segurança: se esse aviso se perder, o acesso termina sozinho
--     7 dias depois do vencimento (billing_access_end);
--   * cancelamento: o acesso vai até o fim do período pago (a Wiven só manda
--     SUBSCRIPTION_CANCELED nessa data);
--   * reembolso/chargeback de uma cobrança: acesso cortado na hora;
--   * quem reassina volta com o MESMO token (pelo client.id da Wiven).
--
-- ORDEM DOS EVENTOS: o fim do acesso é sempre recalculado a partir do estado
-- guardado (maior período pago; status só muda por um evento mais novo), então
-- a ordem de chegada não muda o resultado.
--
-- Idempotente: pode rodar mais de uma vez. Ordem de deploy: ANTES do código.
-- Testes contra um Postgres real: supabase/tests/run-billing-tests.sh

begin;

-- ── 0. Pré-requisito: expiração em tokens (já existe se 20260901 rodou) ──────
alter table public.tokens add column if not exists expires_at timestamptz;

-- ── 1. Tipo de acesso ─────────────────────────────────────────────────────────
alter table public.tokens add column if not exists access_type text not null default 'legacy_purchase';
alter table public.tokens add column if not exists plan text;
alter table public.tokens add column if not exists gateway_customer_id text;
-- Fim do período pago (o que o app mostra como "Válido até"); expires_at é o
-- fim do ACESSO, que pode ir além (rede de segurança) ou ficar antes (estorno)
alter table public.tokens add column if not exists paid_until timestamptz;

do $$ begin
  alter table public.tokens add constraint tokens_access_type_chk
    check (access_type in ('legacy_purchase', 'subscription'));
exception when duplicate_object then null; end $$;

-- Cliente antigo nunca tem plano nem dados de assinatura. Assinante sempre tem
-- plano e SEMPRE tem expires_at: um token de assinatura nunca vira vitalício.
do $$ begin
  alter table public.tokens add constraint tokens_access_fields_chk check (
    (access_type = 'legacy_purchase' and plan is null and gateway_customer_id is null and paid_until is null)
    or (access_type = 'subscription' and expires_at is not null
        and plan is not null and plan in ('mensal', 'trimestral', 'anual'))
  );
exception when duplicate_object then null; end $$;

-- Um token de assinatura por cliente da Wiven (reassinatura reaproveita o token)
create unique index if not exists tokens_subscription_customer_key
  on public.tokens (gateway_customer_id)
  where access_type = 'subscription' and gateway_customer_id is not null;

comment on column public.tokens.access_type is
  'legacy_purchase = compra única antiga (acesso vitalício, preservado); subscription = assinatura (acesso até expires_at).';

-- ── 2. Trava: compra antiga nunca vira assinatura ────────────────────────────
create or replace function public.tokens_protect_legacy() returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.access_type = 'legacy_purchase' and new.access_type is distinct from old.access_type then
    raise exception 'tokens.id=%: acesso legacy_purchase não pode virar %', old.id, new.access_type
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists tokens_protect_legacy on public.tokens;
create trigger tokens_protect_legacy
  before update of access_type on public.tokens
  for each row execute function public.tokens_protect_legacy();

-- ── 3. Transações: dados da assinatura ───────────────────────────────────────
alter table public.billing_transactions add column if not exists gateway_subscription_id text;
alter table public.billing_transactions add column if not exists cycle integer;
-- Até quando ESTA cobrança paga o acesso
alter table public.billing_transactions add column if not exists period_end timestamptz;

create index if not exists billing_transactions_subscription_idx
  on public.billing_transactions (gateway, gateway_subscription_id)
  where gateway_subscription_id is not null;

-- ── 4. Assinaturas ───────────────────────────────────────────────────────────
create table if not exists public.billing_subscriptions (
  id                       bigserial primary key,
  gateway                  text not null,
  gateway_subscription_id  text not null,
  gateway_customer_id      text,
  plan                     text check (plan in ('mensal', 'trimestral', 'anual')),
  -- active | past_due (renovação pendente) | canceled | expired | revoked (estorno/chargeback)
  status                   text not null
                           check (status in ('active', 'past_due', 'canceled', 'expired', 'revoked')),
  -- Quando aconteceu o fato que definiu o status (occurredAt da Wiven). Um
  -- evento mais antigo que isso não muda o status.
  status_changed_at        timestamptz not null,
  -- Sempre derivado: maior period_end das cobranças pagas desta assinatura
  paid_until               timestamptz,
  last_cycle               integer,
  token_id                 text,       -- tokens.id em texto
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint billing_subscriptions_gateway_sub_key unique (gateway, gateway_subscription_id)
);

create index if not exists billing_subscriptions_token_idx
  on public.billing_subscriptions (token_id)
  where token_id is not null;

comment on table public.billing_subscriptions is
  'Assinaturas da Wiven. O acesso do token é recalculado a partir daqui (billing_refresh_subscription_token).';

-- ── 5. Fim do acesso de uma assinatura ───────────────────────────────────────
-- Em dia (ou com renovação pendente): até o fim do período pago + 7 dias de
-- rede de segurança (o SUBSCRIPTION_EXPIRED da Wiven normalmente chega antes e
-- encerra). Encerrada: na hora em que foi encerrada, nunca depois da rede.
create or replace function public.billing_access_end(
  p_status text, p_paid_until timestamptz, p_changed_at timestamptz
)
returns timestamptz
language sql
stable
set search_path = public, pg_temp
as $$
  select case
    when p_status in ('active', 'past_due') then p_paid_until + interval '7 days'
    else least(p_paid_until + interval '7 days', p_changed_at)
  end
$$;

-- Recalcula o acesso de um token de assinatura a partir de TODAS as
-- assinaturas dele (quem reassina tem mais de uma). Nunca toca em compra antiga.
create or replace function public.billing_refresh_subscription_token(p_token_id text)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  update public.tokens t
     set expires_at = coalesce(a.access_end, now()),
         paid_until = a.paid_until,
         plan       = coalesce(a.plan, t.plan)
    from (
      select max(public.billing_access_end(s.status, s.paid_until, s.status_changed_at)) as access_end,
             max(s.paid_until) as paid_until,
             (array_agg(s.plan order by s.status_changed_at desc) filter (where s.plan is not null))[1] as plan
        from public.billing_subscriptions s
       where s.token_id = p_token_id
    ) a
   where t.id::text = p_token_id
     and t.access_type = 'subscription';
end;
$$;

-- ── 6. Aplicar um evento (substitui a versão da Fase 1) ──────────────────────
-- p_event (canônico, montado por api/_lib/wivenEvents.ts):
--   comum:   gateway, event_key, event_type, action
--   grant:   transaction_id, email, name                       (compra única antiga)
--   revoke:  transaction_id, subscription_id?                  (estorno/chargeback)
--   subscription_charge: transaction_id, subscription_id, customer_id, plan,
--            occurred_at, email, name, e period_end OU (start_at, interval_type,
--            interval_count, cycle) para calcular o fim do período
--   subscription_status: subscription_id, customer_id, plan, occurred_at,
--            status ('past_due' | 'expired' | 'canceled')
create or replace function public.billing_apply_event(p_event jsonb)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_gateway     text := nullif(p_event->>'gateway', '');
  v_key         text := nullif(p_event->>'event_key', '');
  v_type        text := nullif(p_event->>'event_type', '');
  v_action      text := coalesce(p_event->>'action', '');
  v_tx          text := nullif(p_event->>'transaction_id', '');
  v_email       text := nullif(p_event->>'email', '');
  v_name        text := coalesce(p_event->>'name', '');
  v_sub         text := nullif(p_event->>'subscription_id', '');
  v_customer    text := nullif(p_event->>'customer_id', '');
  v_plan        text := nullif(p_event->>'plan', '');
  v_new_status  text := nullif(p_event->>'status', '');
  v_occurred    timestamptz;
  v_period_end  timestamptz;
  v_start_at    timestamptz;
  v_itype       text := nullif(p_event->>'interval_type', '');
  v_icount      integer;
  v_cycle       integer;
  v_event       public.billing_events%rowtype;
  v_txrow       public.billing_transactions%rowtype;
  v_subrow      public.billing_subscriptions%rowtype;
  v_token_id    text;
  v_active      boolean;
  v_expires     timestamptz;
  v_created     boolean := false;
  v_inserted    bigint;
  v_count       integer;
  v_status      text := 'processed';
  v_result      jsonb;
begin
  if v_gateway is null or v_key is null or v_type is null
     or v_action not in ('grant', 'revoke', 'subscription_charge', 'subscription_status') then
    raise exception 'billing_apply_event: evento incompleto' using errcode = '22023';
  end if;

  v_occurred   := nullif(p_event->>'occurred_at', '')::timestamptz;
  v_period_end := nullif(p_event->>'period_end', '')::timestamptz;
  v_start_at   := nullif(p_event->>'start_at', '')::timestamptz;
  v_icount     := nullif(p_event->>'interval_count', '')::integer;
  v_cycle      := nullif(p_event->>'cycle', '')::integer;

  -- 1. Registra o evento. Uma segunda entrega simultânea da mesma chave fica
  --    parada no índice único até esta transação terminar.
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
    -- ── Compra única antiga (vitalício) — igual à Fase 1 ──────────────────────
    if v_email is null then
      raise exception 'billing_apply_event: pagamento sem e-mail' using errcode = '22023';
    end if;

    if v_tx is not null then
      insert into public.billing_transactions
        (gateway, gateway_transaction_id, status, paid_event_key, paid_at)
      values (v_gateway, v_tx, 'paid', v_key, now())
      on conflict (gateway, gateway_transaction_id) do nothing;

      select * into v_txrow
        from public.billing_transactions
       where gateway = v_gateway and gateway_transaction_id = v_tx
         for update;

      if v_txrow.status = 'revoked' then
        v_status := 'ignored';
        v_result := jsonb_build_object('outcome', 'already_revoked');
      else
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
      insert into public.tokens (token, email, customer_name, order_id, active)
      values (gen_random_uuid(), v_email, v_name, null, true)
      returning id::text into v_token_id;
      v_active := true;
      v_result := jsonb_build_object('outcome', 'token_created');
    end if;

    if v_token_id is not null then
      v_result := v_result || jsonb_build_object('token_id', v_token_id);
      if v_active then
        insert into public.email_outbox (business_key, template, token_id)
        values ('access_email:token:' || v_token_id, 'access_granted', v_token_id)
        on conflict (business_key) do nothing;
        v_result := v_result || jsonb_build_object('email_key', 'access_email:token:' || v_token_id);
      else
        v_result := v_result || jsonb_build_object('token_active', false);
      end if;
    end if;

  elsif v_action = 'subscription_charge' then
    -- ── Cobrança de assinatura paga (1ª ou renovação) ─────────────────────────
    -- Chega duas vezes por cobrança (TRANSACTION_PAID e SUBSCRIPTION_STARTED/
    -- RENEWED), com chaves de evento diferentes: o efeito é chaveado pela
    -- transação e pela assinatura, então a segunda só confirma.
    if v_tx is null or v_sub is null or v_email is null or v_plan is null or v_occurred is null
       or v_plan not in ('mensal', 'trimestral', 'anual') then
      raise exception 'billing_apply_event: cobrança de assinatura incompleta' using errcode = '22023';
    end if;

    if v_period_end is null and v_start_at is not null and v_icount is not null and v_cycle is not null then
      v_period_end := v_start_at + case v_itype
        when 'DAYS'   then make_interval(days   => v_icount * v_cycle)
        when 'WEEKS'  then make_interval(weeks  => v_icount * v_cycle)
        when 'MONTHS' then make_interval(months => v_icount * v_cycle)
        when 'YEARS'  then make_interval(years  => v_icount * v_cycle)
      end;
    end if;

    if v_period_end is null then
      -- Sem como saber até quando vale: não libera (o outro evento da mesma
      -- cobrança traz nextChargeAt e libera)
      v_status := 'ignored';
      v_result := jsonb_build_object('outcome', 'no_period');
    else
      insert into public.billing_transactions
        (gateway, gateway_transaction_id, kind, status, gateway_subscription_id, cycle, period_end, paid_event_key, paid_at)
      values (v_gateway, v_tx, 'subscription', 'paid', v_sub, v_cycle, v_period_end, v_key, now())
      on conflict (gateway, gateway_transaction_id) do update
        set kind                    = 'subscription',
            gateway_subscription_id = coalesce(billing_transactions.gateway_subscription_id, excluded.gateway_subscription_id),
            cycle                   = coalesce(billing_transactions.cycle, excluded.cycle),
            period_end              = greatest(billing_transactions.period_end, excluded.period_end),
            paid_event_key          = coalesce(billing_transactions.paid_event_key, excluded.paid_event_key),
            paid_at                 = coalesce(billing_transactions.paid_at, excluded.paid_at),
            updated_at              = now()
      returning * into v_txrow;

      if v_txrow.status = 'revoked' then
        -- O estorno desta cobrança chegou antes: não libera
        v_status := 'ignored';
        v_result := jsonb_build_object('outcome', 'already_revoked');
      else
        insert into public.billing_subscriptions
          (gateway, gateway_subscription_id, gateway_customer_id, plan, status, status_changed_at, last_cycle)
        values (v_gateway, v_sub, v_customer, v_plan, 'active', v_occurred, v_cycle)
        on conflict (gateway, gateway_subscription_id) do nothing;

        select * into v_subrow
          from public.billing_subscriptions
         where gateway = v_gateway and gateway_subscription_id = v_sub
           for update;

        update public.billing_subscriptions s
           set status            = case when v_occurred > s.status_changed_at
                                          or (v_occurred = s.status_changed_at and s.status in ('active', 'past_due'))
                                        then 'active' else s.status end,
               status_changed_at = case when v_occurred > s.status_changed_at then v_occurred else s.status_changed_at end,
               paid_until        = (select max(bt.period_end) from public.billing_transactions bt
                                     where bt.gateway = v_gateway and bt.gateway_subscription_id = v_sub
                                       and bt.status = 'paid'),
               plan              = coalesce(v_plan, s.plan),
               gateway_customer_id = coalesce(s.gateway_customer_id, v_customer),
               last_cycle        = greatest(s.last_cycle, v_cycle),
               updated_at        = now()
         where s.id = v_subrow.id
        returning * into v_subrow;

        -- Token: o desta assinatura; senão o do mesmo cliente (reassinatura);
        -- senão um novo. Compra antiga nunca entra aqui (access_type).
        v_token_id := v_subrow.token_id;
        if v_token_id is null then
          if v_customer is not null then
            select t.id::text into v_token_id
              from public.tokens t
             where t.access_type = 'subscription' and t.gateway_customer_id = v_customer;
          end if;
          if v_token_id is null then
            insert into public.tokens
              (token, email, customer_name, order_id, active, access_type, plan, gateway_customer_id, paid_until, expires_at)
            values (
              gen_random_uuid(), v_email, v_name, null, true, 'subscription', v_plan, v_customer, v_subrow.paid_until,
              coalesce(public.billing_access_end(v_subrow.status, v_subrow.paid_until, v_subrow.status_changed_at), now())
            )
            on conflict (gateway_customer_id) where access_type = 'subscription' and gateway_customer_id is not null
            do nothing
            returning id::text into v_token_id;
            if v_token_id is null then
              -- Outra assinatura do mesmo cliente criou o token agora há pouco
              select t.id::text into v_token_id
                from public.tokens t
               where t.access_type = 'subscription' and t.gateway_customer_id = v_customer;
            else
              v_created := true;
            end if;
          end if;
          update public.billing_subscriptions set token_id = v_token_id, updated_at = now()
           where id = v_subrow.id;
        end if;

        perform public.billing_refresh_subscription_token(v_token_id);

        update public.billing_transactions
           set token_id = v_token_id, updated_at = now()
         where id = v_txrow.id and token_id is distinct from v_token_id;

        select coalesce(t.active, false), t.expires_at into v_active, v_expires
          from public.tokens t where t.id::text = v_token_id;

        v_result := jsonb_build_object(
          'outcome', case when v_created then 'token_created' else 'subscription_charged' end,
          'token_id', v_token_id, 'subscription_id', v_sub, 'plan', v_plan,
          'paid_until', (select paid_until from public.billing_subscriptions where id = v_subrow.id));

        -- Um e-mail de acesso por assinatura (renovação não manda outro), e só
        -- se o acesso estiver valendo agora
        if v_active and v_expires > now() then
          insert into public.email_outbox (business_key, template, token_id)
          values ('access_email:subscription:' || v_sub, 'access_granted', v_token_id)
          on conflict (business_key) do nothing;
          v_result := v_result || jsonb_build_object('email_key', 'access_email:subscription:' || v_sub);
        end if;
      end if;
    end if;

  elsif v_action = 'subscription_status' then
    -- ── Renovação pendente, expiração ou cancelamento ─────────────────────────
    if v_sub is null or v_occurred is null or coalesce(v_new_status, '') not in ('past_due', 'expired', 'canceled') then
      raise exception 'billing_apply_event: status de assinatura incompleto' using errcode = '22023';
    end if;

    insert into public.billing_subscriptions
      (gateway, gateway_subscription_id, gateway_customer_id, plan, status, status_changed_at)
    values (v_gateway, v_sub, v_customer,
            case when v_plan in ('mensal', 'trimestral', 'anual') then v_plan end,
            v_new_status, v_occurred)
    on conflict (gateway, gateway_subscription_id) do nothing
    returning id into v_inserted;

    if v_inserted is not null then
      -- Assinatura ainda sem cobrança registrada: guarda o status (uma cobrança
      -- mais antiga que chegar depois não reverte)
      v_result := jsonb_build_object('outcome', 'status_recorded', 'status', v_new_status);
    else
      select * into v_subrow
        from public.billing_subscriptions
       where gateway = v_gateway and gateway_subscription_id = v_sub
         for update;

      if v_subrow.status = 'revoked' or v_occurred < v_subrow.status_changed_at then
        -- Estornada (só uma nova cobrança reativa) ou evento mais velho que o status atual
        v_status := 'ignored';
        v_result := jsonb_build_object('outcome', 'stale', 'status', v_subrow.status);
      else
        update public.billing_subscriptions
           set status = v_new_status, status_changed_at = v_occurred, updated_at = now()
         where id = v_subrow.id;
        if v_subrow.token_id is not null then
          perform public.billing_refresh_subscription_token(v_subrow.token_id);
        end if;
        v_result := jsonb_build_object('outcome', 'status_changed', 'status', v_new_status,
                                       'token_id', v_subrow.token_id);
      end if;
    end if;

  else -- revoke
    -- ── Estorno / chargeback ──────────────────────────────────────────────────
    if v_tx is null then
      raise exception 'billing_apply_event: revogação sem transaction_id' using errcode = '22023';
    end if;

    insert into public.billing_transactions
      (gateway, gateway_transaction_id, kind, status, gateway_subscription_id, revoked_event_type, revoked_at)
    values (v_gateway, v_tx, case when v_sub is not null then 'subscription' else 'one_time' end,
            'revoked', v_sub, v_type, now())
    on conflict (gateway, gateway_transaction_id) do update
      set status                  = 'revoked',
          gateway_subscription_id = coalesce(billing_transactions.gateway_subscription_id, excluded.gateway_subscription_id),
          kind                    = case when coalesce(billing_transactions.gateway_subscription_id, excluded.gateway_subscription_id) is not null
                                         then 'subscription' else billing_transactions.kind end,
          revoked_event_type      = coalesce(billing_transactions.revoked_event_type, excluded.revoked_event_type),
          revoked_at              = coalesce(billing_transactions.revoked_at, excluded.revoked_at),
          updated_at              = now()
    returning * into v_txrow;

    -- Compra única: mesmo efeito de antes (tokens de assinatura não têm order_id)
    update public.tokens set active = false where order_id = v_tx and active;
    get diagnostics v_count = row_count;

    update public.email_outbox
       set status = 'canceled', updated_at = now()
     where status in ('pending', 'failed')
       and token_id in (select t.id::text from public.tokens t where t.order_id = v_tx);

    -- Assinatura: o acesso termina agora (só uma cobrança nova reativa)
    if v_txrow.gateway_subscription_id is not null then
      insert into public.billing_subscriptions
        (gateway, gateway_subscription_id, status, status_changed_at)
      values (v_gateway, v_txrow.gateway_subscription_id, 'revoked', now())
      on conflict (gateway, gateway_subscription_id) do update
        set status            = 'revoked',
            status_changed_at = greatest(billing_subscriptions.status_changed_at, now()),
            updated_at        = now()
      returning * into v_subrow;

      if v_subrow.token_id is not null then
        perform public.billing_refresh_subscription_token(v_subrow.token_id);
        v_count := v_count + 1;
      end if;

      update public.email_outbox
         set status = 'canceled', updated_at = now()
       where status in ('pending', 'failed')
         and business_key = 'access_email:subscription:' || v_txrow.gateway_subscription_id;
    end if;

    v_result := jsonb_build_object('outcome', 'revoked', 'tokens_revoked', v_count,
                                   'subscription_id', v_txrow.gateway_subscription_id);
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

-- ── 7. Segurança ─────────────────────────────────────────────────────────────
alter table public.billing_subscriptions enable row level security;
revoke all on table public.billing_subscriptions from anon, authenticated;

revoke all on function public.billing_apply_event(jsonb)                     from public, anon, authenticated;
revoke all on function public.billing_access_end(text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.billing_refresh_subscription_token(text)       from public, anon, authenticated;
-- (tokens_protect_legacy é função de trigger: não pode ser chamada diretamente)

grant execute on function public.billing_apply_event(jsonb)                     to service_role;
grant execute on function public.billing_access_end(text, timestamptz, timestamptz) to service_role;
grant execute on function public.billing_refresh_subscription_token(text)       to service_role;

commit;

notify pgrst, 'reload schema';

-- ── Conferência (rode ANTES e DEPOIS) ─────────────────────────────────────────
-- 1. Os mesmos números de antes, e todos como legacy_purchase:
--      select access_type, active, (expires_at is null) as vitalicio, count(*)
--        from public.tokens group by 1, 2, 3 order by 1, 2, 3;
-- 2. Funções fora do alcance da anon key — deve voltar vazio:
--      select routine_name, grantee from information_schema.routine_privileges
--       where routine_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC')
--         and routine_name in ('billing_apply_event', 'billing_access_end',
--                              'billing_refresh_subscription_token');
--
-- ── Reverter (depois de voltar o código anterior) ─────────────────────────────
-- Rode de novo a migration 20261125_billing_idempotency.sql inteira (volta a
-- billing_apply_event da Fase 1) e então:
--   drop trigger  if exists tokens_protect_legacy on public.tokens;
--   drop function if exists public.tokens_protect_legacy();
--   drop function if exists public.billing_refresh_subscription_token(text);
--   drop function if exists public.billing_access_end(text, timestamptz, timestamptz);
--   alter table if exists public.billing_subscriptions rename to billing_subscriptions_revertido;
-- As colunas novas de tokens podem ficar (o código anterior as ignora). Tokens
-- de assinatura mantêm expires_at, que o código anterior respeita.
