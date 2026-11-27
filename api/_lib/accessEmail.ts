import { Resend } from 'resend'

// E-mail de acesso enviado depois do pagamento. Usado pelo webhook e pelo cron
// de recuperação (api/billing-cron.ts), sempre a partir da fila email_outbox.

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string }

// idempotencyKey: a mesma chave em toda tentativa do mesmo e-mail. O Resend
// devolve o envio anterior em vez de mandar de novo (dentro da janela de
// retenção dele — ver DEPLOY.md).
export async function sendAccessEmail(
  { token, email, name }: { token: string; email: string; name: string },
  idempotencyKey: string,
): Promise<SendResult> {
  try {
    const resend     = new Resend(process.env.RESEND_API_KEY)
    const appUrl     = process.env.APP_URL    ?? 'https://minhatize.vercel.app'
    const pdfUrl     = process.env.PDF_URL    ?? `${appUrl}/guia-instalacao.pdf`
    const fromEmail  = process.env.EMAIL_FROM ?? 'noreply@minhatize.com.br'
    // Link limpo, sem token na URL: o app sempre pede o token na tela de entrada.
    const accessLink = appUrl

    // O SDK do Resend não lança exceção em erro de API (domínio não verificado,
    // chave inválida, destinatário rejeitado): devolve { data: null, error }.
    const { data, error } = await resend.emails.send({
      from:    `MinhaTize <${fromEmail}>`,
      to:      email,
      subject: 'Seu acesso ao MinhaTize está pronto',
      html:    buildEmailHtml({ name, accessLink, pdfUrl, appUrl, token }),
    }, { idempotencyKey })
    if (error) {
      console.error('[sendEmail] Resend recusou o envio:', error.name, error.message)
      return { ok: false, error: `${error.name}: ${error.message}`.slice(0, 300) }
    }
    return { ok: true, id: data?.id ?? null }
  } catch (err) {
    console.error('[sendEmail] Erro:', err)
    return { ok: false, error: String((err as Error)?.message ?? err).slice(0, 300) }
  }
}

