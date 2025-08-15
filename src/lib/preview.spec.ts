// Unit tests for preview resolver

import { describe, it, expect } from 'vitest'
import { resolveMergeTags, resolveLayoutForPreview, type PreviewContext } from './preview'

// Mock context for testing
const mockContext: PreviewContext = {
  participant: {
    perk_participant_id: 123,
    email: 'john.doe@example.com',
    fname: 'John',
    lname: 'Doe',
    points: 1250,
    unused_points: 750,
    status: 'Active',
    tier: 'Gold',
    profile_attributes: {
      favorite_color: 'Blue',
      birthday: '1990-01-15',
      city: 'San Francisco'
    }
  },
  program: {
    id: 'test-program-id',
    name: 'VIP Rewards'
  }
}

describe('resolveMergeTags', () => {
  it('resolves basic participant tags', () => {
    expect(resolveMergeTags('Hello {fname}!', mockContext)).toBe('Hello John!')
    expect(resolveMergeTags('{fname} {lname}', mockContext)).toBe('John Doe')
    expect(resolveMergeTags('Welcome {name}', mockContext)).toBe('Welcome John Doe')
    expect(resolveMergeTags('Email: {email}', mockContext)).toBe('Email: john.doe@example.com')
  })

  it('resolves points and status tags', () => {
    expect(resolveMergeTags('Points: {points}', mockContext)).toBe('Points: 1,250')
    expect(resolveMergeTags('Available: {unused_points}', mockContext)).toBe('Available: 750')
    expect(resolveMergeTags('Status: {status}', mockContext)).toBe('Status: Active')
    expect(resolveMergeTags('Tier: {tier}', mockContext)).toBe('Tier: Gold')
  })

  it('resolves program tags', () => {
    expect(resolveMergeTags('ID: {perk_participant_id}', mockContext)).toBe('ID: 123')
    expect(resolveMergeTags('Program: {program_name}', mockContext)).toBe('Program: VIP Rewards')
    expect(resolveMergeTags('ID: {program_id}', mockContext)).toBe('ID: test-program-id')
  })

  it('resolves dynamic attribute tags', () => {
    expect(resolveMergeTags('Color: {attr:favorite_color}', mockContext)).toBe('Color: Blue')
    expect(resolveMergeTags('Born: {attr:birthday}', mockContext)).toBe('Born: 1990-01-15')
    expect(resolveMergeTags('Lives in {attr:city}', mockContext)).toBe('Lives in San Francisco')
  })

  it('handles missing attribute keys gracefully', () => {
    expect(resolveMergeTags('Missing: {attr:unknown_key}', mockContext)).toBe('Missing: ')
    expect(resolveMergeTags('Default {attr:missing} text', mockContext)).toBe('Default  text')
  })

  it('handles missing participant data gracefully', () => {
    const contextWithNulls: PreviewContext = {
      ...mockContext,
      participant: {
        ...mockContext.participant,
        fname: null,
        lname: null,
        status: null,
        tier: null
      }
    }

    expect(resolveMergeTags('Hello {fname}!', contextWithNulls)).toBe('Hello !')
    expect(resolveMergeTags('Full name: {name}', contextWithNulls)).toBe('Full name: ')
    expect(resolveMergeTags('Status: {status}', contextWithNulls)).toBe('Status: ')
    expect(resolveMergeTags('Tier: {tier}', contextWithNulls)).toBe('Tier: ')
  })

  it('handles multiple tags in one string', () => {
    const input = 'Hello {fname}, you have {unused_points} points available!'
    const expected = 'Hello John, you have 750 points available!'
    expect(resolveMergeTags(input, mockContext)).toBe(expected)
  })

  it('handles repeated tags', () => {
    const input = '{fname} {fname} {fname}'
    const expected = 'John John John'
    expect(resolveMergeTags(input, mockContext)).toBe(expected)
  })

  it('leaves unknown tags unchanged', () => {
    expect(resolveMergeTags('Hello {unknown_tag}!', mockContext)).toBe('Hello {unknown_tag}!')
  })

  it('handles non-string input', () => {
    expect(resolveMergeTags(123 as any, mockContext)).toBe('123')
    expect(resolveMergeTags(null as any, mockContext)).toBe('null')
    expect(resolveMergeTags(undefined as any, mockContext)).toBe('undefined')
  })
})

