# Implementação de Horários de Funcionamento Configuráveis

## 📋 Resumo

Sistema de horários de funcionamento dinâmicos e configuráveis por dia da semana, substituindo os horários fixos anteriormente codificados no sistema.

## 🎯 Problema Resolvido

**Antes:**

- Horários fixos hardcoded: 08:00 às 19:50 (apenas)
- Horário de almoço fixo: 12:00 às 14:00
- Sem possibilidade de personalização
- Limitava estabelecimentos que trabalham à noite ou madrugada
- Sem controle de dias fechados

**Depois:**

- ✅ Horários configuráveis por dia da semana
- ✅ Horário de almoço opcional e personalizável por dia
- ✅ Controle de dias abertos/fechados
- ✅ Intervalos de 10 minutos gerados automaticamente
- ✅ Integração com horários de trabalho dos profissionais

## 🏗️ Arquitetura Implementada

### Backend (NestJS + Prisma)

#### 1. **Modelo de Dados**

```prisma
model BranchHours {
  id             String   @id @default(uuid())
  branchId       String
  dayOfWeek      Int      // 0=Domingo, 1=Segunda, ..., 6=Sábado
  startTime      String   // Formato HH:mm
  endTime        String   // Formato HH:mm
  isOpen         Boolean  @default(true)
  lunchStartTime String?  // Opcional
  lunchEndTime   String?  // Opcional
  branch         Branch   @relation(...)

  @@unique([branchId, dayOfWeek])
}
```

#### 2. **Controlador: `branch-hours.controller.ts`**

**Endpoints já existentes:**

- `GET /api/branch-hours/:branchId` - Retorna todos os 7 dias
- `POST /api/branch-hours/:branchId` - Cria/atualiza um dia específico
- `PUT /api/branch-hours/:branchId/bulk` - Atualiza múltiplos dias de uma vez
- `DELETE /api/branch-hours/:branchId/:dayOfWeek` - Remove configuração
- `GET /api/branch-hours/:branchId/is-open/:dayOfWeek/:time` - Verifica se está aberto

**Novo endpoint adicionado:**

- `GET /api/branch-hours/:branchId/time-slots/:dayOfWeek` - Retorna array de horários disponíveis

**Exemplo de resposta:**

```json
["08:00", "08:10", "08:20", ..., "19:50"]
```

#### 3. **Serviço: `branch-hours.service.ts`**

**Métodos:**

- `findByBranch(branchId)` - Busca todos os 7 dias (cria defaults se não existir)
- `createOrUpdate(branchId, dto)` - Upsert para dia específico
- `isOpen(branchId, dayOfWeek, time)` - Verifica se está aberto em horário específico
- `getTimeSlots(branchId, dayOfWeek)` - **NOVO** - Gera todos os slots de 10 em 10 minutos

**Lógica de geração de slots:**

```typescript
async getTimeSlots(branchId: string, dayOfWeek: number): Promise<string[]> {
  const branchHours = await this.findOne(branchId, dayOfWeek)

  if (!branchHours || !branchHours.isOpen) {
    return [] // Fechado
  }

  const slots = []
  let current = timeToMinutes(branchHours.startTime)
  const end = timeToMinutes(branchHours.endTime)
  const lunchStart = branchHours.lunchStartTime ? timeToMinutes(branchHours.lunchStartTime) : null
  const lunchEnd = branchHours.lunchEndTime ? timeToMinutes(branchHours.lunchEndTime) : null

  while (current <= end) {
    // Pular horário de almoço
    if (lunchStart && lunchEnd && current >= lunchStart && current < lunchEnd) {
      current = lunchEnd
      continue
    }

    slots.push(minutesToTime(current))
    current += 10 // Intervalos de 10 minutos
  }

  return slots
}
```

#### 4. **Serviço de Agendamentos: `appointments.service.ts`**

**Modificações no método `getAvailableSlots`:**

