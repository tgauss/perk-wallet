'use client'

import { type EmulatedIdentity } from '@/lib/auth-emulator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Building2, ChevronDown } from 'lucide-react'

interface AdminTopBarProps {
  identity: EmulatedIdentity
}

interface Program {
  id: string
  name: string
  program_id: string
}

export function AdminTopBar({ identity }: AdminTopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>(identity.programId || 'all')
  const [isLoading, setIsLoading] = useState(true)

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(segment => segment !== '')
    const breadcrumbs = []
    
    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const name = segment === 'admin' ? 'Admin' : 
                  segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ')
      
      breadcrumbs.push({
        name,
        href,
        isLast: index === segments.length - 1
      })
    })
    
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Mock programs data - in real app this would come from API
  useEffect(() => {
    setIsLoading(false)
    setPrograms([
      { id: '1', name: 'Coffee Rewards', program_id: 'coffee-123' },
      { id: '2', name: 'Retail Loyalty', program_id: 'retail-456' },
    ])
  }, [])

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

  const handleProgramChange = (programId: string) => {
    setSelectedProgram(programId)
    // In real app, this would update the emulated identity with new program
    console.log('Switch to program:', programId)
  }

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right side - Role badge, program switcher, actions */}
      <div className="flex items-center space-x-4">
        {/* Role badge */}
        <Badge variant={getRoleBadgeVariant(identity.role)} className="text-xs">
          {identity.role.replace('_', ' ')}
        </Badge>

        {/* Program switcher - only show if not super admin or if super admin wants to scope */}
        {!identity.isSuperAdmin || selectedProgram !== 'all' ? (
          <Select value={selectedProgram} onValueChange={handleProgramChange}>
            <SelectTrigger className="w-48">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <SelectValue placeholder="Select program" />
              </div>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </SelectTrigger>
            <SelectContent>
              {identity.isSuperAdmin && (
                <SelectItem value="all">All Programs</SelectItem>
              )}
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {/* Quick actions slot */}
        <div className="flex items-center space-x-2">
          {/* This can be used for page-specific quick actions */}
        </div>
      </div>
    </header>
  )
}