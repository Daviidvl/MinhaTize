// Mensagem do dia nas notificações: todo dia, na janela da manhã
// (utils/reminderUtils.ts). O texto vai ao servidor de push e
// aparece na tela bloqueada, então nada de peso, dose ou promessa de resultado.
// Sem flexão de gênero: o app não sabe como a pessoa se identifica.

export interface MotivationMessage {
  title: string
  body: string
}

export const MOTIVATION_MESSAGES: MotivationMessage[] = [
  { title: 'Você não precisa de um dia perfeito.', body: 'Precisa só de uma escolha boa agora. Depois outra. É assim que a mudança acontece.' },
  { title: 'Constância vence pressa.', body: 'O que você repete todo dia pesa mais do que o que você faz de vez em quando.' },
  { title: 'Pequenas vitórias contam.', body: 'Um copo d\'água, uma caminhada, uma refeição tranquila. Comemore cada uma.' },
  { title: 'Progresso não é linha reta.', body: 'Tem semana que anda, tem semana que parece parada. O que importa é não desistir.' },
  { title: 'Acredite no processo.', body: 'Os resultados chegam para quem continua. E você está continuando.' },
]

// A mesma mensagem para o mesmo dia (a agenda é reenviada várias vezes e não
// pode trocar o texto); dias seguidos percorrem a lista sem repetir.
export function motivationFor(day: string): MotivationMessage {
  const [y, m, d] = day.split('-').map(Number)
  const n = Math.floor(Date.UTC(y, m - 1, d) / 864e5)
  return MOTIVATION_MESSAGES[n % MOTIVATION_MESSAGES.length]
}
