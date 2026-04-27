import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCSV } from '@/lib/parsers/csv-parser'
import Anthropic from '@anthropic-ai/sdk'
import { checkAiFeature } from '@/lib/plan-gate'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const fileType = formData.get('fileType') as string | null

  if (!file || !fileType) {
    return NextResponse.json({ error: 'Arquivo e tipo são obrigatórios' }, { status: 400 })
  }

  try {
    if (fileType === 'csv') {
      const text = await file.text()
      const transactions = parseCSV(text)
      return NextResponse.json({ transactions })
    }

    if (fileType === 'pdf') {
      const gate = await checkAiFeature(user.id, 'pdf_import')
      if (!gate.allowed) {
        return NextResponse.json({ error: gate.reason }, { status: 402 })
      }

      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const today = new Date().toISOString().split('T')[0]

      const anthropic = new Anthropic()
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64 },
              } as never,
              {
                type: 'text',
                text: `Data de hoje: ${today}

Extraia todas as transações financeiras deste extrato bancário e retorne APENAS um array JSON válido.
Cada item deve ter: date (YYYY-MM-DD), description (string), amount (number positivo), type ("income" ou "expense").
Pagamentos de fatura, estornos e depósitos são "income". Compras e débitos são "expense".
Ignore linhas de cabeçalho, totais e informações institucionais.

Retorne SOMENTE o array JSON, sem markdown, sem texto adicional.
Exemplo: [{"date":"2026-01-15","description":"Supermercado","amount":120.50,"type":"expense"}]`,
              },
            ],
          },
        ],
      })

      const content = message.content[0]
      if (content.type !== 'text') throw new Error('Resposta inválida da IA')

      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Nenhuma transação encontrada no arquivo')

      const raw = JSON.parse(jsonMatch[0]) as Array<{
        date: string; description: string; amount: number; type: 'income' | 'expense'
      }>

      const transactions = raw.map((t) => ({
        ...t,
        category: t.type === 'income' ? 'other_income' : 'other_expense',
      }))

      return NextResponse.json({ transactions })
    }

    return NextResponse.json({ error: 'Tipo de arquivo não suportado' }, { status: 400 })
  } catch (err) {
    console.error('import-statement error:', err)
    return NextResponse.json({ error: 'Erro ao processar o arquivo.' }, { status: 500 })
  }
}
