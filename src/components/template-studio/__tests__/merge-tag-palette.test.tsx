import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MergeTagPalette } from '../fields/merge-tag-palette'

describe('MergeTagPalette', () => {
  const mockOnTagSelect = vi.fn()

  beforeEach(() => {
    mockOnTagSelect.mockClear()
  })

  it('renders all tag categories', () => {
    render(
      <MergeTagPalette
        programId="test-program"
        onTagSelect={mockOnTagSelect}
      />
    )

    expect(screen.getByText('Participant Info')).toBeInTheDocument()
    expect(screen.getByText('Points & Status')).toBeInTheDocument()
    expect(screen.getByText('Program Info')).toBeInTheDocument()
    expect(screen.getByText('Profile Attributes')).toBeInTheDocument()
    expect(screen.getByText('Event-Specific')).toBeInTheDocument()
  })

  it('renders sample merge tags', () => {
    render(
      <MergeTagPalette
        programId="test-program"
        onTagSelect={mockOnTagSelect}
      />
    )

    expect(screen.getByText('{fname}')).toBeInTheDocument()
    expect(screen.getByText('{points}')).toBeInTheDocument()
    expect(screen.getByText('{program_name}')).toBeInTheDocument()
  })

  it('calls onTagSelect when a tag is clicked', () => {
    render(
      <MergeTagPalette
        programId="test-program"
        onTagSelect={mockOnTagSelect}
      />
    )

    const fnameTag = screen.getByText('{fname}').closest('.cursor-pointer')
    fireEvent.click(fnameTag!)

    expect(mockOnTagSelect).toHaveBeenCalledWith('fname')
  })

  it('filters tags when searching', () => {
    render(
      <MergeTagPalette
        programId="test-program"
        onTagSelect={mockOnTagSelect}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search tags...')
    fireEvent.change(searchInput, { target: { value: 'points' } })

    expect(screen.getByText('{points}')).toBeInTheDocument()
    expect(screen.getByText('{unused_points}')).toBeInTheDocument()
    expect(screen.queryByText('{fname}')).not.toBeInTheDocument()
  })

  it('shows no results when search finds nothing', () => {
    render(
      <MergeTagPalette
        programId="test-program"
        onTagSelect={mockOnTagSelect}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search tags...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    expect(screen.getByText('No tags found matching "nonexistent"')).toBeInTheDocument()
  })

  it('displays example values for tags', () => {
    render(
      <MergeTagPalette
        programId="test-program"
        onTagSelect={mockOnTagSelect}
      />
    )

    expect(screen.getByText('John')).toBeInTheDocument() // fname example
    expect(screen.getByText('1,250')).toBeInTheDocument() // points example
    expect(screen.getByText('VIP Rewards')).toBeInTheDocument() // program_name example
  })

  it('shows quick help section', () => {
    render(
      <MergeTagPalette
        programId="test-program"
        onTagSelect={mockOnTagSelect}
      />
    )

    expect(screen.getByText('Quick Help')).toBeInTheDocument()
    expect(screen.getByText('• Click any tag above to insert it')).toBeInTheDocument()
    expect(screen.getByText('• Use profile.* for custom attributes')).toBeInTheDocument()
  })
})