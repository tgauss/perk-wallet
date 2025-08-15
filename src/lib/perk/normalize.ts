import { PerkParticipantSchema, PerkWebhookParticipantSchema } from './schemas';

// Normalized participant snapshot for consistent internal usage
export type ParticipantSnapshot = {
  perk_participant_id: number;
  email: string | null;
  points: number;
  unused_points: number;
  status: string | null;
  tier: string | null;
  fname: string | null;
  lname: string | null;
  tag_list: string[];
  profile: Record<string, unknown>;
};

/**
 * Normalizes raw Perk participant data into a consistent snapshot
 * @param raw - Raw participant data from Perk API or webhook
 * @returns Normalized participant snapshot
 */
export function toSnapshot(raw: unknown): ParticipantSnapshot {
  // Try full schema first, fall back to webhook schema
  let participant;
  try {
    participant = PerkParticipantSchema.parse(raw);
  } catch {
    // Fallback to webhook schema which has fewer required fields
    participant = PerkWebhookParticipantSchema.parse(raw);
  }

  return {
    perk_participant_id: participant.id,
    email: participant.email || null,
    points: participant.points || 0,
    unused_points: participant.unused_points || 0,
    status: participant.status || null,
    // Use tier with fallback to status if tier is null
    tier: participant.tier ?? participant.status ?? null,
    fname: (participant as any).first_name || null,
    lname: (participant as any).last_name || null,
    tag_list: (participant as any).tag_list || [],
    profile: (participant as any).profile_attributes || {},
  };
}

/**
 * Creates a participant snapshot from database row
 * @param row - Database participant row
 * @returns Normalized participant snapshot
 */
export function fromDatabaseRow(row: any): ParticipantSnapshot {
  return {
    perk_participant_id: parseInt(row.perk_participant_id),
    email: row.email,
    points: row.points || 0,
    unused_points: row.unused_points || 0,
    status: row.status || null,
    tier: row.tier ?? row.status ?? null, // Fallback to status if tier is null
    fname: row.fname || row.profile_attributes?.first_name || null,
    lname: row.lname || row.profile_attributes?.last_name || null,
    tag_list: row.tag_list || row.profile_attributes?.tag_list || [],
    profile: row.profile_attributes || {},
  };
}