export type QrScope = {
  programId: number
  perkParticipantId: number
  passKind?: 'loyalty' | 'rewards' | 'coupon' | 'ticket' | 'stamp' | 'giftcard' | 'id'
  resourceType?: string
  resourceId?: string
}

const VALID_PASS_KINDS = ['loyalty', 'rewards', 'coupon', 'ticket', 'stamp', 'giftcard', 'id'] as const

export function buildQr(scope: QrScope): string {
  // Validate inputs
  if (!Number.isInteger(scope.programId) || scope.programId <= 0) {
    throw new Error('Invalid programId')
  }
  if (!Number.isInteger(scope.perkParticipantId) || scope.perkParticipantId <= 0) {
    throw new Error('Invalid perkParticipantId')
  }
  if (scope.passKind && !VALID_PASS_KINDS.includes(scope.passKind)) {
    throw new Error(`Invalid passKind: ${scope.passKind}`)
  }

  // Build minimal string
  let parts = [scope.programId.toString(), scope.perkParticipantId.toString()]
  
  if (scope.passKind) {
    parts.push(scope.passKind)
    
    if (scope.resourceType && scope.resourceId) {
      parts.push(scope.resourceType, scope.resourceId)
    }
  }
  
  return parts.join('.')
}

export function parseQr(payload: string): QrScope | null {
  if (!payload || typeof payload !== 'string') {
    return null
  }

  const segments = payload.split('.')
  
  // Must have at least program and participant IDs
  if (segments.length < 2) {
    return null
  }
  
  // Parse required fields
  const programId = parseInt(segments[0], 10)
  const perkParticipantId = parseInt(segments[1], 10)
  
  // Validate required fields
  if (!Number.isInteger(programId) || programId <= 0) {
    return null
  }
  if (!Number.isInteger(perkParticipantId) || perkParticipantId <= 0) {
    return null
  }
  
  const result: QrScope = {
    programId,
    perkParticipantId
  }
  
  // Parse optional pass kind
  if (segments.length >= 3) {
    // If segment 3 exists but is empty, it's invalid
    if (segments[2] === '') {
      return null
    }
    
    if (segments[2]) {
      const passKind = segments[2]
      if (!VALID_PASS_KINDS.includes(passKind as any)) {
        return null
      }
      result.passKind = passKind as QrScope['passKind']
      
      // Parse optional resource type and ID (must have both)
      if (segments.length >= 5 && segments[3] && segments[4]) {
        result.resourceType = segments[3]
        result.resourceId = segments[4]
      }
    }
  }
  
  return result
}