-- Um token por transação.
--
-- O webhook (api/webhook.ts) evita duplicatas consultando o pedido antes de
-- inserir, mas duas entregas simultâneas da mesma transação passam juntas por
-- essa consulta. Este índice único faz o banco barrar a segunda inserção; o
-- webhook trata o erro 23505 reenviando o token que já foi gravado.
--
-- Índice parcial: order_id é nullable (tokens emitidos manualmente não têm
-- pedido) e vários NULLs continuam permitidos.
--
-- ANTES DE RODAR — a criação falha se já houver pedidos duplicados. Confira:
--
--   select order_id, count(*) from public.tokens
--   where order_id is not null
--   group by order_id having count(*) > 1;
--
-- Se a consulta devolver linhas, desative (active = false) ou apague os tokens
-- excedentes de cada pedido antes de criar o índice.
--
-- Ordem de deploy: pode rodar antes ou depois do código. Sem o índice o webhook
-- funciona como antes (só sem a proteção contra a corrida).

create unique index if not exists tokens_order_id_key
  on public.tokens (order_id)
  where order_id is not null;
