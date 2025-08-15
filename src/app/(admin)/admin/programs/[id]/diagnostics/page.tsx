'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  ExternalLink,
  Wrench,
  Settings
} from 'lucide-react'
import { PASS_KINDS, PassKind } from '@/lib/program-settings'

interface DiagnosticsPageProps {
  params: { id: string }
}

type DiagnosticCheck = {
  kind: string
  published_template: boolean
  apple_ready: boolean
  google_ready: boolean
  assets_ok: boolean
  qr_preview: string
  issues: string[]
}

type DiagnosticsResult = {
  ok: boolean
  program?: {
    id: string
    name: string
    default_group: string[]
  }
  participant?: {
    exists: boolean
  }
  checks?: DiagnosticCheck[]
  error?: string
  detail?: string
}

export default function DiagnosticsPage({ params }: DiagnosticsPageProps) {
  const [isPending, startTransition] = useTransition()
  const [perkParticipantId, setPerkParticipantId] = useState('')
  const [selectedKinds, setSelectedKinds] = useState<PassKind[]>([])
  const [useDefaults, setUseDefaults] = useState(true)
  const [result, setResult] = useState<DiagnosticsResult | null>(null)
  const [copiedQr, setCopiedQr] = useState<string | null>(null)

  const handleRun = () => {
    startTransition(async () => {
      setResult(null)
      
      if (!perkParticipantId.trim()) {
        setResult({ 
          ok: false, 
          error: 'Please enter a participant ID' 
        })
        return
      }

      const participantId = parseInt(perkParticipantId.trim(), 10)
      if (!participantId || participantId <= 0) {
        setResult({ 
          ok: false, 
          error: 'Invalid participant ID' 
        })
        return
      }

      try {
        // Get program info first to get the perk_program_id
        const programResponse = await fetch(`/api/admin/programs/${params.id}`)
        if (!programResponse.ok) {
          setResult({ 
            ok: false, 
            error: 'Failed to load program information' 
          })
          return
        }
        
        const programData = await programResponse.json()
        
        const response = await fetch('/api/admin/diagnostics/install', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            perk_program_id: programData.perk_program_id,
            perk_participant_id: participantId,
            kinds: useDefaults ? undefined : selectedKinds
          }),
        })

        const data = await response.json()
        setResult(data)

      } catch (error) {
        setResult({ 
          ok: false, 
          error: error instanceof Error ? error.message : 'Network error' 
        })
      }
    })
  }

  const handleKindToggle = (kind: PassKind, checked: boolean) => {
    if (checked) {
      setSelectedKinds(prev => [...prev, kind])
    } else {
      setSelectedKinds(prev => prev.filter(k => k !== kind))
    }
  }

  const handleCopyQr = async (qr: string) => {
    await navigator.clipboard.writeText(qr)
    setCopiedQr(qr)
    setTimeout(() => setCopiedQr(null), 2000)
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pass Installation Diagnostics</h1>
        <p className="text-gray-600">
          Test pass installation configurations without actually issuing passes
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="w-5 h-5" />
            <span>Diagnostic Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure the participant and pass types to test
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="participant-id">Perk Participant ID</Label>
            <Input
              id="participant-id"
              type="number"
              placeholder="Enter participant ID (e.g., 246785)"
              value={perkParticipantId}
              onChange={(e) => setPerkParticipantId(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-defaults"
                checked={useDefaults}
                onCheckedChange={(checked) => setUseDefaults(checked as boolean)}
                disabled={isPending}
              />
              <Label htmlFor="use-defaults">Use program default install group</Label>
            </div>

            {!useDefaults && (
              <div className="ml-6 space-y-2">
                <Label>Select pass kinds to test:</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PASS_KINDS.map(kind => (
                    <div key={kind} className="flex items-center space-x-2">
                      <Checkbox
                        id={`kind-${kind}`}
                        checked={selectedKinds.includes(kind)}
                        onCheckedChange={(checked) => handleKindToggle(kind, checked as boolean)}
                        disabled={isPending}
                      />
                      <Label htmlFor={`kind-${kind}`} className="capitalize">
                        {kind}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleRun} 
            disabled={isPending || !perkParticipantId.trim()}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running diagnostics...
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4 mr-2" />
                Run Dry-Run Diagnostics
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Error State */}
          {!result.ok && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {result.error}
                {result.detail && (
                  <div className="mt-1 text-sm opacity-80">{result.detail}</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {result.ok && result.program && (
            <>
              {/* Program Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Program Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Program Name</div>
                      <div className="font-medium">{result.program.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Default Install Group</div>
                      <div className="flex flex-wrap gap-1">
                        {result.program.default_group.map(kind => (
                          <Badge key={kind} variant="secondary" className="capitalize">
                            {kind}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participant Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(result.participant?.exists || false)}
                    <span>Participant Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.participant?.exists ? (
                    <div className="text-green-600">
                      Participant {perkParticipantId} found in program
                    </div>
                  ) : (
                    <div className="text-red-600">
                      Participant {perkParticipantId} not found in program
                      <div className="mt-2 text-sm text-muted-foreground">
                        This participant may need to be synced from Perk API first
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Diagnostic Checks */}
              {result.checks && result.checks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pass Configuration Checks</CardTitle>
                    <CardDescription>
                      Configuration status for each pass type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.checks.map((check, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium capitalize text-lg">{check.kind} Pass</h4>
                            <Badge variant={check.published_template ? 'default' : 'destructive'}>
                              {check.published_template ? 'Template Available' : 'No Template'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(check.published_template)}
                              <span className="text-sm">Published Template</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(check.apple_ready)}
                              <span className="text-sm">Apple Ready</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(check.google_ready)}
                              <span className="text-sm">Google Ready</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(check.assets_ok)}
                              <span className="text-sm">Assets OK</span>
                            </div>
                          </div>

                          {check.qr_preview && (
                            <div className="space-y-2">
                              <Label>QR Code Preview</Label>
                              <div className="flex items-center space-x-2">
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                                  {check.qr_preview}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyQr(check.qr_preview)}
                                >
                                  {copiedQr === check.qr_preview ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {check.issues.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-red-600">Issues Found</Label>
                              <ul className="text-sm text-red-600 space-y-1">
                                {check.issues.map((issue, issueIndex) => (
                                  <li key={issueIndex} className="flex items-start space-x-2">
                                    <span>•</span>
                                    <span>{issue}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" asChild>
                      <a href={`/admin/programs/${params.id}/templates`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage Templates
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={`/admin/programs/${params.id}/branding`}>
                        <Settings className="w-4 h-4 mr-2" />
                        Program Settings
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}