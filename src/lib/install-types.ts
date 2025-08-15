import { getAppUrl } from './config.public'

export type InstallResult = {
  passKind: string
  status: 'installed' | 'updated' | 'skipped' | 'failed'
  reason?: 'no_template' | 'config_missing' | 'provider_error' | 'invalid_scope' | 'participant_not_found'
  detail?: string // short, safe-to-show summary
}

export type InstallResponse = 
  | { ok: true; program: string; installed: InstallResult[] }
  | { ok: false; error: string; detail?: string }

export async function tryIssuePass(
  programId: string,
  perkParticipantId: number,
  passKind: string,
  options?: {
    resourceType?: string
    resourceId?: string
  }
): Promise<InstallResult> {
  try {
    const response = await fetch(`${getAppUrl()}/api/passes/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        program_id: programId,
        perk_participant_id: perkParticipantId,
        pass_kind: passKind,
        resource_type: options?.resourceType,
        resource_id: options?.resourceId,
      }),
    })
    
    if (response.ok) {
      const data = await response.json()
      return { 
        passKind, 
        status: data.existing ? 'updated' : 'installed',
        detail: data.message
      }
    }
    
    // Parse error response for specific reasons
    const errorData = await response.json().catch(() => null)
    
    if (response.status === 404) {
      if (errorData?.error?.includes('Template not found')) {
        return { passKind, status: 'failed', reason: 'no_template', detail: 'No published template' }
      }
      if (errorData?.error?.includes('Participant not found')) {
        return { passKind, status: 'failed', reason: 'participant_not_found', detail: 'Participant not found' }
      }
    }
    
    if (response.status === 400) {
      if (errorData?.error?.includes('Missing required environment')) {
        return { passKind, status: 'failed', reason: 'config_missing', detail: errorData.error }
      }
    }
    
    return { 
      passKind, 
      status: 'failed', 
      reason: 'provider_error',
      detail: errorData?.error || `HTTP ${response.status}`
    }
  } catch (error) {
    return { 
      passKind, 
      status: 'failed', 
      reason: 'provider_error',
      detail: error instanceof Error ? error.message : 'Network error'
    }
  }
}