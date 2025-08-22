# Padrões de Integração - Estoque e Financeiro

## Visão Geral
Este documento define os padrões de integração entre os componentes de Estoque e Financeiro, garantindo que todas as movimentações que impactam financeiramente sejam registradas automaticamente no sistema financeiro.

## Princípios Fundamentais

### 1. Classificação Automática
Todas as operações de estoque que possuem impacto financeiro devem gerar automaticamente transações financeiras na categoria apropriada:

- **Criação de Produto com Estoque Inicial** → `INVESTMENT` - "Compra de Produtos"
- **Entrada de Estoque (IN)** → `INVESTMENT` - "Compra de Produtos"  
- **Saída de Estoque (OUT)** → `INCOME` - "Venda de Produtos"
- **Perda de Estoque (LOSS)** → `EXPENSE` - "Perdas de Estoque"
- **Ajuste de Estoque (ADJUSTMENT)** → Não gera transação financeira

### 2. Categorias Padrão
O sistema cria automaticamente as seguintes categorias quando necessário:

#### Investimentos (INVESTMENT)
- **Compra de Produtos** - `#F59E0B` (Laranja)
- **Equipamentos** - `#3B82F6` (Azul)

#### Receitas (INCOME)  
- **Venda de Produtos** - `#10B981` (Verde)
- **Serviços** - `#10B981` (Verde)

#### Despesas (EXPENSE)
- **Perdas de Estoque** - `#DC2626` (Vermelho)

### 3. Referências de Rastreamento
Todas as transações financeiras geradas automaticamente incluem referências para rastreabilidade:

- **Criação de Produto**: `Produto-{productId}`
- **Movimentação de Estoque**: `Estoque-{movementId}`

## Implementação Técnica

### Backend - ProductsService

#### Criação de Produto
```typescript
// Ao criar produto com estoque inicial e custo
if (initialStock > 0 && costPrice > 0) {
  await this.createFinancialTransactionForProductCreation(
    createdProduct,
    initialStock,
    costPrice,
    branchId,
    tx,
  );
}
```

#### Movimentações de Estoque
```typescript
// Após criar movimentação de estoque
await this.createFinancialTransactionForMovement(
  movement,
  updatedProduct,
  branchId,
  tx,
);
```

### Frontend - Indicadores Visuais

#### FinancialTabContent
- Cards específicos para movimentações de estoque
- Badges identificando transações relacionadas ao estoque
- Dicas contextuais sobre geração automática

#### Componentes de Estoque
- Avisos sobre impacto financeiro das operações
- Links para visualização no componente financeiro

## Fluxos de Integração

### 1. Cadastro de Novo Produto
```
ProductForm → ProductsService.create() → 
  ├─ Criar produto no banco
  └─ Se (estoque inicial > 0 && custo > 0):
      └─ Criar transação INVESTMENT "Compra de Produtos"
```

### 2. Movimentação de Estoque
```
StockMovementForm → ProductsService.adjustStock() →
  ├─ Atualizar estoque do produto
  ├─ Criar registro de movimentação
  └─ Se (totalCost > 0):
      └─ Criar transação financeira baseada no tipo:
          ├─ IN → INVESTMENT "Compra de Produtos"
          ├─ OUT → INCOME "Venda de Produtos"  
          └─ LOSS → EXPENSE "Perdas de Estoque"
```

### 3. Visualização Financeira
```
FinancialTabContent → FinancialService.getSummary() →
  ├─ Buscar transações manuais
  ├─ Buscar receitas de atendimentos
  ├─ Buscar movimentações de estoque com valor
  └─ Consolidar totais por tipo
```

## Validações e Regras

### 1. Criação de Transação Financeira
- Só criar se `totalCost > 0`
- Categoria criada automaticamente se não existir
- Data da transação = data da movimentação
- Referência sempre preenchida para rastreamento

### 2. Exclusão e Edição
- Ao excluir movimentação: excluir transação financeira relacionada
- Ao editar movimentação: recalcular impacto financeiro
- Ajustes de estoque não podem ser excluídos (regra de negócio)

### 3. Consistência de Dados
- Transações em transação de banco de dados
- Rollback automático em caso de erro
- Logs detalhados para auditoria

## Benefícios do Padrão

1. **Automatização**: Reduz erro humano e trabalho manual
2. **Consistência**: Todas as operações seguem o mesmo padrão
3. **Rastreabilidade**: Fácil identificação da origem das transações
4. **Transparência**: Usuário vê impacto financeiro em tempo real
5. **Auditoria**: Histórico completo de todas as operações

## Próximos Passos

1. ✅ Implementar criação automática de transação na criação de produtos
2. ✅ Melhorar visualização no componente financeiro
3. 🔄 Implementar notificações sobre impacto financeiro
4. 🔄 Criar relatórios de reconciliação estoque x financeiro
5. 🔄 Implementar alertas para movimentações sem custo definido

## Manutenção

Este padrão deve ser seguido por todos os novos desenvolvimentos que envolvam:
- Criação/edição de produtos
- Movimentações de estoque
- Relatórios financeiros
- Integrações com sistemas externos

Qualquer alteração neste padrão deve ser documentada e comunicada à equipe.