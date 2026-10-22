import webpush from 'web-push'

// Chaves VAPID: identificam o MinhaTize junto aos serviços de push. Gerar uma
// vez com `npx web-push generate-vapid-keys` (ver DEPLOY.md). Trocar as chaves
// invalida todas as inscrições existentes.
let configured = false

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null
}

export function configureWebPush(): boolean {
  if (configured) return true
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  // "subject" é o contato do remetente para os serviços de push (mailto: ou https:)
  const subject = process.env.VAPID_SUBJECT || process.env.APP_URL || 'https://minhatize.vercel.app'
  webpush.setVapidDetails(subject, pub, priv)
  configured = true
  return true
}

export { webpush }
