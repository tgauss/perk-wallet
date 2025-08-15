import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PreviewRenderer } from '../preview/preview-renderer'

// Mock the program theme provider
const mockBranding = {
  colors: {
    brand_color: '#3B82F6',
    brand_secondary_color: '#10B981',
    text_primary: '#0F172A',
    text_secondary: '#64748B',
    text_muted: '#94A3B8',
    background_primary: '#FFFFFF',
    background_secondary: '#F8FAFC',
    background_muted: '#F1F5F9',
    grad_from: '#3B82F6',
    grad_to: '#10B981',
  },
  fonts: {
    header_font: { family: 'Inter', weights: ['600', '700'] },
    body_font: { family: 'Open Sans', weights: ['400', '600'] },
  },
  borders: {
    button_radius: 'md' as const,
    input_radius: 'md' as const,
    tile_radius: 'lg' as const,
    card_radius: 'lg' as const,
  },
  assets: {},
  header_content: {
    header_text: 'Welcome to Our Program',
    header_description: 'Experience exclusive rewards and benefits',
  },
}

// Mock the ProgramThemeClient
jest.mock('@/components/branding/program-theme-client', () => ({
  useProgramTheme: () => ({ branding: mockBranding }),
}))

describe('PreviewRenderer', () => {
  const mockLayout = {
    header: {
      title: 'Test Program',
      subtitle: 'Member Card'
    },
    primary: [
      { label: 'Points', value: '1,250' }
    ],
    secondary: [
      { label: 'Status', value: 'Gold' },
      { label: 'Member Since', value: '2024' }
    ]
  }

  const mockAssets = {
    logo: 'https://example.com/logo.png'
  }

  it('renders Apple wallet preview correctly', () => {
    render(
      <PreviewRenderer
        deviceType="apple"
        layout={mockLayout}
        assets={mockAssets}
        programId="test-program"
      />
    )

    expect(screen.getByText('Test Program')).toBeInTheDocument()
    expect(screen.getByText('Member Card')).toBeInTheDocument()
    expect(screen.getByText('Points')).toBeInTheDocument()
    expect(screen.getByText('1,250')).toBeInTheDocument()
  })

  it('renders Google wallet preview correctly', () => {
    render(
      <PreviewRenderer
        deviceType="google"
        layout={mockLayout}
        assets={mockAssets}
        programId="test-program"
      />
    )

    expect(screen.getByText('Test Program')).toBeInTheDocument()
    expect(screen.getByText('Member Card')).toBeInTheDocument()
  })

  it('renders fallback content when layout is empty', () => {
    render(
      <PreviewRenderer
        deviceType="apple"
        layout={{}}
        assets={{}}
        programId="test-program"
      />
    )

    expect(screen.getByText('Add title in Fields')).toBeInTheDocument()
  })

  it('applies compact styling when compact prop is true', () => {
    render(
      <PreviewRenderer
        deviceType="apple"
        layout={mockLayout}
        assets={mockAssets}
        programId="test-program"
        compact={true}
      />
    )

    const container = screen.getByText('Test Program').closest('.w-full')
    expect(container).toHaveClass('max-w-xs')
  })

  it('shows grid overlay when showGrid is true', () => {
    const { container } = render(
      <PreviewRenderer
        deviceType="apple"
        layout={mockLayout}
        assets={mockAssets}
        programId="test-program"
        showGrid={true}
      />
    )

    const gridOverlay = container.querySelector('.absolute.inset-0.pointer-events-none.z-10')
    expect(gridOverlay).toBeInTheDocument()
  })

  it('shows safe area overlay when showSafeArea is true', () => {
    const { container } = render(
      <PreviewRenderer
        deviceType="apple"
        layout={mockLayout}
        assets={mockAssets}
        programId="test-program"
        showSafeArea={true}
      />
    )

    const safeAreaOverlay = container.querySelector('.border-red-400.border-dashed')
    expect(safeAreaOverlay).toBeInTheDocument()
  })
})