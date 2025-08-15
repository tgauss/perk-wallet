import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAnalytics } from '../hooks/use-analytics'

// Mock console.log
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

// Mock environment variable
const originalEnv = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG

describe('useAnalytics', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear()
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      writable: true,
    })
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG = originalEnv
  })

  it('tracks events when debug mode is enabled', () => {
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG = 'true'
    
    const { result } = renderHook(() => useAnalytics())
    
    result.current.track('draft_saved', { 
      program_id: 'test-program',
      draft_id: 'test-draft' 
    })

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '🔍 Template Studio Analytics:',
      expect.objectContaining({
        event: 'draft_saved',
        properties: expect.objectContaining({
          program_id: 'test-program',
          draft_id: 'test-draft',
          timestamp: expect.any(String),
        })
      })
    )
  })

  it('does not track events when debug mode is disabled', () => {
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG = 'false'
    
    const { result } = renderHook(() => useAnalytics())
    
    result.current.track('draft_saved', { 
      program_id: 'test-program' 
    })

    expect(mockConsoleLog).not.toHaveBeenCalled()
  })

  it('includes session information in tracked events', () => {
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG = 'true'
    
    const { result } = renderHook(() => useAnalytics())
    
    result.current.track('field_mapping_applied', {})

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '🔍 Template Studio Analytics:',
      expect.objectContaining({
        event: 'field_mapping_applied',
        properties: expect.objectContaining({
          timestamp: expect.any(String),
          user_agent: expect.any(String),
          url: expect.any(String),
          session_id: expect.stringMatching(/^sess_\d+_[a-z0-9]+$/)
        })
      })
    )
  })

  it('handles different event types', () => {
    process.env.NEXT_PUBLIC_ANALYTICS_DEBUG = 'true'
    
    const { result } = renderHook(() => useAnalytics())
    
    const events = [
      'draft_saved',
      'draft_published',
      'preview_zoom_changed',
      'device_toggle',
      'field_mapping_applied',
      'asset_upload_validated'
    ] as const

    events.forEach(event => {
      result.current.track(event, { test: true })
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🔍 Template Studio Analytics:',
        expect.objectContaining({ event })
      )
    })

    expect(mockConsoleLog).toHaveBeenCalledTimes(events.length)
  })
})