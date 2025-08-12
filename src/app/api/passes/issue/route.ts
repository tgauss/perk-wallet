import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { ApplePassBuilder } from '@/lib/apple-pass';
import { GoogleWalletBuilder } from '@/lib/google-wallet';
import { PerkClient } from '@/lib/perk-client';
import { createHash } from 'crypto';
import { fromDatabaseRow } from '@/lib/perk/normalize';

const IssuePassRequestSchema = z.object({
  perk_uuid: z.string(),
  program_id: z.string(),
});

function generateDataHash(data: any): string {
  return createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { perk_uuid, program_id } = IssuePassRequestSchema.parse(body);

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

    console.log('Issue pass - program lookup result:', program);

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found', debug: { program_id } },
        { status: 404 }
      );
    }

    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('perk_uuid', perk_uuid)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    const { data: existingPasses } = await supabase
      .from('passes')
      .select('*')
      .eq('perk_uuid', perk_uuid)
      .eq('program_id', program.id);

    if (existingPasses && existingPasses.length > 0) {
      return NextResponse.json(
        { 
          message: 'Passes already issued',
          passes: existingPasses,
        },
        { status: 200 }
      );
    }

    const { data: templates } = await supabase
      .from('templates')
      .select('*')
      .eq('program_id', program.id)
      .eq('is_active', true);

    const loyaltyTemplate = templates?.find(t => t.pass_kind === 'loyalty');
    const rewardsTemplate = templates?.find(t => t.pass_kind === 'rewards');

    const applePassBuilder = new ApplePassBuilder();
    const googleWalletBuilder = new GoogleWalletBuilder();

    // Create participant snapshot from database row
    const participantSnapshot = fromDatabaseRow(participant);
    
    // Get points display preference from program settings
    const pointsDisplay = program.settings?.points_display || 'unused_points';

    const loyaltyPassData = {
      programId: program.perk_program_id,
      perkUuid: perk_uuid,
      participant: participantSnapshot,
      passType: 'loyalty' as const,
      template: loyaltyTemplate?.apple_template || {},
      pointsDisplay,
    };

    const rewardsPassData = {
      programId: program.perk_program_id,
      perkUuid: perk_uuid,
      participant: participantSnapshot,
      passType: 'rewards' as const,
      template: rewardsTemplate?.apple_template || {},
      pointsDisplay,
    };

    const { passBuffer: loyaltyApplePass, serialNumber: loyaltySerial, authToken: loyaltyAuth } = 
      await applePassBuilder.buildPass(loyaltyPassData);
    
    const { passBuffer: rewardsApplePass, serialNumber: rewardsSerial, authToken: rewardsAuth } = 
      await applePassBuilder.buildPass(rewardsPassData);

    const googleWalletLoyaltyData = {
      programId: program.perk_program_id,
      perkUuid: perk_uuid,
      participant: participantSnapshot,
      passType: 'loyalty' as const,
      template: loyaltyTemplate?.google_template || {},
      pointsDisplay,
    };

    const googleWalletRewardsData = {
      programId: program.perk_program_id,
      perkUuid: perk_uuid,
      participant: participantSnapshot,
      passType: 'rewards' as const,
      template: rewardsTemplate?.google_template || {},
      pointsDisplay,
    };

    const { saveUrl: googleSaveUrl, loyaltyObjectId, rewardsObjectId } = 
      await googleWalletBuilder.buildMultiPass(googleWalletLoyaltyData, googleWalletRewardsData);

    const loyaltyDataHash = generateDataHash(loyaltyPassData);
    const rewardsDataHash = generateDataHash(rewardsPassData);

    const { data: loyaltyPass } = await supabase
      .from('passes')
      .insert({
        perk_uuid: perk_uuid,
        program_id: program.id,
        pass_kind: 'loyalty',
        apple_serial_number: loyaltySerial,
        apple_auth_token: loyaltyAuth,
        google_object_id: loyaltyObjectId,
        pass_data: loyaltyPassData,
        data_hash: loyaltyDataHash,
        version: 1,
        last_updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    const { data: rewardsPass } = await supabase
      .from('passes')
      .insert({
        perk_uuid: perk_uuid,
        program_id: program.id,
        pass_kind: 'rewards',
        apple_serial_number: rewardsSerial,
        apple_auth_token: rewardsAuth,
        google_object_id: rewardsObjectId,
        pass_data: rewardsPassData,
        data_hash: rewardsDataHash,
        version: 1,
        last_updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    const installUrl = `${process.env.NEXT_PUBLIC_APP_URL}/w/${program.perk_program_id}/${perk_uuid}`;

    const perkClient = new PerkClient(program.api_key);
    await perkClient.updateParticipantProfileAttributes(participant.perk_participant_id, {
      wallet: {
        install_url: installUrl,
        apple: {
          loyalty_serial: loyaltySerial,
          rewards_serial: rewardsSerial,
        },
        google: {
          loyalty_object_id: loyaltyObjectId,
          rewards_object_id: rewardsObjectId,
        },
        version: 1,
        issued_at: new Date().toISOString(),
      },
    });

    await supabase
      .from('participants')
      .update({
        profile_attributes: {
          ...participant.profile_attributes,
          wallet: {
            install_url: installUrl,
            apple: {
              loyalty_serial: loyaltySerial,
              rewards_serial: rewardsSerial,
            },
            google: {
              loyalty_object_id: loyaltyObjectId,
              rewards_object_id: rewardsObjectId,
            },
            version: 1,
            issued_at: new Date().toISOString(),
          },
        },
      })
      .eq('id', participant.id);

    return NextResponse.json({
      success: true,
      install_url: installUrl,
      google_save_url: googleSaveUrl,
      passes: {
        loyalty: loyaltyPass,
        rewards: rewardsPass,
      },
    });
  } catch (error) {
    console.error('Pass issue error:', error);
    return NextResponse.json(
      { error: 'Failed to issue passes', debug: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}