```typescript
async getAvailableSlots(professionalId: string, date: string) {
  // 1. Buscar profissional para obter branchId
  const professional = await this.prisma.professional.findUnique({
    where: { id: professionalId },
    include: { branch: true }
  })

  const dayOfWeek = new Date(date).getDay()

  // 2. Buscar horários da filial
  const branchHours = await this.prisma.branchHours.findUnique({
    where: {
      branchId_dayOfWeek: {
        branchId: professional.branchId,
        dayOfWeek
      }
    }
  })

  // 3. Se fechado, retornar vazio
  if (!branchHours || !branchHours.isOpen) {
    return []
  }

  // 4. Buscar horário de trabalho do profissional
  const workingDay = await this.prisma.professionalWorkingDay.findUnique({
    where: { professionalId_dayOfWeek: { professionalId, dayOfWeek } }
  })

  // 5. Usar horário mais restritivo
  const effectiveStartTime = getLatestTime(
    branchHours.startTime,
    workingDay?.startTime || '00:00'
  )

  const effectiveEndTime = getEarliestTime(
    branchHours.endTime,
    workingDay?.endTime || '23:59'
  )

  // 6. Gerar slots respeitando almoço
  const slots = this.generateTimeSlots(
    effectiveStartTime,
    effectiveEndTime,
    branchHours.lunchStartTime,
    branchHours.lunchEndTime
  )

  // 7. Filtrar horários já ocupados
  const bookedTimes = await this.getBookedTimes(professionalId, date)
  return slots.filter(time => !bookedTimes.includes(time))
}

private generateTimeSlots(
  startTime: string,
  endTime: string,
  lunchStart?: string | null,
  lunchEnd?: string | null
): string[] {
  const slots: string[] = []
  let current = this.timeToMinutes(startTime)
  const end = this.timeToMinutes(endTime)
  const lunchStartMin = lunchStart ? this.timeToMinutes(lunchStart) : null
  const lunchEndMin = lunchEnd ? this.timeToMinutes(lunchEnd) : null

  while (current < end) {
    // Pular horário de almoço
    if (
      lunchStartMin !== null &&
      lunchEndMin !== null &&
      current >= lunchStartMin &&
      current < lunchEndMin
    ) {
      current = lunchEndMin
      continue
    }

    slots.push(this.minutesToTime(current))
    current += 10
  }

  return slots
}
```

**REMOVIDO:** Almoço fixo de 12:00-14:00 que estava hardcoded

### Frontend (React + TypeScript)

#### 1. **Hook Personalizado: `useBranchTimeSlots.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'

export function useBranchTimeSlots(date?: Date) {
  const { activeBranch } = useBranch()
  const dayOfWeek = date ? date.getDay() : new Date().getDay()

  return useQuery({
    queryKey: ['branch-time-slots', activeBranch?.id, dayOfWeek],
    queryFn: async () => {
      if (!activeBranch?.id) return []

      const response = await axios.get(
        `/api/branch-hours/${activeBranch.id}/time-slots/${dayOfWeek}`
      )
      return response.data as string[]
    },
    enabled: !!activeBranch?.id,
    staleTime: 5 * 60 * 1000, // Cache de 5 minutos
  })
}
```

#### 2. **Integração no Calendário: `Appointments.tsx`**

**Antes:**

```typescript
const timeSlots = [
  '08:00', '08:10', '08:20', ..., '19:50' // 82 slots fixos
]
```

**Depois:**

```typescript
import { useBranchTimeSlots } from '@/hooks/useBranchTimeSlots'

// Dentro do componente
const [selectedDate, setSelectedDate] = useState(() =>
  normalizeDate(DateTime.now().toDate())
)

