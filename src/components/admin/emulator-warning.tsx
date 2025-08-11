import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface EmulatorWarningProps {
  hasSecret: boolean
}

export function EmulatorWarning({ hasSecret }: EmulatorWarningProps) {
  if (hasSecret) return null

  return (
    <Alert variant="destructive" className="rounded-none border-l-0 border-r-0 border-t-0">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Warning:</strong> APP_EMULATOR_SECRET is not configured. 
        Running in insecure development mode.{' '}
        <Link href="/admin/emulator" className="underline">
          Configure emulator →
        </Link>
      </AlertDescription>
    </Alert>
  )
}