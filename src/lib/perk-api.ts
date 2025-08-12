// Perk API integration utilities

export interface PerkApiValidationResult {
  valid: boolean
  error?: string
  programInfo?: {
    name: string
    id: number
  }
}

// Validate Perk API key by making a test call
export async function validatePerkApiKey(apiKey: string, programId: string): Promise<PerkApiValidationResult> {
  try {
    // Make a simple GET request to validate the API key
    // This would typically be a call to get program info or participant count
    const response = await fetch(`https://api.getperk.com/programs/${programId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        valid: true,
        programInfo: {
          name: data.name || 'Unknown Program',
          id: data.id || parseInt(programId)
        }
      }
    } else if (response.status === 401) {
      return {
        valid: false,
        error: 'Invalid API key - authentication failed'
      }
    } else if (response.status === 404) {
      return {
        valid: false,
        error: 'Program not found - check your Program ID'
      }
    } else {
      return {
        valid: false,
        error: `API validation failed with status ${response.status}`
      }
    }
  } catch (error) {
    console.error('Perk API validation error:', error)
    return {
      valid: false,
      error: 'Unable to connect to Perk API - please check your credentials and try again'
    }
  }
}

// Get program participants count (example API call)
export async function getProgramParticipantCount(apiKey: string, programId: string): Promise<number> {
  try {
    const response = await fetch(`https://api.getperk.com/programs/${programId}/participants/count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data.count || 0
    }
    
    return 0
  } catch (error) {
    console.error('Error fetching participant count:', error)
    return 0
  }
}

// Sync program data from Perk API
export async function syncProgramFromPerk(apiKey: string, programId: string) {
  try {
    // This would fetch latest program data, participants, etc.
    const response = await fetch(`https://api.getperk.com/programs/${programId}/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return await response.json()
    }
    
    throw new Error(`Sync failed with status ${response.status}`)
  } catch (error) {
    console.error('Error syncing program data:', error)
    throw error
  }
}