# Integração Estoque-Financeiro

## Visão Geral

O sistema agora possui integração automática entre movimentações de estoque e transações financeiras, garantindo que perdas, compras e vendas sejam automaticamente refletidas nos relatórios financeiros.

## Fluxo de Integração

### 1. Movimentações que Geram Transações Automáticas

| Tipo de Movimentação | Tipo Financeiro | Categoria Criada | Descrição |
|---------------------|-----------------|------------------|-----------|
| **LOSS** (Perda) | EXPENSE | "Perdas de Estoque" | Contabiliza perdas como despesas |
| **IN** (Entrada/Compra) | EXPENSE | "Produtos/Insumos" | Registra compras de produtos |
| **OUT** (Saída/Venda) | INCOME | "Produtos" | Registra vendas de produtos |
| **ADJUSTMENT** | - | - | Não gera transação (apenas ajuste) |

### 2. Categorias Automáticas

O sistema cria automaticamente as seguintes categorias quando necessário:

#### Perdas de Estoque
- **Cor**: #DC2626 (Vermelho)
- **Tipo**: EXPENSE
- **Uso**: Perdas de produtos por vencimento, quebra, etc.

#### Produtos/Insumos  
- **Cor**: #F59E0B (Laranja)
- **Tipo**: EXPENSE
- **Uso**: Compras de produtos para revenda

#### Produtos
- **Cor**: #3B82F6 (Azul)
- **Tipo**: INCOME
- **Uso**: Vendas de produtos

### 3. Rastreabilidade

- Cada transação financeira automática possui referência `Estoque-{movementId}`
- Relação bidirecional entre `StockMovement` e `FinancialTransaction`
- Campo `stockMovementId` único na tabela de transações financeiras

## Exemplo Prático

### Cenário: Perda de Produto

1. **Movimentação de Estoque**:
   - Produto: Shampoo Profissional
   - Tipo: LOSS
   - Quantidade: 2 unidades
   - Custo Unitário: R$ 25,00
   - Custo Total: R$ 50,00
   - Motivo: "Produto vencido"

2. **Transação Financeira Automática**:
   - Descrição: "Perda de estoque: Shampoo Profissional (2 un)"
   - Valor: R$ 50,00
   - Tipo: EXPENSE
   - Categoria: "Perdas de Estoque"
   - Referência: "Estoque-{id-da-movimentacao}"

### Cenário: Compra de Produto

1. **Movimentação de Estoque**:
   - Produto: Condicionador
   - Tipo: IN
   - Quantidade: 10 unidades
   - Custo Unitário: R$ 15,00
   - Custo Total: R$ 150,00
   - Motivo: "Reposição de estoque"

2. **Transação Financeira Automática**:
   - Descrição: "Compra de estoque: Condicionador (10 un)"
   - Valor: R$ 150,00
   - Tipo: EXPENSE
   - Categoria: "Produtos/Insumos"

## Impacto nos Relatórios

### Dashboard Financeiro
- Perdas aparecem automaticamente como despesas
- Compras são contabilizadas nos gastos
- Vendas são incluídas na receita

### Relatórios Detalhados
- Transações automáticas são identificadas com badge "Estoque"
- Detalhes da movimentação (quantidade, unidade, motivo) são exibidos
- Rastreabilidade completa entre estoque e financeiro

## Benefícios

1. **Automação**: Elimina entrada manual de transações de estoque
2. **Precisão**: Garante que todas as movimentações financeiras sejam registradas
3. **Rastreabilidade**: Conexão direta entre movimentação física e impacto financeiro
4. **Relatórios Completos**: Visão integrada de custos e receitas
5. **Controle de Perdas**: Monitoramento automático de perdas como despesas

## Configuração

### Banco de Dados
```bash
# Aplicar migração
npx prisma migrate dev --name add-stock-financial-integration

# Gerar cliente
npx prisma generate
```

### Categorias Padrão
As categorias são criadas automaticamente na primeira movimentação de cada tipo. Não é necessária configuração manual.

## Considerações Técnicas

- Transações são criadas apenas para movimentações com `totalCost > 0`
- Relação one-to-one entre movimentação e transação
- Transações automáticas usam `paymentMethod: 'OTHER'`
- Data da transação = data da movimentação de estoque