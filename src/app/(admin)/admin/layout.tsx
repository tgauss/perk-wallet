export const dynamic = 'force-dynamic'

import { type ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { getEmulatedIdentity, hasEmulatorSecret } from '@/lib/auth-emulator'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminTopBar } from '@/components/admin/admin-top-bar'
import { EmulatorWarning } from '@/components/admin/emulator-warning'
import VersionIndicator from '@/components/version-indicator'
import { ProgramThemeProvider } from '@/components/branding/program-theme-provider'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const identity = await getEmulatedIdentity()
  const hasSecret = hasEmulatorSecret()
  
  // Default program ID for theming (Buckeye Nation Rewards from STATE.md)
  const defaultProgramId = "3648cab8-a29f-4d13-9160-f1eab36e88bd"
  
  // Allow access to emulator page without identity
  if (!identity) {
    return (
      <ProgramThemeProvider programId={defaultProgramId}>
        <div className="min-h-screen bg-background">
          <EmulatorWarning hasSecret={hasSecret} />
          {children}
        </div>
      </ProgramThemeProvider>
    )
  }

  return (
    <ProgramThemeProvider programId={defaultProgramId}>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <AdminSidebar identity={identity} />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Warning banner if no emulator secret */}
          <EmulatorWarning hasSecret={hasSecret} />
          
          {/* Top bar */}
          <AdminTopBar identity={identity} />
          
          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        
        {/* Version indicator */}
        <VersionIndicator />
      </div>
    </ProgramThemeProvider>
  )
}