-- Testes das funções de supabase/migrations/20261125_billing_idempotency.sql
-- contra um Postgres real. Rodar com run-billing-tests.sh (banco descartável).
-- Cada bloco falha com ASSERT; o script para no primeiro erro.

\set ON_ERROR_STOP 1

-- Evento canônico, no formato que api/_lib/wivenEvents.ts produz
create function pg_temp.evt(p_type text, p_tx text, p_email text default 'novo@example.com',
                            p_action text default 'grant', p_key text default null)
returns jsonb language sql as $$
  select jsonb_build_object(
    'gateway', 'wiven',
    'event_key', coalesce(p_key, p_type || ':' || p_tx),
    'event_type', p_type,
    'action', p_action,
    'transaction_id', p_tx,
    'email', p_email,
    'name', 'Maria Silva')
$$;

-- Falha simulada no meio do processamento (Teste 3): o insert do token quebra
create function public.test_fail_on_insert() returns trigger language plpgsql as $$
begin
  if new.email = 'falha@example.com' then
    raise exception 'falha simulada no meio do processamento';
  end if;
  return new;
end $$;
create trigger test_fail_on_insert before insert on public.tokens
  for each row execute function public.test_fail_on_insert();

-- ── Segurança ────────────────────────────────────────────────────────────────
set role anon;
do $$
declare denied int := 0;
begin
  begin perform public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-anon'));
  exception when insufficient_privilege then denied := denied + 1; end;
  begin perform public.email_outbox_claim('access_email:token:1');
  exception when insufficient_privilege then denied := denied + 1; end;
  begin perform public.billing_due_work(10);
  exception when insufficient_privilege then denied := denied + 1; end;
  begin perform 1 from public.billing_events;
  exception when insufficient_privilege then denied := denied + 1; end;
  begin perform 1 from public.email_outbox;
  exception when insufficient_privilege then denied := denied + 1; end;
  assert denied = 5, format('anon não pode chamar as funções nem ler as tabelas (negados: %s de 5)', denied);
end $$;
reset role;
\echo 'ok - anon não executa as funções nem lê as tabelas de pagamento'

-- Daqui em diante, como o servidor em produção
set role service_role;

-- ── Clientes antigos intactos depois da migration ────────────────────────────
-- Colunas que existiam antes das migrations (as novas são conferidas em subscriptions.test.sql)
create view pg_temp.tokens_original as
  select id, token, email, customer_name, order_id, active, created_at from public.tokens;

do $$ begin
  assert (select count(*) from (select * from pg_temp.tokens_original except select * from public.test_legacy_snapshot) d) = 0
     and (select count(*) from (select * from public.test_legacy_snapshot except select * from pg_temp.tokens_original) d) = 0,
    'a migration não altera nenhuma linha de tokens';
end $$;
\echo 'ok - Teste 7: a migration não toca em nenhum cliente antigo'

-- ── Teste 1: webhook duplicado ───────────────────────────────────────────────
do $$
declare r1 jsonb; r2 jsonb;
begin
  r1 := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-new-1'));
  r2 := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-new-1'));

  assert r1->>'outcome' = 'token_created' and (r1->>'duplicate')::boolean = false, '1ª entrega cria o token';
  assert (r2->>'duplicate')::boolean, '2ª entrega é reconhecida como duplicada';
  assert r2->>'token_id' = r1->>'token_id' and r2->>'email_key' = r1->>'email_key', 'duplicada devolve o mesmo resultado lógico';

  assert (select count(*) from public.billing_events where event_key = 'TRANSACTION_PAID:tx-new-1') = 1, 'evento registrado uma vez';
  assert (select status from public.billing_events where event_key = 'TRANSACTION_PAID:tx-new-1') = 'processed', 'evento processado';
  assert (select count(*) from public.tokens where order_id = 'tx-new-1') = 1, 'um token só';
  assert (select count(*) from public.billing_transactions where gateway_transaction_id = 'tx-new-1') = 1, 'uma transação só';
  assert (select count(*) from public.email_outbox where token_id = r1->>'token_id') = 1, 'um e-mail só na fila';
  assert (select token::text from public.tokens where order_id = 'tx-new-1')
         ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', 'token é UUID v4';
end $$;
\echo 'ok - Teste 1: o mesmo evento duas vezes gera um evento, um token, uma transação e um e-mail'

