# Auditoria, Testes e Build — FamilyFinance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir todos os erros de ESLint que bloqueiam o build, remover código morto, configurar Vitest + React Testing Library e escrever testes unitários e de integração cobrindo os fluxos principais, garantindo que `npm run test`, `npm run build` e `npm run dev` funcionem sem erros.

**Architecture:** Auditoria first — fixes are isolated to specific lines in 5 files. Depois, setup de Vitest com jsdom, mocking de next/navigation e Supabase, e testes escritos próximos aos arquivos que testam (co-location).

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom

---

## File Map

### Modificar (auditoria)
- `src/components/chat/transaction-chat.tsx` — fix 4 aspas não escapadas na linha 111
- `src/components/import/statement-import.tsx` — remover import `X` e state `selectedCard`
- `src/app/(app)/onboarding/onboarding-flow.tsx` — remover `userId: _userId` do destructuring
- `src/app/api/import-statement/route.ts` — remover dead code nas linhas 82-83

### Deletar
- `src/proxy.ts` — duplicata do middleware, nunca registrada pelo Next.js

### Criar (config de testes)
- `vitest.config.ts` — configuração do Vitest com jsdom + alias `@/`
- `src/test/setup.ts` — importa @testing-library/jest-dom globalmente

### Criar (testes)
- `src/lib/parsers/csv-parser.test.ts`
- `src/types/index.test.ts`
- `src/app/(app)/onboarding/onboarding-flow.test.tsx`
- `src/components/transactions/transaction-form.test.tsx`
- `src/components/chat/chat-fab.test.tsx`
- `src/app/(app)/onboarding/actions.test.ts`

---

## Task 1: Corrigir ESLint errors em transaction-chat.tsx

**Files:**
- Modify: `src/components/chat/transaction-chat.tsx:111`

- [ ] **Step 1: Substituir as aspas não escapadas**

Linha 111 atual:
```tsx
<p className="text-gray-500 text-xs">Ex: <em>"Gastei 80 reais no mercado hoje"</em> ou <em>"Recebi meu salário de 3000"</em></p>
```

Linha 111 corrigida (usar `&quot;`):
```tsx
<p className="text-gray-500 text-xs">Ex: <em>&quot;Gastei 80 reais no mercado hoje&quot;</em> ou <em>&quot;Recebi meu salário de 3000&quot;</em></p>
```

- [ ] **Step 2: Verificar que os erros sumiram**

```bash
npx eslint src/components/chat/transaction-chat.tsx
```

Esperado: nenhum output (sem erros).

---

## Task 2: Corrigir statement-import.tsx

**Files:**
- Modify: `src/components/import/statement-import.tsx:4,71`

- [ ] **Step 1: Remover import `X` não usado**

Linha 4 atual:
```tsx
import { Upload, FileText, X } from 'lucide-react'
```

Linha 4 corrigida:
```tsx
import { Upload, FileText } from 'lucide-react'
```

- [ ] **Step 2: Remover state `selectedCard` não usado**

Linha 71 atual:
```tsx
  const selectedCard = cards.find((c) => c.id === selectedCardId)
```

Linha 71 corrigida: remover a linha inteira.

- [ ] **Step 3: Verificar**

```bash
npx eslint src/components/import/statement-import.tsx
```

Esperado: nenhum output.

---

## Task 3: Corrigir onboarding-flow.tsx e import-statement/route.ts

**Files:**
- Modify: `src/app/(app)/onboarding/onboarding-flow.tsx:17`
- Modify: `src/app/api/import-statement/route.ts:82-83`

- [ ] **Step 1: Remover `userId: _userId` do destructuring em onboarding-flow.tsx**

Linha 17 atual:
```tsx
export function OnboardingFlow({ userId: _userId, userEmail }: OnboardingFlowProps) {
```

Linha 17 corrigida:
```tsx
export function OnboardingFlow({ userEmail }: OnboardingFlowProps) {
```

- [ ] **Step 2: Remover dead code em import-statement/route.ts**

Linhas 82-83 atuais (dentro do bloco `if (fileType === 'pdf')`):
```ts
      // Adicionar categoria sugerida
      const { parseCSV: _, ...parserModule } = await import('@/lib/parsers/csv-parser')
      void parserModule
```

Remover as 3 linhas acima completamente (o código de `map` que vem depois continua funcionando sem elas).

- [ ] **Step 3: Verificar ambos**

