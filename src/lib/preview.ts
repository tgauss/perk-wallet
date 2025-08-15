// Preview resolver for template merge tags

import { findMergeTags, isDynamicAttr, extractAttrKey } from './merge-tags'
import { buildQr } from './qr'

// Types for preview context
export interface PreviewParticipant {
  perk_participant_id: number
  email: string
  fname: string | null
  lname: string | null
  points: number
  unused_points: number
  status: string | null
  tier: string | null
  profile_attributes: Record<string, any>
}

export interface PreviewProgram {
  id: string
  perk_program_id: number
  name: string
}

export interface PreviewContext {
  participant: PreviewParticipant
  program: PreviewProgram
}

/**
 * Get a sample participant for preview, trying real data first then fallback
 */
export async function getSampleParticipant(
  programId: string,
  opts?: { perk_participant_id?: number; email?: string }
): Promise<PreviewParticipant> {
  try {
    // Dynamic import to avoid build-time env issues
    const { supabase } = await import('./supabase')
    
    let query = supabase
      .from('participants')
      .select('perk_participant_id, email, fname, lname, points, unused_points, status, tier, profile_attributes')
      .eq('program_id', programId)
      .limit(1)

    // Try to find specific participant if requested
    if (opts?.perk_participant_id) {
      query = query.eq('perk_participant_id', opts.perk_participant_id)
    } else if (opts?.email) {
      query = query.ilike('email', opts.email)
    }

    const { data, error } = await query.single()

    if (!error && data) {
      return {
        perk_participant_id: `perk-${data.perk_participant_id}`, // Keep for backward compat
        perk_participant_id: data.perk_participant_id,
        email: data.email,
        fname: data.fname,
        lname: data.lname,
        points: data.points || 0,
        unused_points: data.unused_points || 0,
        status: data.status,
        tier: data.tier,
        profile_attributes: data.profile_attributes || {}
      }
    }
  } catch (error) {
    console.warn('Failed to load real participant for preview:', error)
  }

  // Fallback to mock data
  return {
    perk_participant_id: 'sample-uuid-123',
    perk_participant_id: 246785,
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
  }
}

/**
 * Format numbers with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Get full name from first and last name
 */
function getFullName(fname: string | null, lname: string | null): string {
  const parts = [fname, lname].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : ''
}

/**
 * Resolve merge tags in a string with participant and program context
 */
export function resolveMergeTags(input: string, ctx: PreviewContext): string {
  if (typeof input !== 'string') {
    return String(input)
  }

  const tags = findMergeTags(input)
  let result = input

  for (const tag of tags) {
    let value = ''

    if (isDynamicAttr(tag)) {
      // Handle {attr:KEY} patterns
      const attrKey = extractAttrKey(tag)
      if (attrKey && ctx.participant.profile_attributes) {
        const attrValue = ctx.participant.profile_attributes[attrKey]
        value = attrValue ? String(attrValue) : ''
      }
    } else {
      // Handle standard tags
      switch (tag) {
        case '{fname}':
          value = ctx.participant.fname || ''
          break
        case '{lname}':
          value = ctx.participant.lname || ''
          break
        case '{name}':
          value = getFullName(ctx.participant.fname, ctx.participant.lname)
          break
        case '{email}':
          value = ctx.participant.email || ''
          break
        case '{points}':
          value = formatNumber(ctx.participant.points)
          break
        case '{unused_points}':
          value = formatNumber(ctx.participant.unused_points)
          break
        case '{status}':
          value = ctx.participant.status || ''
          break
        case '{tier}':
          value = ctx.participant.tier || ''
          break
        case '{perk_participant_id}':
          value = ctx.participant.perk_participant_id
          break
        case '{program_id}':
          value = ctx.program.id
          break
        case '{program_name}':
          value = ctx.program.name
          break
        default:
          // Unknown tag - leave as is
          continue
      }
    }

    // Replace all instances of this tag
    result = result.replace(new RegExp(escapeRegExp(tag), 'g'), value)
  }

  return result
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Compose a preview QR code payload
 */
export function composePreviewQr(
  programId: number,
  perkId: number,
  kind?: string,
  rtype?: string,
  rid?: string
): string {
  return buildQr({
    programId,
    perkParticipantId: perkId,
    passKind: kind as any,
    resourceType: rtype,
    resourceId: rid
  })
}

/**
 * Deep walk an object and resolve merge tags in all string values
 */
export function resolveLayoutForPreview(layout: unknown, ctx: PreviewContext): unknown {
  if (typeof layout === 'string') {
    return resolveMergeTags(layout, ctx)
  }

  if (Array.isArray(layout)) {
    return layout.map(item => resolveLayoutForPreview(item, ctx))
  }

  if (layout && typeof layout === 'object') {
    const resolved: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(layout)) {
      resolved[key] = resolveLayoutForPreview(value, ctx)
    }
    
    return resolved
  }

  return layout
}