import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { timingSafeEqual, randomUUID } from 'crypto'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'

// ─── Tipos do payload da Wiven ────────────────────────────────────────────────
interface WivenPayload {
  event?: string          // "TRANSACTION_PAID"
  token?: string          // token de autenticidade do webhook
  offerCode?: string
  client?: {
    id?: string
    name?: string
    email?: string
    phone?: string
    cpf?: string
  }
  transaction?: {
    id?: string
    status?: string       // "COMPLETED"
    paymentMethod?: string
    amount?: number
    createdAt?: string
    payedAt?: string
  }
  orderItems?: {
    id?: string
    price?: number
    product?: { id?: string; name?: string }
  }[]
}

// ─── Verificação de autenticidade (timing-safe) ───────────────────────────────
function isValidRequest(body: WivenPayload): boolean {
  const secret = process.env.WIVEN_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[webhook] WIVEN_WEBHOOK_SECRET não configurado')
    return false
  }
  if (!body.token || typeof body.token !== 'string') return false
  if (body.token.length !== secret.length) return false
  return timingSafeEqual(Buffer.from(body.token), Buffer.from(secret))
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Aceitar apenas POST
  if (req.method !== 'POST') return res.status(405).end()

  // Validar Content-Type
  const ct = (req.headers['content-type'] ?? '').toLowerCase()
  if (!ct.includes('application/json')) {
    return res.status(415).json({ error: 'Unsupported Media Type' })
  }

  let body: WivenPayload
  try {
    body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as WivenPayload
    if (!body || typeof body !== 'object') throw new Error()
  } catch {
    return res.status(400).json({ error: 'Invalid payload' })
  }

  // 1. Verificar autenticidade ANTES de qualquer outra coisa
  if (!isValidRequest(body)) {
    console.warn('[webhook] Token inválido recebido')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 2. Verificar evento
  if (body.event !== 'TRANSACTION_PAID') {
    return res.status(200).json({ received: true, action: 'ignored — not TRANSACTION_PAID' })
  }

  // 3. Extrair dados do comprador
  const email       = body.client?.email ?? ''
  const name        = body.client?.name  ?? ''
  const transactionId = body.transaction?.id ?? ''

  if (!email) {
    console.error('[webhook] E-mail do cliente ausente')
    return res.status(400).json({ error: 'Missing customer email' })
  }

  // 4. Conectar ao Supabase
  const supabase = getSupabaseAdmin()

  // 5. Evitar duplicatas — mesmo transaction.id não gera dois tokens
  if (transactionId) {
    const { data: existing } = await supabase
      .from('tokens')
      .select('token')
      .eq('order_id', transactionId)
      .maybeSingle()

    if (existing) {
      console.log('[webhook] Transação já processada, reenviando e-mail:', transactionId)
      await sendEmail(existing.token, email, name)
      return res.status(200).json({ success: true, duplicate: true })
    }
  }

  // 6. Gerar token único de acesso
  const token = randomUUID()

  // 7. Salvar no banco
  const { error: dbError } = await supabase.from('tokens').insert({
    token,
    email,
    customer_name: name,
    order_id:      transactionId || null,
    active:        true,
  })

  if (dbError) {
    console.error('[webhook] Erro ao salvar token:', dbError.message)
    return res.status(500).json({ error: 'Database error' })
  }

  // 8. Enviar e-mail com link de acesso
  const emailSent = await sendEmail(token, email, name)
  if (!emailSent) {
    console.error('[webhook] Token salvo mas e-mail falhou para:', email)
  }

  return res.status(200).json({ success: true })
}

// ─── Envio de e-mail via Resend ───────────────────────────────────────────────
async function sendEmail(token: string, email: string, name: string): Promise<boolean> {
  try {
    const resend     = new Resend(process.env.RESEND_API_KEY)
    const appUrl     = process.env.APP_URL    ?? 'https://minhatize.vercel.app'
    const pdfUrl     = process.env.PDF_URL    ?? ''
    const fromEmail  = process.env.EMAIL_FROM ?? 'noreply@minhatize.com.br'
    const accessLink = `${appUrl}/?token=${token}`

    await resend.emails.send({
      from:    `MinhaTize <${fromEmail}>`,
      to:      email,
      subject: 'Seu acesso ao MinhaTize está pronto',
      html:    buildEmailHtml({ name, accessLink, pdfUrl, appUrl, token }),
    })
    return true
  } catch (err) {
    console.error('[sendEmail] Erro:', err)
    return false
  }
}

