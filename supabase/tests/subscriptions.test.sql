-- Testes de supabase/migrations/20261127_subscriptions.sql (assinaturas)
-- contra um Postgres real. Rodar com run-billing-tests.sh (banco descartável),
-- depois de billing_idempotency.test.sql.

\set ON_ERROR_STOP 1

-- Cobrança de assinatura no formato canônico de api/_lib/wivenEvents.ts
create function pg_temp.charge(
  p_type text, p_tx text, p_sub text, p_customer text, p_plan text,
  p_period_end timestamptz, p_occurred timestamptz,
  p_email text default 'assinante@example.com',
  p_start timestamptz default null, p_cycle int default null,
  p_itype text default null, p_icount int default null
) returns jsonb language sql as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'gateway', 'wiven', 'event_key', p_type || ':' || p_tx, 'event_type', p_type,
    'action', 'subscription_charge', 'transaction_id', p_tx, 'subscription_id', p_sub,
    'customer_id', p_customer, 'plan', p_plan, 'period_end', p_period_end, 'occurred_at', p_occurred,
    'email', p_email, 'name', 'Assinante', 'start_at', p_start, 'cycle', p_cycle,
    'interval_type', p_itype, 'interval_count', p_icount))
$$;

create function pg_temp.status_evt(p_type text, p_sub text, p_status text, p_occurred timestamptz)
returns jsonb language sql as $$
  select jsonb_build_object(
    'gateway', 'wiven', 'event_key', p_type || ':' || p_sub || ':' || p_occurred::text, 'event_type', p_type,
    'action', 'subscription_status', 'subscription_id', p_sub, 'status', p_status, 'occurred_at', p_occurred)
$$;

create function pg_temp.refund(p_tx text, p_sub text, p_type text default 'TRANSACTION_REFUNDED')
returns jsonb language sql as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'gateway', 'wiven', 'event_key', p_type || ':' || p_tx, 'event_type', p_type,
    'action', 'revoke', 'transaction_id', p_tx, 'subscription_id', p_sub))
$$;

set role service_role;

-- ── Clientes antigos depois da migration de assinaturas ──────────────────────
do $$ begin
  assert (select count(*) from public.tokens t join public.test_legacy_snapshot s using (id)
           where t.access_type = 'legacy_purchase' and t.plan is null and t.expires_at is null
             and t.gateway_customer_id is null and t.paid_until is null
             and t.active = s.active and t.token = s.token and t.email is not distinct from s.email) = 3,
    'os 3 clientes antigos viram legacy_purchase, sem expiração, sem mudar nada';
  assert not exists (select 1 from public.tokens where access_type <> 'legacy_purchase'), 'nenhuma assinatura antes de vender';
end $$;
\echo 'ok - Teste 7: depois da migration, todo cliente antigo é legacy_purchase e vitalício'

do $$
declare legacy uuid := '11111111-1111-4111-8111-111111111111'; blocked int := 0;
begin
  assert exists (select 1 from public.tokens where token = legacy), 'cliente antigo de teste existe';
  -- Mesmo com plano e expiração (que passariam na CHECK), o trigger barra
  begin
    update public.tokens set access_type = 'subscription', plan = 'mensal', expires_at = now() + interval '30 days'
     where token = legacy;
  exception when check_violation then blocked := blocked + 1; end;
  begin
    update public.tokens set plan = 'mensal' where token = legacy;
  exception when check_violation then blocked := blocked + 1; end;
  assert blocked = 2, 'compra antiga não vira assinatura nem ganha plano';
  assert (select access_type from public.tokens where token = legacy) = 'legacy_purchase', 'continua legacy';
  assert (select expires_at from public.tokens where token = legacy) is null, 'continua vitalício';
end $$;
\echo 'ok - o banco recusa transformar um cliente antigo em assinante'

