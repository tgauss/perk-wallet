import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test programs
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('*');

    // Test participants  
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*');

    // Test passes
    const { data: passes, error: passesError } = await supabase
      .from('passes')
      .select('*');

    // Test jobs table schema
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);

    // Try to inspect table schema by attempting to insert minimal data
    const { error: insertTestError } = await supabase
      .from('jobs')
      .insert({ type: 'test' });

    // Check actual participant columns by examining a specific record
    const { data: participantSample, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .limit(1)
      .single();

    return NextResponse.json({
      database_status: 'connected',
      programs: { data: programs, error: programsError },
      participants: { data: participants, error: participantsError },
      participant_sample: { data: participantSample, error: participantError },
      passes: { data: passes, error: passesError },
      jobs: { data: jobs, error: jobsError },
      jobs_insert_test: { error: insertTestError },
    });
  } catch (error) {
    return NextResponse.json({
      database_status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}