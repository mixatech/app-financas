# Design: Split de Gastos, Análises, Configurações e Layout

**Data:** 2026-04-29
**Branch:** feature/saas-billing
**Status:** Aprovado pela usuária

---

## 1. Contexto e objetivo

O app Finxa já suporta transações pessoais e familiares básicas. O objetivo deste ciclo é:

1. Permitir classificar cada transação por **escopo** (pessoal, casal, família, para um membro)
2. Calcular e exibir **saldo corrido entre pares** de membros ("Amanda te deve R$340")
3. Criar uma **página de Análises** com insights automáticos
4. Criar uma **página de Configurações** com categorias, cartões, ratios de divisão e permissões por membro
5. Melhorar o **layout** mantendo a paleta violet/purple já definida

O perfil de referência para testes é `teste@finxa...` (dados fictícios já existentes).

---

## 2. Modelo de dados

### 2.1 Alterações em `transactions`

```sql
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS scope text
    CHECK (scope IN ('personal','couple','family','for_member'))
    DEFAULT 'personal' NOT NULL,
  ADD COLUMN IF NOT EXISTS beneficiary_id uuid
    REFERENCES family_members(id) ON DELETE SET NULL;
```

- `scope = 'personal'` → comportamento atual, nenhum split
- `scope = 'couple'` → divide entre payer e o par configurado (ratio de `member_split_ratios`)
- `scope = 'family'` → divide igualmente entre todos os membros ativos da família
- `scope = 'for_member'` → `beneficiary_id` deve o valor inteiro ao payer

Transações antigas recebem `'personal'` pelo default — sem quebra de dados existentes.

### 2.2 Nova tabela `member_split_ratios`

```sql
CREATE TABLE member_split_ratios (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id   uuid REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  member_a_id uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  member_b_id uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  ratio_a     numeric(5,4) DEFAULT 0.5 NOT NULL,
  ratio_b     numeric(5,4) DEFAULT 0.5 NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (family_id, member_a_id, member_b_id),
  CHECK (ratio_a + ratio_b = 1)
);
```

Criado automaticamente com 50/50 quando dois membros entram no mesmo grupo. Editável nas Configurações.

### 2.3 Nova tabela `settlements`

```sql
CREATE TABLE settlements (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id       uuid REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  from_member_id  uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  to_member_id    uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  amount          numeric(12,2) NOT NULL CHECK (amount > 0),
  note            text,
  settled_at      timestamptz DEFAULT now() NOT NULL,
  created_at      timestamptz DEFAULT now() NOT NULL
);
```

### 2.4 Alteração em `family_members`

```sql
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS visibility_scope text
    CHECK (visibility_scope IN ('own','couple','family','all'))
    DEFAULT 'family' NOT NULL;
```

Controla o que cada membro pode ver. Admin sempre vê tudo independente deste campo.

### 2.5 Nova tabela `custom_categories`

```sql
CREATE TABLE custom_categories (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id   uuid REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  type        text CHECK (type IN ('income','expense')) NOT NULL,
  color       text DEFAULT '#7B2FBE' NOT NULL,
  emoji       text DEFAULT '📦' NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);
```

---

## 3. Cálculo de saldo entre pares

Para o par (A, B), o saldo que B deve para A é:

```
saldo_B→A =
  + Σ transações pagas por A com scope='couple' × ratio_B
  + Σ transações pagas por A com scope='for_member' onde beneficiary=B (valor total)
  - Σ transações pagas por B com scope='couple' × ratio_A
  - Σ transações pagas por B com scope='for_member' onde beneficiary=A
  - Σ settlements de B → A
  + Σ settlements de A → B
```

Para `scope='family'`: divide o valor por `count(membros ativos)`. Cada membro que não pagou deve sua parte ao payer.

Implementado como Server Action no Next.js, chamada no carregamento da página Família.

---

## 4. Formulário de transação (mudanças)

Campo novo **"Para quem é?"** logo após o valor:

| Opção | Quando mostrar | scope resultante |
|-------|---------------|-----------------|
| Só minha | sempre | `personal` |
| Casal com [nome] | se família tem >1 membro; sub-seletor do membro parceiro | `couple` |
| Família | se família com >1 membro | `family` |
| Para [nome] | lista dos outros membros | `for_member` + `beneficiary_id` |

