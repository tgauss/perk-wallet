import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { ApplePassBuilder } from '@/lib/apple-pass';
import { GoogleWalletBuilder } from '@/lib/google-wallet';
import { PerkClient } from '@/lib/perk-client';
import { createHash } from 'crypto';
import { getProgramByPerkId } from '@/lib/programs';

const UpdatePassRequestSchema = z.object({
  points: z.number().optional(),
  tier: z.string().optional(),
  rewards: z.array(z.record(z.string(), z.unknown())).optional(),
});

function generateDataHash(data: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string; perkParticipantId: string }> }
) {
  try {
    const { programId, perkParticipantId } = await params;
    const perkProgramId = parseInt(programId, 10);
    const perkParticipantIdNum = parseInt(perkParticipantId, 10);
    const body = await request.json();
    const updates = UpdatePassRequestSchema.parse(body);

    // First get the program to resolve the internal UUID
    const program = await getProgramByPerkId(perkProgramId);

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    const { data: participant } = await supabase
      .from('participants')
      .select('*, passes(*)')
      .eq('program_id', program.id)
      .eq('perk_participant_id', perkParticipantIdNum)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }


    const perkClient = new PerkClient(program.api_key);
    const updatedParticipant = await perkClient.getParticipantById(participant.perk_participant_id);

    if (!updatedParticipant) {
      return NextResponse.json(
        { error: 'Failed to fetch participant from Perk' },
        { status: 500 }
      );
    }

    await supabase
      .from('participants')
      .update({
        points: updatedParticipant.points,
        tier: updatedParticipant.tier,
        status: updatedParticipant.status,
        profile_attributes: updatedParticipant.profile_attributes,
        last_sync_at: new Date().toISOString(),
      })
      .eq('program_id', program.id)
      .eq('perk_participant_id', perkParticipantIdNum);

    const updatedPasses = [];
    
    for (const pass of participant.passes) {
      const newPassData = {
        ...pass.pass_data,
        points: updatedParticipant.points,
        tier: updatedParticipant.tier,
      };

      const newDataHash = generateDataHash(newPassData);

      if (newDataHash !== pass.data_hash) {
        const applePassBuilder = new ApplePassBuilder();
        const googleWalletBuilder = new GoogleWalletBuilder();

        if (pass.pass_kind === 'loyalty') {
          await googleWalletBuilder.updatePass(pass.google_object_id, {
            points: updatedParticipant.points,
            tier: updatedParticipant.tier,
          });
        }

        await supabase
          .from('passes')
          .update({
            pass_data: newPassData,
            data_hash: newDataHash,
            version: pass.version + 1,
            last_updated_at: new Date().toISOString(),
          })
          .eq('id', pass.id);

        updatedPasses.push({
          id: pass.id,
          type: pass.pass_kind,
          updated: true,
        });
      } else {
        updatedPasses.push({
          id: pass.id,
          type: pass.pass_kind,
          updated: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      participant: {
        perk_participant_id: perkParticipantIdNum,
        points: updatedParticipant.points,
        tier: updatedParticipant.tier,
      },
      passes: updatedPasses,
    });
  } catch (error) {
    console.error('Pass update error:', error);
    return NextResponse.json(
      { error: 'Failed to update passes' },
      { status: 500 }
    );
  }
}