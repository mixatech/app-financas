// pdf-parse 1.x é CJS — importar pelo caminho interno evita o bug de leitura de teste no Next.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer, opts?: { password?: string }) => Promise<{ text: string }> = require('pdf-parse/lib/pdf-parse.js')

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
}

const PT_MONTHS: Record<string, string> = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
}

function guessCategory(description: string): string {
  const d = description.toLowerCase()
  if (/mercado|supermercado|padaria|hortifruti|ifood|rappi|restaurante/.test(d)) return 'food'
  if (/uber|99|taxi|combustível|gasolina|posto|onibus|ônibus|metro|metrô/.test(d)) return 'transport'
  if (/aluguel|condominio|condomínio|iptu|energia|agua|água|gás|gas|internet/.test(d)) return 'housing'
  if (/farmacia|farmácia|medico|médico|hospital|plano|saude|saúde|dentist/.test(d)) return 'health'
  if (/escola|faculdade|curso|livro|udemy|alura/.test(d)) return 'education'
  if (/cinema|netflix|spotify|amazon|bar|balada|teatro|show|streaming/.test(d)) return 'entertainment'
  if (/roupa|sapato|calçado|zara|renner|c&a|shein/.test(d)) return 'clothing'
  return 'other_expense'
}

function parseAmount(raw: string): number {
  const clean = raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  return Math.abs(parseFloat(clean) || 0)
}

// C6 Bank: "01 jan", "21 fev", etc. com ano implícito
function parsePtDate(day: string, month: string, year: number): string {
  const m = PT_MONTHS[month.toLowerCase()] ?? '01'
  return `${year}-${m}-${day.padStart(2, '0')}`
}

function inferYear(text: string): number {
  // Tenta extrair o ano do texto da fatura (ex: "02/04/2026", "10 de Abril de 2026")
  const m = text.match(/\b(20\d{2})\b/)
  return m ? parseInt(m[1]) : new Date().getFullYear()
}

// C6 Bank: linhas com "DD mmm  DESCRICAO  VALOR"
function parseC6Bank(text: string): ParsedTransaction[] {
  const year = inferYear(text)
  const results: ParsedTransaction[] = []

  // Cada linha de transação: (checkbox opcional) DD mmm  DESCRICAO  VALOR
  // Ex: "01 jan  CINEMARK BRASIL S.A EC - Parcela 4/12  32,90"
  const linePattern = /^(?:□\s+)?(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s+(.+?)\s+([\d.]+,\d{2})$/i

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    const m = line.match(linePattern)
    if (!m) continue

    const [, day, month, description, amountRaw] = m
    const amount = parseAmount(amountRaw)
    if (amount === 0) continue

    const desc = description.trim()
    const isIncome = /inclusao de pagamento|pagamento recebido|estorno|devolucao|devolu/i.test(desc)
    const type: 'income' | 'expense' = isIncome ? 'income' : 'expense'

    results.push({
      date: parsePtDate(day, month, year),
      description: desc,
      amount,
      type,
      category: type === 'income' ? 'other_income' : guessCategory(desc),
    })
  }

  return results
}

// Formato genérico: linhas com DD/MM/YYYY ou DD/MM/YY no início
function parseGeneric(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const datePattern = /^(\d{2}\/\d{2}\/(?:\d{4}|\d{2}))/

  for (const line of lines) {
    const dateMatch = line.match(datePattern)
    if (!dateMatch) continue

    const [d, m, y] = dateMatch[1].split('/')
    const year = y.length === 2 ? `20${y}` : y
    const date = `${year}-${m}-${d}`
    const rest = line.slice(dateMatch[0].length).trim()

    const amountMatch = rest.match(/([\d.]+,\d{2})\s*([CcDd]?)$/)
    if (!amountMatch) continue

    const amount = parseAmount(amountMatch[1])
    if (amount === 0) continue

    const description = rest.slice(0, rest.length - amountMatch[0].length).trim()
    if (!description) continue

    const creditDebit = amountMatch[2].toUpperCase()
    const type: 'income' | 'expense' = creditDebit === 'C' ? 'income' : 'expense'

    results.push({
      date,
      description,
      amount,
      type,
      category: type === 'income' ? 'other_income' : guessCategory(description),
    })
  }

  return results
}

function extractTransactions(text: string): ParsedTransaction[] {
  // Tenta C6 Bank primeiro
  const c6 = parseC6Bank(text)
  if (c6.length > 0) return c6

  // Fallback para formato genérico DD/MM/YYYY
  return parseGeneric(text)
}

export async function parsePDF(buffer: Buffer, password?: string): Promise<ParsedTransaction[]> {
  const data = await pdfParse(buffer, password ? { password } : undefined)
  return extractTransactions(data.text)
}

export async function parsePDFRawText(buffer: Buffer, password?: string): Promise<string> {
  const data = await pdfParse(buffer, password ? { password } : undefined)
  return data.text
}
