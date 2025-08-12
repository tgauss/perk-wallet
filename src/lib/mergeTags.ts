import { ParticipantSnapshot } from './perk/normalize';

export interface MergeTagContext {
  snapshot: ParticipantSnapshot;
  program?: {
    id: string;
    name: string;
    settings?: Record<string, any>;
  };
  pointsDelta?: number;
  newPoints?: number;
}

// Registry of supported merge tags
export const SUPPORTED_TAGS = {
  // Participant fields
  points: 'Current total points',
  unused_points: 'Current unused/available points',
  status: 'Participant status',
  tier: 'Participant tier (or status if tier is null)',
  email: 'Participant email',
  fname: 'First name',
  lname: 'Last name',
  full_name: 'Full name (first + last)',
  
  // Program fields
  program_name: 'Program name',
  
  // Profile attributes (dynamic)
  'profile.*': 'Profile attributes (e.g., profile.custom_field)',
  
  // Event-specific (for notifications)
  points_delta: 'Points change amount (+ or -)',
  new_points: 'New points balance after change',
} as const;

/**
 * Resolve merge tags to their values
 * @param context - The context containing participant snapshot and program data
 * @returns Map of tag names to resolved string values
 */
export function resolveTags(context: MergeTagContext): Map<string, string> {
  const { snapshot, program, pointsDelta, newPoints } = context;
  const tags = new Map<string, string>();

  // Participant fields
  tags.set('points', String(snapshot.points || 0));
  tags.set('unused_points', String(snapshot.unused_points || 0));
  tags.set('status', snapshot.status || '');
  tags.set('tier', snapshot.tier || snapshot.status || '');
  tags.set('email', snapshot.email || '');
  tags.set('fname', snapshot.fname || '');
  tags.set('lname', snapshot.lname || '');
  tags.set('full_name', [snapshot.fname, snapshot.lname].filter(Boolean).join(' ') || '');

  // Program fields
  if (program) {
    tags.set('program_name', program.name || '');
  }

  // Profile attributes
  if (snapshot.profile && typeof snapshot.profile === 'object') {
    for (const [key, value] of Object.entries(snapshot.profile)) {
      tags.set(`profile.${key}`, String(value || ''));
    }
  }

  // Event-specific fields
  if (pointsDelta !== undefined) {
    tags.set('points_delta', pointsDelta > 0 ? `+${pointsDelta}` : String(pointsDelta));
  }
  if (newPoints !== undefined) {
    tags.set('new_points', String(newPoints));
  }

  return tags;
}

/**
 * Replace merge tags in a template string
 * @param template - Template string with {tag} placeholders
 * @param tags - Map of tag names to values
 * @returns String with tags replaced
 */
export function replaceTags(template: string, tags: Map<string, string>): string {
  let result = template;
  
  // Replace all tags in the template
  tags.forEach((value, key) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

/**
 * Extract unknown tags from a template
 * @param template - Template string to check
 * @returns Array of unknown tag names
 */
export function findUnknownTags(template: string): string[] {
  const tagPattern = /\{([^}]+)\}/g;
  const unknownTags: string[] = [];
  let match;
  
  while ((match = tagPattern.exec(template)) !== null) {
    const tag = match[1];
    
    // Check if it's a known tag
    const isKnown = 
      tag in SUPPORTED_TAGS ||
      tag === 'points_delta' ||
      tag === 'new_points' ||
      tag.startsWith('profile.');
    
    if (!isKnown) {
      unknownTags.push(tag);
    }
  }
  
  return [...new Set(unknownTags)]; // Remove duplicates
}

/**
 * Validate a template for unknown tags
 * @param template - Template string to validate
 * @returns Object with validation result and any unknown tags
 */
export function validateTemplate(template: string): {
  valid: boolean;
  unknownTags: string[];
  warnings: string[];
} {
  const unknownTags = findUnknownTags(template);
  const warnings: string[] = [];
  
  if (unknownTags.length > 0) {
    warnings.push(`Unknown tags found: ${unknownTags.map(t => `{${t}}`).join(', ')}`);
  }
  
  return {
    valid: unknownTags.length === 0,
    unknownTags,
    warnings,
  };
}