describe('resolveLayoutForPreview', () => {
  it('resolves strings in simple objects', () => {
    const layout = {
      title: 'Welcome {fname}!',
      subtitle: 'You have {unused_points} points'
    }

    const resolved = resolveLayoutForPreview(layout, mockContext)

    expect(resolved).toEqual({
      title: 'Welcome John!',
      subtitle: 'You have 750 points'
    })
  })

  it('resolves strings in nested objects', () => {
    const layout = {
      header: {
        title: 'Hello {name}',
        badge: {
          text: '{tier} Member'
        }
      },
      footer: 'Contact: {email}'
    }

    const resolved = resolveLayoutForPreview(layout, mockContext)

    expect(resolved).toEqual({
      header: {
        title: 'Hello John Doe',
        badge: {
          text: 'Gold Member'
        }
      },
      footer: 'Contact: john.doe@example.com'
    })
  })

  it('resolves strings in arrays', () => {
    const layout = {
      messages: [
        'Welcome {fname}!',
        'Your status: {status}',
        'Favorite color: {attr:favorite_color}'
      ]
    }

    const resolved = resolveLayoutForPreview(layout, mockContext)

    expect(resolved).toEqual({
      messages: [
        'Welcome John!',
        'Your status: Active',
        'Favorite color: Blue'
      ]
    })
  })

  it('preserves non-string values', () => {
    const layout = {
      title: 'Welcome {fname}',
      count: 42,
      enabled: true,
      metadata: null,
      config: {
        timeout: 5000,
        retries: 3
      }
    }

    const resolved = resolveLayoutForPreview(layout, mockContext)

    expect(resolved).toEqual({
      title: 'Welcome John',
      count: 42,
      enabled: true,
      metadata: null,
      config: {
        timeout: 5000,
        retries: 3
      }
    })
  })

  it('handles complex nested structures', () => {
    const layout = {
      pass: {
        header: {
          logo: 'https://example.com/logo.png',
          title: '{program_name}',
          subtitle: 'Member: {name}'
        },
        body: {
          fields: [
            {
              label: 'Points',
              value: '{unused_points}'
            },
            {
              label: 'Status',
              value: '{tier} - {status}'
            },
            {
              label: 'Favorite',
              value: '{attr:favorite_color}'
            }
          ]
        },
        footer: {
          contact: 'Questions? Email {email}',
          id: '{perk_participant_id}'
        }
      }
    }

    const resolved = resolveLayoutForPreview(layout, mockContext)

    expect(resolved).toEqual({
      pass: {
        header: {
          logo: 'https://example.com/logo.png',
          title: 'VIP Rewards',
          subtitle: 'Member: John Doe'
        },
        body: {
          fields: [
            {
              label: 'Points',
              value: '750'
            },
            {
              label: 'Status',
              value: 'Gold - Active'
            },
            {
              label: 'Favorite',
              value: 'Blue'
            }
          ]
        },
        footer: {
          contact: 'Questions? Email john.doe@example.com',
          id: 'test-uuid-123'
        }
      }
    })
  })

  it('handles primitive values', () => {
    expect(resolveLayoutForPreview('Hello {fname}', mockContext)).toBe('Hello John')
    expect(resolveLayoutForPreview(42, mockContext)).toBe(42)
    expect(resolveLayoutForPreview(true, mockContext)).toBe(true)
    expect(resolveLayoutForPreview(null, mockContext)).toBe(null)
  })
})