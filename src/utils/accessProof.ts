// Verificação da prova de acesso offline assinada pelo servidor
// (api/_lib/accessProof.ts). Sem internet, o app só entra com uma prova cuja
// assinatura confira com esta chave pública, que seja deste token e que não
// tenha expirado.
//
// Chave pública (SPKI DER, base64) do par de ACCESS_PROOF_PRIVATE_KEY. Não é
// segredo: só verifica, não assina. Trocar junto com a privada.
export const ACCESS_PROOF_PUBLIC_KEY =
  'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEj8U3lzDSu52LYpHPdWozA4MC9QbbRMUbFnEJF3bzuXR3PJJfL2Gn9PzP4KWuQqnupWUzxTymw6ZpWtgfeFiMPw=='

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const raw = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function sha256Hex(text: string, subtle: SubtleCrypto): Promise<string> {
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyAccessProof(
  proof: string, token: string, now = Date.now(), publicKey = ACCESS_PROOF_PUBLIC_KEY,
): Promise<boolean> {
  // Sem WebCrypto (página fora de HTTPS) não há como verificar: nega
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return false
  try {
    const [payloadB64, sigB64, extra] = proof.split('.')
    if (!payloadB64 || !sigB64 || extra !== undefined) return false

    const key = await subtle.importKey('spki', fromBase64(publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    const ok = await subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, key, fromBase64(sigB64), new TextEncoder().encode(payloadB64),
    )
    if (!ok) return false

    const payload = JSON.parse(new TextDecoder().decode(fromBase64(payloadB64))) as { fp?: unknown; exp?: unknown }
    if (typeof payload.exp !== 'number' || payload.exp <= now) return false
    return payload.fp === await sha256Hex(token, subtle)
  } catch {
    return false
  }
}
