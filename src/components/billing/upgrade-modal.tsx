'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { CheckoutButton } from '@/components/billing/checkout-button'
import { Sparkles } from 'lucide-react'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason: 'upgrade_required' | 'limit_reached'
  feature: 'ai_chat' | 'pdf_import'
}

const MESSAGES: Record<
  'ai_chat' | 'pdf_import',
  Record<'upgrade_required' | 'limit_reached', { title: string; description: string }>
> = {
  ai_chat: {
    upgrade_required: {
      title: 'Recurso exclusivo Pro',
      description:
        'Chat IA está disponível apenas nos planos Pro e Família. Faça upgrade para registrar transações em linguagem natural.',
    },
    limit_reached: {
      title: 'Limite mensal atingido',
      description:
        'Você atingiu o limite de Chat IA do seu plano este mês. Faça upgrade para continuar usando sem restrições.',
    },
  },
  pdf_import: {
    upgrade_required: {
      title: 'Recurso exclusivo Pro',
      description:
        'Importação de PDF está disponível apenas nos planos Pro e Família. Faça upgrade para importar extratos em PDF analisados por IA.',
    },
    limit_reached: {
      title: 'Limite mensal atingido',
      description:
        'Você atingiu o limite de importação de PDF do seu plano este mês. Faça upgrade para continuar usando sem restrições.',
    },
  },
}

export function UpgradeModal({ open, onClose, reason, feature }: UpgradeModalProps) {
  const { title, description } = MESSAGES[feature][reason]

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm rounded-2xl" showCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="p-1.5 rounded-lg"
              style={{ background: 'var(--brand-gradient)' }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          <CheckoutButton
            plan="pro"
            label="Upgrade para Pro — R$19/mês"
            className="w-full h-10 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: 'var(--brand-gradient)' }}
          />
          <CheckoutButton
            plan="family"
            label="Upgrade para Família — R$39,90/mês"
            className="w-full h-10 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          />
        </div>

        <DialogFooter showCloseButton={false}>
          <button
            onClick={onClose}
            className="w-full h-9 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Agora não
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
