import { CheckoutButton } from '@/components/billing/checkout-button'
import { Check } from 'lucide-react'

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$0',
    period: '/mês',
    description: 'Para quem está começando',
    features: [
      'Até 50 transações/mês',
      'Dashboard básico',
      '1 usuário',
      'Categorias padrão',
    ],
    cta: 'Plano atual',
    ctaDisabled: true,
    highlight: false,
    violetBorder: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$19,90',
    period: '/mês',
    description: '7 dias grátis, depois R$19,90/mês',
    features: [
      'Transações ilimitadas',
      'IA financeira (30 chats IA/mês)',
      'Importação de extratos PDF',
      'Relatórios avançados',
      'Categorias personalizadas',
    ],
    cta: 'Iniciar trial grátis',
    ctaDisabled: false,
    highlight: true,
    violetBorder: false,
  },
  {
    id: 'family',
    name: 'Família',
    price: 'R$39,90',
    period: '/mês',
    description: '14 dias grátis, depois R$39,90/mês',
    features: [
      'Tudo do Pro',
      'Até 6 membros da família',
      'IA financeira (200 chats/mês)',
      'Dashboard familiar consolidado',
      'Cartões por membro',
    ],
    cta: 'Iniciar trial grátis',
    ctaDisabled: false,
    highlight: false,
    violetBorder: true,
  },
]

export default function PricingPage() {
  return (
    <div className="space-y-12">
      {/* Hero header */}
      <div
        className="rounded-2xl px-8 py-14 text-center"
        style={{
          background: 'linear-gradient(135deg, #18181b 0%, #3b0764 60%, #1e1b4b 100%)',
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-300 mb-3">
          Planos & Preços
        </p>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4">
          Controle total das suas finanças
        </h1>
        <p className="text-lg text-gray-300 max-w-xl mx-auto">
          Escolha o plano ideal para você. Cancele quando quiser, sem complicação.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isHighlight = plan.highlight
          const isViolet = plan.violetBorder

          return (
            <div
              key={plan.id}
              className="relative rounded-2xl p-8 flex flex-col gap-6"
              style={
                isHighlight
                  ? {
                      background:
                        'linear-gradient(135deg, #18181b 0%, #3b0764 60%, #1e1b4b 100%)',
                      border: '2px solid #7c3aed',
                    }
                  : isViolet
                  ? {
                      background: '#ffffff',
                      border: '2px solid #7c3aed',
                    }
                  : {
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                    }
              }
            >
              {/* MAIS POPULAR badge */}
              {isHighlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full shadow">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              {/* Plan name & price */}
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-widest mb-2 ${
                    isHighlight ? 'text-violet-300' : 'text-violet-600'
                  }`}
                >
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span
                    className={`text-3xl sm:text-4xl font-bold ${
                      isHighlight ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm mb-1 ${
                      isHighlight ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    isHighlight ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        isHighlight ? 'text-violet-400' : 'text-violet-600'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isHighlight ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.ctaDisabled ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  {plan.cta}
                </button>
              ) : (
                <CheckoutButton
                  plan={plan.id as 'pro' | 'family'}
                  label={plan.cta}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    isHighlight
                      ? 'bg-violet-500 text-white hover:bg-violet-400 active:bg-violet-600'
                      : 'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Trust signals */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <span>Pagamento seguro via Stripe</span>
        </div>
        <div className="hidden sm:block w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-2">
          <span>↩️</span>
          <span>Cancele quando quiser</span>
        </div>
        <div className="hidden sm:block w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-2">
          <span>🇧🇷</span>
          <span>Preços em Real</span>
        </div>
      </div>
    </div>
  )
}
