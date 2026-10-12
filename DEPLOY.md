# Deploy — MinhaTize

O app é uma SPA (Vite) com quatro funções serverless em `api/`, publicado na Vercel.
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

## Banco de dados (Supabase)

As migrations ficam em `supabase/migrations/` e são aplicadas **manualmente**
(SQL Editor do Supabase), em ordem de data:

| Migration | O que faz | Ordem em relação ao código |
|---|---|---|
| `20260901_add_token_expiration.sql` | coluna `tokens.expires_at` | **antes** do deploy — sem a coluna, a validação de token falha para todos |
| `20261012_unique_order_id.sql` | um token por pedido (`UNIQUE` parcial em `order_id`) | antes ou depois; confira duplicatas antes (instruções no arquivo) |

Confira também, a cada mudança de schema:

- **RLS habilitado** em `tokens` e `consents`, sem policy para `anon`/`authenticated`
  (o app só acessa o banco pelo servidor, com a `service_role`).
- Backups automáticos ativos no projeto.

## Depois do deploy

- Abrir o app, entrar com um token válido e conferir o console do navegador
  (não deve haver erro de CSP).
- Gerar um relatório anti-platô.
- Laboratório → **Baixar PDF**.
- Loja → as imagens dos produtos aparecem.
- Reenviar um webhook de teste pela Wiven e conferir a chegada do e-mail.

## Rollback

Vercel → Deployments → escolha o deploy anterior → **Promote to Production**.
Migrations não são revertidas pelo rollback do código; as duas acima são
aditivas e compatíveis com a versão anterior.
