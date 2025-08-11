import { type ReactNode } from 'react'
import { type Role, type EmulatedIdentity, getEmulatedIdentity } from './auth-emulator'
import { headers } from 'next/headers'

export type PermissionCheck = 
  | 'viewProgram'
  | 'editProgram' 
  | 'manageTemplates'
  | 'manageParticipants'
  | 'managePasses'
  | 'manageJobs'
  | 'reissuePass'
  | 'resendInstallLink'
  | 'viewWebhooks'
  | 'viewAllPrograms'

interface PermissionContext {
  role: Role
  programId?: string
  targetProgramId?: string
  isSuperAdmin: boolean
}

function checkPermission(check: PermissionCheck, context: PermissionContext): boolean {
  const { role, programId, targetProgramId, isSuperAdmin } = context
  
  // Super admin has access to everything
  if (isSuperAdmin) return true
  
  // For operations requiring a specific program context
  const hasAccessToProgram = !targetProgramId || programId === targetProgramId
  
  switch (check) {
    case 'viewProgram':
      return hasAccessToProgram && ['program_admin', 'program_editor', 'program_viewer', 'support'].includes(role)
    
    case 'editProgram':
      return hasAccessToProgram && ['program_admin'].includes(role)
    
    case 'manageTemplates':
      return hasAccessToProgram && ['program_admin', 'program_editor'].includes(role)
    
    case 'manageParticipants':
      return hasAccessToProgram && ['program_admin', 'program_editor'].includes(role)
    
    case 'managePasses':
      return hasAccessToProgram && ['program_admin', 'program_editor'].includes(role)
    
    case 'manageJobs':
      return hasAccessToProgram && ['program_admin', 'program_editor'].includes(role)
    
    case 'reissuePass':
      return hasAccessToProgram && ['program_admin', 'program_editor', 'support'].includes(role)
    
    case 'resendInstallLink':
      return hasAccessToProgram && ['program_admin', 'program_editor', 'support'].includes(role)
    
    case 'viewWebhooks':
      return hasAccessToProgram && ['program_admin', 'program_editor', 'program_viewer'].includes(role)
    
    case 'viewAllPrograms':
      return isSuperAdmin
    
    default:
      return false
  }
}

// Server-side permission checks using headers
export async function canPerform(check: PermissionCheck, programId?: string): Promise<boolean> {
  try {
    const headersList = await headers()
    const role = headersList.get('x-emulated-role') as Role
    const userProgramId = headersList.get('x-emulated-program') || undefined
    const isSuperAdmin = headersList.get('x-is-super-admin') === 'true'
    
    if (!role) return false
    
    return checkPermission(check, {
      role,
      programId: userProgramId,
      targetProgramId: programId,
      isSuperAdmin
    })
  } catch (error) {
    console.error('Error checking permissions:', error)
    return false
  }
}

// Client-side permission checks using cookie
export async function canPerformClient(check: PermissionCheck, programId?: string): Promise<boolean> {
  try {
    const identity = await getEmulatedIdentity()
    if (!identity) return false
    
    return checkPermission(check, {
      role: identity.role,
      programId: identity.programId,
      targetProgramId: programId,
      isSuperAdmin: identity.isSuperAdmin
    })
  } catch (error) {
    console.error('Error checking client permissions:', error)
    return false
  }
}

// Note: React components for conditional rendering would be implemented separately
// in a client component file due to the JSX syntax requirements

export interface IfAllowedProps {
  check: PermissionCheck
  programId?: string
  children: ReactNode
  fallback?: ReactNode
}

export interface GuardProps {
  check: PermissionCheck
  programId?: string
  children: ReactNode
  fallback?: ReactNode
}

// Utility functions for common permission checks
export const canViewProgram = (programId?: string) => canPerform('viewProgram', programId)
export const canEditProgram = (programId?: string) => canPerform('editProgram', programId)
export const canManageTemplates = (programId?: string) => canPerform('manageTemplates', programId)
export const canManageParticipants = (programId?: string) => canPerform('manageParticipants', programId)
export const canManagePasses = (programId?: string) => canPerform('managePasses', programId)
export const canManageJobs = (programId?: string) => canPerform('manageJobs', programId)
export const canViewWebhooks = (programId?: string) => canPerform('viewWebhooks', programId)
export const canViewAllPrograms = () => canPerform('viewAllPrograms')

export function requirePermission(check: PermissionCheck, programId?: string) {
  return async () => {
    const allowed = await canPerform(check, programId)
    if (!allowed) {
      throw new Error(`Permission denied: ${check}`)
    }
  }
}