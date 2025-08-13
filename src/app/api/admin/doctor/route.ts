import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export type DoctorStatus = 'ok' | 'warn' | 'fail'

export interface DoctorItem {
  name: string
  status: DoctorStatus
  details: string
}

export interface DoctorSection {
  name: string
  items: DoctorItem[]
}

export interface DoctorResponse {
  sections: DoctorSection[]
  program_uuid?: string
  timestamp: string
}

function createItem(name: string, status: DoctorStatus, details: string): DoctorItem {
  return { name, status, details }
}

function safeCheck<T>(name: string, fn: () => T | Promise<T>): Promise<DoctorItem> {
  return Promise.resolve().then(async () => {
    try {
      const result = await fn()
      if (result === true) {
        return createItem(name, 'ok', 'Present')
      } else if (result === false) {
        return createItem(name, 'fail', 'Missing')
      } else {
        return createItem(name, 'ok', String(result))
      }
    } catch (error) {
      return createItem(name, 'fail', error instanceof Error ? error.message : 'Unknown error')
    }
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const programId = searchParams.get('program_id')
  
  let program_uuid: string | undefined
  let supabase: any
  
  try {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  } catch (error) {
    // Supabase client creation failed, we'll handle this in connectivity checks
  }

  // Environment Checks
  const envItems = await Promise.all([
    safeCheck('NEXT_PUBLIC_SUPABASE_URL', () => !!process.env.NEXT_PUBLIC_SUPABASE_URL),
    safeCheck('NEXT_PUBLIC_SUPABASE_ANON_KEY', () => !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    safeCheck('SUPABASE_SERVICE_ROLE_KEY', () => !!process.env.SUPABASE_SERVICE_ROLE_KEY),
    safeCheck('PERK_API_KEY', () => !!process.env.PERK_API_KEY),
    safeCheck('APP_EMULATOR_SECRET', () => !!process.env.APP_EMULATOR_SECRET),
    safeCheck('PERK_WEBHOOK_SECRET', () => !!process.env.PERK_WEBHOOK_SECRET),
    safeCheck('QR_SIGNING_SECRET', () => !!process.env.QR_SIGNING_SECRET),
    safeCheck('APPLE_PASS_TYPE_IDENTIFIER', () => !!process.env.APPLE_PASS_TYPE_IDENTIFIER),
    safeCheck('APPLE_WEB_SERVICE_URL', () => !!process.env.APPLE_WEB_SERVICE_URL),
    safeCheck('APPLE_AUTH_TOKEN_SECRET', () => !!process.env.APPLE_AUTH_TOKEN_SECRET),
    safeCheck('APPLE_PASS_CERT_P12_BASE64', () => !!process.env.APPLE_PASS_CERT_P12_BASE64),
    safeCheck('APPLE_PASS_CERT_PASSWORD', () => !!process.env.APPLE_PASS_CERT_PASSWORD),
    safeCheck('GOOGLE_WALLET_ISSUER_ID', () => !!process.env.GOOGLE_WALLET_ISSUER_ID),
    safeCheck('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL', () => !!process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL),
    safeCheck('GOOGLE_WALLET_SERVICE_ACCOUNT_KEY', () => !!process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY),
  ])

  // Supabase Connectivity
  const supabaseItems = await Promise.all([
    safeCheck('Basic Connection', async () => {
      if (!supabase) throw new Error('Supabase client not initialized')
      const { data, error } = await supabase.from('programs').select('1').limit(1)
      if (error) throw error
      return 'Connected successfully'
    }),
    safeCheck('Program Query', async () => {
      if (!supabase || !programId) return 'Skipped (no program_id param)'
      const { data, error } = await supabase
        .from('programs')
        .select('id')
        .eq('perk_program_id', parseInt(programId))
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        program_uuid = data.id
        return `Found program UUID: ${data.id}`
      }
      return 'Program not found'
    }),
  ])

  // Schema Checks
  const schemaItems = await Promise.all([
    safeCheck('programs table', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'programs')
        .eq('table_schema', 'public')
      
      if (error) throw error
      
      const columnNames = columns?.map(c => c.column_name) || []
      const expected = ['id', 'perk_program_id', 'name', 'branding', 'perk_api_key', 'google_class_id', 'settings', 'created_at', 'branding_fonts', 'branding_colors', 'branding_assets', 'branding_borders', 'description']
      const missing = expected.filter(col => !columnNames.includes(col))
      
      if (missing.length > 0) {
        return `Missing columns: ${missing.join(', ')}`
      }
      return `All ${expected.length} columns present`
    }),
    
    safeCheck('templates table', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'templates')
        .eq('table_schema', 'public')
      
      const columnNames = columns?.map(c => c.column_name) || []
      const expected = ['id', 'program_id', 'pass_kind', 'version', 'layout', 'assets']
      const missing = expected.filter(col => !columnNames.includes(col))
      
      if (missing.length > 0) {
        return `Missing columns: ${missing.join(', ')}`
      }
      
      // Check for old pass_type column
      if (columnNames.includes('pass_type')) {
        return 'Warning: old pass_type column still exists'
      }
      
      return `All ${expected.length} columns present, pass_kind confirmed`
    }),
    
    safeCheck('participants table', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'participants')
        .eq('table_schema', 'public')
      
      const columnNames = columns?.map(c => c.column_name) || []
      const expected = ['perk_uuid', 'program_id', 'perk_participant_id', 'email', 'points', 'unused_points', 'status', 'profile_attributes', 'tag_list', 'updated_at', 'last_webhook_event_type', 'last_webhook_event_at', 'webhook_event_count']
      const missing = expected.filter(col => !columnNames.includes(col))
      
      if (missing.length > 0) {
        return `Missing columns: ${missing.join(', ')}`
      }
      return `All ${expected.length} columns present`
    }),
    
    safeCheck('passes table', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'passes')
        .eq('table_schema', 'public')
      
      const columnNames = columns?.map(c => c.column_name) || []
      const expected = ['perk_uuid', 'program_id', 'pass_kind', 'apple_serial', 'apple_device_tokens', 'google_object_id', 'last_hash', 'last_synced_at', 'last_error']
      const missing = expected.filter(col => !columnNames.includes(col))
      
      if (missing.length > 0) {
        return `Missing columns: ${missing.join(', ')}`
      }
      return `All ${expected.length} columns present`
    }),
    
    safeCheck('jobs table', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'jobs')
        .eq('table_schema', 'public')
      
      const columnNames = columns?.map(c => c.column_name) || []
      const expected = ['id', 'kind', 'idem_key', 'payload', 'run_after', 'attempts', 'last_error', 'created_at']
      const missing = expected.filter(col => !columnNames.includes(col))
      
      if (missing.length > 0) {
        return `Missing columns: ${missing.join(', ')}`
      }
      return `All ${expected.length} columns present`
    }),
    
    safeCheck('webhook_events table', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'webhook_events')
        .eq('table_schema', 'public')
      
      const columnNames = columns?.map(c => c.column_name) || []
      const expected = ['id', 'program_id', 'perk_program_id', 'event_type', 'event_id', 'participant_id', 'participant_email', 'participant_uuid', 'event_data', 'processed_at', 'created_at']
      const missing = expected.filter(col => !columnNames.includes(col))
      
      if (missing.length > 0) {
        return `Missing columns: ${missing.join(', ')}`
      }
      return `All ${expected.length} columns present`
    }),
    
    safeCheck('RLS Policies', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      const { data: policies } = await supabase
        .from('pg_policies')
        .select('schemaname, tablename, policyname')
        .eq('schemaname', 'public')
        .in('tablename', ['programs', 'templates', 'participants', 'passes', 'jobs', 'webhook_events'])
      
      if (policies && policies.length > 0) {
        return `Warning: ${policies.length} RLS policies found (expecting none)`
      }
      return 'No RLS policies (as expected)'
    }),
  ])

  // Compatibility Checks
  const compatibilityItems = await Promise.all([
    safeCheck('Participant name columns', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'participants')
        .eq('table_schema', 'public')
        .in('column_name', ['fname', 'lname'])
      
      const hasNameColumns = columns && columns.length === 2
      if (!hasNameColumns) {
        return 'Name derived from Perk only'
      }
      return 'Database name columns available'
    }),
    
    safeCheck('Points display setting', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      const { data: programs } = await supabase
        .from('programs')
        .select('settings')
        .not('settings', 'is', null)
        .limit(5)
      
      if (!programs || programs.length === 0) {
        return 'No programs with settings found'
      }
      
      const hasPointsDisplay = programs.some(p => 
        p.settings && typeof p.settings === 'object' && 'points_display' in p.settings
      )
      
      if (!hasPointsDisplay) {
        return "Defaulting to 'unused_points' in code"
      }
      return 'Points display configured in programs'
    }),
    
    safeCheck('Apple device tokens', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'passes')
        .eq('table_schema', 'public')
        .eq('column_name', 'apple_device_tokens')
      
      if (!columns || columns.length === 0) {
        return 'Device push not persisted'
      }
      return 'Device tokens column available'
    }),
  ])

  // Route Checks
  const routeItems = await Promise.all([
    safeCheck('Install token route', () => {
      return existsSync(join(process.cwd(), 'src/app/api/install-token/route.ts'))
    }),
    safeCheck('Perk webhook route', () => {
      return existsSync(join(process.cwd(), 'src/app/api/webhooks/perk/[programId]/route.ts'))
    }),
    safeCheck('Points burst simulation', () => {
      return existsSync(join(process.cwd(), 'src/app/api/dev/simulate/points-burst/route.ts'))
    }),
    safeCheck('Admin interface', () => {
      return existsSync(join(process.cwd(), 'src/app/(admin)/admin'))
    }),
    safeCheck('Wallet route probe', async () => {
      if (!programId) return 'Skipped (no program_id param)'
      try {
        const response = await fetch(`${request.url.split('/api')[0]}/w/${programId}/test-uuid-1`, {
          method: 'GET',
          headers: { 'User-Agent': 'doctor-probe' }
        })
        return `HTTP ${response.status}`
      } catch (error) {
        return 'Route not reachable locally'
      }
    }),
  ])

  // Flow Checks
  const flowItems = await Promise.all([
    safeCheck('Install token flow', async () => {
      if (!programId) return 'Skipped (no program_id param)'
      try {
        const response = await fetch(`${request.url.split('/api')[0]}/api/install-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'doctor-probe'
          },
          body: JSON.stringify({
            program_id: programId,
            perk_uuid: 'test-uuid-1'
          })
        })
        return `HTTP ${response.status}: ${response.statusText}`
      } catch (error) {
        return `Flow error: ${error instanceof Error ? error.message : 'Unknown'}`
      }
    }),
  ])

  // Migration Checks
  const migrationItems = await Promise.all([
    safeCheck('Local migrations', async () => {
      try {
        const migrationsPath = join(process.cwd(), 'supabase/migrations')
        if (!existsSync(migrationsPath)) {
          return 'No migrations directory'
        }
        const files = await readdir(migrationsPath)
        const sqlFiles = files.filter(f => f.endsWith('.sql'))
        return `${sqlFiles.length} local migration files`
      } catch (error) {
        return 'Error reading migrations directory'
      }
    }),
    safeCheck('Applied migrations', async () => {
      if (!supabase) throw new Error('No Supabase connection')
      try {
        const { data, error } = await supabase
          .from('schema_migrations')
          .select('version')
          .order('version')
        
        if (error && error.code === '42P01') {
          return 'No schema_migrations table'
        }
        if (error) throw error
        
        return `${data?.length || 0} applied migrations`
      } catch (error) {
        return 'Cannot query schema_migrations'
      }
    }),
  ])

  const sections: DoctorSection[] = [
    { name: 'Environment', items: envItems },
    { name: 'Supabase', items: supabaseItems },
    { name: 'Schema', items: schemaItems },
    { name: 'Compatibility', items: compatibilityItems },
    { name: 'Routes', items: routeItems },
    { name: 'Flows', items: flowItems },
    { name: 'Migrations', items: migrationItems },
  ]

  const response: DoctorResponse = {
    sections,
    timestamp: new Date().toISOString(),
  }

  if (program_uuid) {
    response.program_uuid = program_uuid
  }

  return NextResponse.json(response)
}