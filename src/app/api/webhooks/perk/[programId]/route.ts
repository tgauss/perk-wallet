import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { supabase } from '@/lib/supabase';
import { PerkWebhookPayloadSchema, PerkWebhookPayload } from '@/lib/perk-webhook-schemas';

interface ParticipantRow {
  perk_uuid: string;
  program_id: string;
  perk_participant_id: string;
  email: string;
  status: string;
  points: number;
  unused_points: number;
  profile_attributes: Record<string, unknown>;
  tag_list: string[];
  updated_at: string;
}

function generateIdempotencyKey(rawBody: string): string {
  return createHash('sha256').update(rawBody).digest('hex');
}

async function resolveProgram(programId: string) {
  console.log('Looking for program with perk_program_id:', Number(programId));
  
  const { data: program, error } = await supabase
    .from('programs')
    .select('*')
    .eq('perk_program_id', Number(programId))
    .single();

  console.log('Program lookup result:', { program, error });

  if (error || !program) {
    throw new Error(`Program not found for perk_program_id: ${programId}`);
  }

  return program;
}

async function upsertParticipant(
  program: any,
  perkParticipantId: number,
  email: string,
  eventData?: any,
  eventType?: string
): Promise<ParticipantRow> {
  console.log('Looking for participant:', perkParticipantId, 'in program:', program.id);

  // Try to find by perk_participant_id first
  let { data: participant, error: findError } = await supabase
    .from('participants')
    .select('*')
    .eq('perk_participant_id', String(perkParticipantId)) // Convert to string
    .eq('program_id', program.id)
    .single();

  console.log('Find by perk_participant_id result:', { participant, findError });

  if (!participant) {
    // Try to find by email (case-insensitive)
    const { data: participantByEmail, error: emailError } = await supabase
      .from('participants')
      .select('*')
      .ilike('email', email)
      .eq('program_id', program.id)
      .single();

    console.log('Find by email result:', { participantByEmail, emailError });
    participant = participantByEmail;
  }

  if (!participant) {
    // Generate perk_uuid - using UUID format
    const perkUuid = randomUUID();
    
    console.log(`Creating new participant with perk_uuid: ${perkUuid} for event: ${eventType}`);

    // Create event tracking attributes
    const eventTracking = {
      last_event_type: eventType,
      last_event_at: new Date().toISOString(),
      event_history: [{ type: eventType, timestamp: new Date().toISOString() }]
    };

    // Create new participant
    const { data: newParticipant, error: insertError } = await supabase
      .from('participants')
      .insert({
        perk_uuid: perkUuid,
        program_id: program.id,
        perk_participant_id: String(perkParticipantId), // Convert to string
        email: email,
        points: eventData?.points || 0,
        unused_points: eventData?.unused_points || 0,
        status: 'active',
        profile_attributes: eventTracking,
      })
      .select()
      .single();

    console.log('Insert result:', { newParticipant, insertError });

    if (insertError) {
      throw new Error(`Failed to create participant: ${insertError.message}`);
    }

    participant = newParticipant;
  } else {
    // Update existing participant - check if we need to update ID or points
    const updates: any = {};
    let needsUpdate = false;

    if (participant.perk_participant_id !== String(perkParticipantId)) {
      console.log('Updating participant perk_participant_id');
      updates.perk_participant_id = String(perkParticipantId);
      updates.email = email;
      needsUpdate = true;
    }

    // Update points if provided in event data
    if (eventData && typeof eventData.points === 'number') {
      console.log('Updating participant points from', participant.points, 'to', eventData.points);
      updates.points = eventData.points;
      needsUpdate = true;
    }

    // Update unused_points if provided in event data
    if (eventData && typeof eventData.unused_points === 'number') {
      console.log('Updating participant unused_points from', participant.unused_points, 'to', eventData.unused_points);
      updates.unused_points = eventData.unused_points;
      needsUpdate = true;
    }

    // Always update event tracking for existing participants
    if (eventType) {
      const existingAttributes = participant.profile_attributes || {};
      const eventHistory = existingAttributes.event_history || [];
      
      // Add new event to history (keep last 10 events)
      const updatedHistory = [
        { type: eventType, timestamp: new Date().toISOString() },
        ...eventHistory.slice(0, 9)
      ];

      updates.profile_attributes = {
        ...existingAttributes,
        last_event_type: eventType,
        last_event_at: new Date().toISOString(),
        event_history: updatedHistory
      };
      
      // Update webhook event tracking columns
      updates.last_webhook_event_type = eventType;
      updates.last_webhook_event_at = new Date().toISOString();
      updates.webhook_event_count = (participant.webhook_event_count || 0) + 1;
      
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log(`Updating participant for event: ${eventType}`);
      const { data: updatedParticipant, error: updateError } = await supabase
        .from('participants')
        .update(updates)
        .eq('perk_uuid', participant.perk_uuid)
        .select()
        .single();

      console.log('Update result:', { updatedParticipant, updateError });

      if (updateError) {
        throw new Error(`Failed to update participant: ${updateError.message}`);
      }

      participant = updatedParticipant;
    }
  }

  return participant as ParticipantRow;
}