-- ── Dois eventos DIFERENTES sobre o mesmo pagamento ──────────────────────────
-- A proteção dos efeitos não pode depender só do id do evento
do $$
declare r1 jsonb; r2 jsonb;
begin
  r1 := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-two', 'novo@example.com', 'grant', 'evento-A'));
  r2 := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-two', 'novo@example.com', 'grant', 'evento-B'));
  assert r1->>'outcome' = 'token_created', '1º evento libera';
  assert r2->>'outcome' = 'token_exists' and (r2->>'duplicate')::boolean = false, '2º evento é novo, mas o pagamento não';
  assert (select count(*) from public.billing_events where event_key in ('evento-A', 'evento-B')) = 2, 'dois eventos registrados';
  assert (select count(*) from public.tokens where order_id = 'tx-two') = 1, 'um token só';
  assert (select count(*) from public.billing_transactions where gateway_transaction_id = 'tx-two') = 1, 'uma transação só';
  assert (select count(*) from public.email_outbox where token_id = r1->>'token_id') = 1, 'um e-mail só';
end $$;
\echo 'ok - dois eventos diferentes do mesmo pagamento: um token, uma transação, um e-mail'

-- ── Teste 3: falha durante o processamento e retomada ────────────────────────
do $$
declare failed boolean := false;
begin
  begin
    perform public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-fail', 'falha@example.com'));
  exception when others then failed := true;
  end;
  assert failed, 'a falha chega a quem chamou';
  -- Nada fica pela metade: nem o evento como processado, nem a transação
  assert not exists (select 1 from public.billing_events where event_key = 'TRANSACTION_PAID:tx-fail'), 'evento não fica gravado pela metade';
  assert not exists (select 1 from public.billing_transactions where gateway_transaction_id = 'tx-fail'), 'transação não fica gravada pela metade';
  assert not exists (select 1 from public.tokens where order_id = 'tx-fail'), 'nenhum token';

  -- O webhook registra a falha para o cron
  perform public.billing_record_failure(pg_temp.evt('TRANSACTION_PAID', 'tx-fail', 'falha@example.com'), 'falha simulada');
  perform public.billing_record_failure(pg_temp.evt('TRANSACTION_PAID', 'tx-fail', 'falha@example.com'), 'falha simulada');
  assert (select status from public.billing_events where event_key = 'TRANSACTION_PAID:tx-fail') = 'failed', 'evento fica como failed';
  assert (select attempts from public.billing_events where event_key = 'TRANSACTION_PAID:tx-fail') = 2, 'tentativas contadas';
  -- Recém-falhado ainda não está na vez (espera 1 minuto)
  assert not (public.billing_due_work(50)->'events') @> jsonb_build_array(jsonb_build_object('transaction_id', 'tx-fail')), 'cron espera antes de tentar de novo';
end $$;

-- A causa da falha é corrigida
reset role;
drop trigger test_fail_on_insert on public.tokens;
set role service_role;

do $$
declare work jsonb; r jsonb; again jsonb;
begin
  update public.billing_events set updated_at = now() - interval '2 minutes' where event_key = 'TRANSACTION_PAID:tx-fail';
  work := public.billing_due_work(50);
  assert jsonb_array_length(work->'events') = 1, 'cron encontra o evento que falhou';
  assert (work->'events'->0->>'email') = 'falha@example.com', 'payload guardado permite reprocessar';

  r := public.billing_apply_event(work->'events'->0);
  assert r->>'outcome' = 'token_created' and (r->>'duplicate')::boolean = false, 'reprocessamento aplica os efeitos';
  again := public.billing_apply_event(work->'events'->0);
  assert (again->>'duplicate')::boolean, 'reentrega depois da recuperação é duplicada';

  assert (select status from public.billing_events where event_key = 'TRANSACTION_PAID:tx-fail') = 'processed', 'evento concluído';
  assert (select count(*) from public.tokens where order_id = 'tx-fail') = 1, 'um token só depois da retomada';
  assert jsonb_array_length(public.billing_due_work(50)->'events') = 0, 'nada mais pendente';

  -- Uma falha registrada depois (corrida) não rebaixa um evento concluído
  perform public.billing_record_failure(work->'events'->0, 'atrasada');
  assert (select status from public.billing_events where event_key = 'TRANSACTION_PAID:tx-fail') = 'processed', 'processed nunca volta a failed';
end $$;
\echo 'ok - Teste 3: falha no meio desfaz tudo; o evento fica guardado e a retomada não duplica'

