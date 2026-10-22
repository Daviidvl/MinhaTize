# Asset inventory (no-capture path)

Nenhum site capturado — o app fica atrás de login por token. As telas do app são recriadas em HTML com os tokens reais de src/index.css.

- `capture/assets/logo-mark.png` — marca MinhaTize: círculo navy (#0B2545) com monograma branco "U" com ponto (pílula/gota). Quadrado ~340px, fundo branco fora do círculo. Uso: abertura e fechamento (recortar em círculo).
- `screen:dashboard` (recriada) — tela Início: cartão hero navy→cobalt "Peso atual 82,4 kg", selo "7,6 kg eliminados", anel 54% da meta, barra; tiles IMC / Dose atual 5 mg "Próxima em 3d"; widget água.
- `screen:calendar` (recriada) — Calendário de aplicações: mês com dias de aplicação marcados, "Aplicação de hoje", sequência de semanas, aderência 100%, local da injeção.
- `screen:progress` (recriada) — Progresso: gráfico de linha de peso semana a semana, IMC, meta.
- `screen:calculator` (recriada) — Calculadora: ampola 15mg / 0,5mL (30 mg/mL), dose 5 mg, seringa 100 UI → 17 UI (fórmula real de src/utils/calculator.ts), seringa animada enchendo.
- `screen:health` (recriada) — Saúde: hidratação (anel de água), diário de sintomas com intensidade.
- `screen:lab` (recriada) — Laboratório: lista de exames com status dentro da referência.
