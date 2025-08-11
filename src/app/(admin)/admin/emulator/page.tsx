'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Settings, User, Building2, Mail, Trash2 } from 'lucide-react'
import { type Role } from '@/lib/auth-emulator'

const roles: { value: Role; label: string; description: string }[] = [
  { 
    value: 'super_admin', 
    label: 'Super Admin', 
    description: 'Full access across all programs' 
  },
  { 
    value: 'program_admin', 
    label: 'Program Admin', 
    description: 'Full access within assigned program(s)' 
  },
  { 
    value: 'program_editor', 
    label: 'Program Editor', 
    description: 'Edit templates, manage passes, send notifications; no secrets' 
  },
  { 
    value: 'program_viewer', 
    label: 'Program Viewer', 
    description: 'Read-only access' 
  },
  { 
    value: 'support', 
    label: 'Support', 
    description: 'Limited write access (reissue passes, resend install links)' 
  },
]

const mockPrograms = [
  { id: '1', name: 'Coffee Rewards', program_id: 'coffee-123' },
  { id: '2', name: 'Retail Loyalty', program_id: 'retail-456' },
]

export default function EmulatorPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('super_admin')
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [currentIdentity, setCurrentIdentity] = useState<any>(null)

  const handleImpersonate = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/emulator/set-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          programId: selectedRole === 'super_admin' ? undefined : selectedProgram,
          email: email || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to set identity')
      }

      // Redirect to admin dashboard
      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/emulator/clear-identity', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to clear identity')
      }

      setCurrentIdentity(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const requiresProgram = selectedRole !== 'super_admin'
  const canSubmit = selectedRole && (!requiresProgram || selectedProgram)

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Settings className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Admin Role Emulator</h1>
          </div>
          <p className="text-muted-foreground">
            Emulate different admin roles for testing and development
          </p>
        </div>

        {/* Current Identity */}
        {currentIdentity && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  Currently emulating: <Badge>{currentIdentity.role}</Badge>
                  {currentIdentity.programId && (
                    <span className="ml-2">in program {currentIdentity.programId}</span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleClear} disabled={isLoading}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Emulator Form */}
        <Card>
          <CardHeader>
            <CardTitle>Set Identity</CardTitle>
            <CardDescription>
              Configure the role and program context for admin emulation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(value: Role) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-sm text-muted-foreground">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Program Selection */}
            {requiresProgram && (
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <SelectValue placeholder="Select a program" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {mockPrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name} ({program.program_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Email (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="flex items-center space-x-2"
              />
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <Button 
                onClick={handleImpersonate}
                disabled={!canSubmit || isLoading}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                {isLoading ? 'Setting...' : 'Impersonate'}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={isLoading}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• The emulator creates a signed JWT cookie to simulate different user roles</p>
            <p>• Super admins can access all programs and have full permissions</p>
            <p>• Other roles are scoped to specific programs with limited permissions</p>
            <p>• Use this to test the admin interface without real authentication</p>
            <p>• The emulated identity persists until cleared or expired (24h)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}