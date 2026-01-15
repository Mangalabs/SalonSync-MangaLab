# Plano de Testes - Implementações Janeiro 2026

## Data: 14/01/2026

## Branch: junção-produtos-comandas-horario-funcionamento

---

## 1. BLOQUEIO DE AGENDA

### 1.1 Criação de Bloqueios

- [ ] **Teste 1.1.1**: Acessar "Meu Painel" como profissional
- [ ] **Teste 1.1.2**: Clicar em "Novo" no card de Bloqueios de Agenda
- [ ] **Teste 1.1.3**: Criar bloqueio usando atalho rápido "Almoço (12:00-13:00)"
  - Verificar se horários são preenchidos automaticamente
- [ ] **Teste 1.1.4**: Criar bloqueio manual (ex: 14:00-16:00)
  - Selecionar data futura
  - Adicionar motivo (opcional)
  - Salvar
- [ ] **Teste 1.1.5**: Verificar se bloqueio aparece na lista por data

### 1.2 Validações de Bloqueios

- [ ] **Teste 1.2.1**: Tentar criar bloqueio com horário início >= fim
  - Deve mostrar erro de validação
- [ ] **Teste 1.2.2**: Criar dois bloqueios no mesmo dia
  - Ambos devem aparecer agrupados por data

### 1.3 Integração com Agendamentos

- [ ] **Teste 1.3.1**: Criar bloqueio para amanhã 14:00-18:00
- [ ] **Teste 1.3.2**: Ir para tela de "Agendamentos"
- [ ] **Teste 1.3.3**: Selecionar o profissional que bloqueou
- [ ] **Teste 1.3.4**: Selecionar a data bloqueada
- [ ] **Teste 1.3.5**: Verificar se horários 14:00 até 17:50 NÃO aparecem disponíveis
- [ ] **Teste 1.3.6**: Horários antes de 14:00 e depois de 18:00 devem estar disponíveis

### 1.4 Exclusão de Bloqueios

- [ ] **Teste 1.4.1**: Voltar ao "Meu Painel"
- [ ] **Teste 1.4.2**: Clicar no ícone de lixeira em um bloqueio
- [ ] **Teste 1.4.3**: Confirmar exclusão
- [ ] **Teste 1.4.4**: Verificar se bloqueio foi removido
- [ ] **Teste 1.4.5**: Verificar se horários voltaram a ficar disponíveis

---

## 2. HISTÓRICO DE ATENDIMENTOS

### 2.1 Filtro de Status

- [ ] **Teste 2.1.1**: Acessar "Histórico" ou aba de histórico
- [ ] **Teste 2.1.2**: Verificar que APENAS atendimentos COMPLETED aparecem
- [ ] **Teste 2.1.3**: Comandas IN_PROGRESS NÃO devem aparecer no histórico
- [ ] **Teste 2.1.4**: Agendamentos PENDING/CONFIRMED NÃO devem aparecer

### 2.2 Comandas e Histórico

- [ ] **Teste 2.2.1**: Abrir uma nova comanda (atendimento imediato)
- [ ] **Teste 2.2.2**: Verificar se a comanda NÃO aparece no histórico
- [ ] **Teste 2.2.3**: A comanda deve aparecer apenas na fila/comandas ativas
- [ ] **Teste 2.2.4**: Fazer checkout da comanda
- [ ] **Teste 2.2.5**: Após finalizar, verificar se aparece no histórico
- [ ] **Teste 2.2.6**: Status deve ser COMPLETED

### 2.3 Horários no Histórico

- [ ] **Teste 2.3.1**: Verificar se datas/horários estão corretos
- [ ] **Teste 2.3.2**: Criar atendimento às 22:00
- [ ] **Teste 2.3.3**: Finalizar e verificar se aparece como 22:00 (não 01:00 do dia seguinte)

---

## 3. COMISSÕES (MEU PAINEL)

### 3.1 Carregamento de Dados

