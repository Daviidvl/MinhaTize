# Deploy — MinhaTize

O app é uma SPA (Vite) com sete funções serverless em `api/`, publicado na Vercel.
A `main` é a produção: todo push nela gera um deploy.

## Antes de cada deploy

```bash
npm run type-check     # src e api
npm run lint
npm test -- --run
npm run build
npm run test:sql       # funções de pagamento num Postgres descartável (precisa do PostgreSQL instalado)
```

O CI (`.github/workflows/ci.yml`) roda os quatro primeiros em cada pull request.
O `test:sql` roda só na máquina de desenvolvimento: cria um cluster temporário
com `initdb`, aplica a migration de pagamentos, testa (inclusive com conexões
simultâneas) e apaga tudo. Não toca no Supabase.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

A lista completa, com descrição, está em [.env.example](.env.example). Nenhuma leva
prefixo `VITE_` — todas são lidas só no servidor.

| Variável | Obrigatória | Sem ela |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | sim | login e API não funcionam |
| `WIVEN_WEBHOOK_SECRET` | sim | o webhook recusa todas as compras (401) |
| `RESEND_API_KEY`, `EMAIL_FROM` | sim | o token não chega ao comprador (o webhook responde 502) |
| `ANTHROPIC_API_KEY` | sim | o relatório anti-platô responde 500 |
| `APP_URL` | recomendada | usa `https://minhatize.vercel.app` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | **recomendadas** | o limite de requisições fica em memória por instância e não vale entre instâncias |
| `WIVEN_REVOKE_EVENTS` | recomendada | reembolso e chargeback não revogam o token |
| `WIVEN_PRODUCT_IDS` | recomendada se a conta Wiven vende outros produtos | toda venda paga da conta gera um acesso ao MinhaTize |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | sim | as notificações no celular não funcionam (`/api/push` responde 503) |
| `CRON_SECRET` | sim | o disparo das notificações (`/api/push-cron`) e a recuperação de pagamentos (`/api/billing-cron`) recusam todas as chamadas |
| `ACCESS_PROOF_PRIVATE_KEY` | sim | o app só abre com internet: sem a prova assinada, quem está offline cai na tela de entrada |
| `VAPID_SUBJECT` | opcional | usa `APP_URL` |
| `ANTHROPIC_MODEL` | opcional | usa `claude-haiku-5-5` |
| `PDF_URL` | opcional | usa `APP_URL/guia-instalacao.pdf` |

### Upstash Redis (rate limit)

