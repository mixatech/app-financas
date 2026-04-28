import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TransactionForm } from './transaction-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ render }: { render: React.ReactNode }) => <div>{render}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

describe('TransactionForm', () => {
  it('renders "Nova transação" trigger when no transaction prop is passed', () => {
    render(<TransactionForm />)
    // Both the trigger button and the dialog title contain "Nova transação" since
    // the mock renders everything flat (no open/close state).
    // getAllByText handles multiple matches gracefully.
    const elements = screen.getAllByText('Nova transação')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders "Editar" trigger when a transaction prop is passed', () => {
    const transaction = {
      id: 'tx-1',
      user_id: 'user-1',
      type: 'expense' as const,
      amount: 50,
      description: 'Supermercado',
      category: 'food' as const,
      date: '2024-01-15',
      created_at: '2024-01-15T00:00:00Z',
    }
    render(<TransactionForm transaction={transaction} />)
    expect(screen.getByText('Editar')).toBeInTheDocument()
  })

  it('renders form fields (amount, description, date)', () => {
    render(<TransactionForm />)
    expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/supermercado/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(new Date().toISOString().split('T')[0])).toBeInTheDocument()
  })

  it('shows error when submitting with empty amount', async () => {
    render(<TransactionForm />)

    const form = screen.getByRole('button', { name: 'Salvar' }).closest('form')!
    fireEvent.submit(form)

    await waitFor(
      () => {
        expect(screen.getByText('Informe um valor válido.')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('shows "Despesa" as default type', () => {
    render(<TransactionForm />)
    const despesaButton = screen.getByRole('button', { name: 'Despesa' })
    expect(despesaButton).toBeInTheDocument()
  })
})