- [ ] **Teste 3.1.1**: Acessar "Meu Painel" como profissional
- [ ] **Teste 3.1.2**: Verificar se comissão total está carregando
- [ ] **Teste 3.1.3**: Verificar se comissão de serviços está separada
- [ ] **Teste 3.1.4**: Verificar se comissão de produtos está separada

### 3.2 Filtros de Período

- [ ] **Teste 3.2.1**: Clicar em "Período" no card de comissões
- [ ] **Teste 3.2.2**: Selecionar "Últimos 7 dias"
  - Aplicar filtro
  - Verificar se valores mudam
- [ ] **Teste 3.2.3**: Selecionar "Este mês"
  - Verificar se mostra do dia 1 até hoje
- [ ] **Teste 3.2.4**: Selecionar "Últimos 3 meses"
  - Verificar cálculo de 90 dias
- [ ] **Teste 3.2.5**: Selecionar "Este ano"
  - Verificar se mostra de 01/01 até hoje
- [ ] **Teste 3.2.6**: Selecionar "Todo período"
  - Verificar se mostra todos os atendimentos históricos
- [ ] **Teste 3.2.7**: Selecionar "Período customizado"
  - Definir data início: 01/12/2025
  - Definir data fim: 31/12/2025
  - Aplicar e verificar valores

### 3.3 Métricas de Performance

- [ ] **Teste 3.3.1**: Verificar card de "Performance"
- [ ] **Teste 3.3.2**: Número de atendimentos deve contar apenas COMPLETED
- [ ] **Teste 3.3.3**: Criar 3 atendimentos e finalizar
- [ ] **Teste 3.3.4**: Verificar se contador aumenta corretamente
- [ ] **Teste 3.3.5**: Ticket Médio = Comissão Total / Número de Atendimentos
  - Validar cálculo manual

### 3.4 Atendimentos com Status Diferentes

- [ ] **Teste 3.4.1**: Criar 2 agendamentos futuros (PENDING)
- [ ] **Teste 3.4.2**: Criar 1 comanda aberta (IN_PROGRESS)
- [ ] **Teste 3.4.3**: Finalizar 2 atendimentos (COMPLETED)
- [ ] **Teste 3.4.4**: Verificar se painel mostra apenas os 2 COMPLETED
- [ ] **Teste 3.4.5**: Os outros status NÃO devem afetar comissões

---

## 4. SLOTS VAZIOS CLICÁVEIS

### 4.1 Quadro de Agenda

- [ ] **Teste 4.1.1**: Acessar "Agendamentos"
- [ ] **Teste 4.1.2**: Selecionar data futura
- [ ] **Teste 4.1.3**: Visualizar grade de horários

### 4.2 Clique em Slot Vazio

- [ ] **Teste 4.2.1**: Clicar em um slot vazio (ex: 15:00 de um profissional)
- [ ] **Teste 4.2.2**: Deve abrir modal de "Novo Agendamento"
- [ ] **Teste 4.2.3**: Campo "Data" deve vir preenchido
- [ ] **Teste 4.2.4**: Campo "Horário" deve vir preenchido (15:00)
- [ ] **Teste 4.2.5**: Campo "Profissional" deve vir preenchido
- [ ] **Teste 4.2.6**: Apenas Cliente e Serviços devem estar vazios

### 4.3 Criação de Agendamento por Slot

- [ ] **Teste 4.3.1**: Com modal aberto pelo slot vazio
- [ ] **Teste 4.3.2**: Selecionar cliente
- [ ] **Teste 4.3.3**: Selecionar serviço
- [ ] **Teste 4.3.4**: Salvar agendamento
- [ ] **Teste 4.3.5**: Verificar se aparece no slot correto da grade
- [ ] **Teste 4.3.6**: Status deve ser PENDING

### 4.4 Slots com Agendamento Existente