1. Crie um banco Redis em [console.upstash.com](https://console.upstash.com) (o plano gratuito basta).
2. Copie `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` da aba **REST API**.
3. Cadastre as duas na Vercel (Production e Preview) e faça um novo deploy.

Com as variáveis presentes, se o Upstash ficar fora do ar as requisições são
**negadas** (fail-closed) — veja `api/_lib/rateLimit.ts`.

### Revogação por reembolso (`WIVEN_REVOKE_EVENTS`)

O webhook só conhece o evento `TRANSACTION_PAID`. Para revogar o acesso em
reembolso/chargeback, informe os nomes exatos dos eventos que a Wiven envia,
separados por vírgula. Para descobri-los: faça um reembolso de teste e procure
`[webhook] Evento ignorado: <NOME>` nos logs da função na Vercel.

### Produtos que liberam o acesso (`WIVEN_PRODUCT_IDS`)

Ids de produto (`orderItems[].product.id`) e/ou códigos de oferta (`offerCode`)
do MinhaTize na Wiven, separados por vírgula. Com a variável preenchida, uma
venda paga de outro produto não gera token (o webhook responde 200 e registra
`[webhook] Produto fora de WIVEN_PRODUCT_IDS` como erro no log). Confira os
valores num webhook de teste antes de cadastrar: um id errado faz **nenhuma**
compra liberar acesso.

### Prova de acesso offline (`ACCESS_PROOF_PRIVATE_KEY`)

Sem internet, o app só abre com uma prova que o servidor assina a cada login
online (válida por 30 dias). A chave pública está em `src/utils/accessProof.ts`;
a privada vai só na Vercel. O valor está no `.env.local` da máquina de
desenvolvimento — copie de lá. Para trocar o par, use o comando do
`.env.example` e atualize as duas pontas no mesmo deploy.

### Notificações push (lembretes no celular)

O app calcula os lembretes dos próximos 7 dias e envia a `/api/push` só a lista
"horário + texto" de cada aviso (tabela `push_subscriptions`). Quem dispara é
`/api/push-cron`, que precisa ser chamado **a cada 5 minutos** por um agendador.

1. Gere as chaves: `npx web-push generate-vapid-keys` → cadastre `VAPID_PUBLIC_KEY`
   e `VAPID_PRIVATE_KEY` na Vercel. Não troque depois: invalida todas as inscrições.
2. Gere o `CRON_SECRET` (comando no `.env.example`) e cadastre na Vercel.
3. Rode a migration `20261021_push_subscriptions.sql`.
4. Configure o agendador para chamar `GET https://minhatize.vercel.app/api/push-cron`
   a cada 5 minutos com o header `Authorization: Bearer <CRON_SECRET>`:
   - **cron-job.org** (gratuito): Create cronjob → URL acima → Schedule "Every 5 minutes"
     → Advanced → Headers → `Authorization` = `Bearer <CRON_SECRET>`.
   - **Vercel Cron** só serve no plano Pro: o Hobby aceita no máximo uma execução por
     dia, e um `crons` mais frequente no `vercel.json` faz o deploy falhar.

O intervalo define a precisão: com 5 minutos, um lembrete das 09:00 chega até 09:05.
Avisos com mais de 3 horas de atraso (agendador parado) são descartados em vez de
chegarem fora de hora.

### Pagamentos idempotentes (webhook e `/api/billing-cron`)

O webhook da Wiven aplica cada evento numa única transação do banco (funções da
migration `20261125_billing_idempotency.sql`): o mesmo evento repetido — reenvio
da Wiven ou duas entregas simultâneas — não cria outro token nem manda outro
e-mail. Um pagamento que chega depois do estorno da mesma venda não libera acesso.

- **E-mail:** um por token, pela fila `email_outbox`. Cada e-mail tem uma chave
  de idempotência (UUID v4) gerada uma vez e enviada ao Resend em toda tentativa;
  o Resend guarda a chave por 24 horas e não envia de novo dentro desse prazo.
  Garantia real: **pelo menos uma vez, com deduplicação** — se uma função cair
  entre o Resend aceitar e o banco registrar, e a nova tentativa vier depois de
  24 horas, pode sair um segundo e-mail.
- **Recuperação:** se o banco ou o Resend falharem, o webhook responde 5xx (a
  Wiven reentrega) e o evento/e-mail fica guardado. `/api/billing-cron`
  reprocessa o que falhou (até 10 tentativas por evento, 8 por e-mail).

Configure o agendador como o do push, com o mesmo `CRON_SECRET`:
`GET https://minhatize.vercel.app/api/billing-cron` a cada 5 minutos, header
`Authorization: Bearer <CRON_SECRET>` (cron-job.org → Create cronjob). A resposta
traz contadores; `stuck` diferente de zero (também registrado como erro no log)
significa algo que esgotou as tentativas e precisa de ação manual.

**Reenviar o e-mail de acesso de uma venda** (reenviar o webhook pela Wiven não
reenvia mais o e-mail). No SQL Editor, com o id da transação da Wiven — gera uma
chave nova, porque é um novo envio, pedido de propósito:

```sql
update public.email_outbox
   set status = 'pending', attempts = 0, idempotency_key = gen_random_uuid(),
       last_error = null, updated_at = now() - interval '2 minutes'
 where token_id in (select id::text from public.tokens where order_id = '<transaction id>' and active);
```

O cron envia em até 5 minutos. Se o update não afetar nenhuma linha, a venda é
anterior à migration (a fila não a conhece): reenviar o webhook pelo painel da
Wiven manda o e-mail uma vez.

**Ver o que aconteceu com uma venda:**

```sql
select event_type, status, attempts, last_error, received_at from public.billing_events
 where payload->>'transaction_id' = '<transaction id>' order by received_at;
select * from public.billing_transactions where gateway_transaction_id = '<transaction id>';
```

## Banco de dados (Supabase)

As migrations ficam em `supabase/migrations/` e são aplicadas **manualmente**
(SQL Editor do Supabase), em ordem de data:

| Migration | O que faz | Ordem em relação ao código |
|---|---|---|
| `20260901_add_token_expiration.sql` | coluna `tokens.expires_at` | antes ou depois. Sem a coluna o app funciona, mas nenhum token expira e o log registra `[auth] Coluna tokens.expires_at ausente`; depois de rodar a migration, a expiração passa a valer em até 5 minutos, sem novo deploy |
| `20261012_unique_order_id.sql` | um token por pedido (`UNIQUE` parcial em `order_id`) | antes ou depois; confira duplicatas antes (instruções no arquivo) |
| `20261022_consents_token_id.sql` | `consents` passa a guardar `token_id` e apaga as cópias do token | **antes**, e rode de novo o bloco final ("Apagar as cópias do token") **depois** do deploy |
| `20261021_push_subscriptions.sql` | tabela `push_subscriptions` (inscrições e agenda de notificações) | **antes**. Sem a tabela a inscrição responde 500; o app tenta de novo depois, sem erro visível |
| `20261112_revoke_client_roles.sql` | garante RLS e retira de `anon`/`authenticated` todo privilégio em `tokens`, `consents` e `push_subscriptions` | qualquer uma (o código só usa a `service_role`). O fim do arquivo traz as consultas de conferência |
| `20261125_billing_idempotency.sql` | tabelas `billing_events`, `billing_transactions`, `email_outbox` e as funções do webhook idempotente. Não altera nenhuma linha de `tokens` | **antes** — sem as funções, o webhook novo responde 500 a toda venda (a Wiven reentrega, mas ninguém recebe token até a migration rodar). Rode a conferência do fim do arquivo antes e depois |

Confira também, a cada mudança de schema:

- **RLS habilitado** em `tokens`, `consents`, `push_subscriptions`, `billing_events`,
  `billing_transactions` e `email_outbox`, sem policy para `anon`/`authenticated`
  (o app só acessa o banco pelo servidor, com a `service_role`).
- As funções de pagamento **sem** `EXECUTE` para `anon`/`authenticated` (consulta no
  fim da migration `20261125`): a anon key é pública, e com esse privilégio
  qualquer um emitiria tokens.
- Backups automáticos ativos no projeto.

## Depois do deploy

- Abrir o app, entrar com um token válido e conferir o console do navegador
  (não deve haver erro de CSP).
- Gerar um relatório anti-platô.
- Laboratório → **Baixar PDF**.
- Loja → as imagens dos produtos aparecem.
- Webhook: uma venda de teste **nova** pela Wiven → conferir a chegada do e-mail e, no
  Supabase, uma linha em `billing_events` (`processed`), uma em `billing_transactions`
  e uma em `email_outbox` (`sent`). Reenviar o mesmo webhook pelo painel deve responder
  200 sem mandar outro e-mail. (Reenviar o webhook de uma venda **antiga**, anterior
  à migration, manda o e-mail uma vez — a fila ainda não o conhecia.)
- `/api/billing-cron` no cron-job.org respondendo 200, com `stuck` zerado.
- Notificações: no celular (no iPhone, com o app na tela de início), permitir as
  notificações, ajustar um lembrete para daqui a 10 minutos em Perfil → Lembretes,
  fechar o app e esperar o aviso. Conferir no Supabase que a linha apareceu em
  `push_subscriptions` e, no cron-job.org, que as chamadas respondem 200.

## Rollback

Vercel → Deployments → escolha o deploy anterior → **Promote to Production**.
Migrations não são revertidas pelo rollback do código; todas acima são
aditivas e compatíveis com a versão anterior. Com o webhook anterior de volta,
as tabelas de pagamento só deixam de receber linhas novas; os tokens emitidos
pelas funções são linhas normais de `tokens` e continuam valendo. Pause o job
`/api/billing-cron` no cron-job.org (a versão anterior não tem a rota: responderia 404).
Para desfazer a migration em si, o bloco "Reverter" no fim do arquivo renomeia
as tabelas em vez de apagá-las.