-- ── Teste 8: novo assinante ──────────────────────────────────────────────────
do $$
declare r jsonb; p jsonb; t public.tokens%rowtype; period timestamptz := now() + interval '30 days';
begin
  r := public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s1', 'sub-1', 'cli-1', 'mensal', period, now()));
  assert r->>'outcome' = 'token_created', 'primeira cobrança cria o token';
  select * into t from public.tokens where gateway_customer_id = 'cli-1';
  assert t.access_type = 'subscription' and t.plan = 'mensal' and t.order_id is null, 'token de assinatura mensal';
  assert t.paid_until = period, 'válido até a próxima cobrança';
  assert t.expires_at = period + interval '7 days', 'acesso até a próxima cobrança + rede de 7 dias';
  assert r->>'email_key' = 'access_email:subscription:sub-1', 'e-mail de acesso na fila';

  -- O TRANSACTION_PAID da MESMA cobrança chega depois, sem nextChargeAt
  p := public.billing_apply_event(pg_temp.charge('TRANSACTION_PAID', 'tx-s1', 'sub-1', 'cli-1', 'mensal', null, now(),
                                                 p_start => now(), p_cycle => 1, p_itype => 'MONTHS', p_icount => 1));
  assert p->>'outcome' = 'subscription_charged' and (p->>'duplicate')::boolean = false, 'segundo aviso só confirma';
  assert (select count(*) from public.tokens where gateway_customer_id = 'cli-1') = 1, 'um token só';
  assert (select count(*) from public.billing_transactions where gateway_transaction_id = 'tx-s1') = 1, 'uma transação só';
  assert (select count(*) from public.email_outbox where business_key like 'access_email:subscription:sub-1') = 1, 'um e-mail só';
  assert (select paid_until from public.tokens where gateway_customer_id = 'cli-1')
         = greatest(period, now() + interval '1 month'), 'fim do período = o maior entre os dois avisos';
end $$;
\echo 'ok - Teste 8: assinatura libera acesso até a próxima cobrança; os dois avisos da cobrança dão um token e um e-mail'

do $$
declare a jsonb; b jsonb;
begin
  -- Ordem trocada: TRANSACTION_PAID primeiro
  a := public.billing_apply_event(pg_temp.charge('TRANSACTION_PAID', 'tx-s2', 'sub-2', 'cli-2', 'anual', null, now(),
                                                 p_start => now(), p_cycle => 1, p_itype => 'YEARS', p_icount => 1));
  b := public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s2', 'sub-2', 'cli-2', 'anual', now() + interval '1 year', now()));
  assert a->>'outcome' = 'token_created' and b->>'outcome' = 'subscription_charged', 'quem chega primeiro cria';
  assert (select count(*) from public.tokens where gateway_customer_id = 'cli-2') = 1, 'um token só';
  assert (select count(*) from public.email_outbox where business_key = 'access_email:subscription:sub-2') = 1, 'um e-mail só';
  assert (select plan from public.tokens where gateway_customer_id = 'cli-2') = 'anual', 'plano anual';
  assert (select paid_until from public.tokens where gateway_customer_id = 'cli-2') = now() + interval '1 year', 'válido por um ano';
  assert (select id from public.tokens where gateway_customer_id = 'cli-1') <> (select id from public.tokens where gateway_customer_id = 'cli-2'),
    'clientes diferentes, tokens diferentes';
end $$;
\echo 'ok - aviso de pagamento antes do aviso de assinatura: mesmo resultado'

-- ── Teste 9: renovações fora de ordem ────────────────────────────────────────
do $$
declare d jsonb;
begin
  perform public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_RENEWED', 'tx-s3-c3', 'sub-3', 'cli-3', 'mensal', now() + interval '30 days', now()));
  perform public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s3-c1', 'sub-3', 'cli-3', 'mensal', now() - interval '30 days', now() - interval '60 days'));
  perform public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_RENEWED', 'tx-s3-c2', 'sub-3', 'cli-3', 'mensal', now(), now() - interval '30 days'));
  d := public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_RENEWED', 'tx-s3-c2', 'sub-3', 'cli-3', 'mensal', now(), now() - interval '30 days'));
  assert (d->>'duplicate')::boolean, 'renovação repetida é duplicada';
  assert (select paid_until from public.tokens where gateway_customer_id = 'cli-3') = now() + interval '30 days', 'vale o maior período, qualquer ordem';
  assert (select status from public.billing_subscriptions where gateway_subscription_id = 'sub-3') = 'active', 'ativa';
  assert (select count(*) from public.tokens where gateway_customer_id = 'cli-3') = 1, 'um token';
  assert (select count(*) from public.email_outbox where business_key = 'access_email:subscription:sub-3') = 1, 'renovação não manda outro e-mail';