- [ ] **Teste 4.4.1**: Clicar em slot que JÁ tem agendamento
- [ ] **Teste 4.4.2**: Não deve abrir modal de novo agendamento
- [ ] **Teste 4.4.3**: Deve abrir detalhes do agendamento existente

### 4.5 Hover nos Slots

- [ ] **Teste 4.5.1**: Passar mouse sobre slot vazio
- [ ] **Teste 4.5.2**: Deve mostrar feedback visual (background azul claro)
- [ ] **Teste 4.5.3**: Cursor deve mudar para pointer

---

## 5. TIMEZONE E DATAS

### 5.1 Criação de Agendamentos

- [ ] **Teste 5.1.1**: Criar agendamento para 14/01/2026 às 15:30
- [ ] **Teste 5.1.2**: Verificar no banco de dados:
  ```sql
  SELECT scheduledAt FROM "Appointment" WHERE id = '<id>';
  ```
- [ ] **Teste 5.1.3**: Deve estar como: `2026-01-14T18:30:00.000Z` (15:30 - 3h)
- [ ] **Teste 5.1.4**: Exibição no frontend deve mostrar 15:30

### 5.2 Criação de Comandas

- [ ] **Teste 5.2.1**: Abrir comanda às 22:00 (horário local)
- [ ] **Teste 5.2.2**: Verificar no banco:
  ```sql
  SELECT scheduledAt, status FROM "Appointment" WHERE status = 'IN_PROGRESS';
  ```
- [ ] **Teste 5.2.3**: Status deve ser IN_PROGRESS
- [ ] **Teste 5.2.4**: scheduledAt deve estar correto (considerar UTC)
- [ ] **Teste 5.2.5**: Exibição deve mostrar 22:00

### 5.3 Horário no Histórico

- [ ] **Teste 5.3.1**: Finalizar comanda criada às 22:00
- [ ] **Teste 5.3.2**: Ir ao histórico
- [ ] **Teste 5.3.3**: Deve aparecer com horário 22:00 (não 01:00 do dia seguinte)

---

## 6. TESTES DE INTEGRAÇÃO

### 6.1 Fluxo Completo: Bloqueio → Agendamento

1. [ ] Profissional bloqueia 15/01/2026 de 14:00-16:00
2. [ ] Admin tenta agendar cliente às 15:00 para esse profissional
3. [ ] Verificar que horário não está disponível
4. [ ] Agendar em horário disponível (ex: 17:00)
5. [ ] Profissional remove bloqueio
6. [ ] Verificar que 15:00 volta a estar disponível

### 6.2 Fluxo Completo: Comanda → Checkout → Comissão

1. [ ] Profissional abre comanda às 10:00
2. [ ] Adiciona serviço de R$ 100,00
3. [ ] Adiciona produto de R$ 50,00
4. [ ] Verifica que não aparece no histórico
5. [ ] Faz checkout com PIX
6. [ ] Verifica que aparece no histórico
7. [ ] Vai ao "Meu Painel"
8. [ ] Verifica comissões:
   - Comissão de serviço calculada corretamente
   - Comissão de produto calculada corretamente
   - Total somado
   - Contador de atendimentos aumentou em 1

### 6.3 Fluxo Completo: Slot Vazio → Agendamento → Bloqueio

1. [ ] Clicar em slot vazio 16/01 às 11:00
2. [ ] Criar agendamento com dados pré-preenchidos
3. [ ] Salvar e verificar na grade
4. [ ] Profissional decide bloquear 11:00-12:00
5. [ ] Sistema deve permitir (agendamento já existe)
6. [ ] Tentar criar NOVO agendamento às 11:30
7. [ ] Deve dar erro de conflito

---

## 7. TESTES DE VALIDAÇÃO E ERROS

### 7.1 Bloqueios

- [ ] **Erro 7.1.1**: Início >= Fim → Mostrar mensagem clara
- [ ] **Erro 7.1.2**: Data no passado → Permitir (histórico) ou bloquear?
- [ ] **Erro 7.1.3**: Sobrepor bloqueios → Permitir múltiplos no mesmo horário

