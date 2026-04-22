import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatFab } from './chat-fab'

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ render }: { render: React.ReactNode }) => <div>{render}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('./transaction-chat', () => ({
  TransactionChat: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="transaction-chat">
      <button onClick={onClose}>Fechar chat</button>
    </div>
  ),
}))

describe('ChatFab', () => {
  it('renders the FAB button with correct aria-label', () => {
    render(<ChatFab />)
    const fab = screen.getByRole('button', { name: 'Registrar com IA' })
    expect(fab).toBeInTheDocument()
  })

  it('renders TransactionChat inside the dialog', () => {
    render(<ChatFab />)
    expect(screen.getByTestId('transaction-chat')).toBeInTheDocument()
  })
})