// ─── Template de e-mail ───────────────────────────────────────────────────────
function buildEmailHtml({ name, accessLink, pdfUrl, appUrl, token }: {
  name: string
  accessLink: string
  pdfUrl: string
  appUrl: string
  token: string
}): string {
  const firstName = (name.split(' ')[0] || 'Olá')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const logoUrl   = `${appUrl}/LogoPng.png`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Seu acesso ao MinhaTize</title>
</head>
<body style="margin:0;padding:0;background:#060C18;font-family:Inter,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#060C18;padding:40px 16px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

    <!-- Logo -->
    <tr><td style="padding-bottom:28px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <img src="${logoUrl}" alt="MinhaTize" width="72" height="48"
              style="display:block;width:72px;height:48px;border-radius:8px;" />
          </td>
          <td style="padding-left:10px;vertical-align:middle;">
            <span style="font-size:17px;font-weight:900;color:#fff;letter-spacing:-0.5px;">MinhaTize</span>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Card principal -->
    <tr><td style="background:#0D1425;border:1px solid rgba(255,255,255,0.08);border-radius:22px;padding:34px 30px;">

      <p style="font-size:11px;font-weight:700;color:#22C55E;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 14px;">
        Compra confirmada &#10003;
      </p>
      <h1 style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.8px;line-height:1.2;margin:0 0 10px;">
        Seu acesso est&#225; pronto,<br>${firstName}.
      </h1>
      <p style="font-size:13px;color:rgba(255,255,255,0.48);line-height:1.7;margin:0 0 28px;">
        Abaixo est&#227;o seus acessos. Guarde este e-mail &#8212; ele &#233; o &#250;nico lugar onde esses links estar&#227;o.
      </p>

      ${pdfUrl ? `
      <!-- PDF -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.16);border-radius:14px;margin-bottom:10px;">
        <tr><td style="padding:18px 20px;">
          <p style="font-size:10px;font-weight:700;color:#22C55E;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 5px;">PDF &middot; Guia completo</p>
          <p style="font-size:14px;font-weight:800;color:#fff;margin:0 0 14px;letter-spacing:-0.3px;">Protocolo de Tirzepatida</p>
          <a href="${pdfUrl}" style="display:inline-block;padding:10px 20px;background:rgba(34,197,94,0.14);border:1px solid rgba(34,197,94,0.28);border-radius:9px;color:#22C55E;font-size:13px;font-weight:700;text-decoration:none;">
            Baixar PDF &#8594;
          </a>
        </td></tr>
      </table>
      ` : ''}

      <!-- App -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.16);border-radius:14px;margin-bottom:24px;">
        <tr><td style="padding:18px 20px;">
          <p style="font-size:10px;font-weight:700;color:#60A5FA;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 5px;">App &middot; Acompanhamento</p>
          <p style="font-size:14px;font-weight:800;color:#fff;margin:0 0 5px;letter-spacing:-0.3px;">MinhaTize</p>
          <p style="font-size:11px;color:rgba(255,255,255,0.38);margin:0 0 16px;line-height:1.5;">
            Este link &#233; exclusivo seu. N&#227;o compartilhe.
          </p>
          <a href="${accessLink}" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#16A34A,#22C55E);border-radius:11px;color:#fff;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:-0.2px;">
            Acessar o app &#8594;
          </a>
        </td></tr>
      </table>

      <!-- Token de acesso -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:10px;">
        <tr><td style="padding:14px 16px;">
          <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.40);margin:0 0 4px;">&#128273; Seu token de acesso</p>
          <p style="font-family:monospace;font-size:13px;font-weight:700;color:#fff;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:7px;padding:8px 10px;margin:0 0 8px;word-break:break-all;">
            ${token}
          </p>
          <p style="font-size:11px;color:rgba(255,255,255,0.28);margin:0;line-height:1.65;">
            Se voc&#234; sair da conta no app, ele vai pedir esse token para entrar de novo. &#201; o seu c&#243;digo pessoal de acesso &#8212; guarde-o junto com este e-mail.
          </p>
        </td></tr>
      </table>

      <!-- Instrucao de instalacao -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;">
        <tr><td style="padding:14px 16px;">
          <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.40);margin:0 0 4px;">&#128161; Instalar no celular</p>
          <p style="font-size:11px;color:rgba(255,255,255,0.28);margin:0;line-height:1.65;">
            <strong style="color:rgba(255,255,255,0.38);">iPhone:</strong> abra no Safari &#8594; Compartilhar &#8594; "Adicionar &#224; tela de in&#237;cio".<br>
            <strong style="color:rgba(255,255,255,0.38);">Android:</strong> abra no Chrome &#8594; menu &#8942; &#8594; "Adicionar &#224; tela inicial".
          </p>
        </td></tr>
      </table>

    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:22px 0 0;text-align:center;">
      <p style="font-size:11px;color:rgba(255,255,255,0.18);margin:0;">
        &copy; 2026 MinhaTize &middot; Produto digital &middot; Acesso via link personalizado
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`
}