### 7.2 Agendamentos

- [ ] **Erro 7.2.1**: Horário já ocupado → "Já existe agendamento às X com Y"
- [ ] **Erro 7.2.2**: Horário bloqueado → Não deve aparecer para seleção
- [ ] **Erro 7.2.3**: Profissional sem disponibilidade → Mensagem clara

### 7.3 Comissões

- [ ] **Erro 7.3.1**: Período customizado sem datas → Fallback para mês atual
- [ ] **Erro 7.3.2**: Data início > data fim → Validar no frontend
- [ ] **Erro 7.3.3**: Profissional sem atendimentos → Mostrar R$ 0,00

---

## 8. TESTES DE PERFORMANCE

### 8.1 Carregamento

- [ ] **Perf 8.1.1**: Meu Painel com 100+ atendimentos
  - Tempo de carregamento < 2s
- [ ] **Perf 8.1.2**: Histórico com 500+ registros
  - Paginação funcionando
  - Scroll suave
- [ ] **Perf 8.1.3**: Grade de horários com 10 profissionais
  - Renderização < 1s

### 8.2 Filtros

- [ ] **Perf 8.2.1**: Trocar período de comissões
  - Resposta < 1s
- [ ] **Perf 8.2.2**: Filtrar histórico por profissional
  - Instantâneo (frontend)
- [ ] **Perf 8.2.3**: Mudar data na grade de agendamentos
  - Nova requisição < 500ms

---

## 9. TESTES DE RESPONSIVIDADE

### 9.1 Mobile (320px - 768px)

- [ ] **Mobile 9.1.1**: Meu Painel exibe cards empilhados
- [ ] **Mobile 9.1.2**: Bloqueios com layout compacto
- [ ] **Mobile 9.1.3**: Filtros em dialog fullscreen
- [ ] **Mobile 9.1.4**: Grade de horários com scroll horizontal

### 9.2 Tablet (768px - 1024px)

- [ ] **Tablet 9.2.1**: Layout intermediário funcional
- [ ] **Tablet 9.2.2**: Modais com largura adequada

### 9.3 Desktop (1024px+)

- [ ] **Desktop 9.3.1**: Cards lado a lado
- [ ] **Desktop 9.3.2**: Grade completa visível sem scroll

---

## 10. CHECKLIST FINAL

### Antes de Merge/Deploy

- [ ] Todos os console.logs removidos ✅
- [ ] Não há arquivos de teste temporários ✅
- [ ] Código TypeScript sem erros
- [ ] ESLint sem warnings críticos
- [ ] Documentação atualizada (README, etc)
- [ ] Migrations aplicadas e sincronizadas
- [ ] Testes críticos passando (mínimo 80% dos testes acima)

---

## RESULTADO DOS TESTES

### Data de Execução: **/**/\_\_\_\_

### Testador: ******\_\_\_\_******

### Ambiente: [ ] Dev [ ] Staging [ ] Prod

**Resumo:**

- Total de testes: 100+
- Passaram: \_\_\_
- Falharam: \_\_\_
- Bloqueadores: \_\_\_

**Observações:**

---

---

---

---

## BUGS ENCONTRADOS

| ID  | Descrição | Severidade                   | Status                   |
| --- | --------- | ---------------------------- | ------------------------ |
| 1   |           | [ ] Alta [ ] Média [ ] Baixa | [ ] Aberto [ ] Resolvido |
| 2   |           | [ ] Alta [ ] Média [ ] Baixa | [ ] Aberto [ ] Resolvido |
| 3   |           | [ ] Alta [ ] Média [ ] Baixa | [ ] Aberto [ ] Resolvido |

---

**Aprovado para produção:** [ ] SIM [ ] NÃO

**Assinatura:** ******\_\_\_\_****** **Data:** **/**/\_\_\_\_
