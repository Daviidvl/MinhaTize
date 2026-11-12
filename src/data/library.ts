// Catálogo da Biblioteca: vídeo-aulas e e-books educativos.
//
// Como publicar conteúdo novo:
// • Vídeo-aula: preencha `video` da aula com o ID do YouTube (ex.: o "dQw4w9WgXcQ"
//   de youtube.com/watch?v=dQw4w9WgXcQ — pode ser vídeo "não listado"), o ID do
//   Vimeo, ou um arquivo .mp4 em /public/biblioteca/. Aula sem `video` aparece
//   como "Em breve" e não conta no progresso.
// • E-book: cada capítulo é texto em blocos (abre offline, dentro do app). Para
//   oferecer também o PDF, coloque o arquivo em /public/biblioteca/ e preencha `pdf`.
// • IDs (item e aula) ficam salvos no progresso de quem já leu/assistiu:
//   não renomeie um ID publicado, só crie novos.

export type LibraryKind  = 'video' | 'ebook'
export type LibraryTopic = 'inicio' | 'tratamento' | 'alimentacao' | 'treino' | 'mente'

export type VideoSource =
  | { provider: 'youtube'; id: string }
  | { provider: 'vimeo'; id: string }
  | { provider: 'file'; url: string }

export type LibraryBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'tip'; title?: string; text: string }
  | { type: 'warn'; text: string }

export interface LibraryLesson {
  id: string
  title: string
  minutes?: number          // vídeo: duração; e-book: calculado pelo texto se omitido
  video?: VideoSource       // só vídeo-aula
  summary?: string          // vídeo-aula: texto abaixo do player
  body?: LibraryBlock[]     // só e-book
}

export interface LibraryItem {
  id: string
  kind: LibraryKind
  topic: LibraryTopic
  title: string
  subtitle: string
  description: string
  featured?: boolean        // destaque "Comece por aqui" enquanto não há nada em andamento
  isNew?: boolean
  pdf?: string              // e-book: caminho de um PDF em /public (opcional)
  lessons: LibraryLesson[]
}

export const TOPIC_ORDER: LibraryTopic[] = ['inicio', 'tratamento', 'alimentacao', 'treino', 'mente']

export const TOPIC_LABEL: Record<LibraryTopic, string> = {
  inicio:      'Primeiros passos',
  tratamento:  'Tratamento',
  alimentacao: 'Alimentação',
  treino:      'Treino',
  mente:       'Mente & hábitos',
}

