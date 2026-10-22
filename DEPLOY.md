# Deploy — MinhaTize

O app é uma SPA (Vite) com seis funções serverless em `api/`, publicado na Vercel.
A `main` é a produção: todo push nela gera um deploy.

## Antes de cada deploy

```bash
npm run type-check     # src e api
npm run lint
npm test -- --run
npm run build
```

O CI (`.github/workflows/ci.yml`) roda os mesmos passos em cada pull request.

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
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | sim | as notificações no celular não funcionam (`/api/push` responde 503) |
| `CRON_SECRET` | sim | o disparo das notificações (`/api/push-cron`) recusa todas as chamadas |
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

## Banco de dados (Supabase)

As migrations ficam em `supabase/migrations/` e são aplicadas **manualmente**
(SQL Editor do Supabase), em ordem de data:

| Migration | O que faz | Ordem em relação ao código |
|---|---|---|
| `20260901_add_token_expiration.sql` | coluna `tokens.expires_at` | antes ou depois. Sem a coluna o app funciona, mas nenhum token expira e o log registra `[auth] Coluna tokens.expires_at ausente`; depois de rodar a migration, a expiração passa a valer em até 5 minutos, sem novo deploy |
| `20261012_unique_order_id.sql` | um token por pedido (`UNIQUE` parcial em `order_id`) | antes ou depois; confira duplicatas antes (instruções no arquivo) |
| `20261022_consents_token_id.sql` | `consents` passa a guardar `token_id` e apaga as cópias do token | **antes**, e rode de novo o bloco final ("Apagar as cópias do token") **depois** do deploy |
| `20261021_push_subscriptions.sql` | tabela `push_subscriptions` (inscrições e agenda de notificações) | **antes**. Sem a tabela a inscrição responde 500; o app tenta de novo depois, sem erro visível |

Confira também, a cada mudança de schema:

- **RLS habilitado** em `tokens`, `consents` e `push_subscriptions`, sem policy para `anon`/`authenticated`
  (o app só acessa o banco pelo servidor, com a `service_role`).
- Backups automáticos ativos no projeto.

## Depois do deploy

- Abrir o app, entrar com um token válido e conferir o console do navegador
  (não deve haver erro de CSP).
- Gerar um relatório anti-platô.
- Laboratório → **Baixar PDF**.
- Loja → as imagens dos produtos aparecem.
- Reenviar um webhook de teste pela Wiven e conferir a chegada do e-mail.
- Notificações: no celular (no iPhone, com o app na tela de início), permitir as
  notificações, ajustar um lembrete para daqui a 10 minutos em Perfil → Lembretes,
  fechar o app e esperar o aviso. Conferir no Supabase que a linha apareceu em
  `push_subscriptions` e, no cron-job.org, que as chamadas respondem 200.

## Rollback

Vercel → Deployments → escolha o deploy anterior → **Promote to Production**.
Migrations não são revertidas pelo rollback do código; as duas acima são
aditivas e compatíveis com a versão anterior.