const { data: timeSlots = [] } = useBranchTimeSlots(selectedDate)
```

**Benefícios:**

- ✅ Slots carregados dinamicamente
- ✅ Atualiza automaticamente ao mudar de data
- ✅ Cache de 5 minutos para performance
- ✅ Fallback para array vazio se falhar

#### 3. **Tela de Configuração: `BranchHoursSettings.tsx`**

**Localização:** `/dashboard/settings` (integrado na página de configurações)

**Recursos:**

- ✅ Grid com 7 dias da semana
- ✅ Toggle Aberto/Fechado por dia
- ✅ Seletor de horário de abertura
- ✅ Seletor de horário de fechamento
- ✅ Seletor opcional de horário de almoço (início e fim)
- ✅ Preview dos horários configurados
- ✅ Salvar todas as alterações de uma vez (bulk update)
- ✅ Mensagens de ajuda e informações
- ✅ Validação visual

**Componentes utilizados:**

- `Switch` - Toggle aberto/fechado
- `Input type="time"` - Seleção de horários
- `Button` - Salvar alterações
- `Label` - Rótulos acessíveis

**API utilizada:**

- `GET /api/branch-hours/:branchId` - Carrega configurações atuais
- `PUT /api/branch-hours/:branchId/bulk` - Salva todas as alterações

**Layout visual:**

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Horários de Funcionamento              [💾 Salvar]       │
├─────────────────────────────────────────────────────────────┤
│ Segunda-feira    [X] Aberto                                 │
│   Funcionamento: 09:00 - 18:00  Almoço: 12:00 - 14:00     │
├─────────────────────────────────────────────────────────────┤
│ Terça-feira      [X] Aberto                                 │
│   Funcionamento: 09:00 - 18:00  Almoço: 12:00 - 14:00     │
├─────────────────────────────────────────────────────────────┤
│ ... (outros dias)                                           │
├─────────────────────────────────────────────────────────────┤
│ ℹ️ Informações Importantes:                                 │
│   • Horários gerados de 10 em 10 minutos                   │
│   • Horário de almoço bloqueia novos agendamentos          │
│   • Dias fechados não permitem agendamentos                │
│   • Alterações afetam imediatamente o calendário           │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Script de Seed

**Arquivo:** `scripts/seed-branch-hours.js`

**Função:** Criar horários padrão para filiais existentes que não possuem configuração

**Horários padrão criados:**

- **Domingo:** Fechado
- **Segunda a Sexta:** 09:00-18:00 (Almoço: 12:00-14:00)
- **Sábado:** 09:00-14:00 (Sem almoço)

**Como executar:**

```bash
# Dentro do container Docker
docker exec salonSyncAPI node scripts/seed-branch-hours.js

# Ou copiar o arquivo primeiro
docker cp scripts/seed-branch-hours.js salonSyncAPI:/pjt-backend/scripts/
docker exec salonSyncAPI node scripts/seed-branch-hours.js
```

**Saída:**

```
🕐 Iniciando seed de horários de funcionamento...
📍 Encontradas 1 filiais

📍 Processando filial: Matriz
   ✅ Horários padrão criados (7 dias)

==================================================
📊 Resumo:
   ✅ Filiais configuradas: 1
   ⏭️  Filiais já configuradas: 0
   📍 Total de filiais: 1
==================================================

✅ Seed concluído com sucesso!
```

**Comportamento:**

- ✅ Cria apenas se não existir configuração
- ✅ Não sobrescreve configurações existentes
- ✅ Processa todas as filiais automaticamente
- ✅ Relatório detalhado ao final

## 🔀 Fluxo de Funcionamento

### 1. **Usuário Acessa o Calendário**

```
Usuário seleciona data
     ↓
useBranchTimeSlots detecta mudança
     ↓
Query busca dayOfWeek da data
     ↓
GET /api/branch-hours/{branchId}/time-slots/{dayOfWeek}
     ↓
BranchHoursService.getTimeSlots()
     ↓
Gera slots de 10 em 10 minutos
     ↓
Retorna array de strings ['08:00', '08:10', ...]
     ↓
Calendar renderiza com slots dinâmicos
```

### 2. **Usuário Agenda Atendimento**

```
Seleciona profissional + data
     ↓
appointments.service.getAvailableSlots()
     ↓
