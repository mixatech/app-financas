import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkAiFeature } from '@/lib/plan-gate'

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

Exemplos de mapeamento (seja conservador, prefira food para qualquer menção a comida):
- comida/alimento/refeição/almoço/jantar/café/lanche/marmita → food
- mercado/supermercado/feira/hortifruti/açougue → food
- ifood/rappi/delivery de comida → food
- uber/taxi/ônibus/metrô/combustível/gasolina/estacionamento → transport
- aluguel/condomínio/iptu/energia/água/internet → housing
- farmácia/médico/dentista/plano de saúde/hospital/consulta → health
- curso/escola/faculdade/livro/material escolar → education
- cinema/teatro/show/streaming/netflix/spotify → entertainment
- bar/balada/festa → entertainment
- roupa/sapato/vestuário/calçado/acessório/moda → clothing
- salário/pagamento/contracheque → salary (income)
- freela/freelance/serviço prestado → freelance (income)
- dividendo/rendimento/aplicação → investment (income)

Retorne exatamente este JSON (sem campos extras):
{"type":"expense","amount":50,"description":"Supermercado","category":"food","date":"2025-01-15","confidence":0.95}`

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Chat IA não configurado. Adicione ANTHROPIC_API_KEY no .env.local.' },
      { status: 503 }
    )
  }

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
  const client = new Anthropic({ timeout: 20_000 })

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Data de hoje: ${today}\n\nTexto do usuário: "${text}"`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Resposta inválida')

    const raw = content.text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    const parsed = JSON.parse(raw)
    return NextResponse.json({ transaction: parsed })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Anthropic error — status:', status, '| message:', msg)
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return NextResponse.json({ error: 'A IA demorou demais para responder. Tente novamente.' }, { status: 504 })
    }
    return NextResponse.json({ error: `Erro IA: ${msg}` }, { status: 422 })
  }
}