end $$;
\echo 'ok - Teste 9: renovações em qualquer ordem dão o mesmo período; renovação não manda e-mail'

do $$
declare r jsonb; tid uuid;
begin
  -- Cobrança de 35 dias atrás, vencida há 5 dias: ainda dentro da rede de segurança
  perform public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s4-c1', 'sub-4', 'cli-4', 'mensal', now() - interval '5 days', now() - interval '35 days'));
  select id into tid from public.tokens where gateway_customer_id = 'cli-4';
  assert (select expires_at from public.tokens where id = tid) = now() + interval '2 days', 'rede de segurança: vencimento + 7 dias';

  r := public.billing_apply_event(pg_temp.status_evt('SUBSCRIPTION_RENEWAL_PENDING', 'sub-4', 'past_due', now() - interval '5 days'));
  assert r->>'outcome' = 'status_changed', 'renovação pendente registrada';
  assert (select expires_at from public.tokens where id = tid) > now(), 'com renovação pendente o acesso continua';

  r := public.billing_apply_event(pg_temp.status_evt('SUBSCRIPTION_EXPIRED', 'sub-4', 'expired', now() - interval '2 days'));
  assert (select expires_at from public.tokens where id = tid) = now() - interval '2 days', 'expirou: o acesso termina na hora da expiração';

  -- Renovação ANTIGA que chega atrasada não reabre o acesso
  r := public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_RENEWED', 'tx-s4-velha', 'sub-4', 'cli-4', 'mensal', now() + interval '20 days', now() - interval '10 days'));
  assert (select status from public.billing_subscriptions where gateway_subscription_id = 'sub-4') = 'expired', 'continua expirada';
  assert (select expires_at from public.tokens where id = tid) <= now(), 'aviso antigo não reabre o acesso';
  -- Um aviso de expiração antigo também não muda nada
  r := public.billing_apply_event(pg_temp.status_evt('SUBSCRIPTION_RENEWAL_PENDING', 'sub-4', 'past_due', now() - interval '20 days'));
  assert r->>'outcome' = 'stale', 'status antigo é ignorado';

  -- Pagou a renovação pelo link depois: reabre
  r := public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_RENEWED', 'tx-s4-c2', 'sub-4', 'cli-4', 'mensal', now() + interval '25 days', now()));
  assert (select status from public.billing_subscriptions where gateway_subscription_id = 'sub-4') = 'active', 'reativada';
  assert (select expires_at from public.tokens where id = tid) = now() + interval '32 days', 'acesso volta até a nova cobrança + 7';
  assert (select count(*) from public.tokens where gateway_customer_id = 'cli-4') = 1, 'mesmo token';
end $$;
\echo 'ok - Teste 9: renovação pendente mantém, expiração corta, aviso antigo não reabre, renovação nova reabre'

do $$
declare tid uuid; r jsonb;
begin
  perform public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s5', 'sub-5', 'cli-5', 'trimestral', now(), now() - interval '3 months'));
  select id into tid from public.tokens where gateway_customer_id = 'cli-5';
  assert (select expires_at from public.tokens where id = tid) = now() + interval '7 days', 'antes do aviso, a rede de segurança';
  -- A Wiven só manda o cancelamento quando o período pago termina
  r := public.billing_apply_event(pg_temp.status_evt('SUBSCRIPTION_CANCELED', 'sub-5', 'canceled', now()));
  assert (select expires_at from public.tokens where id = tid) = now(), 'cancelada: o acesso termina no fim do período';
  assert (select plan from public.tokens where id = tid) = 'trimestral', 'plano trimestral';
