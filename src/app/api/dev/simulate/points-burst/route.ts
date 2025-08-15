import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { queueNotificationEvent } from '@/lib/notify';
import { randomUUID } from 'crypto';

const SimulatePointsBurstSchema = z.object({
  program_id: z.string(),
  perk_participant_id: z.number(),
  totalEvents: z.number().min(1).max(20).default(5),
  deltaPerEvent: z.number().min(1).max(100).default(5),
  durationSec: z.number().min(10).max(300).default(90),
});

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { program_id, perk_participant_id, totalEvents, deltaPerEvent, durationSec } = 
      SimulatePointsBurstSchema.parse(body);

    console.log(`🧪 Simulating points burst: ${totalEvents} events over ${durationSec}s for participant ${perk_participant_id}`);

    // Verify participant exists
    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('perk_participant_id', perk_participant_id)
      .eq('program_id', program_id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Verify program exists and get settings
    const { data: program } = await supabase
      .from('programs')
      .select('*')
      .eq('id', program_id)
      .single();

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    const pointsDisplay = program.settings?.points_display || 'unused_points';
    
    // Calculate time intervals
    const intervalMs = (durationSec * 1000) / (totalEvents - 1);
    
    // Current points value
    const currentPoints = pointsDisplay === 'points' 
      ? participant.points 
      : participant.unused_points;
    
    // Create events with spread timing
    const events = [];
    const startTime = new Date();
    
    for (let i = 0; i < totalEvents; i++) {
      const eventTime = new Date(startTime.getTime() + (i * intervalMs));
      const pointsBefore = currentPoints + (i * deltaPerEvent);
      const pointsAfter = pointsBefore + deltaPerEvent;
      
      const event = {
        id: randomUUID(),
        program_id,
        participant_id: perk_participant_id,
        rule: 'points_updated' as const,
        data: {
          ...(pointsDisplay === 'points' 
            ? {
                points_before: pointsBefore,
                points_after: pointsAfter,
              }
            : {
                unused_points_before: pointsBefore,
                unused_points_after: pointsAfter,
              }
          ),
          simulation: true,
          burst_id: randomUUID(),
        },
        timestamp: eventTime.toISOString(),
      };
      
      events.push(event);
    }

    // Queue all events
    const notificationSettings = {
      merge_window_sec: 120,
      throttle_sec: 300,
      points_display: pointsDisplay,
    };

    // Schedule events to be processed over time
    events.forEach((event, index) => {
      setTimeout(async () => {
        await queueNotificationEvent(event, notificationSettings);
        console.log(`📨 Queued simulated event ${index + 1}/${totalEvents} at ${event.timestamp}`);
      }, index * intervalMs);
    });

    // Log the simulation job
    await supabase
      .from('jobs')
      .insert({
        type: 'points_burst_simulation',
        status: 'completed',
        payload: {
          program_id,
          perk_participant_id,
          totalEvents,
          deltaPerEvent,
          durationSec,
          pointsDisplay,
          events: events.length,
        },
        result: { 
          simulated: true, 
          events_scheduled: events.length,
          start_time: startTime.toISOString(),
          end_time: new Date(startTime.getTime() + durationSec * 1000).toISOString(),
        },
        attempts: 1,
        max_attempts: 1,
        scheduled_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

    return NextResponse.json({
      message: 'Points burst simulation started',
      simulation: {
        events_scheduled: events.length,
        duration_sec: durationSec,
        interval_ms: intervalMs,
        points_display: pointsDisplay,
        start_time: startTime.toISOString(),
        participant: {
          perk_participant_id,
          email: participant.email,
          current_points: currentPoints,
        },
      },
    });

  } catch (error) {
    console.error('Points burst simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}