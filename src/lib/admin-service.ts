'use server'

import { supabase, type Database } from './supabase'
import { requireEmulatedIdentity } from './auth-emulator'
import { canViewProgram, canEditProgram, canViewAllPrograms } from './perm'

type Program = Database['public']['Tables']['programs']['Row']
type Template = Database['public']['Tables']['templates']['Row']
type Participant = Database['public']['Tables']['participants']['Row']
type Pass = Database['public']['Tables']['passes']['Row']
type Job = Database['public']['Tables']['jobs']['Row']
type WebhookEvent = Database['public']['Tables']['webhook_events']['Row']

// Admin Programs Service
export async function getAdminPrograms(): Promise<(Program & { participants: number; activePasses: number; successRate: number })[]> {
  const identity = await requireEmulatedIdentity()
  const canViewAll = await canViewAllPrograms()

  let query = supabase.from('programs').select('*')

  if (!canViewAll && identity.programId) {
    // Filter to only user's assigned program
    query = query.eq('id', identity.programId)
  }

  const { data: programs, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching programs:', error)
    return []
  }

  if (!programs) return []

  // Get participant and pass counts for each program
  const programsWithCounts = await Promise.all(
    programs.map(async (program) => {
      const [participantCount, passCount, failedJobCount] = await Promise.all([
        supabase.from('participants').select('id').eq('program_id', program.id).then(r => r.data?.length || 0),
        supabase.from('passes').select('id').eq('program_id', program.id).then(r => r.data?.length || 0),
        supabase.from('jobs').select('id').eq('status', 'failed').then(r => r.data?.length || 0)
      ])

      const totalJobs = participantCount + passCount
      const successRate = totalJobs > 0 ? Math.round(((totalJobs - failedJobCount) / totalJobs) * 100) : 100

      const status = (program.settings as any)?.status || 'draft'

      return {
        ...program,
        participants: participantCount,
        activePasses: passCount,
        successRate,
        status
      }
    })
  )

  return programsWithCounts
}

export async function getAdminProgram(programId: string): Promise<Program | null> {
  const canView = await canViewProgram(programId)
  if (!canView) {
    throw new Error('Permission denied: cannot view program')
  }

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single()

  if (error) {
    console.error('Error fetching program:', error)
    return null
  }

  return data
}

export async function updateProgramBranding(
  programId: string, 
  branding: {
    branding_fonts?: Program['branding_fonts']
    branding_colors?: Program['branding_colors'] 
    branding_assets?: Program['branding_assets']
    branding_borders?: Program['branding_borders']
  }
): Promise<void> {
  const canEdit = await canEditProgram(programId)
  if (!canEdit) {
    throw new Error('Permission denied: cannot edit program')
  }

  const { error } = await supabase
    .from('programs')
    .update({
      ...branding,
      updated_at: new Date().toISOString()
    })
    .eq('id', programId)

  if (error) {
    throw new Error(`Failed to update program branding: ${error.message}`)
  }
}

