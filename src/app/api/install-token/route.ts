import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const InstallTokenRequestSchema = z.object({
  program_id: z.string(),
  perk_uuid: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { program_id, perk_uuid } = InstallTokenRequestSchema.parse(body);

    console.log('Looking for program with perk_program_id:', Number(program_id));
    
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('perk_program_id', Number(program_id))
      .single();

    console.log('Program query result:', { program, error: programError });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found', debug: { program_id, perk_program_id: Number(program_id), error: programError } },
        { status: 404 }
      );
    }

    console.log('Looking for participant with perk_uuid:', perk_uuid, 'and program.id:', program.id);
    
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('perk_uuid', perk_uuid)
      .eq('program_id', program.id)
      .single();

    console.log('Participant query result:', { participant, error: participantError });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found', debug: { perk_uuid, program_id: program.id, error: participantError } },
        { status: 404 }
      );
    }

    const { data: passes } = await supabase
      .from('passes')
      .select('*')
      .eq('perk_uuid', perk_uuid)
      .eq('program_id', program.id);

    if (!passes || passes.length === 0) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/test-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          perk_uuid,
          program_id: program.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to issue passes');
      }

      const issueData = await response.json();
      
      return NextResponse.json({
        participant: {
          email: participant.email,
          points: participant.points,
          tier: participant.status ?? '',
        },
        installUrl: issueData.install_url,
        googleSaveUrl: issueData.google_save_url,
        applePassUrl: `/api/passes/${perk_uuid}/download/apple`,
      });
    }

    const loyaltyPass = passes.find(p => p.pass_kind === 'loyalty');
    const rewardsPass = passes.find(p => p.pass_kind === 'rewards');

    const googleObjectIds = [
      loyaltyPass?.google_object_id,
      rewardsPass?.google_object_id,
    ].filter(Boolean);

    const googleSaveUrl = googleObjectIds.length > 0
      ? `https://pay.google.com/gp/v/save/${googleObjectIds.join(',')}`
      : null;

    return NextResponse.json({
      participant: {
        email: participant.email,
        points: participant.points,
        tier: participant.status ?? '',
      },
      installUrl: `${process.env.NEXT_PUBLIC_APP_URL}/w/${program_id}/${perk_uuid}`,
      googleSaveUrl,
      applePassUrl: `/api/passes/${perk_uuid}/download/apple`,
    });
  } catch (error) {
    console.error('Install token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate install token', debug: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}