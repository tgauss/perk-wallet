'use client'

import { useCallback } from 'react'

interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
}

// Analytics events for Template Studio
export type StudioAnalyticsEvent = 
  | 'draft_saved'
  | 'draft_published' 
  | 'preview_zoom_changed'
  | 'device_toggle'
  | 'field_mapping_applied'
  | 'asset_upload_validated'

export function useAnalytics() {
  const isDebugMode = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true'

  const track = useCallback((event: StudioAnalyticsEvent, properties: Record<string, any> = {}) => {
    if (!isDebugMode) return

    // Add timestamp and session info
    const analyticsPayload: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        session_id: getSessionId(),
      }
    }

    // Log to console in debug mode
    console.log('🔍 Template Studio Analytics:', analyticsPayload)

    // In production, this would send to your analytics service
    // Example integrations:
    // - PostHog: posthog.capture(event, properties)
    // - Mixpanel: mixpanel.track(event, properties)  
    // - Google Analytics: gtag('event', event, properties)
  }, [isDebugMode])

  return { track }
}

// Generate or retrieve session ID
function getSessionId(): string {
  const key = 'template_studio_session'
  let sessionId = sessionStorage.getItem(key)
  
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem(key, sessionId)
  }
  
  return sessionId
}