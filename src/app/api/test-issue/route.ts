import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const TestIssueRequestSchema = z.object({
  perk_participant_id: z.number(),
  program_id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { perk_participant_id, program_id } = TestIssueRequestSchema.parse(body);

    // Handle both numeric program_id and UUID program_id
    let program;
    if (/^\d+$/.test(program_id)) {
      // Numeric program_id - look up by perk_program_id
      const { data } = await supabase
        .from('programs')
        .select('*')
        .eq('perk_program_id', Number(program_id))
        .single();
      program = data;
    } else {
      // UUID program_id - look up by id
      const { data } = await supabase
        .from('programs')
        .select('*')
        .eq('id', program_id)
        .single();
      program = data;
    }

    console.log('Test issue - program lookup result:', program);

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found', debug: { program_id } },
        { status: 404 }
      );
    }

    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('perk_participant_id', perk_participant_id)
      .eq('program_id', program.id)
      .single();

    console.log('Test issue - participant lookup result:', participant);

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Just create dummy passes in the database without generating actual wallet files
    const { data: loyaltyPass } = await supabase
      .from('passes')
      .insert({
        perk_participant_id: perk_participant_id,
        program_id: program.id,
        pass_kind: 'loyalty',
        apple_serial_number: 'test-loyalty-123',
        apple_auth_token: 'test-auth-token',
        google_object_id: 'test-loyalty-obj-123',
        pass_data: { points: participant.points, tier: participant.status },
        data_hash: 'test-hash-loyalty',
        version: 1,
        last_updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    const { data: rewardsPass } = await supabase
      .from('passes')
      .insert({
        perk_participant_id: perk_participant_id,
        program_id: program.id,
        pass_kind: 'rewards',
        apple_serial_number: 'test-rewards-123',
        apple_auth_token: 'test-auth-token',
        google_object_id: 'test-rewards-obj-123',
        pass_data: { points: 0 },
        data_hash: 'test-hash-rewards',
        version: 1,
        last_updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    const installUrl = `${process.env.NEXT_PUBLIC_APP_URL}/w/${program.perk_program_id}/${perk_participant_id}`;

    return NextResponse.json({
      success: true,
      install_url: installUrl,
      google_save_url: 'https://pay.google.com/gp/v/save/test',
      passes: {
        loyalty: loyaltyPass,
        rewards: rewardsPass,
      },
    });
  } catch (error) {
    console.error('Test issue error:', error);
    return NextResponse.json(
      { error: 'Failed to test issue passes', debug: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}