import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OnboardingFlow } from './onboarding-flow'

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockCreateFamilyGroup = vi.fn()

vi.mock('./actions', () => ({
  createFamilyGroup: (...args: unknown[]) => mockCreateFamilyGroup(...args),
}))

describe('OnboardingFlow', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockRefresh.mockClear()
    mockCreateFamilyGroup.mockClear()
  })

  it('renders the choose step with 3 options', () => {
    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    expect(screen.getByText('Como você quer começar?')).toBeInTheDocument()
    expect(screen.getByText('Criar grupo familiar')).toBeInTheDocument()
    expect(screen.getByText('Entrar em um grupo')).toBeInTheDocument()
    expect(screen.getByText('Usar individualmente')).toBeInTheDocument()
  })

  it('shows create group form when "Criar grupo familiar" is clicked', () => {
    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Criar grupo familiar'))

    expect(screen.getByPlaceholderText('Ex: Família Silva')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar grupo' })).toBeInTheDocument()
  })

  it('shows join form when "Entrar em um grupo" is clicked', () => {
    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Entrar em um grupo'))

    expect(screen.getByPlaceholderText('https://familyfinance.app/family/invite/...')).toBeInTheDocument()
  })

  it('disables the create button when group name is empty', () => {
    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Criar grupo familiar'))

    const createButton = screen.getByRole('button', { name: 'Criar grupo' })
    expect(createButton).toBeDisabled()
    expect(mockCreateFamilyGroup).not.toHaveBeenCalled()
  })

  it('displays error returned from createFamilyGroup', async () => {
    mockCreateFamilyGroup.mockResolvedValueOnce({ error: 'Erro ao criar grupo' })

    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Criar grupo familiar'))
    fireEvent.change(screen.getByPlaceholderText('Ex: Família Silva'), {
      target: { value: 'Família Teste' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Criar grupo' }))

    await waitFor(() => {
      expect(screen.getByText('Erro ao criar grupo')).toBeInTheDocument()
    })
  })

  it('navigates to /family on successful group creation', async () => {
    mockCreateFamilyGroup.mockResolvedValueOnce({ success: true })

    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Criar grupo familiar'))
    fireEvent.change(screen.getByPlaceholderText('Ex: Família Silva'), {
      target: { value: 'Família Teste' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Criar grupo' }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/family')
    })
  })

  it('navigates to /dashboard when "Usar individualmente" is clicked', () => {
    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Usar individualmente'))

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})
