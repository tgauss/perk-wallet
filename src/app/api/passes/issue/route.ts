import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { ApplePassBuilder } from '@/lib/apple-pass';
import { GoogleWalletBuilder } from '@/lib/google-wallet';
import { PerkClient } from '@/lib/perk-client';
import { createHash, randomBytes } from 'crypto';
import { fromDatabaseRow } from '@/lib/perk/normalize';
import { PKPass } from 'passkit-generator';
import { qrSigner } from '@/lib/qr-code';

const IssuePassRequestSchema = z.object({
  perk_uuid: z.string(),
  program_id: z.union([z.string(), z.number()]),
  pass_kind: z.enum(['loyalty', 'rewards']).optional(),
  download: z.boolean().optional(), // If true, return the .pkpass file directly
});

function generateDataHash(data: any): string {
  return createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { perk_uuid, program_id, pass_kind = 'loyalty', download = false } = IssuePassRequestSchema.parse(body);

    // Handle both numeric program_id and UUID program_id
    let program;
    const programIdStr = String(program_id);
    if (/^\d+$/.test(programIdStr)) {
      // Numeric program_id - look up by perk_program_id
      const { data } = await supabase
        .from('programs')
        .select('*')
        .eq('perk_program_id', Number(programIdStr))
        .single();
      program = data;
    } else {
      // UUID program_id - look up by id
      const { data } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programIdStr)
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

    // If download is requested, return a single .pkpass file
    if (download) {
      // Check if pass_kind is valid
      const { data: template } = await supabase
        .from('templates')
        .select('*')
        .eq('program_id', program.id)
        .eq('pass_kind', pass_kind)
        .eq('is_active', true)
        .single();

      if (!template) {
        return NextResponse.json(
          { error: `Template not found for pass_kind: ${pass_kind}` },
          { status: 404 }
        );
      }

      // Check required Apple environment variables
      const requiredEnvVars = [
        'APPLE_PASS_TYPE_IDENTIFIER',
        'APPLE_TEAM_IDENTIFIER', 
        'APPLE_WEB_SERVICE_URL',
        'APPLE_AUTH_TOKEN_SECRET',
        'APPLE_PASS_CERT_P12_BASE64',
        'APPLE_PASS_CERT_PASSWORD'
      ];
      
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          return NextResponse.json(
            { error: `Missing required environment variable: ${envVar}` },
            { status: 400 }
          );
        }
      }

      const participantSnapshot = fromDatabaseRow(participant);
      const pointsDisplay = program.settings?.points_display || 'unused_points';
      const displayPoints = pointsDisplay === 'points' 
        ? participantSnapshot.points 
        : participantSnapshot.unused_points;

      // Generate serial number and get auth token
      const serialNumber = randomBytes(16).toString('hex').toUpperCase();
      const authToken = process.env.APPLE_AUTH_TOKEN_SECRET!;
      
      // Generate QR code data
      const qrData = qrSigner.generateQRData(perk_uuid);

      // Build basePass with style based on pass_kind
      let basePass: any = {
        formatVersion: 1,
        passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER!,
        serialNumber: serialNumber,
        teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER!,
        organizationName: program.name || 'Perk Wallet',
        description: pass_kind === 'loyalty' ? 'Loyalty Card' : 'Rewards Card',
        webServiceURL: process.env.APPLE_WEB_SERVICE_URL!,
        authenticationToken: authToken,
        groupingIdentifier: String(program.perk_program_id),
        backgroundColor: 'rgb(60, 65, 76)',
        foregroundColor: 'rgb(255, 255, 255)',
        labelColor: 'rgb(255, 255, 255)',
        barcodes: [{
          format: 'PKBarcodeFormatQR',
          message: qrData,
          messageEncoding: 'iso-8859-1'
        }]
      };

      // Add pass-specific style section
      if (pass_kind === 'loyalty') {
        basePass.storeCard = {
          primaryFields: [{
            key: 'points',
            label: 'POINTS',
            value: displayPoints
          }],
          secondaryFields: [{
            key: 'tier',
            label: 'TIER',
            value: participantSnapshot.tier || 'Member'
          }],
          auxiliaryFields: [{
            key: 'member',
            label: 'MEMBER',
            value: [participantSnapshot.fname, participantSnapshot.lname].filter(Boolean).join(' ') || participantSnapshot.email || 'Member'
          }]
        };
      } else {
        basePass.generic = {
          primaryFields: [{
            key: 'rewards',
            label: 'REWARDS',
            value: `${displayPoints} Available`
          }],
          secondaryFields: [{
            key: 'status',
            label: 'STATUS',
            value: 'Active'
          }],
          auxiliaryFields: [{
            key: 'member',
            label: 'MEMBER',
            value: [participantSnapshot.fname, participantSnapshot.lname].filter(Boolean).join(' ') || participantSnapshot.email || 'Member'
          }]
        };
      }

      // Create minimal icon and logo (1x1 transparent PNG)
      const icon = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      const logo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

      // Create PKPass with pass.json buffer in first argument
      const buffers = {
        'icon.png': icon,
        'icon@2x.png': icon,
        'logo.png': logo,
        'logo@2x.png': logo,
        'pass.json': Buffer.from(JSON.stringify(basePass))
      };
      
      const pass = new PKPass(buffers, {
        wwdr: '', // Skip WWDR for now
        signerCert: process.env.APPLE_PASS_CERT_P12_BASE64!,
        signerKey: process.env.APPLE_PASS_CERT_P12_BASE64!,
        signerKeyPassphrase: process.env.APPLE_PASS_CERT_PASSWORD!
      }, {}); // No overrides needed
      
      const passBuffer = await pass.getAsBuffer();
      
      if (!passBuffer || passBuffer.length === 0) {
        return NextResponse.json(
          { error: 'Failed to generate pass' },
          { status: 500 }
        );
      }

      // Store or update the pass record
      const passData = {
        programId: program.perk_program_id,
        perkUuid: perk_uuid,
        participant: participantSnapshot,
        passType: pass_kind as 'loyalty' | 'rewards',
        template: template.apple_template || {},
        pointsDisplay,
      };
      
      await supabase
        .from('passes')
        .upsert({
          perk_uuid: perk_uuid,
          program_id: program.id,
          pass_kind: pass_kind,
          apple_serial_number: serialNumber,
          apple_auth_token: authToken,
          apple_device_tokens: [],
          last_updated_at: new Date().toISOString(),
          data_hash: generateDataHash(passData),
          pass_data: passData,
          version: 1,
        }, {
          onConflict: 'perk_uuid,program_id,pass_kind'
        });

      // Return the .pkpass file
      return new NextResponse(passBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `attachment; filename="${pass_kind}-${perk_uuid}.pkpass"`,
          'Content-Length': passBuffer.length.toString()
        }
      });
    }

    // Original flow - create both passes and return JSON
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