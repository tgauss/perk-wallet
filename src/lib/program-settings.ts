import { supabase } from './supabase'

export type PassKind = 'loyalty' | 'rewards' | 'coupon' | 'ticket' | 'stamp' | 'giftcard' | 'id'

export const PASS_KINDS: PassKind[] = ['loyalty', 'rewards', 'coupon', 'ticket', 'stamp', 'giftcard', 'id']

/**
 * Get the default install group for a program
 */
export async function getDefaultInstallGroup(programUuid: string): Promise<PassKind[]> {
  const { data } = await supabase
    .from('programs')
    .select('settings')
    .eq('id', programUuid)
    .single()
  
  const defaultGroup = data?.settings?.default_install_group
  
  // Validate and filter to ensure only valid pass kinds
  if (Array.isArray(defaultGroup)) {
    return defaultGroup.filter(k => PASS_KINDS.includes(k as PassKind)) as PassKind[]
  }
  
  // Default to loyalty and rewards
  return ['loyalty', 'rewards']
}

/**
 * Set the default install group for a program
 */
export async function setDefaultInstallGroup(
  programUuid: string,
  passKinds: PassKind[]
): Promise<void> {
  // Validate pass kinds
  const validKinds = passKinds.filter(k => PASS_KINDS.includes(k))
  
  // Get current settings
  const { data: program } = await supabase
    .from('programs')
    .select('settings')
    .eq('id', programUuid)
    .single()
  
  const currentSettings = program?.settings || {}
  
  // Update settings with new default install group
  const { error } = await supabase
    .from('programs')
    .update({
      settings: {
        ...currentSettings,
        default_install_group: validKinds
      }
    })
    .eq('id', programUuid)
  
  if (error) {
    throw new Error(`Failed to update default install group: ${error.message}`)
  }
}