export const LIBRARY: LibraryItem[] = [
  // ── Vídeo-aulas ─────────────────────────────────────────────────────────────
  {
    id: 'aulas-primeiros-passos',
    kind: 'video',
    topic: 'inicio',
    title: 'Primeiros passos no MinhaTize',
    subtitle: 'Série de vídeo-aulas curtas',
    description:
      'Aulas rápidas, direto ao ponto, mostrando como aproveitar cada parte do app: '
      + 'a calculadora de dose, o calendário de aplicações, o estoque e os planos de alimentação e treino.',
    lessons: [
      {
        id: 'boas-vindas', title: 'Boas-vindas ao MinhaTize', minutes: 3,
        summary: 'Um tour pelo app e como ele acompanha cada semana do seu tratamento.',
      },
      {
        id: 'calculadora', title: 'Calculando a dose na seringa', minutes: 5,
        summary: 'Como informar a concentração da sua caneta ou frasco e ler o resultado em unidades.',
      },
      {
        id: 'aplicacoes-estoque', title: 'Aplicações e estoque em dia', minutes: 4,
        summary: 'Registre cada aplicação no calendário e saiba quando repor o medicamento.',
      },
      {
        id: 'alimentacao-treino', title: 'Alimentação e treino no app', minutes: 6,
        summary: 'Monte seu plano, marque as refeições e acompanhe os treinos da semana.',
      },
    ],
  },

  // ── E-books ─────────────────────────────────────────────────────────────────
  {
    id: 'ebook-primeiros-passos',
    kind: 'ebook',
    topic: 'inicio',
    featured: true,
    title: 'Guia das primeiras semanas',
    subtitle: 'Entenda o tratamento desde o começo',
    description:
      'Como os medicamentos da família GLP-1 agem, o que é normal sentir no início, '
      + 'como fazer a aplicação semanal com segurança e quais sinais pedem atenção do seu médico.',
    lessons: [
      {
        id: 'como-age',
        title: 'Como o medicamento age no corpo',
        body: [
          { type: 'p', text: 'Tirzepatida, semaglutida e medicamentos parecidos imitam hormônios que o próprio intestino produz depois das refeições. Esses hormônios avisam o cérebro de que você já comeu o suficiente e fazem o estômago esvaziar mais devagar.' },
          { type: 'p', text: 'O resultado aparece no dia a dia: a fome diminui, a saciedade chega mais cedo e fica mais fácil comer porções menores. A semaglutida age sobre o hormônio GLP-1; a tirzepatida age sobre dois deles, o GLP-1 e o GIP.' },
          { type: 'h', text: 'O que o medicamento não faz sozinho' },
          { type: 'p', text: 'Ele reduz o apetite, mas não escolhe o que vai no prato. Quem come pouco e mal tende a perder massa muscular junto com a gordura, sentir mais cansaço e ter mais efeitos colaterais.' },
          { type: 'tip', title: 'O tripé do resultado', text: 'Medicamento, alimentação com proteína suficiente e treino de força. Quando os três andam juntos, o peso que sai é principalmente gordura.' },
        ],
      },
      {
        id: 'primeiras-semanas',
        title: 'O que esperar nas primeiras semanas',
        body: [
          { type: 'p', text: 'O tratamento costuma começar com uma dose baixa, que o médico aumenta aos poucos. Esse escalonamento dá tempo para o corpo se acostumar e reduz os efeitos colaterais.' },
          { type: 'h', text: 'Efeitos mais comuns' },
          { type: 'list', items: [
            'Náusea, principalmente depois de refeições grandes ou gordurosas',
            'Intestino preso ou, às vezes, solto',
            'Menos fome e saciedade com pouca comida',
            'Cansaço leve nos primeiros dias após a aplicação',
          ] },
          { type: 'p', text: 'Na maioria das pessoas esses efeitos são leves e diminuem com as semanas. Eles também podem voltar por alguns dias quando a dose sobe.' },
          { type: 'h', text: 'A balança não anda em linha reta' },
          { type: 'p', text: 'Retenção de líquido, intestino, ciclo menstrual e horário da pesagem mudam o número de um dia para o outro. Compare semanas, não dias: pese-se sempre nas mesmas condições, de preferência pela manhã, em jejum.' },
          { type: 'tip', text: 'Registre os sintomas em Saúde → Sintomas. Levar esse histórico à consulta ajuda o médico a ajustar a dose.' },
        ],
      },
      {
        id: 'aplicacao',
        title: 'A aplicação semanal sem erro',
        body: [
          { type: 'p', text: 'A aplicação é subcutânea, feita uma vez por semana. Escolher um dia fixo ajuda a não esquecer — o app avisa no dia certo.' },
          { type: 'h', text: 'Onde aplicar' },
          { type: 'list', items: [
            'Barriga, a pelo menos dois dedos de distância do umbigo',
            'Frente da coxa',
            'Parte de trás do braço, se outra pessoa for aplicar',
          ] },
          { type: 'p', text: 'Mude o local a cada semana. Repetir o mesmo ponto pode deixar a pele endurecida e atrapalhar a absorção. O calendário do app guarda onde foi a última aplicação.' },
          { type: 'h', text: 'Cuidados com o medicamento' },
          { type: 'list', items: [
            'Guarde na geladeira, entre 2 °C e 8 °C, longe do congelador',
            'Não use se tiver congelado, mudado de cor ou com partículas',
            'Use agulha nova a cada aplicação e descarte em recipiente rígido',
          ] },
          { type: 'warn', text: 'Esqueceu uma dose? As regras mudam de um medicamento para outro. Siga a bula do seu e a orientação do seu médico — nunca aplique duas doses para compensar.' },
        ],
      },
      {
        id: 'sinais-de-alerta',
        title: 'Quando procurar o médico',
        body: [
          { type: 'p', text: 'Efeitos leves fazem parte da adaptação. Alguns sinais, porém, precisam de avaliação rápida.' },
          { type: 'warn', text: 'Procure atendimento se tiver dor forte e persistente na barriga (às vezes indo para as costas), vômitos que não deixam você se hidratar, pele ou olhos amarelados, inchaço no rosto ou falta de ar.' },
          { type: 'h', text: 'Fale com seu médico também se' },
          { type: 'list', items: [
            'Náusea ou intestino preso atrapalham sua rotina por vários dias',
            'Você sente tontura, fraqueza ou boca muito seca',
            'Usa outros remédios para diabetes e tem sinais de hipoglicemia (tremor, suor frio, confusão)',
            'Pretende engravidar, está grávida ou amamentando',
          ] },
          { type: 'tip', title: 'Leve dados para a consulta', text: 'O histórico de peso em Progresso e os sintomas registrados em Saúde mostram ao médico como as últimas semanas foram. Abra o app durante a consulta.' },
        ],
      },
    ],
  },
  {
    id: 'ebook-queda-cabelo',
    kind: 'ebook',
    topic: 'tratamento',
    isNew: true,
    title: 'Tirzepatida e queda de cabelo',
    subtitle: 'Manual prático para cuidar dos fios durante o emagrecimento',
    description:
      'O que explica essa relação e como cuidar da saúde capilar durante o emagrecimento? '
      + 'Informação para cuidar melhor — sem susto, sem automedicação e sem promessas milagrosas. '
      + 'Material educativo: não substitui avaliação médica, dermatológica ou nutricional.',
    lessons: [
      {
        id: 'existe-relacao',
        title: 'Tirzepatida e queda de cabelo: existe relação?',
        body: [
          { type: 'p', text: 'Sim. A queda de cabelo foi relatada nos estudos clínicos com tirzepatida, especialmente nos estudos realizados para controle de peso.' },
          { type: 'p', text: 'Na bula americana do Zepbound, a queda capilar foi relatada em 7,1% das mulheres tratadas com tirzepatida e 1,3% das mulheres que receberam placebo. Entre os homens, os registros foram de 0,5% e 0%, respectivamente.' },
          { type: 'h', text: 'O que isso significa?' },
          { type: 'p', text: 'Existe um sinal observado nos estudos, mas esses dados não comprovam que a tirzepatida ataque diretamente os folículos capilares. A perda de peso, a redução da ingestão alimentar e possíveis inadequações nutricionais podem contribuir. A relação ainda está sendo investigada.' },
          { type: 'h', text: 'Por que o cabelo pode cair?' },
          { type: 'p', text: 'Uma perda de peso importante, especialmente quando rápida ou acompanhada de alimentação insuficiente, pode funcionar como um estresse para o organismo e alterar temporariamente o ciclo dos fios. Esse padrão pode ser um eflúvio telógeno.' },
          { type: 'p', text: 'Baixa ingestão de proteínas, deficiência de ferro e outras condições também podem participar. Nem toda queda durante o tratamento tem a mesma causa.' },
          { type: 'tip', title: 'O que guardar', text: 'Não interrompa a tirzepatida por conta própria. O primeiro passo é investigar o padrão da queda, a evolução do peso, a alimentação e outras possíveis causas.' },
        ],
      },
      {
        id: 'o-que-contribui',
        title: 'O que pode estar contribuindo?',
        body: [
          { type: 'p', text: 'A queda capilar durante o emagrecimento pode ter mais de um fator envolvido. Os principais pontos a observar são:' },
          { type: 'h', text: '1. Perda de peso acentuada' },
          { type: 'p', text: 'Uma redução rápida ou expressiva de peso pode desencadear aumento temporário da queda, mesmo quando a pessoa utiliza o medicamento conforme prescrito.' },
          { type: 'h', text: '2. Pouca energia e proteína na alimentação' },
          { type: 'p', text: 'A tirzepatida pode reduzir bastante a fome. Se a pessoa passa a comer muito pouco ou deixa de consumir fontes adequadas de proteína, pode haver inadequação nutricional que prejudica funções do organismo, inclusive a manutenção dos fios.' },
          { type: 'h', text: '3. Deficiência de ferro' },
          { type: 'p', text: 'A deficiência de ferro pode estar associada à queda capilar. O risco merece atenção especial em pessoas com menstruação intensa, alimentação restritiva ou histórico de deficiência.' },
          { type: 'h', text: '4. Outras deficiências ou condições' },
          { type: 'p', text: 'Deficiências de zinco ou vitamina B12 podem contribuir em situações específicas. Alterações da tireoide, doenças recentes, estresse físico ou emocional, pós-parto e alguns medicamentos também podem estar envolvidos.' },
          { type: 'h', text: '5. Queda que já existia' },
          { type: 'p', text: 'Alopecia androgenética e outras condições podem começar ou ficar mais perceptíveis durante o emagrecimento. Por isso, não se deve atribuir automaticamente toda queda à tirzepatida.' },
          { type: 'warn', text: 'Atenção: falhas localizadas, coceira intensa, descamação, dor no couro cabeludo, vermelhidão ou perda de sobrancelhas podem indicar condições diferentes e precisam de avaliação.' },
        ],
      },
      {
        id: 'cuidar-dos-fios',
        title: 'O que fazer para cuidar dos fios?',
        body: [
          { type: 'p', text: 'O cuidado mais útil começa por evitar que o emagrecimento seja acompanhado de restrição nutricional excessiva.' },
          { type: 'h', text: '1. Não passe o dia comendo quase nada' },
          { type: 'p', text: 'Mesmo com menos fome, organize refeições que forneçam energia e nutrientes suficientes. Um nutricionista pode ajudar a ajustar a alimentação à sua rotina e ao tratamento.' },
          { type: 'h', text: '2. Cuide da ingestão de proteínas' },
          { type: 'p', text: 'Inclua fontes proteicas nas refeições, como ovos, peixes, frango, carnes, leite e derivados, ou opções vegetais como feijão, lentilha, grão-de-bico e soja. A quantidade ideal depende do peso, da composição corporal, da função renal, da atividade física e do contexto clínico.' },
          { type: 'h', text: '3. Evite dietas extremamente restritivas' },
          { type: 'p', text: 'Cortar grupos alimentares sem necessidade ou acelerar a perda de peso por conta própria pode aumentar o risco de inadequação nutricional.' },
          { type: 'h', text: '4. Mantenha uma alimentação variada' },
          { type: 'p', text: 'Frutas, verduras, legumes, fontes de proteína, leguminosas e alimentos ricos em ferro ajudam a compor uma alimentação nutricionalmente adequada.' },
          { type: 'h', text: '5. Evite agressões aos fios' },
          { type: 'p', text: 'Reduza penteados com tração, calor excessivo e procedimentos químicos agressivos quando os fios estiverem fragilizados. Esses cuidados ajudam a evitar quebra e danos à haste, mas não tratam causas internas de queda.' },
          { type: 'warn', text: 'Não altere a dose da tirzepatida por conta própria. Converse com o profissional responsável se a perda de peso estiver muito rápida, se a alimentação estiver difícil ou se a queda for importante.' },
        ],
      },
      {
        id: 'manter-ajustar-reavaliar',
        title: 'Manter, ajustar ou reavaliar: a decisão sem susto',
        body: [
          { type: 'p', text: 'Não existe uma resposta única. A decisão depende do conjunto: intensidade da queda, velocidade do emagrecimento, alimentação, efeitos adversos e estado geral de saúde. Use este semáforo para saber quando conversar com o prescritor — não como autorização para mudar a dose por conta própria.' },
          { type: 'h', text: 'Manter e acompanhar' },
          { type: 'p', text: 'Se a queda for o único sintoma, você estiver conseguindo se alimentar adequadamente e o emagrecimento ocorrer de forma gradual e acompanhada, isso não significa, por si só, que seja necessário interromper a tirzepatida. Registre a evolução da queda, cuide da ingestão de energia e proteínas e converse com o profissional que acompanha o tratamento. A queda não deve ser presumida como um efeito temporário sem investigar outras causas.' },
          { type: 'h', text: 'Reavaliar a dose e o ritmo do tratamento' },
          { type: 'p', text: 'Se náuseas, saciedade excessiva ou outros efeitos estiverem dificultando a alimentação, ou se a perda de peso estiver muito acelerada, procure o prescritor para avaliar a tolerabilidade, a ingestão nutricional e a estratégia de tratamento. O profissional poderá considerar ajustes individualizados. Não reduza, aumente ou atrase doses por conta própria.' },
          { type: 'h', text: 'Procurar avaliação médica com urgência' },
          { type: 'warn', text: 'Vômitos persistentes, sinais de desidratação, incapacidade de manter líquidos ou alimentos, fraqueza importante ou suspeita de desnutrição exigem avaliação médica rápida. Em caso de sintomas intensos ou piora importante, procure um serviço de urgência. Nessas situações, a prioridade é a segurança e a avaliação do estado clínico — não apenas a queda de cabelo.' },
          { type: 'tip', title: 'O que não fazer', text: 'Não interrompa a tirzepatida por conta própria apenas porque encontrou fios no banho ou no travesseiro. Também não ignore sintomas importantes. A decisão deve considerar sua saúde como um todo e ser tomada com o profissional responsável.' },
        ],
      },
      {
        id: 'suplementos',
        title: 'Suplementos: o que tem fundamento?',
        body: [
          { type: 'p', text: 'Suplementos não são uma solução universal para queda de cabelo. O maior benefício costuma estar em identificar e corrigir uma deficiência real.' },
          { type: 'h', text: 'Ferro' },
          { type: 'p', text: 'A deficiência pode contribuir para queda capilar. A suplementação deve ocorrer quando houver indicação, pois o excesso de ferro também oferece riscos.' },
          { type: 'h', text: 'Zinco' },
          { type: 'p', text: 'A deficiência pode afetar os cabelos. Não há benefício consistente em suplementar quem já tem níveis adequados; o excesso também pode causar problemas.' },
          { type: 'h', text: 'Vitamina D' },
          { type: 'p', text: 'Níveis baixos foram associados a alguns tipos de alopecia, mas isso não prova que suplementar pessoas sem deficiência faça o cabelo crescer. Avalie a necessidade conforme o contexto clínico.' },
          { type: 'h', text: 'Vitamina B12' },
          { type: 'p', text: 'Pode ser importante investigar em pessoas com alimentação restritiva, má absorção ou outros fatores de risco. Corrigir uma deficiência é importante para a saúde, mas não significa que a vitamina trate toda queda capilar.' },
          { type: 'h', text: 'Biotina' },
          { type: 'p', text: 'A deficiência é incomum. Não há boa evidência de que doses elevadas melhorem o cabelo em pessoas sem deficiência. A biotina também pode interferir em exames laboratoriais, inclusive alguns testes de tireoide e cardíacos. Informe ao profissional e ao laboratório se estiver usando.' },
          { type: 'h', text: 'Ômega-3 e colágeno' },
          { type: 'p', text: 'Podem ter outros usos nutricionais, mas ainda não há evidência clínica robusta de que suplementá-los trate a queda capilar associada ao emagrecimento ou à tirzepatida.' },
          { type: 'tip', title: 'Regra prática', text: 'Não monte combinações de vitaminas por conta própria. Priorize alimentação adequada, investigação da causa e correção individualizada de deficiências.' },
        ],
      },
      {
        id: 'exames',
        title: 'Exames e avaliação clínica',
        body: [
          { type: 'h', text: 'Não existe um pacote de exames obrigatório para todas as pessoas' },
          { type: 'p', text: 'A avaliação começa pela história clínica e pelo exame do couro cabeludo. O profissional considera quando a queda começou, como está acontecendo, quanto peso foi perdido, como está a alimentação, quais medicamentos e suplementos são utilizados e se existem outros sintomas.' },
          { type: 'h', text: 'Exames que podem ser considerados, conforme o caso' },
          { type: 'list', items: [
            'Hemograma: pode ajudar a identificar anemia e outras alterações.',
            'Ferritina e avaliação do ferro: quando houver suspeita de deficiência.',
            'TSH: quando houver sinais, sintomas ou histórico que indiquem investigação da tireoide.',
            'Vitamina B12, vitamina D e zinco: quando houver fatores de risco, sintomas ou suspeita clínica de deficiência.',
          ] },
          { type: 'p', text: 'A escolha deve ser individualizada. Nem todos precisam fazer todos esses exames, e resultados isolados precisam ser interpretados no contexto clínico.' },
          { type: 'h', text: 'E se for eflúvio telógeno?' },
          { type: 'p', text: 'Quando a queda é desencadeada por um fator temporário, a conduta costuma priorizar identificar e corrigir esse fator. A recuperação pode levar meses; a melhora não é imediata e varia conforme a causa e a pessoa.' },
          { type: 'p', text: 'A investigação não deve se limitar a exames de sangue. O padrão da queda e o exame do couro cabeludo ajudam a diferenciar eflúvio telógeno, alopecia androgenética e outras condições.' },
        ],
      },
      {
        id: 'minoxidil-shampoos',
        title: 'Minoxidil, shampoos e cuidados capilares',
        body: [
          { type: 'h', text: 'E minoxidil?' },
          { type: 'p', text: 'O minoxidil pode ser indicado em algumas formas de alopecia, como determinados casos de alopecia androgenética. Não é um tratamento universal para toda queda que surge durante o emagrecimento. A indicação depende do diagnóstico e deve ser discutida com dermatologista.' },
          { type: 'h', text: 'Shampoos: o que podem e o que não podem fazer' },
          { type: 'p', text: 'Shampoo não corrige causas internas de queda, como perda de peso acelerada, ingestão insuficiente de proteínas ou deficiência de ferro. Seu papel é cuidar do couro cabeludo: limpar, controlar oleosidade e tratar problemas como caspa e dermatite seborreica.' },
          { type: 'p', text: 'O cetoconazol pode ser indicado nesses quadros, mas não é um tratamento geral para queda relacionada ao emagrecimento. Se não houver problema específico no couro cabeludo, um shampoo suave costuma ser suficiente.' },
          { type: 'h', text: 'Lavar o cabelo faz cair mais?' },
          { type: 'p', text: 'Lavar o cabelo não provoca a queda que já está em curso. Quando a pessoa passa vários dias sem lavar, fios que já se desprenderam podem se acumular e sair juntos na lavagem, dando a impressão de uma queda repentina.' },
          { type: 'tip', title: 'Escolha o shampoo pelo problema real', text: 'Caspa, coceira e dermatite merecem tratamento específico. Promessas de “antiqueda” no rótulo não significam que o produto trate causas internas ou interrompa um eflúvio.' },
        ],
      },
      {
        id: 'procedimentos',
        title: 'Procedimentos, GHK-Cu e injetáveis',
        body: [
          { type: 'h', text: 'Procedimentos capilares: o que saber' },
          { type: 'p', text: 'Laser de baixa intensidade (LLLT): pode ser considerado como coadjuvante em alguns casos de alopecia androgenética. Exige uso contínuo e não substitui o diagnóstico nem corrige causas nutricionais do eflúvio.' },
          { type: 'p', text: 'Microagulhamento: há estudos, principalmente como complemento em alopecia androgenética, mas os protocolos variam. Deve ser avaliado e realizado por profissional habilitado; fazer em casa ou sobre couro cabeludo inflamado aumenta o risco de infecção e cicatrizes.' },
          { type: 'p', text: 'PRP (plasma rico em plaquetas): apresenta estudos como opção complementar em alguns casos de alopecia androgenética, mas os resultados variam conforme a técnica e a pessoa. Tem custo, exige procedimento e não é tratamento estabelecido para toda queda associada ao emagrecimento.' },
          { type: 'h', text: 'GHK-Cu e “coquetéis” injetáveis: cautela' },
          { type: 'p', text: 'O GHK-Cu (peptídeo de cobre) apresenta resultados experimentais interessantes em pesquisas laboratoriais, mas faltam estudos clínicos robustos que comprovem eficácia e segurança de sua aplicação injetável para queda capilar. Também não há protocolo clínico validado de dose e frequência para essa finalidade. Por isso, este manual não recomenda seu uso injetável.' },
          { type: 'warn', text: 'A mesma cautela vale para mesoterapia e misturas (“coquetéis”) de composição pouco clara. Produtos injetáveis sem procedência ou composição conhecida podem causar infecções, reações e outros danos.' },
          { type: 'h', text: 'Antes de aceitar um procedimento, pergunte' },
          { type: 'list', items: [
            'Qual é exatamente a substância e sua concentração?',
            'Quem preparou o produto e como sua qualidade e esterilidade são asseguradas?',
            'Qual diagnóstico está sendo tratado e quais evidências sustentam o procedimento?',
            'Quais são os riscos e como serão conduzidas possíveis complicações?',
          ] },
          { type: 'tip', text: 'Se as respostas não forem claras, não aceite o procedimento. Leve a proposta ao dermatologista antes de decidir.' },
        ],
      },
      {
        id: 'resumo-referencias',
        title: 'Resumo prático e referências',
        body: [
          { type: 'h', text: 'Se você usa tirzepatida e percebeu queda de cabelo' },
          { type: 'list', items: [
            'Registre quando a queda começou e como ela evoluiu.',
            'Observe a evolução do peso e se está conseguindo se alimentar adequadamente.',
            'Revise com o profissional sua ingestão de proteínas e a qualidade da alimentação.',
            'Investigue possíveis deficiências e outras causas, conforme avaliação clínica.',
            'Procure dermatologista se a queda for intensa, persistente ou apresentar sinais diferentes.',
            'Não suspenda nem altere a tirzepatida por conta própria.',
          ] },
          { type: 'h', text: 'Quando procurar avaliação dermatológica' },
          { type: 'p', text: 'Procure avaliação se a queda for intensa, persistente ou estiver piorando; se surgirem falhas ou áreas sem cabelo; se houver coceira importante, dor, vermelhidão, feridas ou descamação intensa; se a queda envolver sobrancelhas ou outros pelos; ou se perceber afinamento progressivo e sofrimento importante.' },
          { type: 'h', text: 'Mensagem final' },
          { type: 'p', text: 'A queda de cabelo durante o emagrecimento merece atenção, mas não precisa ser enfrentada com automedicação ou uma lista indiscriminada de suplementos. O caminho mais seguro é entender a causa, manter uma alimentação adequada, corrigir deficiências quando existirem e buscar orientação profissional. A tirzepatida deve ser utilizada conforme a indicação e o acompanhamento de quem prescreveu.' },
          { type: 'tip', text: 'Mais informação. Menos confusão. Mais autonomia com responsabilidade. — Minha Tize.' },
          { type: 'h', text: 'Referências e leituras' },
          { type: 'list', items: [
            'Eli Lilly and Company. Zepbound (tirzepatide) — Prescribing Information, seção 6.1. Queda capilar associada à redução de peso e percentuais por sexo nos estudos de controle de peso. Consultar a versão vigente. https://pi.lilly.com/us/zepbound-uspi.pdf',
            'Branyiczky MK, et al. Effects of GLP-1 Receptor Agonists on Hair Loss and Regrowth: A Systematic Review. International Journal of Dermatology. Publicado online em 31 out. 2025; edição de maio de 2026. doi:10.1111/ijd.70133. https://pubmed.ncbi.nlm.nih.gov/41174840/',
            'Gupta AK, et al. GLP-1 therapies and hair loss: A systematic review of current evidence and implications for counseling. Science Progress. 2026;109(2). doi:10.1177/00368504261444578. https://pmc.ncbi.nlm.nih.gov/articles/PMC13100445/',
            'Landells I, et al. A Canadian Algorithm on the Management of Telogen Effluvium. Journal of Cutaneous Medicine and Surgery. 2025;29(5 Suppl):15S–19S. doi:10.1177/12034754251355198. https://pubmed.ncbi.nlm.nih.gov/40671378/',
            'American Academy of Dermatology. Hair loss: Diagnosis and treatment. https://www.aad.org/public/diseases/hair-loss/treatment/diagnosis-treat',
          ] },
          { type: 'p', text: 'Nota científica: os percentuais citados referem-se aos estudos de controle de peso descritos na bula americana do Zepbound. Não representam o risco individual nem devem ser extrapolados automaticamente para todas as populações, doses ou apresentações. A associação com a redução de peso não demonstra toxicidade direta da tirzepatida sobre o folículo. As revisões disponíveis reúnem estudos heterogêneos e não estabelecem, sozinhas, causalidade. Este manual é educativo e não substitui avaliação individual, diagnóstico ou prescrição.' },
        ],
      },
    ],
  },
  {
    id: 'ebook-alimentacao',
    kind: 'ebook',
    topic: 'alimentacao',
    title: 'Comer bem com pouca fome',
    subtitle: 'Alimentação que acompanha o tratamento',
    description:
      'Com o apetite menor, cada garfada conta. Aprenda a priorizar proteína, evitar o mal-estar '
      + 'depois das refeições, cuidar do intestino e montar pratos simples para o dia a dia.',
    lessons: [
      {
        id: 'proteina',
        title: 'Proteína em primeiro lugar',
        body: [
          { type: 'p', text: 'Quando a fome diminui, o mais fácil é cortar justamente o que dá mais trabalho para comer: carne, ovos, peixe. Só que a proteína é o que protege os músculos enquanto o peso cai.' },
          { type: 'p', text: 'Perder músculo deixa o corpo mais fraco, mais cansado e com metabolismo mais lento — e aumenta a chance de recuperar o peso no futuro.' },
          { type: 'h', text: 'Como garantir a proteína do dia' },
          { type: 'list', items: [
            'Comece cada refeição pela proteína, antes do arroz ou do pão',
            'Inclua uma fonte de proteína em todas as refeições, inclusive lanches',
            'Distribua ao longo do dia: o corpo aproveita melhor porções menores e frequentes',
          ] },
          { type: 'h', text: 'Boas fontes' },
          { type: 'list', items: [
            'Ovos, frango, carne magra, peixe e atum',
            'Iogurte natural, iogurte grego, queijo cottage e ricota',
            'Feijão, lentilha, grão-de-bico e tofu',
          ] },
          { type: 'tip', text: 'Sua meta de proteína aparece em Saúde → Alimentação, calculada para o seu peso.' },
        ],
      },
      {
        id: 'sem-mal-estar',
        title: 'Comer menos sem passar mal',
        body: [
          { type: 'p', text: 'Com o estômago esvaziando mais devagar, comer além da conta causa náusea, refluxo e sensação de estufamento. A boa notícia: alguns ajustes simples resolvem a maior parte do desconforto.' },
          { type: 'list', items: [
            'Sirva porções menores — dá para repetir se ainda tiver fome',
            'Coma devagar e mastigue bem; a saciedade leva uns 20 minutos para chegar',
            'Pare no primeiro sinal de “estou satisfeito”, não quando estiver cheio',
            'Evite frituras e comidas muito gordurosas, principalmente perto da aplicação',
            'Beba líquidos entre as refeições, não junto delas',
            'Espere pelo menos 2 horas antes de deitar depois de comer',
          ] },
          { type: 'tip', title: 'Dia seguinte à aplicação', text: 'Muita gente sente mais náusea nos dois primeiros dias. Deixe para esses dias refeições leves e fáceis de digerir.' },
        ],
      },
      {
        id: 'agua-intestino',
        title: 'Água e intestino funcionando',
        body: [
          { type: 'p', text: 'Comer menos também significa ingerir menos água pelos alimentos e menos fibras. Por isso o intestino preso é uma das queixas mais comuns.' },
          { type: 'h', text: 'Hidratação' },
          { type: 'p', text: 'Uma referência prática é algo entre 35 e 40 ml de água por quilo de peso por dia. O widget de água na tela inicial já calcula a sua meta e deixa registrar com um toque.' },
          { type: 'h', text: 'Fibras sem desconforto' },
          { type: 'list', items: [
            'Aumente as fibras aos poucos: aveia, chia, frutas com casca, legumes',
            'Mamão, ameixa e kiwi ajudam o intestino a funcionar',
            'Caminhadas leves depois das refeições estimulam o trânsito intestinal',
          ] },
          { type: 'warn', text: 'Fibra sem água piora a prisão de ventre. Sempre que aumentar as fibras, aumente também a água.' },
        ],
      },
      {
        id: 'prato',
        title: 'Montando o prato do dia a dia',
        body: [
          { type: 'p', text: 'Não precisa de cardápio complicado. Um prato equilibrado segue uma divisão simples, que funciona tanto em casa quanto no restaurante.' },
          { type: 'list', items: [
            'Metade do prato: legumes e verduras',
            'Um quarto, ou um pouco mais: proteína',
            'Um quarto: arroz, batata, mandioca ou outro carboidrato',
          ] },
          { type: 'h', text: 'Lanches que sustentam' },
          { type: 'list', items: [
            'Iogurte natural com fruta',
            'Ovo cozido',
            'Queijo com uma fruta',
            'Castanhas — um punhado pequeno',
          ] },
          { type: 'tip', text: 'Em Saúde → Alimentação você encontra um cardápio pronto para o seu objetivo e pode marcar cada refeição feita.' },
        ],
      },
    ],
  },
  {
    id: 'ebook-treino',
    kind: 'ebook',
    topic: 'treino',
    title: 'Treino para manter seus músculos',
    subtitle: 'Força, energia e constância',
    description:
      'Por que o treino de força é o melhor aliado do tratamento, como começar do zero com segurança '
      + 'e o que fazer nos dias de pouca energia.',
    lessons: [
      {
        id: 'por-que-forca',
        title: 'Por que o treino de força importa',
        body: [
          { type: 'p', text: 'Quando o peso cai rápido, parte do que sai pode ser músculo. O treino de força dá ao corpo um motivo para manter essa massa — e, junto com a proteína, é a melhor forma de garantir que o peso perdido seja gordura.' },
          { type: 'list', items: [
            'Mais força e disposição no dia a dia',
            'Metabolismo mais ativo, o que ajuda a manter o resultado',
            'Melhor controle da glicose',
            'Ossos e articulações mais protegidos',
          ] },
          { type: 'tip', text: 'Caminhar é ótimo para a saúde, mas não substitui o treino de força. O ideal é ter os dois na semana.' },
        ],
      },
      {
        id: 'comecando',
        title: 'Começando do zero',
        body: [
          { type: 'p', text: 'Para quem está começando, duas ou três sessões por semana já trazem resultado. O importante é a constância, não a intensidade.' },
          { type: 'list', items: [
            'Trabalhe o corpo todo: pernas, costas, peito, ombros e abdômen',
            'Aprenda o movimento com carga leve antes de aumentar o peso',
            'Termine cada série sentindo que conseguiria fazer mais umas duas repetições',
            'Aumente a carga aos poucos, quando o exercício ficar fácil',
          ] },
          { type: 'p', text: 'Sem academia? Agachamento na cadeira, flexão apoiada na parede, ponte de glúteo e remada com elástico já são um ótimo começo.' },
          { type: 'tip', text: 'Em Saúde → Exercícios o app monta um plano semanal para o seu nível e acompanha cada treino feito.' },
          { type: 'warn', text: 'Se você tem problemas no coração, nas articulações ou pressão alta, converse com seu médico antes de começar.' },
        ],
      },
      {
        id: 'pouca-energia',
        title: 'Treinando nos dias de pouca energia',
        body: [
          { type: 'p', text: 'Comer menos pode deixar a energia oscilar, principalmente nos dias seguintes à aplicação. Isso não é motivo para desistir — é motivo para ajustar.' },
          { type: 'list', items: [
            'Faça um lanche leve com proteína 1 a 2 horas antes do treino',
            'Beba água antes, durante e depois',
            'Nos dias mais difíceis, reduza a carga ou o número de séries, mas mantenha o hábito',
            'Tontura, visão turva ou mal-estar: pare, sente-se e hidrate-se',
          ] },
          { type: 'tip', title: 'Regra de ouro', text: 'Um treino mais leve vale muito mais do que treino nenhum. O que muda o resultado é a semana, não um dia.' },
        ],
      },
    ],
  },
  {
    id: 'ebook-mente',
    kind: 'ebook',
    topic: 'mente',
    isNew: true,
    title: 'Mente, hábitos e platô',
    subtitle: 'O que sustenta o resultado',
    description:
      'Fome emocional, sono, estresse e as semanas em que a balança para: entenda o que está por trás '
      + 'de cada um e o que fazer para seguir em frente.',
    lessons: [
      {
        id: 'fome-emocional',
        title: 'Fome física ou fome emocional?',
        body: [
          { type: 'p', text: 'O medicamento reduz a fome física, mas a vontade de comer por ansiedade, tédio ou recompensa pode continuar. Saber diferenciar as duas é o primeiro passo.' },
          { type: 'list', items: [
            'Fome física chega aos poucos e aceita vários tipos de comida',
            'Fome emocional chega de repente e pede algo específico, geralmente doce ou salgado',
            'Fome física passa quando você come; a emocional costuma vir acompanhada de culpa',
          ] },
          { type: 'tip', title: 'Pausa de 10 minutos', text: 'Quando bater a vontade, beba um copo de água e espere 10 minutos fazendo outra coisa. Se ainda for fome, coma com calma e sem culpa.' },
        ],
      },
      {
        id: 'sono-estresse',
        title: 'Sono e estresse também emagrecem',
        body: [
          { type: 'p', text: 'Dormir mal aumenta os hormônios da fome e reduz a disposição para treinar. O estresse constante faz o mesmo e ainda favorece o acúmulo de gordura na barriga.' },
          { type: 'list', items: [
            'Tente dormir entre 7 e 9 horas por noite, em horários parecidos',
            'Diminua telas e luz forte na última hora antes de deitar',
            'Evite café depois do meio da tarde',
            'Reserve alguns minutos do dia para algo que acalme: caminhar, respirar fundo, conversar',
          ] },
        ],
      },
      {
        id: 'plato',
        title: 'Quando a balança para',
        body: [
          { type: 'p', text: 'Ficar algumas semanas com o peso parado é normal em qualquer emagrecimento. O corpo se adapta ao peso novo, e o ritmo de perda naturalmente diminui com o tempo.' },
          { type: 'h', text: 'Antes de se preocupar, revise' },
          { type: 'list', items: [
            'Você está comendo proteína suficiente e se hidratando bem?',
            'Os treinos de força continuam na rotina?',
            'Petiscos, bebidas e fins de semana voltaram a pesar?',
            'Como estão o sono e o estresse?',
          ] },
          { type: 'p', text: 'Muitas vezes a balança para enquanto as medidas continuam diminuindo, principalmente quando você está ganhando músculo. Acompanhe também a fita métrica e o caimento das roupas.' },
          { type: 'tip', text: 'A área Anti-platô, em Saúde, faz uma avaliação guiada e monta um plano de ajustes para as próximas semanas.' },
        ],
      },
    ],
  },
]
