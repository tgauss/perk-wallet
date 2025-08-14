'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  Users, 
  CreditCard, 
  Cog, 
  Webhook, 
  Settings,
  Stethoscope,
  Palette,
  Edit3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type EmulatedIdentity } from '@/lib/auth-emulator'
import { Badge } from '@/components/ui/badge'

interface AdminSidebarProps {
  identity: EmulatedIdentity
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Programs', href: '/admin/programs', icon: Building2 },
  { name: 'Templates', href: '/admin/templates', icon: FileText },
  { name: 'Participants', href: '/admin/participants', icon: Users },
  { name: 'Passes', href: '/admin/passes', icon: CreditCard },
  { name: 'Jobs', href: '/admin/jobs', icon: Cog },
  { name: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
]

const devNavigation = [
  { name: 'Emulator', href: '/admin/emulator', icon: Settings },
  { name: 'Doctor', href: '/admin/doctor', icon: Stethoscope },
  { name: 'Theme Check', href: '/admin/theme-check', icon: Palette },
]

export function AdminSidebar({ identity }: AdminSidebarProps) {
  const pathname = usePathname()

  // Extract program ID from pathname if we're on a program page
  const programIdMatch = pathname.match(/\/admin\/programs\/([^\/]+)/)
  const programId = programIdMatch ? programIdMatch[1] : null
  const isOnProgramPage = !!programId && programId !== 'new'

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive'
      case 'program_admin': return 'default'
      case 'program_editor': return 'secondary'
      case 'program_viewer': return 'outline'
      case 'support': return 'secondary'
      default: return 'outline'
    }
  }

  // Program-specific navigation when viewing a specific program
  const programNavigation = isOnProgramPage ? [
    { name: 'Templates', href: `/admin/programs/${programId}/templates`, icon: Edit3 },
    { name: 'Branding', href: `/admin/programs/${programId}/branding`, icon: Palette },
  ] : []

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground">Perk Admin</h1>
            <Badge variant={getRoleBadgeVariant(identity.role)} className="text-xs">
              {identity.role.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}

        {/* Program-specific navigation section */}
        {isOnProgramPage && (
          <>
            <div className="pt-4">
              <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">
                Program Pages
              </div>
              {programNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>

      {/* Development section */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
          Development
        </div>
        {devNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}