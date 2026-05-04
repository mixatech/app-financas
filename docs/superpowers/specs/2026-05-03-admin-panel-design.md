# Admin Panel — Design Spec

**Data:** 2026-05-03  
**Branch:** feature/saas-billing  
**Autor:** dev@mixatech.com

---

## Visão geral

Painel administrativo de plataforma para o FinançasPRO. Separado conceitualmente do "admin de família" (papel já existente dentro dos grupos de família), este painel dá ao dono da plataforma (`dev@mixatech.com` e futuros admins de plataforma) visibilidade e controle sobre todos os usuários, feedbacks, métricas e comunicações.

**Abordagem escolhida:** tudo custom na mesma stack (Next.js + Supabase), sem serviços externos adicionais.

---

## Subsistemas (em ordem de implementação)

1. Identidade de admin de plataforma
2. Feedback & Bug Reports
3. Analytics de plataforma
4. CRM (gestão de usuários)
5. Campanhas (email + notificação no app)

---

## 1. Identidade de Admin de Plataforma

### Conceito

Uma tabela `platform_admins` separa o conceito de "admin da plataforma" do "admin de família". Múltiplos admins de plataforma são suportados (adicionados pelo próprio painel, aba Config Admin).

### Schema

```sql
CREATE TABLE platform_admins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER usada nas policies das outras tabelas
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT is_platform_admin();
$$;
```

O primeiro admin (`dev@mixatech.com`) é inserido manualmente via SQL após o deploy.

> **Nota:** todas as policies que verificam admin de plataforma devem chamar `is_platform_admin()` — não `EXISTS (SELECT 1 FROM platform_admins...)` diretamente, pois a tabela não tem policy SELECT para usuários comuns.

### Proteção de rota

O middleware existente (`src/lib/supabase/middleware.ts`) recebe uma extensão: rotas que começam com `/admin` consultam `platform_admins` via `createAdminClient()`. Se o usuário autenticado não constar na tabela, é redirecionado para `/dashboard`.

---

## 2. Estrutura de Rotas do Painel Admin

```
src/app/
  admin/
    layout.tsx          ← layout com sidebar vertical (dark)
    page.tsx            ← redireciona para /admin/dashboard
    dashboard/
      page.tsx          ← analytics ao vivo
    feedback/
      page.tsx          ← inbox de feedback & bugs
    users/
      page.tsx          ← lista CRM
      [id]/
        page.tsx        ← perfil do usuário
    campaigns/
      page.tsx          ← lista + criação de campanhas
    settings/
      page.tsx          ← gerenciar admins de plataforma
```

### Sidebar (layout.tsx)

Navegação vertical dark com itens:
- 📊 Dashboard
- 🐛 Feedback & Bugs (badge com contagem de bugs abertos)
- 👥 Usuários
- 📢 Campanhas
- ⚙️ Config Admin

---

## 3. Feedback & Bug Reports

### Lado do usuário

Botão **"💬 Feedback"** sempre visível no header do app (todas as páginas da rota `(app)`).

Ao clicar, abre um drawer/modal com:
- **Tipo:** Bug | Sugestão | Dúvida (seleção obrigatória)
- **Mensagem:** campo de texto livre
- **Rota atual:** capturada automaticamente com `window.location.pathname` (ajuda a reproduzir o problema)

### Lado do admin (`/admin/feedback`)

- Lista de feedbacks em tempo real via Supabase Realtime
- Filtros: Bugs / Sugestões / Dúvidas / Resolvidos
- Cada item exibe: tipo, mensagem, rota onde foi enviado, email do usuário, plano, tempo decorrido
- Ações por item: **Resolver** (muda status) e **Nota interna** (campo só visível para admins)

### Schema

```sql
CREATE TABLE feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('bug', 'suggestion', 'question')),
  message     text NOT NULL,
  current_url text,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  admin_note  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own feedback"
  ON feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "platform admins manage feedback"
  ON feedback FOR ALL TO authenticated
  USING (is_platform_admin());
```

---

## 4. Analytics de Plataforma (`/admin/dashboard`)

Dados lidos das tabelas existentes — sem coleta nova. Atualização em tempo real via Supabase Realtime nos canais relevantes.

### Métricas exibidas

