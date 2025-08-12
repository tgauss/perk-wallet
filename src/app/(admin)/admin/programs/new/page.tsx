export const dynamic = 'force-dynamic'

import { requireEmulatedIdentity } from '@/lib/auth-emulator'
import { canViewAllPrograms } from '@/lib/perm'
import { redirect } from 'next/navigation'
import NewProgramForm from './new-program-form'

export default async function NewProgramPage() {
  const identity = await requireEmulatedIdentity()
  const isSuperAdmin = await canViewAllPrograms()
  
  // Only super admins can create programs
  if (!isSuperAdmin) {
    redirect('/admin/programs')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create New Program</h1>
        <p className="text-muted-foreground">
          Set up a new loyalty program with API credentials and branding
        </p>
      </div>

      <NewProgramForm />
    </div>
  )
}