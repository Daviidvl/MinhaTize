#!/usr/bin/env bash
# Testa supabase/migrations/20261125_billing_idempotency.sql contra um Postgres
# REAL e descartável: cria um cluster temporário, aplica a migration (duas
# vezes, para provar que é idempotente), roda os cenários de
# billing_idempotency.test.sql e os testes de concorrência abaixo, com várias
# conexões simultâneas. No fim apaga tudo. Não toca no Supabase.
#
# Uso:  npm run test:sql
# Precisa dos binários do PostgreSQL (initdb, pg_ctl, psql). Procura em PG_BIN,
# no PATH e nas instalações padrão do Windows e do Debian/Ubuntu.
# Porta: PG_TEST_PORT (padrão 54329).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
# BILLING_MIGRATION: outro arquivo no lugar da migration (para conferir que os
# testes acusam uma versão quebrada)
MIGRATION="${BILLING_MIGRATION:-$ROOT/supabase/migrations/20261125_billing_idempotency.sql}"
PORT="${PG_TEST_PORT:-54329}"

find_pg_bin() {
  if [ -n "${PG_BIN:-}" ]; then echo "$PG_BIN"; return 0; fi
  if command -v initdb >/dev/null 2>&1; then dirname "$(command -v initdb)"; return 0; fi
  local found=""
  for d in "/c/Program Files/PostgreSQL"/*/bin /usr/lib/postgresql/*/bin; do
    if [ -x "$d/initdb" ] || [ -x "$d/initdb.exe" ]; then found="$d"; fi
  done
  if [ -n "$found" ]; then echo "$found"; return 0; fi
  echo "PostgreSQL não encontrado. Instale-o ou defina PG_BIN com a pasta dos binários." >&2
  return 1
}

BIN="$(find_pg_bin)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/billing-pg.XXXXXX")"
WINDOWS=false
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) WINDOWS=true ;; esac
# Caminho que os binários nativos do Windows entendem
NATIVE="$WORK"
if $WINDOWS && command -v cygpath >/dev/null 2>&1; then NATIVE="$(cygpath -m "$WORK")"; fi

