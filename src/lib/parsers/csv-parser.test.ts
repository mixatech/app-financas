import { describe, it, expect } from 'vitest'
import { parseCSV } from '@/lib/parsers/csv-parser'

describe('parseCSV', () => {
  it('returns empty array for empty content', () => {
    expect(parseCSV('')).toEqual([])
  })

  it('returns empty array when CSV has no rows', () => {
    expect(parseCSV('date,title,amount\n')).toEqual([])
  })

  it('parses Nubank format (date, title, amount)', () => {
    const csv = `date,title,amount
2024-01-15,Supermercado,-120.50
2024-01-16,Uber,-30.00`

    const result = parseCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      date: '2024-01-15',
      description: 'Supermercado',
      amount: 120.5,
      type: 'expense',
      category: 'food',
    })
    expect(result[1]).toMatchObject({
      description: 'Uber',
      type: 'expense',
      category: 'transport',
    })
  })

  it('parses Inter format (Data, Descricao, Valor, Tipo)', () => {
    const csv = `Data,Descricao,Valor,Tipo
15/01/2024,Salario,3000.00,C
16/01/2024,Aluguel,1500.00,D`

    const result = parseCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      date: '2024-01-15',
      description: 'Salario',
      amount: 3000,
      type: 'income',
      category: 'other_income',
    })
    expect(result[1]).toMatchObject({
      amount: 1500,
      type: 'expense',
      category: 'housing',
    })
  })

  it('parses date in DD/MM/YYYY format', () => {
    const csv = `date,title,amount
25/12/2024,Natal,-50.00`

    const result = parseCSV(csv)
    expect(result[0].date).toBe('2024-12-25')
  })

  it('returns empty array when required columns are missing', () => {
    const csv = `coluna_a,coluna_b\n1,2`
    expect(parseCSV(csv)).toEqual([])
  })

  it('filters out rows with zero amount', () => {
    const csv = `date,title,amount
2024-01-15,Sem valor,0
2024-01-16,Com valor,-50.00`

    const result = parseCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0].description).toBe('Com valor')
  })

  it('assigns correct category via keyword matching', () => {
    const csv = `date,title,amount
2024-01-01,Netflix,-30
2024-01-02,Farmacia,-25
2024-01-03,Faculdade,-500`

    const result = parseCSV(csv)
    expect(result[0].category).toBe('entertainment')
    expect(result[1].category).toBe('health')
    expect(result[2].category).toBe('education')
  })
})
