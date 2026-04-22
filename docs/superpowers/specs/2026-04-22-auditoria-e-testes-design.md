# Auditoria, Testes e Build — FamilyFinance

**Data:** 2026-04-22
**Objetivo:** Corrigir todos os problemas que impedem `npm run build` limpo, criar suíte de testes unitários + integração com Vitest + React Testing Library, e garantir que `npm run dev` e `npm run build` funcionem sem erros.

---

## 1. Auditoria — Correções

### ESLint errors (bloqueiam build)
| Arquivo | Linha | Problema | Correção |
|---|---|---|---|
| `src/components/chat/transaction-chat.tsx` | 111 | 4x aspas `"` não escapadas no JSX | Escapar com `&quot;` ou usar `{'"}` |
| `src/components/import/statement-import.tsx` | 4, 71 | Import `X` não usado + state `selectedCard` nunca lido | Remover import e state |
| `src/app/(app)/onboarding/onboarding-flow.tsx` | 17 | Prop `_userId` nunca usada | Remover do destructuring |
| `src/app/api/import-statement/route.ts` | 82 | `parseCSV: _` dead code | Remover a linha |

### Arquivo morto
- `src/proxy.ts` — duplicata do middleware com função exportada como `proxy` em vez de `middleware`. Nunca registrado pelo Next.js. Deletar.

### TypeScript
- Erros em `.next/` são stale dev types gerados automaticamente. Resolvem com build limpo — sem ação necessária.

---

## 2. Setup de Testes

### Stack
- **Vitest** — runner compatível com Next.js 16 + React 19 + ES modules
- **@testing-library/react** + **@testing-library/user-event** — testes de componentes
- **@testing-library/jest-dom** — matchers semânticos
- **jsdom** — ambiente DOM

### Arquivos de configuração
- `vitest.config.ts` — configura jsdom, setup file, aliases `@/`
- `src/test/setup.ts` — importa `@testing-library/jest-dom`
- `package.json` — adiciona script `"test": "vitest"`

---

## 3. Testes a Escrever

### Unitários (sem mocks)
- `src/lib/parsers/csv-parser.test.ts` — parse válido, vazio, campos faltando
- `src/types/index.test.ts` — `getCategoryLabel()` com categorias válidas e inválidas

### Integração de componentes
- `src/app/(app)/onboarding/onboarding-flow.test.tsx` — renderiza passos, submit com campos vazios não dispara action, exibe erro
- `src/components/transactions/transaction-form.test.tsx` — campos renderizam, validação client-side
- `src/components/chat/chat-fab.test.tsx` — renderiza FAB, abre/fecha chat

### Server Actions (mock do Supabase client)
- `src/app/(app)/onboarding/actions.test.ts` — `createFamilyGroup` retorna erro sem auth, retorna `{ success: true }` no caminho feliz

---

## 4. Verificação Final

1. `npm run test` — todos os testes passam
2. `npm run build` — zero erros (lint + type-check + build)
3. `npm run dev` — app abre no browser sem erros no terminal

---

## Critérios de Sucesso

- Zero erros de ESLint no `npm run build`
- `npm run test` com todos os testes verdes
- `npm run dev` funcional no browser
