import Papa from 'papaparse'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
}

function guessCategory(description: string): string {
  const d = description.toLowerCase()
  if (/mercado|supermercado|padaria|hortifruti|ifood|rappi/.test(d)) return 'food'
  if (/uber|99|taxi|combustível|gasolina|posto|onibus|ônibus|metro|metrô/.test(d)) return 'transport'
  if (/aluguel|condominio|condomínio|iptu|energia|agua|água|gás|gas|internet/.test(d)) return 'housing'
  if (/farmacia|farmácia|medico|médico|hospital|plano|saude|saúde|dentist/.test(d)) return 'health'
  if (/escola|faculdade|curso|livro|udemy|alura|estácio/.test(d)) return 'education'
  if (/cinema|netflix|spotify|amazon|bar|balada|teatro|show|streaming/.test(d)) return 'entertainment'
  if (/roupa|sapato|calçado|zara|renner|c&a|shein/.test(d)) return 'clothing'
  return 'other_expense'
}

function parseDate(raw: string): string {
  // Aceita DD/MM/YYYY, YYYY-MM-DD, DD/MM/YY
  const clean = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
  const parts = clean.split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return new Date().toISOString().split('T')[0]
}

export function parseCSV(content: string): ParsedTransaction[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  const rows = result.data
  if (rows.length === 0) return []

  const headers = Object.keys(rows[0]).map((h) => h.toLowerCase())

  // Detectar formato Nubank: date, title, amount
  if (headers.includes('date') && headers.includes('title') && headers.includes('amount')) {
    return rows.map((row) => {
      const amount = Math.abs(parseFloat(row['amount'] ?? '0'))
      return {
        date: parseDate(row['date'] ?? ''),
        description: row['title'] ?? '',
        amount,
        type: 'expense' as const,
        category: guessCategory(row['title'] ?? ''),
      }
    }).filter((t) => t.amount > 0)
  }

  // Detectar formato Inter: Data, Descricao, Valor, Tipo
  if (headers.includes('data') && (headers.includes('descricao') || headers.includes('descrição'))) {
    const descKey = Object.keys(rows[0]).find((k) => k.toLowerCase().includes('descri')) ?? 'Descricao'
    const valorKey = Object.keys(rows[0]).find((k) => k.toLowerCase().includes('valor')) ?? 'Valor'
    const tipoKey = Object.keys(rows[0]).find((k) => k.toLowerCase().includes('tipo')) ?? 'Tipo'
    const dataKey = Object.keys(rows[0]).find((k) => k.toLowerCase() === 'data') ?? 'Data'

    return rows.map((row) => {
      const rawAmount = (row[valorKey] ?? '0').replace(',', '.').replace(/[^\d.-]/g, '')
      const amount = Math.abs(parseFloat(rawAmount))
      const tipo = (row[tipoKey] ?? '').toUpperCase()
      const type: 'income' | 'expense' = tipo === 'C' || tipo === 'CREDITO' || tipo === 'CRÉDITO' ? 'income' : 'expense'

      return {
        date: parseDate(row[dataKey] ?? ''),
        description: row[descKey] ?? '',
        amount,
        type,
        category: type === 'income' ? 'other_income' : guessCategory(row[descKey] ?? ''),
      }
    }).filter((t) => t.amount > 0)
  }

  // Formato genérico: tentar detectar colunas por nome
  const dateKey = Object.keys(rows[0]).find((k) => /date|data/i.test(k))
  const descKey = Object.keys(rows[0]).find((k) => /desc|title|name|nome/i.test(k))
  const amountKey = Object.keys(rows[0]).find((k) => /amount|valor|value|total/i.test(k))

  if (!dateKey || !descKey || !amountKey) return []

  return rows.map((row) => {
    const rawAmount = (row[amountKey] ?? '0').replace(',', '.').replace(/[^\d.-]/g, '')
    const amount = parseFloat(rawAmount)
    const type: 'income' | 'expense' = amount > 0 ? 'income' : 'expense'

    return {
      date: parseDate(row[dateKey] ?? ''),
      description: row[descKey] ?? '',
      amount: Math.abs(amount),
      type,
      category: type === 'income' ? 'other_income' : guessCategory(row[descKey] ?? ''),
    }
  }).filter((t) => t.amount > 0)
}