Busca BranchHours + ProfessionalWorkingDay
     ↓
Usa horário mais restritivo (branch vs profissional)
     ↓
Gera slots respeitando almoço
     ↓
Filtra horários já ocupados
     ↓
Retorna apenas slots disponíveis
```

### 3. **Admin Configura Horários**

```
Acessa /dashboard/settings
     ↓
BranchHoursSettings carrega dados
     ↓
GET /api/branch-hours/{branchId}
     ↓
Exibe grid com 7 dias
     ↓
Admin modifica horários
     ↓
Clica em "Salvar Alterações"
     ↓
PUT /api/branch-hours/{branchId}/bulk
     ↓
BranchHoursService salva alterações
     ↓
Invalida cache do React Query
     ↓
Calendário recarrega automaticamente
```

## 🎨 Prioridade de Horários

O sistema utiliza o conceito de **horário mais restritivo**:

```
BranchHours: 08:00 - 20:00
ProfessionalWorkingDay: 09:00 - 18:00
-----------------------------------
Resultado: 09:00 - 18:00 (mais restritivo)
```

**Implementação:**

```typescript
private getLatestTime(time1: string, time2: string): string {
  return this.timeToMinutes(time1) > this.timeToMinutes(time2) ? time1 : time2
}

private getEarliestTime(time1: string, time2: string): string {
  return this.timeToMinutes(time1) < this.timeToMinutes(time2) ? time1 : time2
}
```

## 📊 Casos de Uso

### Caso 1: Barbearia que trabalha até tarde

**Problema:** Sistema hardcoded só ia até 19:50  
**Solução:** Configurar horários até 22:00 ou mais

**Configuração:**

- Segunda a Sexta: 10:00 - 22:00
- Sábado: 09:00 - 20:00
- Domingo: Fechado

### Caso 2: Estabelecimento com almoço variável

**Problema:** Almoço fixo de 12:00-14:00  
**Solução:** Personalizar por dia

**Configuração:**

- Segunda, Terça, Quinta: 12:00 - 13:00 (1h)
- Quarta e Sexta: 12:30 - 14:30 (2h)
- Sábado: Sem almoço (expediente corrido)

### Caso 3: Estabelecimento 24h

**Problema:** Limite de 19:50  
**Solução:** Configurar horários estendidos

**Configuração:**

- Todos os dias: 00:00 - 23:50
- Sem horário de almoço

### Caso 4: Profissional com horário especial

**Problema:** Profissional só trabalha à tarde  
**Solução:** Sistema respeita ProfessionalWorkingDay

**Configuração:**

- Branch: 08:00 - 20:00
- Profissional: 14:00 - 20:00
- **Resultado:** Só mostra slots 14:00 - 20:00 para este profissional

## 🧪 Testes Recomendados

### Backend

1. ✅ Criar horários para nova filial
2. ✅ Atualizar horários existentes
3. ✅ Verificar geração de slots com almoço
4. ✅ Verificar geração de slots sem almoço
5. ✅ Testar dia fechado (retorna [])
6. ✅ Testar prioridade branch vs professional

### Frontend

1. ✅ Carregar calendário com horários dinâmicos
2. ✅ Mudar data e verificar atualização
3. ✅ Configurar horários na página Settings
4. ✅ Salvar e verificar atualização imediata
5. ✅ Testar com dia fechado (não deve mostrar slots)
6. ✅ Validar cache de 5 minutos

## 📝 Estrutura de Arquivos

```
pjt-backend/
├── src/
│   ├── branch-hours/
│   │   ├── branch-hours.controller.ts     ✅ MODIFICADO (novo endpoint)
│   │   ├── branch-hours.service.ts        ✅ MODIFICADO (getTimeSlots)
│   │   └── dto/
│   ├── appointments/
│   │   └── appointments.service.ts        ✅ MODIFICADO (usa BranchHours)
│   └── prisma/
│       └── schema.prisma                  ✅ JÁ EXISTIA (BranchHours)
└── scripts/
    └── seed-branch-hours.js               ✅ NOVO

