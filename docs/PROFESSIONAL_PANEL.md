# Painel do Profissional - Meu Painel

## Visão Geral

Nova tela exclusiva para profissionais visualizarem suas comissões e receitas geradas em diferentes períodos de tempo, permitindo análise completa do desempenho financeiro sem limitação de tempo.

## Localização

**Rota:** `/dashboard/my-panel`  
**Menu:** Gestão → Meu Painel  
**Permissão:** Apenas usuários com role `PROFESSIONAL`

## Funcionalidades

### 1. Filtros de Período

Múltiplas opções de visualização temporal:

- **7 dias**: Últimos 7 dias
- **Mês**: Mês atual (primeiro dia até hoje)
- **3 meses**: Últimos 90 dias
- **Ano**: Ano atual (01/01 até hoje)
- **Tudo**: Todo o histórico disponível (desde 2020)
- **Custom**: Período personalizado com seleção de datas inicial e final

### 2. Cards de Resumo

Quatro cards principais com métricas do período:

#### Minha Comissão Total

- Valor total de comissões acumuladas
- Número de atendimentos realizados no período
- Cor: Verde (DollarSign icon)

#### Receita Gerada

- Valor total de receita gerada pelos atendimentos
- Exibe taxas de comissão: "X% serviços • Y% produtos"
- Cor: Azul (TrendingUp icon)

#### Comissão Serviços

- Valor de comissão apenas dos serviços
- Percentual da taxa de comissão de serviços
- Cor: Roxo (BarChart3 icon)

#### Comissão Produtos

- Valor de comissão apenas de produtos vendidos
- Quantidade de vendas de produtos realizadas
- Cor: Laranja (Package icon)

### 3. Tabela de Comissões Diárias

Tabela detalhada com breakdown por dia:

**Colunas:**

- Data (formato: DD MMM)
- Atendimentos (quantidade)
- Receita (R$)
- Comissão (R$)

**Footer:** Linha de totais com valores agregados do período

### 4. Gráfico de Barras

Visualização gráfica das comissões diárias:

- Barras horizontais proporcionais ao maior valor
- Cor: Primary (tema do sistema)
- Label com data e valor da comissão
- Animação suave nas transições

### 5. Informações Adicionais

#### Suas Taxas de Comissão

- **Serviços:** Percentual de comissão sobre serviços
- **Produtos:** Percentual de comissão sobre produtos vendidos

#### Performance

- **Ticket Médio:** Receita total ÷ número de atendimentos
- **Taxa de Venda de Produtos:** (Vendas com produtos ÷ Total de atendimentos) × 100%

Com barras de progresso visuais para cada métrica.

## Estrutura de Dados

### API Endpoint

```
GET /api/professionals/{professionalId}/commission?startDate={date}&endDate={date}
```

### Resposta Esperada

```typescript
{
  summary: {
    totalCommission: number          // Comissão total
    totalRevenue: number              // Receita total
    totalAppointments: number         // Total de atendimentos
    appointmentCommissions: number    // Comissão de serviços
    productCommissions: number        // Comissão de produtos
    productSalesCount: number         // Quantidade de vendas com produtos
  },
  dailyCommissions: [
    {
      date: string                    // YYYY-MM-DD
      appointments: number            // Atendimentos do dia
      revenue: number                 // Receita do dia
      commission: number              // Comissão do dia
    }
  ]
}
```

### Dados do Profissional

```typescript
{
  id: string
  name: string
  commissionRate: number // Taxa de serviços (ex: 10)
  productCommissionRate: number // Taxa de produtos (ex: 5)
  branchId: string
}
```

## Layout e Responsividade

### Desktop (md+)

- Grid 4 colunas para cards de resumo
- Tabela completa com todas as colunas visíveis
- Filtros em linha horizontal
- Espaçamento generoso (p-8)

### Mobile

- Grid 1 coluna para cards
- Tabela com scroll horizontal
- Filtros em grid 3 colunas
- Espaçamento compacto (p-4)
- Textos adaptáveis (text-xs/text-sm)

## Cálculo de Comissões

### Fórmula

