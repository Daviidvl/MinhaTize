import { describe, it, expect } from 'vitest'
import { buildReminderCalendar } from '../calendarExport'
import { DEFAULT_REMINDER_SETTINGS as D } from '../reminderUtils'
import { UserProfile } from '../../types'

// 2026-10-25 é um domingo (dia 0)
const NOW = new Date(2026, 9, 25, 8, 0)
const PROFILE: UserProfile = {
  name: 'Ana', medication: 'tirzepatida', startWeight: 90, goalWeight: 70, height: 170,
  startDate: '2026-01-01', currentDose: 5, applicationDay: 0,
  weightHistory: [], diary: [], sideEffects: [],
}

describe('buildReminderCalendar', () => {
  it('cria a aplicação semanal com aviso na hora e na véspera às 20h', () => {
    const ics = buildReminderCalendar(PROFILE, D, NOW)!
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('UID:aplicacao@minhatize.app')
    expect(ics).toContain('DTSTART:20261025T090000')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=SU')
    expect(ics).toContain('SUMMARY:Aplicação de 5 mg')
    expect(ics).toContain('TRIGGER:PT0M')
    // 09:00 → 20:00 do dia anterior = 13h antes
    expect(ics).toContain('TRIGGER:-PT780M')
  })

  it('inclui a pesagem no dia escolhido', () => {
    const ics = buildReminderCalendar(PROFILE, D, NOW)!
    // Padrão: segunda às 08:00 → próxima é 26/10
    expect(ics).toContain('DTSTART:20261026T080000')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO')
  })

  it('marca a data em que o estoque chega a 4 aplicações', () => {
    const ics = buildReminderCalendar({ ...PROFILE, stock: { amouleMg: 50, ampouleML: 1, ampouleCount: 1 } }, D, NOW)!
    // 10 aplicações: a 6ª (25/10 + 5 semanas) deixa 4 no estoque
    expect(ics).toContain('DTSTART;VALUE=DATE:20261129')
    expect(ics).toContain('SUMMARY:Hora de repor o estoque')
  })

  it('modo discreto não cita dose nem medicamento', () => {
    const ics = buildReminderCalendar(PROFILE, { ...D, discreet: true }, NOW)!
    expect(ics).not.toContain('mg')
    expect(ics).toContain('SUMMARY:Lembrete MinhaTize')
  })

  it('retorna null quando não há nada de data fixa', () => {
    const s = { ...D, application: { ...D.application, enabled: false }, weighIn: { ...D.weighIn, enabled: false } }
    expect(buildReminderCalendar(PROFILE, s, NOW)).toBeNull()
  })

  it('usa CRLF e dobra linhas acima de 75 bytes', () => {
    const ics = buildReminderCalendar({ ...PROFILE, stock: { amouleMg: 50, ampouleML: 1, ampouleCount: 1 } }, D, NOW)!
    expect(ics.endsWith('\r\n')).toBe(true)
    const enc = new TextEncoder()
    for (const line of ics.split('\r\n')) expect(enc.encode(line).length).toBeLessThanOrEqual(75)
    expect(ics).toMatch(/\r\n [^\r\n]/) // a descrição do estoque é longa o bastante para dobrar
  })
})