cleanup() {
  "$BIN/pg_ctl" -D "$NATIVE/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

echo "PostgreSQL: $BIN"
"$BIN/initdb" -D "$NATIVE/data" -U postgres -A trust -E UTF8 --no-locale >/dev/null
OPTS="-p $PORT -c listen_addresses=localhost -c fsync=off"
# Fora do Windows o socket padrão (/var/run/postgresql) pode não ser gravável
if ! $WINDOWS; then OPTS="$OPTS -k $WORK"; fi
"$BIN/pg_ctl" -D "$NATIVE/data" -o "$OPTS" -l "$NATIVE/postgres.log" -w start >/dev/null

PSQL=("$BIN/psql" -X -q -h localhost -p "$PORT" -U postgres -v ON_ERROR_STOP=1)
"${PSQL[@]}" -d postgres -c 'create database billing_test' >/dev/null
DB=("${PSQL[@]}" -d billing_test)
q() { "${DB[@]}" -tA -c "$1"; }

fail() { echo "FALHOU - $1" >&2; exit 1; }
expect() { # expect "<descrição>" "<esperado>" "<obtido>"
  [ "$2" = "$3" ] || fail "$1 (esperado: $2, obtido: $3)"
}

echo "Versão: $(q 'show server_version')"
"${DB[@]}" -f "$HERE/setup.sql" >/dev/null
PGOPTIONS='-c client_min_messages=warning' "${DB[@]}" -f "$MIGRATION" >/dev/null
PGOPTIONS='-c client_min_messages=warning' "${DB[@]}" -f "$MIGRATION" >/dev/null
echo "ok - migration aplicada duas vezes sem erro (idempotente)"

"${DB[@]}" -f "$HERE/billing_idempotency.test.sql"

# ── Concorrência real: várias conexões ao mesmo tempo ────────────────────────
evt() { # evt <tipo> <transação> <ação>
  echo "jsonb_build_object('gateway','wiven','event_key','$1:$2','event_type','$1','action','$3','transaction_id','$2','email','conc@example.com','name','Conc')"
}
N=12

# Teste 2: o mesmo webhook em 12 requisições simultâneas
pids=()
for i in $(seq 1 $N); do
  "${DB[@]}" -tA -c "set role service_role; select public.billing_apply_event($(evt TRANSACTION_PAID tx-conc-1 grant))->>'duplicate'" \
    > "$WORK/c1.$i" 2>&1 &
  pids+=($!)
done
for p in "${pids[@]}"; do wait "$p" || fail "Teste 2: uma das conexões falhou: $(cat "$WORK"/c1.* | grep -v -E '^(true|false)$' | head -3)"; done
expect "Teste 2: exatamente um processamento efetivo" 1 "$(cat "$WORK"/c1.* | grep -c '^false$')"
expect "Teste 2: as outras $((N - 1)) entregas vêem duplicado" $((N - 1)) "$(cat "$WORK"/c1.* | grep -c '^true$')"
expect "Teste 2: um evento" 1 "$(q "select count(*) from billing_events where event_key = 'TRANSACTION_PAID:tx-conc-1'")"
expect "Teste 2: um token" 1 "$(q "select count(*) from tokens where order_id = 'tx-conc-1'")"
expect "Teste 2: uma transação" 1 "$(q "select count(*) from billing_transactions where gateway_transaction_id = 'tx-conc-1'")"
expect "Teste 2: um e-mail na fila" 1 "$(q "select count(*) from email_outbox where token_id in (select id::text from tokens where order_id = 'tx-conc-1')")"
echo "ok - Teste 2: $N entregas simultâneas do mesmo evento geram um token, uma transação e um e-mail"

# Teste 2b: a 2ª entrega espera a 1ª terminar (não lê um estado pela metade)
"${DB[@]}" -tA -c "set role service_role; begin; select public.billing_apply_event($(evt TRANSACTION_PAID tx-conc-2 grant))->>'duplicate'; select pg_sleep(2); commit;" \
  > "$WORK/c2.a" 2>&1 &
pa=$!
sleep 0.5
start=$(date +%s%N)
second=$("${DB[@]}" -tA -c "set role service_role; select public.billing_apply_event($(evt TRANSACTION_PAID tx-conc-2 grant))->>'duplicate'")
elapsed_ms=$(( ($(date +%s%N) - start) / 1000000 ))
wait "$pa" || fail "Teste 2b: a 1ª conexão falhou: $(cat "$WORK/c2.a")"
expect "Teste 2b: a 1ª entrega processa" false "$(grep -E '^(true|false)$' "$WORK/c2.a")"
expect "Teste 2b: a 2ª entrega, que chegou no meio, vê duplicado" true "$second"
[ "$elapsed_ms" -ge 1000 ] || fail "Teste 2b: a 2ª entrega não esperou a 1ª (${elapsed_ms} ms)"
expect "Teste 2b: um token" 1 "$(q "select count(*) from tokens where order_id = 'tx-conc-2'")"
echo "ok - Teste 2b: entrega que chega no meio do processamento espera (${elapsed_ms} ms) e não duplica"

# Pagamento e estorno da mesma venda chegando juntos, várias vezes
pids=()
for i in $(seq 1 $N); do
  if [ $((i % 2)) -eq 0 ]; then e="$(evt TRANSACTION_PAID tx-conc-3 grant)"; else e="$(evt EVENTO_REEMBOLSO tx-conc-3 revoke)"; fi
  "${DB[@]}" -tA -c "set role service_role; select public.billing_apply_event($e)->>'outcome'" > "$WORK/c3.$i" 2>&1 &
  pids+=($!)
done
for p in "${pids[@]}"; do wait "$p" || fail "Pagamento × estorno: uma das conexões falhou: $(cat "$WORK"/c3.* | head -3)"; done
expect "Pagamento × estorno: venda termina estornada" revoked "$(q "select status from billing_transactions where gateway_transaction_id = 'tx-conc-3'")"
expect "Pagamento × estorno: nenhum token ativo" 0 "$(q "select count(*) from tokens where order_id = 'tx-conc-3' and active")"
expect "Pagamento × estorno: no máximo um token" 1 "$(q "select (count(*) <= 1)::int from tokens where order_id = 'tx-conc-3'")"
expect "Pagamento × estorno: nenhum e-mail pendente" 0 \
  "$(q "select count(*) from email_outbox where status in ('pending','failed') and token_id in (select id::text from tokens where order_id = 'tx-conc-3')")"
echo "ok - pagamento e estorno simultâneos da mesma venda terminam estornados, sem acesso nem e-mail"

# E-mail: 12 processos tentam enviar o mesmo e-mail ao mesmo tempo
KEY="$(q "select business_key from email_outbox where token_id in (select id::text from tokens where order_id = 'tx-conc-1')")"
pids=()
for i in $(seq 1 $N); do
  "${DB[@]}" -tA -c "set role service_role; select public.email_outbox_claim('$KEY')->>'outcome'" > "$WORK/c4.$i" 2>&1 &
  pids+=($!)
done
for p in "${pids[@]}"; do wait "$p" || fail "E-mail: uma das conexões falhou: $(cat "$WORK"/c4.* | head -3)"; done
expect "E-mail: exatamente uma reserva" 1 "$(cat "$WORK"/c4.* | grep -c '^claimed$')"
expect "E-mail: as outras ficam de fora" $((N - 1)) "$(cat "$WORK"/c4.* | grep -c '^busy$')"
echo "ok - e-mail: $N envios simultâneos do mesmo e-mail resultam em uma única reserva"

echo
echo "Todos os testes de banco passaram."
