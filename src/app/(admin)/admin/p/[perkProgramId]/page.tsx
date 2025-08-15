// Admin short route - redirect from Perk Program ID to UUID-based admin routes
// /admin/p/44 -> /admin/programs/{uuid}

import { redirect } from 'next/navigation'
import { resolveProgram } from '@/lib/programs'

interface PageProps {
  params: Promise<{
    perkProgramId: string
  }>
}

export default async function AdminProgramShortRoute({ params }: PageProps) {
  const { perkProgramId } = await params
  
  // Try to resolve the program by Perk Program ID
  const resolved = await resolveProgram(perkProgramId)
  
  if (!resolved) {
    // Program not found - redirect to main programs page
    redirect('/admin/programs')
  }
  
  // Redirect to the UUID-based admin route
  redirect(`/admin/programs/${resolved.program.id}`)
}