async function recordWebhookEvent(
  idemKey: string,
  program: any,
  perkProgramId: number,
  eventType: string,
  participant: ParticipantRow,
  rawBody: PerkWebhookPayload
) {
  // Record the webhook event with full program context
  const { error } = await supabase
    .from('webhook_events')
    .insert({
      program_id: program.id,
      perk_program_id: perkProgramId,
      event_type: eventType,
      event_id: idemKey,
      participant_id: participant.perk_participant_id ? parseInt(participant.perk_participant_id) : null,
      participant_email: participant.email,
      participant_uuid: participant.perk_uuid,
      event_data: rawBody,
    });

  if (error) {
    console.error('Webhook event recording error:', error);
    throw new Error(`Failed to record webhook event: ${error.message}`);
  }

  console.log(`📝 Recorded webhook event: ${eventType} for program ${program.name} (${perkProgramId})`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    const { programId } = await params;
    const rawBody = await request.text();
    const idemKey = generateIdempotencyKey(rawBody);

    console.log('=== WEBHOOK START ===');
    console.log('Program ID:', programId);
    console.log('Idem key:', idemKey);

    // Parse and validate the payload
    let body: PerkWebhookPayload;
    try {
      body = PerkWebhookPayloadSchema.parse(JSON.parse(rawBody));
    } catch (error) {
      console.error('Invalid webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    console.log(`🎯 Processing Perk webhook: ${body.event} for program ${programId}`);
    console.log('📦 Event data:', JSON.stringify(body.data, null, 2));

    // Resolve program
    try {
      const program = await resolveProgram(programId);
      console.log('Program resolved:', program.id);

      // Upsert participant
      console.log('Upserting participant:', body.data.participant.id, body.data.participant.email, 'for event:', body.event);
      const participant = await upsertParticipant(
        program,
        body.data.participant.id,
        body.data.participant.email,
        body.data.participant, // Pass the full participant data for points updates
        body.event // Pass the event type for tracking
      );
      console.log('Upserted participant:', participant.perk_uuid);

      // Record webhook event with full program context
      console.log('Recording webhook event:', body.event);
      try {
        await recordWebhookEvent(
          idemKey,
          program,
          Number(programId),
          body.event,
          participant,
          body
        );
        console.log('Webhook event recorded successfully');
      } catch (eventError) {
        console.error('Webhook event recording failed, but continuing:', eventError);
        // Continue processing even if event recording fails
        // This ensures webhook still returns success to Perk
      }

      console.log(`✅ Successfully processed ${body.event} for participant ${participant.perk_uuid}`);

      return NextResponse.json(
        { 
          message: 'Webhook processed successfully',
          participant_uuid: participant.perk_uuid,
          job_type: body.event,
        },
        { status: 202 }
      );
    } catch (innerError) {
      console.error('Inner processing error:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    if (error instanceof Error && error.message.includes('Program not found')) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}