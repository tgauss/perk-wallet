import { z } from 'zod';

// Comprehensive Perk participant schema with all expected fields
export const PerkParticipantSchema = z.object({
  id: z.number(),
  email: z.string().email().nullable().default(null),
  first_name: z.string().nullable().default(null),
  last_name: z.string().nullable().default(null),
  points: z.number().default(0),
  unused_points: z.number().default(0),
  status: z.string().nullable().default(null),
  tier: z.string().nullable().default(null),
  tag_list: z.array(z.string()).default([]),
  profile_attributes: z.record(z.unknown()).default({}),
  // Additional fields that may come from Perk
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).passthrough(); // Allow additional fields from Perk API

export type PerkParticipant = z.infer<typeof PerkParticipantSchema>;

// Webhook-specific participant schema (may have fewer fields)
export const PerkWebhookParticipantSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  points: z.number().optional().default(0),
  unused_points: z.number().optional().default(0),
  status: z.string().optional(),
  tier: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  tag_list: z.array(z.string()).optional().default([]),
  profile_attributes: z.record(z.unknown()).optional().default({}),
}).passthrough();

export type PerkWebhookParticipant = z.infer<typeof PerkWebhookParticipantSchema>;