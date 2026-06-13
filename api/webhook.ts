import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ─── Kiwify payload types ─────────────────────────────────────────────────────
interface KiwifyPayload {
  token?: string           // webhook secret para verificação
  event?: string           // ex: "order_approved"
  data?: {
    buyer?: { email?: string; name?: string }
    order?: { id?: string; status?: string; payment_method?: string }
  }
  // campos alternativos (Kiwify pode variar por versão)
  order_status?: string
  customer_email?: string
  customer_name?: string
  order_id?: string
}

// ─── Verificação de autenticidade ─────────────────────────────────────────────
function isValidRequest(body: KiwifyPayload): boolean {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[webhook] KIWIFY_WEBHOOK_SECRET não configurado')
    return false
  }
  return body.token === secret
}

// ─── Normalização do payload ───────────────────────────────────────────────────
function parsePayload(body: KiwifyPayload) {
  const email   = body?.data?.buyer?.email   ?? body?.customer_email  ?? ''
  const name    = body?.data?.buyer?.name    ?? body?.customer_name   ?? ''
  const orderId = body?.data?.order?.id      ?? body?.order_id        ?? ''
  const status  = body?.data?.order?.status  ?? body?.order_status    ?? ''
  const event   = body?.event ?? ''
  const isPaid  = status === 'paid' || status === 'approved' || event === 'order_approved'
  return { email, name, orderId, isPaid }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const body = req.body as KiwifyPayload

  // 1. Verificar autenticidade
  if (!isValidRequest(body)) {
    console.warn('[webhook] Requisição não autorizada')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 2. Extrair e validar dados
  const { email, name, orderId, isPaid } = parsePayload(body)

  if (!isPaid) {
    return res.status(200).json({ received: true, action: 'ignored — not a paid event' })
  }
  if (!email) {
    console.error('[webhook] E-mail do cliente ausente')
    return res.status(400).json({ error: 'Missing customer email' })
  }

  // 3. Conectar ao Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 4. Evitar duplicatas — se já processou este pedido, reenviar e-mail
  if (orderId) {
    const { data: existing } = await supabase
      .from('tokens')
      .select('token')
      .eq('order_id', orderId)
      .maybeSingle()

    if (existing) {
      console.log('[webhook] Pedido já processado, reenviando e-mail:', orderId)
      await sendEmail(existing.token, email, name)
      return res.status(200).json({ success: true, duplicate: true })
    }
  }

  // 5. Gerar token único
  const token = crypto.randomUUID()

  // 6. Salvar no banco
  const { error: dbError } = await supabase.from('tokens').insert({
    token,
    email,
    customer_name: name,
    order_id: orderId || null,
    active: true,
  })

  if (dbError) {
    console.error('[webhook] Erro ao salvar token:', dbError.message)
    return res.status(500).json({ error: 'Database error' })
  }

  // 7. Enviar e-mail
  const emailSent = await sendEmail(token, email, name)
  if (!emailSent) {
    // Token salvo mas e-mail falhou — não retornar erro para não gerar retry duplicado
    console.error('[webhook] Token salvo mas e-mail falhou para:', email)
  }

  return res.status(200).json({ success: true })
}

// ─── Envio de e-mail ──────────────────────────────────────────────────────────
async function sendEmail(token: string, email: string, name: string): Promise<boolean> {
  try {
    const resend    = new Resend(process.env.RESEND_API_KEY)
    const appUrl    = process.env.APP_URL    ?? 'https://minhatize.vercel.app'
    const pdfUrl    = process.env.PDF_URL    ?? ''
    const fromEmail = process.env.EMAIL_FROM ?? 'noreply@minhatize.com.br'
    const accessLink = `${appUrl}/?token=${token}`

    await resend.emails.send({
      from:    `MinhaTize <${fromEmail}>`,
      to:      email,
      subject: 'Seu acesso ao MinhaTize está pronto',
      html:    buildEmailHtml({ name, accessLink, pdfUrl }),
    })
    return true
  } catch (err) {
    console.error('[sendEmail] Erro:', err)
    return false
  }
}

// ─── Template de e-mail ───────────────────────────────────────────────────────
function buildEmailHtml({ name, accessLink, pdfUrl }: {
  name: string
  accessLink: string
  pdfUrl: string
}): string {
  const firstName = name.split(' ')[0] || 'Olá'

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
          <td style="width:40px;height:40px;background:linear-gradient(135deg,#16A34A,#22C55E);border-radius:11px;text-align:center;vertical-align:middle;">
            <span style="color:#fff;font-size:18px;">🌿</span>
          </td>
          <td style="padding-left:10px;">
            <span style="font-size:17px;font-weight:900;color:#fff;letter-spacing:-0.5px;">MinhaTize</span>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Card principal -->
    <tr><td style="background:#0D1425;border:1px solid rgba(255,255,255,0.08);border-radius:22px;padding:34px 30px;">

      <p style="font-size:11px;font-weight:700;color:#22C55E;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 14px;">
        Compra confirmada ✓
      </p>
      <h1 style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.8px;line-height:1.2;margin:0 0 10px;">
        Seu acesso está pronto,<br>${firstName}.
      </h1>
      <p style="font-size:13px;color:rgba(255,255,255,0.48);line-height:1.7;margin:0 0 28px;">
        Abaixo estão seus dois acessos. Guarde este e-mail — ele é o único lugar onde esses links estarão.
      </p>

      ${pdfUrl ? `
      <!-- PDF -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.16);border-radius:14px;margin-bottom:10px;">
        <tr><td style="padding:18px 20px;">
          <p style="font-size:10px;font-weight:700;color:#22C55E;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 5px;">PDF · Guia completo</p>
          <p style="font-size:14px;font-weight:800;color:#fff;margin:0 0 14px;letter-spacing:-0.3px;">Protocolo de Tirzepatida</p>
          <a href="${pdfUrl}" style="display:inline-block;padding:10px 20px;background:rgba(34,197,94,0.14);border:1px solid rgba(34,197,94,0.28);border-radius:9px;color:#22C55E;font-size:13px;font-weight:700;text-decoration:none;">
            Baixar PDF →
          </a>
        </td></tr>
      </table>
      ` : ''}

      <!-- App -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.16);border-radius:14px;margin-bottom:24px;">
        <tr><td style="padding:18px 20px;">
          <p style="font-size:10px;font-weight:700;color:#60A5FA;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 5px;">App · Acompanhamento</p>
          <p style="font-size:14px;font-weight:800;color:#fff;margin:0 0 5px;letter-spacing:-0.3px;">MinhaTize</p>
          <p style="font-size:11px;color:rgba(255,255,255,0.38);margin:0 0 16px;line-height:1.5;">
            Este link é exclusivo seu. Não compartilhe.
          </p>
          <a href="${accessLink}" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#16A34A,#22C55E);border-radius:11px;color:#fff;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:-0.2px;">
            Acessar o app →
          </a>
        </td></tr>
      </table>

      <!-- Instrução de instalação -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;">
        <tr><td style="padding:14px 16px;">
          <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.40);margin:0 0 4px;">💡 Instalar no celular</p>
          <p style="font-size:11px;color:rgba(255,255,255,0.28);margin:0;line-height:1.65;">
            <strong style="color:rgba(255,255,255,0.38);">iPhone:</strong> abra no Safari → Compartilhar → "Adicionar à tela de início".<br>
            <strong style="color:rgba(255,255,255,0.38);">Android:</strong> abra no Chrome → menu ⋮ → "Adicionar à tela inicial".
          </p>
        </td></tr>
      </table>

    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:22px 0 0;text-align:center;">
      <p style="font-size:11px;color:rgba(255,255,255,0.18);margin:0;">
        © 2026 MinhaTize · Produto digital · Acesso via link personalizado
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`
}
