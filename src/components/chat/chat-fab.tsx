'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { TransactionChat } from './transaction-chat'

export function ChatFab() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
            style={{ background: 'var(--brand-gradient)' }}
            aria-label="Registrar com IA"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        }
      />
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden h-[600px] flex flex-col">
        <TransactionChat onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
