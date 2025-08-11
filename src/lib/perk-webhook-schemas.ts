import { z } from 'zod';

export const PerkParticipantSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  points: z.number().optional(),
  status: z.string().optional(),
  // Allow additional fields from Perk
}).passthrough();

export const PerkChallengeSchema = z.object({
  id: z.number(),
  points: z.number(),
  challenge_type: z.string(),
  // Allow additional fields
}).passthrough();

export const PerkRewardSchema = z.object({
  id: z.number(),
  name: z.string(),
  selection: z.string(),
  // Allow additional fields
}).passthrough();

export const PerkWebhookPayloadSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('participant_created'),
    data: z.object({
      participant: PerkParticipantSchema,
    }).passthrough(),
  }),
  z.object({
    event: z.literal('participant_points_updated'),
    data: z.object({
      participant: PerkParticipantSchema,
    }).passthrough(),
  }),
  z.object({
    event: z.literal('challenge_completed'),
    data: z.object({
      participant: PerkParticipantSchema,
      challenge: PerkChallengeSchema,
    }).passthrough(),
  }),
  z.object({
    event: z.literal('reward_earned'),
    data: z.object({
      participant: PerkParticipantSchema,
      reward: PerkRewardSchema,
    }).passthrough(),
  }),
]);

export type PerkWebhookPayload = z.infer<typeof PerkWebhookPayloadSchema>;