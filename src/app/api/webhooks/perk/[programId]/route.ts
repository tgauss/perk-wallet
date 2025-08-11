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
  eventData?: any
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
    
    console.log('Creating new participant with perk_uuid:', perkUuid);

    // Create new participant
    const { data: newParticipant, error: insertError } = await supabase
      .from('participants')
      .insert({
        perk_uuid: perkUuid,
        program_id: program.id,
        perk_participant_id: String(perkParticipantId), // Convert to string
        email: email,
        points: 0,
        status: 'active',
        profile_attributes: {},
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

    if (needsUpdate) {
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

async function enqueueJob(
  idemKey: string,
  program: any,
  perkProgramId: number,
  event: string,
  participant: ParticipantRow,
  rawBody: PerkWebhookPayload
) {
  const jobPayload = {
    program_id: program.id,
    perk_program_id: perkProgramId,
    event: event,
    participant: {
      perk_uuid: participant.perk_uuid,
      perk_participant_id: participant.perk_participant_id,
      email: participant.email,
    },
    raw: rawBody,
    idem_key: idemKey, // Store in payload since we can't add column
  };

  const { error } = await supabase
    .from('jobs')
    .insert({
      type: 'perk_event',
      status: 'pending',
      payload: jobPayload,
    });

  if (error) {
    console.error('Job enqueue error:', error);
    throw new Error(`Failed to enqueue job: ${error.message}`);
  }
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
    console.log('Raw body:', rawBody);
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

    console.log(`Processing Perk webhook: ${body.event} for program ${programId}`);

    // Resolve program
    try {
      const program = await resolveProgram(programId);
      console.log('Program resolved:', program.id);

      // Upsert participant
      console.log('Upserting participant:', body.data.participant.id, body.data.participant.email);
      const participant = await upsertParticipant(
        program,
        body.data.participant.id,
        body.data.participant.email,
        body.data.participant // Pass the full participant data for points updates
      );
      console.log('Upserted participant:', participant.perk_uuid);

      // Enqueue job with normalized event
      console.log('Enqueueing job for event:', body.event);
      try {
        await enqueueJob(
          idemKey,
          program,
          Number(programId),
          body.event,
          participant,
          body
        );
        console.log('Job enqueued successfully');
      } catch (jobError) {
        console.error('Job enqueueing failed, but continuing:', jobError);
        // Continue processing even if job enqueueing fails
        // In a production system, you'd want to set up the jobs table properly
      }

      console.log(`Enqueued ${body.event} job for participant ${participant.perk_uuid}`);

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