---
workflow: product-launch-video
flow: automation
storyboard: yes
message: "Todo o seu tratamento com tirzepatida num só lugar."
destination: reels
aspect: 1080x1920
language: pt-BR
audience: "Pessoas em protocolo com GLP-1/GIP (tirzepatida, semaglutida) que querem organizar o tratamento"
length: 45s
angle: sell
narration: no
---

## Intent

Vídeo HTML de apresentação do produto MinhaTize, com bastante animação e estética
de "app num celular, apresentação luxuosa" (palavras do usuário). Promo de venda,
vertical para Reels/Stories. Um celular premium flutuando sobre fundo azul-meia-noite,
luz suave, reflexos; cada cena revela um módulo do app: Calendário de Aplicações,
Progresso, Calculadora de UI, Saúde, Laboratório. Fecha com logo e CTA.

## Assets

- public/logo-mark.png — marca MinhaTize (círculo navy com monograma branco); abertura e fechamento.
- src/index.css — design system do app (tokens azuis); fonte da verdade de cor.

## Customizations

- Telas do app recriadas em HTML com os tokens reais (o app real fica atrás de login por token) para animar números, anéis e gráficos dentro do celular.
- Sem áudio (usuário coloca música em alta do Reels ao postar).

## Notes

- Paleta: só tokens azuis (navy #0B2545, cobalt #1E5BB8, azure #3A86E0, sky #8FBDF0, ice #DCE9F9, mist #EEF4FC); --g-midnight (#162558→#28195D) permitido como fundo premium; teal (#19B5A5 / aqua #2BD4C0) só para progresso/resultado positivo. Sem roxo/marrom/coral fora disso.
- Fonte Inter.
- Plataforma educativa: não prometer resultado clínico nem substituir orientação médica.
- Sem commits — o usuário commita manualmente.
