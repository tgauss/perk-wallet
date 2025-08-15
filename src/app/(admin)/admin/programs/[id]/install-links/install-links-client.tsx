'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  User,
  Hash,
  Mail,
  Package
} from 'lucide-react'
import { getInstallLink, lookupParticipantByEmail } from './actions'
import type { InstallLinkResult, ParticipantLookupResult } from './actions'
import { PassKind, PASS_KINDS } from '@/lib/program-settings'

interface InstallLinksClientProps {
  programId: string
  perkProgramId: number
}

export function InstallLinksClient({ programId, perkProgramId }: InstallLinksClientProps) {
  const [isPending, startTransition] = useTransition()
  const [inputMode, setInputMode] = useState<'id' | 'email'>('id')
  const [inputValue, setInputValue] = useState('')
  const [passKind, setPassKind] = useState<PassKind | ''>('')
  const [resourceType, setResourceType] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [result, setResult] = useState<{
    url?: string
    participant?: {
      perkParticipantId: number
      email: string
      status: string | null
      unused_points: number
    }
    error?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    startTransition(async () => {
      setResult(null)
      
      if (!inputValue.trim()) {
        setResult({ error: 'Please enter a value' })
        return
      }

      try {
        let perkParticipantId: number
        let participantInfo = undefined

        // If email mode, lookup participant first
        if (inputMode === 'email') {
          const lookupResult: ParticipantLookupResult = await lookupParticipantByEmail(programId, inputValue.trim())
          
          if (!lookupResult.ok) {
            setResult({ error: lookupResult.error })
            return
          }

          perkParticipantId = lookupResult.perkParticipantId
          participantInfo = {
            perkParticipantId: lookupResult.perkParticipantId,
            email: lookupResult.email,
            status: lookupResult.status,
            unused_points: lookupResult.unused_points
          }
        } else {
          // Parse ID from input
          perkParticipantId = parseInt(inputValue.trim(), 10)
          if (!perkParticipantId || perkParticipantId <= 0) {
            setResult({ error: 'Invalid participant ID' })
            return
          }
        }

        // Generate install link with optional targeting
        const options = passKind ? {
          passKind: passKind as PassKind,
          resourceType: resourceType || undefined,
          resourceId: resourceId || undefined
        } : undefined
        
        const linkResult: InstallLinkResult = await getInstallLink(programId, perkParticipantId, options)
        
        if (!linkResult.ok) {
          setResult({ error: linkResult.error })
          return
        }

        setResult({
          url: linkResult.url,
          participant: participantInfo
        })

      } catch (error) {
        setResult({ 
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        })
      }
    })
  }

  const handleCopy = async () => {
    if (result?.url) {
      await navigator.clipboard.writeText(result.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setResult(null) // Clear previous result when input changes
  }

  return (
    <div className="space-y-6">
      {/* Input Mode Selection */}
      <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'id' | 'email')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="id" className="flex items-center space-x-2">
            <Hash className="w-4 h-4" />
            <span>Find by Participant ID</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Find by Email</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="id" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="perk-id">Perk Participant ID</Label>
            <Input
              id="perk-id"
              type="number"
              placeholder="Enter participant's Perk ID (e.g., 246785)"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              The numeric identifier for the participant in the Perk system
            </p>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter participant's email address"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Will lookup the participant in this program and use their Perk ID
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pass Kind Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Pass Configuration (Optional)</span>
          </CardTitle>
          <CardDescription>
            Optionally target a specific pass kind or resource. Leave empty for default program install.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pass-kind">Pass Kind</Label>
            <Select value={passKind} onValueChange={(value) => setPassKind(value as PassKind | '')}>
              <SelectTrigger id="pass-kind">
                <SelectValue placeholder="Select pass kind (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default (Program Settings)</SelectItem>
                {PASS_KINDS.map(kind => (
                  <SelectItem key={kind} value={kind}>
                    {kind.charAt(0).toUpperCase() + kind.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {passKind && ['coupon', 'ticket', 'stamp'].includes(passKind) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="resource-type">Resource Type (Optional)</Label>
                <Input
                  id="resource-type"
                  placeholder="e.g., offer, event, campaign"
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-id">Resource ID (Optional)</Label>
                <Input
                  id="resource-id"
                  placeholder="e.g., COUPON-123, EVENT-456"
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button 
        onClick={handleGenerate} 
        disabled={isPending || !inputValue.trim()}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {inputMode === 'email' ? 'Looking up participant...' : 'Generating link...'}
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Generate Install Link
          </>
        )}
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Error State */}
          {result.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {result.url && (
            <>
              {/* Resolved Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resolved Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Program ID (Numeric)</div>
                      <div className="font-mono text-lg">{perkProgramId}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Perk Participant ID</div>
                      <div className="font-mono text-lg">
                        {result.participant?.perkParticipantId || inputValue}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participant Info (if found) */}
              {result.participant && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Participant Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Email</div>
                        <div className="font-medium">{result.participant.email}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Status</div>
                        <Badge variant={result.participant.status === 'Active' ? 'default' : 'secondary'}>
                          {result.participant.status || 'Unknown'}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Available Points</div>
                        <div className="font-semibold text-lg">
                          {result.participant.unused_points.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generated URL */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Install Link Generated</span>
                  </CardTitle>
                  <CardDescription>
                    This link installs the wallet passes for this program on iOS and Android.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="generated-url">Generated URL</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="generated-url"
                        value={result.url}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    💡 <strong>Note:</strong> This link is stored in the database and will return the same URL for subsequent requests.
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