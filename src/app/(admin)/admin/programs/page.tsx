export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { requireEmulatedIdentity } from '@/lib/auth-emulator'
import { canViewAllPrograms } from '@/lib/perm'
import { getAdminPrograms } from '@/lib/admin-service'
import { Building2, Eye, Settings, Users, CreditCard, Plus } from 'lucide-react'

export default async function ProgramsPage() {
  const identity = await requireEmulatedIdentity()
  const canViewAll = await canViewAllPrograms()
  
  const programs = await getAdminPrograms()

  // Debug log (will be visible in server console)
  console.log('Programs Page Debug:', {
    role: identity.role,
    isSuperAdmin: identity.isSuperAdmin,
    canViewAll,
    programsCount: programs.length
  })

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
          <p className="text-muted-foreground">
            {canViewAll 
              ? 'Manage all loyalty programs across the platform'
              : 'Manage your assigned loyalty program'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Debug info badge */}
          <Badge variant="outline" className="text-xs">
            Role: {identity.role} | Super: {identity.isSuperAdmin ? 'Yes' : 'No'} | ViewAll: {canViewAll ? 'Yes' : 'No'}
          </Badge>
          {canViewAll && (
            <Button asChild>
              <Link href="/admin/programs/new">
                <Plus className="w-4 h-4 mr-2" />
                New Program
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Programs List */}
      {programs.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No Programs Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {canViewAll 
                    ? 'No loyalty programs have been created yet.'
                    : 'You don\'t have access to any programs. Contact your administrator.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {programs.map((program) => (
            <Card key={program.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-xl">{program.name}</CardTitle>
                      <Badge 
                        variant={
                          program.status === 'active' ? 'default' : 
                          program.status === 'draft' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {program.status}
                      </Badge>
                    </div>
                    <CardDescription>{program.description}</CardDescription>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>ID: {program.perk_program_id}</span>
                      <span>•</span>
                      <span>Created: {new Date(program.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/programs/${program.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Participants */}
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-background rounded-md">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{program.participants.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Participants</div>
                    </div>
                  </div>

                  {/* Active Passes */}
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-background rounded-md">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{program.activePasses.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Active Passes</div>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-background rounded-md">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{program.successRate}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}