// ─── Template de e-mail ───────────────────────────────────────────────────────
export function buildEmailHtml({ name, accessLink, pdfUrl, appUrl, token }: {
  name: string
  accessLink: string
  pdfUrl: string
  appUrl: string
  token: string
}): string {
  const firstName = (name.split(' ')[0] || 'Olá')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const logoUrl   = `${appUrl}/logo-mark.png`
  const divider   = '<div style="border-top:1px solid #EAEFF6;margin:28px 0;line-height:0;font-size:0;">&nbsp;</div>'

  const step = (n: string, text: string) => `
        <tr>
          <td width="28" valign="top" style="padding-bottom:16px;">
            <div style="width:22px;height:22px;border-radius:50%;background:#EEF4FF;color:#1A52C9;font-size:11px;font-weight:800;text-align:center;line-height:22px;">${n}</div>
          </td>
          <td valign="top" style="padding-bottom:16px;padding-left:12px;">
            <p style="font-size:13.5px;color:#364C6E;line-height:1.65;margin:0;">${text}</p>
          </td>
        </tr>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Seu acesso ao MinhaTize</title>
</head>
<body style="margin:0;padding:0;background:#F6F9FC;font-family:Inter,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F9FC;padding:48px 16px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">

    <!-- Logo -->
    <tr><td style="padding-bottom:28px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <img src="${logoUrl}" alt="MinhaTize" width="34" height="34"
              style="display:block;width:34px;height:34px;" />
          </td>
          <td style="padding-left:11px;vertical-align:middle;">
            <span style="font-size:15px;font-weight:800;color:#0A1628;letter-spacing:-0.3px;">MinhaTize</span>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Card principal -->
    <tr><td style="background:#FFFFFF;border:1px solid #EAEFF6;border-radius:20px;padding:40px 36px;box-shadow:0 4px 20px rgba(10,22,40,0.06);">

      <p style="font-size:11px;font-weight:800;color:#00A882;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">
        Pagamento confirmado
      </p>
      <h1 style="font-size:25px;font-weight:800;color:#0A1628;letter-spacing:-0.6px;line-height:1.3;margin:0 0 12px;">
        Tudo pronto, ${firstName}.
      </h1>
      <p style="font-size:14px;color:#637A9A;line-height:1.7;margin:0;">
        Seu protocolo de Tirzepatida j&#225; est&#225; liberado. Veja abaixo como acessar o app de acompanhamento e baixar o material completo.
      </p>

      ${divider}

      <!-- Passo a passo -->
      <p style="font-size:11px;font-weight:800;color:#96ABCA;letter-spacing:0.06em;text-transform:uppercase;margin:0 0 18px;">
        Como acessar o app
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${step('1', 'Toque no bot&#227;o <strong style="color:#0A1628;">Abrir o app</strong>, logo abaixo.')}
        ${step('2', 'Na tela de entrada, cole o <strong style="color:#0A1628;">token de acesso</strong> que est&#225; neste e-mail.')}
        ${step('3', 'Pronto &#8212; o acesso fica salvo no aparelho. S&#243; ser&#225; pedido de novo se voc&#234; sair da conta.')}
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
        <tr><td align="center">
          <a href="${accessLink}" style="display:block;width:100%;box-sizing:border-box;padding:15px 20px;background:linear-gradient(135deg,#2E6FEB,#7B5CF5);border-radius:14px;color:#FFFFFF;font-size:14.5px;font-weight:700;text-decoration:none;text-align:center;letter-spacing:-0.1px;box-shadow:0 6px 20px rgba(46,111,235,0.28);">
            Abrir o app
          </a>
        </td></tr>
      </table>

      <!-- Token -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#F7F9FC;border:1px solid #EAEFF6;border-radius:14px;">
        <tr><td style="padding:16px 18px;">
          <p style="font-size:10.5px;font-weight:800;color:#96ABCA;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 7px;">Seu token de acesso</p>
          <p style="font-family:'SFMono-Regular',Consolas,monospace;font-size:13.5px;font-weight:700;color:#0A1628;margin:0;word-break:break-all;">
            ${token}
          </p>
        </td></tr>
      </table>
      <p style="font-size:11.5px;color:#96ABCA;line-height:1.6;margin:10px 0 0;">
        C&#243;digo pessoal e intransfer&#237;vel. N&#227;o compartilhe com outras pessoas.
      </p>

      ${pdfUrl ? `
      ${divider}

      <!-- PDF -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="middle">
            <p style="font-size:14px;font-weight:700;color:#0A1628;margin:0 0 3px;">Guia de instala&#231;&#227;o</p>
            <p style="font-size:12px;color:#637A9A;margin:0;">Passo a passo com imagens: acesso e instala&#231;&#227;o no celular</p>
          </td>
          <td align="right" valign="middle">
            <a href="${pdfUrl}" style="display:inline-block;padding:10px 18px;border:1.5px solid #D3DDED;border-radius:10px;color:#1A52C9;font-size:12.5px;font-weight:700;text-decoration:none;white-space:nowrap;">
              Baixar PDF
            </a>
          </td>
        </tr>
      </table>
      ` : ''}

      ${divider}

      <!-- Instalar no celular -->
      <p style="font-size:11px;font-weight:800;color:#96ABCA;letter-spacing:0.06em;text-transform:uppercase;margin:0 0 10px;">
        Instalar como app no celular
      </p>
      <p style="font-size:12.5px;color:#637A9A;margin:0;line-height:1.7;">
        <strong style="color:#364C6E;">iPhone:</strong> abra o link no Safari, toque em Compartilhar e selecione "Adicionar &#224; Tela de In&#237;cio".<br>
        <strong style="color:#364C6E;">Android:</strong> abra o link no Chrome, toque no menu &#8942; e selecione "Adicionar &#224; tela inicial".
      </p>

    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:26px 8px 0;text-align:center;">
      <p style="font-size:11.5px;color:#96ABCA;margin:0 0 4px;line-height:1.6;">
        D&#250;vidas sobre o acesso? Responda este e-mail que a gente ajuda.
      </p>
      <p style="font-size:11px;color:#C1CEE2;margin:0;">
        &copy; 2026 MinhaTize
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`
}