| Métrica | Fonte |
|---|---|
| Total de usuários | `auth.users` |
| Novos hoje | `auth.users.created_at` |
| Ativos nos últimos 30 dias | `auth.users.last_sign_in_at` |
| MRR | `profiles.plan` × preços configurados |
| Distribuição de planos (Free/Pro/Família) | `profiles.plan` |
| Trials ativos | `profiles.trial_ends_at > now()` |
| Cancelamentos do mês | `profiles` onde plano mudou para free |
| Bugs abertos | `feedback` onde `status = 'open' AND type = 'bug'` |
| Logins recentes (ao vivo) | Supabase Realtime no canal `auth` |
| Uso de IA / PDF / transações | `profiles.ai_chats_used`, `family_members`, `transactions` |

### Realtime

```typescript
supabase
  .channel('admin-realtime')
  .on('postgres_changes', { event: 'UPDATE', schema: 'auth', table: 'users' }, handler)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, handler)
  .subscribe()
```

---

## 5. CRM — Gestão de Usuários (`/admin/users`)

### Lista

- Busca por email
- Filtro por plano (Free / Pro / Família) e por atividade (ativo / inativo há +30 dias)
- Paginação simples (50 por página)

### Perfil (`/admin/users/[id]`)

Dados agregados de um usuário:
- Email, data de cadastro
- Plano atual, último login
- Família (nome do grupo + papel: admin ou membro)
- Uso de funcionalidades no mês: chats IA, importações PDF
- Feedbacks que enviou (link para `/admin/feedback` filtrado)
- **Nota interna** (só admin vê, persistida em `crm_notes`)
- Ações: **Enviar mensagem** (abre criação de campanha para esse usuário) | **Mudar plano** (override manual)

### Schema

```sql
CREATE TABLE crm_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note       text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE(user_id)
);

ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform admins manage crm_notes"
  ON crm_notes FOR ALL TO authenticated
  USING (is_platform_admin());
```

---

## 6. Campanhas (`/admin/campaigns`)

### Criação

Formulário com:
- **Título / Assunto** — usado como subject do email
- **Mensagem** — texto da campanha
- **Público-alvo:** Todos | Apenas Free | Apenas pagantes (Pro + Família) | Inativos há +30 dias
- **Canal:** Email (via Resend) | Notificação no app | Ambos
- Botão mostra contagem de destinatários antes de confirmar envio

### Email (Resend)

API Route `POST /api/admin/campaigns/send` chama Resend em batch para a lista de destinatários filtrada. Usa template HTML simples com o conteúdo da campanha.

### Notificação no app

Registros inseridos em `notifications` para cada destinatário. O app lê notificações não lidas na montagem do layout `(app)` e exibe um banner dispensável no topo do dashboard.

### Histórico

Lista de campanhas enviadas com: título, data, total de destinatários, taxa de abertura de email (via webhook do Resend), contagem de notificações vistas (marcadas como lidas).

### Schema

```sql
CREATE TABLE campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  message         text NOT NULL,
  target          text NOT NULL CHECK (target IN ('all', 'free', 'paid', 'inactive')),
  channels        text[] NOT NULL,
  recipient_count int NOT NULL DEFAULT 0,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  sent_by         uuid NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  title       text NOT NULL,
  message     text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform admins manage campaigns"
  ON campaigns FOR ALL TO authenticated
  USING (is_platform_admin());

CREATE POLICY "users read own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "platform admins insert notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (is_platform_admin());
```

---

## Resumo de tabelas novas

| Tabela | Propósito |
|---|---|
| `platform_admins` | Identidade de admin de plataforma |
| `feedback` | Relatos de bugs e sugestões dos usuários |
| `crm_notes` | Notas internas por usuário (só admin vê) |
| `campaigns` | Histórico de campanhas enviadas |
| `notifications` | Notificações in-app por usuário |

---

## Fluxo de dados em tempo real

```
Supabase Realtime
  ├── INSERT em feedback → atualiza badge na sidebar + inbox do admin
  ├── UPDATE em auth.users (last_sign_in_at) → atualiza lista de logins recentes
  └── INSERT em notifications → dispara banner no app do usuário
```

---

## Fora do escopo desta spec

- Gráficos históricos de crescimento (curva de usuários ao longo do tempo)
- Integração com analytics externo (PostHog, Mixpanel)
- Sistema de permissões granulares para admins de plataforma
- Template de email visual (HTML rico) para campanhas
