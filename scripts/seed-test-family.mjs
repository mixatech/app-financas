/**
 * Seed de ambiente de teste:
 *   1. Garante que dev@mixatech.com tem plano 'family' ativo (sem pagar)
 *   2. Cria família "Família Mixatech" com 3 membros fictícios
 *   3. Insere ~3 meses de transações realistas distribuídas pelos membros
 *
 * Uso: node scripts/seed-test-family.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ── Carrega .env.local ────────────────────────────────────────────────────────
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envRaw = readFileSync(join(root, '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados em .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEV_EMAIL = 'dev@mixatech.com'

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomDate(year, month) {
  const day = Math.floor(Math.random() * 28) + 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

async function upsertUser(email, name) {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = list?.users?.find(u => u.email === email)
  if (existing) {
    console.log(`  ↩  Usuário ${email} já existe (${existing.id})`)
    return existing.id
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'Senha@123!',
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (error) throw new Error(`Criar usuário ${email}: ${error.message}`)
  console.log(`  ✅ Usuário ${email} criado (${data.user.id})`)
  return data.user.id
}

async function upsertSubscription(userId, plan = 'family') {
  const { error } = await admin.from('subscriptions').upsert({
    user_id: userId,
    plan,
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date('2027-01-01').toISOString(),
    stripe_customer_id: null,
    stripe_subscription_id: null,
  }, { onConflict: 'user_id' })
  if (error) throw new Error(`Upsert subscription: ${error.message}`)
  console.log(`  ✅ Plano ${plan} ativo para ${userId}`)
}

// ── Script principal ──────────────────────────────────────────────────────────

console.log('\n🌱 Iniciando seed de ambiente de teste...\n')

// 1. Garantir dev@mixatech.com com plano family ativo
console.log('1. Configurando dev@mixatech.com...')
const devId = await upsertUser(DEV_EMAIL, 'Dev Mixatech')
await upsertSubscription(devId, 'family')

// 2. Criar membros fictícios da família
console.log('\n2. Criando usuários fictícios...')
const anaId    = await upsertUser('ana.familiar.teste@finxa-test.local',    'Ana Silva')
const carlosId = await upsertUser('carlos.familiar.teste@finxa-test.local', 'Carlos Souza')

// 3. Verificar/criar grupo familiar
console.log('\n3. Configurando grupo familiar...')

const { data: existingGroups } = await admin
  .from('family_groups')
  .select('id, name')
  .eq('created_by', devId)

let familyId
if (existingGroups && existingGroups.length > 0) {
  familyId = existingGroups[0].id
  console.log(`  ↩  Grupo já existe: "${existingGroups[0].name}" (${familyId})`)
} else {
  const { data: group, error } = await admin
    .from('family_groups')
    .insert({ name: 'Família Mixatech', created_by: devId })
    .select()
    .single()
  if (error) throw new Error(`Criar família: ${error.message}`)
  familyId = group.id
  console.log(`  ✅ Grupo criado: ${familyId}`)
}

// 4. Inserir membros no grupo
console.log('\n4. Inserindo membros no grupo...')

const membersPayload = [
  { family_id: familyId, user_id: devId,    display_name: 'Mylena (Admin)', role: 'admin',  color: '#7B2FBE' },
  { family_id: familyId, user_id: anaId,    display_name: 'Ana',            role: 'member', color: '#2D8EFF' },
  { family_id: familyId, user_id: carlosId, display_name: 'Carlos',         role: 'member', color: '#f97316' },
]

const { data: members, error: membersError } = await admin
  .from('family_members')
  .upsert(membersPayload, { onConflict: 'family_id,user_id' })
  .select()

if (membersError) throw new Error(`Inserir membros: ${membersError.message}`)
const memberMap = Object.fromEntries(members.map(m => [m.user_id, m]))
console.log(`  ✅ ${members.length} membros configurados`)

// 5. Criar cartões (apaga e recria para evitar duplicatas)
console.log('\n5. Criando cartões...')

await admin.from('cards').delete().eq('family_id', familyId)

const cardsPayload = [
  { family_id: familyId, member_id: memberMap[devId].id,    name: 'Nubank Roxo',   type: 'credit', last_digits: '4521', color: '#7B2FBE', bank: 'Nubank'   },
  { family_id: familyId, member_id: memberMap[devId].id,    name: 'Inter Débito',  type: 'debit',  last_digits: '8832', color: '#FF8700', bank: 'Inter'    },
  { family_id: familyId, member_id: memberMap[anaId].id,    name: 'Itaú Crédito',  type: 'credit', last_digits: '1290', color: '#EC7000', bank: 'Itaú'     },
  { family_id: familyId, member_id: memberMap[carlosId].id, name: 'Bradesco Visa', type: 'credit', last_digits: '6677', color: '#CC092F', bank: 'Bradesco' },
  { family_id: familyId, member_id: memberMap[carlosId].id, name: 'Carteira',      type: 'cash',   last_digits: null,   color: '#14b8a6', bank: null       },
]

const { data: cards, error: cardsError } = await admin
  .from('cards')
  .insert(cardsPayload)
  .select()

if (cardsError) throw new Error(`Inserir cartões: ${cardsError.message}`)

const cardByMember = {}
for (const c of cards) {
  if (!cardByMember[c.member_id]) cardByMember[c.member_id] = c
}
console.log(`  ✅ ${cards.length} cartões criados`)

// 6. Gerar transações (fev, mar, abr 2026)
console.log('\n6. Gerando transações (fev–abr 2026)...')

const MONTHS = [[2026, 2], [2026, 3], [2026, 4]]

const INCOME_DEV = [
  { amount: 8500, description: 'Salário',          category: 'salary'    },
  { amount: 1200, description: 'Freelance design', category: 'freelance' },
  { amount:  950, description: 'Aluguel recebido', category: 'rental'    },
]
const INCOME_ANA    = [{ amount: 4200, description: 'Salário Ana',    category: 'salary' }]
const INCOME_CARLOS = [{ amount: 3800, description: 'Salário Carlos', category: 'salary' }]

const EXPENSES = [
  { amount: 2800, description: 'Aluguel',           category: 'housing'       },
  { amount:  320, description: 'Mercado',            category: 'food'          },
  { amount:  180, description: 'Mercado Semanal',    category: 'food'          },
  { amount:   95, description: 'iFood',              category: 'restaurant'    },
  { amount:   65, description: 'Uber Eats',          category: 'restaurant'    },
  { amount:  150, description: 'Gasolina',           category: 'transport'     },
  { amount:   80, description: 'Uber',               category: 'transport'     },
  { amount:  210, description: 'Plano de saúde',     category: 'health'        },
  { amount:   75, description: 'Farmácia',           category: 'health'        },
  { amount:   45, description: 'Netflix',            category: 'subscriptions' },
  { amount:   35, description: 'Spotify',            category: 'subscriptions' },
  { amount:   55, description: 'Amazon Prime',       category: 'subscriptions' },
  { amount:  380, description: 'Conta de luz',       category: 'housing'       },
  { amount:  120, description: 'Internet',           category: 'subscriptions' },
  { amount:  250, description: 'Roupas',             category: 'clothing'      },
  { amount:   85, description: 'Salão / Barbearia',  category: 'beauty'        },
  { amount:  420, description: 'Curso online',       category: 'education'     },
  { amount:  160, description: 'Cinema / Lazer',     category: 'entertainment' },
  { amount:  200, description: 'Pet shop',           category: 'pets'          },
  { amount:  600, description: 'Passagem aérea',     category: 'travel'        },
]

const memberUsers = [
  { memberId: memberMap[devId].id,    userId: devId,    incomes: INCOME_DEV    },
  { memberId: memberMap[anaId].id,    userId: anaId,    incomes: INCOME_ANA    },
  { memberId: memberMap[carlosId].id, userId: carlosId, incomes: INCOME_CARLOS },
]

const transactions = []

for (const [year, month] of MONTHS) {
  for (const mu of memberUsers) {
    // Receita do mês (dia 5)
    for (const tmpl of mu.incomes) {
      const jitter = 1 + (Math.random() * 0.06 - 0.03)
      transactions.push({
        user_id: devId,
        type: 'income',
        amount: Math.round(tmpl.amount * jitter * 100) / 100,
        description: tmpl.description,
        category: tmpl.category,
        date: `${year}-${String(month).padStart(2, '0')}-05`,
        family_id: familyId,
        paid_by_member_id: mu.memberId,
        spent_by_member_id: mu.memberId,
        source: 'manual',
      })
    }

    // 7 despesas aleatórias por membro por mês
    const shuffled = [...EXPENSES].sort(() => Math.random() - 0.5).slice(0, 7)
    for (const tmpl of shuffled) {
      const jitter = 1 + (Math.random() * 0.2 - 0.1)
      transactions.push({
        user_id: devId,
        type: 'expense',
        amount: Math.round(tmpl.amount * jitter * 100) / 100,
        description: tmpl.description,
        category: tmpl.category,
        date: randomDate(year, month),
        family_id: familyId,
        paid_by_member_id: mu.memberId,
        spent_by_member_id: mu.memberId,
        card_id: cardByMember[mu.memberId]?.id ?? null,
        source: 'manual',
      })
    }
  }
}

// Apaga transações antigas do grupo e insere novas em lotes
await admin.from('transactions').delete().eq('family_id', familyId)

const BATCH = 50
for (let i = 0; i < transactions.length; i += BATCH) {
  const { error } = await admin.from('transactions').insert(transactions.slice(i, i + BATCH))
  if (error) throw new Error(`Inserir transações (batch ${i}): ${error.message}`)
}
console.log(`  ✅ ${transactions.length} transações inseridas`)

// 7. Resumo
console.log('\n════════════════════════════════════════')
console.log('✅ Seed concluído!\n')
console.log(`Conta principal: ${DEV_EMAIL}`)
console.log('Plano: Family (ativo até 01/01/2027)')
console.log('\nFamília "Família Mixatech":')
console.log('  • Mylena (Admin) — dev@mixatech.com        [sua senha atual]')
console.log('  • Ana            — ana.familiar.teste@finxa-test.local  [Senha@123!]')
console.log('  • Carlos         — carlos.familiar.teste@finxa-test.local [Senha@123!]')
console.log('\nDados: fev, mar e abr de 2026')
console.log('════════════════════════════════════════\n')
