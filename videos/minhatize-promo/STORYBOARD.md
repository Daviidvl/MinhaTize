---
format: 1080x1920
duration: 44.5s
message: "Todo o seu tratamento com tirzepatida num só lugar."
arc: Hook (dor) → Produto → Feature-Benefit Cascade (Progresso · Calendário · Calculadora · Saúde/Lab) → Confiança → CTA
audience: Pessoas em protocolo com GLP-1/GIP que querem organizar o tratamento
mode: collaborative
music: none
note: narração ElevenLabs (assets/voice/src/narracao.mp3) cortada por cena em assets/voice/NN.wav; durações = duração real da voz
---

## Locked

Esboços v1 aprovados pelo usuário em 2026-10-15: layout, hierarquia e textos das 8 cenas (storyboard.html). Construção = vestir esse layout com movimento, sem redesenhar.

## Video direction

Midnight Luxe (frame.md). Palco azul-meia-noite com glows cobalt/sky, anéis finos girando devagar, poeira de luz subindo, grão sutil e vinheta. O celular de titânio é o herói em todas as cenas de produto, com pose 3/4 que alterna de lado a cada cena (03 esquerda, 04 direita, 05 direita, 06 frontal) e um reflexo de vidro que atravessa a tela uma vez por cena. Texto: eyebrow espaçado em sky + headline Inter 300 com a palavra-chave em 700 com brilho. Entradas expo/power3 out longas; molas só em chips e cartões. Números sempre contam (peso, %, UI, aderência). Costuras: corte → zoom-through → crossfade → push-slide ×2 → crossfade → blur-crossfade → zoom-through.

## Frame 1 — Tudo espalhado

- scene: Fragmentos do caos (papel, print, alarme) flutuam no escuro e se apagam; frase final acende
- voiceover: "Anotação no papel. · Print no celular. · Alarme esquecido. · Seu tratamento merece mais."
- duration: 7.35s
- transition_in: cut
- status: animated
- src: compositions/frames/01-hook.html
- type: hook
- persuasion: Pain validation
- beat: frustration → curiosity
- blueprint: kinetic-type-beats
- asset_candidates:

Shot: S1 (0–2.5s) linhas 01/02/03 entram da esquerda com desfoque→nítido, cada uma com seu fragmento caindo girando (back.out) · S2 (2.5–3.0s) riscos sky atravessam as linhas; fragmentos recuam, desfocam e apagam · S3 (2.95–4.5s) "Seu tratamento merece mais." sobe palavra a palavra; "mais." com pop e feixe de luz horizontal.

narrativeRole: reconhece a bagunça que o público já vive antes de qualquer produto aparecer.
keyMessage: do jeito que está, o tratamento fica espalhado.

## Frame 2 — MinhaTize

- scene: O logo nasce de um ponto de luz entre anéis; o celular sobe do escuro em 3D e acende na tela Início
- voiceover: "MinhaTize. · Todo o seu tratamento · num só lugar."
- duration: 4.61s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/02-intro.html
- type: product_intro
- persuasion: Future pacing
- beat: relief + awe
- blueprint: logo-assemble-lockup
- asset_candidates: assets/logo-mark.png — marca MinhaTize, círculo navy com monograma branco

Shot: S1 (0–1.2s) ponto de luz → anéis abrem (expo) → logo floresce de blur 24px · S2 (1.15–3.2s) letras de MinhaTize em cascata; promessa em duas linhas · S3 (2.3–5.5s) celular sobe do escuro com rotationX 28→0, tela acende (blackout→0), reflexo atravessa. handoff_out: phone left 230 top 1090 scale 1 rotY 0 opacity 1, parado.

narrativeRole: entrega a promessa (message) no segundo beat e apresenta o herói visual: o celular.
keyMessage: existe um lugar só para tudo isso.

## Frame 3 — Sua evolução

- scene: Celular em 3/4; na tela Início o peso conta 90,0 → 82,4 kg, anel enche até 54% da meta, selo "7,6 kg eliminados" salta para fora da tela
- voiceover: "Veja sua evolução · quilo a quilo."
- duration: 5.0s
- transition_in: crossfade
- status: animated
- src: compositions/frames/03-progresso.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: motivation
- blueprint: dataviz-countup
- asset_candidates: screen:dashboard — tela Início recriada (peso, anel da meta, IMC, dose)

Shot: S1 (0–1.3s) handoff_in do celular (left 230 top 1090 scale 1) → pose 3/4 (top 500, scale .88, rotY −14) · S2 (1.25–3.1s) peso conta 90,0→82,4, anel 0→54%, barra, selo "kg eliminados" · S3 (2.7–5.1s) chips "7,6 kg" e "54% da meta" saltam da tela, cartão IMC chega por último; flutuação lenta.

narrativeRole: primeira prova, o resultado que a pessoa mais quer ver.
keyMessage: o progresso fica visível e motivador.

## Frame 4 — Nunca perca uma aplicação