end $$;
\echo 'ok - cancelamento encerra o acesso no fim do período pago'

-- ── Teste 10: reembolso de mensalidade ───────────────────────────────────────
do $$
declare tid uuid; r1 jsonb; r2 jsonb; r3 jsonb;
begin
  perform public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s6', 'sub-6', 'cli-6', 'mensal', now() + interval '30 days', now()));
  select id into tid from public.tokens where gateway_customer_id = 'cli-6';
  r1 := public.billing_apply_event(pg_temp.refund('tx-s6', 'sub-6'));
  r2 := public.billing_apply_event(pg_temp.refund('tx-s6', 'sub-6'));
  assert r1->>'outcome' = 'revoked' and (r1->>'tokens_revoked')::int = 1, 'reembolso revoga';
  assert (r2->>'duplicate')::boolean, 'reembolso repetido é duplicado';
  assert (select expires_at from public.tokens where id = tid) <= now(), 'acesso cortado na hora';
  assert (select status from public.email_outbox where business_key = 'access_email:subscription:sub-6') = 'canceled', 'e-mail pendente não sai';

  -- O cancelamento que chega depois (fim do período) não devolve o acesso
  r3 := public.billing_apply_event(pg_temp.status_evt('SUBSCRIPTION_CANCELED', 'sub-6', 'canceled', now() + interval '30 days'));
  assert r3->>'outcome' = 'stale', 'estorno não é desfeito por um status';
  assert (select expires_at from public.tokens where id = tid) <= now(), 'continua sem acesso';
  -- O aviso de pagamento da cobrança estornada também não
  r3 := public.billing_apply_event(pg_temp.charge('TRANSACTION_PAID', 'tx-s6', 'sub-6', 'cli-6', 'mensal', now() + interval '30 days', now()));
  assert r3->>'outcome' = 'already_revoked', 'cobrança estornada não libera';

  -- Só uma cobrança NOVA, depois do estorno, reativa
  r3 := public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_RENEWED', 'tx-s6-nova', 'sub-6', 'cli-6', 'mensal', now() + interval '31 days', now() + interval '1 hour'));
  assert (select expires_at from public.tokens where id = tid) = now() + interval '38 days', 'nova cobrança paga reativa';
end $$;
\echo 'ok - Teste 10: reembolso corta na hora, repetido não duplica, cancelamento posterior não devolve o acesso'

do $$
declare r jsonb;
begin
  -- Estorno chega antes do aviso de pagamento
  r := public.billing_apply_event(pg_temp.refund('tx-s7', 'sub-7'));
  r := public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s7', 'sub-7', 'cli-7', 'mensal', now() + interval '30 days', now()));
  assert r->>'outcome' = 'already_revoked', 'não libera';
  assert not exists (select 1 from public.tokens where gateway_customer_id = 'cli-7'), 'nenhum token';
  assert not exists (select 1 from public.email_outbox where business_key = 'access_email:subscription:sub-7'), 'nenhum e-mail';
end $$;
\echo 'ok - Teste 9: estorno que chega antes do pagamento impede o acesso'

-- ── Reassinatura: mesmo token ────────────────────────────────────────────────
do $$
declare tid uuid; r jsonb;
begin
  perform public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s8a', 'sub-8a', 'cli-8', 'mensal', now() - interval '10 days', now() - interval '40 days'));
  perform public.billing_apply_event(pg_temp.status_evt('SUBSCRIPTION_CANCELED', 'sub-8a', 'canceled', now() - interval '10 days'));
  select id into tid from public.tokens where gateway_customer_id = 'cli-8';
  assert (select expires_at from public.tokens where id = tid) <= now(), 'assinatura antiga encerrada';

  r := public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s8b', 'sub-8b', 'cli-8', 'anual', now() + interval '1 year', now()));
  assert r->>'outcome' = 'subscription_charged' and r->>'token_id' = tid::text, 'volta com o mesmo token';
  assert (select count(*) from public.tokens where gateway_customer_id = 'cli-8') = 1, 'um token por cliente';
  assert (select plan from public.tokens where id = tid) = 'anual', 'plano atualizado';
  assert (select expires_at from public.tokens where id = tid) = now() + interval '1 year 7 days', 'acesso da assinatura nova';
  assert r->>'email_key' = 'access_email:subscription:sub-8b', 'e-mail da assinatura nova';