pjt-frontend/
├── src/
│   ├── hooks/
│   │   └── useBranchTimeSlots.ts          ✅ NOVO
│   ├── components/
│   │   └── pages/
│   │       ├── Appointments.tsx           ✅ MODIFICADO (usa hook)
│   │       ├── BranchHoursSettings.tsx    ✅ NOVO
│   │       └── Settings.tsx               ✅ MODIFICADO (integra settings)
│   └── components/ui/
│       └── switch.tsx                     ✅ JÁ EXISTIA
```

## 🚀 Como Usar

### Para Administradores

1. **Acessar Configurações:**

   - Ir em "Configurações" no menu lateral
   - Rolar até "Horários de Funcionamento"

2. **Configurar Horários:**

   - Para cada dia da semana:
     - Marcar "Aberto" ou "Fechado"
     - Definir horário de abertura
     - Definir horário de fechamento
     - Opcional: Definir horário de almoço

3. **Salvar:**
   - Clicar em "Salvar Alterações"
   - Aguardar confirmação
   - Calendário atualiza automaticamente

### Para Profissionais

**Nenhuma ação necessária!**

- Os horários da filial serão aplicados automaticamente
- Horários pessoais (ProfessionalWorkingDay) ainda são respeitados
- Sistema usa sempre o horário mais restritivo

## ⚠️ Avisos Importantes

1. **Agendamentos Existentes:**

   - Alterar horários NÃO afeta agendamentos já confirmados
   - Apenas novos agendamentos respeitam as novas configurações

2. **Horário de Almoço:**

   - Se configurado, bloqueia automaticamente novos agendamentos
   - Atendimentos em andamento não são interrompidos

3. **Dias Fechados:**

   - Não permite novos agendamentos
   - Agendamentos existentes continuam válidos

4. **Cache:**
   - Frontend cacheia slots por 5 minutos
   - Para forçar atualização, recarregar a página
   - Em produção, considerar reduzir para 1 minuto

## 🔄 Migrações Futuras

### Recursos Adicionais Possíveis

1. **Horários Especiais:**

   - Feriados
   - Eventos especiais
   - Bloqueios temporários

2. **Cópia de Configurações:**

   - Copiar horários de um dia para outro
   - Template de semana padrão

3. **Notificações:**

   - Avisar profissionais sobre mudanças
   - Email para clientes afetados

4. **Relatórios:**
   - Horários mais ocupados
   - Sugestões de otimização
   - Análise de capacidade

## 📚 Referências Técnicas

- **Prisma:** https://www.prisma.io/docs
- **TanStack Query:** https://tanstack.com/query
- **React Hook Form:** https://react-hook-form.com
- **Shadcn/ui:** https://ui.shadcn.com

## ✅ Checklist de Implementação

- [x] Criar modelo BranchHours (já existia)
- [x] Implementar endpoints de CRUD
- [x] Adicionar endpoint de time-slots
- [x] Modificar appointments.service.ts
- [x] Remover horários hardcoded do backend
- [x] Criar hook useBranchTimeSlots
- [x] Modificar Appointments.tsx
- [x] Criar componente BranchHoursSettings
- [x] Integrar na página Settings
- [x] Criar script de seed
- [x] Executar seed para filiais existentes
- [x] Testar fluxo completo
- [x] Documentar implementação

## 🎉 Resultado Final

Sistema totalmente funcional e configurável de horários de funcionamento, permitindo:

✅ Personalização completa por dia da semana  
✅ Horário de almoço opcional e configurável  
✅ Dias fechados  
✅ Integração com horários dos profissionais  
✅ Interface amigável para configuração  
✅ Atualização em tempo real no calendário  
✅ Escalabilidade para múltiplas filiais

**Implementado em:** 13 de janeiro de 2025  
**Status:** ✅ Completo e funcional  
**Versão:** 1.0.0
