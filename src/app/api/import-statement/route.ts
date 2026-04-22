import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCSV } from '@/lib/parsers/csv-parser'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

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
      // Converter PDF para base64 e enviar para Claude Vision
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')

      const today = new Date().toISOString().split('T')[0]

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              } as never,
              {
                type: 'text',
                text: `Data de hoje: ${today}

Extraia todas as transações financeiras deste extrato bancário e retorne APENAS um array JSON válido.
Cada item deve ter: date (YYYY-MM-DD), description (string), amount (number positivo), type ("income" ou "expense").

Retorne SOMENTE o array JSON, sem markdown, sem texto adicional.
Exemplo: [{"date":"2025-01-15","description":"Supermercado","amount":120.50,"type":"expense"}]`,
              },
            ],
          },
        ],
      })

      const content = message.content[0]
      if (content.type !== 'text') throw new Error('Resposta inválida')

      // Extrair JSON do texto (remover possível markdown)
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('JSON não encontrado na resposta')

      const rawTransactions = JSON.parse(jsonMatch[0]) as Array<{
        date: string
        description: string
        amount: number
        type: 'income' | 'expense'
      }>

      // Adicionar categoria sugerida
      const { parseCSV: _, ...parserModule } = await import('@/lib/parsers/csv-parser')
      void parserModule

      const transactions = rawTransactions.map((t) => ({
        ...t,
        category: t.type === 'income' ? 'other_income' : 'other_expense',
      }))

      return NextResponse.json({ transactions })
    }

    return NextResponse.json({ error: 'Tipo de arquivo não suportado' }, { status: 400 })
  } catch (err) {
    console.error('import-statement error:', err)
    return NextResponse.json({ error: 'Erro ao processar arquivo' }, { status: 500 })
  }
}
