import { describe, it, expect } from 'vitest'
import { buildQr, parseQr } from './qr'

describe('QR utilities', () => {
  describe('buildQr', () => {
    it('builds minimal QR for program and participant', () => {
      const result = buildQr({
        programId: 44,
        perkParticipantId: 246785
      })
      expect(result).toBe('44.246785')
    })

    it('builds QR with loyalty pass kind', () => {
      const result = buildQr({
        programId: 44,
        perkParticipantId: 246785,
        passKind: 'loyalty'
      })
      expect(result).toBe('44.246785.loyalty')
    })

    it('builds QR with coupon and resource info', () => {
      const result = buildQr({
        programId: 44,
        perkParticipantId: 246785,
        passKind: 'coupon',
        resourceType: 'offer',
        resourceId: 'COUPON-123'
      })
      expect(result).toBe('44.246785.coupon.offer.COUPON-123')
    })

    it('throws on invalid programId', () => {
      expect(() => buildQr({
        programId: 0,
        perkParticipantId: 246785
      })).toThrow('Invalid programId')
      
      expect(() => buildQr({
        programId: -1,
        perkParticipantId: 246785
      })).toThrow('Invalid programId')
    })

    it('throws on invalid perkParticipantId', () => {
      expect(() => buildQr({
        programId: 44,
        perkParticipantId: 0
      })).toThrow('Invalid perkParticipantId')
    })

    it('throws on invalid passKind', () => {
      expect(() => buildQr({
        programId: 44,
        perkParticipantId: 246785,
        passKind: 'invalid' as any
      })).toThrow('Invalid passKind: invalid')
    })
  })

  describe('parseQr', () => {
    it('parses minimal QR', () => {
      const result = parseQr('44.246785')
      expect(result).toEqual({
        programId: 44,
        perkParticipantId: 246785
      })
    })

    it('parses QR with loyalty pass kind', () => {
      const result = parseQr('44.246785.loyalty')
      expect(result).toEqual({
        programId: 44,
        perkParticipantId: 246785,
        passKind: 'loyalty'
      })
    })

    it('parses QR with coupon and resource info', () => {
      const result = parseQr('44.246785.coupon.offer.COUPON-123')
      expect(result).toEqual({
        programId: 44,
        perkParticipantId: 246785,
        passKind: 'coupon',
        resourceType: 'offer',
        resourceId: 'COUPON-123'
      })
    })

    it('returns null for invalid inputs', () => {
      expect(parseQr('')).toBeNull()
      expect(parseQr('44')).toBeNull() // Too few segments
      expect(parseQr('abc.246785')).toBeNull() // Non-numeric programId
      expect(parseQr('44.abc')).toBeNull() // Non-numeric perkParticipantId
      expect(parseQr('44.246785.invalid')).toBeNull() // Invalid passKind
      expect(parseQr('0.246785')).toBeNull() // Invalid programId (0)
      expect(parseQr('44.0')).toBeNull() // Invalid perkParticipantId (0)
    })

    it('ignores resource info without pass kind', () => {
      const result = parseQr('44.246785..offer.COUPON-123')
      expect(result).toBeNull() // Empty pass kind is invalid
    })
  })

  describe('roundtrip', () => {
    it('roundtrips loyalty example', () => {
      const original = {
        programId: 44,
        perkParticipantId: 246785,
        passKind: 'loyalty' as const
      }
      const qr = buildQr(original)
      const parsed = parseQr(qr)
      expect(parsed).toEqual(original)
    })

    it('roundtrips coupon example', () => {
      const original = {
        programId: 44,
        perkParticipantId: 246785,
        passKind: 'coupon' as const,
        resourceType: 'offer',
        resourceId: 'COUPON-123'
      }
      const qr = buildQr(original)
      const parsed = parseQr(qr)
      expect(parsed).toEqual(original)
    })

    it('roundtrips all valid pass kinds', () => {
      const kinds = ['loyalty', 'rewards', 'coupon', 'ticket', 'stamp', 'giftcard', 'id'] as const
      
      for (const passKind of kinds) {
        const original = {
          programId: 44,
          perkParticipantId: 246785,
          passKind
        }
        const qr = buildQr(original)
        const parsed = parseQr(qr)
        expect(parsed).toEqual(original)
      }
    })
  })
})