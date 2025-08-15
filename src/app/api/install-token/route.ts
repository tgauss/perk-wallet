import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { getProgramByPerkId } from '@/lib/programs';

const InstallTokenRequestSchema = z.object({
  program_id: z.string(),
  perk_participant_id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { program_id, perk_participant_id } = InstallTokenRequestSchema.parse(body);
    const perkParticipantIdNum = parseInt(perk_participant_id, 10);

    console.log('Looking for program with perk_program_id:', Number(program_id));
    
    const program = await getProgramByPerkId(Number(program_id));

    console.log('Program query result:', { program });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found', debug: { program_id, perk_program_id: Number(program_id) } },
        { status: 404 }
      );
    }

    console.log('Looking for participant with perk_participant_id:', perkParticipantIdNum, 'and program.id:', program.id);
    
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('perk_participant_id', perkParticipantIdNum)
      .eq('program_id', program.id)
      .single();

    console.log('Participant query result:', { participant, error: participantError });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found', debug: { perk_participant_id: perkParticipantIdNum, program_id: program.id, error: participantError } },
        { status: 404 }
      );
    }

    const { data: passes } = await supabase
      .from('passes')
      .select('*')
      .eq('perk_participant_id', perkParticipantIdNum)
      .eq('program_id', program.id);

    if (!passes || passes.length === 0) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/test-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          perk_participant_id: perkParticipantIdNum,
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
        applePassUrl: `/api/passes/${program_id}/${perk_participant_id}/download/apple`,
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
      installUrl: `${process.env.NEXT_PUBLIC_APP_URL}/w/${program_id}/${perk_participant_id}`,
      googleSaveUrl,
      applePassUrl: `/api/passes/${program_id}/${perk_participant_id}/download/apple`,
    });
  } catch (error) {
    console.error('Install token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate install token', debug: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}