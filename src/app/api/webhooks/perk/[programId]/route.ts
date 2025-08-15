import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { supabase } from '@/lib/supabase';
import { PerkWebhookPayloadSchema, PerkWebhookPayload } from '@/lib/perk-webhook-schemas';
import { toSnapshot, ParticipantSnapshot } from '@/lib/perk/normalize';
import { PerkClient } from '@/lib/perk-client';
import { queueNotificationEvent } from '@/lib/notify';


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
): Promise<ParticipantSnapshot> {
  console.log('Looking for participant:', perkParticipantId, 'in program:', program.id);

  // Re-fetch participant from Perk API to get full data
  const perkClient = new PerkClient(program.api_key);
  let perkParticipant;
  try {
    perkParticipant = await perkClient.getParticipantById(String(perkParticipantId));
    if (!perkParticipant) {
      console.error('Participant not found in Perk API:', perkParticipantId);
      // Use webhook data as fallback
      perkParticipant = eventData;
    }
  } catch (error) {
    console.error('Failed to fetch participant from Perk:', error);
    // Use webhook data as fallback
    perkParticipant = eventData;
  }

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
    console.log(`Creating new participant with perk_participant_id: ${perkParticipantId} for event: ${eventType}`);

    // Create participant snapshot
    const snapshot = toSnapshot(perkParticipant);

    // Create event tracking attributes
    const eventTracking = {
      last_event_type: eventType,
      last_event_at: new Date().toISOString(),
      event_history: [{ type: eventType, timestamp: new Date().toISOString() }]
    };

    // Create new participant with all fields from snapshot
    const { data: newParticipant, error: insertError } = await supabase
      .from('participants')
      .insert({
        program_id: program.id,
        perk_participant_id: perkParticipantId,
        email: snapshot.email || email,
        points: snapshot.points,
        unused_points: snapshot.unused_points,
        status: snapshot.status || 'active',
        tier: snapshot.tier,
        fname: snapshot.fname,
        lname: snapshot.lname,
        tag_list: snapshot.tag_list,
        profile_attributes: { ...snapshot.profile, ...eventTracking },
      })
      .select()
      .single();

    console.log('Insert result:', { newParticipant, insertError });

    if (insertError) {
      throw new Error(`Failed to create participant: ${insertError.message}`);
    }

    participant = newParticipant;
  } else {
    // Create participant snapshot with latest data
    const snapshot = toSnapshot(perkParticipant);
    
    // Update existing participant with all fields from snapshot
    const updates: any = {
      perk_participant_id: perkParticipantId,
      email: snapshot.email || email,
      points: snapshot.points,
      unused_points: snapshot.unused_points,
      status: snapshot.status,
      tier: snapshot.tier,
      fname: snapshot.fname,
      lname: snapshot.lname,
      tag_list: snapshot.tag_list,
    };
    let needsUpdate = true;

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
        ...snapshot.profile,
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
        .eq('program_id', program.id)
        .eq('perk_participant_id', perkParticipantId)
        .select()
        .single();

      console.log('Update result:', { updatedParticipant, updateError });

      if (updateError) {
        throw new Error(`Failed to update participant: ${updateError.message}`);
      }

      participant = updatedParticipant;
    }
  }

  // Return normalized snapshot
  return toSnapshot(perkParticipant);
}

async function recordWebhookEvent(
  idemKey: string,
  program: any,
  perkProgramId: number,
  eventType: string,
  participant: ParticipantSnapshot,
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
      participant_id: participant.perk_participant_id,
      participant_email: participant.email,
      participant_id: participant.perk_participant_id,
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
      console.log('Upserted participant:', participant.perk_participant_id);

      // Queue notification for points_updated events
      if (body.event === 'participant_points_updated') {
        try {
          const pointsDisplay = program.settings?.points_display || 'unused_points';
          
          // Get previous points from existing participant data
          const { data: prevParticipant } = await supabase
            .from('participants')
            .select('points, unused_points')
            .eq('program_id', program.id)
        .eq('perk_participant_id', perkParticipantId)
            .single();
          
          const prevPoints = prevParticipant?.[pointsDisplay === 'points' ? 'points' : 'unused_points'] || 0;
          const newPoints = pointsDisplay === 'points' ? participant.points : participant.unused_points;
          
          await queueNotificationEvent({
            id: randomUUID(),
            program_id: program.id,
            participant_id: participant.perk_participant_id,
            rule: 'points_updated',
            data: {
              ...(pointsDisplay === 'points' 
                ? {
                    points_before: prevPoints,
                    points_after: newPoints,
                  }
                : {
                    unused_points_before: prevPoints,
                    unused_points_after: newPoints,
                  }
              ),
              webhook_event: body.event,
              participant_data: body.data.participant,
            },
            timestamp: new Date().toISOString(),
          }, {
            merge_window_sec: 120,
            throttle_sec: 300,
            points_display: pointsDisplay,
          });
          
          console.log(`📧 Queued notification for points update: ${prevPoints} → ${newPoints}`);
        } catch (notifyError) {
          console.error('Failed to queue notification:', notifyError);
          // Continue processing even if notification fails
        }
      }

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

      console.log(`✅ Successfully processed ${body.event} for participant ${participant.perk_participant_id}`);

      return NextResponse.json(
        { 
          message: 'Webhook processed successfully',
          participant_id: participant.perk_participant_id,
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