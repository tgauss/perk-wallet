'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { GitBranch } from 'lucide-react'

export default function VersionIndicator() {
  const [version, setVersion] = useState<string>('dev')
  const [buildTime, setBuildTime] = useState<string>('')

  useEffect(() => {
    // Try to get version from build-time environment variables
    const buildVersion = process.env.NEXT_PUBLIC_VERSION || process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev'
    const deploymentTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()
    
    setVersion(buildVersion)
    setBuildTime(new Date(deploymentTime).toLocaleString())
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="fixed bottom-4 right-4 z-50">
            <Badge variant="outline" className="bg-background/95 backdrop-blur-sm shadow-sm">
              <GitBranch className="w-3 h-3 mr-1" />
              <span className="text-xs font-mono">{version}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <div className="text-xs space-y-1">
            <p><strong>Version:</strong> {version}</p>
            <p><strong>Built:</strong> {buildTime}</p>
            <p className="text-muted-foreground">
              Use this to verify you're viewing the latest deployment
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}