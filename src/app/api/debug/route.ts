import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test programs with branding
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('*');

    // Test participants with webhook tracking
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20);

    // Test webhook events
    const { data: webhookEvents, error: webhookEventsError } = await supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // Test passes
    const { data: passes, error: passesError } = await supabase
      .from('passes')
      .select('*');

    // Program statistics
    const programStats = programs ? await Promise.all(
      programs.map(async (program) => {
        const { count: participantCount } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', program.id);

        const { count: eventCount } = await supabase
          .from('webhook_events')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', program.id);

        const { data: lastActivity } = await supabase
          .from('webhook_events')
          .select('created_at, event_type')
          .eq('program_id', program.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          program_id: program.id,
          perk_program_id: program.perk_program_id,
          name: program.name,
          participant_count: participantCount || 0,
          webhook_event_count: eventCount || 0,
          last_activity: lastActivity?.created_at || null,
          last_event_type: lastActivity?.event_type || null,
        };
      })
    ) : [];

    return NextResponse.json({
      database_status: 'connected',
      programs: { data: programs, error: programsError },
      participants: { data: participants, error: participantsError },
      webhook_events: { data: webhookEvents, error: webhookEventsError },
      passes: { data: passes, error: passesError },
      program_statistics: programStats,
      total_participants: participants?.length || 0,
      total_webhook_events: webhookEvents?.length || 0,
      multi_program_status: 'enabled',
    });
  } catch (error) {
    return NextResponse.json({
      database_status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}