```typescript
comissaoServiços = valorTotalServiços × (commissionRate / 100)
comissaoProdutos = valorTotalProdutos × (productCommissionRate / 100)
comissaoTotal = comissaoServiços + comissaoProdutos
```

### Exemplo

**Atendimento:** R$ 170,00

- Serviços: R$ 50,00 (taxa 10%)
- Produtos: R$ 120,00 (taxa 5%)

**Cálculo:**

- Comissão Serviços: R$ 50 × 10% = R$ 5,00
- Comissão Produtos: R$ 120 × 5% = R$ 6,00
- **Comissão Total: R$ 11,00**

## Estados da Interface

### Loading

- Cards com animação pulse
- Placeholder cinza para conteúdo

### Sem Dados

- Ícone BarChart3 opaco centralizado
- Mensagem: "Nenhum atendimento realizado no período selecionado"

### Não é Profissional

- Card centralizado
- Mensagem: "Você não está cadastrado como profissional nesta filial."

## Funcionalidades Futuras

### Exportação (botão presente, não implementado)

- Exportar dados para Excel/CSV
- Relatório PDF com gráficos
- Envio por email

### Comparações

- Comparar períodos (mês atual vs mês anterior)
- Meta de comissões
- Ranking entre profissionais

### Análises Avançadas

- Serviços mais lucrativos
- Produtos mais vendidos
- Horários de pico
- Taxa de conversão de produtos

## Diferenças do Dashboard Padrão

| Aspecto      | Dashboard Padrão    | Meu Painel          |
| ------------ | ------------------- | ------------------- |
| Período      | Fixo (30 dias)      | Customizável        |
| Dados        | Todos profissionais | Apenas próprio      |
| Permissão    | ADMIN               | PROFESSIONAL        |
| Detalhamento | Resumo geral        | Breakdown diário    |
| Filtros      | Nenhum              | 6 opções de período |
| Histórico    | Limitado a 1 mês    | Ilimitado           |

## Integração com Sistema

### Contextos Utilizados

- `useUser()`: Identifica o profissional logado
- `useBranch()`: Filtra dados pela filial ativa

### React Query

- Query key: `['professional-commission', professionalId, startDate, endDate, branchId]`
- Stale time: 0 (sempre revalida)
- Habilitado apenas se: profissional identificado e filial ativa

### Roteamento

- Protegido por `RoleGuard` (apenas PROFESSIONAL)
- Protegido por `SubscriptionGuard` (assinatura ativa)
- Dentro do `DashboardLayout`

## Tecnologias

- **React 18** com TypeScript
- **TanStack Query v5** para gerenciamento de estado
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **shadcn/ui** componentes base
- **dayjs** para manipulação de datas (via DateTime wrapper)

## Manutenção

### Adicionar Nova Métrica

1. Adicionar campo no backend (response)
2. Criar novo StatsCard no grid
3. Adicionar cálculo no backend (professionals.service.ts)

### Modificar Período Padrão

Alterar linha 14 do componente:

```typescript
const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month')
```

### Ajustar Cores dos Cards

Modificar prop `iconColor` nos StatsCard:

- green, blue, purple, orange, red, yellow

## Testes Recomendados

1. **Filtros de Período:**

   - Testar cada tipo de período
   - Validar período custom com datas inválidas
   - Verificar cálculo de datas correto

2. **Dados:**

   - Profissional com atendimentos
   - Profissional sem atendimentos
   - Usuário não cadastrado como profissional

3. **Responsividade:**

   - Mobile (< 768px)
   - Tablet (768px - 1024px)
   - Desktop (> 1024px)

4. **Performance:**
   - Período longo (1+ ano)
   - Muitos atendimentos por dia (50+)
   - Scroll na tabela

## Observações

- O sistema usa timezone `America/Sao_Paulo` via wrapper DateTime
- Todos os valores monetários em Real (BRL)
- Datas exibidas no formato brasileiro (DD/MM/YYYY ou DD MMM)
- Cache desabilitado (staleTime: 0) para dados sempre atualizados
- Profissional identificado por nome (case-insensitive match)
