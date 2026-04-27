import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkAiFeature } from '@/lib/plan-gate'

const client = new Anthropic()

const SYSTEM_PROMPT = `Você é um assistente de finanças pessoais. Extraia os dados da transação do texto do usuário e retorne APENAS JSON válido, sem markdown, sem texto adicional.

Campos obrigatórios:
- type: "income" ou "expense"
- amount: number (valor em reais, sempre positivo)
- description: string (descrição curta e limpa)
- category: uma das categorias abaixo
- date: string no formato YYYY-MM-DD (use a data de hoje se não informada)
- confidence: number entre 0 e 1

Categorias disponíveis:
- Para receitas: salary (salário), freelance, investment (investimento), other_income (outros)
- Para despesas: food (alimentação), transport (transporte), housing (moradia), health (saúde), education (educação), entertainment (lazer), clothing (vestuário), other_expense (outros)

Exemplos de mapeamento:
- mercado/supermercado → food
- uber/taxi/combustível/ônibus → transport
- aluguel/condomínio → housing
- farmácia/médico/plano → health
- curso/escola → education
- cinema/streaming/bar/restaurante → entertainment
- roupa/sapato → clothing
- salário/pagamento → salary (income)

Retorne exatamente este JSON (sem campos extras):
{"type":"expense","amount":50,"description":"Supermercado","category":"food","date":"2025-01-15","confidence":0.95}`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const gate = await checkAiFeature(user.id, 'ai_chat')
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 402 })
  }

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Data de hoje: ${today}\n\nTexto do usuário: "${text}"`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Resposta inválida')

    const parsed = JSON.parse(content.text)
    return NextResponse.json({ transaction: parsed })
  } catch {
    return NextResponse.json({ error: 'Não foi possível interpretar a transação.' }, { status: 422 })
  }
}