```bash
npx eslint src/app/\(app\)/onboarding/onboarding-flow.tsx src/app/api/import-statement/route.ts
```

Esperado: nenhum output.

---

## Task 4: Deletar proxy.ts e verificar build completo

**Files:**
- Delete: `src/proxy.ts`

- [ ] **Step 1: Deletar o arquivo**

```bash
rm src/proxy.ts
```

- [ ] **Step 2: Rodar ESLint em todo o src/**

```bash
npx eslint src/ --ext .ts,.tsx
```

Esperado: nenhum output (0 errors, 0 warnings).

- [ ] **Step 3: Rodar o build**

```bash
npm run build
```

Esperado: `✓ Compiled successfully` sem erros de lint ou TypeScript na source.

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/transaction-chat.tsx \
        src/components/import/statement-import.tsx \
        "src/app/(app)/onboarding/onboarding-flow.tsx" \
        src/app/api/import-statement/route.ts
git rm src/proxy.ts
git commit -m "fix: corrigir erros de ESLint e remover código morto"
```

---

## Task 5: Instalar dependências de teste

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar pacotes**

```bash
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Esperado: os pacotes aparecem em `devDependencies` no `package.json`.

---

## Task 6: Configurar Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json` (adicionar script `test`)

- [ ] **Step 1: Criar vitest.config.ts na raiz do projeto**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Criar src/test/setup.ts**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Adicionar scripts de teste ao package.json**

No objeto `"scripts"` do `package.json`, adicionar:
```json
"test": "vitest",
"test:run": "vitest run"
```

Resultado final do bloco scripts:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 4: Verificar que o runner inicia**

```bash
npm run test:run
```

Esperado: `No test files found` (ou similar) — confirma que a configuração está correta sem erros.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json package-lock.json
git commit -m "test: configurar Vitest + React Testing Library"
```

---

## Task 7: Testes unitários do CSV Parser

**Files:**
- Create: `src/lib/parsers/csv-parser.test.ts`

- [ ] **Step 1: Escrever os testes**

```ts
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
```

- [ ] **Step 2: Rodar e verificar que passam**

```bash
npm run test:run -- src/lib/parsers/csv-parser.test.ts
```

Esperado: `8 tests passed`.

---

## Task 8: Testes unitários de getCategoryLabel

**Files:**
- Create: `src/types/index.test.ts`

- [ ] **Step 1: Escrever os testes**

```ts
import { describe, it, expect } from 'vitest'
import { getCategoryLabel } from '@/types'

describe('getCategoryLabel', () => {
  it('returns correct label for expense categories', () => {
    expect(getCategoryLabel('food')).toBe('Alimentação')
    expect(getCategoryLabel('transport')).toBe('Transporte')
    expect(getCategoryLabel('housing')).toBe('Moradia')
    expect(getCategoryLabel('health')).toBe('Saúde')
    expect(getCategoryLabel('education')).toBe('Educação')
    expect(getCategoryLabel('entertainment')).toBe('Lazer')
    expect(getCategoryLabel('clothing')).toBe('Vestuário')
    expect(getCategoryLabel('other_expense')).toBe('Outras despesas')
  })

  it('returns correct label for income categories', () => {
    expect(getCategoryLabel('salary')).toBe('Salário')
    expect(getCategoryLabel('freelance')).toBe('Freelance')
    expect(getCategoryLabel('investment')).toBe('Investimento')
    expect(getCategoryLabel('other_income')).toBe('Outras receitas')
  })

  it('returns the raw value for unknown categories', () => {
    expect(getCategoryLabel('unknown' as never)).toBe('unknown')
  })
})
```

- [ ] **Step 2: Rodar e verificar**

```bash
npm run test:run -- src/types/index.test.ts
```

Esperado: `3 tests passed`.

---

## Task 9: Testes de integração do OnboardingFlow

**Files:**
- Create: `src/app/(app)/onboarding/onboarding-flow.test.tsx`

- [ ] **Step 1: Escrever os testes**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OnboardingFlow } from './onboarding-flow'

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockCreateFamilyGroup = vi.fn()

vi.mock('./actions', () => ({
  createFamilyGroup: (...args: unknown[]) => mockCreateFamilyGroup(...args),
}))

describe('OnboardingFlow', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockRefresh.mockClear()
    mockCreateFamilyGroup.mockClear()
  })

  it('renders the choose step with 3 options', () => {
    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    expect(screen.getByText('Como você quer começar?')).toBeInTheDocument()
    expect(screen.getByText('Criar grupo familiar')).toBeInTheDocument()
    expect(screen.getByText('Entrar em um grupo')).toBeInTheDocument()
    expect(screen.getByText('Usar individualmente')).toBeInTheDocument()
  })

  it('shows create group form when "Criar grupo familiar" is clicked', () => {
    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Criar grupo familiar'))

    expect(screen.getByPlaceholderText('Ex: Família Silva')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar grupo' })).toBeInTheDocument()
  })

  it('shows join form when "Entrar em um grupo" is clicked', () => {
    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Entrar em um grupo'))

    expect(screen.getByPlaceholderText(/link de convite/i)).toBeInTheDocument()
  })

  it('disables the create button when group name is empty', () => {
    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Criar grupo familiar'))

    const createButton = screen.getByRole('button', { name: 'Criar grupo' })
    expect(createButton).toBeDisabled()
    expect(mockCreateFamilyGroup).not.toHaveBeenCalled()
  })

  it('displays error returned from createFamilyGroup', async () => {
    mockCreateFamilyGroup.mockResolvedValueOnce({ error: 'Erro ao criar grupo' })

    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Criar grupo familiar'))
    fireEvent.change(screen.getByPlaceholderText('Ex: Família Silva'), {
      target: { value: 'Família Teste' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Criar grupo' }))

    await waitFor(() => {
      expect(screen.getByText('Erro ao criar grupo')).toBeInTheDocument()
    })
  })

  it('navigates to /family on successful group creation', async () => {
    mockCreateFamilyGroup.mockResolvedValueOnce({ success: true })

    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Criar grupo familiar'))
    fireEvent.change(screen.getByPlaceholderText('Ex: Família Silva'), {
      target: { value: 'Família Teste' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Criar grupo' }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/family')
    })
  })

  it('navigates to /dashboard when "Usar individualmente" is clicked', () => {
    render(<OnboardingFlow userId="user-1" userEmail="test@example.com" />)

    fireEvent.click(screen.getByText('Usar individualmente'))

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})
```

- [ ] **Step 2: Rodar e verificar**

```bash
npm run test:run -- "src/app/\(app\)/onboarding/onboarding-flow.test.tsx"
```

Esperado: `7 tests passed`.

---

## Task 10: Testes de integração do TransactionForm

**Files:**
- Create: `src/components/transactions/transaction-form.test.tsx`

- [ ] **Step 1: Escrever os testes**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TransactionForm } from './transaction-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ render }: { render: React.ReactNode }) => <div>{render}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))

describe('TransactionForm', () => {
  it('renders "Nova transação" trigger when no transaction prop is passed', () => {
    render(<TransactionForm />)
    expect(screen.getByText('Nova transação')).toBeInTheDocument()
  })

  it('renders "Editar" trigger when a transaction prop is passed', () => {
    const transaction = {
      id: 'tx-1',
      user_id: 'user-1',
      type: 'expense' as const,
      amount: 50,
      description: 'Supermercado',
      category: 'food' as const,
      date: '2024-01-15',
      created_at: '2024-01-15T00:00:00Z',
    }
    render(<TransactionForm transaction={transaction} />)
    expect(screen.getByText('Editar')).toBeInTheDocument()
  })

  it('renders form fields (amount, description, date)', () => {
    render(<TransactionForm />)
    expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/supermercado/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue(new Date().toISOString().split('T')[0])).toBeInTheDocument()
  })

  it('shows error when submitting with empty amount', async () => {
    render(<TransactionForm />)

    const form = screen.getByRole('button', { name: 'Salvar' }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Informe um valor válido.')).toBeInTheDocument()
    })
  })

  it('shows "Despesa" as default type', () => {
    render(<TransactionForm />)
    const despesaButton = screen.getByRole('button', { name: 'Despesa' })
    expect(despesaButton).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e verificar**

```bash
npm run test:run -- src/components/transactions/transaction-form.test.tsx
```

Esperado: `5 tests passed`.

---

## Task 11: Testes de integração do ChatFab

**Files:**
- Create: `src/components/chat/chat-fab.test.tsx`

- [ ] **Step 1: Escrever os testes**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatFab } from './chat-fab'

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ render }: { render: React.ReactNode }) => <div>{render}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('./transaction-chat', () => ({
  TransactionChat: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="transaction-chat">
      <button onClick={onClose}>Fechar chat</button>
    </div>
  ),
}))

describe('ChatFab', () => {
  it('renders the FAB button with correct aria-label', () => {
    render(<ChatFab />)
    const fab = screen.getByRole('button', { name: 'Registrar com IA' })
    expect(fab).toBeInTheDocument()
  })

  it('renders TransactionChat inside the dialog', () => {
    render(<ChatFab />)
    expect(screen.getByTestId('transaction-chat')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e verificar**

```bash
npm run test:run -- src/components/chat/chat-fab.test.tsx
```

Esperado: `2 tests passed`.

---

## Task 12: Testes da server action createFamilyGroup

**Files:**
- Create: `src/app/(app)/onboarding/actions.test.ts`

- [ ] **Step 1: Escrever os testes**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFamilyGroup } from './actions'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const mockCreateClient = vi.mocked(createClient)

describe('createFamilyGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(),
    } as never)

    const result = await createFamilyGroup('Família Teste', 'Mylena')

    expect(result).toEqual({ error: 'Sessão expirada. Faça login novamente.' })
  })

  it('returns success when group and member are created', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'group-1' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsertGroup = vi.fn().mockReturnValue({ select: mockSelect })
    const mockInsertMember = vi.fn().mockResolvedValue({ error: null })

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: vi.fn()
        .mockReturnValueOnce({ insert: mockInsertGroup })
        .mockReturnValueOnce({ insert: mockInsertMember }),
    } as never)

    const result = await createFamilyGroup('Família Teste', 'Mylena')

    expect(result).toEqual({ success: true })
    expect(mockInsertGroup).toHaveBeenCalledWith({
      name: 'Família Teste',
      created_by: 'user-1',
    })
  })

  it('returns error when family group DB insert fails', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Permissão negada' } })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsertGroup = vi.fn().mockReturnValue({ select: mockSelect })

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: vi.fn().mockReturnValue({ insert: mockInsertGroup }),
    } as never)

    const result = await createFamilyGroup('Família Teste', 'Mylena')

    expect(result).toEqual({ error: 'Permissão negada' })
  })

  it('trims whitespace from groupName before inserting', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'group-1' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsertGroup = vi.fn().mockReturnValue({ select: mockSelect })
    const mockInsertMember = vi.fn().mockResolvedValue({ error: null })

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: vi.fn()
        .mockReturnValueOnce({ insert: mockInsertGroup })
        .mockReturnValueOnce({ insert: mockInsertMember }),
    } as never)

    await createFamilyGroup('  Família Teste  ', 'Mylena')

    expect(mockInsertGroup).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Família Teste' })
    )
  })
})
```

- [ ] **Step 2: Rodar e verificar**

```bash
npm run test:run -- "src/app/\(app\)/onboarding/actions.test.ts"
```

Esperado: `4 tests passed`.

---

## Task 13: Verificação final completa

- [ ] **Step 1: Rodar todos os testes**

```bash
npm run test:run
```

Esperado: todos os testes passam, nenhum falha. Resultado similar a:
```
✓ src/lib/parsers/csv-parser.test.ts (8)
✓ src/types/index.test.ts (3)
✓ src/app/(app)/onboarding/onboarding-flow.test.tsx (7)
✓ src/components/transactions/transaction-form.test.tsx (5)
✓ src/components/chat/chat-fab.test.tsx (2)
✓ src/app/(app)/onboarding/actions.test.ts (4)

Test Files  6 passed (6)
Tests      29 passed (29)
```

- [ ] **Step 2: Rodar o build de produção**

```bash
npm run build
```

Esperado: `✓ Compiled successfully` sem erros.

- [ ] **Step 3: Rodar o dev server**

```bash
npm run dev
```

Esperado: `Ready` no terminal sem erros, app abre no browser em `http://localhost:3000`.

- [ ] **Step 4: Commit final**

```bash
git add src/lib/parsers/csv-parser.test.ts \
        src/types/index.test.ts \
        "src/app/(app)/onboarding/onboarding-flow.test.tsx" \
        "src/app/(app)/onboarding/actions.test.ts" \
        src/components/transactions/transaction-form.test.tsx \
        src/components/chat/chat-fab.test.tsx
git commit -m "test: adicionar suíte de testes unitários e de integração"
```