-- ── Teste 9: eventos fora de ordem ───────────────────────────────────────────
do $$
declare r jsonb; d jsonb;
begin
  -- O estorno chega antes do pagamento
  r := public.billing_apply_event(pg_temp.evt('EVENTO_REEMBOLSO', 'tx-ooo', null, 'revoke'));
  assert r->>'outcome' = 'revoked', 'estorno registrado';
  r := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-ooo'));
  assert r->>'outcome' = 'already_revoked', 'pagamento atrasado não libera acesso';
  assert not exists (select 1 from public.tokens where order_id = 'tx-ooo'), 'nenhum token para venda estornada';
  assert (select status from public.billing_events where event_key = 'TRANSACTION_PAID:tx-ooo') = 'ignored', 'evento marcado como ignorado';
  assert (select status from public.billing_transactions where gateway_transaction_id = 'tx-ooo') = 'revoked', 'transação continua estornada';
  d := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-ooo'));
  assert (d->>'duplicate')::boolean and d->>'outcome' = 'already_revoked', 'reentrega também não libera';
end $$;
\echo 'ok - Teste 9: pagamento que chega depois do estorno não libera acesso'

-- ── Teste 10: reembolso duplicado ────────────────────────────────────────────
do $$
declare paid jsonb; r1 jsonb; r2 jsonb; r3 jsonb;
begin
  paid := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-ref'));
  r1 := public.billing_apply_event(pg_temp.evt('EVENTO_REEMBOLSO', 'tx-ref', null, 'revoke'));
  r2 := public.billing_apply_event(pg_temp.evt('EVENTO_REEMBOLSO', 'tx-ref', null, 'revoke'));
  -- Outro evento (chargeback) para a mesma venda
  r3 := public.billing_apply_event(pg_temp.evt('EVENTO_CHARGEBACK', 'tx-ref', null, 'revoke'));

  assert (r1->>'tokens_revoked')::int = 1, '1º reembolso desativa o token';
  assert (r2->>'duplicate')::boolean, 'reembolso repetido é duplicado';
  assert (r3->>'tokens_revoked')::int = 0, 'chargeback da mesma venda não tem mais o que desativar';
  assert (select count(*) from public.billing_transactions where gateway_transaction_id = 'tx-ref') = 1, 'uma transação só';
  assert (select revoked_event_type from public.billing_transactions where gateway_transaction_id = 'tx-ref') = 'EVENTO_REEMBOLSO', 'guarda o primeiro motivo';
  assert not (select active from public.tokens where order_id = 'tx-ref'), 'token inativo';
  -- O e-mail de acesso, ainda não enviado, deixa de sair
  assert (select status from public.email_outbox where token_id = paid->>'token_id') = 'canceled', 'e-mail pendente cancelado';
  assert public.email_outbox_claim(paid->>'email_key')->>'outcome' = 'canceled', 'nada a enviar';
end $$;
\echo 'ok - Teste 10: reembolso repetido tem um efeito só e cancela o e-mail pendente'

-- ── Teste 7: clientes antigos ────────────────────────────────────────────────
do $$
declare r1 jsonb; r2 jsonb; r3 jsonb;
begin
  -- Reentrega do pagamento de quem comprou antes da migration
  r1 := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-old-1', 'antigo@example.com'));
  r2 := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-old-1', 'antigo@example.com'));
  assert r1->>'outcome' = 'token_exists', 'reconhece o token já emitido';
  assert (select count(*) from public.tokens where order_id = 'tx-old-1') = 1, 'não emite outro token';
  assert (r2->>'duplicate')::boolean, 'segunda reentrega é duplicada';
  assert (select count(*) from public.email_outbox where token_id = r1->>'token_id') = 1, 'no máximo um e-mail';

  -- Cliente antigo estornado: a reentrega não reativa
  r3 := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-old-2', 'estornado@example.com'));
  assert r3->>'outcome' = 'token_exists' and (r3->>'token_active')::boolean = false, 'reconhece o token inativo';
  assert r3->>'email_key' is null, 'não envia e-mail para token inativo';

  -- Nenhum cliente antigo mudou depois de todos os testes acima
  assert (select count(*) from (select * from pg_temp.tokens_original where id in (select id from public.test_legacy_snapshot)
                                except select * from public.test_legacy_snapshot) d) = 0,
    'nenhum token antigo foi alterado';
end $$;
\echo 'ok - Teste 7: clientes antigos continuam iguais; reentrega não duplica nem reativa'

-- ── Sem transaction.id: a chave é o hash do payload ──────────────────────────
do $$
declare r1 jsonb; r2 jsonb;
begin
  r1 := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', null, 'semid@example.com', 'grant', 'TRANSACTION_PAID:sha256:abc'));
  r2 := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', null, 'semid@example.com', 'grant', 'TRANSACTION_PAID:sha256:abc'));
  assert r1->>'outcome' = 'token_created' and (r2->>'duplicate')::boolean, 'reentrega idêntica não cria outro token';
  assert (select count(*) from public.tokens where email = 'semid@example.com') = 1, 'um token só';