end $$;
\echo 'ok - quem reassina volta com o mesmo token e o plano novo'

-- ── Casos de borda ───────────────────────────────────────────────────────────
do $$
declare r jsonb;
begin
  -- Aviso de pagamento sem ciclo nem próxima cobrança: não dá para saber até quando vale
  r := public.billing_apply_event(pg_temp.charge('TRANSACTION_PAID', 'tx-s10', 'sub-10', 'cli-10', 'mensal', null, now()));
  assert r->>'outcome' = 'no_period', 'não libera sem período';
  assert not exists (select 1 from public.tokens where gateway_customer_id = 'cli-10'), 'nenhum token';

  -- Expiração chega antes de qualquer cobrança; depois chega a cobrança antiga
  r := public.billing_apply_event(pg_temp.status_evt('SUBSCRIPTION_EXPIRED', 'sub-11', 'expired', now() - interval '1 day'));
  assert r->>'outcome' = 'status_recorded', 'status guardado';
  r := public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s11', 'sub-11', 'cli-11', 'mensal', now() - interval '1 day', now() - interval '31 days'));
  assert (select expires_at from public.tokens where gateway_customer_id = 'cli-11') <= now(), 'cobrança antiga não libera assinatura já expirada';
  assert r->>'email_key' is null, 'nem manda e-mail de acesso';

  -- Assinante com o mesmo e-mail de um cliente antigo: token separado, antigo intacto
  perform public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-s12', 'sub-12', 'cli-12', 'mensal', now() + interval '30 days', now(), 'antigo@example.com'));
  assert (select access_type from public.tokens where token = '11111111-1111-4111-8111-111111111111') = 'legacy_purchase', 'antigo continua antigo';
  assert (select count(*) from public.tokens where email = 'antigo@example.com') = 2, 'assinatura tem token próprio';
end $$;
\echo 'ok - sem período não libera; cobrança antiga não reabre; cliente antigo que assina não perde o vitalício'

do $$
declare n int := 0;
begin
  begin
    insert into public.tokens (token, email, access_type, plan) values (gen_random_uuid(), 'x@example.com', 'subscription', 'mensal');
  exception when check_violation then n := n + 1; end;
  begin
    perform public.billing_apply_event(pg_temp.charge('SUBSCRIPTION_STARTED', 'tx-bad', 'sub-bad', 'cli-bad', 'semanal', now() + interval '7 days', now()));
  exception when invalid_parameter_value then n := n + 1; end;
  begin
    perform public.billing_apply_event(pg_temp.status_evt('SUBSCRIPTION_EXPIRED', 'sub-bad', 'apagada', now()));
  exception when invalid_parameter_value then n := n + 1; end;
  assert n = 3, 'token de assinatura sem expiração, plano desconhecido e status desconhecido são recusados';
end $$;
\echo 'ok - assinatura nunca fica sem data de fim; plano e status desconhecidos são recusados'

reset role;
set role anon;
do $$
declare denied int := 0;
begin
  begin perform 1 from public.billing_subscriptions;
  exception when insufficient_privilege then denied := denied + 1; end;
  begin perform public.billing_refresh_subscription_token('x');
  exception when insufficient_privilege then denied := denied + 1; end;
  begin perform public.billing_access_end('active', now(), now());
  exception when insufficient_privilege then denied := denied + 1; end;
  assert denied = 3, format('anon fora das assinaturas (negados: %s de 3)', denied);
end $$;
reset role;
\echo 'ok - anon não lê assinaturas nem chama as funções novas'
