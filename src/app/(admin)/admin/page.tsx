export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { requireEmulatedIdentity } from '@/lib/auth-emulator'
import { getAdminDashboardKPIs } from '@/lib/admin-service'
import { 
  Building2, 
  Users, 
  CreditCard, 
  Cog, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'

export default async function AdminDashboard() {
  const identity = await requireEmulatedIdentity()
  const kpis = await getAdminDashboardKPIs()
  
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {kpis.type === 'system' 
            ? 'Overview of all programs and system metrics'
            : `Overview of ${identity.programId ? 'your program' : 'assigned program'} metrics`
          }
        </p>
      </div>

      <TooltipProvider>
        <DashboardContent kpis={kpis} />
      </TooltipProvider>
    </div>
  )
}

function DashboardContent({ kpis }: { kpis: Awaited<ReturnType<typeof getAdminDashboardKPIs>> }) {
  if (kpis.type === 'error') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <h3 className="text-lg font-medium">Error Loading Dashboard</h3>
            <p className="text-sm text-muted-foreground">{kpis.error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (kpis.type === 'empty') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No Program Selected</h3>
            <p className="text-sm text-muted-foreground">
              Please select a program from the top bar to view metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (kpis.type === 'system') {
    return (
      <div className="space-y-6">
        {/* System-wide Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.totalPrograms}</div>
                  <p className="text-xs text-muted-foreground">
                    Active loyalty programs
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total number of active loyalty programs across the platform</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.totalParticipants.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +{kpis.lastHour.newParticipants} in last hour
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total participants across all loyalty programs</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Passes</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.totalPasses.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +{kpis.lastHour.issuedPasses} issued last hour
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total wallet passes issued across all programs</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.successRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {kpis.failedJobs} failed jobs
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Overall system success rate based on job completion</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events across all programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {kpis.lastHour.webhookEvents} webhook events processed
                  </div>
                  <div className="text-xs text-muted-foreground">In the last hour</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {kpis.lastHour.issuedPasses} new passes issued
                  </div>
                  <div className="text-xs text-muted-foreground">Across all programs</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {kpis.lastHour.newParticipants} new participants
                  </div>
                  <div className="text-xs text-muted-foreground">Joined loyalty programs</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (kpis.type === 'program') {
    return (
      <div className="space-y-6">
        {/* Program Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.participants.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Active members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Passes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.activePasses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{kpis.passesIssued24h} issued today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.templates}</div>
              <p className="text-xs text-muted-foreground">
                Pass templates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                {kpis.failedJobs} failed jobs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Program Status</CardTitle>
            <CardDescription>Current state of your loyalty program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Last sync</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(kpis.lastSync).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cog className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Webhook events (24h)</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {kpis.webhookEvents24h}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Failed jobs</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {kpis.failedJobs}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}