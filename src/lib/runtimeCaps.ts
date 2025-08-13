import { createClient } from '@supabase/supabase-js'

export interface RuntimeCapabilities {
  hasParticipantNameColumns: boolean
  hasAppleDeviceTokens: boolean
  hasSchemaMigrations: boolean
  hasPointsDisplaySetting: boolean
}

let cachedCaps: RuntimeCapabilities | null = null
let lastCheck = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getRuntimeCapabilities(): Promise<RuntimeCapabilities> {
  const now = Date.now()
  
  if (cachedCaps && (now - lastCheck) < CACHE_TTL) {
    return cachedCaps
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check for participant name columns
    const { data: participantColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'participants')
      .eq('table_schema', 'public')
      .in('column_name', ['fname', 'lname'])

    const hasParticipantNameColumns = participantColumns && participantColumns.length === 2

    // Check for apple device tokens column
    const { data: deviceTokenColumn } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'passes')
      .eq('table_schema', 'public')
      .eq('column_name', 'apple_device_tokens')

    const hasAppleDeviceTokens = deviceTokenColumn && deviceTokenColumn.length > 0

    // Check for schema migrations table
    const { error: migrationsError } = await supabase
      .from('schema_migrations')
      .select('version')
      .limit(1)

    const hasSchemaMigrations = !migrationsError || migrationsError.code !== '42P01'

    // Check for points display setting in any program
    const { data: programs } = await supabase
      .from('programs')
      .select('settings')
      .not('settings', 'is', null)
      .limit(5)

    const hasPointsDisplaySetting = programs?.some(p => 
      p.settings && typeof p.settings === 'object' && 'points_display' in p.settings
    ) || false

    cachedCaps = {
      hasParticipantNameColumns,
      hasAppleDeviceTokens,
      hasSchemaMigrations,
      hasPointsDisplaySetting,
    }
    
    lastCheck = now
    return cachedCaps

  } catch (error) {
    // Return conservative defaults on error
    return {
      hasParticipantNameColumns: false,
      hasAppleDeviceTokens: false,
      hasSchemaMigrations: false,
      hasPointsDisplaySetting: false,
    }
  }
}

export function invalidateCapabilitiesCache(): void {
  cachedCaps = null
  lastCheck = 0
}