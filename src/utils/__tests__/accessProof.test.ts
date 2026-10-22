import { describe, it, expect, beforeAll } from 'vitest'
import { generateKeyPairSync, createHash, sign, type KeyObject } from 'crypto'
import { verifyAccessProof } from '../accessProof'

// O servidor assina com a chave privada (api/_lib/accessProof.ts); aqui um par
// gerado no teste faz o papel dele.
const TOKEN = '123e4567-e89b-42d3-a456-426614174000'
const NOW = Date.parse('2026-10-22T12:00:00Z')

let privateKey: KeyObject
let publicKey: string

function makeProof(payload: object, key = privateKey): string {
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const s = sign('sha256', Buffer.from(p), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')
  return `${p}.${s}`
}

const fp = (t: string) => createHash('sha256').update(t).digest('hex')

beforeAll(() => {
  const pair = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  privateKey = pair.privateKey
  publicKey = pair.publicKey.export({ format: 'der', type: 'spki' }).toString('base64')
})

describe('verifyAccessProof', () => {
  it('aceita a prova assinada pelo servidor para este token', async () => {
    const proof = makeProof({ fp: fp(TOKEN), exp: NOW + 864e5 })
    expect(await verifyAccessProof(proof, TOKEN, NOW, publicKey)).toBe(true)
  })

  it('recusa prova expirada', async () => {
    const proof = makeProof({ fp: fp(TOKEN), exp: NOW - 1 })
    expect(await verifyAccessProof(proof, TOKEN, NOW, publicKey)).toBe(false)
  })

  it('recusa prova de outro token', async () => {
    const proof = makeProof({ fp: fp('223e4567-e89b-42d3-a456-426614174000'), exp: NOW + 864e5 })
    expect(await verifyAccessProof(proof, TOKEN, NOW, publicKey)).toBe(false)
  })

  it('recusa prova assinada por outra chave (falsificada)', async () => {
    const forger = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey
    const proof = makeProof({ fp: fp(TOKEN), exp: NOW + 864e5 }, forger)
    expect(await verifyAccessProof(proof, TOKEN, NOW, publicKey)).toBe(false)
  })

  it('recusa payload alterado depois de assinado', async () => {
    const [, sig] = makeProof({ fp: fp(TOKEN), exp: NOW + 864e5 }).split('.')
    const tampered = Buffer.from(JSON.stringify({ fp: fp(TOKEN), exp: NOW + 999 * 864e5 })).toString('base64url')
    expect(await verifyAccessProof(`${tampered}.${sig}`, TOKEN, NOW, publicKey)).toBe(false)
  })

  it('recusa lixo sem quebrar', async () => {
    for (const junk of ['', 'abc', 'a.b', 'a.b.c', '....']) {
      expect(await verifyAccessProof(junk, TOKEN, NOW, publicKey)).toBe(false)
    }
  })
})