// Admin Templates Service
export async function getAdminTemplates(programId?: string): Promise<Template[]> {
  const identity = await requireEmulatedIdentity()
  const canViewAll = await canViewAllPrograms()

  let query = supabase.from('templates').select('*')

  if (!canViewAll && identity.programId) {
    query = query.eq('program_id', identity.programId)
  } else if (programId) {
    query = query.eq('program_id', programId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching templates:', error)
    return []
  }

  return data || []
}

export async function bumpTemplateVersion(templateId: string): Promise<number> {
  // First get current template
  const { data: template, error: fetchError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (fetchError || !template) {
    throw new Error('Template not found')
  }

  const canEdit = await canEditProgram(template.program_id)
  if (!canEdit) {
    throw new Error('Permission denied: cannot edit template')
  }

  const newVersion = template.version + 1

  const { error } = await supabase
    .from('templates')
    .update({ 
      version: newVersion,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)

  if (error) {
    throw new Error(`Failed to bump template version: ${error.message}`)
  }

  return newVersion
}

// Admin Participants Service
export async function searchParticipants(searchQuery: string, programId?: string): Promise<Participant[]> {
  const identity = await requireEmulatedIdentity()
  const canViewAll = await canViewAllPrograms()

  let query = supabase.from('participants').select('*')

  // Apply program filtering
  if (!canViewAll && identity.programId) {
    query = query.eq('program_id', identity.programId)
  } else if (programId) {
    query = query.eq('program_id', programId)
  }

  // Apply search filter
  if (searchQuery) {
    query = query.or(`email.ilike.%${searchQuery}%,perk_uuid.ilike.%${searchQuery}%`)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error searching participants:', error)
    return []
  }

  return data || []
}

// Admin Passes Service  
export async function getAdminPasses(statusFilter?: string, programId?: string): Promise<Pass[]> {
  const identity = await requireEmulatedIdentity()
  const canViewAll = await canViewAllPrograms()

  let query = supabase.from('passes').select('*')

  // Apply program filtering
  if (!canViewAll && identity.programId) {
    query = query.eq('program_id', identity.programId)
  } else if (programId) {
    query = query.eq('program_id', programId)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching passes:', error)
    return []
  }

  return data || []
}

// Admin Jobs Service
export async function getAdminJobs(statusFilter?: string): Promise<Job[]> {
  let query = supabase.from('jobs').select('*')

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  return data || []
}

export async function retryJob(jobId: string): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .update({ 
      status: 'pending',
      attempts: 0,
      error: null,
      scheduled_at: new Date().toISOString()
    })
    .eq('id', jobId)

  if (error) {
    throw new Error(`Failed to retry job: ${error.message}`)
  }
}

// Admin Webhook Events Service
export async function getAdminWebhookEvents(programId?: string): Promise<WebhookEvent[]> {
  const identity = await requireEmulatedIdentity()
  const canViewAll = await canViewAllPrograms()

  let query = supabase.from('webhook_events').select('*')

  // Apply program filtering
  if (!canViewAll && identity.programId) {
    query = query.eq('program_id', identity.programId)
  } else if (programId) {
    query = query.eq('program_id', programId)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching webhook events:', error)
    return []
  }

  return data || []
}

// Admin Dashboard KPIs
export async function getAdminDashboardKPIs() {
  const identity = await requireEmulatedIdentity()
  const canViewAll = await canViewAllPrograms()

  try {
    if (canViewAll) {
      // Super admin - get system-wide KPIs
      const [programs, participants, passes, jobs] = await Promise.all([
        supabase.from('programs').select('id').then(r => r.data?.length || 0),
        supabase.from('participants').select('id').then(r => r.data?.length || 0),
        supabase.from('passes').select('id').then(r => r.data?.length || 0),
        supabase.from('jobs').select('id').eq('status', 'failed').then(r => r.data?.length || 0)
      ])

      // Get recent activity (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const [recentParticipants, recentPasses, recentEvents] = await Promise.all([
        supabase.from('participants').select('id').gte('created_at', oneHourAgo).then(r => r.data?.length || 0),
        supabase.from('passes').select('id').gte('created_at', oneHourAgo).then(r => r.data?.length || 0),
        supabase.from('webhook_events').select('id').gte('created_at', oneHourAgo).then(r => r.data?.length || 0)
      ])

      return {
        type: 'system' as const,
        totalPrograms: programs,
        totalParticipants: participants,
        totalPasses: passes,
        failedJobs: jobs,
        successRate: jobs > 0 ? Math.round(((participants - jobs) / participants) * 100) : 100,
        lastHour: {
          newParticipants: recentParticipants,
          issuedPasses: recentPasses,
          webhookEvents: recentEvents
        }
      }
    } else if (identity.programId) {
      // Program-scoped user
      const [participants, passes, templates, jobs] = await Promise.all([
        supabase.from('participants').select('id').eq('program_id', identity.programId).then(r => r.data?.length || 0),
        supabase.from('passes').select('id').eq('program_id', identity.programId).then(r => r.data?.length || 0),
        supabase.from('templates').select('id').eq('program_id', identity.programId).then(r => r.data?.length || 0),
        supabase.from('jobs').select('id').eq('status', 'failed').then(r => r.data?.length || 0)
      ])

      const today = new Date().toISOString().split('T')[0]
      const passesIssuedToday = await supabase
        .from('passes')
        .select('id')
        .eq('program_id', identity.programId)
        .gte('created_at', today + 'T00:00:00.000Z')
        .then(r => r.data?.length || 0)

      const webhookEvents24h = await supabase
        .from('webhook_events')
        .select('id')
        .eq('program_id', identity.programId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .then(r => r.data?.length || 0)

      return {
        type: 'program' as const,
        participants,
        activePasses: passes,
        passesIssued24h: passesIssuedToday,
        templates,
        failedJobs: jobs,
        successRate: jobs > 0 ? Math.round(((participants - jobs) / participants) * 100) : 100,
        webhookEvents24h,
        lastSync: new Date().toISOString()
      }
    }

    return { type: 'empty' as const }
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error)
    return { type: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}