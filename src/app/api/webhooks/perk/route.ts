import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { z } from 'zod';
import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { jobQueue } from '@/lib/jobs';
import { PerkClient } from '@/lib/perk-client';

const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.enum(['new_participant', 'points_earned', 'challenge_completed', 'reward_earned']),
  participant_id: z.string(),
  program_id: z.string(),
  data: z.record(z.string(), z.any()),
  created_at: z.string(),
});

type WebhookEvent = z.infer<typeof WebhookEventSchema>;

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}

async function checkIdempotency(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .single();
  
  return !!data;
}

async function recordWebhookEvent(event: WebhookEvent): Promise<void> {
  await supabase
    .from('webhook_events')
    .insert({
      event_id: event.id,
      event_type: event.type,
      payload: event,
    });
}

async function handleNewParticipant(event: WebhookEvent): Promise<void> {
  const { participant_id, program_id, data } = event;
  
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('perk_program_id', Number(program_id))
    .single();
  
  if (!program) {
    throw new Error(`Program not found: ${program_id}`);
  }

  const perkClient = new PerkClient(program.api_key);
  const participant = await perkClient.getParticipantById(participant_id);
  
  if (!participant) {
    throw new Error(`Participant not found: ${participant_id}`);
  }

  const { data: existingParticipant } = await supabase
    .from('participants')
    .select('id')
    .eq('perk_uuid', participant.uuid)
    .single();
  
  if (!existingParticipant) {
    await supabase
      .from('participants')
      .insert({
        perk_uuid: participant.uuid,
        program_id: program.id,
        email: participant.email,
        perk_participant_id: participant.id,
        points: participant.points,
        tier: participant.tier,
        status: participant.status,
        profile_attributes: participant.profile_attributes,
        last_sync_at: new Date().toISOString(),
      });
  }

  await jobQueue.enqueue('issue_passes', {
    perk_uuid: participant.uuid,
    program_id: program.id,
    participant_id: participant.id,
  });
}

async function handlePointsEarned(event: WebhookEvent): Promise<void> {
  const { participant_id, data } = event;
  
  await jobQueue.enqueue('sync_participant', {
    perk_participant_id: participant_id,
    trigger: 'points_earned',
    points_delta: data.points_earned,
  });
}

async function handleChallengeCompleted(event: WebhookEvent): Promise<void> {
  const { participant_id, data } = event;
  
  await jobQueue.enqueue('sync_participant', {
    perk_participant_id: participant_id,
    trigger: 'challenge_completed',
    challenge_id: data.challenge_id,
  });
}

async function handleRewardEarned(event: WebhookEvent): Promise<void> {
  const { participant_id, data } = event;
  
  await jobQueue.enqueue('update_rewards_pass', {
    perk_participant_id: participant_id,
    reward_id: data.reward_id,
    reward_name: data.reward_name,
  });
  
  await jobQueue.enqueue('send_notification', {
    perk_participant_id: participant_id,
    type: 'reward_earned',
    message: `You've earned a new reward: ${data.reward_name}`,
  });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-Perk-Secret');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    const body = await request.text();
    
    const isValid = verifyWebhookSignature(body, signature, config.PERK_WEBHOOK_SECRET);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const event = WebhookEventSchema.parse(JSON.parse(body));
    
    const isDuplicate = await checkIdempotency(event.id);
    if (isDuplicate) {
      return NextResponse.json(
        { message: 'Event already processed' },
        { status: 200 }
      );
    }

    await recordWebhookEvent(event);

    switch (event.type) {
      case 'new_participant':
        await handleNewParticipant(event);
        break;
      case 'points_earned':
        await handlePointsEarned(event);
        break;
      case 'challenge_completed':
        await handleChallengeCompleted(event);
        break;
      case 'reward_earned':
        await handleRewardEarned(event);
        break;
      default:
        console.warn(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json(
      { message: 'Webhook processed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}