- scene: Celular gira para o Calendário; dias entram em cascata, dias de aplicação acendem, check "Aplicação registrada", chips "Próxima em 7 dias" e "Aderência 100%" flutuam ao lado
- voiceover: "Cada aplicação registrada. · Lembrete da próxima."
- duration: 5.36s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/04-calendario.html
- type: feature_showcase
- persuasion: Feature-to-benefit translation
- beat: control
- blueprint: device-surface-showcase
- asset_candidates: screen:calendar — calendário de aplicações recriado

Shot: S1 (0–1.4s) giro rotY 24→10 + headline · S2 (0.5–2.0s) mês em cascata, 1 e 8 acendem teal, 22/29 tracejados · S3 (1.9–3.0s) toque em Registrar → Registrado ✓, dia 15 enche teal · S4 (2.9–5.5s) chips Próxima em 7 dias / Aderência 100% (contagem).

narrativeRole: tira o medo de esquecer ou repetir dose.
keyMessage: a rotina de aplicação fica sob controle.

## Frame 5 — Dose exata

- scene: Calculadora no celular: campos se preenchem (15mg/0,5mL · 5 mg · seringa 100 UI); uma seringa grande sai da tela e enche até 17 UI com contagem
- voiceover: "Da dose em mg · para unidades na seringa."
- duration: 5.47s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-calculadora.html
- type: feature_showcase
- persuasion: Friction reduction
- beat: clarity + confidence
- blueprint: panel-edit-live-sync
- asset_candidates: screen:calculator — calculadora recriada com a fórmula real (17 UI)

Shot: S1 (0–1.4s) giro + headline + aviso educativo · S2 (0.8–2.4s) três campos preenchem com foco descendo; seringa grande entra vazia · S3 (2.4–4.2s) resultado aparece, 0→17 UI sincronizado com líquido, êmbolo e marca teal · S4 (3.3–6s) chip 17 UI, reflexo.

narrativeRole: resolve a dúvida mais técnica e mais ansiosa do público.
keyMessage: converter mg em UI deixa de ser conta de cabeça. Sempre com o aviso "uso educativo".

## Frame 6 — Saúde completa

- scene: O celular recua; cartões de vidro saem da tela e orbitam: Hidratação 1,8 L, Sintomas, Exames na referência, Treino, Alimentação
- voiceover: "Hidratação. · Sintomas. · Exames. · Tudo acompanhado."
- duration: 6.17s
- transition_in: crossfade
- status: animated
- src: compositions/frames/06-saude.html
- type: benefit_highlight
- persuasion: Value stacking
- beat: peace of mind
- blueprint: grid-card-assemble
- asset_candidates: screen:health — hidratação e sintomas recriados; screen:lab — exames recriados

Shot: S1 (0–1.3s) celular recua (scale 1.18→1) e a tela Saúde se monta · S2 (1.0–4.0s) cinco cartões saem da tela alternando lados (back.out) e flutuam · S3 (3.75–6s) "Tudo acompanhado." aterrissa.

narrativeRole: mostra a amplitude: não é só peso e dose, é o cuidado inteiro.
keyMessage: tudo o que importa no tratamento, junto.

## Frame 7 — Seu, e só seu

- scene: Ícone do app pousa na tela inicial do celular; cadeado de luz; três linhas curtas em relay
- voiceover: "Sem cadastro. · Sem senha. · Seus dados ficam no seu celular."
- duration: 4.79s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/07-privacidade.html
- type: benefit_highlight
- persuasion: Risk reversal
- beat: trust
- blueprint: kinetic-type-beats
- asset_candidates: assets/logo-mark.png — ícone do app na tela inicial

Shot: S1 (0–1.4s) celular sobe com a tela inicial; apps surgem · S2 (0.3–2.6s) três promessas, uma por beat, escudo teal na última · S3 (2.5–5s) ícone MinhaTize cai no slot com halo duplo; reflexo.

narrativeRole: derruba a objeção de privacidade e de dificuldade de uso.
keyMessage: é simples e privado: instala como app, sem conta.

## Frame 8 — Garanta seu acesso

- scene: Celular centralizado sobre reflexo, anéis de luz giram; logo + "MinhaTize" + CTA em pílula "Garanta seu acesso · link na bio"; aviso educativo em letra fina
- voiceover: "MinhaTize. · Garanta seu acesso. · Link na bio."
- duration: 5.74s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/08-cta.html
- type: cta
- persuasion: Urgency-to-act (soft) + brand recall
- beat: aspiration → urgency-to-act
- blueprint: logo-assemble-lockup
- asset_candidates: assets/logo-mark.png — marca para o lockup final

Shot: S1 (0–1.7s) anéis abrem, celular sobe e reclina (rotX 30→10) · S2 (0.5–2.3s) logo floresce, wordmark, promessa · S3 (2.2–3.3s) pílula CTA cresce de um ponto (clip-path) + texto · S4 (3.0–6s) link na bio, aviso educativo, dois brilhos na pílula. Frame final: segura o lockup.

narrativeRole: fecha com a marca e uma ação clara.
keyMessage: o próximo passo é garantir o acesso.
