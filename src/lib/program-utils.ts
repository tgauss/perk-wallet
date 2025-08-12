// Program utility functions for client and server components

export type ProgramStatus = 'draft' | 'active' | 'inactive'

export interface ProgramStatusChange {
  from: ProgramStatus
  to: ProgramStatus
  effects: string[]
}

// Get program status transition effects (pure function, not a server action)
export function getStatusTransitionEffects(from: ProgramStatus, to: ProgramStatus): string[] {
  const effects: string[] = []
  
  if (from === 'draft' && to === 'active') {
    effects.push('Program will become visible to participants')
    effects.push('Webhook endpoints will start receiving events')
    effects.push('Pass generation will be enabled')
    effects.push('API sync will begin automatically')
  } else if (from === 'active' && to === 'inactive') {
    effects.push('New participant registrations will be disabled')
    effects.push('Webhook events will be paused')
    effects.push('Existing participants retain their data')
    effects.push('Pass updates will be suspended')
  } else if (from === 'inactive' && to === 'active') {
    effects.push('Participant registrations will be re-enabled')
    effects.push('Webhook events will resume')
    effects.push('Pass updates will resume')
    effects.push('Data sync will restart')
  } else if (to === 'draft') {
    effects.push('Program will be hidden from participants')
    effects.push('All program activities will be suspended')
    effects.push('Configuration can be safely modified')
  }
  
  return effects
}