Campo não aparece para usuários sem família (100% retrocompatível).

---

## 5. Página de Família (refatoração)

Remove seção de cartões (migra para Configurações). Adiciona aba **"Saldos"**:

- Card por par de membros com saldo não-zero
- Exibe: "Amanda te deve R$ 340,00" ou "Você deve R$ 120,00 para Carlos"
- Botão **[Quitar]** → modal com valor (pré-preenchido, editável para quitações parciais), nota opcional
- Histórico de liquidações colapsável abaixo de cada card
- Filtro de período: este mês / últimos 3m / tudo

Tags de escopo na lista de transações:
- `casal` → badge azul `#2D8EFF`
- `família` → badge verde `#10b981`
- `p/ [nome]` → badge laranja `#f97316`
- `pessoal` → sem badge (comportamento atual)

---

## 6. Página de Análises (`/analytics`)

**Filtros:** período (este mês / 3m / 6m / 1 ano / personalizado) + toggle pessoal/família + filtro por membro (visível só para admin).

**Blocos:**

1. **Visão geral** — receita, despesa, economia + delta vs. mês anterior em %
2. **Evolução mensal** — gráfico de barras empilhadas (recharts), receita vs. despesa por mês
3. **Breakdown por categoria** — rosca + ranking com valor e %; clicável para ver transações do período/categoria
4. **Por membro** *(modo família)* — barra horizontal por membro: gasto total e receita total
5. **Insights automáticos** — cards de texto gerados server-side:
   - Maior categoria de gasto do período
   - Comparativo com mês anterior (economia ou excesso em R$ e %)
   - Categoria com maior crescimento nos últimos 3 meses
   - Membro sem lançamentos no mês *(família)*
   - Taxa de economia: `(receita − despesa) / receita × 100`

Todos os insights são lógica determinística no servidor — sem IA.

---

## 7. Página de Configurações (`/settings`)

Navegação em abas laterais (desktop) ou accordion (mobile):

### Aba: Categorias
- Categorias padrão listadas como read-only com badge "padrão"
- Categorias personalizadas: criar (nome, tipo, cor, emoji), editar, excluir
- Escopadas por família

### Aba: Cartões
- Gerenciamento centralizado (sai da página Família)
- Criar, editar cor/banco/dígitos, excluir

### Aba: Divisão de gastos
- Por par de membros: dois campos numéricos (%) que somam 100
- Admin vê todos os pares; membros veem só os pares que os envolvem

### Aba: Membros e Permissões *(só admin)*
- Tabela: membro + seletor `visibility_scope`
  - **Só as minhas** (`own`)
  - **Minhas + casal** (`couple`)
  - **Família** (`family`)
  - **Tudo** (`all`)
- Admin sempre `all`, não editável

### Aba: Conta
- Nome editável, email read-only, trocar senha, excluir conta

---

## 8. Melhorias de layout

**Navbar:** Dashboard · Transações · Análises · Família · Configurações

**Dashboard:** grid 3 colunas desktop (gráfico rosca · transações recentes · breakdown membros)

**Transações:** tag de escopo inline na lista; filtro por escopo no topo

**Família:** foco em membros + saldos; cartões removidos para Configurações

**Paleta consistente:**
- Botões primários: `bg-[#7B2FBE]` hover `bg-[#6B28A8]`
- Focus rings: `focus:ring-[#7B2FBE]`
- Links ativos navbar: `text-[#7B2FBE]` com underline ou indicador lateral

---

## 9. Ordem de implementação

1. Migrations SQL (5 alterações de schema)
2. Formulário de transação — campo de escopo
3. Cálculo de saldo + aba Saldos na página Família
4. Página de Configurações (abas na ordem: categorias, cartões, divisão, permissões, conta)
5. Página de Análises
6. Melhorias de layout e navbar
7. Aplicar `visibility_scope` nas queries de listagem

---

## 10. Fora do escopo desta iteração

- Notificações push/email quando dívida é quitada
- Split assimétrico por transação individual
- Exportação PDF/CSV
- Integração bancária automática
