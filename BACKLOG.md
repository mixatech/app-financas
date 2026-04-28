# Finxa — Backlog de Atividades

> Arquivo vivo: adicione, priorize e risque itens conforme avançamos.

---

## 🔴 Bloqueadores (antes de abrir para usuários)

- [ ] **Aplicar migrations no Supabase** — rodar `supabase-schema-v3.sql` e `supabase-schema-v3-rpc.sql` no SQL Editor do Supabase Dashboard. Cria as tabelas `subscriptions` e `usage`.
- [ ] **Configurar webhook no Stripe Dashboard (produção)** — após deploy no Vercel, adicionar `https://<app>.vercel.app/api/stripe/webhook` em Developers → Webhooks com os eventos: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.
- [ ] **Reprocessar pagamento já feito** — o primeiro pagamento (cartão real) não foi registrado. Após as migrations, ir no Stripe Dashboard → Developers → Webhooks → Recent deliveries → Resend do `checkout.session.completed`, ou inserir manualmente em `subscriptions`.
- [ ] **Deploy no Vercel** — conectar repo GitHub, configurar todas as env vars, definir `NEXT_PUBLIC_APP_URL` com a URL de produção.
- [ ] **Merge do PR #1** — `feature/saas-billing` → `master` após billing estar funcionando em produção.

---

## 🟡 Próximas sprints

### Billing & Planos
- [ ] Stripe Customer Portal — página de autoatendimento para cancelar/trocar plano
- [ ] Email de boas-vindas após assinatura
- [ ] Webhook `customer.subscription.trial_will_end` → notificar usuário 3 dias antes do trial acabar
- [ ] Testar fluxo completo: trial → cobrança no mês 2

### Produto — IA
- [ ] **Memória de contexto** — chat IA hoje sem memória entre sessões; persistir histórico no Supabase
- [ ] **Sugestões proativas** — "Você gastou 40% a mais em restaurantes esse mês"
- [ ] **Categorização automática na importação** — Claude sugere categoria antes de salvar cada transação
- [ ] **Relatório mensal por IA** — resumo narrativo do mês gerado pelo Claude

### Produto — UX
- [ ] Modo escuro — toggle light/dark persistido
- [ ] Mobile responsivo — revisar todas as páginas em viewport mobile
- [ ] Onboarding com tour guiado — highlight de features na primeira entrada
- [ ] Empty states — ilustrações quando dashboard está vazio (novo usuário)
- [ ] Loading skeletons — substituir telas em branco durante carregamento

### Produto — Transações
- [ ] Transações recorrentes — marcar e gerar automaticamente todo mês
- [ ] Filtros avançados — por categoria, membro, período customizado
- [ ] Exportação CSV das transações
- [ ] Bulk edit — editar categoria de múltiplas transações de uma vez

### Produto — Família
- [ ] Convite por email automático — hoje o convite é link manual
- [ ] Limites de orçamento por membro — admin define teto mensal
- [ ] Dashboard familiar com gráfico comparativo entre membros

### Qualidade & Infra
- [ ] Domínio customizado (ex: finxa.com.br)
- [ ] Testes E2E — fluxo de checkout (mock Stripe), login, adicionar transação
- [ ] Error boundaries — fallback amigável em caso de erro de página

---

## ✅ Concluído

- [x] Integração Stripe — checkout, webhook, 3 planos (Free/Pro/Family)
- [x] Plan gate — bloqueia features de IA por plano e cota mensal (HTTP 402)
- [x] UpgradeModal — aparece em respostas 402
- [x] PlanBadge na navbar — mostra plano atual e uso de IA restante
- [x] Página de billing settings (`/settings/billing`)
- [x] Pricing page Fintech Bold (`/pricing`)
- [x] Redesign Fintech Bold — dashboard header, auth pages split-panel
- [x] Rebrand completo para Finxa