end $$;
\echo 'ok - venda sem transaction.id: reentrega idêntica não cria outro token'

-- ── Fila de e-mail ───────────────────────────────────────────────────────────
do $$
declare r jsonb; c1 jsonb; c2 jsonb; c3 jsonb; key text; idem uuid;
begin
  r := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-mail', 'mail@example.com'));
  key := r->>'email_key';

  c1 := public.email_outbox_claim(key);
  assert c1->>'outcome' = 'claimed', 'primeira reserva';
  assert c1->>'email' = 'mail@example.com' and c1->>'name' = 'Maria Silva', 'traz destinatário';
  assert c1->>'token' = (select token::text from public.tokens where order_id = 'tx-mail'), 'traz o token';
  assert public.email_outbox_claim(key)->>'outcome' = 'busy', 'segunda reserva simultânea não envia';

  -- Envio falhou: nova tentativa usa a MESMA chave de idempotência
  perform public.email_outbox_finish((c1->>'outbox_id')::bigint, false, null, 'timeout');
  c2 := public.email_outbox_claim(key);
  assert c2->>'outcome' = 'claimed' and c2->>'idempotency_key' = c1->>'idempotency_key', 'retentativa reutiliza a chave';

  -- Processo caiu com a reserva na mão: depois de 2 minutos outro retoma, mesma chave
  update public.email_outbox set claimed_at = now() - interval '3 minutes' where business_key = key;
  c3 := public.email_outbox_claim(key);
  assert c3->>'outcome' = 'claimed' and c3->>'idempotency_key' = c1->>'idempotency_key', 'reserva parada é retomada com a mesma chave';

  perform public.email_outbox_finish((c3->>'outbox_id')::bigint, true, 'resend-id-1', null);
  assert public.email_outbox_claim(key)->>'outcome' = 'sent', 'enviado não sai de novo';
  assert (select provider_message_id from public.email_outbox where business_key = key) = 'resend-id-1', 'guarda o id do Resend';

  -- Limite de tentativas
  r := public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-mail-2', 'mail2@example.com'));
  update public.email_outbox set attempts = 8, status = 'failed' where business_key = r->>'email_key';
  assert public.email_outbox_claim(r->>'email_key')->>'outcome' = 'exhausted', 'para depois de 8 tentativas';
  assert (public.billing_due_work(50)->'stuck'->>'emails')::int >= 1, 'cron aponta e-mails que esgotaram';

  assert public.email_outbox_claim('access_email:token:nao-existe')->>'outcome' = 'missing', 'chave inexistente';
  idem := (select idempotency_key from public.email_outbox where business_key = key);
  assert idem::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', 'chave de idempotência é UUID v4';

  -- Reenvio manual documentado no DEPLOY.md (mesmo SQL): volta para a fila, com chave nova
  update public.email_outbox
     set status = 'pending', attempts = 0, idempotency_key = gen_random_uuid(),
         last_error = null, updated_at = now() - interval '2 minutes'
   where token_id in (select id::text from public.tokens where order_id = 'tx-mail' and active);
  assert (public.billing_due_work(50)->'emails') ? key, 'o cron encontra o reenvio pedido';
  c1 := public.email_outbox_claim(key);
  assert c1->>'outcome' = 'claimed' and (c1->>'idempotency_key')::uuid <> idem, 'reenvio pedido sai com chave nova';
end $$;
\echo 'ok - fila de e-mail: uma reserva por vez, retentativa com a mesma chave, enviado não sai de novo'

-- ── Entrada inválida ─────────────────────────────────────────────────────────
do $$
declare n int := 0;
begin
  begin perform public.billing_apply_event('{"gateway":"wiven","event_key":"x","event_type":"X","action":"apagar"}');
  exception when invalid_parameter_value then n := n + 1; end;
  begin perform public.billing_apply_event(pg_temp.evt('TRANSACTION_PAID', 'tx-sem-email', null));
  exception when invalid_parameter_value then n := n + 1; end;
  begin perform public.billing_apply_event(pg_temp.evt('EVENTO_REEMBOLSO', null, null, 'revoke', 'EVENTO_REEMBOLSO:sha256:x'));
  exception when invalid_parameter_value then n := n + 1; end;
  assert n = 3, 'ação desconhecida, pagamento sem e-mail e revogação sem transação são recusados';
  assert not exists (select 1 from public.billing_events where event_key in ('x', 'TRANSACTION_PAID:tx-sem-email', 'EVENTO_REEMBOLSO:sha256:x')), 'nada gravado';
end $$;
\echo 'ok - entradas inválidas são recusadas sem gravar nada'

reset role;
