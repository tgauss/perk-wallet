// Merge tag registry for template field mapping

export interface MergeTag {
  tag: string
  label: string
  source: string
  example: string
}

export const MERGE_TAGS: MergeTag[] = [
  // Participant identity
  {
    tag: '{fname}',
    label: 'First Name',
    source: 'participant.fname',
    example: 'John'
  },
  {
    tag: '{lname}',
    label: 'Last Name', 
    source: 'participant.lname',
    example: 'Smith'
  },
  {
    tag: '{name}',
    label: 'Full Name',
    source: 'participant.fname + lname',
    example: 'John Smith'
  },
  {
    tag: '{email}',
    label: 'Email Address',
    source: 'participant.email',
    example: 'john@example.com'
  },

  // Points and status
  {
    tag: '{points}',
    label: 'Total Points',
    source: 'participant.points',
    example: '1,250'
  },
  {
    tag: '{unused_points}',
    label: 'Available Points',
    source: 'participant.unused_points', 
    example: '750'
  },
  {
    tag: '{status}',
    label: 'Participant Status',
    source: 'participant.status',
    example: 'Active'
  },
  {
    tag: '{tier}',
    label: 'Tier Level',
    source: 'participant.tier',
    example: 'Gold'
  },

  // Program context
  {
    tag: '{perk_participant_id}',
    label: 'Perk Participant ID',
    source: 'participant.perk_participant_id',
    example: '123456'
  },
  {
    tag: '{program_id}',
    label: 'Program ID',
    source: 'program.id',
    example: 'rewards-2024'
  },
  {
    tag: '{program_name}',
    label: 'Program Name',
    source: 'program.name',
    example: 'VIP Rewards'
  },

  // Dynamic attributes
  {
    tag: '{attr:KEY}',
    label: 'Custom Attribute',
    source: 'participant.profile_attributes',
    example: '{attr:favorite_color} → Blue'
  }
]

/**
 * Get list of all available merge tags
 */
export function listMergeTags(): MergeTag[] {
  return MERGE_TAGS
}

/**
 * Check if a tag is a dynamic attribute pattern
 */
export function isDynamicAttr(tag: string): boolean {
  return /^\{attr:[^}]+\}$/.test(tag)
}

/**
 * Extract attribute key from dynamic tag
 * Example: "{attr:favorite_color}" -> "favorite_color"
 */
export function extractAttrKey(tag: string): string | null {
  const match = tag.match(/^\{attr:([^}]+)\}$/)
  return match ? match[1] : null
}

/**
 * Validate if a tag is supported
 */
export function isValidMergeTag(tag: string): boolean {
  if (isDynamicAttr(tag)) {
    return true // Dynamic attributes are always valid
  }
  
  return MERGE_TAGS.some(mergeTag => mergeTag.tag === tag)
}

/**
 * Find all merge tags in a text string
 */
export function findMergeTags(text: string): string[] {
  const tagPattern = /\{[^}]+\}/g
  return text.match(tagPattern) || []
}

/**
 * Get suggestions for autocomplete based on partial input
 */
export function getMergeTagSuggestions(partial: string): MergeTag[] {
  const searchTerm = partial.toLowerCase()
  
  return MERGE_TAGS.filter(tag => 
    tag.tag.toLowerCase().includes(searchTerm) ||
    tag.label.toLowerCase().includes(searchTerm)
  )
}