# Instruções para Implementação do Backend de Estoque

Para que o módulo de estoque funcione corretamente, é necessário implementar as seguintes APIs no backend:

## 1. API de Produtos

### Listar Produtos
```
GET /api/products
```
Retorna todos os produtos da filial atual.

### Criar Produto
```
POST /api/products
```
Cria um novo produto com os seguintes campos:
- `name`: string (obrigatório)
- `sku`: string (opcional)
- `description`: string (opcional)
- `price`: number (obrigatório)
- `costPrice`: number (obrigatório)
- `quantity`: number (obrigatório)

### Atualizar Produto
```
PATCH /api/products/:id
```
Atualiza um produto existente.

### Excluir Produto
```
DELETE /api/products/:id
```
Remove um produto do sistema.

### Ajustar Estoque
```
POST /api/products/:id/adjust
```
Ajusta o estoque de um produto com os seguintes campos:
- `quantity`: number (obrigatório) - quantidade a ser ajustada
- `type`: string (obrigatório) - "add" para adicionar ou "remove" para remover
- `reason`: string (obrigatório) - motivo do ajuste

## 2. API de Movimentações de Estoque

### Listar Movimentações
```
GET /api/inventory/movements
```
Retorna todas as movimentações de estoque da filial atual, com os seguintes campos:
- `id`: string
- `type`: string ("ADD" ou "REMOVE")
- `quantity`: number
- `reason`: string
- `createdAt`: string (data ISO)
- `product`: objeto com `id` e `name`
- `user`: objeto com `id` e `name`

## Modelo de Dados Sugerido

### Produto
```
{
  id: string
  name: string
  sku?: string
  description?: string
  price: number
  costPrice: number
  quantity: number
  branchId: string
  createdAt: Date
  updatedAt: Date
}
```

### Movimentação de Estoque
```
{
  id: string
  type: "ADD" | "REMOVE"
  quantity: number
  reason: string
  productId: string
  product: Product
  userId: string
  user: User
  branchId: string
  createdAt: Date
  updatedAt: Date
}
```

## Regras de Negócio

1. Não permitir remoção de quantidade maior que o estoque disponível
2. Registrar todas as movimentações de estoque
3. Atualizar a quantidade do produto automaticamente ao registrar uma movimentação
4. Validar que a quantidade em ajustes seja sempre positiva
5. Associar todas as entidades à filial atual