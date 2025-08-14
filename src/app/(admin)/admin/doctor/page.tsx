'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCw, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import type { DoctorResponse, DoctorSection, DoctorItem, DoctorStatus } from '@/app/api/admin/doctor/route'

function StatusIcon({ status }: { status: DoctorStatus }) {
  switch (status) {
    case 'ok':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'warn':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    case 'fail':
      return <AlertCircle className="w-4 h-4 text-red-500" />
  }
}

function StatusBadge({ status }: { status: DoctorStatus }) {
  const variants = {
    ok: 'bg-green-100 text-green-800 border-green-200',
    warn: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    fail: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <Badge variant="outline" className={variants[status]}>
      <StatusIcon status={status} />
      <span className="ml-1 capitalize">{status}</span>
    </Badge>
  )
}

function DoctorItemRow({ item }: { item: DoctorItem }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center space-x-2">
        <StatusIcon status={item.status} />
        <span className="font-medium">{item.name}</span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <StatusBadge status={item.status} />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{item.details}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

function DoctorSectionCard({ section }: { section: DoctorSection }) {
  const statusCounts = section.items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {} as Record<DoctorStatus, number>)

  const overallStatus: DoctorStatus = 
    statusCounts.fail > 0 ? 'fail' :
    statusCounts.warn > 0 ? 'warn' : 'ok'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <StatusIcon status={overallStatus} />
            <span>{section.name}</span>
          </CardTitle>
          <div className="flex space-x-1">
            {statusCounts.ok > 0 && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                {statusCounts.ok} OK
              </Badge>
            )}
            {statusCounts.warn > 0 && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                {statusCounts.warn} WARN
              </Badge>
            )}
            {statusCounts.fail > 0 && (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                {statusCounts.fail} FAIL
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {section.items.length} checks completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {section.items.map((item, index) => (
            <DoctorItemRow key={index} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DoctorPage() {
  const [data, setData] = useState<DoctorResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [programId, setProgramId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const runDoctor = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const url = new URL('/api/admin/doctor', window.location.origin)
      if (programId.trim()) {
        url.searchParams.set('program_id', programId.trim())
      }
      
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDoctor()
  }, [])

  const overallStatus = data?.sections.reduce((overall, section) => {
    const sectionStatus = section.items.reduce((sectionOverall, item) => {
      if (item.status === 'fail') return 'fail'
      if (item.status === 'warn' && sectionOverall !== 'fail') return 'warn'
      return sectionOverall
    }, 'ok' as DoctorStatus)
    
    if (sectionStatus === 'fail') return 'fail'
    if (sectionStatus === 'warn' && overall !== 'fail') return 'warn'
    return overall
  }, 'ok' as DoctorStatus)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Doctor</h1>
        <p className="text-muted-foreground">
          Comprehensive health checks for your Perk Wallet system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Controls</CardTitle>
          <CardDescription>
            Run system diagnostics and health checks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <Label htmlFor="program-id">Program ID (optional)</Label>
              <Input
                id="program-id"
                placeholder="e.g., 1000026"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button 
              onClick={runDoctor} 
              disabled={loading}
              className="mt-6"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Doctor
                </>
              )}
            </Button>
          </div>
          
          {data && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Last run: {new Date(data.timestamp).toLocaleString()}</span>
              {data.program_uuid && (
                <span>Program UUID: {data.program_uuid}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error running doctor:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {data && overallStatus && (
        <Card className={
          overallStatus === 'ok' ? 'border-green-200 bg-green-50' :
          overallStatus === 'warn' ? 'border-yellow-200 bg-yellow-50' :
          'border-red-200 bg-red-50'
        }>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <StatusIcon status={overallStatus} />
              <span className="font-medium">
                Overall Status: {overallStatus.toUpperCase()}
              </span>
              <span className="text-muted-foreground">
                • {data.sections.reduce((sum, s) => sum + s.items.length, 0)} total checks
                • {data.sections.reduce((sum, s) => sum + s.items.filter(i => i.status === 'fail').length, 0)} failures
                • {data.sections.reduce((sum, s) => sum + s.items.filter(i => i.status === 'warn').length, 0)} warnings
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="grid gap-6">
          {data.sections.map((section, index) => (
            <DoctorSectionCard key={index} section={section} />
          ))}
        </div>
      )}
    </div>
  )
}